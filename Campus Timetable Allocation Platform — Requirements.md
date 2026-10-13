# Campus Timetable Allocation Platform — Requirements

Oct 6, 2026&#32;

## Overview

The platform generates a clash-free lecture timetable for Academic City every semester, then lets administrators adjust it by drag-and-drop without breaking any scheduling rule. It is an internal tool for Academic City, built to sit inside the existing student, lecturer and admin portals.

**The problem today.** Coordinators place every class by hand. They have to make sure no student group, lecturer or room is double-booked, across Level 100 to Level 400 and every programme. Because nothing checks this automatically, compromises creep in. Many classes that should run 2 hours run only 1, because no clean 2-hour block could be found.

**Who uses it**

| User | What they do | Where |
| --- | --- | --- |
| Timetable administrator / coordinator | Enters semester data, runs the generator, edits by drag-and-drop, publishes(something like lucidchart or Miro) | Admin portal |
| Head of department | Reviews their department's timetable, requests changes | Admin portal (view + request) |
| Lecturer | Views personal timetable, exports PDF/Excel, sets availability | Lecturer portal |
| Student | Views personal timetable, exports PDF/Excel | Student portal |

**Success looks like:** a full semester timetable with zero hard clashes, every course getting its required hours, produced in minutes rather than weeks, and changes made safely after publishing.

## What the current timetable tells us

The existing student portal timetable (a Level 400 computing timetable) sets the structure the system must model and the layout people already know.

**Time grid.** Monday to Friday, 08:00 to 18:20, in nine 1-hour periods separated by 10-minute breaks:

| Period | Time |
| --- | --- |
| 1 | 08:00 – 09:00 |
| 2 | 09:10 – 10:10 |
| 3 | 10:20 – 11:20 |
| 4 | 11:30 – 12:30 |
| 5 | 12:40 – 13:40 |
| 6 | 13:50 – 14:50 |
| 7 | 15:00 – 16:00 |
| 8 | 16:10 – 17:10 |
| 9 | 17:20 – 18:20 |

A session occupies one or more consecutive periods. Sessions should normally be **2 periods**; today some run only 1 because no clean 2-period block was found. The system treats session length as a requirement, not a nice-to-have. A 2-period session keeps the 10-minute break inside it, e.g. 08:00–10:10.

**Patterns the data model must handle**

- **Cross-listed sessions.** One session can serve several course codes from different programmes at once, e.g. *AI4136/CE/CS/IT4135 – Computer Security*. Every cohort on every listed code must be clash-free.
- **Theory and practical components.** One course can have a theory session in a lecture room and a practical session in a lab, often with different lengths.
- **Groups.** Large courses split into groups ("Group A"), each with its own session, room and possibly lecturer.
- **Electives.** Marked "(Elective)". Level 400 students choose electives, so two electives can only share a time slot if no student takes both.
- **Non-lecture sessions.** Career workshops (CW400) and project sessions (Project Phase I) occupy slots and rooms like lectures.
- **Unassigned lecturers.** Some sessions show a placeholder ("Faculty Gap 9") instead of a lecturer. The system must allow a session with a TBA lecturer and flag it.
- **Room types.** Computer Labs and lecture rooms (L-, A- and U-series). Practical sessions need labs.

**Cell layout to keep.** Each block shows course code(s) and title with its tags (Elective, Theory/Practical, Group), then the lecturer, then the room in bold. Generated timetables should render in this same layout so students and lecturers see nothing unfamiliar.

## Scope

Version 1 covers weekly lecture timetabling for one semester at Academic City, from data entry to publishing in the portals.

| In scope (v1) | Out of scope (later or never) |
| --- | --- |
| Semester setup: periods, days, rooms, lecturers, courses, sessions, cohorts | Exam timetabling (strong v2: same engine) |
| Automatic generation with a constraint solver | Multi-university / SaaS version |
| Drag-and-drop editor with live clash checking | Native mobile apps (portals are responsive web) |
| Locking sessions so regeneration keeps them | Room booking for one-off events and meetings |
| Conflict report explaining what could not be placed and why | Attendance tracking |
| Draft → review → publish workflow, with version history | Lecturer workload and payroll calculations |
| Personal timetables in student, lecturer and admin portals | Students choosing electives inside this system (read from registration instead) |
| PDF and Excel export in the current layout | Changing the portal's login system |
| Change notifications to affected students and lecturers | AI chat assistant for timetable questions |
| Lecturer availability entry | Automatic lecturer-to-course assignment (departments decide who teaches) |
| Import from Excel/CSV; portal integration for reading enrolments and showing timetables | Week-by-week variations (e.g. a class only in odd weeks) |

## Functional requirements

