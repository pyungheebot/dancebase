-- group_members에 dashboard_settings 컬럼 추가
ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS dashboard_settings JSONB DEFAULT NULL;

-- 본인 레코드의 dashboard_settings만 수정 가능한 RLS 정책
CREATE POLICY "Users can update own dashboard_settings"
ON group_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- role 자가 변경 방지 트리거 (group_members)
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND NEW.user_id = auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM group_members
       WHERE group_id = OLD.group_id
         AND user_id = auth.uid()
         AND role = 'leader'
     )
  THEN
    RAISE EXCEPTION 'Cannot change own role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_prevent_role_self_change
BEFORE UPDATE ON group_members
FOR EACH ROW
EXECUTE FUNCTION prevent_role_self_change();
