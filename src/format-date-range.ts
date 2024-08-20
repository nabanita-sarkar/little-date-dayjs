import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

dayjs.extend(quarterOfYear);

/** date-fns function from original repo reimplemented in dayjs for easier future */
const isSameYear = (from: Date, to: Date) => dayjs(from).isSame(to, "year");
const isSameMonth = (from: Date, to: Date) => dayjs(from).isSame(to, "month");
const isSameDay = (from: Date, to: Date) => dayjs(from).isSame(to, "day");
const isSameMinute = (from: Date, to: Date) => dayjs(from).isSame(to, "minute");

const startOfYear = (from: Date) => dayjs(from).startOf("year").toDate();
const startOfQuarter = (from: Date) => dayjs(from).startOf("quarter").toDate();
const startOfMonth = (from: Date) => dayjs(from).startOf("month").toDate();
const startOfDay = (from: Date) => dayjs(from).startOf("day").toDate();

const endOfYear = (from: Date) => dayjs(from).endOf("year").toDate();
const endOfQuarter = (from: Date) => dayjs(from).endOf("quarter").toDate();
const endOfMonth = (from: Date) => dayjs(from).endOf("month").toDate();
const endOfDay = (from: Date) => dayjs(from).endOf("day").toDate();

const format = (to: Date, format: string) => dayjs(to).format(format);
const getQuarter = (from: Date) => dayjs(from).quarter();

/** ############################### ORIGINAL CODE ############################### */
/**
 * Original code is kept most as it is. Only thing changed is different formatting
 * strings used between date-fns and dayjs.
 *
 * E.g. - date-fns Month format code is "LLL", where as in dayjs it is "MMM";
 * Year format is "yyyy" in date-fns, "YYYY" for dayjs etc.
 */

const shortenAmPm = (text: string): string => {
  const shortened = (text || "").replace(/ AM/g, "am").replace(/ PM/g, "pm");
  const withoutDoubleZero = shortened.includes("m")
    ? shortened.replace(/:00/g, "")
    : shortened;
  return withoutDoubleZero;
};

const removeLeadingZero = (text: string): string => text.replace(/^0/, "");

export const formatTime = (date: Date, locale?: string): string => {
  return removeLeadingZero(
    shortenAmPm(
      date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }) || ""
    )
  );
};

const createFormatTime =
  (locale?: string) =>
  (date: Date): string =>
    formatTime(date, locale);

const getNavigatorLanguage = (): string => {
  if (typeof window === "undefined") {
    return "en-US";
  }
  return window.navigator.language;
};

export interface DateRangeFormatOptions {
  today?: Date;
  locale?: string;
  includeTime?: boolean;
  separator?: string;
}

export const formatDateRange = (
  from: Date,
  to: Date,
  {
    today = new Date(),
    locale = getNavigatorLanguage(),
    includeTime = true,
    separator = "-",
  }: DateRangeFormatOptions = {}
): string => {
  const sameYear = isSameYear(from, to);
  const sameMonth = isSameMonth(from, to);
  const sameDay = isSameDay(from, to);
  const thisYear = isSameYear(from, today);
  const thisDay = isSameDay(from, today);

  const yearSuffix = thisYear ? "" : `, ${format(to, "YYYY")}`;

  const formatTime = createFormatTime(locale);

  const startTimeSuffix =
    includeTime && !isSameMinute(startOfDay(from), from)
      ? `, ${formatTime(from)}`
      : "";

  const endTimeSuffix =
    includeTime && !isSameMinute(endOfDay(to), to) ? `, ${formatTime(to)}` : "";

  // Check if the range is the entire year
  // Example: 2023
  if (
    isSameMinute(startOfYear(from), from) &&
    isSameMinute(endOfYear(to), to)
  ) {
    return `${format(from, "YYYY")}`;
  }

  // Check if the range is an entire quarter
  // Example: Q1 2023
  if (
    isSameMinute(startOfQuarter(from), from) &&
    isSameMinute(endOfQuarter(to), to) &&
    getQuarter(from) === getQuarter(to)
  ) {
    return `Q${getQuarter(from)} ${format(from, "YYYY")}`;
  }

  // Check if the range is across entire month
  if (
    isSameMinute(startOfMonth(from), from) &&
    isSameMinute(endOfMonth(to), to)
  ) {
    if (sameMonth && sameYear) {
      // Example: January 2023
      return `${format(from, "MMMM YYYY")}`;
    }
    // Example: Jan - Feb 2023
    return `${format(from, "MMM")} ${separator} ${format(to, "MMM YYYY")}`;
  }

  // Range across years
  // Example: Jan 1 '23 - Feb 12 '24
  if (!sameYear) {
    return `${format(
      from,
      "MMM D 'YY"
    )}${startTimeSuffix} ${separator} ${format(
      to,
      "MMM D 'YY"
    )}${endTimeSuffix}`;
  }

  // Range across months
  // Example: Jan 1 - Feb 12[, 2023]
  if (!sameMonth) {
    return `${format(from, "MMM D")}${startTimeSuffix} ${separator} ${format(
      to,
      "MMM D"
    )}${endTimeSuffix}${yearSuffix}`;
  }

  // Range across days
  if (!sameDay) {
    // Check for a time suffix, if so print the month twice
    // Example: Jan 1, 12:00pm - Jan 2, 1:00pm[, 2023]
    if (startTimeSuffix || endTimeSuffix) {
      return `${format(from, "MMM D")}${startTimeSuffix} ${separator} ${format(
        to,
        "MMM D"
      )}${endTimeSuffix}${yearSuffix}`;
    }

    // Example: Jan 1 - 12[, 2023]
    return `${format(from, "MMM D")} ${separator} ${format(
      to,
      "D"
    )}${yearSuffix}`;
  }

  // Same day, different times
  // Example: Jan 1, 12pm - 1pm[, 2023]
  if (startTimeSuffix || endTimeSuffix) {
    // If it's today, don't include the date
    // Example: 12:30pm - 1pm
    if (thisDay) {
      return `${formatTime(from)} ${separator} ${formatTime(to)}`;
    }

    // Example: Jan 1, 12pm - 1pm[, 2023]
    return `${format(
      from,
      "MMM D"
    )}${startTimeSuffix} ${separator} ${formatTime(to)}${yearSuffix}`;
  }

  // Full day
  // Example: Fri, Jan 1[, 2023]
  return `${format(from, "ddd, MMM D")}${yearSuffix}`;
};
