CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_bookmarks_select" ON post_bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "post_bookmarks_insert" ON post_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_bookmarks_delete" ON post_bookmarks FOR DELETE USING (user_id = auth.uid());
