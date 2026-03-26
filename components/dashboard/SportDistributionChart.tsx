"use client";

import { Cell, Legend, Pie, PieChart, Tooltip, ResponsiveContainer } from "recharts";
import type { SportShare } from "@/lib/stats";
import { Skeleton } from "@/components/ui/skeleton";
import {
  rechartsTooltipContentStyle,
  rechartsTooltipLabelStyle,
} from "@/lib/recharts-tooltip";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

type Props = {
  data: SportShare[];
  loading: boolean;
};

export function SportDistributionChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">По видам спорта</p>
        <Skeleton className="mx-auto size-[240px] rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">По видам спорта</p>
        <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
          Нет данных
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.sport, value: d.count }));

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="section-label mb-3">По видам спорта</p>
      <div className="h-[280px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={rechartsTooltipContentStyle}
              labelStyle={rechartsTooltipLabelStyle}
              formatter={(v) => {
                const n = typeof v === "number" ? v : Number(v);
                return [`${Number.isFinite(n) ? n : 0} ставок`, ""];
              }}
            />
            <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
