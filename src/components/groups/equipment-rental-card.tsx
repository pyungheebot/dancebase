"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  History,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { useEquipmentRental } from "@/hooks/use-equipment-rental";
import type {
  EquipmentRentalItem,
  EquipmentRentalRecord,
  EquipmentRentalStatus,
} from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const STATUS_LABELS: Record<EquipmentRentalStatus, string> = {
  available: "대여가능",
  rented: "대여중",
  overdue: "연체",
  maintenance: "정비중",
};

const STATUS_COLORS: Record<EquipmentRentalStatus, string> = {
  available: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  maintenance: "bg-yellow-100 text-yellow-700",
};

const FILTER_OPTIONS: { label: string; value: EquipmentRentalStatus | "all" }[] =
  [
    { label: "전체", value: "all" },
    { label: "대여가능", value: "available" },
    { label: "대여중", value: "rented" },
    { label: "연체", value: "overdue" },
    { label: "정비중", value: "maintenance" },
  ];

const DEFAULT_CATEGORIES = ["음향", "조명", "무대", "연습용품", "의상", "기타"];

// ─── 하위 컴포넌트: 대여 이력 행 ─────────────────────────────

function RentalHistoryRow({
  rental,
  itemId,
  onReturn,
}: {
  rental: EquipmentRentalRecord;
  itemId: string;
  onReturn: (itemId: string, rentalId: string, condition?: string) => void;
}) {
  const [returning, setReturning] = useState(false);
  const [condition, setCondition] = useState("");
  const isReturned = !!rental.returnDate;
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = !isReturned && rental.dueDate < today;

  return (
    <div className="rounded border bg-gray-50 p-2 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{rental.borrower}</span>
        {isReturned ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600">
            반납완료
          </Badge>
        ) : isOverdue ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700">
            연체중
          </Badge>
        ) : (
          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">
            대여중
          </Badge>
        )}
      </div>
      <div className="text-gray-500">
        대여일: {rental.borrowDate} / 반납예정: {rental.dueDate}
      </div>
      {isReturned && (
        <div className="text-gray-500">
          반납일: {rental.returnDate}
          {rental.condition && ` / 상태: ${rental.condition}`}
        </div>
      )}
      {!isReturned && !returning && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2 mt-1"
          onClick={() => setReturning(true)}
        >
          반납 처리
        </Button>
      )}
      {!isReturned && returning && (
        <div className="space-y-1 mt-1">
          <Input
            className="h-6 text-xs"
            placeholder="반납 상태 메모 (선택)"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => {
                onReturn(itemId, rental.id, condition || undefined);
                setReturning(false);
                setCondition("");
              }}
            >
              확인
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] px-2"
              onClick={() => {
                setReturning(false);
                setCondition("");
              }}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 하위 컴포넌트: 장비 행 ───────────────────────────────────

