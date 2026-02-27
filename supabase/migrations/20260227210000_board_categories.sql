-- 게시판 카테고리 (그룹별 커스터마이징)
CREATE TABLE board_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(group_id, name)
);

ALTER TABLE board_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "카테고리 조회" ON board_categories
  FOR SELECT USING (true);

CREATE POLICY "카테고리 관리" ON board_categories
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM group_members
      WHERE group_id = board_categories.group_id AND role = 'leader'
    )
  );
