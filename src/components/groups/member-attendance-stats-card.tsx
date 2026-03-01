"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Plus,

  Trophy,
  Users,
  TrendingUp,
  Flame,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  XCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemberAttendanceStatsDashboard } from "@/hooks/use-member-attendance-stats-dashboard";
import type {
  MemberAttendStatStatus,
  MemberAttendStatPeriod,
  MemberAttendStatRecord,
  MemberAttendStatSummary,
} from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const STATUS_LABEL: Record<MemberAttendStatStatus, string> = {
  present: "출석",
  late: "지각",
  early_leave: "조퇴",
  absent: "결석",
};

const STATUS_BAR_COLOR: Record<MemberAttendStatStatus, string> = {
  present: "bg-green-500",
  late: "bg-yellow-400",
  early_leave: "bg-orange-400",
  absent: "bg-red-400",
};

const STATUS_BADGE_CLASS: Record<MemberAttendStatStatus, string> = {
  present: "bg-green-100 text-green-700 hover:bg-green-100",
  late: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  early_leave: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  absent: "bg-red-100 text-red-600 hover:bg-red-100",
};

const STATUS_ICON: Record<MemberAttendStatStatus, React.ReactNode> = {
  present: <CheckCircle2 className="h-3 w-3" />,
  late: <Clock className="h-3 w-3" />,
  early_leave: <LogOut className="h-3 w-3" />,
  absent: <XCircle className="h-3 w-3" />,
};

const PERIOD_LABEL: Record<MemberAttendStatPeriod, string> = {
  weekly: "이번 주",
  monthly: "이번 달",
  all: "전체",
};

const ALL_STATUSES: MemberAttendStatStatus[] = [
  "present",
  "late",
  "early_leave",
  "absent",
];

// ─── 헬퍼 ────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRateColor(rate: number): string {
  if (rate >= 90) return "bg-green-500";
  if (rate >= 75) return "bg-green-400";
  if (rate >= 60) return "bg-yellow-400";
  if (rate >= 40) return "bg-orange-400";
  return "bg-red-400";
}

function getRateTextColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-green-500";
  if (rate >= 60) return "text-yellow-600";
  if (rate >= 40) return "text-orange-500";
  return "text-red-500";
}

// ─── 기록 추가 다이얼로그 ─────────────────────────────────────

interface AddRecordDialogProps {
  memberNames?: string[];
  onAdd: (data: {
    memberName: string;
    date: string;
    status: MemberAttendStatStatus;
    notes?: string;
  }) => boolean;
}

