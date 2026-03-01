import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useAudienceGuide,
  SECTION_TYPE_LABELS,
  SECTION_TYPE_COLORS,
} from "@/hooks/use-audience-guide";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── saveToStorage mock ───────────────────────────────────────
vi.mock("@/lib/local-storage", () => ({
  saveToStorage: vi.fn((key: string, value: unknown) => {
    localStorageMock.setItem(key, JSON.stringify(value));
  }),
  loadFromStorage: vi.fn(() => null),
}));

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useAudienceGuide(groupId, projectId));
}

// ============================================================
// 상수 테스트
// ============================================================

describe("SECTION_TYPE_LABELS - 섹션 유형 레이블", () => {
  it("location 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.location).toBe("공연장 위치/교통");
  });

  it("parking 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.parking).toBe("주차 안내");
  });

  it("seating 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.seating).toBe("좌석 안내");
  });

  it("caution 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.caution).toBe("주의사항");
  });

  it("etiquette 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.etiquette).toBe("공연 에티켓");
  });

  it("emergency 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.emergency).toBe("비상구/대피 안내");
  });

  it("faq 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.faq).toBe("FAQ");
  });

  it("general 레이블이 올바르다", () => {
    expect(SECTION_TYPE_LABELS.general).toBe("일반 안내");
  });
});

describe("SECTION_TYPE_COLORS - 섹션 유형 색상", () => {
  it("모든 섹션 타입에 색상이 정의되어 있다", () => {
    const types = ["location", "parking", "seating", "caution", "etiquette", "emergency", "faq", "general"] as const;
    types.forEach((type) => {
      expect(SECTION_TYPE_COLORS[type]).toBeDefined();
      expect(typeof SECTION_TYPE_COLORS[type]).toBe("string");
    });
  });

  it("caution 색상에는 red가 포함된다", () => {
    expect(SECTION_TYPE_COLORS.caution).toContain("red");
  });

  it("emergency 색상에는 rose가 포함된다", () => {
    expect(SECTION_TYPE_COLORS.emergency).toContain("rose");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useAudienceGuide - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("초기 sections는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.sections).toEqual([]);
  });

  it("초기 visibleSections는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.visibleSections).toEqual([]);
  });

  it("초기 entry.title은 '관객 안내 매뉴얼'이다", () => {
    const { result } = makeHook();
    expect(result.current.entry.title).toBe("관객 안내 매뉴얼");
  });

  it("초기 entry.description은 빈 문자열이다", () => {
    const { result } = makeHook();
    expect(result.current.entry.description).toBe("");
  });

  it("초기 entry.groupId가 올바르다", () => {
    const { result } = makeHook("grp-99", "proj-1");
    expect(result.current.entry.groupId).toBe("grp-99");
  });

  it("초기 entry.projectId가 올바르다", () => {
    const { result } = makeHook("grp-1", "proj-99");
    expect(result.current.entry.projectId).toBe("proj-99");
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.updateManualInfo).toBe("function");
    expect(typeof result.current.addSection).toBe("function");
    expect(typeof result.current.updateSection).toBe("function");
    expect(typeof result.current.removeSection).toBe("function");
    expect(typeof result.current.moveSectionUp).toBe("function");
    expect(typeof result.current.moveSectionDown).toBe("function");
    expect(typeof result.current.toggleSectionVisibility).toBe("function");
    expect(typeof result.current.addFAQ).toBe("function");
    expect(typeof result.current.updateFAQ).toBe("function");
    expect(typeof result.current.removeFAQ).toBe("function");
    expect(typeof result.current.moveFAQUp).toBe("function");
    expect(typeof result.current.moveFAQDown).toBe("function");
  });
});

// ============================================================
// updateManualInfo
// ============================================================

describe("useAudienceGuide - updateManualInfo 매뉴얼 정보 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("title을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.updateManualInfo({ title: "새 제목" });
    });
    expect(result.current.entry.title).toBe("새 제목");
  });

  it("description을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.updateManualInfo({ description: "안내 설명입니다" });
    });
    expect(result.current.entry.description).toBe("안내 설명입니다");
  });

  it("title과 description을 동시에 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.updateManualInfo({ title: "제목", description: "설명" });
    });
    expect(result.current.entry.title).toBe("제목");
    expect(result.current.entry.description).toBe("설명");
  });
});

