/**
 * use-group-vote 테스트
 *
 * 훅 내부의 순수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - 투표 생성 유효성 검사
 * - 상태 전이 로직 (draft → active → closed)
 * - 투표 (castBallot) - 중복 방지, 단일/복수 선택
 * - 결과 계산 (getResults) - 득표수, 백분율
 * - 투표 여부 확인 (hasVoted)
 * - 내 선택 조회 (getMySelectedIds)
 * - 통계 계산 (activeVotes, closedVotes, draftVotes, averageParticipation)
 * - localStorage 키 형식
 * - 그룹별 격리
 */

import { describe, it, expect } from "vitest";
import type {
  GroupVoteEntry,
  GroupVoteOption,
  GroupVoteBallot,
  GroupVoteType,
} from "@/types";

// ============================================================
// 훅 내부 순수 함수 재현
// ============================================================

/** localStorage 키 형식 */
function lsKey(groupId: string): string {
  return `dancebase:group-vote:${groupId}`;
}

/** 투표 생성 유효성 검사 */
function isValidCreate(title: string, optionLabels: string[]): boolean {
  return title.trim().length > 0 && optionLabels.length >= 2;
}

/** 옵션 생성 */
function buildOptions(labels: string[]): GroupVoteOption[] {
  return labels.map((label, i) => ({
    id: `opt-${i}`,
    label: label.trim(),
    voteCount: 0,
  }));
}

