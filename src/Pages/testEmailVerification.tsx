import React, { useState } from 'react'

async function verifyEmail(email: string, name?: string) {
  try {
    const response = await fetch('http://localhost:4000/email/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    const result = await response.json();
    if (response.ok) {
      alert(result.message || 'Verification email sent!');
    } else {
      alert(result.error || 'Failed to send verification email');
    }
  } catch (err) {
    alert('Request failed');
    console.error(err);
  }
}

async function sendEmail({
  to,
  fromName,
  fromEmail,
  subject,
  text,
  html,
}: {
  to: string
  fromName: string
  fromEmail: string
  subject: string
  text: string
  html?: string
}) {
  try {
    const response = await fetch('http://localhost:4000/email/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, fromName, fromEmail, subject, text, html }),
    });
    const result = await response.json();
    if (response.ok) {
      alert(result.message || 'Email sent!');
    } else {
      alert(result.error || 'Failed to send email');
    }
  } catch (err) {
    alert('Request failed');
    console.error(err);
  }
}

function TestEmailVerification() {
  // For verifyEmail
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // For sendEmail
  const [to, setTo] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    await verifyEmail(email, name);
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !fromName || !fromEmail || !subject || !text) {
      alert('Please fill in all required fields');
      return;
    }
    await sendEmail({ to, fromName, fromEmail, subject, text, html });
  };

  

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Email Verification Test</h2>
      <form onSubmit={handleVerifySubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Name (optional):</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 24px', borderRadius: 6, background: '#eee', border: '1px solid #bbb', cursor: 'pointer' }}>
          Verify Email
        </button>
      </form>

      <hr style={{ margin: '32px 0' }} />

      <h2>Send Email Test</h2>
      <form onSubmit={handleSendEmailSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>To (recipient email):</label>
          <input
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>From Name:</label>
          <input
            type="text"
            value={fromName}
            onChange={e => setFromName(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>From Email (must be verified in Brevo):</label>
          <input
            type="email"
            value={fromEmail}
            onChange={e => setFromEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Text Content:</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>HTML Content (optional):</label>
          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 24px', borderRadius: 6, background: '#eee', border: '1px solid #bbb', cursor: 'pointer' }}>
          Send Email
        </button>
      </form>

      <button onClick={() => window.location.href = 'http://localhost:4000/nylas/auth'}>
        Connect Email
      </button>
    </div>
  )
}

export default TestEmailVerification