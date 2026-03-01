"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  CalendarDays,
  Wallet,
  UserPlus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, formatISO } from "date-fns";

// ─── 내 통계 타입 ────────────────────────────────────────────────────────────
type GroupStats = {
  group_id: string;
  group_name: string;
  total_schedules: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  early_leave_count: number;
  attendance_rate: number;
};

// ─── 그룹 운영 현황 타입 ─────────────────────────────────────────────────────
type GroupOverview = {
  group_id: string;
  group_name: string;
  member_count: number;
  schedule_count: number;
  attendance_rate: number;
  income: number;
  expense: number;
  pending_requests: number;
  loading: boolean;
};

// ─── 유틸 ────────────────────────────────────────────────────────────────────
function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

// ─── 그룹 운영 현황 카드 ─────────────────────────────────────────────────────
function GroupOverviewCard({ overview }: { overview: GroupOverview }) {
  if (overview.loading) {
    return (
      <Card className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">{overview.group_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* 멤버 수 */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              총 멤버
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {overview.member_count}명
            </span>
          </div>

          {/* 이번 달 일정 */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              이번 달 일정
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {overview.schedule_count}회
            </span>
          </div>

          {/* 평균 출석률 */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              평균 출석률
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {overview.attendance_rate}%
            </span>
          </div>

          {/* 가입 신청 */}
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <UserPlus className="h-3 w-3" />
              대기 신청
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {overview.pending_requests}건
            </span>
          </div>
        </div>

        {/* 수입/지출 */}
        <div className="mt-3 flex items-center gap-4 rounded border px-3 py-2">
          <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">수입</span>
            <span className="font-semibold text-green-600 tabular-nums">
              +{formatAmount(overview.income)}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">지출</span>
            <span className="font-semibold text-red-600 tabular-nums">
              -{formatAmount(overview.expense)}
            </span>
          </span>
          <span className="ml-auto text-xs">
            <span className="text-muted-foreground">잔액 </span>
            <span
              className={`font-semibold tabular-nums ${
                overview.income - overview.expense >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {formatAmount(overview.income - overview.expense)}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
export default function StatsPage() {
  const supabase = createClient();

  // ── 내 통계 상태 ─────────────────────────────────────────────────────────
  const [stats, setStats] = useState<GroupStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── 그룹 운영 현황 상태 ───────────────────────────────────────────────────
  const [overviews, setOverviews] = useState<GroupOverview[]>([]);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  // ── 탭 상태 ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("my-stats");

  // ── 내 통계 조회 ─────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.rpc("get_user_attendance_stats", {
      p_user_id: user.id,
    });

    if (data) {
      const groupStats: GroupStats[] = data.map(
        (row: {
          group_id: string;
          group_name: string;
          total_schedules: number;
          present_count: number;
          late_count: number;
          absent_count: number;
          early_leave_count: number;
        }) => {
          const total = Number(row.total_schedules);
          const present = Number(row.present_count);
          const late = Number(row.late_count);
          const absent = Number(row.absent_count);
          const earlyLeave = Number(row.early_leave_count);
          const rate =
            total > 0
              ? Math.round(((present + late + earlyLeave) / total) * 100)
              : 0;
          return {
            group_id: row.group_id,
            group_name: row.group_name,
            total_schedules: total,
            present_count: present,
            late_count: late,
            absent_count: absent,
            early_leave_count: earlyLeave,
            attendance_rate: rate,
          };
        }
      );
      setStats(groupStats);
    }

    setStatsLoading(false);
  }, [supabase]);

  // ── 그룹 운영 현황 조회 ───────────────────────────────────────────────────
  const fetchOverviews = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 내가 리더인 그룹 목록
    const { data: memberRows, error: memberErr } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", user.id)
      .eq("role", "leader");

    if (memberErr || !memberRows || memberRows.length === 0) {
      setOverviews([]);
      setOverviewLoaded(true);
      return;
    }

    type MemberRow = {
      group_id: string;
      groups: { id: string; name: string } | null;
    };

    const leaderGroups = (memberRows as MemberRow[])
      .filter((r) => r.groups)
      .map((r) => ({ id: r.group_id, name: r.groups!.name }));

    // 이번 달 범위
    const now = new Date();
    const monthStart = formatISO(startOfMonth(now), { representation: "date" });
    const monthEnd = formatISO(endOfMonth(now), { representation: "date" });

    // 로딩 플레이스홀더
    setOverviews(
      leaderGroups.map((g) => ({
        group_id: g.id,
        group_name: g.name,
        member_count: 0,
        schedule_count: 0,
        attendance_rate: 0,
        income: 0,
        expense: 0,
        pending_requests: 0,
        loading: true,
      }))
    );
    setOverviewLoaded(true);

    // 각 그룹 병렬 조회
    const results = await Promise.all(
      leaderGroups.map(async (g) => {
        const [memberRes, scheduleRes, financeRes, requestRes] =
          await Promise.all([
            // 총 멤버 수
            supabase
              .from("group_members")
              .select("id", { count: "exact", head: true })
              .eq("group_id", g.id),

            // 이번 달 일정
            supabase
              .from("schedules")
              .select("id")
              .eq("group_id", g.id)
              .gte("starts_at", `${monthStart}T00:00:00`)
              .lte("starts_at", `${monthEnd}T23:59:59`),

            // 이번 달 수입/지출
            supabase
              .from("finance_transactions")
              .select("type, amount")
              .eq("group_id", g.id)
              .gte("transaction_date", monthStart)
              .lte("transaction_date", monthEnd),

            // 대기 중인 가입 신청
            supabase
              .from("join_requests")
              .select("id", { count: "exact", head: true })
              .eq("group_id", g.id)
              .eq("status", "pending"),
          ]);

        const memberCount = memberRes.count ?? 0;
        const scheduleIds = (scheduleRes.data ?? []).map(
          (s: { id: string }) => s.id
        );
        const scheduleCount = scheduleIds.length;

        // 이번 달 출석률 계산
        let attendanceRate = 0;
        if (scheduleIds.length > 0) {
          const { data: attendanceRows } = await supabase
            .from("attendance")
            .select("status")
            .in("schedule_id", scheduleIds);

          if (attendanceRows && attendanceRows.length > 0) {
            const total = attendanceRows.length;
            const attended = attendanceRows.filter(
              (a: { status: string }) =>
                a.status === "present" ||
                a.status === "late" ||
                a.status === "early_leave"
            ).length;
            attendanceRate = Math.round((attended / total) * 100);
          }
        }

        // 수입/지출 집계
        type FinRow = { type: "income" | "expense"; amount: number };
        const finRows = (financeRes.data ?? []) as FinRow[];
        const income = finRows
          .filter((f) => f.type === "income")
          .reduce((sum, f) => sum + Number(f.amount), 0);
        const expense = finRows
          .filter((f) => f.type === "expense")
          .reduce((sum, f) => sum + Number(f.amount), 0);

        const pendingRequests = requestRes.count ?? 0;

        return {
          group_id: g.id,
          group_name: g.name,
          member_count: memberCount,
          schedule_count: scheduleCount,
          attendance_rate: attendanceRate,
          income,
          expense,
          pending_requests: pendingRequests,
          loading: false,
        } satisfies GroupOverview;
      })
    );

    setOverviews(results);
  }, [supabase]);

  useEffect(() => {
    startTransition(() => { fetchStats(); });
  }, [fetchStats]);

  // 그룹 운영 현황 탭 클릭 시 최초 1회만 조회
  useEffect(() => {
    if (activeTab === "group-overview" && !overviewLoaded) {
      startTransition(() => { fetchOverviews(); });
    }
  }, [activeTab, overviewLoaded, fetchOverviews]);

  // ── 내 통계 집계 ─────────────────────────────────────────────────────────
  const overallPresent = stats.reduce((sum, s) => sum + s.present_count, 0);
  const overallLate = stats.reduce((sum, s) => sum + s.late_count, 0);
  const overallEarlyLeave = stats.reduce(
    (sum, s) => sum + s.early_leave_count,
    0
  );
  const overallTotal = stats.reduce((sum, s) => sum + s.total_schedules, 0);
  const overallRate =
    overallTotal > 0
      ? Math.round(
          ((overallPresent + overallLate + overallEarlyLeave) / overallTotal) *
            100
        )
      : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-xl font-bold mb-4">통계</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="my-stats">내 통계</TabsTrigger>
            <TabsTrigger value="group-overview">그룹 운영 현황</TabsTrigger>
          </TabsList>

          {/* ─── 내 통계 탭 ──────────────────────────────────────────────── */}
          <TabsContent value="my-stats">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                출석 기록이 없습니다
              </p>
            ) : (
              <div className="space-y-4">
                {/* 전체 요약 — 인라인 */}
                <div className="flex items-center gap-4 text-xs border rounded px-3 py-2">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    전체{" "}
                    <span className="font-semibold tabular-nums">
                      {overallRate}%
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    출석{" "}
                    <span className="font-semibold tabular-nums">
                      {overallPresent}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-yellow-500" />
                    지각{" "}
                    <span className="font-semibold tabular-nums">
                      {overallLate}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    조퇴{" "}
                    <span className="font-semibold tabular-nums">
                      {overallEarlyLeave}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    결석{" "}
                    <span className="font-semibold tabular-nums">
                      {overallTotal -
                        overallPresent -
                        overallLate -
                        overallEarlyLeave}
                    </span>
                  </span>
                </div>

                {/* 그룹별 통계 */}
                <div>
                  <h2 className="text-xs font-medium text-muted-foreground mb-2">
                    그룹별
                  </h2>
                  <div className="space-y-1">
                    {stats.map((stat) => (
                      <div
                        key={stat.group_id}
                        className="rounded border px-3 py-2"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium">
                            {stat.group_name}
                          </span>
                          <span className="text-xs font-semibold tabular-nums">
                            {stat.attendance_rate}%
                          </span>
                        </div>
                        <div className="flex gap-4 text-[11px] text-muted-foreground mb-1.5">
                          <span>전체 {stat.total_schedules}회</span>
                          <span className="text-green-600">
                            출석 {stat.present_count}
                          </span>
                          <span className="text-yellow-600">
                            지각 {stat.late_count}
                          </span>
                          <span className="text-orange-600">
                            조퇴 {stat.early_leave_count}
                          </span>
                          <span className="text-red-600">
                            결석 {stat.absent_count}
                          </span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${stat.attendance_rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── 그룹 운영 현황 탭 ───────────────────────────────────────── */}
          <TabsContent value="group-overview">
            {!overviewLoaded ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : overviews.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">
                리더로 있는 그룹이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  이번 달 ({new Date().getFullYear()}년{" "}
                  {new Date().getMonth() + 1}월) 기준
                </p>
                {overviews.map((overview) => (
                  <GroupOverviewCard key={overview.group_id} overview={overview} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
