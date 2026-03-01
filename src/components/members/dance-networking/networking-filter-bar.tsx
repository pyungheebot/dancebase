"use client";

// ============================================
// dance-networking/networking-filter-bar.tsx
// 검색 + 역할 필터 + 즐겨찾기 필터 바
// ============================================

import { memo } from "react";
import { Search, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ROLE_OPTIONS } from "@/hooks/use-dance-networking";
import type { DanceNetworkingRole } from "@/types";

type NetworkingFilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterRole: DanceNetworkingRole | "all";
  onFilterRoleChange: (value: DanceNetworkingRole | "all") => void;
  filterFavorite: boolean;
  onFilterFavoriteToggle: () => void;
};

export const NetworkingFilterBar = memo(function NetworkingFilterBar({
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterFavorite,
  onFilterFavoriteToggle,
}: NetworkingFilterBarProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="search"
      aria-label="연락처 검색 및 필터"
    >
      {/* 텍스트 검색 */}
      <div className="relative flex-1 min-w-[160px]">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400"
          aria-hidden="true"
        />
        <label htmlFor="networking-search" className="sr-only">
          이름, 소속, 장르로 검색
        </label>
        <Input
          id="networking-search"
          className="h-7 text-xs pl-6"
          placeholder="이름, 소속, 장르로 검색"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => onSearchChange("")}
            aria-label="검색어 지우기"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 역할 필터 */}
      <label htmlFor="networking-role-filter" className="sr-only">
        역할로 필터
      </label>
      <Select
        value={filterRole}
        onValueChange={(v) => onFilterRoleChange(v as DanceNetworkingRole | "all")}
      >
        <SelectTrigger
          id="networking-role-filter"
          className="h-7 text-xs w-28"
          aria-label="역할 필터 선택"
        >
          <SelectValue placeholder="전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">
            전체 역할
          </SelectItem>
          {ROLE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 즐겨찾기 필터 */}
      <Button
        size="sm"
        variant={filterFavorite ? "default" : "outline"}
        className={cn(
          "h-7 text-xs",
          filterFavorite &&
            "bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400"
        )}
        onClick={onFilterFavoriteToggle}
        aria-pressed={filterFavorite}
        aria-label={filterFavorite ? "즐겨찾기 필터 해제" : "즐겨찾기만 보기"}
      >
        <Star className="h-3 w-3 mr-1 fill-current" aria-hidden="true" />
        즐겨찾기
      </Button>
    </div>
  );
});
