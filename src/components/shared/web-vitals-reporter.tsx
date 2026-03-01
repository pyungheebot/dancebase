"use client";

import { useEffect } from "react";
import { reportWebVitals, getSessionMetrics } from "@/lib/web-vitals";
import logger from "@/lib/logger";

/**
 * Web Vitals 자동 수집 컴포넌트
 * layout.tsx에 포함하면 CLS, INP, FCP, LCP, TTFB 자동 측정
 *
 * - 개발 환경: 임계값 초과 메트릭 콘솔 경고 + 페이지 숨김 시 세션 요약 출력
 * - 프로덕션: 조용히 수집만 (warn/error 레벨만 출력됨)
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // web-vitals 동적 임포트 후 각 메트릭 등록
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(reportWebVitals);
      onINP(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
    });

    // 개발 환경: 탭을 닫거나 백그라운드로 이동할 때 세션 요약 출력
    if (process.env.NODE_ENV === "development") {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          const summary = getSessionMetrics();
          if (Object.keys(summary).length === 0) return;

          const hasIssues = Object.values(summary).some(
            (m) => m.overThreshold
          );

          if (hasIssues) {
            logger.warn(
              "성능 임계값을 초과한 메트릭이 있습니다.",
              "Web Vitals"
            );
            logger.warn(
              JSON.stringify(summary, null, 2),
              "Web Vitals Session Summary"
            );
          } else {
            logger.debug(
              "세션 메트릭 요약 (모든 지표 정상)",
              "Web Vitals Session Summary",
              summary
            );
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, []);

  return null;
}
