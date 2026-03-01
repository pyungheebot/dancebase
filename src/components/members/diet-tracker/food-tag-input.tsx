"use client";

import { useState, useCallback, useId } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface FoodTagInputProps {
  foods: string[];
  onAdd: (food: string) => void;
  onRemove: (food: string) => void;
}

export function FoodTagInput({ foods, onAdd, onRemove }: FoodTagInputProps) {
  const inputId = useId();
  const [input, setInput] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  }, [input, onAdd]);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1" role="group" aria-label="음식 추가">
        <Input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="음식 입력 후 Enter"
          className="h-7 text-xs"
          aria-label="음식 이름 입력"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={handleAdd}
          aria-label="음식 추가"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
      {foods.length > 0 && (
        <ul
          className="flex flex-wrap gap-1 list-none p-0 m-0"
          aria-label="추가된 음식 목록"
        >
          {foods.map((food) => (
            <li key={food}>
              <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-slate-100 text-slate-700 border-slate-200">
                {food}
                <button
                  type="button"
                  onClick={() => onRemove(food)}
                  className="ml-0.5 hover:opacity-70"
                  aria-label={`${food} 제거`}
                >
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
