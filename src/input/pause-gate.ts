export function shouldResumeWorld(playerPaused: boolean, now: number, impactUntil: number): boolean {
  if (playerPaused) return false;
  return now >= impactUntil;
}
