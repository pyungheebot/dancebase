"use client";

import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  /** 필드 레이블 텍스트 */
  label: string;
  /** 연결할 input/textarea/select의 id. 생략 시 자동 생성된 id 사용 */
  htmlFor?: string;
  /** 에러 메시지 - null/undefined이면 표시 안 함 */
  error?: string | null;
  /** 설명 텍스트 - 에러가 없을 때만 표시 */
  description?: string;
  /** 필수 필드 여부 - 레이블 우측에 * 표시 */
  required?: boolean;
  /** 추가 컨테이너 클래스 */
  className?: string;
  children: ReactNode;
}

/**
 * 폼 필드 래퍼 컴포넌트
 *
 * - label + children + 에러/설명 구조를 통일
 * - 에러 메시지 표시 시 role="alert"로 스크린 리더에 알림
 * - children 내부 요소는 htmlFor로 연결된 id를 사용해야 함
 *   (aria-invalid, aria-describedby는 children에서 직접 설정)
 *
 * 사용 예시:
 * ```tsx
 * <FormField label="이름" htmlFor="name" error={errors.name} required>
 *   <Input id="name" value={name} onChange={...} aria-invalid={!!errors.name} />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  className,
  children,
}: FormFieldProps) {
  // htmlFor가 없을 때 자동 id 생성 (SSR-safe)
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;

  // 에러/설명 텍스트의 id (aria-describedby 연결용)
  const helpTextId = `${fieldId}-help`;

  const hasError = !!error;
  const hasHelp = hasError || !!description;

  return (
    <div className={cn("space-y-1", className)}>
      {/* 레이블 */}
      <Label
        htmlFor={fieldId}
        className={cn("text-xs", hasError && "text-destructive")}
      >
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {/* 입력 요소 (children) */}
      {children}

      {/* 에러 메시지 또는 설명 텍스트 */}
      {hasHelp && (
        <p
          id={helpTextId}
          className={cn(
            "text-[10px]",
            hasError
              ? "text-destructive"
              : "text-muted-foreground"
          )}
          role={hasError ? "alert" : undefined}
          aria-live={hasError ? "polite" : undefined}
        >
          {hasError ? error : description}
        </p>
      )}
    </div>
  );
}
