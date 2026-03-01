"use client";

import { useState } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Shuffle,
  Link2,
  Link2Off,
  Star,
  Clock,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import {
  usePracticePartner,
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_COLORS,
} from "@/hooks/use-practice-partner";
import type {
  PracticePartnerSkillLevel,
  PracticePartnerMember,
  PracticePartnerMatch,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 포맷 유틸
// ============================================

// ============================================
// 별점 컴포넌트
// ============================================

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              value && star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================
// 멤버 등록 다이얼로그
// ============================================

const AVAILABLE_TIME_OPTIONS = [
  "월 오전",
  "월 오후",
  "월 저녁",
  "화 오전",
  "화 오후",
  "화 저녁",
  "수 오전",
  "수 오후",
  "수 저녁",
  "목 오전",
  "목 오후",
  "목 저녁",
  "금 오전",
  "금 오후",
  "금 저녁",
  "토 오전",
  "토 오후",
  "토 저녁",
  "일 오전",
  "일 오후",
  "일 저녁",
];

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    skillLevel: PracticePartnerSkillLevel,
    availableTimes: string[]
  ) => void;
}

function AddMemberDialog({ open, onClose, onAdd }: AddMemberDialogProps) {
  const [name, setName] = useState("");
  const [skillLevel, setSkillLevel] =
    useState<PracticePartnerSkillLevel>("beginner");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState("");

  const reset = () => {
    setName("");
    setSkillLevel("beginner");
    setSelectedTimes([]);
    setCustomTime("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleTime = (t: string) => {
    setSelectedTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleAddCustomTime = () => {
    const t = customTime.trim();
    if (!t || selectedTimes.includes(t)) return;
    setSelectedTimes((prev) => [...prev, t]);
    setCustomTime("");
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    onAdd(trimmed, skillLevel, selectedTimes);
    reset();
    onClose();
    toast.success("멤버가 등록되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">파트너 멤버 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 이름 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="멤버 이름"
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* 스킬 레벨 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              스킬 레벨
            </Label>
            <Select
              value={skillLevel}
              onValueChange={(v) =>
                setSkillLevel(v as PracticePartnerSkillLevel)
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "beginner",
                    "intermediate",
                    "advanced",
                    "expert",
                  ] as PracticePartnerSkillLevel[]
                ).map((level) => (
                  <SelectItem key={level} value={level} className="text-xs">
                    {SKILL_LEVEL_LABELS[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 연습 가능 시간 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              연습 가능 시간 (복수 선택)
            </Label>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto border rounded p-1.5">
              {AVAILABLE_TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTime(t)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                    selectedTimes.includes(t)
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* 직접 입력 */}
            <div className="flex gap-1 mt-1">
              <Input
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="직접 입력 (예: 수 22:00)"
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomTime()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleAddCustomTime}
              >
                추가
              </Button>
            </div>
            {/* 선택된 시간 표시 */}
            {selectedTimes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedTimes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => toggleTime(t)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 수동 매칭 다이얼로그
// ============================================

interface ManualMatchDialogProps {
  open: boolean;
  onClose: () => void;
  unmatched: PracticePartnerMember[];
  onMatch: (memberAId: string, memberBId: string) => void;
}

function ManualMatchDialog({
  open,
  onClose,
  unmatched,
  onMatch,
}: ManualMatchDialogProps) {
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");

  const reset = () => {
    setSelectedA("");
    setSelectedB("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      toast.error("서로 다른 두 멤버를 선택해주세요.");
      return;
    }
    onMatch(selectedA, selectedB);
    reset();
    onClose();
    toast.success("매칭이 생성되었습니다.");
  };

  const availableForB = unmatched.filter((m) => m.id !== selectedA);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">수동 매칭</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              멤버 A <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedA} onValueChange={setSelectedA}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="선택..." />
              </SelectTrigger>
              <SelectContent>
                {unmatched.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.name} ({SKILL_LEVEL_LABELS[m.skillLevel]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              멤버 B <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedB} onValueChange={setSelectedB}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="선택..." />
              </SelectTrigger>
              <SelectContent>
                {availableForB.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.name} ({SKILL_LEVEL_LABELS[m.skillLevel]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!selectedA || !selectedB || selectedA === selectedB}
          >
            매칭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 평가 다이얼로그
// ============================================

interface RatingDialogProps {
  open: boolean;
  onClose: () => void;
  match: PracticePartnerMatch | null;
  raterId: string;
  raterName: string;
  targetName: string;
  onRate: (rating: number, note?: string) => void;
}

function RatingDialog({
  open,
  onClose,
  match,
  raterName,
  targetName,
  onRate,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");

  const reset = () => {
    setRating(0);
    setNote("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    onRate(rating, note.trim() || undefined);
    reset();
    onClose();
    toast.success("평가가 등록되었습니다.");
  };

  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">파트너 평가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{raterName}</span>
            님이{" "}
            <span className="font-medium text-foreground">{targetName}</span>
            님을 평가합니다.
          </p>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              별점 <span className="text-destructive">*</span>
            </Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              코멘트
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="연습하면서 느낀 점을 적어주세요."
              className="min-h-[64px] resize-none text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={rating === 0}
          >
            평가 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 활성 매칭 행
// ============================================

interface ActiveMatchRowProps {
  match: PracticePartnerMatch;
  memberA: PracticePartnerMember | undefined;
  memberB: PracticePartnerMember | undefined;
  onEnd: () => void;
  onRateA: () => void;
  onRateB: () => void;
}

function ActiveMatchRow({
  match,
  memberA,
  memberB,
  onEnd,
  onRateA,
  onRateB,
}: ActiveMatchRowProps) {
  return (
    <div className="flex items-center gap-2 rounded border bg-background px-2.5 py-2 group hover:bg-muted/30 transition-colors">
      {/* 멤버 A */}
      <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
        <span className="text-xs font-medium truncate max-w-[60px]">
          {match.memberAName}
        </span>
        {memberA && (
          <span
            className={`text-[9px] rounded border px-1 ${SKILL_LEVEL_COLORS[memberA.skillLevel]}`}
          >
            {SKILL_LEVEL_LABELS[memberA.skillLevel]}
          </span>
        )}
      </div>

      {/* 연결 아이콘 */}
      <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />

      {/* 멤버 B */}
      <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
        <span className="text-xs font-medium truncate max-w-[60px]">
          {match.memberBName}
        </span>
        {memberB && (
          <span
            className={`text-[9px] rounded border px-1 ${SKILL_LEVEL_COLORS[memberB.skillLevel]}`}
          >
            {SKILL_LEVEL_LABELS[memberB.skillLevel]}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* 매칭일 */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatYearMonthDay(match.matchedAt)}
      </span>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 gap-0.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          onClick={onRateA}
          title={`${match.memberAName}으로 평가`}
        >
          <Star className="h-3 w-3" />A 평가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 gap-0.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          onClick={onRateB}
          title={`${match.memberBName}으로 평가`}
        >
          <Star className="h-3 w-3" />B 평가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onEnd}
          title="매칭 해제"
        >
          <Link2Off className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 매칭 이력 행
// ============================================

function HistoryMatchRow({ match }: { match: PracticePartnerMatch }) {
  return (
    <div className="flex items-start gap-2 rounded border bg-muted/20 px-2.5 py-2 text-[10px] text-muted-foreground">
      <span className="font-medium text-foreground">{match.memberAName}</span>
      <span>+</span>
      <span className="font-medium text-foreground">{match.memberBName}</span>
      <div className="flex-1" />
      <div className="flex flex-col items-end gap-0.5">
        <span>{formatYearMonthDay(match.matchedAt)}</span>
        {match.endedAt && (
          <span className="text-[9px]">~ {formatYearMonthDay(match.endedAt)}</span>
        )}
      </div>
      {/* 평점 */}
      <div className="flex flex-col gap-0.5">
        {match.ratingAtoB !== undefined && (
          <div className="flex items-center gap-0.5">
            <span>{match.memberAName.slice(0, 2)}:</span>
            <StarRating value={match.ratingAtoB} readonly />
          </div>
        )}
        {match.ratingBtoA !== undefined && (
          <div className="flex items-center gap-0.5">
            <span>{match.memberBName.slice(0, 2)}:</span>
            <StarRating value={match.ratingBtoA} readonly />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface PracticePartnerCardProps {
  groupId: string;
}

export function PracticePartnerCard({ groupId }: PracticePartnerCardProps) {
  const {
    members,
    activeMatches,
    endedMatches,
    unmatchedMembers,
    addMember,
    removeMember,
    createMatch,
    endMatch,
    randomMatch,
    ratePartner,
  } = usePracticePartner(groupId);

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showManualMatch, setShowManualMatch] = useState(false);
  const [ratingState, setRatingState] = useState<{
    matchId: string;
    raterId: string;
    raterName: string;
    targetName: string;
  } | null>(null);

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  const handleRandomMatch = () => {
    if (unmatchedMembers.length < 2) {
      toast.error("매칭 가능한 멤버가 2명 이상이어야 합니다.");
      return;
    }
    randomMatch();
    toast.success("랜덤 매칭이 완료되었습니다.");
  };

  const handleEndMatch = (matchId: string) => {
    endMatch(matchId);
    toast.success("매칭이 해제되었습니다.");
  };

  const openRating = (
    matchId: string,
    raterId: string,
    raterName: string,
    targetName: string
  ) => {
    setRatingState({ matchId, raterId, raterName, targetName });
  };

  const handleRate = (rating: number, note?: string) => {
    if (!ratingState) return;
    ratePartner(ratingState.matchId, ratingState.raterId, rating, note);
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-semibold text-gray-800">
              연습 파트너 매칭
            </span>
            {activeMatches.length > 0 && (
              <Badge className="bg-pink-100 text-[10px] px-1.5 py-0 text-pink-600 hover:bg-pink-100">
                {activeMatches.length}쌍
              </Badge>
            )}
            {unmatchedMembers.length > 0 && (
              <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                미매칭 {unmatchedMembers.length}명
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] px-2 gap-0.5"
                  onClick={() => setShowAddMember(true)}
                >
                  <Plus className="h-3 w-3" />
                  멤버 등록
                </Button>
                {unmatchedMembers.length >= 2 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] px-2 gap-0.5"
                      onClick={handleRandomMatch}
                    >
                      <Shuffle className="h-3 w-3" />
                      랜덤 매칭
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] px-2 gap-0.5"
                      onClick={() => setShowManualMatch(true)}
                    >
                      <Link2 className="h-3 w-3" />
                      수동 매칭
                    </Button>
                  </>
                )}
              </>
            )}
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
          <div className="rounded-b-lg border border-gray-200 bg-white p-4">
            {members.length === 0 ? (
              /* 빈 상태 */
              <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                <Users className="h-8 w-8 opacity-30" />
                <p className="text-xs">아직 등록된 멤버가 없습니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAddMember(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  멤버 등록
                </Button>
              </div>
            ) : (
              <>
                {/* 멤버 목록 */}
                <div className="mb-4">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    등록 멤버 ({members.length}명)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 rounded border bg-muted/30 px-2 py-1 group"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium leading-none">
                            {m.name}
                          </span>
                          <span
                            className={`text-[9px] rounded border px-1 py-0 inline-block ${SKILL_LEVEL_COLORS[m.skillLevel]}`}
                          >
                            {SKILL_LEVEL_LABELS[m.skillLevel]}
                          </span>
                        </div>
                        {m.currentMatchId && (
                          <Badge className="text-[9px] px-1 py-0 bg-green-100 text-green-600 hover:bg-green-100">
                            매칭중
                          </Badge>
                        )}
                        {m.availableTimes.length > 0 && (
                          <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{m.availableTimes.slice(0, 2).join(", ")}</span>
                            {m.availableTimes.length > 2 && (
                              <span>+{m.availableTimes.length - 2}</span>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            removeMember(m.id);
                            toast.success("멤버가 삭제되었습니다.");
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 ml-1"
                          title="멤버 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 탭 */}
                <div className="flex gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("current")}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      activeTab === "current"
                        ? "bg-pink-100 text-pink-700 border-pink-300 font-medium"
                        : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                    }`}
                  >
                    <Link2 className="h-3 w-3" />
                    현재 매칭
                    {activeMatches.length > 0 && (
                      <span className="text-[10px] opacity-70">
                        ({activeMatches.length})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      activeTab === "history"
                        ? "bg-gray-200 text-gray-700 border-gray-400 font-medium"
                        : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                    }`}
                  >
                    <History className="h-3 w-3" />
                    매칭 이력
                    {endedMatches.length > 0 && (
                      <span className="text-[10px] opacity-70">
                        ({endedMatches.length})
                      </span>
                    )}
                  </button>
                </div>

                {/* 현재 매칭 탭 */}
                {activeTab === "current" && (
                  <>
                    {activeMatches.length === 0 ? (
                      <div className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground">
                        <Link2 className="h-7 w-7 opacity-30" />
                        <p className="text-xs">현재 활성 매칭이 없습니다.</p>
                        {unmatchedMembers.length >= 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={handleRandomMatch}
                          >
                            <Shuffle className="h-3 w-3" />
                            랜덤 매칭 시작
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {activeMatches.map((match) => (
                          <ActiveMatchRow
                            key={match.id}
                            match={match}
                            memberA={memberMap[match.memberAId]}
                            memberB={memberMap[match.memberBId]}
                            onEnd={() => handleEndMatch(match.id)}
                            onRateA={() =>
                              openRating(
                                match.id,
                                match.memberAId,
                                match.memberAName,
                                match.memberBName
                              )
                            }
                            onRateB={() =>
                              openRating(
                                match.id,
                                match.memberBId,
                                match.memberBName,
                                match.memberAName
                              )
                            }
                          />
                        ))}
                      </div>
                    )}

                    {/* 미매칭 멤버 알림 */}
                    {unmatchedMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-muted-foreground flex items-center gap-1">
                        <span>미매칭:</span>
                        {unmatchedMembers.map((m, i) => (
                          <span key={m.id}>
                            <span className="font-medium text-foreground">
                              {m.name}
                            </span>
                            {i < unmatchedMembers.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 매칭 이력 탭 */}
                {activeTab === "history" && (
                  <>
                    {endedMatches.length === 0 ? (
                      <div className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground">
                        <History className="h-7 w-7 opacity-30" />
                        <p className="text-xs">매칭 이력이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {[...endedMatches]
                          .sort(
                            (a, b) =>
                              new Date(b.matchedAt).getTime() -
                              new Date(a.matchedAt).getTime()
                          )
                          .map((match) => (
                            <HistoryMatchRow key={match.id} match={match} />
                          ))}
                      </div>
                    )}
                  </>
                )}

                {/* 하단 요약 */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-[10px] text-muted-foreground">
                  <span>
                    멤버{" "}
                    <strong className="text-foreground">{members.length}</strong>
                    명
                  </span>
                  <span>
                    현재 매칭{" "}
                    <strong className="text-foreground">
                      {activeMatches.length}
                    </strong>
                    쌍
                  </span>
                  {endedMatches.length > 0 && (
                    <span>
                      종료된 매칭{" "}
                      <strong className="text-foreground">
                        {endedMatches.length}
                      </strong>
                      건
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 다이얼로그들 */}
      <AddMemberDialog
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={addMember}
      />
      <ManualMatchDialog
        open={showManualMatch}
        onClose={() => setShowManualMatch(false)}
        unmatched={unmatchedMembers}
        onMatch={createMatch}
      />
      <RatingDialog
        open={!!ratingState}
        onClose={() => setRatingState(null)}
        match={
          ratingState
            ? (activeMatches.find((m) => m.id === ratingState.matchId) ?? null)
            : null
        }
        raterId={ratingState?.raterId ?? ""}
        raterName={ratingState?.raterName ?? ""}
        targetName={ratingState?.targetName ?? ""}
        onRate={handleRate}
      />
    </>
  );
}
