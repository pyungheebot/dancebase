CREATE TABLE IF NOT EXISTS member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, target_user_id, author_id)
);

ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_notes_select" ON member_notes FOR SELECT USING (
  author_id = auth.uid()
);
CREATE POLICY "member_notes_insert" ON member_notes FOR INSERT WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = member_notes.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "member_notes_update" ON member_notes FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "member_notes_delete" ON member_notes FOR DELETE USING (author_id = auth.uid());
