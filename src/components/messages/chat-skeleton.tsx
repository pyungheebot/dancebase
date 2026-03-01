import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* 메시지 목록 스켈레톤 */}
      <div className="flex-1 overflow-hidden px-4 py-4 space-y-3">
        {/* 상대방 메시지 - 짧음 */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-9 w-36 rounded-2xl rounded-bl-md" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        </div>

        {/* 내 메시지 - 중간 */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-9 w-52 rounded-2xl rounded-br-md" />
          <Skeleton className="h-2.5 w-8" />
        </div>

        {/* 내 메시지 - 짧음 */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-9 w-28 rounded-2xl rounded-br-md" />
          <Skeleton className="h-2.5 w-8" />
        </div>

        {/* 상대방 메시지 - 긴 (2줄) */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-14 w-56 rounded-2xl rounded-bl-md" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        </div>

        {/* 내 메시지 - 긴 */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-9 w-64 rounded-2xl rounded-br-md" />
          <Skeleton className="h-2.5 w-8" />
        </div>

        {/* 상대방 메시지 - 중간 */}
        <div className="flex items-start gap-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-9 w-44 rounded-2xl rounded-bl-md" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        </div>

        {/* 내 메시지 - 중간 */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-9 w-40 rounded-2xl rounded-br-md" />
          <Skeleton className="h-2.5 w-8" />
        </div>
      </div>

      {/* 입력창 스켈레톤 */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <Skeleton className="flex-1 h-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}
