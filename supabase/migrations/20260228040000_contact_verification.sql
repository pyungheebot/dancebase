CREATE TABLE IF NOT EXISTS contact_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id, requested_at)
);

ALTER TABLE contact_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_verifications_select" ON contact_verifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = contact_verifications.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "contact_verifications_insert" ON contact_verifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = contact_verifications.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "contact_verifications_update" ON contact_verifications FOR UPDATE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = contact_verifications.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
