import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CORPSE_MS } from "../src/config";
import { advanceCorpseAge, corpseAlpha, leavesCorpse } from "../src/fx/corpse-fade";

describe("corpses", () => {
  it("leaves a body on a kill but not on a calm recall", () => {
    assert.equal(leavesCorpse("kill"), true);
    assert.equal(leavesCorpse("calm"), false);
  });

  it("keeps the same alpha while the clock is stopped", () => {
    for (const age of [0, CORPSE_MS * 0.5, CORPSE_MS * 0.9]) {
      assert.equal(corpseAlpha(advanceCorpseAge(age, 0)), corpseAlpha(age));
    }
  });

  it("fades out by CORPSE_MS", () => {
    assert.ok(corpseAlpha(0) > 0);
    assert.ok(corpseAlpha(CORPSE_MS * 0.9) < corpseAlpha(0));
    assert.equal(corpseAlpha(CORPSE_MS), 0);
  });
});
