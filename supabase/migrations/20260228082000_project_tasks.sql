-- project_tasks 테이블 생성
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) DEFAULT NULL,
  due_date DATE DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버만 조회 가능
CREATE POLICY "project_tasks_select" ON project_tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_tasks.project_id
      AND pm.user_id = auth.uid()
  )
);

-- 프로젝트 멤버면 생성 가능
CREATE POLICY "project_tasks_insert" ON project_tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_tasks.project_id
      AND pm.user_id = auth.uid()
  )
  AND auth.uid() = created_by
);

-- 프로젝트 멤버면 수정 가능 (리더/생성자)
CREATE POLICY "project_tasks_update" ON project_tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_tasks.project_id
      AND pm.user_id = auth.uid()
  )
);

-- 생성자 또는 프로젝트 리더만 삭제 가능
CREATE POLICY "project_tasks_delete" ON project_tasks FOR DELETE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'leader'
  )
);
