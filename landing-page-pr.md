# Wakati Landing Page — PR & Copy Spec

> **Status:** Synced with `web/src/app/page.tsx`, `web/src/app/globals.css`, and `web/src/components/brand.tsx`  
> **Design system:** `--color-page` (`#f6f7fd`), `--color-card` (`#ffffff`), `--color-cardline` (`#e6e8f2`), `--color-lavender` (`#dad7fb`), `--color-primary` (`#C93834`), `--color-primary-hover` (`#b02e2a`), `--color-sidebar` (`#141b34`), `--color-heading` (`#111827`), `--color-body` (`#4b5563`), `--color-muted` (`#9ca3af`), `--radius-card` (`12px` / `rounded-xl`), `--radius-input` (`8px` / `rounded-lg`), `Inter` sans, `max-w-6xl` container on `min-h-svh bg-page`.  
> **Main CTAs:** `Get started` (`/get-started` in header) and `Create your institution` (`/create-institution` in hero and closing CTA).

---

## 1. Header

- **Logo (`<Logo />`):** Stylized W `<LogoMark />` SVG in `text-primary` + `Wakati` (`text-[17px] font-semibold tracking-tight text-heading`), linking to `/`.
- **Navigation links (`hidden items-center gap-7 text-sm text-body md:flex`, `aria-label="Primary"`):**
  - `About` (`/about`)
  - `Features` (`/features`)
  - `For institutions` (`/for-institutions`)
- **Actions:**
  - Text link (`text-sm text-body hover:text-heading`): `Sign in` (`/login`)
  - Primary header button (`btn-press inline-flex h-9 items-center rounded-lg bg-sidebar px-4 text-[13px] font-semibold text-white hover:opacity-90`): `Get started` (`/get-started`)

---

## 2. Opening Screen (Hero)

- **Layout:** Two-column grid (`grid items-center gap-10 py-14 md:grid-cols-2 md:py-20`) inside `max-w-6xl`.
- **Eyebrow (`text-[13px] font-semibold uppercase tracking-wide text-primary`):**
  > For university registries and timetable offices
- **Headline (`mt-2 text-[40px] font-bold leading-[1.08] tracking-tight text-heading md:text-[52px]`):**
  > **A clash-free semester timetable, built in minutes.**
- **Supporting line (`mt-4 max-w-md text-[15px] leading-relaxed text-body`):**
  > Wakati places every class using your courses, lecturers and rooms, and checks every rule as it goes. When something cannot fit, it tells you exactly why.
- **Actions (2):**
  - Primary (`btn-press inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover`): `Create your institution` (`/create-institution`)
  - Secondary (`text-sm font-medium text-primary hover:underline`): `See how it works` (`/features`)
- **Checklist (`POINTS`):**
  - `Two-hour classes stay two hours`
  - `No lecturer, room or student group booked twice`
  - `A plain-language reason for anything it cannot place`
- **Hero Visual (right column, `hidden md:block`, `aria-hidden`):**
  - Lavender circle (`bg-lavender/70`) behind a `rounded-l-3xl` gradient panel (`bg-gradient-to-br from-sidebar via-sidebar to-primary`) with a geometric campus building `<svg>` (`text-white/25`) and caption:
    - **Academic City University**
    - Timetabled with Wakati

---

## 3. The Problem

- **Section heading:** `Hand-built timetables fail in the same few places`
- **Layout:** Single-column prose (`max-w-2xl space-y-3 text-[14px] leading-relaxed text-body`).
- **Copy:**
  - Most registries still place classes one at a time in a spreadsheet. Nothing checks the work as it grows, so clashes turn up in the first week of teaching.
  - When no clean two-hour block can be found, a two-hour class is quietly cut to one. Lecturers’ availability is collected by phone and forgotten by the time the grid is built. And one room change can mean redoing half the week.
  - **Wakati takes over the part that is slow and easy to get wrong, and leaves the decisions with you.**

---

## 4. What It Does (`WHAT`)

- **Section heading:** `Everything between your course list and a published timetable`
- **Layout:** 3-column card grid (`grid gap-4 md:grid-cols-2 lg:grid-cols-3`, `rounded-xl border border-cardline bg-card p-5`).

1. **Builds the whole timetable**  
   Add your courses, lecturers and rooms. Wakati places every session so that no lecturer, room or student group is in two places at once, across every programme and level.

2. **Keeps two-hour classes whole**  
   Class length is a requirement, not a hope. A two-period class gets two consecutive periods, with the break kept inside it, or Wakati tells you why it could not.

3. **Explains what it cannot place**  
   No vague error codes. You get a sentence: “No lab is free for two periods when all CS 300 students and Dr Mensah are free.” Then you decide what to change.

4. **Starts from lecturer availability**  
   Lecturers mark when they are available, preferred or unavailable before anything is generated. The first draft already fits, so you are not fixing it by hand afterwards.

5. **Fits electives into fewer slots**  
   Two Level 400 electives can share a slot when no student takes both. Wakati reads who chose what, so electives stop taking up the whole week and core classes get room.

6. **Edit by dragging**  
   Move a class to another slot or room. Green means it fits, amber means it breaks a preference, red means it breaks a rule. Hover to see which rule and why.

---

## 5. How It Works (`STEPS`)

- **Section heading:** `From setup to published in four steps`
- **Layout:** 2-column ordered list (`ol`, `grid gap-4 md:grid-cols-2`, `rounded-xl border border-cardline bg-card p-5`).

1. **Step 1 — Set up once.**  
   Add your lecturers, rooms, courses and groups. They stay saved. Next semester, you start from what you already have.

