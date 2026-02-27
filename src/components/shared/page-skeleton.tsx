"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * ContentSkeleton
 * 일반 콘텐츠용 스켈레톤 (제목 + 카드 3개)
 */
export function ContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="콘텐츠 불러오는 중">
      {/* 프로필 헤더 카드 스켈레톤 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 mb-3">
            {/* 아바타 */}
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              {/* 이름 + 버튼 */}
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
              {/* 팔로워/팔로잉 */}
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
              {/* 배지들 */}
              <div className="flex gap-1.5 flex-wrap">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-18 rounded-full" />
              </div>
            </div>
          </div>
          {/* 자기소개 */}
          <div className="space-y-1.5 mt-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          {/* 상세 정보 */}
          <div className="grid gap-2.5 mt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 보조 카드 2개 */}
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardHeader className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * ListSkeleton
 * 목록용 스켈레톤 (아바타 + 텍스트 행 5개)
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="rounded border divide-y"
      aria-busy="true"
      aria-label="목록 불러오는 중"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2.5 py-2.5">
          {/* 아바타 */}
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            {/* 이름 + 시간 */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            {/* 마지막 메시지 */}
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * CardGridSkeleton
 * 카드 그리드용 스켈레톤 (기본 4개 카드)
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      aria-busy="true"
      aria-label="카드 목록 불러오는 중"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-1.5">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
