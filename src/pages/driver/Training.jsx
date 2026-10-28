import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const CATEGORY_META = {
  pre_trip:     { icon: '🔦', label: 'Pre-Trip Inspection', color: '#22C55E' },
  hos_eld:      { icon: '⏱️', label: 'HOS & ELD Compliance', color: '#F59E0B' },
  brakes_tires: { icon: '🛑', label: 'Brakes & Tires', color: '#EF4444' },
  safe_driving: { icon: '🚗', label: 'Safe Driving', color: '#3B82F6' },
  motive:       { icon: '📱', label: 'Motive ELD Tutorials', color: '#8B5CF6' },
}

const MOTIVE_TUTORIALS = [
  { id: 'mt1', title: 'Getting Started with Motive ELD', desc: 'Set up your device and connect to the truck', url: 'https://helpmotive.com/hc/en-us/categories/360001782531', icon: '📱' },
  { id: 'mt2', title: 'Creating & Managing Logs', desc: 'How to start a drive, switch duty status, and review your logs', url: 'https://helpmotive.com/hc/en-us/sections/360007344971', icon: '📋' },
  { id: 'mt3', title: 'HOS Rules & Violations', desc: 'Understanding violations and how to avoid them', url: 'https://helpmotive.com/hc/en-us/sections/360007344991', icon: '⚠️' },
  { id: 'mt4', title: 'Unidentified Driving Events', desc: 'How to claim or reject unassigned segments', url: 'https://helpmotive.com/hc/en-us/articles/360038038951', icon: '🔍' },
  { id: 'mt5', title: 'Driver Vehicle Inspection Reports (DVIR)', desc: 'Completing pre-trip and post-trip inspection reports in the app', url: 'https://helpmotive.com/hc/en-us/sections/360007348451', icon: '✅' },
  { id: 'mt6', title: 'Roadside Inspection Mode', desc: 'How to show logs to a DOT officer during a stop', url: 'https://helpmotive.com/hc/en-us/articles/360019767152', icon: '🚔' },
]

function Quiz({ module, onComplete }) {
  const quiz = module.quiz ?? []
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)

  if (quiz.length === 0) {
    return (
      <div className="quiz-done">
        <p>No quiz for this module.</p>
        <button className="btn-primary" onClick={() => onComplete(100)}>Mark Complete</button>
      </div>
    )
  }

  const q = quiz[current]
  const selected = answers[current]
  const isLast   = current === quiz.length - 1

  function pickAnswer(idx) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [current]: idx }))
  }

  function next() {
    if (!isLast) { setCurrent(c => c + 1); return }
    const score = Math.round(
      (quiz.filter((q, i) => answers[i] === q.correct).length / quiz.length) * 100
    )
    setSubmitted(true)
    onComplete(score)
  }

  if (submitted) {
    const correct = quiz.filter((q, i) => answers[i] === q.correct).length
    const score = Math.round((correct / quiz.length) * 100)
    return (
      <div className="quiz-done">
        <div className="quiz-score-circle" style={{ borderColor: score >= 80 ? '#22C55E' : '#EF4444' }}>
          <span className="quiz-score-num">{score}%</span>
          <span className="quiz-score-lbl">{score >= 80 ? 'Passed ✅' : 'Try again'}</span>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 13, textAlign: 'center' }}>
          {correct} of {quiz.length} correct
        </p>
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">Question {current + 1} of {quiz.length}</div>
      <div className="quiz-track">
        <div className="quiz-fill" style={{ width: `${((current) / quiz.length) * 100}%` }} />
      </div>
      <div className="quiz-q">{q.question}</div>
      <div className="quiz-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`quiz-option ${selected === i ? 'selected' : ''}`}
            onClick={() => pickAnswer(i)}
          >
            <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>
      {selected !== undefined && q.explanation && (
        <div className="quiz-explanation">
          {selected === q.correct ? '✅' : '❌'} {q.explanation}
        </div>
      )}
      <button
        className="btn-primary"
        onClick={next}
        disabled={selected === undefined}
      >
        {isLast ? 'Submit Quiz' : 'Next Question →'}
      </button>
    </div>
  )
}

