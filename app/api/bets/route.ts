import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BetStatus, BetType, type Prisma } from "@prisma/client";

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
    const sport = searchParams.get("sport") ?? undefined;
    const search = searchParams.get("search")?.trim();
    const betType = parseEnum<BetType>(searchParams.get("betType"), BET_TYPES);
    const status = parseEnum<BetStatus>(searchParams.get("status"), BET_STATUSES);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limitRaw = Number(searchParams.get("limit") ?? "20") || 20;
    const limit = Math.min(100, Math.max(1, limitRaw));

    const where: Prisma.BetWhereInput = { userId: session.user.id };
    if (search) {
      where.matchTitle = { contains: search, mode: "insensitive" };
    }
    if (sport) where.sport = sport;
    if (betType) where.betType = betType;
    if (status) where.status = status;
    if (from || to) {
      where.matchDate = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) where.matchDate.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) where.matchDate.lte = d;
      }
    }

    const [total, bets] = await Promise.all([
      prisma.bet.count({ where }),
      prisma.bet.findMany({
        where,
        orderBy: { matchDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / limit));

    return Response.json({
      bets,
      total,
      page,
      totalPages,
    });
  } catch {
    return Response.json({ error: "Не удалось загрузить ставки" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  try {
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Неверные данные" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const sport = typeof b.sport === "string" ? b.sport.trim() : "";
    const matchTitle = typeof b.matchTitle === "string" ? b.matchTitle.trim() : "";
    const betType = typeof b.betType === "string" ? b.betType : "";
    const odds = typeof b.odds === "number" ? b.odds : Number(b.odds);
    const stake = typeof b.stake === "number" ? b.stake : Number(b.stake);
    const matchDateRaw = b.matchDate;
    const matchDate =
      typeof matchDateRaw === "string" || matchDateRaw instanceof Date
        ? new Date(matchDateRaw as string | Date)
        : null;

    if (!sport || !matchTitle || !betType || !BET_TYPES.has(betType)) {
      return Response.json({ error: "Проверьте обязательные поля" }, { status: 400 });
    }
    if (!matchDate || Number.isNaN(matchDate.getTime())) {
      return Response.json({ error: "Некорректная дата матча" }, { status: 400 });
    }
    if (!(odds > 1)) {
      return Response.json({ error: "Коэффициент должен быть больше 1" }, { status: 400 });
    }
    if (!(stake > 0)) {
      return Response.json({ error: "Сумма ставки должна быть положительной" }, { status: 400 });
    }

    const statusRaw = typeof b.status === "string" ? b.status : "PENDING";
    const status = BET_STATUSES.has(statusRaw) ? (statusRaw as BetStatus) : BetStatus.PENDING;

    const winnings =
      status === BetStatus.WON ? stake * (odds - 1) : null;

    const bet = await prisma.bet.create({
      data: {
        userId: session.user.id,
        sport,
        sportKey: typeof b.sportKey === "string" ? b.sportKey : null,
        matchTitle,
        homeTeam: typeof b.homeTeam === "string" ? b.homeTeam : null,
        awayTeam: typeof b.awayTeam === "string" ? b.awayTeam : null,
        league: typeof b.league === "string" ? b.league : null,
        matchDate,
        betType: betType as BetType,
        odds,
        stake,
        status,
        winnings,
        notes: typeof b.notes === "string" ? b.notes.slice(0, 300) : null,
        externalMatchId: typeof b.externalMatchId === "string" ? b.externalMatchId : null,
      },
    });

    return Response.json({ bet });
  } catch {
    return Response.json({ error: "Не удалось создать ставку" }, { status: 500 });
  }
}
