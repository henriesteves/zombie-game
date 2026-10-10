import Phaser from "phaser";

export type Palette = Record<string, string>;

/** Espelha verticalmente a metade superior para formar um sprite top-down simétrico. */
export function fromHalf(half: string[]): string[] {
  return [...half, ...[...half].reverse()];
}

/** Converte uma matriz de caracteres em textura. '.' (ou chave fora da paleta) = transparente. */
export function makeTexture(scene: Phaser.Scene, key: string, rows: string[], palette: Palette, scale = 3) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tex = scene.textures.createCanvas(key, w * scale, h * scale)!;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  tex.refresh();
}

// Todos os sprites olham para a DIREITA (rotation = 0).
// Cada matriz é a metade superior (8 linhas x 16 colunas); fromHalf() espelha para completar.

export const PLAYER_HALF = [
  "................",
  "....oooooo......",
  "...oSSSSSSo.....",
  "...oSSSSSSSo....",
  "...oSSShhhSo....",
  "...oSShhhhhSo...",
  "....oShhhhhSkg..",
  "....oShhhhhhkGGG",
];
export const PLAYER_PALETTE: Palette = {
  o: "#0a1a2a", S: "#2f6fb5", h: "#5a3a1f", k: "#e0b48a", g: "#333333", G: "#9a9a9a",
};

export const WALKER_HALF = [
  "................",
  "....oooooo......",
  "...occcccccco...",
  "..occcccccccco..",
  "..occcgggcccco..",
  "..occgggggcgggg.",
  "...ocgggrggggggg",
  "....oggggggggggg",
];
export const WALKER_PALETTE: Palette = { o: "#14230f", c: "#5a4a3a", g: "#6b9a4a", r: "#8b1a1a" };

export const RUNNER_HALF = [
  "................",
  "................",
  ".....oooooo.....",
  "....oRRRRRRo....",
  "....oRRgggRo....",
  "....oRgggggRggg.",
  "....ogggrgggggg.",
  "....oggggggggggg",
];
export const RUNNER_PALETTE: Palette = { o: "#2a1010", R: "#8a3a2a", g: "#c9a27a", r: "#6a0f0f" };

export const BRUTE_HALF = [
  "................",
  "..oooooooooooo..",
  ".oBBBBBBBBBBBBo.",
  ".oBBBBmmmmBBBBo.",
  "oBBBBmmmmmmBBBBo",
  "oBBBmmmmmmmmBBBg",
  "oBBmmmmmmmmmmBBg",
  ".oBmmmmmmmmmBggg",
];
export const BRUTE_PALETTE: Palette = { o: "#1a0a0a", B: "#4a2428", m: "#8a3030", g: "#e8d0c0" };

export const BLOATER_HALF = [
  "................",
  "...oooooooooo...",
  "..oYYYYYYYYYYo..",
  ".oYYYYbbbbYYYYo.",
  ".oYYYbbbbbbYYYo.",
  "oYYYbbbbbbbbYYYg",
  "oYYbbbbbbbbbbYYg",
  ".oYbbbbbbbbbbYgg",
];
export const BLOATER_PALETTE: Palette = { o: "#24300c", Y: "#8aa04a", b: "#d6e36a", g: "#f4f0c8" };
