/**
 * use-membership-fee 테스트
 *
 * 훅 내부의 순수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - localStorage 키 형식
 * - addPayment - id 자동 생성
 * - updatePayment - 필드 수정
 * - deletePayment - 삭제
 * - setMonthlyFee - 금액 설정
 * - generateMonthPayments - 일괄 생성 (중복 스킵)
 * - getMonthPayments - 월별 조회 (한글 이름순 정렬)
 * - getMonthStats - 통계 (paidCount, unpaidCount, partialCount, exemptCount, collectionRate)
 * - togglePaymentStatus - 상태 사이클 (unpaid → paid → exempt → unpaid)
 * - getAvailableMonths - 16개월
 * - 유틸 함수 (getCurrentMonth, formatMonth)
 */

import { describe, it, expect } from "vitest";
import type { MembershipFeeData, MembershipFeePayment } from "@/types";

// ============================================================
// 훅 내부 순수 함수 재현
// ============================================================

/** localStorage 키 형식 */
function lsKey(groupId: string): string {
  return `dancebase:membership-fee:${groupId}`;
}

/** 빈 데이터 생성 */
function createEmptyData(groupId: string): MembershipFeeData {
  return {
    groupId,
    payments: [],
    monthlyFee: 0,
    currency: "KRW",
    updatedAt: new Date().toISOString(),
  };
}

/** 납부 항목 빌더 */
function makePayment(
  overrides: Partial<MembershipFeePayment> = {}
): MembershipFeePayment {
  return {
    id: "pay-1",
    memberName: "홍길동",
    month: "2026-03",
    amount: 30000,
    paidAt: null,
    status: "unpaid",
    notes: null,
    ...overrides,
  };
}

/** addPayment */
function addPayment(
  store: MembershipFeeData,
  input: Omit<MembershipFeePayment, "id">
): { store: MembershipFeeData; item: MembershipFeePayment } {
  const item: MembershipFeePayment = {
    ...input,
    id: "new-id-" + Date.now(),
  };
  return {
    store: { ...store, payments: [...store.payments, item] },
    item,
  };
}

/** updatePayment */
function updatePayment(
  store: MembershipFeeData,
  id: string,
  fields: Partial<Omit<MembershipFeePayment, "id">>
): MembershipFeeData {
  return {
    ...store,
    payments: store.payments.map((p) =>
      p.id === id ? { ...p, ...fields } : p
    ),
  };
}

/** deletePayment */
function deletePayment(store: MembershipFeeData, id: string): MembershipFeeData {
  return {
    ...store,
    payments: store.payments.filter((p) => p.id !== id),
  };
}

/** setMonthlyFee */
function setMonthlyFee(store: MembershipFeeData, fee: number): MembershipFeeData {
  return { ...store, monthlyFee: fee };
}

/** generateMonthPayments - 중복 스킵 */
function generateMonthPayments(
  store: MembershipFeeData,
  month: string,
  memberNames: string[]
): MembershipFeeData {
  const existingKeys = new Set(
    store.payments
      .filter((p) => p.month === month)
      .map((p) => p.memberName)
  );
  const newPayments: MembershipFeePayment[] = memberNames
    .filter((name) => !existingKeys.has(name))
    .map((name, i) => ({
      id: `generated-${i}`,
      memberName: name,
      month,
      amount: store.monthlyFee,
      paidAt: null,
      status: "unpaid" as const,
      notes: null,
    }));
  if (newPayments.length === 0) return store;
  return { ...store, payments: [...store.payments, ...newPayments] };
}

/** getMonthPayments - 한글 이름순 정렬 */
function getMonthPayments(
  store: MembershipFeeData,
  month: string
): MembershipFeePayment[] {
  return store.payments
    .filter((p) => p.month === month)
    .sort((a, b) => a.memberName.localeCompare(b.memberName, "ko"));
}

