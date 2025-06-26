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
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([]);
  const [contextInput, setContextInput] = useState('');
  const [newLinkedin, setNewLinkedin] = useState('')
  const [exampleScript, setExampleScript] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<{ [idx: number]: string }>({});
  const [generatingRows, setGeneratingRows] = useState<number[]>([]);
  

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
        console.log(error)
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
       console.log(error)
    }
  }




  const allChecked = rows.length > 0 && selectedRows.every(Boolean);
  const handleToggleAllRows = (checked: boolean) => {
    setSelectedRows(rows.map(() => checked));
  };


  

  const handleGenerateAndSend = async () => {
    const checkedRows = rows.filter((_, idx) => selectedRows[idx]);
    const checkedIndexes = rows.map((_, idx) => idx).filter(idx => selectedRows[idx]);
    setGeneratingRows(checkedIndexes);
    setSendLoading(true);
    setGeneratedEmails({});
  
    const formattedRows = checkedRows.map(row => ({
      name: row.recipient,
      linkedin: row.linkedin,
      website: row.links,
    }));
  
    const payload = {
      context: contextInput,
      exampleScript: exampleScript,
      recipients: formattedRows,
    };
  
    try {
      const response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
  
      while (true) {
        if (!reader) break;
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
  
        let parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
  
        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const data = JSON.parse(part.replace('data: ', ''));
            // Find the index of this recipient in checkedRows
            const idx = checkedRows.findIndex(r =>
              r.recipient === data.recipient.name &&
              r.linkedin === data.recipient.linkedin &&
              r.links === data.recipient.website
            );
            if (idx !== -1) {
              setGeneratedEmails(prev => ({
                ...prev,
                [checkedIndexes[idx]]: data.openai
              }));
            }
          }
          if (part.startsWith('event: end')) {
            setSendLoading(false);
            setGeneratingRows([]);
          }
        }
      }
    } catch (err) {
      alert('Failed to send request' + (err instanceof Error ? `: ${err.message}` : ''));
      setSendLoading(false);
      setGeneratingRows([]);
    }
  };

  return (
    <div className="container">

      <Navbar/>


      <h1 style={{marginTop:50}}>Enter Context:</h1>
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


      <h1 style={{marginTop:50}}>Enter Example Script:</h1>
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
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE 10+
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
      </div>


      
    </div>
  )
}

export default MainPage