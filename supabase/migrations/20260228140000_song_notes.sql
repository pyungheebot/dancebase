-- song_notes 테이블 생성
CREATE TABLE IF NOT EXISTS song_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES project_songs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE song_notes ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버 읽기 가능
CREATE POLICY "song_notes_select" ON song_notes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_songs ps
    JOIN project_members pm ON pm.project_id = ps.project_id
    WHERE ps.id = song_notes.song_id
      AND pm.user_id = auth.uid()
  )
);

-- 인증된 사용자 작성 가능 (프로젝트 멤버)
CREATE POLICY "song_notes_insert" ON song_notes FOR INSERT WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM project_songs ps
    JOIN project_members pm ON pm.project_id = ps.project_id
    WHERE ps.id = song_notes.song_id
      AND pm.user_id = auth.uid()
  )
);

-- 본인만 삭제 가능
CREATE POLICY "song_notes_delete" ON song_notes FOR DELETE USING (
  auth.uid() = created_by
);
