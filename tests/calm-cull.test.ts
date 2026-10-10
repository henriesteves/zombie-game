import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SPAWN_VIEW_MARGIN, VIEW_H, VIEW_W, WAVE_FIGHT_MS } from "../src/config";
import { isOutsideSpawnView } from "../src/spawn/offscreen-point";
import { WaveDirector } from "../src/waves/wave-director";

describe("calm cull", () => {
  it("deactivates a zombie outside the view and keeps one inside when calm starts", () => {
    const director = new WaveDirector();
    assert.equal(director.advance(WAVE_FIGHT_MS), "calm-started");
    const scrollX = 400;
    const scrollY = 280;
    const outside = { x: scrollX - SPAWN_VIEW_MARGIN - 8, y: scrollY + 40, active: true };
    const inside = { x: scrollX + VIEW_W / 2, y: scrollY + VIEW_H / 2, active: true };
    for (const zombie of [outside, inside]) {
      if (!isOutsideSpawnView(zombie.x, zombie.y, scrollX, scrollY)) continue;
      zombie.active = false;
    }
    assert.equal(outside.active, false);
    assert.equal(inside.active, true);
    assert.equal(director.phase, "calm");
  });
});
