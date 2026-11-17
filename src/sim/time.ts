/**
 * Local time, sun phases and the moon. Pure: every function takes the instant
 * (epoch ms) as an argument. The injectable Clock lives in platform/.
 */
import { getMoonIllumination, getTimes } from 'suncalc';
import type { Balance, Phase } from '../content/schema';
import { clamp } from './rng';

export interface LocalTime {
  year: number;
  /** 0 = January. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  minutesOfDay: number;
  /** "YYYY-MM-DD" in the local calendar. */
  dayKey: string;
}

export interface TimePlace {
  lat: number;
  lon: number;
  /** IANA zone, or "device". */
  tz: string;
  solarTz?: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
    });
    formatters.set(tz, f);
  }
  return f;
}

/** Wall-clock time in an IANA zone. */
export function localTime(epochMs: number, tz: string): LocalTime {
  const parts: Record<string, number> = {};
  for (const p of formatter(tz).formatToParts(new Date(epochMs))) if (p.type !== 'literal') parts[p.type] = Number(p.value);
  const hour = parts.hour % 24;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    year: parts.year, month: parts.month - 1, day: parts.day, hour, minute: parts.minute,
    minutesOfDay: hour * 60 + parts.minute,
    dayKey: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
  };
}

/** The zone whose wall clock the player sees at a place. */
export function displayTz(place: TimePlace, deviceTz: string): string {
  return place.tz === 'device' ? deviceTz : place.tz;
}

export interface SunInfo {
  phase: Phase;
  local: LocalTime;
  sunriseMin: number;
  sunsetMin: number;
  /**
   * Sun height proxy for rendering: 1 at full day, 0 on the horizon, -1 at deep
   * night, moving linearly through the dawn and dusk windows.
   */
  elevation: number;
  /** 0 at sunrise, 1 at sunset; outside 0..1 at night. Drives the sun's arc. */
  dayFrac: number;
}

/**
 * Sun phases at a place. Normal locations use their own zone. The island
 * ("device") reads the phone's wall clock against sunrise and sunset computed
 * for the island's real latitude, so the castaway's day matches the player's.
 */
export function sunInfo(epochMs: number, place: TimePlace, deviceTz: string, balance: Balance): SunInfo {
  const local = localTime(epochMs, displayTz(place, deviceTz));
  const solarTz = place.tz === 'device' ? place.solarTz ?? 'UTC' : place.tz;
  // Local solar noon of the displayed calendar day, as an instant.
  const noon = Date.UTC(local.year, local.month, local.day, 12) - (place.lon / 15) * 3600_000;
  const times = getTimes(new Date(noon), place.lat, place.lon);
  // Polar day or night: fall back to a plain 6-to-6 day rather than breaking the clock.
  const sunriseMin = times.sunrise ? localTime(times.sunrise.getTime(), solarTz).minutesOfDay : 6 * 60;
  const sunsetMin = times.sunset ? localTime(times.sunset.getTime(), solarTz).minutesOfDay : 18 * 60;
  const now = local.minutesOfDay;
  const p = balance.phases;
  let phase: Phase;
  if (now >= sunriseMin - p.dawnBeforeMin && now < sunriseMin + p.dawnAfterMin) phase = 'dawn';
  else if (now >= sunsetMin - p.duskBeforeMin && now < sunsetMin + p.duskAfterMin) phase = 'dusk';
  else if (now >= sunriseMin + p.dawnAfterMin && now < sunsetMin - p.duskBeforeMin) phase = 'day';
  else phase = 'night';

  const ramp = 80; // minutes from horizon to "full" day or night
  let elevation: number;
  if (now < sunriseMin) elevation = -clamp((sunriseMin - now) / ramp, 0, 1);
  else if (now > sunsetMin) elevation = -clamp((now - sunsetMin) / ramp, 0, 1);
  else elevation = clamp(Math.min(now - sunriseMin, sunsetMin - now) / ramp, 0, 1);
  const dayFrac = (now - sunriseMin) / Math.max(1, sunsetMin - sunriseMin);
  return { phase, local, sunriseMin, sunsetMin, elevation, dayFrac };
}

/** Moon phase 0..1 (0 new, 0.5 full). */
export function moonPhase(epochMs: number): number {
  return getMoonIllumination(new Date(epochMs)).phase;
}

/** Moon phase bucketed into eight named phases, 0 = new, 4 = full. */
export function moonIndex(epochMs: number): number {
  return Math.floor(moonPhase(epochMs) * 8 + 0.5) % 8;
}

export const MOON_NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatClock(t: LocalTime): string {
  const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
  return `${h}:${String(t.minute).padStart(2, '0')} ${t.hour < 12 ? 'am' : 'pm'}`;
}

/** "3 Jan" style date for journal entries. */
export function formatDate(epochMs: number, tz: string): string {
  const t = localTime(epochMs, tz);
  return `${t.day} ${MONTH_NAMES[t.month]}`;
}
