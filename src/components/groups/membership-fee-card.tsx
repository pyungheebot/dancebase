"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Circle,
  MinusCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useMembershipFee,
  formatMonth,
  getCurrentMonth,
} from "@/hooks/use-membership-fee";
import type { MembershipFeePayment } from "@/types";

// ── 상태별 배지 설정 ─────────────────────────────────────────
const STATUS_CONFIG: Record<
  MembershipFeePayment["status"],
  { label: string; className: string; icon: React.ElementType }
> = {
  paid: {
    label: "납부",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  unpaid: {
    label: "미납",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: Circle,
  },
  partial: {
    label: "일부",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: MinusCircle,
  },
  exempt: {
    label: "면제",
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: MinusCircle,
  },
};

// ── 통화 포맷 ────────────────────────────────────────────────
function formatCurrency(amount: number, currency: string): string {
  if (currency === "KRW") {
    return `${amount.toLocaleString("ko-KR")}원`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// ── 납부일 포맷 ──────────────────────────────────────────────
function formatPaidAt(paidAt: string | null): string {
  if (!paidAt) return "-";
  const d = new Date(paidAt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

// ── 월 회비 설정 다이얼로그 (인라인) ────────────────────────
function FeeSettingRow({
  monthlyFee,
  currency,
  onSave,
}: {
  monthlyFee: number;
  currency: string;
  onSave: (fee: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(monthlyFee));

  function handleSave() {
    const parsed = Number(inputVal.replace(/,/g, ""));
    if (isNaN(parsed) || parsed < 0) {
      toast.error("올바른 금액을 입력해주세요.");
      return;
    }
    onSave(parsed);
    setEditing(false);
    toast.success("월 회비 금액이 저장됐습니다.");
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">월 회비</span>
        <span className="text-xs font-medium">
          {formatCurrency(monthlyFee, currency)}
        </span>
        <button
          onClick={() => {
            setInputVal(String(monthlyFee));
            setEditing(true);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="월 회비 수정"
        >
          <Settings className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">월 회비</span>
      <input
        type="number"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        className="w-24 h-6 text-xs border border-input rounded px-1.5 bg-background"
        placeholder="금액"
        min={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
      />
      <Button
        size="sm"
        className="h-6 text-[10px] px-2"
        onClick={handleSave}
      >
        저장
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 text-[10px] px-2"
        onClick={() => setEditing(false)}
      >
        취소
      </Button>
    </div>
  );
}

// ── 진행률 바 ────────────────────────────────────────────────
function ProgressBar({ rate }: { rate: number }) {
  const clamped = Math.min(100, Math.max(0, rate));
  const color =
    clamped >= 80
      ? "bg-green-500"
      : clamped >= 50
      ? "bg-yellow-500"
      : "bg-red-400";

  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
interface MembershipFeeCardProps {
  groupId: string;
  memberNames: string[];
}

export function MembershipFeeCard({
  groupId,
  memberNames,
}: MembershipFeeCardProps) {
  const {
    store,
    loading,
    togglePaymentStatus,
    setMonthlyFee,
    generateMonthPayments,
    getMonthPayments,
    getMonthStats,
    getAvailableMonths,
  } = useMembershipFee(groupId);

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const availableMonths = getAvailableMonths();
  const monthPayments = getMonthPayments(selectedMonth);
  const stats = getMonthStats(selectedMonth);

  function handleGenerate() {
    if (memberNames.length === 0) {
      toast.error("멤버 목록이 없습니다.");
      return;
    }
    generateMonthPayments(selectedMonth, memberNames);
    toast.success(
      `${formatMonth(selectedMonth)} 납부 항목이 생성됐습니다.`
    );
  }

  function handleToggle(id: string) {
    togglePaymentStatus(id);
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">그룹 회비 관리</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">그룹 회비 관리</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 월 선택 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown((v) => !v)}
              className="flex items-center gap-1 text-xs border border-input rounded px-2 h-7 bg-background hover:bg-muted transition-colors"
            >
              {formatMonth(selectedMonth)}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showMonthDropdown && (
              <div className="absolute right-0 top-8 z-50 w-36 max-h-52 overflow-y-auto rounded-md border bg-popover shadow-md">
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                      m === selectedMonth
                        ? "bg-primary/10 text-primary font-medium"
                        : ""
                    }`}
                  >
                    {formatMonth(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* 일괄 생성 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleGenerate}
            title="선택한 월에 대해 멤버 전원 납부 항목 생성"
          >
            <RefreshCw className="h-3 w-3" />
            일괄 생성
          </Button>
        </div>
      </div>

      {/* 월 회비 설정 & 통계 */}
      <div className="px-4 pb-3 space-y-2">
        <FeeSettingRow
          monthlyFee={store.monthlyFee}
          currency={store.currency}
          onSave={setMonthlyFee}
        />

        {monthPayments.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                납부율 {stats.collectionRate}% ({stats.paidCount}/
                {stats.total}명)
              </span>
              <span>
                {formatCurrency(stats.totalCollected, store.currency)} 수금
              </span>
            </div>
            <ProgressBar rate={stats.collectionRate} />
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="h-px bg-border mx-4" />

      {/* 납부 현황 테이블 */}
      <div className="px-4 pb-4 pt-3">
        {monthPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              {formatMonth(selectedMonth)} 납부 항목이 없습니다.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              &quot;일괄 생성&quot; 버튼으로 멤버 전원의 납부 항목을 만드세요.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-2 py-1 text-[10px] text-muted-foreground font-medium">
              <span>멤버</span>
              <span className="text-center w-14">납부일</span>
              <span className="text-center w-14">상태</span>
            </div>

            {/* 납부 항목 행 */}
            {monthPayments.map((payment) => {
              const config = STATUS_CONFIG[payment.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={payment.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  {/* 멤버명 */}
                  <span className="text-xs font-medium truncate">
                    {payment.memberName}
                  </span>

                  {/* 납부일 */}
                  <span className="text-[10px] text-muted-foreground w-14 text-center tabular-nums">
                    {formatPaidAt(payment.paidAt)}
                  </span>

                  {/* 상태 배지 (클릭으로 토글) */}
                  <button
                    onClick={() => handleToggle(payment.id)}
                    className="w-14 flex justify-center"
                    title="클릭하여 상태 변경 (미납 → 납부 → 면제)"
                  >
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${config.className}`}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      {config.label}
                    </Badge>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 미납 멤버 요약 (미납이 있을 때만) */}
        {stats.unpaidMembers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1">
              미납 멤버 ({stats.unpaidCount}명)
            </p>
            <div className="flex flex-wrap gap-1">
              {stats.unpaidMembers.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
