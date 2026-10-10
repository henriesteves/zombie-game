import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SPAWN_VIEW_MARGIN, VIEW_H, VIEW_W } from "../src/config";
import { isOutsideSpawnView } from "../src/spawn/offscreen-point";

describe("spawn view", () => {
  it("marks a point outside the camera margin and keeps the center inside", () => {
    const scrollX = 400;
    const scrollY = 280;
    const outside = { x: scrollX - SPAWN_VIEW_MARGIN - 8, y: scrollY + 40 };
    const inside = { x: scrollX + VIEW_W / 2, y: scrollY + VIEW_H / 2 };
    assert.equal(isOutsideSpawnView(outside.x, outside.y, scrollX, scrollY), true);
    assert.equal(isOutsideSpawnView(inside.x, inside.y, scrollX, scrollY), false);
  });
});
