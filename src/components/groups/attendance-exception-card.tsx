"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAttendanceException } from "@/hooks/use-attendance-exception";
import type { AttendanceExceptionType } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 상수 ────────────────────────────────────────────────────────

const TYPE_META: Record<
  AttendanceExceptionType,
  { label: string; color: string; bg: string }
> = {
  late: {
    label: "지각",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  early_leave: {
    label: "조퇴",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  excused: {
    label: "공결",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  sick: {
    label: "병결",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  personal: {
    label: "개인사정",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  emergency: {
    label: "긴급",
    color: "text-pink-700",
    bg: "bg-pink-100",
  },
};

const ALL_TYPES: AttendanceExceptionType[] = [
  "late",
  "early_leave",
  "excused",
  "sick",
  "personal",
  "emergency",
];

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────────

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ─── 상태 배지 ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-700 hover:bg-green-100 flex items-center gap-0.5">
        <CheckCircle2 className="h-2.5 w-2.5" />
        승인
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-red-100 text-[10px] px-1.5 py-0 text-red-600 hover:bg-red-100 flex items-center gap-0.5">
        <XCircle className="h-2.5 w-2.5" />
        거절
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100 flex items-center gap-0.5">
      <Clock className="h-2.5 w-2.5" />
      대기
    </Badge>
  );
}

// ─── 예외 등록 다이얼로그 ─────────────────────────────────────────

interface AddDialogProps {
  memberNames: string[];
  onClose: () => void;
  onSubmit: (
    memberName: string,
    date: string,
    type: AttendanceExceptionType,
    reason: string,
    duration?: number
  ) => void;
}

function AddExceptionDialog({ memberNames, onClose, onSubmit }: AddDialogProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [memberName, setMemberName] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState<AttendanceExceptionType>("late");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");

  const needsDuration = type === "late" || type === "early_leave";

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error("멤버를 선택해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    if (!reason.trim()) {
      toast.error("사유를 입력해주세요.");
      return;
    }
    const dur = duration ? parseInt(duration, 10) : undefined;
    if (needsDuration && duration && (isNaN(dur!) || dur! <= 0)) {
      toast.error("시간(분)은 1 이상의 숫자를 입력해주세요.");
      return;
    }
    onSubmit(memberName.trim(), date, type, reason.trim(), dur);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-800">
            출결 예외 등록
          </span>
        </div>

        {/* 폼 */}
        <div className="flex flex-col gap-3 px-4 py-4">
          {/* 멤버 선택 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              멤버 <span className="text-red-500">*</span>
            </label>
            {memberNames.length > 0 ? (
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="멤버 이름 입력"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 날짜 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              날짜 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">
              유형 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((t) => {
                const meta = TYPE_META[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      type === t
                        ? `${meta.bg} ${meta.color} border-current font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시간(분) - 지각/조퇴의 경우 */}
          {needsDuration && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">
                {type === "late" ? "지각" : "조퇴"} 시간(분)
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="예: 30"
                  className="h-8 w-24 text-xs"
                />
                <span className="text-xs text-gray-500">분</span>
              </div>
            </div>
          )}

          {/* 사유 */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] font-medium text-gray-600">
              <span>
                사유 <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] text-gray-400">
                {reason.length}/200
              </span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 200))}
              placeholder="출결 예외 사유를 입력하세요"
              className="min-h-[72px] resize-none text-xs"
            />
          </div>
        </div>

        {/* 액션 */}
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={handleSubmit}
          >
            <Plus className="mr-1 h-3 w-3" />
            등록
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 승인자 입력 다이얼로그 ──────────────────────────────────────

