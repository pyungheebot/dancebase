import { describe, it, expect } from "vitest";
import { TOAST } from "@/lib/toast-messages";

/**
 * TOAST 객체의 리프 값(문자열)들을 재귀적으로 수집
 */
function collectLeafValues(obj: unknown, path = ""): Array<{ key: string; value: string }> {
  if (typeof obj === "string") {
    return [{ key: path, value: obj }];
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) =>
      collectLeafValues(v, path ? `${path}.${k}` : k)
    );
  }
  return [];
}

describe("TOAST 상수 검증", () => {
  const allEntries = collectLeafValues(TOAST);

  it("TOAST 객체가 존재하고 비어있지 않다", () => {
    expect(TOAST).toBeDefined();
    expect(allEntries.length).toBeGreaterThan(0);
  });

  it("모든 TOAST 값이 빈 문자열이 아니다", () => {
    const emptyValues = allEntries.filter(({ value }) => value.trim() === "");
    expect(emptyValues).toHaveLength(0);
  });

  it("최상위 공통 키들이 문자열 값을 가진다", () => {
    const topLevelStringKeys: Array<keyof typeof TOAST> = [
      "SAVE_SUCCESS",
      "SAVE_ERROR",
      "UPDATE_SUCCESS",
      "UPDATE_ERROR",
      "DELETE_SUCCESS",
      "DELETE_ERROR",
      "ADD_SUCCESS",
      "ADD_ERROR",
      "COPY_SUCCESS",
      "COPY_ERROR",
      "PERMISSION_ERROR",
      "NETWORK_ERROR",
      "LOGIN_REQUIRED",
    ];

    for (const key of topLevelStringKeys) {
      const value = TOAST[key];
      expect(typeof value, `TOAST.${key}는 문자열이어야 합니다`).toBe("string");
      expect((value as string).trim(), `TOAST.${key}는 빈 문자열이면 안 됩니다`).not.toBe("");
    }
  });

  it("네임스페이스 키들이 객체를 가진다", () => {
    const namespaceKeys: Array<keyof typeof TOAST> = [
      "ATTENDANCE",
      "BOARD",
      "SCHEDULE",
      "LINK",
      "NOTIFICATION",
      "MEMBER",
      "WIKI",
    ];

    for (const key of namespaceKeys) {
      expect(typeof TOAST[key], `TOAST.${key}는 객체여야 합니다`).toBe("object");
    }
  });

  it("ATTENDANCE 네임스페이스의 필수 키들이 존재한다", () => {
    expect(typeof TOAST.ATTENDANCE.ADDED).toBe("string");
    expect(TOAST.ATTENDANCE.ADDED.trim()).not.toBe("");
    expect(typeof TOAST.ATTENDANCE.UPDATED).toBe("string");
    expect(typeof TOAST.ATTENDANCE.DELETED).toBe("string");
    expect(typeof TOAST.ATTENDANCE.ADD_ERROR).toBe("string");
  });

  it("BOARD 네임스페이스의 필수 키들이 존재한다", () => {
    expect(typeof TOAST.BOARD.CREATED).toBe("string");
    expect(TOAST.BOARD.CREATED.trim()).not.toBe("");
    expect(typeof TOAST.BOARD.UPDATED).toBe("string");
    expect(typeof TOAST.BOARD.DELETED).toBe("string");
  });

  it("SCHEDULE 네임스페이스의 필수 키들이 존재한다", () => {
    expect(typeof TOAST.SCHEDULE.DATA_LOAD_ERROR).toBe("string");
    expect(TOAST.SCHEDULE.DATA_LOAD_ERROR.trim()).not.toBe("");
  });

  it("SUCCESS와 ERROR 메시지가 구분되어 있다 (동일하지 않다)", () => {
    expect(TOAST.SAVE_SUCCESS).not.toBe(TOAST.SAVE_ERROR);
    expect(TOAST.UPDATE_SUCCESS).not.toBe(TOAST.UPDATE_ERROR);
    expect(TOAST.DELETE_SUCCESS).not.toBe(TOAST.DELETE_ERROR);
    expect(TOAST.ADD_SUCCESS).not.toBe(TOAST.ADD_ERROR);
  });
});
