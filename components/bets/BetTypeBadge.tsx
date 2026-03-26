import { cn } from "@/lib/utils";
import { labelBetType } from "@/lib/constants";

export function BetTypeBadge({ type }: { type: string }) {
  const label = labelBetType(type);
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
