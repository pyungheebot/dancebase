-- 게시글 버전 히스토리 (편집 이력)

-- ============================================
-- board_post_revisions 테이블
-- ============================================
CREATE TABLE board_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  revised_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revised_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX board_post_revisions_post_id_idx ON board_post_revisions(post_id);
CREATE INDEX board_post_revisions_revised_at_idx ON board_post_revisions(post_id, revised_at DESC);

-- ============================================
-- RLS 활성화
-- ============================================
ALTER TABLE board_post_revisions ENABLE ROW LEVEL SECURITY;

-- 같은 그룹 멤버만 조회 가능
CREATE POLICY "board_post_revisions_select"
ON board_post_revisions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM board_posts bp
    JOIN group_members gm ON gm.group_id = bp.group_id
    WHERE bp.id = board_post_revisions.post_id
      AND gm.user_id = auth.uid()
  )
);

-- 인증된 사용자만 삽입 가능 (게시글 수정 시)
CREATE POLICY "board_post_revisions_insert"
ON board_post_revisions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM board_posts bp
    JOIN group_members gm ON gm.group_id = bp.group_id
    WHERE bp.id = board_post_revisions.post_id
      AND gm.user_id = auth.uid()
  )
);
