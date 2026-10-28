export const PRE_TRIP_ITEMS = [
  // Lights — our #1 violation category
  { id: 'headlights',      category: 'lights',      label: 'Headlights (low & high beam)' },
  { id: 'clearance_lamps', category: 'lights',      label: 'Clearance & marker lamps' },
  { id: 'brake_lights',    category: 'lights',      label: 'Taillights & brake lights' },
  { id: 'reflectors',      category: 'lights',      label: 'Reflectors (all sides)' },
  // Vision
  { id: 'mirrors',         category: 'vision',      label: 'Mirrors (clean, adjusted, no cracks)' },
  { id: 'windshield',      category: 'vision',      label: 'Windshield & wipers work' },
  // Engine & Fluids
  { id: 'oil',             category: 'engine',      label: 'Oil level' },
  { id: 'coolant',         category: 'engine',      label: 'Coolant level' },
  { id: 'fuel',            category: 'engine',      label: 'Fuel level' },
  // Tires — 55% OOS rate in our fleet
  { id: 'tires_tread',     category: 'tires',       label: 'Tire tread depth (all axles)' },
  { id: 'tires_sidewall',  category: 'tires',       label: 'Tire sidewalls (no cracks/bulges)' },
  { id: 'tires_inflation', category: 'tires',       label: 'Tire inflation (visual/gauge check)' },
  // Brakes — 56% OOS rate in our fleet
  { id: 'brake_lines',     category: 'brakes',      label: 'Brake lines & hoses (no leaks)' },
  { id: 'brake_adjustment',category: 'brakes',      label: 'Brake adjustment (visual pushrod check)' },
  { id: 'air_pressure',    category: 'brakes',      label: 'Air pressure gauges (85–100 psi)' },
  // Safety Equipment
  { id: 'emergency_kit',   category: 'safety',      label: 'Emergency kit (triangles, extinguisher)' },
  // Compliance
  { id: 'eld',             category: 'compliance',  label: 'ELD connected & synced' },
  { id: 'permits',         category: 'compliance',  label: 'Registration & permits in cab' },
  { id: 'driver_docs',     category: 'compliance',  label: 'License & medical card in cab' },
  // Trailer
  { id: 'trailer_lights',  category: 'trailer',     label: 'Trailer lights connected & working' },
]

export const CATEGORY_LABELS = {
  lights:     '🔦 Lights',
  vision:     '👁️ Vision',
  engine:     '⚙️ Engine',
  tires:      '🔄 Tires',
  brakes:     '🛑 Brakes',
  safety:     '🦺 Safety',
  compliance: '📋 Compliance',
  trailer:    '🚚 Trailer',
}
