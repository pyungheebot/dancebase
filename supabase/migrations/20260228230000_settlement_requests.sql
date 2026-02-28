-- ============================================
-- 정산 요청 기능: 정산 수단, 정산 요청, 요청 대상 멤버
-- ============================================

-- ============================================
-- 1. 헬퍼 함수: 리더 또는 부그룹장 여부
-- ============================================

CREATE OR REPLACE FUNCTION public.is_group_leader_or_sub_leader(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid
      AND user_id = auth.uid()
      AND role IN ('leader', 'sub_leader')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. 테이블 생성
-- ============================================

-- 정산 수단
CREATE TABLE group_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bank', 'toss', 'kakao')),
  label TEXT NOT NULL,
  bank_name TEXT NULL,
  account_number TEXT NULL,
  account_holder TEXT NULL,
  toss_id TEXT NULL,
  kakao_link TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_group_payment_methods_group ON group_payment_methods(group_id);

ALTER TABLE group_payment_methods ENABLE ROW LEVEL SECURITY;

-- 정산 요청
CREATE TABLE settlement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  memo TEXT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  due_date DATE NULL,
  payment_method_id UUID NULL REFERENCES group_payment_methods(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_settlement_requests_group ON settlement_requests(group_id);

ALTER TABLE settlement_requests ENABLE ROW LEVEL SECURITY;

-- 정산 요청 대상 멤버
CREATE TABLE settlement_request_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES settlement_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_pending', 'confirmed')),
  paid_at TIMESTAMPTZ NULL,
  confirmed_at TIMESTAMPTZ NULL,
  UNIQUE (request_id, user_id)
);

CREATE INDEX idx_settlement_request_members_request ON settlement_request_members(request_id);
CREATE INDEX idx_settlement_request_members_user ON settlement_request_members(user_id);

ALTER TABLE settlement_request_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS 정책
-- ============================================

-- group_payment_methods
CREATE POLICY "group_payment_methods_select" ON group_payment_methods
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "group_payment_methods_insert" ON group_payment_methods
  FOR INSERT WITH CHECK (public.is_group_leader_or_sub_leader(group_id));

CREATE POLICY "group_payment_methods_update" ON group_payment_methods
  FOR UPDATE USING (public.is_group_leader_or_sub_leader(group_id));

CREATE POLICY "group_payment_methods_delete" ON group_payment_methods
  FOR DELETE USING (public.is_group_leader_or_sub_leader(group_id));

-- settlement_requests
CREATE POLICY "settlement_requests_select" ON settlement_requests
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "settlement_requests_insert" ON settlement_requests
  FOR INSERT WITH CHECK (public.is_group_leader_or_sub_leader(group_id));

CREATE POLICY "settlement_requests_update" ON settlement_requests
  FOR UPDATE USING (public.is_group_leader_or_sub_leader(group_id));

-- settlement_request_members
-- 그룹 멤버는 요청에 속한 멤버 목록 조회 가능
CREATE POLICY "settlement_request_members_select" ON settlement_request_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlement_requests sr
      WHERE sr.id = request_id
        AND public.is_group_member(sr.group_id)
    )
  );

-- 본인 납부 상태 변경 또는 리더/부그룹장이 확인 처리
CREATE POLICY "settlement_request_members_update_self" ON settlement_request_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "settlement_request_members_update_leader" ON settlement_request_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM settlement_requests sr
      WHERE sr.id = request_id
        AND public.is_group_leader_or_sub_leader(sr.group_id)
    )
  );

-- ============================================
-- 4. notifications type CHECK 갱신: settlement_request 추가
-- ============================================

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_post',
    'new_comment',
    'attendance',
    'join_request',
    'join_approved',
    'join_rejected',
    'finance_unpaid',
    'action_item',
    'new_follow',
    'settlement_request'
  ));

-- ============================================
-- 5. RPC: 정산 요청 생성 + 멤버 + 알림 일괄 처리
-- ============================================

CREATE OR REPLACE FUNCTION create_settlement_request_with_notifications(
  p_group_id UUID,
  p_title TEXT,
  p_amount BIGINT,
  p_member_ids UUID[],
  p_memo TEXT DEFAULT NULL,
  p_due_date DATE DEFAULT NULL,
  p_payment_method_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_member_id UUID;
  v_profile_name TEXT;
  v_notification_message TEXT;
BEGIN
  -- 권한 확인: 리더 또는 부그룹장만 실행 가능
  IF NOT public.is_group_leader_or_sub_leader(p_group_id) THEN
    RAISE EXCEPTION 'permission denied: only leader or sub_leader can create settlement requests';
  END IF;

  -- 정산 요청 생성
  INSERT INTO settlement_requests (
    group_id,
    title,
    memo,
    amount,
    due_date,
    payment_method_id,
    created_by
  )
  VALUES (
    p_group_id,
    p_title,
    p_memo,
    p_amount,
    p_due_date,
    p_payment_method_id,
    auth.uid()
  )
  RETURNING id INTO v_request_id;

  -- 요청자 프로필 이름 조회 (알림 메시지용)
  SELECT name INTO v_profile_name
  FROM profiles
  WHERE id = auth.uid();

  -- 알림 메시지 구성
  v_notification_message := v_profile_name || '님이 정산 요청을 보냈습니다: ' || p_title || ' (' || p_amount || '원)';

  -- 멤버별 INSERT + 알림 발송
  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    -- 대상 멤버 추가
    INSERT INTO settlement_request_members (request_id, user_id)
    VALUES (v_request_id, v_member_id)
    ON CONFLICT (request_id, user_id) DO NOTHING;

    -- 본인 제외하고 알림 발송
    IF v_member_id <> auth.uid() THEN
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        v_member_id,
        'settlement_request',
        '정산 요청',
        v_notification_message,
        '/groups/' || p_group_id || '/settlement'
      );
    END IF;
  END LOOP;

  RETURN v_request_id;
END;
$$;

-- ============================================
-- 6. RPC: 미납 멤버 리마인더 알림 재발송
-- ============================================

CREATE OR REPLACE FUNCTION remind_settlement_request(
  p_request_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
  v_title TEXT;
  v_amount BIGINT;
  v_profile_name TEXT;
  v_remind_count INT := 0;
  v_member RECORD;
BEGIN
  -- 요청 정보 조회
  SELECT group_id, title, amount
  INTO v_group_id, v_title, v_amount
  FROM settlement_requests
  WHERE id = p_request_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'settlement request not found or already closed';
  END IF;

  -- 권한 확인
  IF NOT public.is_group_leader_or_sub_leader(v_group_id) THEN
    RAISE EXCEPTION 'permission denied: only leader or sub_leader can send reminders';
  END IF;

  -- 요청자 이름 조회
  SELECT name INTO v_profile_name
  FROM profiles
  WHERE id = auth.uid();

  -- 미납(pending) 멤버에게 리마인더 알림 발송
  FOR v_member IN
    SELECT srm.user_id
    FROM settlement_request_members srm
    WHERE srm.request_id = p_request_id
      AND srm.status = 'pending'
      AND srm.user_id <> auth.uid()
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      v_member.user_id,
      'settlement_request',
      '정산 리마인더',
      v_profile_name || '님이 정산 요청 리마인더를 보냈습니다: ' || v_title || ' (' || v_amount || '원)',
      '/groups/' || v_group_id || '/settlement'
    );

    v_remind_count := v_remind_count + 1;
  END LOOP;

  RETURN v_remind_count;
END;
$$;
