export type Lang = 'pl' | 'en';

export interface TranslationMap {
  // Language selector
  lang_polish: string;
  lang_english: string;

  // Navigation
  nav_panel: string;
  nav_create_plan: string;
  nav_my_plans: string;
  nav_my_weight: string;
  nav_user_fallback: string;
  nav_logout: string;

  // Login
  login_tagline: string;
  login_heading: string;
  login_sub: string;
  login_error_default: string;
  login_email_label: string;
  login_email_placeholder: string;
  login_password_label: string;
  login_password_placeholder: string;
  login_loading: string;
  login_submit: string;
  login_no_account: string;
  login_create_account: string;

  // Register
  register_tagline: string;
  register_heading: string;
  register_sub: string;
  register_error_default: string;
  register_name_label: string;
  register_optional: string;
  register_name_placeholder: string;
  register_email_placeholder: string;
  register_password_placeholder: string;
  register_loading: string;
  register_submit: string;
  register_has_account: string;
  register_login: string;

  // Dashboard – loading / header
  loading_dashboard: string;
  dashboard_title: string;
  dashboard_subtitle: string;
  dashboard_create_plan: string;
  dashboard_welcome_title: string;
  dashboard_welcome_body: string;
  dashboard_create_first_plan: string;

  // Dashboard – stat cards
  stat_this_week: string;
  stat_this_month: string;
  stat_total: string;
  stat_streak: string;
  workouts_1: string;
  workouts_2_4: string;
  workouts_5plus: string;
  days_streak_1: string;
  days_streak_other: string;

  // Dashboard – plan card
  current_plan_label: string;
  badge_active: string;
  week_label: string;
  next_day_label: string;
  open_plan: string;

  // Dashboard – plan progress
  plan_progress_label: string;
  weeks_completed: string;
  of_preposition: string;

  // Dashboard – last / next workout
  last_workout_label: string;
  exercises_count: string;
  no_workouts: string;
  next_workout_label: string;
  all_caught_up: string;
  create_plan_to_start: string;
  start_workout: string;

  // Dashboard – weight panel
  weight_label: string;
  last_entry: string;
  vs_prev_week: string;
  avg_prev_week: string;
  weight_details: string;
  no_weight_data: string;
  configure_tracking: string;

  // Dashboard – best progress
  best_progress_label: string;
  currently: string;
  weight_gain: string;
  complete_workouts_for_records: string;

  // Dashboard – recent workouts
  recent_workouts_label: string;
  all_plans: string;

  // Create Plan – step indicator
  step_days_per_week: string;
  step_duration: string;
  step_day_names: string;
  step_exercises: string;

  // Create Plan – step 1
  create_plan_title: string;
  create_plan_subtitle: string;
  step1_heading: string;
  step1_body: string;
  training_day_singular: string;
  training_days_plural: string;
  next_btn: string;

  // Create Plan – step 2
  step2_heading: string;
  step2_body: string;
  months_abbr: string;
  weeks_abbr: string;
  training_sessions: string;
  back_btn: string;

  // Create Plan – step 3
  step3_heading: string;
  step3_body: string;
  plan_name_label: string;
  plan_name_placeholder: string;
  training_days_section: string;
  day_name_placeholder: string;
  exercise_singular: string;
  exercises_plural: string;
  add_exercises_btn: string;
  save_plan_error: string;
  saving: string;
  save_plan_btn: string;

  // Create Plan – step 4
  back_to_days: string;
  step4_body: string;
  no_exercises_empty: string;
  exercise_name_placeholder: string;
  sets_label: string;
  add_exercise_btn: string;

  // Create Plan – default day names
  default_day_push: string;
  default_day_pull: string;
  default_day_legs: string;
  default_day_upper: string;
  default_day_lower: string;
  default_day_full: string;
  default_day_cardio: string;
  day_number_fallback: string;

