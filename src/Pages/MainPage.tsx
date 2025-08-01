import React, { useState, useRef, useEffect } from 'react'
import '../PageStyles/MainPageCSS.css'
import TableComponent from '../Components/TableComponent'
import supabase from '../helper/supabaseClient'
import Navbar from '../Components/Navbar'
import { IoCopy } from "react-icons/io5";
import { BsArrowRepeat } from "react-icons/bs";
import FileUpload from '../Components/FileUpload';


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
  // STATE MANAGEMENT - TABLE DATA AND EMAIL CONTENT
  //=============================================================================
  
  // Table and recipient data state
  const [rows, setRows] = useState<Row[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [newLinkedin, setNewLinkedin] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([])
  
  // Email content state variables
  const [contextInput, setContextInput] = useState('')
  const [exampleScript, setExampleScript] = useState('')
  const [offeringInput, setOfferingInput] = useState('');
  
  // Email generation state
  const [sendLoading, setSendLoading] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<{ [idx: number]: string }>({})
  const [generatingRows, setGeneratingRows] = useState<number[]>([])


  //=============================================================================
  // STATE MANAGEMENT - UI CONTROL AND OPTIONS
  //=============================================================================
  
  // Context refinement UI state
  const [showContextOptions, setShowContextOptions] = useState(false)
  const [showContextHelp, setShowContextHelp] = useState(false)
  const [contextOptions, setContextOptions] = useState<string[]>([]);

  // Offering refinement UI state
  const [offeringOptions, setOfferingOptions] = useState<string[]>([]);
  const [showOfferingOptions, setShowOfferingOptions] = useState(false);
  const [showOfferingHelp, setShowOfferingHelp] = useState(false);

  // File upload state - manages files that will be attached to emails
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [campaignId, setCampaignId] = useState(() => crypto.randomUUID());


  //=============================================================================
  // REFS - USED FOR DIRECT DOM MANIPULATION (E.G., RESIZING TEXTAREAS)
  //=============================================================================
  
  // Refs for form inputs - used to control textarea sizing and focus
  const recipientRef = useRef<HTMLTextAreaElement>(null)
  const linksRef = useRef<HTMLTextAreaElement>(null)
  const linkedinRef = useRef<HTMLTextAreaElement>(null)
  const contextRef = useRef<HTMLTextAreaElement>(null)
  const scriptRef = useRef<HTMLTextAreaElement>(null)
  const offeringRef = useRef<HTMLTextAreaElement>(null);


  //=============================================================================
  // PERSISTENCE - SAVE/RESTORE STATE FROM LOCAL STORAGE
  //=============================================================================
  
  // Restore data from localStorage on component mount
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

  // Save context input to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('contextInput', contextInput)
  }, [contextInput])

  // Save example script to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('exampleScript', exampleScript)
  }, [exampleScript])

  // Save offering input to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('offeringInput', offeringInput);
  }, [offeringInput]);

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
  // TEXTAREA AUTO-RESIZE EFFECTS
  //=============================================================================
  
  // Auto-resize context textarea when content changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.style.height = 'auto'
      contextRef.current.style.height = Math.min(contextRef.current.scrollHeight, 400) + 'px'
    }
  }, [contextInput])

  // Auto-resize script textarea when content changes
  useEffect(() => {
    if (scriptRef.current) {
      scriptRef.current.style.height = 'auto'
      scriptRef.current.style.height = Math.min(scriptRef.current.scrollHeight, 400) + 'px'
    }
  }, [exampleScript])

  // Auto-resize offering textarea when content changes
  useEffect(() => {
    if (offeringRef.current) {
      offeringRef.current.style.height = 'auto';
      offeringRef.current.style.height = Math.min(offeringRef.current.scrollHeight, 400) + 'px';
    }
  }, [offeringInput]);


  //=============================================================================
  // DATA FETCHING - LEAD LISTS, EMAILS, AND LEADS
  //=============================================================================
  
  // Fetch lead lists when the popup is opened
  // Filters lists by the current logged-in user
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
          .eq('parent_user', data.user.id) // Filter by current user ID
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
  // Filters emails by the current logged-in user
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
  // EVENT HANDLERS - EMAIL GENERATION AND SENDING
  //=============================================================================
  
  // Generate personalized emails and send them
  const handleGenerateAndSend = async () => {
    // Generate a new campaignId for each send
    const newCampaignId = crypto.randomUUID();
    setCampaignId(newCampaignId);

    const checkedRows = rows.filter((_, idx) => selectedRows[idx]);
    const checkedIndexes = rows.map((_, idx) => idx).filter(idx => selectedRows[idx]);
    setGeneratingRows(checkedIndexes);
    setSendLoading(true);
    setGeneratedEmails({});

    // Debug log to see original filenames
    console.log("Original file names:", uploadedFiles.map(f => f.name));

    // Prepare form data for submission
    const formData = new FormData();
    formData.append('context', contextInput);
    formData.append('exampleScript', exampleScript);
    formData.append('offering', offeringInput);
    formData.append('fromEmail', selectedEmail?.email || '');
    formData.append('grantId', selectedEmail?.grant_id || '');
    formData.append('recipients', JSON.stringify(checkedRows.map(row => ({
      name: row.recipient,
      linkedin: row.linkedin,
      website: row.links,
    }))));
    formData.append('campaignId', newCampaignId);
    
    // Add file name information to help server with encoding
    formData.append('fileNamesForReference', JSON.stringify(
      uploadedFiles.map(file => ({
        name: file.name,
        normalizedName: file.name.normalize('NFC'), // Normalize Unicode representation
      }))
    ));
    
    // Append all files to the form data
    uploadedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Send request to generate emails
      const response = await fetch('http://localhost:4000/generate', {
        method: 'POST',
        headers: {
          // Add header to ensure server knows to handle UTF-8 encoding
          'X-Filename-Encoding': 'UTF-8'
        },
        body: formData,
      });

      // Handle streaming response - reads generated emails as they come in
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
  }


  //=============================================================================
  // EVENT HANDLERS - CONTEXT AND OFFERING REFINEMENT
  //=============================================================================
  
  // Process and refine the context using AI
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

  // Process and refine the offering using AI
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

  // Handle file upload - adds files to the uploadedFiles state
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev =>
        [...prev, ...newFiles].filter(
          (file, idx, arr) => arr.findIndex(f => f.name === file.name && f.size === file.size) === idx
        )
      );
      // Optionally, reset the input value so the same file can be selected again
      e.target.value = '';
    }
  };


  //=============================================================================
  // COMPONENT RENDERING
  //=============================================================================
  
  return (
    <div className="container">
      {/* Top navigation bar */}
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
        {/* Header with title and email selection button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Context & Script</h1>
          <button
            className="add-emails-btn"
            onClick={() => setShowEmailsPopup(true)}
          >
            Choose Email
          </button>
        </div>
        
        {/* Display selected email */}
        {selectedEmail && (
          <div style={{ margin: '16px 0 0 0', fontWeight: 500, color: '#3da175' }}>
            Sending from: {selectedEmail.email}
          </div>
        )}

        {/* Offering input section */}
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
        
        {/* Offering refinement buttons */}
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

        {/* Help text for offering refinement */}
        {showOfferingHelp && (
          <div style={{ color: '#aaa', fontSize: 15, textAlign: "center" }}>
            ამ ღილაკის მეშვეობით თქვენ მიიღებთ ალტერნატიულ, გაუმჯობესებულ შეთავაზებას, რომელიც დაეხმარება ხელოვნურ ინტელექტს, შექმნას უფრო ზუსტი და ეფექტური იმეილები.
          </div>
        )}
        
        {/* Display offering refinement options */}
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

        {/* Context input section */}
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
          
          {/* Context refinement buttons */}
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
          
          {/* Help text for context refinement */}
          {showContextHelp && (
            <div style={{ color: '#aaa', fontSize: 15,textAlign:"center" }}>
            ამ ღილაკის მეშვეობით თქვენ მიიღებთ ალტერნატიულ, გაუმჯობესებულ კონტექსტს, რომელიც დაეხმარება ხელოვნურ ინტელექტს, შექმნას უფრო ზუსტი და ეფექტური იმეილები. ასე თავიდან აირიდებთ არასწორად გაგებულ კონტექსტზე აგებულ შეტყობინებებს.
            </div>
          )}
          
          {/* Display context refinement options */}
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
        
        {/* Example script input section */}
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

      {/* File upload component */}
      <FileUpload uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />

      {/* Generate and send button */}
      <div className="generateAndSendButton" >
        <button
          className="add-emails-btn"
          onClick={handleGenerateAndSend}
          disabled={rows.length === 0 || sendLoading}
        >
          {sendLoading ? "Generating..." : "Generate & Send"}
        </button>
      </div>

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