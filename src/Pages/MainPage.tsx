import React, { useState, useRef, useEffect } from 'react'
import '../PageStyles/MainPageCSS.css'
import TableComponent from '../Components/TableComponent'
import supabase from '../helper/supabaseClient'

interface Row {
  recipient: string
  linkedin: string
  links: string
}

const initialRows: Row[] = []

function MainPage() {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([]);
  const [contextInput, setContextInput] = useState('');
  const [newLinkedin, setNewLinkedin] = useState('')

  const handleToggleRow = (idx: number) => {
    setSelectedRows(prev => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  };

  const recipientRef = useRef<HTMLTextAreaElement>(null)
  const linksRef = useRef<HTMLTextAreaElement>(null)
  const linkedinRef = useRef<HTMLTextAreaElement>(null)

  // Fetch rows from Supabase on mount
  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('Recipients & Data')
        .select('Recipient_Mail, Links_And_Sources, Linkedin')
        .order('id', { ascending: true })
      setLoading(false)
      if (error) {
        alert('Error fetching data: ' + error.message)
      } else if (data) {
        setRows(
          data.map((row: any) => ({
            recipient: row.Recipient_Mail || '',
            linkedin: row.Linkedin || '',
            links: row.Links_And_Sources || '',
          }))
        )
      }
    }
    fetchRows()
  }, [])



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
    );
  }, [rows]);



  const handleAddRow = async () => {
     if (!newRecipient.trim() && !newLinks.trim() && !newLinkedin.trim()) return
     setLoading(true)
     const { error } = await supabase
       .from('Recipients & Data')
       .insert([
         {
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
    }
  }




  const allChecked = rows.length > 0 && selectedRows.every(Boolean);
  const handleToggleAllRows = (checked: boolean) => {
    setSelectedRows(rows.map(() => checked));
  };


  

  const handleGenerateAndSend = async () => {
    // Only include checked recipients
    const checkedRows = rows.filter((_, idx) => selectedRows[idx]);
    const formattedRows = checkedRows.map(row => ({
      name: row.recipient,
      linkedin: row.linkedin,
      website: row.links,
    }));
  
    const payload = {
      context: contextInput,
      recipients: formattedRows,
    };
  
    try {
      const response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      alert(result.message || 'Request sent!');
    } catch (err) {
      alert('Failed to send request' + (err instanceof Error ? `: ${err.message}` : ''));
    }
  };

  return (
    <div className="container">

      <div className="requestContextInput">
        <textarea
          className="growing-textarea"
          style={{
            minHeight: '40px',
            maxHeight: '400px',
            overflow: 'auto',
            borderRadius: '12px',
            resize: 'none',
            padding: '10px',
            width: '100%',
            boxSizing: 'border-box',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE 10+
          }}
          rows={1}
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

      <div className="generateAndSendButton">
        <button
          className="supabase-btn"
          onClick={handleGenerateAndSend}
          disabled={rows.length === 0}
        >
          Generate &amp; Send
        </button>
      </div>
      
      <div className="mainpage-table-wrapper">
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
      />
      </div>


      
    </div>
  )
}

export default MainPage