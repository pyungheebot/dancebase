"use client";

import { useState } from "react";
import {
  BookOpen,
  Pin,
  PinOff,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupWiki, type WikiDocumentInput } from "@/hooks/use-group-wiki";
import { useAuth } from "@/hooks/use-auth";
import type { WikiCategory, WikiDocument } from "@/types";

// ============================================
// 카테고리 레이블 / 색상
// ============================================

const CATEGORY_LABELS: Record<WikiCategory, string> = {
  general: "일반 정보",
  practice_guide: "연습 가이드",
  rules: "규칙/매너",
  faq: "자주 묻는 질문",
};

const CATEGORY_COLORS: Record<WikiCategory, string> = {
  general: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  practice_guide:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rules:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  faq: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

// ============================================
// 날짜 포맷
// ============================================

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ============================================
// 문서 폼 (작성/수정 공용)
// ============================================

const DEFAULT_FORM: WikiDocumentInput = {
  title: "",
  content: "",
  category: "general",
};

interface WikiFormProps {
  initial?: WikiDocumentInput;
  onSubmit: (input: WikiDocumentInput) => boolean;
  onCancel: () => void;
  submitLabel: string;
}

function WikiForm({ initial, onSubmit, onCancel, submitLabel }: WikiFormProps) {
  const [form, setForm] = useState<WikiDocumentInput>(
    initial ?? DEFAULT_FORM
  );

  const handleSubmit = () => {
    onSubmit(form);
  };

  const isValid = form.title.trim().length > 0 && form.content.trim().length > 0;

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
      {/* 제목 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="문서 제목을 입력하세요"
          className="h-7 text-xs"
          maxLength={100}
        />
      </div>

      {/* 카테고리 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          카테고리
        </Label>
        <Select
          value={form.category}
          onValueChange={(v) =>
            setForm((prev) => ({ ...prev, category: v as WikiCategory }))
          }
        >
          <SelectTrigger size="sm" className="h-7 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CATEGORY_LABELS) as WikiCategory[]).map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 내용 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          내용 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={form.content}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, content: e.target.value }))
          }
          placeholder="문서 내용을 입력하세요"
          className="text-xs min-h-[120px] resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          {submitLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 문서 카드 (목록용)
// ============================================

interface WikiDocumentCardProps {
  doc: WikiDocument;
  onClick: () => void;
  onTogglePin: () => void;
}

function WikiDocumentCard({ doc, onClick, onTogglePin }: WikiDocumentCardProps) {
  const preview =
    doc.content.length > 80 ? doc.content.slice(0, 80) + "..." : doc.content;

  return (
    <div className="group rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
      <div className="p-3" onClick={onClick}>
        {/* 헤더 행 */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {doc.pinned && (
              <Pin className="h-3 w-3 text-amber-500 shrink-0" />
            )}
            <span
              className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${CATEGORY_COLORS[doc.category]}`}
            >
              {CATEGORY_LABELS[doc.category]}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDate(doc.updatedAt)}
          </span>
        </div>

        {/* 제목 */}
        <p className="text-xs font-semibold leading-snug mb-1 line-clamp-1">
          {doc.title}
        </p>

        {/* 내용 미리보기 */}
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {preview}
        </p>
      </div>

      {/* 핀 토글 버튼 */}
      <div
        className="px-3 pb-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-[10px] gap-0.5 text-muted-foreground hover:text-amber-500"
        >
          {doc.pinned ? (
            <>
              <PinOff className="h-3 w-3" />
              고정 해제
            </>
          ) : (
            <>
              <Pin className="h-3 w-3" />
              고정
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 문서 상세 뷰
// ============================================

interface WikiDocumentDetailProps {
  doc: WikiDocument;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function WikiDocumentDetail({
  doc,
  onBack,
  onEdit,
  onDelete,
  onTogglePin,
}: WikiDocumentDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 상단 네비게이션 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 px-1.5"
          onClick={onBack}
        >
          <ArrowLeft className="h-3 w-3" />
          목록
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-0.5 px-1.5 text-muted-foreground hover:text-amber-500"
          onClick={onTogglePin}
        >
          {doc.pinned ? (
            <>
              <PinOff className="h-3 w-3" />
              고정 해제
            </>
          ) : (
            <>
              <Pin className="h-3 w-3" />
              고정
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-0.5 px-1.5 text-muted-foreground hover:text-blue-500"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
          수정
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs gap-0.5 px-1.5 ${
            confirmDelete
              ? "text-destructive bg-destructive/10"
              : "text-muted-foreground hover:text-destructive"
          }`}
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
        >
          <Trash2 className="h-3 w-3" />
          {confirmDelete ? "확인" : "삭제"}
        </Button>
      </div>

      {/* 문서 내용 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 카테고리 + 날짜 */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[doc.category]}`}
          >
            {CATEGORY_LABELS[doc.category]}
          </span>
          {doc.pinned && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
              <Pin className="h-3 w-3" />
              고정됨
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {formatDate(doc.updatedAt)} 수정
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-sm font-bold leading-snug mb-3">{doc.title}</h3>

        {/* 내용 */}
        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {doc.content}
        </p>
      </div>
    </div>
  );
}

// ============================================
// 메인 패널
// ============================================

interface GroupWikiPanelProps {
  groupId: string;
  canEdit?: boolean;
}

export function GroupWikiPanel({
  groupId,
  canEdit = true,
}: GroupWikiPanelProps) {
  const { user } = useAuth();
  const {
    filteredDocuments,
    pinnedDocuments,
    unpinnedDocuments,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addDocument,
    updateDocument,
    deleteDocument,
    togglePin,
    totalCount,
    maxReached,
  } = useGroupWiki(groupId);

  // 뷰 상태: list | detail | create | edit
  const [view, setView] = useState<"list" | "detail" | "create" | "edit">("list");
  const [selectedDoc, setSelectedDoc] = useState<WikiDocument | null>(null);

  const handleDocumentClick = (doc: WikiDocument) => {
    setSelectedDoc(doc);
    setView("detail");
  };

  const handleAddSubmit = (input: WikiDocumentInput): boolean => {
    const ok = addDocument(input, user?.id ?? "unknown");
    if (ok) setView("list");
    return ok;
  };

  const handleEditSubmit = (input: WikiDocumentInput): boolean => {
    if (!selectedDoc) return false;
    const ok = updateDocument(selectedDoc.id, input);
    if (ok) {
      setView("detail");
    }
    return ok;
  };

  const handleDelete = () => {
    if (!selectedDoc) return;
    deleteDocument(selectedDoc.id);
    setSelectedDoc(null);
    setView("list");
  };

  const handleTogglePin = (doc: WikiDocument) => {
    togglePin(doc.id);
    // selectedDoc 상태 동기화
    if (selectedDoc?.id === doc.id) {
      setSelectedDoc((prev) => prev ? { ...prev, pinned: !prev.pinned } : null);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      // 시트 닫힐 때 상태 초기화
      setView("list");
      setSelectedDoc(null);
    }
  };

  // 현재 뷰 렌더링
  const renderContent = () => {
    // 문서 작성
    if (view === "create") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-4 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-1.5"
              onClick={() => setView("list")}
            >
              <ArrowLeft className="h-3 w-3" />
              목록
            </Button>
            <span className="text-xs font-semibold">새 문서 작성</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <WikiForm
              onSubmit={handleAddSubmit}
              onCancel={() => setView("list")}
              submitLabel="작성 완료"
            />
          </div>
        </div>
      );
    }

    // 문서 수정
    if (view === "edit" && selectedDoc) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-4 py-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-1.5"
              onClick={() => setView("detail")}
            >
              <ArrowLeft className="h-3 w-3" />
              돌아가기
            </Button>
            <span className="text-xs font-semibold">문서 수정</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <WikiForm
              initial={{
                title: selectedDoc.title,
                content: selectedDoc.content,
                category: selectedDoc.category,
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setView("detail")}
              submitLabel="수정 완료"
            />
          </div>
        </div>
      );
    }

    // 문서 상세
    if (view === "detail" && selectedDoc) {
      return (
        <WikiDocumentDetail
          doc={selectedDoc}
          onBack={() => {
            setView("list");
            setSelectedDoc(null);
          }}
          onEdit={() => setView("edit")}
          onDelete={handleDelete}
          onTogglePin={() => handleTogglePin(selectedDoc)}
        />
      );
    }

    // 문서 목록 (기본)
    return (
      <div className="flex flex-col h-full">
        {/* 검색 + 필터 */}
        <div className="px-4 py-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목 또는 내용 검색..."
              className="h-7 text-xs pl-7"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={categoryFilter}
              onValueChange={(v) =>
                setCategoryFilter(v as WikiCategory | "all")
              }
            >
              <SelectTrigger size="sm" className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  전체 카테고리
                </SelectItem>
                {(Object.keys(CATEGORY_LABELS) as WikiCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canEdit && (
              <Button
                size="sm"
                className="h-7 text-xs gap-0.5 shrink-0"
                onClick={() => setView("create")}
                disabled={maxReached}
                title={maxReached ? "최대 50개 문서 제한" : undefined}
              >
                <Plus className="h-3 w-3" />
                작성
              </Button>
            )}
          </div>
        </div>

        {/* 문서 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              {totalCount === 0 ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground">
                    첫 번째 위키 문서를 작성해보세요
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    그룹에 대한 유용한 정보를 문서로 정리해보세요.
                  </p>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs mt-1 gap-0.5"
                      onClick={() => setView("create")}
                    >
                      <Plus className="h-3 w-3" />
                      첫 문서 작성하기
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  검색 결과가 없습니다
                </p>
              )}
            </div>
          ) : (
            <>
              {/* 고정 문서 섹션 */}
              {pinnedDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Pin className="h-3 w-3 text-amber-500" />
                    고정된 문서
                  </p>
                  {pinnedDocuments.map((doc) => (
                    <WikiDocumentCard
                      key={doc.id}
                      doc={doc}
                      onClick={() => handleDocumentClick(doc)}
                      onTogglePin={() => handleTogglePin(doc)}
                    />
                  ))}
                </div>
              )}

              {/* 일반 문서 섹션 */}
              {unpinnedDocuments.length > 0 && (
                <div className="space-y-2">
                  {pinnedDocuments.length > 0 && (
                    <p className="text-[10px] text-muted-foreground font-medium mt-3">
                      최근 수정
                    </p>
                  )}
                  {unpinnedDocuments.map((doc) => (
                    <WikiDocumentCard
                      key={doc.id}
                      doc={doc}
                      onClick={() => handleDocumentClick(doc)}
                      onTogglePin={() => handleTogglePin(doc)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 문서 수 표시 */}
        {totalCount > 0 && (
          <div className="px-4 py-2 border-t text-[10px] text-muted-foreground text-right">
            {totalCount} / 50개
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
        >
          <BookOpen className="h-3 w-3" />
          위키
          {totalCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 min-w-4 bg-muted text-muted-foreground border border-border">
              {totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            그룹 위키
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </SheetContent>
    </Sheet>
  );
}
