import { useState, useCallback, useRef } from "react";

export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  // pending 상태를 ref로도 추적하여 execute가 pending에 의존하지 않도록 안정화
  const pendingRef = useRef(false);

  const execute = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (pendingRef.current) return undefined;
    pendingRef.current = true;
    setPending(true);
    try {
      return await fn();
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []); // 의존성 없음 - pendingRef는 ref이므로 안정적

  return { pending, execute };
}
