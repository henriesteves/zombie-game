import Phaser from "phaser";
import {
  ALARM_DURATION, ALARM_SPAWN_COUNT, ALARM_WAVE_CARS, COMBO_CAP, COMBO_WINDOW_MS,
  GAMEPAD_START_BUTTON, HIT_STOP_MS, PLAYER_MAX_HP, VIEW_H, VIEW_W,
  WEAPONS, WORLD_H, WORLD_W, ZOMBIES, startingAmmo, type WeaponId, type ZombieKind,
} from "../config";
import { FlowField } from "../ai/flow-field";
import { updateHorde } from "../ai/horde";
import * as sfx from "../audio/sfx";
import { DashState } from "../combat/dash-state";
import { DashTrail } from "../combat/dash-trail";
import { Explosions } from "../combat/explosions";
import { Gun } from "../combat/gun";
import { PlayerKnock } from "../combat/player-knock";
import { drawLaserSight } from "../combat/laser-sight";
import { SpitVolley } from "../combat/spit-volley";
import { Zombie } from "../entities/Zombie";
import { BloodDecals } from "../fx/blood-decals";
import { Corpses } from "../fx/corpses";
import { ScorePopups } from "../fx/score-popups";
import { FlashlightPipeline } from "../fx/FlashlightPipeline";
import { collectSceneLights } from "../fx/scene-lights";
import { nextMenuAction } from "../input/menu-action";
import { shouldResumeWorld } from "../input/pause-gate";
import { PickupDrops } from "../pickups/drops";
import { readHighScore, recordHighScore } from "../score/high-score";
import { isOutsideSpawnView, pickOffscreenPoint } from "../spawn/offscreen-point";
import { WaveDirector, maxAliveFor, modifierLabel, pickLiveKind, spawnIntervalMs } from "../waves/wave-director";
import { layStreet } from "../world/street-view";
import type { HudState } from "./UIScene";

