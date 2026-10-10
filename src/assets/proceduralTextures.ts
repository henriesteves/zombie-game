import Phaser from "phaser";
import {
  BRUTE_HALF, BRUTE_PALETTE, PLAYER_HALF, PLAYER_PALETTE, RUNNER_HALF, RUNNER_PALETTE,
  WALKER_HALF, WALKER_PALETTE, fromHalf, makeTexture,
} from "./pixelArt";

type Draw = (ctx: CanvasRenderingContext2D) => void;

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw) {
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

// PRNG determinístico para texturas reproduzíveis
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCar(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, vertical: boolean) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  if (vertical) ctx.rotate(Math.PI / 2);
  // carroceria (desenhada na horizontal, 96x52, olhando para a direita)
  ctx.fillStyle = "#0b0b0b";
  ctx.beginPath(); ctx.roundRect(-48, -26, 96, 52, 10); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-46, -24, 92, 48, 9); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(-20, -19, 26, 38); // teto
  ctx.fillStyle = "#18262f";
  ctx.fillRect(8, -20, 14, 40); // para-brisa
  ctx.fillRect(-34, -20, 10, 40); // vidro traseiro
  ctx.fillStyle = "#ffe9a0";
  ctx.fillRect(42, -20, 4, 8); ctx.fillRect(42, 12, 4, 8); // faróis
  ctx.fillStyle = "#c01818";
  ctx.fillRect(-46, -20, 3, 8); ctx.fillRect(-46, 12, 3, 8); // lanternas
  ctx.restore();
}

export const CAR_COLORS = ["red", "blue", "grey", "yellow"] as const;

function drawAmmoCrate(ctx: CanvasRenderingContext2D, fill: string, mark: string) {
  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, 22, 18);
  ctx.fillStyle = fill;
  ctx.fillRect(1, 1, 20, 16);
  ctx.fillStyle = mark;
  for (let i = 0; i < 4; i++) ctx.fillRect(3 + i * 5, 4, 3, 10);
}

