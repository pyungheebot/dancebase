import { Badge } from "@/components/ui/badge";
import { LeaderInfo } from "@/components/ui/leader-info";
import type { EntityContext } from "@/types/entity-context";

const STATUS_COLORS: Record<string, string> = {
  "신규": "bg-blue-100 text-blue-700",
  "진행": "bg-green-100 text-green-700",
  "보류": "bg-yellow-100 text-yellow-700",
  "종료": "bg-gray-100 text-gray-500",
};

type EntityHeaderProps = {
  ctx: EntityContext;
  leaderLabel?: string;
  children?: React.ReactNode;
};

export function EntityHeader({ ctx, leaderLabel, children }: EntityHeaderProps) {
  const isGroup = ctx.entityType === "group";
  const leaders = ctx.members.filter((m) => m.role === "leader");
  const leaderNames = leaders.map((m) => m.nickname || m.profile.name);

  return (
    <>
      <div className="flex items-start justify-between mb-1">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold flex items-center gap-1 truncate">
            {ctx.header.name}
            {ctx.header.badge && (
              isGroup ? (
                <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                  {ctx.header.badge}
                </Badge>
              ) : (
                <Badge
                  className={`text-[9px] px-1 py-0 font-normal border-0 ${STATUS_COLORS[ctx.header.badge] || ""}`}
                >
                  {ctx.header.badge}
                </Badge>
              )
            )}
          </h1>
          {ctx.header.description && (
            <p className="text-[11px] text-muted-foreground truncate">{ctx.header.description}</p>
          )}
        </div>
        {children}
      </div>
      {leaderLabel && <LeaderInfo label={leaderLabel} leaderNames={leaderNames} />}
    </>
  );
}