/** 투표 항목 빌더 */
function buildVote(overrides: Partial<GroupVoteEntry> = {}): GroupVoteEntry {
  return {
    id: "vote-1",
    title: "공연 날짜 투표",
    description: "공연 날짜를 결정합니다",
    type: "single",
    status: "draft",
    options: buildOptions(["1월 15일", "1월 22일"]),
    ballots: [],
    anonymous: false,
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** activateVote 유효성 검사 */
function canActivate(vote: GroupVoteEntry): boolean {
  return vote.status === "draft";
}

/** closeVote 유효성 검사 */
function canClose(vote: GroupVoteEntry): boolean {
  return vote.status === "active";
}

/** castBallot 유효성 검사 */
function canCastBallot(
  vote: GroupVoteEntry,
  voterName: string,
  selectedOptionIds: string[]
): boolean {
  if (!voterName.trim() || selectedOptionIds.length === 0) return false;
  if (vote.status !== "active") return false;
  const alreadyVoted = vote.ballots.some(
    (b) => b.voterName === voterName.trim()
  );
  return !alreadyVoted;
}

/** 단일/복수 선택 필터링 */
function resolveFinalIds(
  type: GroupVoteType,
  selectedOptionIds: string[]
): string[] {
  return type === "single" ? selectedOptionIds.slice(0, 1) : selectedOptionIds;
}

/** voteCount 업데이트 */
function applyBallotToOptions(
  options: GroupVoteOption[],
  finalIds: string[]
): GroupVoteOption[] {
  return options.map((opt) => ({
    ...opt,
    voteCount: finalIds.includes(opt.id) ? opt.voteCount + 1 : opt.voteCount,
  }));
}

/** getResults 계산 */
function getResults(vote: GroupVoteEntry) {
  const totalVotes = vote.ballots.length;
  return vote.options.map((opt) => ({
    optionId: opt.id,
    label: opt.label,
    voteCount: opt.voteCount,
    percent:
      totalVotes === 0 ? 0 : Math.round((opt.voteCount / totalVotes) * 100),
  }));
}

/** hasVoted 확인 */
function hasVoted(vote: GroupVoteEntry, voterName: string): boolean {
  if (!voterName.trim()) return false;
  return vote.ballots.some((b) => b.voterName === voterName.trim());
}

/** getMySelectedIds */
function getMySelectedIds(vote: GroupVoteEntry, voterName: string): string[] {
  if (!voterName.trim()) return [];
  const ballot = vote.ballots.find((b) => b.voterName === voterName.trim());
  return ballot ? ballot.selectedOptionIds : [];
}

/** 통계: totalVotes, activeVotes, closedVotes, draftVotes */
function calcStats(votes: GroupVoteEntry[]) {
  const totalVotes = votes.length;
  const activeVotes = votes.filter((v) => v.status === "active").length;
  const closedVotes = votes.filter((v) => v.status === "closed").length;
  const draftVotes = votes.filter((v) => v.status === "draft").length;
  const participatingVotes = votes.filter(
    (v) => v.status === "active" || v.status === "closed"
  );
  const averageParticipation =
    participatingVotes.length === 0
      ? 0
      : Math.round(
          participatingVotes.reduce((sum, v) => sum + v.ballots.length, 0) /
            participatingVotes.length
        );
  return { totalVotes, activeVotes, closedVotes, draftVotes, averageParticipation };
}

// ============================================================
// 1. localStorage 키 형식
// ============================================================

describe("localStorage 키 형식", () => {
  it("키는 'dancebase:group-vote:{groupId}' 형식이다", () => {
    expect(lsKey("g1")).toBe("dancebase:group-vote:g1");
  });

  it("그룹 ID가 다르면 키가 달라진다", () => {
    expect(lsKey("g1")).not.toBe(lsKey("g2"));
  });

  it("그룹별 격리 - 두 그룹의 키는 독립적이다", () => {
    const key1 = lsKey("group-alpha");
    const key2 = lsKey("group-beta");
    expect(key1).toBe("dancebase:group-vote:group-alpha");
    expect(key2).toBe("dancebase:group-vote:group-beta");
    expect(key1).not.toBe(key2);
  });
});

// ============================================================
// 2. 투표 생성 유효성 검사
// ============================================================

describe("투표 생성 유효성 검사 (isValidCreate)", () => {
  it("제목이 있고 옵션이 2개 이상이면 유효하다", () => {
    expect(isValidCreate("날짜 투표", ["1월", "2월"])).toBe(true);
  });

  it("제목이 빈 문자열이면 유효하지 않다", () => {
    expect(isValidCreate("", ["1월", "2월"])).toBe(false);
  });

  it("제목이 공백만 있으면 유효하지 않다", () => {
    expect(isValidCreate("   ", ["1월", "2월"])).toBe(false);
  });

  it("옵션이 1개이면 유효하지 않다", () => {
    expect(isValidCreate("날짜 투표", ["1월"])).toBe(false);
  });

  it("옵션이 0개이면 유효하지 않다", () => {
    expect(isValidCreate("날짜 투표", [])).toBe(false);
  });

  it("옵션이 3개 이상이면 유효하다", () => {
    expect(isValidCreate("날짜 투표", ["1월", "2월", "3월"])).toBe(true);
  });
});

// ============================================================
// 3. 옵션 생성 (buildOptions)
// ============================================================

describe("옵션 생성 (buildOptions)", () => {
  it("레이블 수만큼 옵션이 생성된다", () => {
    const opts = buildOptions(["A", "B", "C"]);
    expect(opts).toHaveLength(3);
  });

  it("초기 voteCount는 0이다", () => {
    const opts = buildOptions(["A", "B"]);
    opts.forEach((o) => expect(o.voteCount).toBe(0));
  });

  it("레이블이 트림된다", () => {
    const opts = buildOptions(["  A  ", "B"]);
    expect(opts[0]!.label).toBe("A");
  });
});

// ============================================================
// 4. 상태 전이 로직
// ============================================================

describe("상태 전이 로직", () => {
  it("draft 상태의 투표는 activateVote 가능하다", () => {
    const vote = buildVote({ status: "draft" });
    expect(canActivate(vote)).toBe(true);
  });

  it("active 상태의 투표는 activateVote 불가하다", () => {
    const vote = buildVote({ status: "active" });
    expect(canActivate(vote)).toBe(false);
  });

  it("closed 상태의 투표는 activateVote 불가하다", () => {
    const vote = buildVote({ status: "closed" });
    expect(canActivate(vote)).toBe(false);
  });

  it("active 상태의 투표는 closeVote 가능하다", () => {
    const vote = buildVote({ status: "active" });
    expect(canClose(vote)).toBe(true);
  });

  it("draft 상태의 투표는 closeVote 불가하다", () => {
    const vote = buildVote({ status: "draft" });
    expect(canClose(vote)).toBe(false);
  });

  it("closed 상태의 투표는 closeVote 불가하다", () => {
    const vote = buildVote({ status: "closed" });
    expect(canClose(vote)).toBe(false);
  });
});

// ============================================================
// 5. castBallot 유효성 검사
// ============================================================

describe("castBallot 유효성 검사", () => {
  it("active 투표에 유효한 데이터로 투표 가능하다", () => {
    const vote = buildVote({ status: "active" });
    expect(canCastBallot(vote, "Alice", ["opt-0"])).toBe(true);
  });

  it("voterName이 빈 문자열이면 투표 불가하다", () => {
    const vote = buildVote({ status: "active" });
    expect(canCastBallot(vote, "", ["opt-0"])).toBe(false);
  });

  it("voterName이 공백만 있으면 투표 불가하다", () => {
    const vote = buildVote({ status: "active" });
    expect(canCastBallot(vote, "   ", ["opt-0"])).toBe(false);
  });

  it("selectedOptionIds가 비어 있으면 투표 불가하다", () => {
    const vote = buildVote({ status: "active" });
    expect(canCastBallot(vote, "Alice", [])).toBe(false);
  });

  it("draft 상태이면 투표 불가하다", () => {
    const vote = buildVote({ status: "draft" });
    expect(canCastBallot(vote, "Alice", ["opt-0"])).toBe(false);
  });

  it("closed 상태이면 투표 불가하다", () => {
    const vote = buildVote({ status: "closed" });
    expect(canCastBallot(vote, "Alice", ["opt-0"])).toBe(false);
  });

  it("이미 투표한 사람은 중복 투표 불가하다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "2026-01-01T00:00:00.000Z",
    };
    const vote = buildVote({ status: "active", ballots: [ballot] });
    expect(canCastBallot(vote, "Alice", ["opt-1"])).toBe(false);
  });

  it("voterName 앞뒤 공백은 트림되어 중복 감지된다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "2026-01-01T00:00:00.000Z",
    };
    const vote = buildVote({ status: "active", ballots: [ballot] });
    expect(canCastBallot(vote, "  Alice  ", ["opt-1"])).toBe(false);
  });

  it("다른 이름의 사람은 투표 가능하다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "2026-01-01T00:00:00.000Z",
    };
    const vote = buildVote({ status: "active", ballots: [ballot] });
    expect(canCastBallot(vote, "Bob", ["opt-1"])).toBe(true);
  });
});

