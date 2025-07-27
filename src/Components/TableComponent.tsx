import React, { useState } from 'react'
import "../ComponentStyles/TableComponentCSS.css"
import { MdMarkEmailRead, MdOutlineMailOutline, MdEdit, MdDelete } from "react-icons/md";
import { PulseLoader } from "react-spinners";
import supabase from '../helper/supabaseClient';

interface Row {
  recipient: string
  linkedin: string
  links: string
}

interface TableProps {
  rows: Row[]
  newRecipient: string
  newLinkedin: string
  newLinks: string
  recipientRef: React.RefObject<HTMLTextAreaElement | null>
  linkedinRef: React.RefObject<HTMLTextAreaElement | null>
  linksRef: React.RefObject<HTMLTextAreaElement | null>
  setNewRecipient: (v: string) => void
  setNewLinkedin: (v: string) => void
  setNewLinks: (v: string) => void
  handleAddRow: () => void
  loading?: boolean
  selectedRows?: boolean[]
  onToggleRow?: (idx: number) => void
  onToggleAllRows?: (checked: boolean) => void
  allChecked?: boolean
  generatedEmails?: { [idx: number]: string }
  generatingRows?: number[]
}

const PAGE_SIZE = 10

const TableComponent: React.FC<TableProps> = ({
  rows,
  newRecipient,
  newLinkedin,
  newLinks,
  recipientRef,
  linkedinRef,
  linksRef,
  setNewRecipient,
  setNewLinkedin,
  setNewLinks,
  handleAddRow,
  loading,
  selectedRows = [],
  onToggleRow = () => {},
  onToggleAllRows = () => {},
  allChecked = false,
  generatedEmails = {},
  generatingRows = [],
}) => {
  const [popupIdx, setPopupIdx] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editRecipient, setEditRecipient] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editLinks, setEditLinks] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingIdx, setDeleteLoadingIdx] = useState<number | null>(null);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paginatedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Helper to get the real index in the rows array
  const getRealIdx = (idx: number) => (currentPage - 1) * PAGE_SIZE + idx;

  // Edit row handler
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditRecipient(rows[idx].recipient);
    setEditLinkedin(rows[idx].linkedin);
    setEditLinks(rows[idx].links);
  };

  // Save edit handler
  const handleEditSave = async (idx: number) => {
    setEditLoading(true);
    const row = rows[idx];
    const { error } = await supabase
      .from('Leads')
      .update({
        Recipient_Mail: editRecipient,
        Linkedin: editLinkedin,
        Links_And_Sources: editLinks,
      })
      .match({
        Recipient_Mail: row.recipient,
        Linkedin: row.linkedin,
        Links_And_Sources: row.links,
      });
    setEditLoading(false);
    if (!error) {
      rows[idx].recipient = editRecipient;
      rows[idx].linkedin = editLinkedin;
      rows[idx].links = editLinks;
      setEditIdx(null);
    } else {
      alert('Failed to update row: ' + error.message);
    }
  };

  // Delete row handler
  const handleDelete = async (idx: number) => {
    setDeleteLoadingIdx(idx);
    const row = rows[idx];
    const { error } = await supabase
      .from('Leads')
      .delete()
      .match({
        Recipient_Mail: row.recipient,
        Linkedin: row.linkedin,
        Links_And_Sources: row.links,
      });
    setDeleteLoadingIdx(null);
    if (!error) {
      rows.splice(idx, 1);
      setEditIdx(null);
      setCurrentPage(1);
    } else {
      alert('Failed to delete row: ' + error.message);
    }
  };

  return (
    <>
      <table className="mainpage-table">
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <thead>
          <tr className="mainpage-table-header-row">
            <th className="mainpage-table-header" style={{ textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={!!allChecked}
                onChange={e => onToggleAllRows(e.target.checked)}
              />
            </th>
            <th className="mainpage-table-header" style={{ textAlign: 'center' }}></th>
            <th className="mainpage-table-header" style={{ textAlign: 'center' }}>Recipient Mail</th>
            <th className="mainpage-table-header" style={{ textAlign: 'center' }}>Linkedin</th>
            <th className="mainpage-table-header">Links &amp; Sources</th>
            <th className="mainpage-table-header" style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, idx) => {
            const realIdx = getRealIdx(idx);
            const isEditing = editIdx === realIdx;
            return (
              <tr key={realIdx} style={{ height: 56 }}>
                <td className="mainpage-table-cell checkbox-cell align-center">
                  <input
                    type="checkbox"
                    checked={!!selectedRows[realIdx]}
                    onChange={() => onToggleRow(realIdx)}
                  />
                </td>
                <td className="mainpage-table-cell v-btn-cell align-center">
                  <button
                    className="v-btn"
                    onClick={() => setPopupIdx(realIdx)}
                    type="button"
                    disabled={generatingRows.includes(realIdx) && !generatedEmails[realIdx]}
                  >
                    {generatingRows.includes(realIdx)
                      ? (generatedEmails[realIdx]
                          ? <MdMarkEmailRead color='#3da175'/>
                          : <PulseLoader size={3} speedMultiplier={0.6} margin={2} color={"#3da175"} />
                        )
                      : <MdOutlineMailOutline/>
                    }
                  </button>
                </td>
                {isEditing ? (
                  <>
                    <td className="mainpage-table-cell recipient-cell align-center" style={{ height: 56 }}>
                      <input
                        value={editRecipient}
                        onChange={e => setEditRecipient(e.target.value)}
                        className="mainpage-input"
                        style={{ width: '100%', height: 36, textAlign: 'center' }}
                      />
                    </td>
                    <td className="mainpage-table-cell align-center" style={{ height: 56 }}>
                      <input
                        value={editLinkedin}
                        onChange={e => setEditLinkedin(e.target.value)}
                        className="mainpage-input"
                        style={{ width: '100%', height: 36, textAlign: 'center' }}
                      />
                    </td>
                    <td className="mainpage-table-cell align-center" style={{ height: 56 }}>
                      <input
                        value={editLinks}
                        onChange={e => setEditLinks(e.target.value)}
                        className="mainpage-input"
                        style={{ width: '100%', height: 36, textAlign: 'center' }}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="mainpage-table-cell scrollable-cell recipient-cell align-center" style={{ height: 56 }}>
                      <div style={{ width: '100%', maxHeight: 48, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {row.recipient}
                      </div>
                    </td>
                    <td className="mainpage-table-cell scrollable-cell align-center" style={{ height: 56 }}>
                      <div style={{ width: '100%', maxHeight: 48, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {row.linkedin}
                      </div>
                    </td>
                    <td className="mainpage-table-cell scrollable-cell align-center" style={{ height: 56 }}>
                      <div style={{ width: '100%', maxHeight: 48, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {row.links}
                      </div>
                    </td>
                  </>
                )}
                <td className="mainpage-table-cell align-center" style={{ minWidth: 120, height: 56 }}>
                  {isEditing ? (
                    <>
                      <button
                        className="mainpage-save-btn"
                        style={{ marginRight: 6 }}
                        onClick={() => handleEditSave(realIdx)}
                        disabled={editLoading}
                      >
                        {editLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="mainpage-save-btn"
                        onClick={() => setEditIdx(null)}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <div className="buttonsContainer" style={{ width: "100%", height: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                      <div
                        className="mainpage-edit-btn"
                        style={{ marginRight: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, width: 36, cursor: 'pointer' }}
                        onClick={() => handleEdit(realIdx)}
                      >
                        <MdEdit size={25} color='#3da175'/>
                      </div>
                      <div
                        className={`mainpage-delete-btn${deleteLoadingIdx === realIdx ? ' disabled' : ''}`}
                        onClick={deleteLoadingIdx === realIdx ? undefined : () => handleDelete(realIdx)}
                        style={{
                          pointerEvents: deleteLoadingIdx === realIdx ? 'none' : 'auto',
                          opacity: deleteLoadingIdx === realIdx ? 0.5 : 1,
                          cursor: deleteLoadingIdx === realIdx ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 36,
                          width: 36
                        }}
                      >
                        {deleteLoadingIdx === realIdx ? "..." : <MdDelete size={25} color='red'/>}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          <tr style={{ height: 56 }}>
            <td className="mainpage-table-cell checkbox-cell align-center"></td>
            <td className="mainpage-table-cell v-btn-cell align-center"></td>
            <td className="mainpage-table-cell recipient-cell align-center" style={{ height: 56 }}>
              <textarea
                ref={recipientRef}
                placeholder="Add recipient email"
                value={newRecipient}
                onChange={e => setNewRecipient(e.target.value)}
                className="mainpage-input mainpage-textarea"
                rows={1}
                style={{ textAlign: 'center', height: 36, margin: 'auto 0' }}
              />
            </td>
            <td className="mainpage-table-cell align-center" style={{ height: 56 }}>
              <textarea
                ref={linkedinRef}
                placeholder="Add Linkedin"
                value={newLinkedin}
                onChange={e => setNewLinkedin(e.target.value)}
                className="mainpage-input mainpage-textarea"
                rows={1}
                style={{ textAlign: 'center', height: 36, margin: 'auto 0' }}
              />
            </td>
            <td className="mainpage-table-cell mainpage-input-row align-center" style={{ height: 56 }}>
              <textarea
                ref={linksRef}
                placeholder="Add links & sources"
                value={newLinks}
                onChange={e => setNewLinks(e.target.value)}
                className="mainpage-input mainpage-textarea"
                rows={1}
                style={{ height: 36, margin: 'auto 0' }}
              />
              <button
                onClick={handleAddRow}
                className="mainpage-save-btn"
                disabled={loading}
                style={{ height: 36, margin: 'auto 0' }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </td>
            <td className="mainpage-table-cell align-center" style={{ height: 56 }}></td>
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
              <strong style={{fontSize: '22px'}}>Generated Email:</strong>
              <div style={{ marginTop: 40, whiteSpace: 'pre-wrap', textAlign: 'left',fontSize:20 }}>
                {generatedEmails && generatedEmails[popupIdx]
                  ? generatedEmails[popupIdx]
                  : <span style={{ color: '#aaa' }}>No generated email for this recipient.</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TableComponent