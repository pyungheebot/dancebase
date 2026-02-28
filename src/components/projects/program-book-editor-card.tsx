"use client";

import { useState } from "react";
import { useProgramBookEditor } from "@/hooks/use-program-book-editor";
import type {
  ProgramBookItem,
  ProgramBookItemType,
  ProgramBookCast,
} from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Users,
  CalendarDays,
  MapPin,
  Clock,
  Music2,
  Star,
  AlignLeft,
  Settings,
  User,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// 유형 헬퍼
// ============================================================

const ALL_ITEM_TYPES: ProgramBookItemType[] = [
  "opening",
  "performance",
  "intermission",
  "special",
  "closing",
];

function itemTypeLabel(type: ProgramBookItemType): string {
  switch (type) {
    case "performance":
      return "공연";
    case "intermission":
      return "인터미션";
    case "opening":
      return "오프닝";
    case "closing":
      return "클로징";
    case "special":
      return "특별";
  }
}

function itemTypeBadgeClass(type: ProgramBookItemType): string {
  switch (type) {
    case "performance":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "intermission":
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700";
    case "opening":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "closing":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
    case "special":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
  }
}

// ============================================================
// 날짜 포맷 헬퍼
// ============================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// ============================================================
// 공연 정보 설정 다이얼로그
// ============================================================

interface ShowInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialShowTitle?: string;
  initialShowDate?: string | null;
  initialVenue?: string | null;
  initialNotes?: string;
  onSubmit: (info: {
    showTitle: string;
    showDate: string | null;
    venue: string | null;
    notes: string;
  }) => void;
}

