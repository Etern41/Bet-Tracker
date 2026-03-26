import type { BetFiltersState } from "@/components/bets/FiltersBar";

/** Общие фильтры для /api/bets и /api/stats (ТЗ: спорт, тип, статус, дата матча, поиск). */
export function appendSharedBetFilters(q: URLSearchParams, filters: BetFiltersState) {
  const s = filters.search.trim();
  if (s) q.set("search", s);
  if (filters.sport) q.set("sport", filters.sport);
  if (filters.betType) q.set("betType", filters.betType);
  if (filters.status) q.set("status", filters.status);
  if (filters.from) q.set("from", new Date(filters.from).toISOString());
  if (filters.to) q.set("to", new Date(`${filters.to}T23:59:59.999`).toISOString());
}

export function buildBetsListQuery(
  filters: BetFiltersState,
  page: number,
  limit: number
): string {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  appendSharedBetFilters(q, filters);
  return q.toString();
}

/**
 * Статистика с теми же фильтрами, что список ставок.
 * Пустые from/to → всё время (range=all).
 */
export function buildStatsQueryString(filters: BetFiltersState): string {
  const q = new URLSearchParams();
  appendSharedBetFilters(q, filters);
  if (!filters.from && !filters.to) {
    q.set("range", "all");
    q.set("to", new Date().toISOString());
  }
  return q.toString();
}
