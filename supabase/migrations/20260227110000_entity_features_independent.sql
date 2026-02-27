-- ============================================
-- 모든 기능의 독립/통합 토글 구현
-- entity_features 테이블에 independent 컬럼 추가
-- 기존 projects.finance_independent / board_independent 제거
-- ============================================

-- 1. entity_features에 independent 컬럼 추가
ALTER TABLE entity_features ADD COLUMN independent BOOLEAN NOT NULL DEFAULT false;

-- 2. 기존 데이터 마이그레이션: finance_independent
UPDATE entity_features ef SET independent = true
FROM projects p
WHERE ef.entity_type = 'project' AND ef.entity_id = p.id
  AND ef.feature = 'finance' AND p.finance_independent = true;

-- 3. 기존 데이터 마이그레이션: board_independent
UPDATE entity_features ef SET independent = true
FROM projects p
WHERE ef.entity_type = 'project' AND ef.entity_id = p.id
  AND ef.feature = 'board' AND p.board_independent = true;

-- 4. 기존 스케줄/출석 후방호환: 프로젝트의 schedule/attendance는 기존에 통합되지 않았으므로 independent=true
UPDATE entity_features SET independent = true
WHERE entity_type = 'project' AND feature IN ('schedule', 'attendance');

-- 5. projects 테이블에서 기존 컬럼 제거
ALTER TABLE projects DROP COLUMN IF EXISTS finance_independent;
ALTER TABLE projects DROP COLUMN IF EXISTS board_independent;

-- 6. get_entity_features RPC 수정 (independent 포함)
DROP FUNCTION IF EXISTS get_entity_features(TEXT, UUID);
CREATE OR REPLACE FUNCTION get_entity_features(p_type TEXT, p_id UUID)
RETURNS TABLE (feature TEXT, enabled BOOLEAN, independent BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ef.feature, ef.enabled, ef.independent
  FROM entity_features ef
  WHERE ef.entity_type = p_type AND ef.entity_id = p_id;
$$;

-- 7. 헬퍼 RPC: 특정 그룹 내에서 독립으로 설정된 엔티티 ID 조회
CREATE OR REPLACE FUNCTION get_independent_entity_ids(p_group_id UUID, p_feature TEXT)
RETURNS TABLE (entity_id UUID, entity_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  -- 독립 프로젝트
  SELECT ef.entity_id, 'project'::TEXT
  FROM entity_features ef
  INNER JOIN projects p ON p.id = ef.entity_id
  WHERE ef.entity_type = 'project'
    AND ef.feature = p_feature
    AND ef.independent = true
    AND ef.enabled = true
    AND p.group_id = p_group_id
  UNION ALL
  -- 독립 서브그룹
  SELECT ef.entity_id, 'group'::TEXT
  FROM entity_features ef
  INNER JOIN groups g ON g.id = ef.entity_id
  WHERE ef.entity_type = 'group'
    AND ef.feature = p_feature
    AND ef.independent = true
    AND ef.enabled = true
    AND g.parent_group_id = p_group_id;
$$;

-- 8. get_group_projects RPC 수정 (finance_independent, board_independent 제거)
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
  member_count BIGINT
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
    COUNT(pm.id) AS member_count
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
    COUNT(pm.id) AS member_count
  FROM projects p
  INNER JOIN project_shared_groups psg ON psg.project_id = p.id AND psg.group_id = p_group_id
  LEFT JOIN project_members pm ON pm.project_id = p.id
  GROUP BY p.id

  ORDER BY created_at DESC;
$$;
