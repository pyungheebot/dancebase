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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Gift,
  Package,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSponsoredGoods } from "@/hooks/use-sponsored-goods";
import type { SponsoredGoodsItem, SponsoredGoodsStatus } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const STATUS_LABELS: Record<SponsoredGoodsStatus, string> = {
  pending: "대기",
  received: "수령",
  distributed: "배분완료",
  returned: "반납",
};

const STATUS_COLORS: Record<SponsoredGoodsStatus, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-300",
  received: "bg-green-100 text-green-700 border-green-300",
  distributed: "bg-purple-100 text-purple-700 border-purple-300",
  returned: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_OPTIONS: SponsoredGoodsStatus[] = [
  "pending",
  "received",
  "distributed",
  "returned",
];

const STATUS_FILTER_OPTIONS: Array<{
  value: SponsoredGoodsStatus | "all";
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "received", label: "수령" },
  { value: "distributed", label: "배분완료" },
  { value: "returned", label: "반납" },
];

// ============================================================
// D-day 계산
// ============================================================

function calcDday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDday(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

// ============================================================
// 아이템 폼 타입
// ============================================================

type ItemFormData = {
  itemName: string;
  sponsor: string;
  quantity: string;
  status: SponsoredGoodsStatus;
  estimatedValue: string;
  receivedDate: string;
  returnDueDate: string;
  category: string;
  notes: string;
};

function emptyItemForm(): ItemFormData {
  return {
    itemName: "",
    sponsor: "",
    quantity: "1",
    status: "pending",
    estimatedValue: "",
    receivedDate: "",
    returnDueDate: "",
    category: "",
    notes: "",
  };
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function SponsoredGoodsCard({
  groupId,
  projectId,
  memberNames = [],
}: {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    updateStatus,
    distribute,
    getRemainingQuantity,
    stats,
  } = useSponsoredGoods(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SponsoredGoodsStatus | "all">("all");

  // 아이템 추가/편집 다이얼로그
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SponsoredGoodsItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(emptyItemForm());
  const [itemSaving, setItemSaving] = useState(false);

  // 배분 다이얼로그
  const [distDialogOpen, setDistDialogOpen] = useState(false);
  const [distTarget, setDistTarget] = useState<SponsoredGoodsItem | null>(null);
  const [distMember, setDistMember] = useState("");
  const [distQty, setDistQty] = useState("1");
  const [distSaving, setDistSaving] = useState(false);

  // 배분 내역 확장
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 필터링된 목록
  const filtered =
    statusFilter === "all"
      ? items
      : items.filter((i) => i.status === statusFilter);

  // ── 아이템 다이얼로그 열기 ──
  function openAddItem() {
    setEditTarget(null);
    setItemForm(emptyItemForm());
    setItemDialogOpen(true);
  }

  function openEditItem(item: SponsoredGoodsItem) {
    setEditTarget(item);
    setItemForm({
      itemName: item.itemName,
      sponsor: item.sponsor,
      quantity: String(item.quantity),
      status: item.status,
      estimatedValue: item.estimatedValue != null ? String(item.estimatedValue) : "",
      receivedDate: item.receivedDate ?? "",
      returnDueDate: item.returnDueDate ?? "",
      category: item.category ?? "",
      notes: item.notes ?? "",
    });
    setItemDialogOpen(true);
  }

  // ── 아이템 저장 ──
  async function handleItemSave() {
    if (!itemForm.itemName.trim()) {
      toast.error(TOAST.SPONSORED_GOODS.ITEM_NAME_REQUIRED);
      return;
    }
    if (!itemForm.sponsor.trim()) {
      toast.error(TOAST.SPONSORED_GOODS.SPONSOR_NAME_REQUIRED);
      return;
    }
    const qty = parseInt(itemForm.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error(TOAST.SPONSORED_GOODS.QUANTITY_REQUIRED);
      return;
    }

    setItemSaving(true);
    try {
      const payload = {
        itemName: itemForm.itemName.trim(),
        sponsor: itemForm.sponsor.trim(),
        quantity: qty,
        status: itemForm.status,
        estimatedValue: itemForm.estimatedValue
          ? parseFloat(itemForm.estimatedValue)
          : undefined,
        receivedDate: itemForm.receivedDate || undefined,
        returnDueDate: itemForm.returnDueDate || undefined,
        category: itemForm.category.trim() || undefined,
        notes: itemForm.notes.trim() || undefined,
      };

      if (editTarget) {
        await updateItem(editTarget.id, payload);
        toast.success(TOAST.SPONSORED_GOODS.ITEM_UPDATED);
      } else {
        await addItem(payload);
        toast.success(TOAST.SPONSORED_GOODS.ITEM_ADDED);
      }
      setItemDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setItemSaving(false);
    }
  }

  // ── 아이템 삭제 ──
  async function handleDelete(item: SponsoredGoodsItem) {
    try {
      await deleteItem(item.id);
      toast.success(`'${item.itemName}' 물품이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 상태 변경 ──
  async function handleStatusChange(
    itemId: string,
    status: SponsoredGoodsStatus
  ) {
    try {
      await updateStatus(itemId, status);
      toast.success(TOAST.UPDATE_SUCCESS);
    } catch {
      toast.error(TOAST.STATUS_ERROR);
    }
  }

  // ── 배분 다이얼로그 열기 ──
  function openDistribute(item: SponsoredGoodsItem) {
    setDistTarget(item);
    setDistMember(memberNames[0] ?? "");
    setDistQty("1");
    setDistDialogOpen(true);
  }

  // ── 배분 저장 ──
  async function handleDistribute() {
    if (!distTarget) return;
    const memberName = distMember.trim();
    if (!memberName) {
      toast.error(TOAST.SPONSORED_GOODS.MEMBER_REQUIRED);
      return;
    }
    const qty = parseInt(distQty, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error(TOAST.SPONSORED_GOODS.DISTRIBUTE_QUANTITY_REQUIRED);
      return;
    }
    const remaining = getRemainingQuantity(distTarget.id);
    if (qty > remaining) {
      toast.error(`잔여 수량(${remaining}개)을 초과할 수 없습니다.`);
      return;
    }

    setDistSaving(true);
    try {
      const success = await distribute(distTarget.id, memberName, qty);
      if (success) {
        toast.success(`${memberName}에게 ${qty}개 배분되었습니다.`);
        setDistDialogOpen(false);
      } else {
        toast.error(TOAST.SPONSORED_GOODS.DISTRIBUTE_ERROR);
      }
    } catch {
      toast.error(TOAST.SPONSORED_GOODS.DISTRIBUTE_ERROR);
    } finally {
      setDistSaving(false);
    }
  }

  // ── 배분 내역 토글 ──
  function toggleExpand(itemId: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Gift className="h-4 w-4 text-pink-500" />
                  <CardTitle className="text-sm font-semibold">
                    협찬품 관리
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-800 border border-pink-300">
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
                물품 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalItems > 0 && (
              <div className="mt-2 flex gap-3 flex-wrap">
                <span className="text-[10px] text-muted-foreground">
                  수령{" "}
                  <span className="font-semibold text-foreground">
                    {stats.receivedItems}
                  </span>
                  건
                </span>
                <span className="text-[10px] text-muted-foreground">
                  배분완료{" "}
                  <span className="font-semibold text-foreground">
                    {stats.distributedItems}
                  </span>
                  건
                </span>
                {stats.totalValue > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    총 추정가치{" "}
                    <span className="font-semibold text-foreground">
                      {stats.totalValue.toLocaleString()}원
                    </span>
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* 상태 필터 */}
              <div className="flex gap-1 flex-wrap mb-3">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      statusFilter === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {statusFilter === "all"
                    ? "등록된 협찬품이 없습니다."
                    : `${STATUS_LABELS[statusFilter as SponsoredGoodsStatus]} 상태의 물품이 없습니다.`}
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      remaining={getRemainingQuantity(item.id)}
                      isExpanded={expandedItems.has(item.id)}
                      onToggleExpand={() => toggleExpand(item.id)}
                      onEdit={() => openEditItem(item)}
                      onDelete={() => handleDelete(item)}
                      onStatusChange={(s) => handleStatusChange(item.id, s)}
                      onDistribute={() => openDistribute(item)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 아이템 추가/편집 다이얼로그 */}
      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        form={itemForm}
        setForm={setItemForm}
        onSave={handleItemSave}
        saving={itemSaving}
        isEdit={!!editTarget}
      />

      {/* 배분 다이얼로그 */}
      <DistributeDialog
        open={distDialogOpen}
        onOpenChange={setDistDialogOpen}
        item={distTarget}
        remaining={distTarget ? getRemainingQuantity(distTarget.id) : 0}
        memberNames={memberNames}
        memberValue={distMember}
        onMemberChange={setDistMember}
        qtyValue={distQty}
        onQtyChange={setDistQty}
        onSave={handleDistribute}
        saving={distSaving}
      />
    </>
  );
}

// ============================================================
// 아이템 행 컴포넌트
// ============================================================

function ItemRow({
  item,
  remaining,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onStatusChange,
  onDistribute,
}: {
  item: SponsoredGoodsItem;
  remaining: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: SponsoredGoodsStatus) => void;
  onDistribute: () => void;
}) {
  const dday =
    item.returnDueDate && item.status !== "returned"
      ? calcDday(item.returnDueDate)
      : null;

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-start gap-2 p-2">
        {/* 아이콘 */}
        <div className="mt-0.5 flex-shrink-0">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">
              {item.itemName}
            </span>
            {item.category && (
              <span className="text-[10px] px-1.5 py-0 rounded bg-orange-100 text-orange-700 border border-orange-200 font-medium">
                {item.category}
              </span>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground mt-0.5">
            스폰서: {item.sponsor}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              수량: <span className="font-medium text-foreground">{item.quantity}개</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              잔여: <span className="font-medium text-foreground">{remaining}개</span>
            </span>
            {item.estimatedValue != null && (
              <span className="text-[10px] text-muted-foreground">
                추정가:{" "}
                <span className="font-medium text-foreground">
                  {item.estimatedValue.toLocaleString()}원
                </span>
              </span>
            )}
            {dday !== null && (
              <span
                className={`text-[10px] px-1.5 py-0 rounded border font-semibold ${
                  dday < 0
                    ? "bg-red-100 text-red-700 border-red-300"
                    : dday <= 3
                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                }`}
              >
                반납 {formatDday(dday)}
                {dday < 0 && (
                  <AlertCircle className="inline h-2.5 w-2.5 ml-0.5 -mt-0.5" />
                )}
              </span>
            )}
          </div>

          {/* 배분 내역 확장 버튼 */}
          {item.distributions.length > 0 && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-0.5 mt-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Users className="h-2.5 w-2.5" />
              배분 내역 {item.distributions.length}건
              {isExpanded ? (
                <ChevronUp className="h-2.5 w-2.5" />
              ) : (
                <ChevronDown className="h-2.5 w-2.5" />
              )}
            </button>
          )}
        </div>

        {/* 상태 드롭다운 + 액션 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[item.status]}`}
              >
                {STATUS_LABELS[item.status]}
                <ChevronRight className="h-2.5 w-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s}
                  className="text-xs cursor-pointer"
                  onClick={() => onStatusChange(s)}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                      s === "received"
                        ? "bg-green-500"
                        : s === "distributed"
                        ? "bg-purple-500"
                        : s === "returned"
                        ? "bg-gray-400"
                        : "bg-blue-400"
                    }`}
                  />
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 배분 버튼 */}
          {remaining > 0 && item.status !== "returned" && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-1.5 text-[10px]"
              onClick={onDistribute}
            >
              <Users className="h-2.5 w-2.5 mr-0.5" />
              배분
            </Button>
          )}

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

      {/* 배분 내역 확장 */}
      {isExpanded && item.distributions.length > 0 && (
        <div className="border-t px-3 py-2 bg-muted/30 space-y-1">
          {item.distributions.map((d, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-[10px]"
            >
              <span className="font-medium">{d.memberName}</span>
              <span className="text-muted-foreground">
                {d.quantity}개 ·{" "}
                {new Date(d.distributedAt).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 아이템 추가/편집 다이얼로그
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
            <Gift className="h-4 w-4 text-pink-500" />
            {isEdit ? "협찬품 수정" : "협찬품 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 물품명 */}
          <div className="space-y-1">
            <Label className="text-xs">
              물품명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 티셔츠, 굿즈 세트"
              value={form.itemName}
              onChange={(e) => set("itemName", e.target.value)}
            />
          </div>

          {/* 스폰서 + 카테고리 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">
                스폰서 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="스폰서명"
                value={form.sponsor}
                onChange={(e) => set("sponsor", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 의류, 식음료"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
          </div>

          {/* 수량 + 추정가치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">
                수량 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="1"
                placeholder="수량"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">추정가치 (원)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="0"
                placeholder="예: 50000"
                value={form.estimatedValue}
                onChange={(e) => set("estimatedValue", e.target.value)}
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as SponsoredGoodsStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 수령일 + 반납기한 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">수령일</Label>
              <Input
                className="h-8 text-xs"
                type="date"
                value={form.receivedDate}
                onChange={(e) => set("receivedDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">반납 기한</Label>
              <Input
                className="h-8 text-xs"
                type="date"
                value={form.returnDueDate}
                onChange={(e) => set("returnDueDate", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
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

// ============================================================
// 배분 다이얼로그
// ============================================================

function DistributeDialog({
  open,
  onOpenChange,
  item,
  remaining,
  memberNames,
  memberValue,
  onMemberChange,
  qtyValue,
  onQtyChange,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: SponsoredGoodsItem | null;
  remaining: number;
  memberNames: string[];
  memberValue: string;
  onMemberChange: (v: string) => void;
  qtyValue: string;
  onQtyChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-blue-500" />
            협찬품 배분
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 물품 정보 */}
          <div className="rounded-md bg-muted/50 px-3 py-2 space-y-0.5">
            <p className="text-xs font-semibold">{item.itemName}</p>
            <p className="text-[10px] text-muted-foreground">
              스폰서: {item.sponsor} · 잔여: {remaining}개
            </p>
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">
              멤버 <span className="text-destructive">*</span>
            </Label>
            {memberNames.length > 0 ? (
              <Select value={memberValue} onValueChange={onMemberChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-8 text-xs"
                placeholder="멤버 이름 직접 입력"
                value={memberValue}
                onChange={(e) => onMemberChange(e.target.value)}
              />
            )}
          </div>

          {/* 수량 */}
          <div className="space-y-1">
            <Label className="text-xs">
              배분 수량 <span className="text-destructive">*</span>{" "}
              <span className="text-muted-foreground font-normal">
                (최대 {remaining}개)
              </span>
            </Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min="1"
              max={remaining}
              value={qtyValue}
              onChange={(e) => onQtyChange(e.target.value)}
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
            {saving ? "배분 중..." : "배분"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
