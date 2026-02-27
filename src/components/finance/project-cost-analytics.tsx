"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProjectCostAnalytics } from "@/hooks/use-project-cost-analytics";

interface ProjectCostAnalyticsProps {
  groupId: string;
  projectId: string;
}

function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

export function ProjectCostAnalytics({ groupId, projectId }: ProjectCostAnalyticsProps) {
  const { analytics, loading } = useProjectCostAnalytics(groupId, projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  const { categoryAnalytics, monthlyAnalytics, totalIncome, totalExpense, balance } = analytics;

  // 카테고리 바 차트용 최대값
  const categoryMax = Math.max(
    ...categoryAnalytics.flatMap((c) => [c.income, c.expense]),
    1
  );

  // 월별 바 차트용 최대값
  const monthlyMax = Math.max(
    ...monthlyAnalytics.flatMap((m) => [m.income, m.expense]),
    1
  );

  const hasData = categoryAnalytics.length > 0 || monthlyAnalytics.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs text-muted-foreground">분석할 거래 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border bg-card">
          <CardContent className="px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">총 수입</p>
            <p className="text-sm font-semibold text-green-600 tabular-nums">
              +{formatKRW(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="border bg-card">
          <CardContent className="px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">총 지출</p>
            <p className="text-sm font-semibold text-red-600 tabular-nums">
              -{formatKRW(totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card className="border bg-card">
          <CardContent className="px-3 py-2 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">잔액</p>
            <p
              className={`text-sm font-semibold tabular-nums ${
                balance >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {formatKRW(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 분석 */}
      {categoryAnalytics.length > 0 && (
        <Card>
          <CardContent className="px-3 py-3">
            <h3 className="text-xs font-medium mb-3">카테고리별 분석</h3>
            <div className="space-y-3">
              {categoryAnalytics.map((cat) => (
                <div key={cat.categoryName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate max-w-[50%]">
                      {cat.categoryName}
                    </span>
                    <span
                      className={`text-[11px] font-semibold tabular-nums shrink-0 ${
                        cat.net >= 0 ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {cat.net >= 0 ? "+" : ""}
                      {formatKRW(cat.net)}
                    </span>
                  </div>

                  {/* 수입 바 */}
                  {cat.income > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-600 w-6 shrink-0">수입</span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <div
                          className="h-2.5 rounded-full bg-green-500 transition-all"
                          style={{
                            width: `${Math.max((cat.income / categoryMax) * 100, 2)}%`,
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                          {formatKRW(cat.income)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 지출 바 */}
                  {cat.expense > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-red-600 w-6 shrink-0">지출</span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <div
                          className="h-2.5 rounded-full bg-red-500 transition-all"
                          style={{
                            width: `${Math.max((cat.expense / categoryMax) * 100, 2)}%`,
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                          {formatKRW(cat.expense)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월별 추이 */}
      {monthlyAnalytics.length > 0 && (
        <Card>
          <CardContent className="px-3 py-3">
            <h3 className="text-xs font-medium mb-3">월별 추이 (최근 6개월)</h3>
            <div className="space-y-3">
              {monthlyAnalytics.map((month) => (
                <div key={month.month} className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">
                    {formatMonthLabel(month.month)}
                  </span>

                  {/* 수입 바 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-green-600 w-6 shrink-0">수입</span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{
                            width: `${Math.max((month.income / monthlyMax) * 100, month.income > 0 ? 2 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-20 text-right shrink-0">
                        {formatKRW(month.income)}
                      </span>
                    </div>
                  </div>

                  {/* 지출 바 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-600 w-6 shrink-0">지출</span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{
                            width: `${Math.max((month.expense / monthlyMax) * 100, month.expense > 0 ? 2 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-20 text-right shrink-0">
                        {formatKRW(month.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
