export type MenuAction = "pause" | "restart" | "none";

export function nextMenuAction(dead: boolean, startEdge: boolean, confirmEdge: boolean): MenuAction {
  if (!dead && startEdge) return "pause";
  if (dead && confirmEdge) return "restart";
  return "none";
}
