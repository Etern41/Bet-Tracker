import type { CSSProperties } from "react";

/** Единый стиль тултипов Recharts под светлую/тёмную тему (CSS variables). */
export const rechartsTooltipContentStyle: CSSProperties = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--popover-foreground))",
};

export const rechartsTooltipLabelStyle: CSSProperties = {
  color: "hsl(var(--muted-foreground))",
};
