/** True when running under Vitest — skip background prefetch/warmup work. */
export function isVitestEnv(): boolean {
  return (
    import.meta.env.VITEST === true ||
    import.meta.env.MODE === 'test' ||
    (typeof process !== 'undefined' && process.env.VITEST === 'true')
  );
}
