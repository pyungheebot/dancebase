import { describe, it, expect } from "vitest";
import { cn, formatFileSize, isImageType } from "@/lib/utils";

describe("cn (Tailwind 클래스 병합)", () => {
  it("단일 클래스 반환", () => {
    expect(cn("text-sm")).toBe("text-sm");
  });

  it("여러 클래스 병합", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("충돌하는 Tailwind 클래스 해결 (뒤쪽 우선)", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("text-color 충돌 해결", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("p 충돌 해결", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("falsy 값 무시 (false)", () => {
    expect(cn("text-sm", false && "text-lg")).toBe("text-sm");
  });

  it("falsy 값 무시 (undefined)", () => {
    expect(cn("text-sm", undefined)).toBe("text-sm");
  });

  it("falsy 값 무시 (null)", () => {
    expect(cn("text-sm", null)).toBe("text-sm");
  });

  it("조건부 클래스 (true)", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("조건부 클래스 (false)", () => {
    const isActive = false;
    expect(cn("base", isActive && "active")).toBe("base");
  });

  it("배열 입력 처리", () => {
    expect(cn(["text-sm", "font-bold"])).toBe("text-sm font-bold");
  });

  it("인수 없으면 빈 문자열 반환", () => {
    expect(cn()).toBe("");
  });
});

describe("formatFileSize", () => {
  it("1024 바이트 미만은 B 단위로 반환", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("1024 바이트 이상은 KB 단위로 반환", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10 * 1024)).toBe("10.0 KB");
  });

  it("1MB 이상은 MB 단위로 반환", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10.0 MB");
  });

  it("소수점 첫째 자리까지 표시", () => {
    // 1.5 KB = 1536 bytes
    expect(formatFileSize(1536)).toBe("1.5 KB");
    // 2.5 MB = 2621440 bytes
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
});

describe("isImageType", () => {
  it("image/ 로 시작하는 타입은 true 반환", () => {
    expect(isImageType("image/jpeg")).toBe(true);
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("image/gif")).toBe(true);
    expect(isImageType("image/webp")).toBe(true);
  });

  it("image/ 로 시작하지 않는 타입은 false 반환", () => {
    expect(isImageType("video/mp4")).toBe(false);
    expect(isImageType("application/pdf")).toBe(false);
    expect(isImageType("text/plain")).toBe(false);
  });
});
