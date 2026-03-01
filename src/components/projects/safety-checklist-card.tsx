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
import { Progress } from "@/components/ui/progress";
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
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSafetyChecklist } from "@/hooks/use-safety-checklist";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  SafetyChecklistCategory,
  SafetyChecklistStatus,
  SafetyChecklistItem,
} from "@/types";

import { ItemFormDialog } from "./safety-checklist/item-form-dialog";
import { ItemRow } from "./safety-checklist/item-row";
import { ChecklistFilters } from "./safety-checklist/checklist-filters";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  DEFAULT_TEMPLATES,
  type ItemFormParams,
} from "./safety-checklist/types";

// ============================================================
// Props
// ============================================================

interface SafetyChecklistCardProps {
  groupId: string;
  projectId: string;
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function SafetyChecklistCard({
  groupId,
  projectId,
}: SafetyChecklistCardProps) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    updateStatus,
    deleteItem,
    resetAll,
    stats,
  } = useSafetyChecklist(groupId, projectId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SafetyChecklistItem | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const [filterCategory, setFilterCategory] =
    useState<SafetyChecklistCategory | "all">("all");
  const [filterStatus, setFilterStatus] =
    useState<SafetyChecklistStatus | "all">("all");
  const { pending: loadingTemplate, execute: executeTemplate } = useAsyncAction();

  // ----------------------------------------------------------------
  // 필터 & 그룹핑
  // ----------------------------------------------------------------

  const filteredItems = items.filter((item) => {
    const catMatch =
      filterCategory === "all" || item.category === filterCategory;
    const statusMatch =
      filterStatus === "all" || item.status === filterStatus;
    return catMatch && statusMatch;
  });

  const groupedItems = CATEGORIES.reduce<
    Record<SafetyChecklistCategory, SafetyChecklistItem[]>
  >(
    (acc, cat) => {
      acc[cat] = filteredItems.filter((i) => i.category === cat);
      return acc;
    },
    {} as Record<SafetyChecklistCategory, SafetyChecklistItem[]>
  );

  // ----------------------------------------------------------------
  // 핸들러
  // ----------------------------------------------------------------

  const handleAdd = (params: ItemFormParams) => {
    addItem(params);
    toast.success(TOAST.SAFETY_CHECKLIST.ITEM_ADDED);
  };

  const handleEdit = (params: ItemFormParams) => {
    if (!editItem) return;
    const ok = updateItem(editItem.id, params);
    if (ok) {
      toast.success(TOAST.SAFETY_CHECKLIST.ITEM_UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditItem(null);
  };

  const handleStatusChange = (
    itemId: string,
    status: SafetyChecklistStatus
  ) => {
    const ok = updateStatus(itemId, status);
    if (!ok) {
      toast.error(TOAST.STATUS_ERROR);
    }
  };

  const handleDelete = () => {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteItem(id);
    if (ok) {
      toast.success(TOAST.SAFETY_CHECKLIST.ITEM_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  const handleReset = () => {
    resetAll();
    toast.success(TOAST.SAFETY_CHECKLIST.ALL_RESET);
    setResetDialogOpen(false);
  };

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
        addItem({
          category: t.category,
          content: t.content,
          priority: t.priority,
        });
      });
      toast.success(`기본 템플릿 ${DEFAULT_TEMPLATES.length}개 항목을 불러왔습니다.`);
    });
  };

  // ----------------------------------------------------------------
  // 로딩 상태
  // ----------------------------------------------------------------

  if (loading) {
    return (
      <Card className="w-full" aria-busy="true" aria-label="공연 안전 체크리스트 불러오는 중">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
            공연 안전 체크리스트
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xs text-gray-400" role="status">
            불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  // ----------------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------------

  return (
    <>
      <Card className="w-full">
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          aria-label="공연 안전 체크리스트 섹션"
        >
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-expanded={open}
                  aria-controls="checklist-content"
                >
                  <ShieldCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    공연 안전 체크리스트
                  </CardTitle>
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div
                className="flex items-center gap-1"
                role="toolbar"
                aria-label="체크리스트 관리 도구"
              >
                {items.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleLoadTemplate}
                    disabled={loadingTemplate}
                    aria-busy={loadingTemplate}
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
                  aria-label="체크리스트 상태 초기화"
                >
                  <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
                  초기화
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddDialogOpen(true)}
                  aria-label="안전 체크리스트 항목 추가"
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  항목 추가
                </Button>
              </div>
            </div>

            {/* 진행률 */}
            {items.length > 0 && (
              <div className="mt-2 space-y-1" aria-label="체크리스트 진행률">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span aria-live="polite">
                    확인완료 {stats.checkedCount}/{stats.totalCount}
                    {stats.issueCount > 0 && (
                      <span className="text-red-500 ml-1.5">
                        (문제 {stats.issueCount}건)
                      </span>
                    )}
                    {stats.highPriorityPending > 0 && (
                      <span className="text-orange-500 ml-1.5">
                        높은우선순위 미확인 {stats.highPriorityPending}건
                      </span>
                    )}
                  </span>
                  <span className="font-semibold" aria-label={`진행률 ${stats.progressRate}퍼센트`}>
                    {stats.progressRate}%
                  </span>
                </div>
                <Progress
                  value={stats.progressRate}
                  className="h-1.5"
                  aria-label={`안전 체크리스트 진행률 ${stats.progressRate}%`}
                  aria-valuenow={stats.progressRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}
          </CardHeader>

          <CollapsibleContent id="checklist-content">
            <CardContent className="px-4 pb-3 space-y-3">

              {/* 필터 */}
              {items.length > 0 && (
                <ChecklistFilters
                  filterCategory={filterCategory}
                  filterStatus={filterStatus}
                  onFilterCategory={setFilterCategory}
                  onFilterStatus={setFilterStatus}
                  stats={stats}
                />
              )}

              {/* 항목 없음 */}
              {items.length === 0 && (
                <div
                  className="text-center py-6 text-xs text-gray-400 space-y-2"
                  role="status"
                  aria-label="등록된 안전 체크리스트 항목 없음"
                >
                  <ShieldCheck className="h-8 w-8 mx-auto text-gray-200" aria-hidden="true" />
                  <p>등록된 안전 체크리스트 항목이 없습니다.</p>
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

                  const catChecked = catItems.filter(
                    (i) => i.status === "checked"
                  ).length;
                  const catIssue = catItems.filter(
                    (i) => i.status === "issue"
                  ).length;

                  return (
                    <section
                      key={cat}
                      className="space-y-1.5"
                      aria-label={`${CATEGORY_LABELS[cat]} 카테고리`}
                    >
                      {/* 카테고리 헤더 */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[cat]}`}
                          aria-label={`카테고리: ${CATEGORY_LABELS[cat]}`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </Badge>
                        <span
                          className="text-[10px] text-gray-400"
                          aria-live="polite"
                        >
                          {catChecked}/{catItems.length} 확인
                          {catIssue > 0 && (
                            <span className="text-red-500 ml-1">
                              문제 {catIssue}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* 항목 목록 */}
                      <div
                        className="space-y-1 pl-1"
                        role="list"
                        aria-label={`${CATEGORY_LABELS[cat]} 항목 목록`}
                      >
                        {catItems.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onStatusChange={handleStatusChange}
                            onEdit={(i) => setEditItem(i)}
                            onDelete={(id) => deleteConfirm.request(id)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}

              {/* 필터 결과 없음 */}
              {items.length > 0 && filteredItems.length === 0 && (
                <div
                  className="text-center py-4 text-xs text-gray-400"
                  role="status"
                >
                  해당 조건에 맞는 항목이 없습니다.
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
        description="이 안전 체크리스트 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />

      {/* 초기화 확인 다이얼로그 */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="체크리스트 초기화"
        description="모든 항목의 확인 상태를 미확인으로 초기화하시겠습니까? 항목은 삭제되지 않으며 확인 기록만 초기화됩니다."
        onConfirm={handleReset}
      />

      {/* 템플릿 불러오기 확인 다이얼로그 */}
      <ConfirmDialog
        open={templateConfirmOpen}
        onOpenChange={(v) => !v && setTemplateConfirmOpen(false)}
        title="템플릿 불러오기"
        description="기존 항목이 있습니다. 템플릿 항목을 추가로 불러오시겠습니까?"
        onConfirm={() => {
          setTemplateConfirmOpen(false);
          doLoadTemplate();
        }}
      />
    </>
  );
}
