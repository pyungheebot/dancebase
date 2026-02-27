"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { FollowButton } from "@/components/profile/follow-button";
import { UserActivityStats } from "@/components/user/user-activity-stats";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MapPin,
  Users,
  Instagram,
  Youtube,
  Phone,
  Cake,
  ChevronRight,
} from "lucide-react";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { profile, followerCount, followingCount, loading } =
    useUserProfile(id);

  // 본인 접근 시 /profile로 리다이렉트
  useEffect(() => {
    if (!authLoading && user && user.id === id) {
      router.replace("/profile");
    }
  }, [authLoading, user, id, router]);

  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            사용자를 찾을 수 없습니다
          </p>
        </div>
      </AppLayout>
    );
  }

  const groups = profile?.groups ?? [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        <Card>
          <CardContent className="pt-4">
            {/* 프로필 헤더 */}
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm">
                  {profile.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-base font-bold truncate">
                    {profile.name}
                  </h1>
                  {user && user.id !== id && (
                    <FollowButton targetUserId={id} />
                  )}
                </div>

                {/* 팔로워/팔로잉 수 */}
                <div className="flex gap-4 mt-2">
                  <Link
                    href={`/users/${id}/followers`}
                    className="text-xs hover:underline"
                  >
                    팔로워{" "}
                    <span className="font-semibold">{followerCount}</span>
                  </Link>
                  <Link
                    href={`/users/${id}/following`}
                    className="text-xs hover:underline"
                  >
                    팔로잉{" "}
                    <span className="font-semibold">{followingCount}</span>
                  </Link>
                </div>

                {/* 장르 뱃지 + 경력 기간 */}
                {profile.dance_genre && profile.dance_genre.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.dance_genre.map((genre) => {
                      const startDate =
                        profile.dance_genre_start_dates?.[genre];
                      let careerLabel = "";
                      if (startDate) {
                        const [y, m] = startDate.split("-").map(Number);
                        const now = new Date();
                        let months =
                          (now.getFullYear() - y) * 12 +
                          (now.getMonth() + 1 - m);
                        if (months < 0) months = 0;
                        const years = Math.floor(months / 12);
                        const rem = months % 12;
                        careerLabel =
                          years > 0
                            ? rem > 0
                              ? `${years}년 ${rem}개월`
                              : `${years}년`
                            : `${rem}개월`;
                      }
                      return (
                        <Badge key={genre} variant="outline">
                          {genre}
                          {careerLabel && (
                            <span className="ml-1 text-muted-foreground">
                              ({careerLabel})
                            </span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 자기소개 */}
            {profile.bio && (
              <>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
                <Separator className="my-4" />
              </>
            )}

            {/* 상세 정보 */}
            <div className="grid gap-3">
              {profile.teams && profile.teams.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">소속 팀:</span>
                  <span>{profile.teams.join(", ")}</span>
                </div>
              )}
              {profile.active_region && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">활동 지역:</span>
                  <span>{profile.active_region}</span>
                </div>
              )}
              {profile.birth_date && (
                <div className="flex items-center gap-2 text-xs">
                  <Cake className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">생년월일:</span>
                  <span>{profile.birth_date}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">전화번호:</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.instagram && (
                <div className="flex items-center gap-2 text-xs">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">인스타그램:</span>
                  <span>{profile.instagram}</span>
                </div>
              )}
              {profile.youtube && (
                <div className="flex items-center gap-2 text-xs">
                  <Youtube className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">유튜브:</span>
                  <span>{profile.youtube}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 활동 통계 섹션 */}
        <UserActivityStats userId={id} />

        {/* 소속 그룹 섹션 */}
        <Card>
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              소속 그룹
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                소속 그룹이 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={group.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{group.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {group.group_type}
                        </Badge>
                        {group.dance_genre.slice(0, 2).map((genre) => (
                          <Badge
                            key={genre}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {genre}
                          </Badge>
                        ))}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="h-3 w-3" />
                          {group.member_count}명
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
