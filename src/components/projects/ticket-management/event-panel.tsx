"use client";

import { useState, useCallback, useId } from "react";
import { ChevronDown, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { TicketMgmtEvent, TicketMgmtSale, TicketMgmtType } from "@/types";
import type { TicketMgmtEventStats } from "@/hooks/use-ticket-management";
import { TYPE_META, formatPrice } from "./types";
import { AddTierDialog } from "./add-tier-dialog";
import { AddSaleDialog } from "./add-sale-dialog";
import { SaleListItem } from "./sale-list-item";

interface EventPanelProps {
  event: TicketMgmtEvent;
  onDeleteEvent: (id: string) => void;
  onAddTier: (
    eventId: string,
    type: TicketMgmtType,
    price: number,
    totalSeats: number,
    description: string
  ) => void;
  onDeleteTier: (eventId: string, tierId: string) => void;
  onAddSale: (
    eventId: string,
    sale: Omit<TicketMgmtSale, "id" | "soldAt">
  ) => void;
  onDeleteSale: (eventId: string, saleId: string) => void;
  getEventStats: (eventId: string) => TicketMgmtEventStats | null;
}

export function EventPanel({
  event,
  onDeleteEvent,
  onAddTier,
  onDeleteTier,
  onAddSale,
  onDeleteSale,
  getEventStats,
}: EventPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [addTierOpen, setAddTierOpen] = useState(false);
  const [addSaleOpen, setAddSaleOpen] = useState(false);

  const panelId = useId();
  const contentId = `event-panel-content-${panelId}`;
  const saleListId = `event-sale-list-${panelId}`;

  const stats = getEventStats(event.id);
  const existingTypes = event.tiers.map((t) => t.type);

  const handleDeleteSale = useCallback(
    (saleId: string) => {
      onDeleteSale(event.id, saleId);
    },
    [event.id, onDeleteSale]
  );

  function handleDeleteEvent() {
    onDeleteEvent(event.id);
    toast.success(`"${event.eventName}" 이벤트가 삭제되었습니다.`);
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* 이벤트 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
              aria-expanded={expanded}
              aria-controls={contentId}
            >
              <ChevronDown
                className={`h-3 w-3 flex-shrink-0 transition-transform ${
                  expanded ? "" : "-rotate-90"
                }`}
                aria-hidden="true"
              />
              <span className="text-xs font-medium truncate">
                {event.eventName}
              </span>
              {event.eventDate && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                  <time dateTime={event.eventDate}>{event.eventDate}</time>
                </span>
              )}
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {stats && stats.totalSeats > 0 && (
              <Badge
                className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100"
                aria-label={`판매 현황 ${stats.totalSold}석 / ${stats.totalSeats}석`}
              >
                {stats.totalSold}/{stats.totalSeats}석
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={handleDeleteEvent}
              aria-label={`${event.eventName} 이벤트 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <CollapsibleContent id={contentId}>
          <div className="px-3 pb-3 pt-2 space-y-3">
            {/* 티어 판매 현황 */}
            <section aria-label="유형별 판매 현황" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide"
                  aria-hidden="true"
                >
                  유형별 판매 현황
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-0.5 px-1.5"
                  onClick={() => setAddTierOpen(true)}
                  aria-label="티어 추가"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  티어 추가
                </Button>
              </div>

              {event.tiers.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  티어가 없습니다. 티어를 추가해주세요.
                </p>
              ) : (
                <ul role="list" className="space-y-2" aria-label="티켓 티어 목록">
                  {event.tiers.map((tier) => {
                    const ts = stats?.tierStats.find(
                      (s) => s.type === tier.type
                    );
                    const meta = TYPE_META[tier.type];
                    const barId = `tier-bar-${panelId}-${tier.id}`;
                    const isSoldOut = ts && ts.remainingSeats <= 0;
                    const statusText = isSoldOut
                      ? "매진"
                      : ts
                      ? `${ts.remainingSeats}석 잔여`
                      : "";

                    return (
                      <li key={tier.id} role="listitem" className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatPrice(tier.price)}
                            </span>
                            {tier.description && (
                              <span className="text-[10px] text-muted-foreground">
                                · {tier.description}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] text-muted-foreground"
                              aria-label={`${meta.label} ${ts?.soldCount ?? 0}석 판매 / ${tier.totalSeats}석 총 좌석. ${statusText}`}
                            >
                              {ts?.soldCount ?? 0}/{tier.totalSeats}석
                              {isSoldOut ? (
                                <span className="text-red-500 ml-1" aria-hidden="true">
                                  (매진)
                                </span>
                              ) : ts ? (
                                <span className="text-green-600 ml-1" aria-hidden="true">
                                  ({ts.remainingSeats} 잔여)
                                </span>
                              ) : null}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                onDeleteTier(event.id, tier.id);
                                toast.success(TOAST.TICKET.TIER_DELETED);
                              }}
                              aria-label={`${meta.label} 티어 삭제`}
                            >
                              <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                        <Progress
                          id={barId}
                          value={ts?.soldRate ?? 0}
                          className="h-1.5"
                          aria-label={`${meta.label} 판매율 ${ts?.soldRate ?? 0}%`}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 매출 요약 */}
            {stats && (
              <dl
                role="region"
                aria-label="이벤트 매출 요약"
                className="grid grid-cols-3 gap-2 rounded-md bg-gray-50 p-2"
              >
                <div className="text-center space-y-0.5">
                  <dt className="text-[10px] text-muted-foreground">총 매출</dt>
                  <dd className="text-xs font-semibold text-blue-600">
                    {formatPrice(stats.totalRevenue)}
                  </dd>
                </div>
                <div className="text-center space-y-0.5 border-x border-gray-200">
                  <dt className="text-[10px] text-muted-foreground">총 판매</dt>
                  <dd className="text-xs font-semibold">{stats.totalSold}석</dd>
                </div>
                <div className="text-center space-y-0.5">
                  <dt className="text-[10px] text-muted-foreground">잔여석</dt>
                  <dd className="text-xs font-semibold text-green-600">
                    {stats.totalRemaining}석
                  </dd>
                </div>
              </dl>
            )}

            {/* 판매 기록 목록 */}
            <section aria-label="판매 기록" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide"
                  aria-hidden="true"
                >
                  판매 기록
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-0.5 px-1.5"
                  onClick={() => setAddSaleOpen(true)}
                  disabled={event.tiers.length === 0}
                  aria-label="판매 등록"
                  aria-disabled={event.tiers.length === 0}
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  판매 등록
                </Button>
              </div>

              {event.sales.length === 0 ? (
                <div
                  className="text-center py-4 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  판매 기록이 없습니다.
                </div>
              ) : (
                <ScrollArea className="max-h-56">
                  <ul
                    id={saleListId}
                    role="list"
                    className="space-y-1"
                    aria-label={`${event.eventName} 판매 기록 목록`}
                    aria-live="polite"
                  >
                    {event.sales.map((sale) => (
                      <SaleListItem
                        key={sale.id}
                        sale={sale}
                        onDelete={handleDeleteSale}
                      />
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </section>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 티어 추가 다이얼로그 */}
      <AddTierDialog
        open={addTierOpen}
        onOpenChange={setAddTierOpen}
        existingTypes={existingTypes}
        onAdd={(type, price, totalSeats, description) =>
          onAddTier(event.id, type, price, totalSeats, description)
        }
      />

      {/* 판매 등록 다이얼로그 */}
      <AddSaleDialog
        open={addSaleOpen}
        onOpenChange={setAddSaleOpen}
        event={event}
        eventStats={stats}
        onAdd={(sale) => onAddSale(event.id, sale)}
      />
    </div>
  );
}
