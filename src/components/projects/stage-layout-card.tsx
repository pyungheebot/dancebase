"use client";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  LayoutGrid,
  Volume2,
  Lightbulb,
  Monitor,
  Mic,
  Camera,
  Table2,
  Armchair,
  HelpCircle,
  Package,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageLayout } from "@/hooks/use-stage-layout";
import type {
  StageLayoutItemType,
  StageLayoutItem,

} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const ITEM_TYPE_LABELS: Record<StageLayoutItemType, string> = {
  speaker: "스피커",
  light: "조명",
  prop: "소품",
  screen: "스크린",
  mic: "마이크",
  camera: "카메라",
  table: "테이블",
  chair: "의자",
  other: "기타",
};

const ITEM_TYPE_ICONS: Record<StageLayoutItemType, React.ReactNode> = {
  speaker: <Volume2 className="h-3.5 w-3.5" />,
  light: <Lightbulb className="h-3.5 w-3.5" />,
  prop: <Package className="h-3.5 w-3.5" />,
  screen: <Monitor className="h-3.5 w-3.5" />,
  mic: <Mic className="h-3.5 w-3.5" />,
  camera: <Camera className="h-3.5 w-3.5" />,
  table: <Table2 className="h-3.5 w-3.5" />,
  chair: <Armchair className="h-3.5 w-3.5" />,
  other: <HelpCircle className="h-3.5 w-3.5" />,
};

const ITEM_TYPE_COLORS: Record<StageLayoutItemType, string> = {
  speaker: "bg-blue-500 border-blue-600 text-white",
  light: "bg-yellow-400 border-yellow-500 text-yellow-900",
  prop: "bg-purple-500 border-purple-600 text-white",
  screen: "bg-gray-600 border-gray-700 text-white",
  mic: "bg-green-500 border-green-600 text-white",
  camera: "bg-orange-500 border-orange-600 text-white",
  table: "bg-amber-600 border-amber-700 text-white",
  chair: "bg-teal-500 border-teal-600 text-white",
  other: "bg-slate-500 border-slate-600 text-white",
};

const ITEM_TYPE_BADGE_COLORS: Record<StageLayoutItemType, string> = {
  speaker: "bg-blue-100 text-blue-700",
  light: "bg-yellow-100 text-yellow-700",
  prop: "bg-purple-100 text-purple-700",
  screen: "bg-gray-100 text-gray-700",
  mic: "bg-green-100 text-green-700",
  camera: "bg-orange-100 text-orange-700",
  table: "bg-amber-100 text-amber-700",
  chair: "bg-teal-100 text-teal-700",
  other: "bg-slate-100 text-slate-700",
};

const ITEM_TYPES: StageLayoutItemType[] = [
  "speaker",
  "light",
  "prop",
  "screen",
  "mic",
  "camera",
  "table",
  "chair",
  "other",
];

// ============================================================
// 기본값
// ============================================================

const DEFAULT_ITEM_SIZE = 8;

// ============================================================
// 아이템 추가 폼 상태
// ============================================================

interface ItemFormState {
  type: StageLayoutItemType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  notes: string;
}

const DEFAULT_ITEM_FORM: ItemFormState = {
  type: "speaker",
  label: "",
  x: 50,
  y: 50,
  width: DEFAULT_ITEM_SIZE,
  height: DEFAULT_ITEM_SIZE,
  rotation: 0,
  notes: "",
};

// ============================================================
// 플랜 추가 폼 상태
// ============================================================

interface PlanFormState {
  planName: string;
  stageWidth: string;
  stageDepth: string;
}

const DEFAULT_PLAN_FORM: PlanFormState = {
  planName: "",
  stageWidth: "",
  stageDepth: "",
};

// ============================================================
// 메인 컴포넌트
// ============================================================

