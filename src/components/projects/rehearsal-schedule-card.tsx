"use client";

import { useState } from "react";
import { useRehearsalSchedule } from "@/hooks/use-rehearsal-schedule";
import type { RehearsalType, RehearsalScheduleEntry } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Tag,
  Layers,
  Shirt,
  Wrench,
  Scissors,
  LayoutGrid,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// 유형 헬퍼
// ============================================================

const ALL_TYPES: RehearsalType[] = [
  "full_run",
  "tech_rehearsal",
  "dress_rehearsal",
  "section",
  "blocking",
  "other",
];

function typeLabel(type: RehearsalType): string {
  switch (type) {
    case "full_run":
      return "전체 런";
    case "tech_rehearsal":
      return "기술 리허설";
    case "dress_rehearsal":
      return "드레스 리허설";
    case "section":
      return "섹션 연습";
    case "blocking":
      return "블로킹";
    case "other":
      return "기타";
  }
}

function TypeIcon({
  type,
  className,
}: {
  type: RehearsalType;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (type) {
    case "full_run":
      return <Layers className={cls} />;
    case "tech_rehearsal":
      return <Wrench className={cls} />;
    case "dress_rehearsal":
      return <Shirt className={cls} />;
    case "section":
      return <Scissors className={cls} />;
    case "blocking":
      return <LayoutGrid className={cls} />;
    case "other":
      return <HelpCircle className={cls} />;
  }
}

function typeColor(type: RehearsalType): string {
  switch (type) {
    case "full_run":
      return "text-blue-500";
    case "tech_rehearsal":
      return "text-orange-500";
    case "dress_rehearsal":
      return "text-purple-500";
    case "section":
      return "text-green-500";
    case "blocking":
      return "text-cyan-500";
    case "other":
      return "text-gray-500";
  }
}

function typeBadgeClass(type: RehearsalType): string {
  switch (type) {
    case "full_run":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "tech_rehearsal":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
    case "dress_rehearsal":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "section":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800";
    case "blocking":
      return "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
    case "other":
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700";
  }
}

// ============================================================
// 상태 헬퍼
// ============================================================

function statusBadgeClass(
  status: RehearsalScheduleEntry["status"]
): string {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
  }
}

function statusLabel(status: RehearsalScheduleEntry["status"]): string {
  switch (status) {
    case "scheduled":
      return "예정";
    case "completed":
      return "완료";
    case "cancelled":
      return "취소";
  }
}

// ============================================================
// 날짜/시간 포맷 헬퍼
// ============================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
// 추가 다이얼로그
// ============================================================

interface AddRehearsalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNames: string[];
  onSubmit: (params: {
    title: string;
    type: RehearsalType;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    focusAreas: string[];
    requiredMembers: string[];
    notes: string;
  }) => void;
}

