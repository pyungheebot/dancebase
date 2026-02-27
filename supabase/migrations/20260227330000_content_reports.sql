-- 콘텐츠 신고 테이블
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(target_type, target_id, reporter_id)
);

-- board_comments에 숨김 컬럼 추가
ALTER TABLE board_comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_reports_select" ON content_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = content_reports.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
  OR reporter_id = auth.uid()
);
CREATE POLICY "content_reports_insert" ON content_reports FOR INSERT WITH CHECK (
  reporter_id = auth.uid() AND
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = content_reports.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "content_reports_update" ON content_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = content_reports.group_id AND gm.user_id = auth.uid() AND gm.role IN ('leader', 'sub_leader'))
);
