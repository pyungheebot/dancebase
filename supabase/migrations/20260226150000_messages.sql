-- 메시지(1:1 메시지) 시스템
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_receiver ON messages(receiver_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- 대화 목록 RPC
CREATE OR REPLACE FUNCTION get_conversations()
RETURNS TABLE (
  partner_id UUID, partner_name TEXT, partner_avatar_url TEXT,
  last_message TEXT, last_message_at TIMESTAMPTZ, unread_count BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH conversations AS (
    SELECT
      CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END AS pid,
      content, created_at,
      CASE WHEN receiver_id = auth.uid() AND read_at IS NULL THEN 1 ELSE 0 END AS is_unread,
      ROW_NUMBER() OVER (
        PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
        ORDER BY created_at DESC
      ) AS rn
    FROM messages WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
  ),
  grouped AS (
    SELECT pid,
      MAX(CASE WHEN rn = 1 THEN content END) AS last_message,
      MAX(created_at) AS last_message_at,
      SUM(is_unread)::BIGINT AS unread_count
    FROM conversations GROUP BY pid
  )
  SELECT g.pid, p.name, p.avatar_url, g.last_message, g.last_message_at, g.unread_count
  FROM grouped g JOIN profiles p ON p.id = g.pid
  ORDER BY g.last_message_at DESC;
$$;

-- 안읽은 메시지 수 RPC
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::BIGINT FROM messages
  WHERE receiver_id = auth.uid() AND read_at IS NULL;
$$;
