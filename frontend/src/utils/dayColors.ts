// Training day colour keys (must match DAY_COLORS in backend/app/schemas/schemas.py).
// Order here is the swatch order in the picker; styles live in index.css (.day-color-<key>).
export const DAY_COLORS = ['indigo', 'blue', 'sky', 'teal', 'green', 'lime', 'amber', 'orange', 'red', 'pink'] as const;
export type DayColor = typeof DAY_COLORS[number];

// Default for new days and days saved without a colour: well-separated neighbours
const DEFAULT_CYCLE: DayColor[] = ['indigo', 'green', 'amber', 'red', 'blue', 'teal', 'orange', 'pink', 'sky', 'lime'];

export const defaultDayColor = (index: number): DayColor => DEFAULT_CYCLE[index % DEFAULT_CYCLE.length];

export const resolveDayColor = (color: string | null | undefined, index: number): DayColor =>
  (DAY_COLORS as readonly string[]).includes(color ?? '') ? (color as DayColor) : defaultDayColor(index);
