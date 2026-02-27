-- ============================================
-- 일정 템플릿 (Schedule Templates)
-- 자주 사용하는 일정 패턴을 저장하고 재사용
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL CHECK (entity_type IN ('group', 'project')),
  entity_id        UUID NOT NULL,
  name             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  location         TEXT,
  duration_minutes INT,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_schedule_templates_entity
  ON schedule_templates (entity_type, entity_id);

-- ============================================
-- RLS 활성화
-- ============================================

ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: 같은 entity 멤버라면 조회 가능
CREATE POLICY "schedule_templates_select" ON schedule_templates
  FOR SELECT USING (
    CASE entity_type
      WHEN 'group' THEN
        public.is_group_member(entity_id)
      WHEN 'project' THEN
        public.is_project_member(entity_id)
        OR EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = entity_id
            AND public.is_group_member(p.group_id)
        )
      ELSE false
    END
  );

-- INSERT: 리더만 템플릿 추가 가능
CREATE POLICY "schedule_templates_insert" ON schedule_templates
  FOR INSERT WITH CHECK (
    CASE entity_type
      WHEN 'group' THEN
        public.is_group_leader(entity_id)
      WHEN 'project' THEN
        public.is_project_leader(entity_id)
        OR EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = entity_id
            AND public.is_group_leader(p.group_id)
        )
      ELSE false
    END
  );

-- UPDATE: 리더만 템플릿 수정 가능
CREATE POLICY "schedule_templates_update" ON schedule_templates
  FOR UPDATE USING (
    CASE entity_type
      WHEN 'group' THEN
        public.is_group_leader(entity_id)
      WHEN 'project' THEN
        public.is_project_leader(entity_id)
        OR EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = entity_id
            AND public.is_group_leader(p.group_id)
        )
      ELSE false
    END
  );

-- DELETE: 리더만 템플릿 삭제 가능
CREATE POLICY "schedule_templates_delete" ON schedule_templates
  FOR DELETE USING (
    CASE entity_type
      WHEN 'group' THEN
        public.is_group_leader(entity_id)
      WHEN 'project' THEN
        public.is_project_leader(entity_id)
        OR EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = entity_id
            AND public.is_group_leader(p.group_id)
        )
      ELSE false
    END
  );
