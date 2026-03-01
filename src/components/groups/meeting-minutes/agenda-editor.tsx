"use client";

// ============================================
// 의제 편집기 컴포넌트 - 다이얼로그 내부용
// ============================================

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgendaItemDraft } from "./meeting-minutes-types";

type AgendaEditorProps = {
  items: AgendaItemDraft[];
  onChange: (items: AgendaItemDraft[]) => void;
};

export function AgendaEditor({ items, onChange }: AgendaEditorProps) {
  // 안건 추가
  const addItem = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        title: "",
        discussion: "",
        decision: "",
        actionItems: [],
      },
    ]);
  };

  // 안건 삭제
  const removeItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  // 안건 필드 수정
  const updateItem = (id: string, patch: Partial<AgendaItemDraft>) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // 실행과제 추가
  const addActionItem = (agendaId: string) => {
    onChange(
      items.map((it) =>
        it.id === agendaId
          ? {
              ...it,
              actionItems: [
                ...it.actionItems,
                { assignee: "", task: "", deadline: "" },
              ],
            }
          : it
      )
    );
  };

  // 실행과제 삭제
  const removeActionItem = (agendaId: string, idx: number) => {
    onChange(
      items.map((it) =>
        it.id === agendaId
          ? {
              ...it,
              actionItems: it.actionItems.filter((_, i) => i !== idx),
            }
          : it
      )
    );
  };

  // 실행과제 필드 수정
  const updateActionItem = (
    agendaId: string,
    idx: number,
    patch: Partial<{ assignee: string; task: string; deadline: string }>
  ) => {
    onChange(
      items.map((it) =>
        it.id === agendaId
          ? {
              ...it,
              actionItems: it.actionItems.map((ai, i) =>
                i === idx ? { ...ai, ...patch } : ai
              ),
            }
          : it
      )
    );
  };

  return (
    <div className="space-y-3">
      {/* 안건 목록 */}
      <ul role="list" className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            role="listitem"
            className="border border-border/60 rounded-md p-2.5 space-y-2 bg-muted/20"
          >
            {/* 안건 헤더 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                안건 {index + 1}
              </span>
              <Input
                placeholder="안건 제목"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                className="h-7 text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0"
                aria-label={`안건 ${index + 1} 삭제`}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
              </button>
            </div>

            {/* 논의 내용 */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                논의 내용
              </label>
              <Textarea
                placeholder="논의된 내용을 입력하세요."
                value={item.discussion}
                onChange={(e) =>
                  updateItem(item.id, { discussion: e.target.value })
                }
                className="text-xs resize-none min-h-[48px]"
                maxLength={500}
              />
            </div>

            {/* 결정사항 */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                결정사항{" "}
                <span className="font-normal">(선택)</span>
              </label>
              <Input
                placeholder="결정된 내용을 입력하세요."
                value={item.decision}
                onChange={(e) =>
                  updateItem(item.id, { decision: e.target.value })
                }
                className="h-7 text-xs"
                maxLength={200}
              />
            </div>

            {/* 실행과제 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-muted-foreground">
                  실행과제
                </label>
                <button
                  type="button"
                  onClick={() => addActionItem(item.id)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  aria-label="실행과제 추가"
                >
                  <Plus className="h-2.5 w-2.5" />
                  추가
                </button>
              </div>
              {item.actionItems.map((ai, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Input
                    placeholder="담당자"
                    value={ai.assignee}
                    onChange={(e) =>
                      updateActionItem(item.id, idx, {
                        assignee: e.target.value,
                      })
                    }
                    className="h-6 text-[10px] w-20 shrink-0"
                    aria-label="실행과제 담당자"
                  />
                  <Input
                    placeholder="과제 내용"
                    value={ai.task}
                    onChange={(e) =>
                      updateActionItem(item.id, idx, { task: e.target.value })
                    }
                    className="h-6 text-[10px] flex-1"
                    aria-label="실행과제 내용"
                  />
                  <Input
                    type="date"
                    value={ai.deadline}
                    onChange={(e) =>
                      updateActionItem(item.id, idx, {
                        deadline: e.target.value,
                      })
                    }
                    className="h-6 text-[10px] w-28 shrink-0"
                    aria-label="실행과제 마감일"
                  />
                  <button
                    type="button"
                    onClick={() => removeActionItem(item.id, idx)}
                    aria-label={`실행과제 ${idx + 1} 삭제`}
                    className="shrink-0"
                  >
                    <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* 안건 추가 버튼 */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs w-full border-dashed"
        onClick={addItem}
        aria-label="안건 추가"
      >
        <Plus className="h-3 w-3 mr-1" />
        안건 추가
      </Button>
    </div>
  );
}
