"""Writes the default Hyperliquid wallet list (top 40 by 30-day PnL) into the app, so the first launch
needs no 39 MB download. Usage: python -I hl_seed.py <out.js>"""
import json, sys, urllib.request
req = urllib.request.Request("https://stats-data.hyperliquid.xyz/Mainnet/leaderboard", headers={"user-agent": "Mozilla/5.0"})
lb = json.loads(urllib.request.urlopen(req, timeout=120).read())
rows = []
for r in lb["leaderboardRows"]:
    w = {x[0]: x[1] for x in r["windowPerformances"]}
    try:
        v, m, roi, at = float(r["accountValue"]), float(w["month"]["pnl"]), float(w["month"]["roi"]), float(w["allTime"]["pnl"])
    except Exception:
        continue
    # same filter as the original scanner: real accounts, profitable this month and overall
    if v >= 300000 and m > 0 and roi > 0 and at > 0:
        rows.append({"a": r["ethAddress"], "n": r.get("displayName"), "p": round(m), "v": round(v)})
rows.sort(key=lambda x: -x["p"])
open(sys.argv[1], "w", encoding="utf-8").write("window.HL_SEED=" + json.dumps(rows[:40], ensure_ascii=False) + ";\n")
print("ok", len(rows[:40]))
