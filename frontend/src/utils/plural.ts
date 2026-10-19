// Polish plural forms: 1 / 2–4, 22–24… (not 12–14) / everything else
export const plural = (n: number, one: string, few: string, many: string): string =>
  n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;
