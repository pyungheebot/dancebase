-- ============================================
-- 프로젝트 생성 RPC 함수 (SECURITY DEFINER)
-- INSERT...RETURNING RLS 호환성 문제 해결
-- ============================================

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
  IF p_visibility NOT IN ('private', 'public') THEN
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
