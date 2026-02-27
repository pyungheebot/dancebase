import type { Profile, PublicProfile, PrivacyField, PrivacySettings } from "@/types";

type FilterOptions = {
  viewerId: string | null;
  profileOwnerId: string;
  isMutualFollow: boolean;
};

const PRIVACY_CONTROLLED_FIELDS: PrivacyField[] = [
  "bio",
  "birth_date",
  "phone",
  "instagram",
  "youtube",
  "active_region",
  "dance_genre_start_dates",
  "dance_genre",
];

export function filterProfileByPrivacy(
  profile: Profile,
  options: FilterOptions
): PublicProfile {
  const { viewerId, profileOwnerId, isMutualFollow } = options;

  // 본인이면 전체 공개
  if (viewerId === profileOwnerId) {
    return {
      id: profile.id,
      name: profile.name,
      avatar_url: profile.avatar_url,
      dance_genre: profile.dance_genre,
      bio: profile.bio,
      birth_date: profile.birth_date,
      phone: profile.phone,
      instagram: profile.instagram,
      youtube: profile.youtube,
      active_region: profile.active_region,
      dance_genre_start_dates: profile.dance_genre_start_dates,
      teams: [],   // hook에서 채움
      groups: [],  // hook에서 채움
      created_at: profile.created_at,
    };
  }

  const settings: PrivacySettings = profile.privacy_settings ?? {
    bio: "public",
    birth_date: "private",
    phone: "private",
    instagram: "public",
    youtube: "public",
    active_region: "public",
    dance_genre_start_dates: "public",
    dance_genre: "public",
  };

  const result: PublicProfile = {
    id: profile.id,
    name: profile.name,
    avatar_url: profile.avatar_url,
    dance_genre: null,
    bio: null,
    birth_date: null,
    phone: null,
    instagram: null,
    youtube: null,
    active_region: null,
    dance_genre_start_dates: null,
    teams: [],   // hook에서 팀별 개별 공개 설정에 따라 채움
    groups: [],  // hook에서 그룹 visibility에 따라 채움
    created_at: profile.created_at,
  };

  for (const field of PRIVACY_CONTROLLED_FIELDS) {
    const level = settings[field] ?? "public";

    let visible = false;
    if (level === "public") {
      visible = true;
    } else if (level === "mutual_follow") {
      visible = isMutualFollow;
    }
    // "private" → visible stays false

    if (visible) {
      (result as Record<string, unknown>)[field] = profile[field];
    }
  }

  return result;
}