// ============================================================
// addSection
// ============================================================

describe("useAudienceGuide - addSection 섹션 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("섹션을 추가하면 sections 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("location", "공연장 위치");
    });
    expect(result.current.sections).toHaveLength(1);
  });

  it("추가된 섹션의 type이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("parking", "주차 안내");
    });
    expect(result.current.sections[0].type).toBe("parking");
  });

  it("추가된 섹션의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("seating", "좌석 안내");
    });
    expect(result.current.sections[0].title).toBe("좌석 안내");
  });

  it("추가된 섹션의 isVisible은 true이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "일반 안내");
    });
    expect(result.current.sections[0].isVisible).toBe(true);
  });

  it("추가된 섹션의 faqs는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    expect(result.current.sections[0].faqs).toEqual([]);
  });

  it("빈 title로 addSection 시 섹션이 추가되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "   ");
    });
    expect(result.current.sections).toHaveLength(0);
  });

  it("content를 포함하여 섹션을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("caution", "주의사항", "촬영 금지");
    });
    expect(result.current.sections[0].content).toBe("촬영 금지");
  });

  it("두 번째 섹션의 order가 첫 번째보다 크다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("location", "위치");
    });
    act(() => {
      result.current.addSection("parking", "주차");
    });
    expect(result.current.sections[1].order).toBeGreaterThan(result.current.sections[0].order);
  });

  it("title의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "  공백 제거  ");
    });
    expect(result.current.sections[0].title).toBe("공백 제거");
  });
});

// ============================================================
// updateSection
// ============================================================

describe("useAudienceGuide - updateSection 섹션 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("섹션 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "원래 제목");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.updateSection(sectionId, { title: "새 제목" });
    });
    expect(result.current.sections[0].title).toBe("새 제목");
  });

  it("섹션 content를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("caution", "주의");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.updateSection(sectionId, { content: "수정된 내용" });
    });
    expect(result.current.sections[0].content).toBe("수정된 내용");
  });

  it("섹션 type을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "안내");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.updateSection(sectionId, { type: "etiquette" });
    });
    expect(result.current.sections[0].type).toBe("etiquette");
  });

  it("존재하지 않는 sectionId로 수정 시 sections가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "안내");
    });
    act(() => {
      result.current.updateSection("non-existent", { title: "변경" });
    });
    expect(result.current.sections[0].title).toBe("안내");
  });
});

// ============================================================
// removeSection
// ============================================================

describe("useAudienceGuide - removeSection 섹션 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("섹션을 삭제하면 sections 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "안내");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.removeSection(sectionId);
    });
    expect(result.current.sections).toHaveLength(0);
  });

  it("특정 섹션만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "섹션1");
    });
    act(() => {
      result.current.addSection("faq", "섹션2");
    });
    const firstId = result.current.sections[0].id;
    act(() => {
      result.current.removeSection(firstId);
    });
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].title).toBe("섹션2");
  });
});

// ============================================================
// moveSectionUp / moveSectionDown
// ============================================================

