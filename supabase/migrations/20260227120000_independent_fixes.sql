-- ============================================
-- 독립/통합 토글 개선
-- Fix #4: get_independent_entity_ids에서 서브그룹 제거 (쿼리측 미지원)
-- Fix #5: create_project에서 schedule/attendance independent=true 기본값
-- Fix #7: 대시보드용 배치 RPC 추가
-- ============================================

-- Fix #4: 서브그룹 제거 - 프로젝트만 반환
DROP FUNCTION IF EXISTS get_independent_entity_ids(UUID, TEXT);
CREATE OR REPLACE FUNCTION get_independent_entity_ids(p_group_id UUID, p_feature TEXT)
RETURNS TABLE (entity_id UUID, entity_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ef.entity_id, 'project'::TEXT
  FROM entity_features ef
  INNER JOIN projects p ON p.id = ef.entity_id
  WHERE ef.entity_type = 'project'
    AND ef.feature = p_feature
    AND ef.independent = true
    AND ef.enabled = true
    AND p.group_id = p_group_id;
$$;

-- Fix #7: 대시보드용 - 모든 기능의 독립 프로젝트 ID를 한 번에 조회
CREATE OR REPLACE FUNCTION get_all_independent_project_ids(p_group_id UUID)
RETURNS TABLE (entity_id UUID, feature TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ef.entity_id, ef.feature
  FROM entity_features ef
  INNER JOIN projects p ON p.id = ef.entity_id
  WHERE ef.entity_type = 'project'
    AND ef.independent = true
    AND ef.enabled = true
    AND p.group_id = p_group_id
    AND ef.feature IN ('board', 'schedule', 'attendance', 'finance');
$$;

-- Fix #5: create_project 수정 - schedule/attendance는 independent=true로 생성
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
  v_feature TEXT;
  v_all_features TEXT[] := ARRAY['board', 'schedule', 'attendance', 'finance', 'members', 'settings'];
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
  INSERT INTO projects (group_id, name, description, type, visibility, created_by)
  VALUES (p_group_id, p_name, p_description, p_type, p_visibility, v_user_id)
  RETURNING id INTO v_project_id;

  -- 생성자를 leader로 추가
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'leader');

  -- entity_features 레코드 생성 (schedule/attendance는 independent=true)
  FOREACH v_feature IN ARRAY v_all_features LOOP
    INSERT INTO entity_features (entity_type, entity_id, feature, enabled, independent)
    VALUES ('project', v_project_id, v_feature,
      CASE
        WHEN v_feature = 'members' OR v_feature = 'settings' THEN true
        WHEN v_feature = ANY(p_enabled_features) THEN true
        ELSE false
      END,
      CASE
        WHEN v_feature IN ('schedule', 'attendance') THEN true
        ELSE false
      END
    );
  END LOOP;

  RETURN v_project_id;
END;
$$;
