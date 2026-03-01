"use client";

// ============================================================
// 이슈 행 컴포넌트 - React.memo로 불필요한 리렌더 방지
// ============================================================

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  User,
  Clock,
} from "lucide-react";
import {
  CATEGORY_COLORS,
  SEVERITY_COLORS,
  SEVERITY_DOT_COLORS,
} from "./dress-rehearsal-types";
import type { DressRehearsalIssue } from "@/types";

interface IssueRowProps {
  issue: DressRehearsalIssue;
  onToggle: (issueId: string) => void;
  onEdit: (issue: DressRehearsalIssue) => void;
  onDelete: (issueId: string) => void;
}

export const IssueRow = memo(function IssueRow({
  issue,
  onToggle,
  onEdit,
  onDelete,
}: IssueRowProps) {
  return (
    <div
      role="listitem"
      className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-colors ${
        issue.resolved
          ? "bg-green-50 border-green-100"
          : "bg-card border-gray-100"
      }`}
    >
      {/* 해결 상태 토글 버튼 */}
      <button
        onClick={() => onToggle(issue.id)}
        className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label={issue.resolved ? "미해결로 변경" : "해결 처리"}
        aria-pressed={issue.resolved}
        title={issue.resolved ? "미해결로 변경" : "해결 처리"}
      >
        {issue.resolved ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" aria-hidden="true" />
        )}
      </button>

      {/* 내용 영역 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-[10px] text-gray-500 font-medium">
            {issue.section}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[issue.category]}`}
          >
            {issue.category}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[issue.severity]}`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${SEVERITY_DOT_COLORS[issue.severity]}`}
              aria-hidden="true"
            />
            {issue.severity}
          </Badge>
        </div>

        <span
          className={`font-medium block leading-snug ${
            issue.resolved ? "line-through text-gray-400" : ""
          }`}
        >
          {issue.content}
        </span>

        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
          {issue.assignee && (
            <span className="flex items-center gap-0.5">
              <User className="h-2.5 w-2.5" aria-hidden="true" />
              {issue.assignee}
            </span>
          )}
          {issue.resolvedAt && issue.resolved && (
            <span className="flex items-center gap-0.5 text-green-600">
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
              {new Date(issue.resolvedAt).toLocaleString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              해결
            </span>
          )}
        </div>
      </div>

      {/* 편집/삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(issue)}
          aria-label="이슈 수정"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => onDelete(issue.id)}
          aria-label="이슈 삭제"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
