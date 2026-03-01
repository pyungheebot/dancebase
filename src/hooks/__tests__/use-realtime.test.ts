import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRealtime } from "@/hooks/use-realtime";

// ---------------------------------------------------------------------------
// Supabase 클라이언트 mock
// ---------------------------------------------------------------------------

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};
const mockRemoveChannel = vi.fn();
// channel() 호출을 추적하기 위해 module 레벨 spy를 유지
const mockChannelFn = vi.fn(() => mockChannel);

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: mockChannelFn,
    removeChannel: mockRemoveChannel,
  }),
}));

// ---------------------------------------------------------------------------
// 테스트 헬퍼
// ---------------------------------------------------------------------------

function makeSubscription(
  overrides: Partial<Parameters<typeof useRealtime>[1][number]> = {}
): Parameters<typeof useRealtime>[1][number] {
  return {
    event: "INSERT",
    table: "test_table",
    callback: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

describe("useRealtime - 마운트/언마운트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // on().subscribe() 체인을 항상 유지
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
  });

  it("마운트 시 채널 subscribe를 호출한다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription()])
    );

    expect(mockChannel.subscribe).toHaveBeenCalledOnce();
  });

  it("언마운트 시 removeChannel을 호출한다 (cleanup)", () => {
    const { unmount } = renderHook(() =>
      useRealtime("test-channel", [makeSubscription()])
    );

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledOnce();
  });

  it("언마운트 후 removeChannel에는 채널 객체가 전달된다", () => {
    const { unmount } = renderHook(() =>
      useRealtime("test-channel", [makeSubscription()])
    );

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});

describe("useRealtime - channelKey 변경", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
  });

  it("channelKey 변경 시 이전 채널을 removeChannel로 제거한다", () => {
    const { rerender } = renderHook(
      ({ key }: { key: string }) =>
        useRealtime(key, [makeSubscription()]),
      { initialProps: { key: "channel-a" } }
    );

    // channelKey 변경
    rerender({ key: "channel-b" });

    // 이전 채널이 정리되었어야 함
    expect(mockRemoveChannel).toHaveBeenCalledOnce();
  });

  it("channelKey 변경 시 새 채널에 subscribe를 다시 호출한다", () => {
    const { rerender } = renderHook(
      ({ key }: { key: string }) =>
        useRealtime(key, [makeSubscription()]),
      { initialProps: { key: "channel-a" } }
    );

    rerender({ key: "channel-b" });

    // 초기 1회 + 재구독 1회 = 2회
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(2);
  });
});

describe("useRealtime - enabled 옵션", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
  });

  it("enabled=false 시 subscribe를 호출하지 않는다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription()], { enabled: false })
    );

    expect(mockChannel.subscribe).not.toHaveBeenCalled();
  });

  it("enabled=false 시 .on()도 호출하지 않는다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription()], { enabled: false })
    );

    expect(mockChannel.on).not.toHaveBeenCalled();
  });

  it("enabled가 false→true로 변경되면 subscribe를 호출한다", () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useRealtime("test-channel", [makeSubscription()], { enabled }),
      { initialProps: { enabled: false } }
    );

    // 초기에는 구독 안 함
    expect(mockChannel.subscribe).not.toHaveBeenCalled();

    rerender({ enabled: true });

    // enabled=true로 변경 후 구독
    expect(mockChannel.subscribe).toHaveBeenCalledOnce();
  });

  it("enabled가 true→false로 변경되면 removeChannel을 호출한다", () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useRealtime("test-channel", [makeSubscription()], { enabled }),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });

    expect(mockRemoveChannel).toHaveBeenCalledOnce();
  });

  it("enabled 옵션 미전달 시(기본 true) subscribe를 호출한다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription()])
    );

    expect(mockChannel.subscribe).toHaveBeenCalledOnce();
  });
});

describe("useRealtime - subscriptions .on() 호출", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
  });

  it("subscriptions 배열 항목 수만큼 .on()을 호출한다", () => {
    const subs = [
      makeSubscription({ event: "INSERT", table: "table_a" }),
      makeSubscription({ event: "UPDATE", table: "table_b" }),
      makeSubscription({ event: "DELETE", table: "table_c" }),
    ];

    renderHook(() => useRealtime("test-channel", subs));

    expect(mockChannel.on).toHaveBeenCalledTimes(3);
  });

  it(".on() 첫 번째 인자는 항상 'postgres_changes'이다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription({ event: "UPDATE" })])
    );

    const [type] = mockChannel.on.mock.calls[0];
    expect(type).toBe("postgres_changes");
  });

  it(".on() 필터 객체에 event, schema, table이 포함된다", () => {
    renderHook(() =>
      useRealtime("test-channel", [
        makeSubscription({ event: "DELETE", table: "members" }),
      ])
    );

    const [, filter] = mockChannel.on.mock.calls[0];
    expect(filter).toMatchObject({
      event: "DELETE",
      schema: "public",
      table: "members",
    });
  });

  it("schema 미지정 시 기본값 'public'이 사용된다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription({ schema: undefined })])
    );

    const [, filter] = mockChannel.on.mock.calls[0];
    expect(filter.schema).toBe("public");
  });

  it("schema를 명시하면 해당 schema가 전달된다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription({ schema: "auth" })])
    );

    const [, filter] = mockChannel.on.mock.calls[0];
    expect(filter.schema).toBe("auth");
  });

  it("filter 옵션을 지정하면 .on() 필터 객체에 포함된다", () => {
    renderHook(() =>
      useRealtime("test-channel", [
        makeSubscription({ filter: "user_id=eq.abc123" }),
      ])
    );

    const [, filter] = mockChannel.on.mock.calls[0];
    expect(filter.filter).toBe("user_id=eq.abc123");
  });

  it("filter 미지정 시 .on() 필터 객체에 filter 키가 없다", () => {
    renderHook(() =>
      useRealtime("test-channel", [makeSubscription({ filter: undefined })])
    );

    const [, filter] = mockChannel.on.mock.calls[0];
    expect(filter).not.toHaveProperty("filter");
  });

  it(".on() 세 번째 인자로 callback이 전달된다", () => {
    const cb = vi.fn();

    renderHook(() =>
      useRealtime("test-channel", [makeSubscription({ callback: cb })])
    );

    const [, , receivedCb] = mockChannel.on.mock.calls[0];
    expect(receivedCb).toBe(cb);
  });

  it("subscriptions가 빈 배열이면 .on()을 호출하지 않는다", () => {
    renderHook(() => useRealtime("test-channel", []));

    expect(mockChannel.on).not.toHaveBeenCalled();
  });
});

describe("useRealtime - channelKey가 채널 이름으로 전달됨", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
    mockChannelFn.mockReturnValue(mockChannel);
  });

  it("createClient().channel()에 channelKey가 그대로 전달된다", () => {
    renderHook(() =>
      useRealtime("my-unique-channel-key", [makeSubscription()])
    );

    // module 레벨 mockChannelFn을 통해 호출 인자 확인
    expect(mockChannelFn).toHaveBeenCalledWith("my-unique-channel-key");
  });
});