type Sprite = Phaser.Physics.Arcade.Sprite;
type Body = Phaser.Physics.Arcade.Body;
type Keys = Record<"W" | "A" | "S" | "D" | "R" | "ESC" | "SPACE", Phaser.Input.Keyboard.Key>;

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

  private live: Zombie[] = [];
  private bloodDecals!: BloodDecals;
  private flow = new FlowField();
  private flowReadyAt = 0;
  private waves = new WaveDirector();
  private lamps: { x: number; y: number }[] = [];
  private shadows!: Phaser.GameObjects.Graphics;
  private explosions!: Explosions;
  private drops!: PickupDrops;
  private laser!: Phaser.GameObjects.Graphics;
  private impactUntil = 0;
  private combo = 0;
  private comboUntil = 0;
  private hp = PLAYER_MAX_HP;
  private dead = false;
  private weapon: WeaponId = "pistol";
  private ammo: Record<WeaponId, number> = startingAmmo();
  private score = 0;
  private bestScore = 0;
  private kills = 0;
  private elapsed = 0;
  private nextShot = 0;
  private invulnUntil = 0;
  private spawnTimer = 0;
  private padR1 = false;
  private padL1 = false;
  private padStartDown = false;
  private padConfirmDown = false;
  private paused = false;
  private dash = new DashState();
  private knock = new PlayerKnock();
  private dashTrail!: DashTrail;
  private gun!: Gun;
  private spits!: SpitVolley;
  private popups!: ScorePopups;
  private corpses!: Corpses;

  constructor() {
    super("Game");
  }

  private resetState() {
    this.hp = PLAYER_MAX_HP;
    this.dead = false;
    this.weapon = "pistol";
    this.ammo = startingAmmo();
    this.score = 0;
    this.bestScore = readHighScore();
    this.kills = 0;
    this.elapsed = 0;
    this.nextShot = 0;
    this.invulnUntil = 0;
    this.spawnTimer = 0;
    this.padR1 = false;
    this.padL1 = false;
    this.padStartDown = false;
    this.padConfirmDown = false;
    this.paused = false;
    this.flowReadyAt = 0;
    this.waves.reset();
    this.impactUntil = 0;
    this.combo = 0;
    this.comboUntil = 0;
    this.dash.reset();
    this.knock.reset();
  }

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
    this.lamps = layStreet(this, this.buildings, this.cars, this.barrels);
    this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2, "player").setDepth(12).setCollideWorldBounds(true);
    (this.player.body as Body).setCircle(14, 10, 10);
    this.spits = new SpitVolley(this, this.player, this.buildings, (damage) => this.hurt(damage));
    this.blood = this.add.particles(0, 0, "blood_dot", {
      speed: { min: 60, max: 260 }, lifespan: { min: 250, max: 600 },
      scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 }, emitting: false,
    }).setDepth(20);
    this.sparks = this.add.particles(0, 0, "spark", {
      speed: { min: 120, max: 420 }, lifespan: { min: 300, max: 800 },
      scale: { start: 1.4, end: 0 }, blendMode: "ADD", emitting: false,
    }).setDepth(20);
    this.shadows = this.add.graphics().setDepth(4);
    this.laser = this.add.graphics().setDepth(14);
    this.bloodDecals = new BloodDecals(this);
    this.popups = new ScorePopups(this);
    this.corpses = new Corpses(this);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.centerOn(this.player.x, this.player.y);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setPostPipeline("Flashlight");
    const fx = cam.getPostPipeline("Flashlight");
    this.light = (Array.isArray(fx) ? fx[0] : fx) as FlashlightPipeline;
    this.light.aspect = VIEW_W / VIEW_H;
    this.drops = new PickupDrops(this.pickups, {
      now: () => this.time.now,
      getHp: () => this.hp,
      setHp: (hp) => { this.hp = hp; },
      ammo: this.ammo,
      playPickup: () => sfx.pickup(),
    });
    this.explosions = new Explosions(this, {
      damageZombie: (zombie, damage, angle) => this.damageZombie(zombie, damage, angle),
      hurt: (damage, origin) => this.hurt(damage, origin),
      holdImpact: (ms) => this.holdImpact(ms),
      addDecal: (x, y, tint, scale) => this.bloodDecals.add(x, y, tint, scale),
      spawnPickup: (x, y, kind) => this.drops.spawn(x, y, kind),
      triggerAlarm: (car) => this.triggerAlarm(car, this.time.now),
      clearFlow: () => { this.flowReadyAt = 0; },
      player: () => this.player,
      zombies: () => this.zombies.getChildren() as Zombie[],
      barrels: () => this.barrels.getChildren() as Sprite[],
      cars: () => this.cars.getChildren() as Sprite[],
      sparks: this.sparks,
      light: this.light,
    });
    cam.on(Phaser.Cameras.Scene2D.Events.PRE_RENDER, this.syncLight, this);
    this.dashTrail = new DashTrail(this);
    this.gun = new Gun({
      ammo: this.ammo,
      light: this.light,
      weapon: () => this.weapon,
      setWeapon: (id) => { this.weapon = id; },
      nextShot: () => this.nextShot,
      setNextShot: (time) => { this.nextShot = time; },
      player: () => this.player,
      bullets: () => this.bullets,
      physics: () => this.physics,
      camera: () => this.cameras.main,
    });
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("W,A,S,D,R,ESC,SPACE") as Keys;
    this.keys.ESC.on("down", this.onEscape, this);
    this.keys.R.on("down", this.onRestartKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.keys.ESC.off("down", this.onEscape, this);
      this.keys.R.off("down", this.onRestartKey, this);
    });
    kb.on("keydown-ONE", () => this.gun.set("pistol"));
    kb.on("keydown-TWO", () => this.gun.set("smg"));
    kb.on("keydown-THREE", () => this.gun.set("shotgun"));
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => this.gun.cycle(dy > 0 ? 1 : -1));
    this.physics.add.collider(this.player, this.cars);
    this.physics.add.collider(this.player, this.barrels);
    this.physics.add.collider(this.player, this.buildings);
    this.physics.add.collider(this.zombies, this.cars);
    this.physics.add.collider(this.zombies, this.barrels);
    this.physics.add.collider(this.zombies, this.buildings);
    this.physics.add.overlap(this.player, this.zombies, (_p, z) => this.onZombieTouch(z as unknown as Zombie));
    this.physics.add.overlap(this.player, this.pickups, (_p, pk) => this.drops.collect(pk as unknown as Sprite));
    this.physics.add.overlap(this.bullets, this.zombies, (b, z) => this.onBulletZombie(b as unknown as Sprite, z as unknown as Zombie));
    this.physics.add.overlap(this.bullets, this.cars, (b, c) => this.onBulletCar(b as unknown as Sprite, c as unknown as Sprite));
    this.physics.add.overlap(this.bullets, this.buildings, (b) => {
      (b as unknown as Sprite).disableBody(true, true);
    });
    this.physics.add.overlap(this.bullets, this.barrels, (b, br) => {
      (b as unknown as Sprite).disableBody(true, true);
      this.explosions.explodeBarrel(br as unknown as Sprite);
    });
    for (let i = 0; i < 6; i++) this.spawnZombie("walker");
  }

  update(time: number, delta: number) {
    this.readPauseInput();
    const wantsDash = this.dash.takeEdges(this.keys.SPACE.isDown, Boolean(this.getPad()?.B));
    if (!this.paused) {
      this.explosions.update(delta);
      this.bloodDecals.dry(time);
    }
    if (!this.dead && !this.paused) this.expireCombo(time);
    if (this.dead || this.paused) {
      this.laser.clear();
      this.emitHud();
      return;
    }
    if (!shouldResumeWorld(this.paused, time, this.impactUntil)) {
      this.emitHud();
      return;
    }
    if (this.physics.world.isPaused) this.physics.resume();
    this.elapsed += delta / 1000;
    this.handlePlayer(time, delta, wantsDash);
    this.advanceWave(delta);
    this.updateSpawns(delta);
    this.updateZombies(time);
    this.spits.advance(time, delta, this.live, this.player);
    this.popups.advance(delta);
    this.corpses.advance(delta);
    this.updateBullets(time);
    this.updateProps(time, delta);
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
    this.light.setLights(collectSceneLights({
      fires: this.explosions.fires,
      lamps: this.lamps,
      camera: cam,
      viewWidth: VIEW_W,
      viewHeight: VIEW_H,
      shakeX: offsetX,
      shakeY: offsetY,
    }));
  }

  private onEscape() {
    if (this.dead) return;
    this.togglePause();
  }

  private onRestartKey() {
    if (!this.dead) return;
    this.scene.restart();
  }

  private readPauseInput() {
    const pad = this.getPad();
    const startDown = this.isStartDown(pad);
    const confirmDown = Boolean(pad?.A);
    const action = nextMenuAction(this.dead, startDown && !this.padStartDown, confirmDown && !this.padConfirmDown);
    if (action === "pause") this.togglePause();
    if (action === "restart") this.scene.restart();
    this.padStartDown = startDown;
    this.padConfirmDown = confirmDown;
  }

  private isStartDown(pad: Phaser.Input.Gamepad.Gamepad | null): boolean {
    if (!pad || pad.buttons.length <= GAMEPAD_START_BUTTON) return false;
    return pad.isButtonDown(GAMEPAD_START_BUTTON);
  }

  private togglePause() {
    if (this.dead) return;
    this.paused = !this.paused;
    if (!this.paused) return;
    this.physics.pause();
    this.laser.clear();
  }

  private getPad(): Phaser.Input.Gamepad.Gamepad | null {
    const pad = this.input.gamepad?.getPad(0);
    return pad && pad.connected ? pad : null;
  }

  private handlePlayer(time: number, delta: number, wantsDash: boolean) {
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
      if (pad.R1 && !this.padR1) this.gun.cycle(1);
      if (pad.L1 && !this.padL1) this.gun.cycle(-1);
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
    const motion = this.dash.velocity(delta, wantsDash, mx, my, aim);
    const knock = this.knock.velocity(delta);
    this.player.setVelocity(knock?.x ?? motion.x, knock?.y ?? motion.y);
    this.dashTrail.paint(this.player.x, this.player.y, delta, this.dash.active);
    this.player.setRotation(aim);
    if (time < this.invulnUntil) this.player.setTint(Math.floor(time / 80) % 2 ? 0xff5555 : 0xffffff);
    else this.player.clearTint();
    if (firing) this.gun.shoot(time, aim);
    this.drawLaser();
  }

  private drawLaser() {
    drawLaserSight(this.laser, this.player, {
      buildings: this.buildings.getChildren() as Sprite[],
      cars: this.cars.getChildren() as Sprite[],
      barrels: this.barrels.getChildren() as Sprite[],
      zombies: this.zombies.getChildren() as Zombie[],
    });
  }

  private hurt(dmg: number, origin?: { x: number; y: number }) {
    if (this.dead || dmg <= 0) return;
    this.hp -= dmg;
    const survived = this.hp > 0;
    if (survived && origin) this.knock.replace(this.player.x, this.player.y, origin.x, origin.y);
    this.invulnUntil = this.time.now + 500;
    sfx.hurt();
    this.cameras.main.shake(140, 0.007);
    if (survived) return;
    this.hp = 0;
    this.dead = true;
    this.knock.reset();
    this.dash.cancel();
    this.dashTrail.reset();
    this.bestScore = recordHighScore(this.score);
    this.physics.pause();
    this.player.setTint(0x550000);
  }

  private onZombieTouch(z: Zombie) {
    if (this.dead || !z.active || this.time.now < this.invulnUntil) return;
    this.hurt(z.damage, z);
  }

  private advanceWave(delta: number) {
    const event = this.waves.advance(delta);
    if (event === "calm-started") this.beginCalm();
    if (event === "fight-started") this.openFight();
  }

  private beginCalm() {
    this.releaseOffscreenZombies();
    this.drops.dropCalmCache();
  }

  private releaseOffscreenZombies() {
    const camera = this.cameras.main;
    for (const child of this.zombies.getChildren()) {
      const zombie = child as Zombie;
      if (!zombie.active) continue;
      if (!isOutsideSpawnView(zombie.x, zombie.y, camera.scrollX, camera.scrollY)) continue;
      zombie.disableBody(true, true);
    }
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
    this.spawnZombie(this.rollZombie());
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
    this.flowReadyAt = updateHorde({
      time,
      flowReadyAt: this.flowReadyAt,
      live: this.live,
      flow: this.flow,
      buildings: this.buildings.getChildren() as Sprite[],
      cars: this.cars.getChildren() as Sprite[],
      barrels: this.barrels.getChildren() as Sprite[],
      zombies: this.zombies.getChildren() as Zombie[],
      player: this.player,
      shadows: this.shadows,
    });
  }

  private damageZombie(z: Zombie, dmg: number, angle: number) {
    const def = ZOMBIES[z.kind];
    z.hp -= dmg;
    z.syncSwell();
    z.hitUntil = this.time.now + 70;
    z.setTintFill(0xffffff); // hit flash
    (z.body as Body).setVelocity(Math.cos(angle) * def.knockback, Math.sin(angle) * def.knockback);
    this.blood.explode(4, z.x, z.y);
    if (dmg >= 1.4) this.holdImpact(HIT_STOP_MS);
    if (z.hp <= 0) this.killZombie(z);
    else sfx.hit();
  }

  private rollZombie(): ZombieKind {
    return pickLiveKind(this.waves.phase, this.waves.wave, this.waves.modifier, Math.random());
  }

  private killZombie(z: Zombie) {
    const def = ZOMBIES[z.kind];
    const brute = z.kind === "brute";
    const blastX = z.x;
    const blastY = z.y;
    const detonates = z.kind === "bloater" && !z.suppressBlast;
    if (detonates) z.suppressBlast = true;
    this.blood.explode(brute ? 26 : 12, z.x, z.y);
    this.bloodDecals.add(z.x, z.y, 0xffffff, brute ? 1.6 : Phaser.Math.FloatBetween(0.7, 1.1));
    this.popups.spawn(z.x, z.y, this.registerKill(def.score));
    this.kills++;
    sfx.hit();
    if (brute) this.cameras.main.shake(150, 0.006);
    this.corpses.leave(z, "kill");
    this.drops.drop(z.x, z.y);
    z.setScale(1).disableBody(true, true);
    if (detonates) this.explosions.detonateBloater(blastX, blastY);
  }

  private registerKill(baseScore: number): number {
    const now = this.time.now;
    this.combo = now <= this.comboUntil ? this.combo + 1 : 1;
    this.comboUntil = now + COMBO_WINDOW_MS;
    const gained = baseScore * Math.min(COMBO_CAP, this.combo);
    this.score += gained;
    if (this.combo > 1 && this.combo % 5 === 0) sfx.comboMark();
    return gained;
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
    this.explosions.strikeCar(car);
  }

  private triggerAlarm(car: Sprite, time: number) {
    if ((car.getData("alarmUntil") as number) > time) return;
    car.setData("alarmUntil", time + ALARM_DURATION);
    sfx.alarm(ALARM_DURATION / 1000);
    for (let i = 0; i < ALARM_SPAWN_COUNT; i++) {
      const kind = this.rollZombie();
      this.spawnZombie(kind, { x: car.x, y: car.y });
    }
  }

  private updateProps(time: number, delta: number) {
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
    this.drops.update(time, delta, this.player, this.buildings.getChildren() as Sprite[]);
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

  private emitHud() {
    const s: HudState = {
      hp: Math.ceil(this.hp),
      maxHp: PLAYER_MAX_HP,
      weapon: WEAPONS[this.weapon].name,
      ammo: this.ammo[this.weapon],
      ammoMax: WEAPONS[this.weapon].ammoMax,
      score: this.score,
      bestScore: this.bestScore,
      kills: this.kills,
      dead: this.dead,
      wave: this.waves.wave,
      phaseSeconds: this.waves.secondsLeft,
      banner: this.waveBanner(),
      combo: Math.min(COMBO_CAP, this.combo),
      comboLeft: this.combo <= 1 ? 0 : Math.max(0, (this.comboUntil - this.time.now) / COMBO_WINDOW_MS),
      paused: this.paused && !this.dead,
      dashRecharge: this.dash.recharge,
      threats: this.live.map((zombie) => ({ x: zombie.x, y: zombie.y, kind: zombie.kind })),
      scrollX: this.cameras.main.scrollX,
      scrollY: this.cameras.main.scrollY,
    };
    this.events.emit("hud", s);
  }
}
