import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState, useCallback } from "react";

// ============================================================
// 메모리 스토어 설정
// ============================================================

const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    if (memStore[key] !== undefined) return memStore[key] as T;
    return defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// SWR을 useState 기반으로 모킹: mutate(data, false) 시 즉시 state 업데이트
vi.mock("swr", () => ({
  default: vi.fn((key: string | null, fetcher: (() => unknown) | null) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState(() => {
      if (!key || !fetcher) return undefined;
      return fetcher();
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mutate = useCallback((updatedData?: unknown) => {
      if (updatedData !== undefined) {
        setData(updatedData as never);
      }
    }, []);

    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }

    return { data, isLoading: false, mutate };
  }),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    venueManagement: (projectId: string) => `venue-management-${projectId}`,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    VENUE: {
      ADDED: "공연장이 추가되었습니다",
      UPDATED: "공연장 정보가 수정되었습니다",
      DELETED: "공연장이 삭제되었습니다",
      NOT_FOUND: "공연장을 찾을 수 없습니다",
      NAME_REQUIRED: "공연장 이름을 입력해주세요",
    },
    INFO: {
      BOOKING_STATUS_CHANGED: "예약 상태가 변경되었습니다",
    },
  },
}));

import { useVenueManagement, createDefaultFacilities, type VenueMgmtVenueInput } from "@/hooks/use-venue-management";

const PROJECT_ID = "project-123";

// 기본 공연장 입력 데이터
function makeVenueInput(name = "테스트 공연장"): VenueMgmtVenueInput {
  return {
    name,
    address: "서울시 강남구",
    capacity: 200,
    stageSize: { width: 10, depth: 8 },
    facilities: createDefaultFacilities(),
    contact: { managerName: "김담당", phone: "010-1234-5678", email: "test@test.com" },
    rental: { fee: 500000, bookingStatus: "미확정", entryTime: "14:00", exitTime: "22:00" },
    stageMemo: "무대 메모",
    access: { transit: "지하철 2호선", parking: "주차 50대" },
  };
}

const STORAGE_KEY = `dancebase:venue-management:${PROJECT_ID}`;

beforeEach(() => {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  // 올바른 VenueMgmtData 기본값을 사전 설정
  memStore[STORAGE_KEY] = {
    projectId: PROJECT_ID,
    venues: [],
    updatedAt: new Date().toISOString(),
  };
  vi.clearAllMocks();
});

// ============================================================
// createDefaultFacilities
// ============================================================

