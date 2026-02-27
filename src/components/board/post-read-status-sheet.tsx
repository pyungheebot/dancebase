"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Eye, EyeOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePostReadStatus } from "@/hooks/use-post-read-status";
import type { GroupMemberWithProfile } from "@/types";

interface PostReadStatusSheetProps {
  postId: string;
  /** 그룹 전체 멤버 목록 */
  members: GroupMemberWithProfile[];
  /** 리더 여부 (버튼 표시 제어) */
  isLeader: boolean;
}

export function PostReadStatusSheet({
  postId,
  members,
  isLeader,
}: PostReadStatusSheetProps) {
  const [open, setOpen] = useState(false);
  const { readMembers, unreadMembers, readCount, totalCount, readRate, loading } =
    usePostReadStatus(postId, members);

  // 리더가 아니면 렌더링하지 않음
  if (!isLeader) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
        >
          <Eye className="h-3 w-3" />
          읽음 {readCount}/{totalCount}명
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            읽음 현황
          </SheetTitle>
          {/* 읽음률 요약 */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${readRate}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {readRate}%
            </span>
          </div>
          <div className="flex gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Eye className="h-3 w-3 text-green-500" />
              읽음 {readCount}명
            </span>
            <span className="flex items-center gap-0.5">
              <EyeOff className="h-3 w-3 text-muted-foreground/60" />
              미읽음 {unreadMembers.length}명
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="px-4 py-3 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 space-y-4">
              {/* 읽은 멤버 섹션 */}
              {readMembers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      읽음
                    </span>
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                      {readMembers.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {readMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2.5 py-1.5 rounded-md"
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          {member.avatarUrl && (
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{member.name}</p>
                          {member.readAt && (
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(member.readAt), "M/d HH:mm", {
                                locale: ko,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {readMembers.length > 0 && unreadMembers.length > 0 && (
                <Separator />
              )}

              {/* 미읽은 멤버 섹션 */}
              {unreadMembers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <EyeOff className="h-3 w-3 text-muted-foreground/60" />
                    <span className="text-xs font-medium text-muted-foreground">
                      미읽음
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {unreadMembers.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {unreadMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2.5 py-1.5 rounded-md opacity-60"
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          {member.avatarUrl && (
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{member.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 멤버가 없는 경우 */}
              {readMembers.length === 0 && unreadMembers.length === 0 && (
                <div className="py-10 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">멤버가 없습니다</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
