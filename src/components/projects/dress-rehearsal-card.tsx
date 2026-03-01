"use client";

// ============================================================
// 드레스 리허설 메인 카드
// 서브컴포넌트: SessionFormDialog, IssueFormDialog,
//              SessionSection, StatsPanel
// ============================================================

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  ClipboardList,
  AlertTriangle,
  Circle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDressRehearsal } from "@/hooks/use-dress-rehearsal";
import { SessionFormDialog } from "./dress-rehearsal-session-form-dialog";
import { IssueFormDialog } from "./dress-rehearsal-issue-form-dialog";
import {
  SessionSection,
  EmptySessionState,
} from "./dress-rehearsal-session-section";
import { StatsPanel } from "./dress-rehearsal-stats-panel";
import type {
  DressRehearsalCategory,
  DressRehearsalSeverity,
  DressRehearsalSession,
  DressRehearsalIssue,
} from "@/types";

// ============================================================
// Props
// ============================================================

interface DressRehearsalCardProps {
  projectId: string;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DressRehearsalCard({ projectId }: DressRehearsalCardProps) {
  const {
    sessions,
    loading,
    stats,
    addSession,
    updateSession,
    deleteSession,
    addIssue,
    updateIssue,
    deleteIssue,
    toggleIssueResolved,
  } = useDressRehearsal(projectId);

  // 카드 전체 접기/펼치기
  const [open, setOpen] = useState(true);
  // 통계 패널 표시 여부
  const [showStats, setShowStats] = useState(false);

  // ---- 회차 다이얼로그 상태 ----
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editSession, setEditSession] = useState<DressRehearsalSession | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<string | null>(null);

  // ---- 이슈 다이얼로그 상태 ----
  const [issueDialogSessionId, setIssueDialogSessionId] = useState<string | null>(null);
  const [editIssueContext, setEditIssueContext] = useState<{
    sessionId: string;
    issue: DressRehearsalIssue;
  } | null>(null);
  const [deleteIssueTarget, setDeleteIssueTarget] = useState<{
    sessionId: string;
    issueId: string;
  } | null>(null);

  // ============================================================
  // 회차 핸들러
  // ============================================================

  const handleAddSession = (params: { date: string; time: string; venue: string }) => {
    addSession(params);
    toast.success(TOAST.DRESS_REHEARSAL.SESSION_ADDED);
  };

  const handleEditSession = (params: { date: string; time: string; venue: string }) => {
    if (!editSession) return;
    const ok = updateSession(editSession.id, params);
    if (ok) {
      toast.success(TOAST.DRESS_REHEARSAL.SESSION_UPDATED);
    } else {
      toast.error(TOAST.DRESS_REHEARSAL.SESSION_UPDATE_ERROR);
    }
    setEditSession(null);
  };

  const handleDeleteSession = () => {
    if (!deleteSessionTarget) return;
    const ok = deleteSession(deleteSessionTarget);
    if (ok) {
      toast.success(TOAST.DRESS_REHEARSAL.SESSION_DELETED);
    } else {
      toast.error(TOAST.DRESS_REHEARSAL.SESSION_DELETE_ERROR);
    }
    setDeleteSessionTarget(null);
  };

  // ============================================================
  // 이슈 핸들러
  // ============================================================

  const handleAddIssue = (params: {
    section: string;
    content: string;
    category: DressRehearsalCategory;
    severity: DressRehearsalSeverity;
    assignee?: string;
  }) => {
    if (!issueDialogSessionId) return;
    const result = addIssue(issueDialogSessionId, params);
    if (result) {
      toast.success(TOAST.DRESS_REHEARSAL.ISSUE_ADDED);
    } else {
      toast.error(TOAST.DRESS_REHEARSAL.ISSUE_ADD_ERROR);
    }
    setIssueDialogSessionId(null);
  };

  const handleEditIssue = (params: {
    section: string;
    content: string;
    category: DressRehearsalCategory;
    severity: DressRehearsalSeverity;
    assignee?: string;
  }) => {
    if (!editIssueContext) return;
    const ok = updateIssue(
      editIssueContext.sessionId,
      editIssueContext.issue.id,
      params
    );
    if (ok) {
      toast.success(TOAST.DRESS_REHEARSAL.ISSUE_UPDATED);
    } else {
      toast.error(TOAST.DRESS_REHEARSAL.ISSUE_UPDATE_ERROR);
    }
    setEditIssueContext(null);
  };

  const handleDeleteIssue = () => {
    if (!deleteIssueTarget) return;
    const ok = deleteIssue(deleteIssueTarget.sessionId, deleteIssueTarget.issueId);
    if (ok) {
      toast.success(TOAST.DRESS_REHEARSAL.ISSUE_DELETED);
    } else {
      toast.error(TOAST.DRESS_REHEARSAL.ISSUE_DELETE_ERROR);
    }
    setDeleteIssueTarget(null);
  };

  const handleToggleIssue = (sessionId: string, issueId: string) => {
    // 토글 전 현재 상태 확인 (해결 완료 시 토스트 메시지용)
    const session = sessions.find((s) => s.id === sessionId);
    const issue = session?.issues.find((i) => i.id === issueId);
    const ok = toggleIssueResolved(sessionId, issueId);
    if (!ok) {
      toast.error(TOAST.STATUS_ERROR);
      return;
    }
    // 미해결 → 해결 전환 시에만 알림
    if (issue && !issue.resolved) {
      toast.success(TOAST.DRESS_REHEARSAL.ISSUE_RESOLVED);
    }
  };

  // ============================================================
  // 로딩 상태
  // ============================================================

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-500" aria-hidden="true" />
            드레스 리허설 노트
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xs text-gray-400">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // 렌더링
  // ============================================================

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              {/* 카드 제목 + 접기/펼치기 트리거 */}
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                  aria-label={`드레스 리허설 노트 ${open ? "접기" : "펼치기"}`}
                  aria-expanded={open}
                >
                  <ClipboardList className="h-4 w-4 text-violet-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    드레스 리허설 노트
                  </CardTitle>
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </CollapsibleTrigger>

              {/* 우측 버튼 영역 */}
              <div className="flex items-center gap-1">
                {stats.totalIssues > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowStats(!showStats)}
                    aria-label={showStats ? "통계 패널 닫기" : "통계 패널 열기"}
                    aria-pressed={showStats}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" aria-hidden="true" />
                    통계
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSessionDialogOpen(true)}
                  aria-label="리허설 회차 추가"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  회차 추가
                </Button>
              </div>
            </div>

            {/* 전체 이슈 요약 배지 */}
            {stats.totalIssues > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap" aria-label="전체 이슈 요약">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"
                >
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                  총 {stats.totalIssues}건
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200"
                >
                  <Circle className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                  미해결 {stats.unresolvedIssues}건
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                  해결 {stats.resolvedIssues}건
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200"
                >
                  해결율 {stats.resolveRate}%
                </Badge>
              </div>
            )}

            {/* 통계 패널 (토글) */}
            {showStats && stats.totalIssues > 0 && (
              <StatsPanel stats={stats} />
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* 회차 없음 빈 상태 */}
              {sessions.length === 0 && <EmptySessionState />}

              {/* 회차 목록 */}
              <div role="list" aria-label="리허설 회차 목록">
                {sessions.map((session, idx) => (
                  <div role="listitem" key={session.id} className={idx > 0 ? "mt-3" : ""}>
                    <SessionSection
                      session={session}
                      sessionIndex={idx}
                      onEditSession={(s) => setEditSession(s)}
                      onDeleteSession={(id) => setDeleteSessionTarget(id)}
                      onAddIssue={(sessionId) => setIssueDialogSessionId(sessionId)}
                      onToggleIssue={handleToggleIssue}
                      onEditIssue={(s, i) =>
                        setEditIssueContext({ sessionId: s.id, issue: i })
                      }
                      onDeleteIssue={(sessionId, issueId) =>
                        setDeleteIssueTarget({ sessionId, issueId })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* ---- 회차 추가 다이얼로그 ---- */}
      <SessionFormDialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        onSubmit={handleAddSession}
      />

      {/* ---- 회차 수정 다이얼로그 ---- */}
      <SessionFormDialog
        open={editSession !== null}
        onClose={() => setEditSession(null)}
        onSubmit={handleEditSession}
        editSession={editSession}
      />

      {/* ---- 이슈 추가 다이얼로그 ---- */}
      <IssueFormDialog
        open={issueDialogSessionId !== null}
        onClose={() => setIssueDialogSessionId(null)}
        onSubmit={handleAddIssue}
      />

      {/* ---- 이슈 수정 다이얼로그 ---- */}
      <IssueFormDialog
        open={editIssueContext !== null}
        onClose={() => setEditIssueContext(null)}
        onSubmit={handleEditIssue}
        editIssue={editIssueContext?.issue ?? null}
      />

      {/* ---- 이슈 삭제 확인 다이얼로그 ---- */}
      <ConfirmDialog
        open={deleteIssueTarget !== null}
        onOpenChange={(v) => !v && setDeleteIssueTarget(null)}
        title="이슈 삭제"
        description="이 이슈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDeleteIssue}
        destructive
      />

      {/* ---- 회차 삭제 확인 다이얼로그 ---- */}
      <ConfirmDialog
        open={deleteSessionTarget !== null}
        onOpenChange={(v) => !v && setDeleteSessionTarget(null)}
        title="회차 삭제"
        description="이 리허설 회차와 포함된 모든 이슈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDeleteSession}
        destructive
      />
    </>
  );
}
