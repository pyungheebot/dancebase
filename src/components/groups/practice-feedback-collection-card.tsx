"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  CalendarIcon,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticeFeedbackSession } from "@/hooks/use-practice-feedback-session";
import type { PracticeFeedbackAggregate } from "@/types";
import { SessionItem } from "./practice-feedback-collection/session-item";
import { CreateSessionDialog } from "./practice-feedback-collection/create-session-dialog";
import { SubmitFeedbackDialog } from "./practice-feedback-collection/submit-feedback-dialog";

// ============================================
// 메인 카드 컴포넌트
// ============================================

type PracticeFeedbackCollectionCardProps = {
  groupId: string;
  memberNames?: string[];
};

export function PracticeFeedbackCollectionCard({
  groupId,
  memberNames = [],
}: PracticeFeedbackCollectionCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const {
    sessions,
    loading,
    createSession,
    deleteSession,
    submitResponse,
    getAggregate,
    overallAverageRating,
    totalResponseCount,
  } = usePracticeFeedbackSession(groupId);

  // 세션별 집계 맵
  const aggregateMap = useMemo(() => {
    const map = new Map<string, PracticeFeedbackAggregate>();
    for (const session of sessions) {
      const agg = getAggregate(session.id);
      if (agg) map.set(session.id, agg);
    }
    return map;
  }, [sessions, getAggregate]);

  const handleOpenFeedbackForm = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setFeedbackDialogOpen(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    toast.success(TOAST.PRACTICE_FEEDBACK_COLLECTION.SESSION_DELETED);
  };

  const sessionListId = "practice-feedback-session-list";

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-controls={sessionListId}
        >
          <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium flex-1">연습 피드백 수집</span>

          {totalResponseCount > 0 && (
            <div
              className="flex items-center gap-1 shrink-0"
              aria-label={`전체 평균 ${overallAverageRating.toFixed(1)}점`}
            >
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-yellow-600">
                {overallAverageRating.toFixed(1)}
              </span>
            </div>
          )}

          {sessions.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0 rounded bg-indigo-100 text-indigo-700 font-semibold shrink-0"
              aria-label={`${sessions.length}개 세션`}
            >
              {sessions.length}세션
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          )}
        </button>

        {!collapsed && (
          <div id={sessionListId} className="space-y-2">
            {/* 요약 통계 */}
            {sessions.length > 0 && totalResponseCount > 0 && (
              <dl
                className="bg-indigo-50 dark:bg-indigo-950/30 rounded-md px-2.5 py-2 flex items-center gap-3"
                aria-label="피드백 요약 통계"
              >
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  <div>
                    <dt className="text-[9px] text-muted-foreground">전체 평균</dt>
                    <dd className="text-xs font-bold text-yellow-700">
                      {overallAverageRating.toFixed(1)}
                    </dd>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                  <div>
                    <dt className="text-[9px] text-muted-foreground">총 피드백</dt>
                    <dd className="text-xs font-bold text-indigo-700">
                      {totalResponseCount}
                    </dd>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/60" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                  <div>
                    <dt className="text-[9px] text-muted-foreground">세션 수</dt>
                    <dd className="text-xs font-bold text-green-700">
                      {sessions.length}
                    </dd>
                  </div>
                </div>
              </dl>
            )}

            {/* 세션 목록 */}
            {loading ? (
              <p
                className="text-[10px] text-muted-foreground text-center py-3"
                aria-live="polite"
                aria-busy="true"
              >
                불러오는 중...
              </p>
            ) : sessions.length > 0 ? (
              <div className="space-y-1.5" role="list" aria-label="연습 세션 목록">
                {sessions.map((session) => {
                  const agg = aggregateMap.get(session.id);
                  if (!agg) return null;
                  return (
                    <div key={session.id} role="listitem">
                      <SessionItem
                        session={session}
                        aggregate={agg}
                        onDeleteSession={handleDeleteSession}
                        onOpenFeedbackForm={handleOpenFeedbackForm}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground"
                role="status"
                aria-label="세션 없음"
              >
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
                <p className="text-xs">연습 세션이 없습니다</p>
                <p className="text-[10px]">
                  연습 날짜를 추가하고 피드백을 수집하세요
                </p>
              </div>
            )}

            {/* 구분선 */}
            {sessions.length > 0 && (
              <div className="border-t border-border/40" aria-hidden="true" />
            )}

            {/* 세션 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="연습 세션 추가"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              연습 세션 추가
            </Button>
          </div>
        )}
      </div>

      {/* 세션 생성 다이얼로그 */}
      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createSession}
      />

      {/* 피드백 제출 다이얼로그 */}
      {selectedSessionId && (
        <SubmitFeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={(v) => {
            setFeedbackDialogOpen(v);
            if (!v) setSelectedSessionId(null);
          }}
          sessionId={selectedSessionId}
          memberNames={memberNames}
          onSubmit={submitResponse}
        />
      )}
    </>
  );
}