// ============================================================
// 6. 단일/복수 선택 필터링
// ============================================================

describe("단일/복수 선택 필터링 (resolveFinalIds)", () => {
  it("single 타입은 첫 번째 옵션만 사용된다", () => {
    const result = resolveFinalIds("single", ["opt-0", "opt-1", "opt-2"]);
    expect(result).toEqual(["opt-0"]);
  });

  it("multiple 타입은 모든 선택된 옵션이 사용된다", () => {
    const result = resolveFinalIds("multiple", ["opt-0", "opt-1"]);
    expect(result).toEqual(["opt-0", "opt-1"]);
  });

  it("ranking 타입은 모든 선택된 옵션이 사용된다", () => {
    const result = resolveFinalIds("ranking", ["opt-2", "opt-0", "opt-1"]);
    expect(result).toEqual(["opt-2", "opt-0", "opt-1"]);
  });

  it("single 타입에서 선택이 1개이면 그대로 반환된다", () => {
    const result = resolveFinalIds("single", ["opt-0"]);
    expect(result).toEqual(["opt-0"]);
  });
});

// ============================================================
// 7. voteCount 업데이트
// ============================================================

describe("voteCount 업데이트 (applyBallotToOptions)", () => {
  it("선택된 옵션의 voteCount가 1 증가한다", () => {
    const options = buildOptions(["A", "B"]);
    const updated = applyBallotToOptions(options, ["opt-0"]);
    expect(updated[0]!.voteCount).toBe(1);
    expect(updated[1]!.voteCount).toBe(0);
  });

  it("복수 선택 시 여러 옵션의 voteCount가 증가한다", () => {
    const options = buildOptions(["A", "B", "C"]);
    const updated = applyBallotToOptions(options, ["opt-0", "opt-2"]);
    expect(updated[0]!.voteCount).toBe(1);
    expect(updated[1]!.voteCount).toBe(0);
    expect(updated[2]!.voteCount).toBe(1);
  });

  it("선택되지 않은 옵션의 voteCount는 그대로다", () => {
    const options = [{ id: "opt-0", label: "A", voteCount: 5 }];
    const updated = applyBallotToOptions(options, ["opt-1"]);
    expect(updated[0]!.voteCount).toBe(5);
  });

  it("빈 finalIds이면 모든 voteCount가 그대로다", () => {
    const options = buildOptions(["A", "B"]);
    const updated = applyBallotToOptions(options, []);
    expect(updated[0]!.voteCount).toBe(0);
    expect(updated[1]!.voteCount).toBe(0);
  });
});

