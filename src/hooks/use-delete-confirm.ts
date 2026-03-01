import { useState, useCallback } from "react";

export function useDeleteConfirm<T = string>() {
  const [target, setTarget] = useState<T | null>(null);

  const request = useCallback((value: T) => setTarget(value), []);
  const cancel = useCallback(() => setTarget(null), []);
  const confirm = useCallback(() => {
    const current = target;
    setTarget(null);
    return current;
  }, [target]);

  return {
    target,
    open: target !== null,
    request,
    cancel,
    confirm,
    onOpenChange: (v: boolean) => { if (!v) cancel(); },
  };
}
