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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useCurtainCall } from "@/hooks/use-curtain-call";
import type { CurtainCallPlan, CurtainCallStep } from "@/types";

import { CurtainCallStats } from "./curtain-call-stats";
import { CurtainCallStepRow } from "./curtain-call-step-row";
import { CurtainCallPlanDialog } from "./curtain-call-plan-dialog";
import { CurtainCallStepDialog } from "./curtain-call-step-dialog";
import { CurtainCallPlanHeader } from "./curtain-call-plan-header";
import {
  emptyPlanForm,
  emptyStepForm,
} from "./curtain-call-types";
import type { PlanFormData, StepFormData } from "./curtain-call-types";

// ============================================================
// 메인 카드
// ============================================================

export function CurtainCallCard({
  groupId,
  projectId,
  memberNames = [],
}: {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}) {
  const {
    plans,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    stats,
  } = useCurtainCall(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 플랜 다이얼로그
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editPlanTarget, setEditPlanTarget] = useState<CurtainCallPlan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(emptyPlanForm());
  const [planSaving, setPlanSaving] = useState(false);

  // 스텝 다이얼로그
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editStepTarget, setEditStepTarget] = useState<CurtainCallStep | null>(null);
  const [stepForm, setStepForm] = useState<StepFormData>(emptyStepForm());
  const [stepSaving, setStepSaving] = useState(false);

  const currentPlan =
    plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;

  // ── 플랜 다이얼로그 열기 ──────────────────────────────────────

  function openAddPlan() {
    setEditPlanTarget(null);
    setPlanForm(emptyPlanForm());
    setPlanDialogOpen(true);
  }

  function openEditPlan(plan: CurtainCallPlan) {
    setEditPlanTarget(plan);
    setPlanForm({
      planName: plan.planName,
      musicTrack: plan.musicTrack ?? "",
      notes: plan.notes ?? "",
    });
    setPlanDialogOpen(true);
  }

  // ── 플랜 저장 ────────────────────────────────────────────────

  async function handlePlanSave() {
    if (!planForm.planName.trim()) {
      toast.error(TOAST.CURTAIN_CALL.PLAN_NAME_REQUIRED);
      return;
    }
    setPlanSaving(true);
    try {
      const payload = {
        projectId,
        planName: planForm.planName.trim(),
        musicTrack: planForm.musicTrack.trim() || undefined,
        notes: planForm.notes.trim() || undefined,
      };
      if (editPlanTarget) {
        await updatePlan(editPlanTarget.id, payload);
        toast.success(TOAST.CURTAIN_CALL.PLAN_UPDATED);
      } else {
        const newPlan = await addPlan(payload);
        setSelectedPlanId(newPlan.id);
        toast.success(TOAST.CURTAIN_CALL.PLAN_ADDED);
      }
      setPlanDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setPlanSaving(false);
    }
  }

  // ── 플랜 삭제 ────────────────────────────────────────────────

  async function handleDeletePlan(plan: CurtainCallPlan) {
    try {
      await deletePlan(plan.id);
      if (selectedPlanId === plan.id) {
        setSelectedPlanId(null);
      }
      toast.success(`'${plan.planName}' 플랜이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 스텝 다이얼로그 열기 ─────────────────────────────────────

  function openAddStep() {
    setEditStepTarget(null);
    setStepForm(emptyStepForm());
    setStepDialogOpen(true);
  }

  function openEditStep(step: CurtainCallStep) {
    setEditStepTarget(step);
    setStepForm({
      description: step.description,
      performers: step.performers,
      position: step.position ?? "",
      durationSeconds:
        step.durationSeconds != null ? String(step.durationSeconds) : "",
      bowType: step.bowType ?? "",
    });
    setStepDialogOpen(true);
  }

  // ── 스텝 저장 ────────────────────────────────────────────────

  async function handleStepSave() {
    if (!currentPlan) return;
    if (!stepForm.description.trim()) {
      toast.error(TOAST.CURTAIN_CALL.DESCRIPTION_REQUIRED);
      return;
    }
    setStepSaving(true);
    try {
      const dur = stepForm.durationSeconds
        ? parseInt(stepForm.durationSeconds, 10)
        : undefined;
      if (stepForm.durationSeconds && (isNaN(dur!) || dur! < 1)) {
        toast.error(TOAST.CURTAIN_CALL.DURATION_RANGE);
        return;
      }
      const payload: Omit<CurtainCallStep, "id" | "order"> = {
        description: stepForm.description.trim(),
        performers: stepForm.performers,
        position: stepForm.position.trim() || undefined,
        durationSeconds: dur,
        bowType: stepForm.bowType || undefined,
      };
      if (editStepTarget) {
        await updateStep(currentPlan.id, editStepTarget.id, payload);
        toast.success(TOAST.CURTAIN_CALL.STEP_UPDATED);
      } else {
        await addStep(currentPlan.id, payload);
        toast.success(TOAST.CURTAIN_CALL.STEP_ADDED);
      }
      setStepDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setStepSaving(false);
    }
  }

  // ── 스텝 삭제 ────────────────────────────────────────────────

  async function handleDeleteStep(step: CurtainCallStep) {
    if (!currentPlan) return;
    try {
      await deleteStep(currentPlan.id, step.id);
      toast.success(TOAST.CURTAIN_CALL.STEP_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 스텝 순서 이동 ───────────────────────────────────────────

  async function handleMoveStep(
    step: CurtainCallStep,
    direction: "up" | "down"
  ) {
    if (!currentPlan) return;
    const sorted = [...currentPlan.steps].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === step.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    try {
      await reorderSteps(
        currentPlan.id,
        sorted.map((s) => s.id)
      );
    } catch {
      toast.error(TOAST.ORDER_ERROR);
    }
  }

  // ── 출연자 토글 ──────────────────────────────────────────────

  function togglePerformer(name: string) {
    setStepForm((prev) => ({
      ...prev,
      performers: prev.performers.includes(name)
        ? prev.performers.filter((p) => p !== name)
        : [...prev.performers, name],
    }));
  }

  const sortedSteps = currentPlan
    ? [...currentPlan.steps].sort((a, b) => a.order - b.order)
    : [];

  const totalDuration = sortedSteps.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0),
    0
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                  aria-controls="curtain-call-content"
                >
                  <Sparkles className="h-4 w-4 text-pink-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    커튼콜 계획
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-800 border border-pink-300">
                    {stats.totalPlans}개 플랜
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddPlan();
                }}
                aria-label="새 플랜 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                플랜 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            <CurtainCallStats
              totalPlans={stats.totalPlans}
              totalSteps={stats.totalSteps}
            />
          </CardHeader>

          <CollapsibleContent id="curtain-call-content">
            <CardContent className="pt-0 space-y-3">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : plans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 커튼콜 플랜이 없습니다.
                </p>
              ) : (
                <>
                  {/* 플랜 탭 */}
                  <div
                    role="tablist"
                    aria-label="커튼콜 플랜 목록"
                    className="flex gap-1.5 flex-wrap"
                  >
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        role="tab"
                        aria-selected={currentPlan?.id === plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          currentPlan?.id === plan.id
                            ? "bg-pink-100 border-pink-400 text-pink-800 font-semibold"
                            : "bg-muted border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {plan.planName}
                      </button>
                    ))}
                  </div>

                  {/* 현재 플랜 상세 */}
                  {currentPlan && (
                    <div
                      role="tabpanel"
                      aria-label={`${currentPlan.planName} 플랜 상세`}
                      className="space-y-2"
                    >
                      {/* 플랜 헤더 */}
                      <CurtainCallPlanHeader
                        plan={currentPlan}
                        totalDuration={totalDuration}
                        onEdit={() => openEditPlan(currentPlan)}
                        onDelete={() => handleDeletePlan(currentPlan)}
                      />

                      {/* 스텝 추가 버튼 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          커튼콜 순서 ({sortedSteps.length}스텝)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={openAddStep}
                          aria-label="스텝 추가"
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                          스텝 추가
                        </Button>
                      </div>

                      {/* 세로 타임라인 */}
                      {sortedSteps.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">
                          스텝을 추가해 커튼콜 순서를 구성해보세요.
                        </p>
                      ) : (
                        <ol
                          role="list"
                          aria-label="커튼콜 스텝 순서"
                          className="relative space-y-0"
                        >
                          {sortedSteps.map((step, idx) => (
                            <CurtainCallStepRow
                              key={step.id}
                              step={step}
                              isFirst={idx === 0}
                              isLast={idx === sortedSteps.length - 1}
                              onEdit={() => openEditStep(step)}
                              onDelete={() => handleDeleteStep(step)}
                              onMoveUp={() => handleMoveStep(step, "up")}
                              onMoveDown={() => handleMoveStep(step, "down")}
                            />
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 플랜 추가/편집 다이얼로그 */}
      <CurtainCallPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        form={planForm}
        setForm={setPlanForm}
        onSave={handlePlanSave}
        saving={planSaving}
        isEdit={!!editPlanTarget}
      />

      {/* 스텝 추가/편집 다이얼로그 */}
      <CurtainCallStepDialog
        open={stepDialogOpen}
        onOpenChange={setStepDialogOpen}
        form={stepForm}
        setForm={setStepForm}
        onSave={handleStepSave}
        saving={stepSaving}
        isEdit={!!editStepTarget}
        memberNames={memberNames}
        onTogglePerformer={togglePerformer}
      />
    </>
  );
}

