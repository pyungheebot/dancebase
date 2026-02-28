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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Music,
  Clock,
  User,
  Users,
  MapPin,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useCurtainCall } from "@/hooks/use-curtain-call";
import type { CurtainCallPlan, CurtainCallStep } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const BOW_TYPE_LABELS: Record<
  NonNullable<CurtainCallStep["bowType"]>,
  string
> = {
  individual: "개인",
  group: "그룹",
  lead: "리드",
  all: "전체",
};

const BOW_TYPE_COLORS: Record<
  NonNullable<CurtainCallStep["bowType"]>,
  string
> = {
  individual: "bg-blue-100 text-blue-700 border-blue-300",
  group: "bg-green-100 text-green-700 border-green-300",
  lead: "bg-purple-100 text-purple-700 border-purple-300",
  all: "bg-orange-100 text-orange-700 border-orange-300",
};

const BOW_TYPE_OPTIONS: NonNullable<CurtainCallStep["bowType"]>[] = [
  "individual",
  "group",
  "lead",
  "all",
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ============================================================
// 폼 타입
// ============================================================

type PlanFormData = {
  planName: string;
  musicTrack: string;
  notes: string;
};

type StepFormData = {
  description: string;
  performers: string[];
  position: string;
  durationSeconds: string;
  bowType: NonNullable<CurtainCallStep["bowType"]> | "";
};

function emptyPlanForm(): PlanFormData {
  return { planName: "", musicTrack: "", notes: "" };
}

function emptyStepForm(): StepFormData {
  return {
    description: "",
    performers: [],
    position: "",
    durationSeconds: "",
    bowType: "",
  };
}

// ============================================================
// 메인 컴포넌트
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

  // 선택된 플랜 탭
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 플랜 다이얼로그
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editPlanTarget, setEditPlanTarget] = useState<CurtainCallPlan | null>(
    null
  );
  const [planForm, setPlanForm] = useState<PlanFormData>(emptyPlanForm());
  const [planSaving, setPlanSaving] = useState(false);

  // 스텝 다이얼로그
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editStepTarget, setEditStepTarget] = useState<CurtainCallStep | null>(
    null
  );
  const [stepForm, setStepForm] = useState<StepFormData>(emptyStepForm());
  const [stepSaving, setStepSaving] = useState(false);

  // 현재 선택된 플랜
  const currentPlan =
    plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;

  // ── 플랜 다이얼로그 열기 ──
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

  // ── 플랜 저장 ──
  async function handlePlanSave() {
    if (!planForm.planName.trim()) {
      toast.error("플랜 이름을 입력해주세요.");
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
        toast.success("플랜이 수정되었습니다.");
      } else {
        const newPlan = await addPlan(payload);
        setSelectedPlanId(newPlan.id);
        toast.success("플랜이 추가되었습니다.");
      }
      setPlanDialogOpen(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setPlanSaving(false);
    }
  }

  // ── 플랜 삭제 ──
  async function handleDeletePlan(plan: CurtainCallPlan) {
    try {
      await deletePlan(plan.id);
      if (selectedPlanId === plan.id) {
        setSelectedPlanId(null);
      }
      toast.success(`'${plan.planName}' 플랜이 삭제되었습니다.`);
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  // ── 스텝 다이얼로그 열기 ──
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
      durationSeconds: step.durationSeconds != null
        ? String(step.durationSeconds)
        : "",
      bowType: step.bowType ?? "",
    });
    setStepDialogOpen(true);
  }

  // ── 스텝 저장 ──
  async function handleStepSave() {
    if (!currentPlan) return;
    if (!stepForm.description.trim()) {
      toast.error("설명을 입력해주세요.");
      return;
    }
    setStepSaving(true);
    try {
      const dur = stepForm.durationSeconds
        ? parseInt(stepForm.durationSeconds, 10)
        : undefined;
      if (stepForm.durationSeconds && (isNaN(dur!) || dur! < 1)) {
        toast.error("소요시간은 1 이상의 숫자여야 합니다.");
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
        toast.success("스텝이 수정되었습니다.");
      } else {
        await addStep(currentPlan.id, payload);
        toast.success("스텝이 추가되었습니다.");
      }
      setStepDialogOpen(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setStepSaving(false);
    }
  }

  // ── 스텝 삭제 ──
  async function handleDeleteStep(step: CurtainCallStep) {
    if (!currentPlan) return;
    try {
      await deleteStep(currentPlan.id, step.id);
      toast.success("스텝이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  // ── 스텝 순서 이동 ──
  async function handleMoveStep(step: CurtainCallStep, direction: "up" | "down") {
    if (!currentPlan) return;
    const sorted = [...currentPlan.steps].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === step.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    try {
      await reorderSteps(currentPlan.id, sorted.map((s) => s.id));
    } catch {
      toast.error("순서 변경에 실패했습니다.");
    }
  }

  // ── 출연자 토글 ──
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
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  <CardTitle className="text-sm font-semibold">
                    커튼콜 계획
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-800 border border-pink-300">
                    {stats.totalPlans}개 플랜
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
              >
                <Plus className="h-3 w-3 mr-1" />
                플랜 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalPlans > 0 && (
              <div className="mt-1.5 flex gap-3 flex-wrap">
                <span className="text-[10px] text-muted-foreground">
                  플랜{" "}
                  <span className="font-semibold text-foreground">
                    {stats.totalPlans}
                  </span>
                  개
                </span>
                <span className="text-[10px] text-muted-foreground">
                  총 스텝{" "}
                  <span className="font-semibold text-foreground">
                    {stats.totalSteps}
                  </span>
                  개
                </span>
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : plans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 커튼콜 플랜이 없습니다.
                </p>
              ) : (
                <>
                  {/* 플랜 탭 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
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
                    <div className="space-y-2">
                      {/* 플랜 헤더 */}
                      <div className="flex items-center justify-between rounded-md border border-pink-200 bg-pink-50 px-3 py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-pink-800">
                            {currentPlan.planName}
                          </p>
                          {currentPlan.musicTrack && (
                            <div className="flex items-center gap-1">
                              <Music className="h-3 w-3 text-pink-500" />
                              <span className="text-[10px] text-pink-600">
                                {currentPlan.musicTrack}
                              </span>
                            </div>
                          )}
                          {currentPlan.notes && (
                            <p className="text-[10px] text-pink-600 mt-0.5">
                              {currentPlan.notes}
                            </p>
                          )}
                          {totalDuration > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-pink-500" />
                              <span className="text-[10px] text-pink-600">
                                총 소요시간: {formatDuration(totalDuration)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditPlan(currentPlan)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePlan(currentPlan)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

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
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" />
                          스텝 추가
                        </Button>
                      </div>

                      {/* 세로 타임라인 */}
                      {sortedSteps.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">
                          스텝을 추가해 커튼콜 순서를 구성해보세요.
                        </p>
                      ) : (
                        <div className="relative space-y-0">
                          {sortedSteps.map((step, idx) => (
                            <StepRow
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
                        </div>
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
      <PlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        form={planForm}
        setForm={setPlanForm}
        onSave={handlePlanSave}
        saving={planSaving}
        isEdit={!!editPlanTarget}
      />

      {/* 스텝 추가/편집 다이얼로그 */}
      <StepDialog
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

// ============================================================
// 스텝 행 컴포넌트 (타임라인)
// ============================================================

function StepRow({
  step,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: CurtainCallStep;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      {/* 타임라인 세로선 + 번호 */}
      <div className="flex flex-col items-center w-6 flex-shrink-0">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 border-2 border-pink-400 text-[9px] font-bold text-pink-700 z-10 flex-shrink-0">
          {step.order}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-pink-200 mt-0.5" style={{ minHeight: "20px" }} />
        )}
      </div>

      {/* 스텝 내용 */}
      <div className={`flex-1 min-w-0 pb-2 ${isLast ? "" : ""}`}>
        <div className="rounded-md border bg-card hover:bg-muted/20 transition-colors p-2">
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
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
                    <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {step.position}
                    </span>
                  </div>
                )}
                {step.durationSeconds != null && step.durationSeconds > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDuration(step.durationSeconds)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveUp}
                disabled={isFirst}
              >
                <ArrowUp className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveDown}
                disabled={isLast}
              >
                <ArrowDown className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onEdit}
              >
                <Pencil className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 플랜 추가/편집 다이얼로그
// ============================================================

function PlanDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: PlanFormData;
  setForm: (f: PlanFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-pink-500" />
            {isEdit ? "플랜 수정" : "플랜 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 플랜 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">
              플랜 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 메인 커튼콜, 앵콜 커튼콜"
              value={form.planName}
              onChange={(e) => set("planName", e.target.value)}
            />
          </div>

          {/* 음악 트랙 */}
          <div className="space-y-1">
            <Label className="text-xs">음악 트랙</Label>
            <div className="relative">
              <Music className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs pl-6"
                placeholder="예: Finale - Orchestra Ver."
                value={form.musicTrack}
                onChange={(e) => set("musicTrack", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="플랜에 대한 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 스텝 추가/편집 다이얼로그
// ============================================================

function StepDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
  memberNames,
  onTogglePerformer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: StepFormData;
  setForm: (f: StepFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  memberNames: string[];
  onTogglePerformer: (name: string) => void;
}) {
  function set<K extends keyof StepFormData>(key: K, value: StepFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-pink-500" />
            {isEdit ? "스텝 수정" : "스텝 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">
              설명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 솔리스트 단독 인사, 전체 출연진 인사"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* 출연자 선택 (멤버가 있을 때) */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">출연자 (다중 선택)</Label>
              <div className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30 min-h-[40px]">
                {memberNames.map((name) => {
                  const selected = form.performers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onTogglePerformer(name)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selected
                          ? "bg-pink-100 border-pink-400 text-pink-800 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {form.performers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  선택됨: {form.performers.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* 멤버 목록이 없을 때 직접 입력 */}
          {memberNames.length === 0 && (
            <div className="space-y-1">
              <Label className="text-xs">출연자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
                value={form.performers.join(", ")}
                onChange={(e) =>
                  set(
                    "performers",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          )}

          {/* 인사 유형 + 위치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">인사 유형</Label>
              <Select
                value={form.bowType}
                onValueChange={(v) =>
                  set(
                    "bowType",
                    v as NonNullable<CurtainCallStep["bowType"]> | ""
                  )
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">
                    없음
                  </SelectItem>
                  {BOW_TYPE_OPTIONS.map((bt) => (
                    <SelectItem key={bt} value={bt} className="text-xs">
                      {BOW_TYPE_LABELS[bt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">위치</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 무대 중앙"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
              />
            </div>
          </div>

          {/* 소요시간 */}
          <div className="space-y-1">
            <Label className="text-xs">소요시간 (초)</Label>
            <div className="relative">
              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs pl-6"
                type="number"
                min="1"
                placeholder="예: 30"
                value={form.durationSeconds}
                onChange={(e) => set("durationSeconds", e.target.value)}
              />
            </div>
            {form.durationSeconds && !isNaN(parseInt(form.durationSeconds)) && (
              <p className="text-[10px] text-muted-foreground">
                = {formatDuration(parseInt(form.durationSeconds))}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
