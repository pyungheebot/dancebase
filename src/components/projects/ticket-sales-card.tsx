"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  Ticket,
  TrendingUp,
  Users,
  BadgeDollarSign,
} from "lucide-react";
import { useTicketSales } from "@/hooks/use-ticket-sales";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TicketSalesTier } from "@/types";

// ───────────────────────────────────────────────
// 숫자 포맷 헬퍼
// ───────────────────────────────────────────────
function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ───────────────────────────────────────────────
// 등급별 배지 색상 (순환)
// ───────────────────────────────────────────────
const TIER_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
];

function tierColor(index: number) {
  return TIER_COLORS[index % TIER_COLORS.length];
}

// ───────────────────────────────────────────────
// 프로그레스 바 색상
// ───────────────────────────────────────────────
function progressColor(rate: number): string {
  if (rate >= 90) return "bg-green-500";
  if (rate >= 60) return "bg-blue-500";
  if (rate >= 30) return "bg-yellow-400";
  return "bg-gray-300";
}

// ───────────────────────────────────────────────
// AddTierDialog
// ───────────────────────────────────────────────
interface AddTierDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (tier: Omit<TicketSalesTier, "id">) => Promise<void>;
}

const PRESET_NAMES = ["VIP", "R석", "S석", "A석", "스탠딩"];

