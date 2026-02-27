-- ============================================
-- 서브리더(부그룹장) 역할 추가
-- ============================================

-- group_members.role에 'sub_leader' 추가
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_role_check
  CHECK (role IN ('leader', 'sub_leader', 'member'));

-- entity_permissions.permission에 'member_manage' 권한 추가
ALTER TABLE entity_permissions DROP CONSTRAINT IF EXISTS entity_permissions_permission_check;
ALTER TABLE entity_permissions ADD CONSTRAINT entity_permissions_permission_check
  CHECK (permission IN (
    'finance_view', 'finance_manage', 'project_manage', 'member_manage'
  ));

-- ============================================
-- sub_leader도 멤버를 초대/제거 가능하도록 RLS 업데이트
-- ============================================

-- 기존 group_members INSERT 정책에 sub_leader 조건 추가
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (
  -- 그룹의 리더가 멤버 추가 가능
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'leader'
  )
  OR
  -- 그룹의 부그룹장이 멤버 추가 가능 (sub_leader 역할만)
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'sub_leader'
  )
  OR
  -- 그룹 생성자가 자기 자신을 추가 (최초 가입)
  (
    group_members.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
        AND g.created_by = auth.uid()
    )
  )
  OR
  -- 초대 코드를 알고 있는 사용자가 자기 자신을 추가 (invite_code 기반 가입)
  (
    group_members.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
        AND g.join_policy IN ('open', 'invite_only')
    )
  )
);

-- group_members DELETE 정책: sub_leader는 일반 멤버만 제거 가능
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (
  -- 본인 탈퇴
  user_id = auth.uid()
  OR
  -- 리더는 누구든 제거 가능
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'leader'
  )
  OR
  -- 부그룹장은 일반 멤버만 제거 가능
  (
    group_members.role = 'member'
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'sub_leader'
    )
  )
);
