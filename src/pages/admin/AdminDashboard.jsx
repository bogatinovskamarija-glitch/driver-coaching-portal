import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchAllDrivers, fetchAllEquipment } from '../../lib/clickup'

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color: accent }}>{value}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function expiryClass(days) {
  if (days === null || days === undefined) return 'expiry-green'
  if (days < 0)   return 'expiry-red'
  if (days <= 7)  return 'expiry-red'
  if (days <= 30) return 'expiry-amber'
  return 'expiry-green'
}

function ExpiryRow({ label, name, daysLeft, display, company }) {
  const cls = expiryClass(daysLeft)
  const txt = daysLeft < 0 ? 'EXPIRED' : display ?? `${daysLeft}d`
  return (
    <div className="admin-expiry-row">
      <div className="admin-expiry-name">{name}</div>
      <div className="admin-expiry-doc">{label}</div>
      <div className="admin-expiry-company">{company?.toUpperCase()}</div>
      <div className={`admin-expiry-badge ${cls}`}>{txt}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [drivers, setDrivers]       = useState([])
  const [equipment, setEquipment]   = useState({ trucks: [], trailers: [] })
  const [activity, setActivity]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all') // 'all' | 'carat' | 'pft'

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [driverList, equip, { data: logs }] = await Promise.all([
      fetchAllDrivers(),
      fetchAllEquipment(),
      supabase
        .from('pre_trip_logs')
        .select('id, driver_id, has_issues, completed_at, drivers(name, company_id)')
        .order('completed_at', { ascending: false })
        .limit(20),
    ])
    setDrivers(driverList ?? [])
    setEquipment(equip ?? { trucks: [], trailers: [] })
    setActivity(logs ?? [])
    setLoading(false)
  }

  if (loading) return <div className="page-loader">Loading fleet data…</div>

  const filtered = filter === 'all' ? drivers : drivers.filter(d => d.company === filter)

  // KPIs
  const totalDrivers   = filtered.length
  const expiringCDL    = filtered.filter(d => d.cdlDaysLeft !== null && d.cdlDaysLeft < 60).length
  const expiringMed    = filtered.filter(d => d.medDaysLeft !== null && d.medDaysLeft < 60).length
  const expiringReg    = equipment.trucks.filter(t => t.regDaysLeft !== null && t.regDaysLeft < 60).length

  // Expiry list (all docs expiring within 60 days)
  const expiringItems = [
    ...filtered
      .filter(d => d.cdlDaysLeft !== null && d.cdlDaysLeft < 60)
      .map(d => ({ label: 'CDL', name: d.name, daysLeft: d.cdlDaysLeft, display: d.cdlExpiry?.display, company: d.company })),
    ...filtered
      .filter(d => d.medDaysLeft !== null && d.medDaysLeft < 60)
      .map(d => ({ label: 'Med Cert', name: d.name, daysLeft: d.medDaysLeft, display: d.medCert?.display, company: d.company })),
    ...equipment.trucks
      .filter(t => t.regDaysLeft !== null && t.regDaysLeft < 60)
      .map(t => ({ label: 'Truck Reg', name: t.name, daysLeft: t.regDaysLeft, display: t.registration?.display, company: t.company ?? '—' })),
    ...equipment.trucks
      .filter(t => t.irpDaysLeft !== null && t.irpDaysLeft < 60)
      .map(t => ({ label: 'Truck IRP', name: t.name, daysLeft: t.irpDaysLeft, display: null, company: t.company ?? '—' })),
    ...equipment.trailers
      .filter(t => t.irpDaysLeft !== null && t.irpDaysLeft < 60)
      .map(t => ({ label: 'Trailer IRP', name: t.name, daysLeft: t.irpDaysLeft, display: null, company: t.company ?? '—' })),
  ].sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999))

  return (
    <div className="admin-dashboard">
      {/* Company filter */}
      <div className="admin-filter-row">
        {['all', 'carat', 'pft'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Companies' : f === 'carat' ? '◆ Carat' : '⬡ Pro Freight'}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <KpiCard label="Drivers" value={totalDrivers} accent="#60A5FA" />
        <KpiCard label="CDL Expiring" value={expiringCDL} accent={expiringCDL > 0 ? '#EF4444' : '#22C55E'} sub="< 60 days" />
        <KpiCard label="Med Cert" value={expiringMed} accent={expiringMed > 0 ? '#EF4444' : '#22C55E'} sub="< 60 days" />
        <KpiCard label="Reg/IRP" value={expiringReg} accent={expiringReg > 0 ? '#F59E0B' : '#22C55E'} sub="< 60 days" />
      </div>

      {/* Expiry alerts */}
      {expiringItems.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-title">⚠️ Documents Expiring Soon</div>
          <div className="admin-expiry-list">
            {expiringItems.slice(0, 20).map((item, i) => (
              <ExpiryRow key={i} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Driver table */}
      <div className="admin-section">
        <div className="admin-section-title">Driver Roster</div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>CDL</th>
                <th>Med Cert</th>
                <th>Truck</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>
                    <span className={`company-badge ${d.company}`}>
                      {d.company === 'carat' ? '◆ Carat' : '⬡ PFT'}
                    </span>
                  </td>
                  <td>
                    {d.cdlExpiry?.display
                      ? <span className={`expiry-inline ${expiryClass(d.cdlDaysLeft)}`}>{d.cdlDaysLeft < 0 ? 'EXPIRED' : d.cdlExpiry.display}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {d.medCert?.display
                      ? <span className={`expiry-inline ${expiryClass(d.medDaysLeft)}`}>{d.medDaysLeft < 0 ? 'EXPIRED' : d.medCert.display}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>{d.truckTaskId ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Points system reference */}
      <details className="admin-section points-ref">
        <summary className="admin-section-title points-ref-summary">
          🏆 Points System Reference <span className="points-ref-toggle-hint">(click to expand)</span>
        </summary>
        <div className="points-ref-body">
          <div className="points-ref-cols">
            <div className="points-ref-col">
              <div className="points-ref-col-title earn">⬆ Earning Points</div>
              <table className="points-ref-table">
                <tbody>
                  <tr><td>Daily pre-trip inspection</td><td className="pts earn">+10</td></tr>
                  <tr><td>7-day pre-trip streak</td><td className="pts earn">+100</td></tr>
                  <tr><td>30-day pre-trip streak</td><td className="pts earn">+300</td></tr>
                  <tr><td>Training module (base)</td><td className="pts earn">+30–50</td></tr>
                  <tr><td>On-time assignment bonus</td><td className="pts earn">+25</td></tr>
                  <tr><td>DOT clean inspection</td><td className="pts earn">+75</td></tr>
                </tbody>
              </table>
            </div>
            <div className="points-ref-col">
              <div className="points-ref-col-title deduct">⬇ Deductions</div>
              <table className="points-ref-table">
                <tbody>
                  <tr><td>DOT minor violations</td><td className="pts neutral">0</td></tr>
                  <tr><td>DOT major violations</td><td className="pts deduct">−50</td></tr>
                  <tr><td>DOT critical violations</td><td className="pts deduct">−100</td></tr>
                  <tr><td>DOT Out of Service (OOS)</td><td className="pts deduct">−150</td></tr>
                  <tr><td>Overdue training penalty</td><td className="pts deduct">−25</td></tr>
                </tbody>
              </table>
            </div>
            <div className="points-ref-col">
              <div className="points-ref-col-title reward">🎁 Quarterly Reward</div>
              <div className="points-ref-reward-box">
                <div className="reward-target">#1 Driver</div>
                <div className="reward-equals">wins $500</div>
                <div className="reward-note">The driver ranked #1 at the end of the quarter earns the $500 bonus. Reset all quarter points via "🔄 New Quarter" in Driver Management.</div>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Recent activity */}
      <div className="admin-section">
        <div className="admin-section-title">Recent Pre-Trips</div>
        <div className="activity-list">
          {activity.map(log => {
            const when = new Date(log.completed_at)
            const label = when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const time  = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={log.id} className={`activity-row ${log.has_issues ? 'has-issues' : ''}`}>
                <div className="activity-icon">{log.has_issues ? '⚠️' : '✅'}</div>
                <div className="activity-info">
                  <div className="activity-name">{log.drivers?.name ?? 'Unknown'}</div>
                  <div className="activity-meta">
                    {label} at {time} · {log.drivers?.company_id?.toUpperCase() ?? ''}
                    {log.has_issues && <span className="activity-issue-tag">Issues flagged</span>}
                  </div>
                </div>
              </div>
            )
          })}
          {activity.length === 0 && <p className="empty-state">No pre-trips yet.</p>}
        </div>
      </div>
    </div>
  )
}
