"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { SportDistributionChart } from "@/components/dashboard/SportDistributionChart";
import { StreakChart, type StreakPoint } from "@/components/dashboard/StreakChart";
import { RecentBets } from "@/components/dashboard/RecentBets";
import { Button } from "@/components/ui/button";
import { useBetUi } from "@/components/layout/AppShell";
import { FiltersBar, type BetFiltersState } from "@/components/bets/FiltersBar";
import type { DashboardStats, DayProfit, SportShare } from "@/lib/stats";
import type { BetRow } from "@/components/bets/types";
import { BETS_MUTATION_EVENT } from "@/lib/bets-mutation";
import { buildBetsListQuery, buildStatsQueryString } from "@/lib/bet-api-query";
import {
  applyLastDaysToFilters,
  clearDateRangeInFilters,
  createDashboardFiltersLastDays,
} from "@/lib/dashboard-default-filters";

function isBetRow(x: unknown): x is BetRow {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Record<string, unknown>;
  return typeof b.id === "string" && typeof b.matchTitle === "string";
}

export default function DashboardPage() {
  const { openCreate } = useBetUi();
  const [filters, setFilters] = useState<BetFiltersState>(() => createDashboardFiltersLastDays(30));
  const [sportsInData, setSportsInData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profitByDay, setProfitByDay] = useState<DayProfit[]>([]);
  const [sportDistribution, setSportDistribution] = useState<SportShare[]>([]);
  const [streakSeries, setStreakSeries] = useState<StreakPoint[]>([]);
  const [recentBets, setRecentBets] = useState<BetRow[]>([]);

  const fetchSportsList = useCallback(async () => {
    try {
      const res = await fetch("/api/bets/sports-list");
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "sports" in data &&
        Array.isArray((data as { sports: unknown }).sports)
      ) {
        setSportsInData((data as { sports: string[] }).sports);
      }
    } catch {
      setSportsInData([]);
    }
  }, []);

  useEffect(() => {
    void fetchSportsList();
  }, [fetchSportsList]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statsQs = buildStatsQueryString(filters);
      const betsQs = buildBetsListQuery(filters, 1, 5);
      const [sRes, bRes] = await Promise.all([
        fetch(`/api/stats?${statsQs}`),
        fetch(`/api/bets?${betsQs}`),
      ]);
      const sJson: unknown = await sRes.json();
      if (typeof sJson === "object" && sJson !== null && "stats" in sJson) {
        const s = sJson as Record<string, unknown>;
        const st = s.stats;
        setStats(typeof st === "object" && st !== null ? (st as DashboardStats) : null);
        setProfitByDay(Array.isArray(s.profitByDay) ? (s.profitByDay as DayProfit[]) : []);
        setSportDistribution(
          Array.isArray(s.sportDistribution) ? (s.sportDistribution as SportShare[]) : []
        );
        setStreakSeries(
          Array.isArray(s.streakSeries) ? (s.streakSeries as StreakPoint[]) : []
        );
      } else {
        setStats(null);
        setProfitByDay([]);
        setSportDistribution([]);
        setStreakSeries([]);
      }

      const bJson: unknown = await bRes.json();
      if (
        typeof bJson === "object" &&
        bJson !== null &&
        "bets" in bJson &&
        Array.isArray((bJson as { bets: unknown }).bets)
      ) {
        setRecentBets(
          ((bJson as { bets: unknown[] }).bets as unknown[]).filter(isBetRow) as BetRow[]
        );
      } else {
        setRecentBets([]);
      }
    } catch {
      setStats(null);
      setProfitByDay([]);
      setSportDistribution([]);
      setStreakSeries([]);
      setRecentBets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onMutated = () => {
      void load();
    };
    window.addEventListener(BETS_MUTATION_EVENT, onMutated);
    return () => window.removeEventListener(BETS_MUTATION_EVENT, onMutated);
  }, [load]);

  const empty = !loading && (stats?.totalBets ?? 0) === 0;
  const streak = stats?.currentStreak ?? 0;
  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.sport !== "" ||
    filters.betType !== "" ||
    filters.status !== "";

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="shrink-0 text-sm text-muted-foreground">
          Период (дата матча):
        </span>
        <div className="flex min-w-0 flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setFilters((prev) => applyLastDaysToFilters(prev, 7))}
        >
          7 дней
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setFilters((prev) => applyLastDaysToFilters(prev, 30))}
        >
          30 дней
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setFilters((prev) => applyLastDaysToFilters(prev, 90))}
        >
          3 месяца
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setFilters((prev) => clearDateRangeInFilters(prev))}
        >
          Всё время
        </Button>
        </div>
      </div>

      <FiltersBar value={filters} onChange={setFilters} sportsInData={sportsInData} sticky={false} />

      {empty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center">
          <svg
            className="mb-4 size-20 text-muted-foreground"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M16 20 L48 20 L44 48 L20 48 Z M24 20 V14 A8 8 0 0 1 40 14 V20" />
            <line x1="24" y1="30" x2="40" y2="30" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {hasActiveFilters ? "Нет ставок по выбранным фильтрам" : "Начните отслеживать ставки"}
          </h2>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Измените период, спорт, тип или статус — статистика и графики пересчитываются по тем же правилам, что список в «Мои ставки»."
              : "Добавьте первую ставку или расширьте период «Всё время», если матчи были давно."}
          </p>
          <Button type="button" onClick={openCreate}>
            + Добавить первую ставку
          </Button>
        </div>
      ) : (
        <>
          <StatCards stats={stats} loading={loading} />

          {!loading && Math.abs(streak) >= 2 ? (
            <div
              className={
                streak > 0
                  ? "rounded-lg border border-won/30 bg-won/10 px-4 py-3 text-sm text-won"
                  : "rounded-lg border border-lost/30 bg-lost/10 px-4 py-3 text-sm text-lost"
              }
            >
              {streak > 0
                ? `🔥 Серия из ${streak} побед`
                : `❄️ Серия из ${Math.abs(streak)} поражений`}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <ProfitChart data={profitByDay} loading={loading} />
            <SportDistributionChart data={sportDistribution} loading={loading} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <StreakChart data={streakSeries} loading={loading} />
            <RecentBets bets={recentBets} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
