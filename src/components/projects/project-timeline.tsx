"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useProjectTimeline } from "@/hooks/use-project-timeline";
import { Badge } from "@/components/ui/badge";

import { Calendar, ArrowRight, Loader2, FolderOpen } from "lucide-react";

interface ProjectTimelineProps {
  groupId: string;
}

/** 완료율에 따른 바 색상 반환 */
function getBarColor(rate: number): string {
  if (rate >= 100) return "bg-green-500";
  if (rate >= 70) return "bg-green-400";
  if (rate >= 40) return "bg-yellow-400";
  if (rate > 0) return "bg-yellow-300";
  return "bg-gray-300";
}

/** 완료율 텍스트 색상 */
function getBarTextColor(rate: number): string {
  if (rate >= 40) return "text-white";
  return "text-gray-600";
}

/** 상태 배지 색상 */
const STATUS_COLORS: Record<string, string> = {
  신규: "bg-blue-100 text-blue-700",
  진행: "bg-green-100 text-green-700",
  보류: "bg-yellow-100 text-yellow-700",
  종료: "bg-gray-100 text-gray-500",
};

/** 유형 배지 색상 */
const TYPE_COLORS: Record<string, string> = {
  공연: "bg-purple-100 text-purple-700",
  모임: "bg-pink-100 text-pink-700",
  연습: "bg-orange-100 text-orange-700",
  이벤트: "bg-cyan-100 text-cyan-700",
  기타: "bg-gray-100 text-gray-600",
};

const ROW_HEIGHT = 44; // px
const NAME_COL_WIDTH = 160; // px - 이름 컬럼 너비
const CELL_WIDTH = 120; // px per month

export function ProjectTimeline({ groupId }: ProjectTimelineProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { projects, months, todayColOffset, loading } = useProjectTimeline(groupId);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <FolderOpen className="h-8 w-8" />
        <p className="text-sm">프로젝트가 없습니다</p>
      </div>
    );
  }

  const totalGridWidth = months.length * CELL_WIDTH;

  return (
    <div className="w-full">
      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-visible border rounded-lg bg-background"
        style={{ maxWidth: "100%" }}
      >
        <div style={{ minWidth: NAME_COL_WIDTH + totalGridWidth }}>
          {/* 헤더: 고정 이름 컬럼 + 월 그리드 */}
          <div className="flex border-b bg-muted/40 sticky top-0 z-10">
            {/* 이름 컬럼 헤더 */}
            <div
              className="shrink-0 flex items-center px-3 border-r"
              style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
            >
              <span className="text-xs font-semibold text-muted-foreground">프로젝트</span>
            </div>
            {/* 월 헤더 */}
            <div className="relative flex" style={{ width: totalGridWidth }}>
              {months.map((m) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className="shrink-0 flex items-center justify-center border-r last:border-r-0"
                  style={{ width: CELL_WIDTH, height: 36 }}
                >
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {m.month === 1 ? `${m.year}년 ${m.month}월` : `${m.month}월`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 프로젝트 행들 */}
          <div className="relative">
            {/* 오늘 날짜 세로선 */}
            {todayColOffset !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                style={{
                  left: NAME_COL_WIDTH + (todayColOffset / 100) * totalGridWidth,
                }}
              />
            )}

            {projects.map((project, rowIdx) => (
              <div
                key={project.id}
                className="flex border-b last:border-b-0 hover:bg-accent/40 transition-colors group"
                style={{ height: ROW_HEIGHT }}
              >
                {/* 프로젝트 이름 컬럼 */}
                <div
                  className="shrink-0 flex flex-col justify-center px-3 border-r cursor-pointer"
                  style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                  onClick={() =>
                    router.push(`/groups/${project.group_id}/projects/${project.id}`)
                  }
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-medium truncate flex-1 min-w-0">
                      {project.name}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <Badge
                      className={`text-[9px] px-1 py-0 font-normal border-0 leading-tight ${TYPE_COLORS[project.type] ?? TYPE_COLORS["기타"]}`}
                    >
                      {project.type}
                    </Badge>
                    <Badge
                      className={`text-[9px] px-1 py-0 font-normal border-0 leading-tight ${STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </div>

                {/* 그리드 영역 */}
                <div
                  className="relative flex items-center"
                  style={{ width: totalGridWidth }}
                >
                  {/* 월 구분선 */}
                  {months.map((m, i) => (
                    <div
                      key={`grid-${m.year}-${m.month}`}
                      className="absolute top-0 bottom-0 border-r border-border/40"
                      style={{ left: (i + 1) * CELL_WIDTH - 1 }}
                    />
                  ))}

                  {/* 홀짝 행 배경 */}
                  {rowIdx % 2 === 1 && (
                    <div className="absolute inset-0 bg-muted/20 pointer-events-none" />
                  )}

                  {/* 기간 바 */}
                  {project.hasDate ? (
                    <button
                      type="button"
                      className="absolute flex items-center rounded cursor-pointer hover:brightness-90 transition-all focus:outline-none focus:ring-1 focus:ring-ring"
                      style={{
                        left: project.colStart * CELL_WIDTH,
                        width: Math.max(project.colSpan * CELL_WIDTH, 24),
                        height: 22,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                      onClick={() =>
                        router.push(`/groups/${project.group_id}/projects/${project.id}`)
                      }
                      title={`${project.name} - 완료율 ${project.completionRate}%`}
                    >
                      {/* 배경 바 (전체) */}
                      <div
                        className="absolute inset-0 rounded bg-gray-200"
                      />
                      {/* 진행 바 */}
                      <div
                        className={`absolute inset-y-0 left-0 rounded transition-all ${getBarColor(project.completionRate)}`}
                        style={{
                          width: `${project.completionRate}%`,
                          minWidth: project.completionRate > 0 ? 4 : 0,
                        }}
                      />
                      {/* 완료율 텍스트 */}
                      <span
                        className={`relative z-10 px-1.5 text-[10px] font-medium truncate ${getBarTextColor(project.completionRate)}`}
                      >
                        {project.totalTasks > 0
                          ? `${project.completionRate}%`
                          : "태스크 없음"}
                      </span>
                    </button>
                  ) : (
                    /* 기간 미설정 */
                    <div className="flex items-center gap-1 px-2">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground">기간 미설정</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 mt-2 px-1 flex-wrap">
        <span className="text-[10px] text-muted-foreground">완료율:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded bg-gray-300" />
          <span className="text-[10px] text-muted-foreground">0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded bg-yellow-300" />
          <span className="text-[10px] text-muted-foreground">1~39%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded bg-yellow-400" />
          <span className="text-[10px] text-muted-foreground">40~69%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded bg-green-400" />
          <span className="text-[10px] text-muted-foreground">70~99%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded bg-green-500" />
          <span className="text-[10px] text-muted-foreground">100%</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <div className="w-px h-3.5 bg-red-500" />
          <span className="text-[10px] text-muted-foreground">오늘</span>
        </div>
      </div>
    </div>
  );
}
