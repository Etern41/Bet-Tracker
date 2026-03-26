export interface OddsEventWithOdds {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

export function extractBestOdds(
  event: OddsEventWithOdds,
  teamName: string
): number | null {
  const prices: number[] = [];
  for (const bm of event.bookmakers) {
    const h2h = bm.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;
    const outcome = h2h.outcomes.find((o) => o.name === teamName);
    if (outcome) prices.push(outcome.price);
  }
  if (prices.length === 0) return null;
  return Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
}

export function avgPriceForOutcome(
  bookmakers: OddsEventWithOdds["bookmakers"],
  outcomeName: string
): number | null {
  const fake: OddsEventWithOdds = {
    id: "",
    sport_key: "",
    sport_title: "",
    commence_time: "",
    home_team: "",
    away_team: "",
    bookmakers,
  };
  return extractBestOdds(fake, outcomeName);
}

export function parseBookmakersFromCache(oddsData: unknown): OddsEventWithOdds["bookmakers"] {
  if (!Array.isArray(oddsData)) return [];
  return oddsData as OddsEventWithOdds["bookmakers"];
}
