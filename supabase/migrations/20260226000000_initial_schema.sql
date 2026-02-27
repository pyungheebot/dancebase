-- 댄서 프로필
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dance_genre TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 그룹
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 그룹 멤버
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 연습 스케줄
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 출석
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'absent',
  checked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, user_id)
);

-- 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- profiles: 누구나 조회, 본인만 수정
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- groups: 멤버만 조회, 리더만 수정/삭제
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );

CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );

-- group_members: 멤버만 조회, 리더만 추가/삭제, 본인 참여 가능
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    -- 리더가 추가하거나, 본인이 초대 코드로 참여
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    )
  );

CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    -- 본인 탈퇴 또는 리더가 삭제
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    )
  );

-- schedules: 멤버만 조회, 리더만 생성/수정/삭제
CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = schedules.group_id
        AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = schedules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );

CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = schedules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );

CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = schedules.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'leader'
    )
  );

-- attendance: 멤버만 조회, 본인 출석만 기록(upsert), 리더는 전체 관리
CREATE POLICY "attendance_select" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = attendance.schedule_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_insert" ON attendance
  FOR INSERT WITH CHECK (
    -- 본인 출석 또는 리더
    (auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = attendance.schedule_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    ))
    AND EXISTS (
      SELECT 1 FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = attendance.schedule_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "attendance_update" ON attendance
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM schedules s
      JOIN group_members gm ON gm.group_id = s.group_id
      WHERE s.id = attendance.schedule_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'leader'
    )
  );
