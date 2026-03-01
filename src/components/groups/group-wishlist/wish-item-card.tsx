"use client";

import { memo, useState } from "react";
import { Heart, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupWishlistV2 } from "@/hooks/use-group-wishlist-v2";
import type { GroupWishItem, GroupWishStatus } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";
import { ALL_STATUSES, formatCost } from "./types";
import { CATEGORY_META, PRIORITY_META, STATUS_META } from "./meta";
import { EditItemDialog } from "./edit-item-dialog";

interface WishItemCardProps {
  item: GroupWishItem;
  hook: ReturnType<typeof useGroupWishlistV2>;
}

export const WishItemCard = memo(function WishItemCard({ item, hook }: WishItemCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const catMeta = CATEGORY_META[item.category];
  const priMeta = PRIORITY_META[item.priority];
  const statusMeta = STATUS_META[item.status];

  const isInactive = item.status === "completed" || item.status === "rejected";

  const handleLike = () => {
    const ok = hook.likeItem(item.id);
    if (!ok) toast.error(TOAST.GROUP_WISHLIST.LIKE_ERROR);
    else toast.success(TOAST.GROUP_WISHLIST.LIKED);
  };

  const handleDelete = () => {
    const ok = hook.deleteItem(item.id);
    if (ok) toast.success(TOAST.GROUP_WISHLIST.DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  };

  const handleStatusChange = (value: string) => {
    const ok = hook.changeStatus(item.id, value as GroupWishStatus);
    if (ok) toast.success(TOAST.GROUP_WISHLIST.STATUS_CHANGED);
    else toast.error(TOAST.GROUP_WISHLIST.STATUS_ERROR);
  };

  return (
    <>
      <article
        className={`rounded-lg border p-3 transition-opacity ${
          isInactive
            ? "border-gray-100 bg-gray-50 opacity-60"
            : `${catMeta.bg} ${catMeta.border}`
        }`}
        aria-label={`위시 항목: ${item.title}`}
      >
        <div className="flex gap-2.5">
          {/* 콘텐츠 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 제목 + 배지 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${
                  isInactive ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {item.title}
              </span>
              <Badge className={`text-[10px] px-1.5 py-0 ${catMeta.badge}`}>
                <span className="mr-0.5 inline-flex" aria-hidden="true">{catMeta.icon}</span>
                {catMeta.label}
              </Badge>
              <Badge className={`text-[10px] px-1.5 py-0 ${priMeta.badge}`}>
                {priMeta.label}
              </Badge>
              <Badge className={`text-[10px] px-1.5 py-0 ${statusMeta.badge}`}>
                <span className="mr-0.5 inline-flex" aria-hidden="true">{statusMeta.icon}</span>
                {statusMeta.label}
              </Badge>
              {item.estimatedCost > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-600 hover:bg-indigo-100">
                  {formatCost(item.estimatedCost)}
                </Badge>
              )}
            </div>

            {/* 설명 */}
            {item.description && (
              <p className="text-[11px] leading-relaxed text-gray-500">{item.description}</p>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>제안: {item.proposedBy}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.createdAt}>{formatMonthDay(item.createdAt)}</time>
            </div>

            {/* 상태 변경 셀렉트 */}
            {!isInactive && (
              <Select value={item.status} onValueChange={handleStatusChange}>
                <SelectTrigger
                  className="h-5 w-24 border-0 bg-transparent p-0 text-[10px] text-gray-400 shadow-none focus:ring-0"
                  aria-label={`상태 변경: 현재 ${statusMeta.label}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 오른쪽: 좋아요 + 수정 + 삭제 */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {/* 좋아요 */}
            <button
              type="button"
              onClick={handleLike}
              disabled={isInactive}
              aria-label={`좋아요 ${item.likes}개`}
              aria-pressed={false}
              className="flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-gray-400 transition-colors hover:bg-card/60 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Heart className="h-3 w-3" aria-hidden="true" />
              <span className="text-[10px] font-semibold" aria-hidden="true">{item.likes}</span>
            </button>

            {/* 수정 버튼 */}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label={`${item.title} 수정`}
              className="text-gray-300 transition-colors hover:text-violet-500"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </button>

            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`${item.title} 삭제`}
              className="text-gray-200 transition-colors hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      <EditItemDialog
        item={item}
        hook={hook}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
});