function ModuleDetail({ module, completion, onBack, onComplete }) {
  const [phase, setPhase]   = useState('video') // 'video' | 'quiz'
  const [saving, setSaving] = useState(false)
  const { driver, stats, refreshDriver } = useAuth()

  async function handleQuizDone(score) {
    setSaving(true)
    const passed = score >= 80
    const pts    = passed ? module.points_value : Math.floor(module.points_value * 0.5)

    await supabase.from('module_completions').upsert({
      driver_id:    driver.id,
      module_id:    module.id,
      quiz_score:   score,
      quiz_passed:  passed,
      points_earned: pts,
    }, { onConflict: 'driver_id,module_id' })

    await supabase.from('points_ledger').insert({
      driver_id:  driver.id,
      company_id: driver.company_id,
      points:     pts,
      reason:     `Completed module: ${module.title} (score: ${score}%)`,
      category:   'module',
    })

    const newTotal    = (stats.total_points ?? 0) + pts
    const newCompleted = (stats.modules_completed ?? 0) + (completion ? 0 : 1)
    await supabase.from('driver_stats').upsert({
      driver_id:         driver.id,
      total_points:      newTotal,
      modules_completed: newCompleted,
      updated_at:        new Date().toISOString(),
    })

    // Badge awards
    const badgeMap = { 'pre_trip': 'top_inspector', 'hos_eld': 'hos_pro', 'brakes_tires': 'brake_master' }
    const badgeId  = badgeMap[module.category]
    if (badgeId) {
      await supabase.from('driver_badges').upsert(
        { driver_id: driver.id, badge_id: badgeId },
        { onConflict: 'driver_id,badge_id', ignoreDuplicates: true }
      )
    }

    await refreshDriver()
    setSaving(false)
    onComplete(score, pts)
  }

  const meta = CATEGORY_META[module.category] ?? {}

  return (
    <div className="module-detail">
      <div className="module-detail-header">
        <button className="back-btn" onClick={onBack}>← Modules</button>
        <span className="module-cat-chip" style={{ background: `${meta.color}22`, color: meta.color }}>
          {meta.icon} {meta.label}
        </span>
      </div>
      <h2 className="module-detail-title">{module.title}</h2>
      <p className="module-detail-desc">{module.description}</p>

      {completion && (
        <div className="completion-banner">
          ✅ You completed this — Score: {completion.quiz_score}% · {completion.points_earned} pts earned
        </div>
      )}

      {/* Phase toggle */}
      <div className="phase-toggle">
        <button className={phase === 'video' ? 'active' : ''} onClick={() => setPhase('video')}>
          ▶ Video
        </button>
        <button className={phase === 'quiz' ? 'active' : ''} onClick={() => setPhase('quiz')}>
          📝 Quiz
        </button>
      </div>

      {phase === 'video' && module.youtube_video_id && (
        <div className="video-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${module.youtube_video_id}?rel=0&modestbranding=1`}
            title={module.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setPhase('quiz')}>
            Take the Quiz → ({module.points_value} pts)
          </button>
        </div>
      )}

      {phase === 'video' && !module.youtube_video_id && (
        <div className="no-video">
          <p>No video available. Proceed to the quiz.</p>
          <button className="btn-primary" onClick={() => setPhase('quiz')}>Take the Quiz →</button>
        </div>
      )}

      {phase === 'quiz' && (
        <Quiz module={module} onComplete={handleQuizDone} />
      )}
    </div>
  )
}

export default function Training() {
  const { driver } = useAuth()
  const [modules, setModules]   = useState([])
  const [completions, setCompletions] = useState({})
  const [selected, setSelected] = useState(null)
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    load()
  }, [driver])

  async function load() {
    const [{ data: mods }, { data: comps }] = await Promise.all([
      supabase.from('coaching_modules').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('module_completions').select('*').eq('driver_id', driver.id),
    ])
    setModules(mods ?? [])
    const compMap = {}
    for (const c of (comps ?? [])) compMap[c.module_id] = c
    setCompletions(compMap)
    setLoading(false)
  }

  function handleComplete(score, pts) {
    setResult({ score, pts })
    load()
    setTimeout(() => { setResult(null); setSelected(null) }, 4000)
  }

  if (loading) return <div className="page-loader">Loading modules…</div>

  if (selected) {
    return (
      <ModuleDetail
        module={selected}
        completion={completions[selected.id] ?? null}
        onBack={() => { setSelected(null); setResult(null) }}
        onComplete={handleComplete}
      />
    )
  }

  const done  = modules.filter(m => completions[m.id]?.quiz_passed)
  const total = modules.length

  return (
    <div className="training">
      <div className="training-header">
        <h2>Training Modules</h2>
        <div className="training-progress">
          <div className="training-progress-bar">
            <div style={{ width: `${total ? (done.length / total) * 100 : 0}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
          </div>
          <span>{done.length}/{total} complete</span>
        </div>
      </div>

      {result && (
        <div className={`result-toast ${result.score >= 80 ? 'success' : 'fail'}`}>
          {result.score >= 80
            ? `✅ Passed! +${result.pts} pts earned`
            : `❌ Score: ${result.score}% — Try again to earn full points`}
        </div>
      )}

      {/* Motive Tutorials Section */}
      <div className="motive-section">
        <div className="motive-section-header">
          <span className="motive-icon">📱</span>
          <div>
            <div className="motive-title">Motive ELD Tutorials</div>
            <div className="motive-sub">Official Motive help articles — tap to open in browser</div>
          </div>
        </div>
        <div className="motive-list">
          {MOTIVE_TUTORIALS.map(t => (
            <a key={t.id} href={t.url} target="_blank" rel="noopener noreferrer" className="motive-row">
              <span className="motive-row-icon">{t.icon}</span>
              <div className="motive-row-info">
                <div className="motive-row-title">{t.title}</div>
                <div className="motive-row-desc">{t.desc}</div>
              </div>
              <span className="motive-row-arrow">↗</span>
            </a>
          ))}
        </div>
      </div>

      <div className="section-divider">Training Modules</div>

      <div className="module-list">
        {modules.map(m => {
          const comp = completions[m.id]
          const meta = CATEGORY_META[m.category] ?? {}
          return (
            <div key={m.id} className="module-row" onClick={() => setSelected(m)}>
              <div className="module-row-icon" style={{ background: `${meta.color}22` }}>
                {meta.icon}
              </div>
              <div className="module-row-info">
                <div className="module-row-title">{m.title}</div>
                <div className="module-row-meta">
                  {m.duration_minutes} min · {m.points_value} pts
                  {comp && <span className={`score-tag ${comp.quiz_passed ? 'pass' : 'fail'}`}>
                    {comp.quiz_score}%
                  </span>}
                </div>
              </div>
              <div className="module-row-status">
                {comp?.quiz_passed ? '✅' : comp ? '⚠️' : '→'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
