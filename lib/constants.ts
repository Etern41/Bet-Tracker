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
