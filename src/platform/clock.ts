/** All time flows through one Clock, so tests and the debug panel can move it. */
export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

export const deviceTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};
