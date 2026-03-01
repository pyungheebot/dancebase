"use client";

import { useState, useRef } from "react";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  BookOpen,
  Star,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMentoringMatch } from "@/hooks/use-mentoring-match";
import type { MentoringMatchPair, MentoringMatchStatus } from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const STATUS_LABEL: Record<MentoringMatchStatus, string> = {
  active: "진행 중",
  completed: "완료",
  paused: "일시중지",
};

const STATUS_BADGE: Record<MentoringMatchStatus, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-700",
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
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "h-4 w-4",
              n <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 세션 추가 다이얼로그
// ============================================================

type AddSessionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (session: {
    date: string;
    topic: string;
    durationMinutes: number;
    notes?: string;
    menteeRating?: number;
  }) => void;
};

function AddSessionDialog({ open, onClose, onSave }: AddSessionDialogProps) {
  const [date, setDate] = useState(today());
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);

  function reset() {
    setDate(today());
    setTopic("");
    setDuration("60");
    setNotes("");
    setRating(0);
  }

  function handleSave() {
    if (!topic.trim()) {
      toast.error("세션 주제를 입력해주세요.");
      return;
    }
    const dur = parseInt(duration, 10);
    if (!dur || dur < 1) {
      toast.error("유효한 시간(분)을 입력해주세요.");
      return;
    }
    onSave({
      date,
      topic: topic.trim(),
      durationMinutes: dur,
      notes: notes.trim() || undefined,
      menteeRating: rating > 0 ? rating : undefined,
    });
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
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
            <Label className="text-xs">주제 *</Label>
            <Input
              placeholder="예: 기본 스텝 교정"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">진행 시간 (분) *</Label>
            <Input
              type="number"
              min={1}
              max={480}
              placeholder="60"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              placeholder="세션 내용 메모..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">멘티 만족도</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { reset(); onClose(); }}>
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
// 매칭 생성 다이얼로그
// ============================================================

type CreatePairDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onSave: (data: {
    mentorName: string;
    menteeName: string;
    skillFocus: string[];
    goals: string[];
    startDate: string;
  }) => void;
};

