"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayProfit } from "@/lib/stats";
import { Skeleton } from "@/components/ui/skeleton";
import {
  rechartsTooltipContentStyle,
  rechartsTooltipLabelStyle,
} from "@/lib/recharts-tooltip";

type Props = {
  data: DayProfit[];
  loading: boolean;
};

export function ProfitChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">Динамика профита</p>
        <Skeleton className="h-[280px] w-full rounded-md" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">Динамика профита</p>
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Нет закрытых ставок за период
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="section-label mb-3">Динамика профита</p>
      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
            <YAxis
              tickFormatter={(v: number) =>
                `${v > 0 ? "+" : ""}${v.toLocaleString("ru-RU")}`
              }
              width={56}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <Tooltip
              contentStyle={rechartsTooltipContentStyle}
              labelStyle={rechartsTooltipLabelStyle}
              formatter={(v, name) => {
                const num = typeof v === "number" ? v : Number(v);
                const safe = Number.isFinite(num) ? num : 0;
                const label = String(name);
                return [
                  `${safe > 0 ? "+" : ""}${safe.toLocaleString("ru-RU")} ₽`,
                  label === "cumulative" ? "Накоплено" : "За день",
                ];
              }}
            />
            <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Area
              type="monotone"
              dataKey="cumulative"
              fill="hsl(var(--primary) / 0.1)"
              stroke="none"
              name="cumulative"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="profit"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
