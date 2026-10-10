import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OFFSCREEN_ARROW_CAP, OFFSCREEN_ARROW_INSET, VIEW_H, VIEW_W } from "../src/config";
import { selectOffscreenArrows } from "../src/fx/offscreen-arrows";

const view = {
  scrollX: 0,
  scrollY: 0,
  viewWidth: VIEW_W,
  viewHeight: VIEW_H,
  inset: OFFSCREEN_ARROW_INSET,
  cap: OFFSCREEN_ARROW_CAP,
};

describe("offscreen arrows", () => {
  it("skips a zombie inside the camera and pins the others to the near edge", () => {
    const arrows = selectOffscreenArrows({
      ...view,
      threats: [
        { x: 400, y: 300 },
        { x: 2000, y: VIEW_H / 2 },
        { x: VIEW_W / 2, y: -240 },
      ],
    });
    assert.equal(arrows.length, 2);
    const right = arrows.find((arrow) => arrow.x > VIEW_W / 2);
    const top = arrows.find((arrow) => arrow.y < VIEW_H / 2);
    assert.ok(right);
    assert.ok(top);
    assert.ok(Math.abs(right.x - (VIEW_W - OFFSCREEN_ARROW_INSET)) < 1);
    assert.ok(Math.abs(top.y - OFFSCREEN_ARROW_INSET) < 1);
    assert.ok(right.angle < 0.2);
    assert.ok(top.angle < -1);
  });

  it("keeps only the nearest threats up to the cap", () => {
    const threats = [];
    for (let index = 0; index < OFFSCREEN_ARROW_CAP + 4; index += 1) {
      threats.push({ x: -100 - index * 40, y: VIEW_H / 2 });
    }
    const arrows = selectOffscreenArrows({ ...view, threats, cap: 3 });
    assert.equal(arrows.length, 3);
  });

  it("colors a walker and a spitter in the same spot differently, and skips one on screen", () => {
    const [walker] = selectOffscreenArrows({ ...view, threats: [{ x: -200, y: VIEW_H / 2, kind: "walker" }] });
    const [spitter] = selectOffscreenArrows({ ...view, threats: [{ x: -200, y: VIEW_H / 2, kind: "spitter" }] });
    assert.ok(walker && spitter);
    assert.equal(walker.x, spitter.x);
    assert.equal(walker.y, spitter.y);
    assert.notEqual(walker.color, spitter.color);
    const inside = selectOffscreenArrows({ ...view, threats: [{ x: 300, y: 300, kind: "spitter" }] });
    assert.equal(inside.length, 0);
  });
});
