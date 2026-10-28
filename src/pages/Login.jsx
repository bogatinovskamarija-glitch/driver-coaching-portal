import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp, authError } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('login') // 'login' | 'signup'
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [sent, setSent]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setBusy(true)
    setError('')

    if (mode === 'signup') {
      const err = await signUp(email, password)
      if (err) { setError(err); setBusy(false); return }
      setSent(true)
      setBusy(false)
      return
    }

    const err = await signIn(email, password)
    if (err) setError(err)
    setBusy(false)
  }

  if (sent) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-check">✉️</div>
          <h2>Check your email</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', textAlign: 'center', marginTop: 8 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back here to sign in.
          </p>
          <button className="btn-link" onClick={() => { setSent(false); setMode('login') }}>Back to sign in</button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* Logos */}
        <div className="login-logos">
          <div className="login-logo-box carat">
            <span>◆</span>
            <span className="login-logo-name">CARAT<br/><small>EXPEDITED</small></span>
          </div>
          <div className="login-divider" />
          <div className="login-logo-box pft">
            <span className="login-logo-net">⬡</span>
            <span className="login-logo-name">PRO FREIGHT<br/><small>TRANSPORTATION</small></span>
          </div>
        </div>

        <h1 className="login-title">Driver Portal</h1>
        <p className="login-sub">Sign in with your company email</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {(error || authError) && (
            <div className="login-error">{error || authError}</div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="login-toggle">
          {mode === 'login' ? (
            <>First time? <button className="btn-link" onClick={() => setMode('signup')}>Create account</button></>
          ) : (
            <>Already have an account? <button className="btn-link" onClick={() => setMode('login')}>Sign in</button></>
          )}
        </div>

        <p className="login-footer">
          Having trouble? Contact dispatch.
        </p>
      </div>
    </div>
  )
}