interface StageLayoutCardProps {
  groupId: string;
  projectId: string;
}

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

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 다이얼로그 상태
  const [addPlanDialogOpen, setAddPlanDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StageLayoutItem | null>(null);

  // 폼 상태
  const [planForm, setPlanForm] = useState<PlanFormState>(DEFAULT_PLAN_FORM);
  const [itemForm, setItemForm] = useState<ItemFormState>(DEFAULT_ITEM_FORM);

  // 아이템 팝오버 상태
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // 저장 중 상태
  const { pending: saving, execute } = useAsyncAction();

  // 선택된 플랜
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;
  const effectivePlanId = selectedPlan?.id ?? null;

  // ── 플랜 추가 핸들러 ──
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
    });
  }

  // ── 플랜 삭제 핸들러 ──
  async function handleDeletePlan(planId: string) {
    try {
      await deletePlan(planId);
      if (selectedPlanId === planId) {
        const remaining = plans.filter((p) => p.id !== planId);
        setSelectedPlanId(remaining[0]?.id ?? null);
      }
      toast.success(TOAST.STAGE_LAYOUT.PLAN_DELETED);
    } catch {
      toast.error(TOAST.STAGE_LAYOUT.PLAN_DELETE_ERROR);
    }
  }

  // ── 아이템 추가 핸들러 ──
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
    });
  }

  // ── 아이템 편집 다이얼로그 열기 ──
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

  // ── 아이템 수정 핸들러 ──
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
    });
  }

  // ── 아이템 삭제 핸들러 ──
  async function handleDeleteItem(itemId: string) {
    if (!effectivePlanId) return;
    try {
      await deleteItem(effectivePlanId, itemId);
      setActiveItemId(null);
      toast.success(TOAST.STAGE_LAYOUT.ITEM_DELETED);
    } catch {
      toast.error(TOAST.STAGE_LAYOUT.ITEM_DELETE_ERROR);
    }
  }

  // ── 유형별 그룹핑 ──
  function groupItemsByType(items: StageLayoutItem[]) {
    const groups: Partial<Record<StageLayoutItemType, StageLayoutItem[]>> = {};
    for (const item of items) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type]!.push(item);
    }
    return groups;
  }

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  무대 평면도
                </CardTitle>
                {stats.totalPlans > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {stats.totalPlans}개 플랜 · {stats.totalItems}개 아이템
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            {loading ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                불러오는 중...
              </div>
            ) : (
              <div className="space-y-3">
                {/* 플랜 탭 + 추가 버튼 */}
                <div className="flex items-center gap-2 flex-wrap">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
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
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    플랜 추가
                  </Button>
                </div>

                {/* 선택된 플랜 내용 */}
                {selectedPlan ? (
                  <div className="space-y-3">
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
                          >
                            {selectedPlan.stageWidth
                              ? `${selectedPlan.stageWidth}m`
                              : "?"}
                            {" x "}
                            {selectedPlan.stageDepth
                              ? `${selectedPlan.stageDepth}m`
                              : "?"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setAddItemDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          아이템 추가
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeletePlan(selectedPlan.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* 무대 평면도 캔버스 */}
                    <div
                      className="relative w-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden"
                      style={{ paddingBottom: "56.25%" /* 16:9 비율 */ }}
                      onClick={() => setActiveItemId(null)}
                    >
                      {/* 무대 레이블 */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
                        <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          무대 앞
                        </span>
                      </div>
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10">
                        <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          무대 뒤
                        </span>
                      </div>

                      {/* 아이템들 */}
                      {selectedPlan.items.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-slate-400">
                            아이템을 추가해주세요
                          </span>
                        </div>
                      )}
                      {selectedPlan.items.map((item) => (
                        <StageItem
                          key={item.id}
                          item={item}
                          isActive={activeItemId === item.id}
                          onActivate={(id) => {
                            setActiveItemId((prev) =>
                              prev === id ? null : id
                            );
                          }}
                          onEdit={handleOpenEditItem}
                          onDelete={handleDeleteItem}
                        />
                      ))}
                    </div>

                    {/* 아이템 목록 (유형별 그룹핑) */}
                    {selectedPlan.items.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          아이템 목록
                        </p>
                        {Object.entries(groupItemsByType(selectedPlan.items)).map(
                          ([type, items]) => (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                                    ITEM_TYPE_BADGE_COLORS[type as StageLayoutItemType]
                                  }`}
                                >
                                  {ITEM_TYPE_ICONS[type as StageLayoutItemType]}
                                  {ITEM_TYPE_LABELS[type as StageLayoutItemType]}
                                  <span className="font-semibold ml-0.5">
                                    {items!.length}
                                  </span>
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 pl-2">
                                {items!.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-1 text-[10px] bg-muted rounded px-1.5 py-0.5 group"
                                  >
                                    <span className="text-foreground">
                                      {item.label}
                                    </span>
                                    <span className="text-muted-foreground">
                                      ({item.x.toFixed(0)}%,{" "}
                                      {item.y.toFixed(0)}%)
                                    </span>
                                    <button
                                      className="hidden group-hover:inline-flex items-center text-muted-foreground hover:text-primary"
                                      onClick={() => handleOpenEditItem(item)}
                                    >
                                      <Pencil className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      className="hidden group-hover:inline-flex items-center text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        handleDeleteItem(item.id)
                                      }
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground py-4 text-center">
                    플랜을 추가하여 무대 평면도를 작성해보세요.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 플랜 추가 다이얼로그 */}
      <Dialog open={addPlanDialogOpen} onOpenChange={setAddPlanDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">새 플랜 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">플랜 이름 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예) 메인 공연 무대"
                value={planForm.planName}
                onChange={(e) =>
                  setPlanForm((f) => ({ ...f, planName: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">무대 너비 (m)</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  placeholder="예) 12"
                  value={planForm.stageWidth}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, stageWidth: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">무대 깊이 (m)</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  placeholder="예) 8"
                  value={planForm.stageDepth}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, stageDepth: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddPlanDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddPlan}
              disabled={saving}
            >
              {saving ? "저장 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// ============================================================
// StageItem 컴포넌트 (무대 위 아이템)
// ============================================================

interface StageItemProps {
  item: StageLayoutItem;
  isActive: boolean;
  onActivate: (id: string) => void;
  onEdit: (item: StageLayoutItem) => void;
  onDelete: (id: string) => void;
}

function StageItem({
  item,
  isActive,
  onActivate,
  onEdit,
  onDelete,
}: StageItemProps) {
  const w = item.width ?? DEFAULT_ITEM_SIZE;
  const h = item.height ?? DEFAULT_ITEM_SIZE;
  const rotation = item.rotation ?? 0;

  return (
    <Popover open={isActive} onOpenChange={(open) => !open && onActivate("")}>
      <PopoverTrigger asChild>
        <div
          className={`absolute flex flex-col items-center justify-center rounded border cursor-pointer transition-all hover:opacity-90 hover:scale-105 shadow-sm ${
            ITEM_TYPE_COLORS[item.type]
          } ${isActive ? "ring-2 ring-white ring-offset-1 scale-110 z-20" : "z-10"}`}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${w}%`,
            height: `${h * (16 / 9)}%`, // 캔버스 비율 보정
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onActivate(item.id);
          }}
          title={item.label}
        >
          <div className="flex flex-col items-center gap-0.5 px-0.5">
            <span className="[&>svg]:h-2.5 [&>svg]:w-2.5">
              {ITEM_TYPE_ICONS[item.type]}
            </span>
            <span
              className="text-[8px] leading-tight text-center font-medium truncate max-w-full"
              style={{ fontSize: "clamp(6px, 0.7vw, 9px)" }}
            >
              {item.label}
            </span>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" side="top">
        <div className="space-y-2">
          {/* 헤더 */}
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                ITEM_TYPE_BADGE_COLORS[item.type]
              }`}
            >
              {ITEM_TYPE_ICONS[item.type]}
              {ITEM_TYPE_LABELS[item.type]}
            </span>
            <span className="text-xs font-semibold">{item.label}</span>
          </div>
          {/* 정보 */}
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p>
              위치: X {item.x.toFixed(1)}% / Y {item.y.toFixed(1)}%
            </p>
            {rotation !== 0 && <p>회전: {rotation}°</p>}
            {item.notes && (
              <p className="text-foreground bg-muted rounded px-1.5 py-1">
                {item.notes}
              </p>
            )}
          </div>
          {/* 버튼 */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] flex-1"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-2.5 w-2.5 mr-1" />
              편집
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] text-destructive hover:text-destructive flex-1"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-2.5 w-2.5 mr-1" />
              삭제
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// ItemFormDialog 컴포넌트 (추가/수정 공용)
// ============================================================

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: ItemFormState;
  onFormChange: React.Dispatch<React.SetStateAction<ItemFormState>>;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
}

function ItemFormDialog({
  open,
  onOpenChange,
  title,
  form,
  onFormChange,
  onSubmit,
  saving,
  submitLabel,
}: ItemFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 유형 */}
          <div className="space-y-1.5">
            <Label className="text-xs">유형 *</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                onFormChange((f) => ({ ...f, type: v as StageLayoutItemType }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {ITEM_TYPE_ICONS[t]}
                      {ITEM_TYPE_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 라벨 */}
          <div className="space-y-1.5">
            <Label className="text-xs">라벨 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예) 메인 스피커 L"
              value={form.label}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, label: e.target.value }))
              }
            />
          </div>

          {/* 위치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">X 위치 (0~100%)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                max={100}
                value={form.x}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    x: Math.min(100, Math.max(0, Number(e.target.value))),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Y 위치 (0~100%)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                max={100}
                value={form.y}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    y: Math.min(100, Math.max(0, Number(e.target.value))),
                  }))
                }
              />
            </div>
          </div>

          {/* 크기 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">너비 (%)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                max={50}
                value={form.width}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    width: Math.min(50, Math.max(1, Number(e.target.value))),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">높이 (%)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                max={50}
                value={form.height}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    height: Math.min(50, Math.max(1, Number(e.target.value))),
                  }))
                }
              />
            </div>
          </div>

          {/* 회전 */}
          <div className="space-y-1.5">
            <Label className="text-xs">회전 (도)</Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={0}
              max={359}
              value={form.rotation}
              onChange={(e) =>
                onFormChange((f) => ({
                  ...f,
                  rotation: Number(e.target.value) % 360,
                }))
              }
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 정보를 입력해주세요."
              value={form.notes}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "저장 중..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
