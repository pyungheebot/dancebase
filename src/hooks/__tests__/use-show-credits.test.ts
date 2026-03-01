/**
 * use-show-credits 테스트
 *
 * 공연 크레딧 훅의 순수 계산 로직을 검증합니다.
 * - CREDIT_SECTION_DEFAULT_TITLES: 기본 제목 매핑
 * - storageKey: localStorage 키 생성
 * - 섹션 CRUD (addSection, updateSectionTitle, deleteSection)
 * - 섹션 순서 변경 (moveSectionUp, moveSectionDown)
 * - 인원 CRUD (addPerson, updatePerson, deletePerson)
 * - 통계 (stats: totalPeople, sectionCount, sectionStats)
 * - 경계값, 빈 데이터, 존재하지 않는 ID 처리
 */

import { describe, it, expect } from "vitest";
import { CREDIT_SECTION_DEFAULT_TITLES } from "@/hooks/use-show-credits";
import type {
  CreditSection,
  CreditSectionType,
  CreditPerson,
} from "@/types/localStorage/misc";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** localStorage 키 생성 */
function storageKey(groupId: string, projectId: string): string {
  return `dancebase:show-credits:${groupId}:${projectId}`;
}

/** 섹션 추가 */
function addSection(
  sections: CreditSection[],
  type: CreditSectionType,
  customTitle?: string
): CreditSection {
  const maxOrder =
    sections.length > 0 ? Math.max(...sections.map((s) => s.order)) : -1;
  return {
    id: `sec-${Date.now()}`,
    type,
    title: customTitle?.trim() || CREDIT_SECTION_DEFAULT_TITLES[type],
    people: [],
    order: maxOrder + 1,
  };
}

/** 섹션 제목 수정 */
function updateSectionTitle(
  sections: CreditSection[],
  sectionId: string,
  title: string
): CreditSection[] | null {
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return null;
  return sections.map((s) =>
    s.id === sectionId ? { ...s, title: title.trim() } : s
  );
}

/** 섹션 삭제 후 order 재정렬 */
function deleteSection(
  sections: CreditSection[],
  sectionId: string
): CreditSection[] | null {
  if (!sections.some((s) => s.id === sectionId)) return null;
  const filtered = sections.filter((s) => s.id !== sectionId);
  return filtered
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }));
}

/** 섹션 위로 이동 */
function moveSectionUp(
  sections: CreditSection[],
  sectionId: string
): CreditSection[] | null {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === sectionId);
  if (idx <= 0) return null;
  const a = sorted[idx];
  const b = sorted[idx - 1];
  return sorted.map((s) => {
    if (s.id === a.id) return { ...s, order: b.order };
    if (s.id === b.id) return { ...s, order: a.order };
    return s;
  });
}

/** 섹션 아래로 이동 */
function moveSectionDown(
  sections: CreditSection[],
  sectionId: string
): CreditSection[] | null {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((s) => s.id === sectionId);
  if (idx === -1 || idx >= sorted.length - 1) return null;
  const a = sorted[idx];
  const b = sorted[idx + 1];
  return sorted.map((s) => {
    if (s.id === a.id) return { ...s, order: b.order };
    if (s.id === b.id) return { ...s, order: a.order };
    return s;
  });
}

/** 섹션에 인원 추가 */
function addPerson(
  sections: CreditSection[],
  sectionId: string,
  name: string,
  role: string
): CreditSection[] | null {
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return null;
  const newPerson: CreditPerson = {
    id: `p-${Date.now()}`,
    name: name.trim(),
    role: role.trim(),
  };
  return sections.map((s) =>
    s.id === sectionId ? { ...s, people: [...s.people, newPerson] } : s
  );
}

/** 인원 수정 */
function updatePerson(
  sections: CreditSection[],
  sectionId: string,
  personId: string,
  name: string,
  role: string
): CreditSection[] | null {
  const sectionIdx = sections.findIndex((s) => s.id === sectionId);
  if (sectionIdx === -1) return null;
  const personIdx = sections[sectionIdx].people.findIndex(
    (p) => p.id === personId
  );
  if (personIdx === -1) return null;
  return sections.map((s) =>
    s.id === sectionId
      ? {
          ...s,
          people: s.people.map((p) =>
            p.id === personId ? { ...p, name: name.trim(), role: role.trim() } : p
          ),
        }
      : s
  );
}

