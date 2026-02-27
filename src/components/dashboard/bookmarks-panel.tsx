"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Star,
  FileText,
  CalendarDays,
  User,
  Trash2,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { BookmarkItem, BookmarkTargetType } from "@/types";

const TAB_ITEMS: { value: BookmarkTargetType | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "post", label: "게시글" },
  { value: "schedule", label: "일정" },
  { value: "member", label: "멤버" },
];

function getTypeIcon(targetType: BookmarkTargetType) {
  switch (targetType) {
    case "post":
      return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    case "schedule":
      return <CalendarDays className="h-3.5 w-3.5 text-green-500" />;
    case "member":
      return <User className="h-3.5 w-3.5 text-purple-500" />;
  }
}

function getTypeLabel(targetType: BookmarkTargetType): string {
  switch (targetType) {
    case "post":
      return "게시글";
    case "schedule":
      return "일정";
    case "member":
      return "멤버";
  }
}

function BookmarkListItem({
  item,
  onRemove,
  onClose,
}: {
  item: BookmarkItem;
  onRemove: (targetId: string, targetType: BookmarkTargetType) => void;
  onClose: () => void;
}) {
  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onRemove(item.targetId, item.targetType);
    toast.success("북마크에서 제거했습니다.");
  }

  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">{getTypeIcon(item.targetType)}</div>
      <Link
        href={item.href}
        className="flex-1 min-w-0"
        onClick={onClose}
      >
        <p className="text-xs font-medium truncate leading-snug">{item.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          <span className="mr-1.5">{getTypeLabel(item.targetType)}</span>
          <span>
            {format(new Date(item.createdAt), "M월 d일", { locale: ko })}
          </span>
        </p>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={handleRemove}
        title="북마크 제거"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <Star className="h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">북마크가 없습니다</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        게시글, 일정, 멤버 옆의 별 아이콘을 눌러 북마크를 추가하세요.
      </p>
    </div>
  );
}

export function BookmarksPanel() {
  const [open, setOpen] = useState(false);
  const { bookmarks, removeBookmark, getBookmarksByType } = useBookmarks();

  function getFilteredItems(tab: BookmarkTargetType | "all"): BookmarkItem[] {
    if (tab === "all") return bookmarks;
    return getBookmarksByType(tab);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          <span>북마크</span>
          {bookmarks.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center"
            >
              {bookmarks.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            북마크
            {bookmarks.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {bookmarks.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="all" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-4 mt-3 mb-1 grid grid-cols-4 h-7">
              {TAB_ITEMS.map((tab) => {
                const count =
                  tab.value === "all"
                    ? bookmarks.length
                    : getBookmarksByType(tab.value as BookmarkTargetType).length;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-[10px] px-1 h-6"
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1 text-[9px] text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {TAB_ITEMS.map((tab) => {
              const items = getFilteredItems(
                tab.value as BookmarkTargetType | "all"
              );
              return (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 overflow-y-auto mt-0 px-2 pb-4"
                >
                  {items.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="space-y-0.5 mt-2">
                      {items.map((item) => (
                        <BookmarkListItem
                          key={item.id}
                          item={item}
                          onRemove={removeBookmark}
                          onClose={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
