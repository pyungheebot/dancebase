-- schedule_checkin_codes 테이블 생성
CREATE TABLE IF NOT EXISTS schedule_checkin_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, code)
);

-- RLS 활성화
ALTER TABLE schedule_checkin_codes ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버 읽기 허용: 해당 일정의 그룹 멤버라면 코드 조회 가능
CREATE POLICY "checkin_codes_select"
  ON schedule_checkin_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_checkin_codes.schedule_id
        AND gm.user_id = auth.uid()
    )
  );

-- 리더/매니저만 생성 허용
CREATE POLICY "checkin_codes_insert"
  ON schedule_checkin_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_checkin_codes.schedule_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );

-- 리더/매니저만 삭제 허용
CREATE POLICY "checkin_codes_delete"
  ON schedule_checkin_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_checkin_codes.schedule_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );
