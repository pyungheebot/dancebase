"use client";

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
import { ChevronDown, ChevronUp, Plus, Banknote } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePerformanceFee } from "@/hooks/use-performance-fee";
import type { PerformanceFeeEntry } from "@/types";

import {
  ROLE_ORDER,
  ROLE_LABELS,
  ROLE_COLORS,
  ADJ_TYPE_LABELS,
  formatKRW,
  type EntryFormData,
  type AdjFormData,
} from "./performance-fee/types";
import { EntryDialog } from "./performance-fee/entry-dialog";
import { AdjDialog } from "./performance-fee/adj-dialog";
import { EntryRow } from "./performance-fee/entry-row";
import { FeeStatsPanel } from "./performance-fee/fee-stats";

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function PerformanceFeeCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    addAdjustment,
    deleteAdjustment,
    settleEntry,
    unsettleEntry,
    stats,
  } = usePerformanceFee(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PerformanceFeeEntry | null>(null);
  const [adjTarget, setAdjTarget] = useState<PerformanceFeeEntry | null>(null);

  // 멤버 추가
  function handleAdd(data: EntryFormData) {
    addEntry({
      memberName: data.memberName.trim(),
      role: data.role,
      baseFee: parseInt(data.baseFee, 10),
      notes: data.notes.trim() || undefined,
    });
    setAddDialogOpen(false);
    toast.success(TOAST.PERFORMANCE_FEE.MEMBER_ADDED);
  }

  // 멤버 수정
  function handleEdit(data: EntryFormData) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      memberName: data.memberName.trim(),
      role: data.role,
      baseFee: parseInt(data.baseFee, 10),
      notes: data.notes.trim() || undefined,
    });
    if (ok) {
      toast.success(TOAST.PERFORMANCE_FEE.INFO_UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditTarget(null);
  }

  // 멤버 삭제
  function handleDelete(entryId: string, memberName: string) {
    const ok = deleteEntry(entryId);
    if (ok) {
      toast.success(`"${memberName}" 항목이 삭제되었습니다.`);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // 정산 토글
  function handleToggleSettle(entry: PerformanceFeeEntry) {
    if (entry.status === "settled") {
      const ok = unsettleEntry(entry.id);
      if (ok) {
        toast.success(TOAST.PERFORMANCE_FEE.SETTLE_CANCELLED);
      } else {
        toast.error(TOAST.PERFORMANCE_FEE.SETTLE_CANCEL_ERROR);
      }
    } else {
      const ok = settleEntry(entry.id);
      if (ok) {
        toast.success(TOAST.PERFORMANCE_FEE.SETTLED);
      } else {
        toast.error(TOAST.PERFORMANCE_FEE.SETTLE_ERROR);
      }
    }
  }

  // 수당/공제 추가
  function handleAddAdj(data: AdjFormData) {
    if (!adjTarget) return;
    const rawAmount = parseInt(data.amount, 10);
    const finalAmount =
      data.kind === "deduction" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const ok = addAdjustment(adjTarget.id, {
      type: data.type,
      label: data.label.trim() || ADJ_TYPE_LABELS[data.type],
      amount: finalAmount,
    });
    if (ok) {
      toast.success(TOAST.PERFORMANCE_FEE.ITEM_ADDED);
    } else {
      toast.error(TOAST.PERFORMANCE_FEE.ITEM_ADD_ERROR);
    }
    setAdjTarget(null);
  }

  // 수당/공제 삭제
  function handleDeleteAdj(entryId: string, adjId: string) {
    const ok = deleteAdjustment(entryId, adjId);
    if (!ok) toast.error(TOAST.PERFORMANCE_FEE.ITEM_DELETE_ERROR);
  }

  // 편집 초기 폼 생성
  function buildEditForm(e: PerformanceFeeEntry): EntryFormData {
    return {
      memberName: e.memberName,
      role: e.role,
      baseFee: String(e.baseFee),
      notes: e.notes ?? "",
    };
  }

  // 역할별 그룹핑
  const entriesByRole = ROLE_ORDER.reduce(
    (acc, role) => {
      acc[role] = entries.filter((e) => e.role === role);
      return acc;
    },
    {} as Record<string, PerformanceFeeEntry[]>
  );

  const collapsibleId = "performance-fee-content";

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader
              className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
              aria-expanded={isOpen}
              aria-controls={collapsibleId}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Banknote className="h-4 w-4 text-green-600" aria-hidden="true" />
                  공연 출연료 정산
                  {entries.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                      aria-label={`총 ${entries.length}명`}
                    >
                      {entries.length}명
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalAmount > 0 && (
                    <span
                      className="text-xs text-muted-foreground"
                      aria-label={`총 출연료 ${formatKRW(stats.totalAmount)}`}
                    >
                      {formatKRW(stats.totalAmount)}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent id={collapsibleId}>
            <CardContent className="pt-0 space-y-3">
              {/* 요약 통계 */}
              {entries.length > 0 && <FeeStatsPanel stats={stats} />}

              {/* 멤버 목록 */}
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  role="status"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <div
                  className="text-center py-6 text-muted-foreground"
                  role="status"
                >
                  <Banknote
                    className="h-8 w-8 mx-auto mb-2 opacity-30"
                    aria-hidden="true"
                  />
                  <p className="text-xs">등록된 출연료 정산 항목이 없습니다.</p>
                  <p className="text-[10px] mt-1">
                    아래 버튼을 눌러 멤버를 추가해보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ROLE_ORDER.filter(
                    (role) => entriesByRole[role].length > 0
                  ).map((role) => (
                    <div key={role} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[role]}`}
                        >
                          {ROLE_LABELS[role]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {entriesByRole[role].length}명 ·{" "}
                          {formatKRW(
                            entriesByRole[role].reduce(
                              (s, e) => s + e.finalAmount,
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div
                        className="space-y-1.5"
                        role="list"
                        aria-label={`${ROLE_LABELS[role]} 멤버 목록`}
                      >
                        {entriesByRole[role].map((entry) => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            onEdit={() => setEditTarget(entry)}
                            onDelete={() =>
                              handleDelete(entry.id, entry.memberName)
                            }
                            onToggleSettle={() => handleToggleSettle(entry)}
                            onAddAdj={() => setAdjTarget(entry)}
                            onDeleteAdj={(adjId) =>
                              handleDeleteAdj(entry.id, adjId)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 멤버 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => setAddDialogOpen(true)}
                aria-label="출연료 정산 멤버 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                멤버 추가
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 멤버 추가 다이얼로그 */}
      <EntryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="출연료 정산 멤버 추가"
      />

      {/* 멤버 수정 다이얼로그 */}
      {editTarget && (
        <EntryDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initial={buildEditForm(editTarget)}
          title="출연료 정산 멤버 수정"
        />
      )}

      {/* 수당/공제 항목 추가 다이얼로그 */}
      {adjTarget && (
        <AdjDialog
          open={!!adjTarget}
          onClose={() => setAdjTarget(null)}
          onSubmit={handleAddAdj}
          memberName={adjTarget.memberName}
        />
      )}
    </>
  );
}
