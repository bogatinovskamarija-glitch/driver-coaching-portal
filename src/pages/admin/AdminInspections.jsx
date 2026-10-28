import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const INSPECTION_ITEMS = [
  { id: 'headlights',    label: 'Headlights', group: 'Lights' },
  { id: 'taillights',   label: 'Taillights', group: 'Lights' },
  { id: 'brake_lights', label: 'Brake lights', group: 'Lights' },
  { id: 'turn_signals', label: 'Turn signals', group: 'Lights' },
  { id: 'clearance',    label: 'Clearance/marker lamps', group: 'Lights' },
  { id: 'reflectors',   label: 'Reflectors', group: 'Lights' },
  { id: 'tire_tread',   label: 'Tire tread depth (4/32" front, 2/32" others)', group: 'Tires & Wheels' },
  { id: 'tire_inflation', label: 'Tire inflation / no bulges', group: 'Tires & Wheels' },
  { id: 'tire_sidewall', label: 'Sidewall cracks / exposed ply', group: 'Tires & Wheels' },
  { id: 'lug_nuts',     label: 'Lug nuts tight, no rust streaks', group: 'Tires & Wheels' },
  { id: 'brake_adj',    label: 'Brake adjustment / pushrod stroke', group: 'Brakes' },
  { id: 'brake_lines',  label: 'Brake lines, no leaks', group: 'Brakes' },
  { id: 'slack_adj',    label: 'Slack adjusters', group: 'Brakes' },
  { id: 'air_build',    label: 'Air build-up & warning light', group: 'Brakes' },
  { id: 'springs',      label: 'Springs / U-bolts', group: 'Suspension' },
  { id: 'steering',     label: 'Steering linkage', group: 'Suspension' },
  { id: 'fifth_wheel',  label: '5th wheel — locked, no movement', group: 'Coupling' },
  { id: 'glad_hands',   label: 'Glad hands connected', group: 'Coupling' },
  { id: 'electrical',   label: 'Electrical connection', group: 'Coupling' },
  { id: 'fuel_tank',    label: 'Fuel tank caps / no leaks', group: 'Engine & Fluids' },
  { id: 'oil',          label: 'Oil level', group: 'Engine & Fluids' },
  { id: 'coolant',      label: 'Coolant level', group: 'Engine & Fluids' },
  { id: 'belts_hoses',  label: 'Belts & hoses', group: 'Engine & Fluids' },
  { id: 'gauges',       label: 'All gauges in normal range', group: 'Cab Interior' },
  { id: 'seatbelt',     label: 'Seat belt functional', group: 'Cab Interior' },
  { id: 'mirrors',      label: 'Mirrors clean and adjusted', group: 'Cab Interior' },
  { id: 'wipers',       label: 'Wipers / washer fluid', group: 'Cab Interior' },
  { id: 'horn',         label: 'Horn functional', group: 'Cab Interior' },
  { id: 'fire_ext',     label: 'Fire extinguisher present', group: 'Safety Equipment' },
  { id: 'triangles',    label: 'Warning triangles / flares', group: 'Safety Equipment' },
]

