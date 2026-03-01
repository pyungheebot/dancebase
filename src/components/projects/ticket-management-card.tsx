"use client";

import { useState } from "react";
import {
  Ticket,
  ChevronDown,
  ChevronUp,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTicketManagement } from "@/hooks/use-ticket-management";
import { AddEventDialog } from "./ticket-management/add-event-dialog";
import { EventPanel } from "./ticket-management/event-panel";
import { TicketStatsSummary } from "./ticket-management/ticket-stats-summary";
import { formatPrice } from "./ticket-management/types";

// ============================================================
// 메인 컴포넌트
// ============================================================

interface TicketManagementCardProps {
  groupId: string;
  projectId: string;
}

export function TicketManagementCard({
  groupId,
  projectId,
}: TicketManagementCardProps) {
  const {
    events,
    loading,
    addEvent,
    deleteEvent,
    addTier,
    deleteTier,
    addSale,
    deleteSale,
    getEventStats,
    stats,
  } = useTicketManagement(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const cardContentId = "ticket-management-content";

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Ticket className="h-4 w-4 text-orange-500" aria-hidden="true" />
              공연 티켓 관리
              {events.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 hover:bg-orange-100">
                  {events.length}개 이벤트
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* 요약 통계 (헤더 인라인) */}
              {stats.totalSold > 0 && (
                <div
                  className="hidden sm:flex items-center gap-3 mr-1"
                  aria-label={`총 ${stats.totalSold}석 판매, 총 매출 ${formatPrice(stats.totalRevenue)}`}
                >
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {stats.totalSold}석
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    {formatPrice(stats.totalRevenue)}
                  </span>
                </div>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddEventOpen(true);
                }}
                aria-label="이벤트 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">이벤트 추가</span>
              </Button>

              <CollapsibleTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  aria-expanded={open}
                  aria-controls={cardContentId}
                  aria-label={open ? "티켓 관리 접기" : "티켓 관리 펼치기"}
                >
                  {open ? (
                    <ChevronUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent id={cardContentId}>
          <CardContent className="px-3 pb-3 pt-0 border-t">
            {loading ? (
              <div
                className="py-6 text-center text-xs text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                불러오는 중...
              </div>
            ) : events.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2"
                aria-live="polite"
              >
                <Ticket className="h-7 w-7 opacity-30" aria-hidden="true" />
                <p className="text-xs">아직 이벤트가 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setAddEventOpen(true)}
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  첫 이벤트 추가
                </Button>
              </div>
            ) : (
              <div className="mt-2 space-y-2" aria-live="polite">
                {/* 전체 통계 요약 (이벤트 2개 이상) */}
                {stats.totalEvents > 1 && (
                  <TicketStatsSummary stats={stats} />
                )}

                {/* 이벤트 목록 */}
                <ul role="list" className="space-y-2" aria-label="이벤트 목록">
                  {events.map((event) => (
                    <li key={event.id} role="listitem">
                      <EventPanel
                        event={event}
                        onDeleteEvent={deleteEvent}
                        onAddTier={(eventId, type, price, totalSeats, description) =>
                          addTier(eventId, { type, price, totalSeats, description })
                        }
                        onDeleteTier={deleteTier}
                        onAddSale={addSale}
                        onDeleteSale={deleteSale}
                        getEventStats={getEventStats}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        onAdd={(eventName, eventDate) => addEvent({ eventName, eventDate })}
      />
    </Card>
  );
}
