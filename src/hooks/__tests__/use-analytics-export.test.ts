/**
 * use-analytics-export 테스트
 *
 * 훅 내부의 순수 변환/유틸 로직을 인라인으로 재현하여 검증합니다.
 * - 출석 상태 한글 변환 (localizeStatus)
 * - 재무 유형 한글 변환 (localizeTransactionType)
 * - 기간 레이블 생성 로직 (periodLabel)
 * - CSV 생성 유틸 (generateCSV)
 * - 출석 내보내기 행 변환
 * - 게시판 내보내기 행 변환
 * - 재무 내보내기 행 변환
 */

import { describe, it, expect } from "vitest";

// ============================================================
// 훅에서 추출한 순수 변환 함수들
// ============================================================

/** 출석 상태 한글 변환 */
function localizeStatus(status: string): string {
  switch (status) {
    case "present":
      return "출석";
    case "absent":
      return "결석";
    case "late":
      return "지각";
    default:
      return status;
  }
}

/** 재무 유형 한글 변환 */
function localizeTransactionType(type: string): string {
  switch (type) {
    case "income":
      return "수입";
    case "expense":
      return "지출";
    default:
      return type;
  }
}

/** 기간 레이블 생성 */
type ExportDateRange = { startDate?: string; endDate?: string };
function buildPeriodLabel(range: ExportDateRange): string {
  if (range.startDate && range.endDate) {
    return `${range.startDate}_${range.endDate}`;
  }
  if (range.startDate) {
    return `${range.startDate}_이후`;
  }
  return "전체";
}

/** 출석 내보내기 행 변환 */
type AttendanceRow = {
  schedule_id: string;
  status: string;
  profiles: { name: string } | null;
};
type ScheduleMap = Map<string, { title: string; starts_at: string }>;

function mapAttendanceRow(
  row: AttendanceRow,
  scheduleMap: ScheduleMap
): { date: string; scheduleTitle: string; memberName: string; status: string } {
  const schedule = scheduleMap.get(row.schedule_id);
  const profile = row.profiles;
  return {
    date: schedule?.starts_at ? schedule.starts_at.slice(0, 10) : "",
    scheduleTitle: schedule?.title ?? "",
    memberName: profile?.name ?? "",
    status: localizeStatus(row.status),
  };
}

/** 게시판 내보내기 행 변환 */
type PostRow = {
  id: string;
  title: string;
  created_at: string;
  profiles: { name: string } | null;
  board_comments: { id: string }[] | null;
};

function mapBoardRow(
  post: PostRow
): { date: string; title: string; authorName: string; commentCount: number } {
  return {
    date: post.created_at.slice(0, 10),
    title: post.title,
    authorName: post.profiles?.name ?? "",
    commentCount: post.board_comments?.length ?? 0,
  };
}

/** 재무 내보내기 행 변환 */
type TransactionRow = {
  transaction_date: string;
  type: string;
  amount: number;
  title: string;
  description: string | null;
};

function mapFinanceRow(
  t: TransactionRow
): { date: string; type: string; amount: number; title: string; description: string } {
  return {
    date: t.transaction_date,
    type: localizeTransactionType(t.type),
    amount: t.amount,
    title: t.title,
    description: t.description ?? "",
  };
}

/** CSV 셀 이스케이프 */
function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** CSV 생성 */
function generateCSV(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n");
}

// ============================================================
// localizeStatus 테스트
// ============================================================

describe("출석 상태 한글 변환 (localizeStatus)", () => {
  it("'present'는 '출석'으로 변환된다", () => {
    expect(localizeStatus("present")).toBe("출석");
  });

  it("'absent'는 '결석'으로 변환된다", () => {
    expect(localizeStatus("absent")).toBe("결석");
  });

  it("'late'는 '지각'으로 변환된다", () => {
    expect(localizeStatus("late")).toBe("지각");
  });

  it("알 수 없는 상태는 원래 값을 그대로 반환한다", () => {
    expect(localizeStatus("unknown")).toBe("unknown");
    expect(localizeStatus("excused")).toBe("excused");
    expect(localizeStatus("")).toBe("");
  });

  it("대문자 'Present'는 변환되지 않는다 (대소문자 구분)", () => {
    expect(localizeStatus("Present")).toBe("Present");
  });
});

