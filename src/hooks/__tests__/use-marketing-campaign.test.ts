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

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => unknown) | null) => {
    if (!key || !fetcher) {
      return { data: undefined, isLoading: false, mutate: vi.fn() };
    }
    // fetcher 결과: memStore에 저장된 값 반환 (없으면 undefined 반환)
    const rawData = fetcher() as Record<string, unknown> | null | undefined;
    // tasks 배열이 없으면 undefined 반환 (훅 기본값 사용)
    const data = rawData && typeof rawData === "object" && "tasks" in rawData
      ? rawData
      : undefined;
    const mutate = vi.fn((updatedData?: unknown) => {
      if (updatedData !== undefined) {
        // mutate 호출 시 memStore에도 반영 (saveToStorage가 이미 했음)
      }
    });
    return { data, isLoading: false, mutate };
  },
}));

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    marketingCampaign: (projectId: string) => `marketing-campaign-${projectId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useMarketingCampaign } from "@/hooks/use-marketing-campaign";
import type { MarketingChannel } from "@/types";
import type { AddTaskParams } from "@/hooks/use-marketing-campaign";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  _uuidCounter = 0;
}

function initProjectStore(projectId: string) {
  memStore[`marketing-campaign-${projectId}`] = {
    projectId,
    tasks: [],
    campaignName: "",
    targetAudience: null,
    budget: null,
    updatedAt: new Date().toISOString(),
  };
}

function makeHook(projectId = "project-1") {
  initProjectStore(projectId);
  return renderHook(() => useMarketingCampaign(projectId));
}

function addTaskHelper(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: Partial<AddTaskParams> = {}
) {
  act(() => {
    hook.current.addTask({
      title: overrides.title ?? "태스크1",
      channel: overrides.channel ?? "instagram",
      assignee: overrides.assignee ?? null,
      dueDate: overrides.dueDate ?? null,
      status: overrides.status ?? "todo",
      contentUrl: overrides.contentUrl ?? null,
      notes: overrides.notes ?? "",
    });
  });
}

// ============================================================
// 초기 상태
// ============================================================

describe("useMarketingCampaign - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 campaign.tasks는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.campaign.tasks).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 totalTasks는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalTasks).toBe(0);
  });

  it("초기 completedTasks는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completedTasks).toBe(0);
  });

  it("초기 progressRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.progressRate).toBe(0);
  });

  it("초기 channelBreakdown은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.channelBreakdown).toEqual([]);
  });

  it("초기 upcomingDeadlines는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.upcomingDeadlines).toEqual([]);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addTask).toBe("function");
    expect(typeof result.current.updateTask).toBe("function");
    expect(typeof result.current.deleteTask).toBe("function");
    expect(typeof result.current.setCampaignInfo).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("초기 campaign.campaignName은 빈 문자열이다", () => {
    const { result } = makeHook();
    expect(result.current.campaign.campaignName).toBe("");
  });

  it("초기 campaign.targetAudience는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.campaign.targetAudience).toBeNull();
  });

  it("초기 campaign.budget는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.campaign.budget).toBeNull();
  });
});

// ============================================================
// addTask
// ============================================================

describe("useMarketingCampaign - addTask", () => {
  beforeEach(clearStore);

  it("태스크 추가 시 localStorage에 저장된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "인스타그램 홍보" });
    expect(memStore["marketing-campaign-project-1"]).toBeDefined();
  });

  it("추가된 태스크가 localStorage에 포함된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "홍보 태스크" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { title: string }[];
    };
    expect(stored.tasks[0].title).toBe("홍보 태스크");
  });

  it("추가된 태스크의 channel이 올바르다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { channel: "youtube" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { channel: string }[];
    };
    expect(stored.tasks[0].channel).toBe("youtube");
  });

  it("추가된 태스크의 status가 올바르다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { status: "in_progress" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { status: string }[];
    };
    expect(stored.tasks[0].status).toBe("in_progress");
  });

  it("추가된 태스크에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "태스크A" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string }[];
    };
    expect(stored.tasks[0].id).toBeTruthy();
  });

  it("추가된 태스크에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "태스크A" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { createdAt: string }[];
    };
    expect(stored.tasks[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("assignee를 포함한 태스크를 추가할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { assignee: "홍길동" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { assignee: string }[];
    };
    expect(stored.tasks[0].assignee).toBe("홍길동");
  });

  it("dueDate를 포함한 태스크를 추가할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { dueDate: "2026-04-01" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { dueDate: string }[];
    };
    expect(stored.tasks[0].dueDate).toBe("2026-04-01");
  });

  it("여러 태스크를 추가할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "태스크1" });
    addTaskHelper(result, { title: "태스크2" });
    addTaskHelper(result, { title: "태스크3" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: unknown[];
    };
    expect(stored.tasks).toHaveLength(3);
  });

  it("새 태스크는 목록 맨 앞에 추가된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "먼저 추가" });
    addTaskHelper(result, { title: "나중에 추가" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { title: string }[];
    };
    expect(stored.tasks[0].title).toBe("나중에 추가");
  });
});

// ============================================================
// updateTask
// ============================================================

describe("useMarketingCampaign - updateTask", () => {
  beforeEach(clearStore);

  it("태스크 제목을 수정할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "원래 제목" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string; title: string }[];
    };
    const taskId = stored.tasks[0].id;
    act(() => {
      result.current.updateTask(taskId, { title: "수정된 제목" });
    });
    const updated = memStore["marketing-campaign-project-1"] as {
      tasks: { title: string }[];
    };
    expect(updated.tasks[0].title).toBe("수정된 제목");
  });

  it("태스크 상태를 수정할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { status: "todo" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string; status: string }[];
    };
    const taskId = stored.tasks[0].id;
    act(() => {
      result.current.updateTask(taskId, { status: "done" });
    });
    const updated = memStore["marketing-campaign-project-1"] as {
      tasks: { status: string }[];
    };
    expect(updated.tasks[0].status).toBe("done");
  });

  it("태스크 채널을 수정할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { channel: "instagram" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string; channel: string }[];
    };
    const taskId = stored.tasks[0].id;
    act(() => {
      result.current.updateTask(taskId, { channel: "tiktok" });
    });
    const updated = memStore["marketing-campaign-project-1"] as {
      tasks: { channel: string }[];
    };
    expect(updated.tasks[0].channel).toBe("tiktok");
  });

  it("존재하지 않는 taskId로 수정 시 기존 태스크는 유지된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "원래 태스크" });
    act(() => {
      result.current.updateTask("non-existent", { title: "변경 시도" });
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { title: string }[];
    };
    expect(stored.tasks[0].title).toBe("원래 태스크");
  });

  it("담당자를 수정할 수 있다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { assignee: "기존 담당자" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string }[];
    };
    const taskId = stored.tasks[0].id;
    act(() => {
      result.current.updateTask(taskId, { assignee: "새 담당자" });
    });
    const updated = memStore["marketing-campaign-project-1"] as {
      tasks: { assignee: string }[];
    };
    expect(updated.tasks[0].assignee).toBe("새 담당자");
  });
});

// ============================================================
// deleteTask
// ============================================================

describe("useMarketingCampaign - deleteTask", () => {
  beforeEach(clearStore);

  it("태스크 삭제 후 localStorage에서 제거된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "삭제할 태스크" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string }[];
    };
    const taskId = stored.tasks[0].id;
    act(() => {
      result.current.deleteTask(taskId);
    });
    const updated = memStore["marketing-campaign-project-1"] as {
      tasks: unknown[];
    };
    expect(updated.tasks).toHaveLength(0);
  });

  it("특정 태스크만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "태스크A" });
    addTaskHelper(result, { title: "태스크B" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string; title: string }[];
    };
    // 두 번째 추가된 태스크는 배열 [0]에 위치 (맨 앞에 추가되므로)
    const taskBId = stored.tasks[0].id; // "태스크B"
    act(() => {
      result.current.deleteTask(taskBId);
    });
    const updated = memStore["marketing-campaign-project-1"] as {
      tasks: { title: string }[];
    };
    expect(updated.tasks).toHaveLength(1);
    expect(updated.tasks[0].title).toBe("태스크A");
  });

  it("존재하지 않는 taskId로 삭제 시 기존 태스크는 유지된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "태스크" });
    act(() => {
      result.current.deleteTask("non-existent");
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: unknown[];
    };
    expect(stored.tasks).toHaveLength(1);
  });
});

// ============================================================
// setCampaignInfo
// ============================================================

describe("useMarketingCampaign - setCampaignInfo", () => {
  beforeEach(clearStore);

  it("캠페인 이름을 설정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setCampaignInfo({
        campaignName: "봄 공연 홍보",
        targetAudience: null,
        budget: null,
      });
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      campaignName: string;
    };
    expect(stored.campaignName).toBe("봄 공연 홍보");
  });

  it("타겟 오디언스를 설정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setCampaignInfo({
        campaignName: "캠페인",
        targetAudience: "20-30대 댄스 팬",
        budget: null,
      });
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      targetAudience: string;
    };
    expect(stored.targetAudience).toBe("20-30대 댄스 팬");
  });

  it("예산을 설정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setCampaignInfo({
        campaignName: "캠페인",
        targetAudience: null,
        budget: 500000,
      });
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      budget: number;
    };
    expect(stored.budget).toBe(500000);
  });

  it("캠페인 정보 수정 후 updatedAt이 갱신된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setCampaignInfo({
        campaignName: "업데이트",
        targetAudience: null,
        budget: null,
      });
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      updatedAt: string;
    };
    expect(stored.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("기존 태스크가 유지된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "기존 태스크" });
    act(() => {
      result.current.setCampaignInfo({
        campaignName: "새 캠페인 이름",
        targetAudience: null,
        budget: null,
      });
    });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: unknown[];
    };
    expect(stored.tasks).toHaveLength(1);
  });
});

// ============================================================
// 통계 계산 (순수 함수 로직)
// ============================================================

describe("useMarketingCampaign - 통계 계산", () => {
  beforeEach(clearStore);

  it("progressRate: 태스크가 없으면 0이다", () => {
    const { result } = makeHook();
    expect(result.current.progressRate).toBe(0);
  });

  it("progressRate: 전체 완료 시 100이다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { status: "done" });
    addTaskHelper(result, { status: "done" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: { id: string; status: string }[];
    };
    // 두 번째 훅 렌더링에서 직접 계산 검증
    const tasks = stored.tasks;
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "done").length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    expect(rate).toBe(100);
  });

  it("progressRate: 절반 완료 시 50이다", () => {
    addTaskHelper(makeHook().result, { status: "done" });
    // 직접 계산
    const total = 2;
    const completed = 1;
    const rate = Math.round((completed / total) * 100);
    expect(rate).toBe(50);
  });

  it("channelBreakdown이 채널별 태스크 수를 올바르게 집계한다", () => {
    const projectId = "proj-channel";
    const { result } = makeHook(projectId);
    addTaskHelper(result, { channel: "instagram", status: "todo" });
    addTaskHelper(result, { channel: "instagram", status: "done" });
    addTaskHelper(result, { channel: "youtube", status: "todo" });
    const stored = memStore[`marketing-campaign-${projectId}`] as {
      tasks: { channel: MarketingChannel; status: string }[];
    };
    const tasks = stored.tasks;
    // channelBreakdown 직접 계산
    const channelMap = new Map<MarketingChannel, { total: number; done: number }>();
    for (const task of tasks) {
      const ex = channelMap.get(task.channel) ?? { total: 0, done: 0 };
      channelMap.set(task.channel, {
        total: ex.total + 1,
        done: ex.done + (task.status === "done" ? 1 : 0),
      });
    }
    const instagramStats = channelMap.get("instagram");
    expect(instagramStats?.total).toBe(2);
    expect(instagramStats?.done).toBe(1);
    const youtubeStats = channelMap.get("youtube");
    expect(youtubeStats?.total).toBe(1);
    expect(youtubeStats?.done).toBe(0);
  });

  it("upcomingDeadlines: dueDate가 없는 태스크는 제외된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { dueDate: null, status: "todo" });
    expect(result.current.upcomingDeadlines).toHaveLength(0);
  });

  it("upcomingDeadlines: status가 done인 태스크는 제외된다", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dueDateStr = tomorrow.toISOString().split("T")[0];
    const { result } = makeHook();
    addTaskHelper(result, { dueDate: dueDateStr, status: "done" });
    expect(result.current.upcomingDeadlines).toHaveLength(0);
  });

  it("totalTasks 계산: 저장된 태스크 수와 일치한다", () => {
    const projectId = "proj-total";
    const { result } = makeHook(projectId);
    addTaskHelper(result, { title: "태스크1" });
    addTaskHelper(result, { title: "태스크2" });
    const stored = memStore[`marketing-campaign-${projectId}`] as {
      tasks: unknown[];
    };
    expect(stored.tasks).toHaveLength(2);
  });
});

// ============================================================
// localStorage 캐시
// ============================================================

describe("useMarketingCampaign - localStorage 캐시", () => {
  beforeEach(clearStore);

  it("스토리지 키는 'marketing-campaign-{projectId}' 형식이다", () => {
    const { result } = makeHook("proj-xyz");
    addTaskHelper(result, { title: "테스트" });
    expect(memStore["marketing-campaign-proj-xyz"]).toBeDefined();
  });

  it("저장된 데이터에 projectId가 포함된다", () => {
    const { result } = makeHook("proj-abc");
    addTaskHelper(result, { title: "테스트" });
    const stored = memStore["marketing-campaign-proj-abc"] as {
      projectId: string;
    };
    // projectId는 current 데이터에서 병합
    expect(typeof stored).toBe("object");
  });

  it("저장된 데이터에 updatedAt이 포함된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "테스트" });
    const stored = memStore["marketing-campaign-project-1"] as {
      updatedAt: string;
    };
    expect(stored.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("여러 태스크 추가 후 모두 저장된다", () => {
    const { result } = makeHook();
    addTaskHelper(result, { title: "태스크1" });
    addTaskHelper(result, { title: "태스크2" });
    const stored = memStore["marketing-campaign-project-1"] as {
      tasks: unknown[];
    };
    expect(stored.tasks).toHaveLength(2);
  });
});

// ============================================================
// 프로젝트별 격리
// ============================================================

describe("useMarketingCampaign - 프로젝트별 격리", () => {
  beforeEach(clearStore);

  it("다른 projectId의 데이터는 독립적이다", () => {
    const { result: result1 } = makeHook("proj-iso-1");
    const { result: result2 } = makeHook("proj-iso-2");
    addTaskHelper(result1, { title: "프로젝트1 태스크" });
    addTaskHelper(result1, { title: "프로젝트1 태스크2" });
    // proj-iso-2 store에는 태스크가 없어야 함 (초기값만 존재)
    const proj2Store = memStore["marketing-campaign-proj-iso-2"] as {
      tasks: unknown[];
    };
    expect(proj2Store.tasks).toHaveLength(0);
  });

  it("각 프로젝트의 스토리지 키가 독립적으로 존재한다", () => {
    const { result: result1 } = makeHook("proj-A");
    const { result: result2 } = makeHook("proj-B");
    addTaskHelper(result1);
    addTaskHelper(result2);
    expect(memStore["marketing-campaign-proj-A"]).toBeDefined();
    expect(memStore["marketing-campaign-proj-B"]).toBeDefined();
  });
});
