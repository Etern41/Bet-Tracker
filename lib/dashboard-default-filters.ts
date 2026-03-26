import type { BetFiltersState } from "@/components/bets/FiltersBar";

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Стартовый период дашборда: последние 30 дней по дате матча. */
export function createDashboardFiltersLastDays(days: number): BetFiltersState {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return {
    search: "",
    sport: "",
    betType: "",
    status: "",
    from: ymd(from),
    to: ymd(to),
  };
}

export function applyLastDaysToFilters(
  prev: BetFiltersState,
  days: number
): BetFiltersState {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { ...prev, from: ymd(from), to: ymd(to) };
}

export function clearDateRangeInFilters(prev: BetFiltersState): BetFiltersState {
  return { ...prev, from: "", to: "" };
}
