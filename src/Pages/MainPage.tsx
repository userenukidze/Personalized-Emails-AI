import { useState, useRef, useEffect } from 'react'
import '../PageStyles/MainPageCSS.css'
import TableComponent from '../Components/TableComponent'
import supabase from '../helper/supabaseClient'
import Navbar from '../Components/Navbar'
import EmailComposer from '../Components/EmailComposer'

// Interface for row data structure in tables
interface Row {
  recipient: string
  linkedin: string
  links: string
}

function MainPage() {
  //=============================================================================
  // STATE MANAGEMENT - LEAD LISTS AND EMAIL SELECTION
  //=============================================================================
  
  // Lead list state variables - used for loading/selecting lead lists
  const [leadLists, setLeadLists] = useState<any[]>([])
  const [leadListsLoading, setLeadListsLoading] = useState(false)
  const [showLeadListsPopup, setShowLeadListsPopup] = useState(false)
  const [selectedLeadList, setSelectedLeadList] = useState<any | null>(null)

  // Email account state variables - used for selecting which email to send from
  const [emails, setEmails] = useState<any[]>([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [showEmailsPopup, setShowEmailsPopup] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null)

  //=============================================================================
  // STATE MANAGEMENT - TABLE DATA
  //=============================================================================
  
  // Table and recipient data state
  const [rows, setRows] = useState<Row[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [newLinkedin, setNewLinkedin] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([])
  
  // Email generation results state
  const [generatedEmails, setGeneratedEmails] = useState<{ [idx: number]: string }>({})
  const [generatingRows, setGeneratingRows] = useState<number[]>([])
  const [sendLoading, setSendLoading] = useState(false)

  //=============================================================================
  // REFS - USED FOR DIRECT DOM MANIPULATION
  //=============================================================================
  
  // Refs for form inputs
  const recipientRef = useRef<HTMLTextAreaElement>(null)
  const linksRef = useRef<HTMLTextAreaElement>(null)
  const linkedinRef = useRef<HTMLTextAreaElement>(null)

  //=============================================================================
  // PERSISTENCE - SAVE/RESTORE STATE FROM LOCAL STORAGE
  //=============================================================================
  
  // Restore data from localStorage on component mount
  useEffect(() => {
    const savedLeadList = localStorage.getItem('selectedLeadList')
    if (savedLeadList) setSelectedLeadList(JSON.parse(savedLeadList))
    
    const savedEmail = localStorage.getItem('selectedEmail')
    if (savedEmail) setSelectedEmail(JSON.parse(savedEmail))
  }, [])

  // Save selected lead list to localStorage when it changes
  useEffect(() => {
    if (selectedLeadList)
      localStorage.setItem('selectedLeadList', JSON.stringify(selectedLeadList))
    else
      localStorage.removeItem('selectedLeadList')
  }, [selectedLeadList])

  // Save selected email to localStorage when it changes
  useEffect(() => {
    if (selectedEmail)
      localStorage.setItem('selectedEmail', JSON.stringify(selectedEmail))
    else
      localStorage.removeItem('selectedEmail')
  }, [selectedEmail])

  //=============================================================================
  // DATA FETCHING - LEAD LISTS, EMAILS, AND LEADS
  //=============================================================================
  
  // Fetch lead lists when the popup is opened
  useEffect(() => {
    if (showLeadListsPopup) {
      setLeadListsLoading(true);
      
      // First get the current user ID
      supabase.auth.getUser().then(({ data }) => {
        if (!data?.user?.id) {
          setLeadLists([]);
          setLeadListsLoading(false);
          return;
        }
        
        // Then fetch only the lead lists that belong to this user
        supabase
          .from('Lead Lists')
          .select('*')
          .eq('parent_user', data.user.id)
          .order('created_at', { ascending: false })
          .then(({ data: leadListsData, error }) => {
            setLeadListsLoading(false);
            if (!error && leadListsData) {
              setLeadLists(leadListsData);
            } else {
              console.error('Error fetching lead lists:', error);
              setLeadLists([]);
            }
          });
      });
    }
  }, [showLeadListsPopup]);
  
  // Fetch email accounts when the email popup is opened
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

  // Fetch leads for the selected lead list when it changes
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

  // Reset row selection state when rows change
  useEffect(() => {
    setSelectedRows(selectedRows =>
      rows.map((_, i) => selectedRows[i] || false)
    )
  }, [rows])

  //=============================================================================
  // EVENT HANDLERS - LEAD MANAGEMENT
  //=============================================================================
  
  // Add a new lead to the current lead list
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

  // Toggle selection of a single row
  const handleToggleRow = (idx: number) => {
    setSelectedRows(prev => {
      const updated = [...prev]
      updated[idx] = !updated[idx]
      return updated
    })
  }

  // Check if all rows are selected
  const allChecked = rows.length > 0 && selectedRows.every(Boolean)
  
  // Toggle selection of all rows
  const handleToggleAllRows = (checked: boolean) => {
    setSelectedRows(rows.map(() => checked))
  }

  //=============================================================================
  // COMPONENT RENDERING
  //=============================================================================
  
  return (
    <div className="container">
      {/* Top navigation bar */}
      <Navbar />

      {/* Email composer component */}
      <EmailComposer
        selectedEmail={selectedEmail}
        setShowEmailsPopup={setShowEmailsPopup}
        rows={rows}
        selectedRows={selectedRows}
        onEmailsGenerated={setGeneratedEmails}
        onGeneratingChange={(isGenerating, rows) => {
          setSendLoading(isGenerating);
          setGeneratingRows(rows);
        }}
      />

      {/* Lead list selection */}
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

      {/* Table component for displaying leads */}
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