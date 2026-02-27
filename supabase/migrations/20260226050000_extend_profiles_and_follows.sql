-- ============================================
-- 프로필 확장 + 팔로우 시스템
-- ============================================

-- profiles 테이블 확장 컬럼
ALTER TABLE profiles
  ADD COLUMN bio TEXT DEFAULT '',
  ADD COLUMN birth_date DATE,
  ADD COLUMN phone TEXT DEFAULT '',
  ADD COLUMN instagram TEXT DEFAULT '',
  ADD COLUMN youtube TEXT DEFAULT '',
  ADD COLUMN active_region TEXT DEFAULT '',
  ADD COLUMN dance_career_years INT,
  ADD COLUMN crew_name TEXT DEFAULT '',
  ADD COLUMN privacy_settings JSONB DEFAULT '{
    "bio": "public",
    "birth_date": "private",
    "phone": "private",
    "instagram": "public",
    "youtube": "public",
    "active_region": "public",
    "dance_career_years": "public",
    "crew_name": "public",
    "dance_genre": "public"
  }'::jsonb,
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- follows 테이블
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- follows RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- 헬퍼 함수
-- ============================================

-- 맞팔로우 확인
CREATE OR REPLACE FUNCTION is_mutual_follow(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = user_a AND following_id = user_b
  ) AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = user_b AND following_id = user_a
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 팔로우 여부 확인
CREATE OR REPLACE FUNCTION is_following(p_follower UUID, p_target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = p_follower AND following_id = p_target
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
