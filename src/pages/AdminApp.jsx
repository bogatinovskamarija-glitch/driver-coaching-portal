import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminDashboard from './admin/AdminDashboard'
import AdminDrivers from './admin/AdminDrivers'
import AdminCoaching from './admin/AdminCoaching'
import AdminInspections from './admin/AdminInspections'
import AdminReports from './admin/AdminReports'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',   icon: '📊' },
  { id: 'drivers',     label: 'Drivers',     icon: '👥' },
  { id: 'coaching',    label: 'Coaching',    icon: '📋' },
  { id: 'inspections', label: 'Inspections', icon: '📞' },
  { id: 'reports',     label: 'Reports',     icon: '🖨' },
]

export default function AdminApp() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('dashboard')

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
        <button className="admin-signout" onClick={signOut} title="Sign out">
          Sign Out ⎋
        </button>
      </div>

      {/* Page content */}
      <div className="admin-page">
        {tab === 'dashboard'   && <AdminDashboard />}
        {tab === 'drivers'     && <AdminDrivers />}
        {tab === 'coaching'    && <AdminCoaching />}
        {tab === 'inspections' && <AdminInspections />}
        {tab === 'reports'     && <AdminReports />}
      </div>
    </div>
  )
}