2. **Step 2 — Collect availability.**  
   Open a window and lecturers fill in a weekly grid. You see who has submitted and who has not.

3. **Step 3 — Generate and review.**  
   Wakati checks your inputs first, then builds the timetable. You get a quality score and a list of anything it could not place.

4. **Step 4 — Publish.**  
   Review, adjust, then publish. Students and lecturers see their own timetables straight away, on a phone or a computer.

---

## 6. Day-to-Day Operations (`AFTER`)

- **Section heading:** `The timetable keeps working after week one`
- **Layout:** 2-column card grid (`grid gap-4 md:grid-cols-2`, `rounded-xl border border-cardline bg-card p-5`).

1. **A lecturer cancels a class.**  
   They do it in Wakati, with a reason. The room shows as free for that day, and the students in that class are told.

2. **An emergency class comes up.**  
   Registry picks a date and time and sees every room that is free. Wakati also shows whether the lecturer and the students are free, so you do not find the clash afterwards.

3. **Anyone can see which rooms are free.**  
   Students and lecturers can check a room for a given period. They cannot book it, and the page says so.

4. **Every change is on record.**  
   After publishing, each change is saved with who made it, when and why. You can compare two versions and see exactly which classes moved.

---

## 7. Who It’s For (`WHO`)

- **Section heading:** `One system, three views`
- **Layout:** 3-column card grid (`grid gap-4 md:grid-cols-3`, `rounded-xl border border-cardline bg-card p-5`).

### Registry and timetable offices
Set up the semester, generate, edit and publish. Find rooms for emergency classes. See every cohort, lecturer and room.

### Lecturers
Set your availability once a semester. See your own timetable and any room’s timetable. Cancel a class when you cannot teach it.

### Students
See your timetable for your programme, electives and group only. Check which rooms are free. Open it on a phone without eating your data.

---

## 8. Exams & Multi-Institution Isolation

- **Section heading:** `Exam timetables from the same data`
  > You have already entered the courses, rooms and student registrations. Wakati uses them to build the exam timetable too: no student with two papers in one period, no room or invigilator booked twice, large exams split across rooms where needed.

- **Section heading:** `Built for more than one university`
  > Each institution has its own days, periods, rooms and people, kept apart from every other institution on Wakati. One institution can never see another’s data.

---

## 9. Frequently Asked Questions (`FAQS`)

- **Section heading:** `Frequently asked questions`
- **Layout:** 2-column card grid (`grid gap-4 md:grid-cols-2`, `rounded-xl border border-cardline bg-card p-5`).

1. **Can we import what we already have?**  
   Yes. Lecturers, rooms, courses and student electives import from Excel or CSV. If a row has a problem, you are told which row and what is wrong.

2. **What if a full timetable is not possible?**  
   Wakati places as much as it can and lists every class it could not place, with the reason for each. Nothing is silently dropped.

3. **Can we change the timetable after publishing?**  
   Yes. Every change is saved as a new version with a reason, and the affected students and lecturers are notified.

4. **Can students or lecturers book rooms?**  
   No. They can see which rooms are free for a period. Only Registry can schedule a room for an extra class.

5. **Does it work on phones?**  
   Student and lecturer views do, and they are kept small for slow connections. The timetable editor is for desktop.

6. **How is student data used?**  
   Only to build and show timetables. Wakati follows Ghana’s Data Protection Act, 2012 (Act 843).

7. **Does it replace our student portal?**  
   No. Wakati reads from and shows timetables in your portal where it can connect, and works as its own web page where it cannot.

---

## 10. Closing Call to Action

- **Layout:** Centered section (`py-12 text-center`).
- **Headline (`text-2xl font-bold tracking-tight text-heading`):** `See your own timetable built`
- **Supporting line (`mx-auto mt-2 max-w-md text-[14px] text-body`):** `Create your institution, import your data and generate a first draft. If something cannot be placed, you will know why.`
- **Button (`btn-press mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover`):** `Create your institution` (`/create-institution`)

---

## 11. Footer

- **Layout:** `border-t border-cardline`, inner container `mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[13px] text-body`.
- **Brand statement:** `Wakati: timetabling for universities.`
- **Links (`aria-label="Footer"`):**
  - `About` (`/about`)
  - `Features` (`/features`)
  - `For institutions` (`/for-institutions`)
  - `Contact` (`/login`)

---

## Sync Checklist Against `web/src/app/page.tsx`

- [x] **Header:** `<Logo />`, 3 nav items (`About`, `Features`, `For institutions`), `Sign in` link (`/login`), and `Get started` button (`/get-started`).
- [x] **Opening screen:** Eyebrow, headline (`A clash-free semester timetable, built in minutes.`), supporting copy, 2 actions (`Create your institution` `/create-institution`, `See how it works` `/features`), 3 `POINTS` checklist items, and Academic City University visual panel.
- [x] **Problem:** `Hand-built timetables fail in the same few places` (3 paragraphs).
- [x] **What it does:** All 6 `WHAT` cards synced verbatim.
- [x] **How it works:** All 4 `STEPS` cards synced verbatim.
- [x] **Day-to-day operations:** All 4 `AFTER` cards synced verbatim.
- [x] **Who it’s for:** All 3 `WHO` role cards (`Registry and timetable offices`, `Lecturers`, `Students`).
- [x] **Exams & multi-tenant isolation:** Both actual sections included; bracketed pilot quote and metric placeholders removed.
- [x] **FAQs:** All 7 `FAQS` items synced verbatim.
- [x] **Closing CTA & Footer:** `See your own timetable built` + `Create your institution` (`/create-institution`), and footer links (`About`, `Features`, `For institutions`, `Contact`).
