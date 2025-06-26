import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../PageStyles/MainPageCSS.css'
import supabase from '../helper/supabaseClient'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      navigate("/")
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
      <h1 style={{ marginBottom: 32, textAlign: 'center' }}>Login</h1>
      <form onSubmit={handleLogin} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          {loading ? "Logging in..." : "Login"}
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
        Don't have an account?{' '}
        <span
          style={{
            color: 'var(--supabase-green)',
            textDecoration: 'underline',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/signup')}
        >
          Sign up
        </span>
      </div>
    </div>
  )
}

export default LoginPage