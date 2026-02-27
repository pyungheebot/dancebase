"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Loader2, Info, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  calculateDistance,
  isWithinAttendanceWindow,
  isWithinCheckoutWindow,
  determineAttendanceStatus,
  ATTENDANCE_RADIUS_METERS,
} from "@/lib/geo";
import type { AttendanceStatus, GroupMemberWithProfile, Schedule } from "@/types";
import { getCategoryColorClasses } from "@/types";

type AttendanceRecord = {
  user_id: string;
  status: AttendanceStatus;
  checked_at?: string;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  checked_out_at?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  profiles: { name: string; dance_genre: string[] };
};

type AttendanceTableProps = {
  schedule: Schedule;
  members: GroupMemberWithProfile[];
  attendance: AttendanceRecord[];
  myRole: "leader" | "member" | null;
  currentUserId: string;
  groupId?: string;
  categoryMap?: Record<string, string>;
  categoryColorMap?: Record<string, string>;
  onUpdate: () => void;
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: "출석",
  absent: "결석",
  late: "지각",
  early_leave: "조퇴",
};

const statusColors: Record<AttendanceStatus, "default" | "destructive" | "secondary"> = {
  present: "default",
  absent: "destructive",
  late: "secondary",
  early_leave: "secondary",
};

export function AttendanceTable({
  schedule,
  members,
  attendance,
  myRole,
  currentUserId,
  groupId,
  categoryMap,
  categoryColorMap,
  onUpdate,
}: AttendanceTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const supabase = createClient();

  const getAttendance = (userId: string) =>
    attendance.find((a) => a.user_id === userId);

  const handleStatusChange = async (userId: string, status: AttendanceStatus) => {
    setUpdating(userId);

    const existing = getAttendance(userId);

    if (existing) {
      const { error } = await supabase
        .from("attendance")
        .update({ status, checked_at: new Date().toISOString() })
        .eq("schedule_id", schedule.id)
        .eq("user_id", userId);
      if (error) { toast.error("출석 상태 변경에 실패했습니다"); setUpdating(null); return; }
    } else {
      const { error } = await supabase.from("attendance").insert({
        schedule_id: schedule.id,
        user_id: userId,
        status,
      });
      if (error) { toast.error("출석 체크에 실패했습니다"); setUpdating(null); return; }
    }

    onUpdate();
    setUpdating(null);
  };

  const handleLocationCheck = async () => {
    setGpsError(null);
    setUpdating(currentUserId);

    // 시간 윈도우 확인
    if (!isWithinAttendanceWindow(schedule.starts_at, schedule.ends_at, schedule.attendance_deadline)) {
      setGpsError("출석 가능 시간이 아닙니다");
      setUpdating(null);
      return;
    }

    // 자동 지각/마감 판단
    const autoStatus = determineAttendanceStatus(
      schedule.starts_at,
      schedule.late_threshold,
      schedule.attendance_deadline
    );
    if (autoStatus === null) {
      setGpsError("출석 마감 시간이 지났습니다");
      setUpdating(null);
      return;
    }

    if (schedule.latitude == null || schedule.longitude == null) {
      setGpsError("일정에 위치 정보가 없습니다");
      setUpdating(null);
      return;
    }

    // GPS 위치 획득
    if (!navigator.geolocation) {
      setGpsError("이 브라우저에서는 위치 확인을 지원하지 않습니다");
      setUpdating(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const distance = calculateDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          schedule.latitude!,
          schedule.longitude!
        );

        if (distance > ATTENDANCE_RADIUS_METERS) {
          setGpsError(
            `현재 위치가 일정 장소에서 ${Math.round(distance)}m 떨어져 있습니다 (${ATTENDANCE_RADIUS_METERS}m 이내 필요)`
          );
          setUpdating(null);
          return;
        }

        // GPS 좌표 포함하여 출석 처리
        const existing = getAttendance(currentUserId);
        if (existing) {
          const { error } = await supabase
            .from("attendance")
            .update({
              status: autoStatus,
              checked_at: new Date().toISOString(),
              check_in_latitude: pos.coords.latitude,
              check_in_longitude: pos.coords.longitude,
            })
            .eq("schedule_id", schedule.id)
            .eq("user_id", currentUserId);
          if (error) { toast.error("출석 체크에 실패했습니다"); setUpdating(null); return; }
        } else {
          const { error } = await supabase.from("attendance").insert({
            schedule_id: schedule.id,
            user_id: currentUserId,
            status: autoStatus,
            check_in_latitude: pos.coords.latitude,
            check_in_longitude: pos.coords.longitude,
          });
          if (error) { toast.error("출석 체크에 실패했습니다"); setUpdating(null); return; }
        }

        onUpdate();
        setUpdating(null);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.",
          2: "위치를 확인할 수 없습니다. 잠시 후 다시 시도해주세요.",
          3: "위치 확인 시간이 초과되었습니다.",
        };
        setGpsError(messages[err.code] || "위치 확인에 실패했습니다");
        setUpdating(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCheckout = async (userId: string) => {
    setUpdating(userId);

    if (!isWithinCheckoutWindow(schedule.starts_at, schedule.ends_at)) {
      toast.error("체크아웃 가능 시간이 아닙니다");
      setUpdating(null);
      return;
    }

    const useLocationForCheckout = schedule.attendance_method === "location";

    if (useLocationForCheckout && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { error } = await supabase
            .from("attendance")
            .update({
              checked_out_at: new Date().toISOString(),
              check_out_latitude: pos.coords.latitude,
              check_out_longitude: pos.coords.longitude,
            })
            .eq("schedule_id", schedule.id)
            .eq("user_id", userId);
          if (error) { toast.error("종료확인에 실패했습니다"); }
          onUpdate();
          setUpdating(null);
        },
        async () => {
          // GPS 실패 시 시간만 기록
          const { error } = await supabase
            .from("attendance")
            .update({ checked_out_at: new Date().toISOString() })
            .eq("schedule_id", schedule.id)
            .eq("user_id", userId);
          if (error) { toast.error("종료확인에 실패했습니다"); }
          onUpdate();
          setUpdating(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // admin 방식: 시간만 기록
      const { error } = await supabase
        .from("attendance")
        .update({ checked_out_at: new Date().toISOString() })
        .eq("schedule_id", schedule.id)
        .eq("user_id", userId);
      if (error) { toast.error("종료확인에 실패했습니다"); }
      onUpdate();
      setUpdating(null);
    }
  };

  const isLocationMethod = schedule.attendance_method === "location";
  const isAdminMethod = schedule.attendance_method === "admin";

  return (
    <div className="space-y-1.5">
      {gpsError && (
        <div className="px-2.5 py-1.5 rounded bg-destructive/10 text-destructive text-xs">
          {gpsError}
        </div>
      )}

      {members.map((member) => {
        const record = getAttendance(member.user_id);
        const isMe = member.user_id === currentUserId;
        const isLeader = myRole === "leader";

        // 리더는 항상 Select로 수정 가능
        if (isLeader) {
          const hasCheckInfo = record && (record.checked_at || record.checked_out_at);
          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between px-2.5 py-1.5 rounded border"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>
                    {(member.nickname || member.profiles.name)?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {categoryMap?.[member.user_id] && (() => {
                  const cc = getCategoryColorClasses(categoryColorMap?.[member.user_id] || "gray");
                  return (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cc.bg} ${cc.text} ${cc.border}`}>{categoryMap[member.user_id]}</Badge>
                  );
                })()}
                <UserPopoverMenu userId={member.user_id} displayName={member.nickname || member.profiles.name} groupId={groupId} className="text-xs font-medium hover:underline text-left">{member.nickname || member.profiles.name}</UserPopoverMenu>
              </div>
              <div className="flex items-center gap-1.5">
                {hasCheckInfo && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 text-xs space-y-1 p-3">
                      {record.checked_at && (
                        <p>체크인: {new Date(record.checked_at).toLocaleString("ko-KR")}</p>
                      )}
                      {record.check_in_latitude != null && record.check_in_longitude != null && (
                        <p className="text-muted-foreground">위치: {record.check_in_latitude.toFixed(5)}, {record.check_in_longitude.toFixed(5)}</p>
                      )}
                      {record.checked_out_at && (
                        <>
                          <p>체크아웃: {new Date(record.checked_out_at).toLocaleString("ko-KR")}</p>
                          {record.check_out_latitude != null && record.check_out_longitude != null && (
                            <p className="text-muted-foreground">위치: {record.check_out_latitude.toFixed(5)}, {record.check_out_longitude.toFixed(5)}</p>
                          )}
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                {schedule.require_checkout && record && (record.status === "present" || record.status === "late" || record.status === "early_leave") && !record.checked_out_at && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => handleCheckout(member.user_id)}
                    disabled={updating === member.user_id}
                  >
                    <LogOut className="h-3 w-3 mr-0.5" />
                    종료확인
                  </Button>
                )}
                {record?.checked_out_at && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">종료확인완료</Badge>
                )}
                <Select
                  value={record?.status || "absent"}
                  onValueChange={(value) =>
                    handleStatusChange(member.user_id, value as AttendanceStatus)
                  }
                  disabled={updating === member.user_id}
                >
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">출석</SelectItem>
                    <SelectItem value="late">지각</SelectItem>
                    <SelectItem value="early_leave">조퇴</SelectItem>
                    <SelectItem value="absent">결석</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }

        // 멤버 본인
        if (isMe) {
          if (isLocationMethod) {
            const alreadyChecked = record?.status === "present" || record?.status === "late" || record?.status === "early_leave";
            const needsCheckout = schedule.require_checkout && alreadyChecked && !record?.checked_out_at;
            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded border"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {(member.nickname || member.profiles.name)?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {categoryMap?.[member.user_id] && (() => {
                  const cc = getCategoryColorClasses(categoryColorMap?.[member.user_id] || "gray");
                  return (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cc.bg} ${cc.text} ${cc.border}`}>{categoryMap[member.user_id]}</Badge>
                  );
                })()}
                <UserPopoverMenu userId={member.user_id} displayName={member.nickname || member.profiles.name} groupId={groupId} className="text-xs font-medium hover:underline text-left">{member.nickname || member.profiles.name}</UserPopoverMenu>
                </div>
                <div className="flex items-center gap-1.5">
                  {alreadyChecked ? (
                    <>
                      <Badge variant={statusColors[record!.status]}>
                        {statusLabels[record!.status]}
                      </Badge>
                      {needsCheckout && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px]"
                          onClick={() => handleCheckout(currentUserId)}
                          disabled={updating === currentUserId}
                        >
                          {updating === currentUserId ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-0.5" />
                          ) : (
                            <LogOut className="h-3 w-3 mr-0.5" />
                          )}
                          종료확인
                        </Button>
                      )}
                      {record?.checked_out_at && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">종료확인완료</Badge>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLocationCheck}
                      disabled={updating === currentUserId}
                    >
                      {updating === currentUserId ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-1" />
                      )}
                      출석 체크
                    </Button>
                  )}
                </div>
              </div>
            );
          }

          if (isAdminMethod) {
            const adminChecked = record?.status === "present" || record?.status === "late" || record?.status === "early_leave";
            const adminNeedsCheckout = schedule.require_checkout && adminChecked && !record?.checked_out_at;
            return (
              <div
                key={member.user_id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded border"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {(member.nickname || member.profiles.name)?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {categoryMap?.[member.user_id] && (() => {
                  const cc = getCategoryColorClasses(categoryColorMap?.[member.user_id] || "gray");
                  return (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cc.bg} ${cc.text} ${cc.border}`}>{categoryMap[member.user_id]}</Badge>
                  );
                })()}
                <UserPopoverMenu userId={member.user_id} displayName={member.nickname || member.profiles.name} groupId={groupId} className="text-xs font-medium hover:underline text-left">{member.nickname || member.profiles.name}</UserPopoverMenu>
                </div>
                <div className="flex items-center gap-1.5">
                  {adminNeedsCheckout && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={() => handleCheckout(currentUserId)}
                      disabled={updating === currentUserId}
                    >
                      {updating === currentUserId ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-0.5" />
                      ) : (
                        <LogOut className="h-3 w-3 mr-0.5" />
                      )}
                      종료확인
                    </Button>
                  )}
                  {record?.checked_out_at && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">종료확인완료</Badge>
                  )}
                  <Select
                    value={record?.status || "absent"}
                    onValueChange={(value) =>
                      handleStatusChange(member.user_id, value as AttendanceStatus)
                    }
                    disabled={updating === member.user_id}
                  >
                    <SelectTrigger className="w-20 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">출석</SelectItem>
                      <SelectItem value="late">지각</SelectItem>
                      <SelectItem value="absent">결석</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          }
        }

        // 일반 멤버가 다른 사람 보기 (읽기 전용)
        return (
          <div
            key={member.user_id}
            className="flex items-center justify-between px-2.5 py-1.5 rounded border"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {(member.nickname || member.profiles.name)?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <UserPopoverMenu userId={member.user_id} displayName={member.nickname || member.profiles.name} groupId={groupId} className="text-xs font-medium hover:underline text-left">{member.nickname || member.profiles.name}</UserPopoverMenu>
            </div>
            <Badge variant={statusColors[record?.status || "absent"]}>
              {statusLabels[record?.status || "absent"]}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
