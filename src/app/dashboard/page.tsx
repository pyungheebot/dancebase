"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { GroupCard } from "@/components/groups/group-card";
import { JoinGroupModal } from "@/components/groups/invite-modal";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";
import { DashboardQuickStats } from "@/components/dashboard/dashboard-quick-stats";
import { ContactVerifyBanner } from "@/components/members/contact-verify-banner";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { MyMonthlySummaryCard } from "@/components/dashboard/my-monthly-summary-card";
import { useGroups } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useTodaySchedules } from "@/hooks/use-schedule";
import { useDeadlineProjects } from "@/hooks/use-deadline-projects";
import { useUpcomingPayments } from "@/hooks/use-upcoming-payments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/shared/page-skeleton";
import { Plus, Calendar, Bell, AlertCircle, CreditCard, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { groups, loading } = useGroups();
  const { user } = useAuth();
  const { schedules: todaySchedules, loading: schedulesLoading } = useTodaySchedules();
  const { notifications, loading: notificationsLoading } = useNotifications(5);
  const { projects: deadlineProjects, loading: deadlineLoading } = useDeadlineProjects();
  const { payments, unpaidPayments, loading: paymentsLoading } = useUpcomingPayments();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 온보딩 시작 가이드 */}
        <OnboardingGuide />

        {/* 연락처 재확인 배너 — 각 그룹별로 미확인 상태인 경우에만 표시 */}
        {!loading && user && groups.length > 0 && (
          <div className="space-y-2">
            {groups.map((group) => (
              <ContactVerifyBanner
                key={group.id}
                groupId={group.id}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}

        {/* 이번 달 내 활동 요약 카드 */}
        <section aria-label="이번 달 내 활동 요약">
          <MyMonthlySummaryCard />
        </section>

        {/* 오늘의 일정 카드 */}
        <section aria-label="오늘의 일정">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                오늘의 일정
              </CardTitle>
            </CardHeader>
            <CardContent aria-live="polite" aria-atomic="false">
              {schedulesLoading ? (
                <div className="space-y-2 py-1" aria-label="일정 불러오는 중" aria-busy="true">
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
                      <span className="text-xs text-muted-foreground shrink-0 pt-0.5 w-10" aria-label={`시간: ${format(new Date(s.starts_at), "HH:mm")}`}>
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
        </section>

        {/* 마감 임박 프로젝트 카드 - 데이터가 있을 때만 표시 */}
        {(deadlineLoading || deadlineProjects.length > 0) && (
          <section aria-label="마감 임박 프로젝트">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-orange-500" aria-hidden="true" />
                  마감 임박 프로젝트
                </CardTitle>
              </CardHeader>
              <CardContent aria-live="polite" aria-atomic="false">
                {deadlineLoading ? (
                  <div className="space-y-2 py-1" aria-label="마감 임박 프로젝트 불러오는 중" aria-busy="true">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {deadlineProjects.map((project) => {
                      const ddayLabel =
                        project.diff_days === 0 ? "D-day" : `D-${project.diff_days}`;
                      const ddayColor =
                        project.diff_days === 0
                          ? "bg-red-100 text-red-700"
                          : project.diff_days <= 3
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700";

                      return (
                        <li key={project.id}>
                          <Link
                            href={`/groups/${project.group_id}/projects/${project.id}`}
                            className="flex items-center justify-between gap-2 rounded-md hover:bg-accent transition-colors px-1 py-0.5"
                            aria-label={`${project.name}, ${project.group_name}, ${ddayLabel}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{project.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {project.group_name}
                              </p>
                            </div>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 font-normal border-0 shrink-0 ${ddayColor}`}
                              aria-hidden="true"
                            >
                              {ddayLabel}
                            </Badge>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* 결제 현황 카드 - 이번 달 거래가 있을 때만 표시 */}
        {(paymentsLoading || payments.length > 0) && (
          <section aria-label="이번 달 결제 현황">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <CreditCard
                    className={`h-4 w-4 ${unpaidPayments.length > 0 ? "text-red-500" : "text-green-500"}`}
                    aria-hidden="true"
                  />
                  결제 현황
                  <span className="text-[10px] font-normal text-muted-foreground ml-auto">
                    이번 달
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent aria-live="polite" aria-atomic="false">
                {paymentsLoading ? (
                  <div className="space-y-2 py-1" aria-label="결제 현황 불러오는 중" aria-busy="true">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : unpaidPayments.length === 0 ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" aria-hidden="true" />
                    <p className="text-xs text-green-600 font-medium">이번 달 결제 완료</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {unpaidPayments.map((payment) => (
                      <li key={payment.id}>
                        <Link
                          href={`/groups/${payment.group_id}/finance`}
                          className="flex items-center justify-between gap-2 rounded-md hover:bg-accent transition-colors px-1 py-0.5"
                          aria-label={`미납: ${payment.title}, ${payment.amount.toLocaleString()}원, ${payment.group_name}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{payment.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {payment.group_name}
                              {payment.project_name && ` · ${payment.project_name}`}
                              {" · "}
                              {format(new Date(payment.transaction_date), "M월 d일", { locale: ko })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                            <span className="text-xs font-semibold text-red-600">
                              {payment.amount.toLocaleString()}원
                            </span>
                            <Badge className="text-[10px] px-1.5 py-0 font-normal border-0 bg-red-100 text-red-700">
                              미납
                            </Badge>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* 최근 알림 카드 */}
        <section aria-label="최근 알림">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Bell className="h-4 w-4" aria-hidden="true" />
                최근 알림
              </CardTitle>
            </CardHeader>
            <CardContent aria-live="polite" aria-atomic="false">
              {notificationsLoading ? (
                <div className="space-y-2 py-1" aria-label="알림 불러오는 중" aria-busy="true">
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
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"
                          aria-label="읽지 않은 알림"
                        />
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
        </section>

        {/* 최근 활동 피드 - 그룹이 있을 때만 표시 */}
        {!loading && groups.length > 0 && (
          <section aria-label="최근 활동 피드">
            <RecentActivityFeed
              groupIds={groups.map((g) => g.id)}
              limit={20}
            />
          </section>
        )}

        {/* 그룹별 핵심 수치 위젯 */}
        {!loading && groups.length > 0 && (
          <section aria-label="그룹별 핵심 수치">
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground px-0.5">
                    {group.name}
                  </p>
                  <DashboardQuickStats groupId={group.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 내 그룹 섹션 */}
        <section aria-label="내 그룹 목록">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">내 그룹</h1>
            <div className="flex gap-2" role="toolbar" aria-label="그룹 액션">
              <JoinGroupModal />
              <Button variant="outline" size="sm" className="h-8 text-sm" asChild>
                <Link href="/groups/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  새 그룹
                </Link>
              </Button>
            </div>
          </div>

          <div aria-live="polite" aria-atomic="false">
            {loading ? (
              <CardGridSkeleton count={4} />
            ) : groups.length === 0 ? (
              <div className="text-center py-20 space-y-4" role="status">
                <p className="text-muted-foreground">아직 참여한 그룹이 없습니다</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" className="h-8" asChild>
                    <Link href="/groups/new">그룹 만들기</Link>
                  </Button>
                  <JoinGroupModal trigger={<Button variant="outline" size="sm" className="h-8">초대 코드로 참여</Button>} />
                </div>
              </div>
            ) : (
              <div className="space-y-1" role="list" aria-label="그룹 목록">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
