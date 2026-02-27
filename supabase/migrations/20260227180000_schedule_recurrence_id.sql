-- 반복 일정 시리즈 ID 컬럼 추가
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS recurrence_id uuid DEFAULT NULL;

-- 조회 성능을 위한 인덱스 (recurrence_id가 있는 행만)
CREATE INDEX IF NOT EXISTS idx_schedules_recurrence_id ON schedules(recurrence_id) WHERE recurrence_id IS NOT NULL;
