import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { fetchTruckById, fetchTrailerById, findDriverByEmail } from '../../lib/clickup'

function ExpiryChip({ label, daysLeft }) {
  if (daysLeft === null) return null
  const cls = daysLeft < 30 ? 'chip-red' : daysLeft < 60 ? 'chip-amber' : 'chip-green'
  const text = daysLeft < 0 ? 'EXPIRED' : daysLeft === 0 ? 'Today' : `${daysLeft}d`
  return <span className={`expiry-chip ${cls}`}>{label}: {text}</span>
}

function TodayStatus({ completed, onStart }) {
  if (completed) {
    return (
      <div className="pretip-done">
        <span className="pretip-done-icon">✅</span>
        <div>
          <div className="pretip-done-title">Pre-trip complete!</div>
          <div className="pretip-done-sub">Great work. See you tomorrow.</div>
        </div>
        <span className="pts-badge">+10</span>
      </div>
    )
  }
  return (
    <div className="pretip-cta" onClick={onStart}>
      <div className="pretip-cta-left">
        <div className="pretip-cta-icon">🚛</div>
        <div>
          <div className="pretip-cta-title">Start Pre-Trip</div>
          <div className="pretip-cta-sub">20 items · 5 min · +10 pts</div>
        </div>
      </div>
      <div className="pretip-cta-arrow">→</div>
    </div>
  )
}

