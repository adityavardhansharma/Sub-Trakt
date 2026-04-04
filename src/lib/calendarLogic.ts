import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
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
