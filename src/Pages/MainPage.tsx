import React, { useState, useRef, useEffect } from 'react'
import '../PageStyles/MainPageCSS.css'
import TableComponent from '../Components/TableComponent'
import supabase from '../helper/supabaseClient'
import Navbar from '../Components/Navbar'

interface Row {
  recipient: string
  linkedin: string
  links: string
}

const initialRows: Row[] = []

function MainPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([])
  const [contextInput, setContextInput] = useState('')
  const [newLinkedin, setNewLinkedin] = useState('')
  const [exampleScript, setExampleScript] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<{ [idx: number]: string }>({})
  const [generatingRows, setGeneratingRows] = useState<number[]>([])
  const [showLeadListsPopup, setShowLeadListsPopup] = useState(false)
  const [leadLists, setLeadLists] = useState<any[]>([])
  const [leadListsLoading, setLeadListsLoading] = useState(false)
  const [selectedLeadList, setSelectedLeadList] = useState<any | null>(null)

  const recipientRef = useRef<HTMLTextAreaElement>(null)
  const linksRef = useRef<HTMLTextAreaElement>(null)
  const linkedinRef = useRef<HTMLTextAreaElement>(null)


  useEffect(() => {
    const savedContext = localStorage.getItem('contextInput')
    if (savedContext) setContextInput(savedContext)
    const savedScript = localStorage.getItem('exampleScript')
    if (savedScript) setExampleScript(savedScript)
    const savedLeadList = localStorage.getItem('selectedLeadList')
    if (savedLeadList) setSelectedLeadList(JSON.parse(savedLeadList))
  }, [])
  
  useEffect(() => {
    localStorage.setItem('contextInput', contextInput)
  }, [contextInput])
  
  useEffect(() => {
    localStorage.setItem('exampleScript', exampleScript)
  }, [exampleScript])
  
  useEffect(() => {
    if (selectedLeadList)
      localStorage.setItem('selectedLeadList', JSON.stringify(selectedLeadList))
    else
      localStorage.removeItem('selectedLeadList')
  }, [selectedLeadList])

  // Fetch lead lists for popup
  useEffect(() => {
    if (showLeadListsPopup) {
      setLeadListsLoading(true)
      supabase
        .from('Lead Lists')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          setLeadListsLoading(false)
          if (!error && data) setLeadLists(data)
        })
    }
  }, [showLeadListsPopup])

  // Fetch leads for selected lead list
  useEffect(() => {
    if (!selectedLeadList) {
      setRows([])
      return
    }
    setLoading(true)
    supabase
      .from('Leads')
      .select('Recipient_Mail, Links_And_Sources, Linkedin')
      .eq('parent_lead_list', selectedLeadList.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoading(false)
        if (!error && data) {
          setRows(
            data.map((row: any) => ({
              recipient: row.Recipient_Mail || '',
              linkedin: row.Linkedin || '',
              links: row.Links_And_Sources || '',
            }))
          )
        }
      })
  }, [selectedLeadList])

  useEffect(() => {
    if (recipientRef.current) {
      recipientRef.current.style.height = 'auto'
      recipientRef.current.style.height = recipientRef.current.scrollHeight + 'px'
    }
  }, [newRecipient])

  useEffect(() => {
    if (linksRef.current) {
      linksRef.current.style.height = 'auto'
      linksRef.current.style.height = linksRef.current.scrollHeight + 'px'
    }
  }, [newLinks])

  useEffect(() => {
    setSelectedRows(selectedRows => 
      rows.map((_, i) => selectedRows[i] || false)
    )
  }, [rows])

  const handleAddRow = async () => {
    if (!newRecipient.trim() && !newLinks.trim() && !newLinkedin.trim()) return
    if (!selectedLeadList) return
    setLoading(true)
    const { error } = await supabase
      .from('Leads')
      .insert([
        {
          parent_lead_list: selectedLeadList.id,
          Recipient_Mail: newRecipient,
          Links_And_Sources: newLinks,
          Linkedin: newLinkedin,
        },
      ])
    setLoading(false)
    if (!error) {
      setRows([...rows, { recipient: newRecipient, linkedin: newLinkedin, links: newLinks }])
      setNewRecipient('')
      setNewLinkedin('')
      setNewLinks('')
    } else {
      alert('Error saving to database: ' + error.message)
      console.log(error)
    }
  }

  const handleToggleRow = (idx: number) => {
    setSelectedRows(prev => {
      const updated = [...prev]
      updated[idx] = !updated[idx]
      return updated
    })
  }

  const allChecked = rows.length > 0 && selectedRows.every(Boolean)
  const handleToggleAllRows = (checked: boolean) => {
    setSelectedRows(rows.map(() => checked))
  }

  const handleGenerateAndSend = async () => {
    const checkedRows = rows.filter((_, idx) => selectedRows[idx])
    const checkedIndexes = rows.map((_, idx) => idx).filter(idx => selectedRows[idx])
    setGeneratingRows(checkedIndexes)
    setSendLoading(true)
    setGeneratedEmails({})

    const formattedRows = checkedRows.map(row => ({
      name: row.recipient,
      linkedin: row.linkedin,
      website: row.links,
    }))

    const payload = {
      context: contextInput,
      exampleScript: exampleScript,
      recipients: formattedRows,
    }

    try {
      const response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        if (!reader) break
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const data = JSON.parse(part.replace('data: ', ''))
            const idx = checkedRows.findIndex(r =>
              r.recipient === data.recipient.name &&
              r.linkedin === data.recipient.linkedin &&
              r.links === data.recipient.website
            )
            if (idx !== -1) {
              setGeneratedEmails(prev => ({
                ...prev,
                [checkedIndexes[idx]]: data.openai
              }))
            }
          }
          if (part.startsWith('event: end')) {
            setSendLoading(false)
            setGeneratingRows([])
          }
        }
      }
    } catch (err) {
      alert('Failed to send request' + (err instanceof Error ? `: ${err.message}` : ''))
      setSendLoading(false)
      setGeneratingRows([])
    }
  }

  return (
    <div className="container">
      <Navbar />

      {/* Load a Lead List Button */}
      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <button
          style={{
            background: 'var(--table-header-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--table-border)',
            borderRadius: 8,
            padding: '10px 28px',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s, border 0.2s'
          }}
          onClick={() => setShowLeadListsPopup(true)}
        >
          Load a Lead List
        </button>
      </div>

      {/* Popup for Lead Lists */}
      {showLeadListsPopup && (
        <div className="popup-overlay" onClick={() => setShowLeadListsPopup(false)}>
          <div
            className="popup-box"
            style={{ minWidth: 400, maxWidth: 700, minHeight: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <span
              className="popup-close"
              onClick={() => setShowLeadListsPopup(false)}
            >
              &times;
            </span>
            <h2 style={{ marginBottom: 24 }}>Select a Lead List</h2>
            {leadListsLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="leadlists-grid">
                {leadLists.map(list => (
                  <div
                    className="leadlist-card"
                    key={list.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedLeadList(list)
                      setShowLeadListsPopup(false)
                    }}
                  >
                    <div className="leadlist-card-title">{list.lead_list_name}</div>
                    <div className="leadlist-card-desc">{list.description}</div>
                    <div className="leadlist-card-date">
                      {list.created_at && new Date(list.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

<h1 style={{ marginTop: 50 }}>Enter Context:</h1>
      <div className="requestContextInput">
        <textarea
          className="growing-textarea"
          style={{
            minHeight: '80px', // Increased from 40px to 80px
            maxHeight: '400px',
            overflow: 'auto',
            borderRadius: '12px',
            resize: 'none',
            padding: '10px',
            width: '100%',
            boxSizing: 'border-box',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          rows={3} // Increased from 1 to 3 for initial height
          placeholder="Enter your context here..."
          value={contextInput}
          onChange={e => setContextInput(e.target.value)}
          onInput={e => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 400) + 'px'
          }}
        />
      </div>

      <h1 style={{ marginTop: 50 }}>Enter Example Script:</h1>
      <div className="requestContextInput">
        <textarea
          className="growing-textarea"
          style={{
            minHeight: '100px',
            maxHeight: '400px',
            overflow: 'auto',
            borderRadius: '12px',
            resize: 'none',
            padding: '10px',
            width: '100%',
            boxSizing: 'border-box',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          rows={1}
          placeholder="Enter your example script here..."
          value={exampleScript}
          onChange={e => setExampleScript(e.target.value)}
          onInput={e => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 400) + 'px'
          }}
        />
      </div>

      <div className="generateAndSendButton">
        <button
          className="supabase-btn"
          onClick={handleGenerateAndSend}
          disabled={rows.length === 0 || sendLoading}
        >
          {sendLoading ? "Generating..." : "Generate & Send"}
        </button>
      </div>

      <div className="mainpage-table-wrapper">
        {selectedLeadList && (
          <TableComponent
            rows={rows}
            newRecipient={newRecipient}
            newLinkedin={newLinkedin}
            newLinks={newLinks}
            recipientRef={recipientRef}
            linkedinRef={linkedinRef}
            linksRef={linksRef}
            setNewRecipient={setNewRecipient}
            setNewLinkedin={setNewLinkedin}
            setNewLinks={setNewLinks}
            handleAddRow={handleAddRow}
            loading={loading}
            selectedRows={selectedRows}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            allChecked={allChecked}
            generatedEmails={generatedEmails}
            generatingRows={generatingRows}
          />
        )}
      </div>
    </div>
  )
}

export default MainPage