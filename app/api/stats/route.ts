import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BetStatus, BetType, type Prisma } from "@prisma/client";
import { calcProfitByDay, calcSportDistribution, calcStats, type BetForStats } from "@/lib/stats";

const BET_TYPES = new Set<string>(Object.values(BetType));
const BET_STATUSES = new Set<string>(Object.values(BetStatus));

function parseEnum<T extends string>(value: string | null, allowed: Set<string>): T | undefined {
  if (!value || !allowed.has(value)) return undefined;
  return value as T;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.trim() || undefined;
    const search = searchParams.get("search")?.trim();
    const betType = parseEnum<BetType>(searchParams.get("betType"), BET_TYPES);
    const status = parseEnum<BetStatus>(searchParams.get("status"), BET_STATUSES);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const rangeAll = searchParams.get("range") === "all";

    const where: Prisma.BetWhereInput = {
      userId: session.user.id,
      ...(sport ? { sport } : {}),
      ...(betType ? { betType } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? { matchTitle: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    if (!rangeAll) {
      const matchDate: Prisma.DateTimeFilter = {};
      if (fromParam) {
        const d = new Date(fromParam);
        if (!Number.isNaN(d.getTime())) matchDate.gte = d;
      }
      if (toParam) {
        const d = new Date(toParam);
        if (!Number.isNaN(d.getTime())) matchDate.lte = d;
      }
      if (Object.keys(matchDate).length === 0) {
        const to = new Date();
        const from = new Date(to);
        from.setDate(from.getDate() - 30);
        matchDate.gte = from;
        matchDate.lte = to;
      }
      where.matchDate = matchDate;
    }

    const rows = await prisma.bet.findMany({
      where,
      orderBy: { matchDate: "asc" },
    });

    const bets: BetForStats[] = rows.map((r) => ({
      status: r.status,
      odds: r.odds,
      stake: r.stake,
      winnings: r.winnings,
      sport: r.sport,
      matchDate: r.matchDate,
      createdAt: r.createdAt,
    }));

    const stats = calcStats(bets);
    const profitByDay = calcProfitByDay(bets);
    const sportDistribution = calcSportDistribution(bets);

    const settledChrono = [...rows]
      .filter((b) => b.status === "WON" || b.status === "LOST")
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
    const streakSeries = settledChrono.map((b, i) => ({
      idx: i + 1,
      delta: b.status === "WON" ? 1 : -1,
    }));

    return Response.json({
      stats,
      profitByDay,
      sportDistribution,
      streakSeries,
    });
  } catch {
    return Response.json({ error: "Не удалось загрузить статистику" }, { status: 500 });
  }
}
