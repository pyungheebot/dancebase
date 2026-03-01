"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  Pencil,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupEquipment } from "@/hooks/use-group-equipment";
import type {
  GroupEquipmentItem,
  EquipmentCategory,
  GroupEquipmentCondition,
} from "@/types";

// ——————————————————————————————
// 상수 / 유틸
// ——————————————————————————————

const CATEGORY_CONFIG: Record<
  EquipmentCategory,
  { label: string; color: string }
> = {
  audio: { label: "음향", color: "bg-blue-100 text-blue-700" },
  lighting: { label: "조명", color: "bg-yellow-100 text-yellow-700" },
  costume: { label: "의상", color: "bg-pink-100 text-pink-700" },
  prop: { label: "소품", color: "bg-purple-100 text-purple-700" },
  other: { label: "기타", color: "bg-gray-100 text-gray-600" },
};

const CONDITION_CONFIG: Record<
  GroupEquipmentCondition,
  { label: string; color: string }
> = {
  good: { label: "양호", color: "bg-green-100 text-green-700" },
  fair: { label: "보통", color: "bg-yellow-100 text-yellow-700" },
  poor: { label: "불량", color: "bg-orange-100 text-orange-700" },
  broken: { label: "고장", color: "bg-red-100 text-red-700" },
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  audio: "음향",
  lighting: "조명",
  costume: "의상",
  prop: "소품",
  other: "기타",
};

