"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUnreadCount } from "@/hooks/use-messages";
import { Badge } from "@/components/ui/badge";
import { Music, LogOut, User, Mail, Menu } from "lucide-react";

function UnreadBadge() {
  const { count } = useUnreadCount();
  if (count <= 0) return null;
  return (
    <Badge className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 text-[9px] leading-none">
      {count > 99 ? "99+" : count}
    </Badge>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-6 w-6 rounded-full" aria-label="내 메뉴">
                  <Avatar className="h-6 w-6">
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