export default function Dashboard({ onNav }) {
  const { driver, stats, refreshDriver } = useAuth()
  const [clickupDriver, setClickupDriver] = useState(null)
  const [truck, setTruck]   = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [todayDone, setTodayDone] = useState(false)
  const [rank, setRank]     = useState(null)
  const [nextModule, setNextModule] = useState(null)
  const [badges, setBadges] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!driver) return
    // ClickUp is slow (3 external API calls) — load in background, don't block render
    loadClickupData()

    Promise.all([
      checkTodayPretrip(),
      loadRank(),
      loadNextModule(),
      loadBadges(),
      loadAlerts(),
    ]).finally(() => setLoading(false))
  }, [driver])

  async function loadClickupData() {
    const cd = await findDriverByEmail(driver.email)
    if (!cd) return
    setClickupDriver(cd)
    const [t, tr] = await Promise.all([
      fetchTruckById(cd.truckTaskId),
      fetchTrailerById(cd.trailerTaskId),
    ])
    setTruck(t)
    setTrailer(tr)
  }

  async function checkTodayPretrip() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('pre_trip_logs')
      .select('id')
      .eq('driver_id', driver.id)
      .gte('completed_at', `${today}T00:00:00`)
      .limit(1)
    setTodayDone((data?.length ?? 0) > 0)
  }

  async function loadRank() {
    // Count drivers in same company with more points
    const { data } = await supabase
      .from('drivers')
      .select('id, driver_stats(quarter_points)')
      .eq('company_id', driver.company_id)
      .eq('is_active', true)
      .eq('is_admin', false)

    if (!data) return
    const myPts = stats.quarter_points ?? 0
    if (myPts === 0) { setRank(null); return }  // no rank until points earned
    const above = data.filter(d => (d.driver_stats?.[0]?.quarter_points ?? 0) > myPts).length
    setRank(above + 1)
  }

  async function loadNextModule() {
    // Show next pending assignment instead of the full module library
    const { data } = await supabase
      .from('training_assignments')
      .select('*, coaching_modules(id, title, category, points_value, duration_minutes)')
      .eq('driver_id', driver.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
    setNextModule(data?.[0]?.coaching_modules ?? null)
  }

  async function loadAlerts() {
    const { data } = await supabase
      .from('driver_alerts')
      .select('*')
      .eq('driver_id', driver.id)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })
    setAlerts(data ?? [])
  }

  async function acknowledgeAlert(id) {
    await supabase.from('driver_alerts').update({ acknowledged_at: new Date().toISOString() }).eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  async function loadBadges() {
    const { data } = await supabase
      .from('driver_badges')
      .select('badge_id, badges(icon, name), earned_at')
      .eq('driver_id', driver.id)
      .order('earned_at', { ascending: false })
      .limit(5)
    setBadges(data ?? [])
  }

  if (loading) return <div className="page-loader">Loading…</div>

  const streak   = stats.current_streak ?? 0
  const points   = stats.total_points ?? 0
  const firstName = (driver.name ?? '').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div className="dash-greeting">{greeting} 👋</div>
        <div className="dash-name">{firstName}</div>
        {(truck || clickupDriver?.cdlExpiry) && (
          <div className="dash-meta">
            {truck && <span>{truck.name}</span>}
            {truck && clickupDriver && <span className="dot-sep">·</span>}
            {clickupDriver?.cdlState && <span>CDL {clickupDriver.cdlState}</span>}
          </div>
        )}

        {/* Stat pills */}
        <div className="stat-pills">
          <div className="stat-pill">
            <div className="stat-num" style={{ color: '#FBBF24' }}>🔥 {streak}</div>
            <div className="stat-lbl">Streak</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num">{points.toLocaleString()}</div>
            <div className="stat-lbl">Points</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>
              {rank !== null ? `#${rank}` : '—'}
            </div>
            <div className="stat-lbl">Rank</div>
          </div>
        </div>

        {/* Quarterly reward status */}
        {(() => {
          const qPts = stats.quarter_points ?? 0
          return (
            <div className="reward-progress">
              <div className="reward-progress-label">
                <span>🏆 This Quarter</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {qPts > 0 ? `${qPts.toLocaleString()} pts` : 'No points yet'}
                </span>
              </div>
              <div className="reward-progress-sub">
                {rank === 1
                  ? '🥇 You\'re in the lead — stay #1 to win the $500 quarterly reward!'
                  : rank !== null
                    ? `You're ranked #${rank} this quarter. Keep earning to reach #1.`
                    : 'Complete a pre-trip or training to start earning points and get ranked.'}
              </div>
            </div>
          )
        })()}
      </div>

      <div className="dash-body">
        {/* Admin-assigned alerts */}
        {alerts.map(alert => {
          const isTest = alert.type === 'drug_test' || alert.type === 'alcohol_test'
          const icon = alert.type === 'drug_test' ? '🧪' : alert.type === 'alcohol_test' ? '🍺' : '⚠️'
          const bg   = isTest ? 'rgba(239,68,68,.12)' : 'rgba(245,158,11,.12)'
          const border = isTest ? '#ef4444' : '#f59e0b'
          return (
            <div key={alert.id} style={{
              background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
              padding: '14px 16px', marginBottom: 10, display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: border }}>{alert.title}</div>
                {alert.message && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{alert.message}</div>}
              </div>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                style={{
                  flexShrink: 0, background: border, color: '#fff', border: 'none',
                  borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                OK, Got It
              </button>
            </div>
          )
        })}

        {/* Expiry alerts (CDL / Med Cert / Equipment) */}
        {clickupDriver && (
          (() => {
            const expiryAlerts = [
              { label: 'CDL',      daysLeft: clickupDriver.cdlDaysLeft },
              { label: 'Med Cert', daysLeft: clickupDriver.medDaysLeft },
              { label: 'Truck Reg',daysLeft: truck?.regDaysLeft },
              { label: 'Truck IRP',daysLeft: truck?.irpDaysLeft },
              { label: 'Trailer', daysLeft: trailer?.irpDaysLeft },
            ].filter(a => a.daysLeft !== null && a.daysLeft < 60)
            if (expiryAlerts.length === 0) return null
            return (
              <div className="expiry-row">
                {expiryAlerts.map(a => <ExpiryChip key={a.label} {...a} />)}
              </div>
            )
          })()
        )}

        {/* Pre-trip */}
        <div className="section-label">Today's Pre-Trip</div>
        <TodayStatus completed={todayDone} onStart={() => onNav('pretip')} />

        {/* Next training module */}
        {nextModule && (
          <>
            <div className="section-label">This Week's Training</div>
            <div className="module-card" onClick={() => onNav('training')}>
              <div className="module-icon">
                {nextModule.category === 'pre_trip'    ? '🔦' :
                 nextModule.category === 'hos_eld'     ? '⏱️' :
                 nextModule.category === 'brakes_tires'? '🛑' : '🚗'}
              </div>
              <div className="module-info">
                <div className="module-title">{nextModule.title}</div>
                <div className="module-meta">
                  {nextModule.duration_minutes} min · Quiz · {nextModule.points_value} pts
                </div>
              </div>
              <div className="module-arrow">▶</div>
            </div>
          </>
        )}

        {!nextModule && (
          <div className="all-done-card">
            <span>🏆</span>
            <div>
              <div style={{ fontWeight: 600 }}>All modules complete!</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>You're a compliance pro.</div>
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <>
            <div className="section-label">Your Badges</div>
            <div className="badge-row">
              {badges.map(b => (
                <div key={b.badge_id} className="badge-chip" title={b.badges?.name}>
                  <span>{b.badges?.icon}</span>
                  <span className="badge-name">{b.badges?.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quick links */}
        <div className="section-label">Quick Access</div>
        <div className="quick-row">
          <div className="quick-card" onClick={() => onNav('docs')}>
            <span>📄</span>
            <span>My Documents</span>
          </div>
          <div className="quick-card" onClick={() => onNav('training')}>
            <span>📚</span>
            <span>Training</span>
          </div>
          <div className="quick-card" onClick={() => onNav('leaderboard')}>
            <span>🏆</span>
            <span>Leaderboard</span>
          </div>
        </div>
      </div>
    </div>
  )
}
