CREATE TABLE IF NOT EXISTS permission_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('role_change', 'member_add', 'member_remove', 'permission_grant', 'permission_revoke')),
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE permission_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permission_audits_select" ON permission_audits FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = permission_audits.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "permission_audits_insert" ON permission_audits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = permission_audits.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