// ============================================================
// localizeTransactionType 테스트
// ============================================================

describe("재무 유형 한글 변환 (localizeTransactionType)", () => {
  it("'income'은 '수입'으로 변환된다", () => {
    expect(localizeTransactionType("income")).toBe("수입");
  });

  it("'expense'는 '지출'로 변환된다", () => {
    expect(localizeTransactionType("expense")).toBe("지출");
  });

  it("알 수 없는 유형은 원래 값을 그대로 반환한다", () => {
    expect(localizeTransactionType("transfer")).toBe("transfer");
    expect(localizeTransactionType("")).toBe("");
  });

  it("대소문자를 구분한다", () => {
    expect(localizeTransactionType("Income")).toBe("Income");
    expect(localizeTransactionType("EXPENSE")).toBe("EXPENSE");
  });
});

// ============================================================
// buildPeriodLabel 테스트
// ============================================================

describe("기간 레이블 생성 (buildPeriodLabel)", () => {
  it("startDate와 endDate 모두 있으면 범위 레이블이다", () => {
    expect(buildPeriodLabel({ startDate: "2026-01-01", endDate: "2026-03-31" }))
      .toBe("2026-01-01_2026-03-31");
  });

  it("startDate만 있으면 '이후' 레이블이다", () => {
    expect(buildPeriodLabel({ startDate: "2026-01-01" }))
      .toBe("2026-01-01_이후");
  });

  it("둘 다 없으면 '전체'이다", () => {
    expect(buildPeriodLabel({})).toBe("전체");
    expect(buildPeriodLabel({ startDate: undefined, endDate: undefined })).toBe("전체");
  });

  it("endDate만 있으면 '전체'를 반환한다 (startDate 없음)", () => {
    expect(buildPeriodLabel({ endDate: "2026-03-31" })).toBe("전체");
  });

  it("파일명에 사용 가능한 형식이다 (슬래시 없음)", () => {
    const label = buildPeriodLabel({ startDate: "2026-01-01", endDate: "2026-03-31" });
    expect(label).not.toContain("/");
  });
});

// ============================================================
// mapAttendanceRow 테스트
// ============================================================

describe("출석 내보내기 행 변환 (mapAttendanceRow)", () => {
  const scheduleMap: ScheduleMap = new Map([
    ["s1", { title: "정기 연습", starts_at: "2026-02-01T14:00:00.000Z" }],
    ["s2", { title: "공연 준비", starts_at: "2026-02-15T10:00:00.000Z" }],
  ]);

  it("present 상태가 '출석'으로 변환된다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "s1", status: "present", profiles: { name: "홍길동" } },
      scheduleMap
    );
    expect(row.status).toBe("출석");
  });

  it("absent 상태가 '결석'으로 변환된다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "s1", status: "absent", profiles: { name: "홍길동" } },
      scheduleMap
    );
    expect(row.status).toBe("결석");
  });

  it("late 상태가 '지각'으로 변환된다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "s1", status: "late", profiles: null },
      scheduleMap
    );
    expect(row.status).toBe("지각");
  });

  it("날짜는 ISO 문자열에서 앞 10자리(YYYY-MM-DD)를 추출한다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "s1", status: "present", profiles: null },
      scheduleMap
    );
    expect(row.date).toBe("2026-02-01");
  });

  it("프로필이 null이면 memberName은 빈 문자열이다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "s1", status: "present", profiles: null },
      scheduleMap
    );
    expect(row.memberName).toBe("");
  });

  it("일정 맵에 없는 schedule_id면 date와 scheduleTitle은 빈 문자열이다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "unknown", status: "present", profiles: { name: "홍길동" } },
      scheduleMap
    );
    expect(row.date).toBe("");
    expect(row.scheduleTitle).toBe("");
  });

  it("scheduleTitle이 올바르게 매핑된다", () => {
    const row = mapAttendanceRow(
      { schedule_id: "s2", status: "present", profiles: { name: "김영희" } },
      scheduleMap
    );
    expect(row.scheduleTitle).toBe("공연 준비");
    expect(row.memberName).toBe("김영희");
  });
});

