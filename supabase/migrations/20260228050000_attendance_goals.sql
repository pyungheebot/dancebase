CREATE TABLE IF NOT EXISTS attendance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  target_rate INT NOT NULL CHECK (target_rate BETWEEN 1 AND 100),
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'quarterly')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id)
);

ALTER TABLE attendance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_goals_select" ON attendance_goals FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = attendance_goals.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "attendance_goals_insert" ON attendance_goals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = attendance_goals.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "attendance_goals_update" ON attendance_goals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = attendance_goals.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "attendance_goals_delete" ON attendance_goals FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = attendance_goals.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
