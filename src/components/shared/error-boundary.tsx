"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
          <AlertTriangle className="h-8 w-8 text-destructive/70" />
          <div className="space-y-1">
            <p className="text-sm font-medium">문제가 발생했습니다</p>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message || "예기치 않은 오류가 발생했습니다"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs mt-1"
            onClick={this.handleReset}
          >
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
