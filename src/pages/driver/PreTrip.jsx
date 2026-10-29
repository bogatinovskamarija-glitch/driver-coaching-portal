import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PRE_TRIP_ITEMS, CATEGORY_LABELS } from '../../lib/pretripItems'

const STATUS = { pending: 'pending', pass: 'pass', flag: 'flag' }

export default function PreTrip({ onBack }) {
  const { driver, stats, refreshDriver } = useAuth()
  const [items, setItems] = useState(() =>
    PRE_TRIP_ITEMS.map(i => ({ ...i, status: STATUS.pending, note: '' }))
  )
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)
  const [earned, setEarned]     = useState(null)
  const [flagNote, setFlagNote] = useState({}) // item id → note text

  function setItemStatus(id, status) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  function setItemNote(id, note) {
    setFlagNote(prev => ({ ...prev, [id]: note }))
  }

  const completed = items.filter(i => i.status !== STATUS.pending).length
  const total     = items.length
  const pct       = Math.round((completed / total) * 100)
  const flagged   = items.filter(i => i.status === STATUS.flag)
  const hasIssues = flagged.length > 0

  // Group by category
  const categories = [...new Set(PRE_TRIP_ITEMS.map(i => i.category))]

  async function handleSubmit() {
    if (completed < total) return
    setSubmitting(true)

    const itemsPayload = items.map(i => ({
      id: i.id, label: i.label, status: i.status, note: flagNote[i.id] ?? ''
    }))
    const flaggedIds = flagged.map(i => i.id)
    const pointsEarned = 10

    // Save pre-trip log
    const { error: logErr } = await supabase.from('pre_trip_logs').insert({
      driver_id:     driver.id,
      company_id:    driver.company_id,
      items:         itemsPayload,
      has_issues:    hasIssues,
      flagged_items: flaggedIds,
      notes,
      points_earned: pointsEarned,
    })
    if (logErr) { setSubmitting(false); return }

    // Update streak and points
    const today = new Date().toISOString().split('T')[0]
    const lastDate  = stats.last_pre_trip_date
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = lastDate === yesterday
      ? (stats.current_streak ?? 0) + 1
      : 1

    let bonusPoints = 0
    let bonusReason = ''
    if (newStreak === 7)  { bonusPoints = 100; bonusReason = '🔥 7-Day Streak bonus!' }
    if (newStreak === 30) { bonusPoints = 300; bonusReason = '⚡ 30-Day Streak bonus!' }

    const totalPoints = (stats.total_points ?? 0) + pointsEarned + bonusPoints

    await supabase.from('driver_stats').upsert({
      driver_id:           driver.id,
      total_points:        totalPoints,
      quarter_points:      Math.max(0, (stats.quarter_points ?? 0) + pointsEarned + bonusPoints),
      current_streak:      newStreak,
      longest_streak:      Math.max(stats.longest_streak ?? 0, newStreak),
      last_pre_trip_date:  today,
      updated_at:          new Date().toISOString(),
    })

    // Log base points
    await supabase.from('points_ledger').insert({
      driver_id:  driver.id,
      company_id: driver.company_id,
      points:     pointsEarned,
      reason:     'Daily pre-trip inspection completed',
      category:   'pre_trip',
    })

    // Log streak bonus if applicable
    if (bonusPoints > 0) {
      await supabase.from('points_ledger').insert({
        driver_id:  driver.id,
        company_id: driver.company_id,
        points:     bonusPoints,
        reason:     bonusReason,
        category:   'streak',
      })
    }

    // Check and award badges
    await checkBadges(newStreak, totalPoints)

    await refreshDriver()
    setEarned({ points: pointsEarned, bonus: bonusPoints, streak: newStreak })
    setDone(true)
    setSubmitting(false)
  }

  async function checkBadges(streak, totalPoints) {
    const toAward = []
    if (streak >= 7)         toAward.push('streak_7')
    if (streak >= 30)        toAward.push('streak_30')
    if (totalPoints >= 500)  toAward.push('pts_500')
    if (totalPoints >= 1000) toAward.push('pts_1000')

    for (const badgeId of toAward) {
      await supabase.from('driver_badges').upsert(
        { driver_id: driver.id, badge_id: badgeId },
        { onConflict: 'driver_id,badge_id', ignoreDuplicates: true }
      )
    }
  }

  if (done && earned) {
    return (
      <div className="pretip-result">
        <div className="result-icon">{hasIssues ? '⚠️' : '✅'}</div>
        <h2 className="result-title">Pre-trip {hasIssues ? 'submitted with flags' : 'complete!'}</h2>
        <div className="result-pts">+{earned.points} pts</div>
        {earned.bonus > 0 && (
          <div className="result-bonus">
            🔥 {earned.streak}-day streak! +{earned.bonus} bonus pts
          </div>
        )}
        {hasIssues && (
          <p className="result-sub">
            {flagged.length} item{flagged.length > 1 ? 's' : ''} flagged. Dispatch has been notified.
          </p>
        )}
        <button className="btn-primary" onClick={onBack}>Back to Home</button>
      </div>
    )
  }

  return (
    <div className="pretip">
      {/* Header */}
      <div className="pretip-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Pre-Trip Inspection</h2>
        <div className="pretip-progress-text">{completed}/{total}</div>
      </div>

      {/* Progress bar */}
      <div className="pretip-progress-track">
        <div className="pretip-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="pretip-content">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat)
          return (
            <div key={cat} className="pretip-section">
              <div className="pretip-section-label">{CATEGORY_LABELS[cat]}</div>
              {catItems.map(item => (
                <div key={item.id} className="check-item-row">
                  <div className="check-item-top">
                    <span className="check-item-label">{item.label}</span>
                    <div className="check-btns">
                      <button
                        className={`check-btn pass ${item.status === STATUS.pass ? 'active' : ''}`}
                        onClick={() => setItemStatus(item.id, STATUS.pass)}
                      >✓</button>
                      <button
                        className={`check-btn flag ${item.status === STATUS.flag ? 'active' : ''}`}
                        onClick={() => setItemStatus(item.id, STATUS.flag)}
                      >⚠</button>
                    </div>
                  </div>
                  {item.status === STATUS.flag && (
                    <input
                      className="flag-note"
                      placeholder="Describe the issue…"
                      value={flagNote[item.id] ?? ''}
                      onChange={e => setItemNote(item.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {/* General notes */}
        <div className="pretip-section">
          <div className="pretip-section-label">📝 Additional Notes</div>
          <textarea
            className="notes-area"
            placeholder="Any other observations for dispatch…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          className="btn-primary submit-btn"
          onClick={handleSubmit}
          disabled={completed < total || submitting}
        >
          {submitting
            ? 'Submitting…'
            : completed < total
              ? `Complete all ${total - completed} remaining items`
              : hasIssues
                ? '⚠ Submit with Issues'
                : '✅ Submit — Truck is Good to Go!'}
        </button>
      </div>
    </div>
  )
}
