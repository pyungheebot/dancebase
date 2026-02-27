-- 그룹 설정(프로필) 기능: groups 테이블 확장

-- 새 컬럼 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('public', 'private'));

ALTER TABLE groups ADD COLUMN IF NOT EXISTS join_policy TEXT NOT NULL DEFAULT 'invite_only'
  CHECK (join_policy IN ('invite_only', 'approval', 'open'));

ALTER TABLE groups ADD COLUMN IF NOT EXISTS dance_genre TEXT[] DEFAULT '{}';

ALTER TABLE groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members INT;

-- 공개 그룹은 누구나 조회 가능하도록 RLS 정책 추가
CREATE POLICY "Anyone can view public groups"
  ON groups FOR SELECT
  USING (visibility = 'public');