/** 인원 삭제 */
function deletePerson(
  sections: CreditSection[],
  sectionId: string,
  personId: string
): CreditSection[] | null {
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return null;
  return sections.map((s) =>
    s.id === sectionId
      ? { ...s, people: s.people.filter((p) => p.id !== personId) }
      : s
  );
}

/** 통계 계산 */
function calcStats(sections: CreditSection[]) {
  const totalPeople = sections.reduce((sum, s) => sum + s.people.length, 0);
  const sectionStats = sections.map((s) => ({
    id: s.id,
    title: s.title,
    count: s.people.length,
  }));
  return { totalPeople, sectionCount: sections.length, sectionStats };
}

// ============================================================
// 테스트 헬퍼
// ============================================================

function makePerson(id: string, name: string, role: string): CreditPerson {
  return { id, name, role };
}

function makeSection(
  id: string,
  type: CreditSectionType,
  order: number,
  people: CreditPerson[] = []
): CreditSection {
  return {
    id,
    type,
    title: CREDIT_SECTION_DEFAULT_TITLES[type],
    people,
    order,
  };
}

// ============================================================
// CREDIT_SECTION_DEFAULT_TITLES
// ============================================================

describe("CREDIT_SECTION_DEFAULT_TITLES - 기본 제목 매핑", () => {
  it("cast 타입의 기본 제목은 '출연진'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.cast).toBe("출연진");
  });

  it("choreography 타입의 기본 제목은 '안무'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.choreography).toBe("안무");
  });

  it("music 타입의 기본 제목은 '음악'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.music).toBe("음악");
  });

  it("lighting 타입의 기본 제목은 '조명'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.lighting).toBe("조명");
  });

  it("costume 타입의 기본 제목은 '의상'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.costume).toBe("의상");
  });

  it("stage 타입의 기본 제목은 '무대'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.stage).toBe("무대");
  });

  it("planning 타입의 기본 제목은 '기획'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.planning).toBe("기획");
  });

  it("special_thanks 타입의 기본 제목은 '특별 감사'이다", () => {
    expect(CREDIT_SECTION_DEFAULT_TITLES.special_thanks).toBe("특별 감사");
  });

  it("8가지 유형이 모두 정의되어 있다", () => {
    const keys = Object.keys(CREDIT_SECTION_DEFAULT_TITLES);
    expect(keys).toHaveLength(8);
  });
});

// ============================================================
// storageKey
// ============================================================

describe("storageKey - localStorage 키 생성", () => {
  it("groupId와 projectId를 포함한 키를 반환한다", () => {
    expect(storageKey("g1", "p1")).toBe("dancebase:show-credits:g1:p1");
  });

  it("서로 다른 조합은 다른 키를 생성한다", () => {
    expect(storageKey("g1", "p1")).not.toBe(storageKey("g1", "p2"));
    expect(storageKey("g1", "p1")).not.toBe(storageKey("g2", "p1"));
  });
});

// ============================================================
// addSection
// ============================================================

describe("addSection - 섹션 추가", () => {
  it("빈 목록에 섹션 추가 시 order가 0이다", () => {
    const result = addSection([], "cast");
    expect(result.order).toBe(0);
  });

  it("기존 섹션이 있으면 다음 order가 할당된다", () => {
    const sections = [makeSection("s1", "cast", 0), makeSection("s2", "music", 1)];
    const result = addSection(sections, "choreography");
    expect(result.order).toBe(2);
  });

  it("customTitle이 있으면 해당 제목을 사용한다", () => {
    const result = addSection([], "cast", "주요 출연진");
    expect(result.title).toBe("주요 출연진");
  });

  it("customTitle이 없으면 기본 제목을 사용한다", () => {
    const result = addSection([], "choreography");
    expect(result.title).toBe("안무");
  });

  it("customTitle의 앞뒤 공백이 제거된다", () => {
    const result = addSection([], "cast", "  스페셜 캐스트  ");
    expect(result.title).toBe("스페셜 캐스트");
  });

  it("빈 customTitle이면 기본 제목을 사용한다", () => {
    const result = addSection([], "music", "");
    expect(result.title).toBe("음악");
  });

  it("추가된 섹션의 people 배열은 비어있다", () => {
    const result = addSection([], "lighting");
    expect(result.people).toHaveLength(0);
  });

  it("추가된 섹션의 type이 올바르다", () => {
    const result = addSection([], "special_thanks");
    expect(result.type).toBe("special_thanks");
  });
});

// ============================================================
// updateSectionTitle
// ============================================================

