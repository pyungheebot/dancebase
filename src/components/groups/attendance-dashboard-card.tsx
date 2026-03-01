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
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAttendanceDashboard } from "@/hooks/use-attendance-dashboard";
import type { AttendanceDashStatus, AttendanceDashRecord } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const STATUS_LABEL: Record<AttendanceDashStatus, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "사유",
};

const STATUS_COLOR: Record<AttendanceDashStatus, string> = {
  present: "bg-green-500",
  late: "bg-yellow-400",
  absent: "bg-red-400",
  excused: "bg-blue-400",
};

const STATUS_BADGE_CLASS: Record<AttendanceDashStatus, string> = {
  present: "bg-green-100 text-green-700 hover:bg-green-100",
  late: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  absent: "bg-red-100 text-red-600 hover:bg-red-100",
  excused: "bg-blue-100 text-blue-700 hover:bg-blue-100",
};

const STATUS_TEXT_COLOR: Record<AttendanceDashStatus, string> = {
  present: "text-green-600",
  late: "text-yellow-600",
  absent: "text-red-500",
  excused: "text-blue-600",
};

const STATUS_ICON: Record<AttendanceDashStatus, React.ReactNode> = {
  present: <CheckCircle2 className="h-3 w-3" />,
  late: <Clock className="h-3 w-3" />,
  absent: <XCircle className="h-3 w-3" />,
  excused: <AlertCircle className="h-3 w-3" />,
};

// ─── 헬퍼 ────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ─── 출석 기록 추가 다이얼로그 ───────────────────────────────

interface AddRecordDialogProps {
  memberNames?: string[];
  onAdd: (data: {
    memberName: string;
    date: string;
    status: AttendanceDashStatus;
    notes?: string;
  }) => boolean;
}

