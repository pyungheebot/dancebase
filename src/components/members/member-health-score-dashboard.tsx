"use client";

import { useState } from "react";
import {
  HeartPulse,
  AlertTriangle,
  TrendingDown,
  Shield,
  Users,
  Activity,
  MessageSquare,
  CalendarCheck,
  Zap,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberHealthScore } from "@/hooks/use-member-health-score";
import type {
  MemberHealthScoreItem,
  MemberHealthGrade,
  MemberHealthRiskType,
} from "@/types";

// -----------------------------------------------
// 건강도 등급별 색상 설정
// -----------------------------------------------
function getGradeConfig(grade: MemberHealthGrade) {
  switch (grade) {
    case "excellent":
      return {
        textColor: "text-green-600",
        bgColor: "bg-green-100",
        barColor: "bg-green-500",
        label: "우수",
        labelClass: "bg-green-100 text-green-700",
      };
    case "good":
      return {
        textColor: "text-yellow-600",
        bgColor: "bg-yellow-100",
        barColor: "bg-yellow-400",
        label: "양호",
        labelClass: "bg-yellow-100 text-yellow-700",
      };
    case "warning":
      return {
        textColor: "text-orange-600",
        bgColor: "bg-orange-100",
        barColor: "bg-orange-400",
        label: "주의",
        labelClass: "bg-orange-100 text-orange-700",
      };
    case "danger":
      return {
        textColor: "text-red-600",
        bgColor: "bg-red-100",
        barColor: "bg-red-500",
        label: "위험",
        labelClass: "bg-red-100 text-red-700",
      };
  }
}

// 점수 숫자에서 직접 등급 색상 반환 (averageScore용)
function getScoreGrade(score: number): MemberHealthGrade {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "danger";
}

// -----------------------------------------------
// 위험 신호 아이콘/레이블 설정
// -----------------------------------------------
const RISK_CONFIG: Record<
  MemberHealthRiskType,
  { icon: React.ElementType; color: string }
> = {
  attendance_drop: {
    icon: TrendingDown,
    color: "text-red-500",
  },
  inactive_14days: {
    icon: AlertTriangle,
    color: "text-orange-500",
  },
  rsvp_no_response: {
    icon: Shield,
    color: "text-yellow-500",
  },
};

// -----------------------------------------------
// 5가지 지표 메타 정보
// -----------------------------------------------
const METRIC_META = [
  { key: "attendance" as const, label: "출석", icon: CalendarCheck },
  { key: "rsvp" as const, label: "RSVP", icon: Activity },
  { key: "board" as const, label: "게시판", icon: MessageSquare },
  { key: "longevity" as const, label: "활동량", icon: Users },
  { key: "recentActivity" as const, label: "최근활동", icon: Zap },
] as const;

