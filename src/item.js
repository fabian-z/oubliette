import { getRandomInt } from './util.js';

export class Item {
    type;
    symbol;
    effectCallback;
}

let types = [{
    name: 'Health Potion',
    symbol: "H",
    effect: function(game) {
        game.modifyPlayerHealth(getRandomInt(20, 100));
    },
}, {
    name: 'Agility Potion',
    symbol: "A",
    effect: function(game) {
        game.parameters.playerSpeed = 2;
        setTimeout(function() {
            game.parameters.playerSpeed = game.defaultParameters.playerSpeed;
        }, 10 * 1000);
    },
}, {
    name: 'Monster Slowdown Totem',
    symbol: 'T',
    effect: function(game) {
        game.stopProcessingMonsters();
        game.parameters.monsterInterval = 2500;
        game.startProcessingMonsters();
        setTimeout(function() {
            game.parameters.monsterInterval = game.defaultParameters.monsterInterval;
        }, 15 * 1000);
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