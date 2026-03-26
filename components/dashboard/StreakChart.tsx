"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export type StreakPoint = { idx: number; delta: number };

type Props = {
  data: StreakPoint[];
  loading: boolean;
};

export function StreakChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">Серии W/L</p>
        <Skeleton className="h-[200px] w-full rounded-md" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">Серии W/L</p>
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
          Нет закрытых ставок за период
        </div>
      </div>
    );
  }

  const last = data.slice(-24);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="section-label mb-3">Исходы по хронологии (последние {last.length})</p>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="idx" tick={{ fontSize: 10 }} hide />
            <YAxis domain={[-1.2, 1.2]} ticks={[-1, 0, 1]} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v) => {
                const n = typeof v === "number" ? v : Number(v);
                return [n > 0 ? "Победа" : "Поражение", "Исход"];
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="delta" radius={[2, 2, 0, 0]}>
              {last.map((e, i) => (
                <Cell
                  key={i}
                  fill={e.delta > 0 ? "#10B981" : e.delta < 0 ? "#EF4444" : "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
