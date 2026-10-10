export function shouldResumeWorld(playerPaused: boolean, impactLeftMs: number): boolean {
  if (playerPaused) return false;
  return impactLeftMs <= 0;
}
