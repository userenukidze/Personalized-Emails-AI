import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import "../PageStyles/LeadListsContainerCSS.css"
import Navbar from '../Components/Navbar'
import supabase from '../helper/supabaseClient'

function LeadListsContainer() {
  const [showForm, setShowForm] = useState(false)
  const [leadListName, setLeadListName] = useState('')
  const [leadListDesc, setLeadListDesc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [leadLists, setLeadLists] = useState<any[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const navigate = useNavigate()

  // Edit state
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch lead lists for the current user
  useEffect(() => {
    const fetchLeadLists = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('Lead Lists')
        .select('*')
        .eq('parent_user', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) setLeadLists(data)
    }
    fetchLeadLists()
  }, [success, editId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError("Could not get user.")
      return
    }
    const { error: insertError } = await supabase
      .from('Lead Lists')
      .insert([{
        parent_user: user.id,
        lead_list_name: leadListName,
        description: leadListDesc
      }])
    if (insertError) {
      setError(insertError.message)
      return
    }
    setSuccess("Lead list created!")
    setShowForm(false)
    setLeadListName('')
    setLeadListDesc('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeadListDesc(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 420) + 'px'
    }
  }

  // Edit handlers
  const openEdit = (list: any) => {
    setEditId(list.id)
    setEditName(list.lead_list_name)
    setEditDesc(list.description)
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.style.height = 'auto'
        editTextareaRef.current.style.height = Math.min(editTextareaRef.current.scrollHeight, 420) + 'px'
      }
    }, 0)
  }

  const handleEditDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditDesc(e.target.value)
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto'
      editTextareaRef.current.style.height = Math.min(editTextareaRef.current.scrollHeight, 420) + 'px'
    }
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    const { error: updateError } = await supabase
      .from('Lead Lists')
      .update({
        lead_list_name: editName,
        description: editDesc
      })
      .eq('id', editId)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSuccess("Lead list updated!")
    setEditId(null)
    setEditName('')
    setEditDesc('')
  }

  return (
    <>
      <div className="container">
        <Navbar />
        <h1 style={{ marginTop: 50 }}> Lead Lists </h1>
        <button
          className="add-lead-list-btn"
          onClick={() => setShowForm(true)}
        >
          Add a Lead List
        </button>
        {success && <div style={{ color: 'var(--supabase-green)', marginTop: 16 }}>{success}</div>}
        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}

        {/* Lead Lists Grid */}
        <div className="leadlists-grid">
          {leadLists.map(list => (
            <div
              className="leadlist-card"
              key={list.id}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div
                onClick={() =>
                  navigate('/lead-list', {
                    state: {
                      id: list.id,
                      name: list.lead_list_name,
                      description: list.description,
                      created_at: list.created_at,
                    }
                  })
                }
              >
                <div className="leadlist-card-title">{list.lead_list_name}</div>
                <div className="leadlist-card-desc">{list.description}</div>
                <div className="leadlist-card-date">
                  {list.created_at && new Date(list.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                className="edit-leadlist-btn"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 2,
                  padding: '2px 10px',
                  borderRadius: 6,
                  border: '1px solid #bbb',
                  background: '#f5f5f5',
                  cursor: 'pointer'
                }}
                onClick={e => {
                  e.stopPropagation();
                  openEdit(list);
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {/* Edit Popup */}
        {editId !== null && (
          <div className="popup-overlay" onClick={() => setEditId(null)}>
            <div
              className="popup-box leadlist-popup-box"
              onClick={e => e.stopPropagation()}
            >
              <span
                className="popup-close"
                onClick={() => setEditId(null)}
              >
                &times;
              </span>
              <form
                className="leadlist-form"
                onSubmit={handleEditSave}
              >
                <label className="leadlist-label">
                  Name of the lead list
                  <input
                    className="mainpage-input leadlist-input"
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </label>
                <label className="leadlist-label">
                  Description of the lead list
                  <textarea
                    ref={editTextareaRef}
                    className="mainpage-input leadlist-textarea"
                    value={editDesc}
                    onChange={handleEditDescChange}
                    rows={3}
                  />
                </label>
                <button
                  className="mainpage-save-btn leadlist-create-btn"
                  type="submit"
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Create Popup */}
        {showForm && (
          <div className="popup-overlay" onClick={() => setShowForm(false)}>
            <div
              className="popup-box leadlist-popup-box"
              onClick={e => e.stopPropagation()}
            >
              <span
                className="popup-close"
                onClick={() => setShowForm(false)}
              >
                &times;
              </span>
              <form
                className="leadlist-form"
                onSubmit={handleCreate}
              >
                <label className="leadlist-label">
                  Name of the lead list
                  <input
                    className="mainpage-input leadlist-input"
                    type="text"
                    value={leadListName}
                    onChange={e => setLeadListName(e.target.value)}
                    required
                  />
                </label>
                <label className="leadlist-label">
                  Description of the lead list
                  <textarea
                    ref={textareaRef}
                    className="mainpage-input leadlist-textarea"
                    value={leadListDesc}
                    onChange={handleDescChange}
                    rows={3}
                  />
                </label>
                <button
                  className="mainpage-save-btn leadlist-create-btn"
                  type="submit"
                >
                  Create
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default LeadListsContainer