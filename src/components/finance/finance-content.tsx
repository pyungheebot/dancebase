"use client";

import { useState, useMemo, Suspense } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/hooks/use-auth";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useQueryParams } from "@/hooks/use-query-params";
import { createClient } from "@/lib/supabase/client";
import { FinanceTransactionForm } from "@/components/groups/finance-transaction-form";
import { FinanceCategoryManager } from "@/components/groups/finance-category-manager";
import { FinancePermissionManager } from "@/components/groups/finance-permission-manager";
import { FinanceStats } from "@/components/groups/finance-stats";
import { lazyLoad } from "@/lib/dynamic-import";

// 무거운 탭 컴포넌트 (16~32KB) - dynamic import로 초기 번들 분리
const FinancePaymentStatus    = lazyLoad(() => import("@/components/finance/finance-payment-status").then(m => ({ default: m.FinancePaymentStatus })), { skeletonHeight: "h-32" });
const FinanceBudgetTab        = lazyLoad(() => import("@/components/finance/finance-budget-tab").then(m => ({ default: m.FinanceBudgetTab })), { skeletonHeight: "h-48" });
const PaymentReminderSection  = lazyLoad(() => import("@/components/finance/payment-reminder-section").then(m => ({ default: m.PaymentReminderSection })), { skeletonHeight: "h-24" });
const FinanceReminderSettings = lazyLoad(() => import("@/components/finance/finance-reminder-settings").then(m => ({ default: m.FinanceReminderSettings })), { skeletonHeight: "h-24" });
const FinanceSplitSection     = lazyLoad(() => import("@/components/finance/finance-split-section").then(m => ({ default: m.FinanceSplitSection })), { skeletonHeight: "h-48" });
const ProjectCostAnalytics    = lazyLoad(() => import("@/components/finance/project-cost-analytics").then(m => ({ default: m.ProjectCostAnalytics })), { skeletonHeight: "h-32" });
const ExpenseTemplateManager  = lazyLoad(() => import("@/components/finance/expense-template-manager").then(m => ({ default: m.ExpenseTemplateManager })), { skeletonHeight: "h-32" });
const CreateSettlementDialog  = lazyLoad(() => import("@/components/finance/create-settlement-dialog").then(m => ({ default: m.CreateSettlementDialog })), { noLoading: true });
const SettlementRequestDashboard = lazyLoad(() => import("@/components/finance/settlement-request-dashboard").then(m => ({ default: m.SettlementRequestDashboard })), { skeletonHeight: "h-32" });
const MySettlementRequests    = lazyLoad(() => import("@/components/finance/my-settlement-requests").then(m => ({ default: m.MySettlementRequests })), { skeletonHeight: "h-32" });
const FinanceGoalCard         = lazyLoad(() => import("@/components/finance/finance-goal-card").then(m => ({ default: m.FinanceGoalCard })), { skeletonHeight: "h-32" });
const BudgetScenarioCard      = lazyLoad(() => import("@/components/finance/budget-scenario-card").then(m => ({ default: m.BudgetScenarioCard })), { skeletonHeight: "h-32" });

import { IndependentToggle } from "@/components/shared/independent-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FinanceFilters } from "@/components/finance/finance-filters";
import { FinanceTransactionList } from "@/components/finance/finance-transaction-list";
import { exportToCsv } from "@/lib/export/csv-exporter";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { format } from "date-fns";
import { useEntitySettings } from "@/hooks/use-entity-settings";
import type { EntityContext } from "@/types/entity-context";
import type {
  FinanceRole,
  FinanceTransaction,
  FinanceTransactionWithDetails,
  FinanceCategory,
  GroupMemberWithProfile,
  FinanceDueDateSettingValue,
} from "@/types";
import {
  FINANCE_DUE_DATE_SETTING_KEY,
  DEFAULT_FINANCE_DUE_DATE_SETTING,
} from "@/types";

type FinanceContentProps = {
  ctx: EntityContext;
  financeRole: FinanceRole | null;
  transactions: FinanceTransactionWithDetails[];
  categories: FinanceCategory[];
  stats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    byCategory: Array<{
      category: FinanceCategory;
      income: number;
      expense: number;
    }>;
  };
  refetch: () => void;
  // 그룹 전용 (features.financePermissionManager)
  groupMembers?: GroupMemberWithProfile[];
};

// 최근 N개월 옵션 생성
function buildMonthOptions(transactions: FinanceTransactionWithDetails[]) {
  const monthSet = new Set<string>();
  transactions.forEach((txn) => {
    if (txn.transaction_date) {
      monthSet.add(txn.transaction_date.slice(0, 7)); // "YYYY-MM"
    }
  });

  // 없으면 현재 월 포함
  const now = format(new Date(), "yyyy-MM");
  monthSet.add(now);

  // 내림차순 정렬
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
}

