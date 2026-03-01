"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Star,
  TrendingUp,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGroupMentor } from "@/hooks/use-group-mentor";
import type {
  GroupMentorMatch,
  GroupMentorField,
  GroupMentorStatus,
  GroupMentorSession,
} from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const FIELDS: GroupMentorField[] = ["기술", "안무", "체력", "무대매너"];

const FIELD_COLOR: Record<GroupMentorField, string> = {
  기술: "bg-blue-100 text-blue-700",
  안무: "bg-purple-100 text-purple-700",
  체력: "bg-orange-100 text-orange-700",
  무대매너: "bg-pink-100 text-pink-700",
};

const STATUS_OPTIONS: GroupMentorStatus[] = ["진행중", "완료", "중단"];

const STATUS_COLOR: Record<GroupMentorStatus, string> = {
  진행중: "bg-green-100 text-green-700",
  완료: "bg-gray-100 text-gray-600",
  중단: "bg-red-100 text-red-600",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 별점 컴포넌트
// ============================================================

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readOnly && onChange?.(n)}
          className={cn("p-0.5", readOnly ? "cursor-default" : "cursor-pointer")}
          disabled={readOnly}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              n <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// CSS div 기반 라인 차트 (멘티 성장 트래커)
// ============================================================

function GrowthLineChart({ sessions }: { sessions: GroupMentorSession[] }) {
  const sorted = sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10); // 최근 10개 세션

  if (sorted.length < 2) {
    return (
      <div className="flex items-center justify-center h-16 text-[10px] text-muted-foreground">
        세션이 2개 이상 필요합니다.
      </div>
    );
  }

  const chartH = 48;
  const chartW = 100;
  const minRating = 1;
  const maxRating = 5;
  const range = maxRating - minRating;

  // 각 점의 x, y 좌표 (퍼센트)
  const points = sorted.map((s, i) => ({
    x: (i / (sorted.length - 1)) * chartW,
    y: chartH - ((s.rating - minRating) / range) * chartH,
    rating: s.rating,
    date: s.date,
  }));

  // SVG polyline 포인트 문자열
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span>최근 세션 평가 추이</span>
      </div>
      <div className="relative w-full" style={{ height: chartH + 8 }}>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: chartH }}
        >
          {/* 배경 기준선 */}
          {[1, 2, 3, 4, 5].map((v) => {
            const y = chartH - ((v - minRating) / range) * chartH;
            return (
              <line
                key={v}
                x1="0"
                y1={y}
                x2={chartW}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth="0.5"
              />
            );
          })}
          {/* 영역 채우기 */}
          <polygon
            points={[
              ...points.map((p) => `${p.x},${p.y}`),
              `${points[points.length - 1].x},${chartH}`,
              `${points[0].x},${chartH}`,
            ].join(" ")}
            fill="rgba(99,102,241,0.08)"
          />
          {/* 라인 */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* 포인트 */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              fill="#6366f1"
            />
          ))}
        </svg>
        {/* x축 날짜 레이블 (첫/마지막) */}
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>{sorted[0].date.slice(5)}</span>
          <span>{sorted[sorted.length - 1].date.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 세션 추가 다이얼로그
// ============================================================

type AddSessionDialogProps = {
  open: boolean;
  matchId: string | null;
  onClose: () => void;
  onSave: (
    matchId: string,
    session: Omit<GroupMentorSession, "id" | "createdAt">
  ) => void;
};

function AddSessionDialog({
  open,
  matchId,
  onClose,
  onSave,
}: AddSessionDialogProps) {
  const [date, setDate] = useState(today());
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);

  function reset() {
    setDate(today());
    setContent("");
    setRating(0);
  }

  function handleSave() {
    if (!matchId) return;
    if (!content.trim()) {
      toast.error("세션 내용을 입력해주세요.");
      return;
    }
    if (rating === 0) {
      toast.error("평가 점수를 선택해주세요.");
      return;
    }
    onSave(matchId, { date, content: content.trim(), rating });
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">세션 기록 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">내용 *</Label>
            <Textarea
              placeholder="세션 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[72px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">평가 (1~5) *</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              reset();
              onClose();
            }}
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
// 매칭 생성/수정 다이얼로그
// ============================================================

