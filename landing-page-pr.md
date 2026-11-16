# Wakati Landing Page — Reviewable PR & Copy Spec

> **Status:** Draft for review (no changes made to `web/src/app/page.tsx` or `web/src/app/globals.css`)  
> **Design system:** Monochrome-first (`#ffffff` paper, `#f7f7f5` canvas, `#111111` ink, `#777777` muted, `#e5e5e3` 1px hairline borders, `0px` border radius), `--color-indigo-deep` (`#4338ca`) primary actions, `Inter` / `Geist` sans, `max-w-6xl` container.  
> **Main CTA:** `Request a demo` (repeated at top, opening screen, and closing CTA).

---

## 1. Header

- **Logo:** `Wakati` (`text-[15px] font-semibold tracking-tight text-ink`)
- **Navigation links (`text-[13px] text-muted hover:text-ink`):**
  - `Product` (`#what-it-does`)
  - `Who it’s for` (`#who-its-for`)
  - `Pilot` (`#pilot`)
  - `About` (`#about`)
- **Primary button (`btnPrimaryCls`, `bg-indigo-deep`):**
  - `Request a demo`

> *Note:* Keep existing `Sign in` accessible from the footer or a subtle text link if needed, so the header maintains one clear action button.

---

## 2. Opening Screen

- **Layout:** Asymmetric or clean single-column hero on `bg-paper` with the live `TimetableGrid` (or high-resolution screenshot of `/registry/editor`) framed in `border border-line` below/beside it.
- **Headline (`text-3xl md:text-[40px] md:leading-[1.15] font-semibold tracking-tight text-ink`):**
  > **Clash-free lecture and exam timetables for university registrars and exam officers.**
- **Supporting line (`text-[15px] leading-relaxed text-muted`):**
  > No more weeks of clashes, manual edits, and 1-hour compromises — generated in minutes, fixed by drag and drop, published to every student and lecturer.
- **Buttons (2 only):**
  - Primary (`btnPrimaryCls`): `Request a demo`
  - Secondary (`btnSecondaryCls`): `See how it works` (scrolls to `#what-it-does`)
- **Product visual (real product, no stock image):**
  - Live `TimetableGrid` or real screenshot from `/registry/editor` showing course codes, titles, tags (`Theory`, `Practical`, `Elective`, `Group`), lecturer names, and room codes in bold.

---

## 3. Proof Strip

- **Layout:** Full-width hairline band (`border-y border-line bg-canvas px-6 py-4`).
- **Copy (plain, unpadded):**
  > **Built for and piloted at Academic City University** — open to every institution.

*(No placeholder partner logos. Add additional institutions only as they onboard.)*

---

## 4. The Problem, in Plain Words

- **Section heading:** `Why semester timetabling breaks`
- **Layout:** 3-column hairline grid (`grid gap-px border border-line bg-line md:grid-cols-3`, `bg-paper p-6`), matching the current card grid style.

1. **Clashes slip through manual placement**  
   Coordinators place sessions by hand across Level 100 to Level 400, cross-listed courses, and electives. One missed overlap double-books a room, a lecturer, or a student group.

2. **Two-hour classes get cut to one**  
   When no clean two-period block is left on the sheet, required two-hour sessions are shortened just to make the grid fit.

3. **Every late change creates confusion**  
   Re-sending updated PDFs and messages after publishing leaves lecturers and students checking old versions or walking into occupied rooms.

---

## 5. What It Does

- **Section heading (`#what-it-does`):** `From semester setup to published timetable`
- **Layout:** Alternating or stacked feature rows on `bg-paper` with `border border-line` screenshot frames. Verb-led headlines, one sentence each, plain outcomes.

1. **Set up once, reuse every semester**  
   Import lecturers, rooms, courses, and student cohorts from Excel or CSV, catch impossible room or capacity inputs before solving, and carry them forward to the next semester with no re-entry.  
   - *Screenshot:* `/registry/master` (Master data & Excel/CSV import with row-level checks)

2. **Generate**  
   The constraint solver places every lecture and exam session, and lists plain-language reasons for anything that cannot fit instead of cryptic error codes.  
   - *Screenshot:* `/registry/generate` (Solver run, quality score, and conflict report)

3. **Edit by drag and drop**  
   Drag any session on the timetable grid: slots turn green when valid, amber when breaking a preference, and red on a hard clash with the exact reason on hover.  
   - *Screenshot:* `/registry/editor` (Drag-and-drop grid with green/amber/red slot feedback)

4. **Publish to everyone**  
   Move timetables from Draft to Under review to Published so students and lecturers see their personal schedules on their phones, while Registry exports PDF and Excel in the familiar cell layout.  
   - *Screenshot:* `/registry/publish` paired with `/student/timetable`

5. **Handle daily changes**  
   Lecturers can cancel a single class date to free the room for that day, and Registry can find free rooms and conflict-free slots for emergency classes in seconds.  
   - *Screenshot:* `/lecturer/rooms` or `/registry/notifications`