// ============================================================
// mapBoardRow 테스트
// ============================================================

describe("게시판 내보내기 행 변환 (mapBoardRow)", () => {
  it("날짜는 created_at에서 앞 10자리를 추출한다", () => {
    const row = mapBoardRow({
      id: "p1",
      title: "연습 안내",
      created_at: "2026-02-10T09:00:00.000Z",
      profiles: { name: "이민수" },
      board_comments: [],
    });
    expect(row.date).toBe("2026-02-10");
  });

  it("title이 올바르게 매핑된다", () => {
    const row = mapBoardRow({
      id: "p1",
      title: "공연 공지사항",
      created_at: "2026-02-10T09:00:00.000Z",
      profiles: null,
      board_comments: null,
    });
    expect(row.title).toBe("공연 공지사항");
  });

  it("프로필이 null이면 authorName은 빈 문자열이다", () => {
    const row = mapBoardRow({
      id: "p1",
      title: "제목",
      created_at: "2026-02-10T09:00:00.000Z",
      profiles: null,
      board_comments: null,
    });
    expect(row.authorName).toBe("");
  });

  it("댓글 배열이 null이면 commentCount는 0이다", () => {
    const row = mapBoardRow({
      id: "p1",
      title: "제목",
      created_at: "2026-02-10T09:00:00.000Z",
      profiles: null,
      board_comments: null,
    });
    expect(row.commentCount).toBe(0);
  });

  it("댓글 수가 올바르게 카운팅된다", () => {
    const row = mapBoardRow({
      id: "p1",
      title: "제목",
      created_at: "2026-02-10T09:00:00.000Z",
      profiles: { name: "작성자" },
      board_comments: [{ id: "c1" }, { id: "c2" }, { id: "c3" }],
    });
    expect(row.commentCount).toBe(3);
  });
});

// ============================================================
// mapFinanceRow 테스트
// ============================================================

describe("재무 내보내기 행 변환 (mapFinanceRow)", () => {
  it("income 유형이 '수입'으로 변환된다", () => {
    const row = mapFinanceRow({
      transaction_date: "2026-02-01",
      type: "income",
      amount: 100000,
      title: "회비 수납",
      description: null,
    });
    expect(row.type).toBe("수입");
  });

  it("expense 유형이 '지출'로 변환된다", () => {
    const row = mapFinanceRow({
      transaction_date: "2026-02-05",
      type: "expense",
      amount: 50000,
      title: "연습실 대여",
      description: "2월 정기 연습",
    });
    expect(row.type).toBe("지출");
  });

  it("description이 null이면 빈 문자열이다", () => {
    const row = mapFinanceRow({
      transaction_date: "2026-02-01",
      type: "income",
      amount: 100000,
      title: "회비",
      description: null,
    });
    expect(row.description).toBe("");
  });

  it("description이 있으면 그대로 반환된다", () => {
    const row = mapFinanceRow({
      transaction_date: "2026-02-01",
      type: "expense",
      amount: 30000,
      title: "의상비",
      description: "공연용 의상 구입",
    });
    expect(row.description).toBe("공연용 의상 구입");
  });

  it("amount가 숫자로 그대로 반환된다", () => {
    const row = mapFinanceRow({
      transaction_date: "2026-02-01",
      type: "income",
      amount: 250000,
      title: "회비",
      description: null,
    });
    expect(row.amount).toBe(250000);
  });

  it("date가 transaction_date 그대로 반환된다", () => {
    const row = mapFinanceRow({
      transaction_date: "2026-03-15",
      type: "expense",
      amount: 10000,
      title: "교통비",
      description: null,
    });
    expect(row.date).toBe("2026-03-15");
  });
});

// ============================================================
// generateCSV 테스트
// ============================================================

