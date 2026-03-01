"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  MentalCoachingNote,
  MentalCoachingTopic,
  MentalCoachingStatus,
  MentalCoachingActionItem,
} from "@/types";
import { EnergyPicker } from "./energy-picker";
import {
  TOPICS,
  STATUS_LABEL,
  ENERGY_LABEL,
  today,
} from "./types";

// ============================================================
// 코칭 노트 다이얼로그 (추가 / 수정)
// ============================================================

export type NoteDialogSaveData = {
  memberName: string;
  coachName: string;
  date: string;
  topic: MentalCoachingTopic;
  content: string;
  energyLevel: number;
  actionItems: Omit<MentalCoachingActionItem, "id">[];
  status: MentalCoachingStatus;
};

export type NoteDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  initial?: MentalCoachingNote;
  onSave: (data: NoteDialogSaveData) => void;
};

export function NoteDialog({
  open,
  onClose,
  memberNames,
  initial,
  onSave,
}: NoteDialogProps) {
  const isEdit = !!initial;

  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [coachName, setCoachName] = useState(initial?.coachName ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [topic, setTopic] = useState<MentalCoachingTopic>(
    initial?.topic ?? "자신감"
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [energyLevel, setEnergyLevel] = useState(initial?.energyLevel ?? 3);
  const [status, setStatus] = useState<MentalCoachingStatus>(
    initial?.status ?? "진행중"
  );
  const [actionInput, setActionInput] = useState("");
  const [actionItems, setActionItems] = useState<
    Omit<MentalCoachingActionItem, "id">[]
  >(
    initial?.actionItems.map(({ text, done }) => ({ text, done })) ?? []
  );
  const actionRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMemberName(initial?.memberName ?? "");
    setCoachName(initial?.coachName ?? "");
    setDate(initial?.date ?? today());
    setTopic(initial?.topic ?? "자신감");
    setContent(initial?.content ?? "");
    setEnergyLevel(initial?.energyLevel ?? 3);
    setStatus(initial?.status ?? "진행중");
    setActionInput("");
    setActionItems(
      initial?.actionItems.map(({ text, done }) => ({ text, done })) ?? []
    );
  }

  function addAction() {
    const v = actionInput.trim();
    if (!v) return;
    setActionItems([...actionItems, { text: v, done: false }]);
    setActionInput("");
    actionRef.current?.focus();
  }

  function removeAction(idx: number) {
    setActionItems(actionItems.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!memberName.trim()) {
      toast.error(TOAST.MENTAL_COACHING.MEMBER_REQUIRED);
      return;
    }
    if (!coachName.trim()) {
      toast.error(TOAST.MENTAL_COACHING.COACH_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(TOAST.MENTAL_COACHING.CONTENT_REQUIRED);
      return;
    }
    onSave({
      memberName: memberName.trim(),
      coachName: coachName.trim(),
      date,
      topic,
      content: content.trim(),
      energyLevel,
      actionItems,
      status,
    });
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const dialogTitleId = "note-dialog-title";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-labelledby={dialogTitleId}
      >
        <DialogHeader>
          <DialogTitle id={dialogTitleId} className="text-sm">
            {isEdit ? "코칭 노트 수정" : "코칭 노트 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 대상 멤버 */}
          <div className="space-y-1">
            <Label htmlFor="note-member" className="text-xs">
              대상 멤버 *
            </Label>
            {memberNames.length > 0 ? (
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger id="note-member" className="h-8 text-xs" aria-label="대상 멤버 선택">
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
                id="note-member"
                placeholder="멤버 이름 입력"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 코치 이름 */}
          <div className="space-y-1">
            <Label htmlFor="note-coach" className="text-xs">
              코치 이름 *
            </Label>
            <Input
              id="note-coach"
              placeholder="코치 이름 입력"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label htmlFor="note-date" className="text-xs">
              날짜
            </Label>
            <Input
              id="note-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 주제 */}
          <div className="space-y-1">
            <Label htmlFor="note-topic" className="text-xs">
              주제 카테고리
            </Label>
            <Select
              value={topic}
              onValueChange={(v) => setTopic(v as MentalCoachingTopic)}
            >
              <SelectTrigger id="note-topic" className="h-8 text-xs" aria-label="주제 카테고리 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기분/에너지 레벨 */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium">
              기분/에너지 레벨{" "}
              <span className="text-muted-foreground font-normal">
                ({ENERGY_LABEL[energyLevel]})
              </span>
            </legend>
            <EnergyPicker value={energyLevel} onChange={setEnergyLevel} />
          </fieldset>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor="note-content" className="text-xs">
              코칭 내용 *
            </Label>
            <Textarea
              id="note-content"
              placeholder="코칭 세션 내용을 기록해주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          {/* 액션 아이템 */}
          <div className="space-y-1">
            <Label htmlFor="note-action-input" className="text-xs">
              액션 아이템
            </Label>
            <div className="flex gap-1">
              <Input
                id="note-action-input"
                ref={actionRef}
                placeholder="할 일 입력 후 Enter"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAction()}
                className="h-8 text-xs flex-1"
                aria-describedby="action-items-list"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addAction}
                aria-label="액션 아이템 추가"
              >
                추가
              </Button>
            </div>
            {actionItems.length > 0 && (
              <ul
                id="action-items-list"
                className="space-y-1 mt-1"
                role="list"
                aria-label="입력된 액션 아이템 목록"
              >
                {actionItems.map((a, i) => (
                  <li
                    key={i}
                    role="listitem"
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <span className="flex-1">{a.text}</span>
                    <button
                      type="button"
                      onClick={() => removeAction(i)}
                      aria-label={`"${a.text}" 액션 아이템 삭제`}
                      className="text-red-400 hover:text-red-600 text-[10px]"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 진행 상태 */}
          <div className="space-y-1">
            <Label htmlFor="note-status" className="text-xs">
              진행 상태
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as MentalCoachingStatus)}
            >
              <SelectTrigger id="note-status" className="h-8 text-xs" aria-label="진행 상태 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["진행중", "개선됨", "해결됨"] as MentalCoachingStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            {isEdit ? "수정" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