function ItemRow({
  item,
  onEdit,
  onDelete,
  onRent,
  onReturn,

}: {
  item: EquipmentRentalItem;
  onEdit: (item: EquipmentRentalItem) => void;
  onDelete: (id: string) => void;
  onRent: (item: EquipmentRentalItem) => void;
  onReturn: (itemId: string, rentalId: string, condition?: string) => void;
  memberNames?: string[];
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeRentals = item.rentals.filter((r) => !r.returnDate);
  const pastRentals = item.rentals.filter((r) => !!r.returnDate);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* 장비 헤더 */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{item.name}</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700">
              {item.category}
            </Badge>
            <Badge
              className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[item.status]}`}
            >
              {STATUS_LABELS[item.status]}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            재고: {item.availableQuantity} / {item.totalQuantity}개 가용
            {item.description && ` · ${item.description}`}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            disabled={item.availableQuantity <= 0 || item.status === "maintenance"}
            onClick={() => onRent(item)}
          >
            대여
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setHistoryOpen((v) => !v)}
            title="대여 이력"
          >
            <History className="h-3.5 w-3.5 text-gray-500" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(item)}
            title="편집"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-500" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
            onClick={() => onDelete(item.id)}
            title="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 대여 이력 */}
      {historyOpen && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          {item.rentals.length === 0 && (
            <p className="text-xs text-gray-400">대여 이력이 없습니다.</p>
          )}
          {activeRentals.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                대여중 ({activeRentals.length})
              </p>
              {activeRentals.map((r) => (
                <RentalHistoryRow
                  key={r.id}
                  rental={r}
                  itemId={item.id}
                  onReturn={onReturn}
                />
              ))}
            </div>
          )}
          {pastRentals.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                반납완료 ({pastRentals.length})
              </p>
              {pastRentals.map((r) => (
                <RentalHistoryRow
                  key={r.id}
                  rental={r}
                  itemId={item.id}
                  onReturn={onReturn}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

type Props = {
  groupId: string;
  memberNames?: string[];
};

export function EquipmentRentalCard({ groupId, memberNames = [] }: Props) {
  const {
    items,
    stats,
    addItem,
    updateItem,
    deleteItem,
    rentItem,
    returnItem,
    getOverdueRentals,
  } = useEquipmentRental(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<EquipmentRentalStatus | "all">("all");

  // 장비 추가/편집 다이얼로그
  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    editing: EquipmentRentalItem | null;
  }>({ open: false, editing: null });
  const [itemForm, setItemForm] = useState({
    name: "",
    category: DEFAULT_CATEGORIES[0],
    totalQuantity: 1,
    description: "",
  });

  // 대여 다이얼로그
  const [rentDialog, setRentDialog] = useState<{
    open: boolean;
    item: EquipmentRentalItem | null;
  }>({ open: false, item: null });
  const [rentForm, setRentForm] = useState({
    borrower: "",
    dueDate: "",
  });

  const overdueList = getOverdueRentals();

  // 필터링된 항목
  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  // ── 장비 다이얼로그 열기 ──────────────────────────────────

  function openAddDialog() {
    setItemForm({
      name: "",
      category: DEFAULT_CATEGORIES[0],
      totalQuantity: 1,
      description: "",
    });
    setItemDialog({ open: true, editing: null });
  }

  function openEditDialog(item: EquipmentRentalItem) {
    setItemForm({
      name: item.name,
      category: item.category,
      totalQuantity: item.totalQuantity,
      description: item.description ?? "",
    });
    setItemDialog({ open: true, editing: item });
  }

  // ── 장비 저장 ─────────────────────────────────────────────

  async function handleSaveItem() {
    const { name, category, totalQuantity, description } = itemForm;
    if (!name.trim()) {
      toast.error("장비 이름을 입력해주세요.");
      return;
    }
    if (totalQuantity < 1) {
      toast.error("수량은 1 이상이어야 합니다.");
      return;
    }

    try {
      if (itemDialog.editing) {
        const diff =
          totalQuantity - itemDialog.editing.totalQuantity;
        const newAvail = Math.max(
          0,
          itemDialog.editing.availableQuantity + diff
        );
        await updateItem(itemDialog.editing.id, {
          name: name.trim(),
          category,
          totalQuantity,
          availableQuantity: newAvail,
          description: description.trim() || undefined,
        });
        toast.success("장비 정보가 수정되었습니다.");
      } else {
        await addItem({
          name: name.trim(),
          category,
          totalQuantity,
          availableQuantity: totalQuantity,
          description: description.trim() || undefined,
        });
        toast.success("장비가 추가되었습니다.");
      }
      setItemDialog({ open: false, editing: null });
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    }
  }

  // ── 장비 삭제 ─────────────────────────────────────────────

  async function handleDeleteItem(id: string) {
    try {
      await deleteItem(id);
      toast.success("장비가 삭제되었습니다.");
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  }

  // ── 대여 처리 ─────────────────────────────────────────────

  function openRentDialog(item: EquipmentRentalItem) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    setRentForm({
      borrower: memberNames[0] ?? "",
      dueDate: tomorrow.toISOString().slice(0, 10),
    });
    setRentDialog({ open: true, item });
  }

  async function handleRent() {
    const { borrower, dueDate } = rentForm;
    if (!borrower.trim()) {
      toast.error("대여자를 입력해주세요.");
      return;
    }
    if (!dueDate) {
      toast.error("반납 예정일을 선택해주세요.");
      return;
    }
    if (!rentDialog.item) return;

    try {
      await rentItem(rentDialog.item.id, borrower.trim(), dueDate);
      toast.success(`${rentDialog.item.name} 대여 처리 완료`);
      setRentDialog({ open: false, item: null });
    } catch {
      toast.error("대여 처리 중 오류가 발생했습니다.");
    }
  }

  // ── 반납 처리 ─────────────────────────────────────────────

  async function handleReturn(
    itemId: string,
    rentalId: string,
    condition?: string
  ) {
    try {
      await returnItem(itemId, rentalId, condition);
      toast.success("반납 처리 완료");
    } catch {
      toast.error("반납 처리 중 오류가 발생했습니다.");
    }
  }

  // ─── 렌더 ─────────────────────────────────────────────────

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-xl border bg-white shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
              <Package className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="flex-1 text-sm font-semibold text-gray-800">
                장비 대여 관리
              </span>

              {/* 통계 배지 */}
              <div className="flex items-center gap-1.5">
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600">
                  전체 {stats.totalItems}
                </Badge>
                {stats.overdueItems > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700">
                    연체 {stats.overdueItems}
                  </Badge>
                )}
                {stats.rentedItems > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">
                    대여중 {stats.rentedItems}
                  </Badge>
                )}
              </div>

              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Separator />

            <div className="p-4 space-y-3">
              {/* 연체 경고 배너 */}
              {overdueList.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 text-xs text-red-700">
                    <p className="font-semibold">연체 장비 {overdueList.length}건</p>
                    <ul className="mt-0.5 space-y-0.5">
                      {overdueList.map(({ item, rental }) => (
                        <li key={rental.id}>
                          {item.name} - {rental.borrower} (반납예정:{" "}
                          {rental.dueDate})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 필터 + 추가 버튼 */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 flex-wrap flex-1">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                        filter === opt.value
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={openAddDialog}
                >
                  <Plus className="h-3 w-3" />
                  장비 추가
                </Button>
              </div>

              {/* 장비 목록 */}
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  {items.length === 0
                    ? "등록된 장비가 없습니다. 장비를 추가해보세요."
                    : "해당 상태의 장비가 없습니다."}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteItem}
                      onRent={openRentDialog}
                      onReturn={handleReturn}
                      memberNames={memberNames}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* ── 장비 추가/편집 다이얼로그 ── */}
      <Dialog
        open={itemDialog.open}
        onOpenChange={(v) => setItemDialog((prev) => ({ ...prev, open: v }))}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {itemDialog.editing ? "장비 편집" : "장비 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                장비 이름 <span className="text-red-500">*</span>
              </label>
              <Input
                className="h-8 text-sm"
                placeholder="예: 블루투스 스피커"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">카테고리</label>
              <div className="flex gap-1.5 flex-wrap">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setItemForm((f) => ({ ...f, category: cat }))}
                    className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                      itemForm.category === cat
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">총 수량</label>
              <Input
                type="number"
                min={1}
                className="h-8 text-sm"
                value={itemForm.totalQuantity}
                onChange={(e) =>
                  setItemForm((f) => ({
                    ...f,
                    totalQuantity: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">설명 (선택)</label>
              <Textarea
                className="text-sm resize-none"
                rows={2}
                placeholder="장비에 대한 간단한 설명"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemDialog({ open: false, editing: null })}
            >
              취소
            </Button>
            <Button size="sm" onClick={handleSaveItem}>
              {itemDialog.editing ? "저장" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 대여 다이얼로그 ── */}
      <Dialog
        open={rentDialog.open}
        onOpenChange={(v) =>
          setRentDialog((prev) => ({ ...prev, open: v }))
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              장비 대여 - {rentDialog.item?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {rentDialog.item && (
              <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                가용 재고:{" "}
                <span className="font-semibold text-gray-800">
                  {rentDialog.item.availableQuantity}
                </span>{" "}
                / {rentDialog.item.totalQuantity}개
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                대여자 <span className="text-red-500">*</span>
              </label>
              {memberNames.length > 0 ? (
                <select
                  className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                  value={rentForm.borrower}
                  onChange={(e) =>
                    setRentForm((f) => ({ ...f, borrower: e.target.value }))
                  }
                >
                  {memberNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="">직접 입력...</option>
                </select>
              ) : (
                <Input
                  className="h-8 text-sm"
                  placeholder="대여자 이름"
                  value={rentForm.borrower}
                  onChange={(e) =>
                    setRentForm((f) => ({ ...f, borrower: e.target.value }))
                  }
                />
              )}
              {memberNames.length > 0 && rentForm.borrower === "" && (
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="이름 직접 입력"
                  onChange={(e) =>
                    setRentForm((f) => ({ ...f, borrower: e.target.value }))
                  }
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                반납 예정일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={rentForm.dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                  setRentForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRentDialog({ open: false, item: null })}
            >
              취소
            </Button>
            <Button size="sm" onClick={handleRent}>
              대여 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
