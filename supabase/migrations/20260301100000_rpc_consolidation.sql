-- ============================================
-- RPC 통합: 중복 권한 조회 제거
-- 사용자의 그룹 역할 + entity_permissions를
-- 한 번의 RPC 호출로 조회
-- ============================================

-- ============================================
-- get_user_group_context
-- 호출자의 그룹 역할 + 보유 권한 목록을 JSON으로 반환
-- 멤버가 아니면 NULL 반환
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_group_context(
  p_group_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'role', gm.role,
    'permissions', COALESCE(
      (
        SELECT json_agg(ep.permission ORDER BY ep.permission)
        FROM entity_permissions ep
        WHERE ep.entity_type = 'group'
          AND ep.entity_id   = p_group_id
          AND ep.user_id     = auth.uid()
      ),
      '[]'::json
    )
  )
  INTO v_result
  FROM group_members gm
  WHERE gm.group_id = p_group_id
    AND gm.user_id  = auth.uid();

  RETURN v_result;   -- 멤버가 아니면 NULL
END;
$$;
