"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Plus,
  X,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useScheduleChecklist } from "@/hooks/use-schedule-checklist";

type ScheduleChecklistWidgetProps = {
  scheduleId: string;
};

export function ScheduleChecklistWidget({
  scheduleId,
}: ScheduleChecklistWidgetProps) {
  const {
    items,
    loading,
    addItem,
    removeItem,
    toggleItem,
    clearAll,
    restoreDefaults,
    doneCount,
    totalCount,
    completionRate,
  } = useScheduleChecklist(scheduleId);

  const [open, setOpen] = useState(true);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newText.trim()) {
      toast.error("항목명을 입력해주세요");
      return;
    }
    addItem(newText);
    setNewText("");
    toast.success("항목을 추가했습니다");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (id: string) => {
    toggleItem(id);
  };

  const handleRemove = (id: string, text: string) => {
    removeItem(id);
    toast.success(`"${text}" 항목을 삭제했습니다`);
  };

  const handleClearAll = () => {
    clearAll();
    toast.success("체크리스트를 초기화했습니다");
  };

  const handleRestoreDefaults = () => {
    restoreDefaults();
    toast.success("기본 항목을 복원했습니다");
  };

  const isAllDone = totalCount > 0 && completionRate === 100;

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">준비 체크리스트</span>
                {!loading && totalCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isAllDone
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {isAllDone ? "완료" : `${doneCount}/${totalCount}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* 완료율 프로그레스 바 */}
            {!loading && totalCount > 0 && (
              <div className="space-y-1">
                <Progress
                  value={completionRate}
                  className={`h-1.5 ${
                    isAllDone
                      ? "[&>[data-slot=progress-indicator]]:bg-green-500"
                      : "[&>[data-slot=progress-indicator]]:bg-yellow-500"
                  }`}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {completionRate}% 완료
                </p>
              </div>
            )}

            {/* 로딩 상태 */}
            {loading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-7 bg-muted animate-pulse rounded" />
                ))}
              </div>
            )}

            {/* 체크리스트 항목 목록 */}
            {!loading && items.length > 0 && (
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 group/item hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      id={`widget-check-${item.id}`}
                      checked={item.checked}
                      onCheckedChange={() => handleToggle(item.id)}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    <label
                      htmlFor={`widget-check-${item.id}`}
                      className={`text-xs flex-1 min-w-0 cursor-pointer truncate leading-relaxed ${
                        item.checked
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.text}
                    </label>
                    <button
                      onClick={() => handleRemove(item.id, item.text)}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/item:opacity-100"
                      aria-label={`${item.text} 삭제`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 항목 없음 */}
            {!loading && items.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-1">
                항목이 없습니다. 아래에서 추가하거나 기본 항목을 복원하세요.
              </p>
            )}

            {/* 항목 추가 입력칸 */}
            <div className="flex gap-1.5">
              <Input
                ref={inputRef}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="항목 추가 (Enter로 추가)"
                className="h-7 text-xs flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 gap-0.5 shrink-0"
                onClick={handleAdd}
                disabled={!newText.trim()}
              >
                <Plus className="h-3 w-3" />
                추가
              </Button>
            </div>

            {/* 전체 초기화 / 기본 항목 복원 버튼 */}
            <div className="flex gap-1.5 pt-0.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2 gap-0.5 text-muted-foreground hover:text-foreground flex-1"
                onClick={handleRestoreDefaults}
              >
                <RotateCcw className="h-3 w-3" />
                기본 항목 복원
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] px-2 gap-0.5 text-muted-foreground hover:text-destructive flex-1"
                    disabled={items.length === 0}
                  >
                    <Trash2 className="h-3 w-3" />
                    전체 초기화
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>체크리스트 초기화</AlertDialogTitle>
                    <AlertDialogDescription>
                      모든 항목이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>
                      초기화
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
