"""Validate Wakati import CSVs with row-level errors. stdlib only, run with -I.
Usage: python -I tools/validate_imports.py imports/templates
Exit 0 = clean, 1 = errors. Prints JSON to stdout.
"""
import csv, json, sys
from pathlib import Path

EXPECTED = {
 "lecturers.csv": ["name","email","department","employment_type"],
 "rooms.csv": ["code","building","capacity","type"],
 "programmes.csv": ["code","name","department"],
 "cohorts.csv": ["programme_code","level","size"],
 "courses.csv": ["code","title","department","level","is_elective"],
 "students.csv": ["index_number","full_name","email","programme_code","level"],
 "sessions.csv": ["session_key","component","length_periods","times_per_week","required_room_type","lecturer_email","group_label","expected_students"],
 "session_courses.csv": ["session_key","course_code"],
 "elective_choices.csv": ["student_index","course_code"],
 "lecturer_availability.csv": ["lecturer_email","day_of_week","period_index","status","reason"],
 "blocked_slots.csv": ["day_of_week","period_index","room_code","reason"],
 "periods.csv": ["day_of_week","period_index","start_time","end_time"],
 "cohort_courses.csv": ["programme_code","level","course_code"],
}

def err(errors, f, line, msg):
    errors.append({"file": f, "line": line, "error": msg})

