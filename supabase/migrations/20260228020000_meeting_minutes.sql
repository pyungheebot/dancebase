CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  attendees UUID[] NOT NULL DEFAULT '{}',
  decisions TEXT[] NOT NULL DEFAULT '{}',
  action_items JSONB NOT NULL DEFAULT '[]',
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_minutes_select" ON meeting_minutes FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = meeting_minutes.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "meeting_minutes_insert" ON meeting_minutes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = meeting_minutes.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "meeting_minutes_update" ON meeting_minutes FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = meeting_minutes.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "meeting_minutes_delete" ON meeting_minutes FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = meeting_minutes.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
