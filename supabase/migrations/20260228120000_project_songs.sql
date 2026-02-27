-- project_songs 테이블 생성
CREATE TABLE IF NOT EXISTS project_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered')),
  youtube_url TEXT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE project_songs ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버만 조회 가능
CREATE POLICY "project_songs_select" ON project_songs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_songs.project_id
      AND pm.user_id = auth.uid()
  )
);

-- 프로젝트 리더만 생성 가능
CREATE POLICY "project_songs_insert" ON project_songs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_songs.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'leader'
  )
  AND auth.uid() = created_by
);

-- 프로젝트 리더만 수정 가능
CREATE POLICY "project_songs_update" ON project_songs FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_songs.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'leader'
  )
);

-- 프로젝트 리더만 삭제 가능
CREATE POLICY "project_songs_delete" ON project_songs FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_songs.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'leader'
  )
);
