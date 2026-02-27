"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnreadCount } from "@/hooks/use-messages";
import { useNotifications, useUnreadNotificationCount } from "@/hooks/use-notifications";
import { Badge } from "@/components/ui/badge";
import { Music, LogOut, User, Mail, Menu, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

function UnreadBadge() {
  const { count } = useUnreadCount();
  if (count <= 0) return null;
  return (
    <Badge className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 text-[9px] leading-none">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

function NotificationDropdown() {
  const { count } = useUnreadNotificationCount();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(10);
  const router = useRouter();

  const handleNotificationClick = async (id: string, link: string | null) => {
    await markAsRead(id);
    if (link) router.push(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-6 w-6" aria-label="알림">
          <Bell className="h-3.5 w-3.5" />
          {count > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 text-[9px] leading-none">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-semibold">알림</span>
          {count > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              모두 읽음
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            알림이 없습니다
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 px-2 py-2 cursor-pointer ${!n.is_read ? "bg-blue-50/50" : ""}`}
              onClick={() => handleNotificationClick(n.id, n.link)}
            >
              <div className="flex items-center gap-1.5 w-full">
                {!n.is_read && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
                <span className={`text-xs font-medium truncate ${n.is_read ? "ml-3" : ""}`}>
                  {n.title}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2 pl-3">{n.message}</p>
              <span className="text-[10px] text-muted-foreground pl-3">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="border-b bg-background">
      <div className="flex h-10 items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 md:hidden"
              onClick={onMenuClick}
              aria-label="메뉴"
            >
              <Menu className="h-3.5 w-3.5" />
            </Button>
          )}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-1.5">
            <Music className="h-4 w-4" />
            <span className="text-sm font-bold">Groop</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative h-6 w-6" asChild aria-label="쪽지">
                <Link href="/messages">
                  <Mail className="h-3.5 w-3.5" />
                  <UnreadBadge />
                </Link>
              </Button>
              <NotificationDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-6 w-6 rounded-full" aria-label="내 메뉴">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs font-medium">
                    <User className="mr-1.5 h-3 w-3" />
                    {profile?.name || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-xs">
                    <Link href={`/users/${user.id}`}>
                      <User className="mr-1.5 h-3 w-3" />
                      내 프로필 보기
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-xs">
                    <LogOut className="mr-1.5 h-3 w-3" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" className="h-6 text-xs px-2" asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
