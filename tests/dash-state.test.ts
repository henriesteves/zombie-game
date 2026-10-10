import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DashState, dashDirection, dashRecharge } from "../src/combat/dash-state";
import { DASH_COOLDOWN_MS, DASH_MS, DASH_SPEED, PLAYER_SPEED } from "../src/config";

describe("dash", () => {
  it("follows movement, and aim only while standing still", () => {
    const moving = dashDirection(0, 2, 0);
    assert.ok(Math.abs(moving.x) < 0.001);
    assert.ok(Math.abs(moving.y - 1) < 0.001);
    const idle = dashDirection(0, 0, Math.PI);
    assert.ok(Math.abs(idle.x + 1) < 0.001);
    assert.ok(Math.abs(idle.y) < 0.001);
  });

  it("moves faster than a walk and ignores a second press until the cooldown ends", () => {
    const dash = new DashState();
    const started = dash.takeEdges(true, false);
    const burst = dash.velocity(16, started, 1, 0, 0);
    assert.ok(burst.x > PLAYER_SPEED);
    assert.equal(burst.x, DASH_SPEED);
    dash.takeEdges(false, false);
    const retried = dash.velocity(16, dash.takeEdges(true, false), 0, 1, 0);
    assert.equal(retried.x, DASH_SPEED);
    assert.equal(retried.y, 0);
    dash.velocity(DASH_MS, false, 0, 1, 0);
    const blocked = dash.velocity(16, true, 0, 1, 0);
    assert.equal(blocked.y, PLAYER_SPEED);
    dash.velocity(DASH_COOLDOWN_MS, false, 0, 1, 0);
    const ready = dash.velocity(16, true, 0, 1, 0);
    assert.equal(ready.y, DASH_SPEED);
  });

  it("freezes the remaining burst until advance is called again, and death or restart clears it", () => {
    const dash = new DashState();
    dash.velocity(16, true, 1, 0, 0);
    assert.equal(dash.active, true);
    assert.equal(dash.active, true);
    const resumed = dash.velocity(16, false, 1, 0, 0);
    assert.equal(resumed.x, DASH_SPEED);
    dash.cancel();
    assert.equal(dash.active, false);
    dash.velocity(16, true, 1, 0, Math.PI / 2);
    dash.reset();
    assert.equal(dash.active, false);
    const walked = dash.velocity(16, false, 1, 0, 0);
    assert.equal(walked.x, PLAYER_SPEED);
  });

  it("maps the remaining cooldown to a recharge mark", () => {
    assert.equal(dashRecharge(0), 1);
    assert.equal(dashRecharge(DASH_COOLDOWN_MS), 0);
    const middle = dashRecharge(DASH_COOLDOWN_MS / 2);
    assert.ok(middle > 0 && middle < 1);
  });

  it("reads the mark from the dash's own cooldown and holds it while not advanced", () => {
    const dash = new DashState();
    assert.equal(dash.recharge, 1);
    dash.velocity(16, true, 1, 0, 0);
    assert.equal(dash.recharge, 0);
    dash.velocity(DASH_COOLDOWN_MS / 2, false, 1, 0, 0);
    const held = dash.recharge;
    assert.ok(held > 0 && held < 1);
    assert.equal(dash.recharge, held);
    dash.velocity(DASH_COOLDOWN_MS, false, 1, 0, 0);
    assert.equal(dash.recharge, 1);
    assert.equal(dash.velocity(16, true, 1, 0, 0).x, DASH_SPEED);
    dash.reset();
    assert.equal(dash.recharge, 1);
  });
});
