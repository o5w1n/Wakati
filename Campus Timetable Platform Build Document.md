# Campus Timetable Platform: Build Document

Version 1 scope · October 21, 2026

## 1. What it is

A web platform that does what FET does (automatic, clash-free timetable generation), plus logins, a drag-and-drop editor, publishing, personal and room timetables, daily class cancellation and emergency room finding. Serves many universities from one platform, starting with Academic City, and covers exam timetables as well as lecture timetables.

Core idea: set up lecturers, courses, groups and rooms once. Every new semester reuses them.

## 2. Users and roles

| Role | Can do |
| --- | --- |
| Platform admin | Adds and manages universities and their Registry accounts; platform-wide settings |
| Registry (per university) | Everything inside their own university: set up semesters, generate lecture and exam timetables, edit, publish, schedule emergency classes, manage users |
| Lecturer | View personal lecture and invigilation timetables and room timetables, set availability, cancel own class for a day, see free rooms |
| Student | View own lecture and exam timetables and room timetables, see free rooms |

Students and lecturers can see free rooms but cannot book them. Optional later: a Head of department role with view and change requests.

## 3. Scope

### In scope (v1)

- Multiple universities on one platform: each with its own data, Registry, days, period grid and calendar, with strict separation between them
- Exam timetabling: exam periods, exam sessions, rooms (one exam can use several), invigilators, student clash checking, with the same generate, edit, publish, export and notification flow as lectures
- Login with role-based access (Platform admin, Registry, Lecturer, Student)
- Permanent master data: lecturers (full-time and adjunct), courses, programmes, cohorts, groups, rooms
- New semester that reuses all master data, with no re-entry
- Import from Excel/CSV with row-level errors
- Lecturer availability entry (Available, Preferred, Unavailable)
- Automatic generation with a constraint solver and a quality score
- Conflict report: every unplaced session with a plain-language reason
- Pre-check for impossible inputs before generating
- Cross-listed courses, theory/practical, groups, electives, TBA lecturers, room types, locked sessions
- Elective overlap map so non-conflicting electives can share a slot
- Drag-and-drop editor with live green/amber/red slot checking, undo/redo, lock/unlock
- Draft, Under review, Published workflow with version history and compare
- Student, lecturer and room timetables; free-room view for any date and period
- Lecturer cancels a class for one day, which frees the room for that day
- Registry emergency scheduling: find rooms (and free lecturer and cohorts) for a date and time
- Notifications in the portal for moves, cancellations and emergency classes
- PDF and Excel export in the familiar cell layout
- Audit log of all changes after publishing

### Out of scope (v1)

- Native mobile apps (responsive web only)
- Room booking by students or lecturers
- Attendance, payroll, workload
- Automatic lecturer-to-course assignment
- AI chat assistant
- SSO with an existing university portal (add later through an adapter)
- Email and SMS/WhatsApp notifications (Should-have, after v1 core)

## 4. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind | Familiar, fast, responsive |
| Drag and drop | dnd-kit | Accessible, works well with grids |
| Data fetching | TanStack Query | Caching for fast timetable loads |
| Backend API | NestJS, TypeORM | Structured modules, built-in guards for roles |
| Database | PostgreSQL with row-level security | Every row carries its university, so one university can never read another's data |
| Solver | Python service with OR-Tools CP-SAT (FastAPI) | Proven infeasibility, optimisation; one engine for lectures and exams |
| Job queue | pg-boss (uses Postgres) | Runs long solves without adding Redis |
| Auth | Own login: Argon2 password hashing, JWT or session cookie, role guards; every account belongs to a university | Matches the role requirement; SSO adapter later |
| Export | exceljs (Excel), pdfmake or Puppeteer (PDF) | Reproduce the current cell layout |
| Notifications | In-app table plus polling or WebSocket | Simple first; email later |
| Hosting | Docker Compose on one VPS to start, Nginx, HTTPS | Cheap for the first universities; add servers as more join |
| CI and tests | GitHub Actions, Vitest, Jest, pytest | Solver, checker and tenant isolation need heavy tests |

## 5. Architecture

```
Browser (React)  ->  NestJS API  ->  PostgreSQL
                         |
                         +->  Job queue  ->  Solver service (Python, CP-SAT)
```

- The API owns all data, auth and roles. Every request is tied to a university, and every query is filtered by it.
- The solver is a separate service: it receives a semester snapshot, returns placements and a conflict report. The same engine handles lecture and exam timetables; only the rules differ.
- One shared TypeScript rule-checker module runs in the editor (instant slot colouring) and on the server (final check before publishing). Same code, so the two never disagree.
- Timetables are cached per cohort, lecturer and room so portal pages load fast on slow mobile data.

## 6. Data model

**Permanent:** University (every other record belongs to one), Lecturer, Room, Programme, Cohort, Course, Group, Student, User.

**Per semester:** Semester, Period, Course offering, Session, Lecturer availability, Elective choices, Timetable version, Placement.

**Exams:** Exam period, Exam session, Exam placement, Invigilator assignment.

**Day to day:** Occurrence, Change log entry, Notification.

| Entity | Key fields |
| --- | --- |
| Session | course codes (one or more), component, length in periods, times per week, room type, group, lecturer (or TBA) |
| Placement | session, day, start period, room, locked. The weekly pattern the solver produces |
| Occurrence | placement, calendar date, status (scheduled, cancelled, added), reason, by whom. One row per real class date |

A room is free when it has no active occurrence at that date and period. Cancelling flips one occurrence and leaves the weekly pattern alone. An emergency class is an occurrence with no placement.

An exam session is the unit the solver places for exams: one course (or several cross-listed), a date, start time, duration, one or more rooms and its invigilators. Student course registrations decide which exams may not share a period.

