import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALARM_EXTRA_CAP, WAVE_CALM_MS, WAVE_FIGHT_MS } from "../src/config";
import { WaveDirector, calmFill, hordeSize, modifierFor, nextHordeLabel, pickSpawnKind } from "../src/waves/wave-director";

describe("WaveDirector", () => {
  it("holds the fight until the horde is filled, then opens the calm interval", () => {
    const director = new WaveDirector();
    assert.equal(hordeSize(1), director.roster);
    assert.equal(director.advance(WAVE_FIGHT_MS), null);
    assert.equal(director.phase, "fight");
    assert.equal(director.clear(), null);
    director.noteSpawn(director.roster - 1);
    assert.equal(director.clear(), null);
    director.noteSpawn();
    assert.equal(director.clear(), "calm-started");
    assert.equal(director.wave, 1);
    assert.equal(director.phase, "calm");
    assert.equal(director.advance(WAVE_CALM_MS - 1), null);
    assert.equal(director.advance(1), "fight-started");
    assert.equal(director.wave, 2);
    assert.equal(director.spawned, 0);
    assert.equal(director.modifier, "runners");
    assert.equal(calmFill(WAVE_CALM_MS / 1000, WAVE_CALM_MS), 1);
    assert.equal(calmFill(WAVE_CALM_MS / 2000, WAVE_CALM_MS), 0.5);
    assert.equal(calmFill(0, WAVE_CALM_MS), 0);
    assert.equal(modifierFor(3), "brute");
    assert.equal(modifierFor(4), "alarms");
    assert.equal(nextHordeLabel(1), "CORREDORES");
    assert.equal(nextHordeLabel(2), "BRUTE");
    assert.equal(nextHordeLabel(3), "ALARMES");
  });

  it("caps alarm extras until the next fight", () => {
    const director = new WaveDirector();
    assert.equal(director.extraRoom, ALARM_EXTRA_CAP);
    director.noteExtra(ALARM_EXTRA_CAP);
    assert.equal(director.extraRoom, 0);
    director.noteSpawn(director.roster);
    director.clear();
    director.advance(WAVE_CALM_MS);
    assert.equal(director.wave, 2);
    assert.equal(director.extraRoom, ALARM_EXTRA_CAP);
  });
});

describe("pickSpawnKind", () => {
  it("returns walker, brute, and runner for the locked rolls", () => {
    assert.equal(pickSpawnKind(1, "clear", 0.5), "walker");
    assert.equal(pickSpawnKind(3, "brute", 0.1), "brute");
    assert.equal(pickSpawnKind(2, "runners", 0.2), "runner");
  });
});
