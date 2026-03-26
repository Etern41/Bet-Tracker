import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BetStatus, BetType, type Prisma } from "@prisma/client";
import {
  LIMITS,
  parseDecimalFromBody,
  sanitizeLineInput,
  sanitizeNotesInput,
  trimMax,
  validateExternalMatchId,
  validateMatchTitle,
  validateOdds,
  validateOptionalLeague,
  validateOptionalTeamField,
  validateSport,
  validateSportKey,
  validateStake,
} from "@/lib/validation";

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
    const searchRaw = searchParams.get("search")?.trim() ?? "";
    const search =
      searchRaw.length > LIMITS.searchQuery
        ? searchRaw.slice(0, LIMITS.searchQuery)
        : searchRaw;
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

    const sport =
      typeof b.sport === "string"
        ? sanitizeLineInput(b.sport, LIMITS.sport).trim()
        : "";
    const matchTitle =
      typeof b.matchTitle === "string"
        ? sanitizeLineInput(b.matchTitle, LIMITS.matchTitle).trim()
        : "";
    const betType = typeof b.betType === "string" ? b.betType : "";
    const odds = parseDecimalFromBody(b.odds, "odds");
    const stake = parseDecimalFromBody(b.stake, "stake");
    const matchDateRaw = b.matchDate;
    const matchDate =
      typeof matchDateRaw === "string" || matchDateRaw instanceof Date
        ? new Date(matchDateRaw as string | Date)
        : null;

    const eSport = validateSport(sport);
    if (eSport) return Response.json({ error: eSport }, { status: 400 });
    const eTitle = validateMatchTitle(matchTitle);
    if (eTitle) return Response.json({ error: eTitle }, { status: 400 });
    if (!betType || !BET_TYPES.has(betType)) {
      return Response.json({ error: "Некорректный тип ставки" }, { status: 400 });
    }
    if (!matchDate || Number.isNaN(matchDate.getTime())) {
      return Response.json({ error: "Некорректная дата матча" }, { status: 400 });
    }
    if (odds == null) {
      return Response.json({ error: "Некорректный коэффициент" }, { status: 400 });
    }
    if (stake == null) {
      return Response.json({ error: "Некорректная сумма" }, { status: 400 });
    }
    const eOdds = validateOdds(odds);
    if (eOdds) return Response.json({ error: eOdds }, { status: 400 });
    const eStake = validateStake(stake);
    if (eStake) return Response.json({ error: eStake }, { status: 400 });

    const sportKeyStr = typeof b.sportKey === "string" ? b.sportKey : null;
    const eSk = validateSportKey(sportKeyStr);
    if (eSk) return Response.json({ error: eSk }, { status: 400 });

    const homeT =
      typeof b.homeTeam === "string"
        ? sanitizeLineInput(b.homeTeam, LIMITS.team).trim()
        : "";
    const awayT =
      typeof b.awayTeam === "string"
        ? sanitizeLineInput(b.awayTeam, LIMITS.team).trim()
        : "";
    const eH = validateOptionalTeamField(homeT || undefined, "homeTeam");
    if (eH) return Response.json({ error: eH }, { status: 400 });
    const eA = validateOptionalTeamField(awayT || undefined, "awayTeam");
    if (eA) return Response.json({ error: eA }, { status: 400 });

    const leagueStr =
      typeof b.league === "string"
        ? sanitizeLineInput(b.league, LIMITS.league).trim()
        : "";
    const eL = validateOptionalLeague(leagueStr || undefined);
    if (eL) return Response.json({ error: eL }, { status: 400 });

    const extId = typeof b.externalMatchId === "string" ? b.externalMatchId : null;
    const eExt = validateExternalMatchId(extId);
    if (eExt) return Response.json({ error: eExt }, { status: 400 });

    const notesRaw =
      typeof b.notes === "string"
        ? sanitizeNotesInput(b.notes, LIMITS.notes).trim()
        : "";

    const statusRaw = typeof b.status === "string" ? b.status : "PENDING";
    const status = BET_STATUSES.has(statusRaw) ? (statusRaw as BetStatus) : BetStatus.PENDING;

    const winnings = status === BetStatus.WON ? stake * (odds - 1) : null;

    const bet = await prisma.bet.create({
      data: {
        userId: session.user.id,
        sport: trimMax(sport, LIMITS.sport),
        sportKey: sportKeyStr ? trimMax(sportKeyStr, LIMITS.sportKey) : null,
        matchTitle: trimMax(matchTitle, LIMITS.matchTitle),
        homeTeam: homeT || null,
        awayTeam: awayT || null,
        league: leagueStr || null,
        matchDate,
        betType: betType as BetType,
        odds,
        stake,
        status,
        winnings,
        notes: notesRaw || null,
        externalMatchId: extId ? trimMax(extId, LIMITS.externalMatchId) : null,
      },
    });

    return Response.json({ bet });
  } catch {
    return Response.json({ error: "Не удалось создать ставку" }, { status: 500 });
  }
}
