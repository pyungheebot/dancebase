import type { Metric } from "web-vitals";
import logger from "@/lib/logger";

/**
 * Web Vitals 메트릭을 콘솔에 출력 (개발) 또는 분석 서비스에 전송 (프로덕션)
 */
export function reportWebVitals(metric: Metric): void {
  logger.debug(`${metric.name}: ${Math.round(metric.value)}ms`, "Web Vitals");
  // TODO: 추후 분석 서비스(Vercel Analytics, GA 등) 연동 시 여기에 전송 코드 추가
}