---

## 6. Who It’s For

- **Section heading (`#who-its-for`):** `Built for every role on campus`
- **Layout:** 3-column hairline grid (`grid gap-px border border-line bg-line md:grid-cols-3`, `bg-paper p-6`).

### Registry & Exam Officers
Generate lecture and exam timetables in minutes, lock sessions that must not move, resolve clashes visually with live green/amber/red feedback, and keep a full audit log of every post-publish change.

### Lecturers
Submit availability preferences before the semester starts, view personal teaching and invigilation schedules on any device, cancel a single class date when needed, and check free rooms across campus.

### Students
See only the sessions that apply to you—your cohort’s core classes, your chosen electives, and your assigned groups—plus exam dates and free rooms, without digging through master spreadsheets.

---

## 7. Results & Quote

> [!IMPORTANT]
> **Do not invent proof.** Replace the bracketed placeholders below only with verified measurements and a signed-off quote from the Academic City pilot before publishing.

- **Layout:** Metric strip (`MetricCard` style: `border border-line bg-paper px-4 py-3`) + 1 bordered quote block (`border-l-2 border-indigo-deep pl-4`).
- **Metrics (fill from pilot):**
  - `[X] minutes` — Time to generate a full semester draft (down from `[Y] weeks` of manual placement)
  - `0` — Hard room, lecturer, or student clashes on published timetables
  - `[N] sessions` — Placed with full required period lengths preserved
- **User Quote (fill from pilot):**
  > “[Exact quote from pilot user on how Wakati changed semester or exam scheduling.]”  
  > — **[Full Name]**, [Role, e.g., Registrar / Timetable Coordinator, Academic City University]

---

## 8. Trust & Data Handling

- **Section heading (`#pilot`):** `How your institution’s data is handled`
- **Layout:** 2×2 hairline grid (`grid gap-px border border-line bg-line md:grid-cols-2`, `bg-paper p-6`).

- **Where data is stored**  
  Hosted in PostgreSQL with Row-Level Security enabled. Every record is scoped to its university, so one institution can never read or modify another’s data.

- **Who can see what**  
  Role-based access separates Platform Admins, Registry, Heads of Department, Lecturers, and Students. Draft timetables stay hidden from students and lecturers until Registry moves a version to Published, and every post-publish edit is recorded in an audit log.

- **How it connects to existing portals**  
  Import lecturers, courses, rooms, and enrolments directly from Excel/CSV templates with row-level validation, export published grids to PDF and Excel in your existing cell layout, and connect institutional login via an SSO adapter.

- **What support looks like**  
  Hands-on onboarding with your Registry team: we help format your first semester import, verify your period grid and room rules, and support your first live run from draft to publication.

---

## 9. Closing Call to Action

- **Layout:** Centered or left-aligned bordered panel (`border border-line bg-canvas p-8 md:p-12`).
- **Headline:** `See it with your own timetable data.`
- **Supporting line:** `Send us one semester’s courses, rooms, and lecturers, and we’ll walk through a live clash-free draft together.`
- **Button (`btnPrimaryCls`):** `Request a demo`

---

## 10. Footer

- **Layout:** `border-t border-line bg-paper` (`max-w-6xl mx-auto px-6 py-10`).
- **About (`#about`):**
  > **Wakati** — Built for Academic City University to replace weeks of manual spreadsheet scheduling and cryptic desktop tools, and open to every university that wants clash-free lecture and exam timetables.
- **Links:**
  - `About`
  - `Contact`
  - `Privacy policy`
  - `Documentation`

---

## Checklist Against Rules

- [x] **Header:** Logo, 4 menu items (`Product`, `Who it’s for`, `Pilot`, `About`), 1 primary button (`Request a demo`).
- [x] **Opening screen:** 1 plain headline (`[What it does] for [who uses it]`), 1 supporting line on the problem removed, 2 buttons (`Request a demo`, `See how it works`), real product visual.
- [x] **Proof strip:** Plain single-institution statement (`Academic City University`), no padded logos.
- [x] **Problem:** 3 concrete pain points grounded in `Campus Timetable Allocation Platform — Requirements.md`.
- [x] **What it does:** Verb-led headlines, 1 sentence each, real route screenshots mapped, zero "AI-powered" or "intelligent" buzzwords.
- [x] **Who it’s for:** Short blocks for Admins/Registry, Lecturers, and Students.
- [x] **Results & quote:** Explicit placeholders flagged for real pilot numbers and a real user quote—no invented proof.
- [x] **Trust:** Covers storage/RLS, role visibility + draft/publish gating, portal/Excel/SSO integration, and onboarding support.
- [x] **Closing CTA & Footer:** Repeats `Request a demo` with a specific ask; footer includes About, Contact, Privacy policy, and Documentation.
