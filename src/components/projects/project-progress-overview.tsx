"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckSquare,
  Music,
  UserCheck,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { useProjectProgress, type ProgressMetric } from "@/hooks/use-project-progress";

// ============================================
// 지표 설정
// ============================================

type MetricConfig = {
  key: "tasks" | "songs" | "attendance" | "budget";
  label: string;
  color: string;        // SVG stroke 색상 (tailwind 없이 직접 색상 값)
  textColor: string;    // 텍스트 클래스
  ringColor: string;    // 링 클래스 (참고용)
  icon: React.ReactNode;
  sectionId: string;    // 스크롤 대상 ID
};

const METRICS: MetricConfig[] = [
  {
    key: "tasks",
    label: "태스크",
    color: "#3b82f6",
    textColor: "text-blue-500",
    ringColor: "stroke-blue-500",
    icon: <CheckSquare className="h-3 w-3" />,
    sectionId: "project-tasks",
  },
  {
    key: "songs",
    label: "곡",
    color: "#a855f7",
    textColor: "text-purple-500",
    ringColor: "stroke-purple-500",
    icon: <Music className="h-3 w-3" />,
    sectionId: "project-songs",
  },
  {
    key: "attendance",
    label: "출석",
    color: "#22c55e",
    textColor: "text-green-500",
    ringColor: "stroke-green-500",
    icon: <UserCheck className="h-3 w-3" />,
    sectionId: "project-attendance",
  },
  {
    key: "budget",
    label: "예산",
    color: "#f97316",
    textColor: "text-orange-500",
    ringColor: "stroke-orange-500",
    icon: <Wallet className="h-3 w-3" />,
    sectionId: "project-finance",
  },
];

// ============================================
// SVG 링 차트 컴포넌트
// ============================================

interface RingChartProps {
  rate: number | null;
  color: string;
  size?: number;
  strokeWidth?: number;
}

function RingChart({ rate, color, size = 60, strokeWidth = 5 }: RingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  // rate가 null이면 회색 대기 링만 표시
  const progress = rate !== null ? rate / 100 : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden="true"
    >
      {/* 배경 링 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* 진행 링 */}
      {rate !== null && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      )}
    </svg>
  );
}

// ============================================
// 미니 지표 카드
// ============================================

interface MetricCardProps {
  config: MetricConfig;
  metric: ProgressMetric;
  onNavigate: (sectionId: string) => void;
}

function MetricCard({ config, metric, onNavigate }: MetricCardProps) {
  const { rate, done, total } = metric;

  return (
    <button
      type="button"
      onClick={() => onNavigate(config.sectionId)}
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={`${config.label} 섹션으로 이동`}
    >
      {/* 링 차트 + 퍼센트 오버레이 */}
      <div className="relative w-[60px] h-[60px] flex items-center justify-center">
        <RingChart rate={rate} color={config.color} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[11px] font-bold leading-none ${config.textColor}`}>
            {rate !== null ? `${rate}%` : "N/A"}
          </span>
        </div>
      </div>

      {/* 레이블 + 아이콘 */}
      <div className={`flex items-center gap-0.5 ${config.textColor}`}>
        {config.icon}
        <span className="text-[10px] font-medium">{config.label}</span>
      </div>

      {/* 세부 수치 */}
      {total > 0 && (
        <span className="text-[9px] text-muted-foreground leading-none">
          {done}/{total}
        </span>
      )}
      {total === 0 && (
        <span className="text-[9px] text-muted-foreground leading-none">
          데이터 없음
        </span>
      )}
    </button>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface ProjectProgressOverviewProps {
  projectId: string;
  groupId: string;
  basePath: string;
}

export function ProjectProgressOverview({
  projectId,
  groupId,
  basePath,
}: ProjectProgressOverviewProps) {
  const { progress, loading } = useProjectProgress(projectId, groupId);
  const router = useRouter();

  function handleNavigate(sectionId: string) {
    // 같은 페이지 내 앵커 스크롤 시도, 없으면 해당 탭으로 이동
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // 섹션 ID → 탭 경로 매핑
    const tabMap: Record<string, string> = {
      "project-tasks": "",
      "project-songs": "",
      "project-attendance": `${basePath}/attendance`,
      "project-finance": `${basePath}/finances`,
    };

    const path = tabMap[sectionId];
    if (path) {
      router.push(path);
    }
  }

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader className="px-3 py-2.5 border-b">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="px-3 py-3">
          <div className="flex items-center justify-around">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="w-[60px] h-[60px] rounded-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overall } = progress;

  return (
    <Card className="mt-4">
      <CardHeader className="px-3 py-2.5 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          진행률 현황
        </CardTitle>

        {/* 종합 진행률 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">종합</span>
          <span className="text-sm font-bold tabular-nums">
            {overall !== null ? `${overall}%` : "N/A"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-3 py-3">
        <div className="flex items-start justify-around gap-1">
          {METRICS.map((config) => (
            <MetricCard
              key={config.key}
              config={config}
              metric={progress[config.key]}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* 종합 진행 바 */}
        {overall !== null && (
          <div className="mt-3 pt-2 border-t space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">종합 진행률</span>
              <span className="text-[10px] font-semibold">{overall}%</span>
            </div>
            {/* 멀티 컬러 바 */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex">
              {METRICS.map((config) => {
                const r = progress[config.key].rate;
                if (r === null) return null;
                return (
                  <div
                    key={config.key}
                    style={{
                      width: `${r / METRICS.length}%`,
                      backgroundColor: config.color,
                    }}
                    className="h-full transition-all duration-500"
                    title={`${config.label}: ${r}%`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
