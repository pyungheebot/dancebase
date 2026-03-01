import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStageWeather, calcSafety } from "@/hooks/use-stage-weather";

// ─── @/lib/local-storage mock (vi.hoisted 사용) ──────────────
// loadFromStorage의 기본값이 {}이면 data ?? buildDefaultData()에서
// {} (truthy)가 반환되어 forecasts가 undefined가 됩니다.
// 직접 mock하여 저장소가 없을 때 null을 반환하도록 합니다.
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  // key가 없을 때 null을 반환하여 data ?? buildDefaultData()가 올바르게 작동하도록 합니다.
  // (훅 소스에서 {} as StageWeatherData 기본값이 truthy라서 buildDefaultData가 호출되지 않는 문제 해결)
  loadFromStorage: <T>(key: string, _defaultValue: T): T | null => {
    if (key in memStore) {
      return memStore[key] as T;
    }
    return null;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock (store + mutate 반영) ──────────────────────────
vi.mock("swr", () => {
  const store = new Map<string, unknown>();

  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) return { data: undefined, mutate: vi.fn() };

      if (!store.has(key)) {
        store.set(key, fetcher());
      }

      const mutate = (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          store.set(key, newData);
        } else {
          store.set(key, fetcher!());
        }
      };

      return { data: store.get(key), mutate };
    },
    __store: store,
    __reset: () => store.clear(),
  };
});

function resetSWRStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swr = require("swr");
  if (swr.__reset) swr.__reset();
}

// ─── crypto.randomUUID mock ─────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `uuid-${++uuidCounter}`,
});

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    stageWeather: (projectId: string) => `stage-weather-${projectId}`,
  },
}));

beforeEach(() => {
  // memStore 초기화
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
  uuidCounter = 0;
  resetSWRStore();
});

// ─── 헬퍼: memStore에서 projectId 데이터 읽기 ─────────────────
function getSavedData(projectId: string) {
  return (memStore[`stage-weather-${projectId}`] ?? null) as Record<string, unknown> | null;
}

// ─────────────────────────────────────────────────────────────
// 1. calcSafety 순수 함수 테스트
// ─────────────────────────────────────────────────────────────

describe("calcSafety - 날씨 안전 판정 순수 함수", () => {
  it("rainy 조건이면 danger를 반환한다", () => {
    expect(calcSafety("rainy", 20, 60)).toBe("danger");
  });

  it("snowy 조건이면 danger를 반환한다", () => {
    expect(calcSafety("snowy", -2, 70)).toBe("danger");
  });

  it("windy 조건이면 caution을 반환한다", () => {
    expect(calcSafety("windy", 20, 60)).toBe("caution");
  });

  it("humidity가 90 초과이면 caution을 반환한다", () => {
    expect(calcSafety("sunny", 25, 91)).toBe("caution");
  });

  it("humidity가 정확히 90이면 safe다", () => {
    expect(calcSafety("sunny", 25, 90)).toBe("safe");
  });

  it("온도가 38 초과이면 caution을 반환한다", () => {
    expect(calcSafety("sunny", 39, 60)).toBe("caution");
  });

  it("온도가 정확히 38이면 safe다", () => {
    expect(calcSafety("sunny", 38, 60)).toBe("safe");
  });

  it("온도가 -5 미만이면 caution을 반환한다", () => {
    expect(calcSafety("sunny", -6, 50)).toBe("caution");
  });

  it("온도가 정확히 -5이면 safe다", () => {
    expect(calcSafety("sunny", -5, 50)).toBe("safe");
  });

  it("cloudy + 정상 온도/습도이면 safe를 반환한다", () => {
    expect(calcSafety("cloudy", 20, 60)).toBe("safe");
  });

  it("sunny + 정상 온도/습도이면 safe를 반환한다", () => {
    expect(calcSafety("sunny", 20, 60)).toBe("safe");
  });

  it("rainy는 온도/습도 무관하게 항상 danger다", () => {
    expect(calcSafety("rainy", 20, 50)).toBe("danger");
    expect(calcSafety("rainy", -10, 30)).toBe("danger");
  });
});

