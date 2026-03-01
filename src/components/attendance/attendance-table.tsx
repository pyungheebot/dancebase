"use client";

import { useState, useCallback, useMemo, memo } from "react";
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
import { MapPin, Loader2, Info, LogOut, FileText } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  calculateDistance,
  isWithinAttendanceWindow,
  isWithinCheckoutWindow,
  determineAttendanceStatus,
  ATTENDANCE_RADIUS_METERS,
} from "@/lib/geo";
import type { AttendanceStatus, ExcuseStatus, GroupMemberWithProfile, Schedule } from "@/types";
import { getCategoryColorClasses } from "@/types";
import { AttendanceExcuseBadge } from "@/components/attendance/attendance-excuse-badge";
import { AttendanceExcuseDialog } from "@/components/attendance/attendance-excuse-dialog";

type AttendanceRecord = {
  id?: string;
  user_id: string;
  status: AttendanceStatus;
  checked_at?: string;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  checked_out_at?: string | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  excuse_reason?: string | null;
  excuse_status?: ExcuseStatus | null;
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

type AttendanceRowProps = {
  member: GroupMemberWithProfile;
  record: AttendanceRecord | undefined;
  schedule: Schedule;
  myRole: "leader" | "member" | null;
  currentUserId: string;
  groupId?: string;
  categoryMap?: Record<string, string>;
  categoryColorMap?: Record<string, string>;
  /** 이 행의 멤버가 현재 업데이트 중인지 여부 (전체 updating 상태 대신 boolean으로 최소화) */
  isUpdating: boolean;
  onStatusChange: (userId: string, status: AttendanceStatus) => void;
  onCheckout: (userId: string) => void;
  onLocationCheck: () => void;
  onExcuseDialogOpen: () => void;
  onUpdate: () => void;
};

const AttendanceRow = memo(function AttendanceRow({
  member,
  record,
  schedule,
  myRole,
  currentUserId,
  groupId,
  categoryMap,
  categoryColorMap,
  isUpdating,
  onStatusChange,
  onCheckout,
  onLocationCheck,
  onExcuseDialogOpen,
  onUpdate,
}: AttendanceRowProps) {
  const isMe = member.user_id === currentUserId;
  const isLeader = myRole === "leader";
  const isLocationMethod = schedule.attendance_method === "location";
  const isAdminMethod = schedule.attendance_method === "admin";

  const CategoryBadge = categoryMap?.[member.user_id] ? (() => {
    const cc = getCategoryColorClasses(categoryColorMap?.[member.user_id] || "gray");
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cc.bg} ${cc.text} ${cc.border}`}>
        {categoryMap![member.user_id]}
      </Badge>
    );
  })() : null;

  const memberName = member.nickname || member.profiles.name;

  // 리더는 항상 Select로 수정 가능
  if (isLeader) {
    const hasCheckInfo = record && (record.checked_at || record.checked_out_at);
    return (
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded border">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>
              {memberName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {CategoryBadge}
          <UserPopoverMenu userId={member.user_id} displayName={memberName} groupId={groupId} className="text-xs font-medium hover:underline text-left">
            {memberName}
          </UserPopoverMenu>
        </div>
        <div className="flex items-center gap-1.5">
          {record?.excuse_status && record.id && (
            <AttendanceExcuseBadge
              attendanceId={record.id}
              scheduleId={schedule.id}
              excuseStatus={record.excuse_status}
              excuseReason={record.excuse_reason ?? null}
              isLeader
              onUpdated={onUpdate}
            />
          )}
          {hasCheckInfo && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 text-xs space-y-1 p-3">
                {record!.checked_at && (
                  <p>체크인: {new Date(record!.checked_at).toLocaleString("ko-KR")}</p>
                )}
                {record!.check_in_latitude != null && record!.check_in_longitude != null && (
                  <p className="text-muted-foreground">위치: {record!.check_in_latitude!.toFixed(5)}, {record!.check_in_longitude!.toFixed(5)}</p>
                )}
                {record!.checked_out_at && (
                  <>
                    <p>체크아웃: {new Date(record!.checked_out_at).toLocaleString("ko-KR")}</p>
                    {record!.check_out_latitude != null && record!.check_out_longitude != null && (
                      <p className="text-muted-foreground">위치: {record!.check_out_latitude!.toFixed(5)}, {record!.check_out_longitude!.toFixed(5)}</p>
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
              onClick={() => onCheckout(member.user_id)}
              disabled={isUpdating}
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
            onValueChange={(value) => onStatusChange(member.user_id, value as AttendanceStatus)}
            disabled={isUpdating}
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
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded border">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                {memberName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {CategoryBadge}
            <UserPopoverMenu userId={member.user_id} displayName={memberName} groupId={groupId} className="text-xs font-medium hover:underline text-left">
              {memberName}
            </UserPopoverMenu>
          </div>
          <div className="flex items-center gap-1.5">
            {record?.excuse_status && record.id && (
              <AttendanceExcuseBadge
                attendanceId={record.id}
                scheduleId={schedule.id}
                excuseStatus={record.excuse_status}
                excuseReason={record.excuse_reason ?? null}
                isLeader={false}
              />
            )}
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
                    onClick={() => onCheckout(currentUserId)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
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
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLocationCheck}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <MapPin className="h-3 w-3 mr-1" />
                  )}
                  출석 체크
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-1.5"
                  onClick={onExcuseDialogOpen}
                  title="결석 사유 제출"
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (isAdminMethod) {
      const adminChecked = record?.status === "present" || record?.status === "late" || record?.status === "early_leave";
      const adminNeedsCheckout = schedule.require_checkout && adminChecked && !record?.checked_out_at;
      return (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded border">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                {memberName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {CategoryBadge}
            <UserPopoverMenu userId={member.user_id} displayName={memberName} groupId={groupId} className="text-xs font-medium hover:underline text-left">
              {memberName}
            </UserPopoverMenu>
          </div>
          <div className="flex items-center gap-1.5">
            {record?.excuse_status && record.id && (
              <AttendanceExcuseBadge
                attendanceId={record.id}
                scheduleId={schedule.id}
                excuseStatus={record.excuse_status}
                excuseReason={record.excuse_reason ?? null}
                isLeader={false}
              />
            )}
            {adminNeedsCheckout && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px]"
                onClick={() => onCheckout(currentUserId)}
                disabled={isUpdating}
              >
                {isUpdating ? (
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
              onValueChange={(value) => onStatusChange(member.user_id, value as AttendanceStatus)}
              disabled={isUpdating}
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
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-1.5"
              onClick={onExcuseDialogOpen}
              title="결석 사유 제출"
            >
              <FileText className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }
  }

  // 일반 멤버가 다른 사람 보기 (읽기 전용)
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded border">
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback>
            {memberName?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <UserPopoverMenu userId={member.user_id} displayName={memberName} groupId={groupId} className="text-xs font-medium hover:underline text-left">
          {memberName}
        </UserPopoverMenu>
      </div>
      <div className="flex items-center gap-1.5">
        {record?.excuse_status && record.id && (
          <AttendanceExcuseBadge
            attendanceId={record.id}
            scheduleId={schedule.id}
            excuseStatus={record.excuse_status}
            excuseReason={record.excuse_reason ?? null}
            isLeader={false}
          />
        )}
        <Badge variant={statusColors[record?.status || "absent"]}>
          {statusLabels[record?.status || "absent"]}
        </Badge>
      </div>
    </div>
  );
});

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
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const supabase = createClient();

  // attendance 배열을 Map으로 캐싱하여 O(1) 룩업
  const attendanceMap = useMemo(
    () => new Map(attendance.map((a) => [a.user_id, a])),
    [attendance]
  );

  const getAttendance = useCallback(
    (userId: string) => attendanceMap.get(userId),
    [attendanceMap]
  );

  // 출석 통계 계산 캐싱 (출석/지각/조퇴/결석 카운트)
  const attendanceStats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "present").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const earlyLeave = attendance.filter((a) => a.status === "early_leave").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    return { present, late, earlyLeave, absent, total: attendance.length };
  }, [attendance]);

  const handleStatusChange = useCallback(async (userId: string, status: AttendanceStatus) => {
    setUpdating(userId);

    const existing = getAttendance(userId);

    if (existing) {
      const { error } = await supabase
        .from("attendance")
        .update({ status, checked_at: new Date().toISOString() })
        .eq("schedule_id", schedule.id)
        .eq("user_id", userId);
      if (error) { toast.error(TOAST.ATTENDANCE.STATUS_CHANGE_ERROR); setUpdating(null); return; }
    } else {
      const { error } = await supabase.from("attendance").insert({
        schedule_id: schedule.id,
        user_id: userId,
        status,
      });
      if (error) { toast.error(TOAST.ATTENDANCE.CHECK_ERROR); setUpdating(null); return; }
    }

    onUpdate();
    setUpdating(null);
  }, [schedule, onUpdate, getAttendance, supabase]);

  const handleLocationCheck = useCallback(async () => {
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
          if (error) { toast.error(TOAST.ATTENDANCE.CHECK_ERROR); setUpdating(null); return; }
        } else {
          const { error } = await supabase.from("attendance").insert({
            schedule_id: schedule.id,
            user_id: currentUserId,
            status: autoStatus,
            check_in_latitude: pos.coords.latitude,
            check_in_longitude: pos.coords.longitude,
          });
          if (error) { toast.error(TOAST.ATTENDANCE.CHECK_ERROR); setUpdating(null); return; }
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
  }, [schedule, currentUserId, onUpdate, getAttendance, supabase]);

  const handleCheckout = useCallback(async (userId: string) => {
    setUpdating(userId);

    if (!isWithinCheckoutWindow(schedule.starts_at, schedule.ends_at)) {
      toast.error(TOAST.ATTENDANCE.CHECKOUT_TIME_ERROR);
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
          if (error) { toast.error(TOAST.ATTENDANCE.CHECKOUT_ERROR); }
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
          if (error) { toast.error(TOAST.ATTENDANCE.CHECKOUT_ERROR); }
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
      if (error) { toast.error(TOAST.ATTENDANCE.CHECKOUT_ERROR); }
      onUpdate();
      setUpdating(null);
    }
  }, [schedule, onUpdate, supabase]);

  const handleExcuseDialogOpen = useCallback(() => {
    setExcuseDialogOpen(true);
  }, []);

  return (
    <div className="space-y-1.5">
      {gpsError && (
        <div className="px-2.5 py-1.5 rounded bg-destructive/10 text-destructive text-xs">
          {gpsError}
        </div>
      )}

      {/* 출석 통계 요약 (멤버가 있을 때만 표시) */}
      {members.length > 0 && attendanceStats.total > 0 && (
        <div className="flex items-center gap-1.5 px-0.5">
          <span className="text-[10px] text-muted-foreground">출석 현황:</span>
          {attendanceStats.present > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">출석 {attendanceStats.present}</Badge>
          )}
          {attendanceStats.late > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">지각 {attendanceStats.late}</Badge>
          )}
          {attendanceStats.earlyLeave > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">조퇴 {attendanceStats.earlyLeave}</Badge>
          )}
          {attendanceStats.absent > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">결석 {attendanceStats.absent}</Badge>
          )}
        </div>
      )}

      {members.map((member) => (
        <AttendanceRow
          key={member.user_id}
          member={member}
          record={getAttendance(member.user_id)}
          schedule={schedule}
          myRole={myRole}
          currentUserId={currentUserId}
          groupId={groupId}
          categoryMap={categoryMap}
          categoryColorMap={categoryColorMap}
          isUpdating={updating === member.user_id}
          onStatusChange={handleStatusChange}
          onCheckout={handleCheckout}
          onLocationCheck={handleLocationCheck}
          onExcuseDialogOpen={handleExcuseDialogOpen}
          onUpdate={onUpdate}
        />
      ))}

      {/* 면제 신청 Dialog (멤버 본인) */}
      <AttendanceExcuseDialog
        scheduleId={schedule.id}
        userId={currentUserId}
        open={excuseDialogOpen}
        onOpenChange={setExcuseDialogOpen}
        onSubmitted={onUpdate}
      />
    </div>
  );
}
