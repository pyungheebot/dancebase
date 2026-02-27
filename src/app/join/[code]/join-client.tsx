"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, CheckCircle, Clock } from "lucide-react";

type GroupInfo = {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  join_policy: string;
  dance_genre: string[];
};

type JoinClientProps = {
  group: GroupInfo;
  inviteCode: string;
};

export function JoinClient({ group, inviteCode }: JoinClientProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneType, setDoneType] = useState<"joined" | "pending" | null>(null);
  const router = useRouter();

  const handleJoin = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다");
        router.push(`/login?code=${inviteCode}`);
        return;
      }

      if (group.join_policy === "approval") {
        const { error } = await supabase.from("join_requests").insert({
          group_id: group.id,
          user_id: user.id,
          status: "pending",
        });

        if (error) {
          if (error.code === "23505") {
            toast.error("이미 가입 신청한 그룹입니다");
          } else {
            toast.error("가입 신청에 실패했습니다");
          }
          return;
        }

        setDoneType("pending");
        setDone(true);
        return;
      }

      // open 또는 invite_only: 바로 가입
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("이미 참여한 그룹입니다");
          router.push(`/groups/${group.id}`);
        } else {
          toast.error("그룹 참여에 실패했습니다");
        }
        return;
      }

      setDoneType("joined");
      setDone(true);
      toast.success(`${group.name}에 참여했습니다`);
    } catch {
      toast.error("오류가 발생했습니다. 다시 시도해 주세요");
    } finally {
      setLoading(false);
    }
  };

  if (done && doneType === "joined") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <div>
          <p className="text-lg font-semibold">가입 완료!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {group.name}에 성공적으로 참여했습니다
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push(`/groups/${group.id}`)}>
          그룹으로 이동
        </Button>
      </div>
    );
  }

  if (done && doneType === "pending") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Clock className="h-12 w-12 text-yellow-500" />
        </div>
        <div>
          <p className="text-lg font-semibold">가입 신청 완료</p>
          <p className="text-sm text-muted-foreground mt-1">
            그룹장의 승인을 기다려 주세요
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
          홈으로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{group.name}</p>
          {group.description && (
            <p className="text-xs text-muted-foreground truncate">{group.description}</p>
          )}
        </div>
      </div>

      {group.dance_genre && group.dance_genre.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {group.dance_genre.map((genre) => (
            <span
              key={genre}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>그룹 유형: {group.group_type}</p>
        <p>
          가입 방식:{" "}
          {group.join_policy === "open"
            ? "자유 가입"
            : group.join_policy === "approval"
            ? "승인 후 가입"
            : "초대 전용"}
        </p>
      </div>

      <Button className="w-full" onClick={handleJoin} disabled={loading}>
        {loading
          ? "처리 중..."
          : group.join_policy === "approval"
          ? "가입 신청하기"
          : "그룹 참여하기"}
      </Button>
    </div>
  );
}