type MatchFormData = {
  mentorName: string;
  menteeName: string;
  field: GroupMentorField;
  startDate: string;
  endDate: string;
  status: GroupMentorStatus;
};

type MatchDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<MatchFormData>;
  onClose: () => void;
  onSave: (data: MatchFormData) => void;
};

function MatchDialog({ open, mode, initial, onClose, onSave }: MatchDialogProps) {
  const [mentorName, setMentorName] = useState(initial?.mentorName ?? "");
  const [menteeName, setMenteeName] = useState(initial?.menteeName ?? "");
  const [field, setField] = useState<GroupMentorField>(
    initial?.field ?? "기술"
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? today());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [status, setStatus] = useState<GroupMentorStatus>(
    initial?.status ?? "진행중"
  );

  function reset() {
    setMentorName(initial?.mentorName ?? "");
    setMenteeName(initial?.menteeName ?? "");
    setField(initial?.field ?? "기술");
    setStartDate(initial?.startDate ?? today());
    setEndDate(initial?.endDate ?? "");
    setStatus(initial?.status ?? "진행중");
  }

  function handleSave() {
    if (!mentorName.trim()) {
      toast.error("멘토 이름을 입력해주세요.");
      return;
    }
    if (!menteeName.trim()) {
      toast.error("멘티 이름을 입력해주세요.");
      return;
    }
    if (mentorName.trim() === menteeName.trim()) {
      toast.error("멘토와 멘티는 다른 사람이어야 합니다.");
      return;
    }
    onSave({
      mentorName: mentorName.trim(),
      menteeName: menteeName.trim(),
      field,
      startDate,
      endDate,
      status,
    });
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "create" ? "매칭 추가" : "매칭 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">멘토 이름 *</Label>
              <Input
                placeholder="멘토 이름"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">멘티 이름 *</Label>
              <Input
                placeholder="멘티 이름"
                value={menteeName}
                onChange={(e) => setMenteeName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">매칭 분야 *</Label>
            <Select
              value={field}
              onValueChange={(v) => setField(v as GroupMentorField)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작일</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료일</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {mode === "edit" && (
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as GroupMentorStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            {mode === "create" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 매칭 카드 (개별)
// ============================================================

type MatchCardProps = {
  match: GroupMentorMatch;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: GroupMentorStatus) => void;
  onAddSession: () => void;
  onDeleteSession: (sessionId: string) => void;
};

function MatchCard({
  match,
  onEdit,
  onDelete,

  onAddSession,
  onDeleteSession,
}: MatchCardProps) {
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const avgRating = (() => {
    const rated = match.sessions.filter((s) => s.rating > 0);
    if (rated.length === 0) return null;
    return (
      Math.round(
        (rated.reduce((sum, s) => sum + s.rating, 0) / rated.length) * 10
      ) / 10
    );
  })();

  const sortedSessions = match.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="rounded-lg border bg-white p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-semibold truncate">
            {match.mentorName}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold truncate">
            {match.menteeName}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 shrink-0",
              FIELD_COLOR[match.field]
            )}
          >
            {match.field}
          </Badge>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 shrink-0",
              STATUS_COLOR[match.status]
            )}
          >
            {match.status}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="수정"
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            title="삭제"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 날짜 + 통계 */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span>시작: {match.startDate}</span>
        {match.endDate && <span>종료: {match.endDate}</span>}
        <span>세션 {match.sessions.length}회</span>
        {avgRating !== null && (
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            {avgRating}
          </span>
        )}
      </div>

      {/* 성장 트래커 */}
      {match.sessions.length >= 2 && (
        <GrowthLineChart sessions={match.sessions} />
      )}

      {/* 세션 목록 */}
      {match.sessions.length > 0 && (
        <Collapsible open={sessionsOpen} onOpenChange={setSessionsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800">
              {sessionsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              세션 기록 {sessionsOpen ? "접기" : `(${match.sessions.length}개) 펼치기`}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {sortedSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-2 rounded bg-gray-50 px-2 py-1.5"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">
                        {s.date}
                      </span>
                      <StarRating value={s.rating} readOnly />
                    </div>
                    <p className="text-[11px] leading-snug break-all">
                      {s.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(s.id)}
                    className="text-red-300 hover:text-red-500 mt-0.5 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 세션 추가 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-indigo-600 hover:text-indigo-800 px-1"
        onClick={onAddSession}
      >
        <Plus className="h-3 w-3 mr-0.5" />
        세션 추가
      </Button>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type FilterStatus = "전체" | GroupMentorStatus;
type FilterField = "전체" | GroupMentorField;

export function GroupMentorCard({ groupId }: { groupId: string }) {
  const {
    matches,
    loading,
    addMatch,
    updateMatch,
    deleteMatch,
    updateStatus,
    addSession,
    deleteSession,
    stats,
  } = useGroupMentor(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");
  const [filterField, setFilterField] = useState<FilterField>("전체");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupMentorMatch | null>(null);
  const [sessionMatchId, setSessionMatchId] = useState<string | null>(null);

  // 필터 적용
  const filtered = matches.filter((m) => {
    if (filterStatus !== "전체" && m.status !== filterStatus) return false;
    if (filterField !== "전체" && m.field !== filterField) return false;
    return true;
  });

  // 핸들러
  function handleCreate(data: {
    mentorName: string;
    menteeName: string;
    field: GroupMentorField;
    startDate: string;
    endDate: string;
    status: GroupMentorStatus;
  }) {
    addMatch({
      mentorName: data.mentorName,
      menteeName: data.menteeName,
      field: data.field,
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: data.status,
    });
    toast.success("멘토링 매칭이 추가되었습니다.");
  }

  function handleEdit(data: {
    mentorName: string;
    menteeName: string;
    field: GroupMentorField;
    startDate: string;
    endDate: string;
    status: GroupMentorStatus;
  }) {
    if (!editTarget) return;
    const ok = updateMatch(editTarget.id, {
      mentorName: data.mentorName,
      menteeName: data.menteeName,
      field: data.field,
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: data.status,
    });
    if (ok) toast.success("매칭이 수정되었습니다.");
    else toast.error("수정에 실패했습니다.");
  }

  function handleDelete(id: string) {
    const ok = deleteMatch(id);
    if (ok) toast.success("매칭이 삭제되었습니다.");
    else toast.error("삭제에 실패했습니다.");
  }

  function handleStatusChange(id: string, status: GroupMentorStatus) {
    updateStatus(id, status);
    toast.success(`상태가 "${status}"으로 변경되었습니다.`);
  }

  function handleAddSession(
    matchId: string,
    session: Omit<GroupMentorSession, "id" | "createdAt">
  ) {
    const result = addSession(matchId, session);
    if (result) toast.success("세션이 기록되었습니다.");
    else toast.error("세션 추가에 실패했습니다.");
  }

  function handleDeleteSession(matchId: string, sessionId: string) {
    const ok = deleteSession(matchId, sessionId);
    if (ok) toast.success("세션이 삭제되었습니다.");
    else toast.error("삭제에 실패했습니다.");
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">그룹 멘토 매칭</span>
                {stats.active > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                    진행중 {stats.active}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 요약 통계 */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="rounded-lg bg-indigo-50 p-2 text-center">
                  <div className="text-base font-bold text-indigo-600">
                    {stats.total}
                  </div>
                  <div className="text-[10px] text-muted-foreground">총 매칭</div>
                </div>
                <div className="rounded-lg bg-green-50 p-2 text-center">
                  <div className="text-base font-bold text-green-600">
                    {stats.active}
                  </div>
                  <div className="text-[10px] text-muted-foreground">진행중</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 text-center">
                  <div className="text-base font-bold text-gray-600">
                    {stats.totalSessions}
                  </div>
                  <div className="text-[10px] text-muted-foreground">총 세션</div>
                </div>
                <div className="rounded-lg bg-yellow-50 p-2 text-center">
                  <div className="text-base font-bold text-yellow-600 flex items-center justify-center gap-0.5">
                    {stats.avgRating !== null ? (
                      <>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {stats.avgRating}
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">평균 평가</div>
                </div>
              </div>

              {/* 탭: 매칭 목록 / 멘토 통계 */}
              <Tabs defaultValue="list">
                <TabsList className="h-7 text-xs">
                  <TabsTrigger value="list" className="text-xs px-3 h-6">
                    매칭 목록
                  </TabsTrigger>
                  <TabsTrigger value="mentors" className="text-xs px-3 h-6">
                    멘토 통계
                  </TabsTrigger>
                </TabsList>

                {/* 매칭 목록 탭 */}
                <TabsContent value="list" className="mt-2 space-y-2">
                  {/* 필터 + 추가 버튼 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 상태 필터 */}
                    <Select
                      value={filterStatus}
                      onValueChange={(v) => setFilterStatus(v as FilterStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[72px] px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="전체" className="text-xs">
                          전체 상태
                        </SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 분야 필터 */}
                    <Select
                      value={filterField}
                      onValueChange={(v) => setFilterField(v as FilterField)}
                    >
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[72px] px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="전체" className="text-xs">
                          전체 분야
                        </SelectItem>
                        {FIELDS.map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="ml-auto">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        매칭 추가
                      </Button>
                    </div>
                  </div>

                  {/* 목록 */}
                  {loading ? (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      불러오는 중...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      {matches.length === 0
                        ? "아직 멘토링 매칭이 없습니다."
                        : "선택한 필터에 해당하는 매칭이 없습니다."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filtered.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onEdit={() => setEditTarget(match)}
                          onDelete={() => handleDelete(match.id)}
                          onStatusChange={(status) =>
                            handleStatusChange(match.id, status)
                          }
                          onAddSession={() => setSessionMatchId(match.id)}
                          onDeleteSession={(sessionId) =>
                            handleDeleteSession(match.id, sessionId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 멘토 통계 탭 */}
                <TabsContent value="mentors" className="mt-2">
                  {stats.mentorStats.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      멘토 데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.mentorStats.map((m, i) => (
                        <div
                          key={m.mentorName}
                          className="rounded-lg border p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground w-4">
                                {i + 1}
                              </span>
                              <span className="text-xs font-semibold">
                                {m.mentorName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {m.avgRating !== null && (
                                <span className="flex items-center gap-0.5 text-[10px] text-yellow-600">
                                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                  {m.avgRating}
                                </span>
                              )}
                              {m.activeMatches > 0 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                                  활성 {m.activeMatches}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>총 세션 {m.sessionCount}회</span>
                            <span>활성 매칭 {m.activeMatches}개</span>
                          </div>
                          {/* 세션 수 바 */}
                          {stats.totalSessions > 0 && (
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-400 rounded-full"
                                style={{
                                  width: `${
                                    (m.sessionCount / stats.totalSessions) * 100
                                  }%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 매칭 추가 다이얼로그 */}
      <MatchDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />

      {/* 매칭 수정 다이얼로그 */}
      {editTarget && (
        <MatchDialog
          open={editTarget !== null}
          mode="edit"
          initial={{
            mentorName: editTarget.mentorName,
            menteeName: editTarget.menteeName,
            field: editTarget.field,
            startDate: editTarget.startDate,
            endDate: editTarget.endDate ?? "",
            status: editTarget.status,
          }}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      {/* 세션 추가 다이얼로그 */}
      <AddSessionDialog
        open={sessionMatchId !== null}
        matchId={sessionMatchId}
        onClose={() => setSessionMatchId(null)}
        onSave={handleAddSession}
      />
    </>
  );
}
