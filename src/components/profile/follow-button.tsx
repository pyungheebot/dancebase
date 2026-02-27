"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/use-follow";
import { UserPlus, UserCheck, Users } from "lucide-react";

type FollowButtonProps = {
  targetUserId: string;
};

export function FollowButton({ targetUserId }: FollowButtonProps) {
  const { isFollowing, isMutual, toggling, toggleFollow, loaded } =
    useFollow(targetUserId);
  const [hovered, setHovered] = useState(false);

  if (!loaded) return null;

  const getLabel = () => {
    if (hovered && isFollowing) return "언팔로우";
    if (isMutual) return "맞팔로우";
    if (isFollowing) return "팔로잉";
    return "팔로우";
  };

  const getIcon = () => {
    if (isMutual) return <Users className="h-4 w-4 mr-1" />;
    if (isFollowing) return <UserCheck className="h-4 w-4 mr-1" />;
    return <UserPlus className="h-4 w-4 mr-1" />;
  };

  const getVariant = () => {
    if (hovered && isFollowing) return "destructive" as const;
    if (isFollowing) return "secondary" as const;
    return "default" as const;
  };

  return (
    <Button
      variant={getVariant()}
      onClick={toggleFollow}
      disabled={toggling}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="min-w-[110px]"
    >
      {getIcon()}
      {toggling ? "처리 중..." : getLabel()}
    </Button>
  );
}
