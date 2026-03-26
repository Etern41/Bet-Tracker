export interface BetForStats {
  status: string;
  odds: number;
  stake: number;
  winnings: number | null;
  sport: string;
  matchDate: Date | string;
  createdAt: Date | string;
}

export interface DashboardStats {
  totalBets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  voidBets: number;
  totalStaked: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  avgOdds: number;
  currentStreak: number;
}

export function calcStats(bets: BetForStats[]): DashboardStats {
  const settled = bets.filter((b) => b.status !== "PENDING" && b.status !== "VOID");
  const won = bets.filter((b) => b.status === "WON");
  const lost = bets.filter((b) => b.status === "LOST");

  const totalStaked = bets.reduce((s, b) => s + b.stake, 0);
  const totalWon = won.reduce((s, b) => s + (b.winnings ?? 0), 0);
  const totalLost = lost.reduce((s, b) => s + b.stake, 0);
  const totalProfit = totalWon - totalLost;

  const winRate =
    settled.length > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const avgOdds =
    bets.length > 0 ? bets.reduce((s, b) => s + b.odds, 0) / bets.length : 0;

  const sortedSettled = [...settled].sort(
    (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  );
  let streak = 0;
  if (sortedSettled.length > 0) {
    const lastStatus = sortedSettled[0].status;
    for (const b of sortedSettled) {
      if (b.status !== lastStatus) break;
      streak += lastStatus === "WON" ? 1 : -1;
    }
  }

  return {
    totalBets: bets.length,
    pendingBets: bets.filter((b) => b.status === "PENDING").length,
    wonBets: won.length,
    lostBets: lost.length,
    voidBets: bets.filter((b) => b.status === "VOID").length,
    totalStaked,
    totalProfit,
    roi: Math.round(roi * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    avgOdds: Math.round(avgOdds * 100) / 100,
    currentStreak: streak,
  };
}

export interface DayProfit {
  date: string;
  profit: number;
  cumulative: number;
}

export function calcProfitByDay(bets: BetForStats[]): DayProfit[] {
  const settled = bets.filter((b) => b.status === "WON" || b.status === "LOST");
  const byDay: Record<string, number> = {};
  for (const b of settled) {
    const d = new Date(b.matchDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayPl = b.status === "WON" ? (b.winnings ?? 0) : -b.stake;
    byDay[key] = (byDay[key] ?? 0) + dayPl;
  }
  const sorted = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
  let cum = 0;
  return sorted.map(([dateStr, profit]) => {
    cum += profit;
    const [, m, day] = dateStr.split("-");
    return {
      date: `${day}.${m}`,
      profit: Math.round(profit * 100) / 100,
      cumulative: Math.round(cum * 100) / 100,
    };
  });
}

export interface SportShare {
  sport: string;
  count: number;
  staked: number;
}

export function calcSportDistribution(bets: BetForStats[]): SportShare[] {
  const map: Record<string, SportShare> = {};
  for (const b of bets) {
    if (!map[b.sport]) map[b.sport] = { sport: b.sport, count: 0, staked: 0 };
    map[b.sport].count++;
    map[b.sport].staked += b.stake;
  }
  return Object.values(map).sort((a, b) => b.count - a.count);
}
