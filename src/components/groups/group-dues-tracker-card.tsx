"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BarChart3,
  Users,
  TrendingUp,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupDuesTracker } from "@/hooks/use-group-dues-tracker";
import type { DuesTrackPeriod, DuesTrackPaymentStatus } from "@/types";

// ─── 상태 메타 ────────────────────────────────────────────────

type StatusMeta = {
  label: string;
  badge: string;
  icon: React.ReactNode;
  row: string;
};

const STATUS_META: Record<DuesTrackPaymentStatus, StatusMeta> = {
  paid: {
    label: "납부",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
    icon: <CheckCircle2 className="h-3 w-3" />,
    row: "bg-green-50/50",
  },
  unpaid: {
    label: "미납",
    badge: "bg-red-100 text-red-600 hover:bg-red-100",
    icon: <XCircle className="h-3 w-3" />,
    row: "bg-red-50/30",
  },
  exempt: {
    label: "면제",
    badge: "bg-gray-100 text-gray-500 hover:bg-gray-100",
    icon: <MinusCircle className="h-3 w-3" />,
    row: "bg-gray-50/50",
  },
};

const ALL_STATUSES: DuesTrackPaymentStatus[] = ["paid", "unpaid", "exempt"];

// ─── 유틸 ─────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount >= 10000)
    return `${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}만원`;
  return `${amount.toLocaleString()}원`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatYearMonth(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

// ─── 기간 추가 다이얼로그 ─────────────────────────────────────

interface AddPeriodDialogProps {
  hook: ReturnType<typeof useGroupDuesTracker>;
}

function AddPeriodDialog({ hook }: AddPeriodDialogProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [memberList, setMemberList] = useState<string[]>([]);

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (memberList.includes(trimmed)) {
      toast.error("이미 추가된 이름입니다.");
      return;
    }
    setMemberList((prev) => [...prev, trimmed]);
    setMemberInput("");
  };

  const handleRemoveMember = (name: string) => {
    setMemberList((prev) => prev.filter((n) => n !== name));
  };

  const handleSubmit = () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const amt = parseInt(amount.replace(/,/g, ""), 10);

    if (!y || m < 1 || m > 12) {
      toast.error("올바른 년도/월을 입력해주세요.");
      return;
    }
    if (!amt || amt <= 0) {
      toast.error("납부 금액을 입력해주세요.");
      return;
    }
    if (!dueDate) {
      toast.error("납부 기한을 선택해주세요.");
      return;
    }

    const ok = hook.addPeriod(y, m, amt, dueDate, memberList);
    if (ok) {
      toast.success(`${y}년 ${m}월 납부 기간이 추가되었습니다.`);
      setYear(String(now.getFullYear()));
      setMonth(String(now.getMonth() + 1));
      setAmount("");
      setDueDate("");
      setMemberInput("");
      setMemberList([]);
      setOpen(false);
    } else {
      toast.error("이미 해당 월의 납부 기간이 존재합니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 bg-emerald-500 text-xs hover:bg-emerald-600">
          <Plus className="mr-1 h-3 w-3" />
          기간 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-emerald-500" />
            납부 기간 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 년/월 */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-medium text-gray-500">
                년도 <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="h-7 text-xs"
                min={2020}
                max={2099}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-medium text-gray-500">
                월 <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="1~12"
                className="h-7 text-xs"
                min={1}
                max={12}
              />
            </div>
          </div>

          {/* 납부 금액 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              납부 금액 (원) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 30000"
                className="h-7 pr-6 text-xs"
                min={0}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                원
              </span>
            </div>
          </div>

          {/* 납부 기한 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              납부 기한 <span className="text-red-400">*</span>
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* 멤버 입력 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              멤버 목록 (선택 — 나중에도 추가 가능)
            </label>
            <div className="flex gap-1">
              <Input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value.slice(0, 20))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="이름 입력 후 Enter"
                className="h-7 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleAddMember}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {memberList.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {memberList.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(name)}
                      className="text-emerald-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            className="h-8 w-full bg-emerald-500 text-xs hover:bg-emerald-600"
            onClick={handleSubmit}
            disabled={!year || !month || !amount || !dueDate}
          >
            추가하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 최근 6개월 납부율 추이 차트 ──────────────────────────────

interface TrendChartProps {
  trend: ReturnType<typeof useGroupDuesTracker>["recentTrend"];
}

function TrendChart({ trend }: TrendChartProps) {
  if (trend.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-md bg-gray-50 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-gray-400" />
        <span className="text-[11px] font-medium text-gray-500">
          최근 납부율 추이
        </span>
      </div>
      {trend.map(({ label, paidRate, paid, payable }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-right text-[10px] font-medium text-gray-500">
            {label}
          </span>
          <div className="flex flex-1 items-center gap-1.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${paidRate}%` }}
              />
            </div>
            <span className="w-16 text-right text-[10px] text-gray-400">
              {paid}/{payable}명 ({paidRate}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 멤버 행 ─────────────────────────────────────────────────

interface MemberRowProps {
  member: DuesTrackPeriod["members"][number];
  periodId: string;
  hook: ReturnType<typeof useGroupDuesTracker>;
  selected: boolean;
  onToggleSelect: () => void;
}

function MemberRow({
  member,
  periodId,
  hook,
  selected,
  onToggleSelect,
}: MemberRowProps) {
  const meta = STATUS_META[member.status];

  const handleStatusChange = (status: DuesTrackPaymentStatus) => {
    const ok = hook.setMemberStatus(periodId, member.id, status);
    if (ok) toast.success(`${member.name} 상태가 변경되었습니다.`);
    else toast.error("상태 변경에 실패했습니다.");
  };

  const handleDelete = () => {
    const ok = hook.removeMemberFromPeriod(periodId, member.id);
    if (ok) toast.success(`${member.name}이(가) 삭제되었습니다.`);
    else toast.error(TOAST.DELETE_ERROR);
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 ${meta.row} ${
        selected ? "ring-1 ring-emerald-300" : ""
      }`}
    >
      {/* 체크박스 */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        className="h-3 w-3 accent-emerald-500"
      />

      {/* 이름 */}
      <span className="flex-1 text-xs font-medium text-gray-700">
        {member.name}
      </span>

      {/* 납부일 */}
      {member.status === "paid" && member.paidAt && (
        <span className="text-[10px] text-gray-400">
          {formatDate(member.paidAt)}
        </span>
      )}

      {/* 상태 배지 (클릭 순환) */}
      <div className="flex gap-1">
        {ALL_STATUSES.map((s) => {
          const sm = STATUS_META[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusChange(s)}
              title={sm.label}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                member.status === s
                  ? `${sm.badge} border-transparent font-semibold`
                  : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
              }`}
            >
              {sm.label}
            </button>
          );
        })}
      </div>

      {/* 삭제 */}
      <button
        type="button"
        onClick={handleDelete}
        className="text-gray-200 transition-colors hover:text-red-400"
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── 기간 카드 ────────────────────────────────────────────────

interface PeriodCardProps {
  period: DuesTrackPeriod;
  hook: ReturnType<typeof useGroupDuesTracker>;
}

function PeriodCard({ period, hook }: PeriodCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addMemberInput, setAddMemberInput] = useState("");

  const stats = hook.getPeriodStats(period);

  const unpaidMembers = period.members.filter((m) => m.status === "unpaid");

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === period.members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(period.members.map((m) => m.id)));
    }
  };

  const handleBulkStatus = (status: DuesTrackPaymentStatus) => {
    if (selectedIds.size === 0) {
      toast.error("멤버를 선택해주세요.");
      return;
    }
    const ok = hook.bulkSetMemberStatus(period.id, [...selectedIds], status);
    if (ok) {
      toast.success(`${selectedIds.size}명의 상태가 변경되었습니다.`);
      setSelectedIds(new Set());
    } else {
      toast.error("일괄 변경에 실패했습니다.");
    }
  };

  const handleAddMember = () => {
    const trimmed = addMemberInput.trim();
    if (!trimmed) return;
    const ok = hook.addMemberToPeriod(period.id, trimmed);
    if (ok) {
      toast.success(`${trimmed} 멤버가 추가되었습니다.`);
      setAddMemberInput("");
    } else {
      toast.error("멤버 추가에 실패했습니다.");
    }
  };

  const handleDeletePeriod = () => {
    const ok = hook.deletePeriod(period.id);
    if (ok)
      toast.success(
        `${formatYearMonth(period.year, period.month)} 기간이 삭제되었습니다.`
      );
    else toast.error(TOAST.DELETE_ERROR);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* 기간 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
          <span className="text-sm font-semibold text-gray-800">
            {formatYearMonth(period.year, period.month)}
          </span>
          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {formatAmount(period.amount)}
          </Badge>
          <span className="text-[10px] text-gray-400">
            기한: {period.dueDate}
          </span>
        </button>

        {/* 납부율 인라인 */}
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${stats.paidRate}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-emerald-600">
            {stats.paidRate}%
          </span>
          <span className="text-[10px] text-gray-400">
            ({stats.paid}/{stats.payable})
          </span>
        </div>

        {/* 총 수입 */}
        <Badge className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 hover:bg-blue-50">
          {formatAmount(stats.totalIncome)}
        </Badge>

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={handleDeletePeriod}
          className="ml-1 text-gray-200 transition-colors hover:text-red-400"
          title="기간 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-gray-100 px-3 pb-3 pt-2">
          {/* 통계 요약 */}
          <div className="flex flex-wrap gap-3 rounded-md bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-[11px] text-gray-500">
                납부{" "}
                <span className="font-semibold text-gray-700">
                  {stats.paid}명
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-400" />
              <span className="text-[11px] text-gray-500">
                미납{" "}
                <span className="font-semibold text-red-600">
                  {stats.unpaid}명
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MinusCircle className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] text-gray-500">
                면제{" "}
                <span className="font-semibold text-gray-700">
                  {stats.exempt}명
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Wallet className="h-3 w-3 text-blue-400" />
              <span className="text-[11px] text-gray-500">
                총 수입{" "}
                <span className="font-semibold text-blue-600">
                  {formatAmount(stats.totalIncome)}
                </span>
              </span>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">납부율</span>
              <span className="text-[11px] font-semibold text-emerald-600">
                {stats.paidRate}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${stats.paidRate}%` }}
              />
            </div>
          </div>

          {/* 미납자 강조 */}
          {unpaidMembers.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <div className="mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span className="text-[11px] font-semibold text-red-600">
                  미납자 {unpaidMembers.length}명
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {unpaidMembers.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600"
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 일괄 변경 */}
          {period.members.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1.5">
              <span className="text-[11px] text-gray-400">
                선택 {selectedIds.size}명 일괄:
              </span>
              {ALL_STATUSES.map((s) => {
                const sm = STATUS_META[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleBulkStatus(s)}
                    disabled={selectedIds.size === 0}
                    className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${sm.badge} border-transparent`}
                  >
                    {sm.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleSelectAll}
                className="ml-auto text-[10px] text-gray-400 underline hover:text-gray-600"
              >
                {selectedIds.size === period.members.length
                  ? "전체 해제"
                  : "전체 선택"}
              </button>
            </div>
          )}

          {/* 멤버 목록 */}
          {period.members.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-400">
              <Users className="h-6 w-6 opacity-30" />
              <p className="text-xs">등록된 멤버가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {period.members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  periodId={period.id}
                  hook={hook}
                  selected={selectedIds.has(member.id)}
                  onToggleSelect={() => handleToggleSelect(member.id)}
                />
              ))}
            </div>
          )}

          {/* 멤버 추가 인라인 */}
          <div className="flex gap-1 pt-1">
            <Input
              value={addMemberInput}
              onChange={(e) => setAddMemberInput(e.target.value.slice(0, 20))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
              placeholder="멤버 이름 입력 후 Enter"
              className="h-7 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleAddMember}
            >
              <UserPlus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function GroupDuesTrackerCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);

  const hook = useGroupDuesTracker(groupId);

  // 전체 통계
  const totalStats = useMemo(() => {
    const allPaid = hook.periods.reduce(
      (sum, p) => sum + p.members.filter((m) => m.status === "paid").length,
      0
    );
    const allPayable = hook.periods.reduce(
      (sum, p) =>
        sum + p.members.filter((m) => m.status !== "exempt").length,
      0
    );
    const totalIncome = hook.periods.reduce((sum, p) => {
      const paid = p.members.filter((m) => m.status === "paid").length;
      return sum + paid * p.amount;
    }, 0);
    return { allPaid, allPayable, totalIncome };
  }, [hook.periods]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-800">
            회비 납부 추적기
          </span>
          {hook.periods.length > 0 && (
            <Badge className="bg-emerald-100 text-[10px] px-1.5 py-0 text-emerald-600 hover:bg-emerald-100">
              {hook.periods.length}개월
            </Badge>
          )}
          {totalStats.totalIncome > 0 && (
            <Badge className="bg-blue-50 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-50">
              {formatAmount(totalStats.totalIncome)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <AddPeriodDialog hook={hook} />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* ── 본문 ── */}
      <CollapsibleContent>
        <div className="space-y-4 rounded-b-lg border border-gray-200 bg-white p-4">

          {/* 최근 납부율 추이 */}
          {hook.recentTrend.length > 0 && (
            <>
              <TrendChart trend={hook.recentTrend} />
              <Separator />
            </>
          )}

          {/* 빈 상태 */}
          {hook.periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
              <BarChart3 className="h-10 w-10 opacity-20" />
              <p className="text-xs">납부 기간이 없습니다.</p>
              <p className="text-[10px]">
                상단 &apos;기간 추가&apos; 버튼으로 월별 회비를 추적해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hook.periods.map((period) => (
                <PeriodCard key={period.id} period={period} hook={hook} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
