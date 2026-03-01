"use client";

import { useState } from "react";
import { Plus, CheckCircle2, Clock, LogOut, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MemberAttendStatStatus } from "@/types";
import {
  ALL_STATUSES,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  todayStr,
} from "./types";

// 아이콘은 여기서 직접 정의 (React.ReactNode 타입 문제 방지)
const STATUS_ICON: Record<MemberAttendStatStatus, React.ReactNode> = {
  present: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  late: <Clock className="h-3 w-3" aria-hidden="true" />,
  early_leave: <LogOut className="h-3 w-3" aria-hidden="true" />,
  absent: <XCircle className="h-3 w-3" aria-hidden="true" />,
};

export interface AddRecordDialogProps {
  memberNames?: string[];
  onAdd: (data: {
    memberName: string;
    date: string;
    status: MemberAttendStatStatus;
    notes?: string;
  }) => boolean;
}

export function AddRecordDialog({ memberNames, onAdd }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [manualMember, setManualMember] = useState("");
  const [status, setStatus] = useState<MemberAttendStatStatus>("present");
  const [notes, setNotes] = useState("");

  function toggleMember(name: string) {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const targets =
      selectedMembers.length > 0
        ? selectedMembers
        : manualMember.trim()
        ? [manualMember.trim()]
        : [];

    if (targets.length === 0) return;

    let allOk = true;
    for (const memberName of targets) {
      const ok = onAdd({ memberName, date, status, notes: notes || undefined });
      if (!ok) allOk = false;
    }

    if (allOk) {
      setOpen(false);
      setSelectedMembers([]);
      setManualMember("");
      setNotes("");
      setStatus("present");
      setDate(todayStr());
    }
  }

  const hasTarget =
    selectedMembers.length > 0 || manualMember.trim().length > 0;
  const dateInputId = "add-record-date";
  const memberInputId = "add-record-member";
  const notesInputId = "add-record-notes";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1" aria-label="출석 기록 추가">
          <Plus className="h-3 w-3" aria-hidden="true" />
          기록 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            출석 기록 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* 날짜 */}
          <div className="space-y-1">
            <Label htmlFor={dateInputId} className="text-xs">
              날짜 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <Input
              id={dateInputId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
              required
              aria-required="true"
            />
          </div>

          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label htmlFor={memberInputId} className="text-xs">
              멤버 (다중 선택 가능)
            </Label>
            {memberNames && memberNames.length > 0 ? (
              <div
                className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-gray-50 max-h-32 overflow-y-auto"
                role="group"
                aria-label="멤버 선택"
              >
                {memberNames.map((name) => {
                  const isSelected = selectedMembers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleMember(name)}
                      aria-pressed={isSelected}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : "bg-background text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {(selectedMembers.length === 0 ||
              !memberNames ||
              memberNames.length === 0) && (
              <Input
                id={memberInputId}
                value={manualMember}
                onChange={(e) => setManualMember(e.target.value)}
                placeholder="멤버 이름 직접 입력"
                className="h-8 text-xs"
                aria-label="멤버 이름 직접 입력"
              />
            )}
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label className="text-xs" id="status-group-label">
              출석 상태 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </Label>
            <div
              className="flex gap-1.5 flex-wrap"
              role="radiogroup"
              aria-labelledby="status-group-label"
            >
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium border transition-all ${
                    status === s
                      ? `${STATUS_BADGE_CLASS[s]} border-transparent`
                      : "bg-background text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {STATUS_ICON[s]}
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label htmlFor={notesInputId} className="text-xs">
              비고 (선택)
            </Label>
            <Input
              id={notesInputId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="메모 입력"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={!hasTarget}
              aria-disabled={!hasTarget}
            >
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
