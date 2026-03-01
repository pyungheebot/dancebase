import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormSubmission } from "@/hooks/use-form-submission";

// sonner toast mock
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

const mockedToastSuccess = vi.mocked(toast.success);
const mockedToastError = vi.mocked(toast.error);

beforeEach(() => {
  mockedToastSuccess.mockClear();
  mockedToastError.mockClear();
});

describe("useFormSubmission - 초기 상태", () => {
  it("초기 pending 상태는 false다", () => {
    const { result } = renderHook(() => useFormSubmission());
    expect(result.current.pending).toBe(false);
  });

  it("초기 localError는 null이다", () => {
    const { result } = renderHook(() => useFormSubmission());
    expect(result.current.localError).toBeNull();
  });

  it("submit, clearError 함수가 존재한다", () => {
    const { result } = renderHook(() => useFormSubmission());
    expect(typeof result.current.submit).toBe("function");
    expect(typeof result.current.clearError).toBe("function");
  });

  it("옵션 없이 훅을 초기화할 수 있다", () => {
    const { result } = renderHook(() => useFormSubmission());
    expect(result.current.pending).toBe(false);
    expect(result.current.localError).toBeNull();
  });
});

describe("useFormSubmission - pending 상태 전환", () => {
  it("submit 호출 중 pending이 true가 된다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });

    act(() => {
      result.current.submit(() => promise);
    });

    expect(result.current.pending).toBe(true);

    await act(async () => {
      resolve!();
    });

    expect(result.current.pending).toBe(false);
  });

  it("submit 완료 후 pending이 false로 돌아온다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() => Promise.resolve("완료"));
    });

    expect(result.current.pending).toBe(false);
  });

  it("submit 실패 후에도 pending이 false로 복구된다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() => Promise.reject(new Error("실패")));
    });

    expect(result.current.pending).toBe(false);
  });
});

describe("useFormSubmission - 성공 처리", () => {
  it("성공 시 submit의 반환값을 그대로 반환한다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.submit(() => Promise.resolve("결과값"));
    });

    expect(returnValue).toBe("결과값");
  });

  it("successMessage가 있으면 toast.success를 호출한다", async () => {
    const { result } = renderHook(() =>
      useFormSubmission({ successMessage: "저장되었습니다" })
    );

    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    expect(mockedToastSuccess).toHaveBeenCalledOnce();
    expect(mockedToastSuccess).toHaveBeenCalledWith("저장되었습니다");
  });

  it("successMessage가 없으면 toast.success를 호출하지 않는다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    expect(mockedToastSuccess).not.toHaveBeenCalled();
  });

  it("성공 시 onSuccess 콜백이 호출된다", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useFormSubmission({ onSuccess })
    );

    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("성공 후 localError가 null로 유지된다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    expect(result.current.localError).toBeNull();
  });

  it("성공 시 onError 콜백이 호출되지 않는다", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFormSubmission({ onError })
    );

    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    expect(onError).not.toHaveBeenCalled();
  });
});

