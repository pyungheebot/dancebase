-- 1) 사용자 그룹 목록 + member_count + my_role 통합 조회
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
  member_count BIGINT,
  my_role TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
    g.group_type, g.visibility, g.join_policy, g.dance_genre, g.avatar_url,
    g.max_members, g.finance_managers, g.finance_viewers, g.project_managers,
    COUNT(gm2.id) AS member_count,
    MAX(CASE WHEN gm2.user_id = p_user_id THEN gm2.role END) AS my_role
  FROM groups g
  INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = p_user_id
  LEFT JOIN group_members gm2 ON gm2.group_id = g.id
  GROUP BY g.id;
$$;

-- 2) 그룹 프로젝트 목록 + member_count
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
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id, p.group_id, p.name, p.description, p.type, p.status,
    p.enabled_features, p.finance_independent, p.created_by,
    p.created_at, p.updated_at,
    COUNT(pm.id) AS member_count
  FROM projects p
  LEFT JOIN project_members pm ON pm.project_id = p.id
  WHERE p.group_id = p_group_id
  GROUP BY p.id
  ORDER BY p.created_at DESC;
$$;

-- 3) 투표 옵션 + count + voted_by_me 통합 조회
CREATE OR REPLACE FUNCTION get_poll_options_with_votes(p_poll_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  poll_id UUID,
  text TEXT,
  sort_order INT,
  vote_count BIGINT,
  voted_by_me BOOLEAN
)
LANGUAGE sql STABLE
AS $$
  SELECT
    o.id, o.poll_id, o.text, o.sort_order,
    COUNT(v.id) AS vote_count,
    BOOL_OR(v.user_id = p_user_id) AS voted_by_me
  FROM board_poll_options o
  LEFT JOIN board_poll_votes v ON v.option_id = o.id
  WHERE o.poll_id = p_poll_id
  GROUP BY o.id
  ORDER BY o.sort_order;
$$;

-- 4) 사용자 출석 통계 통합 조회
CREATE OR REPLACE FUNCTION get_user_attendance_stats(p_user_id UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  total_schedules BIGINT,
  present_count BIGINT,
  late_count BIGINT,
  absent_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id AS group_id,
    g.name AS group_name,
    COUNT(DISTINCT s.id) AS total_schedules,
    COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS present_count,
    COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END) AS late_count,
    COUNT(DISTINCT s.id) - COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) - COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.id END) AS absent_count
  FROM groups g
  INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = p_user_id
  LEFT JOIN schedules s ON s.group_id = g.id AND s.starts_at <= NOW()
  LEFT JOIN attendance a ON a.schedule_id = s.id AND a.user_id = p_user_id
  GROUP BY g.id, g.name;
$$;

-- 5) 공개 그룹 + member_count
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
  member_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
    g.group_type, g.visibility, g.join_policy, g.dance_genre, g.avatar_url,
    g.max_members, g.finance_managers, g.finance_viewers, g.project_managers,
    COUNT(gm.id) AS member_count
  FROM groups g
  LEFT JOIN group_members gm ON gm.group_id = g.id
  WHERE g.visibility = 'public'
    AND (p_search IS NULL OR g.name ILIKE '%' || p_search || '%')
    AND (p_genre IS NULL OR g.dance_genre @> ARRAY[p_genre])
  GROUP BY g.id
  ORDER BY g.created_at DESC;
$$;
