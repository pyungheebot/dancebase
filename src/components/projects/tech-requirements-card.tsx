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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Wrench,
  AlertTriangle,
  Volume2,
  Lightbulb,
  Video,
  LayoutGrid,
  Zap,
  Radio,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useTechRequirements } from "@/hooks/use-tech-requirements";
import type {
  TechRequirementItem,
  TechRequirementCategory,
  TechRequirementPriority,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CATEGORY_LABELS: Record<TechRequirementCategory, string> = {
  sound: "음향",
  lighting: "조명",
  video: "영상",
  stage: "무대",
  power: "전력",
  communication: "통신",
  other: "기타",
};

const CATEGORY_ICONS: Record<TechRequirementCategory, React.ReactNode> = {
  sound: <Volume2 className="h-3.5 w-3.5" />,
  lighting: <Lightbulb className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  stage: <LayoutGrid className="h-3.5 w-3.5" />,
  power: <Zap className="h-3.5 w-3.5" />,
  communication: <Radio className="h-3.5 w-3.5" />,
  other: <MoreHorizontal className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<TechRequirementCategory, string> = {
  sound: "text-blue-500",
  lighting: "text-yellow-500",
  video: "text-purple-500",
  stage: "text-green-500",
  power: "text-orange-500",
  communication: "text-cyan-500",
  other: "text-gray-500",
};

const CATEGORY_BG: Record<TechRequirementCategory, string> = {
  sound: "bg-blue-50 border-blue-200",
  lighting: "bg-yellow-50 border-yellow-200",
  video: "bg-purple-50 border-purple-200",
  stage: "bg-green-50 border-green-200",
  power: "bg-orange-50 border-orange-200",
  communication: "bg-cyan-50 border-cyan-200",
  other: "bg-gray-50 border-gray-200",
};

const PRIORITY_LABELS: Record<TechRequirementPriority, string> = {
  essential: "필수",
  important: "중요",
  nice_to_have: "선택",
};

const PRIORITY_COLORS: Record<TechRequirementPriority, string> = {
  essential: "bg-red-100 text-red-700 border-red-300",
  important: "bg-orange-100 text-orange-700 border-orange-300",
  nice_to_have: "bg-blue-100 text-blue-700 border-blue-300",
};

const CATEGORY_ORDER: TechRequirementCategory[] = [
  "sound",
  "lighting",
  "video",
  "stage",
  "power",
  "communication",
  "other",
];

const PRIORITY_OPTIONS: TechRequirementPriority[] = [
  "essential",
  "important",
  "nice_to_have",
];

// ============================================================
// 폼 타입
// ============================================================

type ItemFormData = {
  category: TechRequirementCategory;
  title: string;
  description: string;
  priority: TechRequirementPriority;
  quantity: string;
  isAvailable: boolean;
  supplier: string;
  estimatedCost: string;
  assignedTo: string;
  notes: string;
};

function emptyItemForm(): ItemFormData {
  return {
    category: "sound",
    title: "",
    description: "",
    priority: "essential",
    quantity: "",
    isAvailable: false,
    supplier: "",
    estimatedCost: "",
    assignedTo: "",
    notes: "",
  };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function TechRequirementsCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailable,
    getByCategory,
    getUnavailable,
    stats,
  } = useTechRequirements(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);

  // 항목 추가/편집 다이얼로그
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TechRequirementItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(emptyItemForm());
  const [itemSaving, setItemSaving] = useState(false);

  // 카테고리 섹션 확장 상태
  const [expandedCategories, setExpandedCategories] = useState<Set<TechRequirementCategory>>(
    new Set(CATEGORY_ORDER)
  );

  const unavailableItems = getUnavailable();
  const readinessPercent =
    stats.totalItems > 0
      ? Math.round((stats.availableItems / stats.totalItems) * 100)
      : 0;

  // ── 카테고리 섹션 토글 ──
  function toggleCategory(cat: TechRequirementCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  // ── 아이템 다이얼로그 열기 ──
  function openAddItem(defaultCategory?: TechRequirementCategory) {
    setEditTarget(null);
    setItemForm({ ...emptyItemForm(), category: defaultCategory ?? "sound" });
    setItemDialogOpen(true);
  }

  function openEditItem(item: TechRequirementItem) {
    setEditTarget(item);
    setItemForm({
      category: item.category,
      title: item.title,
      description: item.description,
      priority: item.priority,
      quantity: item.quantity != null ? String(item.quantity) : "",
      isAvailable: item.isAvailable,
      supplier: item.supplier ?? "",
      estimatedCost: item.estimatedCost != null ? String(item.estimatedCost) : "",
      assignedTo: item.assignedTo ?? "",
      notes: item.notes ?? "",
    });
    setItemDialogOpen(true);
  }

  // ── 아이템 저장 ──
  async function handleItemSave() {
    if (!itemForm.title.trim()) {
      toast.error("장비명을 입력해주세요.");
      return;
    }

    setItemSaving(true);
    try {
      const qty = itemForm.quantity ? parseInt(itemForm.quantity, 10) : undefined;
      if (itemForm.quantity && (isNaN(qty!) || qty! < 1)) {
        toast.error("수량은 1 이상의 숫자여야 합니다.");
        return;
      }

      const payload: Omit<TechRequirementItem, "id" | "createdAt"> = {
        category: itemForm.category,
        title: itemForm.title.trim(),
        description: itemForm.description.trim(),
        priority: itemForm.priority,
        quantity: qty,
        isAvailable: itemForm.isAvailable,
        supplier: itemForm.supplier.trim() || undefined,
        estimatedCost: itemForm.estimatedCost
          ? parseFloat(itemForm.estimatedCost)
          : undefined,
        assignedTo: itemForm.assignedTo.trim() || undefined,
        notes: itemForm.notes.trim() || undefined,
      };

      if (editTarget) {
        await updateItem(editTarget.id, payload);
        toast.success("장비 정보가 수정되었습니다.");
      } else {
        await addItem(payload);
        toast.success("장비가 추가되었습니다.");
      }
      setItemDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setItemSaving(false);
    }
  }

  // ── 아이템 삭제 ──
  async function handleDelete(item: TechRequirementItem) {
    try {
      await deleteItem(item.id);
      toast.success(`'${item.title}' 장비가 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 가용 여부 토글 ──
  async function handleToggleAvailable(item: TechRequirementItem) {
    try {
      await toggleAvailable(item.id);
      toast.success(
        item.isAvailable
          ? `'${item.title}' 미확보로 변경되었습니다.`
          : `'${item.title}' 확보 완료로 변경되었습니다.`
      );
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Wrench className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    기술 요구사항
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-800 border border-indigo-300">
                    {stats.totalItems}건
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
                  openAddItem();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                장비 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalItems > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Progress value={readinessPercent} className="h-1.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                    준비율 {readinessPercent}%
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    확보{" "}
                    <span className="font-semibold text-green-600">
                      {stats.availableItems}
                    </span>
                    건
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    미확보{" "}
                    <span className="font-semibold text-red-600">
                      {stats.unavailableItems}
                    </span>
                    건
                  </span>
                  {stats.totalEstimatedCost > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      예상 비용{" "}
                      <span className="font-semibold text-foreground">
                        {stats.totalEstimatedCost.toLocaleString()}원
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 기술 요구사항이 없습니다.
                </p>
              ) : (
                <>
                  {/* 미확보 장비 경고 */}
                  {unavailableItems.length > 0 && (
                    <div className="rounded-md border border-orange-300 bg-orange-50 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-semibold text-orange-700">
                          미확보 장비 {unavailableItems.length}건
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {unavailableItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1.5 text-[10px] text-orange-700"
                          >
                            <span
                              className={`font-medium px-1 py-0 rounded border text-[9px] ${PRIORITY_COLORS[item.priority]}`}
                            >
                              {PRIORITY_LABELS[item.priority]}
                            </span>
                            <span className="truncate">{item.title}</span>
                            <span className="text-orange-500">
                              ({CATEGORY_LABELS[item.category]})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 카테고리별 섹션 */}
                  {CATEGORY_ORDER.map((cat) => {
                    const catItems = getByCategory(cat);
                    if (catItems.length === 0) return null;
                    const isCatExpanded = expandedCategories.has(cat);

                    return (
                      <div key={cat} className="rounded-md border overflow-hidden">
                        {/* 섹션 헤더 */}
                        <button
                          onClick={() => toggleCategory(cat)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:opacity-80 transition-opacity ${CATEGORY_BG[cat]}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={CATEGORY_COLORS[cat]}>
                              {CATEGORY_ICONS[cat]}
                            </span>
                            <span className="text-xs font-semibold">
                              {CATEGORY_LABELS[cat]}
                            </span>
                            <Badge className="text-[9px] px-1 py-0 bg-background/70 text-gray-700 border border-gray-300">
                              {catItems.length}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              확보 {catItems.filter((i) => i.isAvailable).length}/
                              {catItems.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAddItem(cat);
                              }}
                            >
                              <Plus className="h-2.5 w-2.5 mr-0.5" />
                              추가
                            </Button>
                            {isCatExpanded ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* 아이템 목록 */}
                        {isCatExpanded && (
                          <div className="divide-y">
                            {catItems.map((item) => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                onEdit={() => openEditItem(item)}
                                onDelete={() => handleDelete(item)}
                                onToggleAvailable={() => handleToggleAvailable(item)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 항목 추가/편집 다이얼로그 */}
      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        form={itemForm}
        setForm={setItemForm}
        onSave={handleItemSave}
        saving={itemSaving}
        isEdit={!!editTarget}
      />
    </>
  );
}

// ============================================================
// 아이템 행 컴포넌트
// ============================================================

function ItemRow({
  item,
  onEdit,
  onDelete,
  onToggleAvailable,
}: {
  item: TechRequirementItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailable: () => void;
}) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-2 bg-card hover:bg-muted/20 transition-colors">
      {/* 가용 여부 체크박스 */}
      <div className="mt-0.5 flex-shrink-0">
        <Checkbox
          checked={item.isAvailable}
          onCheckedChange={onToggleAvailable}
          className="h-3.5 w-3.5"
        />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-medium truncate ${
              item.isAvailable ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.title}
          </span>
          <Badge
            className={`text-[9px] px-1 py-0 border ${PRIORITY_COLORS[item.priority]}`}
          >
            {PRIORITY_LABELS[item.priority]}
          </Badge>
          {item.isAvailable && (
            <Badge className="text-[9px] px-1 py-0 bg-green-100 text-green-700 border border-green-300">
              확보
            </Badge>
          )}
        </div>

        {item.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.quantity != null && (
            <span className="text-[10px] text-muted-foreground">
              수량: <span className="font-medium text-foreground">{item.quantity}개</span>
            </span>
          )}
          {item.supplier && (
            <span className="text-[10px] text-muted-foreground">
              공급: <span className="font-medium text-foreground">{item.supplier}</span>
            </span>
          )}
          {item.estimatedCost != null && (
            <span className="text-[10px] text-muted-foreground">
              비용:{" "}
              <span className="font-medium text-foreground">
                {item.estimatedCost.toLocaleString()}원
              </span>
            </span>
          )}
          {item.assignedTo && (
            <span className="text-[10px] text-muted-foreground">
              담당: <span className="font-medium text-foreground">{item.assignedTo}</span>
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 항목 추가/편집 다이얼로그
// ============================================================

function ItemDialog({
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
  form: ItemFormData;
  setForm: (f: ItemFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-indigo-500" />
            {isEdit ? "장비 수정" : "장비 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">
              카테고리 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v as TechRequirementCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ORDER.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 장비명 */}
          <div className="space-y-1">
            <Label className="text-xs">
              장비명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 무선 마이크, LED 조명 세트"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="장비에 대한 상세 설명"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* 우선순위 + 가용 여부 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">
                우선순위 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  set("priority", v as TechRequirementPriority)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <div className="flex items-center gap-2 h-8 px-2 rounded-md border bg-background">
                <Checkbox
                  id="isAvailable"
                  checked={form.isAvailable}
                  onCheckedChange={(v) => set("isAvailable", !!v)}
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor="isAvailable"
                  className="text-xs cursor-pointer select-none"
                >
                  확보 완료
                </label>
              </div>
            </div>
          </div>

          {/* 수량 + 예상 비용 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">수량</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="1"
                placeholder="예: 2"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">예상 비용 (원)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="0"
                placeholder="예: 150000"
                value={form.estimatedCost}
                onChange={(e) => set("estimatedCost", e.target.value)}
              />
            </div>
          </div>

          {/* 공급자 + 담당자 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">공급자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="업체 또는 대여처"
                value={form.supplier}
                onChange={(e) => set("supplier", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">담당자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="담당 멤버 이름"
                value={form.assignedTo}
                onChange={(e) => set("assignedTo", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="추가 메모"
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
