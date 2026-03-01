"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Radio,
  Users,
  AlertTriangle,
  X,
  Check,
  UserPlus,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useIntercom,
  type IntercomChannelInput,
  type IntercomPersonInput,
} from "@/hooks/use-intercom";
import type { ShowIntercomChannel, ShowIntercomZone } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────────────────────

const ZONE_LABELS: Record<ShowIntercomZone, string> = {
  stage: "무대",
  sound: "음향",
  lighting: "조명",
  backstage: "백스테이지",
  overall: "총괄",
  other: "기타",
};

const ZONE_COLORS: Record<ShowIntercomZone, string> = {
  stage: "bg-purple-100 text-purple-700 border-purple-200",
  sound: "bg-orange-100 text-orange-700 border-orange-200",
  lighting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  backstage: "bg-blue-100 text-blue-700 border-blue-200",
  overall: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const ZONE_OPTIONS: ShowIntercomZone[] = [
  "stage",
  "sound",
  "lighting",
  "backstage",
  "overall",
  "other",
];

const EMPTY_CHANNEL_FORM: IntercomChannelInput = {
  name: "",
  frequency: "",
  zone: "stage",
  isEmergency: false,
};

const EMPTY_PERSON_FORM: IntercomPersonInput = {
  name: "",
  callSign: "",
};

// ─── 채널 폼 ───────────────────────────────────────────────────────────────────

interface ChannelFormProps {
  initial?: IntercomChannelInput;
  onSubmit: (values: IntercomChannelInput) => void;
  onCancel: () => void;
  submitLabel: string;
}

function ChannelForm({
  initial = EMPTY_CHANNEL_FORM,
  onSubmit,
  onCancel,
  submitLabel,
}: ChannelFormProps) {
  const [form, setForm] = useState<IntercomChannelInput>({ ...initial });

  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">채널명 *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: A채널, 무대채널"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">주파수 / 채널번호 *</Label>
          <Input
            value={form.frequency}
            onChange={(e) =>
              setForm((f) => ({ ...f, frequency: e.target.value }))
            }
            placeholder="예: 462.550MHz, CH1"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">담당 영역</Label>
          <Select
            value={form.zone}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, zone: v as ShowIntercomZone }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONE_OPTIONS.map((z) => (
                <SelectItem key={z} value={z} className="text-xs">
                  {ZONE_LABELS[z]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Switch
            id="emergency-toggle"
            checked={form.isEmergency}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, isEmergency: v }))
            }
            className="scale-75"
          />
          <Label htmlFor="emergency-toggle" className="text-xs cursor-pointer">
            비상 채널
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => onSubmit(form)}
        >
          <Check className="h-3 w-3 mr-1" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── 인원 인라인 폼 ────────────────────────────────────────────────────────────

interface PersonFormProps {
  onSubmit: (values: IntercomPersonInput) => void;
  onCancel: () => void;
}

