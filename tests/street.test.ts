import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STREET_LEFT, STREET_RIGHT } from "../src/config";
import { streetBlocks } from "../src/world/street";

describe("streetBlocks", () => {
  it("keeps every building outside the street band", () => {
    for (const block of streetBlocks()) {
      const left = block.x - block.width / 2;
      const right = block.x + block.width / 2;
      const invadesStreet = left < STREET_RIGHT && right > STREET_LEFT;
      assert.equal(invadesStreet, false);
    }
  });
});
