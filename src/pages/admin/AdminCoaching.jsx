import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const HOS_TYPES = [
  '7-day cycle',
  '8-day cycle',
  'Short-haul exemption',
  'Adverse driving exemption',
  'General log accuracy',
]

const BEHAVIOR_FIELDS = [
  { key: 'motive_coached',  label: 'Motive Coaching',  icon: '📱', noteKey: 'motive_notes' },
  { key: 'speeding',        label: 'Speeding',         icon: '⚡', noteKey: 'speeding_notes' },
  { key: 'hard_braking',    label: 'Hard Braking',     icon: '🛑', noteKey: 'hard_braking_notes' },
  { key: 'cornering',       label: 'Cornering',        icon: '↩️', noteKey: 'cornering_notes' },
]

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

export default function AdminCoaching() {
  const { driver: adminDriver } = useAuth()
  const [drivers, setDrivers]   = useState([])
  const [selected, setSelected] = useState(null)
  const [month, setMonth]       = useState(monthStart(0))
  const [session, setSession]   = useState(null)
  const [history, setHistory]       = useState([])
  const [trainingResults, setTraining] = useState([])
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [loading, setLoading]       = useState(true)

  const [form, setForm] = useState({
    coached_date: new Date().toISOString().split('T')[0],
    motive_coached: false, motive_notes: '',
    speeding: false, speeding_notes: '',
    hard_braking: false, hard_braking_notes: '',
    cornering: false, cornering_notes: '',
    hos_coached: false, hos_types: [], hos_notes: '',
    general_notes: '',
  })

  useEffect(() => {
    loadDrivers()
  }, [])

  useEffect(() => {
    if (selected) { loadSession(); loadHistory(); loadTraining() }
  }, [selected, month])

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

  async function loadSession() {
    const { data } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('driver_id', selected.id)
      .eq('month', month)
      .maybeSingle()

    if (data) {
      setSession(data)
      setForm({
        coached_date:     data.coached_date,
        motive_coached:   data.motive_coached ?? false,
        motive_notes:     data.motive_notes ?? '',
        speeding:         data.speeding ?? false,
        speeding_notes:   data.speeding_notes ?? '',
        hard_braking:     data.hard_braking ?? false,
        hard_braking_notes: data.hard_braking_notes ?? '',
        cornering:        data.cornering ?? false,
        cornering_notes:  data.cornering_notes ?? '',
        hos_coached:      data.hos_coached ?? false,
        hos_types:        data.hos_types ?? [],
        hos_notes:        data.hos_notes ?? '',
        general_notes:    data.general_notes ?? '',
      })
    } else {
      setSession(null)
      setForm(f => ({ ...f, coached_date: new Date().toISOString().split('T')[0] }))
    }
  }

  async function loadHistory() {
    const { data } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('driver_id', selected.id)
      .order('month', { ascending: false })
      .limit(12)
    setHistory(data ?? [])
  }

  async function loadTraining() {
    // Pull completed assignments (source of truth) and quiz results separately
    const [{ data: assignments }, { data: completions }] = await Promise.all([
      supabase
        .from('training_assignments')
        .select('*, coaching_modules(id, title, category, points_value)')
        .eq('driver_id', selected.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false }),
      supabase
        .from('module_completions')
        .select('*')
        .eq('driver_id', selected.id),
    ])
    // Map quiz results by module_id for quick lookup
    const quizByModule = {}
    for (const c of completions ?? []) quizByModule[c.module_id] = c
    // Merge: attach quiz result to each completed assignment when available
    const merged = (assignments ?? []).map(a => ({
      ...a,
      completion: quizByModule[a.coaching_modules?.id] ?? null,
    }))
    setTraining(merged)
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setSaved(false)
  }

  function toggleHosType(type) {
    setForm(f => ({
      ...f,
      hos_types: f.hos_types.includes(type)
        ? f.hos_types.filter(t => t !== type)
        : [...f.hos_types, type],
    }))
    setSaved(false)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    const payload = {
      driver_id:   selected.id,
      coach_id:    adminDriver?.id,
      month,
      ...form,
    }
    const { error } = await supabase
      .from('coaching_sessions')
      .upsert(payload, { onConflict: 'driver_id,month' })

    if (!error) {
      setSaved(true)
      await loadSession()
      await loadHistory()
      // Award points to driver
      await supabase.rpc('increment_driver_points', {
        p_driver_id: selected.id,
        p_points: 25,
        p_reason: `Coaching session — ${fmtMonth(month)}`,
        p_category: 'coaching',
      }).catch(() => {})
    }
    setSaving(false)
  }

  const topicsCount = [
    form.motive_coached, form.speeding, form.hard_braking, form.cornering, form.hos_coached
  ].filter(Boolean).length

  if (loading) return <div className="page-loader">Loading drivers…</div>

  return (
    <div className="coaching-wrap">
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

      <div className="coaching-main">
        {!selected ? (
          <div className="coaching-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div>Select a driver to record a coaching session</div>
          </div>
        ) : (
          <>
            <div className="coaching-header">
              <div>
                <div className="coaching-driver-title">{selected.name}</div>
                <div className="coaching-driver-email">{selected.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn-link" style={{ fontSize: 12 }} onClick={() => window.print()}>
                  🖨 Print Report
                </button>
                <div className="month-nav">
                  <button className="month-btn" onClick={() => setMonth(m => {
                    const d = new Date(m); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
                  })}>‹</button>
                  <span className="month-label">{fmtMonth(month)}</span>
                  <button className="month-btn" onClick={() => setMonth(m => {
                    const d = new Date(m); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]
                  })}>›</button>
                </div>
              </div>
            </div>

            {/* Hidden print report — shown only via @media print */}
            <div className="coaching-print-only">
              <div className="cpr-header">
                <div className="cpr-logo">
                  {selected.company_id === 'carat' ? '◆ CARAT EXPEDITED INC' : '⬡ PRO FREIGHT TRANSPORTATION INC'}
                </div>
                <div className="cpr-title">Driver Coaching & Training Report</div>
                <div className="cpr-meta">
                  <span>Driver: <strong>{selected.name}</strong></span>
                  <span>Company: <strong>{selected.company_id === 'carat' ? 'Carat Expedited' : 'Pro Freight Transportation'}</strong></span>
                  <span>Generated: <strong>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                </div>
              </div>

              <div className="cpr-section">
                <div className="cpr-section-title">Coaching Session History</div>
                {history.length === 0 ? (
                  <div className="cpr-empty">No coaching sessions recorded.</div>
                ) : (
                  <table className="cpr-table">
                    <thead>
                      <tr><th>Month</th><th>Date</th><th>Topics Covered</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {history.map(h => {
                        const topics = [
                          h.motive_coached && 'Motive Coaching',
                          h.speeding && 'Speeding',
                          h.hard_braking && 'Hard Braking',
                          h.cornering && 'Cornering',
                          h.hos_coached && `HOS (${(h.hos_types ?? []).join(', ')})`,
                        ].filter(Boolean)
                        const notes = [
                          h.motive_coached && h.motive_notes && `Motive: ${h.motive_notes}`,
                          h.speeding && h.speeding_notes && `Speeding: ${h.speeding_notes}`,
                          h.hard_braking && h.hard_braking_notes && `Hard Braking: ${h.hard_braking_notes}`,
                          h.cornering && h.cornering_notes && `Cornering: ${h.cornering_notes}`,
                          h.hos_coached && h.hos_notes && `HOS: ${h.hos_notes}`,
                          h.general_notes && h.general_notes,
                        ].filter(Boolean)
                        return (
                          <tr key={h.id}>
                            <td>{fmtMonth(h.month)}</td>
                            <td>{h.coached_date ? new Date(h.coached_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                            <td>{topics.length > 0 ? topics.join(' · ') : '—'}</td>
                            <td>{notes.length > 0 ? notes.join(' | ') : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="cpr-section">
                <div className="cpr-section-title">Training & Quiz Performance</div>
                {trainingResults.length === 0 ? (
                  <div className="cpr-empty">No training modules completed.</div>
                ) : (
                  <table className="cpr-table">
                    <thead>
                      <tr><th>Module</th><th>Quiz Score</th><th>Result</th><th>Points</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {trainingResults.map(r => (
                        <tr key={r.id}>
                          <td>{r.coaching_modules?.title ?? 'Module'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {r.completion ? `${r.completion.quiz_score ?? 0}%` : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {r.completion ? (r.completion.quiz_passed ? 'Passed ✓' : 'Failed ✗') : 'Completed'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            +{r.completion?.points_earned ?? r.coaching_modules?.points_value ?? 0}
                          </td>
                          <td>{r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="cpr-footer">
                {selected.company_id === 'carat' ? 'Carat Expedited INC' : 'Pro Freight Transportation INC'} — Confidential
              </div>
            </div>

            {session && (
              <div className="coaching-existing-badge">
                Session recorded — last updated {new Date(session.created_at).toLocaleDateString()}
              </div>
            )}

            <div className="coaching-form">
              <div className="cf-row">
                <label className="cf-label">Coaching Date</label>
                <input
                  type="date"
                  className="cf-input"
                  value={form.coached_date}
                  onChange={e => setField('coached_date', e.target.value)}
                />
              </div>

              <div className="cf-section-title">Topics Covered</div>

              {BEHAVIOR_FIELDS.map(({ key, label, icon, noteKey }) => (
                <div key={key} className="cf-check-block">
                  <label className="cf-check-row">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={e => setField(key, e.target.checked)}
                    />
                    <span className="cf-check-icon">{icon}</span>
                    <span className="cf-check-label">{label}</span>
                  </label>
                  {form[key] && (
                    <textarea
                      className="cf-textarea"
                      placeholder={`Notes on ${label.toLowerCase()} coaching…`}
                      value={form[noteKey]}
                      onChange={e => setField(noteKey, e.target.value)}
                      rows={2}
                    />
                  )}
                </div>
              ))}

              {/* HOS */}
              <div className="cf-check-block">
                <label className="cf-check-row">
                  <input
                    type="checkbox"
                    checked={form.hos_coached}
                    onChange={e => setField('hos_coached', e.target.checked)}
                  />
                  <span className="cf-check-icon">⏱️</span>
                  <span className="cf-check-label">HOS Coaching</span>
                </label>
                {form.hos_coached && (
                  <>
                    <div className="cf-hos-types">
                      {HOS_TYPES.map(t => (
                        <button
                          key={t}
                          className={`cf-hos-chip ${form.hos_types.includes(t) ? 'active' : ''}`}
                          onClick={() => toggleHosType(t)}
                        >{t}</button>
                      ))}
                    </div>
                    <textarea
                      className="cf-textarea"
                      placeholder="HOS coaching notes…"
                      value={form.hos_notes}
                      onChange={e => setField('hos_notes', e.target.value)}
                      rows={2}
                    />
                  </>
                )}
              </div>

              <div className="cf-row" style={{ marginTop: 16 }}>
                <label className="cf-label">General Notes</label>
                <textarea
                  className="cf-textarea"
                  placeholder="Any other observations or follow-up items…"
                  value={form.general_notes}
                  onChange={e => setField('general_notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="cf-actions">
                <span className="cf-topics-count">{topicsCount} topic{topicsCount !== 1 ? 's' : ''} covered · +25 pts</span>
                <button className="btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : saved ? '✓ Saved' : session ? 'Update Session' : 'Save Session'}
                </button>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="coaching-history">
                <div className="cf-section-title">Coaching History</div>
                {history.map(h => {
                  const topics = [
                    h.motive_coached && 'Motive',
                    h.speeding && 'Speeding',
                    h.hard_braking && 'Hard Braking',
                    h.cornering && 'Cornering',
                    h.hos_coached && 'HOS',
                  ].filter(Boolean)
                  return (
                    <div key={h.id} className="history-row">
                      <div className="history-month">{fmtMonth(h.month)}</div>
                      <div className="history-topics">
                        {topics.length > 0
                          ? topics.map(t => <span key={t} className="history-chip">{t}</span>)
                          : <span className="history-none">No topics recorded</span>}
                      </div>
                      {h.general_notes && (
                        <div className="history-notes">{h.general_notes}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Training results */}
            <div className="coaching-history" style={{ marginTop: 16 }}>
              <div className="cf-section-title">Training Results</div>
              {trainingResults.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-2)', padding: '8px 0' }}>No modules completed yet.</div>
              ) : (
                trainingResults.map(r => {
                  const passed = r.completion?.quiz_passed ?? false
                  const score  = r.completion?.quiz_score ?? null
                  return (
                    <div key={r.id} className="training-result-row">
                      <div className="tr-left">
                        <span className={`tr-badge ${passed ? 'pass' : 'fail'}`}>
                          {passed ? '✓ Passed' : '✗ Failed'}
                        </span>
                        <div className="tr-title">{r.coaching_modules?.title ?? 'Module'}</div>
                      </div>
                      <div className="tr-right">
                        <div className="tr-score" style={{ color: score === null ? 'var(--text-2)' : score >= 80 ? '#22c55e' : '#ef4444' }}>
                          {score !== null ? `${score}%` : '—'}
                        </div>
                        <div className="tr-pts">+{r.completion?.points_earned ?? r.coaching_modules?.points_value ?? 0} pts</div>
                        <div className="tr-date">
                          {r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