Requirements are grouped by module and numbered so designs, tickets and tests can refer to them. **Must** = needed for v1; **Should** = v1 if time allows.

### 1. Semester setup (admin)

- **FR-1.1 (Must)** Create a semester with its teaching days, periods and break times (default: Mon–Fri, the nine periods above).
- **FR-1.2 (Must)** Manage rooms: name, building, capacity, type (lecture room, computer lab, other) and any blocked times.
- **FR-1.3 (Must)** Manage lecturers: name, department, employment type (full-time / part-time), and available or unavailable periods.
- **FR-1.4 (Must)** Manage courses: code(s), title, department, level, elective or core.
- **FR-1.5 (Must)** Define each course's sessions: component (theory / practical / workshop / project), length in periods (default 2), sessions per week, required room type, lecturer (or TBA), and group label.
- **FR-1.6 (Must)** Cross-list a session under several course codes so it is taught once to all of them.
- **FR-1.7 (Must)** Define cohorts: programme + level, with their core courses. For Level 400, also load which students take which electives.
- **FR-1.8 (Must)** Import all of the above from Excel/CSV templates, with row-level error messages.
- **FR-1.9 (Should)** Copy last semester's setup as a starting point.

### 2. Automatic generation

- **FR-2.1 (Must)** Generate a full timetable that satisfies every hard rule (see Scheduling rules).
- **FR-2.2 (Must)** Optimise the soft preferences and show a quality score.
- **FR-2.3 (Must)** When a full solution is impossible, place as much as possible and list each unplaced session with the specific reason (e.g. "no lab free for 2 periods when all CS 300 students and Dr. X are free").
- **FR-2.4 (Must)** Respect locked sessions: they never move on regeneration.
- **FR-2.5 (Should)** Regenerate only a selected department, level or set of sessions, leaving the rest untouched.
- **FR-2.6 (Should)** Run a pre-check before generating that catches impossible inputs, e.g. a course needing a 120-seat room when the largest holds 80.

### 3. Drag-and-drop editor (admin)

- **FR-3.1 (Must)** Weekly grid matching the portal layout, filterable by programme + level, lecturer, room, or department.
- **FR-3.2 (Must)** Drag a session to another time and/or room. While dragging, colour every target slot: green (valid), amber (breaks a preference), red (breaks a hard rule).
- **FR-3.3 (Must)** Hovering a red or amber slot explains why ("Dr. Yamak teaches AI4125 then").
- **FR-3.4 (Must)** Block saving a hard-rule clash by default; allow a deliberate override only with a reason, which is logged.
- **FR-3.5 (Must)** Lock and unlock individual sessions.
- **FR-3.6 (Must)** Undo / redo.
- **FR-3.7 (Should)** "Find me a slot": select a session and list all valid alternatives, best first.
- **FR-3.8 (Should)** Swap two sessions in one move when neither fits alone.
- **FR-3.9 (Should)** Change a session's room or lecturer from a side panel without dragging.

### 4. Review and publishing

- **FR-4.1 (Must)** Timetables move through Draft → Under review → Published.
- **FR-4.2 (Must)** Only published timetables appear to students and lecturers.
- **FR-4.3 (Must)** Every change after publishing is versioned: who changed what, when, and why.
- **FR-4.4 (Must)** Compare two versions and see exactly which sessions moved.
- **FR-4.5 (Should)** Heads of department can comment on or request changes to their department's sessions.

### 5. Portal views and export

- **FR-5.1 (Must)** Students see their own timetable: their cohort's core sessions plus their chosen electives and groups only.
- **FR-5.2 (Must)** Lecturers see their own teaching timetable.
- **FR-5.3 (Must)** Admins can view any cohort, lecturer or room timetable.
- **FR-5.4 (Must)** Export any view to PDF and Excel in the current cell layout.
- **FR-5.5 (Should)** Room occupancy view showing free rooms per period.

### 6. Notifications

- **FR-6.1 (Must)** When a published session moves, notify affected students and lecturers in the portal.
- **FR-6.2 (Should)** Also notify by email and SMS/WhatsApp, with the old and new time and room.

### 7. Lecturer availability (first step each semester)

Lecturers submit their available days and times at the start of every semester, before anything is generated. The solver treats this as input, so timetables respect it from the first draft instead of being fixed by hand afterwards.

