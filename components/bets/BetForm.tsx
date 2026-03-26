"use client";

import type { BetStatus, BetType } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchPicker, type MatchPickResult } from "@/components/bets/MatchPicker";
import {
  BET_STATUS_KEYS,
  BET_STATUS_SELECT_ITEMS,
  BET_TYPE_KEYS,
  BET_TYPE_LABELS,
  BET_TYPE_SELECT_ITEMS,
  BET_STATUS_LABELS,
  MANUAL_SPORTS,
  SPORTS_RU,
  labelFromSelectItems,
  labelSportKeyForUi,
} from "@/lib/constants";
import {
  FORM_FIELD_STACK,
  FORM_INPUT,
  FORM_INPUT_TEXT,
  FORM_SELECT_TRIGGER,
  FORM_TEXTAREA,
} from "@/lib/form-field-classes";
import { formatOdds } from "@/lib/utils";
import type { BetRow } from "@/components/bets/types";
import {
  LIMITS,
  MAX_PROFIT_DISPLAY,
  sanitizeDatetimeLocalInput,
  sanitizeLineInput,
  sanitizeLeagueField,
  sanitizeMatchTitleField,
  sanitizeNotesInput,
  sanitizeOddsInput,
  sanitizeSportField,
  sanitizeStakeInput,
  validateMatchTitle,
  validateOdds,
  validateOptionalLeague,
  validateSport,
  validateStake,
} from "@/lib/validation";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultMatchDateLocal(): string {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return toDatetimeLocalValue(d);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bet: BetRow | null;
  onSaved: () => void;
};

type OddsSport = { key: string; title: string; active: boolean };

