"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import { useFollow } from "@/hooks/use-follow";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SendMessageDialog } from "@/components/messages/send-message-dialog";
import { InviteToGroupDialog } from "@/components/user/invite-to-group-dialog";
import { InviteToProjectDialog } from "@/components/user/invite-to-project-dialog";
import { User, Mail, UserPlus, FolderPlus, UserCheck, Users } from "lucide-react";
import type { Profile } from "@/types";

// 팝오버용 경량 프로필 훅 (열렸을 때만 fetch)
function usePopoverProfile(userId: string, enabled: boolean) {
  const { data, isLoading } = useSWR(
    enabled ? swrKeys.userProfile(userId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, dance_genre, bio")
        .eq("id", userId)
        .single();
      if (error) return null;
      return data as Pick<Profile, "id" | "name" | "avatar_url" | "dance_genre" | "bio">;
    },
    { revalidateOnFocus: false },
  );
  return { profile: data ?? null, loading: isLoading };
}

// 팔로우 버튼 (팝오버 전용 소형)
function PopoverFollowButton({ targetUserId }: { targetUserId: string }) {
  const { isFollowing, isMutual, toggling, toggleFollow, loaded } = useFollow(targetUserId);
  const [hovered, setHovered] = useState(false);

  if (!loaded) return null;

  const label = hovered && isFollowing ? "언팔로우" : isMutual ? "맞팔로우" : isFollowing ? "팔로잉" : "팔로우";
  const variant = hovered && isFollowing ? "destructive" as const : isFollowing ? "secondary" as const : "default" as const;
  const Icon = isMutual ? Users : isFollowing ? UserCheck : UserPlus;

  return (
    <Button
      size="sm"
      variant={variant}
      disabled={toggling}
      onClick={toggleFollow}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-7 text-xs w-full"
    >
      <Icon className="h-3 w-3 mr-1" />
      {toggling ? "처리 중..." : label}
    </Button>
  );
}

// 미니 프로필 스켈레톤
function ProfileSkeleton() {
  return (
    <div className="px-3 pt-3 pb-2 animate-pulse">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-14 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-muted mb-1" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

// 미니 프로필 섹션
function MiniProfile({ userId, displayName }: { userId: string; displayName: string }) {
  const { profile, loading } = usePopoverProfile(userId, true);

  if (loading) return <ProfileSkeleton />;

  const name = profile?.name ?? displayName;
  const avatarUrl = profile?.avatar_url ?? null;
  const genres = profile?.dance_genre ?? [];
  const bio = profile?.bio ?? null;
  const initials = name.slice(0, 2);

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar className="h-10 w-10 shrink-0">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} />
          ) : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{name}</p>
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {genres.slice(0, 2).map((g) => (
                <Badge
                  key={g}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {g}
                </Badge>
              ))}
              {genres.length > 2 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  +{genres.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      {bio && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
          {bio}
        </p>
      )}
      <PopoverFollowButton targetUserId={userId} />
    </div>
  );
}

interface UserPopoverMenuProps {
  userId: string;
  displayName: string;
  groupId?: string;
  className?: string;
  children?: React.ReactNode;
}

export function UserPopoverMenu({
  userId,
  displayName,
  groupId,
  className,
  children,
}: UserPopoverMenuProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [groupInviteOpen, setGroupInviteOpen] = useState(false);
  const [projectInviteOpen, setProjectInviteOpen] = useState(false);

  // 본인 클릭 → 프로필로 직접 이동
  if (user?.id === userId) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => router.push(`/users/${userId}`)}
      >
        {children ?? displayName}
      </button>
    );
  }

  const openDialog = (dialog: "message" | "group" | "project") => {
    setPopoverOpen(false);
    // 약간 지연하여 focus trap 충돌 방지
    setTimeout(() => {
      if (dialog === "message") setMessageOpen(true);
      else if (dialog === "group") setGroupInviteOpen(true);
      else if (dialog === "project") setProjectInviteOpen(true);
    }, 100);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={className}>
            {children ?? displayName}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" align="start">
          {/* 미니 프로필 — 팝오버가 열릴 때만 마운트 */}
          {popoverOpen && (
            <MiniProfile userId={userId} displayName={displayName} />
          )}

          <Separator />

          {/* 액션 버튼 */}
          <div className="p-1">
            <button
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              onClick={() => {
                setPopoverOpen(false);
                router.push(`/users/${userId}`);
              }}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              프로필 보기
            </button>
            <button
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              onClick={() => openDialog("message")}
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              쪽지 보내기
            </button>
            <button
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              onClick={() => openDialog("group")}
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              그룹에 초대
            </button>
            {groupId && (
              <button
                className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                onClick={() => openDialog("project")}
              >
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
                프로젝트에 초대
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <SendMessageDialog
        receiverId={userId}
        receiverName={displayName}
        open={messageOpen}
        onOpenChange={setMessageOpen}
      />

      <InviteToGroupDialog
        userId={userId}
        userName={displayName}
        open={groupInviteOpen}
        onOpenChange={setGroupInviteOpen}
      />

      {groupId && (
        <InviteToProjectDialog
          userId={userId}
          userName={displayName}
          groupId={groupId}
          open={projectInviteOpen}
          onOpenChange={setProjectInviteOpen}
        />
      )}
    </>
  );
}
