CREATE TABLE song_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES project_songs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  part_name text NOT NULL,
  part_type text NOT NULL DEFAULT 'all', -- all, solo, point, backup, intro, outro, bridge
  sort_order int NOT NULL DEFAULT 0,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(song_id, user_id, part_type)
);

ALTER TABLE song_parts ENABLE ROW LEVEL SECURITY;

-- project_songs → projects → group_id 경로로 멤버 확인
CREATE POLICY "프로젝트 멤버 조회" ON song_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_songs ps
      JOIN projects p ON p.id = ps.project_id
      JOIN group_members gm ON gm.group_id = p.group_id
      WHERE ps.id = song_parts.song_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "리더 삽입" ON song_parts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_songs ps
      JOIN projects p ON p.id = ps.project_id
      JOIN group_members gm ON gm.group_id = p.group_id
      WHERE ps.id = song_parts.song_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "리더 수정" ON song_parts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_songs ps
      JOIN projects p ON p.id = ps.project_id
      JOIN group_members gm ON gm.group_id = p.group_id
      WHERE ps.id = song_parts.song_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader')
    )
  );

CREATE POLICY "리더 삭제" ON song_parts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_songs ps
      JOIN projects p ON p.id = ps.project_id
      JOIN group_members gm ON gm.group_id = p.group_id
      WHERE ps.id = song_parts.song_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader')
    )
  );

CREATE INDEX idx_song_parts_song ON song_parts(song_id, sort_order);
