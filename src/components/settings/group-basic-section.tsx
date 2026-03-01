"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/submit-button";
import {
  GroupFormFields,
  type GroupFormValues,
} from "@/components/groups/group-form-fields";
import type { Group } from "@/types";

type GroupBasicSectionProps = {
  group: Group;
  groupForm: GroupFormValues;
  avatarPreview: string | null;
  avatarUploading: boolean;
  saving: boolean;
  onGroupFieldChange: <K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  message: { type: "success" | "error"; text: string } | null;
};

export function GroupBasicSection({
  group,
  groupForm,
  avatarPreview,
  avatarUploading,
  saving,
  onGroupFieldChange,
  onAvatarChange,
  onSave,
  message,
}: GroupBasicSectionProps) {
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* 메시지 표시 */}
      {message && (
        <div
          className={`mb-2 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 그룹 이미지 업로드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold">그룹 이미지</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 rounded-sm">
                <AvatarImage
                  src={avatarPreview ?? group?.avatar_url ?? undefined}
                  alt={group?.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-sm text-lg">
                  {group?.name?.charAt(0)?.toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
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
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium">그룹 대표 이미지</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, GIF (최대 2MB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 그룹 기본 정보 폼 */}
      <GroupFormFields values={groupForm} onChange={onGroupFieldChange} />

      <SubmitButton
        onClick={onSave}
        loading={saving}
        loadingText="저장 중..."
        disabled={!groupForm.name.trim()}
        className="w-full"
      >
        <Save className="h-4 w-4 mr-2" />
        설정 저장
      </SubmitButton>
    </div>
  );
}