function AddRecordDialog({ memberNames, onAdd }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [manualMember, setManualMember] = useState("");
  const [status, setStatus] = useState<AttendanceDashStatus>("present");
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

    if (targets.length === 0) {
      return;
    }

    let allOk = true;
    for (const memberName of targets) {
      const ok = onAdd({
        memberName,
        date,
        status,
        notes: notes || undefined,
      });
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
          <DialogTitle className="text-sm font-semibold">출석 기록 추가</DialogTitle>
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
            <Label className="text-xs">멤버 선택 (다중 선택 가능)</Label>
            {memberNames && memberNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-gray-50 max-h-32 overflow-y-auto">
                {memberNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleMember(name)}
                    className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-all ${
                      selectedMembers.includes(name)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-background text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                value={manualMember}
                onChange={(e) => setManualMember(e.target.value)}
                placeholder="멤버 이름 입력"
                className="h-8 text-xs"
              />
            )}
            {memberNames && memberNames.length > 0 && selectedMembers.length === 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">또는 직접 입력</Label>
                <Input
                  value={manualMember}
                  onChange={(e) => setManualMember(e.target.value)}
                  placeholder="멤버 이름 입력"
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* 상태 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">출석 상태 *</Label>
            <div className="flex gap-1.5 flex-wrap">
              {(["present", "late", "absent", "excused"] as AttendanceDashStatus[]).map(
                (s) => (
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
                )
              )}
            </div>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모 입력"
              className="text-xs min-h-[50px] resize-none"
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
              disabled={
                selectedMembers.length === 0 && !manualMember.trim()
              }
            >
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── 월별 출석률 바 차트 ──────────────────────────────────────

interface MonthlyBarChartProps {
  data: Array<{ label: string; rate: number }>;
}

function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const maxRate = 100;

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-20">
        {data.map((d, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-gray-500 font-medium">
              {d.rate > 0 ? `${d.rate}%` : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: "52px" }}>
              <div
                className={`w-full rounded-t transition-all ${
                  d.rate >= 80
                    ? "bg-green-400"
                    : d.rate >= 60
                    ? "bg-yellow-400"
                    : d.rate > 0
                    ? "bg-red-300"
                    : "bg-gray-100"
                }`}
                style={{
                  height: `${Math.max((d.rate / maxRate) * 52, d.rate > 0 ? 4 : 0)}px`,
                }}
              />
            </div>
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

// ─── 멤버별 출석률 랭킹 ──────────────────────────────────────

interface MemberRankingProps {
  summaries: ReturnType<
    ReturnType<typeof useAttendanceDashboard>["getMemberSummaries"]
  >;
}

function MemberRanking({ summaries }: MemberRankingProps) {
  if (summaries.length === 0) {
    return (
      <p className="text-[11px] text-gray-400 py-2">
        아직 출석 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {summaries.map((s, idx) => (
        <div key={s.memberName} className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold w-4 shrink-0 ${
              idx === 0
                ? "text-yellow-500"
                : idx === 1
                ? "text-gray-400"
                : idx === 2
                ? "text-orange-400"
                : "text-gray-300"
            }`}
          >
            {idx + 1}
          </span>
          <span className="text-[11px] text-gray-700 w-16 truncate shrink-0 font-medium">
            {s.memberName}
          </span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                s.attendanceRate >= 80
                  ? "bg-green-400"
                  : s.attendanceRate >= 60
                  ? "bg-yellow-400"
                  : "bg-red-300"
              }`}
              style={{ width: `${s.attendanceRate}%` }}
            />
          </div>
          <span
            className={`text-[10px] font-bold w-8 text-right shrink-0 ${
              s.attendanceRate >= 80
                ? "text-green-600"
                : s.attendanceRate >= 60
                ? "text-yellow-600"
                : "text-red-500"
            }`}
          >
            {s.attendanceRate}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 출석 히트맵 (월별 달력) ──────────────────────────────────

interface AttendanceHeatmapProps {
  records: AttendanceDashRecord[];
  year: number;
  month: number;
}

function AttendanceHeatmap({ records, year, month }: AttendanceHeatmapProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // 날짜별 상태 집계 (여러 명 기록이 있으면 우선순위: absent > late > excused > present)
  const dayStatusMap = useMemo(() => {
    const map = new Map<string, AttendanceDashStatus[]>();
    for (const r of records) {
      const existing = map.get(r.date) ?? [];
      existing.push(r.status);
      map.set(r.date, existing);
    }
    return map;
  }, [records]);

  function getDayColor(dateStr: string): string {
    const statuses = dayStatusMap.get(dateStr);
    if (!statuses || statuses.length === 0)
      return "bg-gray-50 text-gray-300";
    if (statuses.includes("absent")) return "bg-red-200 text-red-700";
    if (statuses.includes("late")) return "bg-yellow-200 text-yellow-700";
    if (statuses.includes("excused")) return "bg-blue-200 text-blue-700";
    return "bg-green-200 text-green-700";
  }

  const weeks = ["일", "월", "화", "수", "목", "금", "토"];
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  return (
    <div className="space-y-1">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.map((w) => (
          <div key={w} className="text-center text-[9px] text-gray-400 font-medium py-0.5">
            {w}
          </div>
        ))}
      </div>
      {/* 날짜 셀 */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const colorClass = getDayColor(dateStr);
          const hasRecord = dayStatusMap.has(dateStr);

          return (
            <div
              key={dateStr}
              className={`aspect-square flex items-center justify-center rounded text-[9px] font-medium ${colorClass} ${
                hasRecord ? "ring-1 ring-inset ring-white/50" : ""
              }`}
              title={
                hasRecord
                  ? dayStatusMap
                      .get(dateStr)!
                      .map((s) => STATUS_LABEL[s])
                      .join(", ")
                  : ""
              }
            >
              {day}
            </div>
          );
        })}
      </div>
      {/* 범례 */}
      <div className="flex items-center gap-3 pt-1">
        {(["present", "late", "absent", "excused"] as AttendanceDashStatus[]).map(
          (s) => (
            <span key={s} className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${STATUS_COLOR[s]} opacity-70`} />
              {STATUS_LABEL[s]}
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ─── 기록 목록 행 ────────────────────────────────────────────

interface RecordRowProps {
  record: AttendanceDashRecord;
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

// ─── 메인 카드 ───────────────────────────────────────────────

interface AttendanceDashboardCardProps {
  groupId: string;
  memberNames?: string[];
}

export function AttendanceDashboardCard({
  groupId,
  memberNames,
}: AttendanceDashboardCardProps) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "trend" | "ranking" | "heatmap" | "records"
  >("trend");

  const now = new Date();
  const [heatmapYear, setHeatmapYear] = useState(now.getFullYear());
  const [heatmapMonth, setHeatmapMonth] = useState(now.getMonth() + 1);

  const {
    records,
    addRecord,
    deleteRecord,
    getMemberSummaries,
    getMonthlyTrend,
    getByMonth,
    stats,
  } = useAttendanceDashboard(groupId);

  const monthlyTrend = getMonthlyTrend(6);
  const summaries = getMemberSummaries();
  const heatmapRecords = getByMonth(heatmapYear, heatmapMonth);

  // 최근 기록 (최신순 20개)
  const recentRecords = [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  function prevMonth() {
    if (heatmapMonth === 1) {
      setHeatmapYear((y) => y - 1);
      setHeatmapMonth(12);
    } else {
      setHeatmapMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (heatmapMonth === 12) {
      setHeatmapYear((y) => y + 1);
      setHeatmapMonth(1);
    } else {
      setHeatmapMonth((m) => m + 1);
    }
  }

  const tabs: Array<{ key: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { key: "trend", label: "추이", icon: <TrendingUp className="h-3 w-3" /> },
    { key: "ranking", label: "랭킹", icon: <Trophy className="h-3 w-3" /> },
    { key: "heatmap", label: "히트맵", icon: <Calendar className="h-3 w-3" /> },
    { key: "records", label: "기록", icon: <Users className="h-3 w-3" /> },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
              <BarChart3 className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-gray-800">
                출석 통계 대시보드
              </span>
              <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-600 hover:bg-violet-100">
                {stats.totalRecords}건
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
            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-violet-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-violet-600">
                  {stats.totalRecords}
                </p>
                <p className="text-[10px] text-violet-400">전체 기록</p>
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-green-600">
                  {stats.overallAttendanceRate}%
                </p>
                <p className="text-[10px] text-green-400">전체 출석률</p>
              </div>
              <div className="rounded-lg bg-yellow-50 px-3 py-2 text-center">
                <p className="text-base font-bold text-yellow-600">
                  {stats.perfectAttendanceMembers.length}
                </p>
                <p className="text-[10px] text-yellow-400">개근 멤버</p>
              </div>
            </div>

            {/* 개근 멤버 배지 */}
            {stats.perfectAttendanceMembers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                <span className="text-[11px] font-semibold text-yellow-700">
                  개근 멤버:
                </span>
                {stats.perfectAttendanceMembers.map((name) => (
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
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 내용 */}
            {activeTab === "trend" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    최근 6개월 출석률 추이
                  </span>
                </div>
                {stats.totalRecords === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">출석 기록을 추가해보세요.</p>
                  </div>
                ) : (
                  <MonthlyBarChart data={monthlyTrend} />
                )}
              </div>
            )}

            {activeTab === "ranking" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    멤버별 출석률 랭킹
                  </span>
                </div>
                <MemberRanking summaries={summaries} />
              </div>
            )}

            {activeTab === "heatmap" && (
              <div className="space-y-2">
                {/* 월 네비게이션 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-600">
                      출석 히트맵
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400"
                      onClick={prevMonth}
                    >
                      <ChevronDown className="h-3 w-3 rotate-90" />
                    </Button>
                    <span className="text-[11px] font-medium text-gray-700 w-16 text-center">
                      {heatmapYear}년 {heatmapMonth}월
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400"
                      onClick={nextMonth}
                    >
                      <ChevronDown className="h-3 w-3 -rotate-90" />
                    </Button>
                  </div>
                </div>
                <AttendanceHeatmap
                  records={heatmapRecords}
                  year={heatmapYear}
                  month={heatmapMonth}
                />
                {/* 해당 월 상태별 현황 */}
                {heatmapRecords.length > 0 && (
                  <div className="flex items-center gap-3 pt-1 border-t">
                    {(["present", "late", "absent", "excused"] as AttendanceDashStatus[]).map(
                      (s) => {
                        const count = heatmapRecords.filter(
                          (r) => r.status === s
                        ).length;
                        if (count === 0) return null;
                        return (
                          <span
                            key={s}
                            className={`flex items-center gap-0.5 text-[10px] font-medium ${STATUS_TEXT_COLOR[s]}`}
                          >
                            {STATUS_ICON[s]}
                            {STATUS_LABEL[s]} {count}
                          </span>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "records" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-600">
                    최근 출석 기록
                  </span>
                  {records.length > 20 && (
                    <span className="text-[10px] text-gray-400">
                      (최근 20건)
                    </span>
                  )}
                </div>
                {recentRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Users className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">기록 추가 버튼으로 출석을 기록하세요.</p>
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
