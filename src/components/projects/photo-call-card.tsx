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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Camera,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  Users,
  User,
  MapPin,
  Clock,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Shirt,
  Package,
  AlignLeft,
} from "lucide-react";
import { usePhotoCall } from "@/hooks/use-photo-call";
import type { PhotoCallEntry, PhotoCallType } from "@/types";
import type { AddPhotoCallInput } from "@/hooks/use-photo-call";

// ============================================================
// 상수
// ============================================================

const TYPE_CONFIG: Record<
  PhotoCallType,
  { label: string; color: string; icon: React.ReactNode }
> = {
  group: {
    label: "단체",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Users className="h-3 w-3" />,
  },
  subgroup: {
    label: "소그룹",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <Users className="h-3 w-3" />,
  },
  individual: {
    label: "개인",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: <User className="h-3 w-3" />,
  },
  scene: {
    label: "장면",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <Camera className="h-3 w-3" />,
  },
};

const TYPE_OPTIONS: PhotoCallType[] = ["group", "subgroup", "individual", "scene"];

const EMPTY_FORM: AddPhotoCallInput = {
  time: "",
  type: "group",
  participants: [],
  location: "",
  poseDescription: "",
  costume: "",
  props: "",
  photographer: "",
  memo: "",
};

// ============================================================
// 유형 배지
// ============================================================

function TypeBadge({ type }: { type: PhotoCallType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ============================================================
// 참여자 입력 필드
// ============================================================

function ParticipantsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addParticipant() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function removeParticipant(name: string) {
    onChange(value.filter((p) => p !== name));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Input
          placeholder="참여자 이름 입력 후 Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addParticipant();
            }
          }}
          className="h-8 text-sm flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs px-2 shrink-0"
          onClick={addParticipant}
        >
          추가
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 bg-muted/60 rounded-full px-2 py-0.5 text-[11px]"
            >
              {name}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => removeParticipant(name)}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 포토콜 폼 다이얼로그
// ============================================================

type PhotoCallFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PhotoCallEntry;
  onSubmit: (input: AddPhotoCallInput) => Promise<boolean>;
  title: string;
};

function PhotoCallFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: PhotoCallFormDialogProps) {
  const [form, setForm] = useState<AddPhotoCallInput>(
    initial
      ? {
          time: initial.time ?? "",
          type: initial.type,
          participants: initial.participants,
          location: initial.location ?? "",
          poseDescription: initial.poseDescription ?? "",
          costume: initial.costume ?? "",
          props: initial.props ?? "",
          photographer: initial.photographer ?? "",
          memo: initial.memo ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof AddPhotoCallInput>(
    key: K,
    value: AddPhotoCallInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
          {/* 촬영 유형 & 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                촬영 유형 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => setField("type", v as PhotoCallType)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="text-sm">
                      {TYPE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">촬영 시간</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setField("time", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 참여자 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">참여자</Label>
            <ParticipantsInput
              value={form.participants}
              onChange={(v) => setField("participants", v)}
            />
          </div>

          {/* 촬영 위치 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">촬영 위치</Label>
            <Input
              placeholder="예: 무대 앞, 포토 존 A"
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 포즈/구도 설명 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">포즈/구도 설명</Label>
            <Textarea
              placeholder="촬영 포즈나 구도를 설명해주세요"
              value={form.poseDescription}
              onChange={(e) => setField("poseDescription", e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* 의상 & 소품 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">의상</Label>
              <Input
                placeholder="예: 흰색 무대 의상"
                value={form.costume}
                onChange={(e) => setField("costume", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">소품</Label>
              <Input
                placeholder="예: 마이크, 꽃다발"
                value={form.props}
                onChange={(e) => setField("props", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 촬영자 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">촬영자</Label>
            <Input
              placeholder="촬영자 이름"
              value={form.photographer}
              onChange={(e) => setField("photographer", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메모</Label>
            <Textarea
              placeholder="추가 메모를 입력하세요"
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
// 포토콜 항목 행
// ============================================================

type PhotoCallItemProps = {
  entry: PhotoCallEntry;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (entry: PhotoCallEntry) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

function PhotoCallItem({
  entry,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onToggle,
  onMove,
}: PhotoCallItemProps) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        entry.completed
          ? "bg-muted/30 border-muted opacity-70"
          : "bg-card hover:bg-muted/10"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* 완료 체크 */}
        <div className="pt-0.5 shrink-0">
          <Checkbox
            checked={entry.completed}
            onCheckedChange={() => onToggle(entry.id)}
            className="h-4 w-4"
          />
        </div>

        {/* 메인 내용 */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* 상단: 순서 번호, 유형, 시간 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 rounded px-1.5 py-0.5">
              #{entry.order}
            </span>
            <TypeBadge type={entry.type} />
            {entry.time && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {entry.time}
              </span>
            )}
            {entry.completed && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                <CheckCircle2 className="h-2.5 w-2.5" />
                완료
              </span>
            )}
          </div>

          {/* 참여자 */}
          {entry.participants.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Users className="h-3 w-3 text-muted-foreground shrink-0" />
              {entry.participants.map((p) => (
                <span
                  key={p}
                  className="text-[11px] bg-muted/60 rounded-full px-1.5 py-0"
                >
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* 위치 & 촬영자 */}
          <div className="flex items-center gap-3 flex-wrap">
            {entry.location && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {entry.location}
              </span>
            )}
            {entry.photographer && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Camera className="h-2.5 w-2.5" />
                {entry.photographer}
              </span>
            )}
          </div>

          {/* 포즈/구도 */}
          {entry.poseDescription && (
            <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
              <AlignLeft className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{entry.poseDescription}</span>
            </div>
          )}

          {/* 의상 & 소품 */}
          {(entry.costume || entry.props) && (
            <div className="flex items-center gap-3 flex-wrap">
              {entry.costume && (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Shirt className="h-2.5 w-2.5" />
                  {entry.costume}
                </span>
              )}
              {entry.props && (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Package className="h-2.5 w-2.5" />
                  {entry.props}
                </span>
              )}
            </div>
          )}

          {/* 메모 */}
          {entry.memo && (
            <p className="text-[10px] text-muted-foreground italic line-clamp-1">
              {entry.memo}
            </p>
          )}
        </div>

        {/* 순서 이동 & 액션 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMove(entry.id, "up")}
            disabled={isFirst}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMove(entry.id, "down")}
            disabled={isLast}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onEdit(entry)}
              >
                <Pencil className="h-3 w-3" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onToggle(entry.id)}
              >
                {entry.completed ? (
                  <>
                    <Circle className="h-3 w-3" />
                    미완료로 변경
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    완료로 변경
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type PhotoCallCardProps = {
  groupId: string;
  projectId: string;
};

export function PhotoCallCard({ groupId, projectId }: PhotoCallCardProps) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleCompleted,
    moveEntry,
    stats,
  } = usePhotoCall(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PhotoCallEntry | null>(null);

  function handleEdit(entry: PhotoCallEntry) {
    setEditTarget(entry);
  }

  async function handleUpdate(input: AddPhotoCallInput): Promise<boolean> {
    if (!editTarget) return false;
    const ok = await updateEntry(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  async function handleDelete(id: string) {
    await deleteEntry(id);
  }

  async function handleToggle(id: string) {
    await toggleCompleted(id);
  }

  async function handleMove(id: string, direction: "up" | "down") {
    await moveEntry(id, direction);
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                포토 콜 시트
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {stats.total}건
              </Badge>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3 w-3" />
              촬영 추가
            </Button>
          </div>

          {/* 통계 요약 */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                완료 {stats.completed} / 전체 {stats.total}
              </span>
              {stats.byType.group > 0 && (
                <span className="text-[10px] text-blue-600 bg-blue-50 rounded px-2 py-0.5">
                  단체 {stats.byType.group}
                </span>
              )}
              {stats.byType.subgroup > 0 && (
                <span className="text-[10px] text-purple-600 bg-purple-50 rounded px-2 py-0.5">
                  소그룹 {stats.byType.subgroup}
                </span>
              )}
              {stats.byType.individual > 0 && (
                <span className="text-[10px] text-green-600 bg-green-50 rounded px-2 py-0.5">
                  개인 {stats.byType.individual}
                </span>
              )}
              {stats.byType.scene > 0 && (
                <span className="text-[10px] text-orange-600 bg-orange-50 rounded px-2 py-0.5">
                  장면 {stats.byType.scene}
                </span>
              )}
              {stats.pending > 0 && (
                <span className="text-[10px] text-yellow-600 bg-yellow-50 rounded px-2 py-0.5">
                  미완료 {stats.pending}
                </span>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          {/* 빈 상태 */}
          {entries.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                등록된 포토콜이 없습니다
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 번째 촬영 추가
              </Button>
            </div>
          )}

          {/* 촬영 목록 (시간순/순서순) */}
          {entries.map((entry, idx) => (
            <PhotoCallItem
              key={entry.id}
              entry={entry}
              isFirst={idx === 0}
              isLast={idx === entries.length - 1}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onMove={handleMove}
            />
          ))}

          {/* 완료율 프로그레스 */}
          {stats.total > 0 && (
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>촬영 완료율</span>
                <span>
                  {Math.round((stats.completed / stats.total) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.round((stats.completed / stats.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <PhotoCallFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addEntry}
        title="포토콜 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <PhotoCallFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSubmit={handleUpdate}
          title="포토콜 수정"
        />
      )}
    </>
  );
}
