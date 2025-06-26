import React, { useState, useRef, useEffect } from 'react'
import "../ComponentStyles/TableComponentCSS.css"
import { MdOutlineMailOutline } from "react-icons/md"
import supabase from '../helper/supabaseClient'

interface LeadRow {
  id: number
  Recipient_Mail: string
  Linkedin: string
  Links_And_Sources: string
  created_at?: string
}

interface LeadsTableProps {
  parentLeadListId: number
}

const PAGE_SIZE = 10

const LeadsTable: React.FC<LeadsTableProps> = ({ parentLeadListId }) => {
  const [rows, setRows] = useState<LeadRow[]>([])
  const [newRecipient, setNewRecipient] = useState('')
  const [newLinkedin, setNewLinkedin] = useState('')
  const [newLinks, setNewLinks] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<boolean[]>([])
  const [allChecked, setAllChecked] = useState(false)
  const [popupIdx, setPopupIdx] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const recipientRef = useRef<HTMLTextAreaElement | null>(null)
  const linkedinRef = useRef<HTMLTextAreaElement | null>(null)
  const linksRef = useRef<HTMLTextAreaElement | null>(null)

  // Fetch leads for this lead list, oldest first
  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from('Leads')
        .select('*')
        .eq('parent_lead_list', parentLeadListId)
        .order('created_at', { ascending: true }) // oldest at top
      if (!error && data) {
        setRows(data)
        setSelectedRows(new Array(data.length).fill(false))
      }
    }
    fetchLeads()
  }, [parentLeadListId, loading])

  const handleAddRow = async () => {
    if (!newRecipient && !newLinkedin && !newLinks) return
    setLoading(true)
    const { error } = await supabase
      .from('Leads')
      .insert([{
        parent_lead_list: parentLeadListId,
        Recipient_Mail: newRecipient,
        Linkedin: newLinkedin,
        Links_And_Sources: newLinks
      }])
    setLoading(false)
    if (!error) {
      setNewRecipient('')
      setNewLinkedin('')
      setNewLinks('')
      setCurrentPage(1)
    }
  }

  const onToggleRow = (idx: number) => {
    setSelectedRows(prev => {
      const updated = [...prev]
      updated[idx] = !updated[idx]
      setAllChecked(updated.every(Boolean))
      return updated
    })
  }

  const onToggleAllRows = (checked: boolean) => {
    setSelectedRows(new Array(rows.length).fill(checked))
    setAllChecked(checked)
  }

  // Pagination logic
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const paginatedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <>
      <table className="mainpage-table">
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <thead>
          <tr className="mainpage-table-header-row">
            <th className="mainpage-table-header">
              <input
                type="checkbox"
                checked={!!allChecked}
                onChange={e => onToggleAllRows(e.target.checked)}
              />
            </th>
            <th className="mainpage-table-header"></th>
            <th className="mainpage-table-header">Recipient Mail</th>
            <th className="mainpage-table-header">Linkedin</th>
            <th className="mainpage-table-header">Links &amp; Sources</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, idx) => (
            <tr key={row.id}>
              <td className="mainpage-table-cell checkbox-cell">
                <input
                  type="checkbox"
                  checked={!!selectedRows[(currentPage - 1) * PAGE_SIZE + idx]}
                  onChange={() => onToggleRow((currentPage - 1) * PAGE_SIZE + idx)}
                />
              </td>
              <td className="mainpage-table-cell v-btn-cell">
                <button
                  className="v-btn"
                  onClick={() => setPopupIdx((currentPage - 1) * PAGE_SIZE + idx)}
                  type="button"
                >
                  <MdOutlineMailOutline />
                </button>
              </td>
              <td className="mainpage-table-cell scrollable-cell recipient-cell">{row.Recipient_Mail}</td>
              <td className="mainpage-table-cell scrollable-cell">{row.Linkedin}</td>
              <td className="mainpage-table-cell scrollable-cell">{row.Links_And_Sources}</td>
            </tr>
          ))}
          <tr>
            <td className="mainpage-table-cell checkbox-cell"></td>
            <td className="mainpage-table-cell v-btn-cell"></td>
            <td className="mainpage-table-cell recipient-cell">
              <textarea
                ref={recipientRef}
                placeholder="Add recipient email"
                value={newRecipient}
                onChange={e => setNewRecipient(e.target.value)}
                className="mainpage-input mainpage-textarea"
                rows={1}
              />
            </td>
            <td className="mainpage-table-cell">
              <textarea
                ref={linkedinRef}
                placeholder="Add Linkedin"
                value={newLinkedin}
                onChange={e => setNewLinkedin(e.target.value)}
                className="mainpage-input mainpage-textarea"
                rows={1}
              />
            </td>
            <td className="mainpage-table-cell mainpage-input-row">
              <textarea
                ref={linksRef}
                placeholder="Add links & sources"
                value={newLinks}
                onChange={e => setNewLinks(e.target.value)}
                className="mainpage-input mainpage-textarea"
                rows={1}
              />
              <button
                onClick={handleAddRow}
                className="mainpage-save-btn"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {totalPages > 1 && (
         <div className="pagination-controls" style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 4 }}>
           {Array.from({ length: totalPages }, (_, i) => (
             <button
               key={i + 1}
               onClick={() => setCurrentPage(i + 1)}
               style={{
                 background: currentPage === i + 1 ? 'var(--table-bg)' : 'var(--table-header-bg)',
                 color: 'var(--text-main)',
                 border: '1px solid var(--table-border)',
                 borderRadius: 8,
                 margin: '0 2px',
                 padding: '8px 18px',
                 fontWeight: 600,
                 fontSize: 15,
                 cursor: 'pointer',
                 transition: 'background 0.2s, color 0.2s, border 0.2s',
                 ...(currentPage === i + 1 ? { borderWidth: '1.5px' } : {}),
               }}
             >
               {i + 1}
             </button>
           ))}
         </div>
       )}

      {popupIdx !== null && (
        <div className="popup-overlay" onClick={() => setPopupIdx(null)}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            <span className="popup-close" onClick={() => setPopupIdx(null)}>&times;</span>
            <div>
              <strong className="popup-title">Lead Details:</strong>
              <div className="popup-details">
                <div><b>Recipient:</b> {rows[popupIdx]?.Recipient_Mail}</div>
                <div><b>Linkedin:</b> {rows[popupIdx]?.Linkedin}</div>
                <div><b>Links & Sources:</b> {rows[popupIdx]?.Links_And_Sources}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LeadsTable