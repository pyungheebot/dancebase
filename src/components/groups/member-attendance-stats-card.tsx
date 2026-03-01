"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMemberAttendanceStatsDashboard } from "@/hooks/use-member-attendance-stats-dashboard";
import type { MemberAttendStatPeriod } from "@/types";
import { ALL_PERIODS, PERIOD_LABEL, getRateTextColor } from "./member-attendance-stats/types";
import { AddRecordDialog } from "./member-attendance-stats/add-record-dialog";
import { OverviewTab } from "./member-attendance-stats/overview-tab";
import { RankingTab } from "./member-attendance-stats/ranking-tab";
import { TrendTab } from "./member-attendance-stats/trend-tab";
import { RecordsTab } from "./member-attendance-stats/records-tab";

// ─── 타입 ────────────────────────────────────────────────────

interface MemberAttendanceStatsCardProps {
  groupId: string;
  memberNames?: string[];
}

// ─── 탭 정의 ─────────────────────────────────────────────────

type ActiveTab = "overview" | "ranking" | "trend" | "records";

const TABS: Array<{ key: ActiveTab; label: string }> = [
  { key: "overview", label: "개요" },
  { key: "ranking", label: "랭킹" },
  { key: "trend", label: "추이" },
  { key: "records", label: "기록" },
];

// ─── 메인 카드 ───────────────────────────────────────────────

export function MemberAttendanceStatsCard({
  groupId,
  memberNames,
}: MemberAttendanceStatsCardProps) {
  const [open, setOpen] = useState(true);
  const [period, setPeriod] = useState<MemberAttendStatPeriod>("all");
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const {
    records,
    addRecord,
    deleteRecord,
    getMemberSummaries,
    getOverallStats,
    getMonthlyTrend,
  } = useMemberAttendanceStatsDashboard(groupId);

  const summaries = useMemo(
    () => getMemberSummaries(period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, period]
  );
  const overall = useMemo(
    () => getOverallStats(period),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, period]
  );
  const monthlyTrend = useMemo(
    () => getMonthlyTrend(6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records]
  );
  const recentRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [records]
  );

  const cardId = "member-attendance-stats-card";
  const tabPanelId = `${cardId}-panel-${activeTab}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="rounded-xl border bg-card shadow-sm overflow-hidden"
        aria-labelledby={`${cardId}-heading`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              aria-expanded={open}
              aria-controls={`${cardId}-content`}
            >
              <BarChart3 className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              <span
                className="text-sm font-semibold text-gray-800"
                id={`${cardId}-heading`}
              >
                멤버 출석 통계
              </span>
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-600 hover:bg-indigo-100">
                {overall.totalRecords}건
              </Badge>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>
          <AddRecordDialog memberNames={memberNames} onAdd={addRecord} />
        </div>

        <CollapsibleContent id={`${cardId}-content`}>
          <div className="p-4 space-y-4">
            {/* 기간 필터 */}
            <div className="flex gap-1" role="group" aria-label="조회 기간 선택">
              {ALL_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    period === p
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>

            {/* 요약 통계 카드 */}
            <dl className="grid grid-cols-3 gap-2" aria-label="출석 요약 통계">
              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-center">
                <dd className="text-base font-bold text-indigo-600">
                  {overall.totalRecords}
                </dd>
                <dt className="text-[10px] text-indigo-400">전체 기록</dt>
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
                <dd className={`text-base font-bold ${getRateTextColor(overall.overallAttendanceRate)}`}>
                  {overall.overallAttendanceRate}%
                </dd>
                <dt className="text-[10px] text-green-400">출석률</dt>
              </div>
              <div className="rounded-lg bg-yellow-50 px-3 py-2 text-center">
                <dd className="text-base font-bold text-yellow-600">
                  {overall.perfectAttendanceMembers.length}
                </dd>
                <dt className="text-[10px] text-yellow-400">개근 멤버</dt>
              </div>
            </dl>

            {/* 우수/부진 멤버 하이라이트 */}
            {(overall.topAttendee || overall.mostAbsentee) && (
              <div
                className="flex gap-2 flex-wrap"
                aria-label="출석 하이라이트"
                aria-live="polite"
              >
                {overall.topAttendee && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-yellow-50 border border-yellow-100 px-2.5 py-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-[9px] text-yellow-500 font-medium">최다 출석</p>
                      <p className="text-[11px] font-semibold text-yellow-700 leading-tight">
                        {overall.topAttendee}
                      </p>
                    </div>
                  </div>
                )}
                {overall.mostAbsentee && overall.mostAbsentee !== overall.topAttendee && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="text-[9px] text-red-400 font-medium">최다 결석</p>
                      <p className="text-[11px] font-semibold text-red-600 leading-tight">
                        {overall.mostAbsentee}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 개근 멤버 배지 */}
            {overall.perfectAttendanceMembers.length > 0 && (
              <div
                className="flex items-center gap-1.5 flex-wrap"
                aria-label={`개근 멤버: ${overall.perfectAttendanceMembers.join(", ")}`}
              >
                <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-semibold text-yellow-700">개근:</span>
                {overall.perfectAttendanceMembers.map((name) => (
                  <Badge
                    key={name}
                    className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* 탭 */}
            <div
              className="flex gap-1 flex-wrap"
              role="tablist"
              aria-label="출석 통계 탭"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  id={`${cardId}-tab-${tab.key}`}
                  aria-selected={activeTab === tab.key}
                  aria-controls={activeTab === tab.key ? tabPanelId : undefined}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 패널 */}
            <div
              role="tabpanel"
              id={tabPanelId}
              aria-labelledby={`${cardId}-tab-${activeTab}`}
              tabIndex={0}
            >
              {activeTab === "overview" && (
                <OverviewTab records={records} summaries={summaries} period={period} />
              )}
              {activeTab === "ranking" && (
                <RankingTab
                  summaries={summaries}
                  topAttendee={overall.topAttendee}
                  mostAbsentee={overall.mostAbsentee}
                />
              )}
              {activeTab === "trend" && (
                <TrendTab hasRecords={records.length > 0} monthlyTrend={monthlyTrend} />
              )}
              {activeTab === "records" && (
                <RecordsTab
                  records={records}
                  recentRecords={recentRecords}
                  onDelete={deleteRecord}
                />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
