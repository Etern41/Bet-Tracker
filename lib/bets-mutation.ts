/** Событие для обновления клиентских списков после POST/PATCH/DELETE ставки. */
export const BETS_MUTATION_EVENT = "bettracker:bets-updated";

export function notifyBetsMutated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BETS_MUTATION_EVENT));
  }
}
