"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/web-vitals";

/**
 * Web Vitals 자동 수집 컴포넌트
 * layout.tsx에 포함하면 CLS, INP, FCP, LCP, TTFB 자동 측정
 */
export function WebVitalsReporter() {
  useEffect(() => {
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(reportWebVitals);
      onINP(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
    });
  }, []);

  return null;
}