describe("useFormSubmission - 실패 처리", () => {
  it("Error 객체 실패 시 undefined를 반환한다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.submit(() =>
        Promise.reject(new Error("오류 발생"))
      );
    });

    expect(returnValue).toBeUndefined();
  });

  it("errorMessage 옵션이 있으면 해당 메시지로 toast.error를 호출한다", async () => {
    const { result } = renderHook(() =>
      useFormSubmission({ errorMessage: "저장에 실패했습니다" })
    );

    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("내부 에러"))
      );
    });

    expect(mockedToastError).toHaveBeenCalledOnce();
    expect(mockedToastError).toHaveBeenCalledWith("저장에 실패했습니다");
  });

  it("errorMessage 없으면 Error 메시지를 toast.error에 전달한다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("구체적인 에러 메시지"))
      );
    });

    expect(mockedToastError).toHaveBeenCalledWith("구체적인 에러 메시지");
  });

  it("Error 객체가 아닌 에러일 때 기본 메시지를 사용한다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() => Promise.reject("문자열 에러"));
    });

    expect(mockedToastError).toHaveBeenCalledWith(
      "요청 처리 중 오류가 발생했습니다"
    );
  });

  it("실패 시 localError가 에러 메시지로 설정된다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("에러입니다"))
      );
    });

    expect(result.current.localError).toBe("에러입니다");
  });

  it("errorMessage 옵션이 있을 때 localError도 해당 메시지로 설정된다", async () => {
    const { result } = renderHook(() =>
      useFormSubmission({ errorMessage: "커스텀 에러" })
    );

    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("원본 에러"))
      );
    });

    expect(result.current.localError).toBe("커스텀 에러");
  });

  it("실패 시 onError 콜백이 Error 객체와 함께 호출된다", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFormSubmission({ onError })
    );

    const error = new Error("테스트 에러");
    await act(async () => {
      await result.current.submit(() => Promise.reject(error));
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("Error 아닌 에러 throw 시 onError에 Error 래퍼로 전달된다", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFormSubmission({ onError })
    );

    await act(async () => {
      await result.current.submit(() => Promise.reject("문자열"));
    });

    expect(onError).toHaveBeenCalledOnce();
    const receivedError = onError.mock.calls[0][0];
    expect(receivedError).toBeInstanceOf(Error);
  });

  it("실패 시 onSuccess 콜백이 호출되지 않는다", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useFormSubmission({ onSuccess })
    );

    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("실패"))
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("useFormSubmission - 중복 제출 방지", () => {
  it("pending 중 재호출 시 undefined를 반환하고 무시한다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });

    // 첫 번째 제출 시작
    act(() => {
      result.current.submit(() => promise);
    });
    expect(result.current.pending).toBe(true);

    // pending 중 두 번째 제출 → undefined 반환
    let secondResult: string | undefined;
    await act(async () => {
      secondResult = await result.current.submit(() =>
        Promise.resolve("두 번째")
      );
    });
    expect(secondResult).toBeUndefined();

    // 첫 번째 완료 후 pending 해제
    await act(async () => {
      resolve!();
    });
    expect(result.current.pending).toBe(false);
  });

  it("pending 중 두 번째 제출에서 toast가 추가로 호출되지 않는다", async () => {
    const { result } = renderHook(() =>
      useFormSubmission({ successMessage: "성공" })
    );

    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });

    act(() => {
      result.current.submit(() => promise);
    });

    // 중복 제출 시도
    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    // 첫 번째 완료
    await act(async () => {
      resolve!();
    });

    // toast.success는 첫 번째 성공에서만 1번 호출
    expect(mockedToastSuccess).toHaveBeenCalledTimes(1);
  });
});

describe("useFormSubmission - clearError", () => {
  it("clearError 호출 시 localError가 null로 초기화된다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    // 에러 발생
    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("에러"))
      );
    });
    expect(result.current.localError).not.toBeNull();

    // clearError 호출
    act(() => {
      result.current.clearError();
    });

    expect(result.current.localError).toBeNull();
  });

  it("localError가 없는 상태에서 clearError 호출해도 문제없다", () => {
    const { result } = renderHook(() => useFormSubmission());

    expect(() => {
      act(() => {
        result.current.clearError();
      });
    }).not.toThrow();

    expect(result.current.localError).toBeNull();
  });

  it("에러 후 clearError하면 다음 submit 전에 null이다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("에러"))
      );
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.localError).toBeNull();
  });
});

describe("useFormSubmission - submit 시 localError 자동 초기화", () => {
  it("새 submit 호출 시 이전 localError가 지워진다", async () => {
    const { result } = renderHook(() => useFormSubmission());

    // 첫 번째 실패
    await act(async () => {
      await result.current.submit(() =>
        Promise.reject(new Error("첫 에러"))
      );
    });
    expect(result.current.localError).toBe("첫 에러");

    // 두 번째 성공
    await act(async () => {
      await result.current.submit(() => Promise.resolve());
    });

    expect(result.current.localError).toBeNull();
  });
});