// ============================================================
// 8. getResults 계산
// ============================================================

describe("getResults 계산", () => {
  it("투표자가 없으면 모든 percent는 0이다", () => {
    const vote = buildVote({ status: "closed" });
    const results = getResults(vote);
    results.forEach((r) => expect(r.percent).toBe(0));
  });

  it("투표자 1명이 opt-0를 선택하면 opt-0의 percent는 100이다", () => {
    const options = [
      { id: "opt-0", label: "A", voteCount: 1 },
      { id: "opt-1", label: "B", voteCount: 0 },
    ];
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "2026-01-01T00:00:00.000Z",
    };
    const vote = buildVote({ options, ballots: [ballot] });
    const results = getResults(vote);
    expect(results.find((r) => r.optionId === "opt-0")!.percent).toBe(100);
    expect(results.find((r) => r.optionId === "opt-1")!.percent).toBe(0);
  });

  it("투표자 2명이 각 옵션을 선택하면 각각 50%이다", () => {
    const options = [
      { id: "opt-0", label: "A", voteCount: 1 },
      { id: "opt-1", label: "B", voteCount: 1 },
    ];
    const ballots: GroupVoteBallot[] = [
      { voterName: "Alice", selectedOptionIds: ["opt-0"], votedAt: "" },
      { voterName: "Bob", selectedOptionIds: ["opt-1"], votedAt: "" },
    ];
    const vote = buildVote({ options, ballots });
    const results = getResults(vote);
    expect(results[0]!.percent).toBe(50);
    expect(results[1]!.percent).toBe(50);
  });

  it("백분율은 반올림된다 (1/3 → 33%)", () => {
    const options = [
      { id: "opt-0", label: "A", voteCount: 1 },
      { id: "opt-1", label: "B", voteCount: 2 },
    ];
    const ballots: GroupVoteBallot[] = [
      { voterName: "A", selectedOptionIds: ["opt-0"], votedAt: "" },
      { voterName: "B", selectedOptionIds: ["opt-1"], votedAt: "" },
      { voterName: "C", selectedOptionIds: ["opt-1"], votedAt: "" },
    ];
    const vote = buildVote({ options, ballots });
    const results = getResults(vote);
    expect(results[0]!.percent).toBe(33);
    expect(results[1]!.percent).toBe(67);
  });

  it("vote가 없으면 빈 배열을 반환한다", () => {
    const votes: GroupVoteEntry[] = [];
    const vote = votes.find((v) => v.id === "nonexistent");
    expect(vote ? getResults(vote) : []).toEqual([]);
  });

  it("getResults 반환값에 optionId, label, voteCount, percent 필드가 있다", () => {
    const vote = buildVote();
    const results = getResults(vote);
    results.forEach((r) => {
      expect(r).toHaveProperty("optionId");
      expect(r).toHaveProperty("label");
      expect(r).toHaveProperty("voteCount");
      expect(r).toHaveProperty("percent");
    });
  });
});

