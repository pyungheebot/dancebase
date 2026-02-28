"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, Plus, Globe, Lock, Users, Camera } from "lucide-react";
import { toast } from "sonner";
import type { PrivacySettings, PrivacyField, PrivacyLevel } from "@/types";
import { DEFAULT_PRIVACY_SETTINGS } from "@/types";
import { useUserProfile } from "@/hooks/use-profile";
import { SuggestedFollows } from "@/components/profile/suggested-follows";
import Link from "next/link";

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; icon: typeof Globe }[] = [
  { value: "public", label: "전체 공개", icon: Globe },
  { value: "mutual_follow", label: "맞팔만", icon: Users },
  { value: "private", label: "나만", icon: Lock },
];

function PrivacyToggle({
  value,
  onChange,
}: {
  value: PrivacyLevel;
  onChange: (v: PrivacyLevel) => void;
}) {
  const current = PRIVACY_OPTIONS.find((o) => o.value === value) ?? PRIVACY_OPTIONS[0];
  const Icon = current.icon;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as PrivacyLevel)}>
      <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs text-muted-foreground border-dashed">
        <Icon className="h-3 w-3" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIVACY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FieldLabel({
  htmlFor,
  label,
  privacyField,
  privacySettings,
  onPrivacyChange,
}: {
  htmlFor?: string;
  label: string;
  privacyField: PrivacyField;
  privacySettings: PrivacySettings;
  onPrivacyChange: (field: PrivacyField, value: PrivacyLevel) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={htmlFor}>{label}</Label>
      <PrivacyToggle
        value={privacySettings[privacyField]}
        onChange={(v) => onPrivacyChange(privacyField, v)}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { followerCount, followingCount } = useUserProfile(user?.id ?? "");
  const [name, setName] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [activeRegion, setActiveRegion] = useState("");
  const [genreStartDates, setGenreStartDates] = useState<Record<string, string>>({});
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [teamPrivacy, setTeamPrivacy] = useState<Record<string, PrivacyLevel>>({});
  const [myTeams, setMyTeams] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setGenres(profile.dance_genre || []);
      setBio(profile.bio || "");
      setBirthDate(profile.birth_date || "");
      setPhone(profile.phone || "");
      setInstagram(profile.instagram || "");
      setYoutube(profile.youtube || "");
      setActiveRegion(profile.active_region || "");
      setGenreStartDates(profile.dance_genre_start_dates || {});
      setPrivacySettings(profile.privacy_settings ?? DEFAULT_PRIVACY_SETTINGS);
      setTeamPrivacy(profile.team_privacy ?? {});
    }
  }, [profile]);

  // 내가 속한 '팀' 유형 그룹 목록 조회
  useEffect(() => {
    if (!user) return;
    const fetchTeams = async () => {
      const { data } = await supabase
        .from("group_members")
        .select("groups!inner(id, name, group_type)")
        .eq("user_id", user.id)
        .eq("groups.group_type", "팀");
      if (data) {
        setMyTeams(
          data.map((row: { groups: { id: string; name: string; group_type: string } }) => {
            return { id: row.groups.id, name: row.groups.name };
          })
        );
      }
    };
    fetchTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePrivacyChange = (field: PrivacyField, value: PrivacyLevel) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGenre = () => {
    const trimmed = genreInput.trim();
    if (trimmed && !genres.includes(trimmed)) {
      setGenres([...genres, trimmed]);
      if (!genreStartDates[trimmed]) {
        setGenreStartDates({ ...genreStartDates, [trimmed]: "" });
      }
      setGenreInput("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setGenres(genres.filter((g) => g !== genre));
    const { [genre]: _, ...rest } = genreStartDates;
    setGenreStartDates(rest);
  };

  const handleGenreKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddGenre();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("파일 크기는 2MB 이하여야 합니다");
      return;
    }

    // 미리보기
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error("사진 업로드에 실패했습니다");
        setAvatarPreview(null);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        toast.error("프로필 사진 저장에 실패했습니다");
        return;
      }

      setAvatarPreview(publicUrl);
      await refreshProfile();
      toast.success("프로필 사진이 변경되었습니다");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        dance_genre: genres,
        bio,
        birth_date: birthDate || null,
        phone,
        instagram,
        youtube,
        active_region: activeRegion,
        dance_genre_start_dates: genreStartDates,
        privacy_settings: privacySettings,
        team_privacy: teamPrivacy,
      })
      .eq("id", user.id);

    if (error) {
      setMessage("저장에 실패했습니다: " + error.message);
    } else {
      setMessage("프로필이 저장되었습니다");
    }

    setSaving(false);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-6 py-6">
        <h1 className="text-xl font-bold mb-4">프로필 설정</h1>

        <Card>
          <CardHeader className="px-3 py-2">
            <CardTitle className="text-xs">내 정보</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 아바타 업로드 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarPreview ?? profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-lg">
                      {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {avatarUploading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">프로필 사진</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF (최대 2MB)</p>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-4 text-sm">
                  <Link
                    href={`/users/${user.id}/followers`}
                    className="hover:underline"
                  >
                    <span className="font-semibold">{followerCount}</span>{" "}
                    <span className="text-muted-foreground">팔로워</span>
                  </Link>
                  <Link
                    href={`/users/${user.id}/following`}
                    className="hover:underline"
                  >
                    <span className="font-semibold">{followingCount}</span>{" "}
                    <span className="text-muted-foreground">팔로잉</span>
                  </Link>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  label="댄스 장르"
                  privacyField="dance_genre"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="장르 입력 후 Enter"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    onKeyDown={handleGenreKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddGenre}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {genres.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {genres.map((genre) => (
                      <div key={genre} className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="gap-1 shrink-0"
                        >
                          {genre}
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(genre)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                        <Input
                          type="month"
                          placeholder="시작일"
                          value={genreStartDates[genre] || ""}
                          onChange={(e) =>
                            setGenreStartDates({
                              ...genreStartDates,
                              [genre]: e.target.value,
                            })
                          }
                          className="w-40"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel
                  label="장르별 시작일"
                  privacyField="dance_genre_start_dates"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <p className="text-xs text-muted-foreground">위 장르 옆에서 시작일을 설정하세요</p>
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="bio"
                  label="자기소개"
                  privacyField="bio"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <Textarea
                  id="bio"
                  placeholder="자기소개를 입력하세요"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="birthDate"
                  label="생년월일"
                  privacyField="birth_date"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="phone"
                  label="전화번호"
                  privacyField="phone"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <Input
                  id="phone"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="instagram"
                  label="인스타그램"
                  privacyField="instagram"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <Input
                  id="instagram"
                  placeholder="@username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="youtube"
                  label="유튜브"
                  privacyField="youtube"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <Input
                  id="youtube"
                  placeholder="채널명 또는 URL"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="activeRegion"
                  label="활동 지역"
                  privacyField="active_region"
                  privacySettings={privacySettings}
                  onPrivacyChange={handlePrivacyChange}
                />
                <Input
                  id="activeRegion"
                  placeholder="서울, 부산 등"
                  value={activeRegion}
                  onChange={(e) => setActiveRegion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>소속 팀</Label>
                {myTeams.length > 0 ? (
                  <div className="space-y-2">
                    {myTeams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                        <span className="text-sm font-medium">{team.name}</span>
                        <PrivacyToggle
                          value={teamPrivacy[team.id] ?? "public"}
                          onChange={(v) =>
                            setTeamPrivacy((prev) => ({ ...prev, [team.id]: v }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    &apos;팀&apos; 유형 그룹에 가입하면 여기에 표시됩니다
                  </p>
                )}
              </div>

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("실패")
                      ? "text-destructive"
                      : "text-green-600"
                  }`}
                >
                  {message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4">
          <SuggestedFollows />
        </div>
      </div>
    </AppLayout>
  );
}
