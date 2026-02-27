-- ============================================
-- create_group_with_leader RPC 확장
-- 생성 시 visibility, join_policy, dance_genre, max_members 설정 가능
-- ============================================

DROP FUNCTION IF EXISTS public.create_group_with_leader(TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.create_group_with_leader(
  group_name TEXT,
  group_description TEXT DEFAULT NULL,
  group_type TEXT DEFAULT '기타',
  parent_group_id UUID DEFAULT NULL,
  p_visibility TEXT DEFAULT 'private',
  p_join_policy TEXT DEFAULT 'invite_only',
  p_dance_genre TEXT[] DEFAULT '{}',
  p_max_members INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
  parent_depth INT;
  is_parent_leader BOOLEAN;
BEGIN
  -- 부모 그룹이 지정된 경우 검증
  IF parent_group_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM group_members
      WHERE group_id = parent_group_id
        AND user_id = auth.uid()
        AND role = 'leader'
    ) INTO is_parent_leader;

    IF NOT is_parent_leader THEN
      RAISE EXCEPTION '부모 그룹의 리더만 하위그룹을 생성할 수 있습니다';
    END IF;

    parent_depth := get_group_depth(parent_group_id);
    IF parent_depth >= 9 THEN
      RAISE EXCEPTION '하위그룹은 최대 10단계까지만 생성할 수 있습니다';
    END IF;
  END IF;

  -- visibility 유효성 검증
  IF p_visibility NOT IN ('public', 'unlisted', 'private') THEN
    RAISE EXCEPTION '유효하지 않은 공개 설정입니다';
  END IF;

  -- join_policy 유효성 검증
  IF p_join_policy NOT IN ('invite_only', 'approval', 'open') THEN
    RAISE EXCEPTION '유효하지 않은 가입 정책입니다';
  END IF;

  INSERT INTO groups (name, description, created_by, group_type, parent_group_id, visibility, join_policy, dance_genre, max_members)
  VALUES (group_name, group_description, auth.uid(), group_type, parent_group_id, p_visibility, p_join_policy, p_dance_genre, p_max_members)
  RETURNING id INTO new_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'leader');

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
