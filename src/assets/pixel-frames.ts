export type Palette = Record<string, string>;

export interface ActorArt {
  key: string;
  scale: number;
  palette: Palette;
  idle: string[];
  step: string[];
  dead: string[];
}

function fromHalf(half: string[]): string[] {
  return [...half, ...[...half].reverse()];
}

function pose(lines: string[]): string[] {
  for (const line of lines) {
    if (line.length !== 16) throw new Error(`pixel row has ${line.length} columns: ${line}`);
  }
  return lines;
}

function actor(key: string, scale: number, palette: Palette, half: string[], step: string[], dead: string[]): ActorArt {
  return { key, scale, palette, idle: pose(fromHalf(half)), step: pose(step), dead: pose(dead) };
}

const PLAYER_PALETTE: Palette = {
  o: "#0a1a2a", S: "#2f6fb5", s: "#1a4578", H: "#7eb6ea",
  h: "#5a3a1f", k: "#e0b48a", n: "#f2d2b4", g: "#333333", G: "#9a9a9a", r: "#8f1c1c",
};

const WALKER_PALETTE: Palette = {
  o: "#14230f", c: "#5a4a3a", C: "#7d6a54", d: "#3d3228",
  g: "#6b9a4a", G: "#8fbf68", e: "#4a7034", r: "#8b1a1a",
};

const RUNNER_PALETTE: Palette = {
  o: "#2a1010", R: "#8a3a2a", E: "#c45a42", D: "#5c2418",
  g: "#c9a27a", G: "#f0d2b0", e: "#8a6848", r: "#6a0f0f",
};

const BRUTE_PALETTE: Palette = {
  o: "#1a0a0a", B: "#4a2428", D: "#2c1416", H: "#7a4044",
  m: "#8a3030", M: "#c45454", d: "#5c2024", g: "#e8d0c0", G: "#fff0e4", r: "#4a1010",
};

const BLOATER_PALETTE: Palette = {
  o: "#24300c", Y: "#8aa04a", E: "#c6dc78", D: "#5c7030",
  b: "#d6e36a", B: "#f4f8b0", d: "#a8c050", g: "#f4f0c8", r: "#6a2010",
};

const SPITTER_PALETTE: Palette = {
  o: "#160e22", P: "#6b458c", E: "#a07ad0", D: "#3e2458",
  v: "#d6f26a", V: "#f4ffb0", s: "#b6e24a", S: "#e8ff9a", r: "#4a1030",
};

