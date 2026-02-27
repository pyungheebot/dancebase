CREATE TABLE schedule_rsvp (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response text NOT NULL CHECK (response IN ('going', 'not_going', 'maybe')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(schedule_id, user_id)
);

ALTER TABLE schedule_rsvp ENABLE ROW LEVEL SECURITY;

-- RLS: 같은 그룹/프로젝트 멤버만 조회, 본인만 수정
CREATE POLICY "스케줄 RSVP 조회" ON schedule_rsvp FOR SELECT USING (true);
CREATE POLICY "스케줄 RSVP 생성" ON schedule_rsvp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "스케줄 RSVP 수정" ON schedule_rsvp FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "스케줄 RSVP 삭제" ON schedule_rsvp FOR DELETE USING (auth.uid() = user_id);
