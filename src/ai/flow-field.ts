import { FLOW_CELL, FLOW_CLEARANCE, WORLD_H, WORLD_W } from "../config";

export interface FlowPoint {
  x: number;
  y: number;
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class FlowField {
  private readonly cols = Math.ceil(WORLD_W / FLOW_CELL);
  private readonly rows = Math.ceil(WORLD_H / FLOW_CELL);
  private readonly blocked: Uint8Array;
  private readonly dist: Int16Array;
  private readonly dirX: Float32Array;
  private readonly dirY: Float32Array;
  private readonly queue: number[] = [];

  constructor() {
    const count = this.cols * this.rows;
    this.blocked = new Uint8Array(count);
    this.dist = new Int16Array(count);
    this.dirX = new Float32Array(count);
    this.dirY = new Float32Array(count);
  }

  clear() {
    this.blocked.fill(0);
  }

  blockCircle(x: number, y: number, radius: number) {
    this.fillRect(x, y, radius + FLOW_CLEARANCE, radius + FLOW_CLEARANCE);
  }

  blockRect(x: number, y: number, halfW: number, halfH: number) {
    this.fillRect(x, y, halfW + FLOW_CLEARANCE, halfH + FLOW_CLEARANCE);
  }

  private fillRect(x: number, y: number, halfW: number, halfH: number) {
    const left = x - halfW;
    const right = x + halfW;
    const top = y - halfH;
    const bottom = y + halfH;
    const col0 = clamp(Math.floor(left / FLOW_CELL), 0, this.cols - 1);
    const col1 = clamp(Math.floor(right / FLOW_CELL), 0, this.cols - 1);
    const row0 = clamp(Math.floor(top / FLOW_CELL), 0, this.rows - 1);
    const row1 = clamp(Math.floor(bottom / FLOW_CELL), 0, this.rows - 1);
    for (let row = row0; row <= row1; row++) {
      const centerY = (row + 0.5) * FLOW_CELL;
      if (centerY < top || centerY > bottom) continue;
      for (let col = col0; col <= col1; col++) {
        const centerX = (col + 0.5) * FLOW_CELL;
        if (centerX < left || centerX > right) continue;
        this.blocked[row * this.cols + col] = 1;
      }
    }
  }

  rebuild(goals: FlowPoint[]) {
    this.dist.fill(-1);
    this.dirX.fill(0);
    this.dirY.fill(0);
    this.integrate(goals);
    this.writeDirections();
  }

  sample(x: number, y: number): FlowPoint | null {
    const col = clamp(Math.floor(x / FLOW_CELL), 0, this.cols - 1);
    const row = clamp(Math.floor(y / FLOW_CELL), 0, this.rows - 1);
    const index = row * this.cols + col;
    if (this.dirX[index] === 0 && this.dirY[index] === 0) return null;
    return { x: this.dirX[index], y: this.dirY[index] };
  }

  private integrate(goals: FlowPoint[]) {
    const queue = this.queue;
    queue.length = 0;
    for (const goal of goals) {
      const index = this.nearestOpen(goal.x, goal.y);
      if (index < 0 || this.dist[index] === 0) continue;
      this.dist[index] = 0;
      queue.push(index);
    }
    let head = 0;
    while (head < queue.length) {
      const index = queue[head];
      head += 1;
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const nextDist = this.dist[index] + 1;
      for (const [dc, dr] of NEIGHBORS) {
        const next = this.stepIndex(col, row, dc, dr);
        if (next < 0 || this.dist[next] >= 0) continue;
        this.dist[next] = nextDist;
        queue.push(next);
      }
    }
  }

  private writeDirections() {
    const count = this.cols * this.rows;
    for (let index = 0; index < count; index++) {
      if (this.blocked[index] || this.dist[index] <= 0) continue;
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      let bestDist = this.dist[index];
      let bestX = 0;
      let bestY = 0;
      for (const [dc, dr] of NEIGHBORS) {
        const next = this.stepIndex(col, row, dc, dr);
        if (next < 0 || this.dist[next] < 0 || this.dist[next] >= bestDist) continue;
        bestDist = this.dist[next];
        bestX = dc;
        bestY = dr;
      }
      const length = Math.hypot(bestX, bestY);
      if (length === 0) continue;
      this.dirX[index] = bestX / length;
      this.dirY[index] = bestY / length;
    }
  }

  private nearestOpen(x: number, y: number): number {
    const originCol = clamp(Math.floor(x / FLOW_CELL), 0, this.cols - 1);
    const originRow = clamp(Math.floor(y / FLOW_CELL), 0, this.rows - 1);
    const origin = originRow * this.cols + originCol;
    if (!this.blocked[origin]) return origin;
    for (let radius = 1; radius <= 8; radius++) {
      for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
        for (let colOffset = -radius; colOffset <= radius; colOffset++) {
          if (Math.max(Math.abs(colOffset), Math.abs(rowOffset)) !== radius) continue;
          const col = originCol + colOffset;
          const row = originRow + rowOffset;
          if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) continue;
          const index = row * this.cols + col;
          if (!this.blocked[index]) return index;
        }
      }
    }
    return -1;
  }

  private stepIndex(col: number, row: number, colStep: number, rowStep: number): number {
    const nextCol = col + colStep;
    const nextRow = row + rowStep;
    if (nextCol < 0 || nextRow < 0 || nextCol >= this.cols || nextRow >= this.rows) return -1;
    const next = nextRow * this.cols + nextCol;
    if (this.blocked[next]) return -1;
    if (colStep !== 0 && rowStep !== 0) {
      if (this.blocked[row * this.cols + nextCol] || this.blocked[nextRow * this.cols + col]) return -1;
    }
    return next;
  }
}
