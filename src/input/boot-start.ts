export function wantsBootStart(pointer: boolean, key: boolean, pad: boolean): boolean {
  return pointer || key || pad;
}
