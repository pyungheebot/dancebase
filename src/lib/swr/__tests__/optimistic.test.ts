import { describe, it, expect, vi, beforeEach } from "vitest";
import { optimisticMutate, optimisticMutateMany } from "@/lib/swr/optimistic";

// SWR mutate mock
vi.mock("swr", () => ({
  mutate: vi.fn(),
}));

import { mutate } from "swr";

const mockedMutate = vi.mocked(mutate);

beforeEach(() => {
  mockedMutate.mockReset();
});

// optimisticMutate 내부에서 mutate(key, updater, { revalidate: false })를 호출하면
// updater를 실행해서 낙관적 데이터를 반환하도록 mock을 설정하는 헬퍼.
// 실제 SWR은 updater(currentCache)로 새 값을 계산하지만,
// 테스트에서는 내부 snapshot 캡처 여부만 확인하므로 단순히 Promise.resolve()로 처리.
function setupOptimisticMock(initialData: unknown = ["item1"]) {
  mockedMutate.mockImplementation(
    async (
      key: unknown,
      updaterOrData?: unknown,
      _options?: unknown
    ) => {
      if (typeof updaterOrData === "function") {
        // updater 호출하여 snapshot이 캡처되도록 함
        updaterOrData(initialData);
      }
      return undefined;
    }
  );
}

