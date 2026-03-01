"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = Omit<React.ComponentProps<"button">, "type"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
    loadingText?: string;
    children: React.ReactNode;
  };

export function SubmitButton({
  loading,
  loadingText = "처리 중...",
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" />
          {loadingText}
        </>
      ) : children}
    </Button>
  );
}
