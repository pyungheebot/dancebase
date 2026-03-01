import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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

import { useDietTracker } from "@/hooks/use-diet-tracker";

const MEMBER_ID = "member-123";

beforeEach(() => {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
});

// ============================================================
// 초기 상태
// ============================================================

describe("useDietTracker - 초기 상태", () => {
  it("meals 초기값은 빈 배열이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.meals).toEqual([]);
  });

  it("waterLogs 초기값은 빈 배열이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.waterLogs).toEqual([]);
  });

  it("loading은 항상 false이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(typeof result.current.addMeal).toBe("function");
    expect(typeof result.current.updateMeal).toBe("function");
    expect(typeof result.current.deleteMeal).toBe("function");
    expect(typeof result.current.setWater).toBe("function");
    expect(typeof result.current.getDayLog).toBe("function");
    expect(typeof result.current.getWeeklyCalories).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats 초기 totalMeals는 0이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.stats.totalMeals).toBe(0);
  });

  it("stats 초기 averageCalories는 0이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.stats.averageCalories).toBe(0);
  });

  it("stats 초기 averageWaterCups는 0이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.stats.averageWaterCups).toBe(0);
  });

  it("stats 초기 weeklyMealCount는 0이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.stats.weeklyMealCount).toBe(0);
  });

  it("stats 구조에 모든 필드가 포함된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));
    expect(result.current.stats).toHaveProperty("totalMeals");
    expect(result.current.stats).toHaveProperty("averageCalories");
    expect(result.current.stats).toHaveProperty("averageWaterCups");
    expect(result.current.stats).toHaveProperty("weeklyMealCount");
  });
});

// ============================================================
// addMeal
// ============================================================

describe("useDietTracker - addMeal", () => {
  it("addMeal 호출 시 meals에 항목이 추가된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.addMeal({
        date: "2026-03-01",
        mealType: "breakfast",
        foods: ["밥", "국"],
        calories: 500,
      });
    });

    expect(result.current.meals).toHaveLength(1);
  });

  it("addMeal은 id가 포함된 DietTrackerMeal을 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({
        date: "2026-03-01",
        mealType: "lunch",
        foods: ["비빔밥"],
        calories: 600,
      });
    });

    expect(meal!.id).toBeTruthy();
  });

  it("addMeal로 추가된 항목의 date가 올바르다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({
        date: "2026-03-15",
        mealType: "dinner",
        foods: ["된장찌개"],
        calories: 400,
      });
    });

    expect(meal!.date).toBe("2026-03-15");
  });

  it("addMeal로 추가된 항목의 mealType이 올바르다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({
        date: "2026-03-15",
        mealType: "snack",
        foods: ["과자"],
        calories: 150,
      });
    });

    expect(meal!.mealType).toBe("snack");
  });

  it("두 번 addMeal 호출 시 meals가 2개가 된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "lunch", foods: ["국수"], calories: 500 });
    });

    expect(result.current.meals).toHaveLength(2);
  });

  it("세 번 addMeal 호출 시 meals가 3개가 된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "lunch", foods: ["면"], calories: 500 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "dinner", foods: ["고기"], calories: 700 });
    });

    expect(result.current.meals).toHaveLength(3);
  });

  it("addMeal로 추가된 항목의 foods가 올바르다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({
        date: "2026-03-01",
        mealType: "lunch",
        foods: ["삼겹살", "쌈채소"],
        calories: 800,
      });
    });

    expect(meal!.foods).toEqual(["삼겹살", "쌈채소"]);
  });

  it("stats.totalMeals는 addMeal 후 증가한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "lunch", foods: ["면"], calories: 400 });
    });

    expect(result.current.stats.totalMeals).toBe(2);
  });
});

// ============================================================
// updateMeal
// ============================================================

describe("useDietTracker - updateMeal", () => {
  it("updateMeal로 calories를 수정할 수 있다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });

    act(() => {
      result.current.updateMeal(meal!.id, { calories: 500 });
    });

    expect(result.current.meals[0].calories).toBe(500);
  });

  it("updateMeal은 수정 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });

    let success = false;
    act(() => {
      success = result.current.updateMeal(meal!.id, { calories: 400 });
    });

    expect(success).toBe(true);
  });

  it("존재하지 않는 id로 updateMeal 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let success = true;
    act(() => {
      success = result.current.updateMeal("nonexistent", { calories: 500 });
    });

    expect(success).toBe(false);
  });

  it("updateMeal로 mealType을 수정할 수 있다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });

    act(() => {
      result.current.updateMeal(meal!.id, { mealType: "brunch" });
    });

    expect(result.current.meals[0].mealType).toBe("brunch");
  });

  it("updateMeal은 id를 변경하지 않는다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });

    act(() => {
      result.current.updateMeal(meal!.id, { calories: 400 });
    });

    expect(result.current.meals[0].id).toBe(meal!.id);
  });
});

// ============================================================
// deleteMeal
// ============================================================

describe("useDietTracker - deleteMeal", () => {
  it("deleteMeal 호출 시 해당 식사가 제거된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });

    act(() => {
      result.current.deleteMeal(meal!.id);
    });

    expect(result.current.meals).toHaveLength(0);
  });

  it("deleteMeal은 삭제 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let meal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      meal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });

    let success = false;
    act(() => {
      success = result.current.deleteMeal(meal!.id);
    });

    expect(success).toBe(true);
  });

  it("존재하지 않는 id로 deleteMeal 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let success = true;
    act(() => {
      success = result.current.deleteMeal("nonexistent");
    });

    expect(success).toBe(false);
  });

  it("여러 식사 중 특정 식사만 삭제된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    let firstMeal: ReturnType<typeof result.current.addMeal> | undefined;
    act(() => {
      firstMeal = result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "lunch", foods: ["면"], calories: 500 });
    });

    act(() => {
      result.current.deleteMeal(firstMeal!.id);
    });

    expect(result.current.meals).toHaveLength(1);
    expect(result.current.meals[0].mealType).toBe("lunch");
  });
});

