import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { traceLaser, type LaserBlockers } from "../src/combat/laser-ray";
import { LASER_BARREL_RADIUS, LASER_RANGE, ZOMBIES } from "../src/config";

const RIGHT = { x: 1, y: 0 };
const ORIGIN = { x: 0, y: 0 };

function emptyBlockers(): LaserBlockers {
  return { buildings: [], cars: [], barrels: [], zombies: [] };
}

describe("traceLaser", () => {
  it("stops on a wall face instead of the next sample step", () => {
    const open = traceLaser(ORIGIN, RIGHT, emptyBlockers());
    assert.equal(open.x, LASER_RANGE);
    assert.equal(open.y, 0);
    const wallFace = 83;
    const hit = traceLaser(ORIGIN, RIGHT, {
      ...emptyBlockers(),
      buildings: [{ x: wallFace + 10, y: 0, active: true, displayWidth: 20, displayHeight: 40 }],
    });
    assert.equal(hit.x, wallFace);
    assert.equal(hit.y, 0);
  });

  it("keeps the nearest blocker and ignores inactive ones", () => {
    const walkerR = ZOMBIES.walker.radius;
    const hit = traceLaser(ORIGIN, RIGHT, {
      buildings: [{ x: 200, y: 0, active: true, displayWidth: 20, displayHeight: 40 }],
      cars: [{ x: 40, y: 0, active: false, displayWidth: 20, displayHeight: 20 }],
      barrels: [{ x: 0, y: 80, active: true }],
      zombies: [{ x: 50, y: 0, active: true, kind: "walker" }],
    });
    assert.equal(hit.x, 50 - walkerR);
    assert.equal(hit.y, 0);
    const missBarrel = traceLaser(ORIGIN, RIGHT, {
      ...emptyBlockers(),
      barrels: [{ x: 0, y: LASER_BARREL_RADIUS + 8, active: true }],
    });
    assert.equal(missBarrel.x, LASER_RANGE);
  });
});
