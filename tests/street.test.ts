import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STREET_LEFT, STREET_RIGHT, WORLD_H, WORLD_W } from "../src/config";
import { placeStreetProps, streetBlocks } from "../src/world/street";

describe("streetBlocks", () => {
  it("keeps every building outside the street band", () => {
    for (const block of streetBlocks()) {
      const left = block.x - block.width / 2;
      const right = block.x + block.width / 2;
      const invadesStreet = left < STREET_RIGHT && right > STREET_LEFT;
      assert.equal(invadesStreet, false);
    }
  });

  it("slides cars along the curb and keeps the next roll in a different place", () => {
    const low = placeStreetProps(() => 0.15);
    const high = placeStreetProps(() => 0.85);
    const centerX = WORLD_W / 2;
    const centerY = WORLD_H / 2;
    assert.ok(low.cars.some((car, index) => car.y !== high.cars[index].y));
    for (const car of low.cars) {
      const onLeftCurb = car.x === STREET_LEFT + 86;
      const onRightCurb = car.x === STREET_RIGHT - 86;
      assert.equal(onLeftCurb || onRightCurb, true);
      assert.ok(car.y > 80 && car.y < WORLD_H - 80);
    }
    for (const barrel of low.barrels) {
      assert.ok(barrel.x > STREET_LEFT && barrel.x < STREET_RIGHT);
      assert.ok(Math.hypot(barrel.x - centerX, barrel.y - centerY) >= 200);
    }
  });
});