function AddTierDialog({ open, onClose, onSubmit }: AddTierDialogProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [totalQty, setTotalQty] = useState("");
  const { pending: loading, execute } = useAsyncAction();

  async function handleSubmit() {
    if (!name.trim()) { toast.error("등급명을 입력해주세요."); return; }
    const priceNum = Number(price);
    const qtyNum = Number(totalQty);
    if (isNaN(priceNum) || priceNum < 0) { toast.error("올바른 가격을 입력해주세요."); return; }
    if (isNaN(qtyNum) || qtyNum <= 0) { toast.error("총 수량은 1 이상이어야 합니다."); return; }
    await execute(async () => {
      await onSubmit({ name: name.trim(), price: priceNum, totalQty: qtyNum });
      toast.success("등급이 추가되었습니다.");
      setName(""); setPrice(""); setTotalQty("");
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">좌석 등급 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">등급명</Label>
            <div className="flex gap-1 flex-wrap">
              {PRESET_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setName(n)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    name === n
                      ? "bg-purple-100 border-purple-400 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <Input
              className="h-7 text-xs"
              placeholder="직접 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">단가 (원)</Label>
            <Input
              className="h-7 text-xs"
              type="number"
              min={0}
              placeholder="예: 50000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">총 수량</Label>
            <Input
              className="h-7 text-xs"
              type="number"
              min={1}
              placeholder="예: 200"
              value={totalQty}
              onChange={(e) => setTotalQty(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={loading}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────────────────────────────
// AddRecordDialog
// ───────────────────────────────────────────────
interface AddRecordDialogProps {
  open: boolean;
  onClose: () => void;
  tiers: TicketSalesTier[];
  onSubmit: (record: { buyerName: string; tierId: string; qty: number; date: string }) => Promise<void>;
}

function AddRecordDialog({ open, onClose, tiers, onSubmit }: AddRecordDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [buyerName, setBuyerName] = useState("");
  const [tierId, setTierId] = useState("");
  const [qty, setQty] = useState("1");
  const [date, setDate] = useState(today);
  const { pending: loading, execute } = useAsyncAction();

  async function handleSubmit() {
    if (!buyerName.trim()) { toast.error("구매자명을 입력해주세요."); return; }
    if (!tierId) { toast.error("등급을 선택해주세요."); return; }
    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) { toast.error("수량은 1 이상이어야 합니다."); return; }
    if (!date) { toast.error("날짜를 입력해주세요."); return; }
    await execute(async () => {
      await onSubmit({ buyerName: buyerName.trim(), tierId, qty: qtyNum, date });
      toast.success("판매 기록이 추가되었습니다.");
      setBuyerName(""); setTierId(""); setQty("1"); setDate(today);
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">판매 기록 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">구매자명</Label>
            <Input
              className="h-7 text-xs"
              placeholder="홍길동"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">좌석 등급</Label>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="등급 선택" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name} ({formatKRW(t.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수량</Label>
            <Input
              className="h-7 text-xs"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">구매 날짜</Label>
            <Input
              className="h-7 text-xs"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={loading}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────────────────────────────────────
// TicketSalesCard (메인)
// ───────────────────────────────────────────────
export function TicketSalesCard({ projectId }: { projectId: string }) {
  const {
    data,
    loading,
    addTier,
    removeTier,
    addRecord,
    removeRecord,
    soldQtyByTier,
    totalSold,
    totalQty,
    totalRevenue,
    overallSaleRate,
    dailySales,
  } = useTicketSales(projectId);

  const [isOpen, setIsOpen] = useState(true);
  const [showTierDialog, setShowTierDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [tiersOpen, setTiersOpen] = useState(true);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [deleteTierTarget, setDeleteTierTarget] = useState<TicketSalesTier | null>(null);

  const maxDailyQty = dailySales.length > 0 ? Math.max(...dailySales.map((d) => d.qty)) : 1;

  if (loading) {
    return (
      <div className="border rounded-lg p-3 bg-white animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      {/* 헤더 */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors select-none">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-800">티켓 판매 현황</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-0">
                {overallSaleRate}% 판매
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* 요약 지표 */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2 border-t bg-gray-50">
            <div className="flex flex-col items-center gap-0.5">
              <Users className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-semibold text-gray-800">{totalSold.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">판매 수량</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <BadgeDollarSign className="h-3 w-3 text-green-500" />
              <span className="text-xs font-semibold text-gray-800">{formatKRW(totalRevenue)}</span>
              <span className="text-[10px] text-gray-500">총 매출</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <TrendingUp className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-semibold text-gray-800">
                {totalQty > 0 ? (totalQty - totalSold).toLocaleString() : "-"}
              </span>
              <span className="text-[10px] text-gray-500">잔여 좌석</span>
            </div>
          </div>

          {/* 전체 판매율 프로그레스 */}
          {totalQty > 0 && (
            <div className="px-3 py-2 border-t">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-500">전체 판매율</span>
                <span className="text-[10px] font-medium text-gray-700">
                  {totalSold.toLocaleString()} / {totalQty.toLocaleString()}석
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor(overallSaleRate)}`}
                  style={{ width: `${overallSaleRate}%` }}
                />
              </div>
            </div>
          )}

          {/* 좌석 등급 섹션 */}
          <div className="border-t">
            <Collapsible open={tiersOpen} onOpenChange={setTiersOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                  <span className="text-xs font-medium text-gray-700">
                    좌석 등급 ({data.tiers.length})
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => { e.stopPropagation(); setShowTierDialog(true); }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    {tiersOpen ? (
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {data.tiers.length === 0 ? (
                  <div className="px-3 pb-3 text-center">
                    <p className="text-[11px] text-gray-400 py-2">등급이 없습니다.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setShowTierDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      등급 추가
                    </Button>
                  </div>
                ) : (
                  <div className="px-3 pb-3 space-y-2">
                    {data.tiers.map((tier, idx) => {
                      const sold = soldQtyByTier(tier.id);
                      const rate = tier.totalQty > 0 ? Math.round((sold / tier.totalQty) * 100) : 0;
                      const remaining = tier.totalQty - sold;
                      return (
                        <div key={tier.id} className="rounded border p-2 bg-gray-50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-1.5 py-0 rounded font-medium ${tierColor(idx)}`}>
                                {tier.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {formatKRW(tier.price)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-500">
                                잔여 <span className="font-medium text-gray-700">{remaining}</span>석
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                                onClick={() => setDeleteTierTarget(tier)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {/* 판매율 프로그레스 */}
                          <div>
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[10px] text-gray-500">
                                {sold} / {tier.totalQty}석
                              </span>
                              <span className="text-[10px] font-medium text-gray-600">
                                {rate}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${progressColor(rate)}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* 판매 기록 섹션 */}
          <div className="border-t">
            <Collapsible open={recordsOpen} onOpenChange={setRecordsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                  <span className="text-xs font-medium text-gray-700">
                    판매 기록 ({data.records.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {data.tiers.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={(e) => { e.stopPropagation(); setShowRecordDialog(true); }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    {recordsOpen ? (
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {data.records.length === 0 ? (
                  <div className="px-3 pb-3 text-center">
                    <p className="text-[11px] text-gray-400 py-2">판매 기록이 없습니다.</p>
                    {data.tiers.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setShowRecordDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        판매 기록 추가
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="px-3 pb-3 space-y-1">
                    {[...data.records]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((record) => {
                        const tier = data.tiers.find((t) => t.id === record.tierId);
                        const tierIdx = data.tiers.findIndex((t) => t.id === record.tierId);
                        return (
                          <div
                            key={record.id}
                            className="flex items-center justify-between py-1 border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {tier && (
                                <span className={`text-[10px] px-1.5 rounded shrink-0 font-medium ${tierColor(tierIdx)}`}>
                                  {tier.name}
                                </span>
                              )}
                              <span className="text-xs text-gray-700 truncate">{record.buyerName}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">{record.qty}장</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-gray-400">{record.date}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                  removeRecord(record.id).catch(() => toast.error("삭제에 실패했습니다."));
                                  toast.success("기록이 삭제되었습니다.");
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    {data.tiers.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs w-full mt-1"
                        onClick={() => setShowRecordDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        판매 기록 추가
                      </Button>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* 판매 추이 차트 섹션 */}
          <div className="border-t">
            <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 select-none">
                  <span className="text-xs font-medium text-gray-700">판매 추이 (일별)</span>
                  {chartOpen ? (
                    <ChevronUp className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {dailySales.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center py-3 pb-3">판매 데이터가 없습니다.</p>
                ) : (
                  <div className="px-3 pb-3 space-y-1.5">
                    {dailySales.map(({ date, qty }) => {
                      const barWidth = maxDailyQty > 0 ? Math.round((qty / maxDailyQty) * 100) : 0;
                      return (
                        <div key={date} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 w-20 shrink-0">{date}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-400 transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-gray-700 w-8 text-right shrink-0">
                            {qty}장
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 다이얼로그 */}
      <AddTierDialog
        open={showTierDialog}
        onClose={() => setShowTierDialog(false)}
        onSubmit={addTier}
      />
      <AddRecordDialog
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        tiers={data.tiers}
        onSubmit={addRecord}
      />
      <ConfirmDialog
        open={deleteTierTarget !== null}
        onOpenChange={(v) => !v && setDeleteTierTarget(null)}
        title="등급 삭제"
        description={deleteTierTarget ? `"${deleteTierTarget.name}" 등급을 삭제하시겠습니까? 관련 판매 기록도 모두 삭제됩니다.` : ""}
        onConfirm={() => {
          if (!deleteTierTarget) return;
          removeTier(deleteTierTarget.id).catch(() => toast.error("삭제에 실패했습니다."));
          toast.success("등급이 삭제되었습니다.");
          setDeleteTierTarget(null);
        }}
        destructive
      />
    </div>
  );
}
