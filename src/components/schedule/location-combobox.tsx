"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Clock, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLocationSuggestions } from "@/hooks/use-location-suggestions";
import { cn } from "@/lib/utils";

type LocationComboboxProps = {
  id?: string;
  groupId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function LocationCombobox({
  id,
  groupId,
  value,
  onChange,
  placeholder = "장소 이름 (선택사항)",
  className,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions } = useLocationSuggestions(groupId);

  // 외부 value 변경 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 입력값으로 필터링된 제안 목록
  const filtered = inputValue.trim()
    ? suggestions.filter((s) =>
        s.location.toLowerCase().includes(inputValue.toLowerCase())
      )
    : suggestions;

  const hasSuggestions = filtered.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);
    onChange(newVal);
    // 입력 중이고 제안 목록이 있으면 팝오버 열기
    if (!open && suggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleSelect = (location: string) => {
    setInputValue(location);
    onChange(location);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    }
    if (e.key === "ArrowDown" && !open && hasSuggestions) {
      setOpen(true);
    }
  };

  const handleFocus = () => {
    if (hasSuggestions || filtered.length > 0) {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative flex items-center", className)}>
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={cn("pr-16", inputValue ? "pr-16" : "pr-8")}
            autoComplete="off"
          />
          <div className="absolute right-1 flex items-center gap-0.5">
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={handleClear}
                tabIndex={-1}
              >
                <X className="h-3 w-3 text-muted-foreground" />
                <span className="sr-only">지우기</span>
              </Button>
            )}
            {suggestions.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
                onClick={() => setOpen((prev) => !prev)}
                tabIndex={-1}
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform duration-150",
                    open && "rotate-180"
                  )}
                />
                <span className="sr-only">장소 목록 열기</span>
              </Button>
            )}
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {hasSuggestions ? (
              <CommandGroup heading="최근 사용 장소">
                {filtered.map((s) => (
                  <CommandItem
                    key={s.location}
                    value={s.location}
                    onSelect={() => handleSelect(s.location)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-sm">{s.location}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                      <Clock className="h-2.5 w-2.5" />
                      {s.count}회
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty className="py-4 text-xs text-muted-foreground">
                {inputValue.trim()
                  ? `"${inputValue}" — 새 장소로 입력됩니다`
                  : "저장된 장소가 없습니다"}
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
