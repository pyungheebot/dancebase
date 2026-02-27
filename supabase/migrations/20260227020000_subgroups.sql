-- ============================================
-- 하위그룹(Subgroups) 기능
-- ============================================

-- 1) groups 테이블에 parent_group_id 추가
ALTER TABLE groups
  ADD COLUMN parent_group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

CREATE INDEX idx_groups_parent_group_id ON groups(parent_group_id);

-- 2) 그룹 깊이 계산 함수 (무한 재귀 방지, 최대 10단계)
CREATE OR REPLACE FUNCTION get_group_depth(gid UUID)
RETURNS INT
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  depth INT := 0;
  current_id UUID := gid;
  parent UUID;
BEGIN
  LOOP
    SELECT parent_group_id INTO parent FROM groups WHERE id = current_id;
    IF parent IS NULL THEN
      RETURN depth;
    END IF;
    depth := depth + 1;
    IF depth >= 10 THEN
      RETURN depth;
    END IF;
    current_id := parent;
  END LOOP;
END;
$$;

-- 3) 조상 경로 반환 함수 (브레드크럼용)
CREATE OR REPLACE FUNCTION get_group_ancestors(gid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  depth INT
)
LANGUAGE sql STABLE
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT g.id, g.name, g.parent_group_id, 0 AS depth
    FROM groups g
    WHERE g.id = (SELECT parent_group_id FROM groups WHERE groups.id = gid)
    UNION ALL
    SELECT g.id, g.name, g.parent_group_id, a.depth + 1
    FROM groups g
    INNER JOIN ancestors a ON a.parent_group_id = g.id
    WHERE a.depth < 10
  )
  SELECT ancestors.id, ancestors.name, ancestors.depth
  FROM ancestors
  ORDER BY ancestors.depth DESC;
$$;

-- 4) 직계 자식 그룹 + member_count 반환 함수
CREATE OR REPLACE FUNCTION get_group_children(p_group_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  group_type TEXT,
  visibility TEXT,
  member_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.group_type, g.visibility,
    COUNT(gm.id) AS member_count
  FROM groups g
  LEFT JOIN group_members gm ON gm.group_id = g.id
  WHERE g.parent_group_id = p_group_id
  GROUP BY g.id
  ORDER BY g.created_at;
$$;

-- 5) get_user_groups 재생성: parent_group_id 컬럼 추가
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
  finance_managers UUID[],
  finance_viewers UUID[],
  project_managers UUID[],
  parent_group_id UUID,
  member_count BIGINT,
  my_role TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
    g.group_type, g.visibility, g.join_policy, g.dance_genre, g.avatar_url,
    g.max_members, g.finance_managers, g.finance_viewers, g.project_managers,
    g.parent_group_id,
    COUNT(gm2.id) AS member_count,
    MAX(CASE WHEN gm2.user_id = p_user_id THEN gm2.role END) AS my_role
  FROM groups g
  INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = p_user_id
  LEFT JOIN group_members gm2 ON gm2.group_id = g.id
  GROUP BY g.id;
$$;

-- 6) create_group_with_leader 재생성: parent_group_id 매개변수 + 부모 리더 검증 + 깊이 제한
DROP FUNCTION IF EXISTS public.create_group_with_leader(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_group_with_leader(
  group_name TEXT,
  group_description TEXT DEFAULT NULL,
  group_type TEXT DEFAULT '기타',
  parent_group_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
  parent_depth INT;
  is_parent_leader BOOLEAN;
BEGIN
  -- 부모 그룹이 지정된 경우 검증
  IF parent_group_id IS NOT NULL THEN
    -- 부모 그룹의 리더인지 확인
    SELECT EXISTS(
      SELECT 1 FROM group_members
      WHERE group_id = parent_group_id
        AND user_id = auth.uid()
        AND role = 'leader'
    ) INTO is_parent_leader;

    IF NOT is_parent_leader THEN
      RAISE EXCEPTION '부모 그룹의 리더만 하위그룹을 생성할 수 있습니다';
    END IF;

    -- 깊이 제한 확인
    parent_depth := get_group_depth(parent_group_id);
    IF parent_depth >= 9 THEN
      RAISE EXCEPTION '하위그룹은 최대 10단계까지만 생성할 수 있습니다';
    END IF;
  END IF;

  INSERT INTO groups (name, description, created_by, group_type, parent_group_id)
  VALUES (group_name, group_description, auth.uid(), group_type, parent_group_id)
  RETURNING id INTO new_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'leader');

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) get_public_groups 재생성: parent_group_id 반환 + 최상위만
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
  finance_managers UUID[],
  finance_viewers UUID[],
  project_managers UUID[],
  parent_group_id UUID,
  member_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
    g.group_type, g.visibility, g.join_policy, g.dance_genre, g.avatar_url,
    g.max_members, g.finance_managers, g.finance_viewers, g.project_managers,
    g.parent_group_id,
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
