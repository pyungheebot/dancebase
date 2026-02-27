-- finance_budgets 테이블: 월별 예산 설정
create table if not exists public.finance_budgets (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('group', 'project')),
  entity_id     uuid not null,
  year_month    text not null,  -- 예: '2026-02'
  budget_income numeric(15, 0) not null default 0,
  budget_expense numeric(15, 0) not null default 0,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (entity_type, entity_id, year_month)
);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger finance_budgets_updated_at
  before update on public.finance_budgets
  for each row execute function public.set_updated_at();

-- RLS 활성화
alter table public.finance_budgets enable row level security;

-- 조회 정책: 같은 entity 멤버면 조회 가능
create policy "finance_budgets_select" on public.finance_budgets
  for select
  using (
    (entity_type = 'group' and exists (
      select 1 from public.group_members gm
      where gm.group_id = finance_budgets.entity_id
        and gm.user_id = auth.uid()
    ))
    or
    (entity_type = 'project' and exists (
      select 1 from public.project_members pm
      where pm.project_id = finance_budgets.entity_id
        and pm.user_id = auth.uid()
    ))
  );

-- 삽입 정책: 그룹 리더 또는 finance_manage 권한 보유자만 가능
create policy "finance_budgets_insert" on public.finance_budgets
  for insert
  with check (
    (entity_type = 'group' and (
      exists (
        select 1 from public.group_members gm
        where gm.group_id = finance_budgets.entity_id
          and gm.user_id = auth.uid()
          and gm.role = 'leader'
      )
      or exists (
        select 1 from public.entity_permissions ep
        where ep.entity_type = 'group'
          and ep.entity_id = finance_budgets.entity_id
          and ep.user_id = auth.uid()
          and ep.permission = 'finance_manage'
      )
    ))
    or
    (entity_type = 'project' and exists (
      select 1 from public.project_members pm
      join public.group_members gm on gm.group_id = (
        select group_id from public.projects where id = finance_budgets.entity_id
      ) and gm.user_id = auth.uid() and gm.role = 'leader'
      where pm.project_id = finance_budgets.entity_id
        and pm.user_id = auth.uid()
    ))
  );

-- 수정 정책: 그룹 리더 또는 finance_manage 권한 보유자만 가능
create policy "finance_budgets_update" on public.finance_budgets
  for update
  using (
    (entity_type = 'group' and (
      exists (
        select 1 from public.group_members gm
        where gm.group_id = finance_budgets.entity_id
          and gm.user_id = auth.uid()
          and gm.role = 'leader'
      )
      or exists (
        select 1 from public.entity_permissions ep
        where ep.entity_type = 'group'
          and ep.entity_id = finance_budgets.entity_id
          and ep.user_id = auth.uid()
          and ep.permission = 'finance_manage'
      )
    ))
    or
    (entity_type = 'project' and exists (
      select 1 from public.project_members pm
      join public.group_members gm on gm.group_id = (
        select group_id from public.projects where id = finance_budgets.entity_id
      ) and gm.user_id = auth.uid() and gm.role = 'leader'
      where pm.project_id = finance_budgets.entity_id
        and pm.user_id = auth.uid()
    ))
  );

-- 삭제 정책: 수정 정책과 동일
create policy "finance_budgets_delete" on public.finance_budgets
  for delete
  using (
    (entity_type = 'group' and (
      exists (
        select 1 from public.group_members gm
        where gm.group_id = finance_budgets.entity_id
          and gm.user_id = auth.uid()
          and gm.role = 'leader'
      )
      or exists (
        select 1 from public.entity_permissions ep
        where ep.entity_type = 'group'
          and ep.entity_id = finance_budgets.entity_id
          and ep.user_id = auth.uid()
          and ep.permission = 'finance_manage'
      )
    ))
    or
    (entity_type = 'project' and exists (
      select 1 from public.project_members pm
      join public.group_members gm on gm.group_id = (
        select group_id from public.projects where id = finance_budgets.entity_id
      ) and gm.user_id = auth.uid() and gm.role = 'leader'
      where pm.project_id = finance_budgets.entity_id
        and pm.user_id = auth.uid()
    ))
  );