def main(d):
    d = Path(d); errors, warns = [], []
    def load(f):
        p = d / f
        if not p.exists():
            err(errors, f, 0, "missing file"); return []
        with open(p, newline='', encoding='utf-8-sig') as fh:
            r = list(csv.DictReader(fh))
        if r and list(r[0].keys()) != EXPECTED[f]:
            err(errors, f, 1, f"bad header, expected {EXPECTED[f]}")
        return r

    # periods.csv: the institution's own grid. Validates days 1-7, times overlap-free per day.
    grid = {}  # (day, idx) -> (line, start, end); per_day max idx
    per_day_max, per_day_times = {}, {}
    for i, r in enumerate(load("periods.csv"), 2):
        try: gd, gp = int(r["day_of_week"]), int(r["period_index"])
        except ValueError: err(errors, "periods.csv", i, "day/period must be integers"); continue
        if not 1 <= gd <= 7: err(errors, "periods.csv", i, "day 1-7"); continue
        if gp < 1: err(errors, "periods.csv", i, "period_index >= 1"); continue
        t = (r.get("start_time","").strip(), r.get("end_time","").strip())
        if not (len(t[0]) >= 4 and len(t[1]) >= 4 and t[0] < t[1]):
            err(errors, "periods.csv", i, "need start_time < end_time (HH:MM)"); continue
        if (gd, gp) in grid: err(errors, "periods.csv", i, "duplicate day/period"); continue
        for (od, op), (_, os, oe) in grid.items():
            if od == gd and not (t[1] <= os or t[0] >= oe):
                err(errors, "periods.csv", i, f"overlaps day {gd} period {op}"); break
        grid[(gd, gp)] = (i,) + t
        per_day_max[gd] = max(per_day_max.get(gd, 0), gp)
    if not grid: err(errors, "periods.csv", 0, "grid is empty — define your teaching days/periods")
    def in_grid(f, i, d, p):
        try: d, p = int(d), int(p)
        except ValueError: err(errors, f, i, "day/period must be integers"); return False
        if (d, p) not in grid:
            err(errors, f, i, f"day {d} period {p} not in your periods.csv grid"); return False
        return True

    lect = { (r.get("email") or "").strip(): i+2 for i, r in enumerate(load("lecturers.csv")) if r.get("email") }
    rooms = { (r.get("code") or "").strip(): (i+2, r) for i, r in enumerate(load("rooms.csv")) if r.get("code") }
    progs = set()
    for i, r in enumerate(load("programmes.csv"), 2):
        progs.add((r.get("code") or "").strip())
    cohorts = set()
    for i, r in enumerate(load("cohorts.csv"), 2):
        try: lvl, sz = int(r["level"]), int(r["size"])
        except ValueError: err(errors, "cohorts.csv", i, "level/size must be integers"); continue
        if lvl not in (100,200,300,400): err(errors, "cohorts.csv", i, "level must be 100/200/300/400")
        if sz < 0: err(errors, "cohorts.csv", i, "size >= 0")
        if r["programme_code"].strip() not in progs: err(errors, "cohorts.csv", i, f"unknown programme {r['programme_code']}")
        cohorts.add((r["programme_code"].strip(), lvl))
    courses, electives = {}, set()
    for i, r in enumerate(load("courses.csv"), 2):
        c = (r.get("code") or "").strip(); courses[c] = r
        if r.get("is_elective","").strip().lower() in ("true","1","yes"): electives.add(c)
    students = {}
    for i, r in enumerate(load("students.csv"), 2):
        idx = (r.get("index_number") or "").strip(); students[idx] = r
        if (r.get("programme_code","").strip(), int(r["level"]) if r.get("level","").strip().lstrip("-").isdigit() else None) not in cohorts:
            err(errors, "students.csv", i, f"no cohort for {r.get('programme_code')} level {r.get('level')}")
    sessions = {}
    for i, r in enumerate(load("sessions.csv"), 2):
        k = (r.get("session_key") or "").strip(); sessions[k] = r
        try:
            assert int(r["length_periods"]) >= 1 and int(r["times_per_week"]) >= 1 and int(r["expected_students"]) >= 0
        except (ValueError, AssertionError): err(errors, "sessions.csv", i, "length/times >=1, expected_students >=0")
        if r.get("component") not in ("theory","practical","workshop","project"): err(errors, "sessions.csv", i, "bad component")
        if r.get("required_room_type") not in ("lecture","computer_lab","other","any"): err(errors, "sessions.csv", i, "bad room type")
        em = (r.get("lecturer_email") or "").strip()
        if not em: warns.append({"file": "sessions.csv", "line": i, "warning": f"{k}: TBA lecturer"})
        elif em not in lect: err(errors, "sessions.csv", i, f"unknown lecturer {em}")
    for i, r in enumerate(load("session_courses.csv"), 2):
        if r.get("session_key","").strip() not in sessions: err(errors, "session_courses.csv", i, "unknown session_key")
        if r.get("course_code","").strip() not in courses: err(errors, "session_courses.csv", i, "unknown course")
    for i, r in enumerate(load("elective_choices.csv"), 2):
        if r.get("student_index","").strip() not in students: err(errors, "elective_choices.csv", i, "unknown student")
        if r.get("course_code","").strip() not in courses: err(errors, "elective_choices.csv", i, "unknown course")
        elif r["course_code"].strip() not in electives: warns.append({"file": "elective_choices.csv", "line": i, "warning": "course not flagged elective"})
    for i, r in enumerate(load("lecturer_availability.csv"), 2):
        if r.get("lecturer_email","").strip() not in lect: err(errors, "lecturer_availability.csv", i, "unknown lecturer")
        if r.get("status") not in ("available","preferred","unavailable"): err(errors, "lecturer_availability.csv", i, "bad status")
        in_grid("lecturer_availability.csv", i, r.get("day_of_week",""), r.get("period_index",""))
    for i, r in enumerate(load("blocked_slots.csv"), 2):
        if r.get("room_code","").strip() and r["room_code"].strip() not in rooms: err(errors, "blocked_slots.csv", i, "unknown room")
        in_grid("blocked_slots.csv", i, r.get("day_of_week",""), r.get("period_index",""))
    for i, r in enumerate(load("cohort_courses.csv"), 2):
        if (r.get("programme_code","").strip(), int(r["level"]) if r.get("level","").strip().lstrip("-").isdigit() else None) not in cohorts:
            err(errors, "cohort_courses.csv", i, "no such cohort")

    print(json.dumps({"errors": errors, "warnings": warns, "ok": not errors}, indent=2))
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "imports/templates"))
