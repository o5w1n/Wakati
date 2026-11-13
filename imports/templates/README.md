# Import templates (Phase 0/1)

One CSV per file, UTF-8, header row required. Row-level errors: bad rows are
reported with line number + reason, good rows still import.

Order: lecturers → rooms → programmes → cohorts → courses → students →
sessions → session_courses → elective_choices → lecturer_availability → blocked_slots.

- `TBA` lecturers: leave `lecturer_email` empty in sessions.csv; row is flagged, not rejected.
- Cross-listed: one row per course code in session_courses.csv sharing a session_key.
- Electives: students listed in students.csv; choices in elective_choices.csv drive the H4 overlap map.
- Availability: one row per lecturer/day/period, status = available|preferred|unavailable.
- periods.csv defines YOUR grid: any days (1=Mon..7=Sun), any periods, any times. Times must not overlap within a day. The sample rows are the Academic City default (Mon-Fri, 9x1hr) — replace with your own. Omit days you don't teach (e.g. no Saturday rows = no Saturday classes).
- blocked_slots.csv: room_code empty = institution-wide (all rooms).
