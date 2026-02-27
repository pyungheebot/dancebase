CREATE TABLE performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL DEFAULT 'performance', -- performance, competition, showcase, workshop
  result text, -- 수상 결과
  ranking text, -- 순위
  audience_count int,
  venue text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "그룹 멤버 조회" ON performance_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = performance_records.group_id AND group_members.user_id = auth.uid())
  );

CREATE POLICY "리더 삽입" ON performance_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = performance_records.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
    AND created_by = auth.uid()
  );

CREATE POLICY "리더 수정" ON performance_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = performance_records.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
  );

CREATE POLICY "리더 삭제" ON performance_records
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = performance_records.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
  );

CREATE INDEX idx_performance_records_group ON performance_records(group_id, event_date DESC);
