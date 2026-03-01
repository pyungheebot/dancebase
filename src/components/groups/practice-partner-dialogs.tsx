"use client";

/**
 * 연습 파트너 매칭 카드 - 다이얼로그 컴포넌트
 *
 * - AddMemberDialog: 파트너 멤버 등록
 * - ManualMatchDialog: 수동 매칭 생성
 * - RatingDialog: 파트너 평가
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  SKILL_LEVEL_LABELS,
} from "@/hooks/use-practice-partner";
import { StarRating } from "./practice-partner-star-rating";
import {
  AVAILABLE_TIME_OPTIONS,
} from "./practice-partner-types";
import type {
  PracticePartnerSkillLevel,
  PracticePartnerMember,
  PracticePartnerMatch,
} from "./practice-partner-types";

// ============================================
// 멤버 등록 다이얼로그
// ============================================

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    skillLevel: PracticePartnerSkillLevel,
    availableTimes: string[]
  ) => void;
}

export function AddMemberDialog({ open, onClose, onAdd }: AddMemberDialogProps) {
  const [name, setName] = useState("");
  const [skillLevel, setSkillLevel] =
    useState<PracticePartnerSkillLevel>("beginner");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState("");

  // 폼 초기화
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

  // 시간 토글 (선택/해제)
  const toggleTime = (t: string) => {
    setSelectedTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  // 직접 입력 시간 추가
  const handleAddCustomTime = () => {
    const t = customTime.trim();
    if (!t || selectedTimes.includes(t)) return;
    setSelectedTimes((prev) => [...prev, t]);
    setCustomTime("");
  };

  // 등록 제출
  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(TOAST.PRACTICE_PARTNER.NAME_REQUIRED);
      return;
    }
    onAdd(trimmed, skillLevel, selectedTimes);
    reset();
    onClose();
    toast.success(TOAST.PRACTICE_PARTNER.MEMBER_REGISTERED);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm" aria-describedby="add-member-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">파트너 멤버 등록</DialogTitle>
        </DialogHeader>
        <p id="add-member-desc" className="sr-only">
          연습 파트너 매칭에 참가할 멤버를 등록합니다.
        </p>
        <div className="space-y-3 py-1">
          {/* 이름 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block" htmlFor="add-member-name">
              이름 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="add-member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="멤버 이름"
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              aria-required="true"
            />
          </div>

          {/* 스킬 레벨 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block" htmlFor="add-member-skill">
              스킬 레벨
            </Label>
            <Select
              value={skillLevel}
              onValueChange={(v) =>
                setSkillLevel(v as PracticePartnerSkillLevel)
              }
            >
              <SelectTrigger id="add-member-skill" className="h-7 text-xs">
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
            <div
              className="flex flex-wrap gap-1 max-h-28 overflow-y-auto border rounded p-1.5"
              role="group"
              aria-label="연습 가능 시간 선택"
            >
              {AVAILABLE_TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTime(t)}
                  aria-pressed={selectedTimes.includes(t)}
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
                aria-label="직접 시간 입력"
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
              <div className="flex flex-wrap gap-1 mt-1" role="list" aria-label="선택된 시간">
                {selectedTimes.map((t) => (
                  <span
                    key={t}
                    role="listitem"
                    className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => toggleTime(t)}
                      aria-label={`${t} 제거`}
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

export function ManualMatchDialog({
  open,
  onClose,
  unmatched,
  onMatch,
}: ManualMatchDialogProps) {
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");

  // 폼 초기화
  const reset = () => {
    setSelectedA("");
    setSelectedB("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // 매칭 제출
  const handleSubmit = () => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      toast.error(TOAST.PRACTICE_PARTNER.DIFFERENT_MEMBERS);
      return;
    }
    onMatch(selectedA, selectedB);
    reset();
    onClose();
    toast.success(TOAST.PRACTICE_PARTNER.MATCH_CREATED);
  };

  // B 선택 목록: A 선택된 멤버 제외
  const availableForB = unmatched.filter((m) => m.id !== selectedA);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs" aria-describedby="manual-match-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">수동 매칭</DialogTitle>
        </DialogHeader>
        <p id="manual-match-desc" className="sr-only">
          두 멤버를 직접 선택하여 연습 파트너 매칭을 생성합니다.
        </p>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block" htmlFor="manual-match-a">
              멤버 A <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select value={selectedA} onValueChange={setSelectedA}>
              <SelectTrigger id="manual-match-a" className="h-7 text-xs">
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
            <Label className="text-[10px] text-muted-foreground mb-1 block" htmlFor="manual-match-b">
              멤버 B <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Select value={selectedB} onValueChange={setSelectedB}>
              <SelectTrigger id="manual-match-b" className="h-7 text-xs">
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

export function RatingDialog({
  open,
  onClose,
  match,
  raterName,
  targetName,
  onRate,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");

  // 폼 초기화
  const reset = () => {
    setRating(0);
    setNote("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // 평가 제출
  const handleSubmit = () => {
    if (rating === 0) {
      toast.error(TOAST.PRACTICE_PARTNER.RATING_REQUIRED);
      return;
    }
    onRate(rating, note.trim() || undefined);
    reset();
    onClose();
    toast.success(TOAST.PRACTICE_PARTNER.REVIEW_REGISTERED);
  };

  // 매칭 없으면 렌더링 생략
  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs" aria-describedby="rating-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">파트너 평가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <p id="rating-dialog-desc" className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{raterName}</span>
            님이{" "}
            <span className="font-medium text-foreground">{targetName}</span>
            님을 평가합니다.
          </p>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              별점 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block" htmlFor="rating-note">
              코멘트
            </Label>
            <Textarea
              id="rating-note"
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
