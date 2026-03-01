"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Award,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  CalendarIcon,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useContributionPoint,
  CONTRIBUTION_CATEGORY_META,
  type AddContributionPointInput,
} from "@/hooks/use-contribution-point";
import type {
  ContributionPointCategory,
  ContributionPointEntry,
  ContributionPointTransaction,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// 날짜 헬퍼
// ============================================================

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayYMD(): string {
  return dateToYMD(new Date());
}

// ============================================================
// 포인트 배지
// ============================================================

function PointBadge({ points }: { points: number }) {
  const isPositive = points >= 0;
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0 rounded",
        isPositive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      )}
    >
      {isPositive ? "+" : ""}
      {points}pt
    </span>
  );
}

// ============================================================
// 카테고리 배지
// ============================================================

function CategoryBadge({ category }: { category: ContributionPointCategory }) {
  const meta = CONTRIBUTION_CATEGORY_META[category];
  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0 rounded text-white font-medium",
        meta.color
      )}
    >
      {meta.label}
    </span>
  );
}

// ============================================================
// 카테고리별 분포 바 (CSS div)
// ============================================================

function CategoryDistributionBar({
  categoryStats,
  totalPoints,
}: {
  categoryStats: Record<ContributionPointCategory, number>;
  totalPoints: number;
}) {
  const categories = Object.entries(categoryStats) as [
    ContributionPointCategory,
    number
  ][];
  const positiveCategories = categories.filter(([, v]) => v > 0);

  if (totalPoints <= 0 || positiveCategories.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">데이터 없음</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {positiveCategories
        .sort((a, b) => b[1] - a[1])
        .map(([cat, value]) => {
          const meta = CONTRIBUTION_CATEGORY_META[cat];
          const pct = Math.round((value / totalPoints) * 100);
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-12 shrink-0 truncate">
                {meta.label}
              </span>
              <div className="flex-1 bg-muted/40 rounded-sm h-2 overflow-hidden">
                <div
                  className={cn("h-full rounded-sm transition-all", meta.color)}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">
                {value}pt
              </span>
            </div>
          );
        })}
    </div>
  );
}

// ============================================================
// 멤버 랭킹 아이템 (확장 가능)
// ============================================================

