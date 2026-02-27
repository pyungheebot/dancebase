-- 초대 코드 만료/비활성화 기능
ALTER TABLE groups ADD COLUMN IF NOT EXISTS invite_code_enabled boolean DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS invite_code_expires_at timestamptz DEFAULT NULL;
