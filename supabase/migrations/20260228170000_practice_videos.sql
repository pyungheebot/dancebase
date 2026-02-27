CREATE TABLE practice_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  song_id uuid REFERENCES project_songs(id) ON DELETE SET NULL,
  url text NOT NULL,
  title text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'youtube', -- youtube, instagram, tiktok, other
  tags text[] DEFAULT '{}',
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "그룹 멤버 조회" ON practice_videos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = practice_videos.group_id AND group_members.user_id = auth.uid())
  );

CREATE POLICY "멤버 삽입" ON practice_videos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = practice_videos.group_id AND group_members.user_id = auth.uid())
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "본인 또는 리더 삭제" ON practice_videos
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = practice_videos.group_id AND group_members.user_id = auth.uid() AND group_members.role IN ('leader', 'sub_leader'))
  );

CREATE INDEX idx_practice_videos_group ON practice_videos(group_id, created_at DESC);
CREATE INDEX idx_practice_videos_song ON practice_videos(song_id);
