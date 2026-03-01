import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  invalidateRelated,
  invalidateMessages,
  invalidateGroupSchedules,
} from "@/lib/swr/invalidate";

// SWR mutate mock
vi.mock("swr", () => ({
  mutate: vi.fn(),
}));

import { mutate } from "swr";

const mockedMutate = vi.mocked(mutate);

beforeEach(() => {
  mockedMutate.mockReset();
});

describe("invalidateRelated - 패턴 매칭 무효화", () => {
  it("mutate를 filter 함수와 함께 한 번 호출한다", () => {
    invalidateRelated(["/groups/abc/board"]);
    expect(mockedMutate).toHaveBeenCalledOnce();
  });

  it("revalidate: true 옵션을 전달한다", () => {
    invalidateRelated(["/groups/abc/board"]);
    const [, , options] = mockedMutate.mock.calls[0];
    expect(options).toEqual({ revalidate: true });
  });

  it("두 번째 인자로 undefined를 전달한다", () => {
    invalidateRelated(["/groups/abc/board"]);
    const [, data] = mockedMutate.mock.calls[0];
    expect(data).toBeUndefined();
  });

  it("filter 함수가 패턴과 일치하는 키를 true로 반환한다", () => {
    invalidateRelated(["/groups/abc/board", "/groups/abc/finance"]);
    const [filterFn] = mockedMutate.mock.calls[0];

    // filter 함수로 전달된 인자를 직접 호출
    expect(typeof filterFn).toBe("function");
    expect(filterFn("/groups/abc/board/posts")).toBe(true);
    expect(filterFn("/groups/abc/finance/records")).toBe(true);
  });

  it("filter 함수가 패턴과 일치하지 않는 키를 false로 반환한다", () => {
    invalidateRelated(["/groups/abc/board"]);
    const [filterFn] = mockedMutate.mock.calls[0];

    expect(filterFn("/groups/xyz/board")).toBe(false);
    expect(filterFn("/groups/abc/finance")).toBe(false);
    expect(filterFn("/other-path")).toBe(false);
  });

  it("비문자열 키에 대해서는 false를 반환한다", () => {
    invalidateRelated(["/groups/abc/board"]);
    const [filterFn] = mockedMutate.mock.calls[0];

    expect(filterFn(123)).toBe(false);
    expect(filterFn(null)).toBe(false);
    expect(filterFn(undefined)).toBe(false);
    expect(filterFn({ key: "/groups/abc/board" })).toBe(false);
  });

  it("여러 패턴 중 하나라도 일치하면 true를 반환한다", () => {
    invalidateRelated(["/pattern-a", "/pattern-b", "/pattern-c"]);
    const [filterFn] = mockedMutate.mock.calls[0];

    expect(filterFn("/pattern-b/sub")).toBe(true);
    expect(filterFn("/pattern-c")).toBe(true);
    expect(filterFn("/pattern-d")).toBe(false);
  });

  it("빈 패턴 배열이면 모든 키에 대해 false를 반환한다", () => {
    invalidateRelated([]);
    const [filterFn] = mockedMutate.mock.calls[0];

    expect(filterFn("/any/key")).toBe(false);
  });
});

describe("invalidateMessages - 메시지 캐시 무효화", () => {
  it("mutate를 정확히 2번 호출한다", () => {
    invalidateMessages();
    expect(mockedMutate).toHaveBeenCalledTimes(2);
  });

  it("conversations 키를 무효화한다", () => {
    invalidateMessages();
    const calledKeys = mockedMutate.mock.calls.map((call) => call[0]);
    expect(calledKeys).toContain("/conversations");
  });

  it("unread-count 키를 무효화한다", () => {
    invalidateMessages();
    const calledKeys = mockedMutate.mock.calls.map((call) => call[0]);
    expect(calledKeys).toContain("/unread-count");
  });
});

describe("invalidateGroupSchedules - 그룹 일정 캐시 무효화", () => {
  const groupId = "group-123";

  it("mutate를 2번 호출한다 (schedules + upcoming-schedules)", () => {
    invalidateGroupSchedules(groupId);
    expect(mockedMutate).toHaveBeenCalledTimes(2);
  });

  it("두 호출 모두 revalidate: true 옵션을 가진다", () => {
    invalidateGroupSchedules(groupId);
    mockedMutate.mock.calls.forEach((call) => {
      expect(call[2]).toEqual({ revalidate: true });
    });
  });

  it("두 호출 모두 data로 undefined를 전달한다", () => {
    invalidateGroupSchedules(groupId);
    mockedMutate.mock.calls.forEach((call) => {
      expect(call[1]).toBeUndefined();
    });
  });

  it("schedules filter가 해당 그룹의 schedules 경로를 매칭한다", () => {
    invalidateGroupSchedules(groupId);
    const scheduleFilter = mockedMutate.mock.calls[0][0];

    expect(typeof scheduleFilter).toBe("function");
    expect(scheduleFilter(`/groups/${groupId}/schedules`)).toBe(true);
    expect(scheduleFilter(`/groups/${groupId}/schedules?project=p1`)).toBe(true);
  });

  it("schedules filter가 다른 그룹의 경로는 매칭하지 않는다", () => {
    invalidateGroupSchedules(groupId);
    const scheduleFilter = mockedMutate.mock.calls[0][0];

    expect(scheduleFilter("/groups/other-group/schedules")).toBe(false);
    expect(scheduleFilter("/groups/group-1230/schedules")).toBe(false);
  });

  it("upcoming-schedules filter가 해당 그룹의 upcoming 경로를 매칭한다", () => {
    invalidateGroupSchedules(groupId);
    const upcomingFilter = mockedMutate.mock.calls[1][0];

    expect(typeof upcomingFilter).toBe("function");
    expect(upcomingFilter(`/upcoming-schedules/${groupId}`)).toBe(true);
    expect(upcomingFilter(`/upcoming-schedules/${groupId}?project=p1`)).toBe(true);
  });

  it("upcoming-schedules filter가 다른 그룹의 경로는 매칭하지 않는다", () => {
    invalidateGroupSchedules(groupId);
    const upcomingFilter = mockedMutate.mock.calls[1][0];

    expect(upcomingFilter("/upcoming-schedules/other-group")).toBe(false);
  });

  it("비문자열 키에 대해 filter가 false를 반환한다", () => {
    invalidateGroupSchedules(groupId);
    const scheduleFilter = mockedMutate.mock.calls[0][0];

    expect(scheduleFilter(null)).toBe(false);
    expect(scheduleFilter(undefined)).toBe(false);
    expect(scheduleFilter(42)).toBe(false);
  });
});
