import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = [
  { value: 'insurance',     label: 'Insurance' },
  { value: 'registration',  label: 'Registration / IRP' },
  { value: 'permit',        label: 'Permit (NY, IFTA…)' },
  { value: 'hos',           label: 'HOS / ELD' },
  { value: 'dq',            label: 'Driver Qualification' },
  { value: 'general',       label: 'General' },
]

function fmt(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminDocuments() {
  const { driver } = useAuth()
  const [docs, setDocs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', fleet: 'all', category: 'general' })
  const [file, setFile]       = useState(null)
  const [filter, setFilter]   = useState('all')
  const fileRef = useRef()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('fleet_documents')
      .select('*')
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  async function upload() {
    if (!file || !form.name.trim()) return
    setUploading(true)

    const ext      = file.name.split('.').pop()
    const safeName = `${form.fleet}/${Date.now()}_${crypto.randomUUID()}.${ext}`

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('fleet-documents')
      .upload(safeName, file, { contentType: file.type, upsert: false })

    if (uploadErr) {
      alert(`Upload failed: ${uploadErr.message}`)
      setUploading(false)
      return
    }

    await supabase.from('fleet_documents').insert({
      name:        form.name.trim(),
      description: form.description.trim() || null,
      file_path:   uploadData.path,
      file_type:   file.type,
      file_size:   file.size,
      category:    form.category,
      fleet:       form.fleet,
      uploaded_by: driver?.id,
    })

    setForm({ name: '', description: '', fleet: 'all', category: 'general' })
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(false)
    setUploading(false)
    await load()
  }

  async function deleteDoc(doc) {
    if (!window.confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    await supabase.storage.from('fleet-documents').remove([doc.file_path])
    await supabase.from('fleet_documents').delete().eq('id', doc.id)
    await load()
  }

  async function openDoc(doc) {
    const { data } = await supabase.storage
      .from('fleet-documents')
      .createSignedUrl(doc.file_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.fleet === filter || d.fleet === 'all')
  const catLabel = v => CATEGORIES.find(c => c.value === v)?.label ?? v

  return (
    <div className="admin-docs">
      <div className="admin-drivers-toolbar">
        <div className="admin-filter-row">
          {['all', 'carat', 'pft'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Fleets' : f === 'carat' ? '◆ Carat' : '⬡ PFT'}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)} style={{ marginLeft: 'auto' }}>
          + Upload Document
        </button>
      </div>

      {showForm && (
        <div className="assign-form" style={{ marginBottom: 16 }}>
          <div className="cf-row">
            <label className="cf-label">Document Name *</label>
            <input className="cf-input" placeholder="e.g. Truck 130 Insurance Certificate 2025"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="cf-row">
            <label className="cf-label">Description (optional)</label>
            <input className="cf-input" placeholder="e.g. Progressive Insurance, expires Oct 2025"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="cf-row" style={{ flex: 1 }}>
              <label className="cf-label">Fleet / Audience</label>
              <select className="cf-input" value={form.fleet} onChange={e => setForm(f => ({ ...f, fleet: e.target.value }))}>
                <option value="all">All drivers</option>
                <option value="carat">Carat Expedited only</option>
                <option value="pft">Pro Freight only</option>
              </select>
            </div>
            <div className="cf-row" style={{ flex: 1 }}>
              <label className="cf-label">Category</label>
              <select className="cf-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="cf-row">
            <label className="cf-label">File * (PDF, image, or document)</label>
            <input ref={fileRef} type="file" className="cf-input"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="cf-actions">
            <span className="cf-topics-count">{file ? `${file.name} · ${fmt(file.size)}` : 'No file selected'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-link" onClick={() => { setShowForm(false); setFile(null) }}>Cancel</button>
              <button className="btn-primary" onClick={upload}
                disabled={!file || !form.name.trim() || uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-loader">Loading documents…</div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No documents uploaded yet. Use "+ Upload Document" to add the first one.</p>
      ) : (
        <div className="doc-list">
          {filtered.map(doc => (
            <div key={doc.id} className="doc-row">
              <div className="doc-icon">
                {doc.file_type?.includes('pdf') ? '📄' :
                 doc.file_type?.includes('image') ? '🖼️' : '📋'}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.name}</div>
                {doc.description && <div className="doc-desc">{doc.description}</div>}
                <div className="doc-meta">
                  <span className="doc-cat-chip">{catLabel(doc.category)}</span>
                  <span className="doc-fleet-chip">
                    {doc.fleet === 'all' ? 'All drivers' : doc.fleet === 'carat' ? '◆ Carat' : '⬡ PFT'}
                  </span>
                  {doc.file_size && <span style={{ color: 'var(--text-3)' }}>{fmt(doc.file_size)}</span>}
                  <span style={{ color: 'var(--text-3)' }}>
                    {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="doc-actions">
                <button className="btn-link" style={{ fontSize: 12 }} onClick={() => openDoc(doc)}>View ↗</button>
                <button className="maint-done-btn" style={{ fontSize: 11 }} onClick={() => deleteDoc(doc)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
