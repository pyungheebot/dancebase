"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

// ============================================================
// 태그 입력 컴포넌트 (추천 태그 + 직접 입력)
// ============================================================

type TagInputProps = {
  label: string;
  tags: string[];
  suggestions: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
};

export function TagInput({
  label,
  tags,
  suggestions,
  onAdd,
  onRemove,
  placeholder,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputId = useId();
  const suggestionListId = useId();
  const selectedListId = useId();

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      toast.error(TOAST.MEMBERS.STYLE_ANALYSIS_ITEM_DUPLICATE);
      return;
    }
    onAdd(trimmed);
    setInputValue("");
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-xs">
        {label}
      </Label>
      <div className="flex gap-1.5">
        <Input
          id={inputId}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder ?? "입력 후 Enter"}
          className="h-7 text-xs"
          aria-describedby={
            tags.length > 0 ? selectedListId : undefined
          }
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2"
          onClick={handleAdd}
          aria-label={`${label} 추가`}
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>

      {/* 추천 태그 */}
      {suggestions.filter((s) => !tags.includes(s)).length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label={`${label} 추천 목록`}
          id={suggestionListId}
        >
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                role="listitem"
                onClick={() => onAdd(s)}
                aria-label={`${s} 추가`}
                className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                + {s}
              </button>
            ))}
        </div>
      )}

      {/* 선택된 태그 */}
      {tags.length > 0 && (
        <div
          className="flex flex-wrap gap-1 pt-0.5"
          role="list"
          aria-label={`선택된 ${label}`}
          id={selectedListId}
        >
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-1"
              role="listitem"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label={`${tag} 제거`}
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