export function FinanceContent(props: FinanceContentProps) {
  return (
    <Suspense fallback={null}>
      <FinanceContentInner {...props} />
    </Suspense>
  );
}

function FinanceContentInner({
  ctx,
  financeRole,
  transactions,
  categories,
  stats,
  refetch,
  groupMembers,
}: FinanceContentProps) {
  const supabase = createClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";

  // 스크롤 위치 복원
  useScrollRestore();

  const [editingTxn, setEditingTxn] = useState<FinanceTransaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 납부 기한 설정 훅 (entity_settings 재사용)
  const entityType = ctx.projectId ? "project" : "group";
  const entityId = ctx.projectId ?? ctx.groupId;
  const {
    value: dueDateSetting,
    save: saveDueDate,
  } = useEntitySettings<FinanceDueDateSettingValue>(
    { entityType, entityId, key: FINANCE_DUE_DATE_SETTING_KEY },
    DEFAULT_FINANCE_DUE_DATE_SETTING
  );

  // 납부 기한 변경 핸들러
  const handleDueDateChange = async (dayStr: string) => {
    const day = parseInt(dayStr, 10);
    const { error } = await saveDueDate({ day });
    if (error) {
      toast.error(TOAST.FINANCE.DEADLINE_SAVE_ERROR);
    } else {
      toast.success(
        day === 0 ? "납부 기한이 해제되었습니다" : `납부 기한이 매월 ${day}일로 설정되었습니다`
      );
    }
  };

  // 월 필터: 기본값은 현재 월
  const currentMonth = format(new Date(), "yyyy-MM");

  // URL 쿼리 파라미터 동기화 (탭, 월 필터, 거래 유형 필터)
  const [queryParams, setQueryParams] = useQueryParams({
    tab: "transactions",
    month: currentMonth,
    type: "all",
  });
  const activeTab = queryParams.tab;
  const selectedMonth = queryParams.month;
  const typeFilter = queryParams.type as "all" | "income" | "expense";

  const setActiveTab = (v: string) => setQueryParams({ tab: v });
  const setSelectedMonth = (v: string) => setQueryParams({ month: v });
  const setTypeFilter = (v: "all" | "income" | "expense") => setQueryParams({ type: v });

  // 텍스트 검색 (URL에 저장하지 않음 — 일시적 필터)
  const [searchQuery, setSearchQuery] = useState<string>("");
  // 300ms 디바운싱 — 실제 필터링에만 사용 (입력 반응은 searchQuery로 즉시)
  const debouncedQuery = useDebounce(searchQuery, 300);

  const isManager = financeRole === "manager";
  const canManage = isManager || ctx.permissions.canEdit;

  // 월 옵션 목록
  const monthOptions = useMemo(() => buildMonthOptions(transactions), [transactions]);

  // 월 필터 적용
  const monthFilteredTransactions = useMemo(() => {
    if (selectedMonth === "all") return transactions;
    return transactions.filter((txn) =>
      txn.transaction_date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // 거래 유형 + 검색 필터 조합 적용
  const filteredTransactions = useMemo(() => {
    let result = monthFilteredTransactions;

    // 유형 필터
    if (typeFilter !== "all") {
      result = result.filter((txn) => txn.type === typeFilter);
    }

    // 텍스트 검색 (제목 대상) — 300ms 디바운싱된 값 사용
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (trimmed) {
      result = result.filter((txn) =>
        txn.title.toLowerCase().includes(trimmed)
      );
    }

    return result;
  }, [monthFilteredTransactions, typeFilter, debouncedQuery]);

  // 선택된 월의 수입/지출/잔액 계산 (유형 필터/검색 적용 전 기준)
  const monthlyStats = useMemo(() => {
    const totalIncome = monthFilteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthFilteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const byCategory = categories.map((cat) => {
      const catTxns = monthFilteredTransactions.filter((t) => t.category_id === cat.id);
      const income = catTxns
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = catTxns
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { category: cat, income, expense };
    });

    const uncategorized = monthFilteredTransactions.filter((t) => !t.category_id);
    if (uncategorized.length > 0) {
      byCategory.push({
        category: {
          id: "",
          group_id: ctx.groupId,
          project_id: null,
          name: "미분류",
          sort_order: 999,
          fee_rate: 0,
          created_at: "",
        },
        income: uncategorized
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0),
        expense: uncategorized
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
      });
    }

    return { totalIncome, totalExpense, balance, byCategory };
  }, [monthFilteredTransactions, categories, ctx.groupId]);

  // 폼에 전달할 멤버 옵션 (GroupMemberWithProfile → { id, name })
  const memberOptions = useMemo(() => {
    if (!groupMembers) return undefined;
    return groupMembers.map((m) => ({
      id: m.user_id,
      name: ctx.nicknameMap[m.user_id] || m.profiles.name,
    }));
  }, [groupMembers, ctx.nicknameMap]);

  const handleDownloadCsv = () => {
    const label = selectedMonth === "all" ? "전체" : selectedMonth;
    const filename = `회비내역_${label}.csv`;

    const headers = ["날짜", "유형", "카테고리", "금액", "설명", "납부자"];
    const rows = filteredTransactions.map((txn) => {
      const typeLabel = txn.type === "income" ? "수입" : "지출";
      const category = txn.finance_categories?.name ?? "";
      const payer = txn.paid_by_profile
        ? ctx.nicknameMap[txn.paid_by_profile.id] || txn.paid_by_profile.name
        : txn.profiles
        ? ctx.nicknameMap[txn.created_by ?? ""] || txn.profiles.name
        : "";
      return [
        txn.transaction_date ?? "",
        typeLabel,
        category,
        String(txn.amount),
        txn.title,
        payer,
      ];
    });

    exportToCsv(filename, headers, rows);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", deleteTargetId);
    if (error) {
      toast.error(TOAST.FINANCE.TRANSACTION_DELETE_ERROR);
    } else {
      toast.success(TOAST.FINANCE.TRANSACTION_DELETED);
      refetch();
    }
    setDeleteTargetId(null);
  };

  return (
    <>
      <IndependentToggle ctx={ctx} feature="finance" featureLabel="회비" />

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium">회비 관리</h2>
        {isManager && (
          <div className="flex gap-1">
            <ExpenseTemplateManager
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
            />
            <FinanceCategoryManager
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              onSuccess={refetch}
            />
            {ctx.features.financePermissionManager &&
              ctx.permissions.canEdit &&
              groupMembers && (
                <FinancePermissionManager
                  groupId={ctx.groupId}
                  members={groupMembers}
                  onSuccess={refetch}
                />
              )}
            <FinanceTransactionForm
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              members={memberOptions}
              onSuccess={refetch}
            />
          </div>
        )}
        {!isManager && canManage && (
          <div className="flex gap-1.5">
            <ExpenseTemplateManager
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
            />
            <FinanceCategoryManager
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              onSuccess={refetch}
            />
            <FinanceTransactionForm
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              categories={categories}
              members={memberOptions}
              onSuccess={refetch}
            />
          </div>
        )}
      </div>

      {/* 전체 통계 (항상 전체 기준) */}
      <FinanceStats
        totalIncome={stats.totalIncome}
        totalExpense={stats.totalExpense}
        balance={stats.balance}
        byCategory={stats.byCategory}
      />

      {/* 수입 목표 트래커 */}
      <FinanceGoalCard
        groupId={ctx.groupId}
        projectId={ctx.projectId}
        canManage={canManage}
      />

      {/* 예산 시나리오 플래너 */}
      <BudgetScenarioCard groupId={ctx.groupId} />

      {/* 거래 내역 / 납부 현황 / 예산 / 분할 정산 / 비용 분석 탭 */}
      <div className="mt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-7 mb-3 flex-wrap">
            {/* 마우스 호버 시 인접 탭 컴포넌트 프리로드 */}
            <TabsTrigger
              value="transactions"
              className="flex-1 text-xs"
              onMouseEnter={() => {
                import("@/components/finance/finance-payment-status");
                import("@/components/finance/unpaid-summary");
              }}
            >
              거래 내역
            </TabsTrigger>
            <TabsTrigger
              value="payment-status"
              className="flex-1 text-xs"
              onMouseEnter={() => {
                import("@/components/finance/finance-payment-status");
                import("@/components/finance/payment-reminder-section");
                import("@/components/finance/finance-reminder-settings");
                import("@/components/finance/finance-budget-tab");
              }}
            >
              납부 현황
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              className="flex-1 text-xs"
              onMouseEnter={() => {
                import("@/components/finance/finance-budget-tab");
                import("@/components/finance/finance-split-section");
              }}
            >
              예산
            </TabsTrigger>
            <TabsTrigger
              value="split"
              className="flex-1 text-xs"
              onMouseEnter={() => {
                import("@/components/finance/finance-split-section");
                import("@/components/finance/settlement-request-dashboard");
                import("@/components/finance/my-settlement-requests");
              }}
            >
              분할 정산
            </TabsTrigger>
            <TabsTrigger
              value="settlement"
              className="flex-1 text-xs"
              onMouseEnter={() => {
                import("@/components/finance/settlement-request-dashboard");
                import("@/components/finance/my-settlement-requests");
                import("@/components/finance/create-settlement-dialog");
                if (ctx.projectId) import("@/components/finance/project-cost-analytics");
              }}
            >
              정산 요청
            </TabsTrigger>
            {ctx.projectId && (
              <TabsTrigger
                value="cost-analytics"
                className="flex-1 text-xs"
                onMouseEnter={() => {
                  import("@/components/finance/project-cost-analytics");
                }}
              >
                비용 분석
              </TabsTrigger>
            )}
          </TabsList>

          {/* 거래 내역 탭 */}
          <TabsContent value="transactions" className="mt-0 space-y-2">
            <FinanceFilters
              selectedMonth={selectedMonth}
              monthOptions={monthOptions}
              onMonthChange={setSelectedMonth}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              canManage={canManage}
              dueDateSetting={dueDateSetting}
              onDueDateChange={handleDueDateChange}
              filteredTransactions={filteredTransactions}
              groupName={ctx.header.name}
              nicknameMap={ctx.nicknameMap}
              onDownloadCsv={handleDownloadCsv}
            />

            <FinanceTransactionList
              filteredTransactions={filteredTransactions}
              allTransactions={transactions}
              selectedMonth={selectedMonth}
              typeFilter={typeFilter}
              searchQuery={debouncedQuery}
              monthlyStats={monthlyStats}
              canManage={canManage}
              onEdit={setEditingTxn}
              onDelete={setDeleteTargetId}
              nicknameMap={ctx.nicknameMap}
              members={ctx.members}
              groupId={ctx.groupId}
              groupName={ctx.header.name}
              canManageFinance={ctx.permissions.canManageFinance}
            />
          </TabsContent>

          {/* 납부 현황 탭 */}
          <TabsContent value="payment-status" className="mt-0">
            <FinancePaymentStatus
              transactions={transactions}
              members={ctx.members}
              nicknameMap={ctx.nicknameMap}
            />

            {/* 독촉 알림 발송 + 자동 상기 설정 (canEdit 권한자에게만 표시) */}
            {ctx.permissions.canEdit && (
              <div className="mt-4 space-y-3">
                <PaymentReminderSection
                  groupId={ctx.groupId}
                  projectId={ctx.projectId}
                  groupName={ctx.header.name}
                />
                <FinanceReminderSettings
                  entityType={entityType}
                  entityId={entityId}
                  groupId={ctx.groupId}
                  groupName={ctx.header.name}
                  projectId={ctx.projectId}
                />
              </div>
            )}
          </TabsContent>

          {/* 예산 탭 */}
          <TabsContent value="budget" className="mt-0">
            <FinanceBudgetTab
              ctx={ctx}
              canManage={canManage}
              transactions={transactions}
            />
          </TabsContent>

          {/* 분할 정산 탭 */}
          <TabsContent value="split" className="mt-0">
            <FinanceSplitSection
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              groupMembers={groupMembers ?? ctx.raw.groupMembers}
              nicknameMap={ctx.nicknameMap}
              canManage={canManage}
              currentUserId={currentUserId}
            />
          </TabsContent>

          {/* 정산 요청 탭 */}
          <TabsContent value="settlement" className="mt-0">
            {canManage ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">정산 요청 현황</h3>
                  {groupMembers && (
                    <CreateSettlementDialog
                      groupId={ctx.groupId}
                      groupMembers={groupMembers}
                      nicknameMap={ctx.nicknameMap}
                      currentUserId={currentUserId}
                    />
                  )}
                </div>
                <SettlementRequestDashboard
                  groupId={ctx.groupId}
                  nicknameMap={ctx.nicknameMap}
                />
              </div>
            ) : (
              <MySettlementRequests groupId={ctx.groupId} />
            )}
          </TabsContent>

          {/* 비용 분석 탭 (프로젝트 컨텍스트에서만) */}
          {ctx.projectId && (
            <TabsContent value="cost-analytics" className="mt-0">
              <ProjectCostAnalytics
                groupId={ctx.groupId}
                projectId={ctx.projectId}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* 거래 수정 폼 */}
      {editingTxn && (
        <FinanceTransactionForm
          mode="edit"
          groupId={ctx.groupId}
          projectId={ctx.projectId}
          categories={categories}
          members={memberOptions}
          initialData={editingTxn}
          open={!!editingTxn}
          onOpenChange={(open) => {
            if (!open) setEditingTxn(null);
          }}
          onSuccess={() => {
            setEditingTxn(null);
            refetch();
          }}
        />
      )}

      {/* 거래 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="거래 삭제"
        description="이 거래를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        onConfirm={handleDeleteConfirm}
        destructive
      />
    </>
  );
}
