-- 회비 관리(가계부) 기능

-- groups 테이블에 회비 권한 컬럼 추가
ALTER TABLE groups
  ADD COLUMN finance_managers UUID[] DEFAULT '{}',
  ADD COLUMN finance_viewers UUID[] DEFAULT '{}';

-- 회비 카테고리
CREATE TABLE finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, name)
);

-- 회비 거래 내역
CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount INT NOT NULL CHECK (amount > 0),
  title TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- 헬퍼: 회비 열람 권한 (리더 OR manager OR viewer)
CREATE OR REPLACE FUNCTION public.can_view_finance(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_group_leader(gid)
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE id = gid AND auth.uid() = ANY(finance_managers)
    )
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE id = gid AND auth.uid() = ANY(finance_viewers)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 헬퍼: 회비 관리 권한 (리더 OR manager)
CREATE OR REPLACE FUNCTION public.can_manage_finance(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_group_leader(gid)
    OR EXISTS (
      SELECT 1 FROM groups
      WHERE id = gid AND auth.uid() = ANY(finance_managers)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- finance_categories
CREATE POLICY "finance_categories_select" ON finance_categories
  FOR SELECT USING (public.can_view_finance(group_id));

CREATE POLICY "finance_categories_insert" ON finance_categories
  FOR INSERT WITH CHECK (public.can_manage_finance(group_id));

CREATE POLICY "finance_categories_update" ON finance_categories
  FOR UPDATE USING (public.can_manage_finance(group_id));

CREATE POLICY "finance_categories_delete" ON finance_categories
  FOR DELETE USING (public.can_manage_finance(group_id));

-- finance_transactions
CREATE POLICY "finance_transactions_select" ON finance_transactions
  FOR SELECT USING (public.can_view_finance(group_id));

CREATE POLICY "finance_transactions_insert" ON finance_transactions
  FOR INSERT WITH CHECK (public.can_manage_finance(group_id));

CREATE POLICY "finance_transactions_update" ON finance_transactions
  FOR UPDATE USING (public.can_manage_finance(group_id));

CREATE POLICY "finance_transactions_delete" ON finance_transactions
  FOR DELETE USING (public.can_manage_finance(group_id));
