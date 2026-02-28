"use client";

import { useState } from "react";
import { useProgramBook } from "@/hooks/use-program-book";
import type { ProgramSectionType, ProgramBookSection } from "@/types";
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
  Plus,
  Trash2,
  Pencil,
  ChevronUp,
  Image,
  MessageCircle,
  List,
  Users,
  Handshake,
  FileText,
  Award,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// 유형 헬퍼
// ============================================================

const ALL_SECTION_TYPES: ProgramSectionType[] = [
  "cover",
  "greeting",
  "program_list",
  "performer_intro",
  "sponsor",
  "notes",
  "credits",
];

function sectionTypeLabel(type: ProgramSectionType): string {
  switch (type) {
    case "cover":
      return "표지";
    case "greeting":
      return "인사말";
    case "program_list":
      return "프로그램 목록";
    case "performer_intro":
      return "출연자 소개";
    case "sponsor":
      return "후원사";
    case "notes":
      return "안내사항";
    case "credits":
      return "크레딧";
  }
}

function SectionTypeIcon({
  type,
  className,
}: {
  type: ProgramSectionType;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (type) {
    case "cover":
      return <Image className={cls} />;
    case "greeting":
      return <MessageCircle className={cls} />;
    case "program_list":
      return <List className={cls} />;
    case "performer_intro":
      return <Users className={cls} />;
    case "sponsor":
      return <Handshake className={cls} />;
    case "notes":
      return <FileText className={cls} />;
    case "credits":
      return <Award className={cls} />;
  }
}

function sectionTypeBadgeClass(type: ProgramSectionType): string {
  switch (type) {
    case "cover":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "greeting":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "program_list":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800";
    case "performer_intro":
      return "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800";
    case "sponsor":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800";
    case "notes":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
    case "credits":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
  }
}

// ============================================================
// 날짜 포맷 헬퍼
// ============================================================

function formatShowDate(dateStr: string): string {
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
// 프로그램북 초기화 다이얼로그
// ============================================================

interface InitBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
  initialDate?: string;
  initialVenue?: string;
  onSubmit: (showTitle: string, showDate: string, venue: string) => void;
}

function InitBookDialog({
  open,
  onOpenChange,
  initialTitle = "",
  initialDate = "",
  initialVenue = "",
  onSubmit,
}: InitBookDialogProps) {
  const [showTitle, setShowTitle] = useState(initialTitle);
  const [showDate, setShowDate] = useState(initialDate);
  const [venue, setVenue] = useState(initialVenue);

  const resetForm = () => {
    setShowTitle(initialTitle);
    setShowDate(initialDate);
    setVenue(initialVenue);
  };

  const handleSubmit = () => {
    if (!showTitle.trim()) {
      toast.error("공연명을 입력해주세요.");
      return;
    }
    onSubmit(showTitle.trim(), showDate, venue.trim());
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            프로그램북 기본 정보
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
          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
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
// 섹션 추가/편집 다이얼로그
// ============================================================

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ProgramBookSection;
  onSubmit: (
    type: ProgramSectionType,
    title: string,
    content: string
  ) => void;
}

function SectionDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: SectionDialogProps) {
  const [type, setType] = useState<ProgramSectionType>(
    initial?.type ?? "program_list"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  const resetForm = () => {
    setType(initial?.type ?? "program_list");
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("섹션 제목을 입력해주세요.");
      return;
    }
    onSubmit(type, title.trim(), content);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "섹션 추가" : "섹션 편집"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">유형 *</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as ProgramSectionType);
                // 유형 변경 시 제목 자동 채우기 (비어있을 때만)
                if (!title.trim()) {
                  setTitle(sectionTypeLabel(v as ProgramSectionType));
                }
              }}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SECTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <SectionTypeIcon type={t} className="h-3 w-3" />
                      {sectionTypeLabel(t)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="섹션 제목을 입력하세요"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">내용</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="섹션 내용을 입력하세요"
              className="text-xs min-h-[96px] resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
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
// 미리보기 다이얼로그
// ============================================================

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTitle: string;
  showDate: string;
  venue: string;
  sections: ProgramBookSection[];
}

function PreviewDialog({
  open,
  onOpenChange,
  showTitle,
  showDate,
  venue,
  sections,
}: PreviewDialogProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" />
              프로그램북 미리보기
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* 표지 영역 */}
        <div className="border rounded-lg bg-gradient-to-b from-muted/60 to-muted/20 p-6 text-center space-y-1.5">
          <h2 className="text-base font-bold leading-tight">{showTitle}</h2>
          {showDate && (
            <p className="text-xs text-muted-foreground">
              {formatShowDate(showDate)}
            </p>
          )}
          {venue && (
            <p className="text-xs text-muted-foreground">{venue}</p>
          )}
        </div>

        {/* 섹션 목록 */}
        {sorted.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            등록된 섹션이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {sorted.map((section) => (
              <div key={section.id} className="border rounded-lg p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full border ${sectionTypeBadgeClass(section.type)}`}
                  >
                    <SectionTypeIcon type={section.type} className="h-2.5 w-2.5" />
                    {sectionTypeLabel(section.type)}
                  </span>
                  <span className="text-xs font-semibold">{section.title}</span>
                </div>
                {section.content && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 섹션 행
// ============================================================

interface SectionRowProps {
  section: ProgramBookSection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SectionRow({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: SectionRowProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-b-0">
      {/* 순서 번호 */}
      <span className="text-[10px] text-muted-foreground w-4 text-right flex-shrink-0 pt-0.5">
        {section.order}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full border ${sectionTypeBadgeClass(section.type)}`}
          >
            <SectionTypeIcon type={section.type} className="h-2.5 w-2.5" />
            {sectionTypeLabel(section.type)}
          </span>
          <span className="text-xs font-semibold truncate">{section.title}</span>
        </div>
        {section.content && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {section.content}
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
// 메인 카드 컴포넌트
// ============================================================

interface ProgramBookCardProps {
  groupId: string;
  projectId: string;
}

export function ProgramBookCard({ groupId, projectId }: ProgramBookCardProps) {
  const [open, setOpen] = useState(true);
  const [initDialogOpen, setInitDialogOpen] = useState(false);
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProgramBookSection | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    book,
    initBook,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    totalSections,
    isComplete,
  } = useProgramBook(groupId, projectId);

  const sortedSections = book
    ? [...book.sections].sort((a, b) => a.order - b.order)
    : [];

  // ─── 핸들러 ────────────────────────────────────────────────

  const handleInitBook = (
    showTitle: string,
    showDate: string,
    venue: string
  ) => {
    const ok = initBook(showTitle, showDate, venue);
    if (ok) {
      toast.success("프로그램북 기본 정보가 저장되었습니다.");
    } else {
      toast.error("공연명을 입력해주세요.");
    }
  };

  const handleAddSection = (
    type: ProgramSectionType,
    title: string,
    content: string
  ) => {
    if (!book) {
      toast.error("먼저 프로그램북 기본 정보를 입력해주세요.");
      return;
    }
    const ok = addSection(type, title, content);
    if (ok) {
      toast.success("섹션이 추가되었습니다.");
    } else {
      toast.error("섹션 제목을 입력해주세요.");
    }
  };

  const handleUpdateSection = (
    type: ProgramSectionType,
    title: string,
    content: string
  ) => {
    if (!editTarget) return;
    updateSection(editTarget.id, { type, title, content });
    toast.success("섹션이 수정되었습니다.");
    setEditTarget(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm("이 섹션을 삭제하시겠습니까?")) return;
    deleteSection(sectionId);
    toast.success("섹션이 삭제되었습니다.");
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    moveSection(sectionId, direction);
  };

  return (
    <>
      {/* 프로그램북 초기화 다이얼로그 */}
      <InitBookDialog
        open={initDialogOpen}
        onOpenChange={setInitDialogOpen}
        initialTitle={book?.showTitle ?? ""}
        initialDate={book?.showDate ?? ""}
        initialVenue={book?.venue ?? ""}
        onSubmit={handleInitBook}
      />

      {/* 섹션 추가 다이얼로그 */}
      <SectionDialog
        open={addSectionDialogOpen}
        onOpenChange={setAddSectionDialogOpen}
        mode="add"
        onSubmit={handleAddSection}
      />

      {/* 섹션 편집 다이얼로그 */}
      {editTarget && (
        <SectionDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          mode="edit"
          initial={editTarget}
          onSubmit={handleUpdateSection}
        />
      )}

      {/* 미리보기 다이얼로그 */}
      {book && (
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          showTitle={book.showTitle}
          showDate={book.showDate}
          venue={book.venue}
          sections={book.sections}
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
              <span className="text-sm font-semibold">공연 프로그램북</span>
              {totalSections > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {totalSections}개 섹션
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 완성도 배지 */}
            {book && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 gap-0.5 hidden sm:flex ${
                  isComplete
                    ? "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700"
                    : "text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700"
                }`}
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {isComplete ? "완성" : "작성중"}
              </Badge>
            )}

            {/* 미리보기 버튼 */}
            {book && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setPreviewOpen(true);
                  setOpen(true);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                미리보기
              </Button>
            )}

            {/* 섹션 추가 버튼 */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                if (!book) {
                  setInitDialogOpen(true);
                } else {
                  setAddSectionDialogOpen(true);
                }
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              섹션 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg bg-card">
            {/* 프로그램북 미초기화 상태 */}
            {!book && (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">프로그램북이 아직 생성되지 않았습니다.</p>
                <p className="text-[11px] mt-0.5 mb-3">
                  공연 기본 정보를 입력하여 프로그램북을 시작하세요.
                </p>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setInitDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  프로그램북 시작
                </Button>
              </div>
            )}

            {/* 프로그램북 정보 */}
            {book && (
              <>
                {/* 공연 기본 정보 */}
                <div className="flex items-start justify-between px-3 py-2.5 border-b">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">{book.showTitle}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {book.showDate && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            {formatShowDate(book.showDate)}
                          </span>
                        </div>
                      )}
                      {book.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            {book.venue}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 flex-shrink-0"
                    onClick={() => setInitDialogOpen(true)}
                    title="기본 정보 편집"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>

                {/* 섹션 목록 없음 */}
                {sortedSections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <List className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs">등록된 섹션이 없습니다.</p>
                    <p className="text-[11px] mt-0.5">
                      &ldquo;섹션 추가&rdquo; 버튼으로 콘텐츠를 구성하세요.
                    </p>
                  </div>
                )}

                {/* 필수 섹션 안내 */}
                {!isComplete && sortedSections.length > 0 && (
                  <div className="flex items-start gap-1.5 px-3 py-2 bg-yellow-50 dark:bg-yellow-950/20 border-b">
                    <X className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400">
                      표지, 프로그램 목록, 출연자 소개 섹션이 모두 있어야 완성으로 표시됩니다.
                    </p>
                  </div>
                )}

                {/* 섹션 목록 */}
                {sortedSections.length > 0 && (
                  <div className="px-3">
                    {sortedSections.map((section, idx) => (
                      <SectionRow
                        key={section.id}
                        section={section}
                        isFirst={idx === 0}
                        isLast={idx === sortedSections.length - 1}
                        onMoveUp={() => handleMoveSection(section.id, "up")}
                        onMoveDown={() =>
                          handleMoveSection(section.id, "down")
                        }
                        onEdit={() => setEditTarget(section)}
                        onDelete={() => handleDeleteSection(section.id)}
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