function CreatePairDialog({
  open,
  onClose,
  memberNames,
  onSave,
}: CreatePairDialogProps) {
  const [mentorName, setMentorName] = useState("");
  const [menteeName, setMenteeName] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(today());
  const skillRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMentorName("");
    setMenteeName("");
    setSkillInput("");
    setSkills([]);
    setGoalInput("");
    setGoals([]);
    setStartDate(today());
  }

  function addSkill() {
    const v = skillInput.trim();
    if (!v || skills.includes(v)) return;
    setSkills([...skills, v]);
    setSkillInput("");
    skillRef.current?.focus();
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

  function addGoal() {
    const v = goalInput.trim();
    if (!v) return;
    setGoals([...goals, v]);
    setGoalInput("");
    goalRef.current?.focus();
  }

  function removeGoal(idx: number) {
    setGoals(goals.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!mentorName) {
      toast.error("멘토를 선택해주세요.");
      return;
    }
    if (!menteeName) {
      toast.error("멘티를 선택해주세요.");
      return;
    }
    if (mentorName === menteeName) {
      toast.error("멘토와 멘티는 다른 멤버여야 합니다.");
      return;
    }
    if (skills.length === 0) {
      toast.error("스킬 포커스를 1개 이상 입력해주세요.");
      return;
    }
    onSave({ mentorName, menteeName, skillFocus: skills, goals, startDate });
    reset();
    onClose();
  }

  const menteeOptions = memberNames.filter((n) => n !== mentorName);
  const mentorOptions = memberNames.filter((n) => n !== menteeName);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">멘토링 매칭 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 멘토 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멘토 *</Label>
            {memberNames.length > 0 ? (
              <Select value={mentorName} onValueChange={setMentorName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멘토 선택" />
                </SelectTrigger>
                <SelectContent>
                  {mentorOptions.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="멘토 이름 입력"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 멘티 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멘티 *</Label>
            {memberNames.length > 0 ? (
              <Select value={menteeName} onValueChange={setMenteeName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멘티 선택" />
                </SelectTrigger>
                <SelectContent>
                  {menteeOptions.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="멘티 이름 입력"
                value={menteeName}
                onChange={(e) => setMenteeName(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 스킬 포커스 */}
          <div className="space-y-1">
            <Label className="text-xs">스킬 포커스 *</Label>
            <div className="flex gap-1">
              <Input
                ref={skillRef}
                placeholder="예: 비보잉, 팝핑"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                className="h-8 text-xs flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addSkill}
              >
                추가
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {skills.map((s) => (
                  <Badge
                    key={s}
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200"
                    onClick={() => removeSkill(s)}
                  >
                    {s} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 목표 */}
          <div className="space-y-1">
            <Label className="text-xs">목표</Label>
            <div className="flex gap-1">
              <Input
                ref={goalRef}
                placeholder="예: 3개월 내 기본기 완성"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="h-8 text-xs flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addGoal}
              >
                추가
              </Button>
            </div>
            {goals.length > 0 && (
              <ul className="space-y-0.5 mt-1">
                {goals.map((g, i) => (
                  <li key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="flex-1">{g}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(i)}
                      className="text-red-400 hover:text-red-600 text-[10px]"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 시작일 */}
          <div className="space-y-1">
            <Label className="text-xs">시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { reset(); onClose(); }}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 페어 카드
// ============================================================

type PairCardProps = {
  pair: MentoringMatchPair;
  onDelete: () => void;
  onStatusChange: (status: MentoringMatchStatus) => void;
  onAddSession: () => void;
  onDeleteSession: (sessionId: string) => void;
};

function PairCard({
  pair,
  onDelete,
  onStatusChange,
  onAddSession,
  onDeleteSession,
}: PairCardProps) {
  const [expanded, setExpanded] = useState(false);

  const avgRating = (() => {
    const rated = pair.sessions.filter((s) => s.menteeRating != null);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, s) => acc + (s.menteeRating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  })();

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium">{pair.mentorName}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">{pair.menteeName}</span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              STATUS_BADGE[pair.status]
            )}
          >
            {STATUS_LABEL[pair.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {pair.status === "active" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="일시중지"
                onClick={() => onStatusChange("paused")}
              >
                <PauseCircle className="h-3 w-3 text-yellow-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="완료"
                onClick={() => onStatusChange("completed")}
              >
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </Button>
            </>
          )}
          {pair.status === "paused" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="재개"
              onClick={() => onStatusChange("active")}
            >
              <PlayCircle className="h-3 w-3 text-blue-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 스킬 포커스 */}
      {pair.skillFocus.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pair.skillFocus.map((skill) => (
            <Badge
              key={skill}
              className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700"
            >
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* 메타 정보 */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>시작: {pair.startDate}</span>
        <span>세션 {pair.sessions.length}회</span>
        {avgRating !== null && (
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            {avgRating}
          </span>
        )}
      </div>

      {/* 목표 */}
      {pair.goals.length > 0 && (
        <div className="space-y-0.5">
          {pair.goals.map((g, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="text-green-500">•</span>
              <span>{g}</span>
            </div>
          ))}
        </div>
      )}

      {/* 세션 목록 토글 */}
      {pair.sessions.length > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800">
              <BookOpen className="h-3 w-3" />
              세션 기록 {expanded ? "접기" : "펼치기"}
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1.5">
              {pair.sessions
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start justify-between gap-2 rounded bg-gray-50 px-2 py-1.5"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium">{s.topic}</span>
                        <span className="text-[10px] text-muted-foreground">{s.date}</span>
                        <span className="text-[10px] text-muted-foreground">{s.durationMinutes}분</span>
                        {s.menteeRating != null && (
                          <span className="flex items-center gap-0.5 text-[10px] text-yellow-600">
                            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                            {s.menteeRating}
                          </span>
                        )}
                      </div>
                      {s.notes && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteSession(s.id)}
                      className="text-red-300 hover:text-red-500 mt-0.5 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
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
        className="h-6 text-xs text-blue-600 hover:text-blue-800 px-1"
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

type FilterType = "all" | MentoringMatchStatus;

export function MentoringMatchCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    pairs,
    loading,
    addPair,
    deletePair,
    addSession,
    deleteSession,
    updateStatus,
    stats,
  } = useMentoringMatch(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [sessionDialogPairId, setSessionDialogPairId] = useState<string | null>(null);

  const filtered = pairs.filter(
    (p) => filter === "all" || p.status === filter
  );

  function handleCreatePair(data: {
    mentorName: string;
    menteeName: string;
    skillFocus: string[];
    goals: string[];
    startDate: string;
  }) {
    addPair(
      data.mentorName,
      data.menteeName,
      data.skillFocus,
      data.goals,
      data.startDate
    );
    toast.success("멘토링 매칭이 생성되었습니다.");
  }

  function handleDeletePair(id: string) {
    const ok = deletePair(id);
    if (ok) toast.success("매칭이 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleStatusChange(pairId: string, status: MentoringMatchStatus) {
    updateStatus(pairId, status);
    const label =
      status === "active" ? "재개" : status === "completed" ? "완료" : "일시중지";
    toast.success(`매칭이 ${label} 처리되었습니다.`);
  }

  function handleAddSession(data: {
    date: string;
    topic: string;
    durationMinutes: number;
    notes?: string;
    menteeRating?: number;
  }) {
    if (!sessionDialogPairId) return;
    const result = addSession(sessionDialogPairId, data);
    if (result) toast.success("세션이 기록되었습니다.");
    else toast.error("세션 추가에 실패했습니다.");
  }

  function handleDeleteSession(pairId: string, sessionId: string) {
    const ok = deleteSession(pairId, sessionId);
    if (ok) toast.success("세션이 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">멘토링 매칭</span>
                {stats.activePairs > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                    활성 {stats.activePairs}
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
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.totalPairs}</div>
                  <div className="text-[10px] text-muted-foreground">총 매칭</div>
                </div>
                <div className="rounded-lg bg-green-50 p-2 text-center">
                  <div className="text-lg font-bold text-green-600">{stats.totalSessions}</div>
                  <div className="text-[10px] text-muted-foreground">총 세션</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-2 text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.avgSessionsPerPair}</div>
                  <div className="text-[10px] text-muted-foreground">평균 세션</div>
                </div>
              </div>

              {/* 필터 + 생성 버튼 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {(
                    [
                      { value: "all", label: "전체" },
                      { value: "active", label: "진행 중" },
                      { value: "completed", label: "완료" },
                      { value: "paused", label: "일시중지" },
                    ] as { value: FilterType; label: string }[]
                  ).map((f) => (
                    <Button
                      key={f.value}
                      variant={filter === f.value ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilter(f.value)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  매칭 생성
                </Button>
              </div>

              {/* 매칭 목록 */}
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  {filter === "all"
                    ? "아직 멘토링 매칭이 없습니다."
                    : `${STATUS_LABEL[filter as MentoringMatchStatus]} 상태의 매칭이 없습니다.`}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((pair) => (
                    <PairCard
                      key={pair.id}
                      pair={pair}
                      onDelete={() => handleDeletePair(pair.id)}
                      onStatusChange={(status) =>
                        handleStatusChange(pair.id, status)
                      }
                      onAddSession={() => setSessionDialogPairId(pair.id)}
                      onDeleteSession={(sessionId) =>
                        handleDeleteSession(pair.id, sessionId)
                      }
                    />
                  ))}
                </div>
              )}

              {/* 탑 멘토 */}
              {stats.topMentors.length > 0 && (
                <div className="rounded-lg border p-3 space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    활발한 멘토
                  </p>
                  {stats.topMentors.map((m, i) => (
                    <div
                      key={m.mentorName}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">
                          {i + 1}
                        </span>
                        <span className="text-xs">{m.mentorName}</span>
                      </div>
                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">
                        {m.sessionCount}회
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 매칭 생성 다이얼로그 */}
      <CreatePairDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        memberNames={memberNames}
        onSave={handleCreatePair}
      />

      {/* 세션 추가 다이얼로그 */}
      <AddSessionDialog
        open={sessionDialogPairId !== null}
        onClose={() => setSessionDialogPairId(null)}
        onSave={handleAddSession}
      />
    </>
  );
}
