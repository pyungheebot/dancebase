"use client";

import { useState, useCallback } from "react";
import {
  BookMarked,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupGuidelines } from "@/hooks/use-group-guidelines";
import {
  GROUP_GUIDELINE_CATEGORIES,
  GROUP_GUIDELINE_MAX,
  type GroupGuidelineCategory,
  type GroupGuidelineItem,
} from "@/types";

// ============================================
// 카테고리 색상
// ============================================

const CATEGORY_COLORS: Record<
  GroupGuidelineCategory,
  { bg: string; text: string }
> = {
  출석: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  매너: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
  },
  연습: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  재무: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
  },
  기타: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
  },
};

// ============================================
// 규칙 추가 Dialog
// ============================================

interface AddGuidelineDialogProps {
  disabled: boolean;
  onAdd: (
    title: string,
    description: string,
    category: GroupGuidelineCategory
  ) => boolean;
}

function AddGuidelineDialog({ disabled, onAdd }: AddGuidelineDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupGuidelineCategory>("기타");

  const handleSubmit = () => {
    const ok = onAdd(title, description, category);
    if (ok) {
      setTitle("");
      setDescription("");
      setCategory("기타");
      setOpen(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTitle("");
      setDescription("");
      setCategory("기타");
    }
    setOpen(next);
  };

  const isValid = title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 text-xs gap-0.5 shrink-0"
          disabled={disabled}
          title={disabled ? `최대 ${GROUP_GUIDELINE_MAX}개 제한` : undefined}
        >
          <Plus className="h-3 w-3" />
          규칙 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 규칙 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="규칙 제목을 입력하세요"
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as GroupGuidelineCategory)}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_GUIDELINE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="규칙에 대한 상세 설명을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
              maxLength={300}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 규칙 단일 행
// ============================================

interface GuidelineRowProps {
  item: GroupGuidelineItem;
  globalIndex: number; // 전체 목록에서의 1-based 번호
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function GuidelineRow({
  item,
  globalIndex,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: GuidelineRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
  }, [confirmDelete, onDelete]);

  const descriptionPreview =
    item.description.length > 60
      ? item.description.slice(0, 60) + "..."
      : item.description;

  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
      {/* 순서 번호 */}
      <span className="text-[10px] text-muted-foreground font-mono w-4 mt-0.5 shrink-0 text-right">
        {globalIndex}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug truncate">{item.title}</p>
        {descriptionPreview && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {descriptionPreview}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onMoveUp}
          disabled={isFirst}
          title="위로 이동"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로 이동"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 ${
            confirmDelete
              ? "text-destructive bg-destructive/10"
              : "text-muted-foreground hover:text-destructive"
          }`}
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          title={confirmDelete ? "한 번 더 클릭하면 삭제됩니다" : "삭제"}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 메인 패널
// ============================================

interface GroupGuidelinesPanelProps {
  groupId: string;
  canEdit?: boolean;
}

export function GroupGuidelinesPanel({
  groupId,
  canEdit = true,
}: GroupGuidelinesPanelProps) {
  const {
    items,
    loading,
    totalCount,
    maxReached,
    addItem,
    removeItem,
    moveItem,
    groupedItems,
    isFirst,
    isLast,
  } = useGroupGuidelines(groupId);

  const [open, setOpen] = useState(false);

  const grouped = groupedItems();
  // 사용 중인 카테고리만, 정해진 순서대로 렌더링
  const activeCategories = GROUP_GUIDELINE_CATEGORIES.filter(
    (cat) => (grouped[cat]?.length ?? 0) > 0
  );

  // 전체 정렬된 items에서 globalIndex를 계산하기 위한 맵
  const globalIndexMap = new Map<string, number>();
  items.forEach((item, idx) => {
    globalIndexMap.set(item.id, idx + 1);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <BookMarked className="h-3 w-3" />
          그룹 규칙
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
        {/* 헤더 */}
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            그룹 규칙/가이드
          </SheetTitle>
        </SheetHeader>

        {/* 툴바 */}
        {canEdit && (
          <div className="px-4 py-2.5 border-b flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {totalCount} / {GROUP_GUIDELINE_MAX}개
            </p>
            <AddGuidelineDialog disabled={maxReached} onAdd={addItem} />
          </div>
        )}

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
          ) : totalCount === 0 ? (
            /* 빈 상태 */
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <ClipboardList className="h-9 w-9 text-muted-foreground/30" />
              <p className="text-xs font-medium text-muted-foreground">
                등록된 규칙이 없습니다
              </p>
              <p className="text-[11px] text-muted-foreground/70 max-w-[220px]">
                출석, 매너, 연습 등 그룹 운영에 필요한 규칙을 추가해보세요.
              </p>
              {canEdit && (
                <AddGuidelineDialog disabled={false} onAdd={addItem} />
              )}
            </div>
          ) : (
            /* 카테고리별 그룹핑 */
            <div className="space-y-5">
              {activeCategories.map((cat) => {
                const catItems = grouped[cat] ?? [];
                const colors = CATEGORY_COLORS[cat];

                return (
                  <section key={cat}>
                    {/* 카테고리 헤더 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}
                      >
                        {cat}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {catItems.length}개
                      </span>
                    </div>

                    {/* 해당 카테고리 규칙 목록 */}
                    <div className="space-y-1.5">
                      {catItems.map((item) => (
                        <GuidelineRow
                          key={item.id}
                          item={item}
                          globalIndex={globalIndexMap.get(item.id) ?? 0}
                          isFirst={isFirst(item.id)}
                          isLast={isLast(item.id)}
                          onMoveUp={() => moveItem(item.id, "up")}
                          onMoveDown={() => moveItem(item.id, "down")}
                          onDelete={() => removeItem(item.id)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        {totalCount > 0 && (
          <div className="px-4 py-2 border-t">
            <p className="text-[10px] text-muted-foreground text-center">
              화살표 버튼으로 순서를 변경할 수 있습니다
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
