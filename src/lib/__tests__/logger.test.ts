import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

// console mock 헬퍼
function mockConsole() {
  return {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };
}

describe("logger - 개발 환경 (NODE_ENV=test)", () => {
  let mocks: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    mocks = mockConsole();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debug 레벨을 console.log로 출력한다", () => {
    logger.debug("디버그 메시지");
    expect(mocks.log).toHaveBeenCalledOnce();
  });

  it("info 레벨을 console.log로 출력한다", () => {
    logger.info("인포 메시지");
    expect(mocks.log).toHaveBeenCalledOnce();
  });

  it("warn 레벨을 console.warn으로 출력한다", () => {
    logger.warn("경고 메시지");
    expect(mocks.warn).toHaveBeenCalledOnce();
  });

  it("error 레벨을 console.error로 출력한다", () => {
    logger.error("에러 메시지");
    expect(mocks.error).toHaveBeenCalledOnce();
  });

  it("context가 있으면 접두사에 [context]가 포함된다", () => {
    logger.info("메시지", "MyModule");
    const [prefix] = mocks.log.mock.calls[0];
    expect(prefix).toContain("[MyModule]");
  });

  it("context가 없으면 접두사에 대괄호가 하나만 존재한다 (타임스탬프만)", () => {
    logger.info("메시지");
    const [prefix] = mocks.log.mock.calls[0];
    // 타임스탬프 대괄호 1개만 존재
    expect((prefix.match(/\[/g) ?? []).length).toBe(1);
  });

  it("data 파라미터가 추가 인자로 전달된다", () => {
    const data = { userId: "u1", role: "admin" };
    logger.info("메시지", "Ctx", data);
    const call = mocks.log.mock.calls[0];
    // prefix, message, data 순서
    expect(call).toHaveLength(3);
    expect(call[2]).toEqual(data);
  });

  it("data가 없으면 인자가 2개만 전달된다", () => {
    logger.info("메시지", "Ctx");
    const call = mocks.log.mock.calls[0];
    expect(call).toHaveLength(2);
  });

  it("data가 undefined이면 인자가 2개만 전달된다", () => {
    logger.debug("메시지", "Ctx", undefined);
    const call = mocks.log.mock.calls[0];
    expect(call).toHaveLength(2);
  });
});

describe("logger - 타임스탬프 포맷", () => {
  let mocks: ReturnType<typeof mockConsole>;

  beforeEach(() => {
    mocks = mockConsole();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("타임스탬프가 [YYYY-MM-DD HH:MM:SS.mmm] 형식을 포함한다", () => {
    logger.info("타임스탬프 확인");
    const [prefix] = mocks.log.mock.calls[0];
    // "[2026-03-01 12:34:56.789]" 형태
    expect(prefix).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/);
  });

  it("debug 레벨 접두사에 DEBUG가 포함된다", () => {
    logger.debug("레벨 확인");
    const [prefix] = mocks.log.mock.calls[0];
    expect(prefix).toContain("DEBUG");
  });

  it("info 레벨 접두사에 INFO가 포함된다", () => {
    logger.info("레벨 확인");
    const [prefix] = mocks.log.mock.calls[0];
    expect(prefix).toContain("INFO");
  });

  it("warn 레벨 접두사에 WARN이 포함된다", () => {
    logger.warn("레벨 확인");
    const [prefix] = mocks.warn.mock.calls[0];
    expect(prefix).toContain("WARN");
  });

  it("error 레벨 접두사에 ERROR가 포함된다", () => {
    logger.error("레벨 확인");
    const [prefix] = mocks.error.mock.calls[0];
    expect(prefix).toContain("ERROR");
  });
});

describe("logger - 프로덕션 환경 (NODE_ENV=production)", () => {
  let mocks: ReturnType<typeof mockConsole>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV는 보통 readonly지만 테스트에서만 변경
    process.env.NODE_ENV = "production";
    mocks = mockConsole();
  });

  afterEach(() => {
    // @ts-expect-error 복원
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("debug는 출력되지 않는다", () => {
    logger.debug("디버그 메시지");
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it("info는 출력되지 않는다", () => {
    logger.info("인포 메시지");
    expect(mocks.log).not.toHaveBeenCalled();
  });

  it("warn은 출력된다", () => {
    logger.warn("경고 메시지");
    expect(mocks.warn).toHaveBeenCalledOnce();
  });

  it("error는 출력된다", () => {
    logger.error("에러 메시지");
    expect(mocks.error).toHaveBeenCalledOnce();
  });

  it("프로덕션에서 warn에 context가 접두사에 포함된다", () => {
    logger.warn("경고", "ProdCtx");
    const [prefix] = mocks.warn.mock.calls[0];
    expect(prefix).toContain("[ProdCtx]");
  });

  it("프로덕션에서 error에 data가 전달된다", () => {
    const err = new Error("서버 오류");
    logger.error("오류 발생", "Server", err);
    const call = mocks.error.mock.calls[0];
    expect(call).toHaveLength(3);
    expect(call[2]).toBe(err);
  });
});
