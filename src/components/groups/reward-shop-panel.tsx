"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  Star,
  Plus,
  Pencil,
  Trash2,
  Infinity,
  History,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import {
  useRewardShop,
  REWARD_SHOP_POINT_RULES,
  REWARD_SHOP_POINT_LABELS,
} from "@/hooks/use-reward-shop";
import type { RewardShopItem } from "@/types";

// ============================================
// 타입
// ============================================
type RewardShopPanelProps = {
  groupId: string;
  isLeader?: boolean;
};

type ItemFormState = {
  name: string;
  description: string;
  pointCost: string;
  quantity: string;
};

const EMPTY_FORM: ItemFormState = {
  name: "",
  description: "",
  pointCost: "",
  quantity: "-1",
};

// ============================================
// 아이템 추가/수정 다이얼로그
// ============================================
function ItemFormDialog({
  open,
  onClose,
  initialData,
  onSubmit,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: ItemFormState;
  onSubmit: (data: ItemFormState) => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<ItemFormState>(initialData ?? EMPTY_FORM);

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("아이템 이름을 입력해주세요");
      return;
    }
    const cost = parseInt(form.pointCost, 10);
    if (isNaN(cost) || cost <= 0) {
      toast.error("필요 포인트는 1 이상의 숫자여야 합니다");
      return;
    }
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || (qty !== -1 && qty < 0)) {
      toast.error("수량은 -1(무제한) 이상의 숫자여야 합니다");
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "아이템 추가" : "아이템 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">아이템 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 연습 조기 퇴장권"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">설명 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="간단한 설명을 입력하세요"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">필요 포인트</Label>
              <div className="relative">
                <Input
                  className="h-8 text-xs pr-7"
                  type="number"
                  min={1}
                  placeholder="50"
                  value={form.pointCost}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, pointCost: e.target.value }))
                  }
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  pt
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">수량 (-1=무제한)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={-1}
                placeholder="-1"
                value={form.quantity}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quantity: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 포인트 내역 요약 행
// ============================================
function PointRuleRow({
  label,
  points,
}: {
  label: string;
  points: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-semibold text-amber-600">+{points}pt</span>
    </div>
  );
}

