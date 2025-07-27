import React, { useState, useRef, useEffect } from 'react'
import '../PageStyles/MainPageCSS.css'
import TableComponent from '../Components/TableComponent'
import supabase from '../helper/supabaseClient'
import Navbar from '../Components/Navbar'
import { IoCopy } from "react-icons/io5";
import { BsArrowRepeat } from "react-icons/bs";

interface Row {
  recipient: string
  linkedin: string
  links: string
}

function MainPage() {
  // Lead list and email selection
  const [leadLists, setLeadLists] = useState<any[]>([])
  const [leadListsLoading, setLeadListsLoading] = useState(false)
  const [showLeadListsPopup, setShowLeadListsPopup] = useState(false)
  const [selectedLeadList, setSelectedLeadList] = useState<any | null>(null)

  const [emails, setEmails] = useState<any[]>([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [showEmailsPopup, setShowEmailsPopup] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null)

  // Table and script/context state
  const [rows, setRows] = useState<Row[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [newLinkedin, setNewLinkedin] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([])
  const [contextInput, setContextInput] = useState('')
  const [exampleScript, setExampleScript] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<{ [idx: number]: string }>({})
  const [generatingRows, setGeneratingRows] = useState<number[]>([])

  const [showContextOptions, setShowContextOptions] = useState(false)
  const [showContextHelp, setShowContextHelp] = useState(false)
  const [contextOptions, setContextOptions] = useState<string[]>([]);

  const [offeringInput, setOfferingInput] = useState('');
  const offeringRef = useRef<HTMLTextAreaElement>(null);

  const [offeringOptions, setOfferingOptions] = useState<string[]>([]);
  const [showOfferingOptions, setShowOfferingOptions] = useState(false);
  const [showOfferingHelp, setShowOfferingHelp] = useState(false);

  const recipientRef = useRef<HTMLTextAreaElement>(null)
  const linksRef = useRef<HTMLTextAreaElement>(null)
  const linkedinRef = useRef<HTMLTextAreaElement>(null)
  const contextRef = useRef<HTMLTextAreaElement>(null)
  const scriptRef = useRef<HTMLTextAreaElement>(null)



 

  // Fix textarea height on load/restore for offering




  // Restore from localStorage
  useEffect(() => {
    const savedContext = localStorage.getItem('contextInput')
    if (savedContext) setContextInput(savedContext)
    const savedScript = localStorage.getItem('exampleScript')
    if (savedScript) setExampleScript(savedScript)
    const savedLeadList = localStorage.getItem('selectedLeadList')
    if (savedLeadList) setSelectedLeadList(JSON.parse(savedLeadList))
    const savedEmail = localStorage.getItem('selectedEmail')
    if (savedEmail) setSelectedEmail(JSON.parse(savedEmail))
    const savedOffering = localStorage.getItem('offeringInput');
    if (savedOffering) setOfferingInput(savedOffering);
  }, [])

  useEffect(() => {
    localStorage.setItem('contextInput', contextInput)
  }, [contextInput])

  useEffect(() => {
    localStorage.setItem('exampleScript', exampleScript)
  }, [exampleScript])

  useEffect(() => {
    localStorage.setItem('offeringInput', offeringInput);
  }, [offeringInput]);

  useEffect(() => {
    if (selectedLeadList)
      localStorage.setItem('selectedLeadList', JSON.stringify(selectedLeadList))
    else
      localStorage.removeItem('selectedLeadList')
  }, [selectedLeadList])

  useEffect(() => {
    if (selectedEmail)
      localStorage.setItem('selectedEmail', JSON.stringify(selectedEmail))
    else
      localStorage.removeItem('selectedEmail')
  }, [selectedEmail])

  // Fix textarea height on load/restore
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.style.height = 'auto'
      contextRef.current.style.height = Math.min(contextRef.current.scrollHeight, 400) + 'px'
    }
  }, [contextInput])

  useEffect(() => {
    if (scriptRef.current) {
      scriptRef.current.style.height = 'auto'
      scriptRef.current.style.height = Math.min(scriptRef.current.scrollHeight, 400) + 'px'
    }
  }, [exampleScript])

  useEffect(() => {
    if (offeringRef.current) {
      offeringRef.current.style.height = 'auto';
      offeringRef.current.style.height = Math.min(offeringRef.current.scrollHeight, 400) + 'px';
    }
  }, [offeringInput]);

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

  // Fetch emails for popup
  useEffect(() => {
    if (showEmailsPopup) {
      setEmailsLoading(true)
      supabase.auth.getUser().then(({ data }) => {
        if (!data?.user?.id) {
          setEmails([])
          setEmailsLoading(false)
          return
        }
        supabase
          .from('nylas_tokens')
          .select('id, email, provider, grant_id')
          .eq('user_id', data.user.id)
          .then(({ data, error }) => {
            setEmailsLoading(false)
            if (!error && data) setEmails(data)
          })
      })
    }
  }, [showEmailsPopup])

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
      offering: offeringInput, // <-- Add this line
      recipients: formattedRows,
      fromEmail: selectedEmail?.email,
      grantId: selectedEmail?.grant_id
    }
  
    try {
      const response = await fetch('http://localhost:4000/generate', {
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

  // ONLY THIS FUNCTION IS CHANGED TO IMPLEMENT THE SOLUTION
  const handleProcessContext = async () => {
    try {
      const response = await fetch('http://localhost:4000/refine-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contextInput }),
      });
      const data = await response.json();
      if (Array.isArray(data.refined) && data.refined.length > 0) {
        setContextOptions(data.refined);
      } else if (typeof data.refined === 'string' && data.refined.trim() !== '') {
        setContextOptions([data.refined]);
      } else {
        setContextOptions([]);
      }
      setShowContextOptions(true);
    } catch (err) {
      setContextOptions([]);
      setShowContextOptions(true);
      console.error('Error refining context:', err);
    }
  };

  const handleProcessOffering = async () => {
    try {
      const response = await fetch('http://localhost:4000/refine-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: offeringInput }),
      });
      const data = await response.json();
      if (Array.isArray(data.refined) && data.refined.length > 0) {
        setOfferingOptions(data.refined);
      } else if (typeof data.refined === 'string' && data.refined.trim() !== '') {
        setOfferingOptions([data.refined]);
      } else {
        setOfferingOptions([]);
      }
      setShowOfferingOptions(true);
    } catch (err) {
      setOfferingOptions([]);
      setShowOfferingOptions(true);
      console.error('Error refining offering:', err);
    }
  };

  return (
    <div className="container">
      <Navbar />

      {/* Section for context, script, and choose email */}
      <div
        style={{
          background: 'var(--table-header-bg, #f8fafc)',
          border: '1px solid var(--table-border, #e9e9e9)',
          borderRadius: 16,
          padding: 32,
          marginTop: 40,
          marginBottom: 40,
          width: '100%',
          maxWidth: '100%',
          marginLeft: 0,
          marginRight: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Context & Script</h1>
          <button
            className="add-emails-btn"
            onClick={() => setShowEmailsPopup(true)}
          >
            Choose Email
          </button>
        </div>
        {selectedEmail && (
          <div style={{ margin: '16px 0 0 0', fontWeight: 500, color: '#3da175' }}>
            Sending from: {selectedEmail.email}
          </div>
        )}


<div style={{ fontWeight: 600, fontSize: 18, marginTop: 40 }}>Enter Offering:</div>
        <textarea
          ref={offeringRef}
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
            marginTop: 8,
          }}
          rows={4}
          placeholder="Enter your offering here..."
          value={offeringInput}
          onChange={e => setOfferingInput(e.target.value)}
          onInput={e => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 400) + 'px'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div className="buttonContainer" style={{ width: '100%', display: 'flex', flexDirection: "row", alignItems: 'center', justifyContent: "center", gap: 30 }}>
            <button
              className="add-context-btn"
              type="button"
              onClick={handleProcessOffering}
            >
              შეთავაზების გადამუშავება
              <BsArrowRepeat size={25} />
            </button>
            <button
              type="button"
              className="add-context-btn"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: '50%',
                fontSize: 18,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="What does this do?"
              onClick={() => setShowOfferingHelp(prev => !prev)}
            >
              ?
            </button>
          </div>
        </div>

        {showOfferingHelp && (
          <div style={{ color: '#aaa', fontSize: 15, textAlign: "center" }}>
            ამ ღილაკის მეშვეობით თქვენ მიიღებთ ალტერნატიულ, გაუმჯობესებულ შეთავაზებას, რომელიც დაეხმარება ხელოვნურ ინტელექტს, შექმნას უფრო ზუსტი და ეფექტური იმეილები.
          </div>
        )}
        {showOfferingOptions && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offeringOptions.length > 0 ? (
              offeringOptions.map((option, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--table-bg)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--table-border)',
                    borderRadius: 8,
                    padding: '12px 18px',
                    position: 'relative',
                    textAlign: "justify"
                  }}
                >
                  <div
                  className='copy-context-btn'
                  onClick={() => setOfferingInput(option)}
                  title="Copy to offering">
                  <IoCopy size={22}/>
                  </div>
                        {option}
                  </div>

                  
              ))
            ) : (
              <div
                style={{
                  background: 'var(--table-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--table-border)',
                  borderRadius: 8,
                  padding: '12px 18px'
                }}
              >
                No options available.
              </div>
            )}
          </div>
        )}





         <div style={{ marginTop: 32, display:"flex", flexDirection: 'column', gap: 12 }}>
        <label style={{ fontWeight: 600, fontSize: 18 }}>Enter Context:</label>
        <textarea
          ref={contextRef}
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
            marginTop: 8,
          }}
          rows={4}
          placeholder="Enter your context here..."
          value={contextInput}
          onChange={e => setContextInput(e.target.value)}
          onInput={e => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 400) + 'px'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12}}>
          <div className="buttonContainer" style={{width: '100%', display: 'flex', flexDirection:"row", alignItems: 'center',justifyContent:"center",gap:30}}>
            <button
              className="add-context-btn"
              type="button"
              onClick={handleProcessContext}
            >
              კონტექსტის გადამუშავება
              <BsArrowRepeat size={25}/>
            </button>
            <button
              type="button"
              className="add-context-btn"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                borderRadius: '50%',
                fontSize: 18,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="What does this do?"
              onClick={() => setShowContextHelp(prev => !prev)}
            >
              ?
            </button>
          </div>
        </div>
        {showContextHelp && (
          <div style={{ color: '#aaa', fontSize: 15,textAlign:"center" }}>
          ამ ღილაკის მეშვეობით თქვენ მიიღებთ ალტერნატიულ, გაუმჯობესებულ კონტექსტს, რომელიც დაეხმარება ხელოვნურ ინტელექტს, შექმნას უფრო ზუსტი და ეფექტური იმეილები. ასე თავიდან აირიდებთ არასწორად გაგებულ კონტექსტზე აგებულ შეტყობინებებს.
          </div>
        )}
        {showContextOptions && (
  <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
    {contextOptions.length > 0 ? (
      contextOptions.map((option, idx) => (
        <div
          key={idx}
          style={{
            background: 'var(--table-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--table-border)',
            borderRadius: 8,
            padding: '12px 18px',
            position: 'relative',
            textAlign:"justify"
          }}
        >

          
          <div
            className='copy-context-btn'
            onClick={() => setContextInput(option)}
            title="Copy to context"
          >
            <IoCopy size={22}/>
          </div>
          {option}
        </div>
      ))
    ) : (
      <div
        style={{
          background: 'var(--table-bg)',
          color: 'var(--text-main)',
          border: '1px solid var(--table-border)',
          borderRadius: 8,
          padding: '12px 18px'
        }}
      >
        No options available.
      </div>
    )}
  </div>
)}
      </div>

        <div style={{ marginTop: 80 }}>
          <label style={{ fontWeight: 600, fontSize: 18 }}>Enter Example Script:</label>
          <textarea
            ref={scriptRef}
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
              marginTop: 8,
            }}
            rows={4}
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
      </div>






      <div className="generateAndSendButton" >
        <button
          className="add-emails-btn"
          onClick={handleGenerateAndSend}
          disabled={rows.length === 0 || sendLoading}
        >
          {sendLoading ? "Generating..." : "Generate & Send"}
        </button>
      </div>

      <div style={{ marginTop: 10, marginBottom: 24, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          className="add-emails-btn"
          onClick={() => setShowLeadListsPopup(true)}
        >
          Load a Lead List
        </button>
        {selectedLeadList && (
          <span style={{ marginLeft: 18, fontWeight: 500, color: '#3da175' }}>
            Loaded: {selectedLeadList.lead_list_name}
          </span>
        )}
      </div>

      {/* Lead List Popup */}
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

      {/* Email Popup */}
      {showEmailsPopup && (
        <div className="popup-overlay" onClick={() => setShowEmailsPopup(false)}>
          <div
            className="popup-box"
            style={{ minWidth: 400, maxWidth: 700, minHeight: 300 }}
            onClick={e => e.stopPropagation()}
          >
            <span
              className="popup-close"
              onClick={() => setShowEmailsPopup(false)}
            >
              &times;
            </span>
            <h2 style={{ marginBottom: 24 }}>Select an Email</h2>
            {emailsLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="leadlists-grid">
                {emails.map(emailObj => (
                  <div
                    className="leadlist-card"
                    key={emailObj.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedEmail(emailObj)
                      setShowEmailsPopup(false)
                    }}
                  >
                    <div className="leadlist-card-title">{emailObj.email}</div>
                    <div className="leadlist-card-desc">{emailObj.provider}</div>
                    <div className="leadlist-card-date">Grant ID: {emailObj.grant_id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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