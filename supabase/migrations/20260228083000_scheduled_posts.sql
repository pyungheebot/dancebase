-- board_posts 테이블에 예약 발행 컬럼 추가
-- published_at: NULL이면 즉시 발행(기존 동작), 값이 설정되면 해당 시간 이후에만 노출
ALTER TABLE board_posts
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;

-- 인덱스: 게시글 목록 조회 시 published_at 필터링 성능 향상
CREATE INDEX IF NOT EXISTS idx_board_posts_published_at
  ON board_posts (published_at)
  WHERE published_at IS NOT NULL;

COMMENT ON COLUMN board_posts.published_at IS '예약 발행 시각. NULL이면 즉시 발행. 설정된 경우 해당 시각 이후에만 일반 멤버에게 노출';