// ============================================
// 아이템 카드
// ============================================
function ItemCard({
  item,
  myBalance,
  remaining,
  isLeader,
  onExchange,
  onEdit,
  onDelete,
}: {
  item: RewardShopItem;
  myBalance: number;
  remaining: number;
  isLeader: boolean;
  onExchange: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSoldOut = item.quantity !== -1 && remaining <= 0;
  const canAfford = myBalance >= item.pointCost;
  const diff = item.pointCost - myBalance;

  return (
    <div className="flex items-start gap-2 rounded-md border bg-card px-3 py-2.5">
      {/* 아이템 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold truncate">{item.name}</span>
          {isSoldOut && (
            <Badge className="text-[9px] px-1 py-0 bg-gray-100 text-gray-500 border-gray-200">
              품절
            </Badge>
          )}
          {!isSoldOut && item.quantity !== -1 && (
            <Badge className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
              잔여 {remaining}개
            </Badge>
          )}
          {item.quantity === -1 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Infinity className="h-2.5 w-2.5" />
              무제한
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-1 mt-1">
          <Coins className="h-3 w-3 text-amber-500" />
          <span className="text-xs font-bold text-amber-600">
            {item.pointCost.toLocaleString()}pt
          </span>
          {!isSoldOut && !canAfford && (
            <span className="text-[10px] text-red-500 ml-1">{diff}점 부족</span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        {isLeader && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
              aria-label="수정"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
              onClick={onDelete}
              aria-label="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
        <Button
          size="sm"
          className="h-7 text-xs px-2.5"
          disabled={isSoldOut || !canAfford}
          onClick={onExchange}
          variant={isSoldOut ? "outline" : "default"}
        >
          {isSoldOut ? "품절" : "교환"}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 메인 패널
// ============================================
export function RewardShopPanel({ groupId, isLeader = false }: RewardShopPanelProps) {
  const {
    loading,
    items,
    recentExchanges,
    myBalance,
    exchangeItem,
    addItem,
    updateItem,
    deleteItem,
    getRemainingQuantity,
  } = useRewardShop(groupId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RewardShopItem | null>(null);
  const [activeTab, setActiveTab] = useState<"shop" | "history">("shop");

  // ---- 교환 처리 ----
  const handleExchange = (itemId: string) => {
    const result = exchangeItem(itemId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  // ---- 아이템 추가 ----
  const handleAdd = (form: { name: string; description: string; pointCost: string; quantity: string }) => {
    addItem({
      name: form.name.trim(),
      description: form.description.trim(),
      pointCost: parseInt(form.pointCost, 10),
      quantity: parseInt(form.quantity, 10),
    });
    toast.success("아이템이 추가되었습니다");
  };

  // ---- 아이템 수정 ----
  const handleEdit = (form: { name: string; description: string; pointCost: string; quantity: string }) => {
    if (!editTarget) return;
    updateItem(editTarget.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      pointCost: parseInt(form.pointCost, 10),
      quantity: parseInt(form.quantity, 10),
    });
    toast.success("아이템이 수정되었습니다");
    setEditTarget(null);
  };

  // ---- 아이템 삭제 ----
  const handleDelete = (itemId: string, itemName: string) => {
    deleteItem(itemId);
    toast.success(`"${itemName}" 아이템이 삭제되었습니다`);
  };

  return (
    <>
      {/* 아이템 추가 다이얼로그 */}
      <ItemFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        mode="add"
      />

      {/* 아이템 수정 다이얼로그 */}
      {editTarget && (
        <ItemFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initialData={{
            name: editTarget.name,
            description: editTarget.description,
            pointCost: String(editTarget.pointCost),
            quantity: String(editTarget.quantity),
          }}
          onSubmit={handleEdit}
          mode="edit"
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {/* 트리거 버튼 */}
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            포인트 상점
            <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300 ml-0.5">
              {myBalance.toLocaleString()}pt
            </Badge>
          </Button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:max-w-sm flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b">
            <SheetTitle className="text-sm font-semibold flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-amber-500" />
              포인트 상점
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <span className="text-xs text-muted-foreground">불러오는 중...</span>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-4">
                {/* 내 포인트 잔액 */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                  <p className="text-[10px] text-amber-600 font-medium mb-0.5">
                    내 포인트 잔액
                  </p>
                  <div className="flex items-center justify-center gap-1.5">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
                    <span className="text-2xl font-bold text-amber-700 tabular-nums">
                      {myBalance.toLocaleString()}
                    </span>
                    <span className="text-sm text-amber-600 font-medium">pt</span>
                  </div>
                </div>

                {/* 포인트 적립 규칙 요약 */}
                <div className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-semibold mb-1">
                    포인트 적립 규칙
                  </p>
                  {(Object.keys(REWARD_SHOP_POINT_RULES) as Array<keyof typeof REWARD_SHOP_POINT_RULES>).map(
                    (key) => (
                      <PointRuleRow
                        key={key}
                        label={REWARD_SHOP_POINT_LABELS[key]}
                        points={REWARD_SHOP_POINT_RULES[key]}
                      />
                    )
                  )}
                </div>

                <Separator />

                {/* 탭 전환 */}
                <div className="flex gap-1">
                  <Button
                    variant={activeTab === "shop" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => setActiveTab("shop")}
                  >
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    아이템 목록
                  </Button>
                  <Button
                    variant={activeTab === "history" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => setActiveTab("history")}
                  >
                    <History className="h-3 w-3 mr-1" />
                    교환 이력
                  </Button>
                </div>

                {/* 아이템 목록 탭 */}
                {activeTab === "shop" && (
                  <div className="space-y-2">
                    {/* 리더 전용: 아이템 추가 버튼 */}
                    {isLeader && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs w-full border-dashed gap-1"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3" />
                        아이템 추가
                      </Button>
                    )}

                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground text-center">
                          등록된 아이템이 없습니다.
                        </p>
                        {isLeader && (
                          <p className="text-[10px] text-muted-foreground/70 text-center">
                            위 버튼으로 첫 번째 아이템을 추가해보세요.
                          </p>
                        )}
                      </div>
                    ) : (
                      items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          myBalance={myBalance}
                          remaining={getRemainingQuantity(item)}
                          isLeader={isLeader}
                          onExchange={() => handleExchange(item.id)}
                          onEdit={() => setEditTarget(item)}
                          onDelete={() => handleDelete(item.id, item.name)}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* 교환 이력 탭 */}
                {activeTab === "history" && (
                  <div className="space-y-1.5">
                    {recentExchanges.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <History className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground text-center">
                          교환 이력이 없습니다.
                        </p>
                      </div>
                    ) : (
                      recentExchanges.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{record.itemName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {record.userName} &middot;{" "}
                              {new Date(record.exchangedAt).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200 shrink-0 ml-2">
                            -{record.pointsSpent}pt
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
