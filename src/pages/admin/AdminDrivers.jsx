import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchAllDrivers } from '../../lib/clickup'

export default function AdminDrivers() {
  const [drivers, setDrivers]     = useState([])
  const [supaDrivers, setSupaDrivers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [selected, setSelected]   = useState(null)
  const [stats, setStats]         = useState({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [clickupList, { data: dbDrivers }, { data: dbStats }] = await Promise.all([
      fetchAllDrivers(),
      supabase.from('drivers').select('*').eq('is_active', true),
      supabase.from('driver_stats').select('*'),
    ])

    const statsMap = {}
    for (const s of (dbStats ?? [])) statsMap[s.driver_id] = s
    setStats(statsMap)
    setDrivers(clickupList ?? [])
    setSupaDrivers(dbDrivers ?? [])
    setLoading(false)
  }

  const filtered = drivers.filter(d => {
    const matchSearch = !search || d.name?.toLowerCase().includes(search.toLowerCase())
      || d.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.company === filter
    return matchSearch && matchFilter
  })

  function matchSupa(d) {
    return supaDrivers.find(sd => sd.email === d.email)
  }

  if (loading) return <div className="page-loader">Loading drivers…</div>

  if (selected) {
    const sd     = matchSupa(selected)
    const dStats = sd ? stats[sd.id] : null
    return (
      <div className="admin-driver-detail">
        <button className="back-btn" onClick={() => setSelected(null)}>← Back to Drivers</button>

        <div className="driver-detail-header">
          <div className="driver-detail-avatar">
            {selected.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h2>{selected.name}</h2>
            <div className="driver-detail-meta">
              {selected.email} · {selected.company === 'carat' ? '◆ Carat Expedited' : '⬡ Pro Freight'}
            </div>
          </div>
        </div>

        <div className="detail-grid">
          {/* Gamification stats */}
          <div className="detail-section">
            <div className="detail-section-title">Performance</div>
            {dStats ? (
              <div className="detail-stats">
                <div className="detail-stat"><span>{dStats.total_points?.toLocaleString() ?? 0}</span><small>Total Points</small></div>
                <div className="detail-stat"><span>🔥 {dStats.current_streak ?? 0}</span><small>Current Streak</small></div>
                <div className="detail-stat"><span>{dStats.longest_streak ?? 0}</span><small>Best Streak</small></div>
                <div className="detail-stat"><span>{dStats.modules_completed ?? 0}</span><small>Modules Done</small></div>
              </div>
            ) : (
              <p className="empty-state">Driver hasn't logged in yet.</p>
            )}
          </div>

          {/* Credentials */}
          <div className="detail-section">
            <div className="detail-section-title">Credentials</div>
            <div className="detail-creds">
              <div className="detail-cred-row">
                <span>CDL</span>
                <span className={selected.cdlDaysLeft !== null && selected.cdlDaysLeft < 30 ? 'text-red' : selected.cdlDaysLeft !== null && selected.cdlDaysLeft < 60 ? 'text-amber' : 'text-green'}>
                  {selected.cdlDaysLeft !== null ? `${selected.cdlDaysLeft}d remaining` : '—'}
                </span>
              </div>
              <div className="detail-cred-row">
                <span>Med Cert</span>
                <span className={selected.medDaysLeft !== null && selected.medDaysLeft < 30 ? 'text-red' : selected.medDaysLeft !== null && selected.medDaysLeft < 60 ? 'text-amber' : 'text-green'}>
                  {selected.medDaysLeft !== null ? `${selected.medDaysLeft}d remaining` : '—'}
                </span>
              </div>
              <div className="detail-cred-row">
                <span>MVR</span>
                <span>{selected.mvr ? '✅ On file' : '—'}</span>
              </div>
              <div className="detail-cred-row">
                <span>PSP</span>
                <span>{selected.psp ? '✅ On file' : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {selected.driveFolder && (
          <a className="driver-folder-btn" href={selected.driveFolder} target="_blank" rel="noopener noreferrer">
            📁 Open Driver Folder in Drive
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="admin-drivers">
      {/* Filters */}
      <div className="admin-drivers-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Search drivers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="admin-filter-row">
          {['all', 'carat', 'pft'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'carat' ? '◆ Carat' : '⬡ PFT'}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>CDL</th>
              <th>Med Cert</th>
              <th>Points</th>
              <th>Streak</th>
              <th>Portal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => {
              const sd     = matchSupa(d)
              const dStats = sd ? stats[sd.id] : null
              return (
                <tr key={d.id ?? i} className="clickable-row" onClick={() => setSelected(d)}>
                  <td>{d.name}</td>
                  <td>
                    <span className={`company-badge ${d.company}`}>
                      {d.company === 'carat' ? '◆ Carat' : '⬡ PFT'}
                    </span>
                  </td>
                  <td>
                    <span className={d.cdlDaysLeft !== null && d.cdlDaysLeft < 30 ? 'text-red' : d.cdlDaysLeft !== null && d.cdlDaysLeft < 60 ? 'text-amber' : ''}>
                      {d.cdlDaysLeft !== null ? `${d.cdlDaysLeft}d` : '—'}
                    </span>
                    {d.cdlExpiry?.display && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{d.cdlExpiry.display}</div>}
                  </td>
                  <td>
                    <span className={d.medDaysLeft !== null && d.medDaysLeft < 30 ? 'text-red' : d.medDaysLeft !== null && d.medDaysLeft < 60 ? 'text-amber' : ''}>
                      {d.medDaysLeft !== null ? `${d.medDaysLeft}d` : '—'}
                    </span>
                    {d.medCert?.display && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{d.medCert.display}</div>}
                  </td>
                  <td>{dStats?.total_points?.toLocaleString() ?? '—'}</td>
                  <td>{dStats ? `🔥 ${dStats.current_streak ?? 0}` : '—'}</td>
                  <td>{sd ? '✅' : <span className="text-muted">No account</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="empty-state">No drivers found.</p>}
      </div>
    </div>
  )
}
