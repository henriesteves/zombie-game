import { WEAPON_ORDER, type WeaponId } from "../config";

const TAU = Math.PI * 2;
const TOP = -Math.PI / 2;

export interface WheelInput {
  held: boolean;
  aimed: boolean;
  aim: number;
  ammo: Record<WeaponId, number>;
  current: WeaponId;
}

export interface WheelFrame {
  open: boolean;
  chosen: WeaponId | null;
}

export function weaponAtAngle(aim: number, order: readonly WeaponId[] = WEAPON_ORDER): WeaponId {
  const sector = TAU / order.length;
  let turned = (aim - TOP) % TAU;
  if (turned < 0) turned += TAU;
  return order[Math.floor(turned / sector) % order.length];
}

export class WeaponWheel {
  private wasHeld = false;
  private highlighted: WeaponId | null = null;

  get open(): boolean {
    return this.wasHeld;
  }

  get highlight(): WeaponId | null {
    return this.highlighted;
  }

  reset(): void {
    this.cancel();
  }

  cancel(): void {
    this.wasHeld = false;
    this.highlighted = null;
  }

  sample(input: WheelInput): WheelFrame {
    if (!input.held) return this.release(input);
    this.wasHeld = true;
    this.highlighted = input.aimed ? weaponAtAngle(input.aim) : input.current;
    return { open: true, chosen: null };
  }

  private release(input: WheelInput): WheelFrame {
    const chosen = this.wasHeld ? confirmedWeapon(this.highlighted, input.ammo, input.current) : null;
    this.cancel();
    return { open: false, chosen };
  }
}

function confirmedWeapon(highlight: WeaponId | null, ammo: Record<WeaponId, number>, current: WeaponId): WeaponId | null {
  if (!highlight || highlight === current) return null;
  if (ammo[highlight] <= 0) return null;
  return highlight;
}