function ShowInfoDialog({
  open,
  onOpenChange,
  initialShowTitle = "",
  initialShowDate = "",
  initialVenue = "",
  initialNotes = "",
  onSubmit,
}: ShowInfoDialogProps) {
  const [showTitle, setShowTitle] = useState(initialShowTitle);
  const [showDate, setShowDate] = useState(initialShowDate ?? "");
  const [venue, setVenue] = useState(initialVenue ?? "");
  const [notes, setNotes] = useState(initialNotes);

  const reset = () => {
    setShowTitle(initialShowTitle);
    setShowDate(initialShowDate ?? "");
    setVenue(initialVenue ?? "");
    setNotes(initialNotes);
  };

  const handleSubmit = () => {
    if (!showTitle.trim()) {
      toast.error("공연명을 입력해주세요.");
      return;
    }
    onSubmit({
      showTitle: showTitle.trim(),
      showDate: showDate || null,
      venue: venue.trim() || null,
      notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            공연 정보 설정
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연명 *</Label>
            <Input
              value={showTitle}
              onChange={(e) => setShowTitle(e.target.value)}
              placeholder="예: 2025 봄 정기공연"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연 날짜</Label>
            <Input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">장소</Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="예: 대학로 예술극장 대극장"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">비고</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="관객 안내사항, 유의사항 등"
              className="text-xs min-h-[64px] resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 프로그램 아이템 다이얼로그
// ============================================================

type ItemFormState = {
  type: ProgramBookItemType;
  title: string;
  performers: string;
  duration: string;
  description: string;
  musicTitle: string;
};

const DEFAULT_ITEM_FORM: ItemFormState = {
  type: "performance",
  title: "",
  performers: "",
  duration: "",
  description: "",
  musicTitle: "",
};

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ProgramBookItem;
  onSubmit: (item: Omit<ProgramBookItem, "id" | "order">) => void;
}

function ItemDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: ItemDialogProps) {
  const [form, setForm] = useState<ItemFormState>(() =>
    initial
      ? {
          type: initial.type,
          title: initial.title,
          performers: initial.performers.join(", "),
          duration: initial.duration ?? "",
          description: initial.description,
          musicTitle: initial.musicTitle ?? "",
        }
      : DEFAULT_ITEM_FORM
  );

  const reset = () => {
    setForm(
      initial
        ? {
            type: initial.type,
            title: initial.title,
            performers: initial.performers.join(", "),
            duration: initial.duration ?? "",
            description: initial.description,
            musicTitle: initial.musicTitle ?? "",
          }
        : DEFAULT_ITEM_FORM
    );
  };

  const update = (key: keyof ItemFormState, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("프로그램 제목을 입력해주세요.");
      return;
    }
    const performers = form.performers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      type: form.type,
      title: form.title.trim(),
      performers,
      duration: form.duration.trim() || null,
      description: form.description,
      musicTitle: form.musicTitle.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "프로그램 추가" : "프로그램 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">유형 *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => update("type", v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {itemTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">프로그램 제목 *</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="예: Love Shot (커버)"
              className="h-7 text-xs"
            />
          </div>

          {/* 출연진 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              출연진 (쉼표로 구분)
            </Label>
            <Input
              value={form.performers}
              onChange={(e) => update("performers", e.target.value)}
              placeholder="예: 김민준, 이지수, 박서연"
              className="h-7 text-xs"
            />
          </div>

          {/* 음악 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">음악 제목</Label>
            <Input
              value={form.musicTitle}
              onChange={(e) => update("musicTitle", e.target.value)}
              placeholder="예: Love Shot - EXO"
              className="h-7 text-xs"
            />
          </div>

          {/* 소요 시간 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">소요 시간</Label>
            <Input
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="예: 3분 30초, 3:30"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">설명/안내</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="프로그램에 대한 간단한 설명"
              className="text-xs min-h-[64px] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 출연진 다이얼로그
// ============================================================

type CastFormState = {
  name: string;
  role: string;
  bio: string;
};

const DEFAULT_CAST_FORM: CastFormState = { name: "", role: "", bio: "" };

interface CastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ProgramBookCast;
  onSubmit: (cast: Omit<ProgramBookCast, "id">) => void;
}

function CastDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: CastDialogProps) {
  const [form, setForm] = useState<CastFormState>(() =>
    initial
      ? { name: initial.name, role: initial.role, bio: initial.bio ?? "" }
      : DEFAULT_CAST_FORM
  );

  const reset = () => {
    setForm(
      initial
        ? { name: initial.name, role: initial.role, bio: initial.bio ?? "" }
        : DEFAULT_CAST_FORM
    );
  };

  const update = (key: keyof CastFormState, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("출연진 이름을 입력해주세요.");
      return;
    }
    if (!form.role.trim()) {
      toast.error("역할을 입력해주세요.");
      return;
    }
    onSubmit({
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim() || null,
      photoUrl: initial?.photoUrl ?? null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "출연진 추가" : "출연진 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이름 *</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="예: 김민준"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">역할 *</Label>
            <Input
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="예: 메인 댄서, 안무 감독, 팀장"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">약력</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="간단한 소개 또는 약력"
              className="text-xs min-h-[80px] resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 프로그램 아이템 행
// ============================================================

interface ItemRowProps {
  item: ProgramBookItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ItemRow({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: ItemRowProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-b-0">
      {/* 순서 번호 */}
      <span className="text-[10px] text-muted-foreground w-5 text-center flex-shrink-0 pt-0.5 font-mono">
        {item.order}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span
            className={`inline-flex items-center text-[10px] px-1.5 py-0 rounded-full border ${itemTypeBadgeClass(item.type)}`}
          >
            {itemTypeLabel(item.type)}
          </span>
          <span className="text-xs font-semibold truncate">{item.title}</span>
        </div>

        {/* 출연진 */}
        {item.performers.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">
              {item.performers.join(", ")}
            </span>
          </div>
        )}

        {/* 음악 & 소요 시간 */}
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {item.musicTitle && (
            <div className="flex items-center gap-1">
              <Music2 className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                {item.musicTitle}
              </span>
            </div>
          )}
          {item.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {item.duration}
              </span>
            </div>
          )}
        </div>

        {/* 설명 */}
        {item.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveUp}
          disabled={isFirst}
          title="위로"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
          onClick={onEdit}
          title="편집"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 출연진 행
// ============================================================

interface CastRowProps {
  cast: ProgramBookCast;
  onEdit: () => void;
  onDelete: () => void;
}

function CastRow({ cast, onEdit, onDelete }: CastRowProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-b-0">
      {/* 아바타 자리 */}
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold">{cast.name}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-pink-600 border-pink-200 dark:text-pink-400 dark:border-pink-800"
          >
            {cast.role}
          </Badge>
        </div>
        {cast.bio && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {cast.bio}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
          onClick={onEdit}
          title="편집"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

type ActiveTab = "program" | "cast";

interface ProgramBookEditorCardProps {
  projectId: string;
}

export function ProgramBookEditorCard({
  projectId,
}: ProgramBookEditorCardProps) {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("program");
  const [showInfoDialogOpen, setShowInfoDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemTarget, setEditItemTarget] = useState<ProgramBookItem | null>(
    null
  );
  const [addCastDialogOpen, setAddCastDialogOpen] = useState(false);
  const [editCastTarget, setEditCastTarget] = useState<ProgramBookCast | null>(
    null
  );

  const {
    data,
    setShowInfo,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    addCast,
    updateCast,
    deleteCast,
    totalItems,
    totalCast,
    totalDuration,
  } = useProgramBookEditor(projectId);

  const sortedItems = data
    ? [...data.items].sort((a, b) => a.order - b.order)
    : [];

  const hasShowInfo = !!data?.showTitle;

  // ─── 핸들러 ────────────────────────────────────────────────

  const handleSetShowInfo = (info: {
    showTitle: string;
    showDate: string | null;
    venue: string | null;
    notes: string;
  }) => {
    const ok = setShowInfo(info);
    if (ok) {
      toast.success("공연 정보가 저장되었습니다.");
    } else {
      toast.error("공연명을 입력해주세요.");
    }
  };

  const handleAddItem = (item: Omit<ProgramBookItem, "id" | "order">) => {
    addItem(item);
    toast.success("프로그램이 추가되었습니다.");
  };

  const handleUpdateItem = (item: Omit<ProgramBookItem, "id" | "order">) => {
    if (!editItemTarget) return;
    updateItem(editItemTarget.id, item);
    toast.success("프로그램이 수정되었습니다.");
    setEditItemTarget(null);
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm("이 프로그램을 삭제하시겠습니까?")) return;
    deleteItem(id);
    toast.success("프로그램이 삭제되었습니다.");
  };

  const handleAddCast = (cast: Omit<ProgramBookCast, "id">) => {
    addCast(cast);
    toast.success("출연진이 추가되었습니다.");
  };

  const handleUpdateCast = (cast: Omit<ProgramBookCast, "id">) => {
    if (!editCastTarget) return;
    updateCast(editCastTarget.id, cast);
    toast.success("출연진 정보가 수정되었습니다.");
    setEditCastTarget(null);
  };

  const handleDeleteCast = (id: string) => {
    if (!confirm("이 출연진을 삭제하시겠습니까?")) return;
    deleteCast(id);
    toast.success("출연진이 삭제되었습니다.");
  };

  return (
    <>
      {/* 공연 정보 다이얼로그 */}
      <ShowInfoDialog
        open={showInfoDialogOpen}
        onOpenChange={setShowInfoDialogOpen}
        initialShowTitle={data?.showTitle ?? ""}
        initialShowDate={data?.showDate}
        initialVenue={data?.venue}
        initialNotes={data?.notes ?? ""}
        onSubmit={handleSetShowInfo}
      />

      {/* 프로그램 추가 다이얼로그 */}
      <ItemDialog
        open={addItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        mode="add"
        onSubmit={handleAddItem}
      />

      {/* 프로그램 편집 다이얼로그 */}
      {editItemTarget && (
        <ItemDialog
          open={!!editItemTarget}
          onOpenChange={(v) => {
            if (!v) setEditItemTarget(null);
          }}
          mode="edit"
          initial={editItemTarget}
          onSubmit={handleUpdateItem}
        />
      )}

      {/* 출연진 추가 다이얼로그 */}
      <CastDialog
        open={addCastDialogOpen}
        onOpenChange={setAddCastDialogOpen}
        mode="add"
        onSubmit={handleAddCast}
      />

      {/* 출연진 편집 다이얼로그 */}
      {editCastTarget && (
        <CastDialog
          open={!!editCastTarget}
          onOpenChange={(v) => {
            if (!v) setEditCastTarget(null);
          }}
          mode="edit"
          initial={editCastTarget}
          onSubmit={handleUpdateCast}
        />
      )}

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <BookOpen className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 프로그램 북</span>
              <div className="flex items-center gap-1.5 ml-1">
                {totalItems > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {totalItems}개 프로그램
                  </span>
                )}
                {totalDuration && (
                  <span className="text-[10px] text-muted-foreground">
                    · {totalDuration}
                  </span>
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 공연 정보 설정 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowInfoDialogOpen(true);
                setOpen(true);
              }}
              title="공연 정보 설정"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>

            {/* 추가 버튼 */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                if (activeTab === "program") {
                  setAddItemDialogOpen(true);
                } else {
                  setAddCastDialogOpen(true);
                }
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              {activeTab === "program" ? "프로그램 추가" : "출연진 추가"}
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg bg-card">
            {/* 공연 정보 영역 */}
            {hasShowInfo ? (
              <div className="flex items-start justify-between px-3 py-2.5 border-b">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {data!.showTitle}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {data!.showDate && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(data!.showDate)}
                        </span>
                      </div>
                    )}
                    {data!.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          {data!.venue}
                        </span>
                      </div>
                    )}
                  </div>
                  {data!.notes && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {data!.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 flex-shrink-0 ml-2"
                  onClick={() => setShowInfoDialogOpen(true)}
                  title="공연 정보 편집"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="px-3 py-2.5 border-b">
                <button
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setShowInfoDialogOpen(true);
                    setOpen(true);
                  }}
                >
                  <Settings className="h-3 w-3" />
                  공연 정보를 설정하세요 (제목, 날짜, 장소)
                </button>
              </div>
            )}

            {/* 탭 */}
            <div className="flex border-b">
              <button
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "program"
                    ? "border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("program")}
              >
                <AlignLeft className="h-3 w-3" />
                프로그램 순서
                {totalItems > 0 && (
                  <span className="ml-0.5 text-[10px] text-muted-foreground">
                    ({totalItems})
                  </span>
                )}
              </button>
              <button
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === "cast"
                    ? "border-pink-500 text-pink-600 dark:text-pink-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("cast")}
              >
                <Star className="h-3 w-3" />
                출연진 소개
                {totalCast > 0 && (
                  <span className="ml-0.5 text-[10px] text-muted-foreground">
                    ({totalCast})
                  </span>
                )}
              </button>
            </div>

            {/* 프로그램 순서 탭 */}
            {activeTab === "program" && (
              <>
                {sortedItems.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <AlignLeft className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">등록된 프로그램이 없습니다.</p>
                    <p className="text-[11px] mt-0.5 mb-3">
                      공연 순서를 추가해 프로그램 북을 구성하세요.
                    </p>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setAddItemDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      프로그램 추가
                    </Button>
                  </div>
                ) : (
                  <div className="px-3">
                    {sortedItems.map((item, idx) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        isFirst={idx === 0}
                        isLast={idx === sortedItems.length - 1}
                        onMoveUp={() => reorderItems(item.id, "up")}
                        onMoveDown={() => reorderItems(item.id, "down")}
                        onEdit={() => setEditItemTarget(item)}
                        onDelete={() => handleDeleteItem(item.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 출연진 소개 탭 */}
            {activeTab === "cast" && (
              <>
                {(data?.cast ?? []).length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="h-7 w-7 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">등록된 출연진이 없습니다.</p>
                    <p className="text-[11px] mt-0.5 mb-3">
                      출연진 소개를 추가해 관객에게 알려주세요.
                    </p>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setAddCastDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      출연진 추가
                    </Button>
                  </div>
                ) : (
                  <div className="px-3">
                    {data!.cast.map((c) => (
                      <CastRow
                        key={c.id}
                        cast={c}
                        onEdit={() => setEditCastTarget(c)}
                        onDelete={() => handleDeleteCast(c.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
