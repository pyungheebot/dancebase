"use client";

// ============================================
// 성장 일지 작성/수정 다이얼로그
// ============================================

import { useState, useCallback } from "react";
import { Notebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { GrowthJournalEntry } from "@/types";
import {
  type FormValues,
  getTodayStr,
  joinList,
} from "./growth-journal-types";
import { MoodPicker } from "./growth-journal-mood-picker";
import { StarRating } from "./growth-journal-star-rating";

// ============================================
// 폼 초기값 헬퍼
// ============================================

function emptyForm(memberName: string): FormValues {
  return {
    memberName,
    date: getTodayStr(),
    title: "",
    content: "",
    mood: "neutral",
    skillsPracticed: "",
    achievementsToday: "",
    challengesFaced: "",
    nextGoals: "",
    selfRating: 3,
  };
}

function fromEntry(entry: GrowthJournalEntry): FormValues {
  return {
    memberName: entry.memberName,
    date: entry.date,
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    skillsPracticed: joinList(entry.skillsPracticed),
    achievementsToday: joinList(entry.achievementsToday),
    challengesFaced: joinList(entry.challengesFaced),
    nextGoals: joinList(entry.nextGoals),
    selfRating: entry.selfRating,
  };
}

// ============================================
// 다이얼로그 컴포넌트 Props
// ============================================

export interface JournalDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: GrowthJournalEntry;
  memberNames: string[];
  defaultMember?: string;
  onSubmit: (values: FormValues) => void;
  submitting: boolean;
}

export function JournalDialog({
  open,
  onOpenChange,
  initial,
  memberNames,
  defaultMember,
  onSubmit,
  submitting,
}: JournalDialogProps) {
  const [form, setForm] = useState<FormValues>(() =>
    initial ? fromEntry(initial) : emptyForm(defaultMember ?? memberNames[0] ?? "")
  );

  // 다이얼로그 열릴 때마다 폼 초기화
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setForm(
          initial
            ? fromEntry(initial)
            : emptyForm(defaultMember ?? memberNames[0] ?? "")
        );
      }
      onOpenChange(next);
    },
    [initial, defaultMember, memberNames, onOpenChange]
  );

  // 폼 필드 업데이트 헬퍼
  const set = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // 유효성 검사 후 제출
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberName.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_JOURNAL_MEMBER_REQUIRED);
      return;
    }
    if (!form.title.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_JOURNAL_TITLE_REQUIRED);
      return;
    }
    if (!form.content.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_JOURNAL_CONTENT_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  const dialogId = "growth-journal-dialog";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby={`${dialogId}-desc`}
      >
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Notebook className="h-4 w-4" aria-hidden="true" />
            {initial ? "성장 일지 수정" : "성장 일지 작성"}
          </DialogTitle>
        </DialogHeader>

        {/* 스크린 리더용 다이얼로그 설명 */}
        <p id={`${dialogId}-desc`} className="sr-only">
          {initial
            ? "기존 성장 일지를 수정하는 폼입니다."
            : "새 성장 일지를 작성하는 폼입니다."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 멤버 선택 */}
          <div>
            <label
              htmlFor={`${dialogId}-member`}
              className="text-[10px] text-muted-foreground block mb-1"
            >
              멤버
            </label>
            <Select
              value={form.memberName}
              onValueChange={(v) => set("memberName", v)}
              disabled={!!initial}
            >
              <SelectTrigger id={`${dialogId}-member`} className="h-8 text-xs">
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
          </div>

          {/* 날짜 + 제목 */}
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <label
                htmlFor={`${dialogId}-date`}
                className="text-[10px] text-muted-foreground block mb-1"
              >
                날짜
              </label>
              <Input
                id={`${dialogId}-date`}
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="h-8 text-xs w-36"
                max={getTodayStr()}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor={`${dialogId}-title`}
                className="text-[10px] text-muted-foreground block mb-1"
              >
                제목
              </label>
              <Input
                id={`${dialogId}-title`}
                placeholder="오늘의 성장 일지 제목"
                value={form.title}
                onChange={(e) => set("title", e.target.value.slice(0, 60))}
                className="h-8 text-xs"
                maxLength={60}
              />
            </div>
          </div>

          {/* 무드 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">오늘의 무드</p>
            <MoodPicker
              value={form.mood}
              onChange={(v) => set("mood", v)}
            />
          </div>

          {/* 자기평가 별점 */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">
              자기평가 (1~5점)
            </p>
            <div className="flex items-center gap-2">
              <StarRating
                value={form.selfRating}
                onChange={(v) => set("selfRating", v)}
              />
              <span className="text-xs text-muted-foreground">{form.selfRating}점</span>
            </div>
          </div>

          {/* 일지 내용 */}
          <div>
            <label
              htmlFor={`${dialogId}-content`}
              className="text-[10px] text-muted-foreground block mb-1"
            >
              오늘의 일지 내용
            </label>
            <Textarea
              id={`${dialogId}-content`}
              placeholder="오늘 연습하면서 느낀 점, 배운 점 등을 자유롭게 적어보세요."
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className="text-xs min-h-[80px] resize-none"
              maxLength={1000}
            />
          </div>

          {/* 연습한 스킬 */}
          <div>
            <label
              htmlFor={`${dialogId}-skills`}
              className="text-[10px] text-muted-foreground block mb-1"
            >
              연습한 스킬{" "}
              <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              id={`${dialogId}-skills`}
              placeholder="예: 웨이브, 아이솔레이션, 바디롤"
              value={form.skillsPracticed}
              onChange={(e) => set("skillsPracticed", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 오늘의 성취 */}
          <div>
            <label
              htmlFor={`${dialogId}-achievements`}
              className="text-[10px] text-muted-foreground block mb-1"
            >
              오늘의 성취{" "}
              <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              id={`${dialogId}-achievements`}
              placeholder="예: 8박자 연속 성공, 팀원에게 칭찬 받음"
              value={form.achievementsToday}
              onChange={(e) => set("achievementsToday", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 도전 과제 */}
          <div>
            <label
              htmlFor={`${dialogId}-challenges`}
              className="text-[10px] text-muted-foreground block mb-1"
            >
              도전 과제{" "}
              <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              id={`${dialogId}-challenges`}
              placeholder="예: 복잡한 풋워크, 템포 맞추기"
              value={form.challengesFaced}
              onChange={(e) => set("challengesFaced", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 다음 목표 */}
          <div>
            <label
              htmlFor={`${dialogId}-goals`}
              className="text-[10px] text-muted-foreground block mb-1"
            >
              다음 목표{" "}
              <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              id={`${dialogId}-goals`}
              placeholder="예: 안무 전체 암기, 표정 연습"
              value={form.nextGoals}
              onChange={(e) => set("nextGoals", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 제출/취소 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs flex-1"
              disabled={submitting}
            >
              {submitting ? "저장 중..." : initial ? "수정 완료" : "일지 저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