describe("createDefaultFacilities", () => {
  it("기본 시설 목록을 반환한다", () => {
    const facilities = createDefaultFacilities();
    expect(facilities.length).toBeGreaterThan(0);
  });

  it("모든 시설의 available은 false이다", () => {
    const facilities = createDefaultFacilities();
    facilities.forEach((f) => {
      expect(f.available).toBe(false);
    });
  });

  it("반환된 시설에 id와 name 필드가 있다", () => {
    const facilities = createDefaultFacilities();
    facilities.forEach((f) => {
      expect(f).toHaveProperty("id");
      expect(f).toHaveProperty("name");
    });
  });

  it("기본 시설 수는 8개이다", () => {
    const facilities = createDefaultFacilities();
    expect(facilities).toHaveLength(8);
  });

  it("각 시설 id가 유일하다", () => {
    const facilities = createDefaultFacilities();
    const ids = facilities.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("음향시스템 시설이 포함된다", () => {
    const facilities = createDefaultFacilities();
    const audioFacility = facilities.find((f) => f.id === "audio");
    expect(audioFacility).toBeDefined();
    expect(audioFacility!.name).toBe("음향시스템");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useVenueManagement - 초기 상태", () => {
  it("venues 초기값은 빈 배열이다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));
    expect(result.current.venues).toEqual([]);
  });

  it("loading은 항상 false이다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));
    expect(typeof result.current.addVenue).toBe("function");
    expect(typeof result.current.updateVenue).toBe("function");
    expect(typeof result.current.deleteVenue).toBe("function");
    expect(typeof result.current.toggleFacility).toBe("function");
    expect(typeof result.current.updateBookingStatus).toBe("function");
  });
});

// ============================================================
// addVenue
// ============================================================

describe("useVenueManagement - addVenue", () => {
  it("addVenue는 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    let success = false;
    act(() => {
      success = result.current.addVenue(makeVenueInput());
    });

    expect(success).toBe(true);
  });

  it("name이 빈 문자열이면 addVenue는 false를 반환한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    let success = true;
    act(() => {
      success = result.current.addVenue(makeVenueInput(""));
    });

    expect(success).toBe(false);
  });

  it("name이 공백만 있으면 addVenue는 false를 반환한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    let success = true;
    act(() => {
      success = result.current.addVenue(makeVenueInput("   "));
    });

    expect(success).toBe(false);
  });

  it("addVenue 후 venues 길이가 1이 된다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput("공연장A"));
    });

    expect(result.current.venues).toHaveLength(1);
  });

  it("addVenue로 추가된 공연장의 name이 트림된 값이다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput("  세종문화회관  "));
    });

    expect(result.current.venues[0].name).toBe("세종문화회관");
  });

  it("addVenue로 추가된 공연장에 id가 존재한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    expect(result.current.venues[0].id).toBeTruthy();
  });

  it("addVenue로 추가된 공연장에 createdAt이 존재한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    expect(result.current.venues[0].createdAt).toBeTruthy();
  });

  it("두 번 addVenue 호출 시 venues가 2개가 된다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput("A 공연장"));
    });
    act(() => {
      result.current.addVenue(makeVenueInput("B 공연장"));
    });

    expect(result.current.venues).toHaveLength(2);
  });

  it("addVenue로 추가된 공연장의 address가 올바르다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    expect(result.current.venues[0].address).toBe("서울시 강남구");
  });

  it("addVenue로 추가된 공연장의 capacity가 올바르다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    expect(result.current.venues[0].capacity).toBe(200);
  });
});

// ============================================================
// updateVenue
// ============================================================

describe("useVenueManagement - updateVenue", () => {
  it("updateVenue는 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput("원본"));
    });

    const venueId = result.current.venues[0].id;

    let success = false;
    act(() => {
      success = result.current.updateVenue(venueId, makeVenueInput("수정된 이름"));
    });

    expect(success).toBe(true);
  });

  it("updateVenue로 name을 수정할 수 있다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput("원본 이름"));
    });

    const venueId = result.current.venues[0].id;

    act(() => {
      result.current.updateVenue(venueId, makeVenueInput("수정된 이름"));
    });

    expect(result.current.venues[0].name).toBe("수정된 이름");
  });

  it("name이 빈 문자열이면 updateVenue는 false를 반환한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;

    let success = true;
    act(() => {
      success = result.current.updateVenue(venueId, makeVenueInput(""));
    });

    expect(success).toBe(false);
  });

  it("존재하지 않는 id로 updateVenue 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    let success = true;
    act(() => {
      success = result.current.updateVenue("nonexistent", makeVenueInput("이름"));
    });

    expect(success).toBe(false);
  });

  it("updateVenue로 capacity를 수정할 수 있다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const updatedInput = { ...makeVenueInput(), capacity: 500 };

    act(() => {
      result.current.updateVenue(venueId, updatedInput);
    });

    expect(result.current.venues[0].capacity).toBe(500);
  });

  it("updateVenue 후 id는 변경되지 않는다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;

    act(() => {
      result.current.updateVenue(venueId, makeVenueInput("수정된 이름"));
    });

    expect(result.current.venues[0].id).toBe(venueId);
  });
});

// ============================================================
// deleteVenue
// ============================================================

describe("useVenueManagement - deleteVenue", () => {
  it("deleteVenue 호출 시 해당 공연장이 제거된다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;

    act(() => {
      result.current.deleteVenue(venueId);
    });

    expect(result.current.venues).toHaveLength(0);
  });

  it("여러 공연장 중 특정 공연장만 삭제된다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput("A 공연장"));
    });
    act(() => {
      result.current.addVenue(makeVenueInput("B 공연장"));
    });

    const firstId = result.current.venues[0].id;

    act(() => {
      result.current.deleteVenue(firstId);
    });

    expect(result.current.venues).toHaveLength(1);
    expect(result.current.venues[0].name).toBe("B 공연장");
  });

  it("존재하지 않는 id로 deleteVenue 호출 시 venues 길이가 변하지 않는다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    act(() => {
      result.current.deleteVenue("nonexistent");
    });

    expect(result.current.venues).toHaveLength(1);
  });
});

