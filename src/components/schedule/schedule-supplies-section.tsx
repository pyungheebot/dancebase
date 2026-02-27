"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Plus, Trash2, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";
import { useScheduleSupplies } from "@/hooks/use-schedule-supplies";

type ScheduleSuppliesSectionProps = {
  groupId: string;
  scheduleId: string;
};

export function ScheduleSuppliesSection({
  groupId,
  scheduleId,
}: ScheduleSuppliesSectionProps) {
  const {
    items,
    loading,
    addItem,
    removeItem,
    toggleItem,
    doneCount,
    totalCount,
    completionRate,
    isAtLimit,
    maxItems,
  } = useScheduleSupplies(groupId, scheduleId);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const allDone = totalCount > 0 && completionRate === 100;

  const handleOpenAdd = useCallback(() => {
    if (isAtLimit) {
      toast.error(`준비물은 최대 ${maxItems}개까지 추가할 수 있습니다`);
      return;
    }
    setAddOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [isAtLimit, maxItems]);

  const handleAdd = useCallback(() => {
    if (!newName.trim()) {
      toast.error("준비물 이름을 입력해주세요");
      return;
    }
    const success = addItem(newName, newAssignee);
    if (!success) {
      toast.error(`준비물은 최대 ${maxItems}개까지 추가할 수 있습니다`);
      return;
    }
    toast.success("준비물을 추가했습니다");
    setNewName("");
    setNewAssignee("");
    nameInputRef.current?.focus();
  }, [newName, newAssignee, addItem, maxItems]);

  const handleRemove = useCallback(
    (id: string, name: string) => {
      removeItem(id);
      toast.success(`"${name}" 항목을 삭제했습니다`);
    },
    [removeItem]
  );

  const handleToggle = useCallback(
    (id: string) => {
      toggleItem(id);
    },
    [toggleItem]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
      if (e.key === "Escape") {
        setAddOpen(false);
        setNewName("");
        setNewAssignee("");
      }
    },
    [handleAdd]
  );

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              준비물
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={
        allDone
          ? "border-green-200 bg-green-50/40 dark:bg-green-950/20 dark:border-green-800"
          : ""
      }
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          {/* 제목 + 준비율 배지 */}
          <div className="flex items-center gap-1.5">
            {allDone ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle
              className={`text-sm font-medium ${
                allDone ? "text-green-700 dark:text-green-400" : ""
              }`}
            >
              준비물
            </CardTitle>
            {totalCount > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ml-0.5 ${
                  allDone
                    ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {allDone ? (
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    전체 완료
                  </span>
                ) : (
                  `${doneCount}/${totalCount} 완료`
                )}
              </Badge>
            )}
          </div>

          {/* 항목 추가 버튼 */}
          {!isAtLimit && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2 gap-0.5"
              onClick={handleOpenAdd}
            >
              <Plus className="h-3 w-3" />
              추가
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-2">
        {/* 준비물 목록 */}
        {items.length > 0 && (
          <div className="space-y-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded border px-2 py-1.5 group transition-opacity ${
                  item.checked ? "opacity-60" : "opacity-100"
                } ${
                  allDone
                    ? "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-950/30"
                    : "bg-background"
                }`}
              >
                <Checkbox
                  id={`supply-${item.id}`}
                  checked={item.checked}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`supply-${item.id}`}
                    className={`text-xs cursor-pointer block truncate ${
                      item.checked
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {item.name}
                  </label>
                  {item.assignee && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-0.5">
                      <User className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{item.assignee}</span>
                    </span>
                  )}
                </div>
                <button
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemove(item.id, item.name)}
                  aria-label={`${item.name} 삭제`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 인라인 추가 폼 */}
        {addOpen && (
          <div className="rounded border p-2 space-y-2 bg-muted/30">
            <Input
              ref={nameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="준비물 이름 (예: 공연 의상)"
              className="h-7 text-xs"
            />
            <Input
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="담당자 (선택)"
              className="h-7 text-xs"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={handleAdd}
                disabled={!newName.trim()}
              >
                추가
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setAddOpen(false);
                  setNewName("");
                  setNewAssignee("");
                }}
              >
                닫기
              </Button>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {items.length === 0 && !addOpen && (
          <p className="text-[11px] text-muted-foreground">
            등록된 준비물이 없습니다 — 추가 버튼을 눌러 시작하세요
          </p>
        )}

        {/* 최대 개수 도달 안내 */}
        {isAtLimit && (
          <p className="text-[11px] text-muted-foreground">
            준비물은 최대 {maxItems}개까지 등록할 수 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
