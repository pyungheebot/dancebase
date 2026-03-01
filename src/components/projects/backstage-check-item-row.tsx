"use client";

// ============================================================
// 백스테이지 체크 항목 행 컴포넌트 (React.memo 최적화)
// ============================================================

import { memo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
} from "lucide-react";
import type { BackstageCheckItem } from "@/types";
import { priorityLabel, priorityBadgeClass } from "./backstage-check-types";

interface CheckItemRowProps {
  item: BackstageCheckItem;
  memberNames: string[];
  /** 체크 토글 콜백 (itemId) */
  onToggle: (itemId: string) => void;
  /** 항목 삭제 콜백 (itemId) */
  onRemove: (itemId: string) => void;
  /** 세션 완료 여부 (완료된 세션은 체크 불가) */
  isCompleted: boolean;
}

/**
 * 개별 체크 항목 행
 * - 멤버가 2명 이상이면 체크 시 체크자 이름 인라인 선택 UI 표시
 * - React.memo로 리렌더링 최소화
 */
export const CheckItemRow = memo(function CheckItemRow({
  item,
  memberNames,
  onToggle,
  onRemove,
  isCompleted,
}: CheckItemRowProps) {
  // 체크자 이름 (기본값: 첫 번째 멤버)
  const [checkerName, setCheckerName] = useState(memberNames[0] ?? "");
  // 체크자 선택 인라인 UI 표시 여부
  const [showNameSelect, setShowNameSelect] = useState(false);

  const handleToggle = () => {
    if (isCompleted) return;
    // 미체크 + 멤버가 2명 이상이면 체크자 선택 UI 표시
    if (!item.checked && memberNames.length > 1) {
      setShowNameSelect(true);
      return;
    }
    onToggle(item.id);
  };

  const handleConfirmCheck = (name: string) => {
    setCheckerName(name);
    setShowNameSelect(false);
    onToggle(item.id);
  };

  return (
    <div
      role="listitem"
      className={`flex items-start gap-2 px-2 py-1.5 rounded-md border transition-colors ${
        item.checked
          ? "bg-muted/30 border-muted"
          : "bg-card border-border hover:bg-muted/10"
      }`}
    >
      {/* 체크박스 버튼 */}
      <button
        onClick={handleToggle}
        className="flex-shrink-0 mt-0.5"
        disabled={isCompleted}
        aria-label={item.checked ? `${item.title} 체크 해제` : `${item.title} 체크`}
        aria-checked={item.checked}
        role="checkbox"
        title={isCompleted ? "세션이 완료되었습니다" : undefined}
      >
        {item.checked ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* 항목 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 항목 제목 */}
          <span
            className={`text-xs font-medium ${
              item.checked ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.title}
          </span>

          {/* 우선순위 배지 */}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${priorityBadgeClass(item.priority)}`}
          >
            {priorityLabel(item.priority)}
          </Badge>

          {/* 담당자 표시 */}
          {item.assignedTo && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              @{item.assignedTo}
            </span>
          )}
        </div>

        {/* 설명 */}
        {item.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* 체크 완료 정보 (체크자 + 시간) */}
        {item.checked && item.checkedBy && item.checkedAt && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-green-600">
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            <span>
              {item.checkedBy} ·{" "}
              {new Date(item.checkedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        )}

        {/* 체크자 인라인 선택 UI */}
        {showNameSelect && (
          <div className="mt-1.5 flex flex-wrap gap-1" role="group" aria-label="체크한 사람 선택">
            <span className="text-[10px] text-muted-foreground self-center">
              체크한 사람:
            </span>
            {memberNames.map((name) => (
              <button
                key={name}
                onClick={() => handleConfirmCheck(name)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  checkerName === name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/80 border-border"
                }`}
                aria-pressed={checkerName === name}
              >
                {name}
              </button>
            ))}
            <button
              onClick={() => setShowNameSelect(false)}
              className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted/80 text-muted-foreground"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* 삭제 버튼 (완료된 세션에서는 숨김) */}
      {!isCompleted && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id)}
          aria-label={`${item.title} 항목 삭제`}
          title="항목 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});
