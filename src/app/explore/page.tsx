"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import type { Group } from "@/types";
import { createNotification } from "@/lib/notifications";

type PublicGroup = Group & { member_count: number };
type PublicProject = {
  id: string;
  group_id: string;
  group_name: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  visibility: string;
  created_at: string;
  member_count: number;
};

type ExploreTab = "groups" | "projects";

const GENRE_FILTERS = [
  "힙합", "팝핑", "락킹", "왁킹", "하우스", "크럼프",
  "브레이킹", "코레오", "K-POP", "재즈", "컨템포러리", "스트릿",
];

export default function ExplorePage() {
  const [tab, setTab] = useState<ExploreTab>("groups");
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [debouncedProjectSearchQuery, setDebouncedProjectSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [requestedGroups, setRequestedGroups] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchMyRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("join_requests")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (data) {
        setRequestedGroups(new Set(data.map((r: { group_id: string }) => r.group_id)));
      }
    };
    fetchMyRequests();
  }, [supabase]);

  // 검색어 debounce (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProjectSearchQuery(projectSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [projectSearchQuery]);

  const fetchPublicGroups = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase.rpc("get_public_groups", {
      p_search: debouncedSearchQuery || null,
      p_genre: selectedGenre || null,
    });

    if (data) {
      setGroups(data as PublicGroup[]);
    }

    setLoading(false);
  }, [supabase, debouncedSearchQuery, selectedGenre]);

  useEffect(() => {
    if (tab === "groups") fetchPublicGroups();
  }, [fetchPublicGroups, tab]);

  const fetchPublicProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_public_projects", {
      p_search: debouncedProjectSearchQuery || null,
    });
    if (data) setPublicProjects(data as PublicProject[]);
    setLoading(false);
  }, [supabase, debouncedProjectSearchQuery]);

  useEffect(() => {
    if (tab === "projects") fetchPublicProjects();
  }, [fetchPublicProjects, tab]);

  const handleJoin = async (group: PublicGroup) => {
    setJoining(group.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (group.join_policy === "open") {
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

      if (error) {
        if (error.code === "23505") {
          router.push(`/groups/${group.id}`);
        }
      } else {
        router.push(`/groups/${group.id}`);
      }
    } else if (group.join_policy === "approval") {
      const { error } = await supabase.from("join_requests").insert({
        group_id: group.id,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("이미 가입 신청한 그룹입니다.");
        } else {
          toast.error("가입 신청에 실패했습니다.");
        }
      } else {
        setRequestedGroups((prev) => new Set([...prev, group.id]));
        toast.success("가입 신청이 접수되었습니다. 그룹장의 승인을 기다려주세요.");

        // 그룹 리더에게 가입 신청 알림
        const { data: leaderData } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", group.id)
          .eq("role", "leader")
          .limit(1)
          .single();

        if (leaderData && leaderData.user_id !== user.id) {
          const applicantName =
            (await supabase.from("profiles").select("name").eq("id", user.id).single()).data?.name ?? "누군가";
          await createNotification({
            userId: leaderData.user_id,
            type: "join_request",
            title: "가입 신청",
            message: `${applicantName}님이 ${group.name} 가입을 신청했습니다`,
            link: `/groups/${group.id}/settings`,
          });
        }
      }
    } else {
      router.push("/dashboard?join=true");
    }

    setJoining(null);
  };

  const getJoinButtonLabel = (policy: string) => {
    switch (policy) {
      case "open":
        return "바로 가입";
      case "approval":
        return "가입 신청";
      default:
        return "초대 코드 필요";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-xl font-bold mb-4">탐색</h1>

        {/* 탭 전환 */}
        <div className="flex gap-1 mb-4">
          <Button
            variant={tab === "groups" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setTab("groups")}
          >
            그룹
          </Button>
          <Button
            variant={tab === "projects" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setTab("projects")}
          >
            공개 프로젝트
          </Button>
        </div>

        {tab === "groups" && (
          <>
            {/* 검색 */}
            <div className="mb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="그룹 이름으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
            </div>

            {/* 장르 필터 */}
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  selectedGenre === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                전체
              </button>
              {GENRE_FILTERS.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    selectedGenre === genre
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* 그룹 목록 */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">공개 그룹이 없습니다</p>
              </div>
            ) : (
              <div className="rounded border divide-y">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/groups/${group.id}`}
                          className="text-xs font-medium hover:underline truncate"
                        >
                          {group.name}
                        </Link>
                        {group.dance_genre.length > 0 && (
                          <div className="flex gap-0.5 shrink-0">
                            {group.dance_genre.slice(0, 2).map((genre) => (
                              <Badge key={genre} variant="outline" className="text-[9px] px-1 py-0">
                                {genre}
                              </Badge>
                            ))}
                            {group.dance_genre.length > 2 && (
                              <span className="text-[9px] text-muted-foreground">+{group.dance_genre.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Users className="h-2.5 w-2.5" />
                        <span>
                          {group.member_count}명
                          {group.max_members && ` / ${group.max_members}`}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-6 text-[11px] px-2 shrink-0"
                      variant={group.join_policy === "invite_only" || requestedGroups.has(group.id) ? "outline" : "default"}
                      onClick={() => handleJoin(group)}
                      disabled={
                        joining === group.id ||
                        requestedGroups.has(group.id) ||
                        (group.max_members !== null && group.member_count >= group.max_members)
                      }
                    >
                      {joining === group.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : requestedGroups.has(group.id) ? (
                        "신청 완료"
                      ) : group.max_members !== null && group.member_count >= group.max_members ? (
                        "정원 초과"
                      ) : (
                        getJoinButtonLabel(group.join_policy)
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "projects" && (
          <>
            {/* 프로젝트 검색 */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="프로젝트 이름으로 검색"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
            </div>

            {/* 공개 프로젝트 목록 */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : publicProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">공개 프로젝트가 없습니다</p>
              </div>
            ) : (
              <div className="rounded border divide-y">
                {publicProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/groups/${project.group_id}/projects/${project.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium truncate">{project.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {project.type}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 ml-[18px]">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 ml-[18px]">
                        <span>{project.group_name}</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {project.member_count}명
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
