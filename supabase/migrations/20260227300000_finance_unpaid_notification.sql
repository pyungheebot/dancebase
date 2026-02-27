-- ============================================
-- notifications 테이블 type CHECK 제약에 finance_unpaid 추가
-- ============================================

-- 기존 CHECK 제약 삭제
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 새 CHECK 제약 추가 (finance_unpaid 포함)
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_post',
    'new_comment',
    'attendance',
    'join_request',
    'join_approved',
    'join_rejected',
    'finance_unpaid'
  ));
