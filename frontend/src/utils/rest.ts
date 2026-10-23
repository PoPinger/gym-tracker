// Rest between sets, per plan exercise (seconds); null on the server = DEFAULT_REST
export const DEFAULT_REST = 120;
export const REST_MIN = 30;
export const REST_MAX = 300;
export const REST_STEP = 15;

export const clampRest = (s: number) => Math.min(REST_MAX, Math.max(REST_MIN, s));

// 120 -> "2:00", 95 -> "1:35"
export const formatRest = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
