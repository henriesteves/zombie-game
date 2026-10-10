import Phaser from "phaser";
import {
  ALARM_DURATION, ALARM_SPAWN_COUNT, EXPLOSION_RADIUS, PLAYER_MAX_HP, PLAYER_SPEED, VIEW_H, VIEW_W,
  WEAPONS, WEAPON_ORDER, WORLD_H, WORLD_W, ZOMBIES, type WeaponId, type ZombieKind,
} from "../config";
import { CAR_COLORS } from "../assets/proceduralTextures";
import * as sfx from "../audio/sfx";
import { Zombie } from "../entities/Zombie";
import { FlashlightPipeline } from "../fx/FlashlightPipeline";
import { pickOffscreenPoint } from "../spawn/offscreen-point";
import type { HudState } from "./UIScene";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;
type Keys = Record<"W" | "A" | "S" | "D" | "R", Phaser.Input.Keyboard.Key>;

const WEAPON_SFX: Record<WeaponId, () => void> = { pistol: sfx.pistol, smg: sfx.smg, shotgun: sfx.shotgun };
const MAX_DECALS = 120;

export class GameScene extends Phaser.Scene {
  private player!: Sprite;
  private zombies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private cars!: Phaser.Physics.Arcade.StaticGroup;
  private barrels!: Phaser.Physics.Arcade.StaticGroup;
  private blood!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private light!: FlashlightPipeline;
  private keys!: Keys;

  private decals: Phaser.GameObjects.Image[] = [];
  private live: Zombie[] = []; // buffer reutilizado a cada frame (sem alocação)