// ============================================================
// setWater
// ============================================================

describe("useDietTracker - setWater", () => {
  it("setWater 호출 시 waterLogs에 항목이 추가된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.setWater("2026-03-01", 8);
    });

    expect(result.current.waterLogs).toHaveLength(1);
  });

  it("setWater로 추가된 항목의 date와 cups가 올바르다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.setWater("2026-03-01", 6);
    });

    expect(result.current.waterLogs[0].date).toBe("2026-03-01");
    expect(result.current.waterLogs[0].cups).toBe(6);
  });

  it("같은 날짜에 setWater를 두 번 호출하면 cups가 업데이트된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.setWater("2026-03-01", 4);
    });

    act(() => {
      result.current.setWater("2026-03-01", 8);
    });

    expect(result.current.waterLogs).toHaveLength(1);
    expect(result.current.waterLogs[0].cups).toBe(8);
  });

  it("다른 날짜에 setWater 호출 시 새 항목이 추가된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.setWater("2026-03-01", 4);
    });
    act(() => {
      result.current.setWater("2026-03-02", 6);
    });

    expect(result.current.waterLogs).toHaveLength(2);
  });
});

// ============================================================
// getDayLog
// ============================================================

describe("useDietTracker - getDayLog", () => {
  it("getDayLog는 해당 날짜의 식사 목록을 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "lunch", foods: ["면"], calories: 500 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-02", mealType: "breakfast", foods: ["빵"], calories: 200 });
    });

    const log = result.current.getDayLog("2026-03-01");
    expect(log.meals).toHaveLength(2);
  });

  it("getDayLog는 해당 날짜의 수분 섭취를 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.setWater("2026-03-01", 7);
    });

    const log = result.current.getDayLog("2026-03-01");
    expect(log.water.cups).toBe(7);
  });

  it("수분 기록이 없으면 getDayLog의 water.cups는 0이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const log = result.current.getDayLog("2026-03-01");
    expect(log.water.cups).toBe(0);
  });

  it("getDayLog는 date 필드를 포함한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const log = result.current.getDayLog("2026-03-05");
    expect(log.date).toBe("2026-03-05");
  });

  it("getDayLog는 memberName 파라미터를 전달하면 반환 값에 포함한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const log = result.current.getDayLog("2026-03-01", "홍길동");
    expect(log.memberName).toBe("홍길동");
  });

  it("getDayLog에 memberName을 전달하지 않으면 빈 문자열이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const log = result.current.getDayLog("2026-03-01");
    expect(log.memberName).toBe("");
  });
});

// ============================================================
// getWeeklyCalories
// ============================================================

describe("useDietTracker - getWeeklyCalories", () => {
  it("getWeeklyCalories는 7개의 날짜 항목을 반환한다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const weekly = result.current.getWeeklyCalories();
    expect(weekly).toHaveLength(7);
  });

  it("식사가 없으면 모든 날짜의 calories는 0이다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const weekly = result.current.getWeeklyCalories();
    weekly.forEach((day) => {
      expect(day.calories).toBe(0);
    });
  });

  it("getWeeklyCalories 반환 항목에 date와 calories 필드가 있다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const weekly = result.current.getWeeklyCalories();
    weekly.forEach((item) => {
      expect(item).toHaveProperty("date");
      expect(item).toHaveProperty("calories");
    });
  });

  it("오늘 날짜 식사가 있으면 해당 날짜의 calories가 합산된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const today = new Date().toISOString().slice(0, 10);
    act(() => {
      result.current.addMeal({ date: today, mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: today, mealType: "lunch", foods: ["면"], calories: 400 });
    });

    const weekly = result.current.getWeeklyCalories();
    const todayEntry = weekly.find((d) => d.date === today);
    expect(todayEntry!.calories).toBe(700);
  });
});

// ============================================================
// stats
// ============================================================

describe("useDietTracker - stats", () => {
  it("칼로리가 있는 식사의 averageCalories가 올바르게 계산된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: "2026-03-01", mealType: "lunch", foods: ["면"], calories: 500 });
    });

    // (300 + 500) / 2 = 400
    expect(result.current.stats.averageCalories).toBe(400);
  });

  it("수분 기록이 있으면 averageWaterCups가 올바르게 계산된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    act(() => {
      result.current.setWater("2026-03-01", 6);
    });
    act(() => {
      result.current.setWater("2026-03-02", 8);
    });

    // (6 + 8) / 2 = 7.0
    expect(result.current.stats.averageWaterCups).toBe(7.0);
  });

  it("최근 7일 이내 식사는 weeklyMealCount에 포함된다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    const today = new Date().toISOString().slice(0, 10);
    act(() => {
      result.current.addMeal({ date: today, mealType: "breakfast", foods: ["밥"], calories: 300 });
    });
    act(() => {
      result.current.addMeal({ date: today, mealType: "lunch", foods: ["면"], calories: 400 });
    });

    expect(result.current.stats.weeklyMealCount).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// refetch
// ============================================================

describe("useDietTracker - refetch", () => {
  it("refetch 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useDietTracker(MEMBER_ID));

    expect(() => {
      act(() => {
        result.current.refetch();
      });
    }).not.toThrow();
  });

  it("빈 memberId로 refetch 호출 시 에러가 발생하지 않는다", () => {
    const { result } = renderHook(() => useDietTracker(""));

    expect(() => {
      act(() => {
        result.current.refetch();
      });
    }).not.toThrow();
  });
});
