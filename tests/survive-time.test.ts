import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatSurviveTime } from "../src/score/survive-time";

describe("formatSurviveTime", () => {
  it("formats whole seconds as m:ss and never goes negative", () => {
    assert.equal(formatSurviveTime(0), "0:00");
    assert.equal(formatSurviveTime(5.9), "0:05");
    assert.equal(formatSurviveTime(65), "1:05");
    assert.equal(formatSurviveTime(-2), "0:00");
  });
});
