import type { ZombieCharge } from "../config";
import { remainMs } from "../time/remain-ms";

export type ChargeState = "idle" | "windup" | "dash";
export type ChargeStep = "start" | "hold" | "dash";

export class ChargeClock {
  state: ChargeState = "idle";
  leftMs = 0;
  cooldownLeft = 0;

  reset(): void {
    this.state = "idle";
    this.leftMs = 0;
    this.cooldownLeft = 0;
  }

  interrupt(cooldownMs: number): boolean {
    if (this.state === "idle") return false;
    this.state = "idle";
    this.leftMs = 0;
    this.cooldownLeft = cooldownMs;
    return true;
  }

  tickCooldown(deltaMs: number): void {
    if (this.state !== "idle") return;
    this.cooldownLeft = remainMs(this.cooldownLeft, deltaMs);
  }

  advance(deltaMs: number, inRange: boolean, charge: ZombieCharge): ChargeStep | null {
    if (this.state === "dash") return this.stepDash(deltaMs, charge);
    if (this.state === "windup") return this.stepWindup(deltaMs, charge);
    return this.tryWindup(deltaMs, inRange, charge);
  }

  private stepDash(deltaMs: number, charge: ZombieCharge): ChargeStep | null {
    this.leftMs = remainMs(this.leftMs, deltaMs);
    if (this.leftMs > 0) return "dash";
    this.state = "idle";
    this.cooldownLeft = charge.cooldownMs;
    return null;
  }

  private stepWindup(deltaMs: number, charge: ZombieCharge): ChargeStep {
    this.leftMs = remainMs(this.leftMs, deltaMs);
    if (this.leftMs > 0) return "hold";
    this.state = "dash";
    this.leftMs = charge.dashMs;
    return "dash";
  }

  private tryWindup(deltaMs: number, inRange: boolean, charge: ZombieCharge): ChargeStep | null {
    this.tickCooldown(deltaMs);
    if (this.cooldownLeft > 0 || !inRange) return null;
    this.state = "windup";
    this.leftMs = charge.windupMs;
    return "start";
  }
}
