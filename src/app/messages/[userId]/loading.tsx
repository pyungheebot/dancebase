import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-hidden px-4 py-3 space-y-4">
        {/* 날짜 구분선 */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <Skeleton className="h-3 w-12" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 상대방 메시지 */}
        <div className="flex items-end gap-2">
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm" />
        </div>

        {/* 내 메시지 */}
        <div className="flex items-end gap-2 justify-end">
          <Skeleton className="h-10 w-56 rounded-2xl rounded-br-sm" />
        </div>

        {/* 상대방 메시지 (긴 것) */}
        <div className="flex items-end gap-2">
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-8 w-64 rounded-2xl rounded-bl-sm" />
            <Skeleton className="h-8 w-44 rounded-2xl rounded-bl-sm" />
          </div>
        </div>

        {/* 내 메시지 */}
        <div className="flex items-end gap-2 justify-end">
          <Skeleton className="h-8 w-40 rounded-2xl rounded-br-sm" />
        </div>

        {/* 내 메시지 (짧은 것) */}
        <div className="flex items-end gap-2 justify-end">
          <Skeleton className="h-8 w-24 rounded-2xl rounded-br-sm" />
        </div>
      </div>

      {/* 메시지 입력창 */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}
