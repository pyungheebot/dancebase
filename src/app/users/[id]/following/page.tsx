"use client";

import { use } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { useFollowList } from "@/hooks/use-follow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FollowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { profiles, loading } = useFollowList(id, "following");

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link href={`/users/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <h1 className="text-base font-semibold">팔로잉</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            팔로잉하는 사용자가 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/users/${profile.id}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded border hover:bg-accent transition-colors"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {profile.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
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
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