export function generateAllTextures(scene: Phaser.Scene) {
  // ---------- Personagens (pixel art em código) ----------
  makeTexture(scene, "player", fromHalf(PLAYER_HALF), PLAYER_PALETTE, 3);
  makeTexture(scene, "zombie_walker", fromHalf(WALKER_HALF), WALKER_PALETTE, 3);
  makeTexture(scene, "zombie_runner", fromHalf(RUNNER_HALF), RUNNER_PALETTE, 3);
  makeTexture(scene, "zombie_brute", fromHalf(BRUTE_HALF), BRUTE_PALETTE, 4);

  // ---------- Chão: asfalto com ruído, rachaduras e faixa ----------
  canvasTexture(scene, "asphalt", 128, 128, (ctx) => {
    const rnd = mulberry32(1337);
    ctx.fillStyle = "#2a2e34";
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const v = 50 + Math.floor(rnd() * 28);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
      ctx.fillRect(Math.floor(rnd() * 128), Math.floor(rnd() * 128), 2, 2);
    }
    ctx.strokeStyle = "rgba(10,10,12,0.7)";
    ctx.lineWidth = 1;
    for (let c = 0; c < 3; c++) {
      let x = rnd() * 128;
      let y = rnd() * 128;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (rnd() - 0.5) * 24;
        y += (rnd() - 0.5) * 24;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(220,200,90,0.55)"; // faixa tracejada
    ctx.fillRect(0, 62, 64, 4);
  });

  // ---------- Carros (4 cores x 2 orientações) ----------
  const carColors: Record<string, string> = { red: "#a52a2a", blue: "#2a4a9a", grey: "#6a6e74", yellow: "#c9a227" };
  for (const name of CAR_COLORS) {
    const color = carColors[name];
    canvasTexture(scene, `car_${name}_h`, 96, 52, (ctx) => drawCar(ctx, 96, 52, color, false));
    canvasTexture(scene, `car_${name}_v`, 52, 96, (ctx) => drawCar(ctx, 52, 96, color, true));
  }

  // ---------- Barril explosivo ----------
  canvasTexture(scene, "barrel", 28, 28, (ctx) => {
    ctx.fillStyle = "#101010";
    ctx.beginPath(); ctx.arc(14, 14, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b8321e";
    ctx.beginPath(); ctx.arc(14, 14, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f2c230";
    ctx.save();
    ctx.beginPath(); ctx.arc(14, 14, 12, 0, Math.PI * 2); ctx.clip();
    for (let i = -2; i < 4; i++) {
      ctx.save();
      ctx.translate(14, 14);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(i * 8 - 2, -16, 4, 32);
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = "#8a2415";
    ctx.beginPath(); ctx.arc(14, 14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#101010";
    ctx.beginPath(); ctx.arc(14, 14, 3, 0, Math.PI * 2); ctx.fill();
  });

  // ---------- Projétil, partículas, decals ----------
  canvasTexture(scene, "bullet", 10, 10, (ctx) => {
    const g = ctx.createRadialGradient(5, 5, 0, 5, 5, 5);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.5, "#ffe066");
    g.addColorStop(1, "rgba(255,160,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 10, 10);
  });
  canvasTexture(scene, "blood_dot", 6, 6, (ctx) => {
    ctx.fillStyle = "#9a1010";
    ctx.beginPath(); ctx.arc(3, 3, 3, 0, Math.PI * 2); ctx.fill();
  });
  canvasTexture(scene, "spark", 6, 6, (ctx) => {
    ctx.fillStyle = "#ffb030";
    ctx.beginPath(); ctx.arc(3, 3, 3, 0, Math.PI * 2); ctx.fill();
  });
  canvasTexture(scene, "splat", 40, 40, (ctx) => {
    const rnd = mulberry32(99);
    ctx.fillStyle = "#5a0a0a";
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(20 + (rnd() - 0.5) * 22, 20 + (rnd() - 0.5) * 22, 3 + rnd() * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // ---------- Pickups ----------
  canvasTexture(scene, "pickup_smg", 22, 18, (ctx) => drawAmmoCrate(ctx, "#c9902a", "#4a3410"));
  canvasTexture(scene, "pickup_shotgun", 22, 18, (ctx) => drawAmmoCrate(ctx, "#8a2a2a", "#f2d2a0"));
  canvasTexture(scene, "building", 128, 96, (ctx) => {
    ctx.fillStyle = "#12151c";
    ctx.fillRect(0, 0, 128, 96);
    ctx.strokeStyle = "#2c3342";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 92);
    ctx.fillStyle = "#1c2433";
    ctx.fillRect(18, 22, 28, 18);
    ctx.fillRect(70, 48, 36, 16);
    ctx.fillStyle = "#6a5832";
    ctx.fillRect(22, 58, 10, 8);
    ctx.fillRect(84, 24, 8, 8);
  });
  canvasTexture(scene, "sidewalk", 32, 32, (ctx) => {
    ctx.fillStyle = "#3a3e44";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#4a4e54";
    ctx.fillRect(0, 0, 32, 3);
  });
  canvasTexture(scene, "flame", 32, 32, (ctx) => {
    const glow = ctx.createRadialGradient(16, 18, 2, 16, 16, 16);
    glow.addColorStop(0, "rgba(255,220,120,0.95)");
    glow.addColorStop(0.35, "rgba(255,90,20,0.7)");
    glow.addColorStop(1, "rgba(80,10,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 32, 32);
  });
  canvasTexture(scene, "lamp", 12, 28, (ctx) => {
    ctx.fillStyle = "#1a1c22";
    ctx.fillRect(5, 8, 2, 20);
    ctx.fillStyle = "#d8c27a";
    ctx.beginPath();
    ctx.arc(6, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  canvasTexture(scene, "pickup_health", 22, 22, (ctx) => {
    ctx.fillStyle = "#101010"; ctx.fillRect(0, 0, 22, 22);
    ctx.fillStyle = "#f2f2f2"; ctx.fillRect(1, 1, 20, 20);
    ctx.fillStyle = "#d02020"; ctx.fillRect(9, 4, 4, 14); ctx.fillRect(4, 9, 14, 4);
  });
  for (const key of ["building", "sidewalk", "flame"]) {
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}
