"use client";

import { useState } from "react";
import {
  HandHeart,
  Plus,
  Trash2,
  Pencil,
  X,
  Target,
  TrendingUp,
  Mail,
  User,
  Star,
  Package,
  ChevronDown,
  ChevronUp,
  Award,
  BadgeCheck,
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
  usePerformanceSponsor,
  type SponsorTierBreakdown,
} from "@/hooks/use-performance-sponsor";
import type { PerfSponsorEntry, PerfSponsorTier } from "@/types";

// ============================================================
// 상수
// ============================================================

const TIER_ORDER: PerfSponsorTier[] = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "supporter",
];

const TIER_LABELS: Record<PerfSponsorTier, string> = {
  platinum: "플래티넘",
  gold: "골드",
  silver: "실버",
  bronze: "브론즈",
  supporter: "서포터",
};

const TIER_BADGE_CLASS: Record<PerfSponsorTier, string> = {
  platinum: "bg-purple-100 text-purple-700 border-purple-300",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-300",
  silver: "bg-gray-100 text-gray-600 border-gray-300",
  bronze: "bg-orange-100 text-orange-800 border-orange-300",
  supporter: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

type SponsorStatus = "confirmed" | "pending" | "declined";

const STATUS_LABELS: Record<SponsorStatus, string> = {
  confirmed: "확정",
  pending: "보류",
  declined: "거절",
};

const STATUS_BADGE_CLASS: Record<SponsorStatus, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-300",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  declined: "bg-gray-100 text-gray-500 border-gray-300",
};

const STATUS_ICONS: Record<SponsorStatus, React.ReactNode> = {
  confirmed: <BadgeCheck className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  declined: <XCircle className="h-3 w-3" />,
};

// ============================================================
// 유틸
// ============================================================

function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

// ============================================================
// 하위 컴포넌트: 후원 목표 달성률 바
// ============================================================

