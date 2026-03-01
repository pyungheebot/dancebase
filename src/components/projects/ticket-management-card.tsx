"use client";

import { useState } from "react";
import {
  Ticket,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  type TicketMgmtEventStats,
} from "@/hooks/use-ticket-management";
import type { TicketMgmtType, TicketMgmtEvent, TicketMgmtSale } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TYPE_META: Record<
  TicketMgmtType,
  { label: string; badgeClass: string; barColor: string }
> = {
  vip: {
    label: "VIP",
    badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    barColor: "bg-purple-400",
  },
  general: {
    label: "일반",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    barColor: "bg-blue-400",
  },
  student: {
    label: "학생",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
    barColor: "bg-green-400",
  },
  early_bird: {
    label: "얼리버드",
    badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    barColor: "bg-orange-400",
  },
  free: {
    label: "무료",
    badgeClass: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    barColor: "bg-gray-400",
  },
};

const TYPE_OPTIONS: TicketMgmtType[] = [
  "vip",
  "general",
  "student",
  "early_bird",
  "free",
];

// ============================================================
// 유틸리티
// ============================================================

function formatPrice(amount: number): string {
  if (amount === 0) return "무료";
  return amount.toLocaleString("ko-KR") + "원";
}


function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ============================================================
// 이벤트 추가 다이얼로그
// ============================================================

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (eventName: string, eventDate: string) => void;
}

