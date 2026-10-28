import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Dashboard from './driver/Dashboard'
import PreTrip from './driver/PreTrip'
import Training from './driver/Training'
import Documents from './driver/Docs'
import Leaderboard from './driver/Leaderboard'

const NAV = [
  { id: 'home',        icon: '🏠', label: 'Home' },
  { id: 'pretip',      icon: '✅', label: 'Pre-Trip' },
  { id: 'training',    icon: '📚', label: 'Training' },
  { id: 'docs',        icon: '📁', label: 'Docs' },
  { id: 'leaderboard', icon: '🏆', label: 'Ranks' },
]

export default function DriverApp() {
  const { driver, signOut } = useAuth()
  const [tab, setTab] = useState('home')

  // Company theme
  const isCarat = driver?.company_id === 'carat'
  const accent  = isCarat ? '#D4AF37' : '#60A5FA'
  const companyName = isCarat ? 'Carat Expedited' : 'Pro Freight'

  return (
    <div className="driver-shell" style={{ '--accent': accent }}>
      {/* Top bar */}
      <div className="driver-topbar">
        <div className="driver-topbar-brand">
          {isCarat ? '◆' : '⬡'}
          <span>{companyName}</span>
        </div>
        <button className="icon-btn" onClick={signOut} title="Sign out">⎋</button>
      </div>

      {/* Page content */}
      <div className="driver-page">
        {tab === 'home'        && <Dashboard onNav={setTab} />}
        {tab === 'pretip'      && <PreTrip onBack={() => setTab('home')} />}
        {tab === 'training'    && <Training />}
        {tab === 'docs'        && <Documents />}
        {tab === 'leaderboard' && <Leaderboard />}
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item ${tab === n.id ? 'active' : ''}`}
            onClick={() => setTab(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
