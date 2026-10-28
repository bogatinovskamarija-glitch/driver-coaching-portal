import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, authError } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setBusy(true)
    setError('')
    const err = await signIn(email, password)
    if (err) setError(err)
    setBusy(false)
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
              autoComplete="current-password"
              required
            />
            <p className="login-hint">Drivers: your password is your truck number (e.g. 101)</p>
          </div>

          {(error || authError) && (
            <div className="login-error">{error || authError}</div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Having trouble? Contact dispatch.
        </p>
      </div>
    </div>
  )
}
