"""Wakati Phase-2 prototype: CP-SAT lecture timetabler (hard rules H1-H12).
Reads validated CSVs + elective_choices, writes placements JSON + quality score.
Usage: python -I solver/solve.py imports/templates [--time-limit 60] [--out placements.json]
Exit 0 = all sessions placed, 2 = partial (conflict report included), 1 = error.
"""
import argparse, csv, json, sys
from collections import defaultdict
from pathlib import Path
from ortools.sat.python import cp_model

PREF_W = {"preferred": 10, "available": 0, "unavailable": -10**9}  # H8 via hard ban
# Grid comes from periods.csv (per-institution), never hardcoded.

def rows(d, f):
    p = Path(d) / f
    if not p.exists(): return []
    with open(p, newline='', encoding='utf-8-sig') as fh:
        return list(csv.DictReader(fh))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir"); ap.add_argument("--time-limit", type=int, default=60)
    ap.add_argument("--out", default="placements.json")
    a = ap.parse_args()

    rooms = rows(a.dir, "rooms.csv")
    sessions = rows(a.dir, "sessions.csv")
    scourses = rows(a.dir, "session_courses.csv")
    avail_list = rows(a.dir, "lecturer_availability.csv")
    blocked = rows(a.dir, "blocked_slots.csv")
    cohort_courses = rows(a.dir, "cohort_courses.csv") if (Path(a.dir)/"cohort_courses.csv").exists() else []
    echoices = rows(a.dir, "elective_choices.csv")
    grid_rows = rows(a.dir, "periods.csv")
    if not grid_rows:
        print(json.dumps({"fatal": ["periods.csv is empty — define your grid first"]})); return 1
    per_day = defaultdict(list)  # day -> sorted period indexes
    for r in grid_rows:
        per_day[int(r["day_of_week"])].append(int(r["period_index"]))
    for d in per_day: per_day[d].sort()
    DAYS = sorted(per_day)
    last_period = {d: per_day[d][-1] for d in DAYS}  # P7 edge = last slot of each day

    room_by_code = {r["code"]: r for r in rooms}
    sess_by_key = {s["session_key"]: s for s in sessions}
    # session -> courses; course -> cohort keys (programme, level)
    sess_courses = defaultdict(set)
    for r in scourses: sess_courses[r["session_key"]].add(r["course_code"])
    course_cohorts = defaultdict(set)
    for r in cohort_courses:
        course_cohorts[r["course_code"]].add((r["programme_code"], r["level"]))
    # elective overlap: pair -> shared count (H4)
    by_student = defaultdict(set)
    for r in echoices: by_student[r["student_index"]].add(r["course_code"])
    overlap = defaultdict(int)
    for taken in by_student.values():
        taken = sorted(taken)
        for i in range(len(taken)):
            for j in range(i+1, len(taken)):
                overlap[(taken[i], taken[j])] += 1
    def shares_students(ca, cb):
        if ca == cb: return True
        return overlap.get(tuple(sorted((ca, cb))), 0) > 0
    # session -> cohort keys via its courses (core only; electives share via students not cohort)
    sess_cohorts = {}
    for k in sess_by_key:
        cs = set()
        for c in sess_courses.get(k, set()):
            cs |= course_cohorts.get(c, set())
        sess_cohorts[k] = cs
    # unavailability / blocks
    unav = set()
    pref = {}
    for r in avail_list:
        key = (r["lecturer_email"], int(r["day_of_week"]), int(r["period_index"]))
        if r["status"] == "unavailable": unav.add(key)
        else: pref[(r["lecturer_email"], int(r["day_of_week"]))] = PREF_W.get(r["status"], 0)
    blocked_room = set()  # (day, period, room_code or None=all)
    for r in blocked:
        blocked_room.add((int(r["day_of_week"]), int(r["period_index"]), r.get("room_code") or None))

    m = cp_model.CpModel()
    keys = list(sess_by_key)
    # candidate starts: consecutive period_indexes within the same day (H9)
    cands = {}
    for k in keys:
        L = int(sess_by_key[k]["length_periods"])
        c = []
        for d in DAYS:
            slots = per_day[d]
            for i in range(len(slots) - L + 1):
                if slots[i+L-1] - slots[i] == L - 1:  # consecutive indexes
                    c.append((d, slots[i]))
        cands[k] = c
    x = {}   # (k,d,s,room) -> Bool
    u = {}   # unplaced flag per session (penalised heavily; enables conflict report)
    for k in keys:
        L = int(sess_by_key[k]["length_periods"])
        need = int(sess_by_key[k]["expected_students"] or 0)
        rt = sess_by_key[k]["required_room_type"]
        em = sess_by_key[k]["lecturer_email"].strip()
        for (d, s) in cands[k]:
            for code, r in room_by_code.items():
                if rt != "any" and r["type"] != rt: continue  # H7
                if int(r["capacity"]) < need: continue  # H6 pre-filter
                if any((d, p, code) in blocked_room or (d, p, None) in blocked_room
                       for p in range(s, s+L)): continue  # H12
                if em and any((em, d, p) in unav for p in range(s, s+L)): continue  # H8 pre-filter
                x[(k, d, s, code)] = m.NewBoolVar(f"x_{k}_{d}_{s}_{code}")
        u[k] = m.NewBoolVar(f"unplaced_{k}")
        m.Add(sum(x[v] for v in x if v[0] == k) + u[k] == int(sess_by_key[k]["times_per_week"]))  # H10 (+ partial)
    # session occupies full length: expand to (k,d,p) occupancy via starts
    def covers(k, d, p):
        L = int(sess_by_key[k]["length_periods"])
        return [v for v in x if v[0]==k and v[1]==d and v[2]<=p<v[2]+L]
    # H2 room, H1 lecturer, H3 cohort, H4 electives, H5 groups, H11 locked (locks = pre-pinned starts; none in csv v0)
    for d in DAYS:
        for p in per_day[d]:
            for code in room_by_code:
                m.Add(sum(v2 for v in x if v[1]==d and v[3]==code and v[2]<=p<v[2]+int(sess_by_key[v[0]]["length_periods"]) for v2 in [x[v]]) <= 1)  # H2
            # H1
            by_lec = defaultdict(list)
            for v, var in x.items():
                k = v[0]; em = sess_by_key[k]["lecturer_email"].strip()
                if em and v[1]==d and v[2]<=p<v[2]+int(sess_by_key[k]["length_periods"]):
                    by_lec[em].append(var)
            for em, vs in by_lec.items(): m.Add(sum(vs) <= 1)
            # H3 cohort (core): sessions sharing a cohort key clash. Elective-only sessions skip H3 (H4 instead).
            is_core = {k: any(not sess_by_key[k].get("_e", False) for _ in [0]) for k in keys}
            # determine elective sessions: all its courses elective
            # (courses.csv lookup)
            courses = {r["code"]: r.get("is_elective","").lower() in ("true","1","yes") for r in rows(a.dir, "courses.csv")}
            sess_elective = {k: bool(sess_courses.get(k)) and all(courses.get(c, False) for c in sess_courses[k]) for k in keys}
            by_coh = defaultdict(list)
            for v, var in x.items():
                k = v[0]
                if sess_elective[k]: continue
                if v[1]==d and v[2]<=p<v[2]+int(sess_by_key[k]["length_periods"]):
                    for ck in sess_cohorts.get(k, ()): by_coh[ck].append((k, var))
            for ck, lst in by_coh.items():
                # elective-vs-core: elective sessions whose course is taken by this cohort's... unknown per-student cohort;
                # conservative: any elective session clashes with core of a cohort that lists it? cohorts list electives too.
                # v0: electives listed in cohort_courses DO clash with that cohort's core (H4-core rule via mapping).
                m.Add(sum(v for _, v in lst) <= 1)
            # H4 elective-elective: pairs sharing students never overlap
            elec_here = [(v[0], var) for v, var in x.items()
                         if v[1]==d and v[2]<=p<v[2]+int(sess_by_key[v[0]]["length_periods"]) and sess_elective[v[0]]]
            for i in range(len(elec_here)):
                for j in range(i+1, len(elec_here)):
                    ka, va = elec_here[i]; kb, vb = elec_here[j]
                    ca = next(iter(sess_courses.get(ka, [])), ka); cb = next(iter(sess_courses.get(kb, [])), kb)
                    # multi-course sessions: clash if ANY pair shares students
                    clash = any(shares_students(x1, x2) for x1 in sess_courses.get(ka, [ca]) for x2 in sess_courses.get(kb, [cb]))
                    if clash: m.Add(va + vb <= 1)
            # H5 groups: same course, different groups may run in parallel -> no constraint (allowed).
            # different courses same group label: conservative clash
            by_grp = defaultdict(list)
            for v, var in x.items():
                k = v[0]; g = (sess_by_key[k].get("group_label") or "").strip()
                if g and v[1]==d and v[2]<=p<v[2]+int(sess_by_key[k]["length_periods"]):
                    by_grp[g].append((k, var))
            # only clash if they share a course (same course groups parallel OK)
            for g, lst in by_grp.items():
                for i in range(len(lst)):
                    for j in range(i+1, len(lst)):
                        if sess_courses.get(lst[i][0], set()) & sess_courses.get(lst[j][0], set()):
                            continue
                        m.Add(lst[i][1] + lst[j][1] <= 1)
    # Objective: place everything (big penalty per unplaced) + preferred days, P7 avoid first/last slot of each day
    obj = []
    for v, var in x.items():
        k, d, s = v[0], v[1], v[2]
        em = sess_by_key[k]["lecturer_email"].strip()
        w = pref.get((em, d), 0)
        L = int(sess_by_key[k]["length_periods"])
        edge = -3 if s == per_day[d][0] or s + L - 1 == per_day[d][-1] else 0  # P7: day edges, per grid
        obj.append(var * (w + edge))
    for k in keys:
        obj.append(u[k] * -10000)
    m.Maximize(sum(obj))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = a.time_limit
    solver.parameters.num_search_workers = 8
    st = solver.Solve(m)
    placed, unplaced = [], []
    if st in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for v, var in x.items():
            if solver.Value(var):
                placed.append({"session_key": v[0], "day": v[1], "start_period": v[2], "room": v[3]})
        for k in keys:
            if solver.Value(u[k]):
                unplaced.append({"session_key": k, "reason": diagnose(k, sess_by_key, room_by_code, unav, blocked_room, overlap, sess_courses, DAYS, per_day)})
    score = round(100 * (len(placed) / max(len(keys), 1)), 1)
    out = {"status": solver.StatusName(st), "score": score,
           "placed": sorted(placed, key=lambda r: (r["day"], r["start_period"])),
           "unplaced": unplaced}
    Path(a.out).write_text(json.dumps(out, indent=2))
    print(json.dumps({k: v for k, v in out.items() if k != "placed"}, indent=2))
    print(f"placed {len(placed)}/{len(keys)} -> {a.out}")
    return 0 if not unplaced else 2

def diagnose(k, sess, rooms, unav, blocked, overlap, sess_courses, grid_days=None, grid_slots=None):
    s = sess[k]; L = int(s["length_periods"]); need = int(s["expected_students"] or 0)
    rt = s["required_room_type"]; em = s["lecturer_email"].strip()
    big = max((int(r["capacity"]) for r in rooms.values() if rt in ("any", r["type"]) or rt=="any"), default=0)
    if need > big: return f"no {rt} room seats {need} (largest holds {big})"
    if em and grid_days is not None:
        free = sum(1 for d in grid_days for p in grid_slots[d] if (em, d, p) not in unav)
        if int(s["length_periods"])*int(s["times_per_week"]) > free:
            return f"{em} has only {free} free periods in your grid but needs {int(s['length_periods'])*int(s['times_per_week'])}"
    return "no clash-free block found with current rooms/availability — loosen constraints or add rooms"

if __name__ == "__main__":
    sys.exit(main())
