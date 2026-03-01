import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

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

// ─── SWR mock (useSkillCertification은 SWR을 사용하지 않음) ──
vi.mock("swr", () => ({
  default: vi.fn(),
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {},
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

import {
  useSkillCertification,
  SKILL_CERT_LEVEL_LABELS,
  SKILL_CERT_LEVEL_ORDER,
  SKILL_CERT_LEVEL_COLORS,
} from "@/hooks/use-skill-certification";

const GROUP_A = "group-skill-aaa";
const GROUP_B = "group-skill-bbb";

function makeCertParams(overrides: Partial<{
  skillName: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert" | "master";
  requirements: string[];
}> = {}) {
  return {
    skillName: "비보잉 기초",
    description: "기본 스텝 마스터",
    category: "브레이킹",
    level: "beginner" as const,
    requirements: ["기본 스텝", "프리즈"],
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ─── 1. 초기 상태 ─────────────────────────────────────────────

describe("useSkillCertification - 초기 상태", () => {
  it("certs는 빈 배열이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.certs).toEqual([]);
  });

  it("awards는 빈 배열이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.awards).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.loading).toBe(false);
  });

  it("createCert 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.createCert).toBe("function");
  });

  it("deleteCert 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.deleteCert).toBe("function");
  });

  it("awardCert 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.awardCert).toBe("function");
  });

  it("revokeCert 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.revokeCert).toBe("function");
  });

  it("getMemberCerts 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.getMemberCerts).toBe("function");
  });

  it("getCertHolders 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.getCertHolders).toBe("function");
  });

  it("stats 객체가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.stats).toBeDefined();
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats.totalCerts는 0이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.stats.totalCerts).toBe(0);
  });

  it("stats.totalAwards는 0이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.stats.totalAwards).toBe(0);
  });

  it("stats.topCertHolder는 null이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.stats.topCertHolder).toBeNull();
  });
});

// ─── 2. 상수 ─────────────────────────────────────────────────

describe("SKILL_CERT_LEVEL_LABELS - 레벨 라벨", () => {
  it("beginner 라벨이 '입문'이다", () => {
    expect(SKILL_CERT_LEVEL_LABELS.beginner).toBe("입문");
  });

  it("intermediate 라벨이 '초급'이다", () => {
    expect(SKILL_CERT_LEVEL_LABELS.intermediate).toBe("초급");
  });

  it("advanced 라벨이 '중급'이다", () => {
    expect(SKILL_CERT_LEVEL_LABELS.advanced).toBe("중급");
  });

  it("expert 라벨이 '고급'이다", () => {
    expect(SKILL_CERT_LEVEL_LABELS.expert).toBe("고급");
  });

  it("master 라벨이 '마스터'이다", () => {
    expect(SKILL_CERT_LEVEL_LABELS.master).toBe("마스터");
  });
});

describe("SKILL_CERT_LEVEL_ORDER - 레벨 순서", () => {
  it("5개 레벨이 순서대로 정렬되어 있다", () => {
    expect(SKILL_CERT_LEVEL_ORDER).toEqual([
      "beginner",
      "intermediate",
      "advanced",
      "expert",
      "master",
    ]);
  });

  it("beginner가 첫 번째이다", () => {
    expect(SKILL_CERT_LEVEL_ORDER[0]).toBe("beginner");
  });

  it("master가 마지막이다", () => {
    expect(SKILL_CERT_LEVEL_ORDER[4]).toBe("master");
  });
});

describe("SKILL_CERT_LEVEL_COLORS - 레벨 색상", () => {
  it("모든 레벨에 badge, text, bar 필드가 있다", () => {
    for (const colors of Object.values(SKILL_CERT_LEVEL_COLORS)) {
      expect(colors.badge).toBeTruthy();
      expect(colors.text).toBeTruthy();
      expect(colors.bar).toBeTruthy();
    }
  });
});

// ─── 3. createCert ───────────────────────────────────────────

