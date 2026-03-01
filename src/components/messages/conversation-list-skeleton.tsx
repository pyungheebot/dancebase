import { Skeleton } from "@/components/ui/skeleton";

// 각 아이템의 마지막 메시지 미리보기 너비를 다양하게 설정
const PREVIEW_WIDTHS = ["w-48", "w-36", "w-52", "w-40", "w-44"];
const NAME_WIDTHS = ["w-20", "w-28", "w-24", "w-16", "w-24"];

export function ConversationListSkeleton() {
  return (
    <div className="py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {/* 아바타 */}
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />

          {/* 이름 + 마지막 메시지 */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className={`h-4 ${NAME_WIDTHS[i]}`} />
              <Skeleton className="h-3 w-10 shrink-0 ml-2" />
            </div>
            <Skeleton className={`h-3 ${PREVIEW_WIDTHS[i]}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
