"use client";

import { useRouter } from "next/navigation";
import {
  Home,
  MessageSquare,
  Calendar,
  User,
  Users,
  Plus,
  Clock,
  ArrowRight,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPalette, saveRecentPage } from "@/hooks/use-command-palette";
import type { CommandItem as CommandItemType } from "@/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  MessageSquare: <MessageSquare className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Plus: <Plus className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
};

const GROUP_ORDER = ["빠른 이동", "최근 방문", "액션"];

function CommandItemIcon({ icon }: { icon?: string }) {
  if (!icon) return <ArrowRight className="h-4 w-4" />;
  return <>{ICON_MAP[icon] ?? <ArrowRight className="h-4 w-4" />}</>;
}

export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen, query, setQuery, groupedCommands } =
    useCommandPalette();

  function handleSelect(item: CommandItemType) {
    saveRecentPage(item.href, item.label);
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  // GROUP_ORDER 순서대로 그룹 렌더링, 없는 그룹은 마지막에 추가
  const orderedGroups: [string, CommandItemType[]][] = [];
  for (const groupName of GROUP_ORDER) {
    const items = groupedCommands.get(groupName);
    if (items && items.length > 0) {
      orderedGroups.push([groupName, items]);
    }
  }
  for (const [groupName, items] of groupedCommands.entries()) {
    if (!GROUP_ORDER.includes(groupName)) {
      orderedGroups.push([groupName, items]);
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
      title="명령어 팔레트"
      description="페이지 이동 또는 액션을 검색합니다."
      showCloseButton={false}
      className="max-w-lg"
    >
      <CommandInput
        placeholder="페이지 또는 명령어 검색..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1 py-2 text-muted-foreground">
            <Search className="h-6 w-6 opacity-30" />
            <span className="text-xs">일치하는 결과가 없습니다.</span>
          </div>
        </CommandEmpty>

        {orderedGroups.map(([groupName, items], idx) => (
          <span key={groupName}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={groupName}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <span className="text-muted-foreground">
                    <CommandItemIcon icon={item.icon} />
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut>G → {item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </span>
        ))}
      </CommandList>

      <div className="border-t px-3 py-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
            ↑↓
          </kbd>
          탐색
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
            Enter
          </kbd>
          선택
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
            Esc
          </kbd>
          닫기
        </span>
        <span className="ml-auto flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
          열기
        </span>
      </div>
    </CommandDialog>
  );
}
