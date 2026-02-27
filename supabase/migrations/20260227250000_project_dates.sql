-- ============================================
-- 프로젝트 기간(시작일/종료일) 컬럼 추가
-- ============================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS start_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS end_date date DEFAULT NULL;

-- ============================================
-- get_group_projects RPC 수정 (start_date, end_date 포함)
-- ============================================

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
  visibility TEXT,
  is_shared BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT,
  start_date DATE,
  end_date DATE
)
LANGUAGE sql STABLE
AS $$
  -- 소유 프로젝트
  SELECT
    p.id, p.group_id, p.name, p.description, p.type, p.status,
    COALESCE(
      (SELECT array_agg(ef.feature) FROM entity_features ef WHERE ef.entity_type = 'project' AND ef.entity_id = p.id AND ef.enabled = true),
      '{}'
    ) AS enabled_features,
    p.visibility, false AS is_shared, p.created_by,
    p.created_at, p.updated_at,
    COUNT(pm.id) AS member_count,
    p.start_date, p.end_date
  FROM projects p
  LEFT JOIN project_members pm ON pm.project_id = p.id
  WHERE p.group_id = p_group_id
  GROUP BY p.id

  UNION ALL

  -- 공유 프로젝트
  SELECT
    p.id, p.group_id, p.name, p.description, p.type, p.status,
    COALESCE(
      (SELECT array_agg(ef.feature) FROM entity_features ef WHERE ef.entity_type = 'project' AND ef.entity_id = p.id AND ef.enabled = true),
      '{}'
    ) AS enabled_features,
    p.visibility, true AS is_shared, p.created_by,
    p.created_at, p.updated_at,
    COUNT(pm.id) AS member_count,
    p.start_date, p.end_date
  FROM projects p
  INNER JOIN project_shared_groups psg ON psg.project_id = p.id AND psg.group_id = p_group_id
  LEFT JOIN project_members pm ON pm.project_id = p.id
  GROUP BY p.id

  ORDER BY created_at DESC;
$$;

-- ============================================
-- create_project RPC 수정 (start_date, end_date 파라미터 추가)
-- ============================================

DROP FUNCTION IF EXISTS create_project(UUID, TEXT, TEXT, TEXT, TEXT[], TEXT);
CREATE OR REPLACE FUNCTION create_project(
  p_group_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT '기타',
  p_enabled_features TEXT[] DEFAULT ARRAY['board'],
  p_visibility TEXT DEFAULT 'private',
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
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
  INSERT INTO projects (group_id, name, description, type, enabled_features, visibility, created_by, start_date, end_date)
  VALUES (p_group_id, p_name, p_description, p_type, p_enabled_features, p_visibility, v_user_id, p_start_date, p_end_date)
  RETURNING id INTO v_project_id;

  -- 생성자를 leader로 추가
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'leader');

  RETURN v_project_id;
END;
$$;
