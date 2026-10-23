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

  // Password reset / admin
  nav_admin: string;
  nav_change_password: string;
  login_forgot_password: string;
  login_password_changed: string;
  pwd_min_hint: string;
  pwd_new_label: string;
  pwd_repeat_label: string;
  pwd_current_label: string;
  pwd_error_min: string;
  pwd_error_mismatch: string;
  pwd_error_current: string;
  pwd_error_generic: string;
  pwd_saving: string;
  pwd_save: string;
  pwd_cancel: string;
  pwd_change_success: string;
  pwd_close: string;
  reset_title: string;
  reset_info: string;
  reset_code_label: string;
  reset_next: string;
  reset_checking: string;
  reset_error_invalid: string;
  reset_error_limit: string;
  reset_error_session: string;
  reset_new_title: string;
  reset_new_sub: string;
  reset_back_to_login: string;
  admin_title: string;
  admin_sub: string;
  admin_no_access: string;
  admin_load_error: string;
  admin_users_count: string;
  admin_created: string;
  admin_no_name: string;
  admin_generate_code: string;
  admin_generating: string;
  admin_code_title: string;
  admin_code_for: string;
  admin_code_note: string;
  admin_code_valid_until: string;
  admin_copy: string;
  admin_copied: string;
  admin_generate_error: string;
  admin_mascot: string;
  admin_mascot_error: string;
  mascot_kulka: string;
  mascot_ariana: string;
  admin_last_active: string;
  admin_last_login: string;
  admin_never: string;
  rel_just_now: string;
  rel_minutes_ago: string;
  rel_hours_ago: string;
  rel_yesterday: string;

  // Dashboard – loading / header
  loading_app: string;
  mascot_label: string;
  mascot_label_ariana: string;
  dashboard_title: string;
  dashboard_subtitle: string;
  active_weeks_1: string;
  active_weeks_2_4: string;
  active_weeks_5plus: string;
  streak_goal: string;
  dashboard_welcome_title: string;
  dashboard_welcome_body: string;
  dashboard_create_first_plan: string;

  // Dashboard – stat cards
  stat_this_month: string;
  stat_this_year: string;
  stat_streak: string;
  workouts_1: string;
  workouts_2_4: string;
  workouts_5plus: string;
  weeks_streak_1: string;
  weeks_streak_2_4: string;
  weeks_streak_5plus: string;

  // Dashboard – plan card
  badge_active: string;

  // Dashboard – plan progress

  // Dashboard – last / next workout

  // Dashboard – weight panel
  weight_label: string;
  weight_tile_current_avg: string;
  weight_tile_empty: string;

  // Dashboard – best progress

  // Dashboard – recent workouts

  // Dashboard – workout calendar
  calendar_title: string;
  calendar_prev: string;
  calendar_next: string;
  month_1: string;
  month_2: string;
  month_3: string;
  month_4: string;
  month_5: string;
  month_6: string;
  month_7: string;
  month_8: string;
  month_9: string;
  month_10: string;
  month_11: string;
  month_12: string;
  weekday_short_1: string;
  weekday_short_2: string;
  weekday_short_3: string;
  weekday_short_4: string;
  weekday_short_5: string;
  weekday_short_6: string;
  weekday_short_7: string;

  // Create Plan – step indicator
  step_days_per_week: string;
  step_duration: string;
  step_day_names: string;
  step_counter: string;

  // Create Plan – step 1
  create_plan_title: string;
  create_plan_subtitle: string;
  step1_heading: string;
  step1_body: string;
  summary_trainings_per_week: string;
  summary_rest_days: string;
  weeks_1: string;
  weeks_2_4: string;
  weeks_5plus: string;
  next_btn: string;

  // Create Plan – step 2
  step2_heading: string;
  step2_body: string;
  months_abbr: string;
  weeks_abbr: string;
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
  exercises_2_4: string;
  day_color_label: string;
  color_indigo: string;
  color_blue: string;
  color_sky: string;
  color_teal: string;
  color_green: string;
  color_lime: string;
  color_amber: string;
  color_orange: string;
  color_red: string;
  color_pink: string;
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
  rep_range_label: string;
  rep_range_error: string;
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
  my_plans_title: string;
  plans_count_1: string;
  plans_count_other: string;
  plans_total_suffix: string;
  new_plan_btn: string;
  no_plans_title: string;
  no_plans_body: string;
  create_first_plan_btn: string;
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
  edit_duration_label: string;
  shorten_plan_title: string;
  shorten_plan_body: string;
  shorten_plan_confirm: string;
  save_changes_btn: string;
  cancel_btn: string;
  save_changes_error: string;

  // My Plans – edit exercises
  edit_exercises_subtitle: string;
  exercise_name_edit_placeholder: string;
  ex_col_muscle: string;
  ex_col_sets: string;
  ex_col_range: string;
  sets_1: string;
  sets_2_4: string;
  sets_5plus: string;
  ex_unnamed: string;
  move_up: string;
  move_down: string;
  sets_decrease: string;
  sets_increase: string;
  rep_min_label: string;
  rep_max_label: string;
  done_label: string;
  skipped_label: string;
  exercise_skipped_checkbox: string;
  exercise_skipped_label: string;
  add_weight_hint: string;

  // My Plans – weeks view
  all_weeks: string;
  finish_plan_btn: string;
  finish_plan_title: string;
  finish_plan_body: string;
  week_tile_label: string;
  plan_progress_week: string;
  plan_finished_label: string;
  weeks_completed_label: string;
  week_current: string;
  week_planned: string;
  more_actions: string;
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
  prev_week_label: string;
  first_week_label: string;
  progress_label: string;
  save_sets_btn: string;
  save_sets_saving: string;
  save_sets_saved: string;
  finish_day_btn: string;
  wl_status_empty: string;
  wl_status_unsaved: string;
  wl_prev_short: string;
  wl_saved_count: string;
  wl_weight_label: string;
  ex_col_rest: string;
  rest_label: string;
  rest_decrease: string;
  rest_increase: string;
  wl_rir_label: string;
  wl_reps_placeholder: string;
  wl_rir_short: string;
  wl_save_set: string;
  wl_rest_label: string;
  wl_rest_add: string;
  wl_rest_skip: string;
  wl_rest_done: string;
  wl_note_btn: string;
  wl_note_placeholder: string;
  wl_note_save: string;
  wl_note_delete: string;
  wl_note_error: string;
  deload_toggle: string;
  deload_hint: string;
  deload_badge: string;
  deload_error: string;
  finish_save_error: string;
  history_title: string;
  history_btn: string;
  history_open: string;
  history_all_plans: string;
  history_chart_label: string;
  history_best: string;
  history_empty: string;
  history_error: string;
  history_no_date: string;
  history_close: string;
  sync_offline: string;

  // Rest notifications (Web Push) and the refresh button
  push_rest_body: string;
  push_toggle: string;
  push_hint_ios: string;
  push_hint_unsupported: string;
  push_hint_denied: string;
  push_hint_error: string;
  refresh_label: string;
  refresh_offline: string;
  refresh_save_first: string;
  sync_offline_saved: string;
  sync_syncing: string;
  sync_synced: string;
  sync_failed_1: string;
  sync_failed_other: string;
  sync_failed_title: string;
  sync_failed_body: string;
  sync_retry: string;
  sync_discard: string;
  sync_close: string;
  sync_kind_createDay: string;
  sync_kind_saveSets: string;
  sync_kind_completeDay: string;
  sync_kind_note: string;
  sync_kind_weight: string;
  offline_unavailable: string;
  workout_date_label: string;
  workout_date_future: string;
  skipped_checkbox_label: string;
  finish_day_title: string;
  finish_day_body: string;
  confirm_btn: string;
  training_fallback: string;

  // My Weight – setup
  my_weight_title: string;
  my_weight_subtitle: string;
  setup_error_default: string;
  goal_label: string;
  goal_bulk: string;
  goal_cut: string;
  goal_required: string;
  goal_not_set: string;
  weight_chart_title: string;
  weight_chart_empty: string;
  weight_start_label: string;
  weight_now_label: string;
  weight_readings_count: string;
  weight_edit_duration_title: string;
  shorten_cycle_title: string;
  shorten_cycle_body: string;
  shorten_cycle_confirm: string;
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
  muscle_forearms: string;
  muscle_abs: string;
  muscle_quads: string;
  muscle_hamstrings: string;
  muscle_glutes: string;
  muscle_adductors: string;
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

  nav_panel: 'Statystyki',
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
  register_password_placeholder: 'Min. 8 znaków',
  register_loading: 'Tworzenie konta…',
  register_submit: 'Rozpocznij',
  register_has_account: 'Masz już konto?',
  register_login: 'Zaloguj się',

  nav_admin: 'Administracja',
  nav_change_password: 'Zmień hasło',
  login_forgot_password: 'Zapomniałeś hasła?',
  login_password_changed: 'Hasło zostało zmienione. Zaloguj się nowym hasłem.',
  pwd_min_hint: 'Min. 8 znaków',
  pwd_new_label: 'Nowe hasło',
  pwd_repeat_label: 'Powtórz hasło',
  pwd_current_label: 'Obecne hasło',
  pwd_error_min: 'Hasło musi mieć co najmniej 8 znaków',
  pwd_error_mismatch: 'Hasła nie są takie same',
  pwd_error_current: 'Nieprawidłowe obecne hasło',
  pwd_error_generic: 'Coś poszło nie tak. Spróbuj ponownie.',
  pwd_saving: 'Zapisywanie…',
  pwd_save: 'Zapisz',
  pwd_cancel: 'Anuluj',
  pwd_change_success: 'Hasło zostało zmienione. Inne urządzenia zostały wylogowane.',
  pwd_close: 'Zamknij',
  reset_title: 'Odzyskiwanie hasła',
  reset_info: 'Poproś administratora o kod resetu, a następnie wpisz go poniżej razem ze swoim adresem e-mail.',
  reset_code_label: 'Kod resetu',
  reset_next: 'Dalej',
  reset_checking: 'Sprawdzanie…',
  reset_error_invalid: 'Nieprawidłowy lub wygasły kod',
  reset_error_limit: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.',
  reset_error_session: 'Sesja resetu hasła wygasła. Zacznij od nowa.',
  reset_new_title: 'Ustaw nowe hasło',
  reset_new_sub: 'Wybierz nowe hasło do swojego konta.',
  reset_back_to_login: 'Wróć do logowania',
  admin_title: 'Administracja',
  admin_sub: 'Użytkownicy aplikacji i kody resetu hasła',
  admin_no_access: 'Brak dostępu. Ta strona jest dostępna tylko dla administratora.',
  admin_load_error: 'Nie udało się wczytać użytkowników',
  admin_users_count: 'Użytkownicy',
  admin_created: 'Utworzono',
  admin_no_name: 'Bez nazwy',
  admin_generate_code: 'Wygeneruj kod resetu',
  admin_generating: 'Generowanie…',
  admin_code_title: 'Kod resetu hasła',
  admin_code_for: 'Kod dla',
  admin_code_note: 'Kod jest jednorazowy i ważny 24 godziny. Zostanie pokazany tylko teraz — przekaż go użytkownikowi. Jeśli wcześniej wygenerowano kod, przestał on działać.',
  admin_code_valid_until: 'Ważny do',
  admin_copy: 'Kopiuj',
  admin_copied: 'Skopiowano',
  admin_generate_error: 'Nie udało się wygenerować kodu',
  admin_mascot: 'Maskotka',
  admin_mascot_error: 'Nie udało się zmienić maskotki',
  mascot_kulka: 'Kulka',
  mascot_ariana: 'Ariana',
  admin_last_active: 'Ostatnia aktywność',
  admin_last_login: 'Ostatnie logowanie',
  admin_never: 'nigdy',
  rel_just_now: 'przed chwilą',
  rel_minutes_ago: '{n} min temu',
  rel_hours_ago: '{n} godz. temu',
  rel_yesterday: 'wczoraj',

  loading_app: 'Ładowanie aplikacji…',
  mascot_label: 'Kulka – dotknij, a pomacha',
  mascot_label_ariana: 'Ariana – dotknij, a pomacha',
  dashboard_title: 'Statystyki',
  dashboard_subtitle: 'Twoje treningi i postępy w jednym miejscu',
  active_weeks_1: 'aktywny tydzień',
  active_weeks_2_4: 'aktywne tygodnie',
  active_weeks_5plus: 'aktywnych tygodni',
  streak_goal: 'Cel: {n} tyg.',
  dashboard_welcome_title: 'Witaj w GymTracker!',
  dashboard_welcome_body: 'Utwórz pierwszy plan treningowy i zacznij logować treningi, aby zobaczyć postępy.',
  dashboard_create_first_plan: 'Utwórz pierwszy plan',

  stat_this_month: 'W tym miesiącu',
  stat_this_year: 'W tym roku',
  stat_streak: 'Seria',
  workouts_1: 'trening',
  workouts_2_4: 'treningi',
  workouts_5plus: 'treningów',
  weeks_streak_1: 'tydzień bez pominiętego treningu',
  weeks_streak_2_4: 'tygodnie bez pominiętego treningu',
  weeks_streak_5plus: 'tygodni bez pominiętego treningu',

  badge_active: 'Aktywny',



  weight_label: 'Waga',
  weight_tile_current_avg: 'Średnia z aktualnego tygodnia: {kg}',
  weight_tile_empty: 'Dodaj pomiary w „Moja waga”',



  // Dashboard – workout calendar
  calendar_title: 'Kalendarz treningów',
  calendar_prev: 'Poprzedni miesiąc',
  calendar_next: 'Następny miesiąc',
  month_1: 'Styczeń',
  month_2: 'Luty',
  month_3: 'Marzec',
  month_4: 'Kwiecień',
  month_5: 'Maj',
  month_6: 'Czerwiec',
  month_7: 'Lipiec',
  month_8: 'Sierpień',
  month_9: 'Wrzesień',
  month_10: 'Październik',
  month_11: 'Listopad',
  month_12: 'Grudzień',
  weekday_short_1: 'Pn',
  weekday_short_2: 'Wt',
  weekday_short_3: 'Śr',
  weekday_short_4: 'Cz',
  weekday_short_5: 'Pt',
  weekday_short_6: 'So',
  weekday_short_7: 'Nd',

  step_days_per_week: 'Dni treningowe',
  step_duration: 'Czas trwania planu',
  step_day_names: 'Układanie planu',
  step_counter: 'Krok {n} z {total}',

  create_plan_title: 'Utwórz plan treningowy',
  create_plan_subtitle: 'Zbuduj swój spersonalizowany harmonogram treningów',
  step1_heading: 'Ile dni w tygodniu?',
  step1_body: 'Wybierz, jak często chcesz trenować każdego tygodnia.',
  summary_trainings_per_week: 'Treningi w tygodniu',
  summary_rest_days: 'Dni odpoczynku',
  weeks_1: 'tydzień',
  weeks_2_4: 'tygodnie',
  weeks_5plus: 'tygodni',
  next_btn: 'Dalej',

  step2_heading: 'Na ile miesięcy?',
  step2_body: 'Określa łączny czas trwania planu.',
  months_abbr: 'mies.',
  weeks_abbr: 'tyg.',
  back_btn: 'Wstecz',

  step3_heading: 'Skonfiguruj swój plan',
  step3_body: 'Nadaj nazwę planowi i każdemu dniu, następnie kliknij dzień, aby dodać ćwiczenia.',
  plan_name_label: 'Nazwa planu',
  plan_name_placeholder: 'np. GBP 3-dniowy split',
  training_days_section: 'Dni treningowe',
  day_name_placeholder: 'Nazwa dnia',
  exercise_singular: 'ćwiczenie',
  exercises_plural: 'ćwiczeń',
  exercises_2_4: 'ćwiczenia',
  day_color_label: 'Kolor dnia',
  color_indigo: 'Indygo',
  color_blue: 'Niebieski',
  color_sky: 'Błękitny',
  color_teal: 'Morski',
  color_green: 'Zielony',
  color_lime: 'Limonkowy',
  color_amber: 'Bursztynowy',
  color_orange: 'Pomarańczowy',
  color_red: 'Czerwony',
  color_pink: 'Różowy',
  add_exercises_btn: 'Dodaj ćwiczenia',
  save_plan_error: 'Nie udało się zapisać planu',
  saving: 'Zapisywanie…',
  save_plan_btn: 'Zapisz plan',

  back_to_days: 'Wróć do dni',
  step4_body: 'Dodaj ćwiczenia do tego dnia treningowego',
  no_exercises_empty: 'Brak ćwiczeń — dodaj pierwsze poniżej',
  exercise_name_placeholder: 'Nazwa ćwiczenia (np. Wyciskanie)',
  sets_label: 'Serie:',
  rep_range_label: 'Zakres:',
  rep_range_error: 'Zakres powtórzeń: podaj obie wartości (liczby całkowite 1–100), min nie może być większe niż max',
  add_exercise_btn: 'Dodaj ćwiczenie',

  default_day_push: 'Pchanie',
  default_day_pull: 'Ciąganie',
  default_day_legs: 'Nogi',
  default_day_upper: 'Górna część',
  default_day_lower: 'Dolna część',
  default_day_full: 'Całe ciało',
  default_day_cardio: 'Kardio',
  day_number_fallback: 'Dzień',

  my_plans_title: 'Moje plany',
  plans_count_1: 'plan',
  plans_count_other: 'planów',
  plans_total_suffix: 'łącznie',
  new_plan_btn: 'Nowy plan',
  no_plans_title: 'Tu pojawią się Twoje plany',
  no_plans_body: 'Postęp, dni treningowe i tygodnie — wszystko w jednym miejscu.',
  create_first_plan_btn: 'Utwórz pierwszy plan',
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
  edit_duration_label: 'Czas trwania',
  shorten_plan_title: 'Skrócić plan?',
  shorten_plan_body: 'Tygodnie poza nowym zakresem zostaną trwale usunięte wraz z zapisanymi treningami. Tej operacji nie można cofnąć.',
  shorten_plan_confirm: 'Skróć plan',
  save_changes_btn: 'Zapisz zmiany',
  cancel_btn: 'Anuluj',
  save_changes_error: 'Nie udało się zapisać zmian',

  edit_exercises_subtitle: 'Edytuj ćwiczenia dnia treningowego',
  exercise_name_edit_placeholder: 'Nazwa ćwiczenia',
  ex_col_muscle: 'Partia',
  ex_col_sets: 'Serie',
  ex_col_range: 'Zakres',
  sets_1: 'seria',
  sets_2_4: 'serie',
  sets_5plus: 'serii',
  ex_unnamed: 'Bez nazwy',
  move_up: 'Przesuń wyżej',
  move_down: 'Przesuń niżej',
  sets_decrease: 'Mniej serii',
  sets_increase: 'Więcej serii',
  rep_min_label: 'Min. powtórzeń',
  rep_max_label: 'Maks. powtórzeń',
  done_label: 'Gotowe',
  skipped_label: 'Pominięty',
  exercise_skipped_checkbox: 'Ćwiczenie pominięte',
  exercise_skipped_label: 'Pominięte',
  add_weight_hint: 'Zwiększ ciężar',

  all_weeks: 'Wszystkie tygodnie',
  finish_plan_btn: 'Zakończ plan',
  finish_plan_title: 'Zakończyć plan?',
  finish_plan_body: 'Oznacz plan jako ukończony. Wszystkie dane pozostają zapisane i można je edytować.',
  week_tile_label: 'Tydzień',
  plan_progress_week: 'Tydzień {n} z {total}',
  plan_finished_label: 'Plan ukończony',
  weeks_completed_label: 'Ukończone tygodnie',
  week_current: 'Bieżący',
  week_planned: 'Zaplanowany',
  more_actions: 'Więcej akcji',
  week_abbr: 'T',

  finish_week_btn: 'Zakończ tydzień',
  finish_week_question: 'Zakończyć tydzień',
  finish_week_body: 'Oznacz tydzień jako ukończony. Możesz edytować dane później.',
  tap_to_train: 'Dotknij, aby trenować',

  sets_header: 'Seria',
  reps_header: 'Powtórzenia',
  reps_placeholder: 'powtórzenia',
  weight_field_label: 'Ciężar:',
  sets_unit: 'serii',
  prev_week_abbr: 'Poprzedni tydzień',
  prev_week_label: 'Poprzedni tydzień:',
  first_week_label: 'Pierwszy tydzień:',
  progress_label: 'Progres:',
  save_sets_btn: 'Zapisz',
  save_sets_saving: 'Zapisywanie…',
  save_sets_saved: 'Zapisano',
  finish_day_btn: 'Zakończ dzień',
  wl_status_empty: 'Nie rozpoczęto',
  wl_status_unsaved: 'Niezapisane',
  wl_prev_short: 'poprz.',
  wl_saved_count: '{n}/{total} zapisane',
  wl_weight_label: 'Ciężar',
  ex_col_rest: 'Przerwa',
  rest_label: 'Przerwa:',
  rest_decrease: 'Krótsza przerwa',
  rest_increase: 'Dłuższa przerwa',
  wl_rir_label: 'Powtórzenia w zapasie (RIR)',
  wl_reps_placeholder: 'powt.',
  wl_rir_short: 'RIR',
  wl_save_set: 'Zapisz serię',
  wl_rest_label: 'Przerwa',
  wl_rest_add: '+30 s',
  wl_rest_skip: 'Pomiń',
  wl_rest_done: 'Zacznij serię!',
  wl_note_btn: 'Notatka',
  wl_note_placeholder: 'np. siedzenie na 4, bolał bark',
  wl_note_save: 'Zapisz notatkę',
  wl_note_delete: 'Usuń',
  wl_note_error: 'Nie udało się zapisać notatki',
  deload_toggle: 'Tydzień deload',
  deload_hint: 'Lżejszy tydzień – nie liczy się do progresu ani rekordów',
  deload_badge: 'Deload',
  deload_error: 'Nie udało się zapisać zmiany',
  finish_save_error: 'Nie udało się zapisać. Sprawdź połączenie i spróbuj ponownie.',
  history_title: 'Historia ćwiczenia',
  history_btn: 'Historia',
  history_open: 'Pokaż historię ćwiczenia',
  history_all_plans: 'Pokaż ze wszystkich planów',
  history_chart_label: 'e1RM na tydzień',
  history_best: 'Najlepszy',
  history_empty: 'Brak zapisanych tygodni dla tego ćwiczenia',
  history_error: 'Nie udało się wczytać historii',
  history_no_date: 'bez daty',
  history_close: 'Zamknij',
  sync_offline: 'Offline',
  push_rest_body: '{exercise} – seria {n} z {total}',
  push_toggle: 'Powiadomienia o przerwie',
  push_hint_ios: 'Na iPhonie działa po dodaniu aplikacji do ekranu początkowego (iOS 16.4+).',
  push_hint_unsupported: 'Ta przeglądarka nie obsługuje powiadomień.',
  push_hint_denied: 'Powiadomienia są zablokowane – zezwól na nie w ustawieniach przeglądarki.',
  push_hint_error: 'Nie udało się włączyć powiadomień. Spróbuj ponownie.',
  refresh_label: 'Odśwież',
  refresh_offline: 'Brak internetu',
  refresh_save_first: 'Zapisz zmiany, aby zaktualizować',
  sync_offline_saved: 'Offline – zapisano na telefonie',
  sync_syncing: 'Synchronizacja…',
  sync_synced: 'Zsynchronizowano',
  sync_failed_1: 'Nie udało się zapisać 1 wpisu',
  sync_failed_other: 'Nie udało się zapisać {n} wpisów',
  sync_failed_title: 'Niezapisane wpisy',
  sync_failed_body: 'Serwer nie przyjął tych zmian. Są nadal na telefonie – spróbuj ponownie albo je odrzuć.',
  sync_retry: 'Spróbuj ponownie',
  sync_discard: 'Odrzuć',
  sync_close: 'Zamknij',
  sync_kind_createDay: 'Nowy dzień treningowy',
  sync_kind_saveSets: 'Serie',
  sync_kind_completeDay: 'Zakończenie dnia',
  sync_kind_note: 'Notatka',
  sync_kind_weight: 'Waga',
  offline_unavailable: 'Brak połączenia – tych danych nie ma jeszcze na telefonie. Otwórz je raz z internetem.',
  workout_date_label: 'Data treningu:',
  workout_date_future: 'Data treningu nie może być z przyszłości.',
  skipped_checkbox_label: 'Trening pominięty',
  finish_day_title: 'Zakończyć trening?',
  finish_day_body: 'Oznacz dzień jako ukończony. Możesz edytować wpisy później.',
  confirm_btn: 'Potwierdź',
  training_fallback: 'Trening',

  my_weight_title: 'Moja waga',
  my_weight_subtitle: 'Śledź postępy wagowe w czasie',
  setup_error_default: 'Nie udało się utworzyć cyklu',
  goal_label: 'Cel',
  goal_bulk: 'Masa',
  goal_cut: 'Redukcja',
  goal_required: 'Wybierz cel: masa lub redukcja.',
  goal_not_set: 'Ustaw cel, aby kolorować zmiany wagi.',
  weight_chart_title: 'Średnie tygodniowe',
  weight_chart_empty: 'Wykres pojawi się po dwóch tygodniach z pomiarami.',
  weight_start_label: 'Start',
  weight_now_label: 'Teraz',
  weight_readings_count: '{n}/7 pomiarów',
  weight_edit_duration_title: 'Czas trwania cyklu',
  shorten_cycle_title: 'Skrócić cykl?',
  shorten_cycle_body: 'Tygodnie {from}–{to} zostaną trwale usunięte wraz z zapisanymi pomiarami wagi. Tej operacji nie można cofnąć.',
  shorten_cycle_confirm: 'Skróć cykl',
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
  muscle_forearms: 'Przedramiona',
  muscle_abs: 'Brzuch',
  muscle_quads: 'Czworogłowy',
  muscle_hamstrings: 'Dwugłowy',
  muscle_glutes: 'Pośladki',
  muscle_adductors: 'Przywodziciele',
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

  nav_panel: 'Statistics',
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
  register_password_placeholder: 'Min. 8 characters',
  register_loading: 'Creating account…',
  register_submit: 'Get started',
  register_has_account: 'Already have an account?',
  register_login: 'Sign in',

  nav_admin: 'Administration',
  nav_change_password: 'Change password',
  login_forgot_password: 'Forgot password?',
  login_password_changed: 'Your password has been changed. Sign in with your new password.',
  pwd_min_hint: 'Min. 8 characters',
  pwd_new_label: 'New password',
  pwd_repeat_label: 'Repeat password',
  pwd_current_label: 'Current password',
  pwd_error_min: 'Password must be at least 8 characters',
  pwd_error_mismatch: 'Passwords do not match',
  pwd_error_current: 'Current password is incorrect',
  pwd_error_generic: 'Something went wrong. Please try again.',
  pwd_saving: 'Saving…',
  pwd_save: 'Save',
  pwd_cancel: 'Cancel',
  pwd_change_success: 'Password changed. Other devices have been signed out.',
  pwd_close: 'Close',
  reset_title: 'Password recovery',
  reset_info: 'Ask the administrator for a reset code, then enter it below together with your email address.',
  reset_code_label: 'Reset code',
  reset_next: 'Next',
  reset_checking: 'Checking…',
  reset_error_invalid: 'Invalid or expired code',
  reset_error_limit: 'Too many attempts. Try again in 15 minutes.',
  reset_error_session: 'The password reset session has expired. Please start again.',
  reset_new_title: 'Set a new password',
  reset_new_sub: 'Choose a new password for your account.',
  reset_back_to_login: 'Back to sign in',
  admin_title: 'Administration',
  admin_sub: 'App users and password reset codes',
  admin_no_access: 'Access denied. This page is available to the administrator only.',
  admin_load_error: 'Could not load users',
  admin_users_count: 'Users',
  admin_created: 'Created',
  admin_no_name: 'No name',
  admin_generate_code: 'Generate reset code',
  admin_generating: 'Generating…',
  admin_code_title: 'Password reset code',
  admin_code_for: 'Code for',
  admin_code_note: 'The code is single-use and valid for 24 hours. It is shown only now — pass it to the user. Any code generated earlier no longer works.',
  admin_code_valid_until: 'Valid until',
  admin_copy: 'Copy',
  admin_copied: 'Copied',
  admin_generate_error: 'Could not generate the code',
  admin_mascot: 'Mascot',
  admin_mascot_error: 'Could not change the mascot',
  mascot_kulka: 'Kulka',
  mascot_ariana: 'Ariana',
  admin_last_active: 'Last activity',
  admin_last_login: 'Last login',
  admin_never: 'never',
  rel_just_now: 'just now',
  rel_minutes_ago: '{n} min ago',
  rel_hours_ago: '{n} h ago',
  rel_yesterday: 'yesterday',

  loading_app: 'Loading app…',
  mascot_label: 'Kulka – tap to wave',
  mascot_label_ariana: 'Ariana – tap to wave',
  dashboard_title: 'Statistics',
  dashboard_subtitle: 'Your workouts and progress in one place',
  active_weeks_1: 'active week',
  active_weeks_2_4: 'active weeks',
  active_weeks_5plus: 'active weeks',
  streak_goal: 'Goal: {n} wks',
  dashboard_welcome_title: 'Welcome to GymTracker!',
  dashboard_welcome_body: 'Create your first training plan and start logging workouts to see your progress.',
  dashboard_create_first_plan: 'Create first plan',

  stat_this_month: 'This month',
  stat_this_year: 'This year',
  stat_streak: 'Streak',
  workouts_1: 'workout',
  workouts_2_4: 'workouts',
  workouts_5plus: 'workouts',
  weeks_streak_1: 'week without a skipped workout',
  weeks_streak_2_4: 'weeks without a skipped workout',
  weeks_streak_5plus: 'weeks without a skipped workout',

  badge_active: 'Active',



  weight_label: 'Weight',
  weight_tile_current_avg: 'Current week average: {kg}',
  weight_tile_empty: 'Add readings in “My weight”',



  // Dashboard – workout calendar
  calendar_title: 'Workout calendar',
  calendar_prev: 'Previous month',
  calendar_next: 'Next month',
  month_1: 'January',
  month_2: 'February',
  month_3: 'March',
  month_4: 'April',
  month_5: 'May',
  month_6: 'June',
  month_7: 'July',
  month_8: 'August',
  month_9: 'September',
  month_10: 'October',
  month_11: 'November',
  month_12: 'December',
  weekday_short_1: 'Mo',
  weekday_short_2: 'Tu',
  weekday_short_3: 'We',
  weekday_short_4: 'Th',
  weekday_short_5: 'Fr',
  weekday_short_6: 'Sa',
  weekday_short_7: 'Su',

  step_days_per_week: 'Training days',
  step_duration: 'Plan duration',
  step_day_names: 'Plan builder',
  step_counter: 'Step {n} of {total}',

  create_plan_title: 'Create training plan',
  create_plan_subtitle: 'Build your personalized training schedule',
  step1_heading: 'How many days per week?',
  step1_body: 'Choose how often you want to train each week.',
  summary_trainings_per_week: 'Workouts per week',
  summary_rest_days: 'Rest days',
  weeks_1: 'week',
  weeks_2_4: 'weeks',
  weeks_5plus: 'weeks',
  next_btn: 'Next',

  step2_heading: 'For how many months?',
  step2_body: 'Determines the total duration of the plan.',
  months_abbr: 'mo.',
  weeks_abbr: 'wks.',
  back_btn: 'Back',

  step3_heading: 'Configure your plan',
  step3_body: 'Name the plan and each day, then click a day to add exercises.',
  plan_name_label: 'Plan name',
  plan_name_placeholder: 'e.g. PPL 3-day split',
  training_days_section: 'Training days',
  day_name_placeholder: 'Day name',
  exercise_singular: 'exercise',
  exercises_plural: 'exercises',
  exercises_2_4: 'exercises',
  day_color_label: 'Day colour',
  color_indigo: 'Indigo',
  color_blue: 'Blue',
  color_sky: 'Sky',
  color_teal: 'Teal',
  color_green: 'Green',
  color_lime: 'Lime',
  color_amber: 'Amber',
  color_orange: 'Orange',
  color_red: 'Red',
  color_pink: 'Pink',
  add_exercises_btn: 'Add exercises',
  save_plan_error: 'Failed to save plan',
  saving: 'Saving…',
  save_plan_btn: 'Save plan',

  back_to_days: 'Back to days',
  step4_body: 'Add exercises to this training day',
  no_exercises_empty: 'No exercises — add one below',
  exercise_name_placeholder: 'Exercise name (e.g. Bench Press)',
  sets_label: 'Sets:',
  rep_range_label: 'Range:',
  rep_range_error: 'Rep range: enter both values (whole numbers 1–100), min cannot be greater than max',
  add_exercise_btn: 'Add exercise',

  default_day_push: 'Push',
  default_day_pull: 'Pull',
  default_day_legs: 'Legs',
  default_day_upper: 'Upper body',
  default_day_lower: 'Lower body',
  default_day_full: 'Full body',
  default_day_cardio: 'Cardio',
  day_number_fallback: 'Day',

  my_plans_title: 'My Plans',
  plans_count_1: 'plan',
  plans_count_other: 'plans',
  plans_total_suffix: 'total',
  new_plan_btn: 'New plan',
  no_plans_title: 'Your plans will appear here',
  no_plans_body: 'Progress, training days and weeks — all in one place.',
  create_first_plan_btn: 'Create your first plan',
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
  edit_duration_label: 'Duration',
  shorten_plan_title: 'Shorten plan?',
  shorten_plan_body: 'Weeks outside the new range will be permanently deleted along with any saved workouts. This action cannot be undone.',
  shorten_plan_confirm: 'Shorten plan',
  save_changes_btn: 'Save changes',
  cancel_btn: 'Cancel',
  save_changes_error: 'Failed to save changes',

  edit_exercises_subtitle: 'Edit training day exercises',
  exercise_name_edit_placeholder: 'Exercise name',
  ex_col_muscle: 'Muscle group',
  ex_col_sets: 'Sets',
  ex_col_range: 'Range',
  sets_1: 'set',
  sets_2_4: 'sets',
  sets_5plus: 'sets',
  ex_unnamed: 'Untitled',
  move_up: 'Move up',
  move_down: 'Move down',
  sets_decrease: 'Fewer sets',
  sets_increase: 'More sets',
  rep_min_label: 'Min reps',
  rep_max_label: 'Max reps',
  done_label: 'Done',
  skipped_label: 'Skipped',
  exercise_skipped_checkbox: 'Exercise skipped',
  exercise_skipped_label: 'Skipped',
  add_weight_hint: 'Increase weight',

  all_weeks: 'All weeks',
  finish_plan_btn: 'Finish plan',
  finish_plan_title: 'Finish plan?',
  finish_plan_body: 'Mark plan as completed. All data remains saved and can be edited.',
  week_tile_label: 'Week',
  plan_progress_week: 'Week {n} of {total}',
  plan_finished_label: 'Plan completed',
  weeks_completed_label: 'Completed weeks',
  week_current: 'Current',
  week_planned: 'Planned',
  more_actions: 'More actions',
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
  prev_week_abbr: 'Previous week',
  prev_week_label: 'Previous week:',
  first_week_label: 'First week:',
  progress_label: 'Progress:',
  save_sets_btn: 'Save',
  save_sets_saving: 'Saving…',
  save_sets_saved: 'Saved',
  finish_day_btn: 'Finish day',
  wl_status_empty: 'Not started',
  wl_status_unsaved: 'Unsaved',
  wl_prev_short: 'prev.',
  wl_saved_count: '{n}/{total} saved',
  wl_weight_label: 'Weight',
  ex_col_rest: 'Rest',
  rest_label: 'Rest:',
  rest_decrease: 'Shorter rest',
  rest_increase: 'Longer rest',
  wl_rir_label: 'Reps in reserve (RIR)',
  wl_reps_placeholder: 'reps',
  wl_rir_short: 'RIR',
  wl_save_set: 'Save set',
  wl_rest_label: 'Rest',
  wl_rest_add: '+30 s',
  wl_rest_skip: 'Skip',
  wl_rest_done: 'Start your set!',
  wl_note_btn: 'Note',
  wl_note_placeholder: 'e.g. seat on 4, shoulder hurt',
  wl_note_save: 'Save note',
  wl_note_delete: 'Delete',
  wl_note_error: 'Could not save the note',
  deload_toggle: 'Deload week',
  deload_hint: 'Lighter week – not counted in progress or records',
  deload_badge: 'Deload',
  deload_error: 'Could not save the change',
  finish_save_error: 'Could not save. Check your connection and try again.',
  history_title: 'Exercise history',
  history_btn: 'History',
  history_open: 'Show exercise history',
  history_all_plans: 'Show from all plans',
  history_chart_label: 'e1RM per week',
  history_best: 'Best',
  history_empty: 'No logged weeks for this exercise yet',
  history_error: 'Could not load the history',
  history_no_date: 'no date',
  history_close: 'Close',
  sync_offline: 'Offline',
  push_rest_body: '{exercise} – set {n} of {total}',
  push_toggle: 'Rest notifications',
  push_hint_ios: 'On iPhone it works after adding the app to the Home Screen (iOS 16.4+).',
  push_hint_unsupported: "This browser doesn't support notifications.",
  push_hint_denied: 'Notifications are blocked – allow them in your browser settings.',
  push_hint_error: "Couldn't turn on notifications. Please try again.",
  refresh_label: 'Refresh',
  refresh_offline: 'No internet',
  refresh_save_first: 'Save your changes to update',
  sync_offline_saved: 'Offline – saved on this phone',
  sync_syncing: 'Syncing…',
  sync_synced: 'Synced',
  sync_failed_1: 'Could not save 1 entry',
  sync_failed_other: 'Could not save {n} entries',
  sync_failed_title: 'Unsaved entries',
  sync_failed_body: 'The server did not accept these changes. They are still on this phone – try again or discard them.',
  sync_retry: 'Try again',
  sync_discard: 'Discard',
  sync_close: 'Close',
  sync_kind_createDay: 'New training day',
  sync_kind_saveSets: 'Sets',
  sync_kind_completeDay: 'Finished day',
  sync_kind_note: 'Note',
  sync_kind_weight: 'Weight',
  offline_unavailable: 'No connection – this data is not on this phone yet. Open it once while online.',
  workout_date_label: 'Workout date:',
  workout_date_future: 'Workout date cannot be in the future.',
  skipped_checkbox_label: 'Workout skipped',
  finish_day_title: 'Finish workout?',
  finish_day_body: 'Mark day as completed. You can edit entries later.',
  confirm_btn: 'Confirm',
  training_fallback: 'Training',

  my_weight_title: 'My Weight',
  my_weight_subtitle: 'Track your weight progress over time',
  setup_error_default: 'Failed to create cycle',
  goal_label: 'Goal',
  goal_bulk: 'Bulk',
  goal_cut: 'Cut',
  goal_required: 'Choose a goal: bulk or cut.',
  goal_not_set: 'Set a goal to colour weight changes.',
  weight_chart_title: 'Weekly averages',
  weight_chart_empty: 'The chart appears after two weeks with readings.',
  weight_start_label: 'Start',
  weight_now_label: 'Now',
  weight_readings_count: '{n}/7 readings',
  weight_edit_duration_title: 'Cycle duration',
  shorten_cycle_title: 'Shorten cycle?',
  shorten_cycle_body: 'Weeks {from}–{to} will be permanently deleted along with their logged weights. This action cannot be undone.',
  shorten_cycle_confirm: 'Shorten cycle',
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
  muscle_forearms: 'Forearms',
  muscle_abs: 'Abs',
  muscle_quads: 'Quadriceps',
  muscle_hamstrings: 'Hamstrings',
  muscle_glutes: 'Glutes',
  muscle_adductors: 'Adductors',
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
  'Przedramiona':     'muscle_forearms',
  'Brzuch':           'muscle_abs',
  'Czworogłowy':      'muscle_quads',
  'Dwugłowy':         'muscle_hamstrings',
  'Pośladki':         'muscle_glutes',
  'Przywodziciele':   'muscle_adductors',
  'Łydki':            'muscle_calves',
};
