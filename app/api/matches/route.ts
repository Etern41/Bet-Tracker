import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchEvents,
  fetchOddsForSport,
  oddsApiAvailable,
  type OddsEvent,
} from "@/lib/odds-api";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sport") ?? "soccer_epl";
  const includeOdds = searchParams.get("includeOdds") === "true";

  if (!oddsApiAvailable()) {
    return Response.json({ matches: [], oddsUnavailable: true });
  }

  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const cached = await prisma.matchCache.findMany({
      where: { sportKey, fetchedAt: { gte: cutoff } },
      orderBy: { commenceTime: "asc" },
    });

    if (cached.length > 0) {
      return Response.json({ matches: cached, oddsUnavailable: false });
    }

    if (includeOdds) {
      const withOdds = await fetchOddsForSport(sportKey);
      for (const e of withOdds) {
        await prisma.matchCache.upsert({
          where: { externalId: e.id },
          update: {
            oddsData: e.bookmakers as unknown as Prisma.InputJsonValue,
            fetchedAt: new Date(),
            commenceTime: new Date(e.commence_time),
            homeTeam: e.home_team,
            awayTeam: e.away_team,
            sportTitle: e.sport_title,
            sportKey: e.sport_key,
          },
          create: {
            externalId: e.id,
            sportKey: e.sport_key,
            sportTitle: e.sport_title,
            homeTeam: e.home_team,
            awayTeam: e.away_team,
            commenceTime: new Date(e.commence_time),
            oddsData: e.bookmakers as unknown as Prisma.InputJsonValue,
          },
        });
      }
    } else {
      const events: OddsEvent[] = await fetchEvents(sportKey);
      for (const e of events) {
        await prisma.matchCache.upsert({
          where: { externalId: e.id },
          update: {
            fetchedAt: new Date(),
            commenceTime: new Date(e.commence_time),
            homeTeam: e.home_team,
            awayTeam: e.away_team,
            sportTitle: e.sport_title,
            sportKey: e.sport_key,
          },
          create: {
            externalId: e.id,
            sportKey: e.sport_key,
            sportTitle: e.sport_title,
            homeTeam: e.home_team,
            awayTeam: e.away_team,
            commenceTime: new Date(e.commence_time),
          },
        });
      }
    }

    const freshCutoff = new Date(Date.now() - 60 * 1000);
    const freshMatches = await prisma.matchCache.findMany({
      where: { sportKey, fetchedAt: { gte: freshCutoff } },
      orderBy: { commenceTime: "asc" },
    });

    return Response.json({ matches: freshMatches, oddsUnavailable: false });
  } catch (err) {
    console.error("Matches API error:", err);
    return Response.json({
      matches: [],
      oddsUnavailable: true,
      error: "API недоступен",
    });
  }
}
