"use client";

// 멘토 매칭 생성/수정 다이얼로그 + 세션 추가 다이얼로그

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { StarRating } from "./group-mentor-star-rating";
import { FIELDS, STATUS_OPTIONS, getToday } from "./group-mentor-types";
import type { MatchFormData } from "./group-mentor-types";
import type {
  GroupMentorField,
  GroupMentorStatus,
  GroupMentorSession,
} from "@/types";

// ============================================================
// 세션 추가 다이얼로그
// ============================================================

type AddSessionDialogProps = {
  /** 다이얼로그 열림 여부 */
  open: boolean;
  /** 세션을 추가할 매칭 ID */
  matchId: string | null;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 저장 핸들러 */
  onSave: (
    matchId: string,
    session: Omit<GroupMentorSession, "id" | "createdAt">
  ) => void;
};

/**
 * 세션 기록 추가 다이얼로그
 * - 날짜, 내용, 평가(별점) 입력
 */
export function AddSessionDialog({
  open,
  matchId,
  onClose,
  onSave,
}: AddSessionDialogProps) {
  const [date, setDate] = useState(getToday());
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);

  /** 폼 초기화 */
  function reset() {
    setDate(getToday());
    setContent("");
    setRating(0);
  }

  function handleSave() {
    if (!matchId) return;
    if (!content.trim()) {
      toast.error(TOAST.GROUP_MENTOR_CARD.SESSION_CONTENT_REQUIRED);
      return;
    }
    if (rating === 0) {
      toast.error(TOAST.GROUP_MENTOR_CARD.RATING_REQUIRED);
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
      <DialogContent className="max-w-sm" aria-describedby="add-session-desc">
        <DialogHeader>
          <DialogTitle className="text-sm">세션 기록 추가</DialogTitle>
        </DialogHeader>
        <div
          id="add-session-desc"
          className="space-y-3 py-2"
          role="form"
          aria-label="세션 기록 추가 폼"
        >
          <div className="space-y-1">
            <Label htmlFor="session-date" className="text-xs">
              날짜
            </Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="session-content" className="text-xs">
              내용 *
            </Label>
            <Textarea
              id="session-content"
              placeholder="세션 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[72px] resize-none"
              aria-required="true"
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

type MatchDialogProps = {
  /** 다이얼로그 열림 여부 */
  open: boolean;
  /** create: 새 매칭, edit: 기존 매칭 수정 */
  mode: "create" | "edit";
  /** 수정 시 초기값 */
  initial?: Partial<MatchFormData>;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 저장 핸들러 */
  onSave: (data: MatchFormData) => void;
};

/**
 * 매칭 추가/수정 다이얼로그
 * - 멘토/멘티 이름, 분야, 시작/종료일, 상태(수정 시만) 입력
 */
export function MatchDialog({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: MatchDialogProps) {
  const [mentorName, setMentorName] = useState(initial?.mentorName ?? "");
  const [menteeName, setMenteeName] = useState(initial?.menteeName ?? "");
  const [field, setField] = useState<GroupMentorField>(
    initial?.field ?? "기술"
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? getToday());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [status, setStatus] = useState<GroupMentorStatus>(
    initial?.status ?? "진행중"
  );

  /** 폼 초기값으로 리셋 */
  function reset() {
    setMentorName(initial?.mentorName ?? "");
    setMenteeName(initial?.menteeName ?? "");
    setField(initial?.field ?? "기술");
    setStartDate(initial?.startDate ?? getToday());
    setEndDate(initial?.endDate ?? "");
    setStatus(initial?.status ?? "진행중");
  }

  function handleSave() {
    if (!mentorName.trim()) {
      toast.error(TOAST.GROUP_MENTOR_CARD.MENTOR_REQUIRED);
      return;
    }
    if (!menteeName.trim()) {
      toast.error(TOAST.GROUP_MENTOR_CARD.MENTEE_REQUIRED);
      return;
    }
    if (mentorName.trim() === menteeName.trim()) {
      toast.error(TOAST.GROUP_MENTOR_CARD.SAME_PERSON_ERROR);
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

  const dialogId = mode === "create" ? "match-create-desc" : "match-edit-desc";

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
      <DialogContent className="max-w-sm" aria-describedby={dialogId}>
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "create" ? "매칭 추가" : "매칭 수정"}
          </DialogTitle>
        </DialogHeader>
        <div
          id={dialogId}
          className="space-y-3 py-2"
          role="form"
          aria-label={mode === "create" ? "매칭 추가 폼" : "매칭 수정 폼"}
        >
          {/* 멘토/멘티 이름 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="mentor-name" className="text-xs">
                멘토 이름 *
              </Label>
              <Input
                id="mentor-name"
                placeholder="멘토 이름"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mentee-name" className="text-xs">
                멘티 이름 *
              </Label>
              <Input
                id="mentee-name"
                placeholder="멘티 이름"
                value={menteeName}
                onChange={(e) => setMenteeName(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            </div>
          </div>

          {/* 매칭 분야 */}
          <div className="space-y-1">
            <Label htmlFor="match-field" className="text-xs">
              매칭 분야 *
            </Label>
            <Select
              value={field}
              onValueChange={(v) => setField(v as GroupMentorField)}
            >
              <SelectTrigger id="match-field" className="h-8 text-xs">
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

          {/* 시작/종료일 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-xs">
                시작일
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-xs">
                종료일
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 상태 (수정 모드에서만 표시) */}
          {mode === "edit" && (
            <div className="space-y-1">
              <Label htmlFor="match-status" className="text-xs">
                상태
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as GroupMentorStatus)}
              >
                <SelectTrigger id="match-status" className="h-8 text-xs">
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
