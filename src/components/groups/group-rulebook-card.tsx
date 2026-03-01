"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  ChevronDown as ExpandIcon,
  ChevronRight as CollapseIcon,
  AlertTriangle,
  Tag,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useGroupRulebook } from "@/hooks/use-group-rulebook";
import { type GroupRuleSection } from "@/types";

// ============================================
// 섹션 폼 상태
// ============================================

type SectionFormState = {
  title: string;
  content: string;
  isImportant: boolean;
};

const DEFAULT_FORM: SectionFormState = {
  title: "",
  content: "",
  isImportant: false,
};

// ============================================
// 섹션 아이템 컴포넌트
// ============================================

function SectionItem({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  section: GroupRuleSection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: (section: GroupRuleSection) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <div
      className={`rounded-lg border bg-white ${
        section.isImportant
          ? "border-amber-300 bg-amber-50"
          : "border-gray-200"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        {/* 접기/펼치기 버튼 */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          {expanded ? (
            <ExpandIcon className="h-3.5 w-3.5" />
          ) : (
            <CollapseIcon className="h-3.5 w-3.5" />
          )}
        </button>

        {/* 중요 마크 */}
        {section.isImportant && (
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
        )}

        {/* 제목 */}
        <span
          className={`flex-1 cursor-pointer text-sm font-medium ${
            section.isImportant ? "text-amber-800" : "text-gray-800"
          }`}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {section.title}
        </span>

        {/* 중요 배지 */}
        {section.isImportant && (
          <Badge className="h-4 bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-700">
            중요
          </Badge>
        )}

        {/* 조작 버튼 */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            onClick={onMoveUp}
            disabled={isFirst}
            title="위로 이동"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            onClick={onMoveDown}
            disabled={isLast}
            title="아래로 이동"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
            onClick={() => onEdit(section)}
            title="편집"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
            title="삭제"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="섹션 삭제"
            description={`"${section.title}" 섹션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            onConfirm={() => onDelete(section.id)}
            destructive
          />
        </div>
      </div>

      {/* 펼쳐진 내용 */}
      {expanded && (
        <div
          className={`border-t px-3 py-2 ${
            section.isImportant ? "border-amber-200" : "border-gray-100"
          }`}
        >
          {section.content ? (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-600">
              {section.content}
            </p>
          ) : (
            <p className="text-xs italic text-gray-400">내용 없음</p>
          )}
          {section.lastEditedBy && (
            <p className="mt-1.5 text-[10px] text-gray-400">
              최종 편집: {section.lastEditedBy}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 섹션 추가/수정 다이얼로그
// ============================================

function SectionFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData: SectionFormState;
  onSubmit: (form: SectionFormState) => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<SectionFormState>(initialData);

  // open이 바뀔 때 폼 초기화
  const handleOpenChange = (v: boolean) => {
    if (v) setForm(initialData);
    onOpenChange(v);
  };

  const handleSubmit = () => {
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "규정 섹션 추가" : "규정 섹션 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="rule-title" className="text-xs font-medium">
              섹션 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rule-title"
              placeholder="예: 출석 규정, 회비 납부 규칙"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor="rule-content" className="text-xs font-medium">
              내용
            </Label>
            <Textarea
              id="rule-content"
              placeholder="규정 내용을 상세히 입력하세요"
              value={form.content}
              onChange={(e) =>
                setForm((p) => ({ ...p, content: e.target.value }))
              }
              className="min-h-[100px] resize-none text-sm"
            />
          </div>

          {/* 중요 여부 */}
          <div className="flex items-center gap-2">
            <input
              id="rule-important"
              type="checkbox"
              checked={form.isImportant}
              onChange={(e) =>
                setForm((p) => ({ ...p, isImportant: e.target.checked }))
              }
              className="h-3.5 w-3.5 rounded border-gray-300 accent-amber-500"
            />
            <Label
              htmlFor="rule-important"
              className="cursor-pointer text-xs text-gray-700"
            >
              중요 규정으로 표시 (강조 표시됨)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.title.trim()}
          >
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 버전/시행일 편집 다이얼로그
// ============================================

function MetaEditDialog({
  open,
  onOpenChange,
  version,
  effectiveDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  version: string;
  effectiveDate: string | null;
  onSave: (version: string, effectiveDate: string | null) => void;
}) {
  const [editVersion, setEditVersion] = useState(version);
  const [editDate, setEditDate] = useState(effectiveDate ?? "");

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setEditVersion(version);
      setEditDate(effectiveDate ?? "");
    }
    onOpenChange(v);
  };

  const handleSave = () => {
    onSave(editVersion, editDate || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>버전/시행일 편집</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="rulebook-version" className="text-xs font-medium">
              버전
            </Label>
            <Input
              id="rulebook-version"
              placeholder="예: v1.0, 2026년 개정판"
              value={editVersion}
              onChange={(e) => setEditVersion(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rulebook-date" className="text-xs font-medium">
              시행일
            </Label>
            <Input
              id="rulebook-date"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function GroupRulebookCard({ groupId }: { groupId: string }) {
  const {
    sections,
    version,
    effectiveDate,
    updatedAt,
    loading,
    totalSections,
    importantCount,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    setVersion,
    setEffectiveDate,
    isFirst,
    isLast,
  } = useGroupRulebook(groupId);

  // 섹션 추가 다이얼로그 상태
  const [addOpen, setAddOpen] = useState(false);

  // 섹션 편집 다이얼로그 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupRuleSection | null>(null);

  // 버전/시행일 편집 다이얼로그 상태
  const [metaOpen, setMetaOpen] = useState(false);

  // 편집 다이얼로그 열기
  const handleOpenEdit = (section: GroupRuleSection) => {
    setEditTarget(section);
    setEditOpen(true);
  };

  // 섹션 추가 처리
  const handleAddSubmit = (form: SectionFormState) => {
    const ok = addSection(form.title, form.content, form.isImportant);
    if (ok) setAddOpen(false);
  };

  // 섹션 수정 처리
  const handleEditSubmit = (form: SectionFormState) => {
    if (!editTarget) return;
    updateSection(editTarget.id, {
      title: form.title,
      content: form.content,
      isImportant: form.isImportant,
    });
    setEditOpen(false);
    setEditTarget(null);
  };

  // 버전/시행일 저장 처리
  const handleMetaSave = (newVersion: string, newDate: string | null) => {
    if (newVersion !== version) setVersion(newVersion);
    if (newDate !== effectiveDate) setEffectiveDate(newDate);
  };

  // 업데이트 날짜 포맷
  const formattedUpdatedAt = updatedAt
    ? new Date(updatedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const formattedEffectiveDate = effectiveDate
    ? new Date(effectiveDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">
              그룹 규정집
            </span>
            {totalSections > 0 && (
              <Badge className="h-4 bg-indigo-100 px-1.5 py-0 text-[10px] font-medium text-indigo-700">
                {totalSections}개
              </Badge>
            )}
            {importantCount > 0 && (
              <Badge className="h-4 bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-700">
                중요 {importantCount}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3 w-3" />
            섹션 추가
          </Button>
        </div>

        {/* 버전/시행일 정보 */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">버전:</span>
            <span className="text-xs font-medium text-gray-700">{version}</span>
          </div>
          {formattedEffectiveDate && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">시행일:</span>
              <span className="text-xs font-medium text-gray-700">
                {formattedEffectiveDate}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-5 px-1.5 text-[10px] text-gray-400 hover:text-gray-600"
            onClick={() => setMetaOpen(true)}
          >
            편집
          </Button>
        </div>

        {/* 섹션 목록 */}
        <div className="p-4">
          {sections.length === 0 ? (
            // 빈 상태
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <BookOpen className="h-8 w-8 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">
                규정 섹션이 없습니다
              </p>
              <p className="text-xs text-gray-300">
                오른쪽 상단 버튼으로 첫 규정을 추가해보세요
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 h-7 gap-1 text-xs"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 섹션 추가하기
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  isFirst={isFirst(section.id)}
                  isLast={isLast(section.id)}
                  onMoveUp={() => reorderSections(section.id, "up")}
                  onMoveDown={() => reorderSections(section.id, "down")}
                  onEdit={handleOpenEdit}
                  onDelete={deleteSection}
                />
              ))}
            </div>
          )}
        </div>

        {/* 카드 푸터 */}
        {formattedUpdatedAt && (
          <div className="border-t border-gray-100 px-4 py-2">
            <p className="text-[10px] text-gray-400">
              마지막 수정: {formattedUpdatedAt}
            </p>
          </div>
        )}
      </div>

      {/* 섹션 추가 다이얼로그 */}
      <SectionFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialData={DEFAULT_FORM}
        onSubmit={handleAddSubmit}
        mode="add"
      />

      {/* 섹션 편집 다이얼로그 */}
      {editTarget && (
        <SectionFormDialog
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditTarget(null);
          }}
          initialData={{
            title: editTarget.title,
            content: editTarget.content,
            isImportant: editTarget.isImportant,
          }}
          onSubmit={handleEditSubmit}
          mode="edit"
        />
      )}

      {/* 버전/시행일 편집 다이얼로그 */}
      <MetaEditDialog
        open={metaOpen}
        onOpenChange={setMetaOpen}
        version={version}
        effectiveDate={effectiveDate}
        onSave={handleMetaSave}
      />
    </>
  );
}
