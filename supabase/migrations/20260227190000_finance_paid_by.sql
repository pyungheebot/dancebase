-- finance_transactions에 paid_by 컬럼 추가 (납부자 추적)
ALTER TABLE finance_transactions
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL DEFAULT NULL;

COMMENT ON COLUMN finance_transactions.paid_by IS '납부자 프로필 ID (수입 거래 시 누가 납부했는지 추적)';
