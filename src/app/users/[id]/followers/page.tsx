"use client";

import { use } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { useFollowList } from "@/hooks/use-follow";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/profile/follow-button";

export default function FollowersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { profiles, loading } = useFollowList(id, "followers");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild aria-label="뒤로">
            <Link href={`/users/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <h1 className="text-base font-semibold">팔로워</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            팔로워가 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded border hover:bg-accent transition-colors"
              >
                <Link
                  href={`/users/${profile.id}`}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <UserAvatar
                    name={profile.name || "U"}
                    avatarUrl={profile.avatar_url}
                    size="xs"
                    className="h-6 w-6"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{profile.name}</p>
                    {profile.dance_genre?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.dance_genre.map((genre) => (
                          <Badge key={genre} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
                {user && user.id !== profile.id && (
                  <FollowButton targetUserId={profile.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
