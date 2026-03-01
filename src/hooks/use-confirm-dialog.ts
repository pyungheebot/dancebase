"use client";
import { useState, useCallback } from "react";

type ConfirmDialogState<T = string> = {
  open: boolean;
  targetId: T | null;
  targetLabel?: string;
};

export function useConfirmDialog<T = string>() {
  const [state, setState] = useState<ConfirmDialogState<T>>({
    open: false,
    targetId: null,
    targetLabel: undefined,
  });

  const requestConfirm = useCallback((targetId: T, label?: string) => {
    setState({ open: true, targetId, targetLabel: label });
  }, []);

  const cancel = useCallback(() => {
    setState({ open: false, targetId: null, targetLabel: undefined });
  }, []);

  const confirm = useCallback(() => {
    const id = state.targetId;
    setState({ open: false, targetId: null, targetLabel: undefined });
    return id;
  }, [state.targetId]);

  return {
    open: state.open,
    targetId: state.targetId,
    targetLabel: state.targetLabel,
    requestConfirm,
    cancel,
    confirm,
  };
}
