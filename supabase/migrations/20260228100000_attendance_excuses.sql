-- 출석 면제 기능: attendances 테이블에 컬럼 추가
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS excuse_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS excuse_status TEXT DEFAULT NULL
    CHECK (excuse_status IN ('pending', 'approved', 'rejected'));

-- 인덱스: 특정 일정의 면제 신청 조회 최적화
CREATE INDEX IF NOT EXISTS idx_attendance_excuse_status
  ON attendance (schedule_id, excuse_status)
  WHERE excuse_status IS NOT NULL;

-- 코멘트
COMMENT ON COLUMN attendance.excuse_reason IS '면제 신청 사유 (멤버가 제출)';
COMMENT ON COLUMN attendance.excuse_status IS '면제 처리 상태: pending(대기), approved(승인), rejected(거절)';
