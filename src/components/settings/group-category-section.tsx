"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutList, Trash2, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import type { BoardCategoryRow } from "@/types";

type GroupCategorySectionProps = {
  boardCategoryList: BoardCategoryRow[];
  newCategoryName: string;
  addingCategory: boolean;
  deletingCategoryId: string | null;
  onNewCategoryNameChange: (name: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: BoardCategoryRow) => void;
};

export function GroupCategorySection({
  boardCategoryList,
  newCategoryName,
  addingCategory,
  deletingCategoryId,
  onNewCategoryNameChange,
  onAddCategory,
  onDeleteCategory,
}: GroupCategorySectionProps) {
  const [categoryToDelete, setCategoryToDelete] = useState<BoardCategoryRow | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <LayoutList className="h-3.5 w-3.5" />
            게시판 카테고리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            카테고리가 없으면 기본 카테고리(공지사항, 잡담, 정보 등)를 사용합니다.
          </p>

          {boardCategoryList.length > 0 ? (
            <div className="space-y-1">
              {boardCategoryList.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md border bg-muted/30"
                >
                  <span className="text-xs font-medium">{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    disabled={deletingCategoryId === cat.id}
                    onClick={() => setCategoryToDelete(cat)}
                    aria-label="카테고리 삭제"
                  >
                    {deletingCategoryId === cat.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2 text-center">
              커스텀 카테고리가 없습니다
            </p>
          )}

          <div className="flex gap-1.5">
            <Input
              placeholder="새 카테고리 이름"
              value={newCategoryName}
              onChange={(e) => onNewCategoryNameChange(e.target.value)}
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !addingCategory) onAddCategory();
              }}
              maxLength={20}
            />
            <Button
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={onAddCategory}
              disabled={addingCategory || !newCategoryName.trim()}
            >
              {addingCategory ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 카테고리 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => { if (!open) setCategoryToDelete(null); }}
        title="카테고리 삭제"
        description={`"${categoryToDelete?.name}" 카테고리를 삭제하시겠습니까? 기존 게시글의 카테고리 값은 유지됩니다.`}
        onConfirm={() => { if (categoryToDelete) onDeleteCategory(categoryToDelete); setCategoryToDelete(null); }}
        destructive
      />
    </>
  );
}