const GROUPS = [...new Set(INSPECTION_ITEMS.map(i => i.group))]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminInspections() {
  const { driver: adminDriver } = useAuth()
  const [tab, setTab]             = useState('inspect')   // 'inspect' | 'schedule'
  const [drivers, setDrivers]     = useState([])
  const [selected, setSelected]   = useState(null)
  const [history, setHistory]     = useState([])
  const [schedule, setSchedule]   = useState([])
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [loading, setLoading]     = useState(true)
  const [showNewMaint, setShowNewMaint] = useState(false)

  const [form, setForm] = useState({
    inspection_date:  new Date().toISOString().split('T')[0],
    truck_clickup_id: '',
    items: {},
    follow_up_notes: '',
    follow_up_date: '',
  })

  const [maintForm, setMaintForm] = useState({
    title: '', description: '', scheduled_date: '', truck_clickup_id: '',
  })

  useEffect(() => {
    loadDrivers()
    loadSchedule()
  }, [])

  useEffect(() => {
    if (selected) loadHistory()
  }, [selected])

  async function loadDrivers() {
    const { data } = await supabase
      .from('drivers')
      .select('id, name, email, company_id')
      .eq('is_admin', false)
      .eq('is_active', true)
      .order('name')
    setDrivers(data ?? [])
    setLoading(false)
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('phone_inspections')
      .select('*')
      .eq('driver_id', selected.id)
      .order('inspection_date', { ascending: false })
      .limit(10)
    setHistory(data ?? [])
  }

  async function loadSchedule() {
    const { data } = await supabase
      .from('maintenance_schedule')
      .select('*')
      .in('status', ['pending', 'overdue'])
      .order('scheduled_date')
    setSchedule(data ?? [])
  }

  function setItem(id, status) {
    setForm(f => ({ ...f, items: { ...f.items, [id]: status } }))
    setSaved(false)
  }

  const allStatuses = Object.values(form.items)
  const passCount   = allStatuses.filter(s => s === 'pass').length
  const flagCount   = allStatuses.filter(s => s === 'flag').length
  const failCount   = allStatuses.filter(s => s === 'fail').length
  const overallStatus = failCount > 0 ? 'fail' : flagCount > 0 ? 'flag' : passCount > 0 ? 'pass' : 'pending'

  async function saveInspection() {
    if (!selected) return
    setSaving(true)
    const itemsArr = INSPECTION_ITEMS.map(i => ({
      id: i.id, label: i.label, status: form.items[i.id] ?? 'not_checked',
    }))
    const { data: insp, error } = await supabase
      .from('phone_inspections')
      .insert({
        driver_id:        selected.id,
        inspector_id:     adminDriver?.id,
        truck_clickup_id: form.truck_clickup_id,
        inspection_date:  form.inspection_date,
        items:            itemsArr,
        overall_status:   overallStatus,
        follow_up_notes:  form.follow_up_notes,
        follow_up_date:   form.follow_up_date || null,
        points_awarded:   overallStatus === 'pass' ? 30 : 10,
      })
      .select()
      .single()

    if (!error && insp) {
      setSaved(true)
      await loadHistory()
      if (overallStatus === 'pass') {
        await supabase.rpc('increment_driver_points', {
          p_driver_id: selected.id, p_points: 30,
          p_reason: `Clean phone inspection — ${fmtDate(form.inspection_date)}`, p_category: 'inspection',
        }).catch(() => {})
      }
      // Reset form
      setForm({ inspection_date: new Date().toISOString().split('T')[0], truck_clickup_id: '', items: {}, follow_up_notes: '', follow_up_date: '' })
    }
    setSaving(false)
  }

  async function saveMaint() {
    if (!maintForm.title || !maintForm.scheduled_date) return
    await supabase.from('maintenance_schedule').insert({
      ...maintForm,
      driver_id:   selected?.id,
      created_by:  adminDriver?.id,
    })
    setMaintForm({ title: '', description: '', scheduled_date: '', truck_clickup_id: '' })
    setShowNewMaint(false)
    await loadSchedule()
  }

  async function markMaintDone(id) {
    await supabase.from('maintenance_schedule').update({ status: 'done' }).eq('id', id)
    await loadSchedule()
  }

  if (loading) return <div className="page-loader">Loading…</div>

  return (
    <div className="coaching-wrap">
      {/* Sidebar */}
      <div className="coaching-sidebar">
        <div className="coaching-sidebar-title">Drivers</div>
        {drivers.map(d => (
          <div
            key={d.id}
            className={`coaching-driver-row ${selected?.id === d.id ? 'active' : ''}`}
            onClick={() => { setSelected(d); setSaved(false) }}
          >
            <div className="coaching-driver-name">{d.name}</div>
            <div className="coaching-driver-co">{d.company_id === 'carat' ? 'Carat' : 'PFT'}</div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="coaching-main">
        <div className="insp-tabs">
          <button className={`insp-tab ${tab === 'inspect' ? 'active' : ''}`} onClick={() => setTab('inspect')}>
            Phone Inspection
          </button>
          <button className={`insp-tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>
            Maintenance Schedule {schedule.length > 0 && <span className="insp-badge">{schedule.length}</span>}
          </button>
        </div>

        {tab === 'inspect' && (
          !selected ? (
            <div className="coaching-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📞</div>
              <div>Select a driver to record a phone inspection</div>
            </div>
          ) : (
            <>
              <div className="coaching-header">
                <div>
                  <div className="coaching-driver-title">{selected.name}</div>
                  <div className="coaching-driver-email">{selected.email}</div>
                </div>
                <div className={`overall-badge status-${overallStatus}`}>
                  {overallStatus === 'pass' ? '✓ Pass' : overallStatus === 'flag' ? '⚠ Flag' : overallStatus === 'fail' ? '✗ Fail' : 'In Progress'}
                </div>
              </div>

              <div className="cf-row" style={{ marginBottom: 12 }}>
                <input type="date" className="cf-input" style={{ marginRight: 8 }}
                  value={form.inspection_date}
                  onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
                <input type="text" className="cf-input"
                  placeholder="Truck # (ClickUp ID or number)"
                  value={form.truck_clickup_id}
                  onChange={e => setForm(f => ({ ...f, truck_clickup_id: e.target.value }))} />
              </div>

              <div className="insp-legend">
                <span className="insp-status-btn status-pass">Pass</span>
                <span className="insp-status-btn status-flag">Flag</span>
                <span className="insp-status-btn status-fail">Fail</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  {passCount} pass · {flagCount} flag · {failCount} fail
                </span>
              </div>

              {GROUPS.map(group => (
                <div key={group} className="insp-group">
                  <div className="insp-group-title">{group}</div>
                  {INSPECTION_ITEMS.filter(i => i.group === group).map(item => {
                    const s = form.items[item.id]
                    return (
                      <div key={item.id} className="insp-item">
                        <span className="insp-item-label">{item.label}</span>
                        <div className="insp-btns">
                          {['pass','flag','fail'].map(st => (
                            <button key={st}
                              className={`insp-status-btn status-${st} ${s === st ? 'selected' : ''}`}
                              onClick={() => setItem(item.id, s === st ? null : st)}
                            >
                              {st === 'pass' ? '✓' : st === 'flag' ? '⚠' : '✗'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              <div className="cf-row" style={{ marginTop: 16 }}>
                <label className="cf-label">Follow-up Notes</label>
                <textarea className="cf-textarea" rows={2}
                  placeholder="What needs to be fixed or monitored?"
                  value={form.follow_up_notes}
                  onChange={e => setForm(f => ({ ...f, follow_up_notes: e.target.value }))} />
              </div>

              <div className="cf-row">
                <label className="cf-label">Schedule Follow-up</label>
                <input type="date" className="cf-input"
                  value={form.follow_up_date}
                  onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
              </div>

              <div className="cf-actions">
                <button className="btn-primary" onClick={saveInspection} disabled={saving || passCount + flagCount + failCount === 0}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Inspection'}
                </button>
              </div>

              {history.length > 0 && (
                <div className="coaching-history">
                  <div className="cf-section-title">Inspection History</div>
                  {history.map(h => (
                    <div key={h.id} className="history-row">
                      <div className="history-month">{fmtDate(h.inspection_date)}</div>
                      <span className={`overall-badge status-${h.overall_status}`} style={{ fontSize: 11 }}>
                        {h.overall_status === 'pass' ? '✓ Pass' : h.overall_status === 'flag' ? '⚠ Flag' : '✗ Fail'}
                      </span>
                      {h.follow_up_notes && <div className="history-notes">{h.follow_up_notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        )}

        {tab === 'schedule' && (
          <div className="maint-schedule">
            <div className="cf-actions" style={{ marginBottom: 16 }}>
              <span className="cf-section-title" style={{ fontSize: 15 }}>Upcoming Maintenance</span>
              <button className="btn-primary" onClick={() => setShowNewMaint(v => !v)}>
                + Add Item
              </button>
            </div>

            {showNewMaint && (
              <div className="coaching-form" style={{ marginBottom: 16 }}>
                <div className="cf-row">
                  <label className="cf-label">Title</label>
                  <input className="cf-input" placeholder="e.g. Oil change — Truck 130"
                    value={maintForm.title}
                    onChange={e => setMaintForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="cf-row">
                  <label className="cf-label">Truck</label>
                  <input className="cf-input" placeholder="Truck # or ClickUp ID"
                    value={maintForm.truck_clickup_id}
                    onChange={e => setMaintForm(f => ({ ...f, truck_clickup_id: e.target.value }))} />
                </div>
                <div className="cf-row">
                  <label className="cf-label">Scheduled Date</label>
                  <input type="date" className="cf-input"
                    value={maintForm.scheduled_date}
                    onChange={e => setMaintForm(f => ({ ...f, scheduled_date: e.target.value }))} />
                </div>
                <div className="cf-row">
                  <label className="cf-label">Notes</label>
                  <textarea className="cf-textarea" rows={2}
                    value={maintForm.description}
                    onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="cf-actions">
                  <button className="btn-primary" onClick={saveMaint}>Save</button>
                  <button className="btn-link" onClick={() => setShowNewMaint(false)}>Cancel</button>
                </div>
              </div>
            )}

            {schedule.length === 0 && !showNewMaint && (
              <div className="coaching-empty" style={{ height: 180 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
                <div>No pending maintenance items</div>
              </div>
            )}

            {schedule.map(item => {
              const due = new Date(item.scheduled_date + 'T12:00:00')
              const today = new Date(); today.setHours(0,0,0,0)
              const overdue = due < today
              return (
                <div key={item.id} className={`maint-item ${overdue ? 'overdue' : ''}`}>
                  <div className="maint-item-top">
                    <div className="maint-item-title">{item.title}</div>
                    <button className="maint-done-btn" onClick={() => markMaintDone(item.id)}>✓ Done</button>
                  </div>
                  <div className="maint-item-meta">
                    {overdue ? '⚠ Overdue · ' : ''}
                    {fmtDate(item.scheduled_date)}
                    {item.truck_clickup_id && ` · Truck ${item.truck_clickup_id}`}
                  </div>
                  {item.description && <div className="maint-item-desc">{item.description}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
