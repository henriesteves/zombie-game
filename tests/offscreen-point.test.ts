import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STREET_LEFT, STREET_RIGHT, VIEW_H, VIEW_W, WORLD_H, WORLD_W } from "../src/config";
import { pickOffscreenPoint } from "../src/spawn/offscreen-point";

const SAMPLE_COUNT = 40;

describe("pickOffscreenPoint", () => {
  it("drops forty points on the street and outside the centered camera", () => {
    const scrollX = WORLD_W / 2 - VIEW_W / 2;
    const scrollY = WORLD_H / 2 - VIEW_H / 2;
    const cameraRight = scrollX + VIEW_W;
    const cameraBottom = scrollY + VIEW_H;
    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const point = pickOffscreenPoint(scrollX, scrollY);
      assert.ok(point, "expected a spawn point");
      assert.ok(point.x >= STREET_LEFT && point.x <= STREET_RIGHT);
      const outsideCamera = point.x < scrollX || point.x > cameraRight || point.y < scrollY || point.y > cameraBottom;
      assert.equal(outsideCamera, true);
    }
  });
});
