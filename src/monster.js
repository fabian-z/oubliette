import { getRandomName } from "./lang.js";
import { getRandomInt, Vector2 } from './util.js';

// TODO Autonomous movement
export class Monster {
    name;
    pos = new Vector2(0, 0);
    type;
    symbol;
    health = 100;
    damage;
    xp;
    loot = [];
}

let types = [
    {name: 'Orc', symbol: "O"},
    {name: 'Bat', symbol: "B"},
    {name: 'Rat', symbol: "R"},
    {name: 'Undead', symbol: "U"},
    {name: 'Troll', symbol: "T"},
    {name: 'Warg', symbol: "W"},
    {name: 'Spider', symbol: "S"},
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
    
    // TODO make configurable
    monster.damage = getRandomInt(1, 10);
    monster.xp = getRandomInt(1, 10);

    // TODO generate loot
    return monster
}




