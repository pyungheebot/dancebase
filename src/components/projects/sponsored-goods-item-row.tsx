"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Trash2,
  Pencil,
  Package,
  Users,
  AlertCircle,
} from "lucide-react";
import type { SponsoredGoodsItem, SponsoredGoodsStatus } from "@/types";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_OPTIONS,
  calcDday,
  formatDday,
} from "./sponsored-goods-types";

// ============================================================
// Props
// ============================================================

type ItemRowProps = {
  item: SponsoredGoodsItem;
  remaining: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: SponsoredGoodsStatus) => void;
  onDistribute: () => void;
};

// ============================================================
// 상태 도트 색상
// ============================================================

function getStatusDotColor(s: SponsoredGoodsStatus): string {
  if (s === "received") return "bg-green-500";
  if (s === "distributed") return "bg-purple-500";
  if (s === "returned") return "bg-gray-400";
  return "bg-blue-400";
}

// ============================================================
// 아이템 행 컴포넌트 (React.memo 적용)
// ============================================================

export const SponsoredGoodsItemRow = memo(function SponsoredGoodsItemRow({
  item,
  remaining,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onStatusChange,
  onDistribute,
}: ItemRowProps) {
  const dday =
    item.returnDueDate && item.status !== "returned"
      ? calcDday(item.returnDueDate)
      : null;

  const ddayClass =
    dday !== null
      ? dday < 0
        ? "bg-red-100 text-red-700 border-red-300"
        : dday <= 3
        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
        : "bg-gray-100 text-gray-600 border-gray-300"
      : "";

  return (
    <div className="rounded-md border bg-card" role="listitem">
      <div className="flex items-start gap-2 p-2">
        {/* 아이콘 */}
        <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">
              {item.itemName}
            </span>
            {item.category && (
              <span
                className="text-[10px] px-1.5 py-0 rounded bg-orange-100 text-orange-700 border border-orange-200 font-medium"
                aria-label={`카테고리: ${item.category}`}
              >
                {item.category}
              </span>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground mt-0.5">
            스폰서: {item.sponsor}
          </p>

          <div
            className="flex items-center gap-2 mt-1 flex-wrap"
            aria-label="수량 및 가치 정보"
          >
            <span className="text-[10px] text-muted-foreground">
              수량:{" "}
              <span className="font-medium text-foreground">
                {item.quantity}개
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              잔여:{" "}
              <span className="font-medium text-foreground">{remaining}개</span>
            </span>
            {item.estimatedValue != null && (
              <span className="text-[10px] text-muted-foreground">
                추정가:{" "}
                <span className="font-medium text-foreground">
                  {item.estimatedValue.toLocaleString()}원
                </span>
              </span>
            )}
            {dday !== null && (
              <span
                className={`text-[10px] px-1.5 py-0 rounded border font-semibold ${ddayClass}`}
                aria-label={`반납 기한 ${formatDday(dday)}${dday < 0 ? " (기한 초과)" : ""}`}
              >
                반납 {formatDday(dday)}
                {dday < 0 && (
                  <AlertCircle
                    className="inline h-2.5 w-2.5 ml-0.5 -mt-0.5"
                    aria-hidden="true"
                  />
                )}
              </span>
            )}
          </div>

          {/* 배분 내역 확장 버튼 */}
          {item.distributions.length > 0 && (
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-0.5 mt-1 text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
              aria-expanded={isExpanded}
              aria-controls={`dist-detail-${item.id}`}
              aria-label={`배분 내역 ${item.distributions.length}건 ${isExpanded ? "접기" : "펼치기"}`}
            >
              <Users className="h-2.5 w-2.5" aria-hidden="true" />
              배분 내역 {item.distributions.length}건
              {isExpanded ? (
                <ChevronUp className="h-2.5 w-2.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* 상태 드롭다운 + 액션 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[item.status]}`}
                aria-label={`현재 상태: ${STATUS_LABELS[item.status]}. 클릭하여 변경`}
                aria-haspopup="menu"
              >
                {STATUS_LABELS[item.status]}
                <ChevronRight className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s}
                  className="text-xs cursor-pointer"
                  onClick={() => onStatusChange(s)}
                  aria-label={`상태를 ${STATUS_LABELS[s]}(으)로 변경`}
                >
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusDotColor(s)}`}
                    aria-hidden="true"
                  />
                  {STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 배분 버튼 */}
          {remaining > 0 && item.status !== "returned" && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-1.5 text-[10px]"
              onClick={onDistribute}
              aria-label={`${item.itemName} 배분하기`}
            >
              <Users className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              배분
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onEdit}
            aria-label={`${item.itemName} 편집`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`${item.itemName} 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 배분 내역 확장 */}
      {isExpanded && item.distributions.length > 0 && (
        <div
          id={`dist-detail-${item.id}`}
          className="border-t px-3 py-2 bg-muted/30 space-y-1"
          role="list"
          aria-label={`${item.itemName} 배분 내역`}
          aria-live="polite"
        >
          {item.distributions.map((d, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-[10px]"
              role="listitem"
            >
              <span className="font-medium">{d.memberName}</span>
              <span className="text-muted-foreground">
                {d.quantity}개 ·{" "}
                {new Date(d.distributedAt).toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
