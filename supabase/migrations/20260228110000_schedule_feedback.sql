-- 일정 만족도 평가 테이블
CREATE TABLE IF NOT EXISTS schedule_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, user_id)
);

-- 인덱스: 특정 일정의 피드백 조회 최적화
CREATE INDEX IF NOT EXISTS idx_schedule_feedback_schedule_id
  ON schedule_feedback (schedule_id);

-- 인덱스: 특정 유저의 피드백 조회 최적화
CREATE INDEX IF NOT EXISTS idx_schedule_feedback_user_id
  ON schedule_feedback (user_id);

-- RLS 활성화
ALTER TABLE schedule_feedback ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버는 같은 그룹의 일정 피드백을 읽을 수 있음
CREATE POLICY "그룹 멤버는 일정 피드백 읽기 가능" ON schedule_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_feedback.schedule_id
        AND gm.user_id = auth.uid()
    )
  );

-- 그룹 멤버는 자신의 피드백을 작성할 수 있음
CREATE POLICY "그룹 멤버는 본인 피드백 작성 가능" ON schedule_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_feedback.schedule_id
        AND gm.user_id = auth.uid()
    )
  );

-- 본인만 자신의 피드백을 수정할 수 있음
CREATE POLICY "본인 피드백 수정 가능" ON schedule_feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인만 자신의 피드백을 삭제할 수 있음
CREATE POLICY "본인 피드백 삭제 가능" ON schedule_feedback
  FOR DELETE
  USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE schedule_feedback IS '일정 만족도 평가 (별점 1-5, 코멘트)';
COMMENT ON COLUMN schedule_feedback.rating IS '만족도 별점 (1~5)';
COMMENT ON COLUMN schedule_feedback.comment IS '코멘트 (선택 입력)';
