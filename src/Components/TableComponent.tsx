import React from 'react'
import "../ComponentStyles/TableComponentCSS.css"

interface Row {
  recipient: string
  links: string
}

interface TableProps {
  rows: Row[]
  newRecipient: string
  newLinks: string
  recipientRef: React.RefObject<HTMLTextAreaElement | null>
  linksRef: React.RefObject<HTMLTextAreaElement | null>
  setNewRecipient: (v: string) => void
  setNewLinks: (v: string) => void
  handleAddRow: () => void
  loading?: boolean
  selectedRows?: boolean[]
  onToggleRow?: (idx: number) => void
  onToggleAllRows?: (checked: boolean) => void
  allChecked?: boolean
}

const TableComponent: React.FC<TableProps> = ({
  rows,
  newRecipient,
  newLinks,
  recipientRef,
  linksRef,
  setNewRecipient,
  setNewLinks,
  handleAddRow,
  loading,
  selectedRows = [],
  onToggleRow = () => {},
  onToggleAllRows = () => {},
  allChecked = false
}) => (
  <table className="mainpage-table">
    <colgroup>
      <col style={{ width: '5%' }} />
      <col style={{ width: '35%' }} />
      <col style={{ width: '60%' }} />
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
        <th className="mainpage-table-header" style={{ textAlign: 'center' }}>Recipient Mail</th>
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
          <td className="mainpage-table-cell scrollable-cell recipient-cell">{row.recipient}</td>
          <td className="mainpage-table-cell scrollable-cell">{row.links}</td>
        </tr>
      ))}
      <tr>
        <td className="mainpage-table-cell checkbox-cell"></td>
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
)

export default TableComponent