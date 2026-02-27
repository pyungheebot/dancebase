-- board_comments 테이블에 parent_id 컬럼 추가 (대댓글 지원)
ALTER TABLE board_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES board_comments(id) ON DELETE CASCADE DEFAULT NULL;

-- parent_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_board_comments_parent_id ON board_comments(parent_id) WHERE parent_id IS NOT NULL;
