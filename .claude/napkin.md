# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-10-09] Pure rules are tested without Phaser**
   Do instead: run `npm test` (`node --import tsx --test`). Keep tests off Phaser imports so they run in Node.
2. **[2026-10-09] Player pause and hit-stop both stop physics**
   Do instead: resume physics only through `shouldResumeWorld`. Never clear `impactUntil` when toggling pause, and never resume while either one is active.
3. **[2026-10-09] Restart destroys the Arcade world, not the scene emitter**
   Do instead: on `scene.restart()`, rely on a fresh physics world; keep the UI `hud` listener on `Game` events and re-bind only if `UIScene` itself shuts down.
4. **[2026-10-09] Flashlight is a camera PostFX and requires WebGL**
   Do instead: keep the HUD in `UIScene`. Sync the cone and `setLights` in `syncLight` (include shake). Street props come from `layStreet`. Upload uniforms in `onDraw`.
5. **[2026-10-09] Gameplay is split out of the scene**
   Do instead: put laser in `src/combat/laser-sight.ts`, blasts in `src/combat/explosions.ts`, pickups in `src/pickups/drops.ts`, and horde steering in `src/ai/horde.ts`. Keep numbers in `src/config.ts`.
6. **[2026-10-09] Zombies follow a flow field; the brute charges**
   Do instead: block cars and barrels in `src/ai/flow-field.ts` and steer with `sample()`. Brute windup/dash goes through `Zombie.advanceCharge`.

## Domain Behavior Guardrails
1. **[2026-10-10] Car fire damage ticks only while Explosions.update runs**
   Do instead: burn from `burnAround` inside that update. GameScene already skips it during pause, so do not use a wall clock.
2. **[2026-10-10] Dash time advances only while the world is running**
   Do instead: tick `DashState.velocity` from `handlePlayer`. Cancel it on death and `reset` it in `resetState`.
3. **[2026-10-09] A bloater killed by a blast must not explode again**
   Do instead: set `suppressBlast` on bloaters inside the radius before `applyBlast`. The source bloater is already inactive.
4. **[2026-10-10] Calm no longer deletes the horde**
   Do instead: drop the center cache when `clear()` starts the calm. Leave every living zombie until it is killed.
5. **[2026-10-09] High score is one localStorage key**
   Do instead: read and write only `zombie-game-high-score` from `src/score/high-score.ts`. Never call `localStorage.clear()`.
6. **[2026-10-09] Zombies are pooled; call `spawn()` after `group.get()`**
   Do instead: reuse `Zombie.spawn(kind, x, y)` and `bullets.get()`. Do not `new` zombies or bullets per shot.
7. **[2026-10-09] All art and SFX are procedural**
   Do instead: add a texture key in `generateAllTextures` / `pixelArt.ts`, or a function in `audio/sfx.ts`. Unlock audio only from the Boot click.
8. **[2026-10-10] A horde ends only when its roster is dead**
   Do instead: fill `WaveDirector` with `noteSpawn`, then `clear()` once `rosterFilled` and no zombie is alive. The calm clock is what starts the next fight. Do not despawn the horde to finish it.
9. **[2026-10-09] Zombie spawn stays on the street, off camera**
   Do instead: `pickOffscreenPoint` only uses the street band. Do not spawn inside building blocks.
10. **[2026-10-09] The laser follows the gun in world space**
   Do instead: draw it from `LASER_MUZZLE` along `player.rotation` and stop at the first building, car, barrel, or zombie.
