import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFieldValidation } from "@/hooks/use-field-validation";

// 테스트용 검증기
const requiredValidator = (value: string) =>
  !value.trim() ? "필수 입력 항목입니다" : null;

const minLengthValidator = (min: number) => (value: string) =>
  value.trim().length < min ? `최소 ${min}자 이상이어야 합니다` : null;

describe("useFieldValidation - pristine 상태", () => {
  it("초기 상태는 pristine이며 error가 null이다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    expect(result.current.fieldState).toBe("pristine");
    expect(result.current.error).toBeNull();
  });

  it("pristine 상태에서 onChange를 호출해도 error가 표시되지 않는다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onChange("");
    });

    // pristine 상태에서는 visibleError가 null이어야 함
    expect(result.current.error).toBeNull();
    expect(result.current.fieldState).toBe("pristine");
  });

  it("pristine 상태에서 rawError는 검증 에러를 반영하지 않는다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    // pristine 상태에서 onChange는 검증을 실행하지 않음
    act(() => {
      result.current.onChange("");
    });

    // rawError도 null이어야 함 (pristine에서 onChange는 검증 안 함)
    expect(result.current.rawError).toBeNull();
  });
});

describe("useFieldValidation - touched 상태 (onBlur 이후)", () => {
  it("onBlur 호출 후 fieldState가 touched로 변경된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onBlur("값입력");
    });

    expect(result.current.fieldState).toBe("touched");
  });

  it("onBlur 후 유효하지 않은 값이면 error가 표시된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onBlur(""); // 빈 값 → 에러
    });

    expect(result.current.error).toBe("필수 입력 항목입니다");
  });

  it("onBlur 후 유효한 값이면 error가 null이다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onBlur("유효한 값");
    });

    expect(result.current.error).toBeNull();
  });

  it("touched 상태에서 onChange 호출 시 실시간 재검증된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    // touched 상태로 전환
    act(() => {
      result.current.onBlur("");
    });
    expect(result.current.error).toBe("필수 입력 항목입니다");

    // 유효한 값으로 변경 → 에러 사라짐
    act(() => {
      result.current.onChange("유효한 값");
    });

    expect(result.current.error).toBeNull();
  });
});

describe("useFieldValidation - dirty 상태 (onChange 이후)", () => {
  it("touched 상태에서 onChange 호출 시 fieldState가 dirty로 변경된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    // touched 상태로 전환
    act(() => {
      result.current.onBlur("값");
    });

    // onChange로 dirty 전환
    act(() => {
      result.current.onChange("새 값");
    });

    expect(result.current.fieldState).toBe("dirty");
  });

  it("dirty 상태에서 실시간 재검증이 이루어진다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator, minLengthValidator(3)])
    );

    // touched → dirty로 전환
    act(() => {
      result.current.onBlur("값");
    });
    act(() => {
      result.current.onChange("값값값값");
    });

    expect(result.current.fieldState).toBe("dirty");
    expect(result.current.error).toBeNull(); // 4자 이상 → 유효

    // 짧은 값으로 변경 → 에러 표시
    act(() => {
      result.current.onChange("값");
    });

    expect(result.current.error).toBe("최소 3자 이상이어야 합니다");
  });

  it("dirty 상태에서 빈 값으로 변경 시 에러가 표시된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onBlur("유효한 값");
    });
    act(() => {
      result.current.onChange("유효한 값 2");
    });
    act(() => {
      result.current.onChange(""); // 빈 값으로 변경
    });

    expect(result.current.error).toBe("필수 입력 항목입니다");
  });
});

describe("useFieldValidation - validate 강제 호출", () => {
  it("pristine 상태에서 validate 호출 시 즉시 에러가 설정된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate("");
    });

    // validate는 rawError를 설정하지만, pristine이라 visibleError는 null
    // 반환값은 유효성 여부
    expect(isValid!).toBe(false);
    expect(result.current.rawError).toBe("필수 입력 항목입니다");
  });

  it("유효한 값으로 validate 호출 시 true를 반환한다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate("유효한 값");
    });

    expect(isValid!).toBe(true);
    expect(result.current.rawError).toBeNull();
  });

  it("여러 검증기가 있을 때 첫 번째 에러만 반환한다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator, minLengthValidator(5)])
    );

    act(() => {
      result.current.onBlur(""); // 빈 값 → 첫 번째 검증기 에러
    });

    expect(result.current.error).toBe("필수 입력 항목입니다");
  });

  it("첫 번째 검증을 통과하면 두 번째 검증기 에러가 표시된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator, minLengthValidator(5)])
    );

    act(() => {
      result.current.onBlur("값"); // 비어있지 않지만 5자 미만
    });

    expect(result.current.error).toBe("최소 5자 이상이어야 합니다");
  });
});

describe("useFieldValidation - reset", () => {
  it("reset 호출 시 fieldState가 pristine으로 돌아간다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onBlur("");
    });
    expect(result.current.fieldState).toBe("touched");

    act(() => {
      result.current.reset();
    });

    expect(result.current.fieldState).toBe("pristine");
  });

  it("reset 호출 시 error가 null로 초기화된다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    act(() => {
      result.current.onBlur(""); // 에러 발생
    });
    expect(result.current.error).toBe("필수 입력 항목입니다");

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.rawError).toBeNull();
  });

  it("reset 후 다시 pristine 동작을 한다", () => {
    const { result } = renderHook(() =>
      useFieldValidation([requiredValidator])
    );

    // touched 상태로 전환 후 reset
    act(() => {
      result.current.onBlur("값");
      result.current.onChange("수정값");
    });
    act(() => {
      result.current.reset();
    });

    // reset 후 onChange는 에러를 표시하지 않아야 함
    act(() => {
      result.current.onChange("");
    });

    expect(result.current.error).toBeNull();
    expect(result.current.fieldState).toBe("pristine");
  });
});

describe("useFieldValidation - 검증기 없음", () => {
  it("검증기가 없으면 항상 유효하다", () => {
    const { result } = renderHook(() => useFieldValidation([]));

    act(() => {
      result.current.onBlur("어떤 값이든");
    });

    expect(result.current.error).toBeNull();
  });

  it("검증기가 없으면 validate가 항상 true를 반환한다", () => {
    const { result } = renderHook(() => useFieldValidation([]));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validate("");
    });

    expect(isValid!).toBe(true);
  });
});
