"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  showCharCount?: boolean;
}

function Textarea({
  className,
  showCharCount = false,
  maxLength,
  value,
  defaultValue,
  onChange,
  id,
  ...props
}: TextareaProps) {
  // 내부 상태 (uncontrolled 모드 대응)
  const [internalValue, setInternalValue] = React.useState(
    () => String(defaultValue ?? "")
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value) : internalValue;
  const charCount = currentValue.length;

  const isNearLimit =
    showCharCount && maxLength !== undefined && charCount >= maxLength * 0.9;

  // aria-describedby 연결용 id
  const counterId = id ? `${id}-char-count` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const textarea = (
    <textarea
      id={id}
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      maxLength={maxLength}
      value={value}
      defaultValue={isControlled ? undefined : defaultValue}
      onChange={handleChange}
      aria-describedby={showCharCount && counterId ? counterId : undefined}
      {...props}
    />
  );

  if (!showCharCount) {
    return textarea;
  }

  return (
    <div className="w-full">
      {textarea}
      <p
        id={counterId}
        className={cn(
          "mt-1 text-right text-[11px] tabular-nums",
          isNearLimit ? "text-amber-500" : "text-muted-foreground"
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {charCount}
        {maxLength !== undefined && (
          <span>/{maxLength}</span>
        )}
      </p>
    </div>
  );
}

export { Textarea };
