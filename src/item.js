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
        game.modifyPlayerHealth(getRandomInt(20, 100));
    },
}, {
    name: 'Fastness potion',
    symbol: "F",
    effect: function(game) {
        game.parameters.playerSpeed = 2;
        setTimeout(function() {
            game.parameters.playerSpeed = game.defaultParameters.playerSpeed;
        }, 10 * 1000);
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