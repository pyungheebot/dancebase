import { describe, it, expect } from "vitest";
import { categorizeError, getErrorMessage } from "@/lib/error-category";

// ---------------------------------------------------------------------------
// categorizeError
// ---------------------------------------------------------------------------

describe("categorizeError - 네트워크 에러", () => {
  it("TypeError('Failed to fetch')를 network로 분류한다", () => {
    expect(categorizeError(new TypeError("Failed to fetch"))).toBe("network");
  });

  it("TypeError('NetworkError …')를 network로 분류한다 (Safari 형태)", () => {
    expect(
      categorizeError(new TypeError("NetworkError when attempting to fetch resource."))
    ).toBe("network");
  });

  it("Error 메시지에 'failed to fetch'가 포함되면 network로 분류한다", () => {
    expect(categorizeError(new Error("Request failed to fetch data"))).toBe("network");
  });

  it("Error 메시지에 'network'가 포함되면 network로 분류한다", () => {
    expect(categorizeError(new Error("network unavailable"))).toBe("network");
  });

  it("string 'fetch failed'를 network로 분류한다", () => {
    expect(categorizeError("fetch failed")).toBe("network");
  });

  it("string 'network error'를 network로 분류한다", () => {
    expect(categorizeError("network error occurred")).toBe("network");
  });
});

describe("categorizeError - 인증 에러", () => {
  it("status=401인 객체를 auth로 분류한다", () => {
    expect(categorizeError({ status: 401, message: "Unauthorized" })).toBe("auth");
  });

  it("status=403인 객체를 auth로 분류한다", () => {
    expect(categorizeError({ status: 403, message: "Forbidden" })).toBe("auth");
  });

  it("메시지에 'jwt'가 포함된 Supabase 에러를 auth로 분류한다", () => {
    expect(
      categorizeError({ message: "JWT expired", code: "PGRST301", details: "" })
    ).toBe("auth");
  });

  it("code='42501'인 Supabase RLS 에러를 auth로 분류한다", () => {
    expect(
      categorizeError({ message: "permission denied for table members", code: "42501" })
    ).toBe("auth");
  });

  it("code가 'PGRST3'으로 시작하는 에러를 auth로 분류한다", () => {
    expect(categorizeError({ message: "Access denied", code: "PGRST301" })).toBe("auth");
  });

  it("Error 메시지에 'auth'가 포함되면 auth로 분류한다", () => {
    expect(categorizeError(new Error("auth token expired"))).toBe("auth");
  });

  it("Error 메시지에 'unauthorized'가 포함되면 auth로 분류한다", () => {
    expect(categorizeError(new Error("Request unauthorized"))).toBe("auth");
  });

  it("Error 메시지에 'jwt'가 포함되면 auth로 분류한다", () => {
    expect(categorizeError(new Error("jwt malformed"))).toBe("auth");
  });

  it("string 'unauthorized'를 auth로 분류한다", () => {
    expect(categorizeError("unauthorized access")).toBe("auth");
  });

  it("string 'auth'를 auth로 분류한다", () => {
    expect(categorizeError("auth failed")).toBe("auth");
  });

  it("string 'permission'을 auth로 분류한다", () => {
    expect(categorizeError("permission denied")).toBe("auth");
  });
});

