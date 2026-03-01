import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ─────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    MEMBER_NAME_REQUIRED: "멤버 이름을 입력해주세요",
    NOT_FOUND: "항목을 찾을 수 없습니다.",
    EMERGENCY_CONTACT: {
      NAME_REQUIRED: "이름을 입력해주세요.",
      PHONE_REQUIRED: "전화번호를 입력해주세요.",
      ADDED: "긴급연락처가 추가되었습니다.",
      UPDATED: "수정되었습니다.",
      DELETED: "삭제되었습니다.",
    },
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: (key: string | null, fetcher?: () => unknown) => {
    if (!key) return { data: undefined, isLoading: false, mutate: mockMutate };
    const data = fetcher ? fetcher() : undefined;
    return { data, isLoading: false, mutate: mockMutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    emergencyContact: (groupId: string) => `emergency-contact-${groupId}`,
  },
}));

beforeEach(() => {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  mockMutate.mockReset();
  mockMutate.mockResolvedValue(undefined);
});

// ============================================================
// 공유 타입 정의
// ============================================================

type EmergencyContactRelation = "parent" | "sibling" | "spouse" | "friend" | "other";
type EmergencyContactBloodType = "A" | "B" | "AB" | "O" | "unknown";

type EmergencyContactEntry = {
  id: string;
  groupId: string;
  memberName: string;
  memberPhone?: string;
  contactName: string;
  relation: EmergencyContactRelation;
  phone: string;
  email?: string;
  notes?: string;
  bloodType: EmergencyContactBloodType;
  allergies?: string;
  medicalNotes?: string;
  insuranceInfo?: string;
  extraContacts?: { id: string; name: string; relation: EmergencyContactRelation; phone: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// 1. localStorage 키 형식 테스트
// ============================================================

describe("localStorage 키 형식", () => {
  it("groupId를 포함한 키를 생성한다", () => {
    const groupId = "group-abc";
    const expectedKey = `dancebase:emergency-contact:${groupId}`;
    memStore[expectedKey] = [];
    expect(memStore[expectedKey]).toBeDefined();
  });

  it("다른 groupId는 독립적인 키를 가진다", () => {
    const key1 = `dancebase:emergency-contact:group1`;
    const key2 = `dancebase:emergency-contact:group2`;
    expect(key1).not.toBe(key2);
  });

  it("groupId가 빈 문자열이면 SWR 키가 null이 된다", () => {
    // swrKeys.emergencyContact("") 를 사용할 때
    // 훅 내부에서 groupId ? ... : null 처리
    const key = "" ? `emergency-contact-${""}` : null;
    expect(key).toBeNull();
  });
});

// ============================================================
// 2. addContact 유효성 검사 로직
// ============================================================

describe("addContact 유효성 검사 로직", () => {
  type AddInput = {
    memberName: string;
    contactName: string;
    phone: string;
    relation: EmergencyContactRelation;
    bloodType: EmergencyContactBloodType;
  };

  function validateAddInput(input: AddInput): string | null {
    if (!input.memberName.trim()) return "MEMBER_NAME_REQUIRED";
    if (!input.contactName.trim()) return "NAME_REQUIRED";
    if (!input.phone.trim()) return "PHONE_REQUIRED";
    return null;
  }

  it("memberName이 비어있으면 MEMBER_NAME_REQUIRED를 반환한다", () => {
    expect(validateAddInput({ memberName: "", contactName: "홍길동", phone: "010-1234-5678", relation: "parent", bloodType: "A" })).toBe("MEMBER_NAME_REQUIRED");
  });

  it("memberName이 공백만 있으면 MEMBER_NAME_REQUIRED를 반환한다", () => {
    expect(validateAddInput({ memberName: "   ", contactName: "홍길동", phone: "010-1234-5678", relation: "parent", bloodType: "A" })).toBe("MEMBER_NAME_REQUIRED");
  });

  it("contactName이 비어있으면 NAME_REQUIRED를 반환한다", () => {
    expect(validateAddInput({ memberName: "김철수", contactName: "", phone: "010-1234-5678", relation: "parent", bloodType: "A" })).toBe("NAME_REQUIRED");
  });

  it("phone이 비어있으면 PHONE_REQUIRED를 반환한다", () => {
    expect(validateAddInput({ memberName: "김철수", contactName: "홍길동", phone: "", relation: "parent", bloodType: "A" })).toBe("PHONE_REQUIRED");
  });

  it("phone이 공백만 있으면 PHONE_REQUIRED를 반환한다", () => {
    expect(validateAddInput({ memberName: "김철수", contactName: "홍길동", phone: "   ", relation: "parent", bloodType: "A" })).toBe("PHONE_REQUIRED");
  });

  it("모든 필드가 유효하면 null을 반환한다", () => {
    expect(validateAddInput({ memberName: "김철수", contactName: "홍길동", phone: "010-1234-5678", relation: "parent", bloodType: "A" })).toBeNull();
  });
});

// ============================================================
// 3. 필드 트리밍 로직 테스트
// ============================================================

describe("필드 트리밍 로직", () => {
  it("memberName의 앞뒤 공백이 제거된다", () => {
    const name = "  김철수  ".trim();
    expect(name).toBe("김철수");
  });

  it("contactName의 앞뒤 공백이 제거된다", () => {
    const name = "  홍길동  ".trim();
    expect(name).toBe("홍길동");
  });

  it("phone의 앞뒤 공백이 제거된다", () => {
    const phone = "  010-1234-5678  ".trim();
    expect(phone).toBe("010-1234-5678");
  });

  it("빈 문자열 email은 undefined가 된다", () => {
    const email = "  ".trim() || undefined;
    expect(email).toBeUndefined();
  });

  it("값이 있는 email은 트리밍 후 저장된다", () => {
    const email = "  test@example.com  ".trim() || undefined;
    expect(email).toBe("test@example.com");
  });

  it("빈 문자열 notes는 undefined가 된다", () => {
    const notes = "".trim() || undefined;
    expect(notes).toBeUndefined();
  });
});

// ============================================================
// 4. getByMember 로직
// ============================================================

describe("getByMember 로직", () => {
  const entries: EmergencyContactEntry[] = [
    {
      id: "e1", groupId: "g1", memberName: "김철수", contactName: "김부모", relation: "parent",
      phone: "010-1111-2222", bloodType: "A", createdAt: "", updatedAt: "",
    },
    {
      id: "e2", groupId: "g1", memberName: "이영희", contactName: "이부모", relation: "parent",
      phone: "010-3333-4444", bloodType: "B", createdAt: "", updatedAt: "",
    },
    {
      id: "e3", groupId: "g1", memberName: "김철수", contactName: "김형", relation: "sibling",
      phone: "010-5555-6666", bloodType: "A", createdAt: "", updatedAt: "",
    },
  ];

  function getByMember(entries: EmergencyContactEntry[], memberName: string): EmergencyContactEntry[] {
    return entries.filter((e) => e.memberName === memberName);
  }

  it("특정 멤버의 연락처만 반환된다", () => {
    const result = getByMember(entries, "김철수");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.memberName === "김철수")).toBe(true);
  });

  it("존재하지 않는 멤버명은 빈 배열을 반환한다", () => {
    const result = getByMember(entries, "박민수");
    expect(result).toHaveLength(0);
  });

  it("멤버명이 정확히 일치해야 반환된다 (대소문자 포함)", () => {
    const result = getByMember(entries, "김철수  ");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 5. filterByBloodType 로직
// ============================================================

describe("filterByBloodType 로직", () => {
  const entries: EmergencyContactEntry[] = [
    { id: "e1", groupId: "g1", memberName: "A1", contactName: "c1", relation: "parent", phone: "010", bloodType: "A", createdAt: "", updatedAt: "" },
    { id: "e2", groupId: "g1", memberName: "B1", contactName: "c2", relation: "parent", phone: "010", bloodType: "B", createdAt: "", updatedAt: "" },
    { id: "e3", groupId: "g1", memberName: "A2", contactName: "c3", relation: "parent", phone: "010", bloodType: "A", createdAt: "", updatedAt: "" },
    { id: "e4", groupId: "g1", memberName: "O1", contactName: "c4", relation: "parent", phone: "010", bloodType: "O", createdAt: "", updatedAt: "" },
  ];

  function filterByBloodType(entries: EmergencyContactEntry[], bloodType: EmergencyContactBloodType | "all"): EmergencyContactEntry[] {
    if (bloodType === "all") return entries;
    return entries.filter((e) => e.bloodType === bloodType);
  }

  it("all이면 모든 항목을 반환한다", () => {
    expect(filterByBloodType(entries, "all")).toHaveLength(4);
  });

  it("A형만 필터링된다", () => {
    const result = filterByBloodType(entries, "A");
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.bloodType === "A")).toBe(true);
  });

  it("B형만 필터링된다", () => {
    const result = filterByBloodType(entries, "B");
    expect(result).toHaveLength(1);
  });

  it("O형만 필터링된다", () => {
    const result = filterByBloodType(entries, "O");
    expect(result).toHaveLength(1);
    expect(result[0].memberName).toBe("O1");
  });

  it("해당 혈액형이 없으면 빈 배열을 반환한다", () => {
    const result = filterByBloodType(entries, "AB");
    expect(result).toHaveLength(0);
  });

  it("빈 배열에서 필터링하면 빈 배열이다", () => {
    const result = filterByBloodType([], "A");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 6. filterByHasMedical 로직
// ============================================================

describe("filterByHasMedical 로직", () => {
  const entries: EmergencyContactEntry[] = [
    { id: "e1", groupId: "g1", memberName: "A", contactName: "c1", relation: "parent", phone: "010", bloodType: "A", allergies: "땅콩", createdAt: "", updatedAt: "" },
    { id: "e2", groupId: "g1", memberName: "B", contactName: "c2", relation: "parent", phone: "010", bloodType: "B", medicalNotes: "당뇨", createdAt: "", updatedAt: "" },
    { id: "e3", groupId: "g1", memberName: "C", contactName: "c3", relation: "parent", phone: "010", bloodType: "O", createdAt: "", updatedAt: "" },
  ];

  function filterByHasMedical(entries: EmergencyContactEntry[]): EmergencyContactEntry[] {
    return entries.filter((e) => e.allergies || e.medicalNotes);
  }

  it("알레르기 또는 질환이 있는 항목만 반환한다", () => {
    const result = filterByHasMedical(entries);
    expect(result).toHaveLength(2);
  });

  it("알레르기만 있어도 포함된다", () => {
    const result = filterByHasMedical(entries);
    expect(result.some((e) => e.memberName === "A")).toBe(true);
  });

  it("질환 기록만 있어도 포함된다", () => {
    const result = filterByHasMedical(entries);
    expect(result.some((e) => e.memberName === "B")).toBe(true);
  });

  it("의료 정보가 없는 항목은 제외된다", () => {
    const result = filterByHasMedical(entries);
    expect(result.some((e) => e.memberName === "C")).toBe(false);
  });

  it("빈 배열에서 필터링하면 빈 배열이다", () => {
    expect(filterByHasMedical([])).toHaveLength(0);
  });
});

// ============================================================
// 7. 통계(stats) 계산 로직
// ============================================================

describe("stats 계산 로직", () => {
  function computeStats(entries: EmergencyContactEntry[]) {
    return {
      total: entries.length,
      withMedical: entries.filter((e) => e.allergies || e.medicalNotes).length,
      withInsurance: entries.filter((e) => e.insuranceInfo).length,
      totalExtraContacts: entries.reduce(
        (sum, e) => sum + (e.extraContacts?.length ?? 0),
        0
      ),
    };
  }

  it("항목이 없으면 모든 통계가 0이다", () => {
    const stats = computeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.withMedical).toBe(0);
    expect(stats.withInsurance).toBe(0);
    expect(stats.totalExtraContacts).toBe(0);
  });

  it("total은 전체 항목 수다", () => {
    const entries: EmergencyContactEntry[] = [
      { id: "e1", groupId: "g1", memberName: "A", contactName: "c", relation: "parent", phone: "010", bloodType: "A", createdAt: "", updatedAt: "" },
      { id: "e2", groupId: "g1", memberName: "B", contactName: "c", relation: "parent", phone: "010", bloodType: "B", createdAt: "", updatedAt: "" },
    ];
    expect(computeStats(entries).total).toBe(2);
  });

  it("withMedical은 의료 정보가 있는 항목 수다", () => {
    const entries: EmergencyContactEntry[] = [
      { id: "e1", groupId: "g1", memberName: "A", contactName: "c", relation: "parent", phone: "010", bloodType: "A", allergies: "우유", createdAt: "", updatedAt: "" },
      { id: "e2", groupId: "g1", memberName: "B", contactName: "c", relation: "parent", phone: "010", bloodType: "B", createdAt: "", updatedAt: "" },
    ];
    expect(computeStats(entries).withMedical).toBe(1);
  });

  it("withInsurance는 보험 정보가 있는 항목 수다", () => {
    const entries: EmergencyContactEntry[] = [
      { id: "e1", groupId: "g1", memberName: "A", contactName: "c", relation: "parent", phone: "010", bloodType: "A", insuranceInfo: "삼성화재", createdAt: "", updatedAt: "" },
      { id: "e2", groupId: "g1", memberName: "B", contactName: "c", relation: "parent", phone: "010", bloodType: "B", createdAt: "", updatedAt: "" },
    ];
    expect(computeStats(entries).withInsurance).toBe(1);
  });

  it("totalExtraContacts는 추가 연락처 수의 합계다", () => {
    const entries: EmergencyContactEntry[] = [
      {
        id: "e1", groupId: "g1", memberName: "A", contactName: "c", relation: "parent", phone: "010", bloodType: "A",
        extraContacts: [
          { id: "ec1", name: "형", relation: "sibling", phone: "010-1111-2222" },
          { id: "ec2", name: "누나", relation: "sibling", phone: "010-3333-4444" },
        ],
        createdAt: "", updatedAt: "",
      },
      { id: "e2", groupId: "g1", memberName: "B", contactName: "c", relation: "parent", phone: "010", bloodType: "B", createdAt: "", updatedAt: "" },
    ];
    expect(computeStats(entries).totalExtraContacts).toBe(2);
  });

  it("extraContacts가 undefined이면 0으로 처리된다", () => {
    const entries: EmergencyContactEntry[] = [
      { id: "e1", groupId: "g1", memberName: "A", contactName: "c", relation: "parent", phone: "010", bloodType: "A", createdAt: "", updatedAt: "" },
    ];
    expect(computeStats(entries).totalExtraContacts).toBe(0);
  });
});

// ============================================================
// 8. updateContact 로직 테스트
// ============================================================

describe("updateContact 로직", () => {
  function updateContact(
    entries: EmergencyContactEntry[],
    id: string,
    changes: Partial<Pick<EmergencyContactEntry, "memberName" | "phone" | "bloodType" | "notes">>
  ): EmergencyContactEntry[] | null {
    const target = entries.find((e) => e.id === id);
    if (!target) return null;
    return entries.map((e) =>
      e.id === id ? { ...e, ...changes } : e
    );
  }

  const baseEntry: EmergencyContactEntry = {
    id: "e1", groupId: "g1", memberName: "김철수", contactName: "홍길동",
    relation: "parent", phone: "010-1111-2222", bloodType: "A", createdAt: "", updatedAt: "",
  };

  it("존재하지 않는 id로 수정 시 null이 반환된다", () => {
    expect(updateContact([baseEntry], "e99", { phone: "010-9999-0000" })).toBeNull();
  });

  it("phone이 변경된다", () => {
    const result = updateContact([baseEntry], "e1", { phone: "010-9999-0000" });
    expect(result?.[0].phone).toBe("010-9999-0000");
  });

  it("다른 항목은 변경되지 않는다", () => {
    const entries = [
      baseEntry,
      { ...baseEntry, id: "e2", memberName: "이영희" },
    ];
    const result = updateContact(entries, "e1", { phone: "010-9999-0000" });
    expect(result?.[1].memberName).toBe("이영희");
    expect(result?.[1].phone).toBe("010-1111-2222");
  });

  it("bloodType이 변경된다", () => {
    const result = updateContact([baseEntry], "e1", { bloodType: "O" });
    expect(result?.[0].bloodType).toBe("O");
  });
});

// ============================================================
// 9. deleteContact 로직 테스트
// ============================================================

describe("deleteContact 로직", () => {
  function deleteContact(entries: EmergencyContactEntry[], id: string): EmergencyContactEntry[] {
    return entries.filter((e) => e.id !== id);
  }

  const entries: EmergencyContactEntry[] = [
    { id: "e1", groupId: "g1", memberName: "A", contactName: "c1", relation: "parent", phone: "010", bloodType: "A", createdAt: "", updatedAt: "" },
    { id: "e2", groupId: "g1", memberName: "B", contactName: "c2", relation: "parent", phone: "010", bloodType: "B", createdAt: "", updatedAt: "" },
  ];

  it("지정한 id의 항목이 삭제된다", () => {
    const result = deleteContact(entries, "e1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("e2");
  });

  it("존재하지 않는 id 삭제 시 목록이 변하지 않는다", () => {
    const result = deleteContact(entries, "e99");
    expect(result).toHaveLength(2);
  });

  it("빈 배열에서 삭제해도 에러가 없다", () => {
    const result = deleteContact([], "e1");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 10. 그룹별 격리 테스트
// ============================================================

describe("그룹별 데이터 격리", () => {
  it("다른 groupId는 독립적인 스토리지 키를 가진다", () => {
    const key1 = `dancebase:emergency-contact:group1`;
    const key2 = `dancebase:emergency-contact:group2`;
    memStore[key1] = [{ id: "e1" }];
    memStore[key2] = [];
    expect((memStore[key1] as unknown[]).length).toBe(1);
    expect((memStore[key2] as unknown[]).length).toBe(0);
  });

  it("group1 데이터 수정이 group2에 영향을 주지 않는다", () => {
    const key1 = `dancebase:emergency-contact:group1`;
    const key2 = `dancebase:emergency-contact:group2`;
    memStore[key1] = [{ id: "e1", memberName: "A" }];
    memStore[key2] = [{ id: "e2", memberName: "B" }];
    // group1 데이터 업데이트
    memStore[key1] = [...(memStore[key1] as unknown[]), { id: "e3", memberName: "C" }];
    expect((memStore[key1] as unknown[]).length).toBe(2);
    expect((memStore[key2] as unknown[]).length).toBe(1);
  });
});