// ============================================================
// toggleFacility
// ============================================================

describe("useVenueManagement - toggleFacility", () => {
  it("toggleFacility 호출 시 해당 시설의 available이 토글된다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const facilityId = result.current.venues[0].facilities[0].id;
    const initialAvailable = result.current.venues[0].facilities[0].available;

    act(() => {
      result.current.toggleFacility(venueId, facilityId);
    });

    expect(result.current.venues[0].facilities[0].available).toBe(!initialAvailable);
  });

  it("toggleFacility를 두 번 호출하면 원래 상태로 돌아온다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const facilityId = result.current.venues[0].facilities[0].id;
    const initialAvailable = result.current.venues[0].facilities[0].available;

    act(() => {
      result.current.toggleFacility(venueId, facilityId);
    });
    act(() => {
      result.current.toggleFacility(venueId, facilityId);
    });

    expect(result.current.venues[0].facilities[0].available).toBe(initialAvailable);
  });

  it("toggleFacility는 다른 시설의 available에 영향을 주지 않는다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const firstFacilityId = result.current.venues[0].facilities[0].id;
    const secondFacilityAvailable = result.current.venues[0].facilities[1].available;

    act(() => {
      result.current.toggleFacility(venueId, firstFacilityId);
    });

    expect(result.current.venues[0].facilities[1].available).toBe(secondFacilityAvailable);
  });

  it("존재하지 않는 venueId로 toggleFacility 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const facilityId = result.current.venues[0].facilities[0].id;

    expect(() => {
      act(() => {
        result.current.toggleFacility("nonexistent-venue", facilityId);
      });
    }).not.toThrow();
  });

  it("toggleFacility 후 해당 시설의 updatedAt이 갱신된다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const facilityId = result.current.venues[0].facilities[0].id;

    act(() => {
      result.current.toggleFacility(venueId, facilityId);
    });

    // 공연장의 updatedAt이 갱신되었는지 확인
    expect(result.current.venues[0].updatedAt).toBeTruthy();
  });
});

// ============================================================
// updateBookingStatus
// ============================================================

describe("useVenueManagement - updateBookingStatus", () => {
  it("updateBookingStatus로 예약 상태를 확정으로 변경할 수 있다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;

    act(() => {
      result.current.updateBookingStatus(venueId, "확정");
    });

    expect(result.current.venues[0].rental.bookingStatus).toBe("확정");
  });

  it("updateBookingStatus로 예약 상태를 취소로 변경할 수 있다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;

    act(() => {
      result.current.updateBookingStatus(venueId, "취소");
    });

    expect(result.current.venues[0].rental.bookingStatus).toBe("취소");
  });

  it("updateBookingStatus로 예약 상태를 다시 미확정으로 변경할 수 있다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;

    act(() => {
      result.current.updateBookingStatus(venueId, "확정");
    });

    act(() => {
      result.current.updateBookingStatus(venueId, "미확정");
    });

    expect(result.current.venues[0].rental.bookingStatus).toBe("미확정");
  });

  it("updateBookingStatus는 다른 rental 필드를 변경하지 않는다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const originalFee = result.current.venues[0].rental.fee;

    act(() => {
      result.current.updateBookingStatus(venueId, "확정");
    });

    expect(result.current.venues[0].rental.fee).toBe(originalFee);
  });

  it("updateBookingStatus는 다른 rental entryTime을 변경하지 않는다", () => {
    const { result } = renderHook(() => useVenueManagement(PROJECT_ID));

    act(() => {
      result.current.addVenue(makeVenueInput());
    });

    const venueId = result.current.venues[0].id;
    const originalEntryTime = result.current.venues[0].rental.entryTime;

    act(() => {
      result.current.updateBookingStatus(venueId, "확정");
    });

    expect(result.current.venues[0].rental.entryTime).toBe(originalEntryTime);
  });
});
