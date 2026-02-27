"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { GroupCard } from "@/components/groups/group-card";
import { JoinGroupModal } from "@/components/groups/invite-modal";
import { useGroups } from "@/hooks/use-groups";
import { useNotifications } from "@/hooks/use-notifications";
import { useTodaySchedules } from "@/hooks/use-schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, Bell } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { groups, loading } = useGroups();
  const { schedules: todaySchedules, loading: schedulesLoading } = useTodaySchedules();
  const { notifications, loading: notificationsLoading } = useNotifications(5);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 오늘의 일정 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              오늘의 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : todaySchedules.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">오늘 예정된 일정이 없습니다</p>
            ) : (
              <ul className="space-y-2">
                {todaySchedules.map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground shrink-0 pt-0.5 w-10">
                      {format(new Date(s.starts_at), "HH:mm")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.title}</p>
                      {s.location && (
                        <p className="text-[10px] text-muted-foreground truncate">{s.location}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 최근 알림 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              최근 알림
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">새 알림이 없습니다</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                    <div className={`min-w-0 ${n.is_read ? "ml-3.5" : ""}`}>
                      {n.link ? (
                        <Link href={n.link} className="text-xs font-medium hover:underline truncate block">
                          {n.title}
                        </Link>
                      ) : (
                        <p className="text-xs font-medium truncate">{n.title}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 내 그룹 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">내 그룹</h1>
            <div className="flex gap-2">
              <JoinGroupModal />
              <Button variant="outline" size="sm" className="h-8 text-sm" asChild>
                <Link href="/groups/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  새 그룹
                </Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-muted-foreground">아직 참여한 그룹이 없습니다</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" className="h-8" asChild>
                  <Link href="/groups/new">그룹 만들기</Link>
                </Button>
                <JoinGroupModal trigger={<Button variant="outline" size="sm" className="h-8">초대 코드로 참여</Button>} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
