"use client";

import React from "react";
import { getRateColor } from "./types";

export interface MonthlyBarChartProps {
  data: Array<{ label: string; rate: number }>;
}

const MAX_H = 56;

export const MonthlyBarChart = React.memo(function MonthlyBarChart({
  data,
}: MonthlyBarChartProps) {
  return (
    <div className="space-y-1" role="img" aria-label="최근 6개월 출석률 바 차트">
      <div
        className="flex items-end gap-1"
        style={{ height: `${MAX_H + 16}px` }}
        aria-hidden="true"
      >
        {data.map((d, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center justify-end gap-0.5"
            style={{ height: `${MAX_H + 16}px` }}
          >
            <span className="text-[9px] text-gray-500 font-medium leading-none">
              {d.rate > 0 ? `${d.rate}%` : ""}
            </span>
            <div
              className={`w-full rounded-t transition-all ${getRateColor(d.rate)}`}
              style={{
                height: `${Math.max(
                  (d.rate / 100) * MAX_H,
                  d.rate > 0 ? 4 : 0
                )}px`,
                opacity: d.rate === 0 ? 0.15 : 1,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {data.map((d, idx) => (
          <div key={idx} className="flex-1 text-center">
            <span className="text-[9px] text-gray-400">{d.label}</span>
          </div>
        ))}
      </div>
      {/* 스크린 리더용 데이터 테이블 */}
      <table className="sr-only">
        <caption>최근 6개월 월별 출석률</caption>
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col">출석률</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, idx) => (
            <tr key={idx}>
              <td>{d.label}</td>
              <td>{d.rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
