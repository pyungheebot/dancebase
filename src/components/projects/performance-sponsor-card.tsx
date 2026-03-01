"use client";

// ============================================================
// 공연 후원/스폰서 관리 — 메인 카드 (컨테이너)
// ============================================================

import { useState } from "react";
import { HandHeart, Plus, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  usePerformanceSponsor,
} from "@/hooks/use-performance-sponsor";
import type { PerfSponsorEntry } from "@/types";

import {
  TIER_ORDER,
  TIER_LABELS,
  TIER_BADGE_CLASS,
  EMPTY_FORM,
  sponsorToForm,
  formToSponsorParams,
  formatKRW,
  type SponsorFormData,
} from "./performance-sponsor-types";
import { SponsorDialog, GoalDialog } from "./performance-sponsor-dialogs";
import { SponsorRow } from "./performance-sponsor-row";
import {
  SponsorSummaryStats,
  GoalProgressBar,
  TierDistributionChart,
} from "./performance-sponsor-stats";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function PerformanceSponsorCard({ projectId }: { projectId: string }) {
  const {
    sponsors,
    totalGoal,
    loading,
    stats,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    setTotalGoal,
  } = usePerformanceSponsor(projectId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PerfSponsorEntry | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // ── 핸들러 ──────────────────────────────────────────────

  const handleAdd = (form: SponsorFormData) => {
    addSponsor(formToSponsorParams(form));
    toast.success(TOAST.PERFORMANCE_SPONSOR.ADDED);
  };

  const handleUpdate = (form: SponsorFormData) => {
    if (!editTarget) return;
    const ok = updateSponsor(editTarget.id, formToSponsorParams(form));
    if (ok) toast.success(TOAST.PERFORMANCE_SPONSOR.UPDATED);
    else toast.error(TOAST.UPDATE_ERROR);
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    const ok = deleteSponsor(id);
    if (ok) toast.success(TOAST.PERFORMANCE_SPONSOR.DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  };

  const handleSetGoal = (goal: number | null) => {
    setTotalGoal(goal);
    if (goal != null)
      toast.success(`목표 금액이 ${formatKRW(goal)}로 설정되었습니다.`);
    else toast.success(TOAST.UPDATE_SUCCESS);
  };

  // ── 등급별 그룹 ────────────────────────────────────────

  const sponsorsByTier = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    items: sponsors.filter((s) => s.tier === tier),
  })).filter((g) => g.items.length > 0);

  // ── 렌더 ────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent
          className="py-8 text-center text-sm text-muted-foreground"
          aria-live="polite"
          aria-busy="true"
        >
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HandHeart
                className="h-4 w-4 text-purple-500"
                aria-hidden="true"
              />
              공연 후원/스폰서 관리
              {sponsors.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                  aria-label={`총 ${sponsors.length}개사`}
                >
                  {sponsors.length}개사
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5" role="toolbar" aria-label="스폰서 관리 도구">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setGoalDialogOpen(true)}
                aria-label="후원 목표 금액 설정"
              >
                <Target className="h-3 w-3 mr-1" aria-hidden="true" />
                목표 설정
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
                aria-label="새 스폰서 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                스폰서 추가
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          {sponsors.length > 0 && <SponsorSummaryStats stats={stats} />}

          {/* 목표 달성률 바 */}
          {totalGoal != null && (
            <GoalProgressBar
              progress={stats.goalProgress}
              confirmedAmount={stats.confirmedAmount}
              totalGoal={totalGoal}
            />
          )}

          {/* 등급별 분포 차트 */}
          {sponsors.length > 0 && (
            <TierDistributionChart tierBreakdown={stats.tierBreakdown} />
          )}

          {/* 등급별 스폰서 목록 */}
          {sponsors.length === 0 ? (
            <div
              className="py-10 text-center space-y-3"
              role="status"
              aria-live="polite"
            >
              <HandHeart
                className="h-10 w-10 mx-auto text-muted-foreground/40"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  등록된 스폰서가 없습니다
                </p>
                <p className="text-xs text-muted-foreground/70">
                  스폰서 추가 버튼을 눌러 첫 번째 후원사를 등록하세요.
                </p>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
                aria-label="새 스폰서 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                스폰서 추가
              </Button>
            </div>
          ) : (
            <div
              className="space-y-4"
              role="region"
              aria-label="등급별 스폰서 목록"
              aria-live="polite"
            >
              {sponsorsByTier.map((group) => (
                <section key={group.tier} aria-labelledby={`tier-heading-${group.tier}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      id={`tier-heading-${group.tier}`}
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${TIER_BADGE_CLASS[group.tier]}`}
                    >
                      <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
                      {group.label}
                    </Badge>
                    <span
                      className="text-[10px] text-muted-foreground"
                      aria-label={`${group.items.length}개사`}
                    >
                      {group.items.length}개사
                    </span>
                    <div className="flex-1 h-px bg-border" aria-hidden="true" />
                  </div>
                  <ul role="list" className="space-y-1.5">
                    {group.items.map((sponsor) => (
                      <SponsorRow
                        key={sponsor.id}
                        sponsor={sponsor}
                        onEdit={(s) => setEditTarget(s)}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <SponsorDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initial={EMPTY_FORM}
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <SponsorDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          initial={sponsorToForm(editTarget)}
          onSubmit={handleUpdate}
        />
      )}

      {/* 목표 금액 다이얼로그 */}
      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        currentGoal={totalGoal}
        onSave={handleSetGoal}
      />
    </>
  );
}