describe("updateSectionTitle - 섹션 제목 수정", () => {
  it("존재하는 섹션의 제목을 수정할 수 있다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    const result = updateSectionTitle(sections, "s1", "새 제목");
    expect(result![0].title).toBe("새 제목");
  });

  it("존재하지 않는 섹션 ID 수정 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(updateSectionTitle(sections, "nonexistent", "제목")).toBeNull();
  });

  it("앞뒤 공백이 제거된 제목으로 수정된다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    const result = updateSectionTitle(sections, "s1", "  공백 제거  ");
    expect(result![0].title).toBe("공백 제거");
  });

  it("다른 섹션의 제목은 변경되지 않는다", () => {
    const sections = [
      makeSection("s1", "cast", 0),
      makeSection("s2", "music", 1),
    ];
    const result = updateSectionTitle(sections, "s1", "새 제목");
    expect(result![1].title).toBe("음악");
  });
});

// ============================================================
// deleteSection
// ============================================================

describe("deleteSection - 섹션 삭제", () => {
  it("존재하는 섹션을 삭제하면 해당 섹션이 제거된다", () => {
    const sections = [makeSection("s1", "cast", 0), makeSection("s2", "music", 1)];
    const result = deleteSection(sections, "s1");
    expect(result).toHaveLength(1);
    expect(result![0].id).toBe("s2");
  });

  it("존재하지 않는 섹션 삭제 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(deleteSection(sections, "nonexistent")).toBeNull();
  });

  it("삭제 후 order가 재정렬된다", () => {
    const sections = [
      makeSection("s1", "cast", 0),
      makeSection("s2", "music", 1),
      makeSection("s3", "lighting", 2),
    ];
    const result = deleteSection(sections, "s1")!;
    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
  });

  it("빈 배열에서 삭제 시 null을 반환한다", () => {
    expect(deleteSection([], "s1")).toBeNull();
  });
});

// ============================================================
// moveSectionUp / moveSectionDown
// ============================================================

describe("moveSectionUp / moveSectionDown - 순서 변경", () => {
  it("첫 번째 섹션을 위로 이동하면 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0), makeSection("s2", "music", 1)];
    expect(moveSectionUp(sections, "s1")).toBeNull();
  });

  it("마지막 섹션을 아래로 이동하면 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0), makeSection("s2", "music", 1)];
    expect(moveSectionDown(sections, "s2")).toBeNull();
  });

  it("위로 이동 시 두 섹션의 order가 교환된다", () => {
    const sections = [makeSection("s1", "cast", 0), makeSection("s2", "music", 1)];
    const result = moveSectionUp(sections, "s2")!;
    const s1 = result.find((s) => s.id === "s1")!;
    const s2 = result.find((s) => s.id === "s2")!;
    expect(s2.order).toBeLessThan(s1.order);
  });

  it("아래로 이동 시 두 섹션의 order가 교환된다", () => {
    const sections = [makeSection("s1", "cast", 0), makeSection("s2", "music", 1)];
    const result = moveSectionDown(sections, "s1")!;
    const s1 = result.find((s) => s.id === "s1")!;
    const s2 = result.find((s) => s.id === "s2")!;
    expect(s1.order).toBeGreaterThan(s2.order);
  });

  it("존재하지 않는 섹션 이동 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(moveSectionDown(sections, "nonexistent")).toBeNull();
    expect(moveSectionUp(sections, "nonexistent")).toBeNull();
  });

  it("섹션이 1개일 때 위/아래 이동 모두 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(moveSectionUp(sections, "s1")).toBeNull();
    expect(moveSectionDown(sections, "s1")).toBeNull();
  });
});

// ============================================================
// addPerson / updatePerson / deletePerson
// ============================================================

describe("addPerson - 인원 추가", () => {
  it("존재하는 섹션에 인원을 추가할 수 있다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    const result = addPerson(sections, "s1", "홍길동", "주연");
    expect(result).not.toBeNull();
    expect(result![0].people).toHaveLength(1);
  });

  it("존재하지 않는 섹션에 추가 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(addPerson(sections, "nonexistent", "홍길동", "주연")).toBeNull();
  });

  it("추가된 인원의 이름 앞뒤 공백이 제거된다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    const result = addPerson(sections, "s1", "  홍길동  ", "주연");
    expect(result![0].people[0].name).toBe("홍길동");
  });

  it("추가된 인원의 역할 앞뒤 공백이 제거된다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    const result = addPerson(sections, "s1", "홍길동", "  주연  ");
    expect(result![0].people[0].role).toBe("주연");
  });

  it("다른 섹션의 인원은 변경되지 않는다", () => {
    const sections = [
      makeSection("s1", "cast", 0, [makePerson("p1", "기존", "역할")]),
      makeSection("s2", "music", 1),
    ];
    const result = addPerson(sections, "s2", "신규", "음악감독");
    expect(result![0].people).toHaveLength(1);
    expect(result![0].people[0].name).toBe("기존");
  });
});

