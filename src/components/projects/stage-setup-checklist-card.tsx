"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  CheckCircle2,
  Circle,
  Clapperboard,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useStageSetupChecklist } from "@/hooks/use-stage-setup-checklist";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  StageSetupCategory,
  StageSetupChecklistItem,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CATEGORY_LABELS: Record<StageSetupCategory, string> = {
  sound: "음향",
  lighting: "조명",
  floor: "무대 바닥",
  props: "소품",
  costume: "의상",
  tech: "기술 장비",
};

const CATEGORY_COLORS: Record<StageSetupCategory, string> = {
  sound: "bg-blue-100 text-blue-700 border-blue-200",
  lighting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  floor: "bg-orange-100 text-orange-700 border-orange-200",
  props: "bg-purple-100 text-purple-700 border-purple-200",
  costume: "bg-pink-100 text-pink-700 border-pink-200",
  tech: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const CATEGORY_BAR_COLORS: Record<StageSetupCategory, string> = {
  sound: "bg-blue-500",
  lighting: "bg-yellow-500",
  floor: "bg-orange-500",
  props: "bg-purple-500",
  costume: "bg-pink-500",
  tech: "bg-cyan-500",
};

const CATEGORIES: StageSetupCategory[] = [
  "sound",
  "lighting",
  "floor",
  "props",
  "costume",
  "tech",
];

// ============================================================
// 기본 템플릿 항목
// ============================================================

const DEFAULT_TEMPLATES: Array<{
  category: StageSetupCategory;
  content: string;
}> = [
  // 음향
  { category: "sound", content: "메인 스피커 출력 레벨 확인" },
  { category: "sound", content: "마이크 음량 및 피드백 테스트" },
  { category: "sound", content: "음악 재생 장치 연결 확인" },
  { category: "sound", content: "모니터 스피커 위치 및 음량 조정" },
  // 조명
  { category: "lighting", content: "무대 조명 각도 및 색상 세팅" },
  { category: "lighting", content: "스팟라이트 포커스 조정" },
  { category: "lighting", content: "조명 큐 시퀀스 리허설" },
  { category: "lighting", content: "비상조명 작동 여부 확인" },
  // 무대 바닥
  { category: "floor", content: "댄스 플로어 고정 상태 확인" },
  { category: "floor", content: "무대 바닥 미끄럼 방지 처리 확인" },
  { category: "floor", content: "케이블 테이핑 처리 완료 여부" },
  { category: "floor", content: "무대 경계 마킹 확인" },
  // 소품
  { category: "props", content: "소품 목록 대조 및 위치 배치" },
  { category: "props", content: "소품 파손 여부 점검" },
  { category: "props", content: "소품 교체 동선 확인" },
  // 의상
  { category: "costume", content: "의상 착용 순서 확인" },
  { category: "costume", content: "의상 보관 및 대기 위치 지정" },
  { category: "costume", content: "예비 의상 준비 여부 확인" },
  // 기술 장비
  { category: "tech", content: "영상 출력 장비 연결 확인" },
  { category: "tech", content: "큐 시트 공유 및 장비 담당자 배치" },
  { category: "tech", content: "무선 기기 배터리 충전 상태 확인" },
];

// ============================================================
// 항목 추가/수정 폼 다이얼로그
// ============================================================

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    category: StageSetupCategory;
    content: string;
    assignee?: string;
    notes?: string;
  }) => void;
  editItem?: StageSetupChecklistItem | null;
}

function ItemFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: ItemFormDialogProps) {
  const [category, setCategory] = useState<StageSetupCategory>(
    editItem?.category ?? "sound"
  );
  const [content, setContent] = useState(editItem?.content ?? "");
  const [assignee, setAssignee] = useState(editItem?.assignee ?? "");
  const [notes, setNotes] = useState(editItem?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setCategory(editItem?.category ?? "sound");
      setContent(editItem?.content ?? "");
      setAssignee(editItem?.assignee ?? "");
      setNotes(editItem?.notes ?? "");
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("항목 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      onSubmit({
        category,
        content,
        assignee: assignee || undefined,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        handleOpen(v);
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editItem ? "항목 수정" : "항목 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as StageSetupCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 항목 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">
              항목 내용 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="확인할 무대 세팅 항목을 입력하세요"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs">담당자</Label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름 (선택)"
              className="h-8 text-xs"
            />
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모 (선택)"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {editItem ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 항목 행 컴포넌트
// ============================================================

interface ItemRowProps {
  item: StageSetupChecklistItem;
  onToggle: (itemId: string) => void;
  onEdit: (item: StageSetupChecklistItem) => void;
  onDelete: (itemId: string) => void;
}

function ItemRow({ item, onToggle, onEdit, onDelete }: ItemRowProps) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-colors ${
        item.completed
          ? "bg-green-50 border-green-100"
          : "bg-white border-gray-100"
      }`}
    >
      {/* 완료 토글 버튼 */}
      <button
        onClick={() => onToggle(item.id)}
        className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
        title={item.completed ? "완료 취소" : "완료 처리"}
      >
        {item.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <span
          className={`font-medium block ${
            item.completed ? "line-through text-gray-400" : ""
          }`}
        >
          {item.content}
        </span>

        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
          {item.assignee && (
            <span className="flex items-center gap-0.5">
              <User className="h-2.5 w-2.5" />
              {item.assignee}
            </span>
          )}
          {item.completedAt && item.completed && (
            <span className="flex items-center gap-0.5 text-green-600">
              <Clock className="h-2.5 w-2.5" />
              {new Date(item.completedAt).toLocaleString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {item.notes && (
            <span className="text-gray-400 italic truncate max-w-[200px]">
              {item.notes}
            </span>
          )}
        </div>
      </div>

      {/* 편집/삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 카테고리 완료율 바
// ============================================================

interface CategoryProgressBarProps {
  category: StageSetupCategory;
  completed: number;
  total: number;
  rate: number;
}

function CategoryProgressBar({
  category,
  completed,
  total,
  rate,
}: CategoryProgressBarProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center gap-2 text-[10px]">
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 w-16 justify-center flex-shrink-0 ${CATEGORY_COLORS[category]}`}
      >
        {CATEGORY_LABELS[category]}
      </Badge>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${CATEGORY_BAR_COLORS[category]}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-gray-500 w-12 text-right flex-shrink-0">
        {completed}/{total} ({rate}%)
      </span>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface StageSetupChecklistCardProps {
  groupId: string;
  projectId: string;
}

export function StageSetupChecklistCard({
  groupId,
  projectId,
}: StageSetupChecklistCardProps) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    toggleItem,
    deleteItem,
    resetAll,
    stats,
  } = useStageSetupChecklist(groupId, projectId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<StageSetupChecklistItem | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const { pending: loadingTemplate, execute: executeTemplate } = useAsyncAction();
  const [filterCategory, setFilterCategory] = useState<
    StageSetupCategory | "all"
  >("all");

  // 필터 적용
  const filteredItems = items.filter((item) => {
    return filterCategory === "all" || item.category === filterCategory;
  });

  // 카테고리별 그룹핑
  const groupedItems = CATEGORIES.reduce<
    Record<StageSetupCategory, StageSetupChecklistItem[]>
  >(
    (acc, cat) => {
      acc[cat] = filteredItems.filter((i) => i.category === cat);
      return acc;
    },
    {} as Record<StageSetupCategory, StageSetupChecklistItem[]>
  );

  // 항목 추가 핸들러
  const handleAdd = (params: {
    category: StageSetupCategory;
    content: string;
    assignee?: string;
    notes?: string;
  }) => {
    addItem(params);
    toast.success("항목이 추가되었습니다.");
  };

  // 항목 수정 핸들러
  const handleEdit = (params: {
    category: StageSetupCategory;
    content: string;
    assignee?: string;
    notes?: string;
  }) => {
    if (!editItem) return;
    const ok = updateItem(editItem.id, params);
    if (ok) {
      toast.success("항목이 수정되었습니다.");
    } else {
      toast.error("항목 수정에 실패했습니다.");
    }
    setEditItem(null);
  };

  // 완료 토글 핸들러
  const handleToggle = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    const ok = toggleItem(itemId);
    if (!ok) {
      toast.error("상태 변경에 실패했습니다.");
      return;
    }
    if (item && !item.completed) {
      toast.success("항목을 완료 처리했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteItem(id);
    if (ok) {
      toast.success("항목이 삭제되었습니다.");
    } else {
      toast.error("항목 삭제에 실패했습니다.");
    }
  };

  // 전체 초기화 핸들러
  const handleReset = () => {
    resetAll();
    toast.success("모든 항목이 미완료 상태로 초기화되었습니다.");
    setResetDialogOpen(false);
  };

  // 기본 템플릿 불러오기
  const handleLoadTemplate = () => {
    if (items.length > 0) {
      setTemplateConfirmOpen(true);
      return;
    }
    doLoadTemplate();
  };

  const doLoadTemplate = () => {
    executeTemplate(async () => {
      DEFAULT_TEMPLATES.forEach((t) => {
        addItem({ category: t.category, content: t.content });
      });
      toast.success(
        `기본 템플릿 ${DEFAULT_TEMPLATES.length}개 항목을 불러왔습니다.`
      );
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clapperboard className="h-4 w-4 text-indigo-500" />
            무대 세팅 체크리스트
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xs text-gray-400">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <Clapperboard className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    무대 세팅 체크리스트
                  </CardTitle>
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div className="flex items-center gap-1">
                {items.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleLoadTemplate}
                    disabled={loadingTemplate}
                  >
                    기본 템플릿
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-700"
                  onClick={() => setResetDialogOpen(true)}
                  disabled={items.length === 0}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  초기화
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  항목 추가
                </Button>
              </div>
            </div>

            {/* 전체 진행률 */}
            {items.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>
                    완료 {stats.completedCount}/{stats.totalCount}항목
                  </span>
                  <span className="font-semibold text-indigo-600">
                    {stats.progressRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${stats.progressRate}%` }}
                  />
                </div>
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* 통계 뱃지 */}
              {items.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    완료 {stats.completedCount}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"
                  >
                    <Circle className="h-2.5 w-2.5 mr-0.5" />
                    미완료 {stats.pendingCount}
                  </Badge>

                  {/* 카테고리 필터 */}
                  <div className="ml-auto">
                    <Select
                      value={filterCategory}
                      onValueChange={(v) =>
                        setFilterCategory(v as StageSetupCategory | "all")
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue placeholder="카테고리" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          전체 카테고리
                        </SelectItem>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {CATEGORY_LABELS[c]} ({stats.categoryStats[c].total})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 카테고리별 완료율 */}
              {items.length > 0 && filterCategory === "all" && (
                <div className="space-y-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium mb-1.5">
                    카테고리별 완료율
                  </p>
                  {CATEGORIES.map((cat) => (
                    <CategoryProgressBar
                      key={cat}
                      category={cat}
                      completed={stats.categoryStats[cat].completed}
                      total={stats.categoryStats[cat].total}
                      rate={stats.categoryStats[cat].rate}
                    />
                  ))}
                </div>
              )}

              {/* 항목 없음 */}
              {items.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400 space-y-2">
                  <Clapperboard className="h-8 w-8 mx-auto text-gray-200" />
                  <p>등록된 무대 세팅 체크리스트 항목이 없습니다.</p>
                  <p className="text-[10px]">
                    기본 템플릿을 불러오거나 직접 항목을 추가하세요.
                  </p>
                </div>
              )}

              {/* 카테고리별 항목 목록 */}
              {items.length > 0 &&
                CATEGORIES.map((cat) => {
                  const catItems = groupedItems[cat];
                  if (catItems.length === 0) return null;

                  const catCompleted = catItems.filter((i) => i.completed).length;

                  return (
                    <div key={cat} className="space-y-1.5">
                      {/* 카테고리 헤더 */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[cat]}`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {catCompleted}/{catItems.length} 완료
                        </span>
                      </div>

                      {/* 항목 목록 */}
                      <div className="space-y-1 pl-1">
                        {catItems.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onToggle={handleToggle}
                            onEdit={(i) => setEditItem(i)}
                            onDelete={(id) => deleteConfirm.request(id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* 필터 결과 없음 */}
              {items.length > 0 && filteredItems.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
                  해당 카테고리에 항목이 없습니다.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 항목 추가 다이얼로그 */}
      <ItemFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
      />

      {/* 항목 수정 다이얼로그 */}
      <ItemFormDialog
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        editItem={editItem}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="항목 삭제"
        description="이 무대 세팅 체크리스트 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />

      {/* 초기화 확인 다이얼로그 */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="체크리스트 초기화"
        description="모든 항목의 완료 상태를 초기화하시겠습니까? 항목은 삭제되지 않으며 완료 기록만 초기화됩니다."
        onConfirm={handleReset}
      />
      {/* 템플릿 불러오기 확인 다이얼로그 */}
      <ConfirmDialog
        open={templateConfirmOpen}
        onOpenChange={(v) => !v && setTemplateConfirmOpen(false)}
        title="템플릿 불러오기"
        description="기존 항목이 있습니다. 템플릿 항목을 추가로 불러오시겠습니까?"
        onConfirm={() => { setTemplateConfirmOpen(false); doLoadTemplate(); }}
      />
    </>
  );
}
