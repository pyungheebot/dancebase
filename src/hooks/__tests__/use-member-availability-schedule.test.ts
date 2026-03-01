/**
 * use-member-availability-schedule 테스트
 *
 * 순수 함수(AVAILABILITY_TIME_SLOTS, AVAILABILITY_DAY_LABELS, 내부 로직)와
 * 공개된 상수를 중심으로 검증합니다.
 */

import { describe, it, expect } from "vitest";
import {
  AVAILABILITY_TIME_SLOTS,
  AVAILABILITY_DAY_LABELS,
  AVAILABILITY_DAY_ORDER,
  AVAILABILITY_LEVEL_LABELS,
} from "@/hooks/use-member-availability-schedule";

// ============================================================
// AVAILABILITY_TIME_SLOTS
// ============================================================

describe("AVAILABILITY_TIME_SLOTS - 시간 슬롯 상수", () => {
  it("총 18개의 시간 슬롯이 존재한다 (06:00 ~ 23:00)", () => {
    expect(AVAILABILITY_TIME_SLOTS).toHaveLength(18);
  });

  it("첫 번째 슬롯은 06:00이다", () => {
    expect(AVAILABILITY_TIME_SLOTS[0]).toBe("06:00");
  });

  it("마지막 슬롯은 23:00이다", () => {
    expect(AVAILABILITY_TIME_SLOTS[17]).toBe("23:00");
  });

  it("모든 슬롯이 HH:MM 형식이다", () => {
    const pattern = /^\d{2}:\d{2}$/;
    AVAILABILITY_TIME_SLOTS.forEach((slot) => {
      expect(slot).toMatch(pattern);
    });
  });

  it("슬롯이 1시간 간격으로 증가한다", () => {
    for (let i = 0; i < AVAILABILITY_TIME_SLOTS.length - 1; i++) {
      const current = parseInt(AVAILABILITY_TIME_SLOTS[i]!.split(":")[0]!, 10);
      const next = parseInt(AVAILABILITY_TIME_SLOTS[i + 1]!.split(":")[0]!, 10);
      expect(next - current).toBe(1);
    }
  });

  it("슬롯에 분(minute)이 항상 00이다", () => {
    AVAILABILITY_TIME_SLOTS.forEach((slot) => {
      const minute = slot.split(":")[1];
      expect(minute).toBe("00");
    });
  });

  it("시간이 항상 2자리로 패딩된다 (06, 07, ... 23)", () => {
    // 06, 07, 08, 09는 앞에 0이 붙는다
    expect(AVAILABILITY_TIME_SLOTS[0]).toBe("06:00");
    expect(AVAILABILITY_TIME_SLOTS[1]).toBe("07:00");
    expect(AVAILABILITY_TIME_SLOTS[2]).toBe("08:00");
    expect(AVAILABILITY_TIME_SLOTS[3]).toBe("09:00");
    expect(AVAILABILITY_TIME_SLOTS[4]).toBe("10:00");
  });

  it("슬롯 배열에 중복이 없다", () => {
    const unique = new Set(AVAILABILITY_TIME_SLOTS);
    expect(unique.size).toBe(AVAILABILITY_TIME_SLOTS.length);
  });
});

// ============================================================
// AVAILABILITY_DAY_LABELS
// ============================================================

describe("AVAILABILITY_DAY_LABELS - 요일 라벨 상수", () => {
  it("월요일 라벨은 '월'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.mon).toBe("월");
  });

  it("화요일 라벨은 '화'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.tue).toBe("화");
  });

  it("수요일 라벨은 '수'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.wed).toBe("수");
  });

  it("목요일 라벨은 '목'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.thu).toBe("목");
  });

  it("금요일 라벨은 '금'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.fri).toBe("금");
  });

  it("토요일 라벨은 '토'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.sat).toBe("토");
  });

  it("일요일 라벨은 '일'이다", () => {
    expect(AVAILABILITY_DAY_LABELS.sun).toBe("일");
  });

  it("총 7개의 요일 라벨이 존재한다", () => {
    expect(Object.keys(AVAILABILITY_DAY_LABELS)).toHaveLength(7);
  });

  it("모든 라벨이 1글자 한글이다", () => {
    const labels = Object.values(AVAILABILITY_DAY_LABELS);
    labels.forEach((label) => {
      expect(label).toHaveLength(1);
    });
  });
});

// ============================================================
// AVAILABILITY_DAY_ORDER
// ============================================================

describe("AVAILABILITY_DAY_ORDER - 요일 순서 상수", () => {
  it("총 7개의 요일이 순서대로 존재한다", () => {
    expect(AVAILABILITY_DAY_ORDER).toHaveLength(7);
  });

  it("월~일 순서다 (mon, tue, wed, thu, fri, sat, sun)", () => {
    expect(AVAILABILITY_DAY_ORDER).toEqual([
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ]);
  });

  it("첫 번째 요일은 월요일(mon)이다", () => {
    expect(AVAILABILITY_DAY_ORDER[0]).toBe("mon");
  });

  it("마지막 요일은 일요일(sun)이다", () => {
    expect(AVAILABILITY_DAY_ORDER[6]).toBe("sun");
  });

  it("중복이 없다", () => {
    const unique = new Set(AVAILABILITY_DAY_ORDER);
    expect(unique.size).toBe(AVAILABILITY_DAY_ORDER.length);
  });

  it("AVAILABILITY_DAY_LABELS의 모든 키를 포함한다", () => {
    const labelKeys = Object.keys(AVAILABILITY_DAY_LABELS);
    labelKeys.forEach((key) => {
      expect(AVAILABILITY_DAY_ORDER).toContain(key);
    });
  });
});