const CONDITION_LABELS: Record<GroupEquipmentCondition, string> = {
  good: "양호",
  fair: "보통",
  poor: "불량",
  broken: "고장",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ——————————————————————————————
// 장비 추가/수정 다이얼로그
// ——————————————————————————————

type ItemFormState = {
  name: string;
  category: EquipmentCategory;
  quantity: string;
  condition: GroupEquipmentCondition;
  location: string;
  notes: string;
};

const DEFAULT_FORM: ItemFormState = {
  name: "",
  category: "other",
  quantity: "1",
  condition: "good",
  location: "",
  notes: "",
};

function ItemFormDialog({
  open,
  onClose,
  initialData,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<ItemFormState>;
  onSubmit: (form: ItemFormState) => void;
  title: string;
}) {
  const [form, setForm] = useState<ItemFormState>({
    ...DEFAULT_FORM,
    ...initialData,
  });

  function handleOpen(isOpen: boolean) {
    if (!isOpen) onClose();
    else setForm({ ...DEFAULT_FORM, ...initialData });
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error(TOAST.GROUP_EQUIPMENT_CARD.NAME_REQUIRED);
      return;
    }
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error(TOAST.GROUP_EQUIPMENT_CARD.QUANTITY_MIN);
      return;
    }
    onSubmit({ ...form, quantity: String(qty) });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">장비 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 블루투스 스피커"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as EquipmentCategory }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as EquipmentCategory[]).map(
                    (key) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {CATEGORY_LABELS[key]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={form.condition}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, condition: v as GroupEquipmentCondition }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONDITION_LABELS) as GroupEquipmentCondition[]).map(
                    (key) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {CONDITION_LABELS[key]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수량</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">보관 위치</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 연습실 창고 A"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Input
              className="h-8 text-xs"
              placeholder="추가 정보"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 대여 다이얼로그
// ——————————————————————————————

function BorrowDialog({
  open,
  onClose,
  item,
  onBorrow,
}: {
  open: boolean;
  onClose: () => void;
  item: GroupEquipmentItem | null;
  onBorrow: (params: {
    equipmentId: string;
    borrowerName: string;
    quantity: number;
    notes: string;
  }) => void;
}) {
  const [borrowerName, setBorrowerName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  function handleClose() {
    setBorrowerName("");
    setQuantity("1");
    setNotes("");
    onClose();
  }

  function handleSubmit() {
    if (!item) return;
    if (!borrowerName.trim()) {
      toast.error(TOAST.GROUP_EQUIPMENT_CARD.RENTER_REQUIRED);
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error(TOAST.GROUP_EQUIPMENT_CARD.QUANTITY_MIN);
      return;
    }
    if (qty > item.quantity) {
      toast.error(`보유 수량(${item.quantity}개)을 초과할 수 없습니다.`);
      return;
    }
    onBorrow({ equipmentId: item.id, borrowerName, quantity: qty, notes });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            장비 대여 — {item?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">대여자 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이름 입력"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수량 (최대 {item?.quantity ?? 1}개)</Label>
            <Input
              type="number"
              min={1}
              max={item?.quantity ?? 1}
              className="h-8 text-xs"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Input
              className="h-8 text-xs"
              placeholder="대여 목적 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            대여 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 카테고리 차트 (CSS 기반)
// ——————————————————————————————

function CategoryChart({
  breakdown,
  total,
}: {
  breakdown: Record<EquipmentCategory, number>;
  total: number;
}) {
  if (total === 0) return null;

  const CHART_COLORS: Record<EquipmentCategory, string> = {
    audio: "bg-blue-400",
    lighting: "bg-yellow-400",
    costume: "bg-pink-400",
    prop: "bg-purple-400",
    other: "bg-gray-400",
  };

  const entries = (
    Object.keys(breakdown) as EquipmentCategory[]
  ).filter((k) => breakdown[k] > 0);

  return (
    <div className="space-y-1.5">
      {/* 가로 바 차트 */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {entries.map((key) => {
          const pct = Math.round((breakdown[key] / total) * 100);
          return (
            <div
              key={key}
              className={`${CHART_COLORS[key]} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${CATEGORY_LABELS[key]}: ${breakdown[key]}개`}
            />
          );
        })}
      </div>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map((key) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${CHART_COLORS[key]}`}
            />
            <span className="text-[10px] text-muted-foreground">
              {CATEGORY_LABELS[key]} {breakdown[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ——————————————————————————————
// 메인 컴포넌트
// ——————————————————————————————

export function GroupEquipmentCard({ groupId }: { groupId: string }) {
  const {
    equipment,
    loading,
    totalItems,
    onLoanCount,
    activeLoans,
    categoryBreakdown,
    addItem,
    updateItem,
    deleteItem,
    borrowItem,
    returnItem,
    deleteLoan,
  } = useGroupEquipment(groupId);

  // UI 상태
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupEquipmentItem | null>(null);
  const [borrowTarget, setBorrowTarget] = useState<GroupEquipmentItem | null>(
    null
  );
  const [filterCategory, setFilterCategory] = useState<
    EquipmentCategory | "all"
  >("all");
  const [showLoans, setShowLoans] = useState(false);

  // 필터링된 장비 목록
  const filteredItems =
    filterCategory === "all"
      ? equipment.items
      : equipment.items.filter((item) => item.category === filterCategory);

  // 장비 추가 핸들러
  function handleAddItem(form: ItemFormState) {
    addItem({
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity, 10),
      condition: form.condition,
      location: form.location.trim() || null,
      notes: form.notes.trim(),
    });
    toast.success(TOAST.GROUP_EQUIPMENT_CARD.ADDED);
  }

  // 장비 수정 핸들러
  function handleUpdateItem(form: ItemFormState) {
    if (!editTarget) return;
    updateItem(editTarget.id, {
      name: form.name,
      category: form.category,
      quantity: parseInt(form.quantity, 10),
      condition: form.condition,
      location: form.location.trim() || null,
      notes: form.notes.trim(),
    });
    toast.success(TOAST.GROUP_EQUIPMENT_CARD.UPDATED);
    setEditTarget(null);
  }

  // 장비 삭제 핸들러
  function handleDeleteItem(itemId: string) {
    deleteItem(itemId);
    toast.success(TOAST.GROUP_EQUIPMENT_CARD.DELETED);
  }

  // 대여 핸들러
  function handleBorrow(params: {
    equipmentId: string;
    borrowerName: string;
    quantity: number;
    notes: string;
  }) {
    borrowItem(params);
    toast.success(TOAST.GROUP_EQUIPMENT_CARD.RENTAL_REGISTERED);
  }

  // 반납 핸들러
  function handleReturn(loanId: string) {
    returnItem(loanId);
    toast.success(TOAST.GROUP_EQUIPMENT_CARD.RETURN_DONE);
  }

  // 대여 기록 삭제 핸들러
  function handleDeleteLoan(loanId: string) {
    deleteLoan(loanId);
    toast.success(TOAST.GROUP_EQUIPMENT_CARD.RENTAL_DELETED);
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">그룹 장비 관리</span>
              {totalItems > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
                  {totalItems}종
                </Badge>
              )}
              {onLoanCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-0">
                  대여중 {onLoanCount}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              장비 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              불러오는 중...
            </p>
          ) : totalItems === 0 ? (
            /* 빈 상태 */
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                등록된 장비가 없습니다.
              </p>
              <p className="text-xs text-muted-foreground/70">
                공용 장비를 추가하면 대여/반납을 추적할 수 있습니다.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs mt-1"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 장비 추가
              </Button>
            </div>
          ) : (
            <>
              {/* 카테고리 차트 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 mb-1">
                  <BarChart3 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    카테고리별 분포
                  </span>
                </div>
                <CategoryChart
                  breakdown={categoryBreakdown}
                  total={totalItems}
                />
              </div>

              {/* 카테고리 필터 */}
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    "all",
                    ...Object.keys(CATEGORY_CONFIG),
                  ] as (EquipmentCategory | "all")[]
                ).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterCategory === cat
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/50"
                    }`}
                  >
                    {cat === "all"
                      ? `전체 ${totalItems}`
                      : `${CATEGORY_CONFIG[cat].label} ${categoryBreakdown[cat]}`}
                  </button>
                ))}
              </div>

              {/* 장비 목록 */}
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    해당 카테고리의 장비가 없습니다.
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 rounded-lg border p-2.5"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium truncate">
                            {item.name}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 border-0 ${CATEGORY_CONFIG[item.category].color}`}
                          >
                            {CATEGORY_CONFIG[item.category].label}
                          </Badge>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 border-0 ${CONDITION_CONFIG[item.condition].color}`}
                          >
                            {CONDITION_CONFIG[item.condition].label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {item.quantity}개
                          </span>
                        </div>
                        {(item.location || item.notes) && (
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            {item.location && (
                              <div className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3 text-muted-foreground/60" />
                                <span className="text-[10px] text-muted-foreground">
                                  {item.location}
                                </span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="flex items-center gap-0.5">
                                <FileText className="h-3 w-3 text-muted-foreground/60" />
                                <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                  {item.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-1.5"
                          onClick={() => setBorrowTarget(item)}
                        >
                          <ArrowDownToLine className="h-3 w-3 mr-0.5" />
                          대여
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setEditTarget(item)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 대여 중 목록 토글 */}
              {activeLoans.length > 0 && (
                <div className="border rounded-lg">
                  <button
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium"
                    onClick={() => setShowLoans((v) => !v)}
                  >
                    <div className="flex items-center gap-1.5">
                      <ArrowDownToLine className="h-3 w-3 text-orange-500" />
                      <span>현재 대여 중 ({activeLoans.length}건)</span>
                    </div>
                    {showLoans ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>

                  {showLoans && (
                    <div className="border-t divide-y">
                      {activeLoans.map((loan) => {
                        const item = equipment.items.find(
                          (i) => i.id === loan.equipmentId
                        );
                        return (
                          <div
                            key={loan.id}
                            className="flex items-center gap-2 px-3 py-2"
                          >
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium">
                                  {loan.borrowerName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {item?.name ?? "알 수 없는 장비"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {loan.quantity}개
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDateTime(loan.borrowedAt)}
                                {loan.notes && ` · ${loan.notes}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5"
                                onClick={() => handleReturn(loan.id)}
                              >
                                <ArrowUpFromLine className="h-3 w-3 mr-0.5" />
                                반납
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteLoan(loan.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 장비 추가 다이얼로그 */}
      <ItemFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddItem}
        title="장비 추가"
      />

      {/* 장비 수정 다이얼로그 */}
      <ItemFormDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initialData={
          editTarget
            ? {
                name: editTarget.name,
                category: editTarget.category,
                quantity: String(editTarget.quantity),
                condition: editTarget.condition,
                location: editTarget.location ?? "",
                notes: editTarget.notes,
              }
            : undefined
        }
        onSubmit={handleUpdateItem}
        title="장비 수정"
      />

      {/* 대여 다이얼로그 */}
      <BorrowDialog
        open={!!borrowTarget}
        onClose={() => setBorrowTarget(null)}
        item={borrowTarget}
        onBorrow={handleBorrow}
      />
    </>
  );
}
