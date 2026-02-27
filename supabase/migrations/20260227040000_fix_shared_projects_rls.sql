-- ============================================
-- 공유 프로젝트 RLS 수정
-- INSERT...RETURNING 호환성 복원
-- ============================================

-- 1) projects SELECT 정책: 기존 그룹 멤버 정책 복원 + 공유/공개 접근 정책 추가
--    PostgreSQL은 동일 테이블의 SELECT 정책을 OR로 결합
DROP POLICY IF EXISTS "projects_select" ON projects;

-- 기존 동작 복원 (소유 그룹 멤버 → INSERT...RETURNING 호환)
CREATE POLICY "projects_select_member" ON projects
  FOR SELECT USING (public.is_group_member(group_id));

-- 공유 그룹 멤버
CREATE POLICY "projects_select_shared" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_shared_groups psg
      INNER JOIN group_members gm ON gm.group_id = psg.group_id AND gm.user_id = auth.uid()
      WHERE psg.project_id = id
    )
  );

-- 공개 프로젝트
CREATE POLICY "projects_select_public" ON projects
  FOR SELECT USING (visibility = 'public');

-- 2) project_members SELECT 정책도 동일 패턴으로 수정
DROP POLICY IF EXISTS "project_members_select" ON project_members;

-- 소유 그룹 멤버 (기존 동작)
CREATE POLICY "project_members_select_member" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND public.is_group_member(p.group_id)
    )
  );

-- 공유 그룹 멤버
CREATE POLICY "project_members_select_shared" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN project_shared_groups psg ON psg.project_id = p.id
      INNER JOIN group_members gm ON gm.group_id = psg.group_id AND gm.user_id = auth.uid()
      WHERE p.id = project_id
    )
  );

-- 공개 프로젝트
CREATE POLICY "project_members_select_public" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.visibility = 'public'
    )
  );
