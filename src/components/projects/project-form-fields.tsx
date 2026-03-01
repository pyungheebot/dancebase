"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectFeature, ProjectVisibility } from "@/types";
import { PROJECT_TYPES, PROJECT_STATUSES, PROJECT_FEATURES } from "@/types";
import { useFieldValidation } from "@/hooks/use-field-validation";
import { validateRequired, validateDateRange } from "@/lib/validation";

export type ProjectFormValues = {
  name: string;
  description: string;
  type: string;
  status: string;
  visibility: ProjectVisibility;
  features: ProjectFeature[];
  start_date: string;
  end_date: string;
};

export const DEFAULT_PROJECT_FORM_VALUES: ProjectFormValues = {
  name: "",
  description: "",
  type: "기타",
  status: "신규",
  visibility: "private",
  features: ["board"],
  start_date: "",
  end_date: "",
};

type ProjectFormFieldsProps = {
  values: ProjectFormValues;
  onChange: <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => void;
  showStatus?: boolean;
  /** 검증 오류가 있을 때 true를 전달 (부모에서 submit 비활성화용) */
  onValidationChange?: (hasError: boolean) => void;
};

export function ProjectFormFields({
  values,
  onChange,
  showStatus,
  onValidationChange,
}: ProjectFormFieldsProps) {
  const nameInputId = useId();
  const nameErrorId = useId();

  const nameField = useFieldValidation([
    (v) => validateRequired(v, "프로젝트 이름"),
  ]);

  const dateRangeError = validateDateRange(values.start_date, values.end_date);

  const notifyValidation = (nameError: string | null) => {
    onValidationChange?.(!!nameError || !!dateRangeError);
  };

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
      {/* 이름 — 필수 */}
      <FormField label="이름" required error={nameField.error}>
        <Input
          id={nameInputId}
          className={`mt-1${nameField.error ? " border-destructive focus-visible:ring-destructive" : ""}`}
          placeholder="프로젝트 이름"
          value={values.name}
          onChange={(e) => {
            onChange("name", e.target.value);
            nameField.onChange(e.target.value);
            notifyValidation(nameField.rawError);
          }}
          onBlur={() => {
            nameField.onBlur(values.name);
            notifyValidation(nameField.rawError);
          }}
          aria-invalid={!!nameField.error}
          aria-describedby={nameField.error ? nameErrorId : undefined}
        />
      </FormField>

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

      {/* 날짜 범위 — 시작일 < 종료일 검증 */}
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">시작일 (선택)</Label>
            <Input
              className="mt-1"
              type="date"
              value={values.start_date}
              onChange={(e) => {
                onChange("start_date", e.target.value);
                notifyValidation(nameField.rawError);
              }}
            />
          </div>
          <div>
            <Label className="text-xs">종료일 (선택)</Label>
            <Input
              className={`mt-1${dateRangeError ? " border-destructive focus-visible:ring-destructive" : ""}`}
              type="date"
              value={values.end_date}
              onChange={(e) => {
                onChange("end_date", e.target.value);
                notifyValidation(nameField.rawError);
              }}
            />
          </div>
        </div>
        {dateRangeError && (
          <p className="text-xs text-destructive" role="alert">{dateRangeError}</p>
        )}
      </div>

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
