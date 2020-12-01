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
    {name: 'Orc', symbol: "O", damage: 5, speed: 1},
    {name: 'Bat', symbol: "B", damage: 1, speed: 1},
    {name: 'Rat', symbol: "R", damage: 2, speed: 1},
    {name: 'Undead', symbol: "U", damage: 5, speed: 1},
    {name: 'Troll', symbol: "T", damage: 5, speed: 1},
    {name: 'Warg', symbol: "W", damage: 3, speed: 1},
    {name: 'Spider', symbol: "S", damage: 1, speed: 1},
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
    monster.speed = type.speed  + getRandomInt(1, 5);
    monster.damage = type.damage + getRandomInt(1, 5);
    
    monster.xp = getRandomInt(1, 10);

    // TODO generate loot
    return monster;
}




