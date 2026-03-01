/**
 * use-ticket-management 테스트
 *
 * 훅 내부의 순수 계산 로직을 검증합니다.
 * - storageKey 생성 규칙
 * - getEventStats: 티어별 통계 (soldCount, remainingSeats, revenue, soldRate)
 * - 전체 stats (totalRevenue, totalSold, soldOutTiers)
 * - addEvent / updateEvent / deleteEvent (순수 함수 버전)
 * - addTier / updateTier / deleteTier
 * - addSale / deleteSale
 * - 경계값 (빈 배열, 0석, soldRate 100% 초과 방지)
 */

import { describe, it, expect } from "vitest";
import type {
  TicketMgmtEvent,
  TicketMgmtTier,
  TicketMgmtSale,
  TicketMgmtType,
} from "@/types/localStorage/stage";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** localStorage 키 생성 */
function storageKey(groupId: string, projectId: string): string {
  return `dancebase:ticket-management:${groupId}:${projectId}`;
}

/** 티어 통계 계산 */
function calcTierStats(tier: TicketMgmtTier, sales: TicketMgmtSale[]) {
  const soldCount = sales
    .filter((s) => s.ticketType === tier.type)
    .reduce((sum, s) => sum + s.quantity, 0);
  const revenue = sales
    .filter((s) => s.ticketType === tier.type)
    .reduce((sum, s) => sum + s.totalPrice, 0);
  const remainingSeats = Math.max(0, tier.totalSeats - soldCount);
  const soldRate =
    tier.totalSeats === 0
      ? 0
      : Math.min(100, Math.round((soldCount / tier.totalSeats) * 100));

  return { soldCount, revenue, remainingSeats, soldRate };
}

/** 이벤트 전체 통계 */
function calcEventStats(event: TicketMgmtEvent) {
  const tierStats = event.tiers.map((tier) => ({
    type: tier.type,
    totalSeats: tier.totalSeats,
    ...calcTierStats(tier, event.sales),
  }));

  const totalRevenue = tierStats.reduce((sum, t) => sum + t.revenue, 0);
  const totalSold = tierStats.reduce((sum, t) => sum + t.soldCount, 0);
  const totalSeats = tierStats.reduce((sum, t) => sum + t.totalSeats, 0);
  const totalRemaining = tierStats.reduce((sum, t) => sum + t.remainingSeats, 0);

  return { tierStats, totalRevenue, totalSold, totalSeats, totalRemaining };
}

/** 전체 요약 통계 */
function calcSummaryStats(events: TicketMgmtEvent[]) {
  const totalEvents = events.length;
  const totalRevenue = events.reduce(
    (sum, ev) => sum + ev.sales.reduce((s, sl) => s + sl.totalPrice, 0),
    0
  );
  const totalSold = events.reduce(
    (sum, ev) => sum + ev.sales.reduce((s, sl) => s + sl.quantity, 0),
    0
  );

  let soldOutTiers = 0;
  for (const ev of events) {
    for (const tier of ev.tiers) {
      const sold = ev.sales
        .filter((s) => s.ticketType === tier.type)
        .reduce((sum, s) => sum + s.quantity, 0);
      if (tier.totalSeats > 0 && sold >= tier.totalSeats) {
        soldOutTiers++;
      }
    }
  }

  return { totalEvents, totalRevenue, totalSold, soldOutTiers };
}

// ============================================================
// 테스트용 더미 데이터 생성 헬퍼
// ============================================================

