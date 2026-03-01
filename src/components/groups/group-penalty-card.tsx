"use client";

import { useState, useId } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  BarChart2,
  ShieldAlert,
  RotateCcw,
  Trophy,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupPenalty } from "@/hooks/use-group-penalty";
import type {
  GroupPenaltyViolationType,
  GroupPenaltyRule,
  GroupPenaltyRecord,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ── 상수 ──────────────────────────────────────────────────────────

const VIOLATION_TYPES: GroupPenaltyViolationType[] = [
  "지각",
  "무단결석",
  "핸드폰사용",
  "비협조",
  "기타",
];

const VIOLATION_META: Record<
  GroupPenaltyViolationType,
  { label: string; badgeCls: string; barColor: string }
> = {
  지각: {
    label: "지각",
    badgeCls: "bg-yellow-100 text-yellow-700 border-yellow-200",
    barColor: "bg-yellow-400",
  },
  무단결석: {
    label: "무단결석",
    badgeCls: "bg-red-100 text-red-700 border-red-200",
    barColor: "bg-red-500",
  },
  핸드폰사용: {
    label: "핸드폰사용",
    badgeCls: "bg-orange-100 text-orange-700 border-orange-200",
    barColor: "bg-orange-400",
  },
  비협조: {
    label: "비협조",
    badgeCls: "bg-purple-100 text-purple-700 border-purple-200",
    barColor: "bg-purple-400",
  },
  기타: {
    label: "기타",
    badgeCls: "bg-gray-100 text-gray-600 border-gray-200",
    barColor: "bg-gray-400",
  },
};

// ── 날짜 포매터 ────────────────────────────────────────────────────

// ── 규칙 추가 다이얼로그 ────────────────────────────────────────────

function AddRuleDialog({
  onAdd,
}: {
  onAdd: (
    violationType: GroupPenaltyViolationType,
    description: string,
    penaltyContent: string,
    demerits: number
  ) => GroupPenaltyRule;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [violationType, setViolationType] =
    useState<GroupPenaltyViolationType>("지각");
  const [description, setDescription] = useState("");
  const [penaltyContent, setPenaltyContent] = useState("");
  const [demerits, setDemerits] = useState("1");

  const reset = () => {
    setViolationType("지각");
    setDescription("");
    setPenaltyContent("");
    setDemerits("1");
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("위반 상세 내용을 입력하세요.");
      return;
    }
    if (!penaltyContent.trim()) {
      toast.error("벌칙 내용을 입력하세요.");
      return;
    }
    const demeritNum = parseInt(demerits, 10);
    if (isNaN(demeritNum) || demeritNum < 1) {
      toast.error("벌점은 1 이상이어야 합니다.");
      return;
    }
    onAdd(violationType, description, penaltyContent, demeritNum);
    toast.success("벌칙 규칙이 추가되었습니다.");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          규칙 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">벌칙 규칙 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor={`${uid}-type`} className="text-xs">
              위반 사항
            </Label>
            <Select
              value={violationType}
              onValueChange={(v) =>
                setViolationType(v as GroupPenaltyViolationType)
              }
            >
              <SelectTrigger id={`${uid}-type`} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIOLATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-desc`} className="text-xs">
              위반 상세 내용 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 연습 시작 5분 이후 도착"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-penalty`} className="text-xs">
              벌칙 내용 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-penalty`}
              value={penaltyContent}
              onChange={(e) => setPenaltyContent(e.target.value)}
              placeholder="예: 청소 당번 1회"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-demerits`} className="text-xs">
              벌점
            </Label>
            <Input
              id={`${uid}-demerits`}
              type="number"
              min={1}
              max={100}
              value={demerits}
              onChange={(e) => setDemerits(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 기록 추가 다이얼로그 ────────────────────────────────────────────

function AddRecordDialog({
  rules,
  onAdd,
}: {
  rules: GroupPenaltyRule[];
  onAdd: (
    memberName: string,
    violationType: GroupPenaltyViolationType,
    date: string,
    demerits: number,
    memo: string
  ) => GroupPenaltyRecord;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [violationType, setViolationType] =
    useState<GroupPenaltyViolationType>("지각");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [demerits, setDemerits] = useState("1");
  const [memo, setMemo] = useState("");

  // 규칙 선택 시 벌점 자동 채우기
  const handleViolationChange = (v: GroupPenaltyViolationType) => {
    setViolationType(v);
    const matched = rules.find((r) => r.violationType === v);
    if (matched) {
      setDemerits(String(matched.demerits));
    }
  };

  const reset = () => {
    setMemberName("");
    setViolationType("지각");
    setDate(new Date().toISOString().slice(0, 10));
    setDemerits("1");
    setMemo("");
  };

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error("멤버명을 입력하세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택하세요.");
      return;
    }
    const demeritNum = parseInt(demerits, 10);
    if (isNaN(demeritNum) || demeritNum < 1) {
      toast.error("벌점은 1 이상이어야 합니다.");
      return;
    }
    onAdd(memberName, violationType, date, demeritNum, memo);
    toast.success("벌칙 기록이 추가되었습니다.");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          기록 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">벌칙 기록 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label htmlFor={`${uid}-member`} className="text-xs">
              멤버명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-member`}
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="멤버 이름 입력"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-vtype`} className="text-xs">
              위반 사항
            </Label>
            <Select
              value={violationType}
              onValueChange={(v) =>
                handleViolationChange(v as GroupPenaltyViolationType)
              }
            >
              <SelectTrigger id={`${uid}-vtype`} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIOLATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-date`} className="text-xs">
              날짜 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-date`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-rec-demerits`} className="text-xs">
              벌점
            </Label>
            <Input
              id={`${uid}-rec-demerits`}
              type="number"
              min={1}
              max={100}
              value={demerits}
              onChange={(e) => setDemerits(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${uid}-memo`} className="text-xs">
              메모
            </Label>
            <Input
              id={`${uid}-memo`}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가 메모 (선택)"
              className="h-8 text-xs"
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 규칙 목록 아이템 ────────────────────────────────────────────────

function RuleItem({
  rule,
  onDelete,
}: {
  rule: GroupPenaltyRule;
  onDelete: (id: string) => boolean;
}) {
  const meta = VIOLATION_META[rule.violationType];

  const handleDelete = () => {
    const ok = onDelete(rule.id);
    if (ok) {
      toast.success("규칙이 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-1.5 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`text-[10px] px-1.5 py-0 border ${meta.badgeCls}`}>
            {meta.label}
          </Badge>
          <Badge className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
            -{rule.demerits}점
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 shrink-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-gray-700">{rule.description}</p>
      <p className="text-[11px] text-gray-500">
        벌칙: {rule.penaltyContent}
      </p>
    </div>
  );
}

// ── 기록 아이템 ────────────────────────────────────────────────────

function RecordItem({
  record,
  onDelete,
}: {
  record: GroupPenaltyRecord;
  onDelete: (id: string) => boolean;
}) {
  const meta = VIOLATION_META[record.violationType];

  const handleDelete = () => {
    const ok = onDelete(record.id);
    if (ok) {
      toast.success("기록이 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800">
              {record.memberName}
            </span>
            <Badge
              className={`text-[10px] px-1.5 py-0 border ${meta.badgeCls}`}
            >
              {meta.label}
            </Badge>
            <Badge className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
              -{record.demerits}점
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>{formatYearMonthDay(record.date)}</span>
            {record.memo && (
              <span className="truncate text-gray-500">{record.memo}</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 shrink-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ── 위반 유형별 바 차트 ────────────────────────────────────────────

function ViolationBarChart({
  violationStats,
  maxCount,
}: {
  violationStats: Array<{ type: GroupPenaltyViolationType; count: number }>;
  maxCount: number;
}) {
  if (violationStats.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        기록된 위반 사항이 없습니다.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {violationStats.map(({ type, count }) => {
        const meta = VIOLATION_META[type];
        const percent = Math.round((count / maxCount) * 100);
        return (
          <div key={type} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600 w-14 shrink-0">
              {meta.label}
            </span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-8 shrink-0 text-right">
              {count}건
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 멤버 랭킹 ─────────────────────────────────────────────────────

function MemberRanking({
  ranking,
}: {
  ranking: Array<{ memberName: string; totalDemerits: number }>;
}) {
  if (ranking.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        아직 벌점 기록이 없습니다.
      </p>
    );
  }

  const maxDemerits = ranking[0]?.totalDemerits ?? 1;

  return (
    <div className="space-y-2">
      {ranking.map(({ memberName, totalDemerits }, idx) => {
        const percent = Math.round((totalDemerits / maxDemerits) * 100);
        const rankColor =
          idx === 0
            ? "text-red-600 font-bold"
            : idx === 1
            ? "text-orange-500 font-semibold"
            : idx === 2
            ? "text-yellow-600 font-semibold"
            : "text-gray-600";
        return (
          <div key={memberName} className="flex items-center gap-2">
            <span
              className={`text-[11px] w-4 shrink-0 text-center ${rankColor}`}
            >
              {idx + 1}
            </span>
            <span className="text-[11px] text-gray-700 w-16 shrink-0 truncate">
              {memberName}
            </span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-red-400 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] text-red-600 font-medium w-8 shrink-0 text-right">
              {totalDemerits}점
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────

export function GroupPenaltyCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"records" | "rules" | "stats">("records");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const {
    data,
    loading,
    addRule,
    deleteRule,
    addRecord,
    deleteRecord,
    toggleMonthlyReset,
    resetNow,
    stats,
  } = useGroupPenalty(groupId);

  const totalDemerits = data.records.reduce((sum, r) => sum + r.demerits, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-xl bg-card shadow-sm">
        {/* 카드 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-800">
                벌칙/페널티 관리
              </span>
              <div className="flex items-center gap-1">
                <Badge className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                  총 {stats.totalRecords}건
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-600 border-orange-200">
                  이번 달 {stats.thisMonthRecords}건
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <Separator />

            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-100">
                <p className="text-lg font-bold text-red-600">{totalDemerits}</p>
                <p className="text-[10px] text-red-400">총 누적 벌점</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2.5 text-center border border-orange-100">
                <p className="text-lg font-bold text-orange-600">
                  {stats.thisMonthRecords}
                </p>
                <p className="text-[10px] text-orange-400">이번 달 기록</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 text-center border border-purple-100">
                <p className="text-lg font-bold text-purple-600">
                  {stats.memberRanking.length}
                </p>
                <p className="text-[10px] text-purple-400">벌점 대상 멤버</p>
              </div>
            </div>

            {/* 월별 초기화 옵션 */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-gray-700">
                  월별 벌점 자동 초기화
                </p>
                <p className="text-[10px] text-gray-400">
                  매월 1일 벌점 기록을 초기화합니다
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={data.monthlyResetEnabled}
                  onCheckedChange={() => {
                    toggleMonthlyReset();
                    toast.success(
                      data.monthlyResetEnabled
                        ? "월별 초기화가 비활성화되었습니다."
                        : "월별 초기화가 활성화되었습니다."
                    );
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setResetConfirmOpen(true)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  즉시 초기화
                </Button>
                <ConfirmDialog
                  open={resetConfirmOpen}
                  onOpenChange={setResetConfirmOpen}
                  title="벌점 기록 초기화"
                  description="모든 벌점 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?"
                  onConfirm={() => {
                    resetNow();
                    toast.success("벌점 기록이 초기화되었습니다.");
                  }}
                  destructive
                />
              </div>
            </div>

            {data.lastResetAt && (
              <p className="text-[10px] text-gray-400">
                마지막 초기화: {formatYearMonthDay(data.lastResetAt)}
              </p>
            )}

            <Separator />

            {/* 탭 */}
            <Tabs
              value={tab}
              onValueChange={(v) =>
                setTab(v as "records" | "rules" | "stats")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <TabsList className="h-7 text-xs">
                  <TabsTrigger value="records" className="text-xs h-6 gap-1">
                    <ClipboardList className="h-3 w-3" />
                    기록 ({stats.totalRecords})
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="text-xs h-6 gap-1">
                    <BookOpen className="h-3 w-3" />
                    규칙 ({data.rules.length})
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs h-6 gap-1">
                    <BarChart2 className="h-3 w-3" />
                    통계
                  </TabsTrigger>
                </TabsList>
                {tab === "records" && (
                  <AddRecordDialog rules={data.rules} onAdd={addRecord} />
                )}
                {tab === "rules" && <AddRuleDialog onAdd={addRule} />}
              </div>

              {/* 기록 탭 */}
              <TabsContent value="records" className="mt-3 space-y-2">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    불러오는 중...
                  </p>
                ) : data.records.length === 0 ? (
                  <div className="text-center py-8 space-y-1">
                    <ClipboardList className="h-8 w-8 text-gray-200 mx-auto" />
                    <p className="text-xs text-gray-400">
                      기록된 벌칙이 없습니다.
                    </p>
                    <p className="text-[10px] text-gray-300">
                      기록 추가 버튼으로 벌칙 기록을 추가하세요.
                    </p>
                  </div>
                ) : (
                  data.records.map((record) => (
                    <RecordItem
                      key={record.id}
                      record={record}
                      onDelete={deleteRecord}
                    />
                  ))
                )}
              </TabsContent>

              {/* 규칙 탭 */}
              <TabsContent value="rules" className="mt-3 space-y-2">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    불러오는 중...
                  </p>
                ) : data.rules.length === 0 ? (
                  <div className="text-center py-8 space-y-1">
                    <BookOpen className="h-8 w-8 text-gray-200 mx-auto" />
                    <p className="text-xs text-gray-400">
                      정의된 벌칙 규칙이 없습니다.
                    </p>
                    <p className="text-[10px] text-gray-300">
                      규칙 추가 버튼으로 벌칙 규칙을 정의하세요.
                    </p>
                  </div>
                ) : (
                  data.rules.map((rule) => (
                    <RuleItem
                      key={rule.id}
                      rule={rule}
                      onDelete={deleteRule}
                    />
                  ))
                )}
              </TabsContent>

              {/* 통계 탭 */}
              <TabsContent value="stats" className="mt-3 space-y-4">
                {/* 위반 유형별 차트 */}
                <div className="bg-gray-50 rounded-lg p-3 border space-y-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
                    <p className="text-xs font-medium text-gray-700">
                      위반 유형별 건수
                    </p>
                  </div>
                  <ViolationBarChart
                    violationStats={stats.violationStats}
                    maxCount={stats.maxViolationCount}
                  />
                </div>

                {/* 멤버별 누적 벌점 랭킹 */}
                <div className="bg-gray-50 rounded-lg p-3 border space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-orange-400" />
                    <p className="text-xs font-medium text-gray-700">
                      멤버별 누적 벌점 랭킹
                    </p>
                  </div>
                  <MemberRanking ranking={stats.memberRanking} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
