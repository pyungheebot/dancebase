-- receipt_share_tokens: 회비 납부 영수증 공유 링크 토큰 테이블
CREATE TABLE IF NOT EXISTS receipt_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
  token VARCHAR(32) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_receipt_share_tokens_token ON receipt_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_receipt_share_tokens_transaction_id ON receipt_share_tokens(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipt_share_tokens_created_by ON receipt_share_tokens(created_by);

-- RLS 활성화
ALTER TABLE receipt_share_tokens ENABLE ROW LEVEL SECURITY;

-- 인증 사용자: 자신이 만든 토큰 조회
CREATE POLICY "인증 사용자 본인 토큰 조회"
  ON receipt_share_tokens
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- 인증 사용자: 토큰 생성
CREATE POLICY "인증 사용자 토큰 생성"
  ON receipt_share_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 인증 사용자: 본인 토큰 삭제
CREATE POLICY "인증 사용자 본인 토큰 삭제"
  ON receipt_share_tokens
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- anon(비인증) 사용자: 토큰으로 공개 읽기 (만료 전 토큰)
CREATE POLICY "토큰으로 공개 읽기"
  ON receipt_share_tokens
  FOR SELECT
  TO anon
  USING (expires_at > now());
