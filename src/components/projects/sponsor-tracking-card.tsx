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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  HandCoins,
  Pencil,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSponsorTracking } from "@/hooks/use-sponsor-tracking";
import type { SponsorTier, SponsorTrackingEntry, SponsorBenefitItem } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TIER_LABELS: Record<SponsorTier, string> = {
  platinum: "플래티넘",
  gold: "골드",
  silver: "실버",
  bronze: "브론즈",
  individual: "개인",
};

const TIER_COLORS: Record<
  SponsorTier,
  { badge: string; dot: string }
> = {
  platinum: {
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  gold: {
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  silver: {
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
  bronze: {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  individual: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
};

const TIER_ORDER: SponsorTier[] = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "individual",
];

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ============================================================
// 다이얼로그 폼 타입
// ============================================================

type SponsorFormData = {
  sponsorName: string;
  tier: SponsorTier;
  amount: string;
  contactPerson: string;
  contactEmail: string;
  benefits: string[]; // 설명 문자열 목록
  notes: string;
  paymentReceived: boolean;
  paymentDate: string;
};

const EMPTY_FORM: SponsorFormData = {
  sponsorName: "",
  tier: "gold",
  amount: "",
  contactPerson: "",
  contactEmail: "",
  benefits: [],
  notes: "",
  paymentReceived: false,
  paymentDate: "",
};

// ============================================================
// 스폰서 추가/편집 다이얼로그
// ============================================================

function SponsorDialog({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SponsorFormData) => void;
  initial?: SponsorFormData;
  title: string;
}) {
  const [form, setForm] = useState<SponsorFormData>(
    initial ?? EMPTY_FORM
  );
  const [newBenefit, setNewBenefit] = useState("");

  // initial 변경 시 폼 동기화
  useState(() => {
    if (initial) setForm(initial);
  });

  // Dialog가 열릴 때 폼 초기화
  if (!open) return null;

  function set<K extends keyof SponsorFormData>(
    key: K,
    value: SponsorFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addBenefit() {
    const trimmed = newBenefit.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, benefits: [...prev.benefits, trimmed] }));
    setNewBenefit("");
  }

  function removeBenefit(idx: number) {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== idx),
    }));
  }

  function handleSubmit() {
    if (!form.sponsorName.trim()) {
      toast.error("후원사 이름을 입력해주세요.");
      return;
    }
    const parsedAmount = parseInt(form.amount.replace(/,/g, ""), 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("올바른 후원 금액을 입력해주세요.");
      return;
    }
    onSubmit({ ...form, amount: String(parsedAmount) });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 후원사 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">후원사 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="후원사 또는 후원인 이름"
              value={form.sponsorName}
              onChange={(e) => set("sponsorName", e.target.value)}
            />
          </div>

          {/* 티어 & 금액 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">후원 티어 *</Label>
              <Select
                value={form.tier}
                onValueChange={(v) => set("tier", v as SponsorTier)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_ORDER.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {TIER_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">후원 금액 (원) *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 500000"
                value={form.amount}
                onChange={(e) =>
                  set("amount", e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </div>
          </div>

          {/* 담당자 & 이메일 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">담당자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="담당자 이름"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이메일</Label>
              <Input
                className="h-8 text-xs"
                placeholder="이메일 주소"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
          </div>

          {/* 입금 여부 & 입금일 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-received"
                checked={form.paymentReceived}
                onCheckedChange={(v) => set("paymentReceived", !!v)}
              />
              <Label htmlFor="payment-received" className="text-xs cursor-pointer">
                입금 완료
              </Label>
            </div>
            {form.paymentReceived && (
              <div className="flex-1 space-y-1">
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={form.paymentDate}
                  onChange={(e) => set("paymentDate", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 혜택 목록 */}
          <div className="space-y-1">
            <Label className="text-xs">제공 혜택</Label>
            <div className="space-y-1">
              {form.benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-muted/40 rounded px-2 py-1"
                >
                  <span className="flex-1 text-xs text-muted-foreground">{b}</span>
                  <button
                    type="button"
                    onClick={() => removeBenefit(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                className="h-7 text-xs flex-1"
                placeholder="혜택 설명 입력 후 추가"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2"
                onClick={addBenefit}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 메모 사항"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
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

// ============================================================
// 스폰서 행 컴포넌트
// ============================================================

function SponsorRow({
  sponsor,
  onEdit,
  onDelete,
  onTogglePayment,
  onToggleBenefit,
}: {
  sponsor: SponsorTrackingEntry;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePayment: () => void;
  onToggleBenefit: (benefitId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tierColor = TIER_COLORS[sponsor.tier];

  const totalBenefits = sponsor.benefits.length;
  const deliveredBenefits = sponsor.benefits.filter((b) => b.isDelivered).length;
  const benefitRate =
    totalBenefits > 0
      ? Math.round((deliveredBenefits / totalBenefits) * 100)
      : 0;

  return (
    <div className="border rounded-md overflow-hidden">
      {/* 헤더 행 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background">
        {/* 티어 도트 */}
        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${tierColor.dot}`} />

        {/* 이름 & 티어 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium truncate">
              {sponsor.sponsorName}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${tierColor.badge}`}
            >
              {TIER_LABELS[sponsor.tier]}
            </Badge>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {formatAmount(sponsor.amount)}
            {sponsor.contactPerson && ` · ${sponsor.contactPerson}`}
          </div>
        </div>

        {/* 입금 체크 */}
        <button
          type="button"
          onClick={onTogglePayment}
          className="flex-shrink-0"
          title={sponsor.paymentReceived ? "입금 완료" : "미입금"}
        >
          {sponsor.paymentReceived ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* 혜택 진행률 */}
        {totalBenefits > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 w-16">
            <Progress value={benefitRate} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground w-7 text-right">
              {benefitRate}%
            </span>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {totalBenefits > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 혜택 체크리스트 */}
      {expanded && totalBenefits > 0 && (
        <div className="border-t bg-muted/20 px-3 py-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">
            혜택 이행 현황
          </p>
          {sponsor.benefits.map((benefit) => (
            <div key={benefit.id} className="flex items-center gap-2">
              <Checkbox
                id={`benefit-${benefit.id}`}
                checked={benefit.isDelivered}
                onCheckedChange={() => onToggleBenefit(benefit.id)}
                className="h-3.5 w-3.5"
              />
              <label
                htmlFor={`benefit-${benefit.id}`}
                className={`text-xs cursor-pointer ${
                  benefit.isDelivered
                    ? "line-through text-muted-foreground"
                    : ""
                }`}
              >
                {benefit.description}
              </label>
            </div>
          ))}
          {sponsor.notes && (
            <p className="text-[10px] text-muted-foreground mt-2 pt-1.5 border-t">
              {sponsor.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function SponsorTrackingCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    sponsors,
    loading,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    togglePayment,
    toggleBenefitDelivered,
    stats,
  } = useSponsorTracking(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SponsorTrackingEntry | null>(
    null
  );

  // 스폰서 추가 제출
  function handleAdd(data: SponsorFormData) {
    const parsedAmount = parseInt(data.amount, 10);
    addSponsor({
      sponsorName: data.sponsorName.trim(),
      tier: data.tier,
      amount: parsedAmount,
      contactPerson: data.contactPerson.trim() || undefined,
      contactEmail: data.contactEmail.trim() || undefined,
      benefits: data.benefits.map((desc) => ({
        id: crypto.randomUUID(),
        description: desc,
        isDelivered: false,
      })),
      paymentReceived: data.paymentReceived,
      paymentDate: data.paymentReceived && data.paymentDate
        ? data.paymentDate
        : undefined,
      notes: data.notes.trim() || undefined,
    });
    setAddDialogOpen(false);
    toast.success("스폰서가 추가되었습니다.");
  }

  // 스폰서 수정 제출
  function handleEdit(data: SponsorFormData) {
    if (!editTarget) return;
    const parsedAmount = parseInt(data.amount, 10);

    // 기존 혜택 ID 보존 (설명이 일치하는 항목), 새 항목은 UUID 생성
    const existingBenefits = editTarget.benefits;
    const updatedBenefits: SponsorBenefitItem[] = data.benefits.map((desc) => {
      const found = existingBenefits.find((b) => b.description === desc);
      return found ?? { id: crypto.randomUUID(), description: desc, isDelivered: false };
    });

    const ok = updateSponsor(editTarget.id, {
      sponsorName: data.sponsorName.trim(),
      tier: data.tier,
      amount: parsedAmount,
      contactPerson: data.contactPerson.trim() || undefined,
      contactEmail: data.contactEmail.trim() || undefined,
      benefits: updatedBenefits,
      paymentReceived: data.paymentReceived,
      paymentDate: data.paymentReceived && data.paymentDate
        ? data.paymentDate
        : undefined,
      notes: data.notes.trim() || undefined,
    });

    if (ok) {
      toast.success("스폰서 정보가 수정되었습니다.");
    } else {
      toast.error("수정에 실패했습니다.");
    }
    setEditTarget(null);
  }

  // 삭제
  function handleDelete(sponsorId: string, sponsorName: string) {
    const ok = deleteSponsor(sponsorId);
    if (ok) {
      toast.success(`"${sponsorName}" 스폰서가 삭제되었습니다.`);
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  // 편집 초기 폼 생성
  function buildEditForm(s: SponsorTrackingEntry): SponsorFormData {
    return {
      sponsorName: s.sponsorName,
      tier: s.tier,
      amount: String(s.amount),
      contactPerson: s.contactPerson ?? "",
      contactEmail: s.contactEmail ?? "",
      benefits: s.benefits.map((b) => b.description),
      notes: s.notes ?? "",
      paymentReceived: s.paymentReceived,
      paymentDate: s.paymentDate ?? "",
    };
  }

  // 티어별 그룹핑
  const sponsorsByTier = TIER_ORDER.reduce(
    (acc, tier) => {
      acc[tier] = sponsors.filter((s) => s.tier === tier);
      return acc;
    },
    {} as Record<SponsorTier, SponsorTrackingEntry[]>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <HandCoins className="h-4 w-4 text-yellow-500" />
                  공연 스폰서 후원 추적
                  {sponsors.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {sponsors.length}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalAmount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatAmount(stats.totalAmount)}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 후원 요약 */}
              {sponsors.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">전체</p>
                    <p className="text-xs font-semibold">
                      {formatAmount(stats.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-md bg-green-50 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-green-600">입금완료</p>
                    <p className="text-xs font-semibold text-green-700">
                      {formatAmount(stats.receivedAmount)}
                    </p>
                  </div>
                  <div className="rounded-md bg-orange-50 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-orange-600">미입금</p>
                    <p className="text-xs font-semibold text-orange-700">
                      {formatAmount(stats.pendingAmount)}
                    </p>
                  </div>
                </div>
              )}

              {/* 혜택 이행률 */}
              {sponsors.length > 0 &&
                sponsors.some((s) => s.benefits.length > 0) && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        전체 혜택 이행률
                      </span>
                      <span className="text-[10px] font-medium">
                        {stats.benefitCompletionRate}%
                      </span>
                    </div>
                    <Progress
                      value={stats.benefitCompletionRate}
                      className="h-1.5"
                    />
                  </div>
                )}

              {/* 티어별 스폰서 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : sponsors.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <HandCoins className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">등록된 스폰서가 없습니다.</p>
                  <p className="text-[10px] mt-1">
                    아래 버튼을 눌러 후원사를 추가해보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {TIER_ORDER.filter(
                    (tier) => sponsorsByTier[tier].length > 0
                  ).map((tier) => (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full ${TIER_COLORS[tier].dot}`}
                        />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {TIER_LABELS[tier]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ·{" "}
                          {formatAmount(
                            stats.tierBreakdown[tier].amount
                          )}
                        </span>
                      </div>
                      <div className="space-y-1.5 ml-3.5">
                        {sponsorsByTier[tier].map((sponsor) => (
                          <SponsorRow
                            key={sponsor.id}
                            sponsor={sponsor}
                            onEdit={() => setEditTarget(sponsor)}
                            onDelete={() =>
                              handleDelete(sponsor.id, sponsor.sponsorName)
                            }
                            onTogglePayment={() => {
                              const ok = togglePayment(sponsor.id);
                              if (!ok) toast.error("입금 상태 변경에 실패했습니다.");
                            }}
                            onToggleBenefit={(benefitId) => {
                              const ok = toggleBenefitDelivered(
                                sponsor.id,
                                benefitId
                              );
                              if (!ok)
                                toast.error("혜택 상태 변경에 실패했습니다.");
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 스폰서 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                스폰서 추가
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가 다이얼로그 */}
      <SponsorDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="스폰서 추가"
      />

      {/* 편집 다이얼로그 */}
      {editTarget && (
        <SponsorDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initial={buildEditForm(editTarget)}
          title="스폰서 정보 수정"
        />
      )}
    </>
  );
}
