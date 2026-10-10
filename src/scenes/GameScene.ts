import Phaser from "phaser";
import {
  ALARM_DURATION, ALARM_SPAWN_COUNT, ALARM_WAVE_CARS, BARREL_PLAYER_DAMAGE, BARREL_ZOMBIE_DAMAGE,
  CAR_BLAST_HITS, CAR_BLAST_RADIUS, CAR_HITS, CAR_PLAYER_DAMAGE, CAR_ZOMBIE_DAMAGE,
  DROP_HEALTH, DROP_SHOTGUN, DROP_SMG, EXPLOSION_RADIUS, FLOW_REBUILD_MS, HEALTH_PICKUP,
  BLAST_STOP_MS, CAR_FIRE_MS, COMBO_CAP, COMBO_WINDOW_MS, DECAL_DRY_MS, HIT_STOP_MS,
  PICKUP_LIFE_MS, PLAYER_MAX_HP, PLAYER_SPEED,
  STREET_LEFT, STREET_RIGHT,
  VIEW_H, VIEW_W, WEAPONS, WEAPON_ORDER, WORLD_H, WORLD_W, ZOMBIES, startingAmmo,
  type PickupKind, type WeaponId, type ZombieKind,
} from "../config";
import { FlowField } from "../ai/flow-field";
import { CAR_COLORS } from "../assets/proceduralTextures";
import * as sfx from "../audio/sfx";
import { Zombie } from "../entities/Zombie";
import { FlashlightPipeline, type SceneLight } from "../fx/FlashlightPipeline";
import { pickOffscreenPoint } from "../spawn/offscreen-point";
import { WaveDirector, maxAliveFor, modifierLabel, pickSpawnKind, spawnIntervalMs } from "../waves/wave-director";
import { curbCars, streetBarrels, streetBlocks, streetLamps } from "../world/street";
import type { HudState } from "./UIScene";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;
type Keys = Record<"W" | "A" | "S" | "D" | "R", Phaser.Input.Keyboard.Key>;

interface Blast {
  x: number;
  y: number;
  radius: number;
  zombieDamage: number;
  playerDamage: number;
}

const WEAPON_SFX: Record<WeaponId, () => void> = { pistol: sfx.pistol, smg: sfx.smg, shotgun: sfx.shotgun };
const MAX_DECALS = 120;

export class GameScene extends Phaser.Scene {
  private player!: Sprite;
  private zombies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private cars!: Phaser.Physics.Arcade.StaticGroup;
  private barrels!: Phaser.Physics.Arcade.StaticGroup;
  private buildings!: Phaser.Physics.Arcade.StaticGroup;
  private blood!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private light!: FlashlightPipeline;
  private keys!: Keys;

  private decals: Phaser.GameObjects.Image[] = [];
  private live: Zombie[] = [];
  private flow = new FlowField();
  private flowReadyAt = 0;
  private waves = new WaveDirector();
  private lamps: { x: number; y: number }[] = [];
  private fires: { x: number; y: number; life: number; max: number; sprite: Phaser.GameObjects.Image }[] = [];
  private shadows!: Phaser.GameObjects.Graphics;
  private impactUntil = 0;
  private combo = 0;
  private comboUntil = 0;

  // estado da partida (reiniciado em resetState)
  private hp = PLAYER_MAX_HP;
  private dead = false;
  private weapon: WeaponId = "pistol";
  private ammo: Record<WeaponId, number> = startingAmmo();
  private score = 0;
  private kills = 0;
  private elapsed = 0;
  private nextShot = 0;
  private invulnUntil = 0;
  private spawnTimer = 0;
  private padR1 = false;
  private padL1 = false;

  constructor() {
    super("Game");
  }

  private resetState() {
    this.hp = PLAYER_MAX_HP;
    this.dead = false;
    this.weapon = "pistol";
    this.ammo = startingAmmo();
    this.score = 0;
    this.kills = 0;
    this.elapsed = 0;
    this.nextShot = 0;
    this.invulnUntil = 0;
    this.spawnTimer = 0;
    this.padR1 = false;
    this.padL1 = false;
    this.flowReadyAt = 0;
    this.waves.reset();
    this.fires = [];
    this.impactUntil = 0;
    this.combo = 0;
    this.comboUntil = 0;
    this.decals = [];
  }