- **FR-7.1 (Must)** Admin opens an availability window with a deadline for each semester. Lecturers get a portal notice and reminders before it closes.
- **FR-7.2 (Must)** Lecturers fill in a weekly grid, in the same layout as the timetable, marking each period as **Available**, **Preferred** or **Unavailable**.
- **FR-7.3 (Must)** Quick actions for whole days and half-days, e.g. "not available Fridays" or "mornings only".
- **FR-7.4 (Must)** Unavailable periods are a hard rule (H8); preferred periods are a preference (P1).
- **FR-7.5 (Must)** Lecturers can add an optional reason (e.g. teaching at another institution), visible to admins only.
- **FR-7.6 (Must)** Admin dashboard shows who has submitted and who hasn't; admins can enter or correct availability on a lecturer's behalf.
- **FR-7.7 (Must)** Before generation, warn when a lecturer's available periods are fewer than the periods they must teach, or when their availability makes a course impossible to place.
- **FR-7.8 (Should)** Pre-fill from last semester so lecturers only confirm or adjust.
- **FR-7.9 (Should)** Mid-semester availability change requests: the admin sees which sessions would be affected before approving.
- **FR-7.10 (Should)** Admin-set limit on how many periods a full-time lecturer can mark unavailable, so the timetable stays solvable.

### 8. Access control

- **FR-8.1 (Must)** Roles: Super admin, Timetable admin, Head of department, Lecturer, Student. Each sees and edits only what its role allows.
- **FR-8.2 (Must)** Use the portal's existing login (single sign-on) so nobody gets a new password.

### 9. Level 400 electives in parallel

Two electives may run at the same time whenever no student takes both. Today coordinators can't see who picked what, so they keep every elective in a separate slot to be safe. That uses up the week and squeezes core classes and lecturer availability. With real elective choices, Machine Learning and Cryptography can share a slot if their student lists don't overlap, and every student still attends every class.

How the system decides:

1. Build an elective overlap map from registration: for every pair of electives, count the students taking both.
2. Pairs with **zero shared students** may run at the same time, as long as they have different rooms, different lecturers, and both lecturers are available.
3. Pairs with **any shared student** never overlap (hard rule H4).
4. The solver groups compatible electives into shared elective blocks, so electives take fewer periods of the week. That leaves more room for core classes, full 2-period sessions and lecturer availability.

- **FR-9.1 (Must)** Import each student's elective choices, from course registration or a pre-registration form.
- **FR-9.2 (Must)** Show admins the overlap map: which electives can share a slot and which can't, with the number of shared students.
- **FR-9.3 (Must)** Schedule non-overlapping electives in parallel when it helps fit the timetable, subject to rooms and lecturer availability.
- **FR-9.4 (Must)** In the editor, explain why two electives can or can't share a slot, e.g. "12 students take both".
- **FR-9.5 (Must)** When a student changes electives after publishing, re-check their timetable and flag any new clash.
- **FR-9.6 (Should)** Elective baskets: if students choose electives after the timetable is made, departments group electives into baskets and students pick one per basket. Electives in the same basket can always run in parallel.
- **FR-9.7 (Should)** Show how many periods electives use with and without parallel blocks, so admins can see the time saved.

Open question: do Level 400 students pick electives before or after the timetable is published? If after, baskets (FR-9.6) are the safe route.

## Scheduling rules

Hard rules must never be broken; preferences are weighted and traded off. Admins can adjust preference weights per semester.

**Hard rules**

| ID | Rule |
| --- | --- |
| H1 | A lecturer teaches at most one session per period. |
| H2 | A room holds at most one session per period. |
| H3 | A cohort (programme + level) has at most one core session per period, including cross-listed sessions on any of its codes. |
| H4 | Two electives overlap only if no student takes both; electives with no shared students may run in parallel (section 9). |
| H5 | A student in a group is only placed in that group's sessions; groups of the same course may run in parallel. |
| H6 | Room capacity ≥ expected students in the session. |
| H7 | Room type matches the session (practicals in labs). |
| H8 | Sessions are only placed when the lecturer is available. |
| H9 | A session occupies its full length in consecutive periods on one day, without crossing a day boundary. |
| H10 | Each session is placed the required number of times per week. |
| H11 | Locked sessions stay where they are. |
| H12 | Blocked periods (e.g. institution-wide events) and blocked rooms stay empty. |

**Preferences**

| ID | Preference |
| --- | --- |
| P1 | Lecturer preferred periods are used where possible. |
| P2 | A course's multiple sessions are spread across different days. |
| P3 | A theory session comes before its practical in the week. |
| P4 | Students have few long gaps between sessions in a day. |
| P5 | No cohort has more than a set number of teaching periods per day. |
| P6 | Lecturers do not teach more than a set number of periods in a row. |
| P7 | Early (08:00) and late (17:20) periods are used sparingly. |
| P8 | Rooms are not much larger than needed (a 30-student class does not take the largest hall). |
| P9 | When editing a published timetable, as few other sessions move as possible. |

