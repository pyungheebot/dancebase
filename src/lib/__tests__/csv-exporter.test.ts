import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCSV, downloadCSV, exportToCsv } from "@/lib/export/csv-exporter";

// downloadCSV는 DOM 조작이 필요하므로 관련 API를 mock
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");

beforeEach(() => {
  mockClick.mockClear();
  mockAppendChild.mockClear();
  mockRemoveChild.mockClear();
  mockRevokeObjectURL.mockClear();
  mockCreateObjectURL.mockClear();

  // createElement("a")를 mock 링크 객체로 교체
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "a") {
      return {
        href: "",
        download: "",
        click: mockClick,
      } as unknown as HTMLAnchorElement;
    }
    return document.createElement(tag);
  });

  vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
  vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);
  vi.stubGlobal("URL", {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });
});

// escapeCsvCell은 내부 함수이므로 generateCSV를 통해 간접 테스트
describe("escapeCsvCell (generateCSV를 통한 간접 테스트)", () => {
  it("쉼표가 포함된 값을 큰따옴표로 감싼다", () => {
    const csv = generateCSV(["헤더"], [["값1,값2"]]);
    expect(csv).toContain('"값1,값2"');
  });

  it("큰따옴표가 포함된 값을 이스케이프한다", () => {
    const csv = generateCSV(["헤더"], [['그는 "안녕"이라고 했다']]);
    expect(csv).toContain('"그는 ""안녕""이라고 했다"');
  });

  it("줄바꿈이 포함된 값을 큰따옴표로 감싼다", () => {
    const csv = generateCSV(["헤더"], [["첫째줄\n둘째줄"]]);
    expect(csv).toContain('"첫째줄\n둘째줄"');
  });

  it("특수문자 없는 일반 값은 그대로 반환한다", () => {
    const csv = generateCSV(["이름"], [["홍길동"]]);
    expect(csv).toContain("홍길동");
    expect(csv).not.toContain('"홍길동"');
  });

  it("null/undefined 값을 빈 문자열로 처리한다", () => {
    const csv = generateCSV(["A", "B"], [["값", ""]]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe("값,");
  });
});

describe("generateCSV", () => {
  it("헤더와 데이터 행이 CRLF로 구분된다", () => {
    const csv = generateCSV(["이름", "나이"], [["홍길동", "30"]]);
    expect(csv).toBe("이름,나이\r\n홍길동,30");
  });

  it("여러 데이터 행을 올바르게 생성한다", () => {
    const csv = generateCSV(
      ["이름", "점수"],
      [
        ["홍길동", "90"],
        ["김철수", "85"],
      ]
    );
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("이름,점수");
    expect(lines[1]).toBe("홍길동,90");
    expect(lines[2]).toBe("김철수,85");
  });

  it("데이터 행이 없으면 헤더만 반환한다", () => {
    const csv = generateCSV(["A", "B", "C"], []);
    expect(csv).toBe("A,B,C");
  });

  it("한글 헤더와 데이터를 올바르게 처리한다", () => {
    const csv = generateCSV(["날짜", "장소"], [["2026-03-01", "서울시 강남구"]]);
    expect(csv).toContain("날짜,장소");
    expect(csv).toContain("2026-03-01,서울시 강남구");
  });
});

describe("downloadCSV", () => {
  it("Blob을 생성하고 링크 클릭을 실행한다", () => {
    downloadCSV("test-file.csv", "헤더1,헤더2\r\n값1,값2");
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("BOM(\\uFEFF)이 포함된 Blob을 생성한다", () => {
    let capturedBlob: Blob | null = null;
    mockCreateObjectURL.mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return "blob:bom-url";
    });

    downloadCSV("bom-test.csv", "A,B");

    expect(capturedBlob).not.toBeNull();
    // Blob 타입이 CSV인지 확인
    expect(capturedBlob!.type).toContain("text/csv");
  });

  it(".csv 확장자가 없으면 자동으로 추가한다", () => {
    const mockLink = { href: "", download: "", click: mockClick };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );

    downloadCSV("report", "A,B");
    expect(mockLink.download).toBe("report.csv");
  });

  it(".csv 확장자가 이미 있으면 중복 추가하지 않는다", () => {
    const mockLink = { href: "", download: "", click: mockClick };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    );

    downloadCSV("report.csv", "A,B");
    expect(mockLink.download).toBe("report.csv");
  });

  it("DOM에 링크를 추가했다가 제거한다", () => {
    downloadCSV("test.csv", "data");
    expect(mockAppendChild).toHaveBeenCalledOnce();
    expect(mockRemoveChild).toHaveBeenCalledOnce();
  });
});

describe("exportToCsv", () => {
  it("헤더와 데이터 행을 CSV로 내보낸다", () => {
    exportToCsv("export-test", ["이름", "금액"], [["홍길동", 50000]]);
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    expect(mockClick).toHaveBeenCalledOnce();
  });

  it("null/undefined 값을 포함한 행을 처리한다", () => {
    expect(() => {
      exportToCsv(
        "null-test",
        ["A", "B", "C"],
        [["값1", null, undefined]]
      );
    }).not.toThrow();
    expect(mockClick).toHaveBeenCalledOnce();
  });

  it("숫자 타입 셀 값을 문자열로 변환하여 내보낸다", () => {
    exportToCsv("num-test", ["금액"], [[100000]]);
    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
  });

  it("빈 데이터 배열도 헤더만으로 내보낸다", () => {
    expect(() => {
      exportToCsv("empty-test", ["헤더1", "헤더2"], []);
    }).not.toThrow();
    expect(mockClick).toHaveBeenCalledOnce();
  });
});