// ============================================================
// AVAILABILITY_LEVEL_LABELS
// ============================================================

describe("AVAILABILITY_LEVEL_LABELS - 가용성 레벨 라벨 상수", () => {
  it("'available' 레벨의 라벨은 '가능'이다", () => {
    expect(AVAILABILITY_LEVEL_LABELS.available).toBe("가능");
  });

  it("'difficult' 레벨의 라벨은 '어려움'이다", () => {
    expect(AVAILABILITY_LEVEL_LABELS.difficult).toBe("어려움");
  });

  it("'unavailable' 레벨의 라벨은 '불가'이다", () => {
    expect(AVAILABILITY_LEVEL_LABELS.unavailable).toBe("불가");
  });

  it("총 3개의 레벨 라벨이 존재한다", () => {
    expect(Object.keys(AVAILABILITY_LEVEL_LABELS)).toHaveLength(3);
  });

  it("모든 라벨이 문자열이다", () => {
    Object.values(AVAILABILITY_LEVEL_LABELS).forEach((label) => {
      expect(typeof label).toBe("string");
    });
  });

  it("레벨 라벨에 빈 문자열이 없다", () => {
    Object.values(AVAILABILITY_LEVEL_LABELS).forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// 시간 변환 유틸 로직 검증 (내부 순수 함수 동작 파악)
// ============================================================

describe("시간 슬롯 값 범위 및 유효성", () => {
  it("06:00 슬롯이 배열에 포함된다", () => {
    expect(AVAILABILITY_TIME_SLOTS).toContain("06:00");
  });

  it("12:00 (정오) 슬롯이 배열에 포함된다", () => {
    expect(AVAILABILITY_TIME_SLOTS).toContain("12:00");
  });

  it("18:00 슬롯이 배열에 포함된다", () => {
    expect(AVAILABILITY_TIME_SLOTS).toContain("18:00");
  });

  it("23:00 슬롯이 배열에 포함된다", () => {
    expect(AVAILABILITY_TIME_SLOTS).toContain("23:00");
  });

  it("00:00 슬롯은 배열에 포함되지 않는다 (06시 이전)", () => {
    expect(AVAILABILITY_TIME_SLOTS).not.toContain("00:00");
  });

  it("05:00 슬롯은 배열에 포함되지 않는다 (06시 이전)", () => {
    expect(AVAILABILITY_TIME_SLOTS).not.toContain("05:00");
  });

  it("24:00 슬롯은 배열에 포함되지 않는다 (23시 이후)", () => {
    expect(AVAILABILITY_TIME_SLOTS).not.toContain("24:00");
  });

  it("슬롯 배열의 인덱스 6은 12:00이다", () => {
    // 06:00=0, 07:00=1, ..., 12:00=6
    expect(AVAILABILITY_TIME_SLOTS[6]).toBe("12:00");
  });

  it("슬롯 배열의 인덱스 12는 18:00이다", () => {
    // 06:00=0, ..., 18:00=12
    expect(AVAILABILITY_TIME_SLOTS[12]).toBe("18:00");
  });

  it("슬롯 배열이 오름차순으로 정렬되어 있다", () => {
    for (let i = 0; i < AVAILABILITY_TIME_SLOTS.length - 1; i++) {
      expect(AVAILABILITY_TIME_SLOTS[i]! < AVAILABILITY_TIME_SLOTS[i + 1]!).toBe(true);
    }
  });
});

// ============================================================
// 요일 순서와 라벨의 일관성
// ============================================================

describe("요일 순서와 라벨의 일관성", () => {
  it("AVAILABILITY_DAY_ORDER의 각 요일이 AVAILABILITY_DAY_LABELS에 정의되어 있다", () => {
    AVAILABILITY_DAY_ORDER.forEach((day) => {
      expect(AVAILABILITY_DAY_LABELS[day]).toBeDefined();
      expect(typeof AVAILABILITY_DAY_LABELS[day]).toBe("string");
    });
  });

  it("AVAILABILITY_DAY_ORDER의 요일 순서대로 라벨이 월화수목금토일이다", () => {
    const expectedLabels = ["월", "화", "수", "목", "금", "토", "일"];
    const actualLabels = AVAILABILITY_DAY_ORDER.map((day) => AVAILABILITY_DAY_LABELS[day]);
    expect(actualLabels).toEqual(expectedLabels);
  });

  it("주말 요일(sat, sun)이 DAY_ORDER의 마지막에 위치한다", () => {
    const last2 = AVAILABILITY_DAY_ORDER.slice(-2);
    expect(last2).toEqual(["sat", "sun"]);
  });

  it("주중 요일(mon~fri)이 DAY_ORDER의 앞에 위치한다", () => {
    const weekdays = AVAILABILITY_DAY_ORDER.slice(0, 5);
    expect(weekdays).toEqual(["mon", "tue", "wed", "thu", "fri"]);
  });
});