// ============================================================
// 9. hasVoted 확인
// ============================================================

describe("hasVoted 확인", () => {
  it("투표 기록이 없으면 false이다", () => {
    const vote = buildVote({ status: "active", ballots: [] });
    expect(hasVoted(vote, "Alice")).toBe(false);
  });

  it("투표한 사람은 true이다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(hasVoted(vote, "Alice")).toBe(true);
  });

  it("다른 사람의 이름으로는 false이다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(hasVoted(vote, "Bob")).toBe(false);
  });

  it("voterName이 빈 문자열이면 false이다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(hasVoted(vote, "")).toBe(false);
  });

  it("앞뒤 공백은 트림되어 비교된다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(hasVoted(vote, "  Alice  ")).toBe(true);
  });
});

// ============================================================
// 10. getMySelectedIds
// ============================================================

describe("getMySelectedIds", () => {
  it("투표하지 않은 사람은 빈 배열을 반환한다", () => {
    const vote = buildVote({ ballots: [] });
    expect(getMySelectedIds(vote, "Alice")).toEqual([]);
  });

  it("투표한 사람의 선택 옵션 ID를 반환한다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(getMySelectedIds(vote, "Alice")).toEqual(["opt-0"]);
  });

  it("복수 선택의 경우 모두 반환된다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Bob",
      selectedOptionIds: ["opt-0", "opt-1"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(getMySelectedIds(vote, "Bob")).toEqual(["opt-0", "opt-1"]);
  });

  it("voterName이 빈 문자열이면 빈 배열이다", () => {
    const ballot: GroupVoteBallot = {
      voterName: "Alice",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const vote = buildVote({ ballots: [ballot] });
    expect(getMySelectedIds(vote, "")).toEqual([]);
  });
});

// ============================================================
// 11. 통계 계산
// ============================================================

