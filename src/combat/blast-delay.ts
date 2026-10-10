export interface DelayedCall {
  delayMs: number;
}

export function advanceDelayedCalls<T extends DelayedCall>(items: T[], deltaMs: number): T[] {
  const due: T[] = [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    items[index].delayMs -= deltaMs;
    if (items[index].delayMs > 0) continue;
    due.push(items.splice(index, 1)[0]);
  }
  return due;
}
