"use client";

import { useState } from "react";
import {
  Ticket,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  useTicketManagement,
  type TierStat,
} from "@/hooks/use-ticket-management";
import type { TicketConfig, TicketReservation, TicketTier } from "@/types";

// ============================================
// 상수: 티어 메타데이터
// ============================================

const TIER_META: Record<
  TicketTier,
  { label: string; badgeClass: string; color: string }
> = {
  vip: {
    label: "VIP",
    badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    color: "bg-purple-400",
  },
  general: {
    label: "일반",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    color: "bg-blue-400",
  },
  student: {
    label: "학생",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
    color: "bg-green-400",
  },
  free: {
    label: "무료",
    badgeClass: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    color: "bg-gray-400",
  },
};

const TIER_OPTIONS: TicketTier[] = ["vip", "general", "student", "free"];

// ============================================
// 유틸리티
// ============================================

function formatPrice(amount: number): string {
  if (amount === 0) return "무료";
  return amount.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ============================================
// 서브 컴포넌트: 공연 설정 생성 다이얼로그
// ============================================

interface TierInput {
  tier: TicketTier;
  price: string;
  capacity: string;
}

const DEFAULT_TIERS: TierInput[] = [
  { tier: "general", price: "", capacity: "" },
];

interface CreateConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: Omit<TicketConfig, "id" | "reservations" | "createdAt">) => void;
}

function CreateConfigDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateConfigDialogProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tiers, setTiers] = useState<TierInput[]>(DEFAULT_TIERS);

  function reset() {
    setEventName("");
    setEventDate("");
    setTiers([{ tier: "general", price: "", capacity: "" }]);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function addTierRow() {
    setTiers((prev) => [...prev, { tier: "general", price: "", capacity: "" }]);
  }

  function removeTierRow(idx: number) {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateTierRow(idx: number, patch: Partial<TierInput>) {
    setTiers((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch } : t))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimName = eventName.trim();
    if (!trimName) {
      toast.error("공연명을 입력해주세요.");
      return;
    }
    if (tiers.length === 0) {
      toast.error("티켓 티어를 최소 1개 이상 추가해주세요.");
      return;
    }
    for (const t of tiers) {
      const price = Number(t.price);
      const capacity = Number(t.capacity);
      if (isNaN(price) || price < 0) {
        toast.error("가격은 0 이상의 숫자를 입력해주세요.");
        return;
      }
      if (isNaN(capacity) || capacity <= 0) {
        toast.error("수용 인원은 1 이상의 숫자를 입력해주세요.");
        return;
      }
    }
    onCreate({
      eventName: trimName,
      eventDate: eventDate || "",
      tiers: tiers.map((t) => ({
        tier: t.tier,
        price: Number(t.price),
        capacity: Number(t.capacity),
      })),
    });
    reset();
    onOpenChange(false);
    toast.success("공연 티켓 설정이 생성되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">공연 티켓 설정 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 공연명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">공연명 *</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 정기공연"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* 공연 날짜 */}
          <div className="space-y-1.5">
            <Label className="text-xs">공연 날짜</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 티어 설정 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">티켓 티어 *</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs gap-0.5 px-1.5"
                onClick={addTierRow}
              >
                <Plus className="h-3 w-3" />
                티어 추가
              </Button>
            </div>

            <div className="space-y-2">
              {tiers.map((t, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[100px_1fr_1fr_24px] gap-1.5 items-end"
                >
                  <div className="space-y-1">
                    {idx === 0 && (
                      <Label className="text-[10px] text-muted-foreground">
                        구분
                      </Label>
                    )}
                    <Select
                      value={t.tier}
                      onValueChange={(v) =>
                        updateTierRow(idx, { tier: v as TicketTier })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS.map((tier) => (
                          <SelectItem key={tier} value={tier} className="text-xs">
                            {TIER_META[tier].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && (
                      <Label className="text-[10px] text-muted-foreground">
                        가격 (원)
                      </Label>
                    )}
                    <Input
                      type="number"
                      min={0}
                      value={t.price}
                      onChange={(e) => updateTierRow(idx, { price: e.target.value })}
                      placeholder="0"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && (
                      <Label className="text-[10px] text-muted-foreground">
                        수용 인원
                      </Label>
                    )}
                    <Input
                      type="number"
                      min={1}
                      value={t.capacity}
                      onChange={(e) =>
                        updateTierRow(idx, { capacity: e.target.value })
                      }
                      placeholder="0"
                      className="h-7 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-6 p-0 text-destructive hover:text-destructive self-end"
                    onClick={() => removeTierRow(idx)}
                    disabled={tiers.length === 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 서브 컴포넌트: 예약 추가 다이얼로그
// ============================================

interface AddReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TicketConfig;
  tierStats: TierStat[];
  onAdd: (
    input: Omit<TicketReservation, "id" | "isPaid" | "reservedAt">
  ) => void;
}

const DEFAULT_RES_FORM = {
  buyerName: "",
  buyerContact: "",
  tier: "general" as TicketTier,
  quantity: "1",
  note: "",
};

function AddReservationDialog({
  open,
  onOpenChange,
  config,
  tierStats,
  onAdd,
}: AddReservationDialogProps) {
  const [form, setForm] = useState(DEFAULT_RES_FORM);

  function reset() {
    setForm(DEFAULT_RES_FORM);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  const selectedTierConfig = config.tiers.find((t) => t.tier === form.tier);
  const selectedTierStat = tierStats.find((s) => s.tier === form.tier);
  const qty = parseInt(form.quantity, 10) || 0;
  const unitPrice = selectedTierConfig?.price ?? 0;
  const totalPrice = unitPrice * qty;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimName = form.buyerName.trim();
    if (!trimName) {
      toast.error("예매자 이름을 입력해주세요.");
      return;
    }
    if (qty <= 0) {
      toast.error("수량은 1 이상을 입력해주세요.");
      return;
    }
    if (selectedTierStat && qty > selectedTierStat.remaining) {
      toast.error(
        `잔여석이 부족합니다. (잔여: ${selectedTierStat.remaining}석)`
      );
      return;
    }
    onAdd({
      buyerName: trimName,
      buyerContact: form.buyerContact.trim(),
      tier: form.tier,
      quantity: qty,
      totalPrice,
      note: form.note.trim(),
    });
    reset();
    onOpenChange(false);
    toast.success("예약이 추가되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">예약 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 예매자 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs">예매자 이름 *</Label>
            <Input
              value={form.buyerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyerName: e.target.value }))
              }
              placeholder="예: 홍길동"
              className="h-8 text-xs"
              autoFocus
              maxLength={50}
            />
          </div>

          {/* 연락처 */}
          <div className="space-y-1.5">
            <Label className="text-xs">연락처</Label>
            <Input
              value={form.buyerContact}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyerContact: e.target.value }))
              }
              placeholder="예: 010-0000-0000"
              className="h-8 text-xs"
              maxLength={30}
            />
          </div>

          {/* 티어 선택 */}
          <div className="space-y-1.5">
            <Label className="text-xs">티켓 구분</Label>
            <Select
              value={form.tier}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, tier: v as TicketTier }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.tiers.map(({ tier, price }) => {
                  const stat = tierStats.find((s) => s.tier === tier);
                  return (
                    <SelectItem key={tier} value={tier} className="text-xs">
                      {TIER_META[tier].label} — {formatPrice(price)}
                      {stat ? ` (잔여 ${stat.remaining}석)` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 수량 */}
          <div className="space-y-1.5">
            <Label className="text-xs">수량</Label>
            <Input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>

          {/* 합계 금액 미리보기 */}
          {unitPrice > 0 && qty > 0 && (
            <div className="rounded-md bg-gray-50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">합계</span>
              <span className="text-xs font-semibold text-gray-800">
                {formatPrice(totalPrice)}
              </span>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Input
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="특이사항 메모"
              className="h-8 text-xs"
              maxLength={200}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 서브 컴포넌트: 티어별 잔여석 바
// ============================================

interface TierStatBarProps {
  stat: TierStat;
}

function TierStatBar({ stat }: TierStatBarProps) {
  const pct =
    stat.capacity > 0
      ? Math.min(100, Math.round((stat.sold / stat.capacity) * 100))
      : 0;
  const meta = TIER_META[stat.tier];

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}>
            {meta.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatPrice(stat.price)}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {stat.sold}/{stat.capacity}석
          {stat.remaining > 0 ? (
            <span className="text-green-600 ml-1">({stat.remaining} 잔여)</span>
          ) : (
            <span className="text-red-500 ml-1">(매진)</span>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${meta.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 예약 행
// ============================================

interface ReservationRowProps {
  reservation: TicketReservation;
  onTogglePaid: () => void;
  onDelete: () => void;
}

function ReservationRow({
  reservation,
  onTogglePaid,
  onDelete,
}: ReservationRowProps) {
  const meta = TIER_META[reservation.tier];

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors group">
      {/* 결제 토글 */}
      <button
        type="button"
        onClick={onTogglePaid}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        title={reservation.isPaid ? "결제 완료 (클릭 시 미결제)" : "미결제 (클릭 시 결제 완료)"}
      >
        {reservation.isPaid ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-300" />
        )}
      </button>

      {/* 예매자 정보 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium">{reservation.buyerName}</span>
          {reservation.buyerContact && (
            <span className="text-[10px] text-muted-foreground">
              {reservation.buyerContact}
            </span>
          )}
          <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${meta.badgeClass}`}>
            {meta.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {reservation.quantity}매
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-medium ${
              reservation.isPaid ? "text-green-600" : "text-orange-500"
            }`}
          >
            {reservation.isPaid ? "결제완료" : "미결제"} —{" "}
            {formatPrice(reservation.totalPrice)}
          </span>
          {reservation.note && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {reservation.note}
            </span>
          )}
        </div>
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={onDelete}
        title="예약 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 단일 공연 패널
// ============================================

interface ConfigPanelProps {
  config: TicketConfig;
  tierStats: TierStat[];
  onDelete: (id: string) => void;
  onAddReservation: (
    configId: string,
    input: Omit<TicketReservation, "id" | "isPaid" | "reservedAt">
  ) => void;
  onDeleteReservation: (configId: string, reservationId: string) => void;
  onTogglePaid: (configId: string, reservationId: string) => void;
}

function ConfigPanel({
  config,
  tierStats,
  onDelete,
  onAddReservation,
  onDeleteReservation,
  onTogglePaid,
}: ConfigPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const totalSold = tierStats.reduce((sum, s) => sum + s.sold, 0);
  const totalCapacity = tierStats.reduce((sum, s) => sum + s.capacity, 0);
  const totalRevenue = tierStats.reduce((sum, s) => sum + s.revenue, 0);
  const paidCount = config.reservations.filter((r) => r.isPaid).length;

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 flex-shrink-0">
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <span className="text-xs font-medium truncate">
              {config.eventName}
            </span>
            {config.eventDate && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatDate(config.eventDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
              {totalSold}/{totalCapacity}석
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(config.id);
                toast.success(`"${config.eventName}" 공연이 삭제되었습니다.`);
              }}
              title="공연 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 패널 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-3">
            {/* 티어별 잔여석 */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                티어별 현황
              </p>
              {tierStats.map((stat) => (
                <TierStatBar key={stat.tier} stat={stat} />
              ))}
            </div>

            {/* 매출 요약 */}
            <div className="grid grid-cols-3 gap-2 rounded-md bg-gray-50 p-2">
              <div className="text-center space-y-0.5">
                <p className="text-[10px] text-muted-foreground">총 예약</p>
                <p className="text-xs font-semibold">{config.reservations.length}건</p>
              </div>
              <div className="text-center space-y-0.5 border-x border-gray-200">
                <p className="text-[10px] text-muted-foreground">결제 완료</p>
                <p className="text-xs font-semibold text-green-600">{paidCount}건</p>
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-[10px] text-muted-foreground">수입</p>
                <p className="text-xs font-semibold text-blue-600">
                  {formatPrice(totalRevenue)}
                </p>
              </div>
            </div>

            {/* 예약 목록 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  예약 목록
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-0.5 px-1.5"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  예약 추가
                </Button>
              </div>

              {config.reservations.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  예약 내역이 없습니다.
                </div>
              ) : (
                <ScrollArea className="max-h-56">
                  <div className="space-y-1">
                    {config.reservations.map((r) => (
                      <ReservationRow
                        key={r.id}
                        reservation={r}
                        onTogglePaid={() => onTogglePaid(config.id, r.id)}
                        onDelete={() => {
                          onDeleteReservation(config.id, r.id);
                          toast.success(
                            `"${r.buyerName}" 예약이 삭제되었습니다.`
                          );
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 예약 추가 다이얼로그 */}
      <AddReservationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        config={config}
        tierStats={tierStats}
        onAdd={(input) => onAddReservation(config.id, input)}
      />
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface TicketManagementCardProps {
  groupId: string;
  projectId: string;
}

export function TicketManagementCard({
  groupId,
  projectId,
}: TicketManagementCardProps) {
  const {
    configs,
    addConfig,
    deleteConfig,
    addReservation,
    deleteReservation,
    togglePaid,
    totalSold,
    totalRevenue,
    getTierStats,
  } = useTicketManagement(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-orange-500 flex-shrink-0" />
            <span className="text-sm font-medium">티켓 관리</span>
            {configs.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 hover:bg-orange-100">
                {configs.length}개 공연
              </Badge>
            )}
          </div>

          {/* 요약 통계 (접힌 상태에서도 표시) */}
          <div className="flex items-center gap-2">
            {totalSold > 0 && (
              <div className="hidden sm:flex items-center gap-3 mr-1">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {totalSold}석
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {formatPrice(totalRevenue)}
                </span>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setCreateDialogOpen(true);
              }}
              title="공연 추가"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">공연 추가</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼쳐지는 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t">
            {configs.length === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Ticket className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 공연 티켓 설정이 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 공연 추가
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {configs.map((config) => (
                  <ConfigPanel
                    key={config.id}
                    config={config}
                    tierStats={getTierStats(config.id)}
                    onDelete={deleteConfig}
                    onAddReservation={addReservation}
                    onDeleteReservation={deleteReservation}
                    onTogglePaid={togglePaid}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 공연 설정 생성 다이얼로그 */}
      <CreateConfigDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={addConfig}
      />
    </div>
  );
}
