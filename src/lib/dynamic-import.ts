import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentType } from "react";

type LazyLoadOptions = {
  /** SSR 여부 (기본값: false) */
  ssr?: boolean;
  /** 스켈레톤 높이 클래스 (기본값: "h-20") */
  skeletonHeight?: string;
  /** loading 완전 비활성화 (다이얼로그 등 SSR false 전용 컴포넌트에 사용) */
  noLoading?: boolean;
};

/**
 * 공통 Skeleton 로딩을 포함한 dynamic import 래퍼.
 *
 * 사용 예:
 *   const MyComp = lazyLoad(() => import("./my-comp").then(m => ({ default: m.MyComp })));
 *   const MyComp = lazyLoad(() => import("./my-comp").then(m => ({ default: m.MyComp })), { skeletonHeight: "h-48" });
 *   const MyDialog = lazyLoad(() => import("./my-dialog").then(m => ({ default: m.MyDialog })), { noLoading: true });
 */
export function lazyLoad<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TImportFn extends () => Promise<{ default: ComponentType<any> }>,
>(
  importFn: TImportFn,
  options?: LazyLoadOptions,
): TImportFn extends () => Promise<{ default: infer C }> ? C : never {
  const { ssr = false, skeletonHeight = "h-20", noLoading = false } = options ?? {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return dynamic(importFn as any, {
    ssr,
    ...(noLoading
      ? {}
      : {
          loading: () =>
            Skeleton({ className: `${skeletonHeight} w-full rounded-lg` }),
        }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}
