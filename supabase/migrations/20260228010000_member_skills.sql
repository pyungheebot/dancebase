CREATE TABLE IF NOT EXISTS member_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level INT NOT NULL DEFAULT 1 CHECK (skill_level BETWEEN 1 AND 5),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id, skill_name)
);

ALTER TABLE member_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_skills_select" ON member_skills FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = member_skills.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "member_skills_insert" ON member_skills FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = member_skills.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
  OR user_id = auth.uid()
);
CREATE POLICY "member_skills_update" ON member_skills FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = member_skills.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
  OR user_id = auth.uid()
);
CREATE POLICY "member_skills_delete" ON member_skills FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = member_skills.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
