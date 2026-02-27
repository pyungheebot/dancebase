export const ATTENDANCE_RADIUS_METERS = 150;

/** Haversine 공식으로 두 좌표 간 거리(미터)를 계산합니다 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반지름 (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 현재 시각이 일정 시작 30분 전 ~ 종료 30분 후 (또는 마감시간) 범위 내인지 확인합니다 */
export function isWithinAttendanceWindow(
  startsAt: string,
  endsAt: string,
  attendanceDeadline?: string | null
): boolean {
  const now = Date.now();
  const THIRTY_MIN = 30 * 60 * 1000;
  const start = new Date(startsAt).getTime() - THIRTY_MIN;
  const end = attendanceDeadline
    ? new Date(attendanceDeadline).getTime()
    : new Date(endsAt).getTime() + THIRTY_MIN;
  return now >= start && now <= end;
}

/** 현재 시각 기준으로 출석 상태를 판단합니다. 마감 후에는 null 반환 */
export function determineAttendanceStatus(
  startsAt: string,
  lateThreshold?: string | null,
  attendanceDeadline?: string | null
): "present" | "late" | null {
  const now = Date.now();
  const THIRTY_MIN = 30 * 60 * 1000;
  const deadline = attendanceDeadline
    ? new Date(attendanceDeadline).getTime()
    : new Date(startsAt).getTime() + THIRTY_MIN;

  if (now > deadline) return null;

  const threshold = lateThreshold
    ? new Date(lateThreshold).getTime()
    : new Date(startsAt).getTime();

  return now <= threshold ? "present" : "late";
}

/** 현재 시각이 체크아웃 가능 시간대(시작~종료 30분 후)인지 확인합니다 */
export function isWithinCheckoutWindow(
  startsAt: string,
  endsAt: string
): boolean {
  const now = Date.now();
  const THIRTY_MIN = 30 * 60 * 1000;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime() + THIRTY_MIN;
  return now >= start && now <= end;
}
