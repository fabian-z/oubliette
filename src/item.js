import { getRandomInt } from './util.js';

export class Item {
    type;
    symbol;
    effectCallback;
}

let types = [{
    name: 'Health potion',
    symbol: "H",
    effect: function(game) {
        game.modifyPlayerHealth(getRandomInt(90, 100));
    },
}];

export function getRandomType() {
    let i = getRandomInt(0, types.length);
    return types[i];
}

export function generateRandomItem() {
    let item = new Item();
    let type = getRandomType();

    item.type = type.name;
    item.symbol = type.symbol;
    item.effectCallback = type.effect;

    //TODO randomize callback effect?
    return item;
}