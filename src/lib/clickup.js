const BASE  = 'https://api.clickup.com/api/v2'
const TOKEN = import.meta.env.VITE_CLICKUP_API_KEY

const LIST_IDS = {
  caratDrivers:   import.meta.env.VITE_CLICKUP_CARAT_DRIVERS_LIST_ID?.trim(),
  caratTrucks:    import.meta.env.VITE_CLICKUP_CARAT_TRUCKS_LIST_ID?.trim(),
  caratTrailers:  import.meta.env.VITE_CLICKUP_CARAT_TRAILERS_LIST_ID?.trim(),
  pftDrivers:     import.meta.env.VITE_CLICKUP_PFT_DRIVERS_LIST_ID?.trim(),
  pftTrucks:      import.meta.env.VITE_CLICKUP_PFT_TRUCKS_LIST_ID?.trim(),
  pftTrailers:    import.meta.env.VITE_CLICKUP_PFT_TRAILERS_LIST_ID?.trim(),
}

const headers = { Authorization: TOKEN, 'Content-Type': 'application/json' }

async function fetchList(listId) {
  if (!listId) return []
  const res = await fetch(`${BASE}/list/${listId}/task?archived=false&page=0&include_closed=false`, { headers })
  if (!res.ok) return []
  const { tasks } = await res.json()
  return tasks ?? []
}

async function fetchTask(taskId) {
  if (!taskId) return null
  const res = await fetch(`${BASE}/task/${taskId}`, { headers })
  if (!res.ok) return null
  return res.json()
}

