import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { findDriverByEmail, fetchTruckById, fetchTrailerById } from '../../lib/clickup'

function DocCard({ label, value, daysLeft, url }) {
  const statusCls = daysLeft === null ? '' : daysLeft < 0 ? 'doc-expired' : daysLeft < 30 ? 'doc-warning' : 'doc-ok'
  const statusTxt = daysLeft === null ? null : daysLeft < 0 ? '⛔ EXPIRED' : daysLeft < 30 ? `⚠️ ${daysLeft}d left` : `✅ ${daysLeft}d`

  return (
    <div className={`doc-card ${statusCls}`}>
      <div className="doc-card-label">{label}</div>
      <div className="doc-card-value">{value || '—'}</div>
      {statusTxt && <div className="doc-card-status">{statusTxt}</div>}
      {url && (
        <a className="doc-card-link" href={url} target="_blank" rel="noopener noreferrer">
          Open Document ↗
        </a>
      )}
    </div>
  )
}

function Section({ title, icon, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="doc-section">
      <button className="doc-section-header" onClick={() => setOpen(o => !o)}>
        <span>{icon} {title}</span>
        <span className="doc-section-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="doc-section-body">{children}</div>}
    </div>
  )
}

export default function Documents() {
  const { driver } = useAuth()
  const [clickupDriver, setClickupDriver] = useState(null)
  const [truck, setTruck]     = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    load()
  }, [driver])

  async function load() {
    try {
      const cd = await findDriverByEmail(driver.email)
      if (!cd) { setError('Driver not found in ClickUp.'); setLoading(false); return }
      setClickupDriver(cd)
      const [t, tr] = await Promise.all([
        fetchTruckById(cd.truckTaskId),
        fetchTrailerById(cd.trailerTaskId),
      ])
      setTruck(t)
      setTrailer(tr)
    } catch (e) {
      setError('Failed to load documents. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="page-loader">Loading documents…</div>

  if (error) return (
    <div className="docs-error">
      <div className="docs-error-icon">⚠️</div>
      <p>{error}</p>
      <button className="btn-primary" onClick={() => { setLoading(true); setError(null); load() }}>
        Retry
      </button>
    </div>
  )

  return (
    <div className="docs">
      <div className="docs-header">
        <h2>My Documents</h2>
        <p className="docs-sub">Pulled live from company records</p>
      </div>

      {/* Driver documents */}
      {clickupDriver && (
        <Section title="Driver Documents" icon="👤">
          <DocCard
            label="CDL State"
            value={clickupDriver.cdlState}
            daysLeft={clickupDriver.cdlDaysLeft}
          />
          <DocCard
            label="Medical Certificate"
            value={clickupDriver.medDaysLeft !== null ? `Expires in ${clickupDriver.medDaysLeft}d` : 'No expiry on file'}
            daysLeft={clickupDriver.medDaysLeft}
          />
          {clickupDriver.mvr && (
            <DocCard label="MVR" value="On file" daysLeft={null} />
          )}
          {clickupDriver.psp && (
            <DocCard label="PSP" value="On file" daysLeft={null} />
          )}
          {clickupDriver.clearhouse && (
            <DocCard label="Clearinghouse" value={clickupDriver.clearhouse} daysLeft={null} />
          )}
          {clickupDriver.driveFolder && (
            <div className="doc-folder-link">
              <a href={clickupDriver.driveFolder} target="_blank" rel="noopener noreferrer">
                📁 Open My Driver Folder
              </a>
            </div>
          )}
        </Section>
      )}

      {/* Truck documents */}
      {truck && (
        <Section title={`Truck: ${truck.name}`} icon="🚛">
          {truck.unitNumber && <DocCard label="Unit #" value={truck.unitNumber} daysLeft={null} />}
          {truck.plate && <DocCard label="Plate" value={truck.plate} daysLeft={null} />}
          {truck.vin && <DocCard label="VIN" value={truck.vin} daysLeft={null} />}
          <DocCard
            label="Registration"
            value={truck.regDaysLeft !== null ? `Expires in ${truck.regDaysLeft}d` : 'On file'}
            daysLeft={truck.regDaysLeft}
          />
          <DocCard
            label="IRP"
            value={truck.irpDaysLeft !== null ? `Expires in ${truck.irpDaysLeft}d` : 'On file'}
            daysLeft={truck.irpDaysLeft}
          />
          {truck.insurance && <DocCard label="Insurance" value="On file" daysLeft={null} />}
          {truck.nyPermit && <DocCard label="NY HUT Permit" value="On file" daysLeft={null} />}
          {truck.ifta && <DocCard label="IFTA" value="On file" daysLeft={null} />}
          {truck.driveFolder && (
            <div className="doc-folder-link">
              <a href={truck.driveFolder} target="_blank" rel="noopener noreferrer">
                📁 Open Truck Folder
              </a>
            </div>
          )}
        </Section>
      )}

      {/* Trailer documents */}
      {trailer && (
        <Section title={`Trailer: ${trailer.name}`} icon="🔗">
          {trailer.unitNumber && <DocCard label="Unit #" value={trailer.unitNumber} daysLeft={null} />}
          {trailer.plate && <DocCard label="Plate" value={trailer.plate} daysLeft={null} />}
          {trailer.vin && <DocCard label="VIN" value={trailer.vin} daysLeft={null} />}
          <DocCard
            label="IRP"
            value={trailer.irpDaysLeft !== null ? `Expires in ${trailer.irpDaysLeft}d` : 'On file'}
            daysLeft={trailer.irpDaysLeft}
          />
          {trailer.insurance && <DocCard label="Insurance" value="On file" daysLeft={null} />}
          {trailer.nyPermit && <DocCard label="NY HUT Permit" value="On file" daysLeft={null} />}
          {trailer.driveFolder && (
            <div className="doc-folder-link">
              <a href={trailer.driveFolder} target="_blank" rel="noopener noreferrer">
                📁 Open Trailer Folder
              </a>
            </div>
          )}
        </Section>
      )}

      <p className="docs-note">
        Document details are pulled from ClickUp. Contact dispatch to update any information.
      </p>
    </div>
  )
}
