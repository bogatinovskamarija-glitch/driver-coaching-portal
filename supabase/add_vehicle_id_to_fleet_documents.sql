ALTER TABLE fleet_documents
  ADD COLUMN IF NOT EXISTS vehicle_id   TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT;