function getField(task, ...names) {
  for (const name of names) {
    for (const f of task.custom_fields ?? []) {
      if (f.name.toLowerCase().trim() !== name.toLowerCase().trim()) continue
      if (f.value === undefined || f.value === null || f.value === '') continue
      if (f.type === 'date') {
        const d = new Date(Number(f.value))
        return { raw: Number(f.value), display: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
      }
      if (typeof f.value === 'object' && !Array.isArray(f.value)) {
        return f.value.formatted_address || f.value.address || ''
      }
      const opts = f.type_config?.options
      if (opts) {
        const opt = opts.find(o => o.id === f.value) ?? opts.find(o => String(o.orderindex) === String(f.value))
        if (opt) return opt.name
      }
      return String(f.value)
    }
  }
  return null
}

function getUrlField(task, ...names) {
  for (const name of names) {
    for (const f of task.custom_fields ?? []) {
      if (f.name.toLowerCase().trim() !== name.toLowerCase().trim()) continue
      if (f.value) return String(f.value)
    }
  }
  return null
}

function getEmailField(task) {
  for (const f of task.custom_fields ?? []) {
    if (f.name.toLowerCase() === 'email' && f.value) return String(f.value).toLowerCase().trim()
  }
  return null
}

function getDaysUntil(dateObj) {
  if (!dateObj || typeof dateObj !== 'object') return null
  const now = Date.now()
  return Math.ceil((dateObj.raw - now) / (1000 * 60 * 60 * 24))
}

export function normalizeDriver(task, company) {
  const cdl        = getField(task, 'cdl', 'cdl expiry')
  const medCert    = getField(task, 'med cert', 'medical certificate', 'medical card')
  const mvr        = getField(task, 'mvr')
  const psp        = getField(task, 'psp')
  const clearhouse = getField(task, 'clearinghouse')
  const irp        = getField(task, 'irp')

  return {
    id:           task.id,
    name:         task.name,
    company,
    email:        getEmailField(task),
    phone:        getField(task, 'phone'),
    cdlNumber:    getField(task, 'cdl number'),
    cdlState:     getField(task, 'cdl state'),
    cdlExpiry:    cdl,
    cdlDaysLeft:  getDaysUntil(cdl),
    medCert,
    medDaysLeft:  getDaysUntil(medCert),
    mvr,
    psp,
    clearhouse,
    irp,
    twic:         getField(task, 'twic'),
    endorsements: getField(task, 'endorsements'),
    driverType:   getField(task, 'driver type'),
    doh:          getField(task, 'doh'),
    driveFolder:  getUrlField(task, 'drive folder path'),
    // linked equipment (relationship field returns array of task IDs)
    truckTaskId:  getRelationshipId(task, 'truck', 'driver'),
    trailerTaskId: getRelationshipId(task, 'trailer', 'trailers', 'trailer number'),
    status:       task.status?.status?.toLowerCase() ?? 'active',
  }
}

function getRelationshipId(task, ...names) {
  for (const name of names) {
    for (const f of task.custom_fields ?? []) {
      if (f.name.toLowerCase().trim() !== name.toLowerCase().trim()) continue
      if (Array.isArray(f.value) && f.value.length > 0) return f.value[0].id ?? f.value[0]
    }
  }
  return null
}

export function normalizeTruck(task, company) {
  const reg = getField(task, 'registration', 'registration ')
  const irp = getField(task, 'irp')
  return {
    id:           task.id,
    name:         task.name,
    company,
    year:         getField(task, 'year'),
    make:         getField(task, 'make'),
    vin:          getField(task, 'vin'),
    plate:        getField(task, 'plate'),
    registration: reg,
    regDaysLeft:  getDaysUntil(reg),
    irp,
    irpDaysLeft:  getDaysUntil(irp),
    insurance:    getField(task, 'insurance'),
    nyPermit:     getField(task, 'ny permit'),
    ifta:         getField(task, 'ifta 2026'),
    driveFolder:  getUrlField(task, 'drive folder path'),
  }
}

export function normalizeTrailer(task) {
  const irp         = getField(task, 'irp')
  const expirations = getField(task, 'expirations')
  return {
    id:           task.id,
    name:         task.name,
    trailerType:  getField(task, 'trailer type'),
    year:         getField(task, 'year'),
    make:         getField(task, 'make'),
    vin:          getField(task, 'vin'),
    plate:        getField(task, 'plate'),
    irp,
    irpDaysLeft:  getDaysUntil(irp),
    expirations,
    expDaysLeft:  getDaysUntil(expirations),
    insurance:    getField(task, 'insurance'),
    nyPermit:     getField(task, 'ny permit'),
    driveFolder:  getUrlField(task, 'drive folder path'),
  }
}

// Find a driver by email across both companies
export async function findDriverByEmail(email) {
  const lower = email.toLowerCase().trim()
  const [caratTasks, pftTasks] = await Promise.all([
    fetchList(LIST_IDS.caratDrivers),
    fetchList(LIST_IDS.pftDrivers),
  ])
  const caratMatch = caratTasks.find(t => getEmailField(t) === lower)
  if (caratMatch) return normalizeDriver(caratMatch, 'carat')
  const pftMatch = pftTasks.find(t => getEmailField(t) === lower)
  if (pftMatch) return normalizeDriver(pftMatch, 'pft')
  return null
}

// Fetch all active drivers for admin dashboard
export async function fetchAllDrivers() {
  const [caratTasks, pftTasks] = await Promise.all([
    fetchList(LIST_IDS.caratDrivers),
    fetchList(LIST_IDS.pftDrivers),
  ])
  const isActive = t => t.status?.status?.toLowerCase() === 'active'
  return [
    ...caratTasks.filter(isActive).map(t => normalizeDriver(t, 'carat')),
    ...pftTasks.filter(isActive).map(t => normalizeDriver(t, 'pft')),
  ]
}

// Fetch truck detail by task ID
export async function fetchTruckById(taskId) {
  if (!taskId) return null
  const task = await fetchTask(taskId)
  if (!task) return null
  const company = task.list?.id === LIST_IDS.caratTrucks ? 'carat' : 'pft'
  return normalizeTruck(task, company)
}

// Fetch trailer detail by task ID
export async function fetchTrailerById(taskId) {
  if (!taskId) return null
  const task = await fetchTask(taskId)
  if (!task) return null
  return normalizeTrailer(task)
}

// Fetch all equipment for admin
export async function fetchAllEquipment() {
  const [caratTrucks, pftTrucks, caratTrailers, pftTrailers] = await Promise.all([
    fetchList(LIST_IDS.caratTrucks),
    fetchList(LIST_IDS.pftTrucks),
    fetchList(LIST_IDS.caratTrailers),
    fetchList(LIST_IDS.pftTrailers),
  ])
  const isActive = t => t.status?.status?.toLowerCase() === 'active'
  return {
    trucks: [
      ...caratTrucks.filter(isActive).map(t => normalizeTruck(t, 'carat')),
      ...pftTrucks.filter(isActive).map(t => normalizeTruck(t, 'pft')),
    ],
    trailers: [
      ...caratTrailers.filter(isActive).map(normalizeTrailer),
      ...pftTrailers.filter(isActive).map(normalizeTrailer),
    ],
  }
}
