"use client";

import { useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckSquare,
  Dumbbell,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStretchingRoutine } from "@/hooks/use-stretching-routine";
import { getWeekDates, today } from "./stretching-routine/types";
import { StatsSummary } from "./stretching-routine/stats-summary";
import { WeeklyChart } from "./stretching-routine/weekly-chart";
import { AddRoutineForm } from "./stretching-routine/add-routine-form";
import { AddLogForm } from "./stretching-routine/add-log-form";
import { RoutineListItem } from "./stretching-routine/routine-list-item";
import { LogListItem } from "./stretching-routine/log-list-item";

export function StretchingRoutineCard({ memberId }: { memberId: string }) {
  const {
    routines,
    logs,
    addRoutine,
    deleteRoutine,
    addExercise,
    deleteExercise,
    addLog,
    deleteLog,
    stats,
  } = useStretchingRoutine(memberId);

  const [isOpen, setIsOpen] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"routines" | "logs">("routines");

  // 주간 완료율 차트 데이터
  const weekDates = getWeekDates();
  const weekLogMap: Record<string, number> = {};
  weekDates.forEach((d) => {
    weekLogMap[d] = logs.filter((l) => l.date === d).length;
  });
  const maxWeekLogs = Math.max(1, ...Object.values(weekLogMap));

  // 최근 로그 5개
  const recentLogs = logs.slice(0, 5);

  function handleRoutineToggle(routineId: string) {
    setExpandedRoutineId((prev) => (prev === routineId ? null : routineId));
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls="stretching-card-content"
          aria-label={`스트레칭 루틴 섹션 ${isOpen ? "접기" : "펼치기"}`}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-500" aria-hidden="true" />
            <span className="text-sm font-semibold">스트레칭 루틴</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700 border-0">
              {stats.totalRoutines}개 루틴
            </Badge>
            {stats.streakDays > 0 && (
              <Badge
                className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-0 flex items-center gap-0.5"
                aria-label={`${stats.streakDays}일 연속 스트레칭`}
              >
                <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                {stats.streakDays}일 연속
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent
          id="stretching-card-content"
          className="space-y-4 pt-0"
        >
          {/* 통계 요약 */}
          <StatsSummary
            totalRoutines={stats.totalRoutines}
            totalLogs={stats.totalLogs}
            averageFlexibility={stats.averageFlexibility}
          />

          {/* 주간 완료율 차트 */}
          <WeeklyChart
            weekDates={weekDates}
            weekLogMap={weekLogMap}
            maxWeekLogs={maxWeekLogs}
          />

          {/* 탭 */}
          <div
            className="flex rounded-md border border-gray-200 p-0.5 bg-muted/30"
            role="tablist"
            aria-label="스트레칭 탭"
          >
            <button
              role="tab"
              aria-selected={activeTab === "routines"}
              aria-controls="tab-panel-routines"
              id="tab-routines"
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                activeTab === "routines"
                  ? "bg-background shadow-sm text-teal-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("routines")}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  setActiveTab("logs");
                }
              }}
            >
              <Dumbbell className="h-3 w-3 inline mr-1" aria-hidden="true" />
              루틴 관리
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "logs"}
              aria-controls="tab-panel-logs"
              id="tab-logs"
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                activeTab === "logs"
                  ? "bg-background shadow-sm text-violet-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("logs")}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  setActiveTab("routines");
                }
              }}
            >
              <CheckSquare className="h-3 w-3 inline mr-1" aria-hidden="true" />
              운동 기록
            </button>
          </div>

          {/* 루틴 탭 */}
          {activeTab === "routines" && (
            <div
              id="tab-panel-routines"
              role="tabpanel"
              aria-labelledby="tab-routines"
              className="space-y-2"
            >
              {routines.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground text-center py-3"
                  role="status"
                >
                  등록된 루틴이 없습니다.
                </p>
              ) : (
                <div role="list" aria-label="스트레칭 루틴 목록" className="space-y-2">
                  {routines.map((routine) => (
                    <RoutineListItem
                      key={routine.id}
                      routine={routine}
                      isExpanded={expandedRoutineId === routine.id}
                      onToggle={handleRoutineToggle}
                      onAddExercise={addExercise}
                      onDeleteExercise={deleteExercise}
                      onDeleteRoutine={deleteRoutine}
                    />
                  ))}
                </div>
              )}

              {showRoutineForm ? (
                <AddRoutineForm
                  onAdd={addRoutine}
                  onClose={() => setShowRoutineForm(false)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full border-dashed border-teal-300 text-teal-600 hover:bg-teal-50"
                  onClick={() => setShowRoutineForm(true)}
                  aria-label="새 루틴 추가 폼 열기"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  루틴 추가
                </Button>
              )}
            </div>
          )}

          {/* 로그 탭 */}
          {activeTab === "logs" && (
            <div
              id="tab-panel-logs"
              role="tabpanel"
              aria-labelledby="tab-logs"
              className="space-y-2"
            >
              {recentLogs.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground text-center py-3"
                  role="status"
                >
                  아직 운동 기록이 없습니다.
                </p>
              ) : (
                <div
                  role="list"
                  aria-label="최근 운동 기록"
                  className="space-y-1"
                >
                  {recentLogs.map((log) => {
                    const routine = routines.find(
                      (r) => r.id === log.routineId
                    );
                    return (
                      <LogListItem
                        key={log.id}
                        log={log}
                        routine={routine}
                        onDelete={deleteLog}
                      />
                    );
                  })}
                </div>
              )}

              {showLogForm ? (
                routines.length > 0 ? (
                  <AddLogForm
                    routines={routines}
                    onAdd={addLog}
                    onClose={() => setShowLogForm(false)}
                  />
                ) : (
                  <div
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center"
                    role="alert"
                  >
                    <p className="text-xs text-amber-700">
                      먼저 루틴을 등록해주세요.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-amber-600 mt-1"
                      onClick={() => {
                        setShowLogForm(false);
                        setActiveTab("routines");
                      }}
                    >
                      루틴 탭으로 이동
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full border-dashed border-violet-300 text-violet-600 hover:bg-violet-50"
                  onClick={() => setShowLogForm(true)}
                  aria-label="운동 기록 추가 폼 열기"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  운동 기록 추가
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
