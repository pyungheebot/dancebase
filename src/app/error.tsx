"use client";

import { PageError } from "@/components/shared/page-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="문제가 발생했습니다" error={error} reset={reset} />;
}
