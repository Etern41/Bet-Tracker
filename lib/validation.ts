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
  /** Символы в поле ввода: 10000.99 → 7 символов; запас до 9 */
  oddsInputMaxChars: 9,
  /** До 1e9 + дробь */
  stakeInputMaxChars: 14,
  /** Знаков после точки в коэффициенте */
  oddsMaxFractionDigits: 3,
  /** Знаков после точки в сумме */
  stakeMaxFractionDigits: 2,
  /** `datetime-local` в формате YYYY-MM-DDTHH:mm */
  datetimeLocalMaxLen: 16,
} as const;

/** Потолок для отображения «возможной прибыли» в UI (защита от некорректных чисел). */
export const MAX_PROFIT_DISPLAY = 1e15;

function limitDecimalFractionDigits(s: string, maxFrac: number): string {
  const dot = s.indexOf(".");
  if (dot === -1) return s;
  const intPart = s.slice(0, dot + 1);
  const frac = s.slice(dot + 1).replace(/\./g, "");
  return intPart + frac.slice(0, maxFrac);
}

/**
 * Только цифры и одна точка/запятая (запятая → точка), лимит длины и дробной части.
 */
export function clampDecimalInput(
  raw: string,
  maxLen: number,
  maxFractionDigits?: number
): string {
  const s0 = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const dot = s0.indexOf(".");
  let s =
    dot === -1 ? s0 : s0.slice(0, dot + 1) + s0.slice(dot + 1).replace(/\./g, "");
  if (maxFractionDigits !== undefined && maxFractionDigits >= 0) {
    s = limitDecimalFractionDigits(s, maxFractionDigits);
  }
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Коэффициент в UI: только цифры/точка, длина, дробь, потолок oddsMax. */
export function sanitizeOddsInput(raw: string): string {
  const s = clampDecimalInput(
    raw,
    LIMITS.oddsInputMaxChars,
    LIMITS.oddsMaxFractionDigits
  );
  if (s === "" || s === ".") return s;
  const n = Number(s);
  if (!Number.isNaN(n) && n > LIMITS.oddsMax) {
    return String(LIMITS.oddsMax);
  }
  return s;
}

/** Сумма в UI: только цифры/точка, длина, дробь, потолок stakeMax. */
export function sanitizeStakeInput(raw: string): string {
  const s = clampDecimalInput(
    raw,
    LIMITS.stakeInputMaxChars,
    LIMITS.stakeMaxFractionDigits
  );
  if (s === "" || s === ".") return s;
  const n = Number(s);
  if (!Number.isNaN(n) && n > LIMITS.stakeMax) {
    return String(LIMITS.stakeMax);
  }
  return s;
}

/** Однострочные поля (спорт, матч, лига, поиск): убрать управляющие символы и переносы. */
export function sanitizeLineInput(raw: string, maxLen: number): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .slice(0, maxLen);
}

/** Заметки: допустим перевод строки, без прочих управляющих символов. */
export function sanitizeNotesInput(raw: string, maxLen: number): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .slice(0, maxLen);
}

export function sanitizeSportField(raw: string): string {
  return sanitizeLineInput(raw, LIMITS.sport);
}

export function sanitizeMatchTitleField(raw: string): string {
  return sanitizeLineInput(raw, LIMITS.matchTitle);
}

export function sanitizeLeagueField(raw: string): string {
  return sanitizeLineInput(raw, LIMITS.league);
}

export function sanitizeSearchQueryField(raw: string): string {
  return sanitizeLineInput(raw, LIMITS.searchQuery);
}

export function sanitizeDisplayNameField(raw: string): string {
  return sanitizeLineInput(raw, LIMITS.displayName);
}

/** Email в поле ввода: без управляющих символов, лимит длины. */
export function sanitizeEmailInput(raw: string): string {
  return sanitizeLineInput(raw, LIMITS.emailMax);
}

/** Пароль: только убрать NUL и обрезать по лимиту (символы UTF-8 сохраняем). */
export function sanitizePasswordInput(raw: string): string {
  return raw.replace(/\u0000/g, "").slice(0, LIMITS.passwordMax);
}

/**
 * Разбор odds/stake из тела запроса: только валидная десятичная строка, иначе null.
 */
/** Значение input type="datetime-local" (обрезка лишнего ввода). */
export function sanitizeDatetimeLocalInput(raw: string): string {
  return raw.slice(0, LIMITS.datetimeLocalMaxLen);
}

export function parseDecimalFromBody(
  raw: unknown,
  kind: "odds" | "stake"
): number | null {
  const maxLen =
    kind === "odds" ? LIMITS.oddsInputMaxChars : LIMITS.stakeInputMaxChars;
  const maxFrac =
    kind === "odds"
      ? LIMITS.oddsMaxFractionDigits
      : LIMITS.stakeMaxFractionDigits;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    return raw;
  }
  if (typeof raw !== "string") return null;
  const s = clampDecimalInput(raw.trim(), maxLen, maxFrac);
  if (s === "" || s === ".") return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

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