## 7. Scheduling rules

**Hard (never broken):**

- Lecturer, room and cohort each have at most one session per period
- Electives overlap only if no student takes both
- An elective never overlaps a core session for a student who takes it
- Room capacity and room type fit the session
- Lecturer is available; blocked periods and rooms stay empty
- Sessions occupy their full length in consecutive periods, in one day
- Required weekly sessions are all placed
- Locked sessions do not move

**Soft (weighted, adjustable per semester):**

- Use lecturer preferred periods
- Spread a course across different days; theory before practical
- Few student gaps; limit daily periods for students and consecutive periods for lecturers
- Avoid first and last periods where possible
- Avoid rooms much bigger than needed
- Few moves when editing a published timetable

**FET parity to add:** lecturer max days per week and max gaps, minimum rest, minimum days between sessions of a course, preferred room lists, co-taught sessions, sessions needing several rooms, fixed times for specific sessions, per-rule weights.

**Exam rules (hard):**

- A student has at most one exam per period
- A room and an invigilator each hold at most one exam per period
- Room exam capacity covers every student seated; a large exam may use several rooms
- Exams fall inside the exam period; blocked dates and times stay empty
- An exam fits its full duration on one day
- Locked exams do not move

**Exam rules (soft):**

- No back-to-back exams for a student; limit exams per student per day
- Spread each student's exams across the exam period
- Share invigilation fairly between lecturers

## 8. Key flows

1. **New semester:** Registry creates semester, picks which courses run, confirms lecturers and rooms (all carried over), opens the availability window.
2. **Generate:** Pre-check, then solve, then review the score and the conflict report. Lock what is right, fix inputs, regenerate.
3. **Edit:** Drag a session. Slots turn green, amber or red with the reason on hover. Hard clashes are blocked unless Registry overrides with a logged reason.
4. **Publish:** Draft, Under review, Published. Independent checker must pass. Students and lecturers are notified.
5. **Cancel a class:** Lecturer selects the class and date, adds a reason, confirms. The occurrence is cancelled, the room shows free for that day, students are notified, Registry sees it in a log.
6. **Emergency class:** Registry enters date, time, size and room type. System lists rooms that are free, and flags lecturer and cohort conflicts. Registry picks one and affected people are notified.
7. **Free-room view:** Any user picks a date and period and sees rooms free per timetable. These are not reserved.
8. **Exam timetable:** Registry sets the exam period and room exam capacities, assigns invigilators, generates, edits and publishes with the same steps as lectures. Students see their exams; lecturers see exams and invigilation duties.
9. **Add a university:** Platform admin creates the university and its first Registry account. Registry sets days, periods and rooms, then imports data.

## 9. Quality targets

| Area | Target |
| --- | --- |
| Correctness | Zero hard clashes in a published timetable (lecture or exam), unless an override is logged |
| Generation | Under 5 minutes for a full semester of lectures or exams, with progress shown |
| Editor | Slot colouring under 200 ms, save under 1 second |
| Portal pages | Load under 2 seconds, small pages for slow data |
| Mobile | Student and lecturer views work on phones; editor is desktop only |
| Security | HTTPS, hashed passwords, role checks on every endpoint |
| Tenant isolation | One university can never read or change another's data; covered by automated tests |
| Privacy | Student data used for timetabling only; follows Ghana Data Protection Act, 2012 (Act 843) and the equivalent law wherever a university operates |
| Audit | Every post-publish change logged with user, time and reason, kept at least a year |
| Backup | Daily backups; any published version restorable |
| Explainability | Every clash or unplaced session explained in plain language |

## 10. Build phases

| Phase | What gets built | Gate (what you can show) |
| --- | --- | --- |
| 0. Data | Collect last semester timetable, rooms with capacities, courses with lecturers; draft import templates | Clean data files |
| 1. Foundation | University on every record (data separation from day one), auth and roles, master data, semester setup, Excel/CSV import, availability entry | Set up a full semester from imports |
| 2. Solver | Constraint model, pre-check, conflict report, independent checker | Last semester rebuilt with no clashes and proper 2-period sessions, side by side with the original |
| 3. Editor | Drag and drop, live checking, locking, undo, publish workflow, versions | Registry edits and publishes a timetable |
| 4. Daily use | Personal and room views, free-room view, exports, occurrences, cancellation, emergency scheduling, notifications | Pilot with one department |
| 5. Exams | Exam setup (period, exam room capacity, invigilators), exam rules in the same solver, exam editor, publish and export | Full exam timetable for one semester with no student, room or invigilator clash |
| 6. More universities | University onboarding, per-university settings and branding, isolation tests | A second university running beside Academic City with no shared data |

Editor design can start in parallel with Phase 2 once Phase 1 data shows what screens are needed.

## 11. Decisions still open

- Portal: who built it, and is there an API? (Decides SSO later; v1 uses own login.)
- Where is course registration stored, and can elective and group choices be exported?
- Do students pick electives before or after the timetable is published? (If after, use elective baskets.)
- Do any courses need 3-period blocks?
- Any institution-wide blocked times (assembly, prayer)?
- Cancellation rules: reason required, cutoff time, undo allowed?
- Free rooms: view-only, or a non-binding "in use" flag?
- Keep Head of department as a separate role?
- Exams: how many students fit per room for exams compared with lectures, and may one exam use several rooms?
- Exams: who invigilates, and may a lecturer invigilate their own course?
- Exams: are there parallel papers or different exam lengths per course?
- Universities: one shared deployment with isolation (assumed) or a separate install each?
- Does each university get its own web address and branding?
- Billing: how are universities charged, if at all?
