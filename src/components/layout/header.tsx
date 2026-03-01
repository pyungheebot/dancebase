"use client";

// Header 컴포넌트
// 접근성: role="navigation" + aria-label, aria-expanded (모바일 메뉴), 메시지 배지 aria-label

import { memo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Music, LogOut, User, Mail, Menu } from "lucide-react";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

// -------------------------------------------------------
// UnreadBadge: 메시지 읽지 않은 수 배지
// -------------------------------------------------------
const UnreadBadge = memo(function UnreadBadge() {
  const { count } = useUnreadCount();
  if (count <= 0) return null;

  return (
    // 시각적 배지: aria-hidden으로 숨기고 스크린리더는 부모 aria-label로 처리
    <Badge
      className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 text-[9px] leading-none"
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
});

// -------------------------------------------------------
// Header: 최상단 헤더 컴포넌트
// -------------------------------------------------------
export function Header({ onMenuClick, isSidebarOpen }: {
  onMenuClick?: () => void;
  // 모바일 사이드바 열림 상태 (aria-expanded 반영용)
  isSidebarOpen?: boolean;
} = {}) {
  const { user, profile, signOut } = useAuth();
  const { count: unreadMessageCount } = useUnreadCount();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // 읽지 않은 메시지 수에 따른 동적 aria-label
  const messageAriaLabel =
    unreadMessageCount > 0
      ? `메시지, 읽지 않은 메시지 ${unreadMessageCount > 99 ? "99개 이상" : `${unreadMessageCount}개`}`
      : "메시지";

  return (
    // role="banner": 페이지 최상단 헤더 랜드마크
    <header className="border-b bg-background" role="banner">
      <div className="flex h-10 items-center justify-between px-3">

        {/* 로고 영역 */}
        <div className="flex items-center gap-1.5">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 min-h-[44px] min-w-[44px] md:h-6 md:w-6 md:min-h-0 md:min-w-0 md:hidden"
              onClick={onMenuClick}
              // aria-expanded: 사이드바 열림 상태를 스크린리더에 전달
              aria-expanded={isSidebarOpen ?? false}
              aria-label={isSidebarOpen ? "사이드바 메뉴 닫기" : "사이드바 메뉴 열기"}
              aria-controls="sidebar"
            >
              <Menu className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-1.5"
            aria-label="Groop 홈으로 이동"
          >
            <Music className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-bold">Groop</span>
          </Link>
        </div>

        {/* 상단 탐색 영역: role="navigation" + aria-label */}
        <nav
          role="navigation"
          aria-label="상단 탐색"
          className="flex items-center gap-1"
        >
          {user ? (
            <>
              {/* 메시지 버튼: 읽지 않은 수를 aria-label에 동적 반영 */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 min-h-[44px] min-w-[44px] md:h-6 md:w-6 md:min-h-0 md:min-w-0"
                asChild
                aria-label={messageAriaLabel}
              >
                <Link href="/messages">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  <UnreadBadge />
                </Link>
              </Button>

              {/* 알림 드롭다운 (분리된 컴포넌트) */}
              <NotificationDropdown />

              {/* 사용자 메뉴 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-11 w-11 min-h-[44px] min-w-[44px] md:h-6 md:w-6 md:min-h-0 md:min-w-0 rounded-full"
                    aria-label={`내 메뉴, ${profile?.name || user.email}`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* 사용자 이름/이메일 표시 (비활성 아이템) */}
                  <DropdownMenuItem className="text-xs font-medium" disabled>
                    <User className="mr-1.5 h-3 w-3" aria-hidden="true" />
                    {profile?.name || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-xs">
                    <Link href={`/users/${user.id}`}>
                      <User className="mr-1.5 h-3 w-3" aria-hidden="true" />
                      내 프로필 보기
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-xs">
                    <LogOut className="mr-1.5 h-3 w-3" aria-hidden="true" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // 비로그인 상태: 로그인/회원가입 버튼
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