describe("updatePerson - 인원 수정", () => {
  it("인원 정보를 수정할 수 있다", () => {
    const person = makePerson("p1", "홍길동", "주연");
    const sections = [makeSection("s1", "cast", 0, [person])];
    const result = updatePerson(sections, "s1", "p1", "김철수", "조연");
    expect(result![0].people[0].name).toBe("김철수");
    expect(result![0].people[0].role).toBe("조연");
  });

  it("존재하지 않는 섹션 수정 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(updatePerson(sections, "nonexistent", "p1", "이름", "역할")).toBeNull();
  });

  it("존재하지 않는 인원 수정 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(updatePerson(sections, "s1", "nonexistent", "이름", "역할")).toBeNull();
  });

  it("수정 시 이름 앞뒤 공백이 제거된다", () => {
    const person = makePerson("p1", "홍길동", "주연");
    const sections = [makeSection("s1", "cast", 0, [person])];
    const result = updatePerson(sections, "s1", "p1", "  새이름  ", "역할");
    expect(result![0].people[0].name).toBe("새이름");
  });
});

describe("deletePerson - 인원 삭제", () => {
  it("인원을 삭제할 수 있다", () => {
    const person = makePerson("p1", "홍길동", "주연");
    const sections = [makeSection("s1", "cast", 0, [person])];
    const result = deletePerson(sections, "s1", "p1");
    expect(result![0].people).toHaveLength(0);
  });

  it("존재하지 않는 섹션에서 삭제 시 null을 반환한다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    expect(deletePerson(sections, "nonexistent", "p1")).toBeNull();
  });

  it("다른 인원은 삭제되지 않는다", () => {
    const p1 = makePerson("p1", "홍길동", "주연");
    const p2 = makePerson("p2", "김철수", "조연");
    const sections = [makeSection("s1", "cast", 0, [p1, p2])];
    const result = deletePerson(sections, "s1", "p1");
    expect(result![0].people).toHaveLength(1);
    expect(result![0].people[0].id).toBe("p2");
  });
});

// ============================================================
// calcStats - 통계 계산
// ============================================================

describe("calcStats - 통계 계산", () => {
  it("빈 섹션 목록의 통계는 모두 0이다", () => {
    const stats = calcStats([]);
    expect(stats.totalPeople).toBe(0);
    expect(stats.sectionCount).toBe(0);
    expect(stats.sectionStats).toHaveLength(0);
  });

  it("totalPeople이 모든 섹션의 인원 합계이다", () => {
    const sections = [
      makeSection("s1", "cast", 0, [
        makePerson("p1", "홍길동", "주연"),
        makePerson("p2", "김철수", "조연"),
      ]),
      makeSection("s2", "choreography", 1, [makePerson("p3", "이영희", "안무")]),
    ];
    expect(calcStats(sections).totalPeople).toBe(3);
  });

  it("sectionCount가 섹션 수와 일치한다", () => {
    const sections = [
      makeSection("s1", "cast", 0),
      makeSection("s2", "music", 1),
      makeSection("s3", "lighting", 2),
    ];
    expect(calcStats(sections).sectionCount).toBe(3);
  });

  it("sectionStats에 각 섹션의 인원 수가 포함된다", () => {
    const sections = [
      makeSection("s1", "cast", 0, [
        makePerson("p1", "홍길동", "주연"),
      ]),
      makeSection("s2", "music", 1),
    ];
    const { sectionStats } = calcStats(sections);
    expect(sectionStats[0].count).toBe(1);
    expect(sectionStats[1].count).toBe(0);
  });

  it("sectionStats에 섹션 id와 title이 포함된다", () => {
    const sections = [makeSection("s1", "cast", 0)];
    const { sectionStats } = calcStats(sections);
    expect(sectionStats[0].id).toBe("s1");
    expect(sectionStats[0].title).toBe("출연진");
  });
});
