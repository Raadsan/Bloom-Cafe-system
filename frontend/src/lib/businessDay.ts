/** Cafe clock is East Africa Time (UTC+3). 1:00 AM starts the next business day. */
const BUSINESS_TZ_OFFSET_MINUTES = -180;
const DAY_CUTOFF_MINUTES = 60;

export function businessDateKey(instant = new Date()): string {
  const local = new Date(instant.getTime() - BUSINESS_TZ_OFFSET_MINUTES * 60 * 1000);
  let year = local.getUTCFullYear();
  let month = local.getUTCMonth();
  let day = local.getUTCDate();
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  if (minutes < DAY_CUTOFF_MINUTES) {
    const previous = new Date(Date.UTC(year, month, day - 1));
    year = previous.getUTCFullYear();
    month = previous.getUTCMonth();
    day = previous.getUTCDate();
  }
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addBusinessDays(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Local noon of a business-date key, for calendar math in presets. */
export function dateFromBusinessKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatLocalKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