  // My Plans – list
  loading_plans: string;
  my_plans_title: string;
  plans_count_1: string;
  plans_count_other: string;
  plans_total_suffix: string;
  new_plan_btn: string;
  no_plans_title: string;
  no_plans_body: string;
  create_plan_btn: string;
  days_per_week_abbr: string;
  copy_btn: string;
  edit_btn: string;
  delete_btn: string;
  open_btn: string;
  badge_completed: string;

  // My Plans – delete confirm
  delete_plan_title: string;
  delete_plan_body: string;
  delete_plan_confirm: string;

  // My Plans – edit plan
  edit_plan_title: string;
  back_to_my_plans: string;
  save_changes_btn: string;
  cancel_btn: string;
  save_changes_error: string;

  // My Plans – edit exercises
  edit_exercises_subtitle: string;
  exercise_name_edit_placeholder: string;
  done_label: string;

  // My Plans – weeks view
  all_weeks: string;
  finish_plan_btn: string;
  finish_plan_title: string;
  finish_plan_body: string;
  week_tile_label: string;
  week_abbr: string;

  // My Plans – days view
  finish_week_btn: string;
  finish_week_question: string;
  finish_week_body: string;
  tap_to_train: string;

  // My Plans – workout logger
  sets_header: string;
  reps_header: string;
  reps_placeholder: string;
  weight_field_label: string;
  sets_unit: string;
  prev_week_abbr: string;
  week1_abbr: string;
  save_sets_btn: string;
  save_sets_saving: string;
  save_sets_saved: string;
  finish_day_btn: string;
  finish_day_title: string;
  finish_day_body: string;
  confirm_btn: string;
  training_fallback: string;

  // My Weight – setup
  loading_weight: string;
  my_weight_title: string;
  my_weight_subtitle: string;
  setup_weight_title: string;
  setup_weight_subtitle: string;
  setup_error_invalid: string;
  setup_error_default: string;
  start_weight_label: string;
  start_weight_placeholder: string;
  duration_label: string;
  month_singular: string;
  months_plural: string;
  weeks_label: string;
  configuring: string;
  start_tracking_btn: string;

  // My Weight – weeks view
  started_from: string;
  reset_btn: string;
  all_weeks_complete_msg: string;

  // My Weight – week detail
  all_weeks_back: string;
  week_avg_label: string;
  vs_prev_week_label: string;
  vs_week1_label: string;
  daily_readings_label: string;
  no_change: string;
  reset_weight_title: string;
  reset_weight_body: string;

  // Muscle groups (display labels; DB values remain Polish)
  muscle_chest: string;
  muscle_back: string;
  muscle_shoulders: string;
  muscle_biceps: string;
  muscle_triceps: string;
  muscle_abs: string;
  muscle_quads: string;
  muscle_hamstrings: string;
  muscle_glutes: string;
  muscle_calves: string;

  // Short day names (used in weight tracker)
  day_mon: string;
  day_tue: string;
  day_wed: string;
  day_thu: string;
  day_fri: string;
  day_sat: string;
  day_sun: string;
}

