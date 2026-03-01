"use client";

import { useState } from "react";
import { useProgramBookEditor } from "@/hooks/use-program-book-editor";
import type {
  ProgramBookItem,
  ProgramBookCast,
} from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Users,
  AlignLeft,
  Settings,
  Star,
  MapPin,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatYearMonthDay } from "@/lib/date-utils";

import {
  ShowInfoDialog,
  ItemDialog,
  CastDialog,
} from "./program-book-editor-dialogs";
import { ItemRow, CastRow } from "./program-book-editor-rows";

// ============================================================
// 탭 타입
// ============================================================

type ActiveTab = "program" | "cast";

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

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
  const [deleteItemConfirmId, setDeleteItemConfirmId] = useState<string | null>(null);
  const [deleteCastConfirmId, setDeleteCastConfirmId] = useState<string | null>(null);

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
      toast.success(TOAST.PROGRAM_BOOK_EDITOR.SHOW_INFO_SAVED);
    } else {
      toast.error(TOAST.PROGRAM_BOOK_EDITOR.SHOW_NAME_REQUIRED);
    }
  };

  const handleAddItem = (item: Omit<ProgramBookItem, "id" | "order">) => {
    addItem(item);
    toast.success(TOAST.PROGRAM_BOOK_EDITOR.PROGRAM_ADDED);
  };

  const handleUpdateItem = (item: Omit<ProgramBookItem, "id" | "order">) => {
    if (!editItemTarget) return;
    updateItem(editItemTarget.id, item);
    toast.success(TOAST.PROGRAM_BOOK_EDITOR.PROGRAM_UPDATED);
    setEditItemTarget(null);
  };

  const handleDeleteItem = () => {
    if (!deleteItemConfirmId) return;
    deleteItem(deleteItemConfirmId);
    toast.success(TOAST.PROGRAM_BOOK_EDITOR.PROGRAM_DELETED);
    setDeleteItemConfirmId(null);
  };

  const handleAddCast = (cast: Omit<ProgramBookCast, "id">) => {
    addCast(cast);
    toast.success(TOAST.PROGRAM_BOOK_EDITOR.CAST_ADDED);
  };

  const handleUpdateCast = (cast: Omit<ProgramBookCast, "id">) => {
    if (!editCastTarget) return;
    updateCast(editCastTarget.id, cast);
    toast.success(TOAST.PROGRAM_BOOK_EDITOR.CAST_UPDATED);
    setEditCastTarget(null);
  };

  const handleDeleteCast = () => {
    if (!deleteCastConfirmId) return;
    deleteCast(deleteCastConfirmId);
    toast.success(TOAST.PROGRAM_BOOK_EDITOR.CAST_DELETED);
    setDeleteCastConfirmId(null);
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
                          {formatYearMonthDay(data!.showDate)}
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
                        onDelete={() => setDeleteItemConfirmId(item.id)}
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
                        onDelete={() => setDeleteCastConfirmId(c.id)}
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
        open={deleteItemConfirmId !== null}
        onOpenChange={(v) => !v && setDeleteItemConfirmId(null)}
        title="프로그램 삭제"
        description="이 프로그램을 삭제하시겠습니까?"
        onConfirm={handleDeleteItem}
        destructive
      />
      <ConfirmDialog
        open={deleteCastConfirmId !== null}
        onOpenChange={(v) => !v && setDeleteCastConfirmId(null)}
        title="출연진 삭제"
        description="이 출연진을 삭제하시겠습니까?"
        onConfirm={handleDeleteCast}
        destructive
      />
    </>
  );
}