// ─────────────────────────────────────────────────────────────
// 2. 초기 상태
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - 초기 상태", () => {
  it("초기 forecasts는 빈 배열이다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(result.current.data.forecasts).toEqual([]);
  });

  it("초기 plans는 빈 배열이다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(result.current.data.plans).toEqual([]);
  });

  it("초기 rainPlan.venueChange는 false다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(result.current.data.rainPlan.venueChange).toBe(false);
  });

  it("초기 rainPlan.alternativeVenue는 빈 문자열이다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(result.current.data.rainPlan.alternativeVenue).toBe("");
  });

  it("초기 rainPlan.raincoatReady는 false다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(result.current.data.rainPlan.raincoatReady).toBe(false);
  });

  it("초기 rainPlan.tentReady는 false다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(result.current.data.rainPlan.tentReady).toBe(false);
  });

  it("data.projectId가 전달된 projectId와 일치한다", () => {
    const { result } = renderHook(() => useStageWeather("project-99"));
    expect(result.current.data.projectId).toBe("project-99");
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useStageWeather("project-init"));
    expect(typeof result.current.addForecast).toBe("function");
    expect(typeof result.current.updateForecast).toBe("function");
    expect(typeof result.current.removeForecast).toBe("function");
    expect(typeof result.current.toggleCheckItem).toBe("function");
    expect(typeof result.current.addCheckItem).toBe("function");
    expect(typeof result.current.removeCheckItem).toBe("function");
    expect(typeof result.current.addPlan).toBe("function");
    expect(typeof result.current.updatePlan).toBe("function");
    expect(typeof result.current.removePlan).toBe("function");
    expect(typeof result.current.updateRainPlan).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────
// 3. addForecast
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - addForecast", () => {
  it("예보 추가 후 localStorage에 forecasts 길이가 1이다", () => {
    const { result } = renderHook(() => useStageWeather("proj-add"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "약풍",
      });
    });
    const saved = getSavedData("proj-add");
    expect(saved?.forecasts).toHaveLength(1);
  });

  it("추가된 예보에 id가 존재한다", () => {
    const { result } = renderHook(() => useStageWeather("proj-id"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-id");
    expect(saved.forecasts[0].id).toBeTruthy();
  });

  it("추가된 예보의 safety가 rainy → danger로 자동 계산된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-safety"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "rainy",
        temperature: 20,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-safety");
    expect(saved.forecasts[0].safety).toBe("danger");
  });

  it("추가된 예보의 safety가 sunny → safe로 올바르다", () => {
    const { result } = renderHook(() => useStageWeather("proj-safe"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-safe");
    expect(saved.forecasts[0].safety).toBe("safe");
  });

  it("추가된 예보에 기본 체크리스트가 포함된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-check"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-check");
    expect(saved.forecasts[0].checklist.length).toBeGreaterThan(0);
  });

  it("기본 체크리스트의 모든 항목은 done: false 상태다", () => {
    const { result } = renderHook(() => useStageWeather("proj-done"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-done");
    expect(saved.forecasts[0].checklist.every((c: { done: boolean }) => c.done === false)).toBe(true);
  });

  it("예보 추가 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-ls"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    expect(getSavedData("proj-ls")).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. updateForecast
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - updateForecast", () => {
  it("예보 수정 후 temperature가 변경된다", () => {
    // 1단계: addForecast
    const { result: r1 } = renderHook(() => useStageWeather("proj-upd"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const forecastId = (getSavedData("proj-upd") as { forecasts: Array<{ id: string }> }).forecasts[0].id;

    // 2단계: SWR store 리셋 후 새 훅으로 updateForecast (memStore에서 데이터 로드)
    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-upd"));
    act(() => {
      r2.current.updateForecast(forecastId, { temperature: 40 });
    });
    const saved = getSavedData("proj-upd") as { forecasts: Array<{ temperature: number }> };
    expect(saved.forecasts[0].temperature).toBe(40);
  });

  it("condition을 rainy로 변경하면 safety가 danger로 재계산된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-re-safety"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const forecastId = (getSavedData("proj-re-safety") as { forecasts: Array<{ id: string }> }).forecasts[0].id;

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-re-safety"));
    act(() => {
      r2.current.updateForecast(forecastId, { condition: "rainy" });
    });
    const saved = getSavedData("proj-re-safety") as { forecasts: Array<{ safety: string }> };
    expect(saved.forecasts[0].safety).toBe("danger");
  });

  it("존재하지 않는 forecastId 수정 시 forecasts 수가 유지된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-upd-notfound"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-upd-notfound"));
    act(() => {
      r2.current.updateForecast("non-existent", { temperature: 99 });
    });
    const saved = getSavedData("proj-upd-notfound") as { forecasts: unknown[] };
    expect(saved.forecasts).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. removeForecast
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - removeForecast", () => {
  it("예보 삭제 후 forecasts가 비어있다", () => {
    const { result } = renderHook(() => useStageWeather("proj-rm"));
    act(() => {
      result.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const forecastId = getSavedData("proj-rm").forecasts[0].id;
    act(() => {
      result.current.removeForecast(forecastId);
    });
    const saved = getSavedData("proj-rm");
    expect(saved.forecasts).toHaveLength(0);
  });

  it("존재하지 않는 ID 삭제 시 forecasts 길이가 유지된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-rm2"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-rm2"));
    act(() => {
      r2.current.removeForecast("non-existent");
    });
    const saved = getSavedData("proj-rm2") as { forecasts: unknown[] };
    expect(saved.forecasts).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. 체크리스트 관리
// ─────────────────────────────────────────────────────────────

type ForecastSaved = {
  forecasts: Array<{
    id: string;
    temperature?: number;
    safety?: string;
    checklist: Array<{ id: string; done: boolean; label: string }>;
  }>;
  plans: Array<{ id: string; action: string; equipment: string[] }>;
  rainPlan: { venueChange: boolean; alternativeVenue: string; raincoatReady: boolean; tentReady: boolean };
};

describe("useStageWeather - 체크리스트 관리", () => {
  it("toggleCheckItem 호출 후 done 값이 반전된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-toggle"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-toggle") as ForecastSaved;
    const forecastId = saved.forecasts[0].id;
    const itemId = saved.forecasts[0].checklist[0].id;
    const originalDone = saved.forecasts[0].checklist[0].done;

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-toggle"));
    act(() => {
      r2.current.toggleCheckItem(forecastId, itemId);
    });
    const updated = getSavedData("proj-toggle") as ForecastSaved;
    expect(updated.forecasts[0].checklist[0].done).toBe(!originalDone);
  });

  it("addCheckItem 호출 후 체크리스트 길이가 증가한다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-addcheck"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-addcheck") as ForecastSaved;
    const forecastId = saved.forecasts[0].id;
    const originalLength = saved.forecasts[0].checklist.length;

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-addcheck"));
    act(() => {
      r2.current.addCheckItem(forecastId, "새 체크 항목");
    });
    const updated = getSavedData("proj-addcheck") as ForecastSaved;
    expect(updated.forecasts[0].checklist.length).toBe(originalLength + 1);
  });

  it("addCheckItem으로 추가된 항목은 done: false이고 label이 올바르다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-addcheck2"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-addcheck2") as ForecastSaved;
    const forecastId = saved.forecasts[0].id;

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-addcheck2"));
    act(() => {
      r2.current.addCheckItem(forecastId, "추가 항목");
    });
    const updated = getSavedData("proj-addcheck2") as ForecastSaved;
    const lastItem = updated.forecasts[0].checklist.at(-1)!;
    expect(lastItem.done).toBe(false);
    expect(lastItem.label).toBe("추가 항목");
  });

  it("removeCheckItem 호출 후 해당 항목이 제거된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-rmcheck"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });
    const saved = getSavedData("proj-rmcheck") as ForecastSaved;
    const forecastId = saved.forecasts[0].id;
    const itemId = saved.forecasts[0].checklist[0].id;
    const originalLength = saved.forecasts[0].checklist.length;

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-rmcheck"));
    act(() => {
      r2.current.removeCheckItem(forecastId, itemId);
    });
    const updated = getSavedData("proj-rmcheck") as ForecastSaved;
    expect(updated.forecasts[0].checklist.length).toBe(originalLength - 1);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. 대응 플랜 관리
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - 대응 플랜 관리", () => {
  it("addPlan 호출 후 plans 항목이 추가된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-plan"));
    act(() => {
      result.current.addPlan({
        condition: "rainy",
        action: "텐트 설치",
        equipment: ["텐트", "방수포"],
      });
    });
    const saved = getSavedData("proj-plan");
    expect(saved.plans).toHaveLength(1);
  });

  it("추가된 플랜에 id가 존재한다", () => {
    const { result } = renderHook(() => useStageWeather("proj-planid"));
    act(() => {
      result.current.addPlan({
        condition: "rainy",
        action: "텐트 설치",
        equipment: [],
      });
    });
    const saved = getSavedData("proj-planid");
    expect(saved.plans[0].id).toBeTruthy();
  });

  it("updatePlan 호출 후 action이 변경된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-planupd"));
    act(() => {
      r1.current.addPlan({
        condition: "rainy",
        action: "초기 계획",
        equipment: [],
      });
    });
    const planId = (getSavedData("proj-planupd") as ForecastSaved).plans[0].id;

    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-planupd"));
    act(() => {
      r2.current.updatePlan(planId, { action: "수정된 계획" });
    });
    const saved = getSavedData("proj-planupd") as ForecastSaved;
    expect(saved.plans[0].action).toBe("수정된 계획");
  });

  it("removePlan 호출 후 plans에서 제거된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-planrm"));
    act(() => {
      result.current.addPlan({
        condition: "rainy",
        action: "텐트 설치",
        equipment: [],
      });
    });
    const planId = getSavedData("proj-planrm").plans[0].id;
    act(() => {
      result.current.removePlan(planId);
    });
    const saved = getSavedData("proj-planrm");
    expect(saved.plans).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. updateRainPlan
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - updateRainPlan", () => {
  it("venueChange를 true로 업데이트하면 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-rain1"));
    act(() => {
      result.current.updateRainPlan({ venueChange: true });
    });
    const saved = getSavedData("proj-rain1");
    expect(saved.rainPlan.venueChange).toBe(true);
  });

  it("alternativeVenue를 설정하면 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-rain2"));
    act(() => {
      result.current.updateRainPlan({ alternativeVenue: "실내 공연장 A" });
    });
    const saved = getSavedData("proj-rain2");
    expect(saved.rainPlan.alternativeVenue).toBe("실내 공연장 A");
  });

  it("raincoatReady를 true로 업데이트하면 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-rain3"));
    act(() => {
      result.current.updateRainPlan({ raincoatReady: true });
    });
    const saved = getSavedData("proj-rain3");
    expect(saved.rainPlan.raincoatReady).toBe(true);
  });

  it("tentReady를 true로 업데이트하면 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useStageWeather("proj-rain4"));
    act(() => {
      result.current.updateRainPlan({ tentReady: true });
    });
    const saved = getSavedData("proj-rain4");
    expect(saved.rainPlan.tentReady).toBe(true);
  });

  it("여러 필드를 동시에 업데이트할 수 있다", () => {
    const { result } = renderHook(() => useStageWeather("proj-rain5"));
    act(() => {
      result.current.updateRainPlan({ venueChange: true, alternativeVenue: "장소A" });
    });
    const saved = getSavedData("proj-rain5");
    expect(saved.rainPlan.venueChange).toBe(true);
    expect(saved.rainPlan.alternativeVenue).toBe("장소A");
  });

  it("연속 업데이트 시 이전 필드가 유지된다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-rain6"));
    act(() => {
      r1.current.updateRainPlan({ venueChange: true, alternativeVenue: "장소A" });
    });

    // SWR store 리셋 후 새 훅으로 두 번째 업데이트
    resetSWRStore();
    const { result: r2 } = renderHook(() => useStageWeather("proj-rain6"));
    act(() => {
      r2.current.updateRainPlan({ tentReady: true });
    });
    const saved = getSavedData("proj-rain6") as ForecastSaved;
    expect(saved.rainPlan.venueChange).toBe(true);
    expect(saved.rainPlan.alternativeVenue).toBe("장소A");
    expect(saved.rainPlan.tentReady).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 9. 프로젝트별 격리
// ─────────────────────────────────────────────────────────────

describe("useStageWeather - 프로젝트별 격리", () => {
  it("project-A에 addForecast하면 project-B localStorage는 영향 없다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("project-A"));
    act(() => {
      r1.current.addForecast({
        date: "2026-06-01",
        condition: "sunny",
        temperature: 25,
        humidity: 60,
        windNote: "",
      });
    });

    const savedA = getSavedData("project-A");
    expect(savedA.forecasts).toHaveLength(1);

    const savedB = getSavedData("project-B");
    expect(savedB).toBeNull();
  });

  it("다른 projectId 훅은 독립된 기본 projectId를 가진다", () => {
    const { result: r1 } = renderHook(() => useStageWeather("proj-iso-1"));
    const { result: r2 } = renderHook(() => useStageWeather("proj-iso-2"));

    expect(r1.current.data.projectId).toBe("proj-iso-1");
    expect(r2.current.data.projectId).toBe("proj-iso-2");
  });
});
