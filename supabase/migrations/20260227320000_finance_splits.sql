-- 분할 정산 테이블
CREATE TABLE IF NOT EXISTS finance_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount BIGINT NOT NULL,
  paid_by UUID NOT NULL REFERENCES auth.users(id),
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- 분할 정산 참여자
CREATE TABLE IF NOT EXISTS finance_split_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES finance_splits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount BIGINT NOT NULL,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMPTZ,
  UNIQUE(split_id, user_id)
);

-- RLS
ALTER TABLE finance_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_split_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_splits_select" ON finance_splits FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = finance_splits.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "finance_splits_insert" ON finance_splits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = finance_splits.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
CREATE POLICY "finance_splits_update" ON finance_splits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = finance_splits.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);

CREATE POLICY "finance_split_members_select" ON finance_split_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM finance_splits fs JOIN group_members gm ON gm.group_id = fs.group_id WHERE fs.id = finance_split_members.split_id AND gm.user_id = auth.uid())
);
CREATE POLICY "finance_split_members_update" ON finance_split_members FOR UPDATE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM finance_splits fs JOIN group_members gm ON gm.group_id = fs.group_id WHERE fs.id = finance_split_members.split_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
