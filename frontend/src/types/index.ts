export interface User {
  id: number;
  email: string;
  display_name?: string;
  created_at: string;
  is_admin?: boolean;
  mascot?: MascotKind;
}

export type MascotKind = 'kulka' | 'ariana';

export interface AdminUser {
  id: number;
  email: string;
  display_name?: string | null;
  created_at: string;
  last_active_at?: string | null;
  last_login_at?: string | null;
  mascot: MascotKind;
}

export interface ResetCode {
  code: string;
  expires_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  sets: number;
  rep_min?: number | null;
  rep_max?: number | null;
  rest_seconds?: number | null;
  note?: string | null;
  exercise_order: number;
}

export interface PlanDay {
  id: number;
  day_name: string;
  day_order: number;
  color?: string | null;
  exercises: Exercise[];
}

export interface Plan {
  id: number;
  name: string;
  days_per_week: number;
  months: number;
  status: string;
  created_at: string;
  days: PlanDay[];
}

export interface PlanSummary {
  id: number;
  name: string;
  days_per_week: number;
  months: number;
  status: string;
  created_at: string;
  completed_weeks: number;
  days: Array<{ day_name: string; color?: string | null }>;
}

export interface SetLog {
  id: number;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rir?: number | null;
}

export interface ExerciseLog {
  id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  sets: number;
  rep_min?: number | null;
  rep_max?: number | null;
  rest_seconds?: number | null;
  note?: string | null;
  skipped: boolean;
  set_logs: SetLog[];
}

export interface DayLog {
  id: number;
  training_week_id: number;
  plan_day_id: number;
  status: string;
  completed_at: string | null;
  workout_date: string | null;
  skipped: boolean;
  exercise_logs: ExerciseLog[];
  prev_week_data?: Record<number, Array<{ set_number: number; reps: number | null; weight_kg: number | null; rir?: number | null }>>;
  prev_week_skipped?: number[];
  week1_data?: Record<number, Array<{ set_number: number; reps: number | null; weight_kg: number | null; rir?: number | null }>>;
  prev_week_number?: number | null; // last earlier non-deload week
  week1_number?: number | null; // first non-deload week
  week_number?: number;
  is_deload?: boolean;
  plan_name?: string;
}

export interface WeekDay {
  plan_day_id: number;
  day_name: string;
  day_order: number;
  color?: string | null;
  log_id: number | null;
  status: string;
  skipped: boolean;
}

export interface WeekInfo {
  week_id: number;
  week_number: number;
  plan_id: number;
  plan_name: string;
  status: string;
  is_deload: boolean;
  days: WeekDay[];
}

export interface WeekSummary {
  id: number;
  week_number: number;
  status: string;
  is_deload: boolean;
}

export interface HistorySet { set_number: number; reps: number | null; weight_kg: number | null; rir: number | null }

export interface ExerciseHistoryEntry {
  exercise_log_id: number;
  plan_id: number;
  plan_name: string;
  week_number: number;
  is_deload: boolean;
  skipped: boolean;
  workout_date: string | null;
  sets: HistorySet[];
}

export interface ExerciseHistory {
  exercise_id: number;
  exercise_name: string;
  has_other_plans: boolean;
  notes: Array<{ plan_id: number; plan_name: string; note: string }>;
  entries: ExerciseHistoryEntry[]; // oldest first
}

export interface WeightDayLog {
  id: number;
  day_of_week: number;
  weight_kg: number | null;
  logged_at: string | null;
}

export interface WeightWeek {
  id: number;
  week_number: number;
  status: string;
  average_weight: number | null;
  day_logs: WeightDayLog[];
}

export interface WeightCycle {
  id: number;
  start_weight: number | null;
  months: number;
  status: string;
  goal: 'bulk' | 'cut' | null;
  created_at: string;
  weeks: WeightWeek[];
}

export interface CalendarWorkout {
  date: string;
  log_id: number;
  plan_id: number;
  week_id: number;
  plan_day_id: number;
  day_name: string;
}

export interface DashboardData {
  has_plan: boolean;
  quick_stats: {
    this_month: number;
    this_year: number;
  };
  // Total change since the cycle start = current week average − week 1 average
  weight_panel: {
    goal: 'bulk' | 'cut' | null;
    week1_avg: number | null;
    current_week_avg: number | null;
    change: number | null;
    weekly_avgs: number[];  // weeks with readings, in order (sparkline)
  } | null;
  workout_calendar: CalendarWorkout[];
  streak: number;
}

export const MUSCLE_GROUPS = [
  'Klatka piersiowa', 'Plecy', 'Barki', 'Biceps', 'Triceps', 'Przedramiona',
  'Brzuch', 'Czworogłowy', 'Dwugłowy', 'Pośladki', 'Przywodziciele', 'Łydki'
];

export const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
