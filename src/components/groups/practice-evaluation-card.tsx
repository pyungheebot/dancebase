"use client";

/**
 * 그룹 연습 평가표 - 메인 카드 컨테이너
 *
 * Collapsible 카드 안에 세션 목록과 통계를 렌더링합니다.
 * 세부 UI는 서브컴포넌트에 위임합니다.
 */

import { useState } from "react";
import { ClipboardCheck, ChevronDown, ChevronUp, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePracticeEvaluation } from "@/hooks/use-practice-evaluation";
import { type NewSessionForm } from "./practice-evaluation-types";
import { NewSessionDialog } from "./practice-evaluation-dialogs";
import { TopPerformersPanel } from "./practice-evaluation-stats";
import { SessionListItem } from "./practice-evaluation-session-panel";

// ─── Props ────────────────────────────────────────────────────

interface PracticeEvaluationCardProps {
  groupId: string;
  memberNames?: string[];
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function PracticeEvaluationCard({
  groupId,
  memberNames = [],
}: PracticeEvaluationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const {
    sessions,
    addSession,
    deleteSession,
    addCriteria,
    deleteCriteria,
    saveMemberResult,
    deleteMemberResult,
    getMemberTrend,
    stats,
  } = usePracticeEvaluation(groupId);

  function handleAddSession(form: NewSessionForm): boolean {
    const id = addSession({
      date: form.date,
      title: form.title,
      evaluator: form.evaluator,
      notes: form.notes || undefined,
      criteria: form.criteria.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        maxScore: c.maxScore,
      })),
    });
    if (id) {
      setExpandedSession(id);
      return true;
    }
    return false;
  }

  function handleSessionToggle(sessionId: string) {
    setExpandedSession((prev) => (prev === sessionId ? null : sessionId));
  }

  function handleSessionDelete(sessionId: string) {
    deleteSession(sessionId);
    if (expandedSession === sessionId) setExpandedSession(null);
  }

  const headingId = "practice-evaluation-heading";
  const contentId = "practice-evaluation-content";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-gray-100 rounded-xl bg-card shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-controls={contentId}
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen((v) => !v);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              <span id={headingId} className="text-sm font-semibold text-gray-800">
                그룹 연습 평가표
              </span>
              {stats.totalSessions > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-50">
                  {stats.totalSessions}회
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 요약 통계 */}
              {stats.totalSessions > 0 && (
                <div
                  className="hidden sm:flex items-center gap-3 mr-2"
                  aria-label="요약 통계"
                >
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Star className="h-3 w-3 text-yellow-400" aria-hidden="true" />
                    평균 {stats.averageScore}점
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {stats.topPerformers.length}명 집계
                  </div>
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div id={contentId} role="region" aria-labelledby={headingId}>
            <Separator />
            <div className="p-4 space-y-4">
              {/* 상위 성과자 */}
              <TopPerformersPanel performers={stats.topPerformers} />

              {/* 액션 바 */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500" aria-live="polite">
                  총 {stats.totalSessions}개 세션
                </p>
                <NewSessionDialog onAdd={handleAddSession} />
              </div>

              {/* 세션 목록 */}
              {sessions.length === 0 ? (
                <div
                  className="text-center py-6"
                  role="status"
                  aria-live="polite"
                  aria-label="평가 세션 없음"
                >
                  <ClipboardCheck
                    className="h-8 w-8 text-gray-200 mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-gray-400">
                    아직 평가 세션이 없습니다.
                  </p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    새 평가 세션을 만들어 멤버를 평가해보세요.
                  </p>
                </div>
              ) : (
                <ul
                  role="list"
                  className="space-y-2"
                  aria-label="평가 세션 목록"
                >
                  {sessions.map((session) => (
                    <li key={session.id} role="listitem">
                      <SessionListItem
                        session={session}
                        isExpanded={expandedSession === session.id}
                        memberNames={memberNames}
                        onToggle={handleSessionToggle}
                        onDelete={handleSessionDelete}
                        onSaveMember={saveMemberResult}
                        onDeleteMember={deleteMemberResult}
                        onAddCriteria={addCriteria}
                        onDeleteCriteria={deleteCriteria}
                        getMemberTrend={getMemberTrend}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