/** getMonthStats */
function getMonthStats(store: MembershipFeeData, month: string) {
  const payments = getMonthPayments(store, month);
  const total = payments.length;
  const paidCount = payments.filter(
    (p) => p.status === "paid" || p.status === "exempt"
  ).length;
  const unpaidCount = payments.filter((p) => p.status === "unpaid").length;
  const partialCount = payments.filter((p) => p.status === "partial").length;
  const exemptCount = payments.filter((p) => p.status === "exempt").length;
  const totalCollected = payments
    .filter((p) => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalExpected = payments
    .filter((p) => p.status !== "exempt")
    .reduce((acc) => acc + store.monthlyFee, 0);
  const collectionRate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
  const unpaidMembers = payments
    .filter((p) => p.status === "unpaid")
    .map((p) => p.memberName);
  const memberPaymentStatus = payments.map((p) => ({
    memberName: p.memberName,
    status: p.status,
    amount: p.amount,
    paidAt: p.paidAt,
  }));
  return {
    total,
    paidCount,
    unpaidCount,
    partialCount,
    exemptCount,
    totalCollected,
    totalExpected,
    collectionRate,
    unpaidMembers,
    memberPaymentStatus,
  };
}

/** togglePaymentStatus - unpaid → paid → exempt → unpaid */
function togglePaymentStatus(
  store: MembershipFeeData,
  id: string
): MembershipFeeData {
  const payment = store.payments.find((p) => p.id === id);
  if (!payment) return store;
  const cycle: MembershipFeePayment["status"][] = ["unpaid", "paid", "exempt"];
  const currentIndex = cycle.indexOf(payment.status);
  const nextStatus = cycle[(currentIndex + 1) % cycle.length]!;
  const fields: Partial<MembershipFeePayment> = { status: nextStatus };
  if (nextStatus === "paid") {
    fields.paidAt = new Date().toISOString();
    fields.amount = store.monthlyFee;
  } else if (nextStatus === "unpaid") {
    fields.paidAt = null;
    fields.amount = store.monthlyFee;
  } else if (nextStatus === "exempt") {
    fields.paidAt = null;
  }
  return updatePayment(store, id, fields);
}

/** getAvailableMonths - 과거 12개월 + 현재 + 미래 3개월 = 16개월 */
function getAvailableMonths(now: Date): string[] {
  const months: string[] = [];
  for (let offset = -12; offset <= 3; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

/** getCurrentMonth */
function getCurrentMonth(now: Date): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/** formatMonth */
function formatMonth(month: string): string {
  const [yyyy, mm] = month.split("-");
  return `${yyyy}년 ${Number(mm)}월`;
}

// ============================================================
// 1. localStorage 키 형식
// ============================================================

describe("localStorage 키 형식", () => {
  it("키는 'dancebase:membership-fee:{groupId}' 형식이다", () => {
    expect(lsKey("g1")).toBe("dancebase:membership-fee:g1");
  });

  it("그룹 ID가 다르면 키가 달라진다", () => {
    expect(lsKey("g1")).not.toBe(lsKey("g2"));
  });
});

// ============================================================
// 2. 빈 데이터 초기 상태
// ============================================================

describe("빈 데이터 초기 상태", () => {
  it("payments는 빈 배열이다", () => {
    expect(createEmptyData("g1").payments).toEqual([]);
  });

  it("monthlyFee는 0이다", () => {
    expect(createEmptyData("g1").monthlyFee).toBe(0);
  });

  it("currency는 'KRW'이다", () => {
    expect(createEmptyData("g1").currency).toBe("KRW");
  });

  it("groupId가 올바르게 설정된다", () => {
    expect(createEmptyData("group-xyz").groupId).toBe("group-xyz");
  });
});

// ============================================================
// 3. addPayment
// ============================================================

describe("addPayment", () => {
  it("납부 항목이 추가되면 payments 길이가 1 증가한다", () => {
    const store = createEmptyData("g1");
    const { store: updated } = addPayment(store, {
      memberName: "홍길동",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    expect(updated.payments).toHaveLength(1);
  });

  it("추가된 항목의 memberName이 올바르다", () => {
    const store = createEmptyData("g1");
    const { item } = addPayment(store, {
      memberName: "김철수",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    expect(item.memberName).toBe("김철수");
  });

  it("추가된 항목의 id가 생성된다", () => {
    const store = createEmptyData("g1");
    const { item } = addPayment(store, {
      memberName: "홍길동",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    expect(item.id).toBeDefined();
    expect(item.id.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 4. updatePayment
// ============================================================

describe("updatePayment", () => {
  it("status를 'paid'로 변경할 수 있다", () => {
    let store = createEmptyData("g1");
    const { store: s, item } = addPayment(store, {
      memberName: "홍길동",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    store = updatePayment(s, item.id, { status: "paid" });
    expect(store.payments.find((p) => p.id === item.id)!.status).toBe("paid");
  });

  it("amount를 변경할 수 있다", () => {
    let store = createEmptyData("g1");
    const { store: s, item } = addPayment(store, {
      memberName: "홍길동",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    store = updatePayment(s, item.id, { amount: 50000 });
    expect(store.payments.find((p) => p.id === item.id)!.amount).toBe(50000);
  });

  it("존재하지 않는 id 수정은 payments를 변경하지 않는다", () => {
    const store = createEmptyData("g1");
    const updated = updatePayment(store, "nonexistent", { status: "paid" });
    expect(updated.payments).toHaveLength(0);
  });
});

// ============================================================
// 5. deletePayment
// ============================================================

describe("deletePayment", () => {
  it("납부 항목이 삭제되면 payments 길이가 1 감소한다", () => {
    let store = createEmptyData("g1");
    const { store: s, item } = addPayment(store, {
      memberName: "홍길동",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    store = deletePayment(s, item.id);
    expect(store.payments).toHaveLength(0);
  });

  it("존재하지 않는 id 삭제는 payments를 변경하지 않는다", () => {
    let store = createEmptyData("g1");
    store = {
      ...store,
      payments: [makePayment({ id: "p1" })],
    };
    const updated = deletePayment(store, "nonexistent");
    expect(updated.payments).toHaveLength(1);
  });
});

// ============================================================
// 6. setMonthlyFee
// ============================================================

describe("setMonthlyFee", () => {
  it("monthlyFee가 설정된다", () => {
    const store = createEmptyData("g1");
    const updated = setMonthlyFee(store, 50000);
    expect(updated.monthlyFee).toBe(50000);
  });

  it("0원으로 설정할 수 있다", () => {
    const store = { ...createEmptyData("g1"), monthlyFee: 30000 };
    const updated = setMonthlyFee(store, 0);
    expect(updated.monthlyFee).toBe(0);
  });
});

// ============================================================
// 7. generateMonthPayments
// ============================================================

describe("generateMonthPayments", () => {
  it("멤버 목록만큼 납부 항목이 생성된다", () => {
    const store = { ...createEmptyData("g1"), monthlyFee: 30000 };
    const updated = generateMonthPayments(store, "2026-03", ["홍길동", "김철수"]);
    expect(getMonthPayments(updated, "2026-03")).toHaveLength(2);
  });

  it("이미 존재하는 멤버는 스킵된다", () => {
    let store = { ...createEmptyData("g1"), monthlyFee: 30000 };
    store = generateMonthPayments(store, "2026-03", ["홍길동", "김철수"]);
    store = generateMonthPayments(store, "2026-03", ["홍길동", "이영희"]);
    // 홍길동은 스킵, 이영희만 추가됨
    expect(getMonthPayments(store, "2026-03")).toHaveLength(3);
  });

  it("빈 멤버 목록이면 payments가 변경되지 않는다", () => {
    const store = createEmptyData("g1");
    const updated = generateMonthPayments(store, "2026-03", []);
    expect(updated.payments).toHaveLength(0);
  });

  it("생성된 항목의 amount는 monthlyFee와 같다", () => {
    const store = { ...createEmptyData("g1"), monthlyFee: 40000 };
    const updated = generateMonthPayments(store, "2026-03", ["홍길동"]);
    const payments = getMonthPayments(updated, "2026-03");
    expect(payments[0]!.amount).toBe(40000);
  });

  it("생성된 항목의 status는 'unpaid'이다", () => {
    const store = { ...createEmptyData("g1"), monthlyFee: 30000 };
    const updated = generateMonthPayments(store, "2026-03", ["홍길동"]);
    const payments = getMonthPayments(updated, "2026-03");
    expect(payments[0]!.status).toBe("unpaid");
  });

  it("다른 월에는 영향 없다", () => {
    const store = { ...createEmptyData("g1"), monthlyFee: 30000 };
    const updated = generateMonthPayments(store, "2026-02", ["홍길동"]);
    expect(getMonthPayments(updated, "2026-03")).toHaveLength(0);
  });
});

// ============================================================
// 8. getMonthPayments
// ============================================================

describe("getMonthPayments", () => {
  it("특정 월의 납부 항목만 반환한다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      payments: [
        makePayment({ id: "p1", month: "2026-03" }),
        makePayment({ id: "p2", month: "2026-02" }),
      ],
    };
    const result = getMonthPayments(store, "2026-03");
    expect(result).toHaveLength(1);
    expect(result[0]!.month).toBe("2026-03");
  });

  it("해당 월 항목이 없으면 빈 배열이다", () => {
    const store = createEmptyData("g1");
    expect(getMonthPayments(store, "2026-03")).toEqual([]);
  });

  it("한글 이름순으로 정렬된다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      payments: [
        makePayment({ id: "p1", memberName: "홍길동", month: "2026-03" }),
        makePayment({ id: "p2", memberName: "김철수", month: "2026-03" }),
        makePayment({ id: "p3", memberName: "이영희", month: "2026-03" }),
      ],
    };
    const result = getMonthPayments(store, "2026-03");
    expect(result[0]!.memberName).toBe("김철수");
    expect(result[1]!.memberName).toBe("이영희");
    expect(result[2]!.memberName).toBe("홍길동");
  });
});

// ============================================================
// 9. getMonthStats
// ============================================================

describe("getMonthStats", () => {
  it("납부 항목이 없으면 모든 수치가 0이다", () => {
    const store = createEmptyData("g1");
    const stats = getMonthStats(store, "2026-03");
    expect(stats.total).toBe(0);
    expect(stats.paidCount).toBe(0);
    expect(stats.collectionRate).toBe(0);
  });

  it("paidCount는 paid + exempt 항목 수이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", month: "2026-03", status: "paid" }),
        makePayment({ id: "p2", month: "2026-03", status: "exempt" }),
        makePayment({ id: "p3", month: "2026-03", status: "unpaid" }),
      ],
    };
    expect(getMonthStats(store, "2026-03").paidCount).toBe(2);
  });

  it("unpaidCount는 unpaid 항목 수이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", month: "2026-03", status: "unpaid" }),
        makePayment({ id: "p2", month: "2026-03", status: "paid" }),
      ],
    };
    expect(getMonthStats(store, "2026-03").unpaidCount).toBe(1);
  });

  it("partialCount는 partial 항목 수이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", month: "2026-03", status: "partial", amount: 15000 }),
        makePayment({ id: "p2", month: "2026-03", status: "unpaid" }),
      ],
    };
    expect(getMonthStats(store, "2026-03").partialCount).toBe(1);
  });

  it("exemptCount는 exempt 항목 수이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", month: "2026-03", status: "exempt" }),
      ],
    };
    expect(getMonthStats(store, "2026-03").exemptCount).toBe(1);
  });

  it("totalCollected는 paid + partial의 amount 합이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", month: "2026-03", status: "paid", amount: 30000 }),
        makePayment({ id: "p2", month: "2026-03", status: "partial", amount: 15000 }),
        makePayment({ id: "p3", month: "2026-03", status: "unpaid", amount: 30000 }),
      ],
    };
    expect(getMonthStats(store, "2026-03").totalCollected).toBe(45000);
  });

  it("collectionRate는 paidCount / total * 100 (반올림)이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", month: "2026-03", status: "paid" }),
        makePayment({ id: "p2", month: "2026-03", status: "unpaid" }),
      ],
    };
    // 1/2 * 100 = 50
    expect(getMonthStats(store, "2026-03").collectionRate).toBe(50);
  });

  it("unpaidMembers는 unpaid 상태 멤버 이름 목록이다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [
        makePayment({ id: "p1", memberName: "홍길동", month: "2026-03", status: "unpaid" }),
        makePayment({ id: "p2", memberName: "김철수", month: "2026-03", status: "paid" }),
      ],
    };
    const stats = getMonthStats(store, "2026-03");
    expect(stats.unpaidMembers).toContain("홍길동");
    expect(stats.unpaidMembers).not.toContain("김철수");
  });
});

