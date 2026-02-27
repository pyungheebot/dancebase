-- 그룹 생성 + 리더 추가를 한 번에 처리하는 함수
CREATE OR REPLACE FUNCTION public.create_group_with_leader(
  group_name TEXT,
  group_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
BEGIN
  INSERT INTO groups (name, description, created_by)
  VALUES (group_name, group_description, auth.uid())
  RETURNING id INTO new_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'leader');

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
