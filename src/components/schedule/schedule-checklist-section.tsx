"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useScheduleChecklist } from "@/hooks/use-schedule-checklist";

type ScheduleChecklistSectionProps = {
  scheduleId: string;
  /** 리더/서브리더면 true (항목 추가/삭제 가능) */
  canEdit: boolean;
};

export function ScheduleChecklistSection({
  scheduleId,
  canEdit,
}: ScheduleChecklistSectionProps) {
  const {
    items,
    loading,
    addItem,
    removeItem,
    toggleDone,
    doneCount,
    totalCount,
    completionRate,
  } = useScheduleChecklist(scheduleId);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error("항목명을 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      await addItem(newTitle);
      toast.success("항목을 추가했습니다");
      setNewTitle("");
      inputRef.current?.focus();
    } catch {
      toast.error("항목 추가에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (itemId: string, currentDone: boolean) => {
    setTogglingId(itemId);
    try {
      await toggleDone(itemId, !currentDone);
    } catch {
      toast.error("상태 변경에 실패했습니다");
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await removeItem(itemId);
      toast.success("항목을 삭제했습니다");
    } catch {
      toast.error("항목 삭제에 실패했습니다");
    } finally {
      setRemovingId(null);
    }
  };

  const handleOpenAdd = () => {
    setAddOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (loading) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">준비물</span>
        </div>
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">준비물</span>
          {totalCount > 0 && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ml-0.5 ${
                completionRate === 100
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {completionRate === 100 ? (
                <span className="flex items-center gap-0.5">
                  <CheckCircle className="h-2.5 w-2.5" />
                  완료
                </span>
              ) : (
                `${doneCount}/${totalCount}`
              )}
            </Badge>
          )}
        </div>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2 gap-0.5"
            onClick={handleOpenAdd}
          >
            <Plus className="h-3 w-3" />
            항목 추가
          </Button>
        )}
      </div>

      {/* 인라인 추가 폼 */}
      {canEdit && addOpen && (
        <div className="rounded border p-2 space-y-2 bg-muted/30">
          <div className="flex gap-1.5">
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
                if (e.key === "Escape") {
                  setAddOpen(false);
                  setNewTitle("");
                }
              }}
              placeholder="준비물 입력 (예: 공연 의상)"
              className="h-7 text-xs"
              disabled={submitting}
            />
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleAdd}
              disabled={submitting || !newTitle.trim()}
            >
              {submitting ? "추가 중..." : "추가"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                setAddOpen(false);
                setNewTitle("");
              }}
              disabled={submitting}
            >
              닫기
            </Button>
          </div>
        </div>
      )}

      {/* 체크리스트 항목 목록 */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded border px-2 py-1.5 group"
            >
              <Checkbox
                id={`checklist-${item.id}`}
                checked={item.is_done}
                onCheckedChange={() => handleToggle(item.id, item.is_done)}
                disabled={togglingId === item.id}
                className="h-3.5 w-3.5 shrink-0"
              />
              <label
                htmlFor={`checklist-${item.id}`}
                className={`text-xs flex-1 min-w-0 cursor-pointer truncate ${
                  item.is_done
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.title}
              </label>
              {canEdit && (
                <button
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  aria-label={`${item.title} 삭제`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 항목 없음 상태 */}
      {items.length === 0 && !addOpen && (
        <p className="text-[11px] text-muted-foreground">
          등록된 준비물이 없습니다
          {canEdit && " — 항목 추가 버튼을 눌러 시작하세요"}
        </p>
      )}
    </div>
  );
}
