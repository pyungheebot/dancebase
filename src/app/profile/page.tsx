"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PrivacySettings, PrivacyField, PrivacyLevel } from "@/types";
import { DEFAULT_PRIVACY_SETTINGS } from "@/types";
import { useUserProfile } from "@/hooks/use-profile";
import { SuggestedFollows } from "@/components/profile/suggested-follows";
import Link from "next/link";
import { useAsyncAction } from "@/hooks/use-async-action";
import { ProfileAvatarSection } from "@/components/profile/profile-avatar-section";
import { ProfileBasicInfoSection } from "@/components/profile/profile-basic-info-section";
import { ProfileGenreSection } from "@/components/profile/profile-genre-section";
import { ProfilePrivacySection } from "@/components/profile/profile-privacy-section";

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
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const [message, setMessage] = useState<string | null>(null);

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
          data.map((row: { groups: { id: string; name: string; group_type: string } }) => ({
            id: row.groups.id,
            name: row.groups.name,
          }))
        );
      }
    };
    fetchTeams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePrivacyChange = (field: PrivacyField, value: PrivacyLevel) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleTeamPrivacyChange = (teamId: string, value: PrivacyLevel) => {
    setTeamPrivacy((prev) => ({ ...prev, [teamId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    await executeSave(async () => {
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
        toast.error("저장에 실패했습니다");
      } else {
        setMessage("프로필이 저장되었습니다");
        toast.success("프로필이 저장되었습니다");
      }
    });
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
              {user && (
                <ProfileAvatarSection
                  avatarUrl={profile?.avatar_url}
                  name={profile?.name}
                  userId={user.id}
                  onAvatarUpload={async () => { await refreshProfile(); }}
                />
              )}

              {user && (
                <div className="flex items-center gap-4 text-sm">
                  <Link href={`/users/${user.id}/followers`} className="hover:underline">
                    <span className="font-semibold">{followerCount}</span>{" "}
                    <span className="text-muted-foreground">팔로워</span>
                  </Link>
                  <Link href={`/users/${user.id}/following`} className="hover:underline">
                    <span className="font-semibold">{followingCount}</span>{" "}
                    <span className="text-muted-foreground">팔로잉</span>
                  </Link>
                </div>
              )}

              <ProfileBasicInfoSection
                name={name}
                onNameChange={setName}
                bio={bio}
                onBioChange={setBio}
                birthDate={birthDate}
                onBirthDateChange={setBirthDate}
                phone={phone}
                onPhoneChange={setPhone}
                instagram={instagram}
                onInstagramChange={setInstagram}
                youtube={youtube}
                onYoutubeChange={setYoutube}
                activeRegion={activeRegion}
                onActiveRegionChange={setActiveRegion}
                privacySettings={privacySettings}
                onPrivacyChange={handlePrivacyChange}
                email={user?.email}
              />

              <ProfileGenreSection
                genres={genres}
                onGenresChange={setGenres}
                genreInput={genreInput}
                onGenreInputChange={setGenreInput}
                genreStartDates={genreStartDates}
                onGenreStartDatesChange={setGenreStartDates}
                privacySettings={privacySettings}
                onPrivacyChange={handlePrivacyChange}
              />

              <ProfilePrivacySection
                teamPrivacy={teamPrivacy}
                onTeamPrivacyChange={handleTeamPrivacyChange}
                myTeams={myTeams}
              />

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("실패") ? "text-destructive" : "text-green-600"
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
