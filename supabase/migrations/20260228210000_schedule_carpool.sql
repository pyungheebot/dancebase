CREATE TABLE schedule_carpool_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES auth.users(id),
  total_seats int NOT NULL DEFAULT 3,
  departure_location text,
  departure_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, driver_id)
);

CREATE TABLE schedule_carpool_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES schedule_carpool_offers(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at timestamptz DEFAULT now(),
  UNIQUE(offer_id, passenger_id)
);

ALTER TABLE schedule_carpool_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_carpool_requests ENABLE ROW LEVEL SECURITY;

-- offers: 같은 일정의 그룹 멤버만 조회
CREATE POLICY "일정 그룹 멤버 조회" ON schedule_carpool_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = schedule_carpool_offers.schedule_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "본인 제공 등록" ON schedule_carpool_offers
  FOR INSERT WITH CHECK (driver_id = auth.uid());

CREATE POLICY "본인 제공 수정" ON schedule_carpool_offers
  FOR UPDATE USING (driver_id = auth.uid());

CREATE POLICY "본인 제공 삭제" ON schedule_carpool_offers
  FOR DELETE USING (driver_id = auth.uid());

-- requests
CREATE POLICY "관련자 조회" ON schedule_carpool_requests
  FOR SELECT USING (
    passenger_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM schedule_carpool_offers o WHERE o.id = schedule_carpool_requests.offer_id AND o.driver_id = auth.uid()
    )
  );

CREATE POLICY "본인 요청 등록" ON schedule_carpool_requests
  FOR INSERT WITH CHECK (passenger_id = auth.uid());

CREATE POLICY "운전자 응답" ON schedule_carpool_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM schedule_carpool_offers o WHERE o.id = schedule_carpool_requests.offer_id AND o.driver_id = auth.uid()
    )
  );

CREATE POLICY "본인 요청 삭제" ON schedule_carpool_requests
  FOR DELETE USING (passenger_id = auth.uid());

CREATE INDEX idx_carpool_offers_schedule ON schedule_carpool_offers(schedule_id);
CREATE INDEX idx_carpool_requests_offer ON schedule_carpool_requests(offer_id);
