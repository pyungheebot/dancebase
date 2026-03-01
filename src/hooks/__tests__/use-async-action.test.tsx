import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAsyncAction } from "@/hooks/use-async-action";

describe("useAsyncAction - pending 상태 전환", () => {
  it("초기 pending 상태는 false다", () => {
    const { result } = renderHook(() => useAsyncAction());
    expect(result.current.pending).toBe(false);
  });

  it("execute 중 pending 상태가 true로 전환된다", async () => {
    const { result } = renderHook(() => useAsyncAction());

    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });

    act(() => {
      result.current.execute(() => promise);
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      resolve!();
    });
    expect(result.current.pending).toBe(false);
  });

  it("execute 완료 후 pending이 false로 돌아온다", async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      await result.current.execute(() => Promise.resolve("done"));
    });

    expect(result.current.pending).toBe(false);
  });

  it("execute의 반환값을 그대로 반환한다", async () => {
    const { result } = renderHook(() => useAsyncAction());

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.execute(() => Promise.resolve("결과값"));
    });

    expect(returnValue).toBe("결과값");
  });
});

describe("useAsyncAction - 중복 실행 차단", () => {
  it("pending 중 중복 실행을 차단하고 undefined를 반환한다", async () => {
    const { result } = renderHook(() => useAsyncAction());

    let resolve: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });

    // 첫 번째 execute 시작
    act(() => {
      result.current.execute(() => promise);
    });
    expect(result.current.pending).toBe(true);

    // pending 중 두 번째 execute 시도 → undefined 반환
    let secondResult: void | undefined | string;
    await act(async () => {
      secondResult = await result.current.execute(() => Promise.resolve("두 번째"));
    });
    expect(secondResult).toBeUndefined();

    // 첫 번째 resolve 후 pending 해제
    await act(async () => {
      resolve!();
    });
    expect(result.current.pending).toBe(false);
  });
});

describe("useAsyncAction - 에러 처리", () => {
  it("execute 중 에러가 발생하면 pending이 false로 복구된다", async () => {
    const { result } = renderHook(() => useAsyncAction());

    await act(async () => {
      try {
        await result.current.execute(() => Promise.reject(new Error("오류 발생")));
      } catch {
        // 에러 무시
      }
    });

    expect(result.current.pending).toBe(false);
  });

  it("에러를 호출자에게 전파한다", async () => {
    const { result } = renderHook(() => useAsyncAction());
    const error = new Error("테스트 오류");

    let caught: Error | undefined;
    await act(async () => {
      try {
        await result.current.execute(() => Promise.reject(error));
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught).toBe(error);
  });
});
