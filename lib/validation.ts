/** Общие лимиты и проверки для API и клиента. */

export const LIMITS = {
  sport: 120,
  matchTitle: 300,
  team: 120,
  league: 120,
  notes: 300,
  sportKey: 80,
  externalMatchId: 160,
  oddsMax: 10_000,
  stakeMax: 1_000_000_000,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
  searchQuery: 200,
  displayName: 120,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function trimMax(s: string, max: number): string {
  return s.trim().slice(0, max);
}

export function validateEmail(email: string): string | null {
  const t = email.trim().toLowerCase();
  if (!t) return "Укажите email";
  if (t.length > LIMITS.emailMax) return "Email слишком длинный";
  if (!EMAIL_RE.test(t)) return "Некорректный email";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < LIMITS.passwordMin) {
    return `Пароль не короче ${LIMITS.passwordMin} символов`;
  }
  if (password.length > LIMITS.passwordMax) {
    return "Пароль слишком длинный";
  }
  return null;
}

export function validateOdds(odds: number): string | null {
  if (!Number.isFinite(odds)) return "Некорректный коэффициент";
  if (odds <= 1) return "Коэффициент должен быть больше 1";
  if (odds > LIMITS.oddsMax) return `Коэффициент не больше ${LIMITS.oddsMax}`;
  return null;
}

export function validateStake(stake: number): string | null {
  if (!Number.isFinite(stake)) return "Некорректная сумма";
  if (stake <= 0) return "Сумма должна быть больше 0";
  if (stake > LIMITS.stakeMax) return "Сумма слишком большая";
  return null;
}

export function validateSport(sport: string): string | null {
  const t = sport.trim();
  if (!t) return "Укажите вид спорта";
  if (t.length > LIMITS.sport) return `Вид спорта не длиннее ${LIMITS.sport} символов`;
  return null;
}

export function validateMatchTitle(title: string): string | null {
  const t = title.trim();
  if (!t) return "Укажите матч";
  if (t.length > LIMITS.matchTitle) return `Название матча не длиннее ${LIMITS.matchTitle} символов`;
  return null;
}

export function validateOptionalTeamField(
  value: string | undefined,
  field: "homeTeam" | "awayTeam"
): string | null {
  if (value === undefined || value === "") return null;
  if (value.trim().length > LIMITS.team) {
    return field === "homeTeam" ? "Команда (дома): слишком длинное значение" : "Команда (гости): слишком длинное значение";
  }
  return null;
}

export function validateOptionalLeague(league: string | undefined): string | null {
  if (league === undefined || league === "") return null;
  if (league.trim().length > LIMITS.league) return "Название лиги слишком длинное";
  return null;
}

export function validateSportKey(key: string | null | undefined): string | null {
  if (key == null || key === "") return null;
  if (key.length > LIMITS.sportKey) return "Ключ спорта слишком длинный";
  return null;
}

export function validateExternalMatchId(id: string | null | undefined): string | null {
  if (id == null || id === "") return null;
  if (id.length > LIMITS.externalMatchId) return "Идентификатор матча слишком длинный";
  return null;
}

/** null = сбросить имя. Для строки — проверка длины после trim (до обрезки на сервере). */
export function validateDisplayNameInput(raw: string | null): string | null {
  if (raw === null) return null;
  if (raw.trim().length > LIMITS.displayName) {
    return `Имя не длиннее ${LIMITS.displayName} символов`;
  }
  return null;
}
