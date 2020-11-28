import { getRandomName } from "./lang.js";
import { getRandomInt } from './util.js';

// TODO Autonomous movement
export class Monster {
    name;
    pos;
    type;
    symbol;
    damage;
    xp;
    loot = [];
}

let types = [
    {name: 'Orc', symbol: "O"},
    {name: 'Bat', symbol: "B"},
    {name: 'Rat', symbol: "R"},
    {name: 'Undead', symbol: "U"},
    {name: 'Dragon', symbol: "D"},
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




