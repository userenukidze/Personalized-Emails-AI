import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../PageStyles/MainPageCSS.css'
import supabase from '../helper/supabaseClient'

function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name : username }
      }
    })
    if (error) {
      setError(error.message)
    } else {
      navigate("/")
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
      <h1 style={{ marginBottom: 32, textAlign: 'center' }}>Sign Up</h1>
      <form onSubmit={handleSignup} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input
          className="mainpage-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ fontSize: 16 }}
        />
        <input
          className="mainpage-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ fontSize: 16 }}
        />
        <input
          className="mainpage-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ fontSize: 16 }}
        />
        <button
          className="mainpage-save-btn"
          type="submit"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
      </form>

      <div
        style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 15,
          color: 'var(--text-main)'
        }}
      >
        Already have an account?{' '}
        <span
          style={{
            color: 'var(--supabase-green)',
            textDecoration: 'underline',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/login')}
        >
          Log in
        </span>
      </div>
      
    </div>
  )
}

export default SignupPage