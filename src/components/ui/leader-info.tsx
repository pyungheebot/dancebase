interface LeaderInfoProps {
  label: string;
  leaderNames: string[];
}

export function LeaderInfo({ label, leaderNames }: LeaderInfoProps) {
  if (leaderNames.length === 0) return null;

  return (
    <p className="text-[11px] text-muted-foreground">
      {label}: {leaderNames.join(", ")}
    </p>
  );
}
