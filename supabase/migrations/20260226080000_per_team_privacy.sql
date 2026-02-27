-- ============================================
-- 팀별 개별 공개 설정
-- ============================================

-- profiles 테이블에 team_privacy 컬럼 추가 (group_id → privacy_level)
ALTER TABLE profiles
  ADD COLUMN team_privacy JSONB DEFAULT '{}'::jsonb;

-- privacy_settings에서 teams 키 제거
UPDATE profiles
SET privacy_settings = privacy_settings - 'teams'
WHERE privacy_settings ? 'teams';

-- privacy_settings 기본값에서 teams 제거
ALTER TABLE profiles
  ALTER COLUMN privacy_settings SET DEFAULT '{
    "bio": "public",
    "birth_date": "private",
    "phone": "private",
    "instagram": "public",
    "youtube": "public",
    "active_region": "public",
    "dance_genre_start_dates": "public",
    "dance_genre": "public"
  }'::jsonb;
