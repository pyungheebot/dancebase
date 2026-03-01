"use client";

import { useState } from "react";
import { Users, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMentoringMatch } from "@/hooks/use-mentoring-match";
import type { MentoringMatchStatus } from "@/types";

import { AddSessionDialog } from "./mentoring-match/add-session-dialog";
import { CreatePairDialog } from "./mentoring-match/create-pair-dialog";
import { PairCard } from "./mentoring-match/pair-card";
import { MentoringStats } from "./mentoring-match/mentoring-stats";
import { STATUS_LABEL } from "./mentoring-match/types";
import type { FilterType } from "./mentoring-match/types";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MentoringMatchCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    pairs,
    loading,
    addPair,
    deletePair,
    addSession,
    deleteSession,
    updateStatus,
    stats,
  } = useMentoringMatch(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [sessionDialogPairId, setSessionDialogPairId] = useState<string | null>(null);

  const filtered = pairs.filter(
    (p) => filter === "all" || p.status === filter
  );

  function handleCreatePair(data: {
    mentorName: string;
    menteeName: string;
    skillFocus: string[];
    goals: string[];
    startDate: string;
  }) {
    addPair(
      data.mentorName,
      data.menteeName,
      data.skillFocus,
      data.goals,
      data.startDate
    );
    toast.success(TOAST.MENTORING_MATCH.CREATED);
  }

  function handleDeletePair(id: string) {
    const ok = deletePair(id);
    if (ok) toast.success(TOAST.MENTORING_MATCH.DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleStatusChange(pairId: string, status: MentoringMatchStatus) {
    updateStatus(pairId, status);
    const label =
      status === "active" ? "재개" : status === "completed" ? "완료" : "일시중지";
    toast.success(`매칭이 ${label} 처리되었습니다.`);
  }

  function handleAddSession(data: {
    date: string;
    topic: string;
    durationMinutes: number;
    notes?: string;
    menteeRating?: number;
  }) {
    if (!sessionDialogPairId) return;
    const result = addSession(sessionDialogPairId, data);
    if (result) toast.success(TOAST.MENTORING_MATCH.SESSION_RECORDED);
    else toast.error(TOAST.MENTORING_MATCH.SESSION_ADD_ERROR);
  }

  function handleDeleteSession(pairId: string, sessionId: string) {
    const ok = deleteSession(pairId, sessionId);
    if (ok) toast.success(TOAST.MENTORING_MATCH.SESSION_DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "active", label: "진행 중" },
    { value: "completed", label: "완료" },
    { value: "paused", label: "일시중지" },
  ];

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
              aria-controls="mentoring-match-content"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span className="text-sm font-medium">멘토링 매칭</span>
                {stats.activePairs > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                    <span className="sr-only">활성 매칭 수: </span>
                    활성 {stats.activePairs}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent id="mentoring-match-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 통계 + 탑 멘토 */}
              <MentoringStats
                totalPairs={stats.totalPairs}
                totalSessions={stats.totalSessions}
                avgSessionsPerPair={stats.avgSessionsPerPair}
                topMentors={stats.topMentors}
              />

              {/* 필터 + 생성 버튼 */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex gap-1"
                  role="tablist"
                  aria-label="매칭 상태 필터"
                >
                  {FILTER_OPTIONS.map((f) => (
                    <Button
                      key={f.value}
                      role="tab"
                      aria-selected={filter === f.value}
                      aria-pressed={filter === f.value}
                      variant={filter === f.value ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilter(f.value)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setCreateOpen(true)}
                  aria-label="멘토링 매칭 생성"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  매칭 생성
                </Button>
              </div>

              {/* 매칭 목록 */}
              {loading ? (
                <div
                  className="text-xs text-muted-foreground text-center py-4"
                  role="alert"
                  aria-live="polite"
                >
                  불러오는 중...
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="text-xs text-muted-foreground text-center py-6"
                  role="alert"
                  aria-live="polite"
                >
                  {filter === "all"
                    ? "아직 멘토링 매칭이 없습니다."
                    : `${STATUS_LABEL[filter as MentoringMatchStatus]} 상태의 매칭이 없습니다.`}
                </div>
              ) : (
                <div className="space-y-2" role="list" aria-label="멘토링 매칭 목록">
                  {filtered.map((pair) => (
                    <PairCard
                      key={pair.id}
                      pair={pair}
                      onDelete={() => handleDeletePair(pair.id)}
                      onStatusChange={(status) =>
                        handleStatusChange(pair.id, status)
                      }
                      onAddSession={() => setSessionDialogPairId(pair.id)}
                      onDeleteSession={(sessionId) =>
                        handleDeleteSession(pair.id, sessionId)
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 매칭 생성 다이얼로그 */}
      <CreatePairDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        memberNames={memberNames}
        onSave={handleCreatePair}
      />

      {/* 세션 추가 다이얼로그 */}
      <AddSessionDialog
        open={sessionDialogPairId !== null}
        onClose={() => setSessionDialogPairId(null)}
        onSave={handleAddSession}
      />
    </>
  );
}
