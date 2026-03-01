"use client";

import React, { memo } from "react";
import { Pencil, Trash2, X, Plus, CheckCircle2, Clock, XCircle, Users, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import type { PerfTicketTier, PerfTicketAllocation, PerfAllocationStatus } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "./performance-ticket-types";

// ============================================================
// 상태 아이콘 맵
// ============================================================

const STATUS_ICONS: Record<PerfAllocationStatus, React.ReactElement> = {
  reserved: <Clock className="h-3 w-3" aria-hidden="true" />,
  confirmed: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  cancelled: <XCircle className="h-3 w-3" aria-hidden="true" />,
};

// ============================================================
// 배분 행 (React.memo)
// ============================================================

const AllocationRow = memo(function AllocationRow({
  alloc,
  tier,
  onEdit,
  onCancel,
  onDelete,
}: {
  alloc: PerfTicketAllocation;
  tier: PerfTicketTier | undefined;
  onEdit: (alloc: PerfTicketAllocation) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusLabel = STATUS_LABELS[alloc.status];

  return (
    <tr
      className={`border-b last:border-0 ${
        alloc.status === "cancelled" ? "opacity-50" : ""
      }`}
      aria-label={`${alloc.recipientName}, ${tier?.name ?? "등급 없음"}, ${alloc.quantity}석, ${statusLabel}`}
    >
      <td className="px-3 py-2">
        <p className="font-medium">{alloc.recipientName}</p>
        {alloc.notes && (
          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={alloc.notes}>
            {alloc.notes}
          </p>
        )}
      </td>
      <td className="px-3 py-2 hidden sm:table-cell">
        {tier && (
          <span className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: tier.color }}
            />
            {tier.name}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-medium">
        <span aria-label={`${alloc.quantity}석`}>{alloc.quantity}</span>
      </td>
      <td className="px-3 py-2 text-center">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 gap-0.5 ${STATUS_COLORS[alloc.status]}`}
          aria-label={statusLabel}
        >
          {STATUS_ICONS[alloc.status]}
          {statusLabel}
        </Badge>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={`${alloc.recipientName} 배분 수정`}
            onClick={() => onEdit(alloc)}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          {alloc.status !== "cancelled" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700"
              aria-label={`${alloc.recipientName} 배분 취소`}
              onClick={() => onCancel(alloc.id)}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            aria-label={`${alloc.recipientName} 배분 삭제`}
            onClick={() => onDelete(alloc.id)}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

// ============================================================
// 배분 목록 섹션
// ============================================================

export const AllocationListSection = memo(function AllocationListSection({
  open,
  onOpenChange,
  allocations,
  tiers,
  onEdit,
  onCancel,
  onDelete,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allocations: PerfTicketAllocation[];
  tiers: PerfTicketTier[];
  onEdit: (alloc: PerfTicketAllocation) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const headingId = "allocation-list-heading";
  const liveRegionId = "allocation-live-region";

  function handleCancel(id: string) {
    onCancel(id);
    toast.success(TOAST.TICKET.CANCELLED);
  }

  function handleDelete(id: string) {
    onDelete(id);
    toast.success(TOAST.TICKET.ALLOCATION_DELETED);
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-foreground/80 transition-colors"
          aria-expanded={open}
          aria-controls="allocation-list-content"
        >
          <span id={headingId} className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            배분 내역 ({allocations.length})
          </span>
          {open ? (
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent id="allocation-list-content">
        <div className="pt-2 space-y-2">
          {/* 동적 상태 변경 알림 */}
          <div
            id={liveRegionId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />

          {allocations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              배분 내역이 없습니다.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs" aria-labelledby={headingId}>
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th scope="col" className="text-left px-3 py-2 font-medium">
                      수령인
                    </th>
                    <th
                      scope="col"
                      className="text-left px-3 py-2 font-medium hidden sm:table-cell"
                    >
                      등급
                    </th>
                    <th scope="col" className="text-right px-3 py-2 font-medium">
                      수량
                    </th>
                    <th scope="col" className="text-center px-3 py-2 font-medium">
                      상태
                    </th>
                    <th scope="col" className="px-2 py-2">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => {
                    const tier = tiers.find((t) => t.id === alloc.tierId);
                    return (
                      <AllocationRow
                        key={alloc.id}
                        alloc={alloc}
                        tier={tier}
                        onEdit={onEdit}
                        onCancel={handleCancel}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full gap-1"
            onClick={onAdd}
            aria-label="새 배분 추가"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            배분 추가
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
