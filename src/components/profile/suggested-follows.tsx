"use client";

import { useSuggestedFollows } from "@/hooks/use-follow";
import { FollowButton } from "@/components/profile/follow-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function SuggestedFollows() {
  const { suggestions, loading } = useSuggestedFollows();

  if (loading || suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="px-3 py-2">
        <CardTitle className="text-xs">추천 팔로우</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded border hover:bg-accent transition-colors"
            >
              <Link
                href={`/users/${s.id}`}
                className="flex items-center gap-2 min-w-0 flex-1"
              >
                <UserAvatar
                  name={s.name || "U"}
                  avatarUrl={s.avatar_url}
                  size="xs"
                  className="h-6 w-6"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.shared_group_count}개 그룹에서 함께 활동
                  </p>
                </div>
              </Link>
              <FollowButton targetUserId={s.id} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
