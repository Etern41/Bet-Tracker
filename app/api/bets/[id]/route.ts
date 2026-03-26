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

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  const { id } = context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  try {
    const existing = await prisma.bet.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: "Не найдено" }, { status: 404 });
    }

    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "Неверные данные" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const data: Prisma.BetUpdateInput = {};

    if (typeof b.sport === "string") {
      const t = sanitizeLineInput(b.sport, LIMITS.sport).trim();
      const e = validateSport(t);
      if (e) return Response.json({ error: e }, { status: 400 });
      data.sport = t;
    }
    if (typeof b.sportKey === "string" || b.sportKey === null) {
      const raw = typeof b.sportKey === "string" ? b.sportKey : null;
      const e = validateSportKey(raw);
      if (e) return Response.json({ error: e }, { status: 400 });
      data.sportKey = raw ? trimMax(raw, LIMITS.sportKey) : null;
    }
    if (typeof b.matchTitle === "string") {
      const t = sanitizeLineInput(b.matchTitle, LIMITS.matchTitle).trim();
      const e = validateMatchTitle(t);
      if (e) return Response.json({ error: e }, { status: 400 });
      data.matchTitle = t;
    }
    if (typeof b.homeTeam === "string" || b.homeTeam === null) {
      const t =
        typeof b.homeTeam === "string"
          ? sanitizeLineInput(b.homeTeam, LIMITS.team).trim()
          : "";
      const e = validateOptionalTeamField(t || undefined, "homeTeam");
      if (e) return Response.json({ error: e }, { status: 400 });
      data.homeTeam = typeof b.homeTeam === "string" ? t || null : null;
    }
    if (typeof b.awayTeam === "string" || b.awayTeam === null) {
      const t =
        typeof b.awayTeam === "string"
          ? sanitizeLineInput(b.awayTeam, LIMITS.team).trim()
          : "";
      const e = validateOptionalTeamField(t || undefined, "awayTeam");
      if (e) return Response.json({ error: e }, { status: 400 });
      data.awayTeam = typeof b.awayTeam === "string" ? t || null : null;
    }
    if (typeof b.league === "string" || b.league === null) {
      const t =
        typeof b.league === "string"
          ? sanitizeLineInput(b.league, LIMITS.league).trim()
          : "";
      const e = validateOptionalLeague(t || undefined);
      if (e) return Response.json({ error: e }, { status: 400 });
      data.league = typeof b.league === "string" ? t || null : null;
    }
    if (typeof b.matchDate === "string" || b.matchDate instanceof Date) {
      const d = new Date(b.matchDate as string | Date);
      if (Number.isNaN(d.getTime())) {
        return Response.json({ error: "Некорректная дата матча" }, { status: 400 });
      }
      data.matchDate = d;
    }
    if (typeof b.betType === "string" && BET_TYPES.has(b.betType)) {
      data.betType = b.betType as BetType;
    }
    if (typeof b.odds === "number" || typeof b.odds === "string") {
      const o = parseDecimalFromBody(b.odds, "odds");
      if (o == null) {
        return Response.json({ error: "Некорректный коэффициент" }, { status: 400 });
      }
      data.odds = o;
    }
    if (typeof b.stake === "number" || typeof b.stake === "string") {
      const s = parseDecimalFromBody(b.stake, "stake");
      if (s == null) {
        return Response.json({ error: "Некорректная сумма" }, { status: 400 });
      }
      data.stake = s;
    }
    if (typeof b.status === "string" && BET_STATUSES.has(b.status)) {
      data.status = b.status as BetStatus;
    }
    if (typeof b.notes === "string" || b.notes === null) {
      data.notes =
        typeof b.notes === "string"
          ? sanitizeNotesInput(b.notes, LIMITS.notes).trim() || null
          : null;
    }
    if (typeof b.externalMatchId === "string" || b.externalMatchId === null) {
      const raw =
        typeof b.externalMatchId === "string" ? b.externalMatchId : null;
      const e = validateExternalMatchId(raw);
      if (e) return Response.json({ error: e }, { status: 400 });
      data.externalMatchId = raw ? trimMax(raw, LIMITS.externalMatchId) : null;
    }

    const nextOdds =
      b.odds !== undefined && (typeof b.odds === "number" || typeof b.odds === "string")
        ? parseDecimalFromBody(b.odds, "odds") ?? existing.odds
        : existing.odds;
    const nextStake =
      b.stake !== undefined && (typeof b.stake === "number" || typeof b.stake === "string")
        ? parseDecimalFromBody(b.stake, "stake") ?? existing.stake
        : existing.stake;
    let nextStatus = existing.status;
    if (typeof b.status === "string" && BET_STATUSES.has(b.status)) {
      nextStatus = b.status as BetStatus;
    }

    const eO = validateOdds(nextOdds);
    if (eO) return Response.json({ error: eO }, { status: 400 });
    const eS = validateStake(nextStake);
    if (eS) return Response.json({ error: eS }, { status: 400 });

    let winnings: number | null = existing.winnings;
    if (nextStatus === BetStatus.WON) {
      winnings = nextStake * (nextOdds - 1);
    } else if (
      nextStatus === BetStatus.LOST ||
      nextStatus === BetStatus.VOID ||
      nextStatus === BetStatus.PENDING
    ) {
      winnings = null;
    }

    data.winnings = winnings;

    const bet = await prisma.bet.update({
      where: { id },
      data,
    });

    return Response.json({ bet });
  } catch {
    return Response.json({ error: "Не удалось обновить ставку" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const existing = await prisma.bet.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: "Не найдено" }, { status: 404 });
    }

    await prisma.bet.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Не удалось удалить ставку" }, { status: 500 });
  }
}
