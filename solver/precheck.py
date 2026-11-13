"""Pre-check impossible inputs before solving (FR-2.6, FR-7.7). stdlib only.
Usage: python -I solver/precheck.py imports/templates
Reads validated CSVs, prints JSON {fatal[], warnings[], ok}.
Fatal = generation cannot succeed; warnings = risky but solvable.
"""
import csv, json, sys
from pathlib import Path
from collections import defaultdict

def rows(d, f):
    p = Path(d) / f
    with open(p, newline='', encoding='utf-8-sig') as fh:
        return list(csv.DictReader(fh))

def main(d):
    fatal, warnings = [], []
    rooms = rows(d, "rooms.csv")
    sessions = rows(d, "sessions.csv")
    avail = rows(d, "lecturer_availability.csv")
    max_cap = defaultdict(int)
    for r in rooms:
        try: max_cap[r["type"]] = max(max_cap[r["type"]], int(r["capacity"]))
        except ValueError: pass
    labs = [r for r in rooms if r["type"] == "computer_lab"]
    for s in sessions:
        need = int(s["expected_students"] or 0); rt = s["required_room_type"]; k = s["session_key"]
        pool = max_cap["lecture"] if rt == "lecture" else max_cap.get(rt, max(max_cap.values(), default=0)) if rt == "any" else max_cap.get(rt, 0)
        if need > pool:
            fatal.append(f"{k}: needs {need} seats but largest {rt} room holds {pool} (H6 impossible)")
        if s["component"] == "practical" and rt == "computer_lab" and not labs:
            fatal.append(f"{k}: practical needs lab but no computer_lab rooms exist (H7)")
    # lecturer load vs availability (free = periods in THEIR periods.csv grid minus unavailable)
    grid = {(r["day_of_week"].strip(), r["period_index"].strip()) for r in rows(d, "periods.csv")}
    load = defaultdict(int)
    for s in sessions:
        em = s["lecturer_email"].strip()
        if em: load[em] += int(s["length_periods"]) * int(s["times_per_week"])
    unav = defaultdict(set)
    for a in avail:
        if a["status"] == "unavailable": unav[a["lecturer_email"]].add((a["day_of_week"].strip(), a["period_index"].strip()))
    for em, hrs in load.items():
        free = len(grid - unav.get(em, set()))
        if hrs > free:
            fatal.append(f"{em}: must teach {hrs} periods but only {free} available (H8/H10 impossible)")
        elif hrs > free * 0.8:
            warnings.append(f"{em}: teaches {hrs}/{free} free periods — tight, little room for preferences")
    # TBA + elective coverage
    for s in sessions:
        if not s["lecturer_email"].strip():
            warnings.append(f"{s['session_key']}: TBA lecturer — solver places it, flag for staffing")
    try:
        choices = rows(d, "elective_choices.csv")
        taken = {r["course_code"] for r in choices}
        for s in sessions:
            for sc in rows(d, "session_courses.csv"):
                if sc["session_key"] == s["session_key"] and sc["course_code"] not in taken:
                    pass  # core course, fine
    except FileNotFoundError:
        pass
    print(json.dumps({"fatal": fatal, "warnings": warnings, "ok": not fatal}, indent=2))
    return 1 if fatal else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "imports/templates"))
