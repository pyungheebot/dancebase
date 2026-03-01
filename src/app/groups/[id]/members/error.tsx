"use client";

import { PageError } from "@/components/shared/page-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="멤버 정보를 불러올 수 없습니다" error={error} reset={reset} />;
}
