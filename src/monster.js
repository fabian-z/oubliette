import { getRandomName } from "./lang.js";
import { getRandomInt, Vector2 } from './util.js';

// TODO Autonomous movement
export class Monster {
    name;
    pos = new Vector2(0, 0);
    type;
    symbol;
    speed;
    active = false;
    health = 100;
    damage;
    xp;
    loot = [];
}

let types = [
    {name: 'Orc', symbol: "O", speed: 1},
    {name: 'Bat', symbol: "B", speed: 2},
    {name: 'Rat', symbol: "R", speed: 1},
    {name: 'Undead', symbol: "U", speed: 1},
    {name: 'Troll', symbol: "T", speed: 1},
    {name: 'Warg', symbol: "W", speed: 1},
    {name: 'Spider', symbol: "S", speed: 1}
];

export function getRandomType() {
    let i = getRandomInt(0, types.length);
    return types[i];
}

export function generateRandomMonster() {
    let monster = new Monster();
    monster.name = getRandomName();

    let type = getRandomType();
    monster.type = type.name;
    monster.symbol = type.symbol;
    monster.speed = type.speed;
    
    // TODO make configurable
    monster.damage = getRandomInt(1, 10);
    monster.xp = getRandomInt(1, 10);

    // TODO generate loot
    return monster
}




