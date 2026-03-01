import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabase 클라이언트 모킹
// upsert: from("attendance").upsert(data, opts) → Promise<{ error }>
// delete: from("attendance").delete().eq("schedule_id", id).in("user_id", ids) → Promise<{ error }>

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import {
  bulkUpsertAttendance,
  bulkDeleteAttendance,
} from "@/lib/services/attendance-service";

describe("bulkUpsertAttendance", () => {
  it("성공 케이스: 전체 출석 처리 시 올바른 데이터로 upsert가 호출된다", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await bulkUpsertAttendance(
      "schedule-1",
      ["user-1", "user-2", "user-3"],
      "present"
    );

    expect(mockFrom).toHaveBeenCalledWith("attendance");
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    // upsert에 전달된 데이터 확인
    const upsertData = mockUpsert.mock.calls[0][0];
    expect(upsertData).toHaveLength(3);
    expect(upsertData[0]).toMatchObject({
      schedule_id: "schedule-1",
      user_id: "user-1",
      status: "present",
    });
    expect(upsertData[1]).toMatchObject({
      schedule_id: "schedule-1",
      user_id: "user-2",
      status: "present",
    });
    expect(upsertData[2]).toMatchObject({
      schedule_id: "schedule-1",
      user_id: "user-3",
      status: "present",
    });

    // onConflict 옵션 확인
    const upsertOptions = mockUpsert.mock.calls[0][1];
    expect(upsertOptions).toEqual({ onConflict: "schedule_id,user_id" });
  });

  it("성공 케이스: 전체 결석 처리 시 status가 'absent'로 upsert된다", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await bulkUpsertAttendance("schedule-1", ["user-1"], "absent");

    const upsertData = mockUpsert.mock.calls[0][0];
    expect(upsertData[0]).toMatchObject({
      schedule_id: "schedule-1",
      user_id: "user-1",
      status: "absent",
    });
  });

  it("성공 케이스: upsert 데이터에 checked_at 타임스탬프가 포함된다", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    const beforeCall = new Date().toISOString();
    await bulkUpsertAttendance("schedule-1", ["user-1"], "present");
    const afterCall = new Date().toISOString();

    const upsertData = mockUpsert.mock.calls[0][0];
    const checkedAt = upsertData[0].checked_at;

    // checked_at이 ISO 문자열 형식이고 호출 시각 범위 내인지 확인
    expect(checkedAt).toBeDefined();
    expect(checkedAt >= beforeCall).toBe(true);
    expect(checkedAt <= afterCall).toBe(true);
  });

  it("성공 케이스: 빈 userIds 배열이면 빈 배열로 upsert가 호출된다", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await bulkUpsertAttendance("schedule-1", [], "present");

    const upsertData = mockUpsert.mock.calls[0][0];
    expect(upsertData).toHaveLength(0);
  });

  it("에러 케이스: Supabase 에러 발생 시 throw한다", async () => {
    const supabaseError = { message: "upsert failed", code: "42000" };
    const mockUpsert = vi.fn().mockResolvedValue({ error: supabaseError });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await expect(
      bulkUpsertAttendance("schedule-1", ["user-1"], "present")
    ).rejects.toEqual(supabaseError);
  });
});

describe("bulkDeleteAttendance", () => {
  it("성공 케이스: 전체 미정 처리 시 올바른 schedule_id와 userIds로 delete가 호출된다", async () => {
    const mockIn = vi.fn().mockResolvedValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ in: mockIn });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await bulkDeleteAttendance("schedule-1", ["user-1", "user-2"]);

    expect(mockFrom).toHaveBeenCalledWith("attendance");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(mockIn).toHaveBeenCalledWith("user_id", ["user-1", "user-2"]);
  });

  it("성공 케이스: 단일 사용자 삭제도 정상 처리된다", async () => {
    const mockIn = vi.fn().mockResolvedValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ in: mockIn });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await bulkDeleteAttendance("schedule-2", ["user-1"]);

    expect(mockEq).toHaveBeenCalledWith("schedule_id", "schedule-2");
    expect(mockIn).toHaveBeenCalledWith("user_id", ["user-1"]);
  });

  it("성공 케이스: 빈 userIds 배열로도 delete가 호출된다", async () => {
    const mockIn = vi.fn().mockResolvedValue({ error: null });
    const mockEq = vi.fn().mockReturnValue({ in: mockIn });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await bulkDeleteAttendance("schedule-1", []);

    expect(mockIn).toHaveBeenCalledWith("user_id", []);
  });

  it("에러 케이스: Supabase 에러 발생 시 throw한다", async () => {
    const supabaseError = { message: "delete failed", code: "42000" };
    const mockIn = vi.fn().mockResolvedValue({ error: supabaseError });
    const mockEq = vi.fn().mockReturnValue({ in: mockIn });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await expect(
      bulkDeleteAttendance("schedule-1", ["user-1"])
    ).rejects.toEqual(supabaseError);
  });
});
