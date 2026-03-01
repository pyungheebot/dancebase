import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-6 space-y-2">
          <Skeleton className="h-8 w-20 mx-auto" />
          <Skeleton className="h-4 w-36 mx-auto" />
        </div>

        <div className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>

          {/* 로그인 버튼 */}
          <Skeleton className="h-9 w-full" />

          {/* 소셜 로그인 구분선 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* 소셜 버튼 */}
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
