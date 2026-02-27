-- group_members의 자기참조 RLS 정책이 무한 재귀를 유발하므로 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "schedules_select" ON schedules;
DROP POLICY IF EXISTS "attendance_select" ON attendance;
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
DROP POLICY IF EXISTS "attendance_update" ON attendance;

-- group_members: 본인 멤버십은 항상 조회 가능 + 같은 그룹 멤버도 조회 가능
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR group_id IN (
      SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
    )
  );

-- groups: 멤버만 조회 (group_members 직접 조회로 재귀 방지)
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    id IN (
      SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
    )
  );

-- schedules: 멤버만 조회
CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
    )
  );

-- attendance: 멤버만 조회
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    schedule_id IN (
      SELECT s.id FROM schedules s
      WHERE s.group_id IN (
        SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
      )
    )
  );

-- attendance: 본인 출석 또는 리더가 기록
CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR schedule_id IN (
      SELECT s.id FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE gm.user_id = auth.uid() AND gm.role = 'leader'
    )
  );

-- attendance: 본인 출석 수정 또는 리더가 수정
CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    user_id = auth.uid()
    OR schedule_id IN (
      SELECT s.id FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE gm.user_id = auth.uid() AND gm.role = 'leader'
    )
  );
