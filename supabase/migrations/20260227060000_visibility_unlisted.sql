-- ============================================
-- 3단계 공개 설정: public / unlisted / private
-- ============================================

-- 1-1. CHECK 제약 조건 수정

-- groups.visibility: 기존 CHECK 제거 후 재생성
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_visibility_check;
ALTER TABLE groups ADD CONSTRAINT groups_visibility_check
  CHECK (visibility IN ('public', 'unlisted', 'private'));

-- projects.visibility: 기존 CHECK 제거 후 재생성
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_visibility_check;
ALTER TABLE projects ADD CONSTRAINT projects_visibility_check
  CHECK (visibility IN ('public', 'unlisted', 'private'));

-- 1-2. 그룹 RLS: unlisted 정책 추가
CREATE POLICY "groups_select_unlisted" ON groups
  FOR SELECT USING (visibility = 'unlisted' AND auth.uid() IS NOT NULL);

-- 1-3. 프로젝트 RLS: unlisted 정책 추가
CREATE POLICY "projects_select_unlisted" ON projects
  FOR SELECT USING (visibility = 'unlisted' AND auth.uid() IS NOT NULL);

-- 1-4. project_members RLS: unlisted 정책 추가
CREATE POLICY "project_members_select_unlisted" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND p.visibility = 'unlisted' AND auth.uid() IS NOT NULL
    )
  );

-- 1-5. can_access_project 함수 업데이트: unlisted 조건 추가
CREATE OR REPLACE FUNCTION public.can_access_project(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- 프로젝트 멤버
    SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid()
  )
  OR EXISTS (
    -- 소유 그룹 멤버
    SELECT 1 FROM projects p
    INNER JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = auth.uid()
    WHERE p.id = pid
  )
  OR EXISTS (
    -- 공유 그룹 멤버
    SELECT 1 FROM project_shared_groups psg
    INNER JOIN group_members gm ON gm.group_id = psg.group_id AND gm.user_id = auth.uid()
    WHERE psg.project_id = pid
  )
  OR EXISTS (
    -- 공개 프로젝트
    SELECT 1 FROM projects WHERE id = pid AND visibility = 'public'
  )
  OR EXISTS (
    -- 일부공개 프로젝트 (인증 사용자)
    SELECT 1 FROM projects WHERE id = pid AND visibility = 'unlisted' AND auth.uid() IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1-6. create_project RPC: unlisted 유효성 검증 추가
CREATE OR REPLACE FUNCTION create_project(
  p_group_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT '기타',
  p_enabled_features TEXT[] DEFAULT ARRAY['board'],
  p_visibility TEXT DEFAULT 'private'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '인증이 필요합니다';
  END IF;

  -- 프로젝트 관리 권한 확인
  IF NOT public.can_manage_projects(p_group_id) THEN
    RAISE EXCEPTION '프로젝트 생성 권한이 없습니다';
  END IF;

  -- visibility 유효성 검증
  IF p_visibility NOT IN ('private', 'public', 'unlisted') THEN
    RAISE EXCEPTION '유효하지 않은 공개 설정입니다';
  END IF;

  -- 프로젝트 생성
  INSERT INTO projects (group_id, name, description, type, enabled_features, visibility, created_by)
  VALUES (p_group_id, p_name, p_description, p_type, p_enabled_features, p_visibility, v_user_id)
  RETURNING id INTO v_project_id;

  -- 생성자를 leader로 추가
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'leader');

  RETURN v_project_id;
END;
$$;
