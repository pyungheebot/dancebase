"use client";

import { useState, useId } from "react";
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
import { ChevronDown, ChevronUp, Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSponsoredGoods } from "@/hooks/use-sponsored-goods";
import type { SponsoredGoodsItem, SponsoredGoodsStatus } from "@/types";
import {
  STATUS_LABELS,
  STATUS_FILTER_OPTIONS,
  emptyItemForm,
  validateItemForm,
  type ItemFormData,
} from "./sponsored-goods-types";
import { SponsoredGoodsItemRow } from "./sponsored-goods-item-row";
import { SponsoredGoodsItemDialog } from "./sponsored-goods-item-dialog";
import { SponsoredGoodsDistributeDialog } from "./sponsored-goods-distribute-dialog";

// ============================================================
// 메인 카드 컴포넌트
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

  // 카드 열림 상태
  const [isOpen, setIsOpen] = useState(false);

  // 상태 필터
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

  // 배분 내역 확장 상태
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 접근성: 동적 상태 알림용 ID
  const statusRegionId = useId();

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
    const errors = validateItemForm(itemForm);
    if (errors.itemName) { toast.error(errors.itemName); return; }
    if (errors.sponsor) { toast.error(errors.sponsor); return; }
    if (errors.quantity) { toast.error(errors.quantity); return; }

    const qty = parseInt(itemForm.quantity, 10);
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
  async function handleStatusChange(itemId: string, status: SponsoredGoodsStatus) {
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
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
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
                <button
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                  aria-controls="sponsored-goods-content"
                  aria-label={`협찬품 관리 ${stats.totalItems}건 ${isOpen ? "접기" : "펼치기"}`}
                >
                  <Gift className="h-4 w-4 text-pink-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    협찬품 관리
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-800 border border-pink-300">
                    {stats.totalItems}건
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
                  openAddItem();
                }}
                aria-label="협찬품 물품 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                물품 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalItems > 0 && (
              <div
                className="mt-2 flex gap-3 flex-wrap"
                aria-label="협찬품 요약 통계"
              >
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

          <CollapsibleContent id="sponsored-goods-content">
            <CardContent className="pt-0">
              {/* 상태 필터 */}
              <div
                className="flex gap-1 flex-wrap mb-3"
                role="group"
                aria-label="상태 필터"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    aria-pressed={statusFilter === opt.value}
                    aria-label={`${opt.label} 필터`}
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
              <div
                id={statusRegionId}
                aria-live="polite"
                aria-atomic="false"
              >
                {loading ? (
                  <p
                    className="text-xs text-muted-foreground text-center py-4"
                    role="status"
                    aria-label="협찬품 목록 불러오는 중"
                  >
                    불러오는 중...
                  </p>
                ) : filtered.length === 0 ? (
                  <p
                    className="text-xs text-muted-foreground text-center py-4"
                    role="status"
                  >
                    {statusFilter === "all"
                      ? "등록된 협찬품이 없습니다."
                      : `${STATUS_LABELS[statusFilter as SponsoredGoodsStatus]} 상태의 물품이 없습니다.`}
                  </p>
                ) : (
                  <ul
                    className="space-y-2"
                    role="list"
                    aria-label="협찬품 목록"
                  >
                    {filtered.map((item) => (
                      <SponsoredGoodsItemRow
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
                  </ul>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 아이템 추가/편집 다이얼로그 */}
      <SponsoredGoodsItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        form={itemForm}
        setForm={setItemForm}
        onSave={handleItemSave}
        saving={itemSaving}
        isEdit={!!editTarget}
      />

      {/* 배분 다이얼로그 */}
      <SponsoredGoodsDistributeDialog
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
