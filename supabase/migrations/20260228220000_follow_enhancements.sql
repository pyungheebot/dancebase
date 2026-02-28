-- ============================================
-- 팔로우 기능 개선: 알림 타입 추가, INSERT RLS 완화, 추천 팔로우 RPC
-- ============================================

-- 1. notifications type CHECK에 new_follow, action_item 추가
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_post',
    'new_comment',
    'attendance',
    'join_request',
    'join_approved',
    'join_rejected',
    'finance_unpaid',
    'action_item',
    'new_follow'
  ));

-- 2. INSERT RLS 완화: 로그인한 사용자라면 누구에게든 알림 전송 가능
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. 추천 팔로우 RPC: 같은 그룹 멤버 중 미팔로우 사용자를 shared_group_count 내림차순 반환
CREATE OR REPLACE FUNCTION get_suggested_follows(limit_count INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar_url TEXT,
  dance_genre TEXT[],
  shared_group_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.name,
    p.avatar_url,
    p.dance_genre,
    COUNT(DISTINCT gm2.group_id) AS shared_group_count
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id AND gm1.user_id <> gm2.user_id
  JOIN profiles p ON p.id = gm2.user_id
  WHERE gm1.user_id = auth.uid()
    AND gm2.user_id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM follows f
      WHERE f.follower_id = auth.uid() AND f.following_id = gm2.user_id
    )
  GROUP BY p.id, p.name, p.avatar_url, p.dance_genre
  ORDER BY shared_group_count DESC
  LIMIT limit_count;
$$;
