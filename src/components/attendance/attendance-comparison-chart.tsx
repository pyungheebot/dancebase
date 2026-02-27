"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Users2, TrendingUp, Award } from "lucide-react";
import { useAttendanceComparison } from "@/hooks/use-attendance-comparison";
import type { EntityContext } from "@/types/entity-context";

// 멤버별 고유 색상 (최대 5명)
const MEMBER_COLORS = [
  {
    id: "blue",
    bar: "bg-blue-500",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-300",
  },
  {
    id: "green",
    bar: "bg-green-500",
    text: "text-green-600",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    border: "border-green-300",
  },
  {
    id: "orange",
    bar: "bg-orange-500",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    border: "border-orange-300",
  },
  {
    id: "purple",
    bar: "bg-purple-500",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-300",
  },
  {
    id: "pink",
    bar: "bg-pink-500",
    text: "text-pink-600",
    badge: "bg-pink-100 text-pink-700",
    dot: "bg-pink-500",
    border: "border-pink-300",
  },
] as const;

const MAX_SELECT = 5;

// Y축 눈금 (0, 25, 50, 75, 100)
const Y_TICKS = [100, 75, 50, 25, 0];

type AttendanceComparisonChartProps = {
  ctx: EntityContext;
};

export function AttendanceComparisonChart({ ctx }: AttendanceComparisonChartProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // memberMap: userId -> 표시 이름
  const memberMap = useMemo<Record<string, string>>(() => {
    return Object.fromEntries(
      ctx.members.map((m) => [m.userId, m.nickname || m.profile.name])
    );
  }, [ctx.members]);

  const { data, loading } = useAttendanceComparison(
    ctx.groupId,
    selectedUserIds,
    memberMap,
    ctx.projectId
  );

  // 멤버 선택 토글
  const handleToggle = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, userId];
    });
  };

  // 선택 순서 기준으로 색상 할당
  const colorMap = useMemo<Record<string, (typeof MEMBER_COLORS)[number]>>(() => {
    return Object.fromEntries(
      selectedUserIds.map((id, idx) => [id, MEMBER_COLORS[idx % MEMBER_COLORS.length]])
    );
  }, [selectedUserIds]);

  // 인사이트 계산
  const insights = useMemo(() => {
    if (data.length === 0) return null;

    // 가장 꾸준한 멤버: 평균 출석률 최고
    const steadiest = [...data].sort((a, b) => b.avgRate - a.avgRate)[0];

    // 향상된 멤버: 최근 2개월 평균 - 이전 4개월 평균이 가장 큰 멤버
    const improved = [...data]
      .map((m) => {
        const withData = m.monthlyRates.filter((r) => r.totalSchedules > 0);
        if (withData.length < 2) return { ...m, diff: 0 };
        const recent = withData.slice(-2);
        const older = withData.slice(0, -2);
        const recentAvg =
          recent.reduce((s, r) => s + r.rate, 0) / recent.length;
        const olderAvg =
          older.length > 0
            ? older.reduce((s, r) => s + r.rate, 0) / older.length
            : recentAvg;
        return { ...m, diff: Math.round(recentAvg - olderAvg) };
      })
      .sort((a, b) => b.diff - a.diff)[0];

    return { steadiest, improved };
  }, [data]);

  // 차트에 표시할 월 목록 (첫 번째 멤버에서 추출, 없으면 빈 배열)
  const months = data[0]?.monthlyRates ?? [];

  // 각 월에서의 멤버별 바 배치
  // 바 너비 = 그룹당 전체 너비를 멤버 수로 나눔 (CSS flex 사용)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          멤버 출석률 비교
          <span className="text-xs font-normal text-muted-foreground">(최근 6개월)</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ===== 멤버 선택 ===== */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            비교할 멤버를 선택하세요 (최대 {MAX_SELECT}명)
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ctx.members.map((member) => {
              const id = member.userId;
              const name = member.nickname || member.profile.name;
              const isSelected = selectedUserIds.includes(id);
              const isDisabled = !isSelected && selectedUserIds.length >= MAX_SELECT;
              const color = isSelected ? colorMap[id] : null;

              return (
                <div key={id} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`cmp-member-${id}`}
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => handleToggle(id)}
                    className={
                      isSelected && color
                        ? `border-2 ${color.border} data-[state=checked]:bg-current`
                        : ""
                    }
                  />
                  <Label
                    htmlFor={`cmp-member-${id}`}
                    className={`text-xs cursor-pointer select-none ${
                      isDisabled ? "text-muted-foreground/50" : ""
                    } ${isSelected && color ? color.text : ""}`}
                  >
                    {isSelected && color && (
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1 ${color.dot}`}
                      />
                    )}
                    {name}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 선택 없음 안내 ===== */}
        {selectedUserIds.length === 0 && (
          <div className="py-10 text-center border rounded-md bg-muted/30">
            <Users2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              위에서 멤버를 선택하면 비교 차트가 표시됩니다
            </p>
          </div>
        )}

        {/* ===== 로딩 ===== */}
        {selectedUserIds.length > 0 && loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ===== 비교 바 차트 ===== */}
        {selectedUserIds.length > 0 && !loading && data.length > 0 && (
          <div className="space-y-4">
            {/* 차트 영역 */}
            <div className="relative">
              {/* Y축 레이블 + 차트 본체 */}
              <div className="flex gap-2">
                {/* Y축 눈금 */}
                <div className="flex flex-col justify-between w-7 shrink-0" style={{ height: 180 }}>
                  {Y_TICKS.map((tick) => (
                    <span
                      key={tick}
                      className="text-[10px] text-muted-foreground text-right leading-none"
                    >
                      {tick}
                    </span>
                  ))}
                </div>

                {/* 그리드 + 바 */}
                <div className="flex-1 relative" style={{ height: 180 }}>
                  {/* 수평 그리드선 */}
                  {Y_TICKS.map((tick) => (
                    <div
                      key={tick}
                      className="absolute left-0 right-0 border-t border-muted"
                      style={{ bottom: `${tick}%`, top: tick === 100 ? 0 : "auto" }}
                    />
                  ))}

                  {/* 월별 바 그룹 */}
                  <div className="absolute inset-0 flex items-end">
                    {months.map(({ yearMonth, month }) => {
                      const membersInMonth = data.filter(
                        (m) => m.monthlyRates.find((r) => r.yearMonth === yearMonth)
                      );
                      return (
                        <div
                          key={yearMonth}
                          className="flex-1 flex items-end justify-center gap-0.5 h-full"
                        >
                          {data.map((member) => {
                            const monthData = member.monthlyRates.find(
                              (r) => r.yearMonth === yearMonth
                            );
                            const rate = monthData?.rate ?? 0;
                            const hasData = (monthData?.totalSchedules ?? 0) > 0;
                            const color = colorMap[member.userId];
                            return (
                              <div
                                key={member.userId}
                                className="flex-1 flex items-end"
                                style={{ maxWidth: 24 }}
                                title={`${member.name} ${month}: ${hasData ? `${rate}%` : "일정 없음"}`}
                              >
                                <div
                                  className={`w-full rounded-t transition-all duration-300 ${
                                    hasData ? color.bar : "bg-muted"
                                  }`}
                                  style={{
                                    height: hasData ? `${rate}%` : "4px",
                                    minHeight: hasData ? 2 : 4,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* X축 레이블 */}
              <div className="flex gap-2 mt-1">
                <div className="w-7 shrink-0" />
                <div className="flex-1 flex">
                  {months.map(({ yearMonth, month }) => (
                    <div
                      key={yearMonth}
                      className="flex-1 text-center text-[10px] text-muted-foreground"
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Y축 단위 안내 */}
            <p className="text-[10px] text-muted-foreground text-right -mt-2">단위: %</p>

            {/* ===== 범례 + 평균 출석률 ===== */}
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">멤버별 평균 출석률</p>
              <div className="flex flex-wrap gap-3">
                {data.map((member) => {
                  const color = colorMap[member.userId];
                  return (
                    <div key={member.userId} className="flex items-center gap-1.5">
                      <span className={`inline-block w-3 h-3 rounded-sm ${color.bar}`} />
                      <span className="text-xs font-medium">{member.name}</span>
                      <span className={`text-xs font-bold tabular-nums ${color.text}`}>
                        {member.avgRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== 인사이트 ===== */}
            {insights && data.length >= 2 && (
              <div className="flex flex-wrap gap-2">
                {/* 가장 꾸준한 멤버 */}
                {insights.steadiest && insights.steadiest.avgRate > 0 && (
                  <Badge
                    className="text-[11px] px-2 py-0.5 gap-1 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-100"
                    variant="outline"
                  >
                    <Award className="h-3 w-3" />
                    가장 꾸준한 멤버: {insights.steadiest.name} ({insights.steadiest.avgRate}%)
                  </Badge>
                )}

                {/* 향상된 멤버 */}
                {insights.improved &&
                  (insights.improved as { diff: number }).diff > 0 && (
                    <Badge
                      className="text-[11px] px-2 py-0.5 gap-1 bg-green-100 text-green-800 border border-green-300 hover:bg-green-100"
                      variant="outline"
                    >
                      <TrendingUp className="h-3 w-3" />
                      향상된 멤버: {insights.improved.name} (+
                      {(insights.improved as { diff: number }).diff}%)
                    </Badge>
                  )}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              * 출석률 = (출석 + 지각) / 해당 월 일정 수 × 100. 일정이 없는 달은 회색으로 표시됩니다.
            </p>
          </div>
        )}

        {/* ===== 데이터 없음 ===== */}
        {selectedUserIds.length > 0 && !loading && data.length === 0 && (
          <div className="py-8 text-center border rounded-md">
            <p className="text-sm text-muted-foreground">출석 비교 데이터가 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
