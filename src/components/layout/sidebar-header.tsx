"use client";

/**
 * 사이드바 헤더 - 유저 아바타 + 계정 메뉴 Popover
 * useAuth, useRouter에 의존
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, UserCircle, Settings, LogOut } from "lucide-react";

type SidebarHeaderProps = {
  onNavigate?: () => void;
};

export function SidebarHeader({ onNavigate }: SidebarHeaderProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="px-3 pt-3 pb-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 w-full rounded-sm px-1.5 py-1 hover:bg-sidebar-accent transition-colors text-left"
            aria-label={`${profile?.name || "사용자"} 계정 메뉴`}
            aria-haspopup="dialog"
          >
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold rounded-sm">
                {profile?.name?.charAt(0)?.toUpperCase() || "G"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate flex-1" aria-hidden="true">
              {profile?.name || "Groop"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-40" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-52 p-1" role="menu" aria-label="계정 메뉴">
          <Link
            href={user ? `/users/${user.id}` : "#"}
            onClick={onNavigate}
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <UserCircle className="h-4 w-4 opacity-60" aria-hidden="true" />
            내 프로필
          </Link>
          <Link
            href="/profile"
            onClick={onNavigate}
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4 opacity-60" aria-hidden="true" />
            프로필 설정
          </Link>
          <div className="h-px bg-border my-1" role="separator" />
          <button
            onClick={handleSignOut}
            role="menuitem"
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors w-full text-left text-muted-foreground"
          >
            <LogOut className="h-4 w-4 opacity-60" aria-hidden="true" />
            로그아웃
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
