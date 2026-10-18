// Rep range drafts are kept as strings so inputs can be empty.
export const isValidRepRange = (min: string, max: string): boolean => {
  if (min === '' && max === '') return true;
  const lo = Number(min), hi = Number(max);
  const ok = (n: number) => Number.isInteger(n) && n >= 1 && n <= 100;
  return min !== '' && max !== '' && ok(lo) && ok(hi) && lo <= hi;
};

export const repRangePayload = (min: string, max: string) =>
  min === '' || max === ''
    ? { rep_min: null, rep_max: null }
    : { rep_min: Number(min), rep_max: Number(max) };

export const formatRepRange = (min?: number | null, max?: number | null): string | null =>
  min != null && max != null ? (min === max ? `${min}` : `${min}–${max}`) : null;
