-- ============================================
-- 공유 프로젝트(Shared Projects) 기능
-- ============================================

-- 1) project_shared_groups 테이블
CREATE TABLE project_shared_groups (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT now(),
  shared_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (project_id, group_id)
);

ALTER TABLE project_shared_groups ENABLE ROW LEVEL SECURITY;

-- 2) projects.visibility 컬럼
ALTER TABLE projects ADD COLUMN visibility TEXT DEFAULT 'private'
  CHECK (visibility IN ('private', 'public'));

-- 3) can_access_project 헬퍼 함수
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
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4) RLS 정책 교체

-- 4-1) projects_select 교체
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (public.can_access_project(id));

-- 4-2) project_members_select 교체
DROP POLICY IF EXISTS "project_members_select" ON project_members;
CREATE POLICY "project_members_select" ON project_members
  FOR SELECT USING (public.can_access_project(project_id));

-- 4-3) can_access_post 업데이트: 프로젝트 접근 시 can_access_project 사용
CREATE OR REPLACE FUNCTION public.can_access_post(p_group_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    CASE
      WHEN p_project_id IS NOT NULL THEN
        public.can_access_project(p_project_id)
      ELSE
        public.is_group_member(p_group_id)
    END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4-4) project_shared_groups RLS
CREATE POLICY "psg_select" ON project_shared_groups
  FOR SELECT USING (public.can_access_project(project_id));

CREATE POLICY "psg_insert" ON project_shared_groups
  FOR INSERT WITH CHECK (
    public.is_project_leader(project_id)
    OR EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND public.is_group_leader(p.group_id)
    )
  );

CREATE POLICY "psg_delete" ON project_shared_groups
  FOR DELETE USING (
    public.is_project_leader(project_id)
    OR EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND public.is_group_leader(p.group_id)
    )
  );

-- 5) get_group_projects RPC 재생성: 소유 + 공유 프로젝트, is_shared/visibility/board_independent 추가
DROP FUNCTION IF EXISTS get_group_projects(UUID, UUID);
CREATE OR REPLACE FUNCTION get_group_projects(p_group_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  status TEXT,
  enabled_features TEXT[],
  finance_independent BOOLEAN,
  board_independent BOOLEAN,
  visibility TEXT,
  is_shared BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  -- 소유 프로젝트
  SELECT
    p.id, p.group_id, p.name, p.description, p.type, p.status,
    p.enabled_features, p.finance_independent, p.board_independent,
    p.visibility, false AS is_shared, p.created_by,
    p.created_at, p.updated_at,
    COUNT(pm.id) AS member_count
  FROM projects p
  LEFT JOIN project_members pm ON pm.project_id = p.id
  WHERE p.group_id = p_group_id
  GROUP BY p.id

  UNION ALL

  -- 공유 프로젝트
  SELECT
    p.id, p.group_id, p.name, p.description, p.type, p.status,
    p.enabled_features, p.finance_independent, p.board_independent,
    p.visibility, true AS is_shared, p.created_by,
    p.created_at, p.updated_at,
    COUNT(pm.id) AS member_count
  FROM projects p
  INNER JOIN project_shared_groups psg ON psg.project_id = p.id AND psg.group_id = p_group_id
  LEFT JOIN project_members pm ON pm.project_id = p.id
  GROUP BY p.id

  ORDER BY created_at DESC;
$$;

-- 6) get_public_projects RPC 신규
CREATE OR REPLACE FUNCTION get_public_projects(p_search TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  group_name TEXT,
  name TEXT,
  description TEXT,
  type TEXT,
  status TEXT,
  visibility TEXT,
  created_at TIMESTAMPTZ,
  member_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id, p.group_id, g.name AS group_name,
    p.name, p.description, p.type, p.status, p.visibility,
    p.created_at,
    COUNT(pm.id) AS member_count
  FROM projects p
  INNER JOIN groups g ON g.id = p.group_id
  LEFT JOIN project_members pm ON pm.project_id = p.id
  WHERE p.visibility = 'public'
    AND p.status != '종료'
    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
  GROUP BY p.id, g.name
  ORDER BY p.created_at DESC;
$$;
