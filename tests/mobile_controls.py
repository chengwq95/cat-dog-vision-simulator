"""Run with python tests/mobile_controls.py after installing Playwright and its Chromium.

An optional URL selects a served copy of the game. CHROMIUM_PATH selects a system browser.
"""

import os
import sys
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright


def center(locator):
    box = locator.bounding_box()
    return box["x"] + box["width"] / 2, box["y"] + box["height"] / 2


def run(url):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH"),
            args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        )
        page = browser.new_page(
            viewport={"width": 320, "height": 568}, is_mobile=True, has_touch=True
        )
        page.set_default_timeout(60000)
        session = page.context.new_cdp_session(page)

        def touch(event, *points):
            session.send("Input.dispatchTouchEvent", {
                "type": event,
                "touchPoints": [{"id": finger, "x": x, "y": y} for finger, x, y in points],
            })

        if url is None:
            game = Path(__file__).resolve().parents[1] / "index.html"
            url = "http://game.test/"
            page.route(url, lambda route: route.fulfill(path=game, content_type="text/html; charset=utf-8"))

            def serve_three(route):
                with urlopen(route.request.url, timeout=30) as source:
                    route.fulfill(body=source.read(), content_type="application/javascript")

            page.route("https://cdnjs.cloudflare.com/ajax/libs/three.js/**", serve_three)
        page.goto(url)
        page.wait_for_function("window.__cat && document.querySelectorAll('#todo-list li').length")
        page.locator("#go").tap()
        page.wait_for_function("__cat.S.started")
        joy = page.locator("#joy")
        x, y = center(joy)
        thumb = (1, x, y - 38)
        extra = (2, x + 30, y)
        touch("touchStart", thumb)
        touch("touchStart", thumb, extra)
        assert page.evaluate("__cat.S.joy.y < -0.5 && Math.abs(__cat.S.joy.x) < 0.05")
        touch("touchEnd", extra)
        assert page.evaluate("__cat.S.joy.y < -0.5")

        yaw = page.evaluate("__cat.S.yaw")
        touch("touchStart", thumb, (2, 215, 245))
        touch("touchMove", thumb, (2, 250, 245))
        page.wait_for_function("yaw => Math.abs(__cat.S.yaw - yaw) > 0.1", arg=yaw)
        assert page.evaluate("__cat.S.joy.y < -0.5")
        touch("touchCancel")
        assert page.evaluate("__cat.S.joy.x === 0 && __cat.S.joy.y === 0")

        page.locator("#t-controls").tap()
        page.locator("#e-split").tap()
        knob = center(page.locator("#split .knob"))
        touch("touchStart", (3, *knob))
        touch("touchMove", (3, x, knob[1]))
        touch("touchEnd")
        page.wait_for_function("x => Math.abs(__cat.S.split * innerWidth - x) < 2", arg=x)
        touch("touchStart", thumb)
        assert page.evaluate("__cat.S.joy.y < -0.5")
        page.set_viewport_size({"width": 568, "height": 320})
        page.wait_for_function("__cat.S.joy.y === 0")
        touch("touchEnd")

        page.locator("#t-info").tap()
        for selector in ("#pick-cat", "#pick-dog", "#go"):
            assert page.locator(selector).evaluate("""el => {
                const r = el.getBoundingClientRect();
                return r.top >= 0 && r.bottom <= innerHeight &&
                    el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
            }"""), selector
        page.locator("#go").tap()
        page.wait_for_function("document.getElementById('modal').hidden")
        browser.close()


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else None)