describe("useAudienceGuide - moveSectionUp / moveSectionDown 섹션 순서 변경", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("moveSectionUp: 첫 번째 섹션을 위로 이동해도 순서가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "섹션1");
    });
    act(() => {
      result.current.addSection("faq", "섹션2");
    });
    const firstId = result.current.sections[0].id;
    const firstOrderBefore = result.current.sections[0].order;
    act(() => {
      result.current.moveSectionUp(firstId);
    });
    expect(result.current.sections[0].id).toBe(firstId);
    expect(result.current.sections[0].order).toBe(firstOrderBefore);
  });

  it("moveSectionDown: 두 번째 섹션을 아래로 이동하면 첫 번째 섹션보다 큰 order를 가진다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "섹션1");
    });
    act(() => {
      result.current.addSection("faq", "섹션2");
    });
    act(() => {
      result.current.addSection("caution", "섹션3");
    });
    const secondId = result.current.sections[1].id;
    act(() => {
      result.current.moveSectionDown(secondId);
    });
    // 섹션2가 섹션3 위치로 이동했으므로 order 기준 마지막이어야 함
    const sorted = [...result.current.sections].sort((a, b) => a.order - b.order);
    expect(sorted[sorted.length - 1].id).toBe(secondId);
  });

  it("moveSectionUp: 두 번째 섹션을 위로 이동하면 첫 번째 섹션이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "섹션1");
    });
    act(() => {
      result.current.addSection("faq", "섹션2");
    });
    const secondId = result.current.sections[1].id;
    act(() => {
      result.current.moveSectionUp(secondId);
    });
    const sorted = [...result.current.sections].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe(secondId);
  });

  it("moveSectionDown: 마지막 섹션을 아래로 이동해도 순서가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "섹션1");
    });
    act(() => {
      result.current.addSection("faq", "섹션2");
    });
    const lastId = result.current.sections[result.current.sections.length - 1].id;
    const lastOrderBefore = result.current.sections[result.current.sections.length - 1].order;
    act(() => {
      result.current.moveSectionDown(lastId);
    });
    const lastSection = [...result.current.sections].sort((a, b) => b.order - a.order)[0];
    expect(lastSection.id).toBe(lastId);
    expect(lastSection.order).toBe(lastOrderBefore);
  });
});

// ============================================================
// toggleSectionVisibility
// ============================================================

describe("useAudienceGuide - toggleSectionVisibility 섹션 공개 여부 토글", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("공개 섹션을 토글하면 isVisible이 false가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "안내");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.toggleSectionVisibility(sectionId);
    });
    expect(result.current.sections[0].isVisible).toBe(false);
  });

  it("비공개 섹션을 토글하면 isVisible이 true가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "안내");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.toggleSectionVisibility(sectionId);
    });
    act(() => {
      result.current.toggleSectionVisibility(sectionId);
    });
    expect(result.current.sections[0].isVisible).toBe(true);
  });

  it("비공개 섹션은 visibleSections에 포함되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "안내1");
    });
    act(() => {
      result.current.addSection("faq", "안내2");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.toggleSectionVisibility(sectionId);
    });
    expect(result.current.visibleSections).toHaveLength(1);
    expect(result.current.visibleSections[0].type).toBe("faq");
  });
});

// ============================================================
// addFAQ
// ============================================================

describe("useAudienceGuide - addFAQ FAQ 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("FAQ를 추가하면 해당 섹션의 faqs 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문", "답변");
    });
    expect(result.current.sections[0].faqs).toHaveLength(1);
  });

  it("추가된 FAQ의 question이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "주차 가능한가요?", "네, 가능합니다");
    });
    expect(result.current.sections[0].faqs[0].question).toBe("주차 가능한가요?");
  });

  it("추가된 FAQ의 answer가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문", "정확한 답변");
    });
    expect(result.current.sections[0].faqs[0].answer).toBe("정확한 답변");
  });

  it("빈 question으로 addFAQ 시 FAQ가 추가되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "", "답변");
    });
    expect(result.current.sections[0].faqs).toHaveLength(0);
  });

  it("빈 answer로 addFAQ 시 FAQ가 추가되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문", "  ");
    });
    expect(result.current.sections[0].faqs).toHaveLength(0);
  });

  it("question의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "  질문  ", "답변");
    });
    expect(result.current.sections[0].faqs[0].question).toBe("질문");
  });
});

// ============================================================
// updateFAQ
// ============================================================

describe("useAudienceGuide - updateFAQ FAQ 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("FAQ question을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "원래 질문", "답변");
    });
    const faqId = result.current.sections[0].faqs[0].id;
    act(() => {
      result.current.updateFAQ(sectionId, faqId, { question: "수정된 질문" });
    });
    expect(result.current.sections[0].faqs[0].question).toBe("수정된 질문");
  });

  it("FAQ answer를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문", "원래 답변");
    });
    const faqId = result.current.sections[0].faqs[0].id;
    act(() => {
      result.current.updateFAQ(sectionId, faqId, { answer: "수정된 답변" });
    });
    expect(result.current.sections[0].faqs[0].answer).toBe("수정된 답변");
  });
});

