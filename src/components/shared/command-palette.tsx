"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Mail,
  UserCircle,
  Calendar,
  BarChart3,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type CommandAction = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
};

const PAGE_ACTIONS: CommandAction[] = [
  {
    id: "dashboard",
    label: "대시보드",
    description: "내 그룹 및 활동 요약",
    icon: <LayoutDashboard className="h-4 w-4" />,
    href: "/dashboard",
  },
  {
    id: "schedules",
    label: "전체 일정",
    description: "그룹 일정 전체 보기",
    icon: <Calendar className="h-4 w-4" />,
    href: "/schedules",
  },
  {
    id: "explore",
    label: "그룹 탐색",
    description: "공개 그룹 검색 및 참여",
    icon: <Compass className="h-4 w-4" />,
    href: "/explore",
  },
  {
    id: "messages",
    label: "쪽지",
    description: "받은 쪽지 및 보낸 쪽지",
    icon: <Mail className="h-4 w-4" />,
    href: "/messages",
  },
  {
    id: "profile",
    label: "프로필 설정",
    description: "내 프로필 및 계정 설정",
    icon: <UserCircle className="h-4 w-4" />,
    href: "/profile",
  },
  {
    id: "stats",
    label: "출석 통계",
    description: "그룹별 출석 현황 통계",
    icon: <BarChart3 className="h-4 w-4" />,
    href: "/stats",
  },
];

const QUICK_ACTIONS: CommandAction[] = [
  {
    id: "new-group",
    label: "그룹 만들기",
    description: "새 댄스 그룹 생성",
    icon: <Plus className="h-4 w-4" />,
    href: "/groups/new",
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="빠른 이동"
      description="페이지 이동 또는 작업 실행"
      showCloseButton={false}
    >
      <CommandInput placeholder="검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>

        <CommandGroup heading="페이지">
          {PAGE_ACTIONS.map((action) => (
            <CommandItem
              key={action.id}
              value={`${action.label} ${action.description}`}
              onSelect={() => handleSelect(action.href)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span className="text-muted-foreground">{action.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {action.description}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="작업">
          {QUICK_ACTIONS.map((action) => (
            <CommandItem
              key={action.id}
              value={`${action.label} ${action.description}`}
              onSelect={() => handleSelect(action.href)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span className="text-muted-foreground">{action.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {action.description}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