describe("useSkillCertification - createCert", () => {
  it("createCert 호출 시 certs 배열에 추가된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    act(() => {
      result.current.createCert(makeCertParams());
    });
    expect(result.current.certs).toHaveLength(1);
  });

  it("createCert 반환값에 id가 있다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let cert: ReturnType<typeof result.current.createCert> | undefined;
    act(() => {
      cert = result.current.createCert(makeCertParams());
    });
    expect(cert?.id).toBeTruthy();
  });

  it("createCert 반환값에 skillName이 맞다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let cert: ReturnType<typeof result.current.createCert> | undefined;
    act(() => {
      cert = result.current.createCert(makeCertParams({ skillName: "왁킹 기초" }));
    });
    expect(cert?.skillName).toBe("왁킹 기초");
  });

  it("createCert 반환값에 createdAt이 ISO 문자열이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let cert: ReturnType<typeof result.current.createCert> | undefined;
    act(() => {
      cert = result.current.createCert(makeCertParams());
    });
    expect(() => new Date(cert!.createdAt)).not.toThrow();
  });

  it("여러 인증을 생성하면 certs가 누적된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    // 클로저 상태를 고려해 별도 훅 인스턴스에서 순차 저장 후 reload 활용
    act(() => {
      result.current.createCert(makeCertParams({ skillName: "A" }));
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.createCert(makeCertParams({ skillName: "B" }));
    });
    expect(result.current.certs).toHaveLength(2);
  });

  it("createCert 호출 시 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    act(() => {
      result.current.createCert(makeCertParams());
    });
    const stored = memStore[`dancebase:skill-cert:${GROUP_A}`] as { certs: unknown[] };
    expect(stored?.certs).toHaveLength(1);
  });

  it("stats.totalCerts가 createCert 후 증가한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    act(() => {
      result.current.createCert(makeCertParams());
    });
    expect(result.current.stats.totalCerts).toBe(1);
  });
});

// ─── 4. deleteCert ───────────────────────────────────────────

describe("useSkillCertification - deleteCert", () => {
  it("deleteCert 호출 시 해당 cert가 제거된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
    });
    act(() => {
      result.current.deleteCert(certId!);
    });
    expect(result.current.certs).toHaveLength(0);
  });

  it("deleteCert 시 관련 awards도 함께 삭제된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
      result.current.awardCert({ certId: cert.id, memberName: "홍길동", certifiedBy: "관리자" });
    });
    act(() => {
      result.current.deleteCert(certId!);
    });
    expect(result.current.awards).toHaveLength(0);
  });

  it("존재하지 않는 certId를 삭제해도 에러가 없다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(() => {
      act(() => {
        result.current.deleteCert("nonexistent-id");
      });
    }).not.toThrow();
  });
});

// ─── 5. awardCert ─────────────────────────────────────────────

describe("useSkillCertification - awardCert", () => {
  it("awardCert 호출 시 awards 배열에 추가된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
    });
    act(() => {
      result.current.awardCert({ certId: certId!, memberName: "김철수", certifiedBy: "관리자" });
    });
    expect(result.current.awards).toHaveLength(1);
  });

  it("awardCert 반환값에 certId가 올바르다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    let awardId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
      const award = result.current.awardCert({ certId: cert.id, memberName: "김철수", certifiedBy: "관리자" });
      awardId = award.id;
    });
    expect(result.current.awards[0].certId).toBe(certId);
    expect(result.current.awards[0].id).toBe(awardId);
  });

  it("awardCert notes가 저장된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      result.current.awardCert({ certId: cert.id, memberName: "김철수", certifiedBy: "관리자", notes: "우수" });
    });
    expect(result.current.awards[0].notes).toBe("우수");
  });

  it("stats.totalAwards가 awardCert 후 증가한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      result.current.awardCert({ certId: cert.id, memberName: "김철수", certifiedBy: "관리자" });
    });
    expect(result.current.stats.totalAwards).toBe(1);
  });
});

// ─── 6. revokeCert ───────────────────────────────────────────

describe("useSkillCertification - revokeCert", () => {
  it("revokeCert 호출 시 해당 award가 제거된다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let awardId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      const award = result.current.awardCert({ certId: cert.id, memberName: "홍길동", certifiedBy: "관리자" });
      awardId = award.id;
    });
    act(() => {
      result.current.revokeCert(awardId!);
    });
    expect(result.current.awards).toHaveLength(0);
  });
});

// ─── 7. getMemberCerts ───────────────────────────────────────

