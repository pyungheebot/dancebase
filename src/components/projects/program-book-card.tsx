"use client";

import { useState } from "react";
import { useProgramBook } from "@/hooks/use-program-book";
import type { ProgramBookSection } from "@/types/localStorage/stage";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  List,
  CalendarDays,
  CheckCircle2,
  Eye,
  X,
  MapPin,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { InitBookDialog } from "./program-book/init-book-dialog";
import { SectionDialog } from "./program-book/section-dialog";
import { PreviewDialog } from "./program-book/preview-dialog";
import { SectionRow } from "./program-book/section-row";
import { formatShowDate } from "./program-book/types";
import type { ProgramSectionType } from "./program-book/types";

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      toast.success(TOAST.PROGRAM_BOOK.INFO_SAVED);
    } else {
      toast.error(TOAST.PROGRAM_BOOK.SHOW_NAME_REQUIRED);
    }
  };

  const handleAddSection = (
    type: ProgramSectionType,
    title: string,
    content: string
  ) => {
    if (!book) {
      toast.error(TOAST.PROGRAM_BOOK.SETUP_REQUIRED);
      return;
    }
    const ok = addSection(type, title, content);
    if (ok) {
      toast.success(TOAST.PROGRAM_BOOK.SECTION_ADDED);
    } else {
      toast.error(TOAST.PROGRAM_BOOK.SECTION_TITLE_REQUIRED);
    }
  };

  const handleUpdateSection = (
    type: ProgramSectionType,
    title: string,
    content: string
  ) => {
    if (!editTarget) return;
    updateSection(editTarget.id, { type, title, content });
    toast.success(TOAST.PROGRAM_BOOK.SECTION_UPDATED);
    setEditTarget(null);
  };

  const handleDeleteSection = () => {
    if (!deleteConfirmId) return;
    deleteSection(deleteConfirmId);
    toast.success(TOAST.PROGRAM_BOOK.SECTION_DELETED);
    setDeleteConfirmId(null);
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
            <button
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
              aria-expanded={open}
              aria-controls="program-book-body"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              )}
              <BookOpen className="h-4 w-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">공연 프로그램북</span>
              {totalSections > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground" aria-label={`${totalSections}개 섹션`}>
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
                aria-label={isComplete ? "완성됨" : "작성 중"}
              >
                <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
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
                aria-label="프로그램북 미리보기"
              >
                <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
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
              aria-label="섹션 추가"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              섹션 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent id="program-book-body">
          <div className="border border-t-0 rounded-b-lg bg-card">
            {/* 프로그램북 미초기화 상태 */}
            {!book && (
              <div
                className="text-center py-10 text-muted-foreground"
                role="region"
                aria-label="프로그램북 초기화 안내"
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-xs">프로그램북이 아직 생성되지 않았습니다.</p>
                <p className="text-[11px] mt-0.5 mb-3">
                  공연 기본 정보를 입력하여 프로그램북을 시작하세요.
                </p>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setInitDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  프로그램북 시작
                </Button>
              </div>
            )}

            {/* 프로그램북 정보 */}
            {book && (
              <>
                {/* 공연 기본 정보 */}
                <div className="flex items-start justify-between px-3 py-2.5 border-b">
                  <dl className="space-y-1">
                    <dt className="sr-only">공연명</dt>
                    <dd className="text-xs font-semibold">{book.showTitle}</dd>
                    <div className="flex items-center gap-3 flex-wrap">
                      {book.showDate && (
                        <>
                          <dt className="sr-only">공연 날짜</dt>
                          <dd className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <time
                              dateTime={book.showDate}
                              className="text-[11px] text-muted-foreground"
                            >
                              {formatShowDate(book.showDate)}
                            </time>
                          </dd>
                        </>
                      )}
                      {book.venue && (
                        <>
                          <dt className="sr-only">장소</dt>
                          <dd className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <span className="text-[11px] text-muted-foreground">
                              {book.venue}
                            </span>
                          </dd>
                        </>
                      )}
                    </div>
                  </dl>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 flex-shrink-0"
                    onClick={() => setInitDialogOpen(true)}
                    aria-label="기본 정보 편집"
                    title="기본 정보 편집"
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>

                {/* 섹션 목록 없음 */}
                {sortedSections.length === 0 && (
                  <div
                    className="text-center py-8 text-muted-foreground"
                    role="region"
                    aria-label="섹션 없음 안내"
                  >
                    <List className="h-6 w-6 mx-auto mb-1.5 opacity-30" aria-hidden="true" />
                    <p className="text-xs">등록된 섹션이 없습니다.</p>
                    <p className="text-[11px] mt-0.5">
                      &ldquo;섹션 추가&rdquo; 버튼으로 콘텐츠를 구성하세요.
                    </p>
                  </div>
                )}

                {/* 필수 섹션 안내 */}
                {!isComplete && sortedSections.length > 0 && (
                  <div
                    className="flex items-start gap-1.5 px-3 py-2 bg-yellow-50 dark:bg-yellow-950/20 border-b"
                    role="alert"
                    aria-live="polite"
                  >
                    <X className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400">
                      표지, 프로그램 목록, 출연자 소개 섹션이 모두 있어야 완성으로 표시됩니다.
                    </p>
                  </div>
                )}

                {/* 섹션 목록 */}
                {sortedSections.length > 0 && (
                  <div
                    className="px-3"
                    role="list"
                    aria-label="프로그램북 섹션 목록"
                  >
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
                        onDelete={() => setDeleteConfirmId(section.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
        title="섹션 삭제"
        description="이 섹션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDeleteSection}
        destructive
      />
    </>
  );
}
