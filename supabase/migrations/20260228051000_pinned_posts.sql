ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_board_posts_pinned ON board_posts(group_id, pinned_at DESC NULLS LAST) WHERE pinned_at IS NOT NULL;