const pl: TranslationMap = {
  lang_polish: '🇵🇱 Polski',
  lang_english: '🇬🇧 English',

  nav_panel: 'Panel',
  nav_create_plan: 'Utwórz plan',
  nav_my_plans: 'Moje plany',
  nav_my_weight: 'Moja waga',
  nav_user_fallback: 'Użytkownik',
  nav_logout: 'Wyloguj',

  login_tagline: 'Śledź postępy, osiągaj cele',
  login_heading: 'Witaj ponownie',
  login_sub: 'Zaloguj się, by kontynuować',
  login_error_default: 'Nieprawidłowy e-mail lub hasło',
  login_email_label: 'Adres e-mail',
  login_email_placeholder: 'ty@przykład.pl',
  login_password_label: 'Hasło',
  login_password_placeholder: '••••••••',
  login_loading: 'Logowanie…',
  login_submit: 'Zaloguj się',
  login_no_account: 'Nie masz konta?',
  login_create_account: 'Utwórz konto',

  register_tagline: 'Twoja przygoda z fitnesem zaczyna się tutaj',
  register_heading: 'Utwórz konto',
  register_sub: 'Zawsze za darmo. Bez karty kredytowej.',
  register_error_default: 'Rejestracja nieudana',
  register_name_label: 'Nazwa wyświetlana',
  register_optional: '(opcjonalnie)',
  register_name_placeholder: 'Twoje imię',
  register_email_placeholder: 'ty@przykład.pl',
  register_password_placeholder: 'Min. 6 znaków',
  register_loading: 'Tworzenie konta…',
  register_submit: 'Rozpocznij',
  register_has_account: 'Masz już konto?',
  register_login: 'Zaloguj się',

  loading_dashboard: 'Ładowanie panelu…',
  dashboard_title: 'Panel',
  dashboard_subtitle: 'Oto co dzieje się z Twoim treningiem',
  dashboard_create_plan: 'Utwórz plan',
  dashboard_welcome_title: 'Witaj w GymTracker!',
  dashboard_welcome_body: 'Utwórz pierwszy plan treningowy i zacznij logować treningi, aby zobaczyć postępy.',
  dashboard_create_first_plan: 'Utwórz pierwszy plan',

  stat_this_week: 'W tym tygodniu',
  stat_this_month: 'W tym miesiącu',
  stat_total: 'Łącznie',
  stat_streak: 'Seria',
  workouts_1: 'trening',
  workouts_2_4: 'treningi',
  workouts_5plus: 'treningów',
  days_streak_1: 'dzień z rzędu',
  days_streak_other: 'dni z rzędu',

  current_plan_label: 'Aktualny plan',
  badge_active: 'Aktywny',
  week_label: 'Tydzień',
  next_day_label: 'Następny',
  open_plan: 'Otwórz plan',

  plan_progress_label: 'Postęp planu',
  weeks_completed: 'tygodni ukończonych',
  of_preposition: 'z',

  last_workout_label: 'Ostatni trening',
  exercises_count: 'ćwiczeń',
  no_workouts: 'Brak treningów',
  next_workout_label: 'Następny trening',
  all_caught_up: '🎉 Wszystko na bieżąco w tym tygodniu!',
  create_plan_to_start: 'Utwórz plan, aby zacząć',
  start_workout: 'Zacznij trening',

  weight_label: 'Waga',
  last_entry: 'Ostatni wpis',
  vs_prev_week: 'vs poprz. tydz.',
  avg_prev_week: 'Śr. poprz. tydz.',
  weight_details: 'Szczegóły',
  no_weight_data: 'Brak danych wagowych',
  configure_tracking: 'Skonfiguruj śledzenie',

  best_progress_label: 'Najlepszy postęp',
  currently: 'Obecnie',
  weight_gain: 'przyrost wagi',
  complete_workouts_for_records: 'Ukończ treningi z ciężarami, aby zobaczyć swoje rekordy',

  recent_workouts_label: 'Ostatnie treningi',
  all_plans: 'Wszystkie plany',

  step_days_per_week: 'Dni/tydz.',
  step_duration: 'Czas',
  step_day_names: 'Nazwy dni',
  step_exercises: 'Ćwiczenia',

  create_plan_title: 'Utwórz plan treningowy',
  create_plan_subtitle: 'Zbuduj swój spersonalizowany harmonogram treningów',
  step1_heading: 'Ile dni w tygodniu?',
  step1_body: 'Wybierz, jak często chcesz trenować każdego tygodnia.',
  training_day_singular: 'dzień treningowy',
  training_days_plural: 'dni treningowych',
  next_btn: 'Dalej',

  step2_heading: 'Na ile miesięcy?',
  step2_body: 'Określa łączny czas trwania planu.',
  months_abbr: 'mies.',
  weeks_abbr: 'tyg.',
  training_sessions: 'sesji treningowych',
  back_btn: 'Wstecz',

  step3_heading: 'Skonfiguruj swój plan',
  step3_body: 'Nadaj nazwę planowi i każdemu dniu, następnie kliknij dzień, aby dodać ćwiczenia.',
  plan_name_label: 'Nazwa planu',
  plan_name_placeholder: 'np. GBP 3-dniowy split',
  training_days_section: 'Dni treningowe',
  day_name_placeholder: 'Nazwa dnia',
  exercise_singular: 'ćwiczenie',
  exercises_plural: 'ćwiczeń',
  add_exercises_btn: 'Dodaj ćwiczenia',
  save_plan_error: 'Nie udało się zapisać planu',
  saving: 'Zapisywanie…',
  save_plan_btn: 'Zapisz plan',

  back_to_days: 'Wróć do dni',
  step4_body: 'Dodaj ćwiczenia do tego dnia treningowego',
  no_exercises_empty: 'Brak ćwiczeń — dodaj pierwsze poniżej',
  exercise_name_placeholder: 'Nazwa ćwiczenia (np. Wyciskanie)',
  sets_label: 'Serie:',
  add_exercise_btn: 'Dodaj ćwiczenie',

  default_day_push: 'Pchanie',
  default_day_pull: 'Ciąganie',
  default_day_legs: 'Nogi',
  default_day_upper: 'Górna część',
  default_day_lower: 'Dolna część',
  default_day_full: 'Całe ciało',
  default_day_cardio: 'Kardio',
  day_number_fallback: 'Dzień',

  loading_plans: 'Ładowanie planów…',
  my_plans_title: 'Moje plany',
  plans_count_1: 'plan',
  plans_count_other: 'planów',
  plans_total_suffix: 'łącznie',
  new_plan_btn: 'Nowy plan',
  no_plans_title: 'Brak planów',
  no_plans_body: 'Utwórz pierwszy plan treningowy i zacznij śledzić treningi',
  create_plan_btn: 'Utwórz plan',
  days_per_week_abbr: 'dni/tydz.',
  copy_btn: 'Kopiuj',
  edit_btn: 'Edytuj',
  delete_btn: 'Usuń',
  open_btn: 'Otwórz',
  badge_completed: 'Ukończony',

  delete_plan_title: 'Usunąć plan?',
  delete_plan_body: 'Czy na pewno chcesz usunąć ten plan? Tej operacji nie można cofnąć.',
  delete_plan_confirm: 'Usuń plan',

  edit_plan_title: 'Edytuj plan',
  back_to_my_plans: 'Moje plany',
  save_changes_btn: 'Zapisz zmiany',
  cancel_btn: 'Anuluj',
  save_changes_error: 'Nie udało się zapisać zmian',

  edit_exercises_subtitle: 'Edytuj ćwiczenia dnia treningowego',
  exercise_name_edit_placeholder: 'Nazwa ćwiczenia',
  done_label: 'Gotowe',

  all_weeks: 'Wszystkie tygodnie',
  finish_plan_btn: 'Zakończ plan',
  finish_plan_title: 'Zakończyć plan?',
  finish_plan_body: 'Oznacz plan jako ukończony. Wszystkie dane pozostają zapisane i można je edytować.',
  week_tile_label: 'Tydzień',
  week_abbr: 'T',

  finish_week_btn: 'Zakończ tydzień',
  finish_week_question: 'Zakończyć tydzień',
  finish_week_body: 'Oznacz tydzień jako ukończony. Możesz edytować dane później.',
  tap_to_train: 'Dotknij, aby trenować',

  sets_header: 'Seria',
  reps_header: 'Powt.',
  reps_placeholder: 'powt.',
  weight_field_label: 'Ciężar:',
  sets_unit: 'serii',
  prev_week_abbr: 'poprz.',
  week1_abbr: 'tydz.1',
  save_sets_btn: 'Zapisz',
  save_sets_saving: 'Zapisywanie…',
  save_sets_saved: 'Zapisano',
  finish_day_btn: 'Zakończ dzień',
  finish_day_title: 'Zakończyć trening?',
  finish_day_body: 'Oznacz dzień jako ukończony. Możesz edytować wpisy później.',
  confirm_btn: 'Potwierdź',
  training_fallback: 'Trening',

  loading_weight: 'Ładowanie danych wagowych…',
  my_weight_title: 'Moja waga',
  my_weight_subtitle: 'Śledź postępy wagowe w czasie',
  setup_weight_title: 'Skonfiguruj śledzenie wagi',
  setup_weight_subtitle: 'Loguj wagę codziennie, aby monitorować trendy',
  setup_error_invalid: 'Podaj prawidłową wagę',
  setup_error_default: 'Nie udało się utworzyć cyklu',
  start_weight_label: 'Waga startowa (kg)',
  start_weight_placeholder: 'np. 75.5',
  duration_label: 'Czas trwania —',
  month_singular: 'miesiąc',
  months_plural: 'miesięcy',
  weeks_label: 'tygodni',
  configuring: 'Konfigurowanie…',
  start_tracking_btn: 'Rozpocznij śledzenie',

  started_from: 'Rozpoczęto od',
  reset_btn: 'Zresetuj',
  all_weeks_complete_msg: 'Wszystkie tygodnie ukończone! Zakończyłeś cykl śledzenia wagi.',

  all_weeks_back: 'Wszystkie tygodnie',
  week_avg_label: 'Średnia tygodnia',
  vs_prev_week_label: 'vs poprz. tydz.',
  vs_week1_label: 'vs Tydzień 1',
  daily_readings_label: 'Dzienne odczyty',
  no_change: '— bez zmian',
  reset_weight_title: 'Zresetować śledzenie wagi?',
  reset_weight_body: 'Wszystkie dane wagowe zostaną trwale usunięte. Tej operacji nie można cofnąć.',

  muscle_chest: 'Klatka piersiowa',
  muscle_back: 'Plecy',
  muscle_shoulders: 'Barki',
  muscle_biceps: 'Biceps',
  muscle_triceps: 'Triceps',
  muscle_abs: 'Brzuch',
  muscle_quads: 'Czworogłowy',
  muscle_hamstrings: 'Dwugłowy',
  muscle_glutes: 'Pośladki',
  muscle_calves: 'Łydki',

  day_mon: 'Pon',
  day_tue: 'Wt',
  day_wed: 'Śr',
  day_thu: 'Czw',
  day_fri: 'Pt',
  day_sat: 'Sob',
  day_sun: 'Nd',
};

