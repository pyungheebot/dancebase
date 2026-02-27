-- ============================================
-- 엔티티 범용 설정 테이블 (Entity Settings)
-- 그룹/프로젝트의 다양한 설정을 key-value 형태로 저장
-- ============================================

CREATE TABLE IF NOT EXISTS entity_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('group', 'project')),
  entity_id    UUID NOT NULL,
  key          TEXT NOT NULL,
  value        JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (entity_type, entity_id, key)
);

-- 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_entity_settings_entity
  ON entity_settings (entity_type, entity_id);

-- ============================================
-- RLS 활성화
-- ============================================

ALTER TABLE entity_settings ENABLE ROW LEVEL SECURITY;

-- SELECT: 해당 엔티티의 멤버라면 조회 가능
CREATE POLICY "entity_settings_select" ON entity_settings
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

-- INSERT: 리더만 새 설정 추가 가능
CREATE POLICY "entity_settings_insert" ON entity_settings
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

-- UPDATE: 리더만 설정 수정 가능
CREATE POLICY "entity_settings_update" ON entity_settings
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

-- DELETE: 리더만 설정 삭제 가능
CREATE POLICY "entity_settings_delete" ON entity_settings
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