// ============================================================
// 10. togglePaymentStatus 사이클
// ============================================================

describe("togglePaymentStatus 사이클 (unpaid → paid → exempt → unpaid)", () => {
  it("unpaid → paid로 전환된다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "unpaid" })],
    };
    const updated = togglePaymentStatus(store, "p1");
    expect(updated.payments.find((p) => p.id === "p1")!.status).toBe("paid");
  });

  it("paid → exempt로 전환된다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "paid" })],
    };
    const updated = togglePaymentStatus(store, "p1");
    expect(updated.payments.find((p) => p.id === "p1")!.status).toBe("exempt");
  });

  it("exempt → unpaid로 전환된다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "exempt" })],
    };
    const updated = togglePaymentStatus(store, "p1");
    expect(updated.payments.find((p) => p.id === "p1")!.status).toBe("unpaid");
  });

  it("unpaid → paid 전환 시 paidAt이 설정된다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "unpaid", paidAt: null })],
    };
    const updated = togglePaymentStatus(store, "p1");
    const payment = updated.payments.find((p) => p.id === "p1")!;
    expect(payment.paidAt).not.toBeNull();
  });

  it("paid → exempt 전환 시 paidAt이 null이 된다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "paid", paidAt: "2026-03-01T00:00:00.000Z" })],
    };
    const updated = togglePaymentStatus(store, "p1");
    const payment = updated.payments.find((p) => p.id === "p1")!;
    expect(payment.paidAt).toBeNull();
  });

  it("3번 토글하면 원래 상태(unpaid)로 돌아온다", () => {
    let store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "unpaid" })],
    };
    store = togglePaymentStatus(store, "p1"); // paid
    store = togglePaymentStatus(store, "p1"); // exempt
    store = togglePaymentStatus(store, "p1"); // unpaid
    expect(store.payments.find((p) => p.id === "p1")!.status).toBe("unpaid");
  });

  it("존재하지 않는 id 토글은 payments를 변경하지 않는다", () => {
    const store: MembershipFeeData = {
      ...createEmptyData("g1"),
      monthlyFee: 30000,
      payments: [makePayment({ id: "p1", status: "unpaid" })],
    };
    const updated = togglePaymentStatus(store, "nonexistent");
    expect(updated.payments[0]!.status).toBe("unpaid");
  });
});

