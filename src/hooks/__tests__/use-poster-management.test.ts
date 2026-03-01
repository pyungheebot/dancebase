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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { usePosterManagement } from "@/hooks/use-poster-management";
import type { PosterVersionStatus } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────

function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => usePosterManagement(groupId, projectId));
}

function addProject(
  hook: ReturnType<typeof makeHook>["result"],
  posterName = "공연 포스터",
  deadline?: string
) {
  let project: ReturnType<ReturnType<typeof usePosterManagement>["addProject"]>;
  act(() => {
    project = hook.current.addProject({ posterName, deadline });
  });
  return project!;
}

function addVersion(
  hook: ReturnType<typeof makeHook>["result"],
  posterId: string,
  title = "버전 1",
  designer = "홍길동",
  description = "첫 번째 디자인"
) {
  let version: ReturnType<ReturnType<typeof usePosterManagement>["addVersion"]>;
  act(() => {
    version = hook.current.addVersion(posterId, {
      title,
      designer,
      description,
    });
  });
  return version!;
}

// ============================================================
// 초기 상태
// ============================================================

describe("usePosterManagement - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 projects는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.projects).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalProjects는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalProjects).toBe(0);
  });

  it("초기 stats.totalVersions는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalVersions).toBe(0);
  });

  it("초기 stats.approvedVersions는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.approvedVersions).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addProject).toBe("function");
    expect(typeof result.current.updateProject).toBe("function");
    expect(typeof result.current.deleteProject).toBe("function");
    expect(typeof result.current.addVersion).toBe("function");
    expect(typeof result.current.updateVersion).toBe("function");
    expect(typeof result.current.deleteVersion).toBe("function");
    expect(typeof result.current.vote).toBe("function");
    expect(typeof result.current.updateStatus).toBe("function");
    expect(typeof result.current.selectFinal).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addProject
// ============================================================

describe("usePosterManagement - addProject", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("프로젝트 추가 후 projects 길이가 1이 된다", () => {
    const { result } = makeHook();
    addProject(result);
    expect(result.current.projects).toHaveLength(1);
  });

  it("추가된 프로젝트의 posterName이 올바르다", () => {
    const { result } = makeHook();
    addProject(result, "봄 공연 포스터");
    expect(result.current.projects[0].posterName).toBe("봄 공연 포스터");
  });

  it("추가된 프로젝트에 id가 부여된다", () => {
    const { result } = makeHook();
    addProject(result);
    expect(result.current.projects[0].id).toBeDefined();
  });

  it("추가된 프로젝트의 versions는 빈 배열이다", () => {
    const { result } = makeHook();
    addProject(result);
    expect(result.current.projects[0].versions).toEqual([]);
  });

  it("deadline을 포함한 프로젝트를 추가할 수 있다", () => {
    const { result } = makeHook();
    addProject(result, "포스터", "2026-04-01");
    expect(result.current.projects[0].deadline).toBe("2026-04-01");
  });

  it("반환된 객체가 올바른 posterName을 갖는다", () => {
    const { result } = makeHook();
    const returned = addProject(result, "반환 확인 포스터");
    expect(returned.posterName).toBe("반환 확인 포스터");
  });

  it("여러 프로젝트를 추가할 수 있다", () => {
    const { result } = makeHook();
    addProject(result, "포스터A");
    addProject(result, "포스터B");
    expect(result.current.projects).toHaveLength(2);
  });

  it("stats.totalProjects가 추가된 프로젝트 수와 일치한다", () => {
    const { result } = makeHook();
    addProject(result);
    addProject(result, "두 번째");
    expect(result.current.stats.totalProjects).toBe(2);
  });
});

// ============================================================
// updateProject
// ============================================================

