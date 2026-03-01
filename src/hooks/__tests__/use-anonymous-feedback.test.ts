import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useAnonymousFeedback,
  CATEGORY_LABELS,
} from "@/hooks/use-anonymous-feedback";
import type { FeedbackCategory } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useAnonymousFeedback(groupId));
}

function sendFeedback(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: {
    senderId?: string;
    targetUserId?: string;
    category?: FeedbackCategory;
    content?: string;
  } = {}
) {
  let result: ReturnType<ReturnType<typeof makeHook>["result"]["current"]["sendFeedback"]>;
  act(() => {
    result = hook.current.sendFeedback(
      overrides.senderId ?? "sender-1",
      overrides.targetUserId ?? "target-1",
      overrides.category ?? "praise",
      overrides.content ?? "훌륭한 퍼포먼스였어요"
    );
  });
  return result!;
}

// ============================================================
// CATEGORY_LABELS - 상수 검증
// ============================================================

describe("CATEGORY_LABELS - 상수 검증", () => {
  it("praise 레이블이 '칭찬'이다", () => {
    expect(CATEGORY_LABELS.praise).toBe("칭찬");
  });

  it("encouragement 레이블이 '격려'이다", () => {
    expect(CATEGORY_LABELS.encouragement).toBe("격려");
  });

  it("improvement 레이블이 '개선 제안'이다", () => {
    expect(CATEGORY_LABELS.improvement).toBe("개선 제안");
  });

  it("other 레이블이 '기타'이다", () => {
    expect(CATEGORY_LABELS.other).toBe("기타");
  });

  it("4가지 카테고리가 모두 존재한다", () => {
    const keys = Object.keys(CATEGORY_LABELS);
    expect(keys).toHaveLength(4);
    expect(keys).toContain("praise");
    expect(keys).toContain("encouragement");
    expect(keys).toContain("improvement");
    expect(keys).toContain("other");
  });
});

// ============================================================
// useAnonymousFeedback - 초기 상태
// ============================================================

describe("useAnonymousFeedback - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.sendFeedback).toBe("function");
    expect(typeof result.current.getReceivedFeedbacks).toBe("function");
    expect(typeof result.current.getSentFeedbacks).toBe("function");
    expect(typeof result.current.getCategoryDistribution).toBe("function");
    expect(typeof result.current.hasSentTo).toBe("function");
  });
});

// ============================================================
// useAnonymousFeedback - sendFeedback
// ============================================================

describe("useAnonymousFeedback - sendFeedback", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("피드백 전송 후 id가 부여된다", () => {
    const { result } = makeHook();
    const fb = sendFeedback(result);
    expect(fb.id).toBeDefined();
    expect(fb.id).not.toBe("");
  });

  it("피드백의 groupId가 올바르다", () => {
    const { result } = makeHook("group-test");
    const fb = sendFeedback(result);
    expect(fb.groupId).toBe("group-test");
  });

  it("피드백의 targetUserId가 올바르다", () => {
    const { result } = makeHook();
    const fb = sendFeedback(result, { targetUserId: "target-99" });
    expect(fb.targetUserId).toBe("target-99");
  });

  it("피드백의 senderId가 올바르다", () => {
    const { result } = makeHook();
    const fb = sendFeedback(result, { senderId: "sender-42" });
    expect(fb.senderId).toBe("sender-42");
  });

  it("피드백의 category가 올바르다", () => {
    const { result } = makeHook();
    const fb = sendFeedback(result, { category: "encouragement" });
    expect(fb.category).toBe("encouragement");
  });

  it("content가 trim되어 저장된다", () => {
    const { result } = makeHook();
    const fb = sendFeedback(result, { content: "  잘했어요!  " });
    expect(fb.content).toBe("잘했어요!");
  });

  it("createdAt 필드가 유효한 ISO 날짜이다", () => {
    const { result } = makeHook();
    const fb = sendFeedback(result);
    const d = new Date(fb.createdAt);
    expect(d.toString()).not.toBe("Invalid Date");
  });

  it("피드백 전송 후 getReceivedFeedbacks에서 조회된다", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "target-1" });
    const received = result.current.getReceivedFeedbacks("target-1");
    expect(received).toHaveLength(1);
  });

  it("피드백 전송 후 getSentFeedbacks에서 조회된다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "sender-1" });
    const sent = result.current.getSentFeedbacks("sender-1");
    expect(sent).toHaveLength(1);
  });
});

// ============================================================
// useAnonymousFeedback - getReceivedFeedbacks
// ============================================================

describe("useAnonymousFeedback - getReceivedFeedbacks", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("해당 사용자가 받은 피드백만 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "A" });
    sendFeedback(result, { targetUserId: "B" });
    sendFeedback(result, { targetUserId: "A" });
    const received = result.current.getReceivedFeedbacks("A");
    expect(received).toHaveLength(2);
    received.forEach((fb) => expect(fb.targetUserId).toBe("A"));
  });

  it("받은 피드백에서 senderId 필드가 제거된다 (익명성 보장)", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "A", senderId: "secret-sender" });
    const received = result.current.getReceivedFeedbacks("A");
    expect(received[0]).not.toHaveProperty("senderId");
  });

  it("받은 피드백이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "A" });
    const received = result.current.getReceivedFeedbacks("Z");
    expect(received).toHaveLength(0);
  });

  it("받은 피드백이 최신순(내림차순)으로 정렬된다", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "A", content: "오래된 피드백" });
    sendFeedback(result, { targetUserId: "A", content: "최신 피드백" });
    const received = result.current.getReceivedFeedbacks("A");
    // 최신이 앞에 와야 함
    expect(new Date(received[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(received[1].createdAt).getTime()
    );
  });
});

