import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { fetchAllDrivers } from '../../lib/clickup'
import { useAuth } from '../../context/AuthContext'

function daysLeft(dueDate) {
  if (!dueDate) return null
  const diff = new Date(dueDate + 'T12:00:00') - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function expiryClass(days) {
  if (days === null) return ''
  if (days < 0)  return 'text-red'    // expired
  if (days <= 7) return 'text-red'    // expires this week
  if (days <= 30) return 'text-amber' // expires this month
  return ''                           // fine
}

function ExpiryCell({ days, display }) {
  if (!display) return <span className="text-muted">—</span>
  const cls = expiryClass(days)
  const label = days !== null && days < 0 ? 'EXPIRED' : display
  return <span className={cls} style={{ fontSize: 12, fontWeight: cls ? 600 : 400 }}>{label}</span>
}

function AssignmentBadge({ status, due }) {
  const dl = daysLeft(due)
  const isOverdue = dl !== null && dl < 0
  if (status === 'completed') return <span className="assign-badge done">✓ Done</span>
  if (isOverdue) return <span className="assign-badge overdue">Overdue</span>
  if (dl !== null && dl <= 3) return <span className="assign-badge urgent">Due in {dl}d</span>
  if (dl !== null) return <span className="assign-badge pending">{dl}d left</span>
  return <span className="assign-badge pending">Pending</span>
}

const DOT_RESULTS = [
  { value: 'clean',    label: 'Clean — No Violations',    pts: 75,   color: '#22c55e' },
  { value: 'minor',   label: 'Minor Violations',          pts: 0,    color: '#f59e0b' },
  { value: 'major',   label: 'Major Violations',          pts: -50,  color: '#ef4444' },
  { value: 'critical',label: 'Critical Violations',       pts: -100, color: '#dc2626' },
  { value: 'oos',     label: 'Out of Service (OOS)',      pts: -150, color: '#7c2d12' },
]

const OVERDUE_PENALTY = -25

const ALERT_TYPES = [
  { value: 'drug_test',    label: 'Random Drug Test',    icon: '🧪', color: '#ef4444' },
  { value: 'alcohol_test', label: 'Random Alcohol Test', icon: '🍺', color: '#f97316' },
  { value: 'custom',       label: 'Custom Alert',        icon: '⚠️', color: '#f59e0b' },
]

function AlertsSection({ driverId, adminDriver }) {
  const [alerts, setAlerts]   = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({ type: 'drug_test', title: '', message: '', priority: 'high' })

  useEffect(() => { if (driverId) load() }, [driverId])

  async function load() {
    const { data } = await supabase
      .from('driver_alerts')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    setAlerts(data ?? [])
  }

  async function save() {
    if (!driverId) return
    setSaving(true)
    const typeInfo = ALERT_TYPES.find(t => t.value === form.type)
    const title = form.type !== 'custom' ? typeInfo.label : form.title.trim()
    if (!title) { setSaving(false); return }
    await supabase.from('driver_alerts').insert({
      driver_id:  driverId,
      type:       form.type,
      title,
      message:    form.message.trim() || null,
      priority:   form.priority,
      created_by: adminDriver?.id,
    })
    setForm({ type: 'drug_test', title: '', message: '', priority: 'high' })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function deleteAlert(id) {
    await supabase.from('driver_alerts').delete().eq('id', id)
    await load()
  }

  const active   = alerts.filter(a => !a.acknowledged_at)
  const resolved = alerts.filter(a => a.acknowledged_at)

  return (
    <div className="detail-section" style={{ marginTop: 20 }}>
      <div className="cf-actions" style={{ marginBottom: 12 }}>
        <div className="detail-section-title" style={{ fontSize: 13 }}>Driver Alerts</div>
        <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowForm(v => !v)}>
          + Add Alert
        </button>
      </div>

      {showForm && (
        <div className="assign-form">
          <div className="cf-row">
            <label className="cf-label">Alert Type</label>
            <select className="cf-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          {form.type === 'custom' && (
            <div className="cf-row">
              <label className="cf-label">Alert Title *</label>
              <input className="cf-input" placeholder="e.g. Missing paperwork, Schedule change"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          )}
          <div className="cf-row">
            <label className="cf-label">Message / Instructions (shown to driver)</label>
            <input className="cf-input" placeholder="e.g. Report to dispatch office before your next trip"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <div className="cf-actions">
            <span className="cf-topics-count">Driver sees this alert until they acknowledge it</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-link" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || (form.type === 'custom' && !form.title.trim())}>
                {saving ? 'Sending…' : 'Send Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <p className="empty-state">No active alerts for this driver.</p>
      )}

      {active.map(a => {
        const typeInfo = ALERT_TYPES.find(t => t.value === a.type) ?? ALERT_TYPES[2]
        return (
          <div key={a.id} className="assign-row" style={{ borderLeft: `3px solid ${typeInfo.color}` }}>
            <div className="assign-row-info">
              <div className="assign-row-title" style={{ color: typeInfo.color }}>
                {typeInfo.icon} {a.title}
              </div>
              {a.message && <div className="assign-row-reason">"{a.message}"</div>}
              <div className="assign-row-meta">
                Sent {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}
                <span style={{ color: '#f59e0b' }}>Pending acknowledgement</span>
              </div>
            </div>
            <button className="maint-done-btn" style={{ fontSize: 11 }} onClick={() => deleteAlert(a.id)}>✕ Remove</button>
          </div>
        )
      })}

      {resolved.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
            {resolved.length} acknowledged alert{resolved.length !== 1 ? 's' : ''}
          </summary>
          {resolved.map(a => {
            const typeInfo = ALERT_TYPES.find(t => t.value === a.type) ?? ALERT_TYPES[2]
            return (
              <div key={a.id} className="assign-row" style={{ opacity: .5 }}>
                <div className="assign-row-info">
                  <div className="assign-row-title">{typeInfo.icon} {a.title}</div>
                  <div className="assign-row-meta">
                    Acknowledged {new Date(a.acknowledged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <span className="assign-badge done">✓ Ack</span>
              </div>
            )
          })}
        </details>
      )}
    </div>
  )
}

function DOTSection({ driverId, adminDriver }) {
  const [inspections, setInspections] = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [form, setForm] = useState({ result: 'clean', inspection_date: new Date().toISOString().split('T')[0], violations: '', notes: '' })

  useEffect(() => { if (driverId) load() }, [driverId])

  async function load() {
    const { data } = await supabase
      .from('dot_inspections')
      .select('*')
      .eq('driver_id', driverId)
      .order('inspection_date', { ascending: false })
    setInspections(data ?? [])
  }

  async function save() {
    if (!driverId) return
    setSaving(true)
    const res     = DOT_RESULTS.find(r => r.value === form.result)
    const ptsDelta = res?.pts ?? 0

    await supabase.from('dot_inspections').insert({
      driver_id:       driverId,
      inspection_date: form.inspection_date,
      result:          form.result,
      violations:      form.violations || null,
      notes:           form.notes || null,
      points_change:   ptsDelta,
      logged_by:       adminDriver?.id,
    })

    if (ptsDelta !== 0) {
      await supabase.from('points_ledger').insert({
        driver_id: driverId,
        points:    ptsDelta,
        reason:    `DOT Roadside Inspection — ${res?.label}`,
        category:  'dot_inspection',
      })
      // Fetch and update stats
      const { data: st } = await supabase.from('driver_stats').select('total_points,quarter_points').eq('driver_id', driverId).single()
      if (st) {
        await supabase.from('driver_stats').update({
          total_points:   Math.max(0, (st.total_points ?? 0) + ptsDelta),
          quarter_points: Math.max(0, (st.quarter_points ?? 0) + ptsDelta),
        }).eq('driver_id', driverId)
      }
    }

    setForm({ result: 'clean', inspection_date: new Date().toISOString().split('T')[0], violations: '', notes: '' })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  const selectedResult = DOT_RESULTS.find(r => r.value === form.result)

  return (
    <div className="detail-section" style={{ marginTop: 20 }}>
      <div className="cf-actions" style={{ marginBottom: 12 }}>
        <div className="detail-section-title" style={{ fontSize: 13 }}>DOT Roadside Inspections</div>
        <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowForm(v => !v)}>
          + Log Inspection
        </button>
      </div>

      {showForm && (
        <div className="assign-form">
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="cf-row" style={{ flex: 1 }}>
              <label className="cf-label">Date</label>
              <input type="date" className="cf-input" value={form.inspection_date}
                onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
            </div>
            <div className="cf-row" style={{ flex: 2 }}>
              <label className="cf-label">Result</label>
              <select className="cf-input" value={form.result}
                onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
                {DOT_RESULTS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          {form.result !== 'clean' && (
            <div className="cf-row">
              <label className="cf-label">Violations / Description</label>
              <input className="cf-input" placeholder="e.g. Brake adjustment out of service, tire tread below minimum"
                value={form.violations} onChange={e => setForm(f => ({ ...f, violations: e.target.value }))} />
            </div>
          )}
          <div className="cf-row">
            <label className="cf-label">Notes</label>
            <input className="cf-input" placeholder="Optional internal notes"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="cf-actions">
            <span className="cf-topics-count" style={{ color: selectedResult?.color }}>
              {selectedResult?.pts > 0 ? `+${selectedResult.pts}` : selectedResult?.pts} pts
              {selectedResult?.pts > 0 ? ' awarded to driver' : selectedResult?.pts < 0 ? ' deducted from driver' : ' — no points change'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-link" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Log Inspection'}</button>
            </div>
          </div>
        </div>
      )}

      {inspections.length === 0 && !showForm && (
        <p className="empty-state">No DOT inspections logged yet.</p>
      )}

      {inspections.map(ins => {
        const res = DOT_RESULTS.find(r => r.value === ins.result)
        return (
          <div key={ins.id} className="assign-row">
            <div className="assign-row-info">
              <div className="assign-row-title" style={{ color: res?.color }}>
                {res?.label ?? ins.result}
              </div>
              {ins.violations && <div className="assign-row-reason">"{ins.violations}"</div>}
              <div className="assign-row-meta">
                {new Date(ins.inspection_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {ins.notes && ` · ${ins.notes}`}
              </div>
            </div>
            <span className="assign-badge" style={{
              background: (res?.pts ?? 0) > 0 ? 'rgba(34,197,94,.15)' : (res?.pts ?? 0) < 0 ? 'rgba(239,68,68,.15)' : 'var(--bg-3)',
              color: res?.color,
            }}>
              {ins.points_change > 0 ? `+${ins.points_change}` : ins.points_change} pts
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DriverDetail({ selected, sd, dStats, adminDriver, onBack }) {
  const [assignments, setAssignments] = useState([])
  const [modules, setModules]         = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm] = useState({ module_id: '', reason: '', due_date: '', points_bonus: 25 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sd?.id) loadAssignments(sd.id)
    loadModules()
  }, [sd])

  async function loadAssignments(driverId) {
    const { data } = await supabase
      .from('training_assignments')
      .select('*, coaching_modules(title, category, points_value, duration_minutes)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    setAssignments(data ?? [])
  }

  async function loadModules() {
    const { data } = await supabase
      .from('coaching_modules')
      .select('id, title, category, points_value')
      .eq('is_active', true)
      .order('sort_order')
    setModules(data ?? [])
  }

  async function saveAssignment() {
    if (!form.module_id || !sd?.id) return
    setSaving(true)
    await supabase.from('training_assignments').insert({
      driver_id:    sd.id,
      module_id:    form.module_id,
      assigned_by:  adminDriver?.id,
      reason:       form.reason || null,
      due_date:     form.due_date || null,
      points_bonus: Number(form.points_bonus) || 25,
      status:       'pending',
    })
    setForm({ module_id: '', reason: '', due_date: '', points_bonus: 25 })
    setShowForm(false)
    await loadAssignments(sd.id)
    setSaving(false)
  }

  async function deleteAssignment(id) {
    await supabase.from('training_assignments').delete().eq('id', id)
    await loadAssignments(sd.id)
  }

  async function applyOverduePenalty(a) {
    const title = a.coaching_modules?.title ?? 'module'
    if (!window.confirm(`Deduct ${OVERDUE_PENALTY} pts for overdue training: "${title}"?`)) return
    await supabase.from('training_assignments').update({ status: 'overdue' }).eq('id', a.id)
    await supabase.from('points_ledger').insert({
      driver_id: sd.id,
      points:    OVERDUE_PENALTY,
      reason:    `Overdue training penalty: ${title}`,
      category:  'training_penalty',
    })
    const { data: st } = await supabase.from('driver_stats').select('total_points,quarter_points').eq('driver_id', sd.id).single()
    if (st) {
      await supabase.from('driver_stats').update({
        total_points:   Math.max(0, (st.total_points ?? 0) + OVERDUE_PENALTY),
        quarter_points: Math.max(0, (st.quarter_points ?? 0) + OVERDUE_PENALTY),
      }).eq('driver_id', sd.id)
    }
    await loadAssignments(sd.id)
  }

  const pending   = assignments.filter(a => a.status !== 'completed')
  const completed = assignments.filter(a => a.status === 'completed')

  return (
    <div className="admin-driver-detail">
      <button className="back-btn" onClick={onBack}>← Back to Drivers</button>

      <div className="driver-detail-header">
        <div className="driver-detail-avatar">{selected.name?.charAt(0)?.toUpperCase() ?? '?'}</div>
        <div>
          <h2>{selected.name}</h2>
          <div className="driver-detail-meta">
            {selected.email} · {selected.company === 'carat' ? '◆ Carat Expedited' : '⬡ Pro Freight'}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Performance */}
        <div className="detail-section">
          <div className="detail-section-title">Performance</div>
          {dStats ? (
            <div className="detail-stats">
              <div className="detail-stat"><span>{(dStats.quarter_points ?? 0).toLocaleString()}</span><small>Qtr Points</small></div>
              <div className="detail-stat"><span>{dStats.total_points?.toLocaleString() ?? 0}</span><small>All-Time Pts</small></div>
              <div className="detail-stat"><span>🔥 {dStats.current_streak ?? 0}</span><small>Streak</small></div>
              <div className="detail-stat"><span>{dStats.modules_completed ?? 0}</span><small>Modules Done</small></div>
            </div>
          ) : (
            <p className="empty-state">Driver hasn't logged in yet.</p>
          )}
          {dStats && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                Quarter points — #1 ranked driver at quarter end wins $500
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
                {(dStats.quarter_points ?? 0).toLocaleString()} pts this quarter
              </div>
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="detail-section">
          <div className="detail-section-title">Credentials</div>
          <div className="detail-creds">
            {[
              { label: 'CDL', days: selected.cdlDaysLeft, date: selected.cdlExpiry?.display },
              { label: 'Med Cert', days: selected.medDaysLeft, date: selected.medCert?.display },
            ].map(({ label, days, date }) => (
              <div key={label} className="detail-cred-row">
                <span>{label}</span>
                <ExpiryCell days={days} display={date} />
              </div>
            ))}
            <div className="detail-cred-row"><span>MVR</span><span>{selected.mvr ? '✅' : '—'}</span></div>
            <div className="detail-cred-row"><span>PSP</span><span>{selected.psp ? '✅' : '—'}</span></div>
          </div>
          {selected.driveFolder && (
            <a className="driver-folder-btn" href={selected.driveFolder} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, display: 'inline-block' }}>
              📁 Drive Folder
            </a>
          )}
        </div>
      </div>

      {/* Driver Alerts */}
      <AlertsSection driverId={sd?.id} adminDriver={adminDriver} />

      {/* DOT Roadside Inspections */}
      <DOTSection driverId={sd?.id} adminDriver={adminDriver} />

      {/* Training Assignments */}
      <div className="detail-section" style={{ marginTop: 20 }}>
        <div className="cf-actions" style={{ marginBottom: 12 }}>
          <div className="detail-section-title" style={{ fontSize: 13 }}>Training Assignments</div>
          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowForm(v => !v)}>
            + Assign Module
          </button>
        </div>

        {showForm && (
          <div className="assign-form">
            <div className="cf-row">
              <label className="cf-label">Module</label>
              <select className="cf-input"
                value={form.module_id}
                onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))}>
                <option value="">Select a module…</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.points_value} pts)
                  </option>
                ))}
              </select>
            </div>
            <div className="cf-row">
              <label className="cf-label">Reason (shown to driver)</label>
              <input className="cf-input" placeholder="e.g. Speeding event on 10/28 — review safe following distance"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="cf-row" style={{ flex: 1 }}>
                <label className="cf-label">Due Date</label>
                <input type="date" className="cf-input"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="cf-row" style={{ flex: 1 }}>
                <label className="cf-label">Bonus Points</label>
                <input type="number" className="cf-input" min={0} max={200}
                  value={form.points_bonus}
                  onChange={e => setForm(f => ({ ...f, points_bonus: e.target.value }))} />
              </div>
            </div>
            <div className="cf-actions">
              <span className="cf-topics-count">Driver earns base pts + {form.points_bonus || 25} bonus for on-time completion</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-link" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveAssignment} disabled={!form.module_id || saving}>
                  {saving ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        )}

        {pending.length === 0 && completed.length === 0 && !showForm && (
          <p className="empty-state">No training assignments yet. Use "+ Assign Module" to give this driver a specific video + quiz.</p>
        )}

        {pending.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {pending.map(a => {
              const dl = daysLeft(a.due_date)
              const isOverdue = dl !== null && dl < 0
              return (
                <div key={a.id} className={`assign-row ${isOverdue ? 'assign-overdue' : ''}`}>
                  <div className="assign-row-info">
                    <div className="assign-row-title">{a.coaching_modules?.title ?? 'Unknown module'}</div>
                    {a.reason && <div className="assign-row-reason">"{a.reason}"</div>}
                    <div className="assign-row-meta">
                      +{a.coaching_modules?.points_value ?? 0} pts base · +{a.points_bonus} bonus
                      {a.due_date && ` · Due ${new Date(a.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AssignmentBadge status={a.status} due={a.due_date} />
                    {isOverdue && a.status === 'pending' && (
                      <button
                        className="assign-badge overdue"
                        style={{ cursor: 'pointer', border: 'none', fontSize: 10, padding: '3px 8px' }}
                        onClick={() => applyOverduePenalty(a)}
                        title="Apply overdue penalty (-25 pts)"
                      >
                        −25 pts
                      </button>
                    )}
                    <button className="maint-done-btn" style={{ fontSize: 11 }} onClick={() => deleteAssignment(a.id)}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {completed.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
              {completed.length} completed assignment{completed.length !== 1 ? 's' : ''}
            </summary>
            {completed.map(a => (
              <div key={a.id} className="assign-row" style={{ opacity: .6 }}>
                <div className="assign-row-info">
                  <div className="assign-row-title">{a.coaching_modules?.title}</div>
                  {a.reason && <div className="assign-row-reason">"{a.reason}"</div>}
                </div>
                <AssignmentBadge status="completed" />
              </div>
            ))}
          </details>
        )}
      </div>
    </div>
  )
}

export default function AdminDrivers() {
  const { driver: adminDriver } = useAuth()
  const [drivers, setDrivers]         = useState([])
  const [supaDrivers, setSupaDrivers] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [selected, setSelected]       = useState(null)
  const [stats, setStats]             = useState({})
  const [showCreate, setShowCreate]   = useState(false)
  const [createForm, setCreateForm]   = useState({ email: '', password: '', confirm: '' })
  const [creating, setCreating]       = useState(false)
  const [createMsg, setCreateMsg]     = useState(null) // { type: 'success'|'error', text: '' }

  useEffect(() => { load() }, [])

  async function createAccount() {
    const { email, password, confirm } = createForm
    if (!email.trim() || !password) { setCreateMsg({ type: 'error', text: 'Email and password are required.' }); return }
    if (password !== confirm) { setCreateMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    if (password.length < 6) { setCreateMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    setCreating(true)
    setCreateMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-driver-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCreateMsg({ type: 'error', text: json.error ?? 'Failed to create account.' })
      } else {
        setCreateMsg({ type: 'success', text: `Account created for ${json.email}` })
        setCreateForm({ email: '', password: '', confirm: '' })
      }
    } catch (e) {
      setCreateMsg({ type: 'error', text: 'Network error. Check that the edge function is deployed.' })
    }
    setCreating(false)
  }

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
    return matchSearch && (filter === 'all' || d.company === filter)
  })

  function matchSupa(d) {
    return supaDrivers.find(sd => sd.email === d.email)
  }

  if (loading) return <div className="page-loader">Loading drivers…</div>

  if (selected) {
    const sd     = matchSupa(selected)
    const dStats = sd ? stats[sd.id] : null
    return (
      <DriverDetail
        selected={selected}
        sd={sd}
        dStats={dStats}
        adminDriver={adminDriver}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="admin-drivers">
      <div className="admin-drivers-toolbar">
        <input className="admin-search" type="text" placeholder="Search drivers…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="admin-filter-row">
          {['all', 'carat', 'pft'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'carat' ? '◆ Carat' : '⬡ PFT'}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
          onClick={() => { setShowCreate(v => !v); setCreateMsg(null) }}>
          + Create Account
        </button>
      </div>

      {showCreate && (
        <div className="assign-form" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Create Driver Login</div>
          <div className="cf-row">
            <label className="cf-label">Email *</label>
            <input className="cf-input" type="email" placeholder="driver@example.com"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="cf-row" style={{ flex: 1 }}>
              <label className="cf-label">Password *</label>
              <input className="cf-input" type="password" placeholder="Min 6 characters"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="cf-row" style={{ flex: 1 }}>
              <label className="cf-label">Confirm Password *</label>
              <input className="cf-input" type="password" placeholder="Repeat password"
                value={createForm.confirm}
                onChange={e => setCreateForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
          </div>
          {createMsg && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 8,
              background: createMsg.type === 'success' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
              color: createMsg.type === 'success' ? '#22c55e' : '#ef4444',
              fontWeight: 500,
            }}>
              {createMsg.type === 'success' ? '✅ ' : '⚠️ '}{createMsg.text}
            </div>
          )}
          <div className="cf-actions">
            <span className="cf-topics-count">Driver can log in to drivers.caratexpedited.com immediately</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-link" onClick={() => { setShowCreate(false); setCreateMsg(null) }}>Cancel</button>
              <button className="btn-primary" onClick={createAccount}
                disabled={!createForm.email || !createForm.password || creating}>
                {creating ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th><th>Company</th><th>CDL</th><th>Med Cert</th>
              <th>Points</th><th>Streak</th><th>Portal</th>
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
                  <td><ExpiryCell days={d.cdlDaysLeft} display={d.cdlExpiry?.display} /></td>
                  <td><ExpiryCell days={d.medDaysLeft} display={d.medCert?.display} /></td>
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
