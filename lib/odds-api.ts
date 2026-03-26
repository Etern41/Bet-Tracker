const BASE = process.env.ODDS_API_BASE ?? "https://api.the-odds-api.com";
const KEY = process.env.ODDS_API_KEY;

export function oddsApiAvailable(): boolean {
  return Boolean(KEY && KEY !== "your_odds_api_key_here" && KEY.trim() !== "");
}

export interface OddsSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
}

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

export interface OddsEventWithOdds extends OddsEvent {
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

export async function fetchSports(): Promise<OddsSport[]> {
  if (!oddsApiAvailable()) return [];
  const res = await fetch(`${BASE}/v4/sports?apiKey=${KEY}&all=false`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Odds API /sports: ${res.status}`);
  return res.json() as Promise<OddsSport[]>;
}

export async function fetchEvents(sportKey: string): Promise<OddsEvent[]> {
  if (!oddsApiAvailable()) return [];
  const res = await fetch(
    `${BASE}/v4/sports/${sportKey}/events?apiKey=${KEY}&dateFormat=iso`,
    { next: { revalidate: 900 } }
  );
  if (!res.ok) {
    if (res.status === 422) return [];
    throw new Error(`Odds API /events: ${res.status}`);
  }
  return res.json() as Promise<OddsEvent[]>;
}

export async function fetchOddsForSport(sportKey: string): Promise<OddsEventWithOdds[]> {
  if (!oddsApiAvailable()) return [];
  const res = await fetch(
    `${BASE}/v4/sports/${sportKey}/odds?apiKey=${KEY}&regions=eu&markets=h2h&oddsFormat=decimal`,
    { next: { revalidate: 600 } }
  );
  if (!res.ok) {
    if (res.status === 422) return [];
    throw new Error(`Odds API /odds: ${res.status}`);
  }
  return res.json() as Promise<OddsEventWithOdds[]>;
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
