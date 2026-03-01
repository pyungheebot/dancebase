"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGroupWishlistV2 } from "@/hooks/use-group-wishlist-v2";
import type { GroupWishCategory, GroupWishStatus } from "@/types";
import { ALL_CATEGORIES, ALL_STATUSES } from "./group-wishlist/types";
import { CATEGORY_META, STATUS_META } from "./group-wishlist/meta";
import { AddItemDialog } from "./group-wishlist/add-item-dialog";
import { CategoryBarChart } from "./group-wishlist/category-bar-chart";
import { StatsRow } from "./group-wishlist/stats-row";
import { WishItemCard } from "./group-wishlist/wish-item-card";

export function GroupWishlistCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [activeCat, setActiveCat] = useState<GroupWishCategory | "all">("all");
  const [activeStatus, setActiveStatus] = useState<GroupWishStatus | "all">("all");

  const hook = useGroupWishlistV2(groupId);

  // 필터 + 좋아요 정렬
  const filteredItems = useMemo(() => {
    let list = hook.filterByCategory(activeCat);
    list = hook.filterByStatus(activeStatus).filter((i) =>
      list.some((l) => l.id === i.id)
    );
    return hook.sortByLikes(list);
  }, [hook, activeCat, activeStatus]);

  const activeItems = hook.items.filter(
    (i) => i.status !== "completed" && i.status !== "rejected"
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-800">그룹 위시리스트</span>
          {hook.items.length > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              {hook.items.length}개
            </Badge>
          )}
          {activeItems.length > 0 && (
            <Badge className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-100">
              진행 {activeItems.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <AddItemDialog hook={hook} />
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              aria-label={open ? "위시리스트 접기" : "위시리스트 펼치기"}
              aria-expanded={open}
              aria-controls="wishlist-collapsible-content"
            >
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* ── 본문 ── */}
      <CollapsibleContent id="wishlist-collapsible-content">
        <div className="space-y-4 rounded-b-lg border border-gray-200 bg-card p-4">

          {/* 통계 요약 */}
          <StatsRow stats={hook.stats} />

          {/* 카테고리 바 차트 */}
          <CategoryBarChart categoryCount={hook.categoryCount} total={hook.items.length} />

          {/* 빈 상태 */}
          {hook.items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400"
              role="alert"
              aria-live="polite"
            >
              <Sparkles className="h-10 w-10 opacity-20" aria-hidden="true" />
              <p className="text-xs">아직 위시가 없습니다.</p>
              <p className="text-[10px]">
                연습곡, 장비, 의상 등 그룹의 위시를 추가해보세요!
              </p>
            </div>
          ) : (
            <>
              <Separator />

              {/* 카테고리 필터 */}
              <nav aria-label="카테고리 필터" className="space-y-2">
                <p className="text-[11px] font-medium text-gray-400">카테고리</p>
                <div role="tablist" aria-label="카테고리" className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    role="tab"
                    onClick={() => setActiveCat("all")}
                    aria-selected={activeCat === "all"}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      activeCat === "all"
                        ? "border-gray-400 bg-gray-800 text-white"
                        : "border-gray-200 bg-background text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    전체
                  </button>
                  {ALL_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const count = hook.items.filter((i) => i.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        onClick={() => setActiveCat(cat)}
                        aria-selected={activeCat === cat}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          activeCat === cat
                            ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                            : "border-gray-200 bg-background text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span aria-hidden="true">{meta.icon}</span>
                        <span>{meta.label}</span>
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* 상태 필터 */}
              <nav aria-label="상태 필터" className="space-y-2">
                <p className="text-[11px] font-medium text-gray-400">상태</p>
                <div role="tablist" aria-label="상태" className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    role="tab"
                    onClick={() => setActiveStatus("all")}
                    aria-selected={activeStatus === "all"}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      activeStatus === "all"
                        ? "border-gray-400 bg-gray-800 text-white"
                        : "border-gray-200 bg-background text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    전체
                  </button>
                  {ALL_STATUSES.map((s) => {
                    const meta = STATUS_META[s];
                    const count = hook.items.filter((i) => i.status === s).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="tab"
                        onClick={() => setActiveStatus(s)}
                        aria-selected={activeStatus === s}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          activeStatus === s
                            ? `${meta.badge} border-transparent font-semibold`
                            : "border-gray-200 bg-background text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="inline-flex" aria-hidden="true">{meta.icon}</span>
                        <span>{meta.label}</span>
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* 위시 목록 */}
              {filteredItems.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-1 py-4 text-gray-400"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="text-xs">해당 조건의 위시가 없습니다.</p>
                </div>
              ) : (
                <ul role="list" className="space-y-2" aria-label="위시 목록">
                  {filteredItems.map((item) => (
                    <li key={item.id} role="listitem">
                      <WishItemCard item={item} hook={hook} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
