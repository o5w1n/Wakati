# Wakati: Build Plan Re-worked

Version 2 · November 9, 2026 · Academic City University, weekly lectures

Replaces the October 21 build document. Reworked after the architecture decision (Next.js, Supabase, CP-SAT) and the council review.

## 1. What it is

Wakati generates a clash-free weekly lecture timetable for Academic City each semester, lets the Registry fix it by drag and drop, and publishes personal, lecturer and room timetables to students and staff. The goal is "FET, but better": no hard clashes, every course gets its required hours (proper 2-period sessions), generation in minutes, and every problem explained in plain language.

Core idea: set up lecturers, courses, groups and rooms once. Every new semester reuses them.

## 2. What changed from the October 21 document

| Area | Before | Now |
| --- | --- | --- |
| Universities | Multi-university from v1 | Academic City only. Keep a `university_id` column on every table, build nothing else for multi-tenancy |
| Exams | Phase 5 of v1 | Later, not committed |
| Daily operations | Cancellations and emergency rooms in v1 | Later, not committed |
| Stack | React/Vite, NestJS, TypeORM, pg-boss, custom auth | Next.js, Supabase (auth, Postgres with RLS, realtime), Python FastAPI with OR-Tools CP-SAT |
| First version | Full platform | "Version zero": schema, import, solver on real data, plain pages |
| Login | Own login, SSO later | Supabase Auth behind an identity adapter; portal SSO if the portal offers it |
| Rules | In code | Weights and toggles in the database; the solver is the single source of truth |
| Success test | Phase gates only | Gates plus a kill criterion (section 6) |

## 3. Scope

### In scope (v1)

- Roles: Super admin, Timetable admin, Head of department (view and request), Lecturer, Student
- Master data: lecturers (full-time, part-time), courses, programmes, cohorts, groups, rooms
- New semester that reuses all master data
- Import from Excel/CSV with row-level errors
- Lecturer availability entry (Available, Preferred, Unavailable)
- Pre-check for impossible inputs before generating
- Automatic generation with CP-SAT, a quality score and a conflict report where every unplaced session has a plain-language reason
- Cross-listed courses, theory/practical, groups, electives, TBA lecturers, room types, locked sessions
- Elective overlap map so non-conflicting electives share a slot
- Drag-and-drop editor with live green/amber/red checking, undo/redo, lock/unlock
- Draft, Under review, Published workflow with version history and compare
- Student, lecturer and room timetables, free-room view
- In-portal notifications for moves
- PDF and Excel export in the current cell layout
- Audit log of every change after publishing

### Later (not committed)

Exam timetabling, lecturer cancellations and free-room days, emergency scheduling, email and SMS/WhatsApp, more universities, CDN snapshots (only if load testing needs them), realtime beyond solver progress, SSO if the portal does not expose it yet.

### Out of scope

Native mobile apps, room booking, attendance, payroll and workload, automatic lecturer-to-course assignment, AI chat assistant.

## 4. Architecture and stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | Next.js, TypeScript, Tailwind | Server components for portal pages; client components for the editor |
| Drag and drop | dnd-kit | Grid editor, desktop only |
| Auth and database | Supabase: Auth, Postgres with row-level security | Role claims in the token; managed backups |
| Solver | Python FastAPI with OR-Tools CP-SAT | One worker, fed by a `solve_jobs` table; progress through Realtime |
| Export | exceljs, pdfmake | No headless Chrome in serverless routes |
| Hosting | Next.js and solver in containers or on a VPS; Supabase managed | Confirm regions and pricing |
| Tests | Vitest, pytest, pgTAP | Solver, rule checker and RLS need heavy tests |

```
Browser  ->  Next.js  ->  Supabase (Auth, Postgres + RLS, Realtime)
                              ^
                              |  solve_jobs, placements
                         Solver worker (Python, CP-SAT)
```

Rules for the design:

- **Row-level security is the only role boundary**, because the browser reaches the database through the Supabase API. Rules such as "hard clashes blocked unless overridden with a reason" live in database functions or server code, never only in the client. Write policies as `(select auth.jwt() ->> 'university_id')` so they evaluate once per query, and index the column.
- **The solver uses elevated access and bypasses RLS.** Every query it makes filters explicitly, and tests cover it.
- **One source of truth for rules.** The Python solver is authoritative. The TypeScript checker used for instant slot colouring is verified against it on a shared test set, so the two cannot drift silently.
- **Token claims go stale** until refresh. Decide how fast a role change or a removed account must take effect.
- **Identity behind an adapter.** Version zero uses Supabase Auth with accounts created from imports. If the portal offers SAML or OIDC, plug it in without touching the rest.
- **Rules and weights are configuration** per semester, read by the solver.
- **Published timetables are read-heavy.** Start with plain Next.js pages. Add per-cohort snapshots on a CDN only if a load test at semester-start levels shows a need.

## 5. Scheduling rules

Unchanged from the requirements document. Hard rules H1 to H12 and preferences P1 to P9 stand as written there, with these notes:

- Exam rules are removed from v1.
- Rules are stored as configuration so new weights need no code change (NFR-15).
- Added for FET parity, after the first demo: lecturer maximum days and gaps, minimum rest, minimum days between sessions of a course, preferred room lists, co-taught sessions, sessions needing several rooms.
- **Explainability is designed, not assumed.** CP-SAT does not explain failures on its own. The model allows unplaced sessions with penalties, and diagnostics (assumption-based checks) turn them into plain-language reasons. Budget real time for this, because it is the main advantage over FET.
- **Fallback:** when the solver cannot place everything, it returns the best partial result and a list the Registry completes by hand in the editor. A partial timetable is never published silently.

