import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const medalFor = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null

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
      .select('id, name, company_id, driver_stats(quarter_points, current_streak, modules_completed)')
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
  const isFirst  = myRank === 1
  const leader   = rows[0]
  const ptsToFirst = myRank > 1 && leader ? leader.pts - myPoints : 0

  return (
    <div className="leaderboard">
      <div className="lb-header">
        <div className="lb-title">🏆 Driver Leaderboard</div>
        <div className="lb-sub">#1 driver at quarter end wins $500 · points reset each quarter</div>
      </div>

      {/* Your standing */}
      <div className="lb-my-card">
        <div className="lb-my-top">
          <span className="lb-my-name">{driver?.name?.split(' ')[0] ?? 'You'}</span>
          <span className="lb-my-rank">
            {medalFor(myRank) ?? `#${myRank || '—'}`}
          </span>
        </div>
        <div className="lb-my-pts-row">
          <span className="lb-my-pts-num">{myPoints.toLocaleString()}</span>
          <span className="lb-my-pts-lbl"> pts this quarter</span>
        </div>
        {isFirst ? (
          <div className="lb-reward-earned">
            🥇 You're in the lead! Keep it up to win the $500 quarterly reward.
          </div>
        ) : ptsToFirst > 0 ? (
          <div className="lb-pts-to-first">
            {ptsToFirst.toLocaleString()} pts behind 1st place
          </div>
        ) : null}
      </div>

      {/* Full ranking table */}
      <div className="lb-table">
        {rows.map((row, i) => {
          const rank  = i + 1
          const isMe  = row.id === driver?.id
          const medal = medalFor(rank)
          const maxPts = rows[0]?.pts || 1
          const pct  = Math.min(100, Math.round((row.pts / maxPts) * 100))
          return (
            <div key={row.id} className={`lb-row ${isMe ? 'lb-row-me' : ''} ${rank === 1 ? 'lb-row-leader' : ''}`}>
              <div className="lb-rank">
                {medal ?? <span className="lb-rank-num">{rank}</span>}
              </div>
              <div className="lb-info">
                <div className="lb-driver-name">
                  {row.name}
                  {isMe && <span className="lb-you-tag">You</span>}
                  {rank === 1 && !isMe && <span className="lb-leader-tag">Leader</span>}
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
        Points are earned through daily pre-trips, training modules, streaks, and clean DOT inspections.
        The driver ranked #1 at the end of the quarter wins the $500 reward.
      </div>
    </div>
  )
}
