// Local calendar date as YYYY-MM-DD (toISOString would shift to UTC)
export const toIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayIso = (): string => toIsoDate(new Date());
