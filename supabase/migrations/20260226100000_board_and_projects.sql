-- 게시판 + 프로젝트 시스템

-- ============================================
-- groups 확장
-- ============================================
ALTER TABLE groups ADD COLUMN project_managers UUID[] DEFAULT '{}';

-- ============================================
-- projects 테이블
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('공연','모임','연습','이벤트','기타')) DEFAULT '기타',
  status TEXT CHECK (status IN ('신규','진행','보류','종료')) DEFAULT '신규',
  enabled_features TEXT[] DEFAULT '{board}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- project_members 테이블
-- ============================================
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('leader','member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- ============================================
-- 기존 테이블 확장 (project 연동)
-- ============================================
ALTER TABLE schedules ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE finance_categories ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE finance_transactions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- ============================================
-- board_posts 테이블
-- ============================================
CREATE TABLE board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '미분류',
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- board_comments 테이블
-- ============================================
CREATE TABLE board_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 투표 테이블
-- ============================================
CREATE TABLE board_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  allow_multiple BOOLEAN DEFAULT false,
  ends_at TIMESTAMPTZ
);

CREATE TABLE board_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES board_polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE board_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES board_poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(option_id, user_id)
);

-- ============================================
-- RLS 활성화
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_poll_votes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 헬퍼 함수
-- ============================================

-- 프로젝트 멤버 확인
CREATE OR REPLACE FUNCTION public.is_project_member(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 프로젝트 리더 확인
CREATE OR REPLACE FUNCTION public.is_project_leader(pid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members WHERE project_id = pid AND user_id = auth.uid() AND role = 'leader'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 프로젝트 관리 권한 (그룹 리더 OR project_managers에 포함)
CREATE OR REPLACE FUNCTION public.can_manage_projects(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_group_leader(gid)
    OR EXISTS (
      SELECT 1 FROM groups WHERE id = gid AND auth.uid() = ANY(project_managers)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 게시글 접근 가능 여부 헬퍼
CREATE OR REPLACE FUNCTION public.can_access_post(p_group_id UUID, p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_group_member(p_group_id)
    AND (
      p_project_id IS NULL
      OR public.is_project_member(p_project_id)
      OR public.is_group_leader(p_group_id)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- RLS 정책: projects
-- ============================================
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (public.can_manage_projects(group_id));

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    public.is_project_leader(id) OR public.is_group_leader(group_id)
  );

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (
    public.is_project_leader(id) OR public.is_group_leader(group_id)
  );

-- ============================================
-- RLS 정책: project_members
-- ============================================
CREATE POLICY "project_members_select" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id AND public.is_group_member(p.group_id)
    )
  );

CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id
      AND (public.is_project_leader(p.id) OR public.is_group_leader(p.group_id))
    )
  );

CREATE POLICY "project_members_update" ON project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id
      AND (public.is_project_leader(p.id) OR public.is_group_leader(p.group_id))
    )
  );

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM projects p WHERE p.id = project_id
      AND (public.is_project_leader(p.id) OR public.is_group_leader(p.group_id))
    )
  );

-- ============================================
-- RLS 정책: board_posts
-- ============================================
CREATE POLICY "board_posts_select" ON board_posts
  FOR SELECT USING (public.can_access_post(group_id, project_id));

CREATE POLICY "board_posts_insert" ON board_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND public.can_access_post(group_id, project_id)
  );

CREATE POLICY "board_posts_update" ON board_posts
  FOR UPDATE USING (
    auth.uid() = author_id
    OR public.is_group_leader(group_id)
    OR (project_id IS NOT NULL AND public.is_project_leader(project_id))
  );

CREATE POLICY "board_posts_delete" ON board_posts
  FOR DELETE USING (
    auth.uid() = author_id
    OR public.is_group_leader(group_id)
    OR (project_id IS NOT NULL AND public.is_project_leader(project_id))
  );

-- ============================================
-- RLS 정책: board_comments
-- ============================================
CREATE POLICY "board_comments_select" ON board_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_posts bp WHERE bp.id = post_id
      AND public.can_access_post(bp.group_id, bp.project_id)
    )
  );

CREATE POLICY "board_comments_insert" ON board_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM board_posts bp WHERE bp.id = post_id
      AND public.can_access_post(bp.group_id, bp.project_id)
    )
  );

CREATE POLICY "board_comments_update" ON board_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "board_comments_delete" ON board_comments
  FOR DELETE USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM board_posts bp WHERE bp.id = post_id
      AND (
        public.is_group_leader(bp.group_id)
        OR (bp.project_id IS NOT NULL AND public.is_project_leader(bp.project_id))
      )
    )
  );

-- ============================================
-- RLS 정책: board_polls
-- ============================================
CREATE POLICY "board_polls_select" ON board_polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_posts bp WHERE bp.id = post_id
      AND public.can_access_post(bp.group_id, bp.project_id)
    )
  );

CREATE POLICY "board_polls_insert" ON board_polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_posts bp WHERE bp.id = post_id AND bp.author_id = auth.uid()
    )
  );

CREATE POLICY "board_polls_delete" ON board_polls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM board_posts bp WHERE bp.id = post_id AND bp.author_id = auth.uid()
    )
  );

-- ============================================
-- RLS 정책: board_poll_options
-- ============================================
CREATE POLICY "board_poll_options_select" ON board_poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_polls poll
      JOIN board_posts bp ON bp.id = poll.post_id
      WHERE poll.id = poll_id
      AND public.can_access_post(bp.group_id, bp.project_id)
    )
  );

CREATE POLICY "board_poll_options_insert" ON board_poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_polls poll
      JOIN board_posts bp ON bp.id = poll.post_id
      WHERE poll.id = poll_id AND bp.author_id = auth.uid()
    )
  );

CREATE POLICY "board_poll_options_delete" ON board_poll_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM board_polls poll
      JOIN board_posts bp ON bp.id = poll.post_id
      WHERE poll.id = poll_id AND bp.author_id = auth.uid()
    )
  );

-- ============================================
-- RLS 정책: board_poll_votes
-- ============================================
CREATE POLICY "board_poll_votes_select" ON board_poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_poll_options opt
      JOIN board_polls poll ON poll.id = opt.poll_id
      JOIN board_posts bp ON bp.id = poll.post_id
      WHERE opt.id = option_id
      AND public.can_access_post(bp.group_id, bp.project_id)
    )
  );

CREATE POLICY "board_poll_votes_insert" ON board_poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM board_poll_options opt
      JOIN board_polls poll ON poll.id = opt.poll_id
      JOIN board_posts bp ON bp.id = poll.post_id
      WHERE opt.id = option_id
      AND public.can_access_post(bp.group_id, bp.project_id)
    )
  );

CREATE POLICY "board_poll_votes_delete" ON board_poll_votes
  FOR DELETE USING (auth.uid() = user_id);
