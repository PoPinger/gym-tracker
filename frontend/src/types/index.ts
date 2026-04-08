export interface User {
  id: number;
  email: string;
  display_name?: string;
  created_at: string;
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
  exercise_order: number;
}

export interface PlanDay {
  id: number;
  day_name: string;
  day_order: number;
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
}

export interface SetLog {
  id: number;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
}

export interface ExerciseLog {
  id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  sets: number;
  set_logs: SetLog[];
}

export interface DayLog {
  id: number;
  training_week_id: number;
  plan_day_id: number;
  status: string;
  completed_at: string | null;
  exercise_logs: ExerciseLog[];
  prev_week_data?: Record<number, Array<{ set_number: number; reps: number | null; weight_kg: number | null }>>;
  week1_data?: Record<number, Array<{ set_number: number; reps: number | null; weight_kg: number | null }>>;
  week_number?: number;
  plan_name?: string;
}

export interface WeekDay {
  plan_day_id: number;
  day_name: string;
  day_order: number;
  log_id: number | null;
  status: string;
}

export interface WeekInfo {
  week_id: number;
  week_number: number;
  plan_id: number;
  plan_name: string;
  status: string;
  days: WeekDay[];
}

export interface WeekSummary {
  id: number;
  week_number: number;
  status: string;
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
  start_weight: number;
  months: number;
  status: string;
  created_at: string;
  weeks: WeightWeek[];
}

export interface DashboardData {
  current_plan: {
    id: number;
    name: string;
    current_week: number;
    total_weeks: number;
    next_day: string | null;
  } | null;
  plan_progress: {
    percentage: number;
    completed_weeks: number;
    total_weeks: number;
  } | null;
  last_workout: {
    id: number;
    date: string | null;
    plan_name: string;
    day_name: string;
    exercise_count: number;
  } | null;
  quick_stats: {
    this_week: number;
    this_month: number;
    total: number;
  };
  weight_panel: {
    last_weight: number | null;
    avg_last_week: number | null;
    change_vs_prev_week: number | null;
  } | null;
  next_workout: {
    day_name: string | null;
    plan_name: string;
    preview_exercises: Array<{ name: string; muscle_group: string; sets: number }>;
  } | null;
  recent_workouts: Array<{
    id: number;
    date: string | null;
    day_name: string;
    plan_name: string;
  }>;
  best_progress: {
    exercise: string;
    gain_kg: number;
    current_weight: number;
  } | null;
  streak: number;
}

export const MUSCLE_GROUPS = [
  'Klatka piersiowa', 'Plecy', 'Barki', 'Biceps', 'Triceps',
  'Brzuch', 'Czworogłowy', 'Dwugłowy', 'Pośladki', 'Łydki'
];

export const DAY_NAMES = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
