"use client";

// ============================================
// 회의록 작성 다이얼로그
// ============================================

import { useState } from "react";
import {
  FileText,
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  MeetingMinutesType,
  MeetingAgendaItem,
  MeetingActionItem,
} from "@/types";
import { AgendaEditor } from "./agenda-editor";
import {
  TYPE_OPTIONS,
  todayYMD,
  type AgendaItemDraft,
} from "./meeting-minutes-types";

type AddMinutesDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberNames: string[];
  onAdd: (params: {
    title: string;
    type: MeetingMinutesType;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees: string[];
    absentees: string[];
    recorder: string;
    agendaItems: MeetingAgendaItem[];
    generalNotes?: string;
    nextMeetingDate?: string;
  }) => boolean;
};

export function MeetingMinutesDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: AddMinutesDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MeetingMinutesType>("regular");
  const [date, setDate] = useState(todayYMD());
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [absenteesText, setAbsenteesText] = useState("");
  const [recorder, setRecorder] = useState("");
  const [agendaItems, setAgendaItems] = useState<AgendaItemDraft[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [nextMeetingDate, setNextMeetingDate] = useState("");

  // 폼 초기화
  const reset = () => {
    setTitle("");
    setType("regular");
    setDate(todayYMD());
    setStartTime("19:00");
    setEndTime("21:00");
    setLocation("");
    setAttendees([]);
    setAbsenteesText("");
    setRecorder("");
    setAgendaItems([]);
    setGeneralNotes("");
    setNextMeetingDate("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // 참석자 체크박스 토글
  const toggleAttendee = (name: string) => {
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 필수 입력값 검증
    if (!title.trim()) {
      toast.error(TOAST.MEETING_MINUTES.TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.MEETING_MINUTES.DATE_REQUIRED);
      return;
    }
    if (!recorder.trim()) {
      toast.error(TOAST.MEETING_MINUTES.RECORDER_REQUIRED);
      return;
    }

    // 불참자 텍스트를 배열로 변환
    const absenteesList = absenteesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 빈 제목의 안건 필터링 후 정규화
    const finalAgendaItems: MeetingAgendaItem[] = agendaItems
      .filter((it) => it.title.trim())
      .map((it) => ({
        id: it.id,
        title: it.title.trim(),
        discussion: it.discussion.trim(),
        decision: it.decision.trim() || undefined,
        actionItems: it.actionItems
          .filter((ai) => ai.task.trim())
          .map((ai): MeetingActionItem => ({
            assignee: ai.assignee.trim(),
            task: ai.task.trim(),
            deadline: ai.deadline || undefined,
          })),
      }));

    const ok = onAdd({
      title: title.trim(),
      type,
      date,
      startTime,
      endTime,
      location: location.trim() || undefined,
      attendees,
      absentees: absenteesList,
      recorder: recorder.trim(),
      agendaItems: finalAgendaItems,
      generalNotes: generalNotes.trim() || undefined,
      nextMeetingDate: nextMeetingDate || undefined,
    });

    if (!ok) {
      toast.error(TOAST.MEETING_MINUTES.REGISTER_ERROR);
      return;
    }
    toast.success(TOAST.MEETING_MINUTES.REGISTERED);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="meeting-minutes-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-500" />
            회의록 작성
          </DialogTitle>
          <DialogDescription id="meeting-minutes-dialog-desc" className="sr-only">
            회의 정보, 참석자, 안건을 입력하여 회의록을 작성합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 회의 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">회의 제목</label>
            <Input
              placeholder="예: 2월 정기 회의"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>

          {/* 회의 유형 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">회의 유형</label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as MeetingMinutesType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 및 시간 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                날짜
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                시작
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                종료
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              장소{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              placeholder="예: 연습실, 카페"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-8 text-xs"
              maxLength={80}
            />
          </div>

          {/* 참석자 체크박스 */}
          {memberNames.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                참석자
              </label>
              <div className="flex flex-wrap gap-2 border border-border/60 rounded-md p-2 bg-muted/10">
                {memberNames.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <Checkbox
                      checked={attendees.includes(name)}
                      onCheckedChange={() => toggleAttendee(name)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{name}</span>
                  </label>
                ))}
              </div>
              {attendees.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  선택된 참석자: {attendees.join(", ")} ({attendees.length}명)
                </p>
              )}
            </div>
          )}

          {/* 불참자 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">
              불참자{" "}
              <span className="text-muted-foreground font-normal">
                (선택, 쉼표 구분)
              </span>
            </label>
            <Input
              placeholder="예: 김민지, 이수현"
              value={absenteesText}
              onChange={(e) => setAbsenteesText(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 기록자 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">기록자</label>
            <Input
              placeholder="기록자 이름"
              value={recorder}
              onChange={(e) => setRecorder(e.target.value)}
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 안건 편집기 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              안건
            </label>
            <AgendaEditor items={agendaItems} onChange={setAgendaItems} />
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <label className="text-xs font-medium">
              비고{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Textarea
              placeholder="기타 메모나 특이사항을 입력하세요."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="text-xs resize-none min-h-[52px]"
              maxLength={500}
            />
          </div>

          {/* 다음 회의 날짜 */}
          <div className="space-y-1">
            <label className="text-xs font-medium flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              다음 회의 날짜{" "}
              <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <Input
              type="date"
              value={nextMeetingDate}
              onChange={(e) => setNextMeetingDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
