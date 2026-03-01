"use client";

import React, { memo } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Tag } from "lucide-react";

import type { PerfTicketTier } from "@/types";
import type { PerfTicketTierSummary } from "@/hooks/use-performance-ticket";
import { formatKRW } from "./performance-ticket-types";

// ============================================================
// 등급 아이템 (React.memo)
// ============================================================

const TierListItem = memo(function TierListItem({
  summary,
  onEdit,
  onDelete,
}: {
  summary: PerfTicketTierSummary;
  onEdit: (tier: PerfTicketTier) => void;
  onDelete: (tierId: string) => void;
}) {
  const { tier } = summary;
  const itemId = `tier-item-${tier.id}`;

  return (
    <li
      role="listitem"
      aria-labelledby={itemId}
      className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: tier.color }}
        />
        <div>
          <p id={itemId} className="font-medium">
            {tier.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatKRW(tier.price)} / 총 {tier.totalQuantity}석
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right" aria-label={`확정 ${summary.confirmedQty}석, 예약 ${summary.reservedQty}석, 잔여 ${summary.remainingQty}석`}>
          <p className="font-medium">
            확정 {summary.confirmedQty} / 예약 {summary.reservedQty}
          </p>
          <p className="text-[10px] text-muted-foreground">
            잔여 {summary.remainingQty}석
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={`${tier.name} 등급 수정`}
            onClick={() => onEdit(tier)}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            aria-label={`${tier.name} 등급 삭제`}
            onClick={() => onDelete(tier.id)}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
});

// ============================================================
// 등급 목록 섹션
// ============================================================

export const TierListSection = memo(function TierListSection({
  open,
  onOpenChange,
  tierSummary,
  onEdit,
  onDelete,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tierSummary: PerfTicketTierSummary[];
  onEdit: (tier: PerfTicketTier) => void;
  onDelete: (tierId: string) => void;
  onAdd: () => void;
}) {
  const headingId = "tier-list-heading";

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-foreground/80 transition-colors"
          aria-expanded={open}
          aria-controls="tier-list-content"
        >
          <span id={headingId} className="flex items-center gap-1">
            <Tag className="h-3 w-3" aria-hidden="true" />
            티켓 등급 ({tierSummary.length})
          </span>
          {open ? (
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent id="tier-list-content">
        <div className="pt-2 space-y-2">
          <ul role="list" aria-labelledby={headingId} className="space-y-2">
            {tierSummary.map((s) => (
              <TierListItem
                key={s.tier.id}
                summary={s}
                onEdit={onEdit}
                onDelete={(id) => {
                  onDelete(id);
                  toast.success(TOAST.TICKET.GRADE_DELETED);
                }}
              />
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full gap-1"
            onClick={onAdd}
            aria-label="새 티켓 등급 추가"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            등급 추가
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
