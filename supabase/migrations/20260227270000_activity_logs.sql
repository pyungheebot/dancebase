-- ============================================
-- 활동 감사 로그 (Activity Logs)
-- 그룹/프로젝트 주요 활동을 기록하는 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('group', 'project')),
  entity_id   UUID NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 조회 성능을 위한 인덱스 (최신순)
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
  ON activity_logs (entity_type, entity_id, created_at DESC);

-- ============================================
-- RLS 활성화
-- ============================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 해당 엔티티의 리더만 조회 가능
CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT USING (
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

-- INSERT: 해당 엔티티의 멤버가 자신의 활동을 기록할 수 있음
-- user_id는 반드시 자기 자신이어야 함
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
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
    )
  );

-- DELETE: 리더만 삭제 가능 (감사 로그 정리용)
CREATE POLICY "activity_logs_delete" ON activity_logs
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
