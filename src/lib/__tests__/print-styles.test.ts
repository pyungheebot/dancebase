import { describe, it, expect } from "vitest";
import { PRINT_COLORS, rateColor, printTableStyles } from "@/lib/print-styles";

describe("PRINT_COLORS 상수", () => {
  it("PRINT_COLORS 객체가 존재한다", () => {
    expect(PRINT_COLORS).toBeDefined();
    expect(typeof PRINT_COLORS).toBe("object");
  });

  it("success 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.success).toBeDefined();
    expect(typeof PRINT_COLORS.success).toBe("string");
  });

  it("warning 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.warning).toBeDefined();
    expect(typeof PRINT_COLORS.warning).toBe("string");
  });

  it("error 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.error).toBeDefined();
    expect(typeof PRINT_COLORS.error).toBe("string");
  });

  it("info 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.info).toBeDefined();
    expect(typeof PRINT_COLORS.info).toBe("string");
  });

  it("muted 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.muted).toBeDefined();
  });

  it("border 관련 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.border).toBeDefined();
    expect(PRINT_COLORS.borderStrong).toBeDefined();
  });

  it("배경 색상이 정의되어 있다", () => {
    expect(PRINT_COLORS.headerBg).toBeDefined();
    expect(PRINT_COLORS.rowAltBg).toBeDefined();
    expect(PRINT_COLORS.white).toBeDefined();
  });

  it("모든 색상 값이 CSS 색상 형식(# 시작)이다", () => {
    for (const [key, value] of Object.entries(PRINT_COLORS)) {
      expect(value, `${key} 색상이 # 으로 시작해야 함`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("rateColor", () => {
  it("80% 이상이면 success 색상을 반환한다", () => {
    expect(rateColor(80)).toBe(PRINT_COLORS.success);
    expect(rateColor(90)).toBe(PRINT_COLORS.success);
    expect(rateColor(100)).toBe(PRINT_COLORS.success);
  });

  it("정확히 80%도 success 색상을 반환한다", () => {
    expect(rateColor(80)).toBe(PRINT_COLORS.success);
  });

  it("50% 이상 80% 미만이면 warning 색상을 반환한다", () => {
    expect(rateColor(50)).toBe(PRINT_COLORS.warning);
    expect(rateColor(65)).toBe(PRINT_COLORS.warning);
    expect(rateColor(79)).toBe(PRINT_COLORS.warning);
  });

  it("정확히 50%도 warning 색상을 반환한다", () => {
    expect(rateColor(50)).toBe(PRINT_COLORS.warning);
  });

  it("50% 미만이면 error 색상을 반환한다", () => {
    expect(rateColor(49)).toBe(PRINT_COLORS.error);
    expect(rateColor(25)).toBe(PRINT_COLORS.error);
    expect(rateColor(0)).toBe(PRINT_COLORS.error);
  });

  it("success 색상이 green 계열 hex 값이다", () => {
    expect(rateColor(100)).toBe("#16a34a");
  });

  it("warning 색상이 yellow 계열 hex 값이다", () => {
    expect(rateColor(70)).toBe("#ca8a04");
  });

  it("error 색상이 red 계열 hex 값이다", () => {
    expect(rateColor(30)).toBe("#ef4444");
  });

  it("경계값 79%는 warning 색상이다", () => {
    expect(rateColor(79)).toBe(PRINT_COLORS.warning);
    expect(rateColor(79)).not.toBe(PRINT_COLORS.success);
  });
});

describe("printTableStyles", () => {
  it("th 스타일 팩토리가 기본 스타일을 반환한다", () => {
    const style = printTableStyles.th();
    expect(style.padding).toBe("7px 8px");
    expect(style.fontSize).toBe("11px");
    expect(style.fontWeight).toBe("600");
  });

  it("th 스타일 팩토리가 추가 스타일을 병합한다", () => {
    const style = printTableStyles.th({ color: "red", textAlign: "center" });
    expect(style.padding).toBe("7px 8px");
    expect(style.color).toBe("red");
    expect(style.textAlign).toBe("center");
  });

  it("td 스타일 팩토리가 기본 스타일을 반환한다", () => {
    const style = printTableStyles.td();
    expect(style.padding).toBe("6px 8px");
    expect(style.fontSize).toBe("12px");
  });

  it("td 스타일 팩토리가 추가 스타일을 병합한다", () => {
    const style = printTableStyles.td({ fontWeight: "bold" });
    expect(style.padding).toBe("6px 8px");
    expect(style.fontWeight).toBe("bold");
  });

  it("th borderBottom에 PRINT_COLORS.borderStrong 색상이 사용된다", () => {
    const style = printTableStyles.th();
    expect(style.borderBottom).toContain(PRINT_COLORS.borderStrong);
  });
});
