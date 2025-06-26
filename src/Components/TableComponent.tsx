import React, { useState } from 'react'
import "../ComponentStyles/TableComponentCSS.css"
import { MdMarkEmailRead } from "react-icons/md";
import { MdOutlineMailOutline } from "react-icons/md";
import { PulseLoader  } from "react-spinners";

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
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="mainpage-table-cell checkbox-cell" style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={!!selectedRows[idx]}
                  onChange={() => onToggleRow(idx)}
                />
              </td>
              <td className="mainpage-table-cell v-btn-cell" style={{ textAlign: 'center' }}>
              <button
                  className="v-btn"
                  onClick={() => setPopupIdx(idx)}
                  type="button"
                  disabled={generatingRows.includes(idx) && !generatedEmails[idx]}
                >
                  {generatingRows.includes(idx)
                    ? (generatedEmails[idx]
                        ? <MdMarkEmailRead color='#3da175'/>
                        : <PulseLoader  size={3} speedMultiplier={0.6} margin={2} color={"#3da175"} />
                      )
                    : <MdOutlineMailOutline/>
                  }
                 </button>
              </td>
              <td className="mainpage-table-cell scrollable-cell recipient-cell">{row.recipient}</td>
              <td className="mainpage-table-cell scrollable-cell">{row.linkedin}</td>
              <td className="mainpage-table-cell scrollable-cell">{row.links}</td>
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
                style={{ textAlign: 'center' }}
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
                style={{ textAlign: 'center' }}
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

      {popupIdx !== null && (
        <>
        
          {/* <div className="container"> */}
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
          {/* </div> */}

        </>
      )}
    </>
  );
}

export default TableComponent