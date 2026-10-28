import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CAT_ICONS = {
  insurance:    '🛡️',
  registration: '📋',
  permit:       '✅',
  hos:          '⏱️',
  dq:           '👤',
  general:      '📄',
}

const CAT_LABELS = {
  insurance:    'Insurance',
  registration: 'Registration / IRP',
  permit:       'Permit',
  hos:          'HOS / ELD',
  dq:           'Driver Qualification',
  general:      'General',
}

function fmt(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Docs() {
  const { driver } = useAuth()
  const [docs, setDocs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(null)

  useEffect(() => {
    if (!driver) return
    load()
  }, [driver])

  async function load() {
    const { data } = await supabase
      .from('fleet_documents')
      .select('*')
      .or(`fleet.eq.all,fleet.eq.${driver.company_id}`)
      .order('category')
      .order('name')
    setDocs(data ?? [])
    setLoading(false)
  }

  async function open(doc) {
    setOpening(doc.id)
    const { data, error } = await supabase.storage
      .from('fleet-documents')
      .createSignedUrl(doc.file_path, 3600)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      alert('Could not open document. Try again.')
    }
    setOpening(null)
  }

  if (loading) return <div className="page-loader">Loading documents…</div>

  // Group by category
  const grouped = {}
  for (const doc of docs) {
    const cat = doc.category ?? 'general'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(doc)
  }

  return (
    <div className="driver-docs">
      <div className="training-header">
        <h2>My Documents</h2>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          Tap any document to view or download
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="empty-card">
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontWeight: 600 }}>No documents yet</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
            Your dispatcher will upload your compliance documents here.
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catDocs]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div className="section-divider" style={{ marginBottom: 10 }}>
              {CAT_ICONS[cat] ?? '📄'} {CAT_LABELS[cat] ?? cat}
            </div>
            {catDocs.map(doc => (
              <div key={doc.id} className="driver-doc-row" onClick={() => open(doc)}>
                <div className="driver-doc-icon">
                  {doc.file_type?.includes('pdf') ? '📄' :
                   doc.file_type?.includes('image') ? '🖼️' : '📋'}
                </div>
                <div className="driver-doc-info">
                  <div className="driver-doc-name">{doc.name}</div>
                  {doc.description && (
                    <div className="driver-doc-desc">{doc.description}</div>
                  )}
                  {doc.file_size && (
                    <div className="driver-doc-meta">{fmt(doc.file_size)}</div>
                  )}
                </div>
                <div className="driver-doc-arrow">
                  {opening === doc.id ? '⏳' : '↓'}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
