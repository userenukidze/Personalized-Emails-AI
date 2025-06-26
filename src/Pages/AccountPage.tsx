import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../helper/supabaseClient';
import Navbar from '../Components/Navbar';
import '../PageStyles/AccountPageCSS.css';

function AccountPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        // Fetch display name from profile table (not students)
        const { data: profileData } = await supabase
          .from('profile')
          .select('display_name')
          .eq('id', user.id)
          .single();
        setDisplayName(profileData?.display_name || '');
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      navigate('/login');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("No user found.");
      return;
    }

    let updateError = null;

    // Update display_name in profile table
    if (displayName) {
      const { error } = await supabase
        .from('profile')
        .update({ display_name: displayName })
        .eq('id', user.id);
      if (error) updateError = error.message;
    }

    // Update display_name in Supabase Auth users table (User Metadata)
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });
    if (userUpdateError) updateError = userUpdateError.message;

    if (updateError) {
      setError(updateError);
    } else {
      setSuccess("Profile updated!");
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="account-page large">
        <h2>Account</h2>
        <div style={{ marginBottom: 24 }}>
          <strong>Email:</strong> {email}
        </div>
        <div style={{ marginBottom: 24 }}>
          <strong>Display Name:</strong> {displayName}
        </div>
        <form className="account-form" onSubmit={handleUpdate}>
          <input
            type="text"
            placeholder="Change display name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
          <button type="submit">Update Profile</button>
        </form>
        <button onClick={handleLogout}>Logout</button>
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}

export default AccountPage;