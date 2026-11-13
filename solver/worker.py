"""Wakati solver worker: polls solve_jobs, runs the CP-SAT solver, writes draft versions.

Usage:
  set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
  python solver/worker.py [--once] [--time-limit 60] [--poll 10]

--once runs a single pass (one queued job max) then exits. Default loops forever.
Requires: ortools, supabase (pip install ortools supabase).

Loop per job:
  1. claim oldest queued job (status -> running, progress 5)
  2. read semester inputs (periods, rooms, sessions, session_courses, cohorts,
     cohort_courses, students, elective_choices, lecturer_availability, blocked_slots,
     semester_rules) and feed them to solve.py's model via temp CSVs
  3. run solver -> placements JSON
  4. create timetable_versions row (draft), insert placements
  5. job -> done (progress 100, quality_score, conflict_report, version_id)
     or -> failed (error text)
Safety: never touches published versions; always creates a new draft.
"""
import argparse, csv, json, os, subprocess, sys, tempfile, time, traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent

def need(name):
    v = os.environ.get(name)
    if not v:
        print(f"missing env {name}", file=sys.stderr); sys.exit(1)
    return v

def sb_client():
    from supabase import create_client
    return create_client(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"))

def rows_csv(path, rows, fields):
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({f: r.get(f, "") for f in fields})

def table(sb, name, **eq):
    q = sb.table(name).select("*")
    for k, v in eq.items():
        q = q.eq(k, v)
    out, pages = [], 0
    while True:
        r = q.range(pages * 1000, pages * 1000 + 999).execute()
        out.extend(r.data or [])
        if len(r.data or []) < 1000:
            break
        pages += 1
    return out

def claim_job(sb):
    r = sb.table("solve_jobs").select("*").eq("status", "queued").order("created_at").limit(1).execute()
    jobs = r.data or []
    if not jobs:
        return None
    job = jobs[0]
    u = sb.table("solve_jobs").update({"status": "running", "progress": 5}).eq("id", job["id"]).eq("status", "queued").execute()
    if not (u.data or []):
        return None  # someone else claimed it
    return job

def build_csvs(sb, job, tmp):
    sem_id = job["semester_id"]
    uni_id = job["university_id"]
    rooms = table(sb, "rooms", university_id=uni_id)
    sessions = table(sb, "sessions", semester_id=sem_id)
    sc = table(sb, "session_courses")
    sc = [r for r in sc if r["session_id"] in {s["id"] for s in sessions}]
    cohorts = table(sb, "cohorts", university_id=uni_id)
    cc = table(sb, "cohort_courses")
    students = table(sb, "students", university_id=uni_id)
    ec = table(sb, "elective_choices", semester_id=sem_id)
    avail = table(sb, "lecturer_availability", semester_id=sem_id)
    blocked = table(sb, "blocked_slots", semester_id=sem_id)
    periods = table(sb, "periods", semester_id=sem_id)

    lecturers = {l["id"]: l for l in table(sb, "lecturers", university_id=uni_id)}
    courses = {c["id"]: c for c in table(sb, "courses", university_id=uni_id)}
    programmes = {p["id"]: p for p in table(sb, "programmes", university_id=uni_id)}

    rows_csv(tmp / "rooms.csv", rooms, ["code", "capacity", "type"])
    sess_rows = []
    for s in sessions:
        lect = lecturers.get(s.get("lecturer_id") or "")
        sess_rows.append({
            "session_key": s["session_key"],
            "lecturer_email": (lect or {}).get("email", ""),
            "length_periods": s["length_periods"],
            "times_per_week": s["times_per_week"],
            "required_room_type": s["required_room_type"],
            "expected_students": s["expected_students"],
            "group_label": s.get("group_label") or "",
            "component": s.get("component") or "theory",
        })
    rows_csv(tmp / "sessions.csv", sess_rows,
             ["session_key", "lecturer_email", "length_periods", "times_per_week",
              "required_room_type", "expected_students", "group_label", "component"])
    rows_csv(tmp / "session_courses.csv",
             [{"session_key": next((s["session_key"] for s in sessions if s["id"] == r["session_id"]), ""),
               "course_code": (courses.get(r["course_id"]) or {}).get("code", "")} for r in sc],
             ["session_key", "course_code"])
    # cohort rows (needs cohort -> programme + level)
    cohort_by_id = {c["id"]: c for c in cohorts}
    cc_rows = []
    for r in cc:
        ch = cohort_by_id.get(r["cohort_id"], {})
        prog = programmes.get(ch.get("programme_id") or {}, {})
        cc_rows.append({"programme_code": prog.get("code", ""), "level": ch.get("level", ""),
                        "course_code": (courses.get(r["course_id"]) or {}).get("code", "")})
    rows_csv(tmp / "cohort_courses.csv", cc_rows, ["programme_code", "level", "course_code"])
    stu_by_id = {s["id"]: s for s in students}
    rows_csv(tmp / "elective_choices.csv",
             [{"student_index": (stu_by_id.get(r["student_id"]) or {}).get("index_number", r["student_id"]),
               "course_code": (courses.get(r["course_id"]) or {}).get("code", "")} for r in ec],
             ["student_index", "course_code"])
    rows_csv(tmp / "lecturer_availability.csv",
             [{"lecturer_email": (lecturers.get(r["lecturer_id"]) or {}).get("email", ""),
               "day_of_week": r["day_of_week"], "period_index": r["period_index"],
               "status": r["status"]} for r in avail],
             ["lecturer_email", "day_of_week", "period_index", "status"])
    rooms_by_id = {r["id"]: r for r in rooms}
    rows_csv(tmp / "blocked_slots.csv",
             [{"day_of_week": r["day_of_week"], "period_index": r["period_index"],
               "room_code": (rooms_by_id.get(r.get("room_id") or "") or {}).get("code", "")} for r in blocked],
             ["day_of_week", "period_index", "room_code"])
    rows_csv(tmp / "periods.csv", periods, ["day_of_week", "period_index", "start_time", "end_time"])
    return {"sessions": sessions, "rooms_by_code": {r["code"]: r for r in rooms},
            "lect_by_email": {(l.get("email") or ""): l for l in lecturers.values()}}

def run_solver(tmp, time_limit):
    out = tmp / "placements.json"
    p = subprocess.run([sys.executable, "-I", str(HERE / "solve.py"), str(tmp),
                        "--time-limit", str(time_limit), "--out", str(out)],
                       capture_output=True, text=True)
    data = json.loads(out.read_text()) if out.exists() else {"placed": [], "unplaced": [],
        "score": 0, "status": "FAILED", "fatal": [p.stderr[-2000:] or p.stdout[-2000:] or "solver produced no output"]}
    return data

def apply_result(sb, job, ctx, result):
    sem_id, uni_id = job["semester_id"], job["university_id"]
    if result.get("fatal"):
        sb.table("solve_jobs").update({"status": "failed", "progress": 100,
            "error": "; ".join(result["fatal"])}).eq("id", job["id"]).execute()
        # restore semester to review if versions exist, else setup
        v = sb.table("timetable_versions").select("id", count="exact").eq("semester_id", sem_id).limit(1).execute()
        sb.table("semesters").update(
            {"status": "review" if (v.count or 0) > 0 else "setup"}
        ).eq("id", sem_id).execute()
        return
    # new draft version
    v = sb.table("timetable_versions").insert({
        "university_id": uni_id, "semester_id": sem_id, "status": "draft",
        "quality_score": result.get("score", 0),
        "notes": f"solver {result.get('status', '')}, {len(result.get('placed', []))} placed",
    }).execute()
    version_id = v.data[0]["id"]
    rooms_by_code = ctx["rooms_by_code"]
    sess_by_key = {s["session_key"]: s for s in ctx["sessions"]}
    # solver emits one placement per session occurrence; insert as-is
    prows = []
    for p in result.get("placed", []):
        s = sess_by_key.get(p["session_key"])
        room = rooms_by_code.get(p["room"])
        if not s or not room:
            continue
        prows.append({
            "university_id": uni_id, "version_id": version_id, "session_id": s["id"],
            "day_of_week": p["day"], "start_period": p["start_period"], "room_id": room["id"],
        })
    if prows:
        sb.table("placements").insert(prows).execute()
    conflicts = [{"session_key": u["session_key"], "reason": u.get("reason", "")} for u in result.get("unplaced", [])]
    sb.table("solve_jobs").update({"status": "done", "progress": 100,
        "quality_score": result.get("score", 0), "conflict_report": conflicts,
        "version_id": version_id}).eq("id", job["id"]).execute()
    sb.table("semesters").update({"status": "review"}).eq("id", sem_id).execute()
    # audit entry
    sb.table("change_log").insert({
        "university_id": uni_id, "version_id": version_id, "actor": job.get("created_by"),
        "action": f"Solve job finished: {result.get('status', '')}, score {result.get('score', 0)}, "
                  f"{len(result.get('placed', []))} placed, {len(conflicts)} unplaced",
    }).execute()

def process_one(sb, time_limit):
    job = claim_job(sb)
    if not job:
        return False
    print(f"claimed job {job['id']} semester {job['semester_id']}", flush=True)
    try:
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td)
            ctx = build_csvs(sb, job, tmp)
            sb.table("solve_jobs").update({"progress": 15}).eq("id", job["id"]).execute()
            result = run_solver(tmp, time_limit)
            sb.table("solve_jobs").update({"progress": 90}).eq("id", job["id"]).execute()
        apply_result(sb, job, ctx, result)
        print(f"job {job['id']} done: {result.get('status')} score {result.get('score')}", flush=True)
    except Exception:
        err = traceback.format_exc()[-3000:]
        print(f"job {job['id']} failed:\n{err}", flush=True)
        sb.table("solve_jobs").update({"status": "failed", "progress": 100, "error": err}).eq("id", job["id"]).execute()
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--time-limit", type=int, default=60)
    ap.add_argument("--poll", type=int, default=10)
    a = ap.parse_args()
    sb = sb_client()
    print("worker up, polling for queued jobs…", flush=True)
    while True:
        try:
            worked = process_one(sb, a.time_limit)
        except Exception:
            traceback.print_exc()
            worked = False
        if a.once:
            return
        time.sleep(0 if worked else a.poll)

if __name__ == "__main__":
    main()
