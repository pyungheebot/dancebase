CREATE TABLE group_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_rate int NOT NULL DEFAULT 90, -- 목표 출석률 %
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  is_achieved boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "그룹 멤버 조회" ON group_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_challenges.group_id AND group_members.user_id = auth.uid())
  );

CREATE POLICY "리더 삽입" ON group_challenges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_challenges.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
    AND created_by = auth.uid()
  );

CREATE POLICY "리더 수정" ON group_challenges
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_challenges.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
  );

CREATE POLICY "리더 삭제" ON group_challenges
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_challenges.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
  );

CREATE INDEX idx_group_challenges_group ON group_challenges(group_id, starts_at DESC);
