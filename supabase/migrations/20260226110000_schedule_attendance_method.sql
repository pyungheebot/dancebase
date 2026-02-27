ALTER TABLE schedules
  ADD COLUMN attendance_method TEXT NOT NULL DEFAULT 'admin'
    CHECK (attendance_method IN ('admin', 'location', 'none')),
  ADD COLUMN address TEXT,
  ADD COLUMN latitude DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION;

ALTER TABLE schedules
  ADD CONSTRAINT schedules_location_coords_check
    CHECK (attendance_method <> 'location' OR (latitude IS NOT NULL AND longitude IS NOT NULL));