## 6. Build phases

Each phase ends at a gate you can show someone.

| Phase | What gets built | Gate |
| --- | --- | --- |
| 0. Data and ground rules | Last semester's timetable, room list with capacities, courses with lecturers; draft import templates; answers on the portal, enrolment data, data-sharing agreement and ownership (section 8) | Clean data files and written answers |
| 1. Version zero foundation | Supabase schema with RLS, roles, master data, semester setup, CSV import, availability entry, plain Next.js pages to view results | A full semester set up from imports; RLS tests pass before any real student data is loaded |
| 2. Solver | Python script first (hard rules H1 to H12 on real data), then the service; pre-check; conflict report and explanations; independent checker; elective overlap map | Last semester rebuilt with zero hard clashes and proper 2-period sessions, side by side with the original |
| 3. Editor | Drag and drop, live checking, locking, undo, publish workflow, versions, audit log | The Registry edits and publishes a timetable |
| 4. Portals and exports | Personal, lecturer and room views, free-room view, PDF and Excel export, in-portal notifications, SSO if available | Pilot with one department |
| 5. Later | Exams, cancellations and emergency scheduling, email and SMS, more universities | Decided after the pilot |

Editor design can start alongside Phase 2 once Phase 1 data shows which screens are needed.

**Kill criterion.** Suggested: if the solver cannot rebuild last semester with zero hard clashes within six weeks of starting Phase 2, stop and reassess before building anything else. Options then are to simplify the rule set, change the model, or reconsider the project. Adjust the six weeks to your real pace, but fix the number now.

**Rough pace (to confirm):** data one to two weeks, solver three to four weeks, editor and portals after the gate.

## 7. Quality targets

| Area | Target |
| --- | --- |
| Correctness | Zero hard clashes in a published timetable unless an override is logged; an independent checker re-verifies before publishing |
| Generation | Under 5 minutes for a full semester, with progress shown |
| Editor | Slot colouring under 200 ms, save under 1 second |
| Portal pages | Under 2 seconds, small pages for slow data, including the start-of-semester rush |
| Mobile | Student and lecturer views work on phones; editor is desktop only |
| Availability | 99% during the semester; maintenance outside teaching hours |
| Security | HTTPS, role checks enforced by RLS and server code, RLS covered by automated tests |
| Privacy | Student data used only for timetabling; follows Ghana Data Protection Act, 2012 (Act 843) |
| Audit | Every post-publish change logged with user, time and reason, kept at least a year |
| Backup | Daily backups; any published version restorable through version history |
| Explainability | Every clash or unplaced session explained in plain language |

## 8. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Portal has no SSO or API, so Supabase becomes a second login | Ask IT in Phase 0; identity adapter; accounts from imports |
| Students without usable email, bulk account creation limits | Index-number mapping or custom flow; create accounts in batches |
| Dirty or missing data (capacities, lecturers, electives) | Phase 0 first; row-level import errors; pre-check |
| RLS mistake leaks data | pgTAP tests before real data; explicit filters in the solver; review every policy |
| Solver cannot rebuild last semester | Kill criterion; start with hard rules only |
| Plain-language explanations harder than expected | Plan the relaxed model and diagnostics early in Phase 2 |
| Rule logic drifts between TypeScript and Python | Solver authoritative; shared test set |
| Students on courses from other levels (resits, carry-overs) are invisible to the cohort rule H3 | Decide in Phase 0: ignore, flag, or import extra courses |
| Registry does not trust or adopt it | Pilot with one department; side-by-side demo; coordinator involved from Phase 0 |
| Ownership after graduation | Settle hosting, cost and maintenance owner before the pilot |
| Data residency and latency from Accra; Supabase cost and outage | Check regions and pricing; plan a read-only fallback if needed |
| Email delivery limits | Custom SMTP before the availability window opens |

## 9. Ownership and adoption (new)

Answer these before the pilot, with the university in writing where possible:

- Who approves adoption: the Registry, the academic office, or IT?
- Who hosts it, who pays, and who fixes it in the first week of a new semester?
- Who maintains it after you graduate, and who holds the code and the data?
- Under what agreement does the university supply enrolment data, and who may access it?

## 10. Decisions still open

| Question | Blocks |
| --- | --- |
| Who built the portal; does it offer SSO or an API? | Phase 0, Phase 4 |
| Where is course registration stored; can elective and group choices be exported? | Phase 1, Phase 2 |
| Do students pick electives before or after publishing? (If after, use elective baskets) | Phase 2 |
| Do any courses need 3-period blocks? Evening, weekend or online sessions? | Phase 2 |
| Institution-wide blocked times (assembly, prayer, lunch)? | Phase 2 |
| Do rooms belong to departments, or can any department use any room? | Phase 1 |
| Is there a minimum walking time between buildings? | Phase 2 |
| Who has final authority to publish? | Phase 3 |
| Is the editor a structured grid (as specified) or a free canvas like Miro? | Phase 3 |
| Head of department: view-and-request only, or more? | Phase 3 |

## 11. This week

1. Ask the coordinator for last semester's timetable, the room list with capacities, and the course list with lecturers.
2. Ask IT who built the portal, whether it offers SSO, and whether course registration data can be exported.
3. Create the Supabase project and draft the schema and import templates.
4. Write down the kill criterion and the ownership questions.
