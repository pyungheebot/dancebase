"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Lock, Users } from "lucide-react";
import type { PrivacySettings, PrivacyField, PrivacyLevel } from "@/types";

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string; icon: typeof Globe }[] = [
  { value: "public", label: "전체 공개", icon: Globe },
  { value: "mutual_follow", label: "맞팔만", icon: Users },
  { value: "private", label: "나만", icon: Lock },
];

export function PrivacyToggle({
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

export function FieldLabel({
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

interface ProfileBasicInfoSectionProps {
  name: string;
  onNameChange: (v: string) => void;
  bio: string;
  onBioChange: (v: string) => void;
  birthDate: string;
  onBirthDateChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  instagram: string;
  onInstagramChange: (v: string) => void;
  youtube: string;
  onYoutubeChange: (v: string) => void;
  activeRegion: string;
  onActiveRegionChange: (v: string) => void;
  privacySettings: PrivacySettings;
  onPrivacyChange: (field: PrivacyField, value: PrivacyLevel) => void;
  email?: string;
}

export function ProfileBasicInfoSection({
  name,
  onNameChange,
  bio,
  onBioChange,
  birthDate,
  onBirthDateChange,
  phone,
  onPhoneChange,
  instagram,
  onInstagramChange,
  youtube,
  onYoutubeChange,
  activeRegion,
  onActiveRegionChange,
  privacySettings,
  onPrivacyChange,
  email,
}: ProfileBasicInfoSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" value={email || ""} disabled />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor="bio"
          label="자기소개"
          privacyField="bio"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <Textarea
          id="bio"
          placeholder="자기소개를 입력하세요"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor="birthDate"
          label="생년월일"
          privacyField="birth_date"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => onBirthDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor="phone"
          label="전화번호"
          privacyField="phone"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <Input
          id="phone"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor="instagram"
          label="인스타그램"
          privacyField="instagram"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <Input
          id="instagram"
          placeholder="@username"
          value={instagram}
          onChange={(e) => onInstagramChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor="youtube"
          label="유튜브"
          privacyField="youtube"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <Input
          id="youtube"
          placeholder="채널명 또는 URL"
          value={youtube}
          onChange={(e) => onYoutubeChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel
          htmlFor="activeRegion"
          label="활동 지역"
          privacyField="active_region"
          privacySettings={privacySettings}
          onPrivacyChange={onPrivacyChange}
        />
        <Input
          id="activeRegion"
          placeholder="서울, 부산 등"
          value={activeRegion}
          onChange={(e) => onActiveRegionChange(e.target.value)}
        />
      </div>
    </>
  );
}