export const ACTORS: ActorArt[] = [
  actor("player", 3, PLAYER_PALETTE, [
    "................",
    "....oooooo......",
    "...oSSSHSSo.....",
    "...oSsSSSSSo....",
    "...oSSShhhSo....",
    "...oSShhhhnSo...",
    "....oShhhhhSkg..",
    "....oShhhhhhkGGG",
  ], [
    "................",
    "...oooooo.......",
    "..oSSSHSSo......",
    "..oSsSSSSSSo....",
    "...oSSShhhSSo...",
    "...oSShhhhnSkg..",
    "....oShhhhhhkGGG",
    "....oShhhhhhk...",
    "...oSShhhhhSkg..",
    "..oSShhhhhnSSo..",
    "..oSSShhhhSSo...",
    "..oSsSSSSSSSo...",
    "...oSSSHSSSo....",
    "....ooooooo.....",
    ".....o...o......",
    "................",
  ], [
    "................",
    "................",
    "................",
    "................",
    ".....ooooooo....",
    "...ooSSSSSSSo...",
    "..oSShhhhhnkgg..",
    "..oSSkkkkkkkGGG.",
    "...oSSSSSooo....",
    ".....orrro......",
    "......rrrr......",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  actor("zombie_walker", 3, WALKER_PALETTE, [
    "................",
    "....oooooo......",
    "...occccCcco....",
    "..occdccccccco..",
    "..occcgggCccco..",
    "..occggGggcgggg.",
    "...ocgggrggggggg",
    "....oggggggggggg",
  ], [
    "................",
    "...oooooo.......",
    "..occccCco......",
    ".occdcccccco....",
    "..occcgggCcggg..",
    "..occggGgrggggg.",
    "...ocggggggggg..",
    "....oggggggggg..",
    "....ogggggggggg.",
    "...ocgggrggggggg",
    "..occggGggcgggg.",
    ".occcgggCcccco..",
    "..occdccccccco..",
    "...occccCcco....",
    "....oooooo......",
    "................",
  ], [
    "................",
    "................",
    "................",
    "................",
    "......ooooooo...",
    "....ooccccccco..",
    "...occggGgggrr..",
    "..ocgggrgggggggg",
    "...occccccco....",
    "....ooooooo.....",
    "......rrrr......",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  actor("zombie_runner", 3, RUNNER_PALETTE, [
    "................",
    "................",
    ".....oooooo.....",
    "....oREEEERo....",
    "....oRRgggRo....",
    "....oReggggRggg.",
    "....ogggrgggggg.",
    "....oggggggggggg",
  ], [
    "................",
    "....oooooo......",
    "...oREEEERo.....",
    "...oRRDgggRo....",
    "....oRegggRggg..",
    "....ogggrggggg..",
    "....ogggggggg...",
    ".....gggggg.....",
    "....oggggggg....",
    "...ogggrggggg...",
    "..oReggggRgggg..",
    "..oRRDgggRRo....",
    "...oREEEERo.....",
    "....oooooo......",
    ".....o..o.......",
    "................",
  ], [
    "................",
    "................",
    "................",
    "................",
    "................",
    ".....ooooooo....",
    "...ooREEEEgggr..",
    "..oRgggrgggggggg",
    "...oRRRRRRo.....",
    ".....oooo.......",
    "......rrrr......",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  actor("zombie_brute", 4, BRUTE_PALETTE, [
    "................",
    "..oooooooooooo..",
    ".oBBBBHHBBBBBBo.",
    ".oBBDBmmmmBBBBo.",
    "oBBBBmmMMmmBBBBo",
    "oBBBmmmMMmmmmBBg",
    "oBBmmmmmmmmmmBBg",
    ".oBmmmmmmmmmBggg",
  ], [
    "................",
    ".oooooooooooo...",
    "oBBBBHHBBBBBBo..",
    "oBBDBmmmmBBBBo..",
    "BBBBmmMMmmBBBBo.",
    "oBBBmmmMMmmmmBBg",
    "oBBmmmmmmmmmmBBg",
    ".oBmmmmmmmmmBggg",
    ".oBmmmmmmmmmBggg",
    "oBBmmmmmmmmmmBBg",
    "oBBBmmmMMmmmmBBg",
    ".oBBBBmmMMmmBBBB",
    "..oBBDBmmmmBBBBo",
    "..oBBBBHHBBBBBBo",
    "...oooooooooooo.",
    "................",
  ], [
    "................",
    "................",
    "................",
    "..oooooooooooo..",
    ".oBBBBHHBBBBBBo.",
    "oBBDBmmMMmmBBBBg",
    "oBBmmmrrrmmmmBBg",
    "oBBBmmmmmmmmBggg",
    ".oBBBBBBBBBBBo..",
    "..oooooooooooo..",
    "....rrrrrrrr....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  actor("zombie_bloater", 4, BLOATER_PALETTE, [
    "................",
    "...oooooooooo...",
    "..oYYYYEYYYYYo..",
    ".oYYYYbbbbYYYYo.",
    ".oYYDbbbbbbYYYo.",
    "oYYYbbbbBbbbYYYg",
    "oYYbbbbbbbbbbYYg",
    ".oYbbbbbbbbbbYgg",
  ], [
    "................",
    "..oooooooooo....",
    ".oYYYYEYYYYYo...",
    "oYYYYbbbbYYYYo..",
    "oYYDbbbbbbYYYo..",
    "oYYYbbbbBbbbYYYg",
    "oYYbbbbbbbbbbYYg",
    ".oYbbbbbbbbbbYgg",
    ".oYbbbbbbbbbbYgg",
    "oYYbbbbbbbbbbYYg",
    "oYYYbbbbBbbbYYYg",
    "..oYYDbbbbbbYYYo",
    "..oYYYYbbbbYYYYo",
    "...oYYYYEYYYYYo.",
    "....oooooooooo..",
    "................",
  ], [
    "................",
    "................",
    "...oooooooooo...",
    "..oYYYYEYYYYYYo.",
    ".oYYYbbbbbbbYYo.",
    "oYYDbbbbrbbbYYYg",
    "oYYbbbbbbbbbbYgg",
    ".oYYYYbbbbYYYo..",
    "..ooooooooooo...",
    "....rrrrrrrr....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
  actor("zombie_spitter", 3, SPITTER_PALETTE, [
    "................",
    "....oooooo......",
    "...oPEEPPPo.....",
    "...oPPvvvPo.....",
    "...oPDvvvPss....",
    "....oPvvSSSss...",
    "....oPPPsss.....",
    ".....oooo.......",
  ], [
    "................",
    "...oooooo.......",
    "..oPEEPPPo......",
    "..oPPvvvPo......",
    "..oPDvvvPss.....",
    "....oPvvSSSss...",
    "....oPPPsss.....",
    ".....oooo.......",
    ".....oooo.......",
    "....oPPPsss.....",
    "....oPvvSSSss...",
    "....oPDvvvPss...",
    "....oPPvvvPo....",
    "....oPEEPPPo....",
    ".....oooooo.....",
    "................",
  ], [
    "................",
    "................",
    "................",
    ".....oooooo.....",
    "...ooPEEPPPo....",
    "..oPPvvvSSSsso..",
    "..oPDvvrrsssss..",
    "...oPPPPsso.....",
    ".....ooooo......",
    "......rrrr......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
  ]),
];
