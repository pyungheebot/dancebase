import type { Schedule } from "@/types";

/**
 * Date 객체를 ICS UTC 형식 문자열로 변환
 * 예: 20260301T140000Z
 */
function toIcsDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * ICS 텍스트 필드에서 특수 문자를 이스케이프
 * RFC 5545 기준: 쉼표, 세미콜론, 백슬래시, 줄바꿈 이스케이프
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * 단일 Schedule 객체로부터 VEVENT 블록 생성
 */
function buildVEvent(schedule: Schedule): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `DTSTART:${toIcsDateTime(schedule.starts_at)}`,
    `DTEND:${toIcsDateTime(schedule.ends_at)}`,
    `SUMMARY:${escapeIcsText(schedule.title)}`,
    `UID:${schedule.id}@dancebase`,
  ];

  if (schedule.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(schedule.description)}`);
  }

  if (schedule.location) {
    lines.push(`LOCATION:${escapeIcsText(schedule.location)}`);
  }

  if (schedule.address) {
    lines.push(`GEO:${schedule.latitude ?? ""};${schedule.longitude ?? ""}`);
  }

  lines.push(
    `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
    "END:VEVENT"
  );

  return lines.join("\r\n");
}

/**
 * 단일 일정을 ICS 문자열로 변환
 */
export function scheduleToIcs(schedule: Schedule): string {
  const vevent = buildVEvent(schedule);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DanceBase//Schedule//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    vevent,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * 다수 일정을 하나의 ICS 문자열로 변환
 */
export function schedulesToIcs(schedules: Schedule[]): string {
  const vevents = schedules.map(buildVEvent).join("\r\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DanceBase//Schedule//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * ICS 문자열을 파일로 다운로드
 */
export function downloadIcs(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
