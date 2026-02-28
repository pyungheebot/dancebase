"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Footprints,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  User,
  Music,
  MoveRight,
  MapPin,
  AlignLeft,
  Hash,
  Timer,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useStageBlocking } from "@/hooks/use-stage-blocking";
import type {
  StageBlockingNote,
  StageBlockingPosition,
  StageBlockingDirection,
  StageBlockingMemberMove,
} from "@/types";
import type { AddStageBlockingInput, AddMemberMoveInput } from "@/hooks/use-stage-blocking";

// ============================================================
// 상수 & 설정
// ============================================================

const POSITION_CONFIG: Record<StageBlockingPosition, { label: string; short: string; color: string }> = {
  upstage_left:     { label: "상수 좌",   short: "UL", color: "bg-purple-100 text-purple-700 border-purple-200" },
  upstage_center:   { label: "상수 중앙", short: "UC", color: "bg-purple-100 text-purple-700 border-purple-200" },
  upstage_right:    { label: "상수 우",   short: "UR", color: "bg-purple-100 text-purple-700 border-purple-200" },
  center_left:      { label: "센터 좌",   short: "CL", color: "bg-blue-100 text-blue-700 border-blue-200" },
  center:           { label: "센터",      short: "C",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  center_right:     { label: "센터 우",   short: "CR", color: "bg-blue-100 text-blue-700 border-blue-200" },
  downstage_left:   { label: "하수 좌",   short: "DL", color: "bg-green-100 text-green-700 border-green-200" },
  downstage_center: { label: "하수 중앙", short: "DC", color: "bg-green-100 text-green-700 border-green-200" },
  downstage_right:  { label: "하수 우",   short: "DR", color: "bg-green-100 text-green-700 border-green-200" },
  wing_left:        { label: "윙 좌",     short: "WL", color: "bg-orange-100 text-orange-700 border-orange-200" },
  wing_right:       { label: "윙 우",     short: "WR", color: "bg-orange-100 text-orange-700 border-orange-200" },
  custom:           { label: "직접 입력", short: "?",  color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const DIRECTION_CONFIG: Record<StageBlockingDirection, { label: string }> = {
  forward:  { label: "앞으로" },
  backward: { label: "뒤로" },
  left:     { label: "왼쪽" },
  right:    { label: "오른쪽" },
  diagonal: { label: "대각선" },
  circle:   { label: "원형" },
  stay:     { label: "정지" },
  exit:     { label: "퇴장" },
  enter:    { label: "등장" },
};

const POSITION_OPTIONS: StageBlockingPosition[] = [
  "upstage_left", "upstage_center", "upstage_right",
  "center_left", "center", "center_right",
  "downstage_left", "downstage_center", "downstage_right",
  "wing_left", "wing_right", "custom",
];

const DIRECTION_OPTIONS: StageBlockingDirection[] = [
  "forward", "backward", "left", "right", "diagonal", "circle", "stay", "enter", "exit",
];

// 멤버별 색상 (최대 10명)
const MEMBER_COLORS = [
  "bg-red-100 text-red-700 border-red-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
];

function getMemberColor(memberName: string, allNames: string[]): string {
  const idx = allNames.indexOf(memberName);
  return MEMBER_COLORS[idx % MEMBER_COLORS.length];
}

// ============================================================
// 위치 배지
// ============================================================

function PositionBadge({ position }: { position: StageBlockingPosition }) {
  const cfg = POSITION_CONFIG[position];
  return (
    <span
      className={`inline-flex items-center rounded border px-1 py-0 text-[9px] font-bold ${cfg.color}`}
      title={cfg.label}
    >
      {cfg.short}
    </span>
  );
}

// ============================================================
// 멤버 동선 행 입력 폼
// ============================================================

type MemberMoveFormRowProps = {
  move: AddMemberMoveInput;
  index: number;
  onChange: (index: number, move: AddMemberMoveInput) => void;
  onRemove: (index: number) => void;
};

function MemberMoveFormRow({ move, index, onChange, onRemove }: MemberMoveFormRowProps) {
  function setField<K extends keyof AddMemberMoveInput>(key: K, value: AddMemberMoveInput[K]) {
    onChange(index, { ...move, [key]: value });
  }

  return (
    <div className="rounded-md border bg-muted/20 p-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground">
            멤버 {index + 1}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-600"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 멤버 이름 */}
      <Input
        placeholder="멤버 이름"
        value={move.memberName}
        onChange={(e) => setField("memberName", e.target.value)}
        className="h-7 text-xs"
      />

      {/* 시작/종료 위치 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">시작 위치</span>
          <Select
            value={move.fromPosition}
            onValueChange={(v) => setField("fromPosition", v as StageBlockingPosition)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {POSITION_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">종료 위치</span>
          <Select
            value={move.toPosition}
            onValueChange={(v) => setField("toPosition", v as StageBlockingPosition)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {POSITION_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 이동 방향 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">이동 방향</span>
          <Select
            value={move.direction ?? ""}
            onValueChange={(v) =>
              setField("direction", v ? (v as StageBlockingDirection) : undefined)
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="선택 안함" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">선택 안함</SelectItem>
              {DIRECTION_OPTIONS.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {DIRECTION_CONFIG[d].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">메모</span>
          <Input
            placeholder="동선 메모"
            value={move.note ?? ""}
            onChange={(e) => setField("note", e.target.value || undefined)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 동선 노트 폼 다이얼로그
// ============================================================

const EMPTY_MEMBER_MOVE: AddMemberMoveInput = {
  memberName: "",
  fromPosition: "center",
  toPosition: "center",
};

const EMPTY_FORM: AddStageBlockingInput = {
  songTitle: "",
  sceneNumber: "",
  timeStart: "",
  timeEnd: "",
  formation: "",
  memberMoves: [],
  caution: "",
  memo: "",
};

type StageBlockingFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: StageBlockingNote;
  onSubmit: (input: AddStageBlockingInput) => Promise<boolean>;
  title: string;
};

function StageBlockingFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: StageBlockingFormDialogProps) {
  const [form, setForm] = useState<AddStageBlockingInput>(
    initial
      ? {
          songTitle: initial.songTitle,
          sceneNumber: initial.sceneNumber ?? "",
          timeStart: initial.timeStart ?? "",
          timeEnd: initial.timeEnd ?? "",
          countStart: initial.countStart,
          countEnd: initial.countEnd,
          formation: initial.formation ?? "",
          memberMoves: initial.memberMoves.map((m) => ({
            memberName: m.memberName,
            fromPosition: m.fromPosition,
            toPosition: m.toPosition,
            direction: m.direction,
            note: m.note,
          })),
          caution: initial.caution ?? "",
          memo: initial.memo ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof AddStageBlockingInput>(
    key: K,
    value: AddStageBlockingInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleMoveChange(index: number, move: AddMemberMoveInput) {
    const updated = [...form.memberMoves];
    updated[index] = move;
    setField("memberMoves", updated);
  }

  function handleMoveRemove(index: number) {
    setField(
      "memberMoves",
      form.memberMoves.filter((_, i) => i !== index)
    );
  }

  function handleMoveAdd() {
    setField("memberMoves", [...form.memberMoves, { ...EMPTY_MEMBER_MOVE }]);
  }

  async function handleSubmit() {
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) {
      setForm(EMPTY_FORM);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 곡 제목 & 장면 번호 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                곡/장면 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="예: 첫 번째 곡, 오프닝"
                value={form.songTitle}
                onChange={(e) => setField("songTitle", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">장면/섹션 번호</Label>
              <Input
                placeholder="예: A1, 2절, 브릿지"
                value={form.sceneNumber}
                onChange={(e) => setField("sceneNumber", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 시간 구간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">시간 시작 (mm:ss)</Label>
              <Input
                placeholder="예: 00:15"
                value={form.timeStart}
                onChange={(e) => setField("timeStart", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">시간 종료 (mm:ss)</Label>
              <Input
                placeholder="예: 00:45"
                value={form.timeEnd}
                onChange={(e) => setField("timeEnd", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 카운트 구간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">카운트 시작</Label>
              <Input
                type="number"
                placeholder="예: 1"
                value={form.countStart ?? ""}
                onChange={(e) =>
                  setField("countStart", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">카운트 종료</Label>
              <Input
                type="number"
                placeholder="예: 8"
                value={form.countEnd ?? ""}
                onChange={(e) =>
                  setField("countEnd", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 포메이션 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">포메이션</Label>
            <Input
              placeholder="예: 삼각형, V자, 일렬 종대"
              value={form.formation}
              onChange={(e) => setField("formation", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 멤버별 동선 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">멤버별 동선</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1 px-2"
                onClick={handleMoveAdd}
              >
                <Plus className="h-2.5 w-2.5" />
                멤버 추가
              </Button>
            </div>
            {form.memberMoves.length === 0 && (
              <div className="rounded-md border border-dashed py-4 text-center text-[11px] text-muted-foreground">
                멤버를 추가하여 동선을 기록하세요
              </div>
            )}
            <div className="space-y-2">
              {form.memberMoves.map((move, idx) => (
                <MemberMoveFormRow
                  key={idx}
                  move={move}
                  index={idx}
                  onChange={handleMoveChange}
                  onRemove={handleMoveRemove}
                />
              ))}
            </div>
          </div>

          {/* 주의사항 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">주의사항</Label>
            <Input
              placeholder="예: 반드시 왼쪽 다리부터 시작, 충돌 주의"
              value={form.caution}
              onChange={(e) => setField("caution", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 추가 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">추가 메모</Label>
            <Textarea
              placeholder="기타 참고 사항, 연출 의도 등을 입력하세요"
              value={form.memo}
              onChange={(e) => setField("memo", e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 멤버 동선 표시 행
// ============================================================

function MemberMoveRow({
  move,
  memberColor,
}: {
  move: StageBlockingMemberMove;
  memberColor: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium ${memberColor}`}
      >
        <User className="h-2 w-2" />
        {move.memberName}
      </span>
      <PositionBadge position={move.fromPosition} />
      <MoveRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
      <PositionBadge position={move.toPosition} />
      {move.direction && (
        <span className="text-[10px] text-muted-foreground">
          ({DIRECTION_CONFIG[move.direction].label})
        </span>
      )}
      {move.note && (
        <span className="text-[10px] text-muted-foreground italic">
          — {move.note}
        </span>
      )}
    </div>
  );
}

// ============================================================
// 동선 노트 카드 행
// ============================================================

type BlockingNoteRowProps = {
  note: StageBlockingNote;
  allMemberNames: string[];
  isFirst: boolean;
  isLast: boolean;
  onEdit: (note: StageBlockingNote) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

function BlockingNoteRow({
  note,
  allMemberNames,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockingNoteRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card hover:bg-muted/10 transition-colors">
        {/* 헤더 행 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none">
            {/* 펼침 아이콘 */}
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${
                open ? "rotate-90" : ""
              }`}
            />

            {/* 순서 번호 */}
            <span className="text-[10px] font-bold text-muted-foreground w-4 text-center shrink-0">
              {note.order}
            </span>

            {/* 곡/장면 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
              <span className="text-sm font-medium truncate">{note.songTitle}</span>
              {note.sceneNumber && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {note.sceneNumber}
                </Badge>
              )}
              {(note.timeStart || note.timeEnd) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Timer className="h-2.5 w-2.5" />
                  {note.timeStart ?? "?"}
                  {note.timeEnd ? ` ~ ${note.timeEnd}` : ""}
                </span>
              )}
              {(note.countStart !== undefined || note.countEnd !== undefined) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Hash className="h-2.5 w-2.5" />
                  {note.countStart ?? "?"} ~ {note.countEnd ?? "?"}
                </span>
              )}
              {note.formation && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 rounded px-1 py-0">
                  <MapPin className="h-2 w-2" />
                  {note.formation}
                </span>
              )}
              {note.caution && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  주의
                </span>
              )}
            </div>

            {/* 멤버 수 */}
            {note.memberMoves.length > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {note.memberMoves.length}명
              </span>
            )}

            {/* 액션 */}
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem
                    className="text-xs gap-1.5"
                    onClick={() => onEdit(note)}
                  >
                    <Pencil className="h-3 w-3" />
                    수정
                  </DropdownMenuItem>
                  {!isFirst && (
                    <DropdownMenuItem
                      className="text-xs gap-1.5"
                      onClick={() => onMoveUp(note.id)}
                    >
                      <ArrowUp className="h-3 w-3" />
                      위로 이동
                    </DropdownMenuItem>
                  )}
                  {!isLast && (
                    <DropdownMenuItem
                      className="text-xs gap-1.5"
                      onClick={() => onMoveDown(note.id)}
                    >
                      <ArrowDown className="h-3 w-3" />
                      아래로 이동
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 상세 내용 */}
        <CollapsibleContent>
          <div className="px-4 pb-3 space-y-3 border-t bg-muted/5">
            {/* 멤버별 동선 */}
            {note.memberMoves.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  멤버 동선
                </span>
                <div className="space-y-1">
                  {note.memberMoves.map((move, idx) => (
                    <MemberMoveRow
                      key={idx}
                      move={move}
                      memberColor={getMemberColor(move.memberName, allMemberNames)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 주의사항 */}
            {note.caution && (
              <div className="flex items-start gap-1.5 rounded-md bg-yellow-50 border border-yellow-200 px-2.5 py-2">
                <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 shrink-0" />
                <span className="text-[11px] text-yellow-700">{note.caution}</span>
              </div>
            )}

            {/* 추가 메모 */}
            {note.memo && (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <AlignLeft className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="whitespace-pre-wrap">{note.memo}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 곡별 그룹 섹션
// ============================================================

type SongGroupSectionProps = {
  songTitle: string;
  notes: StageBlockingNote[];
  allNotes: StageBlockingNote[];
  allMemberNames: string[];
  onEdit: (note: StageBlockingNote) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

function SongGroupSection({
  songTitle,
  notes,
  allNotes,
  allMemberNames,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SongGroupSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 w-full group"
      >
        <Music className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-semibold">{songTitle}</span>
        <Badge variant="secondary" className="text-[9px] px-1 py-0">
          {notes.length}개
        </Badge>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ml-auto ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>
      {!collapsed && (
        <div className="space-y-1.5 pl-1">
          {notes.map((note) => {
            const globalIdx = allNotes.findIndex((n) => n.id === note.id);
            return (
              <BlockingNoteRow
                key={note.id}
                note={note}
                allMemberNames={allMemberNames}
                isFirst={globalIdx === 0}
                isLast={globalIdx === allNotes.length - 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type StageBlockingCardProps = {
  groupId: string;
  projectId: string;
};

type ViewMode = "all" | "song";

export function StageBlockingCard({ groupId, projectId }: StageBlockingCardProps) {
  const {
    notes,
    songList,
    loading,
    addNote,
    updateNote,
    deleteNote,
    moveUp,
    moveDown,
    getBySong,
    stats,
  } = useStageBlocking(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageBlockingNote | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // 전체 멤버 이름 목록 (색상 할당용)
  const allMemberNames = Array.from(
    new Set(notes.flatMap((n) => n.memberMoves.map((m) => m.memberName)))
  );

  function handleEdit(note: StageBlockingNote) {
    setEditTarget(note);
  }

  async function handleUpdate(input: AddStageBlockingInput): Promise<boolean> {
    if (!editTarget) return false;
    const ok = await updateNote(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                무대 동선 노트
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {stats.total}개
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              {/* 보기 모드 토글 */}
              <div className="flex rounded-md border overflow-hidden text-[10px]">
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-2 py-1 transition-colors ${
                    viewMode === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setViewMode("song")}
                  className={`px-2 py-1 transition-colors ${
                    viewMode === "song"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  곡별
                </button>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                동선 추가
              </Button>
            </div>
          </div>

          {/* 통계 요약 */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                {stats.songCount}개 곡
              </span>
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                멤버 동선 {stats.totalMemberMoves}건
              </span>
              {stats.withCaution > 0 && (
                <span className="text-[10px] text-yellow-600 bg-yellow-50 rounded px-2 py-0.5">
                  주의사항 {stats.withCaution}건
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 빈 상태 */}
          {notes.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Footprints className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                등록된 동선 노트가 없습니다
              </p>
              <p className="text-xs text-muted-foreground/70">
                곡/장면별 무대 동선을 기록해보세요
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 번째 동선 추가
              </Button>
            </div>
          )}

          {/* 전체 목록 */}
          {viewMode === "all" && notes.length > 0 && (
            <div className="space-y-1.5">
              {notes.map((note, idx) => (
                <BlockingNoteRow
                  key={note.id}
                  note={note}
                  allMemberNames={allMemberNames}
                  isFirst={idx === 0}
                  isLast={idx === notes.length - 1}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </div>
          )}

          {/* 곡별 목록 */}
          {viewMode === "song" && notes.length > 0 && (
            <div className="space-y-4">
              {songList.map((song) => (
                <SongGroupSection
                  key={song}
                  songTitle={song}
                  notes={getBySong(song)}
                  allNotes={notes}
                  allMemberNames={allMemberNames}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </div>
          )}

          {/* 범례 */}
          {notes.length > 0 && (
            <div className="pt-2 border-t space-y-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                무대 위치 범례
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["upstage_left", "upstage_center", "upstage_right",
                   "center_left", "center", "center_right",
                   "downstage_left", "downstage_center", "downstage_right"] as StageBlockingPosition[]).map((pos) => (
                  <span
                    key={pos}
                    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[9px] ${POSITION_CONFIG[pos].color}`}
                  >
                    <span className="font-bold">{POSITION_CONFIG[pos].short}</span>
                    <span>{POSITION_CONFIG[pos].label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <StageBlockingFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addNote}
        title="동선 노트 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <StageBlockingFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSubmit={handleUpdate}
          title="동선 노트 수정"
        />
      )}
    </>
  );
}