function AddEventDialog({ open, onOpenChange, onAdd }: AddEventDialogProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  function reset() {
    setEventName("");
    setEventDate("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = eventName.trim();
    if (!name) {
      toast.error("이벤트 이름을 입력해주세요.");
      return;
    }
    onAdd(name, eventDate);
    toast.success("이벤트가 추가되었습니다.");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">이벤트 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">이벤트 이름 *</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 정기공연"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">공연 날짜</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-8 text-xs"
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

// ============================================================
// 티어 추가 다이얼로그
// ============================================================

interface AddTierDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingTypes: TicketMgmtType[];
  onAdd: (
    type: TicketMgmtType,
    price: number,
    totalSeats: number,
    description: string
  ) => void;
}

function AddTierDialog({
  open,
  onOpenChange,
  existingTypes,
  onAdd,
}: AddTierDialogProps) {
  const [type, setType] = useState<TicketMgmtType>("general");
  const [price, setPrice] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setType("general");
    setPrice("");
    setTotalSeats("");
    setDescription("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existingTypes.includes(type)) {
      toast.error("이미 동일한 유형의 티어가 존재합니다.");
      return;
    }
    const priceNum = Number(price);
    const seatsNum = Number(totalSeats);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("가격은 0 이상의 숫자를 입력해주세요.");
      return;
    }
    if (isNaN(seatsNum) || seatsNum <= 0) {
      toast.error("총 좌석 수는 1 이상의 숫자를 입력해주세요.");
      return;
    }
    onAdd(type, priceNum, seatsNum, description.trim());
    toast.success("티어가 추가되었습니다.");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">티어 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">티켓 유형 *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as TicketMgmtType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TYPE_META[t].label}
                    {existingTypes.includes(t) ? " (이미 추가됨)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">가격 (원) *</Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">총 좌석 수 *</Label>
            <Input
              type="number"
              min={1}
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              placeholder="100"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">설명</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="티어 설명 (선택)"
              className="h-8 text-xs"
              maxLength={100}
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

// ============================================================
// 판매 등록 다이얼로그
// ============================================================

interface AddSaleDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: TicketMgmtEvent;
  eventStats: TicketMgmtEventStats | null;
  onAdd: (sale: Omit<TicketMgmtSale, "id" | "soldAt">) => void;
}

function AddSaleDialog({
  open,
  onOpenChange,
  event,
  eventStats,
  onAdd,
}: AddSaleDialogProps) {
  const [buyerName, setBuyerName] = useState("");
  const [ticketType, setTicketType] = useState<TicketMgmtType>(
    event.tiers[0]?.type ?? "general"
  );
  const [quantity, setQuantity] = useState("1");
  const [seatInfo, setSeatInfo] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setBuyerName("");
    setTicketType(event.tiers[0]?.type ?? "general");
    setQuantity("1");
    setSeatInfo("");
    setNotes("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  const selectedTier = event.tiers.find((t) => t.type === ticketType);
  const selectedTierStats = eventStats?.tierStats.find(
    (ts) => ts.type === ticketType
  );
  const qty = parseInt(quantity, 10) || 0;
  const unitPrice = selectedTier?.price ?? 0;
  const totalPrice = unitPrice * qty;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (event.tiers.length === 0) {
      toast.error("먼저 티어를 추가해주세요.");
      return;
    }
    if (qty <= 0) {
      toast.error("수량은 1 이상을 입력해주세요.");
      return;
    }
    if (
      selectedTierStats &&
      qty > selectedTierStats.remainingSeats
    ) {
      toast.error(
        `잔여석이 부족합니다. (잔여: ${selectedTierStats.remainingSeats}석)`
      );
      return;
    }
    onAdd({
      buyerName: buyerName.trim() || undefined,
      ticketType,
      quantity: qty,
      totalPrice,
      seatInfo: seatInfo.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast.success("판매가 등록되었습니다.");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">판매 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">구매자 이름</Label>
            <Input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="예: 홍길동 (선택)"
              className="h-8 text-xs"
              autoFocus
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">티켓 유형 *</Label>
            <Select
              value={ticketType}
              onValueChange={(v) => setTicketType(v as TicketMgmtType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {event.tiers.map((tier) => {
                  const ts = eventStats?.tierStats.find(
                    (s) => s.type === tier.type
                  );
                  return (
                    <SelectItem
                      key={tier.type}
                      value={tier.type}
                      className="text-xs"
                    >
                      {TYPE_META[tier.type].label} — {formatPrice(tier.price)}
                      {ts ? ` (잔여 ${ts.remainingSeats}석)` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">수량 *</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          {unitPrice > 0 && qty > 0 && (
            <div className="rounded-md bg-gray-50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">합계</span>
              <span className="text-xs font-semibold text-gray-800">
                {formatPrice(totalPrice)}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">좌석 정보</Label>
            <Input
              value={seatInfo}
              onChange={(e) => setSeatInfo(e.target.value)}
              placeholder="예: A구역 3열 5번 (선택)"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항 메모 (선택)"
              className="text-xs resize-none"
              rows={2}
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
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 이벤트 상세 패널
// ============================================================

interface EventPanelProps {
  event: TicketMgmtEvent;
  onDeleteEvent: (id: string) => void;
  onAddTier: (
    eventId: string,
    type: TicketMgmtType,
    price: number,
    totalSeats: number,
    description: string
  ) => void;
  onDeleteTier: (eventId: string, tierId: string) => void;
  onAddSale: (
    eventId: string,
    sale: Omit<TicketMgmtSale, "id" | "soldAt">
  ) => void;
  onDeleteSale: (eventId: string, saleId: string) => void;
  getEventStats: (eventId: string) => TicketMgmtEventStats | null;
}

function EventPanel({
  event,
  onDeleteEvent,
  onAddTier,
  onDeleteTier,
  onAddSale,
  onDeleteSale,
  getEventStats,
}: EventPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [addTierOpen, setAddTierOpen] = useState(false);
  const [addSaleOpen, setAddSaleOpen] = useState(false);

  const stats = getEventStats(event.id);
  const existingTypes = event.tiers.map((t) => t.type);

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* 이벤트 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
            >
              <ChevronDown
                className={`h-3 w-3 flex-shrink-0 transition-transform ${
                  expanded ? "" : "-rotate-90"
                }`}
              />
              <span className="text-xs font-medium truncate">
                {event.eventName}
              </span>
              {event.eventDate && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  {event.eventDate}
                </span>
              )}
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {stats && stats.totalSeats > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {stats.totalSold}/{stats.totalSeats}석
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => {
                onDeleteEvent(event.id);
                toast.success(`"${event.eventName}" 이벤트가 삭제되었습니다.`);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 space-y-3">
            {/* 티어 판매 현황 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  유형별 판매 현황
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-0.5 px-1.5"
                  onClick={() => setAddTierOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  티어 추가
                </Button>
              </div>

              {event.tiers.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  티어가 없습니다. 티어를 추가해주세요.
                </p>
              ) : (
                <div className="space-y-2">
                  {event.tiers.map((tier) => {
                    const ts = stats?.tierStats.find(
                      (s) => s.type === tier.type
                    );
                    const meta = TYPE_META[tier.type];
                    return (
                      <div key={tier.id} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatPrice(tier.price)}
                            </span>
                            {tier.description && (
                              <span className="text-[10px] text-muted-foreground">
                                · {tier.description}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {ts?.soldCount ?? 0}/{tier.totalSeats}석
                              {ts && ts.remainingSeats <= 0 ? (
                                <span className="text-red-500 ml-1">(매진)</span>
                              ) : ts ? (
                                <span className="text-green-600 ml-1">
                                  ({ts.remainingSeats} 잔여)
                                </span>
                              ) : null}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                onDeleteTier(event.id, tier.id);
                                toast.success("티어가 삭제되었습니다.");
                              }}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                        <Progress
                          value={ts?.soldRate ?? 0}
                          className="h-1.5"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 매출 요약 */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 rounded-md bg-gray-50 p-2">
                <div className="text-center space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">총 매출</p>
                  <p className="text-xs font-semibold text-blue-600">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
                <div className="text-center space-y-0.5 border-x border-gray-200">
                  <p className="text-[10px] text-muted-foreground">총 판매</p>
                  <p className="text-xs font-semibold">
                    {stats.totalSold}석
                  </p>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">잔여석</p>
                  <p className="text-xs font-semibold text-green-600">
                    {stats.totalRemaining}석
                  </p>
                </div>
              </div>
            )}

            {/* 판매 기록 목록 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  판매 기록
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-0.5 px-1.5"
                  onClick={() => setAddSaleOpen(true)}
                  disabled={event.tiers.length === 0}
                >
                  <Plus className="h-3 w-3" />
                  판매 등록
                </Button>
              </div>

              {event.sales.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  판매 기록이 없습니다.
                </div>
              ) : (
                <ScrollArea className="max-h-56">
                  <div className="space-y-1">
                    {event.sales.map((sale) => {
                      const meta = TYPE_META[sale.ticketType];
                      return (
                        <div
                          key={sale.id}
                          className="flex items-center gap-2 py-1.5 px-2 rounded-lg border border-gray-100 bg-card hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-medium">
                                {sale.buyerName || "익명"}
                              </span>
                              <Badge
                                className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {sale.quantity}매
                              </span>
                              <span className="text-[10px] font-medium text-blue-600">
                                {formatPrice(sale.totalPrice)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateTime(sale.soldAt)}
                              </span>
                              {sale.seatInfo && (
                                <span className="text-[10px] text-muted-foreground">
                                  · {sale.seatInfo}
                                </span>
                              )}
                              {sale.notes && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                  · {sale.notes}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => {
                              onDeleteSale(event.id, sale.id);
                              toast.success("판매 기록이 삭제되었습니다.");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 티어 추가 다이얼로그 */}
      <AddTierDialog
        open={addTierOpen}
        onOpenChange={setAddTierOpen}
        existingTypes={existingTypes}
        onAdd={(type, price, totalSeats, description) =>
          onAddTier(event.id, type, price, totalSeats, description)
        }
      />

      {/* 판매 등록 다이얼로그 */}
      <AddSaleDialog
        open={addSaleOpen}
        onOpenChange={setAddSaleOpen}
        event={event}
        eventStats={stats}
        onAdd={(sale) => onAddSale(event.id, sale)}
      />
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface TicketManagementCardProps {
  groupId: string;
  projectId: string;
}

export function TicketManagementCard({
  groupId,
  projectId,
}: TicketManagementCardProps) {
  const {
    events,
    loading,
    addEvent,
    deleteEvent,
    addTier,
    deleteTier,
    addSale,
    deleteSale,
    getEventStats,
    stats,
  } = useTicketManagement(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Ticket className="h-4 w-4 text-orange-500" />
              공연 티켓 관리
              {events.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 hover:bg-orange-100">
                  {events.length}개 이벤트
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {stats.totalSold > 0 && (
                <div className="hidden sm:flex items-center gap-3 mr-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {stats.totalSold}석
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {formatPrice(stats.totalRevenue)}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddEventOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline">이벤트 추가</span>
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
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 border-t">
            {loading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                불러오는 중...
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Ticket className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 이벤트가 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setAddEventOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 이벤트 추가
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {/* 전체 통계 요약 */}
                {stats.totalEvents > 1 && (
                  <div className="grid grid-cols-4 gap-2 rounded-md bg-orange-50 p-2 mb-3">
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">이벤트</p>
                      <p className="text-xs font-semibold">
                        {stats.totalEvents}개
                      </p>
                    </div>
                    <div className="text-center space-y-0.5 border-x border-orange-200">
                      <p className="text-[10px] text-muted-foreground">총 매출</p>
                      <p className="text-xs font-semibold text-blue-600">
                        {formatPrice(stats.totalRevenue)}
                      </p>
                    </div>
                    <div className="text-center space-y-0.5 border-r border-orange-200">
                      <p className="text-[10px] text-muted-foreground">총 판매</p>
                      <p className="text-xs font-semibold">
                        {stats.totalSold}석
                      </p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">매진 티어</p>
                      <p className="text-xs font-semibold text-red-500">
                        {stats.soldOutTiers}개
                      </p>
                    </div>
                  </div>
                )}

                {/* 이벤트 목록 */}
                {events.map((event) => (
                  <EventPanel
                    key={event.id}
                    event={event}
                    onDeleteEvent={deleteEvent}
                    onAddTier={(eventId, type, price, totalSeats, description) =>
                      addTier(eventId, { type, price, totalSeats, description })
                    }
                    onDeleteTier={deleteTier}
                    onAddSale={addSale}
                    onDeleteSale={deleteSale}
                    getEventStats={getEventStats}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        onAdd={(eventName, eventDate) => addEvent({ eventName, eventDate })}
      />
    </Card>
  );
}
