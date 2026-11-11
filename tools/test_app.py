"""Runs the app's web UI in desktop Chrome at phone size with live data.
External requests are fetched by Playwright and returned with CORS headers (the Android app does this natively).
Usage: python -I test_app.py <outdir> [steps...]"""
import asyncio, pathlib, sys, time
from playwright.async_api import async_playwright

WWW = pathlib.Path(__file__).resolve().parent.parent / "app" / "src" / "main" / "assets" / "www"
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
steps = sys.argv[2:] or ["home", "home-scroll", "sheet-btc", "iran", "smart", "smart-scroll", "news", "rsi", "dark"]
CORS = {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,OPTIONS"}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, color_scheme="light")
        pg = await ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
        times = {}
        async def handle(route):
            req = route.request
            if req.method == "OPTIONS":
                await route.fulfill(status=204, headers=CORS); return
            t = time.time()
            try:
                r = await route.fetch(timeout=30000)
                body = await r.body()
                h = {k: v for k, v in r.headers.items() if k.lower() not in ("content-encoding", "content-length", "transfer-encoding")}
                h.update(CORS)
                times[req.url[:90]] = (round(time.time() - t, 2), r.status, len(body))
                await route.fulfill(status=r.status, headers=h, body=body)
            except Exception as e:
                times[req.url[:90]] = (round(time.time() - t, 2), "ERR", 0)
                await route.abort()
        await ctx.route("http*://**/*", handle)
        await pg.goto((WWW / "index.html").as_uri())
        await pg.wait_for_timeout(9000)
        for s in steps:
            if s == "home": pass
            elif s == "home-scroll": await pg.evaluate("document.querySelector('.scr.on .cnt').scrollTo(0,700)")
            elif s == "sheet-btc": await pg.evaluate("NB.App.open('c:bitcoin')"); await pg.wait_for_timeout(3500)
            elif s in ("iran", "smart", "news", "rsi", "home2"):
                await pg.evaluate("NB.App.closeSheet(true)")
                await pg.evaluate(f"NB.App.show('{s.replace('2','')}')"); await pg.wait_for_timeout(9000 if s != "rsi" else 45000)
            elif s == "smart-scroll": await pg.evaluate("document.querySelector('.scr.on .cnt').scrollTo(0,900)")
            elif s == "smart-scroll2": await pg.evaluate("document.querySelector('.scr.on .cnt').scrollTo(0,1900)")
            elif s == "dark": await pg.evaluate("localStorage.setItem('set:theme','dark');NB.App.applyTheme(false);NB.App.show('home')"); await pg.wait_for_timeout(1500)
            elif s.startswith("js:"): print("  js ->", ascii(await pg.evaluate(s[3:]))); await pg.wait_for_timeout(2500)
            await pg.wait_for_timeout(700)
            name = f"js{steps.index(s)}" if s.startswith("js:") else s
            await pg.screenshot(path=str(OUT / f"{name}.png"))
            print("shot", s, flush=True)
        print("--- errors:"); [print(" ", e[:200]) for e in errs[:30]]
        print("--- slow/failed requests:")
        for u, v in sorted(times.items(), key=lambda x: -x[1][0])[:25]:
            print(f"  {v[0]:>6}s {str(v[1]):>4} {v[2]:>9,}  {u}")
        print("total requests", len(times))
        await b.close()

asyncio.run(main())