export function BetForm({ open, onOpenChange, bet, onSaved }: Props) {
  const router = useRouter();
  const isEdit = Boolean(bet);

  const [oddsConfigured, setOddsConfigured] = useState(false);
  const [sportManual, setSportManual] = useState(false);
  const [sportsApi, setSportsApi] = useState<OddsSport[]>([]);
  const [sport, setSport] = useState("");
  const [sportKey, setSportKey] = useState<string | null>(null);
  const [matchTitle, setMatchTitle] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [league, setLeague] = useState("");
  const [matchDate, setMatchDate] = useState(defaultMatchDateLocal);
  const [betType, setBetType] = useState<BetType>("WINNER");
  const [odds, setOdds] = useState("1.85");
  const [stake, setStake] = useState("1000");
  const [status, setStatus] = useState<BetStatus>("PENDING");
  const [notes, setNotes] = useState("");
  const [externalMatchId, setExternalMatchId] = useState<string | null>(null);
  const [suggestedOdds, setSuggestedOdds] = useState<number | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const sportSelectItems = useMemo(() => {
    const r: Record<string, string> = {};
    for (const s of sportsApi) {
      r[s.key] = SPORTS_RU[s.key] ?? s.title;
    }
    if (sportKey) {
      r[sportKey] = labelSportKeyForUi(sportKey, sport || undefined, sportsApi);
    }
    return r;
  }, [sportsApi, sportKey, sport]);

  const formatSportSelect = useCallback(
    (v: unknown) => {
      if (v == null) return "Выберите лигу/спорт";
      const s = String(v);
      return sportSelectItems[s] ?? labelSportKeyForUi(s, sport || undefined, sportsApi);
    },
    [sportSelectItems, sport, sportsApi]
  );

  const formatBetTypeSelect = useCallback(
    (v: unknown) => labelFromSelectItems(BET_TYPE_SELECT_ITEMS, v),
    []
  );

  const formatBetStatusSelect = useCallback(
    (v: unknown) => labelFromSelectItems(BET_STATUS_SELECT_ITEMS, v),
    []
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/odds-status");
        const data: unknown = await res.json();
        const configured =
          typeof data === "object" &&
          data !== null &&
          "oddsConfigured" in data &&
          (data as { oddsConfigured: boolean }).oddsConfigured === true;
        if (!cancelled) setOddsConfigured(configured);
        if (configured) {
          const sr = await fetch("/api/sports");
          const sj: unknown = await sr.json();
          const list =
            typeof sj === "object" &&
            sj !== null &&
            "sports" in sj &&
            Array.isArray((sj as { sports: unknown }).sports)
              ? ((sj as { sports: OddsSport[] }).sports as OddsSport[])
              : [];
          if (!cancelled) setSportsApi(list.filter((s) => s.active));
        }
      } catch {
        if (!cancelled) setOddsConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    setFieldErrors({});
    if (bet) {
      setSport(bet.sport);
      setSportKey(bet.sportKey);
      setSportManual(!bet.sportKey);
      setMatchTitle(bet.matchTitle);
      setHomeTeam(bet.homeTeam ?? "");
      setAwayTeam(bet.awayTeam ?? "");
      setLeague(bet.league ?? "");
      setMatchDate(toDatetimeLocalValue(new Date(bet.matchDate)));
      setBetType(bet.betType);
      setOdds(String(bet.odds));
      setStake(String(bet.stake));
      setStatus(bet.status);
      setNotes(bet.notes ?? "");
      setExternalMatchId(bet.externalMatchId);
      setSuggestedOdds(null);
    } else {
      setSport("");
      setSportKey(null);
      setSportManual(false);
      setMatchTitle("");
      setHomeTeam("");
      setAwayTeam("");
      setLeague("");
      setMatchDate(defaultMatchDateLocal());
      setBetType("WINNER");
      setOdds("1.85");
      setStake("1000");
      setStatus("PENDING");
      setNotes("");
      setExternalMatchId(null);
      setSuggestedOdds(null);
    }
  }, [open, bet]);

  const potentialProfitText = useMemo(() => {
    const o = Number(odds.replace(",", "."));
    const s = Number(stake.replace(",", "."));
    if (!Number.isFinite(o) || !Number.isFinite(s) || o <= 1 || s <= 0) {
      return "Возможная прибыль: —";
    }
    const p = s * (o - 1);
    if (!Number.isFinite(p) || p < 0 || p > MAX_PROFIT_DISPLAY) {
      return "Возможная прибыль: —";
    }
    return `Возможная прибыль: +${p.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`;
  }, [odds, stake]);

  function validate(): boolean {
    const err: Record<string, string> = {};
    const es = validateSport(sport);
    if (es) err.sport = es;
    const em = validateMatchTitle(matchTitle);
    if (em) err.matchTitle = em;
    const el = validateOptionalLeague(league || undefined);
    if (el) err.league = el;
    const md = new Date(matchDate);
    if (!matchDate || Number.isNaN(md.getTime())) err.matchDate = "Укажите дату матча";
    const o = Number(odds.replace(",", "."));
    const eo = validateOdds(o);
    if (eo) err.odds = eo;
    const st = Number(stake.replace(",", "."));
    const est = validateStake(st);
    if (est) err.stake = est;
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  function onPick(m: MatchPickResult) {
    setSport(sanitizeSportField(m.sportDisplay));
    setSportKey(m.sportKey);
    setMatchTitle(sanitizeMatchTitleField(m.matchTitle));
    setHomeTeam(sanitizeLineInput(m.homeTeam, LIMITS.team));
    setAwayTeam(sanitizeLineInput(m.awayTeam, LIMITS.team));
    setLeague(sanitizeLeagueField(m.league ?? ""));
    setMatchDate(toDatetimeLocalValue(new Date(m.matchDate)));
    setExternalMatchId(m.externalMatchId);
    setSuggestedOdds(m.suggestedOdds);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    const o = Number(odds.replace(",", "."));
    const st = Number(stake.replace(",", "."));
    const md = new Date(matchDate);

    const payload = {
      sport: sport.trim(),
      sportKey: sportKey ?? undefined,
      matchTitle: matchTitle.trim(),
      homeTeam: homeTeam.trim() || undefined,
      awayTeam: awayTeam.trim() || undefined,
      league: league.trim() || undefined,
      matchDate: md.toISOString(),
      betType,
      odds: o,
      stake: st,
      status,
      notes: notes.slice(0, LIMITS.notes) || undefined,
      externalMatchId: externalMatchId ?? undefined,
    };

    setLoading(true);
    try {
      const url = isEdit ? `/api/bets/${bet!.id}` : "/api/bets";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Ошибка сохранения";
        setServerError(msg);
        setLoading(false);
        return;
      }
      toast.success(isEdit ? "Ставка обновлена" : "Ставка сохранена");
      onSaved();
      router.refresh();
    } catch {
      setServerError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(92dvh,100vh)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] min-w-0 overflow-x-hidden overflow-y-auto border-border bg-card sm:max-w-lg sm:w-full">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Редактировать ставку" : "Добавить ставку"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="min-w-0 max-w-full space-y-4">
            <div className={FORM_FIELD_STACK}>
              <Label>Вид спорта</Label>
              {oddsConfigured && sportsApi.length > 0 && !sportManual ? (
                <div className={FORM_FIELD_STACK}>
                  <Select
                    value={sportKey ?? undefined}
                    items={sportSelectItems}
                    onValueChange={(k) => {
                      if (k == null) return;
                      const key = String(k);
                      setSportKey(key);
                      setSport(labelSportKeyForUi(key, undefined, sportsApi));
                    }}
                    itemToStringLabel={formatSportSelect}
                  >
                    <SelectTrigger className={FORM_SELECT_TRIGGER}>
                      <SelectValue placeholder="Выберите лигу/спорт">
                        {formatSportSelect}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sportsApi.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {SPORTS_RU[s.key] ?? s.title}
                        </SelectItem>
                      ))}
                      {sportKey && !sportsApi.some((x) => x.key === sportKey) ? (
                        <SelectItem key={sportKey} value={sportKey}>
                          {sportSelectItems[sportKey] ??
                            labelSportKeyForUi(sportKey, sport || undefined, sportsApi)}
                        </SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setSportManual(true)}
                  >
                    или введите вручную
                  </Button>
                </div>
              ) : (
                <div className={FORM_FIELD_STACK}>
                  <Input
                    list="manual-sports"
                    className={FORM_INPUT_TEXT}
                    value={sport}
                    maxLength={LIMITS.sport}
                    onChange={(e) => {
                      setSport(sanitizeSportField(e.target.value));
                      setSportKey(null);
                    }}
                    placeholder="Например, Футбол"
                  />
                  <datalist id="manual-sports">
                    {MANUAL_SPORTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {oddsConfigured ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSportManual(false)}
                    >
                      Выбрать из списка API
                    </Button>
                  ) : null}
                </div>
              )}
              {fieldErrors.sport ? (
                <p className="text-sm text-destructive">{fieldErrors.sport}</p>
              ) : null}
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Матч</Label>
              <Input
                className={FORM_INPUT_TEXT}
                value={matchTitle}
                maxLength={LIMITS.matchTitle}
                onChange={(e) => setMatchTitle(sanitizeMatchTitleField(e.target.value))}
                required
              />
              {oddsConfigured ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Выбрать из расписания →
                </Button>
              ) : null}
              {fieldErrors.matchTitle ? (
                <p className="text-sm text-destructive">{fieldErrors.matchTitle}</p>
              ) : null}
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Лига (необязательно)</Label>
              <Input
                className={FORM_INPUT_TEXT}
                value={league}
                maxLength={LIMITS.league}
                onChange={(e) => setLeague(sanitizeLeagueField(e.target.value))}
              />
              {fieldErrors.league ? (
                <p className="text-sm text-destructive">{fieldErrors.league}</p>
              ) : null}
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Дата матча</Label>
              <Input
                type="datetime-local"
                className={FORM_INPUT}
                value={matchDate}
                maxLength={LIMITS.datetimeLocalMaxLen}
                onChange={(e) => setMatchDate(sanitizeDatetimeLocalInput(e.target.value))}
                required
              />
              {fieldErrors.matchDate ? (
                <p className="text-sm text-destructive">{fieldErrors.matchDate}</p>
              ) : null}
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Тип ставки</Label>
              <Select
                value={betType}
                items={BET_TYPE_SELECT_ITEMS}
                onValueChange={(v) => setBetType(v as BetType)}
                itemToStringLabel={formatBetTypeSelect}
              >
                <SelectTrigger className={FORM_SELECT_TRIGGER}>
                  <SelectValue>{formatBetTypeSelect}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BET_TYPE_KEYS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {BET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Коэффициент</Label>
              <Input
                className={`font-mono ${FORM_INPUT}`}
                inputMode="decimal"
                autoComplete="off"
                value={odds}
                maxLength={LIMITS.oddsInputMaxChars}
                onChange={(e) => setOdds(sanitizeOddsInput(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">Десятичный формат (напр. 1.85)</p>
              {suggestedOdds != null ? (
                <button
                  type="button"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                  onClick={() => setOdds(formatOdds(suggestedOdds))}
                >
                  Рекомендуемый коэф: {formatOdds(suggestedOdds)}
                </button>
              ) : null}
              {fieldErrors.odds ? (
                <p className="text-sm text-destructive">{fieldErrors.odds}</p>
              ) : null}
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Сумма ставки</Label>
              <Input
                className={`font-mono ${FORM_INPUT}`}
                inputMode="decimal"
                autoComplete="off"
                value={stake}
                maxLength={LIMITS.stakeInputMaxChars}
                onChange={(e) => setStake(sanitizeStakeInput(e.target.value))}
                required
              />
              <p className="min-w-0 max-w-full break-words text-xs text-muted-foreground">
                {potentialProfitText}
              </p>
              {fieldErrors.stake ? (
                <p className="text-sm text-destructive">{fieldErrors.stake}</p>
              ) : null}
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Статус</Label>
              <Select
                value={status}
                items={BET_STATUS_SELECT_ITEMS}
                onValueChange={(v) => setStatus(v as BetStatus)}
                itemToStringLabel={formatBetStatusSelect}
              >
                <SelectTrigger className={FORM_SELECT_TRIGGER}>
                  <SelectValue>{formatBetStatusSelect}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BET_STATUS_KEYS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BET_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={FORM_FIELD_STACK}>
              <Label>Заметки</Label>
              <Textarea
                className={FORM_TEXTAREA}
                maxLength={LIMITS.notes}
                value={notes}
                onChange={(e) => setNotes(sanitizeNotesInput(e.target.value, LIMITS.notes))}
              />
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MatchPicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onPick} />
    </>
  );
}
