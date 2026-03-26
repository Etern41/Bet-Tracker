import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcProfitByDay, calcSportDistribution, calcStats, type BetForStats } from "@/lib/stats";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport") ?? undefined;
    const toParam = searchParams.get("to");
    const fromParam = searchParams.get("from");
    const rangeAll = searchParams.get("range") === "all";

    const to = toParam ? new Date(toParam) : new Date();
    if (Number.isNaN(to.getTime())) {
      return Response.json({ error: "Некорректная дата to" }, { status: 400 });
    }

    let from: Date;
    if (rangeAll) {
      from = new Date("1970-01-01T00:00:00.000Z");
    } else if (fromParam) {
      from = new Date(fromParam);
      if (Number.isNaN(from.getTime())) {
        return Response.json({ error: "Некорректная дата from" }, { status: 400 });
      }
    } else {
      from = new Date(to);
      from.setDate(from.getDate() - 30);
    }

    const where = {
      userId: session.user.id,
      matchDate: { gte: from, lte: to },
      ...(sport ? { sport } : {}),
    };

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
