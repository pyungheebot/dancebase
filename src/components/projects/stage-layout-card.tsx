"use client";

// ============================================================
// 무대 평면도 카드 - 메인 컨테이너
// ============================================================

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
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
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageLayout } from "@/hooks/use-stage-layout";
import type { StageLayoutItem } from "@/types";
import { PlanFormDialog, ItemFormDialog } from "./stage-layout-dialogs";
import { StageLayoutViewer } from "./stage-layout-viewer";
import {
  DEFAULT_PLAN_FORM,
  DEFAULT_ITEM_FORM,
  DEFAULT_ITEM_SIZE,
  type PlanFormState,
  type ItemFormState,
} from "./stage-layout-types";

// ── Props ─────────────────────────────────────────────────

interface StageLayoutCardProps {
  groupId: string;
  projectId: string;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────

export function StageLayoutCard({ groupId, projectId }: StageLayoutCardProps) {
  const {
    plans,
    loading,
    addPlan,
    deletePlan,
    addItem,
    updateItem,
    deleteItem,
    stats,
  } = useStageLayout(groupId, projectId);

  // 패널 열림/닫힘
  const [isOpen, setIsOpen] = useState(false);

  // 선택된 플랜
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 다이얼로그 상태
  const [addPlanDialogOpen, setAddPlanDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StageLayoutItem | null>(null);

  // 폼 상태
  const [planForm, setPlanForm] = useState<PlanFormState>(DEFAULT_PLAN_FORM);
  const [itemForm, setItemForm] = useState<ItemFormState>(DEFAULT_ITEM_FORM);

  // 캔버스 활성 아이템
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // aria-live용 메시지
  const [liveMessage, setLiveMessage] = useState("");

  // 저장 중 상태
  const { pending: saving, execute } = useAsyncAction();

  // 실효 플랜
  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;
  const effectivePlanId = selectedPlan?.id ?? null;

  // ── 플랜 추가 ──────────────────────────────────────────

  async function handleAddPlan() {
    if (!planForm.planName.trim()) {
      toast.error(TOAST.STAGE_LAYOUT.PLAN_NAME_REQUIRED);
      return;
    }
    await execute(async () => {
      const newPlan = await addPlan({
        planName: planForm.planName.trim(),
        stageWidth: planForm.stageWidth ? Number(planForm.stageWidth) : undefined,
        stageDepth: planForm.stageDepth ? Number(planForm.stageDepth) : undefined,
      });
      setSelectedPlanId(newPlan.id);
      setPlanForm(DEFAULT_PLAN_FORM);
      setAddPlanDialogOpen(false);
      toast.success(TOAST.STAGE_LAYOUT.PLAN_ADDED);
      setLiveMessage(`플랜 "${newPlan.planName}"이(가) 추가되었습니다.`);
    });
  }

  // ── 플랜 삭제 ──────────────────────────────────────────

  async function handleDeletePlan(planId: string) {
    try {
      await deletePlan(planId);
      if (selectedPlanId === planId) {
        const remaining = plans.filter((p) => p.id !== planId);
        setSelectedPlanId(remaining[0]?.id ?? null);
      }
      toast.success(TOAST.STAGE_LAYOUT.PLAN_DELETED);
      setLiveMessage("플랜이 삭제되었습니다.");
    } catch {
      toast.error(TOAST.STAGE_LAYOUT.PLAN_DELETE_ERROR);
    }
  }

  // ── 아이템 추가 ────────────────────────────────────────

  async function handleAddItem() {
    if (!effectivePlanId) return;
    if (!itemForm.label.trim()) {
      toast.error(TOAST.STAGE_LAYOUT.LABEL_REQUIRED);
      return;
    }
    await execute(async () => {
      await addItem(effectivePlanId, {
        type: itemForm.type,
        label: itemForm.label.trim(),
        x: Number(itemForm.x),
        y: Number(itemForm.y),
        width: Number(itemForm.width),
        height: Number(itemForm.height),
        rotation: Number(itemForm.rotation),
        notes: itemForm.notes.trim() || undefined,
      });
      setItemForm(DEFAULT_ITEM_FORM);
      setAddItemDialogOpen(false);
      toast.success(TOAST.STAGE_LAYOUT.ITEM_ADDED);
      setLiveMessage(`아이템 "${itemForm.label.trim()}"이(가) 추가되었습니다.`);
    });
  }

  // ── 아이템 편집 다이얼로그 열기 ─────────────────────────

  function handleOpenEditItem(item: StageLayoutItem) {
    setEditingItem(item);
    setItemForm({
      type: item.type,
      label: item.label,
      x: item.x,
      y: item.y,
      width: item.width ?? DEFAULT_ITEM_SIZE,
      height: item.height ?? DEFAULT_ITEM_SIZE,
      rotation: item.rotation ?? 0,
      notes: item.notes ?? "",
    });
    setActiveItemId(null);
    setEditItemDialogOpen(true);
  }

  // ── 아이템 수정 ────────────────────────────────────────

  async function handleUpdateItem() {
    if (!effectivePlanId || !editingItem) return;
    if (!itemForm.label.trim()) {
      toast.error(TOAST.STAGE_LAYOUT.LABEL_REQUIRED);
      return;
    }
    await execute(async () => {
      await updateItem(effectivePlanId, editingItem.id, {
        type: itemForm.type,
        label: itemForm.label.trim(),
        x: Number(itemForm.x),
        y: Number(itemForm.y),
        width: Number(itemForm.width),
        height: Number(itemForm.height),
        rotation: Number(itemForm.rotation),
        notes: itemForm.notes.trim() || undefined,
      });
      setEditItemDialogOpen(false);
      setEditingItem(null);
      toast.success(TOAST.STAGE_LAYOUT.ITEM_UPDATED);
      setLiveMessage(`아이템 "${itemForm.label.trim()}"이(가) 수정되었습니다.`);
    });
  }

  // ── 아이템 삭제 ────────────────────────────────────────

  async function handleDeleteItem(itemId: string) {
    if (!effectivePlanId) return;
    try {
      await deleteItem(effectivePlanId, itemId);
      setActiveItemId(null);
      toast.success(TOAST.STAGE_LAYOUT.ITEM_DELETED);
      setLiveMessage("아이템이 삭제되었습니다.");
    } catch {
      toast.error(TOAST.STAGE_LAYOUT.ITEM_DELETE_ERROR);
    }
  }

  // ── 렌더 ───────────────────────────────────────────────

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* 헤더 (접기/펼치기 트리거) */}
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3 px-4"
            aria-expanded={isOpen}
            aria-controls="stage-layout-content"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <CardTitle className="text-sm font-semibold">
                  무대 평면도
                </CardTitle>
                {stats.totalPlans > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                    aria-label={`${stats.totalPlans}개 플랜, ${stats.totalItems}개 아이템`}
                  >
                    {stats.totalPlans}개 플랜 · {stats.totalItems}개 아이템
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* 본문 */}
        <CollapsibleContent id="stage-layout-content">
          <CardContent className="px-4 pb-4 pt-0">
            {loading ? (
              <div
                className="text-xs text-muted-foreground py-4 text-center"
                role="status"
                aria-live="polite"
              >
                불러오는 중...
              </div>
            ) : (
              <div className="space-y-3">
                {/* 플랜 탭 + 추가 버튼 */}
                <div
                  className="flex items-center gap-2 flex-wrap"
                  role="tablist"
                  aria-label="무대 평면도 플랜 목록"
                >
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      role="tab"
                      aria-selected={selectedPlan?.id === plan.id}
                      aria-controls="stage-layout-plan-panel"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        selectedPlan?.id === plan.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {plan.planName}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setAddPlanDialogOpen(true)}
                    aria-label="새 플랜 추가"
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    플랜 추가
                  </Button>
                </div>

                {/* 선택된 플랜 */}
                {selectedPlan ? (
                  <div
                    id="stage-layout-plan-panel"
                    role="tabpanel"
                    aria-label={`${selectedPlan.planName} 플랜`}
                    className="space-y-3"
                  >
                    {/* 플랜 헤더 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {selectedPlan.planName}
                        </span>
                        {(selectedPlan.stageWidth || selectedPlan.stageDepth) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            aria-label={`무대 규격 ${selectedPlan.stageWidth ?? "?"}m × ${selectedPlan.stageDepth ?? "?"}m`}
                          >
                            {selectedPlan.stageWidth ? `${selectedPlan.stageWidth}m` : "?"}
                            {" x "}
                            {selectedPlan.stageDepth ? `${selectedPlan.stageDepth}m` : "?"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1" role="group" aria-label="플랜 작업">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setAddItemDialogOpen(true)}
                          aria-label="이 플랜에 아이템 추가"
                        >
                          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                          아이템 추가
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeletePlan(selectedPlan.id)}
                          aria-label={`${selectedPlan.planName} 플랜 삭제`}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    {/* 레이아웃 뷰어 */}
                    <StageLayoutViewer
                      plan={selectedPlan}
                      activeItemId={activeItemId}
                      onActivateItem={(id) =>
                        setActiveItemId((prev) => (prev === id ? null : id))
                      }
                      onEditItem={handleOpenEditItem}
                      onDeleteItem={handleDeleteItem}
                      liveMessage={liveMessage}
                    />
                  </div>
                ) : (
                  <div
                    className="text-xs text-muted-foreground py-4 text-center"
                    role="status"
                  >
                    플랜을 추가하여 무대 평면도를 작성해보세요.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 플랜 추가 다이얼로그 */}
      <PlanFormDialog
        open={addPlanDialogOpen}
        onOpenChange={setAddPlanDialogOpen}
        form={planForm}
        onFormChange={setPlanForm}
        onSubmit={handleAddPlan}
        saving={saving}
      />

      {/* 아이템 추가 다이얼로그 */}
      <ItemFormDialog
        open={addItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        title="아이템 추가"
        form={itemForm}
        onFormChange={setItemForm}
        onSubmit={handleAddItem}
        saving={saving}
        submitLabel="추가"
      />

      {/* 아이템 수정 다이얼로그 */}
      <ItemFormDialog
        open={editItemDialogOpen}
        onOpenChange={(open) => {
          setEditItemDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
        title="아이템 수정"
        form={itemForm}
        onFormChange={setItemForm}
        onSubmit={handleUpdateItem}
        saving={saving}
        submitLabel="저장"
      />
    </Card>
  );
}
