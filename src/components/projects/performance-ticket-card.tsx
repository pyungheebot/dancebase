"use client";

import { useState } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Pencil,
  X,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  usePerformanceTicket,
  type PerfTicketTierSummary,
} from "@/hooks/use-performance-ticket";
import type {
  PerfTicketTier,
  PerfTicketAllocation,
  PerfAllocationStatus,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const TIER_COLORS = [
  { label: "보라", value: "#7c3aed" },
  { label: "파랑", value: "#2563eb" },
  { label: "하늘", value: "#0891b2" },
  { label: "초록", value: "#16a34a" },
  { label: "주황", value: "#ea580c" },
  { label: "빨강", value: "#dc2626" },
  { label: "분홍", value: "#db2777" },
  { label: "회색", value: "#6b7280" },
];

const STATUS_LABELS: Record<PerfAllocationStatus, string> = {
  reserved: "예약",
  confirmed: "확정",
  cancelled: "취소",
};

const STATUS_COLORS: Record<PerfAllocationStatus, string> = {
  reserved: "bg-yellow-100 text-yellow-700 border-yellow-300",
  confirmed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-gray-100 text-gray-500 border-gray-300",
};

const STATUS_ICONS: Record<PerfAllocationStatus, React.ReactNode> = {
  reserved: <Clock className="h-3 w-3" />,
  confirmed: <CheckCircle2 className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

// ============================================================
// 숫자 포맷
// ============================================================

function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

// ============================================================
// 하위 컴포넌트: 진행률 바
// ============================================================

function SalesProgressBar({
  progress,
  sold,
  total,
  goal,
}: {
  progress: number;
  sold: number;
  total: number;
  goal: number | null;
}) {
  const base = goal ?? total;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          배분 현황: {sold} / {base}석
        </span>
        <span className="font-medium text-foreground">{progress}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {goal && (
        <p className="text-[10px] text-muted-foreground">
          목표 {goal}석 중 {sold}석 배분
        </p>
      )}
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 등급별 분포 차트 (CSS div 기반)
// ============================================================

function TierDistributionChart({
  tierSummary,
}: {
  tierSummary: PerfTicketTierSummary[];
}) {
  if (tierSummary.length === 0) return null;

  const totalConfirmed = tierSummary.reduce((acc, s) => acc + s.confirmedQty, 0);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">등급별 확정 분포</p>
      {tierSummary.map((s) => {
        const pct =
          totalConfirmed > 0
            ? Math.round((s.confirmedQty / totalConfirmed) * 100)
            : 0;
        return (
          <div key={s.tier.id} className="space-y-0.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.tier.color }}
                />
                <span className="font-medium">{s.tier.name}</span>
              </div>
              <span className="text-muted-foreground">
                {s.confirmedQty}석 ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: s.tier.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 매출 요약 카드
// ============================================================

function RevenueSummaryCards({
  stats,
}: {
  stats: ReturnType<typeof usePerformanceTicket>["stats"];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Ticket className="h-3 w-3" />
          총 좌석
        </p>
        <p className="text-lg font-bold">{stats.totalTickets}</p>
      </div>
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          배분 완료
        </p>
        <p className="text-lg font-bold text-blue-600">{stats.soldTickets}</p>
      </div>
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          확정
        </p>
        <p className="text-lg font-bold text-green-600">
          {stats.confirmedTickets}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          확정 매출
        </p>
        <p className="text-sm font-bold text-purple-600">
          {formatKRW(stats.revenue)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 다이얼로그: 등급 추가/수정
// ============================================================

function TierDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PerfTicketTier, "id">) => void;
  initial?: PerfTicketTier;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [totalQuantity, setTotalQuantity] = useState(
    String(initial?.totalQuantity ?? "")
  );
  const [color, setColor] = useState(initial?.color ?? TIER_COLORS[0].value);

  function handleSave() {
    if (!name.trim()) {
      toast.error("등급 이름을 입력해주세요.");
      return;
    }
    const priceNum = Number(price);
    const qtyNum = Number(totalQuantity);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("올바른 가격을 입력해주세요.");
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("수량은 1 이상이어야 합니다.");
      return;
    }
    onSave({ name: name.trim(), price: priceNum, totalQuantity: qtyNum, color });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "등급 수정" : "등급 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">등급 이름 *</Label>
            <Input
              className="h-8 text-sm"
              placeholder="예: VIP, 일반석, 학생"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">가격 (원)</Label>
              <Input
                className="h-8 text-sm"
                type="number"
                min={0}
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">총 수량 *</Label>
              <Input
                className="h-8 text-sm"
                type="number"
                min={1}
                placeholder="100"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">색상</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {TIER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-6 w-6 rounded-full border-2 transition-all ${
                    color === c.value ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 다이얼로그: 배분 추가/수정
// ============================================================

function AllocationDialog({
  open,
  onClose,
  onSave,
  tiers,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<PerfTicketAllocation, "id" | "createdAt">) => void;
  tiers: PerfTicketTier[];
  initial?: PerfTicketAllocation;
}) {
  const [tierId, setTierId] = useState(initial?.tierId ?? tiers[0]?.id ?? "");
  const [recipientName, setRecipientName] = useState(
    initial?.recipientName ?? ""
  );
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? "1"));
  const [status, setStatus] = useState<PerfAllocationStatus>(
    initial?.status ?? "reserved"
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSave() {
    if (!tierId) {
      toast.error("등급을 선택해주세요.");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("수령인 이름을 입력해주세요.");
      return;
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("수량은 1 이상이어야 합니다.");
      return;
    }
    onSave({
      tierId,
      recipientName: recipientName.trim(),
      quantity: qty,
      status,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "배분 수정" : "배분 추가"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">등급 *</Label>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="등급 선택" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수령인 *</Label>
            <Input
              className="h-8 text-sm"
              placeholder="이름 또는 단체명"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">수량 *</Label>
              <Input
                className="h-8 text-sm"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PerfAllocationStatus)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reserved">예약</SelectItem>
                  <SelectItem value="confirmed">확정</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-sm resize-none min-h-[60px]"
              placeholder="메모 (선택)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 다이얼로그: 판매 목표 설정
// ============================================================

function GoalDialog({
  open,
  onClose,
  onSave,
  current,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (goal: number | null) => void;
  current: number | null;
}) {
  const [value, setValue] = useState(current != null ? String(current) : "");

  function handleSave() {
    if (value.trim() === "") {
      onSave(null);
      onClose();
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      toast.error("올바른 목표 수량을 입력해주세요.");
      return;
    }
    onSave(num);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>판매 목표 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">목표 수량</Label>
            <Input
              className="h-8 text-sm"
              type="number"
              min={1}
              placeholder="비워두면 총 좌석 기준"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              비워두면 전체 좌석 수를 목표로 사용합니다.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function PerformanceTicketCard({ projectId }: { projectId: string }) {
  const {
    tiers,
    allocations,
    salesGoal,
    loading,
    stats,
    addTier,
    updateTier,
    deleteTier,
    addAllocation,
    updateAllocation,
    cancelAllocation,
    deleteAllocation,
    updateSalesGoal,
  } = usePerformanceTicket(projectId);

  // 섹션 접힘 상태
  const [tiersOpen, setTiersOpen] = useState(true);
  const [allocationsOpen, setAllocationsOpen] = useState(true);
  const [chartOpen, setChartOpen] = useState(true);

  // 다이얼로그 상태
  const [tierDialog, setTierDialog] = useState<{
    open: boolean;
    initial?: PerfTicketTier;
  }>({ open: false });
  const [allocationDialog, setAllocationDialog] = useState<{
    open: boolean;
    initial?: PerfTicketAllocation;
  }>({ open: false });
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4" />
            공연 티켓 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ticket className="h-4 w-4" />
              공연 티켓 관리
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setGoalDialogOpen(true)}
            >
              <Target className="h-3 w-3" />
              목표 설정
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 빈 상태 */}
          {tiers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
              <Ticket className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">등록된 티켓 등급이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                VIP, 일반석 등 등급을 먼저 추가해주세요.
              </p>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setTierDialog({ open: true })}
              >
                <Plus className="h-3 w-3" />
                등급 추가
              </Button>
            </div>
          )}

          {tiers.length > 0 && (
            <>
              {/* 매출 요약 */}
              <RevenueSummaryCards stats={stats} />

              {/* 진행률 바 */}
              <SalesProgressBar
                progress={stats.salesProgress}
                sold={stats.soldTickets}
                total={stats.totalTickets}
                goal={salesGoal}
              />

              {/* 등급별 분포 차트 */}
              <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-foreground/80 transition-colors">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      판매 분포
                    </span>
                    {chartOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2">
                    <TierDistributionChart tierSummary={stats.tierSummary} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="border-t" />

              {/* 티켓 등급 목록 */}
              <Collapsible open={tiersOpen} onOpenChange={setTiersOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-foreground/80 transition-colors">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      티켓 등급 ({tiers.length})
                    </span>
                    {tiersOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 space-y-2">
                    {stats.tierSummary.map((s) => (
                      <div
                        key={s.tier.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.tier.color }}
                          />
                          <div>
                            <p className="font-medium">{s.tier.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatKRW(s.tier.price)} / 총{" "}
                              {s.tier.totalQuantity}석
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">
                              확정 {s.confirmedQty} / 예약 {s.reservedQty}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              잔여 {s.remainingQty}석
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                setTierDialog({ open: true, initial: s.tier })
                              }
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                deleteTier(s.tier.id);
                                toast.success("등급이 삭제되었습니다.");
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs w-full gap-1"
                      onClick={() => setTierDialog({ open: true })}
                    >
                      <Plus className="h-3 w-3" />
                      등급 추가
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="border-t" />

              {/* 배분 내역 */}
              <Collapsible
                open={allocationsOpen}
                onOpenChange={setAllocationsOpen}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-foreground/80 transition-colors">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      배분 내역 ({allocations.length})
                    </span>
                    {allocationsOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 space-y-2">
                    {allocations.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        배분 내역이 없습니다.
                      </p>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b">
                              <th className="text-left px-3 py-2 font-medium">
                                수령인
                              </th>
                              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">
                                등급
                              </th>
                              <th className="text-right px-3 py-2 font-medium">
                                수량
                              </th>
                              <th className="text-center px-3 py-2 font-medium">
                                상태
                              </th>
                              <th className="px-2 py-2" />
                            </tr>
                          </thead>
                          <tbody>
                            {allocations.map((alloc, idx) => {
                              const tier = tiers.find(
                                (t) => t.id === alloc.tierId
                              );
                              return (
                                <tr
                                  key={alloc.id}
                                  className={`border-b last:border-0 ${
                                    alloc.status === "cancelled"
                                      ? "opacity-50"
                                      : ""
                                  }`}
                                >
                                  <td className="px-3 py-2">
                                    <p className="font-medium">
                                      {alloc.recipientName}
                                    </p>
                                    {alloc.notes && (
                                      <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                        {alloc.notes}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 hidden sm:table-cell">
                                    {tier && (
                                      <span className="flex items-center gap-1">
                                        <span
                                          className="inline-block h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: tier.color,
                                          }}
                                        />
                                        {tier.name}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    {alloc.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 gap-0.5 ${
                                        STATUS_COLORS[alloc.status]
                                      }`}
                                    >
                                      {STATUS_ICONS[alloc.status]}
                                      {STATUS_LABELS[alloc.status]}
                                    </Badge>
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          setAllocationDialog({
                                            open: true,
                                            initial: alloc,
                                          })
                                        }
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      {alloc.status !== "cancelled" && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-700"
                                          title="취소 처리"
                                          onClick={() => {
                                            cancelAllocation(alloc.id);
                                            toast.success("취소 처리되었습니다.");
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        onClick={() => {
                                          deleteAllocation(alloc.id);
                                          toast.success("배분이 삭제되었습니다.");
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs w-full gap-1"
                      onClick={() => setAllocationDialog({ open: true })}
                    >
                      <Plus className="h-3 w-3" />
                      배분 추가
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>

      {/* 등급 다이얼로그 */}
      <TierDialog
        open={tierDialog.open}
        initial={tierDialog.initial}
        onClose={() => setTierDialog({ open: false })}
        onSave={(data) => {
          if (tierDialog.initial) {
            updateTier(tierDialog.initial.id, data);
            toast.success("등급이 수정되었습니다.");
          } else {
            addTier(data);
            toast.success("등급이 추가되었습니다.");
          }
        }}
      />

      {/* 배분 다이얼로그 */}
      <AllocationDialog
        open={allocationDialog.open}
        initial={allocationDialog.initial}
        tiers={tiers}
        onClose={() => setAllocationDialog({ open: false })}
        onSave={(data) => {
          if (allocationDialog.initial) {
            updateAllocation(allocationDialog.initial.id, data);
            toast.success("배분이 수정되었습니다.");
          } else {
            addAllocation(data);
            toast.success("배분이 추가되었습니다.");
          }
        }}
      />

      {/* 목표 설정 다이얼로그 */}
      <GoalDialog
        open={goalDialogOpen}
        current={salesGoal}
        onClose={() => setGoalDialogOpen(false)}
        onSave={(goal) => {
          updateSalesGoal(goal);
          toast.success(
            goal ? `목표가 ${goal}석으로 설정되었습니다.` : "목표가 해제되었습니다."
          );
        }}
      />
    </>
  );
}
