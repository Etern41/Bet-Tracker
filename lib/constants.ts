export const SPORTS_RU: Record<string, string> = {
  soccer_epl: "АПЛ",
  soccer_spain_la_liga: "Ла Лига",
  soccer_germany_bundesliga: "Бундеслига",
  soccer_france_ligue_one: "Лига 1",
  soccer_italy_serie_a: "Серия А",
  soccer_uefa_champs_league: "Лига чемпионов",
  basketball_nba: "НБА",
  basketball_euroleague: "Евролига",
  icehockey_nhl: "НХЛ",
  tennis_atp_french_open: "АТП",
  mma_mixed_martial_arts: "ММА",
  upcoming: "Все предстоящие",
};

export const MANUAL_SPORTS = [
  "Футбол",
  "Баскетбол",
  "Хоккей",
  "Теннис",
  "Волейбол",
  "ММА",
  "Другое",
] as const;

export const BET_TYPE_LABELS: Record<string, string> = {
  WINNER: "Победитель",
  TOTAL_OVER: "Тотал больше",
  TOTAL_UNDER: "Тотал меньше",
  HANDICAP: "Фора",
  BTTS: "Обе забьют",
};

export const BET_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидание",
  WON: "Выиграна",
  LOST: "Проиграна",
  VOID: "Возврат",
};

/** Порядок ключей = порядок в UI и согласован с Prisma enum `BetType`. */
export const BET_TYPE_KEYS = [
  "WINNER",
  "TOTAL_OVER",
  "TOTAL_UNDER",
  "HANDICAP",
  "BTTS",
] as const satisfies readonly (keyof typeof BET_TYPE_LABELS)[];

/** Порядок согласован с Prisma enum `BetStatus`. */
export const BET_STATUS_KEYS = [
  "PENDING",
  "WON",
  "LOST",
  "VOID",
] as const satisfies readonly (keyof typeof BET_STATUS_LABELS)[];

/** Значение «все» в Select фильтров; не пересекается с названиями лиг из данных. */
export const BET_FILTER_ALL = "__filter_all__" as const;

export type BetFilterSelectItem = { value: string; label: string };

/** Статические пункты для фильтров по типу/статусу (без дублирования в компонентах). */
export const BET_TYPE_FILTER_ITEMS: BetFilterSelectItem[] = BET_TYPE_KEYS.map(
  (k) => ({ value: k, label: BET_TYPE_LABELS[k] })
);

export const BET_STATUS_FILTER_ITEMS: BetFilterSelectItem[] = BET_STATUS_KEYS.map(
  (k) => ({ value: k, label: BET_STATUS_LABELS[k] })
);

/** Карта value → подпись для Base UI `items` и триггера (без сырого enum в поле). */
export const BET_TYPE_SELECT_ITEMS: Record<string, string> = Object.fromEntries(
  BET_TYPE_KEYS.map((k) => [k, BET_TYPE_LABELS[k]])
);

export const BET_STATUS_SELECT_ITEMS: Record<string, string> = Object.fromEntries(
  BET_STATUS_KEYS.map((k) => [k, BET_STATUS_LABELS[k]])
);

/** Собрать Record для фильтра с пунктом «все». */
export function betFilterSelectItems(
  allToken: string,
  allLabel: string,
  items: readonly BetFilterSelectItem[]
): Record<string, string> {
  const r: Record<string, string> = { [allToken]: allLabel };
  for (const i of items) {
    r[i.value] = i.label;
  }
  return r;
}

/** Подпись выбранного значения по той же карте, что и пункты списка (enum — без учёта регистра). */
export function labelFromSelectItems(
  map: Record<string, string>,
  value: unknown
): string {
  if (value == null) return "";
  const s = String(value);
  const hit = map[s];
  if (hit != null) return hit;
  const u = s.toUpperCase();
  for (const [k, lab] of Object.entries(map)) {
    if (k.toUpperCase() === u) return lab;
  }
  return s;
}

/** Читаемый fallback для ключа API (например soccer_england_league2). */
export function humanizeOddsSportKey(key: string): string {
  const k = key.trim();
  if (!k) return "Лига / спорт";
  const spaced = k.replace(/_/g, " ");
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Подпись ключа спорта: название со ставки → словарь → список API → форматирование ключа.
 */
export function labelSportKeyForUi(
  key: string,
  storedSportTitle: string | undefined,
  apiSports: readonly { key: string; title: string }[]
): string {
  const t = storedSportTitle?.trim();
  if (t) return t;
  if (SPORTS_RU[key]) return SPORTS_RU[key];
  const fromApi = apiSports.find((x) => x.key === key)?.title;
  if (fromApi) return fromApi;
  return humanizeOddsSportKey(key);
}

/** Подпись для UI — никогда не показывать сырое значение enum. */
export function labelBetType(code: string): string {
  return BET_TYPE_LABELS[code] ?? "Тип ставки";
}

export function labelBetStatus(code: string): string {
  return BET_STATUS_LABELS[code] ?? "Статус";
}

/** Для `itemToStringLabel` / совместимости — та же карта, что у пунктов списка. */
export function selectItemLabelBetType(v: unknown): string {
  return labelFromSelectItems(BET_TYPE_SELECT_ITEMS, v);
}

export function selectItemLabelBetStatus(v: unknown): string {
  return labelFromSelectItems(BET_STATUS_SELECT_ITEMS, v);
}

/** Подпись ключа спорта из API (Odds) для триггера Select. */
export function labelOddsSportApiKey(
  key: unknown,
  apiSports: readonly { key: string; title: string }[]
): string {
  if (key == null) return "";
  const k = String(key);
  return labelSportKeyForUi(k, undefined, apiSports);
}
