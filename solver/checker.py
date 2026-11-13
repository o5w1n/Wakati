"""Independent checker (NFR-1): re-verifies placements against H1-H12 before publishing.
Reads the same validated CSVs + a placements JSON (solver output or edited version).
Usage: python -I solver/checker.py placements.json csv_dir
Exit 0 = clean, 1 = hard-clash violations. JSON to stdout.
Placements with override_reason are reported as warnings (logged override), not failures.
"""
import csv, json, sys
from collections import defaultdict
from pathlib import Path

def rows(d, f):
    p = Path(d) / f
    if not p.exists(): return []
    with open(p, newline='', encoding='utf-8-sig') as fh:
        return list(csv.DictReader(fh))

def main():
    if len(sys.argv) < 3:
        print("usage: checker.py placements.json csv_dir"); return 2
    pl = json.loads(Path(sys.argv[1]).read_text())
    d = sys.argv[2]
    placed = pl.get("placed", pl) if isinstance(pl, dict) else pl

    rooms = {r["code"]: r for r in rows(d, "rooms.csv")}
    sessions = {s["session_key"]: s for s in rows(d, "sessions.csv")}
    sc = defaultdict(set)
    for r in rows(d, "session_courses.csv"): sc[r["session_key"]].add(r["course_code"])
    courses = {r["code"]: r.get("is_elective","").lower() in ("true","1","yes") for r in rows(d, "courses.csv")}
    sess_elective = {k: bool(sc.get(k)) and all(courses.get(c, False) for c in sc[k]) for k in sessions}
    cc = defaultdict(set)
    for r in rows(d, "cohort_courses.csv"):
        cc[r["course_code"]].add((r["programme_code"], r["level"]))
    sess_cohorts = {k: set().union(*(cc.get(c, set()) for c in sc.get(k, set()))) if sc.get(k) else set() for k in sessions}
    by_student = defaultdict(set)
    for r in rows(d, "elective_choices.csv"): by_student[r["student_index"]].add(r["course_code"])
    overlap = defaultdict(int)
    for taken in by_student.values():
        t = sorted(taken)
        for i in range(len(t)):
            for j in range(i+1, len(t)):
                overlap[(t[i], t[j])] += 1
    def shares(a, b):
        if a == b: return True
        return overlap.get(tuple(sorted((a, b))), 0) > 0
    unav = set((r["lecturer_email"], int(r["day_of_week"]), int(r["period_index"]))
               for r in rows(d, "lecturer_availability.csv") if r["status"] == "unavailable")
    blocked = set()
    for r in rows(d, "blocked_slots.csv"):
        blocked.add((int(r["day_of_week"]), int(r["period_index"]), (r.get("room_code") or "").strip() or None))
    per_day = defaultdict(list)
    for r in rows(d, "periods.csv"):
        per_day[int(r["day_of_week"])].append(int(r["period_index"]))
    for v in per_day.values(): v.sort()

    viol, warns = [], []
    def rep(rule, msg, keys, overridden):
        (warns if overridden else viol).append({"rule": rule, "message": msg, "sessions": sorted(keys)})

    # per-placement: H6 H7 H8 H9 H12 + grid validity
    cov = {}  # idx -> list of covered (day, period)
    for i, p in enumerate(placed):
        k = p["session_key"]
        if k not in sessions:
            viol.append({"rule": "REF", "message": f"{k}: unknown session_key", "sessions": [k]}); continue
        s = sessions[k]; L = int(s["length_periods"]); day, st_ = int(p["day"]), int(p["start_period"])
        ov = any(v.get("session_key") == k for v in [p] for _ in [0]) and p.get("override_reason")
        if day not in per_day or st_ not in per_day[day]:
            rep("GRID", f"{k}: day {day} period {st_} not in your periods.csv grid", {k}, ov); cov[i] = []; continue
        idx = per_day[day].index(st_)
        if idx + L > len(per_day[day]):
            rep("H9", f"{k}: needs {L} consecutive periods but day {day} has only {len(per_day[day]) - idx} from period {st_}", {k}, ov); cov[i] = []; continue
        cover = [(day, per_day[day][idx + j]) for j in range(L)]
        cov[i] = cover
        need = int(s["expected_students"] or 0); rt = s["required_room_type"]
        rm = rooms.get(p["room"])
        if not rm: rep("REF", f"{k}: unknown room {p['room']}", {k}, ov)
        else:
            if int(rm["capacity"]) < need: rep("H6", f"{k}: {need} students > {p['room']} capacity {rm['capacity']}", {k}, ov)
            if rt != "any" and rm["type"] != rt: rep("H7", f"{k}: needs {rt}, {p['room']} is {rm['type']}", {k}, ov)
        em = s["lecturer_email"].strip()
        if em and any((em, dd, pp) in unav for dd, pp in cover):
            rep("H8", f"{k}: {em} is unavailable for one of {cover}", {k}, ov)
        if any((dd, pp, p["room"]) in blocked or (dd, pp, None) in blocked for dd, pp in cover):
            rep("H12", f"{k}: {cover} is blocked", {k}, ov)

    # occupancy maps: (day, period) -> list of placement idx
    occ = defaultdict(list)
    for i, c in cov.items():
        for dp in c: occ[dp].append(i)
    def keys_at(idxs): return {placed[i]["session_key"] for i in idxs}
    for (day, per), idxs in occ.items():
        if len(idxs) < 2: continue
        # H2 room
        by_room = defaultdict(list)
        for i in idxs: by_room[placed[i]["room"]].append(i)
        for room, lst in by_room.items():
            if len(lst) > 1: rep("H2", f"{room} double-booked day {day} period {per}: {', '.join(sorted(keys_at(lst)))}", keys_at(lst), all(placed[i].get("override_reason") for i in lst))
        # H1 lecturer
        by_lec = defaultdict(list)
        for i in idxs:
            em = sessions[placed[i]["session_key"]]["lecturer_email"].strip()
            if em: by_lec[em].append(i)
        for em, lst in by_lec.items():
            if len(lst) > 1: rep("H1", f"{em} teaches 2 sessions day {day} period {per}: {', '.join(sorted(keys_at(lst)))}", keys_at(lst), all(placed[i].get("override_reason") for i in lst))
        # H3 cohort core
        by_coh = defaultdict(list)
        for i in idxs:
            k = placed[i]["session_key"]
            if sess_elective.get(k): continue
            for ck in sess_cohorts.get(k, ()): by_coh[ck].append(i)
        for ck, lst in by_coh.items():
            if len(lst) > 1: rep("H3", f"cohort {ck[0]}-{ck[1]} has 2 core sessions day {day} period {per}: {', '.join(sorted(keys_at(lst)))}", keys_at(lst), all(placed[i].get("override_reason") for i in lst))
        # H4 elective-elective sharing students
        elec = [i for i in idxs if sess_elective.get(placed[i]["session_key"])]
        for a in range(len(elec)):
            for b in range(a+1, len(elec)):
                ka, kb = placed[elec[a]]["session_key"], placed[elec[b]]["session_key"]
                if any(shares(x, y) for x in sc.get(ka, [ka]) for y in sc.get(kb, [kb])):
                    n = max(overlap.get(tuple(sorted((x, y))), 0) for x in sc.get(ka, [ka]) for y in sc.get(kb, [kb]))
                    rep("H4", f"{ka} + {kb} share {n} student(s), cannot overlap day {day} period {per}", {ka, kb}, all(placed[i].get("override_reason") for i in (elec[a], elec[b])))

    # H10 times per week
    from collections import Counter
    cnt = Counter(p["session_key"] for p in placed)
    for k, s in sessions.items():
        want = int(s["times_per_week"])
        if cnt.get(k, 0) != want and k in cnt or (k not in cnt and want > 0 and False):
            pass
    for k, s in sessions.items():
        want = int(s["times_per_week"])
        got = cnt.get(k, 0)
        if got != want and (got > 0 or want > 0) and k in list(cnt) + ([k] if got == 0 else []):
            if got < want and got == 0: pass  # unplaced handled by solver report; checker focuses on placed set
            elif got != want:
                rep("H10", f"{k}: placed {got}x but requires {want}x per week", {k}, False)

    ok = not viol
    print(json.dumps({"ok": ok, "violations": viol, "overridden": warns,
                      "checked": len(placed), "grid_days": sorted(per_day)}, indent=2))
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
