-- 멤버 카테고리 테이블
CREATE TABLE member_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, name)
);

ALTER TABLE member_categories ENABLE ROW LEVEL SECURITY;

-- RLS: 그룹 멤버 조회, 리더만 CUD
CREATE POLICY "member_categories_select" ON member_categories
  FOR SELECT USING (public.is_group_member(group_id));
CREATE POLICY "member_categories_insert" ON member_categories
  FOR INSERT WITH CHECK (public.is_group_leader(group_id));
CREATE POLICY "member_categories_update" ON member_categories
  FOR UPDATE USING (public.is_group_leader(group_id));
CREATE POLICY "member_categories_delete" ON member_categories
  FOR DELETE USING (public.is_group_leader(group_id));

-- group_members에 category_id 추가 (삭제 시 NULL)
ALTER TABLE group_members ADD COLUMN category_id UUID DEFAULT NULL
  REFERENCES member_categories(id) ON DELETE SET NULL;

-- 리더가 멤버의 category_id를 변경할 수 있도록 UPDATE 정책 추가
CREATE POLICY "group_members_update_by_leader" ON group_members
  FOR UPDATE USING (public.is_group_leader(group_id));
