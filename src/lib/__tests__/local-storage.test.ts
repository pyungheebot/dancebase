import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
} from "@/lib/local-storage";

describe("loadFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장된 값을 정상적으로 로드한다", () => {
    localStorage.setItem("test-key", JSON.stringify({ name: "홍길동" }));
    const result = loadFromStorage("test-key", null);
    expect(result).toEqual({ name: "홍길동" });
  });

  it("키가 없으면 기본값을 반환한다", () => {
    const result = loadFromStorage("non-existent", "기본값");
    expect(result).toBe("기본값");
  });

  it("JSON 파싱 실패 시 기본값을 반환한다", () => {
    localStorage.setItem("bad-json", "{ 잘못된 json }");
    const result = loadFromStorage("bad-json", 42);
    expect(result).toBe(42);
  });

  it("배열 타입의 기본값을 반환한다", () => {
    const result = loadFromStorage<string[]>("empty-array-key", []);
    expect(result).toEqual([]);
  });

  it("저장된 숫자 값을 정상적으로 로드한다", () => {
    localStorage.setItem("num-key", JSON.stringify(100));
    const result = loadFromStorage("num-key", 0);
    expect(result).toBe(100);
  });

  it("저장된 boolean 값을 정상적으로 로드한다", () => {
    localStorage.setItem("bool-key", JSON.stringify(false));
    const result = loadFromStorage("bool-key", true);
    expect(result).toBe(false);
  });
});

describe("saveToStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("값을 정상적으로 저장한다", () => {
    saveToStorage("save-key", { value: 123 });
    const raw = localStorage.getItem("save-key");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual({ value: 123 });
  });

  it("JSON 직렬화하여 저장한다", () => {
    const data = { name: "테스트", items: [1, 2, 3] };
    saveToStorage("serialize-key", data);
    const raw = localStorage.getItem("serialize-key");
    expect(raw).toBe(JSON.stringify(data));
  });

  it("문자열 값을 저장한다", () => {
    saveToStorage("str-key", "안녕하세요");
    const raw = localStorage.getItem("str-key");
    expect(JSON.parse(raw!)).toBe("안녕하세요");
  });

  it("숫자 값을 저장한다", () => {
    saveToStorage("num-save-key", 9999);
    const raw = localStorage.getItem("num-save-key");
    expect(JSON.parse(raw!)).toBe(9999);
  });

  it("배열 값을 저장하고 loadFromStorage로 읽을 수 있다", () => {
    const arr = ["a", "b", "c"];
    saveToStorage("arr-key", arr);
    const result = loadFromStorage<string[]>("arr-key", []);
    expect(result).toEqual(arr);
  });
});

describe("removeFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("키를 삭제한다", () => {
    localStorage.setItem("remove-key", "value");
    removeFromStorage("remove-key");
    expect(localStorage.getItem("remove-key")).toBeNull();
  });

  it("존재하지 않는 키를 삭제해도 오류가 발생하지 않는다", () => {
    expect(() => removeFromStorage("non-existent-key")).not.toThrow();
  });

  it("삭제 후 loadFromStorage는 기본값을 반환한다", () => {
    saveToStorage("del-test", { data: "here" });
    removeFromStorage("del-test");
    const result = loadFromStorage("del-test", null);
    expect(result).toBeNull();
  });
});
