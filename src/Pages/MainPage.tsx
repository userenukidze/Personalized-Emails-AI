import React, { useState, useRef, useEffect } from 'react'
import '../PageStyles/MainPageCSS.css'
import TableComponent from '../Components/TableComponent'
import supabase from '../helper/supabaseClient'

interface Row {
  recipient: string
  links: string
}

const initialRows: Row[] = []

function MainPage() {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [loading, setLoading] = useState(false)

  const recipientRef = useRef<HTMLTextAreaElement>(null)
  const linksRef = useRef<HTMLTextAreaElement>(null)

  // Fetch rows from Supabase on mount
  useEffect(() => {
    const fetchRows = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('Recipients & Data')
        .select('Recipient_Mail, Links_And_Sources')
        .order('id', { ascending: true })
      setLoading(false)
      if (error) {
        alert('Error fetching data: ' + error.message)
      } else if (data) {
        setRows(
          data.map((row: any) => ({
            recipient: row.Recipient_Mail || '',
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

  const handleAddRow = async () => {
    if (!newRecipient.trim() && !newLinks.trim()) return
    setLoading(true)
    const { error } = await supabase
      .from('Recipients & Data')
      .insert([
        {
          Recipient_Mail: newRecipient,
          Links_And_Sources: newLinks,
        },
      ])
    setLoading(false)
    if (!error) {
      setRows([...rows, { recipient: newRecipient, links: newLinks }])
      setNewRecipient('')
      setNewLinks('')
    } else {
      alert('Error saving to database: ' + error.message)
    }
  }

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
        onInput={e => {
          const target = e.target as HTMLTextAreaElement
          target.style.height = 'auto'
          target.style.height = Math.min(target.scrollHeight, 400) + 'px'
        }}
      />
      </div>
      
      <div className="mainpage-table-wrapper">
        <TableComponent
          rows={rows}
          newRecipient={newRecipient}
          newLinks={newLinks}
          recipientRef={recipientRef}
          linksRef={linksRef}
          setNewRecipient={setNewRecipient}
          setNewLinks={setNewLinks}
          handleAddRow={handleAddRow}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default MainPage