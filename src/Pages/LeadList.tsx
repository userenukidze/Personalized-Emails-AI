import React from 'react'
import { useLocation } from 'react-router-dom'
import "../PageStyles/LeadListCSS.css"
import LeadsTable from '../Components/LeadsTable'


function LeadList() {
  const location = useLocation()
  const { id, name, description, created_at } = location.state || {}

  if (!name) {
    return (
      <div className="container" style={{ color: 'red', marginTop: 50 }}>
        No lead list data provided.
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ marginTop: 50 }}>
        {name}
      </h1>
      <div style={{ marginTop: 16, fontSize: 17 }}>
        {description}
      </div>
      <div style={{ marginTop: 16, color: "#aaa", fontSize: 14 }}>
        Created: {created_at && new Date(created_at).toLocaleString()}
      </div>
      <div style={{ marginTop: 16, color: "#aaa", fontSize: 14 }}>
        ID: {id}
      </div>

      <div className="LeadsTableContainer">
      </div>
      <LeadsTable parentLeadListId={id}/>

    </div>
  )
}

export default LeadList