// -----------------------------------------------
// 아바타 컴포넌트
// -----------------------------------------------
function MemberAvatar({
  name,
  avatarUrl,
  grade,
}: {
  name: string;
  avatarUrl: string | null;
  grade: MemberHealthGrade;
}) {
  const config = getGradeConfig(grade);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={`h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs ${config.bgColor} ${config.textColor}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

// -----------------------------------------------
// 5칸 미니 바 차트 (지표 시각화)
// -----------------------------------------------
function MetricMiniBar({
  value,
  max = 20,
  label,
  Icon,
}: {
  value: number;
  max?: number;
  label: string;
  Icon: React.ElementType;
}) {
  // 0~max → 0~5칸 환산
  const filledCells = Math.round((value / max) * 5);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-2.5 w-2.5 text-muted-foreground" />
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-sm transition-colors ${
              i < filledCells ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
    </div>
  );
}

// -----------------------------------------------
// 위험 신호 배지
// -----------------------------------------------
function RiskBadges({ member }: { member: MemberHealthScoreItem }) {
  if (member.risks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {member.risks.map((risk) => {
        const config = RISK_CONFIG[risk.type];
        const Icon = config.icon;
        return (
          <span
            key={risk.type}
            className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200"
          >
            <Icon className={`h-2.5 w-2.5 ${config.color}`} />
            {risk.label}
          </span>
        );
      })}
    </div>
  );
}

// -----------------------------------------------
// 멤버 카드 (건강도 + 지표 + 위험 신호)
// -----------------------------------------------
function MemberHealthCard({ member }: { member: MemberHealthScoreItem }) {
  const config = getGradeConfig(member.grade);

  return (
    <div
      className={`px-3 py-2.5 rounded-lg border transition-colors ${
        member.risks.length > 0
          ? "border-red-200 bg-red-50/40"
          : "border-border bg-muted/20"
      }`}
    >
      {/* 상단: 아바타 + 이름 + 점수 */}
      <div className="flex items-center gap-2">
        <MemberAvatar
          name={member.name}
          avatarUrl={member.avatarUrl}
          grade={member.grade}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{member.name}</span>
            {member.risks.length > 0 && (
              <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
            )}
          </div>
          <span
            className={`inline-block text-[10px] font-medium px-1 py-0 rounded-sm ${config.labelClass}`}
          >
            {config.label}
          </span>
        </div>

        {/* 점수 */}
        <div className="text-right shrink-0">
          <span className={`text-base font-bold tabular-nums ${config.textColor}`}>
            {member.totalScore}
          </span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>

      {/* 중단: 5가지 지표 미니 바 차트 */}
      <div className="flex items-end justify-between mt-2 px-1">
        {METRIC_META.map(({ key, label, icon: Icon }) => (
          <MetricMiniBar
            key={key}
            value={member.metrics[key]}
            max={20}
            label={label}
            Icon={Icon}
          />
        ))}
      </div>

      {/* 하단: 위험 신호 배지 */}
      <RiskBadges member={member} />
    </div>
  );
}

// -----------------------------------------------
// 스켈레톤 로딩
// -----------------------------------------------
function HealthSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-3 py-2.5 rounded-lg border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-10" />
            </div>
            <Skeleton className="h-6 w-10 shrink-0" />
          </div>
          <div className="flex gap-3 px-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex flex-col items-center gap-0.5">
                <Skeleton className="h-2.5 w-2.5 rounded" />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Skeleton key={k} className="h-2 w-2 rounded-sm" />
                  ))}
                </div>
                <Skeleton className="h-2 w-6" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 전체 평균 헤더 카드
// -----------------------------------------------
function SummaryHeader({
  averageScore,
  atRiskCount,
  totalCount,
}: {
  averageScore: number;
  atRiskCount: number;
  totalCount: number;
}) {
  const grade = getScoreGrade(averageScore);
  const config = getGradeConfig(grade);

  return (
    <div className="px-4 py-3 bg-muted/30 border-b space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">전체 평균 건강도</p>
          <div className="flex items-end gap-1.5 mt-0.5">
            <span className={`text-2xl font-bold tabular-nums ${config.textColor}`}>
              {averageScore}
            </span>
            <span className="text-xs text-muted-foreground mb-0.5">/100</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-0.5 ${config.labelClass}`}
            >
              {config.label}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">전체 멤버</p>
          <p className="text-lg font-bold tabular-nums">{totalCount}명</p>
        </div>
      </div>

      {atRiskCount > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-red-50 border border-red-200">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-[11px] text-red-700 font-medium">
            위험 신호 감지: {atRiskCount}명 주의 필요
          </span>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface MemberHealthScoreDashboardProps {
  groupId: string;
}

export function MemberHealthScoreDashboard({
  groupId,
}: MemberHealthScoreDashboardProps) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useMemberHealthScore(groupId);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px] px-2"
        >
          <HeartPulse className="h-3 w-3 mr-0.5" />
          건강도
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
            멤버 건강도 대시보드
          </SheetTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            최근 30일 기준 · 5가지 지표 · 총 100점
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-4 pt-4 pb-6">
              <HealthSkeleton />
            </div>
          ) : !data.hasData ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
              <HeartPulse className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  멤버가 없습니다
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  그룹에 멤버가 가입하면 건강도를 측정할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 전체 요약 헤더 */}
              <SummaryHeader
                averageScore={data.averageScore}
                atRiskCount={data.atRiskCount}
                totalCount={data.members.length}
              />

              {/* 지표 범례 */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {METRIC_META.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-1">
                      <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">
                    각 지표 최대 20점
                  </span>
                </div>
              </div>

              {/* 멤버 카드 리스트 (건강도 낮은 순) */}
              <div className="px-4 pb-6 space-y-2">
                {data.members.map((member) => (
                  <MemberHealthCard key={member.userId} member={member} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단: 위험 신호 범례 */}
        {!loading && data.hasData && (
          <div className="px-4 py-3 border-t shrink-0 bg-muted/10">
            <p className="text-[10px] text-muted-foreground font-medium mb-1.5">
              위험 신호 유형
            </p>
            <div className="flex flex-col gap-1">
              {(
                [
                  { type: "attendance_drop" as const, desc: "출석률 30% 이상 급락" },
                  { type: "inactive_14days" as const, desc: "14일 이상 미활동" },
                  { type: "rsvp_no_response" as const, desc: "RSVP 최근 무응답" },
                ] as const
              ).map(({ type, desc }) => {
                const config = RISK_CONFIG[type];
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <Icon className={`h-3 w-3 ${config.color}`} />
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