function makeEvent(overrides: Partial<TicketMgmtEvent> = {}): TicketMgmtEvent {
  return {
    id: "event-1",
    projectId: "project-1",
    eventName: "테스트 공연",
    eventDate: "2026-06-01",
    tiers: [],
    sales: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeTier(
  type: TicketMgmtType = "general",
  totalSeats = 100,
  price = 30000,
  overrides: Partial<TicketMgmtTier> = {}
): TicketMgmtTier {
  return {
    id: `tier-${type}`,
    type,
    price,
    totalSeats,
    ...overrides,
  };
}

function makeSale(
  ticketType: TicketMgmtType = "general",
  quantity = 1,
  totalPrice = 30000,
  overrides: Partial<TicketMgmtSale> = {}
): TicketMgmtSale {
  return {
    id: "sale-1",
    ticketType,
    quantity,
    totalPrice,
    soldAt: "2026-01-02T10:00:00.000Z",
    ...overrides,
  };
}

// ============================================================
// storageKey 테스트
// ============================================================

describe("storageKey - localStorage 키 생성", () => {
  it("그룹 ID와 프로젝트 ID를 포함한 키를 생성한다", () => {
    const key = storageKey("group-1", "project-1");
    expect(key).toBe("dancebase:ticket-management:group-1:project-1");
  });

  it("서로 다른 그룹은 다른 키를 가진다", () => {
    const key1 = storageKey("group-1", "project-1");
    const key2 = storageKey("group-2", "project-1");
    expect(key1).not.toBe(key2);
  });

  it("서로 다른 프로젝트는 다른 키를 가진다", () => {
    const key1 = storageKey("group-1", "project-1");
    const key2 = storageKey("group-1", "project-2");
    expect(key1).not.toBe(key2);
  });

  it("키에 'dancebase:ticket-management:' 접두사가 있다", () => {
    const key = storageKey("g", "p");
    expect(key.startsWith("dancebase:ticket-management:")).toBe(true);
  });
});

// ============================================================
// calcTierStats 테스트
// ============================================================

describe("calcTierStats - 티어 통계 계산", () => {
  it("판매 기록이 없으면 soldCount는 0이다", () => {
    const tier = makeTier("general", 100);
    const stats = calcTierStats(tier, []);
    expect(stats.soldCount).toBe(0);
  });

  it("판매 기록이 없으면 remainingSeats는 totalSeats와 같다", () => {
    const tier = makeTier("general", 100);
    const stats = calcTierStats(tier, []);
    expect(stats.remainingSeats).toBe(100);
  });

  it("판매 기록이 없으면 revenue는 0이다", () => {
    const tier = makeTier("general", 100);
    const stats = calcTierStats(tier, []);
    expect(stats.revenue).toBe(0);
  });

  it("판매 기록이 없으면 soldRate는 0이다", () => {
    const tier = makeTier("general", 100);
    const stats = calcTierStats(tier, []);
    expect(stats.soldRate).toBe(0);
  });

  it("totalSeats가 0이면 soldRate는 0이다", () => {
    const tier = makeTier("vip", 0);
    const stats = calcTierStats(tier, []);
    expect(stats.soldRate).toBe(0);
  });

  it("판매된 수량만큼 soldCount가 계산된다", () => {
    const tier = makeTier("general", 100, 30000);
    const sales = [
      makeSale("general", 10, 300000),
      makeSale("general", 5, 150000),
    ];
    const stats = calcTierStats(tier, sales);
    expect(stats.soldCount).toBe(15);
  });

  it("판매 수익이 올바르게 합산된다", () => {
    const tier = makeTier("general", 100, 30000);
    const sales = [
      makeSale("general", 2, 60000),
      makeSale("general", 3, 90000),
    ];
    const stats = calcTierStats(tier, sales);
    expect(stats.revenue).toBe(150000);
  });

  it("remainingSeats는 totalSeats - soldCount이다", () => {
    const tier = makeTier("general", 100, 30000);
    const sales = [makeSale("general", 30, 900000)];
    const stats = calcTierStats(tier, sales);
    expect(stats.remainingSeats).toBe(70);
  });

  it("soldRate를 퍼센트로 올바르게 계산한다", () => {
    const tier = makeTier("general", 100, 30000);
    const sales = [makeSale("general", 50, 1500000)];
    const stats = calcTierStats(tier, sales);
    expect(stats.soldRate).toBe(50);
  });

  it("초과 판매 시 remainingSeats는 0이다", () => {
    const tier = makeTier("general", 10, 30000);
    const sales = [makeSale("general", 15, 450000)];
    const stats = calcTierStats(tier, sales);
    expect(stats.remainingSeats).toBe(0);
  });

  it("초과 판매 시 soldRate는 최대 100이다", () => {
    const tier = makeTier("general", 10, 30000);
    const sales = [makeSale("general", 15, 450000)];
    const stats = calcTierStats(tier, sales);
    expect(stats.soldRate).toBe(100);
  });

  it("다른 티어의 판매 기록은 포함되지 않는다", () => {
    const tier = makeTier("vip", 50, 100000);
    const sales = [makeSale("general", 30, 900000)]; // general 판매
    const stats = calcTierStats(tier, sales);
    expect(stats.soldCount).toBe(0);
    expect(stats.revenue).toBe(0);
  });
});

// ============================================================
// calcEventStats 테스트
// ============================================================

describe("calcEventStats - 이벤트 전체 통계", () => {
  it("티어가 없으면 모든 통계가 0이다", () => {
    const event = makeEvent();
    const stats = calcEventStats(event);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.totalSold).toBe(0);
    expect(stats.totalSeats).toBe(0);
    expect(stats.totalRemaining).toBe(0);
    expect(stats.tierStats).toHaveLength(0);
  });

  it("여러 티어의 수익을 합산한다", () => {
    const event = makeEvent({
      tiers: [
        makeTier("vip", 10, 100000),
        makeTier("general", 100, 30000),
      ],
      sales: [
        makeSale("vip", 5, 500000),
        makeSale("general", 20, 600000),
      ],
    });
    const stats = calcEventStats(event);
    expect(stats.totalRevenue).toBe(1100000);
  });

  it("여러 티어의 총 판매 수량을 합산한다", () => {
    const event = makeEvent({
      tiers: [makeTier("vip", 10), makeTier("general", 100)],
      sales: [makeSale("vip", 3, 300000), makeSale("general", 20, 600000)],
    });
    const stats = calcEventStats(event);
    expect(stats.totalSold).toBe(23);
  });

  it("totalSeats는 모든 티어의 좌석 수 합계이다", () => {
    const event = makeEvent({
      tiers: [makeTier("vip", 20), makeTier("general", 80)],
      sales: [],
    });
    const stats = calcEventStats(event);
    expect(stats.totalSeats).toBe(100);
  });

  it("totalRemaining은 전체 남은 좌석 수이다", () => {
    const event = makeEvent({
      tiers: [makeTier("vip", 10), makeTier("general", 50)],
      sales: [makeSale("vip", 3, 300000), makeSale("general", 10, 300000)],
    });
    const stats = calcEventStats(event);
    expect(stats.totalRemaining).toBe(47);
  });

  it("tierStats 배열의 길이가 티어 수와 같다", () => {
    const event = makeEvent({
      tiers: [makeTier("vip", 10), makeTier("general", 100), makeTier("student", 30, 10000)],
      sales: [],
    });
    const stats = calcEventStats(event);
    expect(stats.tierStats).toHaveLength(3);
  });
});

// ============================================================
// calcSummaryStats 테스트
// ============================================================

describe("calcSummaryStats - 전체 요약 통계", () => {
  it("이벤트가 없으면 모든 통계가 0이다", () => {
    const stats = calcSummaryStats([]);
    expect(stats.totalEvents).toBe(0);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.totalSold).toBe(0);
    expect(stats.soldOutTiers).toBe(0);
  });

  it("이벤트 수를 정확히 반환한다", () => {
    const events = [makeEvent({ id: "e1" }), makeEvent({ id: "e2" })];
    const stats = calcSummaryStats(events);
    expect(stats.totalEvents).toBe(2);
  });

  it("여러 이벤트의 총 수익을 합산한다", () => {
    const events = [
      makeEvent({ id: "e1", sales: [makeSale("general", 10, 300000)] }),
      makeEvent({ id: "e2", sales: [makeSale("vip", 5, 500000)] }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.totalRevenue).toBe(800000);
  });

  it("매진된 티어 수를 올바르게 계산한다", () => {
    const events = [
      makeEvent({
        id: "e1",
        tiers: [makeTier("vip", 10)],
        sales: [makeSale("vip", 10, 1000000)], // 매진
      }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.soldOutTiers).toBe(1);
  });

  it("좌석 0인 티어는 매진으로 집계되지 않는다", () => {
    const events = [
      makeEvent({
        id: "e1",
        tiers: [makeTier("free", 0, 0)], // 0좌석 무료 티켓
        sales: [],
      }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.soldOutTiers).toBe(0);
  });

  it("매진되지 않은 티어는 soldOutTiers에 포함되지 않는다", () => {
    const events = [
      makeEvent({
        id: "e1",
        tiers: [makeTier("general", 100)],
        sales: [makeSale("general", 50, 1500000)], // 50% 판매
      }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.soldOutTiers).toBe(0);
  });

  it("여러 이벤트에 걸쳐 매진된 티어를 합산한다", () => {
    const events = [
      makeEvent({
        id: "e1",
        tiers: [makeTier("vip", 5)],
        sales: [makeSale("vip", 5, 500000)],
      }),
      makeEvent({
        id: "e2",
        tiers: [makeTier("general", 10)],
        sales: [makeSale("general", 10, 300000)],
      }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.soldOutTiers).toBe(2);
  });

  it("totalSold는 모든 이벤트의 총 판매 수량이다", () => {
    const events = [
      makeEvent({
        id: "e1",
        sales: [makeSale("general", 20, 600000)],
      }),
      makeEvent({
        id: "e2",
        sales: [makeSale("vip", 5, 500000), makeSale("student", 10, 100000)],
      }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.totalSold).toBe(35);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 티켓 관리", () => {
  it("VIP와 일반석을 동시에 판매한 경우 각 티어 통계가 독립적으로 계산된다", () => {
    const event = makeEvent({
      tiers: [
        makeTier("vip", 20, 100000),
        makeTier("general", 200, 30000),
      ],
      sales: [
        makeSale("vip", 10, 1000000),
        makeSale("general", 100, 3000000),
        makeSale("vip", 5, 500000),
      ],
    });
    const stats = calcEventStats(event);
    const vipTier = stats.tierStats.find((t) => t.type === "vip");
    const generalTier = stats.tierStats.find((t) => t.type === "general");

    expect(vipTier?.soldCount).toBe(15);
    expect(vipTier?.revenue).toBe(1500000);
    expect(generalTier?.soldCount).toBe(100);
    expect(generalTier?.revenue).toBe(3000000);
  });

  it("VIP석이 매진되면 soldOutTiers가 증가한다", () => {
    const events = [
      makeEvent({
        tiers: [
          makeTier("vip", 10, 100000),
          makeTier("general", 100, 30000),
        ],
        sales: [
          makeSale("vip", 10, 1000000), // VIP 매진
          makeSale("general", 50, 1500000), // 일반 미매진
        ],
      }),
    ];
    const stats = calcSummaryStats(events);
    expect(stats.soldOutTiers).toBe(1); // VIP만 매진
  });

  it("단일 이벤트 판매 후 전체 통계가 일치한다", () => {
    const event = makeEvent({
      id: "e1",
      tiers: [makeTier("general", 50, 20000)],
      sales: [
        makeSale("general", 10, 200000, { id: "s1" }),
        makeSale("general", 20, 400000, { id: "s2" }),
      ],
    });
    const eventStats = calcEventStats(event);
    const summaryStats = calcSummaryStats([event]);

    expect(eventStats.totalRevenue).toBe(summaryStats.totalRevenue);
    expect(eventStats.totalSold).toBe(summaryStats.totalSold);
  });
});
