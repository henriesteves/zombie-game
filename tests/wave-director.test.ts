import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WAVE_CALM_MS, WAVE_FIGHT_MS } from "../src/config";
import { WaveDirector, modifierFor, pickSpawnKind } from "../src/waves/wave-director";

describe("WaveDirector", () => {
  it("opens the calm after the fight, then starts wave 2 with runners", () => {
    const director = new WaveDirector();
    assert.equal(director.advance(WAVE_FIGHT_MS - 1), null);
    assert.equal(director.wave, 1);
    assert.equal(director.advance(1), "calm-started");
    assert.equal(director.wave, 1);
    assert.equal(director.phase, "calm");
    assert.equal(director.advance(WAVE_CALM_MS), "fight-started");
    assert.equal(director.wave, 2);
    assert.equal(director.modifier, "runners");
    assert.equal(modifierFor(3), "brute");
    assert.equal(modifierFor(4), "alarms");
    director.advance(WAVE_FIGHT_MS);
    assert.equal(director.advance(WAVE_CALM_MS), "fight-started");
    assert.equal(director.wave, 3);
    assert.equal(director.modifier, "brute");
    director.advance(WAVE_FIGHT_MS);
    assert.equal(director.advance(WAVE_CALM_MS), "fight-started");
    assert.equal(director.wave, 4);
    assert.equal(director.modifier, "alarms");
  });
});

describe("pickSpawnKind", () => {
  it("returns walker, brute, and runner for the locked rolls", () => {
    assert.equal(pickSpawnKind(1, "clear", 0.5), "walker");
    assert.equal(pickSpawnKind(3, "brute", 0.1), "brute");
    assert.equal(pickSpawnKind(2, "runners", 0.2), "runner");
  });
});
