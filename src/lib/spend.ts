import { isSameMonth } from "date-fns";
import { buildCalendarDays, getSubscriptionsForDay } from "./calendarLogic";
import type { Subscription } from "../storage/subscriptions";

/** Total billed across all charges whose billing day lands inside month `m`. */
export function spendForMonth(m: Date, subs: Subscription[]): number {
  return buildCalendarDays(m, 0).reduce((sum, d) => {
    if (!isSameMonth(d, m)) return sum;
    return sum + getSubscriptionsForDay(d, subs).reduce((s, sub) => s + sub.price, 0);
  }, 0);
}