const en: TranslationMap = {
  lang_polish: '🇵🇱 Polski',
  lang_english: '🇬🇧 English',

  nav_panel: 'Dashboard',
  nav_create_plan: 'Create Plan',
  nav_my_plans: 'My Plans',
  nav_my_weight: 'My Weight',
  nav_user_fallback: 'User',
  nav_logout: 'Logout',

  login_tagline: 'Track progress, achieve goals',
  login_heading: 'Welcome back',
  login_sub: 'Sign in to continue',
  login_error_default: 'Invalid email or password',
  login_email_label: 'Email address',
  login_email_placeholder: 'you@example.com',
  login_password_label: 'Password',
  login_password_placeholder: '••••••••',
  login_loading: 'Signing in…',
  login_submit: 'Sign in',
  login_no_account: "Don't have an account?",
  login_create_account: 'Create account',

  register_tagline: 'Your fitness journey starts here',
  register_heading: 'Create account',
  register_sub: 'Always free. No credit card required.',
  register_error_default: 'Registration failed',
  register_name_label: 'Display name',
  register_optional: '(optional)',
  register_name_placeholder: 'Your name',
  register_email_placeholder: 'you@example.com',
  register_password_placeholder: 'Min. 6 characters',
  register_loading: 'Creating account…',
  register_submit: 'Get started',
  register_has_account: 'Already have an account?',
  register_login: 'Sign in',

  loading_dashboard: 'Loading dashboard…',
  dashboard_title: 'Dashboard',
  dashboard_subtitle: "Here's what's happening with your training",
  dashboard_create_plan: 'Create Plan',
  dashboard_welcome_title: 'Welcome to GymTracker!',
  dashboard_welcome_body: 'Create your first training plan and start logging workouts to see your progress.',
  dashboard_create_first_plan: 'Create first plan',

  stat_this_week: 'This week',
  stat_this_month: 'This month',
  stat_total: 'Total',
  stat_streak: 'Streak',
  workouts_1: 'workout',
  workouts_2_4: 'workouts',
  workouts_5plus: 'workouts',
  days_streak_1: 'day in a row',
  days_streak_other: 'days in a row',

  current_plan_label: 'Current plan',
  badge_active: 'Active',
  week_label: 'Week',
  next_day_label: 'Next',
  open_plan: 'Open plan',

  plan_progress_label: 'Plan progress',
  weeks_completed: 'weeks completed',
  of_preposition: 'of',

  last_workout_label: 'Last workout',
  exercises_count: 'exercises',
  no_workouts: 'No workouts yet',
  next_workout_label: 'Next workout',
  all_caught_up: '🎉 All caught up this week!',
  create_plan_to_start: 'Create a plan to get started',
  start_workout: 'Start workout',

  weight_label: 'Weight',
  last_entry: 'Last entry',
  vs_prev_week: 'vs prev. week',
  avg_prev_week: 'Avg. prev. week',
  weight_details: 'Details',
  no_weight_data: 'No weight data',
  configure_tracking: 'Set up tracking',

  best_progress_label: 'Best progress',
  currently: 'Currently',
  weight_gain: 'weight gain',
  complete_workouts_for_records: 'Complete workouts with weights to see your records',

  recent_workouts_label: 'Recent workouts',
  all_plans: 'All plans',

  step_days_per_week: 'Days/week',
  step_duration: 'Duration',
  step_day_names: 'Day names',
  step_exercises: 'Exercises',

  create_plan_title: 'Create training plan',
  create_plan_subtitle: 'Build your personalized training schedule',
  step1_heading: 'How many days per week?',
  step1_body: 'Choose how often you want to train each week.',
  training_day_singular: 'training day',
  training_days_plural: 'training days',
  next_btn: 'Next',

  step2_heading: 'For how many months?',
  step2_body: 'Determines the total duration of the plan.',
  months_abbr: 'mo.',
  weeks_abbr: 'wks.',
  training_sessions: 'training sessions',
  back_btn: 'Back',

  step3_heading: 'Configure your plan',
  step3_body: 'Name the plan and each day, then click a day to add exercises.',
  plan_name_label: 'Plan name',
  plan_name_placeholder: 'e.g. PPL 3-day split',
  training_days_section: 'Training days',
  day_name_placeholder: 'Day name',
  exercise_singular: 'exercise',
  exercises_plural: 'exercises',
  add_exercises_btn: 'Add exercises',
  save_plan_error: 'Failed to save plan',
  saving: 'Saving…',
  save_plan_btn: 'Save plan',

  back_to_days: 'Back to days',
  step4_body: 'Add exercises to this training day',
  no_exercises_empty: 'No exercises — add one below',
  exercise_name_placeholder: 'Exercise name (e.g. Bench Press)',
  sets_label: 'Sets:',
  add_exercise_btn: 'Add exercise',

  default_day_push: 'Push',
  default_day_pull: 'Pull',
  default_day_legs: 'Legs',
  default_day_upper: 'Upper body',
  default_day_lower: 'Lower body',
  default_day_full: 'Full body',
  default_day_cardio: 'Cardio',
  day_number_fallback: 'Day',

  loading_plans: 'Loading plans…',
  my_plans_title: 'My Plans',
  plans_count_1: 'plan',
  plans_count_other: 'plans',
  plans_total_suffix: 'total',
  new_plan_btn: 'New plan',
  no_plans_title: 'No plans',
  no_plans_body: 'Create your first training plan and start tracking workouts',
  create_plan_btn: 'Create plan',
  days_per_week_abbr: 'days/wk.',
  copy_btn: 'Copy',
  edit_btn: 'Edit',
  delete_btn: 'Delete',
  open_btn: 'Open',
  badge_completed: 'Completed',

  delete_plan_title: 'Delete plan?',
  delete_plan_body: 'Are you sure you want to delete this plan? This action cannot be undone.',
  delete_plan_confirm: 'Delete plan',

  edit_plan_title: 'Edit plan',
  back_to_my_plans: 'My Plans',
  save_changes_btn: 'Save changes',
  cancel_btn: 'Cancel',
  save_changes_error: 'Failed to save changes',

  edit_exercises_subtitle: 'Edit training day exercises',
  exercise_name_edit_placeholder: 'Exercise name',
  done_label: 'Done',

  all_weeks: 'All weeks',
  finish_plan_btn: 'Finish plan',
  finish_plan_title: 'Finish plan?',
  finish_plan_body: 'Mark plan as completed. All data remains saved and can be edited.',
  week_tile_label: 'Week',
  week_abbr: 'W',

  finish_week_btn: 'Finish week',
  finish_week_question: 'Finish week',
  finish_week_body: 'Mark week as completed. You can edit data later.',
  tap_to_train: 'Tap to train',

  sets_header: 'Set',
  reps_header: 'Reps',
  reps_placeholder: 'reps',
  weight_field_label: 'Weight:',
  sets_unit: 'sets',
  prev_week_abbr: 'prev.',
  week1_abbr: 'wk.1',
  save_sets_btn: 'Save',
  save_sets_saving: 'Saving…',
  save_sets_saved: 'Saved',
  finish_day_btn: 'Finish day',
  finish_day_title: 'Finish workout?',
  finish_day_body: 'Mark day as completed. You can edit entries later.',
  confirm_btn: 'Confirm',
  training_fallback: 'Training',

  loading_weight: 'Loading weight data…',
  my_weight_title: 'My Weight',
  my_weight_subtitle: 'Track your weight progress over time',
  setup_weight_title: 'Set up weight tracking',
  setup_weight_subtitle: 'Log weight daily to monitor trends',
  setup_error_invalid: 'Please enter a valid weight',
  setup_error_default: 'Failed to create cycle',
  start_weight_label: 'Starting weight (kg)',
  start_weight_placeholder: 'e.g. 75.5',
  duration_label: 'Duration —',
  month_singular: 'month',
  months_plural: 'months',
  weeks_label: 'weeks',
  configuring: 'Configuring…',
  start_tracking_btn: 'Start tracking',

  started_from: 'Started from',
  reset_btn: 'Reset',
  all_weeks_complete_msg: 'All weeks completed! You finished your weight tracking cycle.',

  all_weeks_back: 'All weeks',
  week_avg_label: 'Weekly average',
  vs_prev_week_label: 'vs prev. week',
  vs_week1_label: 'vs Week 1',
  daily_readings_label: 'Daily readings',
  no_change: '— no change',
  reset_weight_title: 'Reset weight tracking?',
  reset_weight_body: 'All weight data will be permanently deleted. This action cannot be undone.',

  muscle_chest: 'Chest',
  muscle_back: 'Back',
  muscle_shoulders: 'Shoulders',
  muscle_biceps: 'Biceps',
  muscle_triceps: 'Triceps',
  muscle_abs: 'Abs',
  muscle_quads: 'Quadriceps',
  muscle_hamstrings: 'Hamstrings',
  muscle_glutes: 'Glutes',
  muscle_calves: 'Calves',

  day_mon: 'Mon',
  day_tue: 'Tue',
  day_wed: 'Wed',
  day_thu: 'Thu',
  day_fri: 'Fri',
  day_sat: 'Sat',
  day_sun: 'Sun',
};

export const translations: Record<Lang, TranslationMap> = { pl, en };

/** Maps Polish DB muscle group value → translation key */
export const MUSCLE_GROUP_TO_KEY: Record<string, keyof TranslationMap> = {
  'Klatka piersiowa': 'muscle_chest',
  'Plecy':            'muscle_back',
  'Barki':            'muscle_shoulders',
  'Biceps':           'muscle_biceps',
  'Triceps':          'muscle_triceps',
  'Brzuch':           'muscle_abs',
  'Czworogłowy':      'muscle_quads',
  'Dwugłowy':         'muscle_hamstrings',
  'Pośladki':         'muscle_glutes',
  'Łydki':            'muscle_calves',
};
