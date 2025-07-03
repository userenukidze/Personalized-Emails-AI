import React from 'react'
import '../PageStyles/AddEmailsCSS.css'
import Navbar from '../Components/Navbar'
import supabase from '../helper/supabaseClient'

function AddEmails() {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [emails, setEmails] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
      if (data?.user?.id) {
        fetchEmails(data.user.id);
      }
    });
  }, []);

  async function fetchEmails(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('nylas_tokens')
      .select('id, email, provider, grant_id')
      .eq('user_id', uid);
    setLoading(false);
    if (!error && data) {
      setEmails(data);
    } else {
      setEmails([]);
    }
  }

  return (
    <div className="container">
      <Navbar />
      <div className="emails-list-section full-width">
        <h1 style={{ marginTop: 40, marginBottom: 16 }}>Your Connected Emails</h1>
        <button
          className="add-emails-btn"
          style={{ marginBottom: 24 }}
          onClick={() => {
            if (userId) {
              window.location.href = `http://localhost:3000/nylas/auth?userId=${userId}`;
            } else {
              alert('User not found. Please log in.');
            }
          }}
          disabled={!userId}
        >
          Add an Email
        </button>
        <div className="emails-row-wrapper">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {emails.length === 0 && <div>No connected emails found.</div>}
              {emails.map(emailObj => (
                <div className="email-card" key={emailObj.id}>
                  <div className="email-card-title">{emailObj.email}</div>
                  <div className="email-card-provider">{emailObj.provider}</div>
                </div>
              ))}
              <button
                className="email-card add-email-plus"
                onClick={() => {
                  if (userId) {
                    window.location.href = `http://localhost:3000/nylas/auth?userId=${userId}`;
                  } else {
                    alert('User not found. Please log in.');
                  }
                }}
                disabled={!userId}
                title="Add a new email"
              >
                +
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddEmails