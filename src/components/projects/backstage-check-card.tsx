"use client";

// ============================================================
// 공연 백스테이지 체크 메인 카드
// - 세션 목록 표시, 세션 생성/삭제, 항목 추가/삭제/체크
// - 서브컴포넌트: CreateSessionDialog, AddItemDialog, SessionPanel
// ============================================================

import { useState } from "react";
import { useBackstageCheck } from "@/hooks/use-backstage-check";
import type { BackstageCategory } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { CreateSessionDialog } from "./backstage-check-dialogs";
import { AddItemDialog } from "./backstage-check-dialogs";
import { SessionPanel } from "./backstage-check-session-panel";
import { progressBadgeClass } from "./backstage-check-types";

// ── 메인 카드 Props ──
interface BackstageCheckCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

/**
 * 공연 백스테이지 체크 카드
 * - Collapsible로 펼침/접힘 지원
 * - 활성 세션 진행률 헤더 배지 표시
 */
export function BackstageCheckCard({
  groupId,
  projectId,
  memberNames,
}: BackstageCheckCardProps) {
  // 카드 펼침 상태
  const [open, setOpen] = useState(true);
  // 세션 생성 다이얼로그 표시 여부
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // 항목 추가 대상 세션 ID (null이면 다이얼로그 닫힘)
  const [addItemDialogSessionId, setAddItemDialogSessionId] = useState<
    string | null
  >(null);

  // 백스테이지 체크 훅
  const {
    sessions,
    totalSessions,
    activeSession,
    checkProgress,
    createSession,
    deleteSession,
    addItem,
    removeItem,
    toggleCheck,
    completeSession,
  } = useBackstageCheck(groupId, projectId);

  // ── 세션 생성 핸들러 ──
  const handleCreateSession = (eventName: string, eventDate: string) => {
    const ok = createSession(eventName, eventDate);
    if (ok) {
      toast.success(`"${eventName}" 세션이 생성되었습니다.`);
      setOpen(true);
    } else {
      toast.error(TOAST.BACKSTAGE_CHECK.SESSION_CREATE_ERROR);
    }
  };

  // ── 항목 추가 핸들러 ──
  const handleAddItem = (
    category: BackstageCategory,
    title: string,
    description: string,
    assignedTo: string,
    priority: "high" | "medium" | "low"
  ) => {
    if (!addItemDialogSessionId) return;
    const ok = addItem(
      addItemDialogSessionId,
      category,
      title,
      description || undefined,
      assignedTo || undefined,
      priority
    );
    if (ok) {
      toast.success(TOAST.BACKSTAGE_CHECK.CHECK_ITEM_ADDED);
    } else {
      toast.error(TOAST.BACKSTAGE_CHECK.CHECK_ITEM_ADD_ERROR);
    }
  };

  // ── 세션 완료 핸들러 ──
  const handleCompleteSession = (sessionId: string): boolean => {
    return completeSession(sessionId);
  };

  // 활성 세션 진행률 계산
  const hasActiveSession = !!activeSession;
  const activePct =
    checkProgress.total === 0
      ? 0
      : Math.round((checkProgress.checked / checkProgress.total) * 100);

  return (
    <>
      {/* 세션 생성 다이얼로그 */}
      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSession}
      />

      {/* 항목 추가 다이얼로그 */}
      <AddItemDialog
        open={!!addItemDialogSessionId}
        onOpenChange={(o) => {
          if (!o) setAddItemDialogSessionId(null);
        }}
        memberNames={memberNames}
        onSubmit={handleAddItem}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* ── 카드 헤더 ── */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
              aria-label={`공연 백스테이지 체크 ${open ? "접기" : "펼치기"}`}
              aria-expanded={open}
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              )}
              <ClipboardList className="h-4 w-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">공연 백스테이지 체크</span>

              {/* 세션 수 표시 */}
              {totalSessions > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {totalSessions}개 세션
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          {/* 헤더 우측: 진행률 배지 + 세션 추가 버튼 */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 활성 세션 진행률 배지 */}
            {hasActiveSession && checkProgress.total > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${progressBadgeClass(activePct)}`}
                aria-label={`활성 세션 진행률 ${activePct}%`}
              >
                {activePct}% 체크
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setCreateDialogOpen(true);
                setOpen(true);
              }}
              aria-label="새 백스테이지 체크 세션 추가"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              세션 추가
            </Button>
          </div>
        </div>

        {/* ── 카드 바디 ── */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
            {/* 세션 없음 안내 */}
            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList
                  className="h-8 w-8 mx-auto mb-2 opacity-30"
                  aria-hidden="true"
                />
                <p className="text-xs">등록된 세션이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;세션 추가&rdquo; 버튼으로 백스테이지 체크를
                  시작하세요.
                </p>
              </div>
            )}

            {/* 세션 목록 */}
            {sessions.length > 0 && (
              <div
                className="space-y-2"
                role="list"
                aria-label="백스테이지 체크 세션 목록"
              >
                {sessions.map((session) => (
                  <div key={session.id} role="listitem">
                    <SessionPanel
                      session={session}
                      memberNames={memberNames}
                      onDeleteSession={deleteSession}
                      onAddItem={(sessionId) =>
                        setAddItemDialogSessionId(sessionId)
                      }
                      onToggleCheck={toggleCheck}
                      onRemoveItem={removeItem}
                      onCompleteSession={handleCompleteSession}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
