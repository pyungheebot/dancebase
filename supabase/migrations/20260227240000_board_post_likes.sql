-- board_post_likes: 게시글 좋아요 테이블
CREATE TABLE board_post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE board_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "좋아요 조회" ON board_post_likes FOR SELECT USING (true);
CREATE POLICY "좋아요 생성" ON board_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "좋아요 삭제" ON board_post_likes FOR DELETE USING (auth.uid() = user_id);
