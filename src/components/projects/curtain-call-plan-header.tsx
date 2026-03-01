"use client";

import { Clock, Music, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "./curtain-call-types";
import type { CurtainCallPlan } from "@/types";

// ============================================================
// 플랜 헤더 - 현재 선택된 플랜 정보 + 수정/삭제 버튼
// ============================================================

interface PlanHeaderProps {
  plan: CurtainCallPlan;
  totalDuration: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function CurtainCallPlanHeader({
  plan,
  totalDuration,
  onEdit,
  onDelete,
}: PlanHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-pink-200 bg-pink-50 px-3 py-2">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-pink-800">{plan.planName}</p>
        {plan.musicTrack && (
          <div className="flex items-center gap-1">
            <Music className="h-3 w-3 text-pink-500" aria-hidden="true" />
            <span className="text-[10px] text-pink-600">{plan.musicTrack}</span>
          </div>
        )}
        {plan.notes && (
          <p className="text-[10px] text-pink-600 mt-0.5">{plan.notes}</p>
        )}
        {totalDuration > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-pink-500" aria-hidden="true" />
            <span className="text-[10px] text-pink-600">
              총 소요시간: {formatDuration(totalDuration)}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="플랜 관리">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onEdit}
          aria-label="플랜 수정"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="플랜 삭제"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
