"use client";

// 알림 드롭다운 컴포넌트
// header.tsx에서 분리된 독립 컴포넌트
// 접근성: role="list/listitem", aria-live="polite", aria-label, 키보드 네비게이션 지원

import { memo, useCallback, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useUnreadNotificationCount } from "@/hooks/use-notifications";
import { formatRelative } from "@/lib/date-utils";
import type { Notification } from "@/types";

// -------------------------------------------------------
// NotificationItem: 개별 알림 아이템 (React.memo로 최적화)
// -------------------------------------------------------
type NotificationItemProps = {
  notification: Notification;
  // 개별 아이템 클릭 시 읽음 처리 + 링크 이동
  onClickItem: (id: string, link: string | null) => void;
};

const NotificationItem = memo(function NotificationItem({
  notification: n,
  onClickItem,
}: NotificationItemProps) {
  return (
    // role="listitem"으로 목록 아이템임을 명시
    <div
      role="listitem"
      className={`flex flex-col items-start gap-0.5 px-2 py-2 cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        !n.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
      onClick={() => onClickItem(n.id, n.link)}
      // 키보드 사용자도 Enter/Space로 활성화 가능하도록
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickItem(n.id, n.link);
        }
      }}
      tabIndex={0}
      // 읽음 상태 + 제목 + 내용을 스크린리더에 함께 전달
      aria-label={`${!n.is_read ? "읽지 않음. " : ""}${n.title}. ${n.message}`}
    >
      <div className="flex items-center gap-1.5 w-full">
        {/* 읽지 않은 알림 표시 점 */}
        {!n.is_read && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0"
            aria-hidden="true"
          />
        )}
        <span
          className={`text-xs font-medium truncate ${n.is_read ? "ml-3" : ""}`}
        >
          {n.title}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-2 pl-3">
        {n.message}
      </p>
      <span className="text-[10px] text-muted-foreground pl-3">
        {formatRelative(new Date(n.created_at))}
      </span>
    </div>
  );
});

// -------------------------------------------------------
// NotificationDropdown: 알림 드롭다운 메인 컴포넌트
// -------------------------------------------------------
export const NotificationDropdown = memo(function NotificationDropdown() {
  const { count } = useUnreadNotificationCount();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(10);
  const router = useRouter();

  // aria-live 영역에 표시할 알림 메시지 (새 알림 도착 시 스크린리더에 알림)
  const [liveMessage, setLiveMessage] = useState<string>("");
  // 이전 알림 카운트를 추적해서 새 알림 도착 여부 감지
  const prevCountRef = useRef(count);

  // 새 알림이 도착하면 aria-live 영역을 통해 스크린리더에 알림
  useEffect(() => {
    const prev = prevCountRef.current;
    if (count > prev) {
      const newCount = count - prev;
      setLiveMessage(
        `새 알림 ${newCount}개가 도착했습니다. 총 읽지 않은 알림 ${count}개.`
      );
      // 일정 시간 후 메시지 초기화 (중복 알림 방지)
      const timer = setTimeout(() => setLiveMessage(""), 3000);
      prevCountRef.current = count;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  // 알림 클릭: 읽음 처리 후 링크 이동
  // useCallback으로 불필요한 자식 리렌더 방지
  const handleNotificationClick = useCallback(
    async (id: string, link: string | null) => {
      await markAsRead(id);
      if (link) router.push(link);
    },
    [markAsRead, router]
  );

  // 키보드 네비게이션: 알림 목록 내 ArrowUp/Down으로 포커스 이동
  const listRef = useRef<HTMLDivElement>(null);
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!listRef.current) return;

      // 포커스 가능한 알림 아이템들 수집
      const items = Array.from(
        listRef.current.querySelectorAll<HTMLElement>('[role="listitem"]')
      );
      if (items.length === 0) return;

      const focused = document.activeElement as HTMLElement;
      const currentIndex = items.indexOf(focused);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        // 다음 아이템으로 포커스 이동 (마지막이면 첫 번째로 순환)
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // 이전 아이템으로 포커스 이동 (첫 번째면 마지막으로 순환)
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
      }
    },
    []
  );

  return (
    <>
      {/* aria-live="polite": 새 알림 도착 시 스크린리더에 방해 없이 알림 */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 min-h-[44px] min-w-[44px] md:h-6 md:w-6 md:min-h-0 md:min-w-0"
            // 읽지 않은 알림 수를 aria-label에 포함
            aria-label={
              count > 0
                ? `알림, ${count > 99 ? "99개 이상" : `${count}개`}의 읽지 않은 알림`
                : "알림"
            }
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            {count > 0 && (
              // 시각적 배지는 aria-label로 이미 전달했으므로 aria-hidden
              <Badge
                className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] px-0.5 text-[9px] leading-none"
                aria-hidden="true"
              >
                {count > 99 ? "99+" : count}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72"
          // 드롭다운 컨텐츠 전체에 대한 레이블
          aria-label={
            count > 0
              ? `알림 목록, ${count > 99 ? "99개 이상" : `${count}개`}의 읽지 않은 알림`
              : "알림 목록"
          }
        >
          {/* 헤더: 제목 + 전체 읽음 버튼 */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold">알림</span>
            {count > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:underline"
                aria-label="모든 알림을 읽음으로 처리"
              >
                모두 읽음
              </button>
            )}
          </div>

          <DropdownMenuSeparator />

          {notifications.length === 0 ? (
            // 알림 없음 상태
            <div
              className="px-2 py-4 text-center text-xs text-muted-foreground"
              role="status"
              aria-label="알림 없음"
            >
              알림이 없습니다
            </div>
          ) : (
            // role="list": 알림 목록임을 스크린리더에 명시
            // onKeyDown: ArrowUp/Down 키보드 네비게이션 처리
            <div
              ref={listRef}
              role="list"
              aria-label={`알림 ${notifications.length}개`}
              onKeyDown={handleListKeyDown}
              className="py-0.5"
            >
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClickItem={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
});
