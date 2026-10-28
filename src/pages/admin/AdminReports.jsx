import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function monthStart(offset = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().split('T')[0]
}

function fmtMonth(iso) {
  const [y, m] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminReports() {
  const [period,   setPeriod]   = useState('month')   // 'month' | 'quarter'
  const [month,    setMonth]    = useState(monthStart(0))
  const [company,  setCompany]  = useState('all')
  const [drivers,  setDrivers]  = useState([])
  const [sessions, setSessions] = useState([])
  const [inspections, setInsp]  = useState([])
  const [stats,    setStats]    = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => { loadData() }, [period, month, company])

  async function loadData() {
    setLoading(true)

    const [y, m] = month.split('-').map(Number)
    let fromDate, toDate
    if (period === 'month') {
      fromDate = month
      toDate   = new Date(y, m, 0).toISOString().split('T')[0]
    } else {
      const qStart = Math.floor((m - 1) / 3) * 3
      fromDate = `${y}-${String(qStart + 1).padStart(2,'0')}-01`
      toDate   = new Date(y, qStart + 3, 0).toISOString().split('T')[0]
    }

    const driverQ = supabase
      .from('drivers')
      .select('id, name, email, company_id, driver_stats(*)')
      .eq('is_admin', false)
      .eq('is_active', true)
    if (company !== 'all') driverQ.eq('company_id', company)

    const [drv, sess, insp] = await Promise.all([
      driverQ,
      supabase.from('coaching_sessions')
        .select('*, drivers(name, company_id)')
        .gte('month', fromDate)
        .lte('month', toDate),
      supabase.from('phone_inspections')
        .select('*, drivers(name, company_id)')
        .gte('inspection_date', fromDate)
        .lte('inspection_date', toDate),
    ])

    let drvData = drv.data ?? []
    if (company !== 'all') drvData = drvData.filter(d => d.company_id === company)
    setDrivers(drvData)
    setSessions(sess.data ?? [])
    setInsp(insp.data ?? [])
    setLoading(false)
  }

  const coachedIds  = new Set(sessions.map(s => s.driver_id))
  const inspectedIds = new Set(inspections.map(i => i.driver_id))
  const coachRate   = drivers.length ? Math.round(coachedIds.size / drivers.length * 100) : 0
  const inspRate    = drivers.length ? Math.round(inspectedIds.size / drivers.length * 100) : 0
  const passedInsp  = inspections.filter(i => i.overall_status === 'pass').length
  const flaggedInsp = inspections.filter(i => i.overall_status === 'flag').length
  const failedInsp  = inspections.filter(i => i.overall_status === 'fail').length

  const sortedDrivers = [...drivers].sort((a,b) =>
    (b.driver_stats?.[0]?.total_points ?? 0) - (a.driver_stats?.[0]?.total_points ?? 0)
  )

  const periodLabel = period === 'month'
    ? fmtMonth(month)
    : `Q${Math.ceil(Number(month.split('-')[1]) / 3)} ${month.split('-')[0]}`

  return (
    <div className="report-wrap">
      {/* Controls — hidden on print */}
      <div className="report-controls no-print">
        <select className="cf-input" style={{ width: 'auto' }} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
        </select>
        <input type="month" className="cf-input" style={{ width: 'auto' }}
          value={month.slice(0,7)}
          onChange={e => setMonth(e.target.value + '-01')} />
        <select className="cf-input" style={{ width: 'auto' }} value={company} onChange={e => setCompany(e.target.value)}>
          <option value="all">All Companies</option>
          <option value="carat">Carat Expedited</option>
          <option value="pft">Pro Freight Transportation</option>
        </select>
        <button className="btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
      </div>

      {/* PRINTABLE REPORT */}
      <div className="report-doc">
        <div className="report-header">
          <div className="report-logo">◆ FLEET PORTAL</div>
          <div>
            <div className="report-title">Safety & Coaching Report</div>
            <div className="report-period">{periodLabel} · {company === 'all' ? 'All Companies' : company === 'carat' ? 'Carat Expedited INC' : 'Pro Freight Transportation INC'}</div>
          </div>
          <div className="report-date">Generated: {new Date().toLocaleDateString()}</div>
        </div>

        {/* KPI row */}
        <div className="report-kpi-row">
          <div className="report-kpi">
            <div className="report-kpi-num">{drivers.length}</div>
            <div className="report-kpi-lbl">Active Drivers</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-num" style={{ color: coachRate >= 80 ? '#22c55e' : coachRate >= 50 ? '#f59e0b' : '#ef4444' }}>
              {coachRate}%
            </div>
            <div className="report-kpi-lbl">Coaching Rate</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-num" style={{ color: inspRate >= 80 ? '#22c55e' : inspRate >= 50 ? '#f59e0b' : '#ef4444' }}>
              {inspRate}%
            </div>
            <div className="report-kpi-lbl">Inspection Rate</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-num">{passedInsp}/{inspections.length || '—'}</div>
            <div className="report-kpi-lbl">Inspections Passed</div>
          </div>
        </div>

        {/* Coaching summary */}
        <div className="report-section">
          <div className="report-section-title">Coaching Sessions — {periodLabel}</div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Driver</th><th>Company</th><th>Date</th>
                <th>Motive</th><th>Speed</th><th>Braking</th><th>Corner</th><th>HOS</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.map(d => {
                const s = sessions.find(ss => ss.driver_id === d.id)
                return (
                  <tr key={d.id} className={s ? '' : 'report-row-missing'}>
                    <td>{d.name}</td>
                    <td>{d.company_id === 'carat' ? 'Carat' : 'PFT'}</td>
                    <td>{s ? fmtDate(s.coached_date) : <span className="report-missing">Not coached</span>}</td>
                    <td className="report-bool">{s ? (s.motive_coached ? '✓' : '—') : ''}</td>
                    <td className="report-bool">{s ? (s.speeding ? '✓' : '—') : ''}</td>
                    <td className="report-bool">{s ? (s.hard_braking ? '✓' : '—') : ''}</td>
                    <td className="report-bool">{s ? (s.cornering ? '✓' : '—') : ''}</td>
                    <td className="report-bool">{s ? (s.hos_coached ? '✓' : '—') : ''}</td>
                    <td className="report-notes">{s?.general_notes ?? ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Inspection summary */}
        <div className="report-section">
          <div className="report-section-title">Phone Inspections — {periodLabel}</div>
          {inspections.length === 0 ? (
            <div className="report-empty">No inspections recorded for this period.</div>
          ) : (
            <table className="report-table">
              <thead>
                <tr><th>Driver</th><th>Date</th><th>Status</th><th>Follow-up</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {inspections.map(i => (
                  <tr key={i.id}>
                    <td>{i.drivers?.name ?? '—'}</td>
                    <td>{fmtDate(i.inspection_date)}</td>
                    <td>
                      <span className={`status-pill status-${i.overall_status}`}>
                        {i.overall_status}
                      </span>
                    </td>
                    <td>{i.follow_up_date ? fmtDate(i.follow_up_date) : '—'}</td>
                    <td className="report-notes">{i.follow_up_notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Leaderboard */}
        <div className="report-section">
          <div className="report-section-title">Driver Points Leaderboard</div>
          <table className="report-table">
            <thead>
              <tr><th>#</th><th>Driver</th><th>Company</th><th>Points</th><th>Streak</th><th>Modules</th><th>Toward $100</th></tr>
            </thead>
            <tbody>
              {sortedDrivers.map((d, i) => {
                const s = d.driver_stats?.[0] ?? {}
                const pct = Math.min(100, Math.round((s.total_points ?? 0) / 10))
                return (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td>{d.name}</td>
                    <td>{d.company_id === 'carat' ? 'Carat' : 'PFT'}</td>
                    <td><strong>{(s.total_points ?? 0).toLocaleString()}</strong></td>
                    <td>{s.current_streak ?? 0} days</td>
                    <td>{s.modules_completed ?? 0}</td>
                    <td>
                      <div className="report-progress-bar">
                        <div className="report-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 11 }}>{pct}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="report-footer">
          Carat Expedited INC / Pro Freight Transportation INC — Confidential
        </div>
      </div>
    </div>
  )
}
