import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeText } from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("& 문자를 &amp;로 이스케이프한다", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("< 문자를 &lt;로 이스케이프한다", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("> 문자를 &gt;로 이스케이프한다", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it('큰따옴표를 &quot;로 이스케이프한다', () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("작은따옴표를 &#039;로 이스케이프한다", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("모든 HTML 특수문자를 동시에 이스케이프한다", () => {
    const input = `<div class="test" data-val='it&me'>content</div>`;
    const output = escapeHtml(input);
    expect(output).toBe(
      "&lt;div class=&quot;test&quot; data-val=&#039;it&amp;me&#039;&gt;content&lt;/div&gt;"
    );
  });

  it("특수문자가 없는 텍스트는 그대로 반환한다", () => {
    expect(escapeHtml("안녕하세요 일반 텍스트")).toBe(
      "안녕하세요 일반 텍스트"
    );
  });

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("XSS 스크립트 태그를 이스케이프한다", () => {
    const xss = '<script>alert("XSS")</script>';
    const result = escapeHtml(xss);
    expect(result).toBe(
      "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
    );
    expect(result).not.toContain("<script>");
  });

  it("중복 특수문자도 모두 이스케이프한다", () => {
    expect(escapeHtml("&&<<>>")).toBe("&amp;&amp;&lt;&lt;&gt;&gt;");
  });
});

describe("sanitizeText", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(sanitizeText("  안녕하세요  ")).toBe("안녕하세요");
  });

  it("앞쪽 공백만 있어도 제거한다", () => {
    expect(sanitizeText("   텍스트")).toBe("텍스트");
  });

  it("뒤쪽 공백만 있어도 제거한다", () => {
    expect(sanitizeText("텍스트   ")).toBe("텍스트");
  });

  it("3줄 이상 연속 줄바꿈을 2줄로 제한한다", () => {
    const input = "첫 번째\n\n\n세 번째";
    expect(sanitizeText(input)).toBe("첫 번째\n\n세 번째");
  });

  it("4줄 이상 연속 줄바꿈도 2줄로 제한한다", () => {
    const input = "A\n\n\n\n\nB";
    expect(sanitizeText(input)).toBe("A\n\nB");
  });

  it("2줄 줄바꿈은 그대로 유지한다", () => {
    const input = "첫 번째\n\n두 번째";
    expect(sanitizeText(input)).toBe("첫 번째\n\n두 번째");
  });

  it("1줄 줄바꿈은 그대로 유지한다", () => {
    const input = "첫 번째\n두 번째";
    expect(sanitizeText(input)).toBe("첫 번째\n두 번째");
  });

  it("공백과 줄바꿈 정리를 동시에 처리한다", () => {
    const input = "  텍스트\n\n\n더 많은 텍스트  ";
    expect(sanitizeText(input)).toBe("텍스트\n\n더 많은 텍스트");
  });

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("공백만 있는 문자열은 빈 문자열을 반환한다", () => {
    expect(sanitizeText("   ")).toBe("");
  });

  it("줄바꿈이 없는 일반 텍스트는 trim만 처리한다", () => {
    expect(sanitizeText("일반 텍스트")).toBe("일반 텍스트");
  });

  it("여러 곳에 있는 과도한 줄바꿈을 모두 처리한다", () => {
    const input = "A\n\n\nB\n\n\n\nC";
    expect(sanitizeText(input)).toBe("A\n\nB\n\nC");
  });
});
