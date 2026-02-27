-- ============================================
-- 그룹/프로젝트 권한 시스템 전면 리팩토링
-- A-1: entity_permissions 테이블
-- A-2: entity_features 테이블
-- A-3: 서브그룹 권한 상속 함수
-- A-4: 통합 헬퍼 함수
-- A-5: RLS 정책 통합
-- A-6: groups/projects 테이블 정리
-- A-7: RPC 함수 재작성
-- A-8: 삭제 트리거
-- ============================================

-- ============================================
-- A-1: entity_permissions 테이블
-- ============================================

CREATE TABLE entity_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('group', 'project')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN (
    'finance_view', 'finance_manage', 'project_manage'
  )),
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id, user_id, permission)
);

CREATE INDEX idx_entity_permissions_lookup ON entity_permissions(entity_type, entity_id, user_id);

ALTER TABLE entity_permissions ENABLE ROW LEVEL SECURITY;

-- 데이터 마이그레이션: finance_managers → entity_permissions
INSERT INTO entity_permissions (entity_type, entity_id, user_id, permission)
SELECT 'group', g.id, unnest(g.finance_managers), 'finance_manage'
FROM groups g
WHERE g.finance_managers IS NOT NULL AND array_length(g.finance_managers, 1) > 0
ON CONFLICT DO NOTHING;

-- 데이터 마이그레이션: finance_viewers → entity_permissions
INSERT INTO entity_permissions (entity_type, entity_id, user_id, permission)
SELECT 'group', g.id, unnest(g.finance_viewers), 'finance_view'
FROM groups g
WHERE g.finance_viewers IS NOT NULL AND array_length(g.finance_viewers, 1) > 0
ON CONFLICT DO NOTHING;

-- 데이터 마이그레이션: project_managers → entity_permissions
INSERT INTO entity_permissions (entity_type, entity_id, user_id, permission)
SELECT 'group', g.id, unnest(g.project_managers), 'project_manage'
FROM groups g
WHERE g.project_managers IS NOT NULL AND array_length(g.project_managers, 1) > 0
ON CONFLICT DO NOTHING;

-- ============================================
-- A-2: entity_features 테이블
-- ============================================

CREATE TABLE entity_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('group', 'project')),
  entity_id UUID NOT NULL,
  feature TEXT NOT NULL CHECK (feature IN (
    'board', 'schedule', 'attendance', 'finance',
    'members', 'projects', 'subgroups', 'settings'
  )),
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(entity_type, entity_id, feature)
);

CREATE INDEX idx_entity_features_lookup ON entity_features(entity_type, entity_id);

ALTER TABLE entity_features ENABLE ROW LEVEL SECURITY;

-- 데이터 마이그레이션: 기존 그룹에 기본 기능 8개 모두 활성화
INSERT INTO entity_features (entity_type, entity_id, feature, enabled)
SELECT 'group', g.id, f.feature, true
FROM groups g
CROSS JOIN (
  VALUES ('board'), ('schedule'), ('attendance'), ('finance'),
         ('members'), ('projects'), ('subgroups'), ('settings')
) AS f(feature)
ON CONFLICT DO NOTHING;

-- 데이터 마이그레이션: projects.enabled_features → entity_features
INSERT INTO entity_features (entity_type, entity_id, feature, enabled)
SELECT 'project', p.id, f.feature,
  CASE WHEN f.feature = ANY(p.enabled_features) THEN true ELSE false END
FROM projects p
CROSS JOIN (
  VALUES ('board'), ('schedule'), ('attendance'), ('finance')
) AS f(feature)
ON CONFLICT DO NOTHING;

-- 프로젝트에 members, settings는 항상 활성화
INSERT INTO entity_features (entity_type, entity_id, feature, enabled)
SELECT 'project', p.id, f.feature, true
FROM projects p
CROSS JOIN (
  VALUES ('members'), ('settings')
) AS f(feature)
ON CONFLICT DO NOTHING;

-- ============================================
-- A-3: 서브그룹 권한 상속 함수
-- ============================================

