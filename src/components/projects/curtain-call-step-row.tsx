"use client";

import { memo } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BOW_TYPE_COLORS, BOW_TYPE_LABELS, formatDuration } from "./curtain-call-types";
import type { CurtainCallStep } from "@/types";

// ============================================================
// 스텝 행 컴포넌트 (타임라인)
// ============================================================

interface StepRowProps {
  step: CurtainCallStep;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const CurtainCallStepRow = memo(function CurtainCallStepRow({
  step,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StepRowProps) {
  return (
    <li className="flex gap-2.5" role="listitem">
      {/* 타임라인 세로선 + 번호 */}
      <div className="flex flex-col items-center w-6 flex-shrink-0" aria-hidden="true">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 border-2 border-pink-400 text-[9px] font-bold text-pink-700 z-10 flex-shrink-0">
          {step.order}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 bg-pink-200 mt-0.5"
            style={{ minHeight: "20px" }}
          />
        )}
      </div>

      {/* 스텝 내용 */}
      <div className="flex-1 min-w-0 pb-2">
        <article className="rounded-md border bg-card hover:bg-muted/20 transition-colors p-2">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0 space-y-1">
              {/* 설명 + 배지 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium">{step.description}</span>
                {step.bowType && (
                  <Badge
                    className={`text-[9px] px-1 py-0 border ${BOW_TYPE_COLORS[step.bowType]}`}
                  >
                    {BOW_TYPE_LABELS[step.bowType]}
                  </Badge>
                )}
              </div>

              {/* 출연자 */}
              {step.performers.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {step.performers.length === 1 ? (
                    <User
                      className="h-3 w-3 text-muted-foreground flex-shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Users
                      className="h-3 w-3 text-muted-foreground flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {step.performers.join(", ")}
                  </span>
                </div>
              )}

              {/* 위치 + 소요시간 */}
              <div className="flex items-center gap-2 flex-wrap">
                {step.position && (
                  <div className="flex items-center gap-0.5">
                    <MapPin
                      className="h-2.5 w-2.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {step.position}
                    </span>
                  </div>
                )}
                {step.durationSeconds != null && step.durationSeconds > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Clock
                      className="h-2.5 w-2.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDuration(step.durationSeconds)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-0.5 flex-shrink-0" role="group" aria-label={`${step.description} 순서 및 편집`}>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label="위로 이동"
              >
                <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label="아래로 이동"
              >
                <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onEdit}
                aria-label="스텝 수정"
              >
                <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
                aria-label="스텝 삭제"
              >
                <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </article>
      </div>
    </li>
  );
});
