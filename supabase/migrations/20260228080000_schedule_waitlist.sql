-- schedules 테이블에 max_attendees 컬럼 추가
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS max_attendees INT DEFAULT NULL;

-- schedule_waitlist 테이블 생성
CREATE TABLE IF NOT EXISTS schedule_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position INT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, user_id)
);

-- RLS 활성화
ALTER TABLE schedule_waitlist ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 읽기 허용
CREATE POLICY "schedule_waitlist_select"
  ON schedule_waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- 본인만 등록 허용
CREATE POLICY "schedule_waitlist_insert"
  ON schedule_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 본인만 삭제 허용
CREATE POLICY "schedule_waitlist_delete"
  ON schedule_waitlist
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
