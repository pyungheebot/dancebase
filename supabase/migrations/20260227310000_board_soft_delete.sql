-- board_posts soft delete 지원

-- deleted_at 컬럼 추가
ALTER TABLE board_posts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- 기존 SELECT RLS 정책 수정 (deleted_at IS NULL 조건 추가)
-- ============================================
DROP POLICY IF EXISTS "board_posts_select" ON board_posts;

-- 일반 멤버: 삭제되지 않은 글만 조회
CREATE POLICY "board_posts_select" ON board_posts
  FOR SELECT USING (
    deleted_at IS NULL
    AND public.can_access_post(group_id, project_id)
  );

-- 리더 전용: 삭제된 글도 조회 가능 (휴지통)
CREATE POLICY "board_posts_select_deleted_leader" ON board_posts
  FOR SELECT USING (
    deleted_at IS NOT NULL
    AND public.is_group_leader(group_id)
  );

-- ============================================
-- UPDATE 정책 수정 (복구를 위해 deleted_at 수정 허용)
-- 기존 board_posts_update 정책은 author_id 또는 리더만 가능하므로 유지
-- ============================================

-- ============================================
-- 인덱스 (deleted_at IS NULL 필터링 최적화)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_board_posts_deleted_at
  ON board_posts (deleted_at)
  WHERE deleted_at IS NOT NULL;
