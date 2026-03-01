"use client";

import { useState } from "react";
import {
  PartyPopper,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTeamBuilding } from "@/hooks/use-team-building";
import { AddEventDialog } from "./team-building-dialogs";
import { EventCard } from "./team-building-event-card";
import { TeamBuildingStats } from "./team-building-stats";

type TeamBuildingCardProps = {
  groupId: string;
  memberNames?: string[];
  currentMemberName?: string;
};

export function TeamBuildingCard({
  groupId,
  memberNames = [],
  currentMemberName,
}: TeamBuildingCardProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    events,
    loading,
    addEvent,
    joinEvent,
    leaveEvent,
    addFeedback,
    toggleComplete,
    deleteEvent,
    stats,
  } = useTeamBuilding(groupId);

  const upcomingList = events
    .filter((e) => !e.isCompleted)
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedList = events
    .filter((e) => e.isCompleted)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent
            className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
            role="button"
            aria-expanded={open}
            aria-controls="team-building-content"
            aria-label={`팀빌딩 활동 ${open ? "접기" : "펼치기"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-purple-500" aria-hidden="true" />
                <span className="text-sm font-medium">팀빌딩 활동</span>
                {stats.upcomingEvents > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700"
                    aria-label={`예정 활동 ${stats.upcomingEvents}개`}
                  >
                    예정 {stats.upcomingEvents}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats.totalEvents > 0 && (
                  <span
                    className="text-[10px] text-muted-foreground"
                    aria-label={`총 ${stats.totalEvents}회`}
                  >
                    총 {stats.totalEvents}회
                  </span>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent id="team-building-content">
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <Separator />

            {/* 통계 요약 */}
            <TeamBuildingStats
              totalEvents={stats.totalEvents}
              completedEvents={stats.completedEvents}
              averageRating={stats.averageRating}
              topCategory={stats.topCategory}
            />

            {/* 추가 버튼 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs flex items-center gap-1"
              onClick={() => setAddDialogOpen(true)}
              aria-label="팀빌딩 활동 추가"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              팀빌딩 활동 추가
            </Button>

            {/* 탭: 예정 / 완료 */}
            <Tabs defaultValue="upcoming">
              <TabsList className="h-7 w-full">
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 text-[10px] h-6 flex items-center gap-1"
                  aria-label={`예정 활동 ${upcomingList.length}개`}
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  예정 ({upcomingList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex-1 text-[10px] h-6 flex items-center gap-1"
                  aria-label={`완료 활동 ${completedList.length}개`}
                >
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  완료 ({completedList.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-2 space-y-2">
                <div aria-live="polite" aria-label="예정 활동 목록">
                  {loading ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">
                      불러오는 중...
                    </p>
                  ) : upcomingList.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">
                      예정된 팀빌딩 활동이 없습니다.
                    </p>
                  ) : (
                    <ul role="list" className="space-y-2" aria-label={`예정 활동 ${upcomingList.length}개`}>
                      {upcomingList.map((event) => (
                        <li key={event.id} role="listitem">
                          <EventCard
                            event={event}
                            currentMemberName={currentMemberName}
                            onJoin={joinEvent}
                            onLeave={leaveEvent}
                            onFeedback={addFeedback}
                            onToggleComplete={toggleComplete}
                            onDelete={deleteEvent}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-2 space-y-2">
                <div aria-live="polite" aria-label="완료 활동 목록">
                  {loading ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">
                      불러오는 중...
                    </p>
                  ) : completedList.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">
                      완료된 팀빌딩 활동이 없습니다.
                    </p>
                  ) : (
                    <ul role="list" className="space-y-2" aria-label={`완료 활동 ${completedList.length}개`}>
                      {completedList.map((event) => (
                        <li key={event.id} role="listitem">
                          <EventCard
                            event={event}
                            currentMemberName={currentMemberName}
                            onJoin={joinEvent}
                            onLeave={leaveEvent}
                            onFeedback={addFeedback}
                            onToggleComplete={toggleComplete}
                            onDelete={deleteEvent}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={addEvent}
        memberNames={memberNames}
      />
    </Card>
  );
}