  // estado da partida (reiniciado em resetState)
  private hp = PLAYER_MAX_HP;
  private dead = false;
  private weapon: WeaponId = "pistol";
  private ammo: Record<WeaponId, number> = { pistol: Infinity, smg: 90, shotgun: 24 };
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
    this.ammo = { pistol: Infinity, smg: 90, shotgun: 24 };
    this.score = 0;
    this.kills = 0;
    this.elapsed = 0;
    this.nextShot = 0;
    this.invulnUntil = 0;
    this.spawnTimer = 0;
    this.padR1 = false;
    this.padL1 = false;
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
    this.pickups = this.physics.add.group();
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, defaultKey: "bullet", maxSize: 140 });
    this.zombies = this.physics.add.group({ classType: Zombie, maxSize: 160, collideWorldBounds: true });

    this.placeProps();

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
    this.physics.add.collider(this.zombies, this.cars);
    this.physics.add.collider(this.zombies, this.barrels);
    this.physics.add.overlap(this.player, this.zombies, (_p, z) => this.onZombieTouch(z as unknown as Zombie));
    this.physics.add.overlap(this.player, this.pickups, (_p, pk) => this.collect(pk as unknown as Sprite));
    this.physics.add.overlap(this.bullets, this.zombies, (b, z) => this.onBulletZombie(b as unknown as Sprite, z as unknown as Zombie));
    this.physics.add.overlap(this.bullets, this.cars, (b, c) => this.onBulletCar(b as unknown as Sprite, c as unknown as Sprite));
    this.physics.add.overlap(this.bullets, this.barrels, (b, br) => {
      (b as unknown as Sprite).disableBody(true, true);
      this.explodeBarrel(br as unknown as Sprite);
    });

    for (let i = 0; i < 6; i++) this.spawnZombie("walker");
  }

  // ====================================================================
  update(time: number, delta: number) {
    if (this.dead) {
      if (this.keys.R.isDown) this.scene.restart();
      this.emitHud();
      return;
    }
    this.elapsed += delta / 1000;
    this.handlePlayer(time);
    this.updateSpawns(delta);
    this.updateZombies(time, delta);
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
  }

  // ---------------------------------------------------------------- mundo
  private placeProps() {
    const placed: { x: number; y: number; r: number }[] = [{ x: WORLD_W / 2, y: WORLD_H / 2, r: 260 }]; // área livre do spawn
    const spot = (r: number) => {
      for (let i = 0; i < 60; i++) {
        const x = Phaser.Math.Between(120, WORLD_W - 120);
        const y = Phaser.Math.Between(120, WORLD_H - 120);
        if (placed.every((p) => Phaser.Math.Distance.Between(x, y, p.x, p.y) > p.r + r)) {
          placed.push({ x, y, r });
          return { x, y };
        }
      }
      return null;
    };

    for (let i = 0; i < 14; i++) {
      const s = spot(70);
      if (!s) continue;
      const color = Phaser.Utils.Array.GetRandom([...CAR_COLORS]);
      const orient = Math.random() < 0.5 ? "v" : "h";
      const car = this.cars.create(s.x, s.y, `car_${color}_${orient}`) as Sprite;
      car.setDepth(5).setData("alarmUntil", 0);
    }
    for (let i = 0; i < 12; i++) {
      const s = spot(30);
      if (!s) continue;
      const barrel = this.barrels.create(s.x, s.y, "barrel") as Sprite;
      barrel.setDepth(5);
      (barrel.body as unknown as Phaser.Physics.Arcade.StaticBody).setCircle(12, 2, 2);
    }
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
  private pickKind(): ZombieKind {
    const r = Math.random();
    if (this.elapsed > 45 && r < 0.08) return "brute";
    if (this.elapsed > 15 && r < 0.3) return "runner";
    return "walker";
  }

  private updateSpawns(delta: number) {
    this.spawnTimer -= delta;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = Math.max(160, 900 - this.elapsed * 7); // acelera com o tempo
    const maxAlive = Math.min(150, 25 + this.elapsed * 0.9);
    if (this.zombies.countActive(true) < maxAlive) this.spawnZombie(this.pickKind());
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

  private updateZombies(time: number, delta: number) {
    const live = this.live;
    live.length = 0;
    for (const c of this.zombies.getChildren()) {
      const z = c as Zombie;
      if (z.active) { z.sepX = 0; z.sepY = 0; live.push(z); }
    }

    // Separação O(n²) simples (n ≤ 160): evita todos empilharem no mesmo ponto
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1600 || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const f = (40 - d) / 40;
        const nx = (dx / d) * f;
        const ny = (dy / d) * f;
        a.sepX += nx; a.sepY += ny;
        b.sepX -= nx; b.sepY -= ny;
      }
    }

    const alarms: Sprite[] = [];
    for (const c of this.cars.getChildren()) {
      const car = c as Sprite;
      if ((car.getData("alarmUntil") as number) > time) alarms.push(car);
    }

    const px = this.player.x;
    const py = this.player.y;
    for (const z of live) {
      const body = z.body as Body;
      if (time < z.hitUntil) { body.velocity.scale(0.9); continue; } // knockback em andamento
      if (z.isTinted) z.clearTint();

      // Alvo: o jogador, ou um carro com alarme (se o jogador não estiver perto)
      let tx = px;
      let ty = py;
      if (alarms.length && Phaser.Math.Distance.Squared(z.x, z.y, px, py) > 260 * 260) {
        for (const car of alarms) {
          if (Phaser.Math.Distance.Squared(z.x, z.y, car.x, car.y) < 1000 * 1000) { tx = car.x; ty = car.y; break; }
        }
      }

      let dx = tx - z.x;
      let dy = ty - z.y;
      const dist = Math.hypot(dx, dy) || 1;
      dx /= dist; dy /= dist;
      z.rotation = Math.atan2(dy, dx);

      // Contorno de obstáculo: se ficou encostado em carro/barril, gira ~63° para o seu lado
      if (!body.touching.none) z.stuckMs += delta;
      else z.stuckMs = Math.max(0, z.stuckMs - delta * 2);
      if (z.stuckMs > 120) {
        const rot = z.side * 1.1;
        const cs = Math.cos(rot);
        const sn = Math.sin(rot);
        const nx = dx * cs - dy * sn;
        const ny = dx * sn + dy * cs;
        dx = nx; dy = ny;
      }

      const wob = Math.sin(time / 300 + z.wobble) * 0.25; // andar "torto"
      let vx = dx - dy * wob + z.sepX * 1.2;
      let vy = dy + dx * wob + z.sepY * 1.2;
      const len = Math.hypot(vx, vy) || 1;
      vx = (vx / len) * z.speed;
      vy = (vy / len) * z.speed;
      z.setVelocity(vx, vy);

      if (dist < 700 && Math.random() < 0.00004) sfx.groan(z.kind === "brute" ? 0.6 : 1);
    }
  }

  private damageZombie(z: Zombie, dmg: number, angle: number) {
    const def = ZOMBIES[z.kind];
    z.hp -= dmg;
    z.hitUntil = this.time.now + 70;
    z.setTintFill(0xffffff); // hit flash
    (z.body as Body).setVelocity(Math.cos(angle) * def.knockback, Math.sin(angle) * def.knockback);
    this.blood.explode(4, z.x, z.y);
    if (z.hp <= 0) this.killZombie(z);
    else sfx.hit();
  }

  private killZombie(z: Zombie) {
    const def = ZOMBIES[z.kind];
    const brute = z.kind === "brute";
    this.blood.explode(brute ? 26 : 12, z.x, z.y);
    this.addDecal(z.x, z.y, 0xffffff, brute ? 1.6 : Phaser.Math.FloatBetween(0.7, 1.1));
    this.score += def.score;
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
    d.setRotation(Math.random() * Math.PI * 2).setScale(scale).setTint(tint).setAlpha(0.8);
    this.decals.push(d);
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
    if (!b.active) return;
    this.sparks.explode(3, b.x, b.y);
    b.disableBody(true, true);
    this.triggerAlarm(car, this.time.now);
  }

  private triggerAlarm(car: Sprite, time: number) {
    if ((car.getData("alarmUntil") as number) > time) return;
    car.setData("alarmUntil", time + ALARM_DURATION);
    sfx.alarm(ALARM_DURATION / 1000);
    for (let i = 0; i < ALARM_SPAWN_COUNT; i++) this.spawnZombie(this.pickKind(), { x: car.x, y: car.y });
  }

  // ---------------------------------------------------------------- explosões
  private explodeBarrel(barrel: Sprite) {
    if (!barrel.active) return;
    const { x, y } = barrel;
    barrel.destroy();

    sfx.explosion();
    this.cameras.main.shake(320, 0.012);
    this.light.flash = 1;
    this.sparks.explode(36, x, y);
    this.addDecal(x, y, 0x222222, 2.4);
    const ring = this.add.circle(x, y, 20, 0xffa030, 0.85).setDepth(18);
    this.tweens.add({ targets: ring, scale: EXPLOSION_RADIUS / 20, alpha: 0, duration: 280, onComplete: () => ring.destroy() });

    const R = EXPLOSION_RADIUS;
    for (const c of this.zombies.getChildren().slice()) {
      const z = c as Zombie;
      if (z.active && Phaser.Math.Distance.Squared(z.x, z.y, x, y) < R * R) {
        this.damageZombie(z, 20, Math.atan2(z.y - y, z.x - x));
      }
    }
    const dp = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
    if (dp < R) this.hurt(Math.round(35 * (1 - (dp / R) * 0.6))); // fogo amigo!

    for (const c of this.barrels.getChildren().slice()) {
      const other = c as Sprite;
      if (other.active && Phaser.Math.Distance.Between(other.x, other.y, x, y) < R * 1.15) {
        this.time.delayedCall(110, () => this.explodeBarrel(other)); // reação em cadeia
      }
    }
    for (const c of this.cars.getChildren()) {
      const car = c as Sprite;
      if (Phaser.Math.Distance.Between(car.x, car.y, x, y) < R * 1.5) this.triggerAlarm(car, this.time.now);
    }
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
    const r = Math.random();
    const kind = r < 0.12 ? "ammo" : r < 0.17 ? "health" : null;
    if (!kind) return;
    const pk = this.pickups.create(x, y, `pickup_${kind}`) as Sprite;
    pk.setDepth(6).setData("kind", kind).setData("dieAt", this.time.now + 20000);
  }

  private collect(pk: Sprite) {
    if (!pk.active) return;
    if (pk.getData("kind") === "health") {
      this.hp = Math.min(PLAYER_MAX_HP, this.hp + 25);
    } else {
      for (const id of ["smg", "shotgun"] as const) {
        this.ammo[id] = Math.min(WEAPONS[id].ammoMax, this.ammo[id] + WEAPONS[id].ammoPerPickup);
      }
    }
    sfx.pickup();
    pk.destroy();
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
      seconds: this.elapsed,
      dead: this.dead,
      alarm: this.hasActiveAlarm(this.time.now),
    };
    this.events.emit("hud", s);
  }
}