// ============================================================
// removeFAQ
// ============================================================

describe("useAudienceGuide - removeFAQ FAQ 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("FAQ를 삭제하면 faqs 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문", "답변");
    });
    const faqId = result.current.sections[0].faqs[0].id;
    act(() => {
      result.current.removeFAQ(sectionId, faqId);
    });
    expect(result.current.sections[0].faqs).toHaveLength(0);
  });

  it("특정 FAQ만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문1", "답변1");
    });
    act(() => {
      result.current.addFAQ(sectionId, "질문2", "답변2");
    });
    const firstFaqId = result.current.sections[0].faqs[0].id;
    act(() => {
      result.current.removeFAQ(sectionId, firstFaqId);
    });
    expect(result.current.sections[0].faqs).toHaveLength(1);
    expect(result.current.sections[0].faqs[0].question).toBe("질문2");
  });
});

// ============================================================
// moveFAQUp / moveFAQDown
// ============================================================

describe("useAudienceGuide - moveFAQUp / moveFAQDown FAQ 순서 변경", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("moveFAQUp: 첫 번째 FAQ를 위로 이동해도 순서가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문1", "답변1");
    });
    act(() => {
      result.current.addFAQ(sectionId, "질문2", "답변2");
    });
    const firstFaqId = result.current.sections[0].faqs[0].id;
    const firstOrderBefore = result.current.sections[0].faqs[0].order;
    act(() => {
      result.current.moveFAQUp(sectionId, firstFaqId);
    });
    const sorted = [...result.current.sections[0].faqs].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe(firstFaqId);
    expect(sorted[0].order).toBe(firstOrderBefore);
  });

  it("moveFAQDown: 마지막 FAQ를 아래로 이동해도 순서가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문1", "답변1");
    });
    act(() => {
      result.current.addFAQ(sectionId, "질문2", "답변2");
    });
    const faqs = result.current.sections[0].faqs;
    const lastFaqId = faqs[faqs.length - 1].id;
    act(() => {
      result.current.moveFAQDown(sectionId, lastFaqId);
    });
    const sorted = [...result.current.sections[0].faqs].sort((a, b) => b.order - a.order);
    expect(sorted[0].id).toBe(lastFaqId);
  });

  it("moveFAQUp: 두 번째 FAQ를 위로 이동하면 첫 번째가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("faq", "FAQ");
    });
    const sectionId = result.current.sections[0].id;
    act(() => {
      result.current.addFAQ(sectionId, "질문1", "답변1");
    });
    act(() => {
      result.current.addFAQ(sectionId, "질문2", "답변2");
    });
    const secondFaqId = result.current.sections[0].faqs[1].id;
    act(() => {
      result.current.moveFAQUp(sectionId, secondFaqId);
    });
    const sorted = [...result.current.sections[0].faqs].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe(secondFaqId);
  });
});

// ============================================================
// 파생 데이터 (sortedSections, visibleSections)
// ============================================================

describe("useAudienceGuide - 파생 데이터", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("sections는 order 기준 오름차순 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "A");
    });
    act(() => {
      result.current.addSection("faq", "B");
    });
    act(() => {
      result.current.addSection("caution", "C");
    });
    const orders = result.current.sections.map((s) => s.order);
    expect(orders[0]).toBeLessThanOrEqual(orders[1]);
    expect(orders[1]).toBeLessThanOrEqual(orders[2]);
  });

  it("visibleSections는 isVisible=true인 섹션만 포함한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "공개");
    });
    act(() => {
      result.current.addSection("caution", "비공개");
    });
    const secondId = result.current.sections[1].id;
    act(() => {
      result.current.toggleSectionVisibility(secondId);
    });
    expect(result.current.visibleSections).toHaveLength(1);
    expect(result.current.visibleSections[0].title).toBe("공개");
  });

  it("모든 섹션이 공개이면 sections와 visibleSections 길이가 같다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSection("general", "섹션1");
    });
    act(() => {
      result.current.addSection("faq", "섹션2");
    });
    expect(result.current.sections.length).toBe(result.current.visibleSections.length);
  });
});
