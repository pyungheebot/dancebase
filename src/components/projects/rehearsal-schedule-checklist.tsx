"use client";

import { useState } from "react";
import { Plus, X, Check, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { RehearsalScheduleItem } from "@/types";

// ============================================================
// 타입
// ============================================================

export type ChecklistSectionProps = {
  rehearsal: RehearsalScheduleItem;
  onToggle: (rehearsalId: string, itemId: string) => void;
  onAdd: (rehearsalId: string, title: string) => void;
  onRemove: (rehearsalId: string, itemId: string) => void;
};

// ============================================================
// 체크리스트 섹션 (인라인)
// ============================================================

export function ChecklistSection({
  rehearsal,
  onToggle,
  onAdd,
  onRemove,
}: ChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState("");

  const checklist = rehearsal.checklist;
  const checkedCount = checklist.filter((item) => item.isChecked).length;
  const inputId = `checklist-input-${rehearsal.id}`;

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;
    onAdd(rehearsal.id, newItemTitle.trim());
    setNewItemTitle("");
  };

  return (
    <section
      className="mt-2 space-y-1.5"
      aria-label={`${rehearsal.title} 체크리스트`}
    >
      {/* 체크리스트 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
          <ListChecks className="h-3 w-3" aria-hidden="true" />
          체크리스트
          {checklist.length > 0 && (
            <span className="text-gray-400" aria-live="polite">
              ({checkedCount}/{checklist.length})
            </span>
          )}
        </span>
      </div>

      {/* 체크리스트 항목 목록 */}
      {checklist.length > 0 && (
        <ul role="list" className="space-y-1" aria-label="체크리스트 항목">
          {checklist.map((item) => (
            <li key={item.id} role="listitem" className="flex items-center gap-1.5 group">
              <button
                onClick={() => onToggle(rehearsal.id, item.id)}
                className={`h-3.5 w-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.isChecked
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-green-400"
                }`}
                aria-label={`${item.title} ${item.isChecked ? "체크 해제" : "체크"}`}
                aria-pressed={item.isChecked}
              >
                {item.isChecked && (
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                )}
              </button>
              <span
                className={`text-xs flex-1 leading-tight ${
                  item.isChecked
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
                aria-label={item.isChecked ? `${item.title} (완료)` : item.title}
              >
                {item.title}
              </span>
              <button
                onClick={() => onRemove(rehearsal.id, item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all focus:opacity-100"
                aria-label={`${item.title} 항목 삭제`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 항목 추가 입력 */}
      <div className="flex gap-1" role="group" aria-label="체크리스트 항목 추가">
        <label htmlFor={inputId} className="sr-only">
          새 체크리스트 항목
        </label>
        <Input
          id={inputId}
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="체크리스트 항목 추가..."
          className="h-6 text-[10px] flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0"
          onClick={handleAdd}
          aria-label="체크리스트 항목 추가"
          disabled={!newItemTitle.trim()}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
