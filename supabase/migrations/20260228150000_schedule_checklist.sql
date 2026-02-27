-- schedule_checklist_items 테이블 생성
CREATE TABLE IF NOT EXISTS schedule_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) DEFAULT NULL,
  is_done BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE schedule_checklist_items ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버 조회 가능
CREATE POLICY "schedule_checklist_select" ON schedule_checklist_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM schedules s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE s.id = schedule_checklist_items.schedule_id
      AND gm.user_id = auth.uid()
  )
);

-- 그룹 리더/서브리더만 항목 생성 가능
CREATE POLICY "schedule_checklist_insert" ON schedule_checklist_items FOR INSERT WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM schedules s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE s.id = schedule_checklist_items.schedule_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('leader', 'sub_leader')
  )
);

-- 담당자(본인) 또는 리더/서브리더가 수정 가능 (완료 토글 포함)
CREATE POLICY "schedule_checklist_update" ON schedule_checklist_items FOR UPDATE USING (
  -- 담당자 본인은 is_done 토글 가능
  (assignee_id = auth.uid())
  OR
  -- 리더/서브리더는 모든 필드 수정 가능
  EXISTS (
    SELECT 1 FROM schedules s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE s.id = schedule_checklist_items.schedule_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('leader', 'sub_leader')
  )
  OR
  -- 생성자도 수정 가능
  created_by = auth.uid()
);

-- 리더/서브리더 또는 생성자만 삭제 가능
CREATE POLICY "schedule_checklist_delete" ON schedule_checklist_items FOR DELETE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM schedules s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE s.id = schedule_checklist_items.schedule_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('leader', 'sub_leader')
  )
);