function ApproveDialog({
  onClose,
  onApprove,
}: {
  onClose: () => void;
  onApprove: (approverName: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xs rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">승인 처리</span>
        </div>
        <div className="px-4 py-4">
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            승인자 이름 <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="승인자 이름 입력"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-8 flex-1 text-xs bg-green-600 hover:bg-green-700"
            onClick={() => {
              if (!name.trim()) {
                toast.error("승인자 이름을 입력해주세요.");
                return;
              }
              onApprove(name.trim());
            }}
          >
            승인
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────────

interface AttendanceExceptionCardProps {
  groupId: string;
  memberNames: string[];
}

export function AttendanceExceptionCard({
  groupId,
  memberNames,
}: AttendanceExceptionCardProps) {
  const [open, setOpen] = useState(true);
  const [filterType, setFilterType] = useState<AttendanceExceptionType | "all">(
    "all"
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const {
    entries,
    addException,
    approveException,
    rejectException,
    deleteException,
    totalExceptions,
    pendingCount,
    typeDistribution,
    loading,
  } = useAttendanceException(groupId);

  // 이번 달 건수
  const thisMonth = currentMonth();
  const thisMonthCount = entries.filter((e) => e.date.startsWith(thisMonth)).length;

  // 필터링된 목록 (최신순)
  const filtered = (
    filterType === "all"
      ? entries
      : entries.filter((e) => e.type === filterType)
  )
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // 분포 차트 최대값
  const maxCount = Math.max(...Object.values(typeDistribution), 1);

  // ─── 핸들러 ───────────────────────────────────────────────────────

  const handleAdd = (
    memberName: string,
    date: string,
    type: AttendanceExceptionType,
    reason: string,
    duration?: number
  ) => {
    addException(memberName, date, type, reason, duration);
    toast.success("출결 예외가 등록되었습니다.");
    setShowAddDialog(false);
  };

  const handleApprove = (approverName: string) => {
    if (!approvingId) return;
    approveException(approvingId, approverName);
    toast.success("출결 예외가 승인되었습니다.");
    setApprovingId(null);
  };

  const handleReject = (id: string) => {
    rejectException(id);
    toast.success("출결 예외가 거절되었습니다.");
  };

  const handleDelete = (id: string) => {
    deleteException(id);
    toast.success("출결 예외가 삭제되었습니다.");
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">
              연습 출결 예외
            </span>
            {totalExceptions > 0 && (
              <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-600 hover:bg-gray-100">
                전체 {totalExceptions}
              </Badge>
            )}
            {pendingCount > 0 && (
              <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100 flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                대기 {pendingCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              등록
            </Button>
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

        {/* 본문 */}
        <CollapsibleContent>
          <Card className="rounded-t-none border-t-0 shadow-none">
            <CardHeader className="px-4 pt-3 pb-0">
              {/* 통계 요약 */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-gray-50 p-2.5 text-center">
                  <p className="text-[10px] text-gray-500">전체</p>
                  <p className="text-lg font-bold text-gray-800">
                    {totalExceptions}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-2.5 text-center">
                  <p className="text-[10px] text-yellow-600">승인 대기</p>
                  <p className="text-lg font-bold text-yellow-700">
                    {pendingCount}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2.5 text-center">
                  <p className="text-[10px] text-blue-600">이번 달</p>
                  <p className="text-lg font-bold text-blue-700">
                    {thisMonthCount}
                  </p>
                </div>
              </div>

              {/* 유형별 분포 바 */}
              {totalExceptions > 0 && (
                <div className="mb-3 flex flex-col gap-1.5">
                  <p className="text-[11px] font-medium text-gray-500">
                    유형별 분포
                  </p>
                  {ALL_TYPES.map((t) => {
                    const meta = TYPE_META[t];
                    const count = typeDistribution[t];
                    if (count === 0) return null;
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={t} className="flex items-center gap-2">
                        <span
                          className={`w-14 shrink-0 text-[10px] font-medium ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${meta.bg}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-5 text-right text-[10px] text-gray-500">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 유형별 필터 탭 */}
              <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    filterType === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  전체
                </button>
                {ALL_TYPES.map((t) => {
                  const meta = TYPE_META[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        filterType === t
                          ? `bg-white shadow-sm ${meta.color}`
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-3">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-xs text-gray-400">
                  불러오는 중...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-gray-400">
                  <AlertTriangle className="h-8 w-8 opacity-30" />
                  <p className="text-xs">등록된 출결 예외가 없습니다.</p>
                  <p className="text-[10px]">등록 버튼으로 추가하세요.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map((entry) => {
                    const meta = TYPE_META[entry.type];
                    return (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            {/* 상단: 날짜 + 멤버 + 유형 배지 + 상태 */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-gray-500">
                                {entry.date}
                              </span>
                              <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-800">
                                <User className="h-3 w-3 text-gray-400" />
                                {entry.memberName}
                              </span>
                              <Badge
                                className={`text-[10px] px-1.5 py-0 ${meta.bg} ${meta.color} hover:${meta.bg}`}
                              >
                                {meta.label}
                              </Badge>
                              {entry.duration && (
                                <span className="text-[10px] text-gray-500">
                                  {entry.duration}분
                                </span>
                              )}
                              <StatusBadge status={entry.status} />
                            </div>

                            {/* 사유 */}
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                              {entry.reason}
                            </p>

                            {/* 승인자 */}
                            {entry.approvedBy && (
                              <p className="text-[10px] text-gray-400">
                                승인: {entry.approvedBy} ·{" "}
                                {formatYearMonthDay(entry.createdAt)}
                              </p>
                            )}
                            {!entry.approvedBy && (
                              <p className="text-[10px] text-gray-400">
                                등록: {formatYearMonthDay(entry.createdAt)}
                              </p>
                            )}
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {entry.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700"
                                  onClick={() => setApprovingId(entry.id)}
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 border-red-200"
                                  onClick={() => handleReject(entry.id)}
                                >
                                  거절
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* 출결 예외 등록 다이얼로그 */}
      {showAddDialog && (
        <AddExceptionDialog
          memberNames={memberNames}
          onClose={() => setShowAddDialog(false)}
          onSubmit={handleAdd}
        />
      )}

      {/* 승인자 입력 다이얼로그 */}
      {approvingId && (
        <ApproveDialog
          onClose={() => setApprovingId(null)}
          onApprove={handleApprove}
        />
      )}
    </>
  );
}
