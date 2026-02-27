-- schedule_roles 테이블 생성
CREATE TABLE IF NOT EXISTS schedule_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, user_id, role_name)
);

-- RLS 활성화
ALTER TABLE schedule_roles ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버 읽기 허용 (일정이 속한 그룹의 멤버)
CREATE POLICY "schedule_roles_select"
  ON schedule_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_roles.schedule_id
        AND gm.user_id = auth.uid()
    )
  );

-- 리더/매니저(sub_leader)만 생성 허용
CREATE POLICY "schedule_roles_insert"
  ON schedule_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );

-- 리더/매니저(sub_leader)만 삭제 허용
CREATE POLICY "schedule_roles_delete"
  ON schedule_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_roles.schedule_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('leader', 'sub_leader')
    )
  );
