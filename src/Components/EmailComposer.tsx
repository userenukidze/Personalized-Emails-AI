import React, { useState, useRef, useEffect } from 'react';
import { IoCopy } from "react-icons/io5";
import { BsArrowRepeat } from "react-icons/bs";
import FileUpload from './FileUpload';
import '../ComponentStyles/EmailComposerCSS.css';

// Updated interface with only essential props from parent
interface EmailComposerProps {
  // Email selection
  selectedEmail: any | null;
  setShowEmailsPopup: (show: boolean) => void;
  
  // Data for email generation
  rows: any[];
  selectedRows: boolean[];
  
  // Callback to update parent component with generated emails
  onEmailsGenerated?: (emails: { [idx: number]: string }) => void;
  onGeneratingChange?: (isGenerating: boolean, generatingRows: number[]) => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  selectedEmail,
  setShowEmailsPopup,
  rows,
  selectedRows,
  onEmailsGenerated,
  onGeneratingChange
}) => {
  //=============================================================================
  // STATE MANAGEMENT - COMPONENT STATE
  //=============================================================================
  
  // Email content state variables
  const [contextInput, setContextInput] = useState('');
  const [exampleScript, setExampleScript] = useState('');
  const [offeringInput, setOfferingInput] = useState('');
  
  // Context refinement UI state
  const [showContextOptions, setShowContextOptions] = useState(false);
  const [showContextHelp, setShowContextHelp] = useState(false);
  const [contextOptions, setContextOptions] = useState<string[]>([]);

  // Offering refinement UI state
  const [offeringOptions, setOfferingOptions] = useState<string[]>([]);
  const [showOfferingOptions, setShowOfferingOptions] = useState(false);
  const [showOfferingHelp, setShowOfferingHelp] = useState(false);

  // File upload state - manages files that will be attached to emails
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Email generation state
  const [sendLoading, setSendLoading] = useState(false);
  const [campaignId, setCampaignId] = useState(() => crypto.randomUUID());

  //=============================================================================
  // REFS - USED FOR DIRECT DOM MANIPULATION (E.G., RESIZING TEXTAREAS)
  //=============================================================================
  
  // Refs for textarea inputs
  const contextRef = useRef<HTMLTextAreaElement>(null);
  const scriptRef = useRef<HTMLTextAreaElement>(null);
  const offeringRef = useRef<HTMLTextAreaElement>(null);

  //=============================================================================
  // PERSISTENCE - SAVE/RESTORE STATE FROM LOCAL STORAGE
  //=============================================================================
  
  // Restore data from localStorage on component mount
  useEffect(() => {
    const savedContext = localStorage.getItem('contextInput');
    if (savedContext) setContextInput(savedContext);
    
    const savedScript = localStorage.getItem('exampleScript');
    if (savedScript) setExampleScript(savedScript);
    
    const savedOffering = localStorage.getItem('offeringInput');
    if (savedOffering) setOfferingInput(savedOffering);
  }, []);

  // Save context input to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('contextInput', contextInput);
  }, [contextInput]);

  // Save example script to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('exampleScript', exampleScript);
  }, [exampleScript]);

  // Save offering input to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('offeringInput', offeringInput);
  }, [offeringInput]);

  //=============================================================================
  // TEXTAREA AUTO-RESIZE EFFECTS
  //=============================================================================
  
  // Auto-resize context textarea when content changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.style.height = 'auto';
      contextRef.current.style.height = Math.min(contextRef.current.scrollHeight, 400) + 'px';
    }
  }, [contextInput]);

  // Auto-resize script textarea when content changes
  useEffect(() => {
    if (scriptRef.current) {
      scriptRef.current.style.height = 'auto';
      scriptRef.current.style.height = Math.min(scriptRef.current.scrollHeight, 400) + 'px';
    }
  }, [exampleScript]);

  // Auto-resize offering textarea when content changes
  useEffect(() => {
    if (offeringRef.current) {
      offeringRef.current.style.height = 'auto';
      offeringRef.current.style.height = Math.min(offeringRef.current.scrollHeight, 400) + 'px';
    }
  }, [offeringInput]);

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
    
    if (onGeneratingChange) {
      onGeneratingChange(true, checkedIndexes);
    }
    
    setSendLoading(true);
    
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
      let generatedEmails: { [idx: number]: string } = {};

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
              generatedEmails[checkedIndexes[idx]] = data.openai;
              if (onEmailsGenerated) {
                onEmailsGenerated({ ...generatedEmails });
              }
            }
          }
          if (part.startsWith('event: end')) {
            setSendLoading(false);
            if (onGeneratingChange) {
              onGeneratingChange(false, []);
            }
          }
        }
      }
    } catch (err) {
      alert('Failed to send request' + (err instanceof Error ? `: ${err.message}` : ''));
      setSendLoading(false);
      if (onGeneratingChange) {
        onGeneratingChange(false, []);
      }
    }
  };

  //=============================================================================
  // COMPONENT RENDERING
  //=============================================================================
  
  return (
    <>
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
    </>
  );
};

export default EmailComposer;