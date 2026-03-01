import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted로 mock 변수를 호이스팅 순서에 맞게 선언
const { mockSkeleton, mockDynamic } = vi.hoisted(() => {
  const mockSkeleton = vi.fn(({ className }: { className: string }) => {
    const el = document.createElement("div");
    el.className = className;
    return el;
  });

  const mockDynamic = vi.fn(
    (importFn: () => Promise<unknown>, options?: Record<string, unknown>) => {
      const FakeComponent = () => null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (FakeComponent as any)._importFn = importFn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (FakeComponent as any)._options = options;
      return FakeComponent;
    }
  );

  return { mockSkeleton, mockDynamic };
});

vi.mock("next/dynamic", () => ({ default: mockDynamic }));
vi.mock("@/components/ui/skeleton", () => ({ Skeleton: mockSkeleton }));

import { lazyLoad } from "@/lib/dynamic-import";

describe("lazyLoad - 기본 동작", () => {
  beforeEach(() => {
    mockDynamic.mockClear();
  });

  it("컴포넌트(함수)를 반환한다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    const result = lazyLoad(fakeImport);
    expect(typeof result).toBe("function");
  });

  it("내부적으로 next/dynamic을 호출한다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport);
    expect(mockDynamic).toHaveBeenCalledOnce();
  });

  it("importFn이 next/dynamic에 그대로 전달된다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport);
    const [passedImportFn] = mockDynamic.mock.calls[0];
    expect(passedImportFn).toBe(fakeImport);
  });
});

describe("lazyLoad - skeletonHeight 옵션", () => {
  beforeEach(() => {
    mockDynamic.mockClear();
    mockSkeleton.mockClear();
  });

  it("옵션 미지정 시 loading 함수가 존재한다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport);

    const [, options] = mockDynamic.mock.calls[0] as [
      unknown,
      { loading?: () => unknown },
    ];
    expect(options).toHaveProperty("loading");
    expect(typeof options!.loading).toBe("function");
  });

  it("loading 함수 호출 시 Skeleton에 기본 h-20 클래스가 전달된다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport);

    const [, options] = mockDynamic.mock.calls[0] as [
      unknown,
      { loading?: () => unknown },
    ];
    options!.loading!();

    expect(mockSkeleton).toHaveBeenCalledOnce();
    expect(mockSkeleton).toHaveBeenCalledWith(
      expect.objectContaining({ className: expect.stringContaining("h-20") })
    );
  });

  it("커스텀 skeletonHeight가 loading 함수에 반영된다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport, { skeletonHeight: "h-48" });

    const [, options] = mockDynamic.mock.calls[0] as [
      unknown,
      { loading?: () => unknown },
    ];
    options!.loading!();

    expect(mockSkeleton).toHaveBeenCalledWith(
      expect.objectContaining({ className: expect.stringContaining("h-48") })
    );
  });
});

describe("lazyLoad - noLoading 옵션", () => {
  beforeEach(() => {
    mockDynamic.mockClear();
  });

  it("noLoading: true이면 loading 속성이 전달되지 않는다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport, { noLoading: true });

    const [, options] = mockDynamic.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(options).not.toHaveProperty("loading");
  });

  it("noLoading: false이면 loading 속성이 전달된다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport, { noLoading: false });

    const [, options] = mockDynamic.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(options).toHaveProperty("loading");
  });

  it("옵션 미지정 시 loading 속성이 전달된다 (noLoading 기본값: false)", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport);

    const [, options] = mockDynamic.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(options).toHaveProperty("loading");
  });
});

describe("lazyLoad - ssr 옵션", () => {
  beforeEach(() => {
    mockDynamic.mockClear();
  });

  it("ssr 기본값은 false로 전달된다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport);

    const [, options] = mockDynamic.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(options).toHaveProperty("ssr", false);
  });

  it("ssr: true로 설정하면 true로 전달된다", () => {
    const fakeImport = () => Promise.resolve({ default: () => null });
    lazyLoad(fakeImport, { ssr: true });

    const [, options] = mockDynamic.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(options).toHaveProperty("ssr", true);
  });
});
