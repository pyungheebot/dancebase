-- 게시글 첨부파일 테이블
CREATE TABLE board_post_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES board_posts(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE board_post_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "첨부파일 조회" ON board_post_attachments FOR SELECT USING (true);
CREATE POLICY "첨부파일 생성" ON board_post_attachments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "첨부파일 삭제" ON board_post_attachments FOR DELETE USING (
  auth.uid() = (SELECT author_id FROM board_posts WHERE id = post_id)
);
