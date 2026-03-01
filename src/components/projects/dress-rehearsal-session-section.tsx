"use client";

// ============================================================
// 회차 섹션 컴포넌트 - 이슈 목록 + 필터 포함
// React.memo로 session 데이터 변경 시에만 리렌더
// ============================================================

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { IssueRow } from "./dress-rehearsal-issue-row";
import type {
  DressRehearsalSession,
  DressRehearsalIssue,
} from "@/types";

/** 이슈 필터 상태 */
type FilterState = "all" | "unresolved" | "resolved";

interface SessionSectionProps {
  session: DressRehearsalSession;
  /** 0-based 인덱스, 화면에는 +1로 표시 */
  sessionIndex: number;
  onEditSession: (session: DressRehearsalSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddIssue: (sessionId: string) => void;
  onToggleIssue: (sessionId: string, issueId: string) => void;
  onEditIssue: (session: DressRehearsalSession, issue: DressRehearsalIssue) => void;
  onDeleteIssue: (sessionId: string, issueId: string) => void;
}

export const SessionSection = memo(function SessionSection({
  session,
  sessionIndex,
  onEditSession,
  onDeleteSession,
  onAddIssue,
  onToggleIssue,
  onEditIssue,
  onDeleteIssue,
}: SessionSectionProps) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FilterState>("all");

  const resolvedCount = session.issues.filter((i) => i.resolved).length;
  const totalCount = session.issues.length;

  // 필터에 따라 이슈 목록 필터링
  const filteredIssues = session.issues.filter((issue) => {
    if (filter === "unresolved") return !issue.resolved;
    if (filter === "resolved") return issue.resolved;
    return true;
  });

  const sessionLabel = `${sessionIndex + 1}회차 - ${session.date}${session.time ? ` ${session.time}` : ""} ${session.venue}`;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 회차 헤더 */}
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-1 min-w-0"
              aria-label={`${sessionLabel} ${open ? "접기" : "펼치기"}`}
              aria-expanded={open}
            >
              <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                {sessionIndex + 1}회차
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 flex-wrap min-w-0">
                <span className="flex items-center gap-0.5 flex-shrink-0">
                  <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                  {session.date}
                </span>
                {session.time && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                    {session.time}
                  </span>
                )}
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
                  {session.venue}
                </span>
              </div>
              {open ? (
                <ChevronUp className="h-3 w-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* 우측 액션 버튼 그룹 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {totalCount > 0 && (
              <span className="text-[10px] text-gray-500 mr-1" aria-label={`해결 ${resolvedCount}건, 전체 ${totalCount}건`}>
                해결 {resolvedCount}/{totalCount}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEditSession(session)}
              aria-label="회차 수정"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
              onClick={() => onDeleteSession(session.id)}
              aria-label="회차 삭제"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => onAddIssue(session.id)}
              aria-label="이슈 추가"
            >
              <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
              이슈
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-2 space-y-2">
            {/* 이슈 필터 버튼 */}
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="이슈 필터">
                <button
                  onClick={() => setFilter("all")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filter === "all"
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-background text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                  aria-pressed={filter === "all"}
                >
                  전체 {totalCount}
                </button>
                <button
                  onClick={() => setFilter("unresolved")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filter === "unresolved"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-background text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                  aria-pressed={filter === "unresolved"}
                >
                  미해결 {totalCount - resolvedCount}
                </button>
                <button
                  onClick={() => setFilter("resolved")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filter === "resolved"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-background text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                  aria-pressed={filter === "resolved"}
                >
                  해결 {resolvedCount}
                </button>
              </div>
            )}

            {/* 이슈 목록 */}
            {totalCount === 0 ? (
              <div className="text-center py-4 text-[10px] text-gray-400">
                이슈가 없습니다. 이슈 추가 버튼을 눌러 기록하세요.
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-gray-400">
                해당 필터에 맞는 이슈가 없습니다.
              </div>
            ) : (
              <div
                className="space-y-1.5"
                role="list"
                aria-label={`${sessionIndex + 1}회차 이슈 목록`}
              >
                {filteredIssues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onToggle={(issueId) => onToggleIssue(session.id, issueId)}
                    onEdit={(i) => onEditIssue(session, i)}
                    onDelete={(issueId) => onDeleteIssue(session.id, issueId)}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});

// 빈 상태 컴포넌트 (회차 없을 때)
export function EmptySessionState() {
  return (
    <div className="text-center py-8 text-xs text-gray-400 space-y-2">
      <ClipboardList className="h-10 w-10 mx-auto text-gray-200" aria-hidden="true" />
      <p>등록된 리허설 회차가 없습니다.</p>
      <p className="text-[10px]">
        회차 추가 버튼을 눌러 드레스 리허설을 기록하세요.
      </p>
    </div>
  );
}
