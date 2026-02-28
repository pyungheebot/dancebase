-- ============================================
-- project_songs 테이블에 spotify_url 컬럼 추가
-- ============================================

ALTER TABLE project_songs
  ADD COLUMN IF NOT EXISTS spotify_url TEXT DEFAULT NULL;
