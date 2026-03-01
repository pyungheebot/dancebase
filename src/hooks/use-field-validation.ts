"use client";
import { useState, useCallback } from "react";

type FieldState = "pristine" | "touched" | "dirty";
type ValidationResult = string | null; // null = 유효
type Validator = (value: string) => ValidationResult;

export function useFieldValidation(validators: Validator[]) {
  const [fieldState, setFieldState] = useState<FieldState>("pristine");
  const [error, setError] = useState<ValidationResult>(null);

  const runValidators = useCallback(
    (value: string): ValidationResult => {
      for (const validator of validators) {
        const result = validator(value);
        if (result !== null) return result;
      }
      return null;
    },
    [validators]
  );

  const validate = useCallback(
    (value: string): boolean => {
      const result = runValidators(value);
      setError(result);
      return result === null;
    },
    [runValidators]
  );

  const onBlur = useCallback(
    (value: string) => {
      setFieldState((prev) => (prev === "pristine" ? "touched" : prev));
      const result = runValidators(value);
      setError(result);
    },
    [runValidators]
  );

  const onChange = useCallback(
    (value: string) => {
      setFieldState((prev) => (prev !== "pristine" ? "dirty" : prev));
      if (fieldState !== "pristine") {
        const result = runValidators(value);
        setError(result);
      }
    },
    [fieldState, runValidators]
  );

  const reset = useCallback(() => {
    setFieldState("pristine");
    setError(null);
  }, []);

  // pristine 상태에서는 에러를 숨김
  const visibleError = fieldState === "pristine" ? null : error;

  return {
    error: visibleError,
    rawError: error,
    fieldState,
    validate,
    onBlur,
    onChange,
    reset,
  };
}