## Non-functional requirements

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-1 | Correctness | A published timetable has zero hard-rule clashes unless an admin logged an override. An independent checker re-verifies every timetable before publishing. |
| NFR-2 | Generation speed | A full semester at Academic City's size generates in under 5 minutes; a progress indicator shows while it runs. |
| NFR-3 | Editor responsiveness | Slot colouring appears within 200 ms of picking up a session; a drop saves within 1 second. |
| NFR-4 | Portal load | Student and lecturer timetables load in under 2 seconds, including at the start of semester when most students check at once. |
| NFR-5 | Mobile | Student and lecturer views work on phone screens (most students will check on phones); the editor is desktop-only. |
| NFR-6 | Low bandwidth | Student timetable pages stay small and usable on slow mobile data. |
| NFR-7 | Availability | 99% uptime during the semester; maintenance outside teaching hours. |
| NFR-8 | Security | Single sign-on through the portal; role-based access; all traffic over HTTPS. |
| NFR-9 | Privacy | Student enrolment data is used only for timetabling; follows Ghana's Data Protection Act, 2012 (Act 843) and school policy. |
| NFR-10 | Auditability | Every change after publishing is logged with user, time and reason, kept for at least one year. |
| NFR-11 | Backup | Daily backups; any published version can be restored. |
| NFR-12 | Usability | A new coordinator can move a session and publish after a 15-minute walkthrough. |
| NFR-13 | Explainability | Every clash or unplaced session is explained in plain language, never just an error code. |
| NFR-14 | Integration | Reads data and serves timetables through an API layer, so the system works whether the portal is in-house or vendor-built. |
| NFR-15 | Maintainability | Rules and preference weights are configuration, not code, so new rules don't need a developer. |

## Data model overview

The **session** is the unit the solver places: one block of consecutive periods, in one room, with one lecturer, attended by one or more student groups.

| Entity | Key fields | Links to |
| --- | --- | --- |
| Semester | name, dates, teaching days, status | Periods, Timetable versions |
| Period | day, index (1–9), start, end | Semester |
| Room | name, building, capacity, type, blocked periods | Placements |
| Lecturer | name, department, availability, preferences | Sessions |
| Programme | name (e.g. BSc Computer Science), department | Cohorts |
| Cohort | programme + level, size | Core courses, Students |
| Course | code, title, level, core or elective | Cohorts (core), Sessions |
| Session | component (theory/practical/…), length in periods, times per week, room type, group label | Course codes (one or more for cross-listing), Lecturer, Student groups |
| Student | ID, cohort, elective choices, group memberships | Cohort, Courses, Groups |
| Timetable version | status (draft/review/published), created by, notes | Placements |
| Placement | session, day, start period, room, locked | Timetable version |
| Change log entry | user, time, before, after, reason | Placement |

Students are needed only for electives and groups. For core courses, the cohort is enough to check clashes, which keeps the solver small.

## Open questions and assumptions

**Open questions** (answer before building the matching part)

- [ ] Who built the portal (in-house IT or a vendor), and does it offer an API or database access? This decides how integration works.
- [ ] Where is student course registration stored, and can we read who takes which elective and group?
- [ ] Decided: 2-period sessions keep the 10-minute break inside them (e.g. 08:00–10:10).
- [ ] Do any courses need 3-period blocks (long practicals, project sessions)?
- [ ] Are there evening, weekend or online sessions?
- [ ] Who decides which lecturer teaches which course, and when is that final each semester?
- [ ] Are there institution-wide blocked times (e.g. a weekly assembly or prayer period)?
- [ ] Do rooms belong to departments, or can any department use any room?
- [ ] Who has final authority to publish: the registry, a coordinator per faculty, or the academic office?
- [ ] Is there a minimum walking time between buildings that matters for back-to-back classes?

**Working assumptions**

- Small scale: under \~150 courses and under \~30 rooms per semester.
- The weekly pattern repeats every week of the semester.
- Departments assign lecturers to courses before generation; the system schedules, it doesn't staff.
- Standard session length is 2 periods unless a course says otherwise.
- Until portal integration is confirmed, data comes in through Excel/CSV import and timetables are also available as a standalone web page.

## Where to start

Start with data, not code: the solver is only as good as the rooms, courses and enrolments fed into it, and getting those is the slowest part.

&#91;embedded content: build plan · 4 phases, 3 gates\]

Each phase ends at a gate you can show someone. Phase 2's gate is the key demo: last semester's real timetable rebuilt with no clashes and proper 2-period sessions, side by side with the original. Design work on the editor (Phase 3) can start in parallel once Phase 1's data shows what screens need.

**This week**

1. Ask the coordinator for last semester's timetable files, the room list with capacities, and the course list with lecturers.
2. Ask IT who built the portal and whether course registration data can be exported.
3. Draft the Excel import templates from the data model above.
