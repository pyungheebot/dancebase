"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  cardName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[CardErrorBoundary] ${this.props.cardName || "Unknown"}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">이 영역을 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-muted-foreground mt-2 underline"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
