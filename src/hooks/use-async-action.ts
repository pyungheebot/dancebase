import { useState, useCallback } from "react";

export function useAsyncAction() {
  const [pending, setPending] = useState(false);

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (pending) return undefined;
    setPending(true);
    try {
      return await fn();
    } finally {
      setPending(false);
    }
  }, [pending]);

  return { pending, execute };
}