function MemberRankItem({
  entry,
  onDeleteTransaction,
}: {
  entry: ContributionPointEntry;
  onDeleteTransaction: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
  const rankColor = rankColors[entry.rank - 1] ?? "text-muted-foreground";

  return (
    <div className="rounded-md border border-border/60 bg-card overflow-hidden">
      {/* 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        {/* 순위 */}
        <span className={cn("text-xs font-bold w-5 text-center shrink-0", rankColor)}>
          {entry.rank <= 3 ? (
            <Trophy className={cn("h-3.5 w-3.5 inline", rankColor)} />
          ) : (
            entry.rank
          )}
        </span>

        {/* 멤버명 */}
        <span className="text-xs font-medium flex-1 truncate">{entry.memberName}</span>

        {/* 총 포인트 */}
        <PointBadge points={entry.totalPoints} />

        {/* 내역 수 */}
        <span className="text-[10px] text-muted-foreground shrink-0">
          {entry.transactions.length}건
        </span>

        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* 확장 영역: 내역 목록 */}
      {expanded && (
        <div className="border-t border-border/40 px-2.5 py-2 space-y-1">
          {entry.transactions.length > 0 ? (
            entry.transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                tx={tx}
                onDelete={onDeleteTransaction}
              />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              내역 없음
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 내역 아이템
// ============================================================

function TransactionItem({
  tx,
  onDelete,
}: {
  tx: ContributionPointTransaction;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-1.5 bg-muted/30 rounded px-2 py-1.5">
      <CategoryBadge category={tx.category} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-foreground leading-relaxed truncate">
          {tx.reason}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatYearMonthDay(tx.date)} · {tx.grantedBy}
        </p>
        {tx.note && (
          <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
            {tx.note}
          </p>
        )}
      </div>
      <PointBadge points={tx.points} />
      <button
        type="button"
        onClick={() => onDelete(tx.id)}
        aria-label="내역 삭제"
        className="shrink-0 mt-0.5"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
      </button>
    </div>
  );
}

// ============================================================
// 포인트 부여 다이얼로그
// ============================================================

const POINT_PRESETS = [-10, -5, 5, 10, 15, 20, 30, 50];

function AddPointDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (input: AddContributionPointInput) => Promise<boolean>;
}) {
  const [memberName, setMemberName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [category, setCategory] = useState<ContributionPointCategory>("attendance");
  const [points, setPoints] = useState<number>(10);
  const [customPoints, setCustomPoints] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [grantedBy, setGrantedBy] = useState("");
  const [note, setNote] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const reset = () => {
    setMemberName("");
    setMemberId("");
    setCategory("attendance");
    setPoints(10);
    setCustomPoints("");
    setIsCustom(false);
    setReason("");
    setDate(new Date());
    setGrantedBy("");
    setNote("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const finalPoints = isCustom ? Number(customPoints) : points;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedMemberId = memberId.trim() || `member-${memberName.trim()}`;

    await execute(async () => {
      const ok = await onAdd({
        memberId: resolvedMemberId,
        memberName: memberName.trim(),
        category,
        points: finalPoints,
        reason: reason.trim(),
        date: date ? dateToYMD(date) : todayYMD(),
        grantedBy: grantedBy.trim(),
        note: note.trim() || undefined,
      });
      if (ok) {
        reset();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Award className="h-4 w-4 text-emerald-500" />
            포인트 부여 / 차감
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 멤버 이름 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              멤버 이름 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="예) 홍길동"
              value={memberName}
              onChange={(e) => {
                setMemberName(e.target.value);
                setMemberId("");
              }}
              className="h-8 text-xs"
              maxLength={30}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ContributionPointCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CONTRIBUTION_CATEGORY_META) as [ContributionPointCategory, { label: string; color: string }][]).map(
                  ([key, meta]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {meta.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 포인트 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              포인트 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {POINT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPoints(p);
                    setIsCustom(false);
                  }}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded border transition-colors",
                    !isCustom && points === p
                      ? p > 0
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-red-500 text-white border-red-500"
                      : "border-border hover:bg-muted/60"
                  )}
                >
                  {p > 0 ? `+${p}` : p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded border transition-colors",
                  isCustom
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-border hover:bg-muted/60"
                )}
              >
                직접입력
              </button>
            </div>
            {isCustom && (
              <Input
                type="number"
                placeholder="예) 25 또는 -5"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            )}
            {!isCustom && (
              <p className="text-[10px] text-muted-foreground">
                선택된 포인트:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    points >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {points > 0 ? `+${points}` : points}pt
                </span>
              </p>
            )}
          </div>

          {/* 사유 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              사유 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="예) 오늘 연습 시범 시연"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              날짜 <span className="text-red-500">*</span>
            </label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start text-xs font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0" />
                  {date ? dateToYMD(date) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 부여자 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              부여자 <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="예) 운영진"
              value={grantedBy}
              onChange={(e) => setGrantedBy(e.target.value)}
              className="h-8 text-xs"
              maxLength={30}
            />
          </div>

          {/* 메모 (선택) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              메모{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="추가 메모를 입력하세요"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs resize-none min-h-[56px]"
              maxLength={150}
            />
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={submitting}
            >
              {submitting ? "처리 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

type ContributionPointCardProps = {
  groupId: string;
};

export function ContributionPointCard({ groupId }: ContributionPointCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { entries, addTransaction, deleteTransaction, summary } =
    useContributionPoint(groupId);

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 카드 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((p) => !p)}
          aria-expanded={!collapsed}
        >
          <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-xs font-medium flex-1">연습 기여도 포인트</span>

          {/* 멤버 수 배지 */}
          {summary.memberCount > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground font-medium shrink-0">
              {summary.memberCount}명
            </span>
          )}

          {/* 총 포인트 배지 */}
          {summary.totalGroupPoints > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-emerald-100 text-emerald-700 font-semibold shrink-0">
              합계 {summary.totalGroupPoints}pt
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2">
            {/* 1위 하이라이트 */}
            {summary.topMember && (
              <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md px-2.5 py-1.5">
                <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 flex-1 truncate">
                  {summary.topMember.memberName}
                </span>
                <PointBadge points={summary.topMember.totalPoints} />
                <span className="text-[10px] text-muted-foreground shrink-0">1위</span>
              </div>
            )}

            {/* 카테고리 분포 토글 */}
            {summary.totalGroupPoints > 0 && (
              <div className="rounded-md border border-border/60 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setShowStats((p) => !p)}
                  aria-expanded={showStats}
                >
                  <TrendingUp className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="text-[10px] font-medium flex-1">카테고리별 분포</span>
                  {showStats ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </button>
                {showStats && (
                  <div className="border-t border-border/40 px-2.5 py-2">
                    <CategoryDistributionBar
                      categoryStats={summary.categoryStats}
                      totalPoints={summary.totalGroupPoints}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 멤버 랭킹 리스트 */}
            {entries.length > 0 ? (
              <div className="space-y-1">
                {entries.map((entry) => (
                  <MemberRankItem
                    key={entry.memberId}
                    entry={entry}
                    onDeleteTransaction={deleteTransaction}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <Award className="h-5 w-5" />
                <p className="text-xs">아직 포인트 내역이 없습니다</p>
                <p className="text-[10px]">멤버에게 기여도 포인트를 부여해보세요</p>
              </div>
            )}

            {/* 구분선 */}
            {entries.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 포인트 부여 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              포인트 부여 / 차감
            </Button>
          </div>
        )}
      </div>

      {/* 포인트 부여 다이얼로그 */}
      <AddPointDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addTransaction}
      />
    </>
  );
}