// ============================================================
// useAnonymousFeedback - getSentFeedbacks
// ============================================================

describe("useAnonymousFeedback - getSentFeedbacks", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("해당 sender가 보낸 피드백만 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1" });
    sendFeedback(result, { senderId: "S2" });
    sendFeedback(result, { senderId: "S1" });
    const sent = result.current.getSentFeedbacks("S1");
    expect(sent).toHaveLength(2);
    sent.forEach((fb) => expect(fb.senderId).toBe("S1"));
  });

  it("보낸 피드백에는 senderId가 포함된다 (발신자 본인 조회)", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1" });
    const sent = result.current.getSentFeedbacks("S1");
    expect(sent[0].senderId).toBe("S1");
  });

  it("보낸 피드백이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1" });
    const sent = result.current.getSentFeedbacks("Z");
    expect(sent).toHaveLength(0);
  });

  it("보낸 피드백이 최신순으로 정렬된다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1", content: "오래된" });
    sendFeedback(result, { senderId: "S1", content: "최신" });
    const sent = result.current.getSentFeedbacks("S1");
    expect(new Date(sent[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(sent[1].createdAt).getTime()
    );
  });
});

// ============================================================
// useAnonymousFeedback - getCategoryDistribution
// ============================================================

describe("useAnonymousFeedback - getCategoryDistribution", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("받은 피드백의 카테고리별 수를 올바르게 집계한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "A", category: "praise" });
    sendFeedback(result, { targetUserId: "A", category: "praise" });
    sendFeedback(result, { targetUserId: "A", category: "encouragement" });
    sendFeedback(result, { targetUserId: "A", category: "other" });
    const dist = result.current.getCategoryDistribution("A");
    expect(dist.praise).toBe(2);
    expect(dist.encouragement).toBe(1);
    expect(dist.improvement).toBe(0);
    expect(dist.other).toBe(1);
  });

  it("피드백이 없으면 모든 카테고리가 0이다", () => {
    const { result } = makeHook();
    const dist = result.current.getCategoryDistribution("A");
    expect(dist.praise).toBe(0);
    expect(dist.encouragement).toBe(0);
    expect(dist.improvement).toBe(0);
    expect(dist.other).toBe(0);
  });

  it("다른 사용자의 피드백은 집계되지 않는다", () => {
    const { result } = makeHook();
    sendFeedback(result, { targetUserId: "B", category: "praise" });
    const dist = result.current.getCategoryDistribution("A");
    expect(dist.praise).toBe(0);
  });

  it("카테고리 합산이 받은 피드백 수와 일치한다", () => {
    const { result } = makeHook();
    const categories: FeedbackCategory[] = ["praise", "encouragement", "improvement", "other"];
    categories.forEach((category) =>
      sendFeedback(result, { targetUserId: "A", category })
    );
    const dist = result.current.getCategoryDistribution("A");
    const total = dist.praise + dist.encouragement + dist.improvement + dist.other;
    expect(total).toBe(4);
  });
});

// ============================================================
// useAnonymousFeedback - hasSentTo
// ============================================================

describe("useAnonymousFeedback - hasSentTo", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("피드백을 보낸 경우 hasSentTo가 true를 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1", targetUserId: "T1" });
    expect(result.current.hasSentTo("S1", "T1")).toBe(true);
  });

  it("피드백을 보내지 않은 경우 hasSentTo가 false를 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.hasSentTo("S1", "T1")).toBe(false);
  });

  it("다른 대상에게 보낸 경우 false를 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1", targetUserId: "T2" });
    expect(result.current.hasSentTo("S1", "T1")).toBe(false);
  });

  it("다른 발신자 + 같은 대상이면 false를 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1", targetUserId: "T1" });
    expect(result.current.hasSentTo("S2", "T1")).toBe(false);
  });

  it("여러 피드백 중 일치하는 쌍이 있으면 true를 반환한다", () => {
    const { result } = makeHook();
    sendFeedback(result, { senderId: "S1", targetUserId: "T2" });
    sendFeedback(result, { senderId: "S2", targetUserId: "T1" });
    sendFeedback(result, { senderId: "S1", targetUserId: "T1" });
    expect(result.current.hasSentTo("S1", "T1")).toBe(true);
  });
});

// ============================================================
// useAnonymousFeedback - 그룹 격리
// ============================================================

describe("useAnonymousFeedback - 그룹 격리", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("다른 groupId의 피드백 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-A");
    const { result: r2 } = makeHook("group-B");
    sendFeedback(r1, { targetUserId: "T1" });
    // group-B의 훅에서 group-A의 피드백을 조회할 수 없음
    expect(r2.current.getReceivedFeedbacks("T1")).toHaveLength(0);
  });
});
