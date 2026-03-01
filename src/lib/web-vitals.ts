import type { Metric } from "web-vitals";
import logger from "@/lib/logger";

// ─── 임계값 정의 (Google Core Web Vitals 기준) ───────────────────────────────
const THRESHOLDS: Record<string, number> = {
  CLS: 0.1,    // Cumulative Layout Shift (단위 없음, 소수)
  LCP: 2500,   // Largest Contentful Paint (ms)
  FID: 100,    // First Input Delay (ms)
  INP: 200,    // Interaction to Next Paint (ms)
  TTFB: 800,   // Time to First Byte (ms)
  FCP: 1800,   // First Contentful Paint (ms) - 참고값
};

// ─── 세션 단위 in-memory 메트릭 저장소 ──────────────────────────────────────
const sessionMetrics: Map<string, number[]> = new Map();

/**
 * 백분위수(percentile) 계산
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * 평균 계산
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Web Vitals 메트릭 수집 및 임계값 경고
 *
 * - 세션 메트릭에 값 누적 저장
 * - 임계값 초과 시 logger.warn으로 경고
 * - 개발 환경에서는 logger.debug로 정상 메트릭도 출력
 */
export function reportWebVitals(metric: Metric): void {
  const { name, value, rating } = metric;

  // 1. 세션 메트릭에 저장
  const existing = sessionMetrics.get(name) ?? [];
  existing.push(value);
  sessionMetrics.set(name, existing);

  // 2. 임계값 초과 여부 판단
  const threshold = THRESHOLDS[name];
  const isOverThreshold = threshold !== undefined && value > threshold;

  // CLS는 단위가 없고, 나머지는 ms 단위
  const unit = name === "CLS" ? "" : "ms";
  const formattedValue =
    name === "CLS" ? value.toFixed(3) : `${Math.round(value)}${unit}`;
  const formattedThreshold =
    threshold !== undefined
      ? name === "CLS"
        ? threshold.toFixed(3)
        : `${threshold}${unit}`
      : "N/A";

  // 3. 로깅
  if (isOverThreshold || rating === "poor") {
    logger.warn(
      `${name} ${formattedValue} (임계값: ${formattedThreshold}) - ${rating}`,
      "Web Vitals"
    );
  } else if (process.env.NODE_ENV === "development") {
    logger.debug(
      `${name}: ${formattedValue} (${rating})`,
      "Web Vitals"
    );
  }
}

/**
 * 현재 세션의 메트릭 요약 반환 (개발 도구/디버그용)
 *
 * @returns 각 메트릭별 평균, P75, 수집 횟수
 *
 * @example
 * import { getSessionMetrics } from "@/lib/web-vitals";
 * console.table(getSessionMetrics());
 */
export function getSessionMetrics(): Record<
  string,
  { avg: number; p75: number; count: number; overThreshold: boolean }
> {
  const result: Record<
    string,
    { avg: number; p75: number; count: number; overThreshold: boolean }
  > = {};

  sessionMetrics.forEach((values, name) => {
    const avg = average(values);
    const p75 = percentile(values, 75);
    const threshold = THRESHOLDS[name];
    result[name] = {
      avg: name === "CLS" ? Number(avg.toFixed(4)) : Math.round(avg),
      p75: name === "CLS" ? Number(p75.toFixed(4)) : Math.round(p75),
      count: values.length,
      overThreshold: threshold !== undefined && p75 > threshold,
    };
  });

  return result;
}

/**
 * 컴포넌트 렌더링 시간 측정 (개발 환경 전용)
 *
 * @param componentName 측정할 컴포넌트 이름
 * @returns 렌더링 종료를 알리는 함수 (호출 시 측정 완료)
 *
 * @example
 * function MyComponent() {
 *   const endMeasure = measureRender("MyComponent");
 *   // ... 렌더링 로직 ...
 *   endMeasure(); // 렌더링 완료 시점에 호출
 * }
 */
export function measureRender(componentName: string): () => void {
  if (process.env.NODE_ENV !== "development") return () => {};

  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    // 60fps 기준 프레임 예산(16.67ms) 초과 시 경고
    if (duration > 16) {
      logger.warn(
        `Slow render: ${duration.toFixed(1)}ms`,
        componentName
      );
    } else {
      logger.debug(
        `Render: ${duration.toFixed(1)}ms`,
        componentName
      );
    }
  };
}
