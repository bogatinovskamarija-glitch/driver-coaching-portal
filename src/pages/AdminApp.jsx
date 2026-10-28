import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AdminDashboard from './admin/AdminDashboard'
import AdminDrivers from './admin/AdminDrivers'
import AdminCoaching from './admin/AdminCoaching'
import AdminInspections from './admin/AdminInspections'
import AdminReports from './admin/AdminReports'
import AdminDocuments from './admin/AdminDocuments'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'drivers',     label: 'Drivers',     icon: '👥' },
  { id: 'coaching',    label: 'Coaching',    icon: '📋' },
  { id: 'inspections', label: 'Inspections', icon: '📞' },
  { id: 'documents',   label: 'Documents',   icon: '📁' },
  { id: 'reports',     label: 'Reports',     icon: '🖨' },
]

export default function AdminApp() {
  const { signOut } = useAuth()
  const [tab, setTab]           = useState('dashboard')
  const [resetting, setResetting] = useState(false)

  async function resetQuarter() {
    if (!window.confirm('Reset quarterly points for ALL drivers? This cannot be undone. Do this at the start of each new quarter.')) return
    setResetting(true)
    await supabase.from('driver_stats').update({ quarter_points: 0 }).gt('driver_id', '00000000-0000-0000-0000-000000000000')
    setResetting(false)
    alert('Quarter reset! All driver quarterly points are now at 0.')
  }

  return (
    <div className="admin-shell">
      {/* Top navigation */}
      <div className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-brand-icon">◆</span>
          <span>Fleet Admin</span>
        </div>
        <nav className="admin-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`admin-nav-item ${tab === n.id ? 'active' : ''}`}
              onClick={() => setTab(n.id)}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="admin-signout"
            onClick={resetQuarter}
            disabled={resetting}
            title="Reset quarterly points for all drivers"
            style={{ background: 'rgba(245,158,11,.15)', color: 'var(--amber)', borderColor: 'rgba(245,158,11,.3)' }}
          >
            {resetting ? '…' : '🔄 New Quarter'}
          </button>
          <button className="admin-signout" onClick={signOut} title="Sign out">
            Sign Out ⎋
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="admin-page">
        {tab === 'dashboard'   && <AdminDashboard />}
        {tab === 'drivers'     && <AdminDrivers />}
        {tab === 'coaching'    && <AdminCoaching />}
        {tab === 'inspections' && <AdminInspections />}
        {tab === 'documents'   && <AdminDocuments />}
        {tab === 'reports'     && <AdminReports />}
      </div>
    </div>
  )
}
