"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { TicketMgmtSale } from "@/types";
import { TYPE_META, formatPrice, formatDateTime } from "./types";

interface SaleListItemProps {
  sale: TicketMgmtSale;
  onDelete: (saleId: string) => void;
}

export const SaleListItem = memo(function SaleListItem({
  sale,
  onDelete,
}: SaleListItemProps) {
  const meta = TYPE_META[sale.ticketType];
  const deleteLabel = `${sale.buyerName || "익명"} 판매 기록 삭제`;

  function handleDelete() {
    onDelete(sale.id);
    toast.success(TOAST.TICKET.SALES_DELETED);
  }

  return (
    <div
      role="listitem"
      className="flex items-center gap-2 py-1.5 px-2 rounded-lg border border-gray-100 bg-card hover:bg-muted/30 transition-colors group"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium">
            {sale.buyerName || "익명"}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${meta.badgeClass}`}
          >
            {meta.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {sale.quantity}매
          </span>
          <span className="text-[10px] font-medium text-blue-600">
            {formatPrice(sale.totalPrice)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <time
            dateTime={sale.soldAt}
            className="text-[10px] text-muted-foreground"
          >
            {formatDateTime(sale.soldAt)}
          </time>
          {sale.seatInfo && (
            <span className="text-[10px] text-muted-foreground">
              · {sale.seatInfo}
            </span>
          )}
          {sale.notes && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              · {sale.notes}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={handleDelete}
        aria-label={deleteLabel}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
});
