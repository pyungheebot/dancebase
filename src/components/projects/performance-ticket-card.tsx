"use client";

import { useState } from "react";
import { Ticket, Target, Plus, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { usePerformanceTicket } from "@/hooks/use-performance-ticket";
import type { PerfTicketTier, PerfTicketAllocation } from "@/types";

import { TierDialog, AllocationDialog, GoalDialog } from "./performance-ticket-dialogs";
import { RevenueSummaryCards, SalesProgressBar, TierDistributionChart } from "./performance-ticket-stats";
import { TierListSection } from "./performance-ticket-tier-list";
import { AllocationListSection } from "./performance-ticket-allocation-list";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function PerformanceTicketCard({ projectId }: { projectId: string }) {
  const {
    tiers,
    allocations,
    salesGoal,
    loading,
    stats,
    addTier,
    updateTier,
    deleteTier,
    addAllocation,
    updateAllocation,
    cancelAllocation,
    deleteAllocation,
    updateSalesGoal,
  } = usePerformanceTicket(projectId);

  // 섹션 접힘 상태
  const [tiersOpen, setTiersOpen] = useState(true);
  const [allocationsOpen, setAllocationsOpen] = useState(true);
  const [chartOpen, setChartOpen] = useState(true);

  // 다이얼로그 상태
  const [tierDialog, setTierDialog] = useState<{
    open: boolean;
    initial?: PerfTicketTier;
  }>({ open: false });
  const [allocationDialog, setAllocationDialog] = useState<{
    open: boolean;
    initial?: PerfTicketAllocation;
  }>({ open: false });
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4" aria-hidden="true" />
            공연 티켓 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4" aria-hidden="true" />
              공연 티켓 관리
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              aria-label="판매 목표 설정 열기"
              onClick={() => setGoalDialogOpen(true)}
            >
              <Target className="h-3 w-3" aria-hidden="true" />
              목표 설정
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 빈 상태 */}
          {tiers.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg"
              aria-label="등록된 티켓 등급 없음"
            >
              <Ticket className="h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
              <p className="text-sm font-medium">등록된 티켓 등급이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                VIP, 일반석 등 등급을 먼저 추가해주세요.
              </p>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setTierDialog({ open: true })}
                aria-label="첫 번째 티켓 등급 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                등급 추가
              </Button>
            </div>
          )}

          {tiers.length > 0 && (
            <>
              {/* 매출 요약 */}
              <RevenueSummaryCards stats={stats} />

              {/* 진행률 바 */}
              <SalesProgressBar
                progress={stats.salesProgress}
                sold={stats.soldTickets}
                total={stats.totalTickets}
                goal={salesGoal}
              />

              {/* 등급별 분포 차트 */}
              <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-foreground/80 transition-colors"
                    aria-expanded={chartOpen}
                    aria-controls="chart-content"
                  >
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      판매 분포
                    </span>
                    {chartOpen ? (
                      <ChevronUp className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent id="chart-content">
                  <div className="pt-2">
                    <TierDistributionChart tierSummary={stats.tierSummary} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="border-t" role="separator" />

              {/* 티켓 등급 목록 */}
              <TierListSection
                open={tiersOpen}
                onOpenChange={setTiersOpen}
                tierSummary={stats.tierSummary}
                onEdit={(tier) => setTierDialog({ open: true, initial: tier })}
                onDelete={(id) => deleteTier(id)}
                onAdd={() => setTierDialog({ open: true })}
              />

              <div className="border-t" role="separator" />

              {/* 배분 내역 */}
              <AllocationListSection
                open={allocationsOpen}
                onOpenChange={setAllocationsOpen}
                allocations={allocations}
                tiers={tiers}
                onEdit={(alloc) => setAllocationDialog({ open: true, initial: alloc })}
                onCancel={(id) => cancelAllocation(id)}
                onDelete={(id) => deleteAllocation(id)}
                onAdd={() => setAllocationDialog({ open: true })}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* 등급 다이얼로그 */}
      <TierDialog
        open={tierDialog.open}
        initial={tierDialog.initial}
        onClose={() => setTierDialog({ open: false })}
        onSave={(data) => {
          if (tierDialog.initial) {
            updateTier(tierDialog.initial.id, data);
            toast.success(TOAST.TICKET.GRADE_UPDATED);
          } else {
            addTier(data);
            toast.success(TOAST.TICKET.GRADE_ADDED);
          }
        }}
      />

      {/* 배분 다이얼로그 */}
      <AllocationDialog
        open={allocationDialog.open}
        initial={allocationDialog.initial}
        tiers={tiers}
        onClose={() => setAllocationDialog({ open: false })}
        onSave={(data) => {
          if (allocationDialog.initial) {
            updateAllocation(allocationDialog.initial.id, data);
            toast.success(TOAST.TICKET.ALLOCATION_UPDATED);
          } else {
            addAllocation(data);
            toast.success(TOAST.TICKET.ALLOCATION_ADDED);
          }
        }}
      />

      {/* 목표 설정 다이얼로그 */}
      <GoalDialog
        open={goalDialogOpen}
        current={salesGoal}
        onClose={() => setGoalDialogOpen(false)}
        onSave={(goal) => {
          updateSalesGoal(goal);
          toast.success(
            goal
              ? `목표가 ${goal}석으로 설정되었습니다.`
              : "목표가 해제되었습니다."
          );
        }}
      />
    </>
  );
}