describe("CSV 생성 (generateCSV)", () => {
  it("헤더만 있으면 단일 행 CSV를 반환한다", () => {
    const csv = generateCSV(["날짜", "이름", "상태"], []);
    expect(csv).toBe("날짜,이름,상태");
  });

  it("헤더와 데이터 행이 CRLF로 구분된다", () => {
    const csv = generateCSV(["날짜", "이름"], [["2026-01-01", "홍길동"]]);
    expect(csv).toContain("\r\n");
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
  });

  it("쉼표가 포함된 셀은 따옴표로 감싸진다", () => {
    const csv = generateCSV(["이름"], [["홍, 길동"]]);
    expect(csv).toContain('"홍, 길동"');
  });

  it("큰따옴표가 포함된 셀은 이스케이프된다", () => {
    const csv = generateCSV(["설명"], [['그는 "최고"라고 말했다']]);
    expect(csv).toContain('"그는 ""최고""라고 말했다"');
  });

  it("줄바꿈이 포함된 셀은 따옴표로 감싸진다", () => {
    const csv = generateCSV(["내용"], [["첫째 줄\n둘째 줄"]]);
    expect(csv).toContain('"첫째 줄\n둘째 줄"');
  });

  it("여러 행을 올바르게 처리한다", () => {
    const csv = generateCSV(
      ["날짜", "이름", "상태"],
      [
        ["2026-01-01", "홍길동", "출석"],
        ["2026-01-02", "김영희", "결석"],
      ]
    );
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3); // 헤더 + 2행
    expect(lines[0]).toBe("날짜,이름,상태");
    expect(lines[1]).toBe("2026-01-01,홍길동,출석");
    expect(lines[2]).toBe("2026-01-02,김영희,결석");
  });

  it("빈 셀은 빈 문자열로 처리된다", () => {
    const csv = generateCSV(["a", "b"], [["", "값"]]);
    expect(csv).toContain(",값");
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 분석 내보내기", () => {
  it("출석 데이터를 CSV 헤더와 함께 올바르게 생성한다", () => {
    const scheduleMap: ScheduleMap = new Map([
      ["s1", { title: "정기 연습", starts_at: "2026-02-01T14:00:00.000Z" }],
    ]);
    const rows = [
      { schedule_id: "s1", status: "present", profiles: { name: "홍길동" } },
      { schedule_id: "s1", status: "absent", profiles: { name: "김철수" } },
    ].map((row) => mapAttendanceRow(row, scheduleMap));

    const headers = ["날짜", "일정명", "멤버명", "출석상태"];
    const csvRows = rows.map((r) => [r.date, r.scheduleTitle, r.memberName, r.status]);
    const csv = generateCSV(headers, csvRows);

    expect(csv).toContain("날짜,일정명,멤버명,출석상태");
    expect(csv).toContain("2026-02-01");
    expect(csv).toContain("출석");
    expect(csv).toContain("결석");
  });

  it("재무 데이터를 CSV 헤더와 함께 올바르게 생성한다", () => {
    const transactions: TransactionRow[] = [
      { transaction_date: "2026-02-01", type: "income", amount: 100000, title: "회비", description: null },
      { transaction_date: "2026-02-05", type: "expense", amount: 50000, title: "연습실", description: "대여비" },
    ];
    const rows = transactions.map(mapFinanceRow);

    const headers = ["날짜", "유형", "금액(원)", "항목명", "설명"];
    const csvRows = rows.map((r) => [r.date, r.type, String(r.amount), r.title, r.description]);
    const csv = generateCSV(headers, csvRows);

    expect(csv).toContain("날짜,유형,금액(원),항목명,설명");
    expect(csv).toContain("수입");
    expect(csv).toContain("지출");
    expect(csv).toContain("100000");
  });

  it("전체 기간 레이블로 파일명을 생성할 수 있다", () => {
    const label = buildPeriodLabel({});
    const filename = `출석데이터_${label}`;
    expect(filename).toBe("출석데이터_전체");
  });

  it("날짜 범위 레이블로 파일명을 생성할 수 있다", () => {
    const label = buildPeriodLabel({ startDate: "2026-01-01", endDate: "2026-03-31" });
    const filename = `재무데이터_${label}`;
    expect(filename).toBe("재무데이터_2026-01-01_2026-03-31");
  });
});
