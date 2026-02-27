-- post_read_status: 공지 읽음 현황 추적 테이블
CREATE TABLE post_read_status (
  post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_read_status ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버라면 해당 게시글 읽음 현황을 조회할 수 있음
CREATE POLICY "post_read_status_select" ON post_read_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_posts bp
      JOIN group_members gm ON gm.group_id = bp.group_id
      WHERE bp.id = post_read_status.post_id
        AND gm.user_id = auth.uid()
    )
  );

-- 본인만 읽음 상태 생성 가능
CREATE POLICY "post_read_status_insert" ON post_read_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);