describe("usePosterManagement - updateProject", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("posterName을 수정할 수 있다", () => {
    const { result } = makeHook();
    const p = addProject(result, "원래 포스터");
    act(() => {
      result.current.updateProject(p.id, { posterName: "수정된 포스터" });
    });
    expect(result.current.projects[0].posterName).toBe("수정된 포스터");
  });

  it("수정 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    let ret = false;
    act(() => {
      ret = result.current.updateProject(p.id, { posterName: "수정" });
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret = true;
    act(() => {
      ret = result.current.updateProject("non-existent", {
        posterName: "수정",
      });
    });
    expect(ret).toBe(false);
  });

  it("deadline을 수정할 수 있다", () => {
    const { result } = makeHook();
    const p = addProject(result, "포스터", "2026-03-01");
    act(() => {
      result.current.updateProject(p.id, { deadline: "2026-05-01" });
    });
    expect(result.current.projects[0].deadline).toBe("2026-05-01");
  });
});

// ============================================================
// deleteProject
// ============================================================

describe("usePosterManagement - deleteProject", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("프로젝트 삭제 후 projects 길이가 감소한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    act(() => {
      result.current.deleteProject(p.id);
    });
    expect(result.current.projects).toHaveLength(0);
  });

  it("삭제 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    let ret = false;
    act(() => {
      ret = result.current.deleteProject(p.id);
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret = true;
    act(() => {
      ret = result.current.deleteProject("non-existent");
    });
    expect(ret).toBe(false);
  });

  it("특정 프로젝트만 삭제된다", () => {
    const { result } = makeHook();
    const p1 = addProject(result, "포스터A");
    addProject(result, "포스터B");
    act(() => {
      result.current.deleteProject(p1.id);
    });
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.projects[0].posterName).toBe("포스터B");
  });
});

// ============================================================
// addVersion
// ============================================================

describe("usePosterManagement - addVersion", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("버전 추가 후 해당 프로젝트의 versions 길이가 1이 된다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id);
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions).toHaveLength(1);
  });

  it("첫 번째 버전의 versionNumber는 1이다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id);
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].versionNumber).toBe(1);
  });

  it("두 번째 버전의 versionNumber는 2이다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id, "버전1");
    addVersion(result, p.id, "버전2");
    const project = result.current.projects.find((pr) => pr.id === p.id);
    const maxVersion = Math.max(
      ...project!.versions.map((v) => v.versionNumber)
    );
    expect(maxVersion).toBe(2);
  });

  it("추가된 버전의 초기 status는 draft이다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id);
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].status).toBe("draft");
  });

  it("추가된 버전의 votes는 빈 배열이다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id);
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].votes).toEqual([]);
  });

  it("존재하지 않는 포스터 id에 버전 추가 시 null을 반환한다", () => {
    const { result } = makeHook();
    let version = undefined;
    act(() => {
      version = result.current.addVersion("non-existent", {
        title: "버전",
        designer: "디자이너",
        description: "설명",
      });
    });
    expect(version).toBeNull();
  });

  it("stats.totalVersions가 버전 수와 일치한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id, "버전1");
    addVersion(result, p.id, "버전2");
    expect(result.current.stats.totalVersions).toBe(2);
  });
});

// ============================================================
// updateVersion
// ============================================================

