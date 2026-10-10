import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FLOW_CELL, WORLD_H, WORLD_W } from "../src/config";
import { FlowField } from "../src/ai/flow-field";

const WALL_COLUMN = 30;
const GAP_ROW = 8;
const SAMPLE_ROW = 28;

function cellCenter(column: number, row: number): { x: number; y: number } {
  return { x: (column + 0.5) * FLOW_CELL, y: (row + 0.5) * FLOW_CELL };
}

function blockCell(field: FlowField, column: number, row: number) {
  const cell = cellCenter(column, row);
  field.blockRect(cell.x, cell.y, 1, 1);
}

describe("FlowField", () => {
  it("points right when the way to the target is open", () => {
    const field = new FlowField();
    const goal = cellCenter(40, 20);
    const sample = cellCenter(34, 20);
    field.rebuild([goal]);
    const direction = field.sample(sample.x, sample.y);
    assert.ok(direction);
    assert.ok(direction.x > 0.7);
  });

  it("points toward the gap instead of through a vertical wall", () => {
    const field = new FlowField();
    const rows = Math.ceil(WORLD_H / FLOW_CELL);
    const cols = Math.ceil(WORLD_W / FLOW_CELL);
    assert.ok(WALL_COLUMN > 1 && WALL_COLUMN < cols - 2);
    assert.ok(GAP_ROW > 0 && SAMPLE_ROW < rows - 1);
    for (let row = 0; row < rows; row += 1) {
      if (row === GAP_ROW) continue;
      blockCell(field, WALL_COLUMN, row);
    }
    const goal = cellCenter(WALL_COLUMN + 4, SAMPLE_ROW);
    const sample = cellCenter(WALL_COLUMN - 1, SAMPLE_ROW);
    field.rebuild([goal]);
    const direction = field.sample(sample.x, sample.y);
    assert.ok(direction);
    assert.ok(direction.y < -0.7);
    assert.ok(direction.x < 0.7);
  });
});
