import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatKo,
  formatYearMonth,
  formatYearMonthDay,
  formatFullDate,
  formatMonthDay,
  formatShortDate,
  formatShortDateTime,
  formatTime,
  formatRelative,
} from "@/lib/date-utils";

// 고정 날짜: 2026-03-01 14:30:00 (일요일)
const FIXED_DATE = new Date("2026-03-01T14:30:00");
const FIXED_DATE_STR = "2026-03-01T14:30:00";

describe("formatTime", () => {
  it("Date 객체를 HH:mm 형식으로 변환", () => {
    expect(formatTime(FIXED_DATE)).toBe("14:30");
  });

  it("ISO 문자열을 HH:mm 형식으로 변환", () => {
    expect(formatTime(FIXED_DATE_STR)).toBe("14:30");
  });

  it("자정을 00:00으로 변환", () => {
    expect(formatTime(new Date("2026-03-01T00:00:00"))).toBe("00:00");
  });

  it("23:59를 올바르게 변환", () => {
    expect(formatTime(new Date("2026-03-01T23:59:00"))).toBe("23:59");
  });
});

describe("formatShortDate", () => {
  it("Date 객체를 M/d (요일) 형식으로 변환", () => {
    // 2026-03-01은 일요일(일)
    expect(formatShortDate(FIXED_DATE)).toBe("3/1 (일)");
  });

  it("ISO 문자열도 올바르게 변환", () => {
    expect(formatShortDate(FIXED_DATE_STR)).toBe("3/1 (일)");
  });

  it("다른 날짜도 올바르게 변환", () => {
    // 2026-03-07은 토요일
    expect(formatShortDate(new Date("2026-03-07T00:00:00"))).toBe("3/7 (토)");
  });
});

describe("formatYearMonthDay", () => {
  it("날짜를 yyyy년 M월 d일 형식으로 변환", () => {
    expect(formatYearMonthDay(FIXED_DATE)).toBe("2026년 3월 1일");
  });

  it("ISO 문자열도 올바르게 변환", () => {
    expect(formatYearMonthDay(FIXED_DATE_STR)).toBe("2026년 3월 1일");
  });
});

describe("formatMonthDay", () => {
  it("날짜를 M월 d일 형식으로 변환", () => {
    expect(formatMonthDay(FIXED_DATE)).toBe("3월 1일");
  });

  it("두 자리 월/일도 올바르게 변환", () => {
    expect(formatMonthDay(new Date("2026-12-25T00:00:00"))).toBe("12월 25일");
  });
});

describe("formatYearMonth", () => {
  it("날짜를 yyyy년 M월 형식으로 변환", () => {
    expect(formatYearMonth(FIXED_DATE)).toBe("2026년 3월");
  });
});

describe("formatFullDate", () => {
  it("날짜를 yyyy년 M월 d일 (요일) 형식으로 변환", () => {
    expect(formatFullDate(FIXED_DATE)).toBe("2026년 3월 1일 (일)");
  });
});

describe("formatShortDateTime", () => {
  it("날짜와 시간을 M/d (요일) HH:mm 형식으로 변환", () => {
    expect(formatShortDateTime(FIXED_DATE)).toBe("3/1 (일) 14:30");
  });
});

describe("formatKo", () => {
  it("커스텀 패턴으로 날짜 변환", () => {
    expect(formatKo(FIXED_DATE, "yyyy-MM-dd")).toBe("2026-03-01");
  });

  it("한국어 요일 포맷 변환", () => {
    expect(formatKo(FIXED_DATE, "EEEE")).toBe("일요일");
  });
});

describe("formatRelative", () => {
  beforeEach(() => {
    // 현재 시각을 2026-03-01T15:00:00으로 고정 (FIXED_DATE보다 30분 뒤)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T15:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1분 미만 전", () => {
    // date-fns v4 ko 로케일: 1분 미만은 "1분 미만 전"으로 반환
    const justNow = new Date("2026-03-01T14:59:50");
    const result = formatRelative(justNow);
    // "전" 접미사가 포함되어야 하고, 짧은 시간 표현이어야 함
    expect(result).toContain("전");
    expect(result).toMatch(/1분 미만|방금|초|1분/);
  });

  it("N분 전", () => {
    const thirtyMinAgo = new Date("2026-03-01T14:30:00");
    const result = formatRelative(thirtyMinAgo);
    expect(result).toContain("30분");
    expect(result).toContain("전");
  });

  it("N시간 전", () => {
    const twoHoursAgo = new Date("2026-03-01T13:00:00");
    const result = formatRelative(twoHoursAgo);
    expect(result).toContain("2시간");
    expect(result).toContain("전");
  });

  it("N일 전", () => {
    const threeDaysAgo = new Date("2026-02-26T15:00:00");
    const result = formatRelative(threeDaysAgo);
    expect(result).toContain("3일");
    expect(result).toContain("전");
  });

  it("ISO 문자열도 올바르게 처리", () => {
    const result = formatRelative("2026-03-01T14:30:00");
    expect(result).toContain("전");
  });
});