describe("optimisticMutate - 성공 케이스", () => {
  it("낙관적 데이터 적용 후 서버 액션을 실행한다", async () => {
    setupOptimisticMock();
    const serverAction = vi.fn().mockResolvedValue(undefined);

    const result = await optimisticMutate(
      "/test-key",
      (prev: string[] | undefined) => [...(prev ?? []), "newItem"],
      serverAction
    );

    expect(serverAction).toHaveBeenCalledOnce();
    expect(result).toBe(true);
  });

  it("성공 시 revalidate=true면 mutate를 재검증 옵션 없이 한 번 더 호출한다", async () => {
    setupOptimisticMock();
    const serverAction = vi.fn().mockResolvedValue(undefined);

    await optimisticMutate("/test-key", (p: unknown) => p, serverAction, {
      revalidate: true,
    });

    // 1차 호출: optimistic update (updater + revalidate:false)
    // 2차 호출: revalidate (key만)
    expect(mockedMutate).toHaveBeenCalledTimes(2);
    const secondCall = mockedMutate.mock.calls[1];
    expect(secondCall[0]).toBe("/test-key");
    expect(secondCall[1]).toBeUndefined();
  });

  it("revalidate=false면 성공 후 재검증 mutate를 호출하지 않는다", async () => {
    setupOptimisticMock();
    const serverAction = vi.fn().mockResolvedValue(undefined);

    await optimisticMutate("/test-key", (p: unknown) => p, serverAction, {
      revalidate: false,
    });

    // 낙관적 업데이트 1번만 호출
    expect(mockedMutate).toHaveBeenCalledTimes(1);
  });

  it("성공 시 onSuccess 콜백이 호출된다", async () => {
    setupOptimisticMock();
    const onSuccess = vi.fn();

    await optimisticMutate("/test-key", (p: unknown) => p, vi.fn().mockResolvedValue(undefined), {
      onSuccess,
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("성공 시 onError 콜백은 호출되지 않는다", async () => {
    setupOptimisticMock();
    const onError = vi.fn();

    await optimisticMutate("/test-key", (p: unknown) => p, vi.fn().mockResolvedValue(undefined), {
      onError,
    });

    expect(onError).not.toHaveBeenCalled();
  });
});

describe("optimisticMutate - 실패 케이스 (롤백)", () => {
  it("서버 액션 실패 시 false를 반환한다", async () => {
    setupOptimisticMock();
    const serverAction = vi.fn().mockRejectedValue(new Error("서버 오류"));

    const result = await optimisticMutate(
      "/test-key",
      (p: unknown) => p,
      serverAction
    );

    expect(result).toBe(false);
  });

  it("rollbackOnError=true(기본값)이면 실패 시 스냅샷으로 롤백한다", async () => {
    const initialData = ["original"];
    setupOptimisticMock(initialData);
    const serverAction = vi.fn().mockRejectedValue(new Error("실패"));

    await optimisticMutate(
      "/test-key",
      (_prev: unknown) => ["optimistic"],
      serverAction,
      { rollbackOnError: true }
    );

    // 낙관적 업데이트 1번 + 롤백 1번 = 총 2번
    expect(mockedMutate).toHaveBeenCalledTimes(2);

    // 두 번째 호출이 롤백 (스냅샷으로 복원, revalidate:false)
    const rollbackCall = mockedMutate.mock.calls[1];
    expect(rollbackCall[0]).toBe("/test-key");
    expect(rollbackCall[2]).toEqual({ revalidate: false });
  });

  it("rollbackOnError=false면 실패 시 롤백 mutate를 호출하지 않는다", async () => {
    setupOptimisticMock();
    const serverAction = vi.fn().mockRejectedValue(new Error("실패"));

    await optimisticMutate(
      "/test-key",
      (p: unknown) => p,
      serverAction,
      { rollbackOnError: false }
    );

    // 낙관적 업데이트 1번만 호출 (롤백 없음)
    expect(mockedMutate).toHaveBeenCalledTimes(1);
  });

  it("실패 시 onError 콜백이 에러와 함께 호출된다", async () => {
    setupOptimisticMock();
    const onError = vi.fn();
    const err = new Error("서버 오류");
    const serverAction = vi.fn().mockRejectedValue(err);

    await optimisticMutate("/test-key", (p: unknown) => p, serverAction, {
      onError,
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(err);
  });

  it("실패 시 onSuccess 콜백은 호출되지 않는다", async () => {
    setupOptimisticMock();
    const onSuccess = vi.fn();
    const serverAction = vi.fn().mockRejectedValue(new Error("실패"));

    await optimisticMutate("/test-key", (p: unknown) => p, serverAction, {
      onSuccess,
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("optimisticMutateMany - 여러 키 동시 업데이트", () => {
  it("모든 타겟에 낙관적 업데이트를 적용한다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const serverAction = vi.fn().mockResolvedValue(undefined);

    const targets = [
      { key: "/key-a", updater: (p: unknown) => p },
      { key: "/key-b", updater: (p: unknown) => p },
    ];

    const result = await optimisticMutateMany(targets, serverAction);

    expect(result).toBe(true);
    // 낙관적 업데이트 2개 + 재검증 2개 = 총 4번
    expect(mockedMutate).toHaveBeenCalledTimes(4);
  });

  it("성공 시 모든 키에 대해 재검증을 호출한다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const serverAction = vi.fn().mockResolvedValue(undefined);

    const targets = [
      { key: "/key-a", updater: (p: unknown) => p },
      { key: "/key-b", updater: (p: unknown) => p },
      { key: "/key-c", updater: (p: unknown) => p },
    ];

    await optimisticMutateMany(targets, serverAction, { revalidate: true });

    // 낙관적 3 + 재검증 3 = 6
    expect(mockedMutate).toHaveBeenCalledTimes(6);
  });

  it("revalidate=false면 성공 후 재검증을 호출하지 않는다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const serverAction = vi.fn().mockResolvedValue(undefined);

    const targets = [
      { key: "/key-a", updater: (p: unknown) => p },
      { key: "/key-b", updater: (p: unknown) => p },
    ];

    await optimisticMutateMany(targets, serverAction, { revalidate: false });

    // 낙관적 2번만
    expect(mockedMutate).toHaveBeenCalledTimes(2);
  });

  it("실패 시 모든 키를 롤백한다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const serverAction = vi.fn().mockRejectedValue(new Error("실패"));

    const targets = [
      { key: "/key-a", updater: (p: unknown) => p },
      { key: "/key-b", updater: (p: unknown) => p },
    ];

    const result = await optimisticMutateMany(targets, serverAction, {
      rollbackOnError: true,
    });

    expect(result).toBe(false);
    // 낙관적 2 + 롤백 2 = 4
    expect(mockedMutate).toHaveBeenCalledTimes(4);
  });

  it("실패 시 rollbackOnError=false면 롤백하지 않는다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const serverAction = vi.fn().mockRejectedValue(new Error("실패"));

    const targets = [
      { key: "/key-a", updater: (p: unknown) => p },
      { key: "/key-b", updater: (p: unknown) => p },
    ];

    await optimisticMutateMany(targets, serverAction, {
      rollbackOnError: false,
    });

    // 낙관적 2번만 (롤백 없음)
    expect(mockedMutate).toHaveBeenCalledTimes(2);
  });

  it("성공 시 onSuccess 콜백이 호출된다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    await optimisticMutateMany(
      [{ key: "/key-a", updater: (p: unknown) => p }],
      vi.fn().mockResolvedValue(undefined),
      { onSuccess }
    );

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("실패 시 onError 콜백이 에러와 함께 호출된다", async () => {
    mockedMutate.mockResolvedValue(undefined);
    const onError = vi.fn();
    const err = new Error("다중 업데이트 실패");

    await optimisticMutateMany(
      [{ key: "/key-a", updater: (p: unknown) => p }],
      vi.fn().mockRejectedValue(err),
      { onError }
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(err);
  });
});