function AddRehearsalDialog({
  open,
  onOpenChange,
  memberNames,
  onSubmit,
}: AddRehearsalDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RehearsalType>("full_run");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("17:00");
  const [location, setLocation] = useState("");
  const [focusAreasStr, setFocusAreasStr] = useState("");
  const [requiredMembers, setRequiredMembers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setTitle("");
    setType("full_run");
    setDate("");
    setStartTime("14:00");
    setEndTime("17:00");
    setLocation("");
    setFocusAreasStr("");
    setRequiredMembers([]);
    setNotes("");
  };

  const toggleMember = (name: string) => {
    setRequiredMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("시작/종료 시간을 입력해주세요.");
      return;
    }
    const focusAreas = focusAreasStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      type,
      date,
      startTime,
      endTime,
      location: location.trim(),
      focusAreas,
      requiredMembers,
      notes: notes.trim(),
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            리허설 일정 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 1차 전체 런스루"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">유형 *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as RehearsalType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {typeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">날짜 *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* 시작/종료 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">시작 시간 *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">종료 시간 *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">장소 (선택)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 연습실 A"
              className="h-7 text-xs"
            />
          </div>

          {/* 포커스 영역 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              포커스 영역 (쉼표로 구분)
            </Label>
            <Input
              value={focusAreasStr}
              onChange={(e) => setFocusAreasStr(e.target.value)}
              placeholder="예: 오프닝, 클라이맥스, 엔딩"
              className="h-7 text-xs"
            />
          </div>

          {/* 필요 멤버 */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                필요 멤버 (선택)
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border rounded-md">
                {memberNames.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={requiredMembers.includes(name)}
                      onCheckedChange={() => toggleMember(name)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="준비사항, 특이사항 등"
              className="text-xs min-h-[48px] resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 리허설 항목 행
// ============================================================

interface RehearsalEntryRowProps {
  entry: RehearsalScheduleEntry;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

function RehearsalEntryRow({
  entry,
  onComplete,
  onCancel,
  onDelete,
}: RehearsalEntryRowProps) {
  const days = daysUntil(entry.date);
  const isScheduled = entry.status === "scheduled";

  return (
    <div className="flex gap-3 py-3 border-b last:border-b-0">
      {/* 타임라인 점 */}
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div
          className={`h-2.5 w-2.5 rounded-full mt-0.5 ${
            entry.status === "completed"
              ? "bg-green-500"
              : entry.status === "cancelled"
              ? "bg-red-400"
              : "bg-blue-500"
          }`}
        />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 날짜 + 시간 + 상태 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatDate(entry.date)}
          </span>
          <ArrowRight className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
          <span className="text-[10px] text-muted-foreground font-mono">
            {entry.startTime} ~ {entry.endTime}
          </span>
          {isScheduled && days >= 0 && (
            <span
              className={`text-[10px] font-medium ${
                days === 0
                  ? "text-red-500"
                  : days <= 3
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            >
              {days === 0 ? "오늘" : `D-${days}`}
            </span>
          )}
          <span
            className={`inline-flex text-[10px] px-1.5 py-0 rounded-full border ${statusBadgeClass(entry.status)}`}
          >
            {statusLabel(entry.status)}
          </span>
        </div>

        {/* 유형 배지 + 제목 */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full border ${typeBadgeClass(entry.type)}`}
          >
            <TypeIcon type={entry.type} className="h-2.5 w-2.5" />
            {typeLabel(entry.type)}
          </span>
          <span className="text-xs font-semibold truncate">{entry.title}</span>
        </div>

        {/* 장소 */}
        {entry.location && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">
              {entry.location}
            </span>
          </div>
        )}

        {/* 포커스 영역 칩 */}
        {entry.focusAreas.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-1">
            <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            {entry.focusAreas.map((area) => (
              <span
                key={area}
                className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {/* 필요 멤버 */}
        {entry.requiredMembers.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-1">
            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground">
              {entry.requiredMembers.join(", ")}
            </span>
          </div>
        )}

        {/* 메모 */}
        {entry.notes && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
            {entry.notes}
          </p>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 mt-1.5">
          {isScheduled && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30"
                onClick={() => onComplete(entry.id)}
              >
                <CheckCircle2 className="h-3 w-3 mr-0.5" />
                완료
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
                onClick={() => onCancel(entry.id)}
              >
                <XCircle className="h-3 w-3 mr-0.5" />
                취소
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(entry.id)}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface RehearsalScheduleCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function RehearsalScheduleCard({
  groupId,
  projectId,
  memberNames,
}: RehearsalScheduleCardProps) {
  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<RehearsalType | "all">("all");

  const {
    entries,
    addRehearsal,
    completeRehearsal,
    cancelRehearsal,
    deleteRehearsal,
    totalRehearsals,
    completedCount,
    upcomingCount,
    nextRehearsal,
  } = useRehearsalSchedule(groupId, projectId);

  // 정렬 및 필터
  const sortedEntries = [...entries]
    .filter((e) => filterType === "all" || e.type === filterType)
    .sort((a, b) => {
      // 예정 먼저, 날짜 오름차순; 완료/취소는 아래
      if (a.status === "scheduled" && b.status !== "scheduled") return -1;
      if (a.status !== "scheduled" && b.status === "scheduled") return 1;
      return a.date.localeCompare(b.date);
    });

  const handleAdd = (params: {
    title: string;
    type: RehearsalType;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    focusAreas: string[];
    requiredMembers: string[];
    notes: string;
  }) => {
    const ok = addRehearsal({
      ...params,
      location: params.location || undefined,
      notes: params.notes || undefined,
    });
    if (ok) {
      toast.success("리허설 일정이 추가되었습니다.");
    } else {
      toast.error("제목을 입력해주세요.");
    }
  };

  const handleComplete = (id: string) => {
    completeRehearsal(id);
    toast.success("리허설을 완료 처리했습니다.");
  };

  const handleCancel = (id: string) => {
    if (confirm("이 리허설을 취소하시겠습니까?")) {
      cancelRehearsal(id);
      toast.success("리허설이 취소되었습니다.");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("이 리허설 일정을 삭제하시겠습니까?")) {
      deleteRehearsal(id);
      toast.success("리허설 일정이 삭제되었습니다.");
    }
  };

  return (
    <>
      <AddRehearsalDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        memberNames={memberNames}
        onSubmit={handleAdd}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 리허설 스케줄</span>
              {totalRehearsals > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {totalRehearsals}개
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 통계 배지 */}
            {totalRehearsals > 0 && (
              <>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-0.5 hidden sm:flex"
                >
                  <Clock className="h-2.5 w-2.5" />
                  예정 {upcomingCount}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-0.5 hidden sm:flex text-green-600 border-green-300 dark:text-green-400 dark:border-green-700"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  완료 {completedCount}
                </Badge>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddDialogOpen(true);
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg bg-card">
            {/* 통계 요약 */}
            {totalRehearsals > 0 && (
              <div className="flex items-center gap-4 px-3 py-2 border-b flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">전체</span>
                  <span className="text-xs font-semibold">{totalRehearsals}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">완료</span>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {completedCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">예정</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {upcomingCount}
                  </span>
                </div>
                {/* 다음 리허설 */}
                {nextRehearsal && (
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-muted-foreground">
                      다음 리허설
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full border ${typeBadgeClass(nextRehearsal.type)}`}
                    >
                      <TypeIcon type={nextRehearsal.type} className="h-2.5 w-2.5" />
                      {nextRehearsal.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(nextRehearsal.date)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 유형 필터 */}
            {totalRehearsals > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 border-b flex-wrap">
                <button
                  onClick={() => setFilterType("all")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterType === "all"
                      ? "bg-foreground text-background border-foreground"
                      : "text-muted-foreground border-border hover:border-foreground/40"
                  }`}
                >
                  전체
                </button>
                {ALL_TYPES.map((t) => {
                  const count = entries.filter((e) => e.type === t).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterType === t
                          ? typeBadgeClass(t)
                          : "text-muted-foreground border-border hover:border-foreground/40"
                      }`}
                    >
                      <span className={filterType === t ? "" : typeColor(t)}>
                        <TypeIcon type={t} className="h-2.5 w-2.5" />
                      </span>
                      {typeLabel(t)}
                      <span className="ml-0.5 opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 빈 상태 */}
            {totalRehearsals === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">등록된 리허설 일정이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;추가&rdquo; 버튼으로 리허설 스케줄을 등록하세요.
                </p>
              </div>
            )}

            {/* 필터 결과 없음 */}
            {totalRehearsals > 0 && sortedEntries.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">해당 유형의 리허설이 없습니다.</p>
              </div>
            )}

            {/* 타임라인 목록 */}
            {sortedEntries.length > 0 && (
              <div className="px-3">
                {sortedEntries.map((entry) => (
                  <RehearsalEntryRow
                    key={entry.id}
                    entry={entry}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
