"use client";

import { useState, useCallback, useId } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PRESET_STRATEGIES } from "./types";

type StrategyPickerProps = {
  selected: string[];
  onChange: (strategies: string[]) => void;
};

export function StrategyPicker({ selected, onChange }: StrategyPickerProps) {
  const [custom, setCustom] = useState("");
  const inputId = useId();
  const groupId = useId();

  const toggle = useCallback(
    (s: string) => {
      if (selected.includes(s)) {
        onChange(selected.filter((x) => x !== s));
      } else {
        onChange([...selected, s]);
      }
    },
    [selected, onChange]
  );

  const addCustom = useCallback(() => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustom("");
  }, [custom, selected, onChange]);

  return (
    <div className="space-y-2">
      <Label
        className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
        id={groupId}
      >
        대처 전략 (선택)
      </Label>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-labelledby={groupId}
      >
        {PRESET_STRATEGIES.map((s) => {
          const isSelected = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(s);
                }
              }}
              aria-pressed={isSelected}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                isSelected
                  ? "bg-violet-100 text-violet-700 border-violet-300"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
      {/* 직접 입력 */}
      <div className="flex gap-1">
        <Label htmlFor={inputId} className="sr-only">
          직접 입력
        </Label>
        <Input
          id={inputId}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="직접 입력..."
          className="h-6 text-xs flex-1"
          aria-label="대처 전략 직접 입력"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2"
          onClick={addCustom}
          aria-label="대처 전략 추가"
        >
          추가
        </Button>
      </div>
      {/* 선택된 항목 */}
      {selected.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label="선택된 대처 전략"
        >
          {selected.map((s) => (
            <div key={s} role="listitem">
              <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-violet-100 text-violet-700 border-violet-200">
                {s}
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(s);
                    }
                  }}
                  className="ml-0.5 hover:text-violet-900"
                  aria-label={`${s} 제거`}
                >
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
