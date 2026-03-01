"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Gift, Plus, Minus, ShoppingBag } from "lucide-react";
import { useRewardPoints } from "@/hooks/use-reward-points";
import { REWARD_CATEGORY_LABELS } from "@/types";
import type { RewardItem } from "@/types";
import type { EntityMember } from "@/types/entity-context";

type RewardCategory = RewardItem["category"] | "all";

type RewardPointsShopProps = {
  groupId: string;
  currentUserId: string;
  members: EntityMember[];
  canEdit: boolean;
};

// ---- 보상 추가/수정 Dialog ----
function RewardItemDialog({
  groupId,
  item,
  onSave,
  trigger,
}: {
  groupId: string;
  item?: RewardItem;
  onSave: () => void;
  trigger: React.ReactNode;
}) {
  const { createItem, updateItem } = useRewardPoints(groupId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [cost, setCost] = useState(String(item?.cost ?? ""));
  const [category, setCategory] = useState<RewardItem["category"]>(
    item?.category ?? "badge"
  );
  const [emoji, setEmoji] = useState(item?.emoji ?? "");
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  const resetForm = () => {
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setCost(String(item?.cost ?? ""));
    setCategory(item?.category ?? "badge");
    setEmoji(item?.emoji ?? "");
    setIsActive(item?.isActive ?? true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(TOAST.MEMBERS.REWARD_SHOP_NAME_REQUIRED);
      return;
    }
    const costNum = Number(cost);
    if (!costNum || costNum < 1) {
      toast.error(TOAST.MEMBERS.REWARD_SHOP_POINT_COST_MIN);
      return;
    }
    if (!emoji.trim()) {
      toast.error(TOAST.MEMBERS.REWARD_SHOP_EMOJI_REQUIRED);
      return;
    }

    if (item) {
      updateItem(item.id, {
        name: name.trim(),
        description: description.trim(),
        cost: costNum,
        category,
        emoji: emoji.trim(),
        isActive,
      });
      toast.success(TOAST.MEMBERS.REWARD_SHOP_UPDATED);
    } else {
      createItem({
        name: name.trim(),
        description: description.trim(),
        cost: costNum,
        category,
        emoji: emoji.trim(),
        isActive,
      });
      toast.success(TOAST.MEMBERS.REWARD_SHOP_ADDED);
    }

    onSave();
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{item ? "보상 수정" : "보상 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="보상 이름"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="보상 설명"
              className="h-8 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">포인트 비용</Label>
              <Input
                type="number"
                min={1}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="100"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이모지</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🏆"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as RewardItem["category"])}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title" className="text-xs">칭호</SelectItem>
                <SelectItem value="badge" className="text-xs">뱃지</SelectItem>
                <SelectItem value="privilege" className="text-xs">특권</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="isActive" className="text-xs cursor-pointer">
              활성화
            </Label>
          </div>
          <Button onClick={handleSave} className="w-full h-8 text-xs">
            {item ? "수정 완료" : "추가"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- 멤버별 포인트 수동 조정 Dialog ----
function ManualPointDialog({
  groupId,
  members,
  onDone,
}: {
  groupId: string;
  members: EntityMember[];
  onDone: () => void;
}) {
  const { addPoints, spendPoints, getBalance } = useRewardPoints(groupId);
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"add" | "spend">("add");

  const selectedMember = members.find((m) => m.userId === selectedUserId);

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error(TOAST.MEMBERS.REWARD_SHOP_MEMBER_REQUIRED);
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum < 1) {
      toast.error(TOAST.MEMBERS.REWARD_SHOP_POINT_MIN);
      return;
    }
    if (!reason.trim()) {
      toast.error(TOAST.MEMBERS.REWARD_SHOP_REASON_REQUIRED);
      return;
    }

    if (type === "spend") {
      const balance = getBalance(selectedUserId);
      if (balance < amountNum) {
        toast.error(`포인트가 부족합니다 (보유: ${balance}pt)`);
        return;
      }
      spendPoints(selectedUserId, amountNum, reason.trim());
      toast.success(`${amountNum}pt 차감 완료`);
    } else {
      addPoints(selectedUserId, amountNum, reason.trim());
      toast.success(`${amountNum}pt 적립 완료`);
    }

    setAmount("");
    setReason("");
    setSelectedUserId("");
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-0.5" />
          포인트 조정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">멤버 포인트 수동 조정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">멤버</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId} className="text-xs">
                    {m.nickname || m.profile.name}
                    {selectedUserId === m.userId && (
                      <span className="ml-1 text-amber-600">
                        ({getBalance(m.userId)}pt)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && (
              <p className="text-[10px] text-muted-foreground">
                현재 보유: {getBalance(selectedUserId)}pt
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">유형</Label>
            <Select value={type} onValueChange={(v) => setType(v as "add" | "spend")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add" className="text-xs">적립</SelectItem>
                <SelectItem value="spend" className="text-xs">차감</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">포인트</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">사유</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이벤트 참여 보상"
              className="h-8 text-xs"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full h-8 text-xs">
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- 메인 컴포넌트 ----
export function RewardPointsShop({
  groupId,
  currentUserId,
  members,
  canEdit,
}: RewardPointsShopProps) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<RewardCategory>("all");
  const [, setRefreshCounter] = useState(0);
  const refresh = () => setRefreshCounter((c) => c + 1);

  const {
    getBalance,
    getTransactions,
    getItems,
    deleteItem,
    purchaseItem,
  } = useRewardPoints(groupId);

  const myBalance = getBalance(currentUserId);
  const myTransactions = getTransactions(currentUserId);
  const allItems = getItems();

  const filteredItems = useMemo(() => {
    if (categoryFilter === "all") return allItems.filter((i) => i.isActive || canEdit);
    return allItems.filter(
      (i) => i.category === categoryFilter && (i.isActive || canEdit)
    );
  }, [allItems, categoryFilter, canEdit]);

  const handlePurchase = (itemId: string) => {
    const result = purchaseItem(currentUserId, itemId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    refresh();
  };

  const handleDelete = (itemId: string) => {
    deleteItem(itemId);
    toast.success(TOAST.MEMBERS.REWARD_SHOP_DELETED);
    refresh();
  };

  const categoryBadgeColor: Record<RewardItem["category"], string> = {
    title: "bg-purple-100 text-purple-700",
    badge: "bg-blue-100 text-blue-700",
    privilege: "bg-orange-100 text-orange-700",
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
          <Star className="h-3 w-3 mr-0.5 text-amber-500" />
          포인트 상점
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* 헤더 */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-amber-500" />
              포인트 상점
            </SheetTitle>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px] px-2 py-0 font-semibold">
              <Star className="h-2.5 w-2.5 mr-0.5" />
              {myBalance}pt
            </Badge>
          </div>
          {/* 리더 전용 액션 */}
          {canEdit && (
            <div className="flex items-center gap-1.5 mt-2">
              <RewardItemDialog
                groupId={groupId}
                onSave={refresh}
                trigger={
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-0.5" />
                    보상 추가
                  </Button>
                }
              />
              <ManualPointDialog
                groupId={groupId}
                members={members}
                onDone={refresh}
              />
            </div>
          )}
        </SheetHeader>

        {/* 탭 */}
        <Tabs defaultValue="shop" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 mb-0 h-7 text-xs shrink-0">
            <TabsTrigger value="shop" className="text-xs flex-1">보상 목록</TabsTrigger>
            <TabsTrigger value="history" className="text-xs flex-1">거래 내역</TabsTrigger>
          </TabsList>

          {/* 보상 목록 탭 */}
          <TabsContent value="shop" className="flex-1 flex flex-col min-h-0 mt-0">
            {/* 카테고리 필터 */}
            <div className="flex items-center gap-1 px-4 py-2 shrink-0">
              {(["all", "title", "badge", "privilege"] as RewardCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    categoryFilter === cat
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-background text-muted-foreground border-border hover:border-amber-300"
                  }`}
                >
                  {cat === "all"
                    ? "전체"
                    : REWARD_CATEGORY_LABELS[cat as RewardItem["category"]]}
                </button>
              ))}
            </div>

            {/* 아이템 그리드 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">등록된 보상이 없습니다</p>
                  {canEdit && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      &quot;보상 추가&quot; 버튼으로 보상을 등록해보세요
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredItems.map((item) => {
                    const canAfford = myBalance >= item.cost;
                    return (
                      <Card
                        key={item.id}
                        className={`relative ${!item.isActive ? "opacity-60" : ""}`}
                      >
                        <CardContent className="p-3 flex flex-col gap-1.5">
                          {/* 비활성 배지 */}
                          {!item.isActive && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] bg-gray-200 text-gray-600 px-1 rounded">
                              비활성
                            </span>
                          )}
                          {/* 이모지 */}
                          <div className="text-2xl leading-none">{item.emoji}</div>
                          {/* 이름 */}
                          <p className="text-xs font-medium leading-tight line-clamp-1">
                            {item.name}
                          </p>
                          {/* 설명 */}
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {/* 카테고리 + 비용 */}
                          <div className="flex items-center justify-between mt-auto pt-1">
                            <span
                              className={`text-[9px] px-1.5 py-0 rounded-full ${
                                categoryBadgeColor[item.category]
                              }`}
                            >
                              {REWARD_CATEGORY_LABELS[item.category]}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-600">
                              {item.cost}pt
                            </span>
                          </div>
                          {/* 교환 버튼 or 수정/삭제 */}
                          {canEdit ? (
                            <div className="flex gap-1 mt-1">
                              <RewardItemDialog
                                groupId={groupId}
                                item={item}
                                onSave={refresh}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] flex-1 px-1"
                                  >
                                    수정
                                  </Button>
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                삭제
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className={`h-6 text-[10px] w-full mt-1 ${
                                canAfford && item.isActive
                                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                                  : ""
                              }`}
                              variant={canAfford && item.isActive ? "default" : "outline"}
                              disabled={!canAfford || !item.isActive}
                              onClick={() => handlePurchase(item.id)}
                            >
                              {!item.isActive
                                ? "비활성"
                                : !canAfford
                                ? "포인트 부족"
                                : "교환"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 거래 내역 탭 */}
          <TabsContent value="history" className="flex-1 overflow-y-auto px-4 pb-4 mt-0">
            {myTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">거래 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-1.5 pt-3">
                {myTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg border bg-card"
                    >
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isPositive
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <Plus className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{tx.reason}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {tx.amount}pt
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
