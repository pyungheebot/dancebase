"use client";

import { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
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
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMeetingMinutesMemo } from "@/hooks/use-meeting-minutes";
import type {
  MeetingMinutesEntry,
  MeetingMinutesType,
  MeetingAgendaItem,
  MeetingActionItem,
} from "@/types";

// ============================================
// 상수
// ============================================

const TYPE_META: Record<
  MeetingMinutesType,
  { label: string; color: string; bgColor: string }
> = {
  regular: {
    label: "정기회의",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  emergency: {
    label: "긴급회의",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  planning: {
    label: "기획회의",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  review: {
    label: "리뷰회의",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  other: {
    label: "기타",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
};

const TYPE_OPTIONS: { value: MeetingMinutesType; label: string }[] = [
  { value: "regular", label: "정기회의" },
  { value: "emergency", label: "긴급회의" },
  { value: "planning", label: "기획회의" },
  { value: "review", label: "리뷰회의" },
  { value: "other", label: "기타" },
];

// ============================================
// 날짜 헬퍼
// ============================================

function formatDate(ymd: string): string {
  if (!ymd) return "";
  const d = new Date(ymd + "T00:00:00");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ============================================
// 유형 배지
// ============================================

function TypeBadge({ type }: { type: MeetingMinutesType }) {
  const meta = TYPE_META[type];
  return (
    <span
      className={cn(
        "text-[9px] px-1.5 py-0 rounded-full font-medium shrink-0",
        meta.bgColor,
        meta.color
      )}
    >
      {meta.label}
    </span>
  );
}

// ============================================
// 안건 편집 폼 (다이얼로그 내부용)
// ============================================

type AgendaItemDraft = {
  id: string;
  title: string;
  discussion: string;
  decision: string;
  actionItems: { assignee: string; task: string; deadline: string }[];
};

function AgendaEditor({
  items,
  onChange,
}: {
  items: AgendaItemDraft[];
  onChange: (items: AgendaItemDraft[]) => void;
}) {
  const addItem = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        title: "",
        discussion: "",
        decision: "",
        actionItems: [],
      },
    ]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const updateItem = (id: string, patch: Partial<AgendaItemDraft>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const addActionItem = (agendaId: string) => {
    onChange(
      items.map((it) =>
        it.id === agendaId
          ? {
              ...it,
              actionItems: [
                ...it.actionItems,
                { assignee: "", task: "", deadline: "" },
              ],
            }
          : it
      )
    );
  };

  const removeActionItem = (agendaId: string, idx: number) => {
    onChange(
      items.map((it) =>
        it.id === agendaId
          ? {
              ...it,
              actionItems: it.actionItems.filter((_, i) => i !== idx),
            }
          : it
      )
    );
  };

  const updateActionItem = (
    agendaId: string,
    idx: number,
    patch: Partial<{ assignee: string; task: string; deadline: string }>
  ) => {
    onChange(
      items.map((it) =>
        it.id === agendaId
          ? {
              ...it,
              actionItems: it.actionItems.map((ai, i) =>
                i === idx ? { ...ai, ...patch } : ai
              ),
            }
          : it
      )
    );
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="border border-border/60 rounded-md p-2.5 space-y-2 bg-muted/20"
        >
          {/* 안건 헤더 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              안건 {index + 1}
            </span>
            <Input
              placeholder="안건 제목"
              value={item.title}
              onChange={(e) => updateItem(item.id, { title: e.target.value })}
              className="h-7 text-xs flex-1"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="shrink-0"
              aria-label="안건 삭제"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
            </button>
          </div>

          {/* 논의 내용 */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              논의 내용
            </label>
            <Textarea
              placeholder="논의된 내용을 입력하세요."
              value={item.discussion}
              onChange={(e) =>
                updateItem(item.id, { discussion: e.target.value })
              }
              className="text-xs resize-none min-h-[48px]"
              maxLength={500}
            />
          </div>

          {/* 결정사항 */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              결정사항{" "}
              <span className="font-normal">(선택)</span>
            </label>
            <Input
              placeholder="결정된 내용을 입력하세요."
              value={item.decision}
              onChange={(e) =>
                updateItem(item.id, { decision: e.target.value })
              }
              className="h-7 text-xs"
              maxLength={200}
            />
          </div>

          {/* 실행과제 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-muted-foreground">
                실행과제
              </label>
              <button
                type="button"
                onClick={() => addActionItem(item.id)}
                className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <Plus className="h-2.5 w-2.5" />
                추가
              </button>
            </div>
            {item.actionItems.map((ai, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  placeholder="담당자"
                  value={ai.assignee}
                  onChange={(e) =>
                    updateActionItem(item.id, idx, { assignee: e.target.value })
                  }
                  className="h-6 text-[10px] w-20 shrink-0"
                />
                <Input
                  placeholder="과제 내용"
                  value={ai.task}
                  onChange={(e) =>
                    updateActionItem(item.id, idx, { task: e.target.value })
                  }
                  className="h-6 text-[10px] flex-1"
                />
                <Input
                  type="date"
                  value={ai.deadline}
                  onChange={(e) =>
                    updateActionItem(item.id, idx, { deadline: e.target.value })
                  }
                  className="h-6 text-[10px] w-28 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => removeActionItem(item.id, idx)}
                  aria-label="과제 삭제"
                  className="shrink-0"
                >
                  <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-red-500 transition-colors" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs w-full border-dashed"
        onClick={addItem}
      >
        <Plus className="h-3 w-3 mr-1" />
        안건 추가
      </Button>
    </div>
  );
}

// ============================================
// 회의록 작성 다이얼로그
// ============================================

function AddMinutesDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: {
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
}) {
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

  const toggleAttendee = (name: string) => {
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("회의 제목을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("회의 날짜를 입력해주세요.");
      return;
    }
    if (!recorder.trim()) {
      toast.error("기록자를 입력해주세요.");
      return;
    }

    const absenteesList = absenteesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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
      toast.error("회의록 등록에 실패했습니다.");
      return;
    }
    toast.success("회의록이 등록되었습니다.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-500" />
            회의록 작성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 제목 */}
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

          {/* 유형 */}
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
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
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

          {/* 안건 */}
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

// ============================================
// 회의록 상세 (Collapsible)
// ============================================

function MinutesDetail({ entry }: { entry: MeetingMinutesEntry }) {
  return (
    <div className="space-y-2.5 pt-1">
      {/* 기본 정보 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {entry.startTime} ~ {entry.endTime}
        </span>
        {entry.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {entry.location}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Users className="h-2.5 w-2.5" />
          참석 {entry.attendees.length}명
          {entry.absentees.length > 0 && ` · 불참 ${entry.absentees.length}명`}
        </span>
        <span>기록: {entry.recorder}</span>
      </div>

      {/* 참석자 목록 */}
      {entry.attendees.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.attendees.map((name) => (
            <span
              key={name}
              className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
            >
              {name}
            </span>
          ))}
          {entry.absentees.map((name) => (
            <span
              key={name}
              className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100 line-through"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 안건 목록 */}
      {entry.agendaItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
            <ClipboardList className="h-2.5 w-2.5" />
            안건 ({entry.agendaItems.length}건)
          </p>
          {entry.agendaItems.map((agenda, idx) => (
            <div
              key={agenda.id}
              className="bg-muted/30 rounded-md px-2.5 py-2 space-y-1.5"
            >
              {/* 안건 제목 */}
              <p className="text-xs font-semibold">
                {idx + 1}. {agenda.title}
              </p>

              {/* 논의 내용 */}
              {agenda.discussion && (
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {agenda.discussion}
                </p>
              )}

              {/* 결정사항 (강조) */}
              {agenda.decision && (
                <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5">
                  <CheckCircle2 className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide block mb-0.5">
                      결정사항
                    </span>
                    <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                      {agenda.decision}
                    </p>
                  </div>
                </div>
              )}

              {/* 실행과제 */}
              {agenda.actionItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-semibold text-muted-foreground flex items-center gap-0.5">
                    <AlertCircle className="h-2.5 w-2.5" />
                    실행과제
                  </p>
                  {agenda.actionItems.map((ai, aiIdx) => (
                    <div
                      key={aiIdx}
                      className="flex items-center gap-1.5 bg-background/60 rounded px-2 py-1"
                    >
                      <span className="text-[9px] font-semibold text-blue-600 shrink-0 w-14 truncate">
                        {ai.assignee || "담당자"}
                      </span>
                      <span className="text-[10px] flex-1">{ai.task}</span>
                      {ai.deadline && (
                        <span className="text-[9px] text-muted-foreground shrink-0">
                          ~{formatDate(ai.deadline)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 비고 */}
      {entry.generalNotes && (
        <div className="bg-muted/20 rounded-md px-2.5 py-1.5">
          <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
            비고
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {entry.generalNotes}
          </p>
        </div>
      )}

      {/* 다음 회의 */}
      {entry.nextMeetingDate && (
        <div className="flex items-center gap-1 text-[10px] text-green-700">
          <CalendarIcon className="h-2.5 w-2.5" />
          <span>
            다음 회의:{" "}
            <span className="font-semibold">
              {formatDate(entry.nextMeetingDate)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// 회의록 목록 항목
// ============================================

function MinutesItem({
  entry,
  onDelete,
}: {
  entry: MeetingMinutesEntry;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalActions = entry.agendaItems.reduce(
    (s, a) => s + a.actionItems.length,
    0
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-muted/30 rounded-md overflow-hidden">
        {/* 항목 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-1.5 px-2.5 py-2 text-left hover:bg-muted/50 transition-colors"
          >
            {open ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )}

            <span className="text-[10px] text-muted-foreground shrink-0 font-mono w-[72px]">
              {formatDate(entry.date)}
            </span>

            <span className="text-xs font-medium flex-1 truncate">
              {entry.title}
            </span>

            <TypeBadge type={entry.type} />

            <span className="text-[9px] text-muted-foreground shrink-0">
              {entry.attendees.length}명
            </span>

            {entry.agendaItems.length > 0 && (
              <span className="text-[9px] text-muted-foreground shrink-0">
                안건 {entry.agendaItems.length}
              </span>
            )}

            {totalActions > 0 && (
              <span className="text-[9px] px-1 py-0 rounded bg-orange-100 text-orange-700 shrink-0">
                과제 {totalActions}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="shrink-0 ml-0.5"
              aria-label="회의록 삭제"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
            </button>
          </button>
        </CollapsibleTrigger>

        {/* 상세 내용 */}
        <CollapsibleContent>
          <div className="px-2.5 pb-2.5 border-t border-border/30">
            <MinutesDetail entry={entry} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type MeetingMinutesCardProps = {
  groupId: string;
  memberNames: string[];
};

export function MeetingMinutesCard({
  groupId,
  memberNames,
}: MeetingMinutesCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<MeetingMinutesType | "all">(
    "all"
  );

  const {
    entries,
    addMinutes,
    deleteMinutes,
    getByType,
    totalMeetings,
    totalActionItems,
    pendingActionItems,
    recentMeeting,
  } = useMeetingMinutesMemo(groupId);

  const filteredEntries =
    filterType === "all" ? entries : getByType(filterType);

  return (
    <>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* 헤더 */}
        <button
          type="button"
          className="w-full flex items-center gap-1.5 text-left"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
        >
          <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="text-xs font-medium flex-1">그룹 회의록</span>

          {totalMeetings > 0 && (
            <span className="text-[10px] px-1.5 py-0 rounded bg-blue-100 text-blue-700 font-semibold shrink-0">
              {totalMeetings}건
            </span>
          )}

          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {!collapsed && (
          <div className="space-y-2.5">
            {/* 통계 요약 */}
            {totalMeetings > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md px-2 py-1.5 text-center">
                  <p className="text-base font-bold text-blue-700 leading-none">
                    {totalMeetings}
                  </p>
                  <p className="text-[9px] text-blue-600 mt-0.5">총 회의</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-md px-2 py-1.5 text-center">
                  <p className="text-base font-bold text-orange-700 leading-none">
                    {totalActionItems}
                  </p>
                  <p className="text-[9px] text-orange-600 mt-0.5">총 과제</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-md px-2 py-1.5 text-center">
                  <p className="text-base font-bold text-green-700 leading-none">
                    {pendingActionItems}
                  </p>
                  <p className="text-[9px] text-green-600 mt-0.5">미완 과제</p>
                </div>
              </div>
            )}

            {/* 최근 회의 */}
            {recentMeeting && (
              <div className="bg-muted/20 rounded-md px-2 py-1.5 flex items-center gap-1.5">
                <CalendarIcon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground">
                  최근 회의:
                </span>
                <span className="text-[10px] font-medium truncate flex-1">
                  {recentMeeting.title}
                </span>
                <span className="text-[9px] text-muted-foreground shrink-0">
                  {formatDate(recentMeeting.date)}
                </span>
              </div>
            )}

            {/* 유형 필터 */}
            {totalMeetings > 0 && (
              <div className="flex gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    filterType === "all"
                      ? "bg-blue-100 border-blue-300 text-blue-700 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  전체
                </button>
                {TYPE_OPTIONS.map((opt) => {
                  const count = getByType(opt.value).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterType(opt.value)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        filterType === opt.value
                          ? cn(
                              TYPE_META[opt.value].bgColor,
                              TYPE_META[opt.value].color,
                              "border-transparent font-semibold"
                            )
                          : "border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      {opt.label} {count}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 회의록 목록 */}
            {filteredEntries.length > 0 ? (
              <div className="space-y-1.5">
                {filteredEntries.map((entry) => (
                  <MinutesItem
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => {
                      deleteMinutes(id);
                      toast.success("회의록이 삭제되었습니다.");
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                <FileText className="h-5 w-5" />
                <p className="text-xs">아직 회의록이 없습니다</p>
                <p className="text-[10px]">회의 내용을 기록해보세요</p>
              </div>
            )}

            {/* 구분선 */}
            {filteredEntries.length > 0 && (
              <div className="border-t border-border/40" />
            )}

            {/* 회의록 추가 버튼 */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              회의록 추가
            </Button>
          </div>
        )}
      </div>

      {/* 회의록 작성 다이얼로그 */}
      <AddMinutesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberNames={memberNames}
        onAdd={addMinutes}
      />
    </>
  );
}
