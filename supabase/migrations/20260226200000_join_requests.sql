-- join_requests 테이블: 그룹 가입 신청
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(group_id, user_id)
);

ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- 본인 INSERT 가능 (가입 신청)
CREATE POLICY "Users can create their own join requests"
  ON join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 자기 신청 조회 가능
CREATE POLICY "Users can view their own join requests"
  ON join_requests FOR SELECT
  USING (auth.uid() = user_id);

-- 그룹 리더는 해당 그룹 신청 조회 가능
CREATE POLICY "Group leaders can view join requests"
  ON join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = join_requests.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );

-- 그룹 리더는 해당 그룹 신청 업데이트 가능 (승인/거부)
CREATE POLICY "Group leaders can update join requests"
  ON join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = join_requests.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );
