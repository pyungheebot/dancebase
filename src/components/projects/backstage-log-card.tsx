"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Plus, BarChart3, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useBackstageLog } from "@/hooks/use-backstage-log";
import {
  CreateSessionDialog,
  SessionCard,
  StatsSummary,
} from "./backstage-log/index";

// ============================================================
// 메인 카드
// ============================================================

export function BackstageLogCard({ projectId }: { projectId: string }) {
  const {
    sessions,
    loading,
    createSession,
    endSession,
    deleteSession,
    addEntry,
    resolveEntry,
    deleteEntry,
    totalSessions,
    totalEntries,
    unresolvedCount,
    categoryBreakdown,
  } = useBackstageLog(projectId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">백스테이지 커뮤니케이션 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400" role="status" aria-live="polite">
            불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <CardTitle className="text-sm">
              백스테이지 커뮤니케이션 로그
            </CardTitle>
            {unresolvedCount > 0 && (
              <Badge
                className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200"
                aria-label={`미해결 ${unresolvedCount}건`}
              >
                미해결 {unresolvedCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {totalEntries > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2 text-gray-400"
                aria-pressed={showStats}
                onClick={() => setShowStats((v) => !v)}
              >
                <BarChart3 className="h-3 w-3 mr-0.5" aria-hidden="true" />
                통계
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="새 공연 세션 시작"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              새 세션
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          공연 중 백스테이지 소통 기록 · 큐 시트 · 긴급 알림 관리
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 통계 요약 */}
        {showStats && totalEntries > 0 && (
          <StatsSummary
            totalSessions={totalSessions}
            totalEntries={totalEntries}
            unresolvedCount={unresolvedCount}
            categoryBreakdown={categoryBreakdown}
          />
        )}

        {/* 빈 상태 */}
        {sessions.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-10 text-gray-400"
            role="status"
          >
            <Radio
              className="h-10 w-10 mb-3 opacity-20"
              aria-hidden="true"
            />
            <p className="text-xs font-medium mb-1">공연 세션이 없습니다</p>
            <p className="text-[11px] text-center max-w-48">
              &quot;새 세션&quot; 버튼으로 공연 백스테이지 로그 세션을
              시작하세요.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs mt-3"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              첫 세션 시작하기
            </Button>
          </div>
        )}

        {/* 활성 세션 */}
        {activeSessions.length > 0 && (
          <section aria-label="진행 중인 세션">
            <p className="text-[10px] font-medium text-blue-600 flex items-center gap-1 uppercase tracking-wide mb-2">
              <span
                className="relative flex h-1.5 w-1.5"
                role="img"
                aria-label="진행 중"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
              </span>
              진행 중인 세션
            </p>
            <div className="space-y-2">
              {activeSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onEnd={endSession}
                  onDelete={deleteSession}
                  onAddEntry={addEntry}
                  onResolveEntry={resolveEntry}
                  onDeleteEntry={deleteEntry}
                />
              ))}
            </div>
          </section>
        )}

        {/* 종료된 세션 */}
        {inactiveSessions.length > 0 && (
          <section aria-label={`과거 세션 ${inactiveSessions.length}개`}>
            <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1 uppercase tracking-wide mb-2">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              과거 세션 ({inactiveSessions.length})
            </p>
            <div className="space-y-2">
              {inactiveSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onEnd={endSession}
                  onDelete={deleteSession}
                  onAddEntry={addEntry}
                  onResolveEntry={resolveEntry}
                  onDeleteEntry={deleteEntry}
                />
              ))}
            </div>
          </section>
        )}
      </CardContent>

      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={(showName, showDate) => {
          createSession({ showName, showDate });
          toast.success(`"${showName}" 세션이 시작되었습니다.`);
        }}
      />
    </Card>
  );
}
