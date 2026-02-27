"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { usePostRevisions } from "@/hooks/use-post-revisions";
import { BoardPostContent } from "@/components/board/board-post-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { History, FileEdit, Clock, ChevronRight } from "lucide-react";
import type { BoardPostRevision } from "@/types";

interface BoardPostRevisionsSheetProps {
  postId: string;
  /** 현재 게시글 제목 (비교용) */
  currentTitle: string;
}

export function BoardPostRevisionsSheet({
  postId,
  currentTitle,
}: BoardPostRevisionsSheetProps) {
  const [open, setOpen] = useState(false);
  const { revisions, loading } = usePostRevisions(postId);
  const [selectedRevision, setSelectedRevision] =
    useState<BoardPostRevision | null>(null);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setSelectedRevision(null);
    }
  };

  const isTitleChanged = (revision: BoardPostRevision, index: number) => {
    // 가장 최신 리비전은 현재 제목과 비교
    if (index === 0) {
      return revision.title !== currentTitle;
    }
    // 이전 리비전은 바로 다음(더 최신) 리비전과 비교
    const newerRevision = revisions[index - 1];
    return revision.title !== newerRevision.title;
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
        >
          <History className="h-3 w-3 mr-1" />
          편집 이력 {revisions.length > 0 ? `${revisions.length}건` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <History className="h-4 w-4" />
            편집 이력
          </SheetTitle>
        </SheetHeader>

        {selectedRevision ? (
          /* 선택된 버전 상세 보기 */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2 border-b bg-muted/30 shrink-0 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-1.5 -ml-1"
                onClick={() => setSelectedRevision(null)}
              >
                <ChevronRight className="h-3 w-3 rotate-180 mr-0.5" />
                목록
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>
                  {format(
                    new Date(selectedRevision.revised_at),
                    "yyyy.M.d HH:mm",
                    { locale: ko }
                  )}
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-4 py-3 space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                    제목
                  </p>
                  <p className="text-sm font-semibold">
                    {selectedRevision.title}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    본문
                  </p>
                  <BoardPostContent content={selectedRevision.content} />
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          /* 리비전 목록 */
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="px-4 py-3 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md border px-3 py-2.5"
                  >
                    <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : revisions.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <FileEdit className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  편집 이력이 없습니다
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  게시글을 수정하면 이력이 기록됩니다
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 space-y-1.5">
                {revisions.map((revision, index) => {
                  const titleChanged = isTitleChanged(revision, index);
                  return (
                    <button
                      key={revision.id}
                      type="button"
                      onClick={() => setSelectedRevision(revision)}
                      className="w-full text-left rounded-md border px-3 py-2.5 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium">
                              {format(
                                new Date(revision.revised_at),
                                "yyyy.M.d HH:mm",
                                { locale: ko }
                              )}
                            </span>
                            {index === 0 && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                                최근
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {revision.title}
                          </p>
                          {titleChanged && (
                            <div className="flex items-center gap-1">
                              <FileEdit className="h-2.5 w-2.5 text-orange-500 shrink-0" />
                              <span className="text-[10px] text-orange-600">
                                제목 변경됨
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
