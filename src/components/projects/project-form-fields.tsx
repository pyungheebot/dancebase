"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectFeature, ProjectVisibility } from "@/types";
import { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_FEATURES } from "@/types";

export type ProjectFormValues = {
  name: string;
  description: string;
  type: string;
  status: string;
  visibility: ProjectVisibility;
  features: ProjectFeature[];
};

export const DEFAULT_PROJECT_FORM_VALUES: ProjectFormValues = {
  name: "",
  description: "",
  type: "기타",
  status: "신규",
  visibility: "private",
  features: ["board"],
};

type ProjectFormFieldsProps = {
  values: ProjectFormValues;
  onChange: <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => void;
  showStatus?: boolean;
};

export function ProjectFormFields({
  values,
  onChange,
  showStatus,
}: ProjectFormFieldsProps) {
  const toggleFeature = (feature: ProjectFeature) => {
    onChange(
      "features",
      values.features.includes(feature)
        ? values.features.filter((f) => f !== feature)
        : [...values.features, feature]
    );
  };

  return (
    <>
      <div>
        <Label className="text-xs">이름</Label>
        <Input
          className="mt-1"
          placeholder="프로젝트 이름"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">설명</Label>
        <Textarea
          className="mt-1"
          placeholder="프로젝트 설명 (선택)"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">유형</Label>
        <Select value={values.type} onValueChange={(v) => onChange("type", v)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showStatus && (
        <div>
          <Label className="text-xs">상태</Label>
          <Select value={values.status} onValueChange={(v) => onChange("status", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="text-xs">공개 설정</Label>
        <Select
          value={values.visibility}
          onValueChange={(v) => onChange("visibility", v as ProjectVisibility)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">공개 - 누구나 읽기 가능</SelectItem>
            <SelectItem value="unlisted">일부공개 - 링크가 있는 사용자만 접근</SelectItem>
            <SelectItem value="private">비공개 - 멤버만 접근</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">활성화 기능</Label>
        <div className="mt-1.5 space-y-2">
          {PROJECT_FEATURES.map((f) => (
            <label key={f.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={values.features.includes(f.value)}
                onCheckedChange={() => toggleFeature(f.value)}
              />
              <span className="text-sm">{f.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
