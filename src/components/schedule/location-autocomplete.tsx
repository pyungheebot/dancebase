"use client";

import { useState, useRef, useEffect, useId } from "react";
import { MapPin, Clock, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLocationHistory } from "@/hooks/use-location-history";

type LocationAutocompleteProps = {
  /** 장소 히스토리를 조회할 그룹 ID */
  groupId: string;
  /** 현재 입력된 값 */
  value: string;
  /** 값 변경 콜백 */
  onChange: (value: string) => void;
  /** Input id (label 연결용) */
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * 장소 자동 완성 컴포넌트
 * - 입력 시 기존 일정에서 사용된 장소 목록을 필터링하여 드롭다운 표시
 * - 빈 입력 상태에서 포커스 시 최근/자주 사용하는 장소 표시
 * - 각 장소 옆에 사용 횟수 표시
 */
export function LocationAutocomplete({
  groupId,
  value,
  onChange,
  id,
  placeholder = "장소 이름 (선택사항)",
  className,
  disabled = false,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const { history, loading } = useLocationHistory(groupId, value);

  // 드롭다운 표시 여부: 포커스됐고 히스토리가 있을 때
  const shouldShow = open && history.length > 0;

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // activeIndex가 바뀔 때 스크롤 보정
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = (location: string) => {
    onChange(location);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShow) {
      if (e.key === "ArrowDown" && history.length > 0) {
        e.preventDefault();
        setOpen(true);
        // open이 false → true로 바뀌는 렌더 후 인덱스 설정
        setTimeout(() => setActiveIndex(0), 0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < history.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev <= 0) {
            // 첫 항목에서 Up → 입력창으로 포커스 복귀, 인덱스 해제
            return -1;
          }
          return prev - 1;
        });
        break;
      case "Enter":
        if (activeIndex >= 0 && history[activeIndex]) {
          e.preventDefault();
          handleSelect(history[activeIndex].location);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input 영역 */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={shouldShow ? listId : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-item-${activeIndex}` : undefined
          }
          aria-expanded={shouldShow}
          role="combobox"
          className="pl-8 pr-8 text-xs h-9"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            className="absolute right-2 flex items-center justify-center h-5 w-5 rounded hover:bg-muted text-muted-foreground"
            aria-label="장소 지우기"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 드롭다운 목록 */}
      {shouldShow && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {/* 헤더 */}
          <div className="flex items-center gap-1.5 border-b px-2.5 py-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {value.trim() ? "검색 결과" : "최근 사용 장소"}
            </span>
            {loading && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                로딩 중...
              </span>
            )}
          </div>

          {/* 목록 */}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="장소 목록"
            className="max-h-48 overflow-y-auto py-1"
          >
            {history.map((item, index) => (
              <li
                key={item.location}
                id={`${listId}-item-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  // mousedown에서 처리해야 input의 blur보다 먼저 실행됨
                  e.preventDefault();
                  handleSelect(item.location);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs",
                  index === activeIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{item.location}</span>
                <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {item.count}회
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 검색어가 있는데 결과가 없을 때 */}
      {open && value.trim() && !loading && history.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="flex items-center gap-1.5 px-2.5 py-2.5">
            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              &quot;{value}&quot; 새 장소로 입력됩니다
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