  // ====================================================================
  create() {
    this.resetState();
    this.physics.resume();
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.input.setDefaultCursor("crosshair");
    this.input.mouse?.disableContextMenu();

    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, "asphalt").setOrigin(0).setDepth(0);

    this.cars = this.physics.add.staticGroup();
    this.barrels = this.physics.add.staticGroup();
    this.buildings = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, defaultKey: "bullet", maxSize: 140 });
    this.zombies = this.physics.add.group({ classType: Zombie, maxSize: 160, collideWorldBounds: true });

    this.placeStreet();

    this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2, "player").setDepth(12).setCollideWorldBounds(true);
    (this.player.body as Body).setCircle(14, 10, 10);

    this.blood = this.add.particles(0, 0, "blood_dot", {
      speed: { min: 60, max: 260 }, lifespan: { min: 250, max: 600 },
      scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 }, emitting: false,
    }).setDepth(20);
    this.sparks = this.add.particles(0, 0, "spark", {
      speed: { min: 120, max: 420 }, lifespan: { min: 300, max: 800 },
      scale: { start: 1.4, end: 0 }, blendMode: "ADD", emitting: false,
    }).setDepth(20);
    this.shadows = this.add.graphics().setDepth(4);

    // Câmera + lanterna (PostFX)
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.centerOn(this.player.x, this.player.y);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setPostPipeline("Flashlight");
    const fx = cam.getPostPipeline("Flashlight");
    this.light = (Array.isArray(fx) ? fx[0] : fx) as FlashlightPipeline;
    this.light.aspect = VIEW_W / VIEW_H;
    cam.on(Phaser.Cameras.Scene2D.Events.PRE_RENDER, this.syncLight, this);

    // Input
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,R") as Keys;
    kb.on("keydown-ONE", () => this.setWeapon("pistol"));
    kb.on("keydown-TWO", () => this.setWeapon("smg"));
    kb.on("keydown-THREE", () => this.setWeapon("shotgun"));
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => this.cycleWeapon(dy > 0 ? 1 : -1));

    // Colisões
    this.physics.add.collider(this.player, this.cars);
    this.physics.add.collider(this.player, this.barrels);
    this.physics.add.collider(this.player, this.buildings);
    this.physics.add.collider(this.zombies, this.cars);
    this.physics.add.collider(this.zombies, this.barrels);
    this.physics.add.collider(this.zombies, this.buildings);
    this.physics.add.overlap(this.player, this.zombies, (_p, z) => this.onZombieTouch(z as unknown as Zombie));
    this.physics.add.overlap(this.player, this.pickups, (_p, pk) => this.collect(pk as unknown as Sprite));
    this.physics.add.overlap(this.bullets, this.zombies, (b, z) => this.onBulletZombie(b as unknown as Sprite, z as unknown as Zombie));
    this.physics.add.overlap(this.bullets, this.cars, (b, c) => this.onBulletCar(b as unknown as Sprite, c as unknown as Sprite));
    this.physics.add.overlap(this.bullets, this.buildings, (b) => {
      (b as unknown as Sprite).disableBody(true, true);
    });
    this.physics.add.overlap(this.bullets, this.barrels, (b, br) => {
      (b as unknown as Sprite).disableBody(true, true);
      this.explodeBarrel(br as unknown as Sprite);
    });

    for (let i = 0; i < 6; i++) this.spawnZombie("walker");
  }

  // ====================================================================
  update(time: number, delta: number) {
    this.updateFires(delta);
    this.dryDecals(time);
    if (!this.dead) this.expireCombo(time);
    if (this.dead) {
      if (this.keys.R.isDown) this.scene.restart();
      this.emitHud();
      return;
    }
    if (time < this.impactUntil) {
      this.emitHud();
      return;
    }
    if (this.physics.world.isPaused) this.physics.resume();
    this.elapsed += delta / 1000;
    this.handlePlayer(time);
    this.advanceWave(delta);
    this.updateSpawns(delta);
    this.updateZombies(time);
    this.updateBullets(time);
    this.updateProps(time);
    this.light.flash = Math.max(0, this.light.flash - delta / 90);
    this.emitHud();
  }

  private syncLight() {
    const cam = this.cameras.main;
    const shake = cam.shakeEffect as unknown as { isRunning: boolean; _offsetX: number; _offsetY: number };
    const offsetX = shake.isRunning ? shake._offsetX : 0;
    const offsetY = shake.isRunning ? shake._offsetY : 0;
    const screenX = (this.player.x - cam.scrollX + offsetX) / VIEW_W;
    const screenY = (this.player.y - cam.scrollY + offsetY) / VIEW_H;
    this.light.sync(screenX, 1 - screenY, -this.player.rotation);
    this.light.setLights(this.collectLights(offsetX, offsetY));
  }

  private collectLights(shakeX: number, shakeY: number): SceneLight[] {
    const lights: SceneLight[] = [];
    for (const fire of this.fires) {
      const strength = fire.life / fire.max;
      lights.push(this.worldLight({
        x: fire.x, y: fire.y, radius: 0.2 + strength * 0.08, strength,
        red: 1, green: 0.42, blue: 0.08, shakeX, shakeY,
      }));
    }
    for (const lamp of this.lamps) {
      lights.push(this.worldLight({
        x: lamp.x, y: lamp.y, radius: 0.16, strength: 0.38,
        red: 1, green: 0.86, blue: 0.55, shakeX, shakeY,
      }));
    }
    return lights;
  }

  private worldLight(input: SceneLight & { shakeX: number; shakeY: number }): SceneLight {
    const cam = this.cameras.main;
    return {
      x: (input.x - cam.scrollX + input.shakeX) / VIEW_W,
      y: 1 - (input.y - cam.scrollY + input.shakeY) / VIEW_H,
      radius: input.radius,
      strength: input.strength,
      red: input.red,
      green: input.green,
      blue: input.blue,
    };
  }

  // ---------------------------------------------------------------- mundo
  private placeStreet() {
    this.add.tileSprite(STREET_LEFT, 0, 42, WORLD_H, "sidewalk").setOrigin(0, 0).setDepth(1);
    this.add.tileSprite(STREET_RIGHT - 42, 0, 42, WORLD_H, "sidewalk").setOrigin(0, 0).setDepth(1);
    for (const block of streetBlocks()) this.addBuilding(block);
    for (const spot of curbCars()) this.addCurbCar(spot.x, spot.y);
    for (const spot of streetBarrels()) this.addBarrel(spot.x, spot.y);
    this.lamps = streetLamps();
    for (const lamp of this.lamps) this.add.image(lamp.x, lamp.y - 18, "lamp").setDepth(6);
  }

  private addBuilding(block: { x: number; y: number; width: number; height: number }) {
    const building = this.buildings.create(block.x, block.y, "building") as Sprite;
    building.setDisplaySize(block.width, block.height).setDepth(3).refreshBody();
  }

  private addCurbCar(x: number, y: number) {
    const color = Phaser.Utils.Array.GetRandom([...CAR_COLORS]);
    const car = this.cars.create(x, y, `car_${color}_v`) as Sprite;
    car.setDepth(6).setData("alarmUntil", 0).setData("hits", 0);
  }

  private addBarrel(x: number, y: number) {
    const barrel = this.barrels.create(x, y, "barrel") as Sprite;
    barrel.setDepth(6);
    (barrel.body as unknown as Phaser.Physics.Arcade.StaticBody).setCircle(12, 2, 2);
  }

  // ---------------------------------------------------------------- jogador
  private getPad(): Phaser.Input.Gamepad.Gamepad | null {
    const pad = this.input.gamepad?.getPad(0);
    return pad && pad.connected ? pad : null;
  }

  private handlePlayer(time: number) {
    let mx = (this.keys.D.isDown ? 1 : 0) - (this.keys.A.isDown ? 1 : 0);
    let my = (this.keys.S.isDown ? 1 : 0) - (this.keys.W.isDown ? 1 : 0);
    let firing = false;
    let aim = this.player.rotation;
    let padAim = false;

    const pad = this.getPad();
    if (pad) {
      const ls = pad.leftStick;
      const rs = pad.rightStick;
      if (ls.length() > 0.2) { mx = ls.x; my = ls.y; }
      if (rs.length() > 0.35) { aim = Math.atan2(rs.y, rs.x); padAim = true; firing = true; }
      if (pad.R2 > 0.3) firing = true;
      if (pad.R1 && !this.padR1) this.cycleWeapon(1);
      if (pad.L1 && !this.padL1) this.cycleWeapon(-1);
      this.padR1 = pad.R1 > 0;
      this.padL1 = pad.L1 > 0;
    }
    if (!padAim) {
      const ptr = this.input.activePointer;
      ptr.updateWorldPoint(this.cameras.main);
      aim = Phaser.Math.Angle.Between(this.player.x, this.player.y, ptr.worldX, ptr.worldY);
      if (ptr.isDown) firing = true;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    this.player.setVelocity(mx * PLAYER_SPEED, my * PLAYER_SPEED);
    this.player.setRotation(aim);

    if (time < this.invulnUntil) this.player.setTint(Math.floor(time / 80) % 2 ? 0xff5555 : 0xffffff);
    else this.player.clearTint();

    if (firing && time >= this.nextShot) this.shoot(time, aim);
  }

  private shoot(time: number, aim: number) {
    const w = WEAPONS[this.weapon];
    if (this.ammo[this.weapon] <= 0) {
      sfx.click();
      this.nextShot = time + 250;
      this.setWeapon("pistol");
      return;
    }
    this.nextShot = time + w.cooldown;
    if (Number.isFinite(this.ammo[this.weapon])) this.ammo[this.weapon]--;

    const mx = this.player.x + Math.cos(aim) * 30;
    const my = this.player.y + Math.sin(aim) * 30;
    for (let i = 0; i < w.pellets; i++) {
      const b = this.bullets.get(mx, my) as Sprite | null; // object pooling
      if (!b) continue;
      const a = aim + Phaser.Math.FloatBetween(-w.spread, w.spread);
      b.enableBody(true, mx, my, true, true);
      b.setDepth(11).setRotation(a);
      const body = b.body as Body;
      body.setCircle(4, 1, 1);
      this.physics.velocityFromRotation(a, w.speed * Phaser.Math.FloatBetween(0.92, 1.05), body.velocity);
      b.setData("dieAt", time + w.life).setData("dmg", w.damage);
    }
    WEAPON_SFX[this.weapon]();
    this.cameras.main.shake(60, w.shake);
    this.light.flash = 1; // clarão do cano ilumina o redor
  }

  private setWeapon(id: WeaponId) {
    if (this.ammo[id] > 0) this.weapon = id;
  }

  private cycleWeapon(dir: number) {
    let i = WEAPON_ORDER.indexOf(this.weapon);
    for (let n = 0; n < WEAPON_ORDER.length; n++) {
      i = (i + dir + WEAPON_ORDER.length) % WEAPON_ORDER.length;
      if (this.ammo[WEAPON_ORDER[i]] > 0) { this.weapon = WEAPON_ORDER[i]; return; }
    }
  }

  private hurt(dmg: number) {
    if (this.dead) return;
    this.hp -= dmg;
    this.invulnUntil = this.time.now + 500;
    sfx.hurt();
    this.cameras.main.shake(140, 0.007);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.physics.pause();
      this.player.setTint(0x550000);
    }
  }

  private onZombieTouch(z: Zombie) {
    if (this.dead || !z.active || this.time.now < this.invulnUntil) return;
    this.hurt(z.damage);
  }

  // ---------------------------------------------------------------- zumbis
  private advanceWave(delta: number) {
    const event = this.waves.advance(delta);
    if (event === "calm-started") this.dropCalmCache();
    if (event === "fight-started") this.openFight();
  }

  private openFight() {
    if (this.waves.modifier === "brute") this.spawnZombie("brute");
    if (this.waves.modifier === "alarms") this.alarmRandomCars();
  }

  private alarmRandomCars() {
    const cars = this.cars.getChildren().filter((child) => child.active) as Sprite[];
    for (let i = 0; i < ALARM_WAVE_CARS && cars.length > 0; i++) {
      const index = Phaser.Math.Between(0, cars.length - 1);
      const car = cars.splice(index, 1)[0];
      this.triggerAlarm(car, this.time.now);
    }
  }

  private updateSpawns(delta: number) {
    if (this.waves.phase === "calm") return;
    this.spawnTimer -= delta;
    if (this.spawnTimer > 0) return;
    const wave = this.waves.wave;
    this.spawnTimer = spawnIntervalMs(wave);
    if (this.zombies.countActive(true) >= maxAliveFor(wave)) return;
    this.spawnZombie(pickSpawnKind(wave, this.waves.modifier, Math.random()));
  }

  private spawnZombie(kind: ZombieKind, near?: { x: number; y: number }): boolean {
    const cam = this.cameras.main;
    const point = pickOffscreenPoint(cam.scrollX, cam.scrollY, near);
    if (!point) return false;
    const zombie = this.zombies.get(point.x, point.y) as Zombie | null;
    if (!zombie) return false;
    zombie.spawn(kind, point.x, point.y);
    return true;
  }

  private updateZombies(time: number) {
    const live = this.collectLiveZombies();
    this.separateZombies(live);
    this.rebuildFlow(time);
    for (const zombie of live) this.steerZombie(zombie, time);
    this.drawShadows(live);
    sfx.setHordeLevel(live.length / 36);
  }

  private drawShadows(live: Zombie[]) {
    const graphics = this.shadows;
    graphics.clear();
    graphics.fillStyle(0x000000, 0.45);
    graphics.fillEllipse(this.player.x, this.player.y + 8, 22, 10);
    for (const zombie of live) {
      const width = zombie.kind === "brute" ? 40 : 24;
      graphics.fillEllipse(zombie.x, zombie.y + 8, width, 11);
    }
  }

  private collectLiveZombies(): Zombie[] {
    const live = this.live;
    live.length = 0;
    for (const child of this.zombies.getChildren()) {
      const zombie = child as Zombie;
      if (!zombie.active) continue;
      zombie.sepX = 0;
      zombie.sepY = 0;
      live.push(zombie);
    }
    return live;
  }

  private separateZombies(live: Zombie[]) {
    for (let i = 0; i < live.length; i++) {
      const left = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const right = live[j];
        const dx = left.x - right.x;
        const dy = left.y - right.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq > 1600 || distanceSq === 0) continue;
        const distance = Math.sqrt(distanceSq);
        const push = (40 - distance) / 40;
        const nx = (dx / distance) * push;
        const ny = (dy / distance) * push;
        left.sepX += nx;
        left.sepY += ny;
        right.sepX -= nx;
        right.sepY -= ny;
      }
    }
  }

  private rebuildFlow(time: number) {
    if (time < this.flowReadyAt) return;
    this.flowReadyAt = time + FLOW_REBUILD_MS;
    this.flow.clear();
    for (const child of this.buildings.getChildren()) {
      const building = child as Sprite;
      this.flow.blockRect(building.x, building.y, building.displayWidth * 0.5, building.displayHeight * 0.5);
    }
    for (const child of this.cars.getChildren()) {
      const car = child as Sprite;
      if (!car.active) continue;
      this.flow.blockRect(car.x, car.y, car.width * 0.5, car.height * 0.5);
    }
    for (const child of this.barrels.getChildren()) {
      const barrel = child as Sprite;
      if (!barrel.active) continue;
      this.flow.blockCircle(barrel.x, barrel.y, 12);
    }
    this.flow.rebuild([{ x: this.player.x, y: this.player.y }]);
  }

  private steerZombie(zombie: Zombie, time: number) {
    const body = zombie.body as Body;
    if (time < zombie.hitUntil) {
      zombie.interruptCharge(time);
      body.velocity.scale(0.9);
      return;
    }
    if (zombie.isTinted) zombie.clearTint();
    const step = zombie.advanceCharge(time, this.player.x, this.player.y);
    if (step === "start") sfx.bruteWindup();
    if (step) return;
    const aim = this.aimDirection(zombie);
    const wobble = Math.sin(time / 300 + zombie.wobble) * 0.25;
    const vx = aim.x - aim.y * wobble + zombie.sepX * 1.2;
    const vy = aim.y + aim.x * wobble + zombie.sepY * 1.2;
    const length = Math.hypot(vx, vy) || 1;
    zombie.setRotation(Math.atan2(aim.y, aim.x));
    zombie.setVelocity((vx / length) * zombie.speed, (vy / length) * zombie.speed);
    const dist = Math.hypot(this.player.x - zombie.x, this.player.y - zombie.y);
    if (dist < 700 && Math.random() < 0.00004) sfx.groan(zombie.kind === "brute" ? 0.6 : 1);
  }

  private aimDirection(zombie: Zombie): { x: number; y: number } {
    const flow = this.flow.sample(zombie.x, zombie.y);
    if (flow) return flow;
    const dx = this.player.x - zombie.x;
    const dy = this.player.y - zombie.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  private damageZombie(z: Zombie, dmg: number, angle: number) {
    const def = ZOMBIES[z.kind];
    z.hp -= dmg;
    z.hitUntil = this.time.now + 70;
    z.setTintFill(0xffffff); // hit flash
    (z.body as Body).setVelocity(Math.cos(angle) * def.knockback, Math.sin(angle) * def.knockback);
    this.blood.explode(4, z.x, z.y);
    if (dmg >= 1.4) this.holdImpact(HIT_STOP_MS);
    if (z.hp <= 0) this.killZombie(z);
    else sfx.hit();
  }

  private killZombie(z: Zombie) {
    const def = ZOMBIES[z.kind];
    const brute = z.kind === "brute";
    this.blood.explode(brute ? 26 : 12, z.x, z.y);
    this.addDecal(z.x, z.y, 0xffffff, brute ? 1.6 : Phaser.Math.FloatBetween(0.7, 1.1));
    this.registerKill(def.score);
    this.kills++;
    sfx.hit();
    if (brute) this.cameras.main.shake(150, 0.006);
    this.dropPickup(z.x, z.y);
    z.disableBody(true, true);
  }

  private addDecal(x: number, y: number, tint: number, scale: number) {
    let d: Phaser.GameObjects.Image;
    if (this.decals.length >= MAX_DECALS) {
      d = this.decals.shift()!; // recicla o decal mais antigo
      d.setPosition(x, y);
    } else {
      d = this.add.image(x, y, "splat").setDepth(1);
    }
    d.setRotation(Math.random() * Math.PI * 2).setScale(scale).setTint(tint).setAlpha(0.85);
    d.setData("born", this.time.now).setData("blood", tint === 0xffffff);
    this.decals.push(d);
  }

  private dryDecals(time: number) {
    for (const decal of this.decals) {
      if (!decal.getData("blood")) continue;
      const age = Math.min(1, (time - (decal.getData("born") as number)) / DECAL_DRY_MS);
      const red = Math.round(120 - age * 78);
      decal.setTint(Phaser.Display.Color.GetColor(red, Math.round(red * 0.12), Math.round(red * 0.1)));
      decal.setAlpha(0.85 - age * 0.4);
    }
  }

  private registerKill(baseScore: number) {
    const now = this.time.now;
    this.combo = now <= this.comboUntil ? this.combo + 1 : 1;
    this.comboUntil = now + COMBO_WINDOW_MS;
    this.score += baseScore * Math.min(COMBO_CAP, this.combo);
    if (this.combo > 1 && this.combo % 5 === 0) sfx.comboMark();
  }

  private expireCombo(time: number) {
    if (this.combo === 0 || time <= this.comboUntil) return;
    this.combo = 0;
  }

  private holdImpact(ms: number) {
    if (this.time.now < this.impactUntil) return;
    this.impactUntil = this.time.now + ms;
    this.physics.pause();
  }

  // ---------------------------------------------------------------- projéteis
  private updateBullets(time: number) {
    for (const c of this.bullets.getChildren()) {
      const b = c as Sprite;
      if (b.active && time >= (b.getData("dieAt") as number)) b.disableBody(true, true);
    }
  }

  private onBulletZombie(b: Sprite, z: Zombie) {
    if (!b.active || !z.active) return;
    const dmg = b.getData("dmg") as number;
    const angle = b.rotation;
    b.disableBody(true, true);
    this.damageZombie(z, dmg, angle);
  }

  private onBulletCar(b: Sprite, car: Sprite) {
    if (!b.active || !car.active) return;
    b.disableBody(true, true);
    this.sparks.explode(3, b.x, b.y);
    this.triggerAlarm(car, this.time.now);
    const hits = (car.getData("hits") as number) + 1;
    car.setData("hits", hits);
    if (hits >= CAR_HITS) this.wreckCar(car);
  }

  private wreckCar(car: Sprite) {
    const { x, y } = car;
    car.destroy();
    this.flowReadyAt = 0;
    this.playBlast(x, y, CAR_BLAST_RADIUS);
    this.spawnPickup(x, y, Math.random() < 0.5 ? "smg" : "shotgun");
    this.ignite(x, y);
    this.applyBlast({ x, y, radius: CAR_BLAST_RADIUS, zombieDamage: CAR_ZOMBIE_DAMAGE, playerDamage: CAR_PLAYER_DAMAGE });
    this.chainFromBlast(x, y, CAR_BLAST_RADIUS);
  }

  private triggerAlarm(car: Sprite, time: number) {
    if ((car.getData("alarmUntil") as number) > time) return;
    car.setData("alarmUntil", time + ALARM_DURATION);
    sfx.alarm(ALARM_DURATION / 1000);
    for (let i = 0; i < ALARM_SPAWN_COUNT; i++) {
      const kind = pickSpawnKind(this.waves.wave, this.waves.modifier, Math.random());
      this.spawnZombie(kind, { x: car.x, y: car.y });
    }
  }

  // ---------------------------------------------------------------- explosões
  private explodeBarrel(barrel: Sprite) {
    if (!barrel.active) return;
    const { x, y } = barrel;
    barrel.destroy();
    this.playBlast(x, y, EXPLOSION_RADIUS);
    this.applyBlast({ x, y, radius: EXPLOSION_RADIUS, zombieDamage: BARREL_ZOMBIE_DAMAGE, playerDamage: BARREL_PLAYER_DAMAGE });
    this.chainBarrels(x, y, EXPLOSION_RADIUS * 1.15);
    this.alarmCars(x, y, EXPLOSION_RADIUS * 1.5);
  }

  private ignite(x: number, y: number) {
    const sprite = this.add.image(x, y, "flame").setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    this.fires.push({ x, y, life: CAR_FIRE_MS, max: CAR_FIRE_MS, sprite });
  }

  private updateFires(delta: number) {
    for (let index = this.fires.length - 1; index >= 0; index--) {
      const fire = this.fires[index];
      fire.life -= delta;
      if (fire.life <= 0) {
        fire.sprite.destroy();
        this.fires.splice(index, 1);
        continue;
      }
      const fade = fire.life / fire.max;
      const flicker = 0.85 + Math.sin(fire.life / 45) * 0.15;
      fire.sprite.setAlpha(fade).setScale((0.8 + fade * 0.7) * flicker);
    }
  }

  private playBlast(x: number, y: number, radius: number) {
    this.holdImpact(BLAST_STOP_MS);
    sfx.explosion();
    this.cameras.main.shake(320, 0.008 + radius / 18000);
    this.light.flash = 1;
    this.sparks.explode(Math.round(radius / 4), x, y);
    this.addDecal(x, y, 0x222222, radius / 55);
    const ring = this.add.circle(x, y, 20, 0xffa030, 0.85).setDepth(18);
    this.tweens.add({ targets: ring, scale: radius / 20, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
  }

  private applyBlast(blast: Blast) {
    const { x, y, radius, zombieDamage, playerDamage } = blast;
    for (const child of this.zombies.getChildren().slice()) {
      const zombie = child as Zombie;
      if (!zombie.active) continue;
      if (Phaser.Math.Distance.Squared(zombie.x, zombie.y, x, y) >= radius * radius) continue;
      this.damageZombie(zombie, zombieDamage, Math.atan2(zombie.y - y, zombie.x - x));
    }
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
    if (distance >= radius) return;
    const falloff = 1 - (distance / radius) * 0.6;
    this.hurt(Math.round(playerDamage * falloff));
  }

  private chainFromBlast(x: number, y: number, radius: number) {
    this.chainBarrels(x, y, radius);
    for (const child of this.cars.getChildren().slice()) {
      const car = child as Sprite;
      if (!car.active) continue;
      if (Phaser.Math.Distance.Between(car.x, car.y, x, y) > radius) continue;
      this.time.delayedCall(160, () => this.woundCar(car));
    }
  }

  private chainBarrels(x: number, y: number, radius: number) {
    for (const child of this.barrels.getChildren().slice()) {
      const barrel = child as Sprite;
      if (!barrel.active) continue;
      if (Phaser.Math.Distance.Between(barrel.x, barrel.y, x, y) > radius) continue;
      this.time.delayedCall(110, () => this.explodeBarrel(barrel));
    }
  }

  private alarmCars(x: number, y: number, radius: number) {
    for (const child of this.cars.getChildren()) {
      const car = child as Sprite;
      if (!car.active) continue;
      if (Phaser.Math.Distance.Between(car.x, car.y, x, y) > radius) continue;
      this.triggerAlarm(car, this.time.now);
    }
  }

  private woundCar(car: Sprite) {
    if (!car.active) return;
    this.triggerAlarm(car, this.time.now);
    const hits = (car.getData("hits") as number) + CAR_BLAST_HITS;
    car.setData("hits", hits);
    if (hits >= CAR_HITS) this.wreckCar(car);
  }

  // ---------------------------------------------------------------- props / pickups
  private updateProps(time: number) {
    for (const c of this.cars.getChildren()) {
      const car = c as Sprite;
      if ((car.getData("alarmUntil") as number) > time) {
        car.setTint(Math.floor(time / 250) % 2 === 0 ? 0xff7070 : 0xffffff);
        car.setData("blink", true);
      } else if (car.getData("blink")) {
        car.clearTint();
        car.setData("blink", false);
      }
    }
    for (const c of this.pickups.getChildren().slice()) {
      const pk = c as Sprite;
      if (!pk.active) continue;
      if (time > (pk.getData("dieAt") as number)) { pk.destroy(); continue; }
      pk.setScale(1 + Math.sin(time / 180) * 0.08);
    }
  }

  private dropPickup(x: number, y: number) {
    const kind = this.rollDrop();
    if (!kind) return;
    this.spawnPickup(x, y, kind);
  }

  private rollDrop(): PickupKind | null {
    const roll = Math.random();
    if (roll < DROP_HEALTH) return "health";
    if (roll < DROP_HEALTH + DROP_SMG) return "smg";
    if (roll < DROP_HEALTH + DROP_SMG + DROP_SHOTGUN) return "shotgun";
    return null;
  }

  private dropCalmCache() {
    const centerX = WORLD_W / 2;
    const centerY = WORLD_H / 2;
    this.spawnPickup(centerX - 28, centerY, "health");
    const gun = this.scarcerGun();
    if (gun) this.spawnPickup(centerX + 28, centerY, gun);
  }

  private scarcerGun(): "smg" | "shotgun" | null {
    const smgFill = this.ammo.smg / WEAPONS.smg.ammoMax;
    const shotgunFill = this.ammo.shotgun / WEAPONS.shotgun.ammoMax;
    if (smgFill >= 1 && shotgunFill >= 1) return null;
    if (smgFill <= shotgunFill) return "smg";
    return "shotgun";
  }

  private spawnPickup(x: number, y: number, kind: PickupKind) {
    const pickup = this.pickups.create(x, y, `pickup_${kind}`) as Sprite;
    pickup.setDepth(6).setData("kind", kind).setData("dieAt", this.time.now + PICKUP_LIFE_MS);
  }

  private collect(pk: Sprite) {
    if (!pk.active) return;
    if (!this.applyPickup(pk.getData("kind") as PickupKind)) return;
    sfx.pickup();
    pk.destroy();
  }

  private applyPickup(kind: PickupKind): boolean {
    if (kind === "health") {
      if (this.hp >= PLAYER_MAX_HP) return false;
      this.hp = Math.min(PLAYER_MAX_HP, this.hp + HEALTH_PICKUP);
      return true;
    }
    const weapon = WEAPONS[kind];
    if (this.ammo[kind] >= weapon.ammoMax) return false;
    this.ammo[kind] = Math.min(weapon.ammoMax, this.ammo[kind] + weapon.ammoPerPickup);
    return true;
  }

  private waveBanner(): string {
    if (this.hasActiveAlarm(this.time.now)) return "HORDA A CAMINHO";
    if (this.waves.phase === "calm") return "RESPIRO";
    if (this.waves.showingIntro) return `ONDA ${this.waves.wave} · ${modifierLabel(this.waves.modifier)}`;
    return "";
  }

  private hasActiveAlarm(time: number): boolean {
    for (const child of this.cars.getChildren()) {
      if ((child.getData("alarmUntil") as number) > time) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- HUD
  private emitHud() {
    const s: HudState = {
      hp: Math.ceil(this.hp),
      maxHp: PLAYER_MAX_HP,
      weapon: WEAPONS[this.weapon].name,
      ammo: this.ammo[this.weapon],
      score: this.score,
      kills: this.kills,
      dead: this.dead,
      wave: this.waves.wave,
      phaseSeconds: this.waves.secondsLeft,
      banner: this.waveBanner(),
      combo: Math.min(COMBO_CAP, this.combo),
      comboLeft: this.combo <= 1 ? 0 : Math.max(0, (this.comboUntil - this.time.now) / COMBO_WINDOW_MS),
    };
    this.events.emit("hud", s);
  }
}
