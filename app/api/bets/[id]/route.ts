import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BetStatus, BetType, type Prisma } from "@prisma/client";

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

    if (typeof b.sport === "string") data.sport = b.sport.trim();
    if (typeof b.sportKey === "string" || b.sportKey === null) data.sportKey = b.sportKey as string | null;
    if (typeof b.matchTitle === "string") data.matchTitle = b.matchTitle.trim();
    if (typeof b.homeTeam === "string" || b.homeTeam === null) data.homeTeam = b.homeTeam as string | null;
    if (typeof b.awayTeam === "string" || b.awayTeam === null) data.awayTeam = b.awayTeam as string | null;
    if (typeof b.league === "string" || b.league === null) data.league = b.league as string | null;
    if (typeof b.matchDate === "string" || b.matchDate instanceof Date) {
      const d = new Date(b.matchDate as string | Date);
      if (!Number.isNaN(d.getTime())) data.matchDate = d;
    }
    if (typeof b.betType === "string" && BET_TYPES.has(b.betType)) {
      data.betType = b.betType as BetType;
    }
    if (typeof b.odds === "number" || typeof b.odds === "string") {
      const o = Number(b.odds);
      if (!Number.isNaN(o)) data.odds = o;
    }
    if (typeof b.stake === "number" || typeof b.stake === "string") {
      const s = Number(b.stake);
      if (!Number.isNaN(s)) data.stake = s;
    }
    if (typeof b.status === "string" && BET_STATUSES.has(b.status)) {
      data.status = b.status as BetStatus;
    }
    if (typeof b.notes === "string" || b.notes === null) {
      data.notes =
        typeof b.notes === "string" ? b.notes.slice(0, 300) : null;
    }
    if (typeof b.externalMatchId === "string" || b.externalMatchId === null) {
      data.externalMatchId = b.externalMatchId as string | null;
    }

    const nextOdds =
      b.odds !== undefined && (typeof b.odds === "number" || typeof b.odds === "string")
        ? Number(b.odds)
        : existing.odds;
    const nextStake =
      b.stake !== undefined && (typeof b.stake === "number" || typeof b.stake === "string")
        ? Number(b.stake)
        : existing.stake;
    let nextStatus = existing.status;
    if (typeof b.status === "string" && BET_STATUSES.has(b.status)) {
      nextStatus = b.status as BetStatus;
    }

    if (
      !Number.isFinite(nextOdds) ||
      !Number.isFinite(nextStake) ||
      nextOdds <= 1 ||
      nextStake <= 0
    ) {
      return Response.json({ error: "Некорректные коэффициент или сумма" }, { status: 400 });
    }

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