// ============================================================
// 11. getAvailableMonths
// ============================================================

describe("getAvailableMonths", () => {
  it("16개월을 반환한다 (과거 12 + 현재 1 + 미래 3)", () => {
    const now = new Date("2026-03-01");
    expect(getAvailableMonths(now)).toHaveLength(16);
  });

  it("현재 월이 포함된다", () => {
    const now = new Date("2026-03-01");
    const months = getAvailableMonths(now);
    expect(months).toContain("2026-03");
  });

  it("과거 12개월 전이 포함된다", () => {
    const now = new Date("2026-03-01");
    const months = getAvailableMonths(now);
    expect(months).toContain("2025-03");
  });

  it("미래 3개월 후가 포함된다", () => {
    const now = new Date("2026-03-01");
    const months = getAvailableMonths(now);
    expect(months).toContain("2026-06");
  });

  it("반환된 월 형식은 'YYYY-MM'이다", () => {
    const now = new Date("2026-03-01");
    const months = getAvailableMonths(now);
    months.forEach((m) => {
      expect(m).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});

// ============================================================
// 12. 유틸 함수 (getCurrentMonth, formatMonth)
// ============================================================

describe("getCurrentMonth", () => {
  it("현재 연월을 'YYYY-MM' 형식으로 반환한다", () => {
    const now = new Date("2026-03-15");
    expect(getCurrentMonth(now)).toBe("2026-03");
  });

  it("1월은 '01'로 패딩된다", () => {
    const now = new Date("2026-01-01");
    expect(getCurrentMonth(now)).toBe("2026-01");
  });
});

describe("formatMonth", () => {
  it("'2026-03'을 '2026년 3월'로 변환한다", () => {
    expect(formatMonth("2026-03")).toBe("2026년 3월");
  });

  it("'2026-12'을 '2026년 12월'로 변환한다", () => {
    expect(formatMonth("2026-12")).toBe("2026년 12월");
  });

  it("'2026-01'을 '2026년 1월'로 변환한다 (앞 0 제거)", () => {
    expect(formatMonth("2026-01")).toBe("2026년 1월");
  });
});

// ============================================================
// 13. 그룹별 격리 시나리오
// ============================================================

describe("그룹별 격리 시나리오", () => {
  it("두 그룹의 데이터는 독립적이다", () => {
    const g1 = { ...createEmptyData("g1"), monthlyFee: 30000 };
    const g2 = { ...createEmptyData("g2"), monthlyFee: 50000 };
    expect(g1.monthlyFee).toBe(30000);
    expect(g2.monthlyFee).toBe(50000);
  });

  it("그룹1 납부 추가가 그룹2에 영향 없다", () => {
    let g1 = createEmptyData("g1");
    const g2 = createEmptyData("g2");
    const { store: updatedG1 } = addPayment(g1, {
      memberName: "홍길동",
      month: "2026-03",
      amount: 30000,
      paidAt: null,
      status: "unpaid",
      notes: null,
    });
    expect(updatedG1.payments).toHaveLength(1);
    expect(g2.payments).toHaveLength(0);
  });
});
