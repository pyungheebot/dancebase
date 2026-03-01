// 회비, 재정, 예산, 정산 관련 키
export const financeKeys = {
  // 회비
  finance: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/finance${projectId ? `?project=${projectId}` : ""}` as const,
  unpaidMembers: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/unpaid-members${projectId ? `?project=${projectId}` : ""}` as const,

  // 예산
  financeBudget: (entityType: string, entityId: string, yearMonth: string) =>
    `/finance-budget/${entityType}/${entityId}/${yearMonth}` as const,
  budgetSpendingTracker: (groupId: string) =>
    `/groups/${groupId}/budget-spending-tracker` as const,
  budgetScenario: (groupId: string) => `budget-scenario-${groupId}` as const,

  // 분할 정산
  financeSplits: (groupId: string, projectId?: string | null) =>
    `/groups/${groupId}/finance-splits${projectId ? `?project=${projectId}` : ""}` as const,
  financeSplitMembers: (splitId: string) =>
    `/finance-splits/${splitId}/members` as const,

  // 재정 분석
  projectCostAnalytics: (groupId: string, projectId: string) =>
    `/groups/${groupId}/projects/${projectId}/cost-analytics` as const,
  financeForecast: (groupId: string) =>
    `/groups/${groupId}/finance-forecast` as const,
  financeOverviewMetrics: (groupId: string) =>
    `/groups/${groupId}/finance-overview` as const,

  // 영수증
  receiptShareTokens: (transactionId: string) =>
    `/receipt-share-tokens/${transactionId}` as const,
  receiptManagement: (groupId: string) => `receipt-management-${groupId}` as const,

  // 공연 수익
  performanceRevenue: (groupId: string) => `performance-revenue-${groupId}` as const,

  // 정산 수단 / 요청
  paymentMethods: (groupId: string) => `/groups/${groupId}/payment-methods` as const,
  settlementRequests: (groupId: string) =>
    `/groups/${groupId}/settlement-requests` as const,

  // 대시보드용
  upcomingPayments: () => "/upcoming-payments" as const,
};
