-- ============================================
-- 댄스 경력: 년수 → 장르별 시작일로 변경
-- ============================================

-- dance_career_years 컬럼 삭제
ALTER TABLE profiles DROP COLUMN IF EXISTS dance_career_years;

-- dance_genre_start_dates 컬럼 추가 (JSONB, 예: {"힙합": "2020-03", "팝핀": "2022-01"})
ALTER TABLE profiles ADD COLUMN dance_genre_start_dates JSONB DEFAULT '{}'::jsonb;

-- privacy_settings 기본값에서 dance_career_years → dance_genre_start_dates 키 변경
ALTER TABLE profiles
  ALTER COLUMN privacy_settings SET DEFAULT '{
    "bio": "public",
    "birth_date": "private",
    "phone": "private",
    "instagram": "public",
    "youtube": "public",
    "active_region": "public",
    "dance_genre_start_dates": "public",
    "crew_name": "public",
    "dance_genre": "public"
  }'::jsonb;

-- 기존 프로필의 privacy_settings에서 dance_career_years → dance_genre_start_dates 키 마이그레이션
UPDATE profiles
SET privacy_settings = (privacy_settings - 'dance_career_years') || jsonb_build_object(
  'dance_genre_start_dates',
  COALESCE(privacy_settings->>'dance_career_years', 'public')
)
WHERE privacy_settings ? 'dance_career_years';
