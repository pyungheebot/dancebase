import type { Metric } from "web-vitals";

/**
 * Web Vitals 메트릭을 콘솔에 출력 (개발) 또는 분석 서비스에 전송 (프로덕션)
 */
export function reportWebVitals(metric: Metric): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms`);
  }
  // TODO: 추후 분석 서비스(Vercel Analytics, GA 등) 연동 시 여기에 전송 코드 추가
}