function AddRecordDialog({ memberNames, onAdd }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [manualMember, setManualMember] = useState("");
  const [status, setStatus] = useState<MemberAttendStatStatus>("present");
  const [notes, setNotes] = useState("");

  function toggleMember(name: string) {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const targets =
      selectedMembers.length > 0
        ? selectedMembers
        : manualMember.trim()
        ? [manualMember.trim()]
        : [];

    if (targets.length === 0) return;

    let allOk = true;
    for (const memberName of targets) {
      const ok = onAdd({ memberName, date, status, notes: notes || undefined });
      if (!ok) allOk = false;
    }

    if (allOk) {
      setOpen(false);
      setSelectedMembers([]);
      setManualMember("");
      setNotes("");
      setStatus("present");
      setDate(todayStr());
    }
  }

  const hasTarget =
    selectedMembers.length > 0 || manualMember.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          기록 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            출석 기록 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜 *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멤버 (다중 선택 가능)</Label>
            {memberNames && memberNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-gray-50 max-h-32 overflow-y-auto">
                {memberNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleMember(name)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-all ${
                      selectedMembers.includes(name)
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-background text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
            {(selectedMembers.length === 0 ||
              !memberNames ||
              memberNames.length === 0) && (
              <Input
                value={manualMember}
                onChange={(e) => setManualMember(e.target.value)}
                placeholder="멤버 이름 직접 입력"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">출석 상태 *</Label>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium border transition-all ${
                    status === s
                      ? `${STATUS_BADGE_CLASS[s]} border-transparent`
                      : "bg-background text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {STATUS_ICON[s]}
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고 (선택)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모 입력"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={!hasTarget}
            >
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── 월별 바 차트 ─────────────────────────────────────────────

interface MonthlyBarChartProps {
  data: Array<{ label: string; rate: number }>;
}

function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const MAX_H = 56;
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1" style={{ height: `${MAX_H + 16}px` }}>
        {data.map((d, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center justify-end gap-0.5"
            style={{ height: `${MAX_H + 16}px` }}
          >
            <span className="text-[9px] text-gray-500 font-medium leading-none">
              {d.rate > 0 ? `${d.rate}%` : ""}
            </span>
            <div
              className={`w-full rounded-t transition-all ${getRateColor(d.rate)}`}
              style={{
                height: `${Math.max(
                  (d.rate / 100) * MAX_H,
                  d.rate > 0 ? 4 : 0
                )}px`,
                opacity: d.rate === 0 ? 0.15 : 1,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((d, idx) => (
          <div key={idx} className="flex-1 text-center">
            <span className="text-[9px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 멤버별 출석률 바 ─────────────────────────────────────────

interface MemberRateBarProps {
  summary: MemberAttendStatSummary;
  rank: number;
  isTopAttendee: boolean;
  isMostAbsentee: boolean;
}

function MemberRateBar({
  summary: s,
  rank,
  isTopAttendee,
  isMostAbsentee,
}: MemberRateBarProps) {
  const rankColors = ["text-yellow-500", "text-gray-400", "text-orange-400"];
  const rankColor = rank <= 3 ? rankColors[rank - 1] : "text-gray-300";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold w-4 shrink-0 ${rankColor}`}>
          {rank}
        </span>
        <span className="text-[11px] text-gray-700 w-20 truncate shrink-0 font-medium">
          {s.memberName}
        </span>
        {isTopAttendee && (
          <Star className="h-3 w-3 text-yellow-500 shrink-0" />
        )}
        {isMostAbsentee && !isTopAttendee && (
          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
        )}
        {s.currentStreak > 2 && (
          <span className="flex items-center gap-0.5 text-[9px] text-orange-500 shrink-0">
            <Flame className="h-2.5 w-2.5" />
            {s.currentStreak}연속
          </span>
        )}
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getRateColor(s.attendanceRate)}`}
            style={{ width: `${s.attendanceRate}%` }}
          />
        </div>
        <span
          className={`text-[10px] font-bold w-8 text-right shrink-0 ${getRateTextColor(s.attendanceRate)}`}
        >
          {s.attendanceRate}%
        </span>
      </div>

      {/* 상태별 세부 수치 */}
      <div className="flex items-center gap-2 pl-6">
        {ALL_STATUSES.map((st) => {
          const cnt =
            st === "present"
              ? s.presentCount
              : st === "late"
              ? s.lateCount
              : st === "early_leave"
              ? s.earlyLeaveCount
              : s.absentCount;
          if (cnt === 0) return null;
          return (
            <span
              key={st}
              className={`flex items-center gap-0.5 text-[9px] ${
                STATUS_BADGE_CLASS[st].split(" ")[1]
              }`}
            >
              {STATUS_ICON[st]}
              {cnt}
            </span>
          );
        })}
        <span className="text-[9px] text-gray-400 ml-auto">
          총 {s.totalCount}회
        </span>
      </div>
    </div>
  );
}

// ─── 기록 행 ─────────────────────────────────────────────────

interface RecordRowProps {
  record: MemberAttendStatRecord;
  onDelete: (id: string) => boolean;
}

function RecordRow({ record, onDelete }: RecordRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-gray-400 shrink-0">{record.date}</span>
        <span className="text-[11px] font-semibold text-gray-700 truncate">
          {record.memberName}
        </span>
        {record.notes && (
          <span className="text-[10px] text-gray-400 italic truncate max-w-[80px]">
            {record.notes}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${STATUS_BADGE_CLASS[record.status]}`}
        >
          {STATUS_ICON[record.status]}
          {STATUS_LABEL[record.status]}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-gray-300 hover:text-red-400"
          onClick={() => onDelete(record.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 스트릭 하이라이트 ────────────────────────────────────────

interface StreakHighlightProps {
  summaries: MemberAttendStatSummary[];
}

function StreakHighlight({ summaries }: StreakHighlightProps) {
  const topStreaks = useMemo(
    () =>
      [...summaries]
        .filter((s) => s.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 5),
    [summaries]
  );

  if (topStreaks.length === 0) return null;

  return (
    <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
      <div className="flex items-center gap-1 mb-1.5">
        <Flame className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-[11px] font-semibold text-orange-700">
          연속 출석 스트릭
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {topStreaks.map((s) => (
          <div
            key={s.memberName}
            className="flex items-center gap-1 bg-card rounded px-2 py-0.5 border border-orange-100"
          >
            <span className="text-[11px] font-medium text-gray-700">
              {s.memberName}
            </span>
            <span className="text-[10px] font-bold text-orange-500">
              {s.currentStreak}일
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────

interface MemberAttendanceStatsCardProps {
  groupId: string;
  memberNames?: string[];
}

export function MemberAttendanceStatsCard({
  groupId,
  memberNames,
}: MemberAttendanceStatsCardProps) {
  const [open, setOpen] = useState(true);
  const [period, setPeriod] = useState<MemberAttendStatPeriod>("all");
  const [activeTab, setActiveTab] = useState<
    "overview" | "ranking" | "trend" | "records"
  >("overview");

  const {
    records,
    addRecord,
    deleteRecord,
    getMemberSummaries,
    getOverallStats,
    getMonthlyTrend,
  } = useMemberAttendanceStatsDashboard(groupId);

  const summaries = useMemo(
    () => getMemberSummaries(period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, period]
  );
  const overall = useMemo(
    () => getOverallStats(period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, period]
  );
  const monthlyTrend = useMemo(
    () => getMonthlyTrend(6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records]
  );

  // 최근 기록 (최신순 최대 30건)
  const recentRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30),
    [records]
  );

  const tabs: Array<{
    key: typeof activeTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      key: "overview",
      label: "개요",
      icon: <BarChart3 className="h-3 w-3" />,
    },
    {
      key: "ranking",
      label: "랭킹",
      icon: <Trophy className="h-3 w-3" />,
    },
    {
      key: "trend",
      label: "추이",
      icon: <TrendingUp className="h-3 w-3" />,
    },
    {
      key: "records",
      label: "기록",
      icon: <Users className="h-3 w-3" />,
    },
  ];

  const PERIODS: MemberAttendStatPeriod[] = ["weekly", "monthly", "all"];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                멤버 출석 통계
              </span>
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-600 hover:bg-indigo-100">
                {overall.totalRecords}건
              </Badge>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>
          <AddRecordDialog memberNames={memberNames} onAdd={addRecord} />
        </div>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* 기간 필터 */}
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    period === p
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>

            {/* 요약 통계 카드 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-indigo-600">
                  {overall.totalRecords}
                </p>
                <p className="text-[10px] text-indigo-400">전체 기록</p>
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                <p
                  className={`text-base font-bold ${getRateTextColor(overall.overallAttendanceRate)}`}
                >
                  {overall.overallAttendanceRate}%
                </p>
                <p className="text-[10px] text-green-400">출석률</p>
              </div>
              <div className="rounded-lg bg-yellow-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-yellow-600">
                  {overall.perfectAttendanceMembers.length}
                </p>
                <p className="text-[10px] text-yellow-400">개근 멤버</p>
              </div>
            </div>

            {/* 우수/부진 멤버 하이라이트 */}
            {(overall.topAttendee || overall.mostAbsentee) && (
              <div className="flex gap-2 flex-wrap">
                {overall.topAttendee && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-yellow-50 border border-yellow-100 px-2.5 py-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-yellow-500 font-medium">
                        최다 출석
                      </p>
                      <p className="text-[11px] font-semibold text-yellow-700 leading-tight">
                        {overall.topAttendee}
                      </p>
                    </div>
                  </div>
                )}
                {overall.mostAbsentee &&
                  overall.mostAbsentee !== overall.topAttendee && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <div>
                        <p className="text-[9px] text-red-400 font-medium">
                          최다 결석
                        </p>
                        <p className="text-[11px] font-semibold text-red-600 leading-tight">
                          {overall.mostAbsentee}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* 개근 멤버 배지 */}
            {overall.perfectAttendanceMembers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                <span className="text-[11px] font-semibold text-yellow-700">
                  개근:
                </span>
                {overall.perfectAttendanceMembers.map((name) => (
                  <Badge
                    key={name}
                    className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* 탭 */}
            <div className="flex gap-1 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── 개요 탭 ── */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                {records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">출석 기록을 추가해보세요.</p>
                  </div>
                ) : (
                  <>
                    {/* 상태 분포 바 */}
                    {(() => {
                      const filtered = records.filter((r) => {
                        if (period === "all") return true;
                        const now = new Date();
                        const pad = (n: number) =>
                          String(n).padStart(2, "0");
                        const fmt = (d: Date) =>
                          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                        if (period === "monthly") {
                          const first = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            1
                          );
                          return r.date >= fmt(first) && r.date <= fmt(now);
                        }
                        // weekly
                        const monday = new Date(now);
                        monday.setDate(
                          now.getDate() - ((now.getDay() + 6) % 7)
                        );
                        return r.date >= fmt(monday) && r.date <= fmt(now);
                      });

                      const total = filtered.length;
                      if (total === 0) return null;

                      const counts: Record<MemberAttendStatStatus, number> =
                        {
                          present: 0,
                          late: 0,
                          early_leave: 0,
                          absent: 0,
                        };
                      for (const r of filtered) counts[r.status]++;

                      return (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-gray-600">
                            상태 분포
                          </span>
                          {/* 스택 바 */}
                          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                            {ALL_STATUSES.map((s) => {
                              const pct = Math.round(
                                (counts[s] / total) * 100
                              );
                              if (pct === 0) return null;
                              return (
                                <div
                                  key={s}
                                  className={`${STATUS_BAR_COLOR[s]} transition-all`}
                                  style={{ width: `${pct}%` }}
                                  title={`${STATUS_LABEL[s]}: ${counts[s]}건 (${pct}%)`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            {ALL_STATUSES.map((s) => {
                              const cnt = counts[s];
                              const pct =
                                total > 0
                                  ? Math.round((cnt / total) * 100)
                                  : 0;
                              return (
                                <span
                                  key={s}
                                  className="flex items-center gap-1 text-[10px] text-gray-600"
                                >
                                  <span
                                    className={`inline-block h-2 w-2 rounded-sm ${STATUS_BAR_COLOR[s]}`}
                                  />
                                  {STATUS_LABEL[s]} {cnt}건 ({pct}%)
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 스트릭 하이라이트 */}
                    <StreakHighlight summaries={summaries} />
                  </>
                )}
              </div>
            )}

            {/* ── 랭킹 탭 ── */}
            {activeTab === "ranking" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    멤버별 출석률
                  </span>
                </div>
                {summaries.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-4 text-center">
                    출석 기록이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {summaries.map((s, idx) => (
                      <MemberRateBar
                        key={s.memberName}
                        summary={s}
                        rank={idx + 1}
                        isTopAttendee={s.memberName === overall.topAttendee}
                        isMostAbsentee={
                          s.memberName === overall.mostAbsentee
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 추이 탭 ── */}
            {activeTab === "trend" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    최근 6개월 출석률
                  </span>
                </div>
                {records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">출석 기록을 추가해보세요.</p>
                  </div>
                ) : (
                  <>
                    <MonthlyBarChart data={monthlyTrend} />
                    {/* 출석률 범례 */}
                    <div className="flex gap-3 flex-wrap pt-1">
                      {[
                        {
                          label: "90% 이상",
                          cls: "bg-green-500",
                        },
                        { label: "75~89%", cls: "bg-green-400" },
                        { label: "60~74%", cls: "bg-yellow-400" },
                        { label: "40~59%", cls: "bg-orange-400" },
                        { label: "40% 미만", cls: "bg-red-400" },
                      ].map(({ label, cls }) => (
                        <span
                          key={label}
                          className="flex items-center gap-1 text-[9px] text-gray-500"
                        >
                          <span
                            className={`inline-block h-2 w-2 rounded-sm ${cls}`}
                          />
                          {label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── 기록 탭 ── */}
            {activeTab === "records" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    최근 출석 기록
                  </span>
                  {records.length > 30 && (
                    <span className="text-[10px] text-gray-400">
                      (최근 30건)
                    </span>
                  )}
                </div>
                {recentRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Users className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">
                      기록 추가 버튼으로 출석을 기록하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentRecords.map((record) => (
                      <RecordRow
                        key={record.id}
                        record={record}
                        onDelete={deleteRecord}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
