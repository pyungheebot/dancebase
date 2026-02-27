-- RLS 재귀 문제를 해결하기 위해 Security Definer 헬퍼 함수 사용

-- 헬퍼 함수: 사용자가 그룹 멤버인지 확인 (RLS 우회)
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 헬퍼 함수: 사용자가 그룹 리더인지 확인 (RLS 우회)
CREATE OR REPLACE FUNCTION public.is_group_leader(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid() AND role = 'leader'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "groups_insert" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;
DROP POLICY IF EXISTS "schedules_select" ON schedules;
DROP POLICY IF EXISTS "schedules_insert" ON schedules;
DROP POLICY IF EXISTS "schedules_update" ON schedules;
DROP POLICY IF EXISTS "schedules_delete" ON schedules;
DROP POLICY IF EXISTS "attendance_select" ON attendance;
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
DROP POLICY IF EXISTS "attendance_update" ON attendance;

-- ============================================
-- 재생성: 헬퍼 함수 기반 RLS 정책
-- ============================================

-- groups
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (public.is_group_member(id));

CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (public.is_group_leader(id));

CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (public.is_group_leader(id));

-- group_members
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_group_leader(group_id)
  );

CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_group_leader(group_id)
  );

-- schedules
CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT WITH CHECK (public.is_group_leader(group_id));

CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE USING (public.is_group_leader(group_id));

CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE USING (public.is_group_leader(group_id));

-- attendance
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id AND public.is_group_member(s.group_id)
    )
  );

CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id AND public.is_group_leader(s.group_id)
    )
  );

CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id AND public.is_group_leader(s.group_id)
    )
  );
