import { cn } from "@/lib/utils";
import { BET_TYPE_LABELS } from "@/lib/constants";

export function BetTypeBadge({ type }: { type: string }) {
  const label =
    type in BET_TYPE_LABELS
      ? BET_TYPE_LABELS[type as keyof typeof BET_TYPE_LABELS]
      : type;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground"
      )}
    >
      {label}
    </span>
  );
}
