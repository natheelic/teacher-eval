/**
 * Date formatting for server-rendered output.
 *
 * The original shell hardcoded strings like "2 minutes ago". Computing those
 * from `new Date()` in a component that renders on both the server and the
 * client produces a hydration mismatch, so anything rendered during SSR uses
 * an absolute, timezone-stable format. Relative time is only ever produced by
 * a client component after mount.
 */

const ABSOLUTE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const ABSOLUTE_WITH_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return ABSOLUTE.format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return `${ABSOLUTE_WITH_TIME.format(date)} UTC`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Client-only: safe to call after mount, never during SSR.
 */
export function relativeTime(value: Date | string, now: Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);

  if (abs < 60 * 1000) return "just now";

  for (const [unit, ms] of UNITS) {
    if (abs >= ms) {
      return RELATIVE.format(Math.round(diff / ms), unit);
    }
  }
  return "just now";
}

/** ISO string for passing dates across the server/client boundary. */
export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
