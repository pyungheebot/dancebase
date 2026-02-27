-- ============================================
-- 그룹 유형 추가 + 소속 크루 제거
-- ============================================

-- groups 테이블에 group_type 추가
ALTER TABLE groups
  ADD COLUMN group_type TEXT NOT NULL DEFAULT '기타'
  CHECK (group_type IN ('팀', '동호회', '친목', '기타'));

-- profiles 테이블에서 crew_name 컬럼 삭제
ALTER TABLE profiles DROP COLUMN IF EXISTS crew_name;

-- privacy_settings 기본값에서 crew_name → teams 키 변경
ALTER TABLE profiles
  ALTER COLUMN privacy_settings SET DEFAULT '{
    "bio": "public",
    "birth_date": "private",
    "phone": "private",
    "instagram": "public",
    "youtube": "public",
    "active_region": "public",
    "dance_genre_start_dates": "public",
    "teams": "public",
    "dance_genre": "public"
  }'::jsonb;

-- 기존 프로필의 privacy_settings에서 crew_name → teams 마이그레이션
UPDATE profiles
SET privacy_settings = (privacy_settings - 'crew_name') || jsonb_build_object('teams', COALESCE(privacy_settings->>'crew_name', 'public'))
WHERE privacy_settings ? 'crew_name';

-- 기존 프로필에 teams 키가 없는 경우 추가
UPDATE profiles
SET privacy_settings = privacy_settings || '{"teams": "public"}'::jsonb
WHERE NOT (privacy_settings ? 'teams');

-- create_group_with_leader 함수에 group_type 파라미터 추가
CREATE OR REPLACE FUNCTION public.create_group_with_leader(
  group_name TEXT,
  group_description TEXT DEFAULT NULL,
  group_type TEXT DEFAULT '기타'
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
BEGIN
  INSERT INTO groups (name, description, created_by, group_type)
  VALUES (group_name, group_description, auth.uid(), group_type)
  RETURNING id INTO new_group_id;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'leader');

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
