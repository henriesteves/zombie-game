import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_VOLUME, stepVolume, volumeBar } from "../src/audio/volume";
import { PauseMenu, movePauseIndex, pauseMenuLines } from "../src/input/pause-menu";

describe("pause menu", () => {
  it("wraps the cursor and only confirms continuar or reiniciar on an edge", () => {
    assert.equal(movePauseIndex(0, -1), 2);
    assert.equal(movePauseIndex(2, 1), 0);
    const menu = new PauseMenu();
    const idle = menu.sample({ up: false, down: false, left: false, right: false, confirm: false });
    assert.equal(idle.action, null);
    assert.equal(idle.item, "resume");
    const held = menu.sample({ up: false, down: false, left: false, right: false, confirm: true });
    assert.equal(held.action, "resume");
    const still = menu.sample({ up: false, down: false, left: false, right: false, confirm: true });
    assert.equal(still.action, null);
    menu.sample({ up: false, down: false, left: false, right: false, confirm: false });
    menu.sample({ up: false, down: true, left: false, right: false, confirm: false });
    const restart = menu.sample({ up: false, down: false, left: false, right: false, confirm: true });
    assert.equal(restart.action, "restart");
  });

  it("steps volume only on the volume row and paints the bar", () => {
    assert.equal(stepVolume(0.5, 1), 0.6);
    assert.equal(stepVolume(1, 1), 1);
    assert.equal(stepVolume(0, -1), 0);
    assert.equal(stepVolume(DEFAULT_VOLUME, 0), DEFAULT_VOLUME);
    const menu = new PauseMenu();
    menu.sample({ up: false, down: true, left: false, right: false, confirm: false });
    menu.sample({ up: false, down: false, left: false, right: false, confirm: false });
    menu.sample({ up: false, down: true, left: false, right: false, confirm: false });
    const louder = menu.sample({ up: false, down: false, left: false, right: true, confirm: false });
    assert.equal(louder.item, "volume");
    assert.equal(louder.volumeChanged, true);
    assert.ok(louder.volume > DEFAULT_VOLUME);
    const lines = pauseMenuLines(2, 0.5, volumeBar);
    assert.match(lines, /> volume /);
    assert.match(lines, /continuar/);
  });
});
