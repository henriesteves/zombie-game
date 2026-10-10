const HIGH_SCORE_KEY = "zombie-game-high-score";

export function readHighScore(): number {
  const stored = localStorage.getItem(HIGH_SCORE_KEY);
  if (stored === null) return 0;
  const value = Number(stored);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

export function recordHighScore(score: number): number {
  const best = readHighScore();
  if (score <= best) return best;
  localStorage.setItem(HIGH_SCORE_KEY, String(score));
  return score;
}