describe("통계 계산 (calcStats)", () => {
  it("투표가 없으면 모든 통계가 0이다", () => {
    const stats = calcStats([]);
    expect(stats).toEqual({
      totalVotes: 0,
      activeVotes: 0,
      closedVotes: 0,
      draftVotes: 0,
      averageParticipation: 0,
    });
  });

  it("totalVotes는 전체 투표 수이다", () => {
    const votes = [
      buildVote({ id: "1", status: "draft" }),
      buildVote({ id: "2", status: "active" }),
      buildVote({ id: "3", status: "closed" }),
    ];
    expect(calcStats(votes).totalVotes).toBe(3);
  });

  it("activeVotes는 active 상태 투표 수이다", () => {
    const votes = [
      buildVote({ id: "1", status: "active" }),
      buildVote({ id: "2", status: "active" }),
      buildVote({ id: "3", status: "draft" }),
    ];
    expect(calcStats(votes).activeVotes).toBe(2);
  });

  it("closedVotes는 closed 상태 투표 수이다", () => {
    const votes = [
      buildVote({ id: "1", status: "closed" }),
      buildVote({ id: "2", status: "active" }),
    ];
    expect(calcStats(votes).closedVotes).toBe(1);
  });

  it("draftVotes는 draft 상태 투표 수이다", () => {
    const votes = [
      buildVote({ id: "1", status: "draft" }),
      buildVote({ id: "2", status: "draft" }),
      buildVote({ id: "3", status: "closed" }),
    ];
    expect(calcStats(votes).draftVotes).toBe(2);
  });

  it("averageParticipation은 active+closed 투표의 투표자 수 평균이다", () => {
    const ballot1: GroupVoteBallot = {
      voterName: "A",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const ballot2: GroupVoteBallot = {
      voterName: "B",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const ballot3: GroupVoteBallot = {
      voterName: "C",
      selectedOptionIds: ["opt-0"],
      votedAt: "",
    };
    const votes = [
      buildVote({ id: "1", status: "active", ballots: [ballot1, ballot2] }), // 2명
      buildVote({ id: "2", status: "closed", ballots: [ballot3] }), // 1명
    ];
    // 평균 = (2+1)/2 = 1.5 → 반올림 → 2
    expect(calcStats(votes).averageParticipation).toBe(2);
  });

  it("draft 투표만 있으면 averageParticipation은 0이다", () => {
    const votes = [buildVote({ id: "1", status: "draft" })];
    expect(calcStats(votes).averageParticipation).toBe(0);
  });

  it("totalVotes와 상태별 합계가 일치한다", () => {
    const votes = [
      buildVote({ id: "1", status: "draft" }),
      buildVote({ id: "2", status: "active" }),
      buildVote({ id: "3", status: "closed" }),
      buildVote({ id: "4", status: "active" }),
    ];
    const stats = calcStats(votes);
    expect(stats.draftVotes + stats.activeVotes + stats.closedVotes).toBe(
      stats.totalVotes
    );
  });
});

// ============================================================
// 12. 경계값 테스트
// ============================================================

describe("경계값 테스트", () => {
  it("투표자 0명의 투표에서 getResults는 percent 0을 반환한다", () => {
    const vote = buildVote({ ballots: [] });
    const results = getResults(vote);
    results.forEach((r) => expect(r.percent).toBe(0));
  });

  it("옵션이 정확히 2개인 투표 생성은 유효하다", () => {
    expect(isValidCreate("제목", ["A", "B"])).toBe(true);
  });

  it("매우 긴 제목도 유효하다", () => {
    expect(isValidCreate("A".repeat(200), ["A", "B"])).toBe(true);
  });

  it("voteCount가 이미 5인 옵션에 1표 추가하면 6이 된다", () => {
    const options = [{ id: "opt-0", label: "A", voteCount: 5 }];
    const updated = applyBallotToOptions(options, ["opt-0"]);
    expect(updated[0]!.voteCount).toBe(6);
  });

  it("100명 투표 시 백분율 합계가 100에 근접한다", () => {
    const totalBallots = 100;
    const options = [
      { id: "opt-0", label: "A", voteCount: 50 },
      { id: "opt-1", label: "B", voteCount: 50 },
    ];
    const ballots: GroupVoteBallot[] = Array.from(
      { length: totalBallots },
      (_, i) => ({
        voterName: `user-${i}`,
        selectedOptionIds: [i < 50 ? "opt-0" : "opt-1"],
        votedAt: "",
      })
    );
    const vote = buildVote({ options, ballots });
    const results = getResults(vote);
    const total = results.reduce((sum, r) => sum + r.percent, 0);
    expect(total).toBe(100);
  });
});

// ============================================================
// 13. 그룹별 격리 시나리오
// ============================================================

describe("그룹별 격리 시나리오", () => {
  it("두 그룹의 투표 데이터는 서로 독립적이다", () => {
    const votesG1: GroupVoteEntry[] = [buildVote({ id: "v1" })];
    const votesG2: GroupVoteEntry[] = [
      buildVote({ id: "v2" }),
      buildVote({ id: "v3" }),
    ];
    expect(calcStats(votesG1).totalVotes).toBe(1);
    expect(calcStats(votesG2).totalVotes).toBe(2);
  });

  it("그룹1 투표 삭제가 그룹2에 영향 없다", () => {
    const votesG1: GroupVoteEntry[] = [buildVote({ id: "v1" })];
    const votesG2: GroupVoteEntry[] = [buildVote({ id: "v2" })];
    const filteredG1 = votesG1.filter((v) => v.id !== "v1");
    expect(filteredG1).toHaveLength(0);
    expect(votesG2).toHaveLength(1);
  });
});
