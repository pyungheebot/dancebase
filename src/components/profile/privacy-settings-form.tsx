"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PRIVACY_SETTINGS,
  PRIVACY_FIELD_LABELS,
  type PrivacyField,
  type PrivacyLevel,
  type PrivacySettings,
} from "@/types";

type PrivacySettingsFormProps = {
  initialSettings?: PrivacySettings;
};

const PRIVACY_LEVEL_LABELS: Record<PrivacyLevel, string> = {
  public: "전체 공개",
  mutual_follow: "맞팔로우만",
  private: "나만 보기",
};

export function PrivacySettingsForm({
  initialSettings,
}: PrivacySettingsFormProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(
    initialSettings ?? DEFAULT_PRIVACY_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleChange = (field: PrivacyField, value: PrivacyLevel) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ privacy_settings: settings })
      .eq("id", user.id);

    if (error) {
      setMessage("저장에 실패했습니다: " + error.message);
    } else {
      setMessage("공개 설정이 저장되었습니다");
    }

    setSaving(false);
  };

  const fields = Object.keys(PRIVACY_FIELD_LABELS) as PrivacyField[];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {fields.map((field) => (
        <div key={field} className="flex items-center justify-between gap-4">
          <Label className="text-xs min-w-[100px]">{PRIVACY_FIELD_LABELS[field]}</Label>
          <Select
            value={settings[field]}
            onValueChange={(value) =>
              handleChange(field, value as PrivacyLevel)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIVACY_LEVEL_LABELS) as PrivacyLevel[]).map(
                (level) => (
                  <SelectItem key={level} value={level}>
                    {PRIVACY_LEVEL_LABELS[level]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      ))}

      {message && (
        <p
          className={`text-sm ${
            message.includes("실패") ? "text-destructive" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}

      <Button type="submit" className="w-full h-8 text-sm" disabled={saving}>
        {saving ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
