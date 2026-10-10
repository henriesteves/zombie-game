import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ENCOUNTER_BANNER_MS } from "../src/config";
import { FirstEncounter } from "../src/waves/first-encounter";

describe("FirstEncounter", () => {
  it("teaches a brute and a spitter once, and ignores a walker", () => {
    const encounter = new FirstEncounter();
    encounter.noteKind("walker");
    assert.equal(encounter.line, "");
    encounter.noteKind("brute");
    assert.equal(encounter.line, "BRUTE — recua e investe");
    encounter.tick(0);
    assert.equal(encounter.line, "BRUTE — recua e investe");
    encounter.noteKind("brute");
    encounter.tick(ENCOUNTER_BANNER_MS);
    assert.equal(encounter.line, "");
    encounter.noteKind("spitter");
    assert.equal(encounter.line, "CUSPIDOR — cospe de longe");
    encounter.reset();
    assert.equal(encounter.line, "");
    encounter.noteKind("brute");
    assert.equal(encounter.line, "BRUTE — recua e investe");
  });
});