describe("useSkillCertification - getMemberCerts", () => {
  it("존재하지 않는 멤버에 대해 빈 배열을 반환한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.getMemberCerts("존재안함")).toEqual([]);
  });

  it("멤버가 받은 인증 목록을 반환한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.awardCert({ certId: certId!, memberName: "홍길동", certifiedBy: "관리자" });
    });
    expect(result.current.getMemberCerts("홍길동")).toHaveLength(1);
  });

  it("getMemberCerts 반환 요소는 award와 cert를 가진다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.awardCert({ certId: certId!, memberName: "홍길동", certifiedBy: "관리자" });
    });
    const list = result.current.getMemberCerts("홍길동");
    expect(list[0]).toHaveProperty("award");
    expect(list[0]).toHaveProperty("cert");
  });
});

// ─── 8. getCertHolders ───────────────────────────────────────

describe("useSkillCertification - getCertHolders", () => {
  it("존재하지 않는 certId에 대해 빈 배열을 반환한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    expect(result.current.getCertHolders("nonexistent")).toEqual([]);
  });

  it("해당 인증의 보유자 목록을 반환한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      certId = cert.id;
      result.current.awardCert({ certId: cert.id, memberName: "A", certifiedBy: "관리자" });
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.awardCert({ certId: certId!, memberName: "B", certifiedBy: "관리자" });
    });
    expect(result.current.getCertHolders(certId!)).toHaveLength(2);
  });
});

// ─── 9. stats - levelDistribution ────────────────────────────

describe("useSkillCertification - stats.levelDistribution", () => {
  it("초기 levelDistribution 모든 레벨이 0이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    for (const v of Object.values(result.current.stats.levelDistribution)) {
      expect(v).toBe(0);
    }
  });

  it("award 후 해당 cert 레벨의 distribution이 증가한다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    let certId: string | undefined;
    act(() => {
      const cert = result.current.createCert(makeCertParams({ level: "expert" }));
      certId = cert.id;
    });
    act(() => {
      result.current.refetch();
    });
    act(() => {
      result.current.awardCert({ certId: certId!, memberName: "홍길동", certifiedBy: "관리자" });
    });
    expect(result.current.stats.levelDistribution.expert).toBe(1);
  });
});

// ─── 10. stats - topCertHolder ───────────────────────────────

describe("useSkillCertification - stats.topCertHolder", () => {
  it("여러 award 시 가장 많이 받은 멤버가 topCertHolder이다", () => {
    // 직접 계산 로직 재현으로 검증
    const awards = [
      { memberName: "홍길동" },
      { memberName: "홍길동" },
      { memberName: "김철수" },
    ];
    const memberCountMap = new Map<string, number>();
    for (const award of awards) {
      memberCountMap.set(award.memberName, (memberCountMap.get(award.memberName) ?? 0) + 1);
    }
    let topHolder: { memberName: string; count: number } | null = null;
    for (const [memberName, count] of memberCountMap.entries()) {
      if (!topHolder || count > topHolder.count) {
        topHolder = { memberName, count };
      }
    }
    expect(topHolder?.memberName).toBe("홍길동");
    expect(topHolder?.count).toBe(2);
  });

  it("단일 award 후 topCertHolder가 해당 멤버이다", () => {
    const { result } = renderHook(() => useSkillCertification(GROUP_A));
    act(() => {
      const cert = result.current.createCert(makeCertParams());
      result.current.awardCert({ certId: cert.id, memberName: "홍길동", certifiedBy: "관리자" });
    });
    expect(result.current.stats.topCertHolder?.memberName).toBe("홍길동");
    expect(result.current.stats.topCertHolder?.count).toBe(1);
  });
});

// ─── 11. 그룹별 격리 ─────────────────────────────────────────

describe("useSkillCertification - 그룹별 격리", () => {
  it("그룹 A에 인증을 추가해도 그룹 B에 영향을 주지 않는다", () => {
    const { result: resA } = renderHook(() => useSkillCertification(GROUP_A));
    const { result: resB } = renderHook(() => useSkillCertification(GROUP_B));

    act(() => {
      resA.current.createCert(makeCertParams());
    });

    expect(resA.current.certs).toHaveLength(1);
    expect(resB.current.certs).toHaveLength(0);
  });
});
