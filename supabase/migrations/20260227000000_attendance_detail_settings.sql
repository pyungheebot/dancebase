-- attendance status에 'early_leave' 추가
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('present', 'absent', 'late', 'early_leave'));

-- schedules 세부 설정 컬럼
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS late_threshold TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attendance_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS require_checkout BOOLEAN NOT NULL DEFAULT false;

-- attendance 체크인 GPS + 체크아웃 정보
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS check_in_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS check_in_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS check_out_longitude DOUBLE PRECISION;

-- get_user_attendance_stats RPC 함수에 early_leave_count 추가
DROP FUNCTION IF EXISTS get_user_attendance_stats(UUID);
CREATE OR REPLACE FUNCTION get_user_attendance_stats(p_user_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  total_schedules BIGINT,
  present_count BIGINT,
  late_count BIGINT,
  absent_count BIGINT,
  early_leave_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id AS group_id,
    g.name AS group_name,
    COUNT(DISTINCT s.id) AS total_schedules,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS present_count,
    COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END) AS late_count,
    COUNT(DISTINCT s.id)
      - COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END)
      - COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END)
      - COUNT(DISTINCT CASE WHEN a.status = 'early_leave' THEN a.id END) AS absent_count,
    COUNT(DISTINCT CASE WHEN a.status = 'early_leave' THEN a.id END) AS early_leave_count
  FROM groups g
  INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = p_user_id
  LEFT JOIN schedules s ON s.group_id = g.id AND s.starts_at <= NOW()
  LEFT JOIN attendance a ON a.schedule_id = s.id AND a.user_id = p_user_id
  GROUP BY g.id, g.name;
$$;
