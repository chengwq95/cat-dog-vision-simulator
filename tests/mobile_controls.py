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


def check_kitchen_greeting(page):
    # Step the simulation between samples so slow phone rendering cannot skip the reply.
    checks = page.evaluate("""() => {
        const {cat, owner, residents, S, setView, update} = window.__cat;
        const step = n => { for (let i = 0; i < n; i++) update(1 / 60); };
        const face = id => residents[id].rig.g.getObjectByName(id + '_skin');
        const smile = id => face(id).morphTargetInfluences[face(id).morphTargetDictionary.smile];
        const height = joint => joint.getWorldPosition(new THREE.Vector3()).y;
        step(70);
        cat.pos.set(-0.04, 0, -4.80);
        cat.vel.set(0, 0, 0);
        setView('1st');
        step(2);
        const yaw = S.yaw;
        const result = {prompt: __cat.findInteract()?.label === '向男主人打招呼'};
        document.getElementById('b-paw').dispatchEvent(new PointerEvent('pointerdown'));
        step(16);
        result.replyIsDelayed = smile('woman') > smile('man') + 0.06;
        step(61);
        const arm = owner.arms[0];
        result.freeHandRaised = height(arm.hand) > height(arm.el) + 0.10;
        result.bothSmile = smile('woman') > 0.5 && smile('man') > 0.5;
        result.utensilOnCounter = owner.knife2.visible && !owner.knife.visible;
        const angles = [];
        for (let i = 0; i < 30; i++) { angles.push(arm.hand.rotation.x); step(1); }
        result.wristMoves = Math.max(...angles) - Math.min(...angles) > 0.15;
        step(65);
        result.returnsToWork = owner.knife.visible && !owner.knife2.visible && residents.man.gesture === 0;
        result.cameraStaysPut = Math.abs(S.yaw - yaw) < 0.001;
        setView('3rd');
        return result;
    }""")
    assert all(checks.values()), checks


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
            scripts = {
                url + asset.relative_to(game.parent).as_posix(): asset
                for asset in (game.parent / "assets").rglob("*.js")
            }

            def serve_script(route):
                route.fulfill(path=scripts[route.request.url], content_type="application/javascript")

            page.route(url + "assets/**", serve_script)

            def serve_three(route):
                with urlopen(route.request.url, timeout=30) as source:
                    route.fulfill(body=source.read(), content_type="application/javascript")

            page.route("https://cdnjs.cloudflare.com/ajax/libs/three.js/**", serve_three)
        page.goto(url, wait_until="commit")
        page.wait_for_function(
            "window.__cat && document.querySelectorAll('#todo-list li').length", timeout=120000
        )
        assert page.evaluate("""Object.entries(__cat.residents).every(([id, {rig}]) => {
            const face = rig.g.getObjectByName(id + '_skin');
            return face?.isSkinnedMesh && face.morphTargetDictionary.blink !== undefined &&
                face.morphTargetDictionary.smile !== undefined && ['L', 'R'].every(side =>
                    ['hand', 'eye'].every(part => rig.g.getObjectByName(id + '_' + part + side)?.isBone));
        })""")
        assert page.evaluate("""['woman_long_hair', 'woman_floral_dress'].every(name =>
            __cat.residents.woman.rig.g.getObjectByName(name)?.isSkinnedMesh)""")
        assert page.locator("#game-title").inner_text() == page.title()
        assert page.locator("#modal .pick button").count() == 4
        page.locator("#go").tap()
        page.wait_for_function("__cat.S.started")
        # The old brand was clipped at 393 px and disappeared on smaller phones.
        for width in (393, 320):
            page.set_viewport_size({"width": width, "height": 568})
            for _ in range(2):
                assert page.locator("#brand b").inner_text() == page.title()
                assert page.locator("#brand").evaluate("""brand => {
                    const range = document.createRange();
                    range.selectNodeContents(brand.querySelector('b'));
                    const lines = Array.from(range.getClientRects());
                    const box = brand.getBoundingClientRect();
                    return lines.length > 0 && lines.every(line =>
                        line.width > 0 && line.left >= box.left - 0.5 &&
                        line.right <= box.right + 0.5 && line.bottom <= box.bottom + 0.5
                    ) && box.right <= document.getElementById('right').getBoundingClientRect().left;
                }""")
                page.locator("#t-lang").tap()
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
        for selector in ("#pick-cat", "#pick-dog", "#pick-man", "#pick-woman", "#go"):
            assert page.locator(selector).evaluate("""el => {
                const r = el.getBoundingClientRect();
                return r.top >= 0 && r.bottom <= innerHeight &&
                    el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
            }"""), selector
        page.locator("#pick-woman").tap()
        page.locator("#go").tap()
        page.wait_for_function("document.getElementById('modal').hidden")
        page.wait_for_function("__cat.S.role === 'woman' && __cat.S.vision === 'human'")
        assert page.locator("#todo-list li").count() == 5
        x, y = center(joy)
        start = page.evaluate("[__cat.cat.pos.x, __cat.cat.pos.z]")
        touch("touchStart", (1, x, y - 35))
        page.wait_for_function(
            "p => Math.hypot(__cat.cat.pos.x - p[0], __cat.cat.pos.z - p[1]) > 0.1",
            arg=start,
        )
        touch("touchEnd")
        # Start beside the resting cat, then use the same on-screen action as the player.
        page.evaluate("""() => {
            const {cat, rest} = __cat;
            cat.pos.set(rest.cat.x + 0.50, rest.cat.y, rest.cat.z);
            cat.vel.set(0, 0, 0);
        }""")
        page.wait_for_function("__cat.findInteract()?.label === '摸摸猫'")
        page.locator("#b-paw").tap()
        page.wait_for_function("document.getElementById('todo-count').textContent === '1/5'")
        check_kitchen_greeting(page)
        page.locator("#t-controls").tap()
        page.locator("#t-roles").tap()
        page.locator("#pick-man").tap()
        page.locator("#go").tap()
        page.wait_for_function("__cat.S.role === 'man'")
        assert page.locator("#todo-count").inner_text() == "2/5"
        page.locator("#t-controls").tap()
        page.locator("#t-roles").tap()
        page.locator("#pick-cat").tap()
        page.locator("#go").tap()
        page.wait_for_function("__cat.S.role === 'cat'")
        assert page.locator("#todo-list li").count() == 12
        browser.close()


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else None)