function GoalProgressBar({
  progress,
  confirmedAmount,
  totalGoal,
}: {
  progress: number | null;
  confirmedAmount: number;
  totalGoal: number | null;
}) {
  if (totalGoal == null) return null;
  const pct = progress ?? 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          후원 목표 달성률
        </span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 100
                ? "#16a34a"
                : pct >= 60
                  ? "#2563eb"
                  : "#7c3aed",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>확정 {formatKRW(confirmedAmount)}</span>
        <span>목표 {formatKRW(totalGoal)}</span>
      </div>
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 등급별 후원금 분포 차트 (CSS div 기반)
// ============================================================

function TierDistributionChart({
  tierBreakdown,
}: {
  tierBreakdown: SponsorTierBreakdown[];
}) {
  const activeBreakdown = tierBreakdown.filter(
    (t) => t.confirmedAmount + t.pendingAmount > 0
  );
  if (activeBreakdown.length === 0) return null;

  const totalAmount = activeBreakdown.reduce(
    (acc, t) => acc + t.confirmedAmount + t.pendingAmount,
    0
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        등급별 후원금 분포
      </p>
      {activeBreakdown.map((t) => {
        const total = t.confirmedAmount + t.pendingAmount;
        const pct = totalAmount > 0 ? Math.round((total / totalAmount) * 100) : 0;
        return (
          <div key={t.tier} className="space-y-0.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <span className="font-medium">{t.label}</span>
                <span className="text-muted-foreground text-[10px]">
                  ({t.count}개사)
                </span>
              </div>
              <span className="text-muted-foreground">
                {formatKRW(total)} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: t.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 스폰서 행 (Collapsible)
// ============================================================

function SponsorRow({
  sponsor,
  onEdit,
  onDelete,
}: {
  sponsor: PerfSponsorEntry;
  onEdit: (sponsor: PerfSponsorEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">{sponsor.name}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${TIER_BADGE_CLASS[sponsor.tier]}`}
                >
                  {TIER_LABELS[sponsor.tier]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${STATUS_BADGE_CLASS[sponsor.status]}`}
                >
                  {STATUS_ICONS[sponsor.status]}
                  {STATUS_LABELS[sponsor.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatKRW(sponsor.amount)}
                {sponsor.inKind && (
                  <span className="ml-1.5 text-[10px] text-cyan-600">
                    + 현물 후원
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(sponsor);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(sponsor.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t bg-muted/20 space-y-2 text-xs text-muted-foreground">
            {sponsor.contactPerson && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 flex-shrink-0" />
                <span>{sponsor.contactPerson}</span>
                {sponsor.contactEmail && (
                  <>
                    <Mail className="h-3 w-3 flex-shrink-0 ml-1" />
                    <span className="truncate">{sponsor.contactEmail}</span>
                  </>
                )}
              </div>
            )}
            {sponsor.inKind && (
              <div className="flex items-start gap-1.5">
                <Package className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>현물: {sponsor.inKind}</span>
              </div>
            )}
            {sponsor.logoPlacement && (
              <div className="flex items-start gap-1.5">
                <Star className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>로고 위치: {sponsor.logoPlacement}</span>
              </div>
            )}
            {sponsor.benefits.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Award className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {sponsor.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="bg-muted border rounded px-1.5 py-0.5 text-[10px]"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {sponsor.notes && (
              <p className="text-[10px] leading-relaxed text-muted-foreground border-t pt-1.5 mt-1.5">
                {sponsor.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 하위 컴포넌트: 스폰서 추가/수정 다이얼로그
// ============================================================

type SponsorFormData = {
  name: string;
  contactPerson: string;
  contactEmail: string;
  tier: PerfSponsorTier;
  amount: string;
  inKind: string;
  logoPlacement: string;
  benefitsRaw: string;
  status: SponsorStatus;
  notes: string;
};

const EMPTY_FORM: SponsorFormData = {
  name: "",
  contactPerson: "",
  contactEmail: "",
  tier: "gold",
  amount: "",
  inKind: "",
  logoPlacement: "",
  benefitsRaw: "",
  status: "pending",
  notes: "",
};

function sponsorToForm(s: PerfSponsorEntry): SponsorFormData {
  return {
    name: s.name,
    contactPerson: s.contactPerson ?? "",
    contactEmail: s.contactEmail ?? "",
    tier: s.tier,
    amount: s.amount > 0 ? String(s.amount) : "",
    inKind: s.inKind ?? "",
    logoPlacement: s.logoPlacement ?? "",
    benefitsRaw: s.benefits.join(", "),
    status: s.status,
    notes: s.notes,
  };
}

function SponsorDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: SponsorFormData;
  onSubmit: (form: SponsorFormData) => void;
}) {
  const [form, setForm] = useState<SponsorFormData>(initial);

  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initial);
    onOpenChange(v);
  };

  const set = <K extends keyof SponsorFormData>(
    key: K,
    value: SponsorFormData[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("스폰서 이름을 입력해주세요.");
      return;
    }
    const amount = Number(form.amount.replace(/,/g, ""));
    if (form.amount && (isNaN(amount) || amount < 0)) {
      toast.error("후원 금액을 올바르게 입력해주세요.");
      return;
    }
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandHeart className="h-4 w-4" />
            스폰서 {initial.name ? "수정" : "추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 스폰서명 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              스폰서명 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-sm"
              placeholder="기업 또는 개인 이름"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* 담당자 / 이메일 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">담당자</Label>
              <Input
                className="h-8 text-sm"
                placeholder="홍길동"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">이메일</Label>
              <Input
                className="h-8 text-sm"
                placeholder="contact@example.com"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </div>
          </div>

          {/* 등급 / 금액 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">후원 등급</Label>
              <Select
                value={form.tier}
                onValueChange={(v) => set("tier", v as PerfSponsorTier)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_ORDER.map((tier) => (
                    <SelectItem key={tier} value={tier} className="text-sm">
                      {TIER_LABELS[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">후원 금액 (원)</Label>
              <Input
                className="h-8 text-sm"
                placeholder="0"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">후원 상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v as SponsorStatus)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="text-sm">
                  보류 (협의 중)
                </SelectItem>
                <SelectItem value="confirmed" className="text-sm">
                  확정
                </SelectItem>
                <SelectItem value="declined" className="text-sm">
                  거절
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 현물 후원 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">현물 후원 내역</Label>
            <Input
              className="h-8 text-sm"
              placeholder="의상 협찬, 장비 대여 등 (없으면 비워두세요)"
              value={form.inKind}
              onChange={(e) => set("inKind", e.target.value)}
            />
          </div>

          {/* 로고 게재 위치 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">로고 게재 위치</Label>
            <Input
              className="h-8 text-sm"
              placeholder="무대 배너, 팸플릿 표지 등"
              value={form.logoPlacement}
              onChange={(e) => set("logoPlacement", e.target.value)}
            />
          </div>

          {/* 혜택 목록 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">제공 혜택 (쉼표로 구분)</Label>
            <Input
              className="h-8 text-sm"
              placeholder="VIP 좌석 2석, SNS 홍보, 현장 부스"
              value={form.benefitsRaw}
              onChange={(e) => set("benefitsRaw", e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              쉼표(,)로 구분하여 여러 혜택을 입력하세요.
            </p>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메모</Label>
            <Textarea
              className="text-sm min-h-[60px] resize-none"
              placeholder="협의 사항, 특이 조건 등"
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
          >
            <X className="h-3 w-3 mr-1" />
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
// 하위 컴포넌트: 목표 금액 설정 다이얼로그
// ============================================================

function GoalDialog({
  open,
  onOpenChange,
  currentGoal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentGoal: number | null;
  onSave: (goal: number | null) => void;
}) {
  const [value, setValue] = useState(
    currentGoal != null ? String(currentGoal) : ""
  );

  const handleOpenChange = (v: boolean) => {
    if (v) setValue(currentGoal != null ? String(currentGoal) : "");
    onOpenChange(v);
  };

  const handleSave = () => {
    if (!value.trim()) {
      onSave(null);
      onOpenChange(false);
      return;
    }
    const num = Number(value.replace(/,/g, ""));
    if (isNaN(num) || num < 0) {
      toast.error("올바른 금액을 입력해주세요.");
      return;
    }
    onSave(num);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            후원 목표 금액 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label className="text-xs font-medium">목표 금액 (원)</Label>
          <Input
            className="h-8 text-sm"
            placeholder="5000000"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground">
            비워두면 목표 설정을 해제합니다.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
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

export function PerformanceSponsorCard({ projectId }: { projectId: string }) {
  const {
    sponsors,
    totalGoal,
    loading,
    stats,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    setTotalGoal,
  } = usePerformanceSponsor(projectId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PerfSponsorEntry | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // ── 핸들러 ──────────────────────────────────────────────

  const handleAdd = (form: SponsorFormData) => {
    addSponsor({
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      tier: form.tier,
      amount: Number(form.amount.replace(/,/g, "")) || 0,
      inKind: form.inKind.trim() || null,
      logoPlacement: form.logoPlacement.trim() || null,
      benefits: form.benefitsRaw
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      status: form.status,
      notes: form.notes.trim(),
    });
    toast.success("스폰서가 추가되었습니다.");
  };

  const handleUpdate = (form: SponsorFormData) => {
    if (!editTarget) return;
    const ok = updateSponsor(editTarget.id, {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      tier: form.tier,
      amount: Number(form.amount.replace(/,/g, "")) || 0,
      inKind: form.inKind.trim() || null,
      logoPlacement: form.logoPlacement.trim() || null,
      benefits: form.benefitsRaw
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      status: form.status,
      notes: form.notes.trim(),
    });
    if (ok) toast.success("스폰서 정보가 수정되었습니다.");
    else toast.error("수정에 실패했습니다.");
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    const ok = deleteSponsor(id);
    if (ok) toast.success("스폰서가 삭제되었습니다.");
    else toast.error("삭제에 실패했습니다.");
  };

  const handleSetGoal = (goal: number | null) => {
    setTotalGoal(goal);
    if (goal != null)
      toast.success(`목표 금액이 ${formatKRW(goal)}로 설정되었습니다.`);
    else toast.success("목표 금액이 해제되었습니다.");
  };

  // ── 등급별 그룹 ────────────────────────────────────────

  const sponsorsByTier = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    items: sponsors.filter((s) => s.tier === tier),
  })).filter((g) => g.items.length > 0);

  // ── 렌더 ────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-purple-500" />
              공연 후원/스폰서 관리
              {sponsors.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {sponsors.length}개사
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setGoalDialogOpen(true)}
              >
                <Target className="h-3 w-3 mr-1" />
                목표 설정
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                스폰서 추가
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          {sponsors.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">전체 스폰서</p>
                <p className="text-lg font-bold mt-0.5">{stats.totalSponsors}</p>
                <p className="text-[10px] text-muted-foreground">개사</p>
              </div>
              <div className="rounded-lg border bg-green-50 p-2.5 text-center">
                <p className="text-[10px] text-green-600">확정 후원금</p>
                <p className="text-sm font-bold text-green-700 mt-0.5 tabular-nums">
                  {formatKRW(stats.confirmedAmount)}
                </p>
                <p className="text-[10px] text-green-600">확정</p>
              </div>
              <div className="rounded-lg border bg-yellow-50 p-2.5 text-center">
                <p className="text-[10px] text-yellow-600">보류 후원금</p>
                <p className="text-sm font-bold text-yellow-700 mt-0.5 tabular-nums">
                  {formatKRW(stats.pendingAmount)}
                </p>
                <p className="text-[10px] text-yellow-600">협의 중</p>
              </div>
            </div>
          )}

          {/* 목표 달성률 바 */}
          {totalGoal != null && (
            <GoalProgressBar
              progress={stats.goalProgress}
              confirmedAmount={stats.confirmedAmount}
              totalGoal={totalGoal}
            />
          )}

          {/* 등급별 분포 차트 */}
          {sponsors.length > 0 && (
            <TierDistributionChart tierBreakdown={stats.tierBreakdown} />
          )}

          {/* 등급별 스폰서 목록 */}
          {sponsors.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <HandHeart className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  등록된 스폰서가 없습니다
                </p>
                <p className="text-xs text-muted-foreground/70">
                  스폰서 추가 버튼을 눌러 첫 번째 후원사를 등록하세요.
                </p>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                스폰서 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sponsorsByTier.map((group) => (
                <div key={group.tier} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${TIER_BADGE_CLASS[group.tier]}`}
                    >
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {group.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {group.items.length}개사
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((sponsor) => (
                      <SponsorRow
                        key={sponsor.id}
                        sponsor={sponsor}
                        onEdit={(s) => setEditTarget(s)}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <SponsorDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initial={EMPTY_FORM}
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <SponsorDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          initial={sponsorToForm(editTarget)}
          onSubmit={handleUpdate}
        />
      )}

      {/* 목표 금액 다이얼로그 */}
      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        currentGoal={totalGoal}
        onSave={handleSetGoal}
      />
    </>
  );
}
