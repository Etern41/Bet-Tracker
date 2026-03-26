"use client";

import { useEffect, useMemo, useState } from "react";
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
  MANUAL_SPORTS,
  BET_TYPE_LABELS,
  BET_STATUS_LABELS,
  SPORTS_RU,
  labelBetType,
  labelBetStatus,
} from "@/lib/constants";
import { formatOdds } from "@/lib/utils";
import type { BetRow } from "@/components/bets/types";
import {
  LIMITS,
  validateMatchTitle,
  validateOdds,
  validateOptionalLeague,
  validateSport,
  validateStake,
} from "@/lib/validation";

function clampDecimalInput(raw: string, maxLen: number): string {
  const s0 = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const dot = s0.indexOf(".");
  const s =
    dot === -1 ? s0 : s0.slice(0, dot + 1) + s0.slice(dot + 1).replace(/\./g, "");
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

const BET_TYPES = ["WINNER", "TOTAL_OVER", "TOTAL_UNDER", "HANDICAP", "BTTS"] as const;
const BET_STATUSES = ["PENDING", "WON", "LOST", "VOID"] as const;

type BetType = (typeof BET_TYPES)[number];
type BetStatus = (typeof BET_STATUSES)[number];

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

  const potentialProfit = useMemo(() => {
    const o = Number(odds.replace(",", "."));
    const s = Number(stake.replace(",", "."));
    if (!Number.isFinite(o) || !Number.isFinite(s) || o <= 1 || s <= 0) return null;
    return s * (o - 1);
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
    setSport(m.sportDisplay);
    setSportKey(m.sportKey);
    setMatchTitle(m.matchTitle);
    setHomeTeam(m.homeTeam);
    setAwayTeam(m.awayTeam);
    setLeague(m.league);
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

  const inputClass =
    "h-9 min-w-0 max-w-full overflow-x-auto px-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring dark:bg-input/45";
  const inputTextClass = `${inputClass} break-all`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Редактировать ставку" : "Добавить ставку"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="min-w-0 max-w-full space-y-4">
            <div className="space-y-2">
              <Label>Вид спорта</Label>
              {oddsConfigured && sportsApi.length > 0 && !sportManual ? (
                <div className="space-y-2">
                  <Select
                    value={sportKey ?? undefined}
                    onValueChange={(k) => {
                      if (k == null) return;
                      setSportKey(k);
                      const s = sportsApi.find((x) => x.key === k);
                      setSport(SPORTS_RU[k] ?? s?.title ?? "");
                    }}
                  >
                    <SelectTrigger className="h-9 w-full min-w-0 px-3 font-normal">
                      <SelectValue placeholder="Выберите лигу/спорт">
                        {sportKey
                          ? (sport.trim() ||
                              SPORTS_RU[sportKey] ||
                              sportsApi.find((x) => x.key === sportKey)?.title ||
                              "Лига / спорт")
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sportsApi.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.title}
                        </SelectItem>
                      ))}
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
                <div className="space-y-2">
                  <Input
                    list="manual-sports"
                    className={inputTextClass}
                    value={sport}
                    maxLength={LIMITS.sport}
                    onChange={(e) => {
                      setSport(e.target.value);
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

            <div className="space-y-2">
              <Label>Матч</Label>
              <Input
                className={inputTextClass}
                value={matchTitle}
                maxLength={LIMITS.matchTitle}
                onChange={(e) => setMatchTitle(e.target.value)}
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

            <div className="space-y-2">
              <Label>Лига (необязательно)</Label>
              <Input
                className={inputTextClass}
                value={league}
                maxLength={LIMITS.league}
                onChange={(e) => setLeague(e.target.value)}
              />
              {fieldErrors.league ? (
                <p className="text-sm text-destructive">{fieldErrors.league}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Дата матча</Label>
              <Input
                type="datetime-local"
                className={inputClass}
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                required
              />
              {fieldErrors.matchDate ? (
                <p className="text-sm text-destructive">{fieldErrors.matchDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Тип ставки</Label>
              <Select value={betType} onValueChange={(v) => setBetType(v as BetType)}>
                <SelectTrigger className="h-9 w-full min-w-0 px-3 font-normal">
                  <SelectValue>{labelBetType(betType)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {BET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Коэффициент</Label>
              <Input
                className={`font-mono ${inputClass}`}
                inputMode="decimal"
                value={odds}
                maxLength={16}
                onChange={(e) => setOdds(clampDecimalInput(e.target.value, 16))}
                min={1.01}
                step={0.01}
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

            <div className="space-y-2">
              <Label>Сумма ставки</Label>
              <Input
                className={`font-mono ${inputClass}`}
                inputMode="decimal"
                value={stake}
                maxLength={18}
                onChange={(e) => setStake(clampDecimalInput(e.target.value, 18))}
                min={0.01}
                step={0.01}
                required
              />
              <p className="text-xs text-muted-foreground">
                {potentialProfit != null
                  ? `Возможная прибыль: +${potentialProfit.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`
                  : "Возможная прибыль: —"}
              </p>
              {fieldErrors.stake ? (
                <p className="text-sm text-destructive">{fieldErrors.stake}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BetStatus)}>
                <SelectTrigger className="h-9 w-full min-w-0 px-3 font-normal">
                  <SelectValue>{labelBetStatus(status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BET_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {BET_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea
                className="min-h-[80px] min-w-0 max-w-full border border-input rounded-md bg-background text-foreground dark:bg-input/45"
                maxLength={LIMITS.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
