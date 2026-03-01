import type { Profile, Project } from "./common";

// ============================================
// Finance (회비 관리)
// ============================================

export type FinanceCategory = {
  id: string;
  group_id: string;
  project_id: string | null;
  name: string;
  sort_order: number;
  fee_rate: number;
  created_at: string;
};

export type FinanceTransaction = {
  id: string;
  group_id: string;
  project_id: string | null;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  title: string;
  description: string | null;
  transaction_date: string;
  created_by: string | null;
  paid_by: string | null;
  created_at: string;
};

export type FinanceTransactionWithDetails = FinanceTransaction & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  paid_by_profile: Pick<Profile, "id" | "name" | "avatar_url"> | null;
  finance_categories: Pick<FinanceCategory, "id" | "name"> | null;
  projects?: Pick<Project, "id" | "name"> | null;
};

export type FinanceRole = "manager" | "viewer" | null;

export type FinanceBudget = {
  id: string;
  entity_type: "group" | "project";
  entity_id: string;
  year_month: string;
  budget_income: number;
  budget_expense: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// Finance Split (분할 정산 AA)
// ============================================

export type FinanceSplit = {
  id: string;
  group_id: string;
  project_id: string | null;
  title: string;
  total_amount: number;
  paid_by: string;
  split_type: "equal" | "custom";
  created_at: string;
  settled_at: string | null;
};

export type FinanceSplitMember = {
  id: string;
  split_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
};

// ============================================
// Receipt Share Token (영수증 공유 링크)
// ============================================

export type ReceiptShareToken = {
  id: string;
  transaction_id: string;
  token: string;
  expires_at: string;
  created_by: string;
  created_at: string;
};

// ============================================
// Finance Goal (회비 목표, localStorage 기반)
// ============================================

export type FinanceGoal = {
  id: string;
  title: string;
  targetAmount: number;
  deadline: string | null;
  isAchieved: boolean;
  createdAt: string;
};

// ============================================
// Split Preset (회비 분담 비율 프리셋, localStorage 기반)
// ============================================

export type SplitRuleType = "equal" | "by_role" | "by_attendance" | "custom_ratio";

export type SplitPreset = {
  id: string;
  name: string;
  ruleType: SplitRuleType;
  config: {
    roleRatios?: Record<string, number>;
    attendanceThresholds?: Array<{ minRate: number; ratio: number }>;
    customRatios?: Record<string, number>;
  };
  createdAt: string;
};

export const SPLIT_RULE_TYPE_LABELS: Record<SplitRuleType, string> = {
  equal: "균등 분배",
  by_role: "역할별",
  by_attendance: "출석률별",
  custom_ratio: "수동 비율",
};

// ============================================
// Finance Forecast (재정 건강도 예측)
// ============================================

export type FinanceHealthLevel = "안정" | "주의" | "위험";

export type FinanceMonthlyData = {
  month: string;
  label: string;
  income: number;
  expense: number;
  netProfit: number;
  isForecast: boolean;
};

export type FinanceForecastResult = {
  monthly: FinanceMonthlyData[];
  healthLevel: FinanceHealthLevel;
  healthMessage: string;
  forecastAvgNetProfit: number;
  hasData: boolean;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// Budget Spending Tracker (예산 지출 추적)
// ============================================

export type BudgetAlertLevel = "safe" | "caution" | "warning" | "exceeded";

export type MonthlyBudgetStatus = {
  month: string;
  budget: number;
  spent: number;
  spentRate: number;
  alertLevel: BudgetAlertLevel;
};

export type BudgetSpendingResult = {
  currentMonth: MonthlyBudgetStatus;
  recentMonths: MonthlyBudgetStatus[];
  hasBudget: boolean;
};

// ============================================
// Finance Overview Dashboard (재정 개요 대시보드)
// ============================================

export type MonthlyFinanceSummary = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type CategoryExpense = {
  category: string;
  amount: number;
  percentage: number;
};

export type FinanceOverviewData = {
  monthlySummaries: MonthlyFinanceSummary[];
  categoryBreakdown: CategoryExpense[];
  totalIncome: number;
  totalExpense: number;
  period: string;
};

// ============================================
// Analytics Export (그룹 통계 내보내기)
// ============================================

export type ExportPeriodPreset = "this_month" | "last_month" | "last_3_months" | "all";

export type ExportDateRange = {
  startDate: string | null;
  endDate: string | null;
};

export type ExportDataType = "attendance" | "board" | "finance";

export type AttendanceExportRow = {
  date: string;
  scheduleTitle: string;
  memberName: string;
  status: string;
};

export type BoardActivityExportRow = {
  date: string;
  title: string;
  authorName: string;
  commentCount: number;
};

export type FinanceExportRow = {
  date: string;
  type: string;
  amount: number;
  title: string;
  description: string;
};

// ============================================
// Schedule Expense (일정별 비용 정산, localStorage 기반)
// ============================================

export type ScheduleExpense = {
  id: string;
  scheduleId: string;
  title: string;
  amount: number;
  paidBy: string;
  category: string;
  createdAt: string;
};

// ============================================
// Expense Splitter (경비 분할 계산기)
// ============================================

export type ExpenseSplitItem = {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  createdAt: string;
};

export type ExpenseSplitSession = {
  id: string;
  title: string;
  items: ExpenseSplitItem[];
  createdAt: string;
};

// ============================================
// Performance Revenue Split (공연 수익 분배)
// ============================================

export type RevenueSplitMethod = "equal" | "weighted";

export type RevenueParticipant = {
  memberId: string;
  memberName: string;
  weight: number;
  amount: number;
  paid: boolean;
};

export type RevenueEntry = {
  id: string;
  eventName: string;
  eventDate: string;
  totalAmount: number;
  splitMethod: RevenueSplitMethod;
  participants: RevenueParticipant[];
  deductions: number;
  note: string;
  settled: boolean;
  createdAt: string;
};

// ============================================
// Budget Scenario Planner (예산 시나리오)
// ============================================

export type BudgetScenario = {
  id: string;
  name: string;
  monthlyFee: number;
  memberCount: number;
  venueRentPerMonth: number;
  performanceCount: number;
  avgPerformanceIncome: number;
  otherExpenses: number;
  otherIncome: number;
  createdAt: string;
};

export type ScenarioResult = {
  scenarioId: string;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyProfit: number;
  annualProfit: number;
};

// ============================================
// Fundraising Goal (기금 모금 추적)
// ============================================

export type FundraisingContribution = {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  note: string;
};

export type FundraisingMilestone = {
  percent: number;
  reachedAt?: string;
};

export type FundraisingGoal = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  contributions: FundraisingContribution[];
  milestones: FundraisingMilestone[];
  status: "active" | "completed" | "cancelled";
  createdAt: string;
};

// ============================================
// Budget Planner (그룹 예산 플래너)
// ============================================

export type BudgetPlannerCategory =
  | "costume"
  | "venue"
  | "equipment"
  | "food"
  | "transportation"
  | "promotion"
  | "education"
  | "other";

export type BudgetPlannerItem = {
  id: string;
  category: BudgetPlannerCategory;
  label: string;
  plannedAmount: number;
  actualAmount: number;
  note?: string;
  period: string;
};

export type BudgetPlannerPlan = {
  id: string;
  title: string;
  year: number;
  items: BudgetPlannerItem[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Settlement (정산 요청)
// ============================================

export type PaymentMethodType = "bank" | "toss" | "kakao";

export type GroupPaymentMethod = {
  id: string;
  group_id: string;
  type: PaymentMethodType;
  label: string;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  toss_id: string | null;
  kakao_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
};

export type SettlementStatus = "active" | "closed";

export type SettlementMemberStatus = "pending" | "paid_pending" | "confirmed";

export type SettlementRequest = {
  id: string;
  group_id: string;
  title: string;
  memo: string | null;
  amount: number;
  due_date: string | null;
  payment_method_id: string | null;
  status: SettlementStatus;
  created_by: string;
  created_at: string;
};

export type SettlementRequestMember = {
  id: string;
  request_id: string;
  user_id: string;
  status: SettlementMemberStatus;
  paid_at: string | null;
  confirmed_at: string | null;
};
