import Phaser from "phaser";
import { STREET_LEFT, STREET_RIGHT, WORLD_H } from "../config";
import { CAR_COLORS } from "../assets/proceduralTextures";
import { placeStreetProps, streetBlocks, type StreetPoint } from "./street";

type Sprite = Phaser.Physics.Arcade.Sprite;

const SIDEWALK_WIDTH = 42;
const BARREL_RADIUS = 12;
const LAMP_OFFSET_Y = 18;

export function layStreet(
  scene: Phaser.Scene,
  buildings: Phaser.Physics.Arcade.StaticGroup,
  cars: Phaser.Physics.Arcade.StaticGroup,
  barrels: Phaser.Physics.Arcade.StaticGroup,
): StreetPoint[] {
  scene.add.tileSprite(STREET_LEFT, 0, SIDEWALK_WIDTH, WORLD_H, "sidewalk").setOrigin(0, 0).setDepth(1);
  scene.add.tileSprite(STREET_RIGHT - SIDEWALK_WIDTH, 0, SIDEWALK_WIDTH, WORLD_H, "sidewalk").setOrigin(0, 0).setDepth(1);
  for (const block of streetBlocks()) addBuilding(buildings, block);
  const props = placeStreetProps(() => Math.random());
  for (const spot of props.cars) addCurbCar(cars, spot.x, spot.y);
  for (const spot of props.barrels) addBarrel(barrels, spot.x, spot.y);
  for (const lamp of props.lamps) scene.add.image(lamp.x, lamp.y - LAMP_OFFSET_Y, "lamp").setDepth(6);
  return props.lamps;
}

function addBuilding(
  buildings: Phaser.Physics.Arcade.StaticGroup,
  block: { x: number; y: number; width: number; height: number },
) {
  const building = buildings.create(block.x, block.y, "building") as Sprite;
  building.setDisplaySize(block.width, block.height).setDepth(3).refreshBody();
}

function addCurbCar(cars: Phaser.Physics.Arcade.StaticGroup, x: number, y: number) {
  const color = Phaser.Utils.Array.GetRandom([...CAR_COLORS]);
  const car = cars.create(x, y, `car_${color}_v`) as Sprite;
  car.setDepth(6).setData("alarmLeft", 0).setData("alarmBlink", 0).setData("hits", 0);
}

function addBarrel(barrels: Phaser.Physics.Arcade.StaticGroup, x: number, y: number) {
  const barrel = barrels.create(x, y, "barrel") as Sprite;
  barrel.setDepth(6);
  (barrel.body as unknown as Phaser.Physics.Arcade.StaticBody).setCircle(BARREL_RADIUS, 2, 2);
}
