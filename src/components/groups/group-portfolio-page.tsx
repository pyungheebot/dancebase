"use client";

import Image from "next/image";
import { useGroupPortfolio } from "@/hooks/use-group-portfolio";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Video,
  Users,
  Calendar,
  ExternalLink,
  Star,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { differenceInMonths, parseISO } from "date-fns";
import { formatKo } from "@/lib/date-utils";

const EVENT_TYPE_LABELS: Record<string, string> = {
  performance: "공연",
  competition: "대회",
  showcase: "쇼케이스",
  workshop: "워크샵",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  performance: "bg-purple-100 text-purple-700 border-purple-200",
  competition: "bg-orange-100 text-orange-700 border-orange-200",
  showcase: "bg-pink-100 text-pink-700 border-pink-200",
  workshop: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "bg-red-100 text-red-700 border-red-200",
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  tiktok: "bg-gray-100 text-gray-700 border-gray-200",
  other: "bg-blue-100 text-blue-700 border-blue-200",
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function getActiveSinceLabel(createdAt: string) {
  try {
    const year = parseISO(createdAt).getFullYear();
    return `${year}년부터`;
  } catch {
    return "-";
  }
}

function getActiveMonths(createdAt: string) {
  try {
    const months = differenceInMonths(new Date(), parseISO(createdAt));
    return Math.max(1, months);
  } catch {
    return 0;
  }
}

function formatEventDate(dateStr: string) {
  try {
    return formatKo(parseISO(dateStr), "yyyy.MM.dd");
  } catch {
    return dateStr;
  }
}

export function GroupPortfolioPage({ groupId }: { groupId: string }) {
  const { portfolio, loading } = useGroupPortfolio(groupId);
  const { user } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">포트폴리오 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { group, performances, videos, members, stats } = portfolio;
  const activeMonths = getActiveMonths(group.created_at);

  return (
    <div className="min-h-screen bg-background">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-b from-muted/60 to-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">공개 포트폴리오</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{group.name}</h1>
          {group.description && (
            <p className="text-base text-muted-foreground mb-5 max-w-xl">{group.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {group.genre && (
              <Badge className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200">
                {group.genre}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1">
              <Calendar className="h-3 w-3" />
              {getActiveSinceLabel(group.created_at)}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 gap-1">
              <Users className="h-3 w-3" />
              {group.member_count}명
            </Badge>
          </div>
          {user ? (
            <Button
              size="sm"
              className="h-8 text-sm"
              onClick={() => router.push(`/groups/${groupId}/join`)}
            >
              가입 신청
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-sm"
              onClick={() => router.push("/login")}
            >
              로그인 후 가입 신청
            </Button>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* 활동 통계 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">활동 통계</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-3xl font-bold tabular-nums">{stats.totalSchedules}</p>
                <p className="text-xs text-muted-foreground mt-1">총 연습</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-3xl font-bold tabular-nums">{stats.totalPerformances}</p>
                <p className="text-xs text-muted-foreground mt-1">공연 / 대회</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-3xl font-bold tabular-nums">{activeMonths}</p>
                <p className="text-xs text-muted-foreground mt-1">활동 개월</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 성과 기록 */}
        {performances.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              성과 기록
            </h2>
            <div className="relative pl-4">
              {/* 세로 타임라인 라인 */}
              <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {performances.map((perf, idx) => (
                  <div key={idx} className="relative">
                    {/* 타임라인 점 */}
                    <div className="absolute -left-[17px] top-3 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                    <Card className="ml-3">
                      <CardContent className="py-3 px-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{perf.event_name}</p>
                            {perf.venue && (
                              <p className="text-xs text-muted-foreground mt-0.5">{perf.venue}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                EVENT_TYPE_COLORS[perf.event_type] ?? ""
                              }`}
                            >
                              {EVENT_TYPE_LABELS[perf.event_type] ?? perf.event_type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatEventDate(perf.event_date)}
                            </span>
                          </div>
                        </div>
                        {perf.result && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Trophy className="h-3 w-3 text-yellow-500 shrink-0" />
                            <span className="text-xs text-yellow-700">{perf.result}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 영상 갤러리 */}
        {videos.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-500" />
              영상 갤러리
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {videos.map((video, idx) => (
                <Card key={idx} className="flex flex-col">
                  <CardContent className="py-3 px-4 flex flex-col gap-2 h-full">
                    <p className="text-sm font-medium line-clamp-2 flex-1">{video.title}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          PLATFORM_COLORS[video.platform.toLowerCase()] ??
                          PLATFORM_COLORS.other
                        }`}
                      >
                        {video.platform}
                      </Badge>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        보기
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 팀 멤버 */}
        {members.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              팀 멤버
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className="flex-none w-24 flex flex-col items-center gap-2 py-3 px-2"
                >
                  {/* 아바타 */}
                  <div className="relative">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover border"
                        unoptimized
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold border">
                        {getInitial(member.name)}
                      </div>
                    )}
                    {member.role === "leader" && (
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400 absolute -top-0.5 -right-0.5" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-center leading-tight line-clamp-2">
                    {member.name}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 ${
                      member.role === "leader"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : member.role === "sub_leader"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {member.role === "leader"
                      ? "리더"
                      : member.role === "sub_leader"
                      ? "부리더"
                      : "멤버"}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 푸터 */}
      <footer className="border-t mt-10">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            DanceBase에서 관리되는 그룹입니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
