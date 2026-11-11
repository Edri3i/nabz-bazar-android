import asyncio, pathlib, sys
from playwright.async_api import async_playwright
SB = pathlib.Path(r"D:\claude\nabz-bazar\storyboard")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await (await b.new_context(viewport={"width": 1720, "height": 1000}, device_scale_factor=1.6)).new_page()
        await pg.goto((SB / "widget.html").as_uri()); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelector('#gridL .w').style.boxShadow='none'")
        await pg.locator("#gridL .w").first.screenshot(path=sys.argv[1], omit_background=True); await b.close(); print("ok")
asyncio.run(main())