-- 조상 그룹 ID 배열 반환 (최대 depth 10)
CREATE OR REPLACE FUNCTION get_ancestor_group_ids(gid UUID)
RETURNS UUID[]
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  result UUID[] := '{}';
  current_id UUID;
BEGIN
  SELECT parent_group_id INTO current_id FROM groups WHERE id = gid;
  WHILE current_id IS NOT NULL AND array_length(result, 1) IS DISTINCT FROM 10 LOOP
    result := result || current_id;
    SELECT parent_group_id INTO current_id FROM groups WHERE id = current_id;
  END LOOP;
  RETURN result;
END;
$$;

-- is_group_member 재정의: 직접 멤버 OR 조상 그룹 리더
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
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_group_leader 재정의: 직접 리더 OR 조상 그룹 리더
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
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- A-4: 통합 헬퍼 함수
-- ============================================

-- entity_permissions 테이블 조회
CREATE OR REPLACE FUNCTION has_entity_permission(p_type TEXT, p_id UUID, p_perm TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM entity_permissions
    WHERE entity_type = p_type AND entity_id = p_id
      AND user_id = auth.uid() AND permission = p_perm
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 통합 접근 확인: 멤버/public/unlisted
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
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 리더 확인 (상속 포함)
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
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 회비 열람: 리더 OR finance_manage OR finance_view
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
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 회비 관리: 리더 OR finance_manage
CREATE OR REPLACE FUNCTION can_manage_finance_v2(p_type TEXT, p_id UUID)
RETURNS BOOLEAN AS $$
  SELECT can_edit_entity(p_type, p_id)
    OR has_entity_permission(p_type, p_id, 'finance_manage')
    OR (p_type = 'project' AND EXISTS (
      SELECT 1 FROM projects p WHERE p.id = p_id
        AND (can_edit_entity('group', p.group_id)
          OR has_entity_permission('group', p.group_id, 'finance_manage'))
    ));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 프로젝트 관리: 그룹 리더 OR project_manage 권한
CREATE OR REPLACE FUNCTION can_manage_projects_v2(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_group_leader(gid)
    OR has_entity_permission('group', gid, 'project_manage');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 기존 함수를 새 함수의 래퍼로 재정의
CREATE OR REPLACE FUNCTION public.can_view_finance(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT can_view_finance_v2('group', gid);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_finance(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT can_manage_finance_v2('group', gid);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_projects(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT can_manage_projects_v2(gid);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- A-5: RLS 정책
-- ============================================

-- entity_permissions RLS
CREATE POLICY "ep_select" ON entity_permissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

CREATE POLICY "ep_insert" ON entity_permissions
  FOR INSERT WITH CHECK (
    (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

CREATE POLICY "ep_update" ON entity_permissions
  FOR UPDATE USING (
    (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

CREATE POLICY "ep_delete" ON entity_permissions
  FOR DELETE USING (
    (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

-- entity_features RLS
CREATE POLICY "ef_select" ON entity_features
  FOR SELECT USING (
    (entity_type = 'group' AND can_access_entity('group', entity_id))
    OR (entity_type = 'project' AND can_access_entity('project', entity_id))
  );

CREATE POLICY "ef_insert" ON entity_features
  FOR INSERT WITH CHECK (
    (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

CREATE POLICY "ef_update" ON entity_features
  FOR UPDATE USING (
    (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

CREATE POLICY "ef_delete" ON entity_features
  FOR DELETE USING (
    (entity_type = 'group' AND public.is_group_leader(entity_id))
    OR (entity_type = 'project' AND can_edit_entity('project', entity_id))
  );

-- ============================================
-- A-6: groups/projects 테이블 정리
-- ============================================

ALTER TABLE groups DROP COLUMN IF EXISTS finance_managers;
ALTER TABLE groups DROP COLUMN IF EXISTS finance_viewers;
ALTER TABLE groups DROP COLUMN IF EXISTS project_managers;
ALTER TABLE projects DROP COLUMN IF EXISTS enabled_features;

-- ============================================
-- A-7: RPC 함수 재작성
-- ============================================

-- get_user_groups: 배열 컬럼 제거된 반환 타입
DROP FUNCTION IF EXISTS get_user_groups(UUID);
CREATE OR REPLACE FUNCTION get_user_groups(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  invite_code TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  group_type TEXT,
  visibility TEXT,
  join_policy TEXT,
  dance_genre TEXT[],
  avatar_url TEXT,
  max_members INT,
  parent_group_id UUID,
  member_count BIGINT,
  my_role TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
    g.group_type, g.visibility, g.join_policy, g.dance_genre, g.avatar_url,
    g.max_members, g.parent_group_id,
    COUNT(gm2.id) AS member_count,
    MAX(CASE WHEN gm2.user_id = p_user_id THEN gm2.role END) AS my_role
  FROM groups g
  INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = p_user_id
  LEFT JOIN group_members gm2 ON gm2.group_id = g.id
  GROUP BY g.id;
$$;

-- get_public_groups: 배열 컬럼 제거된 반환 타입
DROP FUNCTION IF EXISTS get_public_groups(TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_public_groups(p_search TEXT DEFAULT NULL, p_genre TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  invite_code TEXT,
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
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
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

-- get_group_projects: enabled_features를 entity_features에서 집계
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
    COALESCE(
      (SELECT array_agg(ef.feature) FROM entity_features ef WHERE ef.entity_type = 'project' AND ef.entity_id = p.id AND ef.enabled = true),
      '{}'
    ) AS enabled_features,
    p.finance_independent, p.board_independent,
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
    p.finance_independent, p.board_independent,
    p.visibility, true AS is_shared, p.created_by,
    p.created_at, p.updated_at,
    COUNT(pm.id) AS member_count
  FROM projects p
  INNER JOIN project_shared_groups psg ON psg.project_id = p.id AND psg.group_id = p_group_id
  LEFT JOIN project_members pm ON pm.project_id = p.id
  GROUP BY p.id

  ORDER BY created_at DESC;
$$;

-- create_group_with_leader: entity_features 기본 레코드 자동 생성
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_project: entity_features 레코드 생성
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

  -- entity_features 레코드 생성
  FOREACH v_feature IN ARRAY v_all_features LOOP
    INSERT INTO entity_features (entity_type, entity_id, feature, enabled)
    VALUES ('project', v_project_id, v_feature,
      CASE
        WHEN v_feature = 'members' OR v_feature = 'settings' THEN true
        WHEN v_feature = ANY(p_enabled_features) THEN true
        ELSE false
      END
    );
  END LOOP;

  RETURN v_project_id;
END;
$$;

-- 신규: 사용자 권한 조회 RPC
CREATE OR REPLACE FUNCTION get_user_permissions(p_type TEXT, p_id UUID)
RETURNS TABLE (
  permission TEXT,
  granted_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ep.permission, ep.granted_at
  FROM entity_permissions ep
  WHERE ep.entity_type = p_type
    AND ep.entity_id = p_id
    AND ep.user_id = auth.uid();
$$;

-- 신규: 엔티티 기능 조회 RPC
CREATE OR REPLACE FUNCTION get_entity_features(p_type TEXT, p_id UUID)
RETURNS TABLE (
  feature TEXT,
  enabled BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ef.feature, ef.enabled
  FROM entity_features ef
  WHERE ef.entity_type = p_type
    AND ef.entity_id = p_id;
$$;

-- ============================================
-- A-8: 삭제 트리거
-- ============================================

-- 그룹 삭제 시 entity_permissions + entity_features 자동 삭제
CREATE OR REPLACE FUNCTION cleanup_entity_on_group_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM entity_permissions WHERE entity_type = 'group' AND entity_id = OLD.id;
  DELETE FROM entity_features WHERE entity_type = 'group' AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_group_entities
  BEFORE DELETE ON groups
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_on_group_delete();

-- 프로젝트 삭제 시 entity_permissions + entity_features 자동 삭제
CREATE OR REPLACE FUNCTION cleanup_entity_on_project_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM entity_permissions WHERE entity_type = 'project' AND entity_id = OLD.id;
  DELETE FROM entity_features WHERE entity_type = 'project' AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_project_entities
  BEFORE DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION cleanup_entity_on_project_delete();