function PersonForm({ onSubmit, onCancel }: PersonFormProps) {
  const [form, setForm] = useState<IntercomPersonInput>({ ...EMPTY_PERSON_FORM });

  return (
    <div className="flex items-center gap-1.5 mt-1.5 p-2 rounded bg-gray-50 border border-dashed border-gray-200">
      <Input
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="이름"
        className="h-6 text-xs flex-1"
      />
      <Input
        value={form.callSign}
        onChange={(e) => setForm((f) => ({ ...f, callSign: e.target.value }))}
        placeholder="호출부호"
        className="h-6 text-xs flex-1"
      />
      <Button
        size="sm"
        className="h-6 text-xs px-2"
        onClick={() => onSubmit(form)}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 text-xs px-2"
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── 채널 항목 ─────────────────────────────────────────────────────────────────

interface ChannelItemProps {
  channel: ShowIntercomChannel;
  onEdit: (channel: ShowIntercomChannel) => void;
  onDelete: (id: string) => void;
  onAddPerson: (channelId: string, input: IntercomPersonInput) => boolean;
  onDeletePerson: (channelId: string, personId: string) => void;
}

function ChannelItem({
  channel,
  onEdit,
  onDelete,
  onAddPerson,
  onDeletePerson,
}: ChannelItemProps) {
  const [open, setOpen] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);

  const handleAddPerson = (input: IntercomPersonInput) => {
    const ok = onAddPerson(channel.id, input);
    if (ok) setShowPersonForm(false);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`rounded-md border ${
          channel.isEmergency
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-card"
        }`}
      >
        {/* 채널 헤더 */}
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <Radio
                className={`h-3.5 w-3.5 shrink-0 ${
                  channel.isEmergency ? "text-red-500" : "text-gray-400"
                }`}
              />
              <span className="text-xs font-medium truncate">{channel.name}</span>
              <span className="text-[10px] text-gray-400 shrink-0">
                {channel.frequency}
              </span>
              {channel.isEmergency && (
                <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              className={`text-[10px] px-1.5 py-0 border ${
                ZONE_COLORS[channel.zone]
              }`}
              variant="outline"
            >
              {ZONE_LABELS[channel.zone]}
            </Badge>
            <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <Users className="h-3 w-3" />
              {channel.persons.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(channel)}
            >
              <Pencil className="h-3 w-3 text-gray-400" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onDelete(channel.id)}
            >
              <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 인원 목록 */}
        <CollapsibleContent>
          <div className="px-3 pb-2 space-y-1 border-t border-gray-100 pt-2">
            {channel.persons.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-1">
                배정된 인원이 없습니다
              </p>
            ) : (
              <div className="space-y-1">
                {channel.persons.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between rounded bg-muted/30 border border-gray-100 px-2 py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium truncate">
                        {person.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500"
                      >
                        {person.callSign}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={() => onDeletePerson(channel.id, person.id)}
                    >
                      <X className="h-3 w-3 text-gray-300 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showPersonForm ? (
              <PersonForm
                onSubmit={handleAddPerson}
                onCancel={() => setShowPersonForm(false)}
              />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs text-gray-400 w-full mt-1"
                onClick={() => setShowPersonForm(true)}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                인원 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── 담당 영역 분포 차트 ───────────────────────────────────────────────────────

interface ZoneChartProps {
  channels: ShowIntercomChannel[];
}

function ZoneChart({ channels }: ZoneChartProps) {
  if (channels.length === 0) return null;

  const zoneCounts = ZONE_OPTIONS.map((zone) => ({
    zone,
    count: channels.filter((c) => c.zone === zone).length,
  })).filter((z) => z.count > 0);

  const max = Math.max(...zoneCounts.map((z) => z.count), 1);

  return (
    <div className="space-y-1">
      {zoneCounts.map(({ zone, count }) => (
        <div key={zone} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-16 shrink-0">
            {ZONE_LABELS[zone]}
          </span>
          <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                zone === "stage"
                  ? "bg-purple-400"
                  : zone === "sound"
                  ? "bg-orange-400"
                  : zone === "lighting"
                  ? "bg-yellow-400"
                  : zone === "backstage"
                  ? "bg-blue-400"
                  : zone === "overall"
                  ? "bg-indigo-400"
                  : "bg-gray-400"
              }`}
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 w-4 text-right shrink-0">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function IntercomCard({ projectId }: { projectId: string }) {
  const {
    channels,
    totalPersons,
    totalChannels,
    loading,
    addChannel,
    updateChannel,
    deleteChannel,
    addPerson,
    deletePerson,
  } = useIntercom(projectId);

  const [cardOpen, setCardOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChannel, setEditingChannel] =
    useState<ShowIntercomChannel | null>(null);
  const [showChart, setShowChart] = useState(false);

  const handleAddChannel = (values: IntercomChannelInput) => {
    const ok = addChannel(values);
    if (ok) setShowAddForm(false);
  };

  const handleUpdateChannel = (values: IntercomChannelInput) => {
    if (!editingChannel) return;
    const ok = updateChannel(editingChannel.id, values);
    if (ok) setEditingChannel(null);
  };

  const emergencyChannels = channels.filter((c) => c.isEmergency);
  const normalChannels = channels.filter((c) => !c.isEmergency);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-card p-4">
        <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-card shadow-sm">
      {/* 카드 헤더 */}
      <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 text-left">
              <Radio className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-gray-800">
                인터컴/통신 체계
              </span>
              {cardOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400 ml-1" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-1" />
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-2 shrink-0">
            {/* 통계 배지 */}
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500"
              >
                채널 {totalChannels}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500"
              >
                <Users className="h-2.5 w-2.5 mr-0.5" />
                {totalPersons}명
              </Badge>
              {emergencyChannels.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-600 border-red-200 border">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  비상 {emergencyChannels.length}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setShowChart((v) => !v)}
            >
              분포
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowAddForm((v) => !v);
                setEditingChannel(null);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              채널 추가
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-4 space-y-3">
            {/* 채널 분포 차트 */}
            {showChart && channels.length > 0 && (
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <p className="text-[10px] font-medium text-gray-500 mb-2">
                  담당 영역별 채널 분포
                </p>
                <ZoneChart channels={channels} />
              </div>
            )}

            {/* 채널 추가 폼 */}
            {showAddForm && (
              <ChannelForm
                onSubmit={handleAddChannel}
                onCancel={() => setShowAddForm(false)}
                submitLabel="추가"
              />
            )}

            {/* 채널 수정 폼 */}
            {editingChannel && (
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400">채널 수정</p>
                <ChannelForm
                  initial={{
                    name: editingChannel.name,
                    frequency: editingChannel.frequency,
                    zone: editingChannel.zone,
                    isEmergency: editingChannel.isEmergency,
                  }}
                  onSubmit={handleUpdateChannel}
                  onCancel={() => setEditingChannel(null)}
                  submitLabel="저장"
                />
              </div>
            )}

            {/* 비상 채널 섹션 */}
            {emergencyChannels.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                    비상 채널
                  </span>
                </div>
                {emergencyChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    onEdit={setEditingChannel}
                    onDelete={deleteChannel}
                    onAddPerson={addPerson}
                    onDeletePerson={deletePerson}
                  />
                ))}
              </div>
            )}

            {/* 일반 채널 섹션 */}
            {normalChannels.length > 0 && (
              <div className="space-y-2">
                {emergencyChannels.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      일반 채널
                    </span>
                  </div>
                )}
                {normalChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    onEdit={setEditingChannel}
                    onDelete={deleteChannel}
                    onAddPerson={addPerson}
                    onDeletePerson={deletePerson}
                  />
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {channels.length === 0 && !showAddForm && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Radio className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400 mb-1">
                  등록된 채널이 없습니다
                </p>
                <p className="text-xs text-gray-300">
                  상단 [채널 추가] 버튼으로 통신 채널을 등록하세요
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