describe("usePosterManagement - updateVersion", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("버전 제목을 수정할 수 있다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id, "원래 제목");
    act(() => {
      result.current.updateVersion(p.id, v!.id, { title: "수정된 제목" });
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].title).toBe("수정된 제목");
  });

  it("수정 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    let ret = false;
    act(() => {
      ret = result.current.updateVersion(p.id, v!.id, { title: "수정" });
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 포스터 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret = true;
    act(() => {
      ret = result.current.updateVersion("non-existent", "any-version", {
        title: "수정",
      });
    });
    expect(ret).toBe(false);
  });

  it("존재하지 않는 버전 id 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    let ret = true;
    act(() => {
      ret = result.current.updateVersion(p.id, "non-existent-version", {
        title: "수정",
      });
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// deleteVersion
// ============================================================

describe("usePosterManagement - deleteVersion", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("버전 삭제 후 해당 프로젝트의 versions 길이가 감소한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.deleteVersion(p.id, v!.id);
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions).toHaveLength(0);
  });

  it("삭제 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    let ret = false;
    act(() => {
      ret = result.current.deleteVersion(p.id, v!.id);
    });
    expect(ret).toBe(true);
  });

  it("존재하지 않는 버전 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    addVersion(result, p.id);
    let ret = true;
    act(() => {
      ret = result.current.deleteVersion(p.id, "non-existent-version");
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// vote
// ============================================================

describe("usePosterManagement - vote", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("투표 후 해당 버전의 votes 길이가 증가한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.vote(p.id, v!.id, "홍길동", 4, "좋아요");
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].votes).toHaveLength(1);
  });

  it("투표 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    let ret = false;
    act(() => {
      ret = result.current.vote(p.id, v!.id, "홍길동", 5);
    });
    expect(ret).toBe(true);
  });

  it("동일 멤버가 다시 투표하면 기존 투표가 교체된다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.vote(p.id, v!.id, "홍길동", 3);
      result.current.vote(p.id, v!.id, "홍길동", 5);
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    const votes = project?.versions[0].votes ?? [];
    const hongVote = votes.find((vt) => vt.memberName === "홍길동");
    expect(votes).toHaveLength(1);
    expect(hongVote?.rating).toBe(5);
  });

  it("여러 멤버가 투표하면 votes 길이가 멤버 수와 같다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    // 각각 별도 act로 순차 투표
    act(() => {
      result.current.vote(p.id, v!.id, "홍길동", 4);
    });
    act(() => {
      result.current.vote(p.id, v!.id, "김철수", 5);
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].votes).toHaveLength(2);
  });

  it("존재하지 않는 포스터에 투표 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret = true;
    act(() => {
      ret = result.current.vote("non-existent", "any-version", "홍길동", 5);
    });
    expect(ret).toBe(false);
  });
});

// ============================================================
// updateStatus
// ============================================================

describe("usePosterManagement - updateStatus", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("버전 상태를 approved로 변경할 수 있다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.updateStatus(p.id, v!.id, "approved");
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].status).toBe("approved");
  });

  it("버전 상태를 rejected로 변경할 수 있다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.updateStatus(p.id, v!.id, "rejected");
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].status).toBe("rejected");
  });

  it("approved 버전이 stats.approvedVersions에 반영된다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.updateStatus(
        p.id,
        v!.id,
        "approved" as PosterVersionStatus
      );
    });
    expect(result.current.stats.approvedVersions).toBe(1);
  });

  it("상태 변경 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    let ret = false;
    act(() => {
      ret = result.current.updateStatus(p.id, v!.id, "approved");
    });
    expect(ret).toBe(true);
  });
});

// ============================================================
// selectFinal
// ============================================================

describe("usePosterManagement - selectFinal", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("최종 선정 후 해당 버전의 status가 final이 된다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.selectFinal(p.id, v!.id);
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.versions[0].status).toBe("final");
  });

  it("최종 선정 후 selectedVersionId가 설정된다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.selectFinal(p.id, v!.id);
    });
    const project = result.current.projects.find((pr) => pr.id === p.id);
    expect(project?.selectedVersionId).toBe(v!.id);
  });

  it("최종 선정 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    let ret = false;
    act(() => {
      ret = result.current.selectFinal(p.id, v!.id);
    });
    expect(ret).toBe(true);
  });

  it("final 버전이 stats.approvedVersions에 반영된다", () => {
    const { result } = makeHook();
    const p = addProject(result);
    const v = addVersion(result, p.id);
    act(() => {
      result.current.selectFinal(p.id, v!.id);
    });
    expect(result.current.stats.approvedVersions).toBe(1);
  });

  it("존재하지 않는 포스터에 최종 선정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret = true;
    act(() => {
      ret = result.current.selectFinal("non-existent", "any-version");
    });
    expect(ret).toBe(false);
  });
});