describe("categorizeError - not-found 에러", () => {
  it("status=404인 객체를 not-found로 분류한다", () => {
    expect(categorizeError({ status: 404, message: "Not found" })).toBe("not-found");
  });

  it("code='PGRST116'인 Supabase 에러를 not-found로 분류한다", () => {
    expect(
      categorizeError({ message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" })
    ).toBe("not-found");
  });

  it("Error 메시지에 'not found'가 포함되면 not-found로 분류한다", () => {
    expect(categorizeError(new Error("Record not found"))).toBe("not-found");
  });

  it("Error 메시지에 '404'가 포함되면 not-found로 분류한다", () => {
    expect(categorizeError(new Error("HTTP 404"))).toBe("not-found");
  });

  it("string 'not found'를 not-found로 분류한다", () => {
    expect(categorizeError("resource not found")).toBe("not-found");
  });

  it("string '404'를 not-found로 분류한다", () => {
    expect(categorizeError("error 404")).toBe("not-found");
  });
});

describe("categorizeError - 서버 에러", () => {
  it("status=500인 객체를 server로 분류한다", () => {
    expect(categorizeError({ status: 500, message: "Internal Server Error" })).toBe("server");
  });

  it("status=502인 객체를 server로 분류한다", () => {
    expect(categorizeError({ status: 502, message: "Bad Gateway" })).toBe("server");
  });

  it("statusCode=503인 객체를 server로 분류한다", () => {
    expect(categorizeError({ statusCode: 503, message: "Service Unavailable" })).toBe("server");
  });

  it("Error 메시지에 'server error'가 포함되면 server로 분류한다", () => {
    expect(categorizeError(new Error("server error occurred"))).toBe("server");
  });

  it("Error 메시지에 '500'이 포함되면 server로 분류한다", () => {
    expect(categorizeError(new Error("HTTP 500"))).toBe("server");
  });

  it("Error 메시지에 'internal'이 포함되면 server로 분류한다", () => {
    expect(categorizeError(new Error("internal error"))).toBe("server");
  });

  it("string 'server'를 server로 분류한다", () => {
    expect(categorizeError("server is down")).toBe("server");
  });

  it("string '500'을 server로 분류한다", () => {
    expect(categorizeError("error 500")).toBe("server");
  });
});

describe("categorizeError - unknown 에러", () => {
  it("null을 unknown으로 분류한다", () => {
    expect(categorizeError(null)).toBe("unknown");
  });

  it("undefined를 unknown으로 분류한다", () => {
    expect(categorizeError(undefined)).toBe("unknown");
  });

  it("빈 문자열을 unknown으로 분류한다", () => {
    // falsy이므로 unknown
    expect(categorizeError("")).toBe("unknown");
  });

  it("패턴이 없는 string을 unknown으로 분류한다", () => {
    expect(categorizeError("something went wrong")).toBe("unknown");
  });

  it("패턴이 없는 Error 메시지를 unknown으로 분류한다", () => {
    expect(categorizeError(new Error("unexpected issue"))).toBe("unknown");
  });

  it("패턴이 없는 객체를 unknown으로 분류한다", () => {
    expect(categorizeError({ code: "CUSTOM_CODE", message: "some custom error" })).toBe("unknown");
  });

  it("숫자를 unknown으로 분류한다", () => {
    expect(categorizeError(42)).toBe("unknown");
  });
});

describe("categorizeError - Supabase 에러 형태 ({ code, message, details })", () => {
  it("message에 'not authenticated'가 포함된 Supabase 에러를 auth로 분류한다", () => {
    expect(
      categorizeError({ code: "PGRST302", message: "not authenticated", details: "" })
    ).toBe("auth");
  });

  it("message에 'permission denied'가 포함된 Supabase 에러를 auth로 분류한다", () => {
    expect(
      categorizeError({ code: "42501", message: "permission denied for schema public", details: "" })
    ).toBe("auth");
  });

  it("PGRST116 not-found Supabase 에러를 not-found로 분류한다", () => {
    expect(
      categorizeError({ code: "PGRST116", message: "JSON object requested", details: "Results contain 0 rows" })
    ).toBe("not-found");
  });
});

// ---------------------------------------------------------------------------
// getErrorMessage
// ---------------------------------------------------------------------------

describe("getErrorMessage - 각 카테고리별 반환값", () => {
  it("network: title이 '네트워크 오류'이다", () => {
    const info = getErrorMessage("network");
    expect(info.title).toBe("네트워크 오류");
  });

  it("network: description이 올바른 안내 문구를 반환한다", () => {
    const info = getErrorMessage("network");
    expect(info.description).toBeTruthy();
    expect(typeof info.description).toBe("string");
  });

  it("network: canRetry=true이다", () => {
    expect(getErrorMessage("network").canRetry).toBe(true);
  });

  it("network: icon='WifiOff'이다", () => {
    expect(getErrorMessage("network").icon).toBe("WifiOff");
  });

  it("auth: title이 '접근 권한 없음'이다", () => {
    expect(getErrorMessage("auth").title).toBe("접근 권한 없음");
  });

  it("auth: canRetry=false이다", () => {
    expect(getErrorMessage("auth").canRetry).toBe(false);
  });

  it("auth: icon='ShieldAlert'이다", () => {
    expect(getErrorMessage("auth").icon).toBe("ShieldAlert");
  });

  it("not-found: title이 '데이터를 찾을 수 없음'이다", () => {
    expect(getErrorMessage("not-found").title).toBe("데이터를 찾을 수 없음");
  });

  it("not-found: canRetry=false이다", () => {
    expect(getErrorMessage("not-found").canRetry).toBe(false);
  });

  it("not-found: icon='SearchX'이다", () => {
    expect(getErrorMessage("not-found").icon).toBe("SearchX");
  });

  it("server: title이 '서버 오류'이다", () => {
    expect(getErrorMessage("server").title).toBe("서버 오류");
  });

  it("server: canRetry=true이다", () => {
    expect(getErrorMessage("server").canRetry).toBe(true);
  });

  it("server: icon='ServerCrash'이다", () => {
    expect(getErrorMessage("server").icon).toBe("ServerCrash");
  });

  it("unknown: title이 '오류 발생'이다", () => {
    expect(getErrorMessage("unknown").title).toBe("오류 발생");
  });

  it("unknown: canRetry=true이다", () => {
    expect(getErrorMessage("unknown").canRetry).toBe(true);
  });

  it("unknown: icon='AlertTriangle'이다", () => {
    expect(getErrorMessage("unknown").icon).toBe("AlertTriangle");
  });

  it("반환 객체는 title, description, canRetry, icon 필드를 모두 갖는다", () => {
    const info = getErrorMessage("server");
    expect(info).toHaveProperty("title");
    expect(info).toHaveProperty("description");
    expect(info).toHaveProperty("canRetry");
    expect(info).toHaveProperty("icon");
  });
});
