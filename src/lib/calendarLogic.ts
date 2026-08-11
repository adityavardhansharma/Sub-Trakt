import {
  addDays,
  eachDayOfInterval,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Subscription } from "../storage/subscriptions";

export type CalendarDay = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
};

export function buildCalendarDays(
  month: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 0,
): Date[] {
  const calendarStart = startOfWeek(startOfMonth(month), { weekStartsOn });
  return eachDayOfInterval({
    start: calendarStart,
    end: addDays(calendarStart, 41),
  });
}

export function toCalendarDay(date: Date, month: Date): CalendarDay {
  return {
    date,
    inMonth: isSameMonth(date, month),
    isToday: isToday(date),
  };
}

export function getSubscriptionsForDay(
  day: Date,
  subscriptions: Subscription[],
): Subscription[] {
  const dayStart = startOfDay(day);
  return subscriptions.filter((subscription) => {
    const subscriptionStart = startOfDay(new Date(subscription.startDate));
    if (isBefore(dayStart, subscriptionStart)) return false;

    if (subscription.cycle === "monthly") {
      return subscriptionStart.getDate() === day.getDate();
    }

    return (
      subscriptionStart.getMonth() === day.getMonth() &&
      subscriptionStart.getDate() === day.getDate()
    );
  });
}

export function computeMonthlyTotal(
  month: Date,
  subscriptions: Subscription[],
): number {
  const viewedMonth = month.getMonth();
  const viewedYear = month.getFullYear();
  const monthStart = startOfMonth(month);

  return subscriptions.reduce((sum, s) => {
    const start = new Date(s.startDate);
    if (
      isBefore(monthStart, startOfDay(start)) &&
      !(
        start.getMonth() === viewedMonth &&
        start.getFullYear() === viewedYear
      )
    ) {
      return sum;
    }

    if (s.cycle === "monthly") {
      if (
        startOfDay(start) <= monthStart ||
        (start.getMonth() === viewedMonth &&
          start.getFullYear() === viewedYear)
      ) {
        return sum + s.price;
      }
      return sum;
    }

    if (
      start.getMonth() === viewedMonth &&
      startOfDay(start).getFullYear() <= viewedYear
    ) {
      return sum + s.price;
    }

    return sum;
  }, 0);
}

export type UpcomingRenewal = {
  subscription: Subscription;
  date: Date;
};

/** Next billing date on or after `from` (inclusive of today). */
export function getNextBillingDate(
  subscription: Subscription,
  from: Date = new Date(),
): Date {
  const start = startOfDay(new Date(subscription.startDate));
  const fromDay = startOfDay(from);

  if (isBefore(fromDay, start)) return start;

  if (subscription.cycle === "monthly") {
    const dayOfMonth = start.getDate();
    let year = fromDay.getFullYear();
    let month = fromDay.getMonth();

    let candidate = startOfDay(new Date(year, month, dayOfMonth));
    // Clamp overflow (e.g. Jan 31 → Feb → last day of Feb)
    if (candidate.getDate() !== dayOfMonth) {
      candidate = startOfDay(new Date(year, month + 1, 0));
    }

    if (isBefore(candidate, fromDay)) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      candidate = startOfDay(new Date(year, month, dayOfMonth));
      if (candidate.getDate() !== dayOfMonth) {
        candidate = startOfDay(new Date(year, month + 1, 0));
      }
    }

    return candidate;
  }

  let candidate = startOfDay(
    new Date(fromDay.getFullYear(), start.getMonth(), start.getDate()),
  );
  if (isBefore(candidate, fromDay)) {
    candidate = startOfDay(
      new Date(fromDay.getFullYear() + 1, start.getMonth(), start.getDate()),
    );
  }
  return candidate;
}

export function getUpcomingRenewals(
  subscriptions: Subscription[],
  from: Date = new Date(),
  limit = 6,
): UpcomingRenewal[] {
  return subscriptions
    .map((subscription) => ({
      subscription,
      date: getNextBillingDate(subscription, from),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

export function countRenewalsWithinDays(
  subscriptions: Subscription[],
  days: number,
  from: Date = new Date(),
): number {
  const fromDay = startOfDay(from);
  const end = addDays(fromDay, days);
  return subscriptions.reduce((count, subscription) => {
    const next = getNextBillingDate(subscription, fromDay);
    if (!isBefore(next, fromDay) && !isBefore(end, next)) return count + 1;
    return count;
  }, 0);
}
