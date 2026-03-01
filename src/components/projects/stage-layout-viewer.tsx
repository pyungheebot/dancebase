"use client";

// ============================================================
// 무대 평면도 - 레이아웃 뷰어 (캔버스 + 아이템 목록)
// ============================================================

import { memo } from "react";
import { Pencil, X } from "lucide-react";
import type { StageLayoutItem, StageLayoutPlan, StageLayoutItemType } from "@/types";
import { StageItem } from "./stage-layout-item";
import {
  ITEM_TYPE_BADGE_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
} from "./stage-layout-types";

// ── 유형별 그룹핑 유틸 ────────────────────────────────────

function groupItemsByType(
  items: StageLayoutItem[]
): Partial<Record<StageLayoutItemType, StageLayoutItem[]>> {
  const groups: Partial<Record<StageLayoutItemType, StageLayoutItem[]>> = {};
  for (const item of items) {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type]!.push(item);
  }
  return groups;
}

// ── 아이템 목록 행 ────────────────────────────────────────

interface ItemListRowProps {
  item: StageLayoutItem;
  onEdit: (item: StageLayoutItem) => void;
  onDelete: (id: string) => void;
}

const ItemListRow = memo(function ItemListRow({
  item,
  onEdit,
  onDelete,
}: ItemListRowProps) {
  return (
    <li
      className="flex items-center gap-1 text-[10px] bg-muted rounded px-1.5 py-0.5 group"
      aria-label={`${ITEM_TYPE_LABELS[item.type]} - ${item.label}`}
    >
      <span className="text-foreground">{item.label}</span>
      <span className="text-muted-foreground" aria-label={`위치 X ${item.x.toFixed(0)}%, Y ${item.y.toFixed(0)}%`}>
        ({item.x.toFixed(0)}%, {item.y.toFixed(0)}%)
      </span>
      <button
        className="hidden group-hover:inline-flex items-center text-muted-foreground hover:text-primary focus:inline-flex focus:text-primary"
        onClick={() => onEdit(item)}
        aria-label={`${item.label} 편집`}
      >
        <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
      <button
        className="hidden group-hover:inline-flex items-center text-muted-foreground hover:text-destructive focus:inline-flex focus:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label={`${item.label} 삭제`}
      >
        <X className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    </li>
  );
});

// ── 메인 레이아웃 뷰어 ────────────────────────────────────

interface StageLayoutViewerProps {
  plan: StageLayoutPlan;
  activeItemId: string | null;
  onActivateItem: (id: string) => void;
  onEditItem: (item: StageLayoutItem) => void;
  onDeleteItem: (id: string) => void;
  /** 동적 상태 변경 알림용 live region 메시지 */
  liveMessage?: string;
}

export const StageLayoutViewer = memo(function StageLayoutViewer({
  plan,
  activeItemId,
  onActivateItem,
  onEditItem,
  onDeleteItem,
  liveMessage,
}: StageLayoutViewerProps) {
  const grouped = groupItemsByType(plan.items);

  return (
    <div className="space-y-3">
      {/* aria-live: 아이템 추가/삭제 시 스크린리더에게 알림 */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      {/* 무대 캔버스 */}
      <div
        role="img"
        aria-label={`무대 평면도 - ${plan.planName}${
          plan.stageWidth && plan.stageDepth
            ? `, 규격 ${plan.stageWidth}m × ${plan.stageDepth}m`
            : ""
        }, 총 ${plan.items.length}개 아이템`}
        className="relative w-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden"
        style={{ paddingBottom: "56.25%" /* 16:9 비율 */ }}
        onClick={() => onActivateItem("")}
      >
        {/* 무대 방향 레이블 */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        >
          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            무대 앞
          </span>
        </div>
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        >
          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            무대 뒤
          </span>
        </div>

        {/* 빈 상태 */}
        {plan.items.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-label="아이템 없음. 아이템 추가 버튼으로 추가하세요."
          >
            <span className="text-xs text-slate-400">
              아이템을 추가해주세요
            </span>
          </div>
        )}

        {/* 아이템들 */}
        {plan.items.map((item) => (
          <StageItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            onActivate={onActivateItem}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
          />
        ))}
      </div>

      {/* 아이템 목록 (유형별 그룹핑) */}
      {plan.items.length > 0 && (
        <section aria-label="아이템 목록">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            아이템 목록
          </p>
          <div className="space-y-2" role="list" aria-label="유형별 아이템 그룹">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="space-y-1" role="listitem">
                {/* 유형 배지 */}
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                      ITEM_TYPE_BADGE_COLORS[type as StageLayoutItemType]
                    }`}
                    aria-label={`${ITEM_TYPE_LABELS[type as StageLayoutItemType]} ${items!.length}개`}
                  >
                    <span aria-hidden="true">
                      {ITEM_TYPE_ICONS[type as StageLayoutItemType]}
                    </span>
                    <span aria-hidden="true">
                      {ITEM_TYPE_LABELS[type as StageLayoutItemType]}
                    </span>
                    <span className="font-semibold ml-0.5" aria-hidden="true">
                      {items!.length}
                    </span>
                  </span>
                </div>

                {/* 아이템 칩 목록 */}
                <ul
                  className="flex flex-wrap gap-1 pl-2"
                  aria-label={`${ITEM_TYPE_LABELS[type as StageLayoutItemType]} 아이템 목록`}
                >
                  {items!.map((item) => (
                    <ItemListRow
                      key={item.id}
                      item={item}
                      onEdit={onEditItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});
