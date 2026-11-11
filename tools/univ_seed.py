"""Writes a fallback list of the top 500 coins (CoinGecko) into the app, for when CoinGecko rate-limits.
Usage: python -I univ_seed.py <out.js>"""
import json, sys, time, urllib.request
out = []
for page in (1, 2):
    for k in range(4):
        try:
            req = urllib.request.Request(f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page={page}&sparkline=false", headers={"user-agent": "Mozilla/5.0"})
            out += json.loads(urllib.request.urlopen(req, timeout=30).read()); break
        except Exception as e:
            print("retry", page, e); time.sleep(25)
    time.sleep(3)
rows = [[c["id"], c["symbol"].upper(), c["name"], c.get("market_cap_rank") or 0] for c in out]
open(sys.argv[1], "w", encoding="utf-8").write("window.UNIV_SEED=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("ok", len(rows))
