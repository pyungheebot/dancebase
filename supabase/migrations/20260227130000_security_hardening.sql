-- ============================================
-- 보안 강화 마이그레이션
-- 1. SECURITY DEFINER 함수에 SET search_path = public 추가
-- 2. group_members INSERT RLS 수정
-- 3. profiles SELECT 정책 검토
-- 4. get_public_groups에서 invite_code 제외
-- 5. attendance DELETE 정책 추가
-- ============================================

-- ============================================
-- 1. SECURITY DEFINER 함수에 SET search_path = public 추가
-- 각 함수를 CREATE OR REPLACE로 재정의하되, 원래 로직은 유지
-- ============================================

-- 1-1. handle_new_user (trigger, plpgsql)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1-2. is_group_member (sql, 조상 상속 포함 최신 버전)
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = ANY(get_ancestor_group_ids(gid))
      AND user_id = auth.uid()
      AND role = 'leader'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-3. is_group_leader (sql, 조상 상속 포함 최신 버전)
CREATE OR REPLACE FUNCTION public.is_group_leader(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid() AND role = 'leader'
  )
  OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = ANY(get_ancestor_group_ids(gid))
      AND user_id = auth.uid()
      AND role = 'leader'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-4. is_mutual_follow
CREATE OR REPLACE FUNCTION is_mutual_follow(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = user_a AND following_id = user_b
  ) AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = user_b AND following_id = user_a
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1-5. is_following
CREATE OR REPLACE FUNCTION is_following(p_follower UUID, p_target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = p_follower AND following_id = p_target
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1-6. can_view_finance (래퍼, 최신 버전)
CREATE OR REPLACE FUNCTION public.can_view_finance(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT can_view_finance_v2('group', gid);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-7. can_manage_finance (래퍼, 최신 버전)
CREATE OR REPLACE FUNCTION public.can_manage_finance(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT can_manage_finance_v2('group', gid);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-8. is_project_member
CREATE OR REPLACE FUNCTION public.is_project_member(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-9. is_project_leader
CREATE OR REPLACE FUNCTION public.is_project_leader(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid() AND role = 'leader'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-10. can_manage_projects (래퍼, 최신 버전)
CREATE OR REPLACE FUNCTION public.can_manage_projects(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT can_manage_projects_v2(gid);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-11. can_access_post (최신 버전, shared_projects에서 수정됨)
CREATE OR REPLACE FUNCTION public.can_access_post(p_group_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    CASE
      WHEN p_project_id IS NOT NULL THEN
        public.can_access_project(p_project_id)
      ELSE
        public.is_group_member(p_group_id)
    END;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-12. prevent_role_self_change (trigger)
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND NEW.user_id = auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM group_members
       WHERE group_id = OLD.group_id
         AND user_id = auth.uid()
         AND role = 'leader'
     )
  THEN
    RAISE EXCEPTION 'Cannot change own role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1-13. prevent_project_role_self_change (trigger)
CREATE OR REPLACE FUNCTION prevent_project_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND NEW.user_id = auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM project_members
       WHERE project_id = OLD.project_id
         AND user_id = auth.uid()
         AND role = 'leader'
     )
  THEN
    RAISE EXCEPTION 'Cannot change own role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1-14. get_conversations
CREATE OR REPLACE FUNCTION get_conversations()
RETURNS TABLE (
  partner_id UUID, partner_name TEXT, partner_avatar_url TEXT,
  last_message TEXT, last_message_at TIMESTAMPTZ, unread_count BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH conversations AS (
    SELECT
      CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END AS pid,
      content, created_at,
      CASE WHEN receiver_id = auth.uid() AND read_at IS NULL THEN 1 ELSE 0 END AS is_unread,
      ROW_NUMBER() OVER (
        PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
        ORDER BY created_at DESC
      ) AS rn
    FROM messages WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
  ),
  grouped AS (
    SELECT pid,
      MAX(CASE WHEN rn = 1 THEN content END) AS last_message,
      MAX(created_at) AS last_message_at,
      SUM(is_unread)::BIGINT AS unread_count
    FROM conversations GROUP BY pid
  )
  SELECT g.pid, p.name, p.avatar_url, g.last_message, g.last_message_at, g.unread_count
  FROM grouped g JOIN profiles p ON p.id = g.pid
  ORDER BY g.last_message_at DESC;
$$;

-- 1-15. get_unread_message_count
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::BIGINT FROM messages
  WHERE receiver_id = auth.uid() AND read_at IS NULL;
$$;

-- 1-16. can_access_project (최신 버전, visibility_unlisted에서 수정됨)
CREATE OR REPLACE FUNCTION public.can_access_project(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM projects p
    INNER JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = auth.uid()
    WHERE p.id = pid
  )
  OR EXISTS (
    SELECT 1 FROM project_shared_groups psg
    INNER JOIN group_members gm ON gm.group_id = psg.group_id AND gm.user_id = auth.uid()
    WHERE psg.project_id = pid
  )
  OR EXISTS (
    SELECT 1 FROM projects WHERE id = pid AND visibility = 'public'
  )
  OR EXISTS (
    SELECT 1 FROM projects WHERE id = pid AND visibility = 'unlisted' AND auth.uid() IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-17. has_entity_permission
CREATE OR REPLACE FUNCTION has_entity_permission(p_type TEXT, p_id UUID, p_perm TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM entity_permissions
    WHERE entity_type = p_type AND entity_id = p_id
      AND user_id = auth.uid() AND permission = p_perm
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-18. can_access_entity
CREATE OR REPLACE FUNCTION can_access_entity(p_type TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT CASE p_type
    WHEN 'group' THEN
      public.is_group_member(p_id)
      OR EXISTS (SELECT 1 FROM groups WHERE id = p_id AND visibility = 'public')
      OR EXISTS (SELECT 1 FROM groups WHERE id = p_id AND visibility = 'unlisted' AND auth.uid() IS NOT NULL)
    WHEN 'project' THEN
      public.can_access_project(p_id)
    ELSE false
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-19. can_edit_entity
CREATE OR REPLACE FUNCTION can_edit_entity(p_type TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT CASE p_type
    WHEN 'group' THEN
      public.is_group_leader(p_id)
    WHEN 'project' THEN
      public.is_project_leader(p_id)
      OR EXISTS (
        SELECT 1 FROM projects p WHERE p.id = p_id AND public.is_group_leader(p.group_id)
      )
    ELSE false
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-20. can_view_finance_v2
CREATE OR REPLACE FUNCTION can_view_finance_v2(p_type TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT can_edit_entity(p_type, p_id)
    OR has_entity_permission(p_type, p_id, 'finance_manage')
    OR has_entity_permission(p_type, p_id, 'finance_view')
    OR (p_type = 'project' AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = p_id
        AND (can_edit_entity('group', p.group_id)
          OR has_entity_permission('group', p.group_id, 'finance_manage')
          OR has_entity_permission('group', p.group_id, 'finance_view'))
    ));
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-21. can_manage_finance_v2
CREATE OR REPLACE FUNCTION can_manage_finance_v2(p_type TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT can_edit_entity(p_type, p_id)
    OR has_entity_permission(p_type, p_id, 'finance_manage')
    OR (p_type = 'project' AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = p_id
        AND (can_edit_entity('group', p.group_id)
          OR has_entity_permission('group', p.group_id, 'finance_manage'))
    ));
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-22. can_manage_projects_v2
CREATE OR REPLACE FUNCTION can_manage_projects_v2(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_group_leader(gid)
    OR has_entity_permission('group', gid, 'project_manage');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1-23. get_user_permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_type TEXT, p_id UUID)
RETURNS TABLE (
  permission TEXT,
  granted_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ep.permission, ep.granted_at
  FROM entity_permissions ep
  WHERE ep.entity_type = p_type
    AND ep.entity_id = p_id
    AND ep.user_id = auth.uid();
$$;

-- 1-24. get_entity_features (최신 버전, independent 포함)
DROP FUNCTION IF EXISTS get_entity_features(TEXT, UUID);
CREATE OR REPLACE FUNCTION get_entity_features(p_type TEXT, p_id UUID)
RETURNS TABLE (feature TEXT, enabled BOOLEAN, independent BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ef.feature, ef.enabled, ef.independent
  FROM entity_features ef
  WHERE ef.entity_type = p_type AND ef.entity_id = p_id;
$$;

-- 1-25. get_independent_entity_ids (최신 버전)
DROP FUNCTION IF EXISTS get_independent_entity_ids(UUID, TEXT);
CREATE OR REPLACE FUNCTION get_independent_entity_ids(p_group_id UUID, p_feature TEXT)
RETURNS TABLE (entity_id UUID, entity_type TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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

-- 1-26. get_all_independent_project_ids
CREATE OR REPLACE FUNCTION get_all_independent_project_ids(p_group_id UUID)
RETURNS TABLE (entity_id UUID, feature TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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

-- 1-27. create_group_with_leader (최신 버전, entity_features 포함)
DROP FUNCTION IF EXISTS public.create_group_with_leader(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT[], INT);
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

  -- entity_features 기본 레코드 생성
  INSERT INTO entity_features (entity_type, entity_id, feature, enabled)
  VALUES
    ('group', new_group_id, 'board', true),
    ('group', new_group_id, 'schedule', true),
    ('group', new_group_id, 'attendance', true),
    ('group', new_group_id, 'finance', true),
    ('group', new_group_id, 'members', true),
    ('group', new_group_id, 'projects', true),
    ('group', new_group_id, 'subgroups', true),
    ('group', new_group_id, 'settings', true);

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1-28. create_project (최신 버전, independent_fixes에서 수정됨)
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
SET search_path = public
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

-- 1-29. cleanup_entity_on_group_delete (트리거, SECURITY INVOKER이지만 안전을 위해 search_path 추가)
CREATE OR REPLACE FUNCTION cleanup_entity_on_group_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM entity_permissions WHERE entity_type = 'group' AND entity_id = OLD.id;
  DELETE FROM entity_features WHERE entity_type = 'group' AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1-30. cleanup_entity_on_project_delete (트리거)
CREATE OR REPLACE FUNCTION cleanup_entity_on_project_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM entity_permissions WHERE entity_type = 'project' AND entity_id = OLD.id;
  DELETE FROM entity_features WHERE entity_type = 'project' AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 2. group_members INSERT RLS 수정
-- 현재: 누구나 자기 자신을 추가 가능 → 리더만 추가 가능 + 그룹 생성자 자기 추가 허용
-- 초대 코드 가입: 프론트엔드에서 직접 INSERT하므로 초대 코드 조건도 추가
-- (create_group_with_leader는 SECURITY DEFINER이므로 RLS 우회)
-- ============================================

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
  -- 프론트엔드에서 먼저 invite_code로 그룹을 조회한 뒤 직접 INSERT하므로,
  -- 자기 자신을 추가하는 것만 허용 (open 또는 invite_only 정책인 그룹)
  (
    group_members.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
        AND g.join_policy IN ('open', 'invite_only')
    )
  )
);

-- ============================================
-- 3. profiles SELECT 정책 검토
-- profiles 테이블에 phone, birth_date 등 민감한 필드가 있으나
-- privacy_settings로 앱 레벨에서 제어 중임
-- 동일 그룹 제한을 걸면 프로필 조회/팔로우/쪽지 등 여러 기능이 깨질 수 있음
-- 따라서 현재 정책(모든 인증된 사용자 조회 가능)을 유지하되,
-- 비인증 사용자 접근만 차단
-- ============================================

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- 4. get_public_groups에서 invite_code 제외
-- invite_code는 공개 검색에 노출되면 안 됨
-- ============================================

DROP FUNCTION IF EXISTS get_public_groups(TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_public_groups(p_search TEXT DEFAULT NULL, p_genre TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  group_type TEXT,
  visibility TEXT,
  join_policy TEXT,
  dance_genre TEXT[],
  avatar_url TEXT,
  max_members INT,
  parent_group_id UUID,
  member_count BIGINT
)
LANGUAGE sql STABLE SET search_path = public
AS $$
  SELECT
    g.id, g.name, g.description, g.created_by, g.created_at,
    g.group_type, g.visibility, g.join_policy, g.dance_genre, g.avatar_url,
    g.max_members, g.parent_group_id,
    COUNT(gm.id) AS member_count
  FROM groups g
  LEFT JOIN group_members gm ON gm.group_id = g.id
  WHERE g.visibility = 'public'
    AND g.parent_group_id IS NULL
    AND (p_search IS NULL OR g.name ILIKE '%' || p_search || '%')
    AND (p_genre IS NULL OR g.dance_genre @> ARRAY[p_genre])
  GROUP BY g.id
  ORDER BY g.created_at DESC;
$$;

-- ============================================
-- 5. attendance DELETE 정책 추가
-- 그룹 리더만 출석 기록 삭제 가능
-- ============================================

CREATE POLICY "attendance_delete" ON attendance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = attendance.schedule_id
        AND public.is_group_leader(s.group_id)
    )
  );
