"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  Activity,
  Users,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAnomalyDetection } from "@/hooks/use-anomaly-detection";
import type { ActivityAnomaly, AnomalyLevel, AnomalyMetricType } from "@/types/index";

// -----------------------------------------------
// 유틸: 레벨별 색상 클래스
// -----------------------------------------------

const LEVEL_STYLE: Record<
  AnomalyLevel,
  { badge: string; border: string; bg: string; icon: string }
> = {
  info: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    icon: "text-blue-500",
  },
  warning: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    border: "border-yellow-200",
    bg: "bg-yellow-50/60",
    icon: "text-yellow-500",
  },
  critical: {
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-red-200",
    bg: "bg-red-50/60",
    icon: "text-red-500",
  },
};

const LEVEL_LABEL: Record<AnomalyLevel, string> = {
  info: "정보",
  warning: "경고",
  critical: "위험",
};

// -----------------------------------------------
// 유틸: 지표 유형별 아이콘
// -----------------------------------------------

function MetricIcon({
  metricType,
  className,
}: {
  metricType: AnomalyMetricType;
  className?: string;
}) {
  switch (metricType) {
    case "attendance":
      return <Users className={className} />;
    case "posts":
      return <FileText className={className} />;
    case "members":
      return <TrendingDown className={className} />;
    case "finance":
      return <DollarSign className={className} />;
  }
}

// -----------------------------------------------
// 서브 컴포넌트: 원형 건강 게이지 (SVG)
// -----------------------------------------------

interface HealthGaugeProps {
  score: number; // 0-100
  size?: number;
}

function HealthGauge({ score, size = 80 }: HealthGaugeProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  let strokeColor: string;
  let textColor: string;
  if (score >= 70) {
    strokeColor = "#16a34a"; // green-600
    textColor = "text-green-600";
  } else if (score >= 40) {
    strokeColor = "#ca8a04"; // yellow-600
    textColor = "text-yellow-600";
  } else {
    strokeColor = "#dc2626"; // red-600
    textColor = "text-red-600";
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* 배경 트랙 */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={6}
        />
        {/* 진행 */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-base font-bold tabular-nums leading-none ${textColor}`}>
          {score}
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5">점</span>
      </div>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 이상 징후 단일 카드
// -----------------------------------------------

function AnomalyItem({ anomaly }: { anomaly: ActivityAnomaly }) {
  const style = LEVEL_STYLE[anomaly.level];

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${style.bg} ${style.border}`}
    >
      {/* 아이콘 */}
      <MetricIcon
        metricType={anomaly.metricType}
        className={`h-4 w-4 mt-0.5 shrink-0 ${style.icon}`}
      />

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold">{anomaly.title}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border ${style.badge}`}
            variant="outline"
          >
            {LEVEL_LABEL[anomaly.level]}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          {anomaly.description}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          편차 {anomaly.deviationPercent}%
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function AnomalyDetectionSkeleton() {
  return (
    <div className="space-y-3">
      {/* 헤더 영역 */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      {/* 이상 징후 목록 */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface AnomalyDetectionCardProps {
  groupId: string;
}

export function AnomalyDetectionCard({ groupId }: AnomalyDetectionCardProps) {
  const { result, loading } = useAnomalyDetection(groupId);
  const [isOpen, setIsOpen] = useState(true);

  const hasCritical = result?.anomalies.some((a) => a.level === "critical");
  const hasWarning = result?.anomalies.some((a) => a.level === "warning");

  // 헤더 뱃지 색상
  const headerBadgeStyle = hasCritical
    ? "bg-red-100 text-red-700 border-red-200"
    : hasWarning
    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-green-100 text-green-700 border-green-200";

  const headerBadgeLabel = hasCritical
    ? "위험 감지"
    : hasWarning
    ? "경고 감지"
    : "정상";

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* 카드 헤더 */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              팀 활동 이상 탐지
            </CardTitle>
            <div className="flex items-center gap-2">
              {!loading && result && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ${headerBadgeStyle}`}
                >
                  {headerBadgeLabel}
                </Badge>
              )}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label={isOpen ? "접기" : "펼치기"}
                >
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        {/* 콘텐츠 */}
        <CollapsibleContent>
          <CardContent aria-live="polite" aria-atomic="false">
            {loading ? (
              <AnomalyDetectionSkeleton />
            ) : result ? (
              <div className="space-y-3">
                {/* 건강 점수 + 요약 */}
                <div className="flex items-center gap-3">
                  <HealthGauge score={result.healthScore} size={72} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">그룹 건강 점수</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {result.anomalies.length === 0
                        ? "이상 징후 없음. 정상 상태입니다."
                        : `${result.anomalies.length}건의 이상 징후가 감지되었습니다.`}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      최근 30일 vs 이전 30일 비교
                    </p>
                  </div>
                  <Shield
                    className={`h-5 w-5 shrink-0 ${
                      result.healthScore >= 70
                        ? "text-green-500"
                        : result.healthScore >= 40
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                    aria-hidden="true"
                  />
                </div>

                {/* 이상 징후 목록 */}
                {result.anomalies.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50/60 border border-green-200 px-3 py-2.5">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">
                      모든 활동이 정상입니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* 심각도 내림차순 정렬: critical > warning > info */}
                    {[...result.anomalies]
                      .sort((a, b) => {
                        const order: Record<string, number> = {
                          critical: 0,
                          warning: 1,
                          info: 2,
                        };
                        return order[a.level] - order[b.level];
                      })
                      .map((anomaly) => (
                        <AnomalyItem key={anomaly.id} anomaly={anomaly} />
                      ))}
                  </div>
                )}

                {/* 마지막 체크 시각 */}
                <p className="text-[10px] text-muted-foreground/50 text-right">
                  <Activity className="h-2.5 w-2.5 inline mr-1" />
                  {new Date(result.lastCheckedAt).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  기준
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                데이터를 불러올 수 없습니다.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
