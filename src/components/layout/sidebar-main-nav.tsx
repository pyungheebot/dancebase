"use client";

/**
 * 사이드바 메인 네비게이션
 * 대시보드, 전체 일정, 그룹 탐색, 출석 통계, 메시지 링크
 * MessageNavItem은 useUnreadCount에 의존하므로 이 파일 내부에서 정의
 */

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/use-messages";
import { Badge } from "@/components/ui/badge";
import { PrefetchLink } from "@/components/shared/prefetch-link";
import {
  preloadDashboard,
  preloadSchedules,
  preloadMessages,
} from "@/lib/swr/preload";
import {
  LayoutDashboard,
  Calendar,
  Compass,
  BarChart3,
  Mail,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  preloadFn?: () => void;
};

/** 메시지 항목 전용 컴포넌트 - 읽지 않은 메시지 뱃지 포함 */
function MessageNavItem({
  href,
  icon,
  label,
  isActive,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const { count } = useUnreadCount();
  const ariaLabel =
    count > 0
      ? `${label}, 읽지 않은 메시지 ${count > 99 ? "99개 이상" : `${count}개`}`
      : label;

  return (
    <PrefetchLink
      href={href}
      preloadFn={preloadMessages}
      onClick={onNavigate}
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-1 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent font-medium"
          : "hover:bg-sidebar-accent/60 text-sidebar-foreground/70"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {count > 0 && (
        <Badge
          variant="secondary"
          className="h-4 min-w-[16px] px-1 text-[10px] leading-none font-normal"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </PrefetchLink>
  );
}

type SidebarMainNavProps = {
  onNavigate?: () => void;
};

export function SidebarMainNav({ onNavigate }: SidebarMainNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const mainNav: NavItem[] = [
    {
      label: "대시보드",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 opacity-60" />,
      preloadFn: preloadDashboard,
    },
    {
      label: "전체 일정",
      href: "/schedules",
      icon: <Calendar className="h-4 w-4 opacity-60" />,
      preloadFn: preloadSchedules,
    },
    {
      label: "그룹 탐색",
      href: "/explore",
      icon: <Compass className="h-4 w-4 opacity-60" />,
    },
    {
      label: "출석 통계",
      href: "/stats",
      icon: <BarChart3 className="h-4 w-4 opacity-60" />,
    },
    {
      label: "메시지",
      href: "/messages",
      icon: <Mail className="h-4 w-4 opacity-60" />,
    },
  ];

  return (
    <div className="space-y-0.5">
      {mainNav.map((item) =>
        item.label === "메시지" ? (
          <MessageNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ) : (
          <PrefetchLink
            key={item.href}
            href={item.href}
            preloadFn={item.preloadFn}
            onClick={onNavigate}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-sm px-2 py-1 text-sm transition-colors",
              isActive(item.href)
                ? "bg-sidebar-accent font-medium"
                : "hover:bg-sidebar-accent/60 text-sidebar-foreground/70"
            )}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
          </PrefetchLink>
        )
      )}
    </div>
  );
}
