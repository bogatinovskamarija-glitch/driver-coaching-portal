import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const REWARD_THRESHOLD = 1000
const REWARD_AMOUNT    = '$500'

function ProgressBar({ current, max, accent }) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  return (
    <div className="reward-bar-wrap">
      <div className="reward-bar-track">
        <div className="reward-bar-fill" style={{ width: `${pct}%`, background: accent ?? 'var(--accent)' }} />
      </div>
      <div className="reward-bar-labels">
        <span>{current.toLocaleString()} pts</span>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>{pct}% → {REWARD_AMOUNT}</span>
        <span>{max.toLocaleString()} pts</span>
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const { driver, stats } = useAuth()
  const [rows, setRows]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [driver])

  async function load() {
    const { data } = await supabase
      .from('drivers')
      .select('id, name, company_id, driver_stats(total_points, quarter_points, current_streak, modules_completed)')
      .eq('is_active', true)
      .eq('is_admin', false)
      .order('name')
    if (data) {
      const sorted = data
        .map(d => ({
          ...d,
          pts:    d.driver_stats?.[0]?.quarter_points ?? 0,
          streak: d.driver_stats?.[0]?.current_streak ?? 0,
          mods:   d.driver_stats?.[0]?.modules_completed ?? 0,
        }))
        .sort((a, b) => b.pts - a.pts)
      setRows(sorted)
    }
    setLoading(false)
  }

  if (loading) return <div className="page-loader">Loading…</div>

  const myPoints = stats?.quarter_points ?? 0
  const myRank   = rows.findIndex(r => r.id === driver?.id) + 1

  const medalFor = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <div className="lb-title">🏆 Driver Leaderboard</div>
        <div className="lb-sub">1,000 pts this quarter = $500 bonus · resets each quarter</div>
      </div>

      {/* Your progress */}
      <div className="lb-my-card">
        <div className="lb-my-top">
          <span className="lb-my-name">{driver?.name?.split(' ')[0] ?? 'You'}</span>
          <span className="lb-my-rank">#{myRank || '—'}</span>
        </div>
        <ProgressBar current={myPoints} max={REWARD_THRESHOLD} />
        {myPoints >= REWARD_THRESHOLD && (
          <div className="lb-reward-earned">
            🎉 You earned your $500 quarterly reward — see your dispatcher!
          </div>
        )}
      </div>

      {/* Full table */}
      <div className="lb-table">
        {rows.map((row, i) => {
          const rank    = i + 1
          const isMe    = row.id === driver?.id
          const pct     = Math.min(100, Math.round((row.pts / REWARD_THRESHOLD) * 100))
          const medal   = medalFor(rank)
          return (
            <div key={row.id} className={`lb-row ${isMe ? 'lb-row-me' : ''}`}>
              <div className="lb-rank">
                {medal ?? <span className="lb-rank-num">{rank}</span>}
              </div>
              <div className="lb-info">
                <div className="lb-driver-name">
                  {row.name}
                  {isMe && <span className="lb-you-tag">You</span>}
                </div>
                <div className="lb-mini-bar">
                  <div className="lb-mini-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="lb-pts-col">
                <div className="lb-pts-num">{row.pts.toLocaleString()}</div>
                <div className="lb-pts-lbl">pts</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="lb-footer">
        Points are earned through pre-trips, training modules, coaching sessions, and phone inspections.
      </div>
    </div>
  )
}
