import { getRandomInt } from './util.js';

export class Item {
    type;
    symbol;
    effectCallback;
}

let weightedTypes = [];

let types = [{
    name: 'Health Potion',
    symbol: "H",
    effect: function(game) {
        game.modifyPlayerHealth(getRandomInt(20, 100));
    },
    probability: 0.7,
}, {
    name: 'Agility Potion',
    symbol: "A",
    effect: function(game) {
        game.parameters.playerSpeed = 2;
        setTimeout(function() {
            game.parameters.playerSpeed = game.defaultParameters.playerSpeed;
        }, 10 * 1000);
    },
    probability: 0.2,
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
    probability: 0.1,
}];

export function getRandomType() {
    let i = getRandomInt(0, types.length);
    return types[i];
}

export function generateRandomItem() {
    let item = new Item();
    let type = getSampledRandomType();

    item.type = type.name;
    item.symbol = type.symbol;
    item.effectCallback = type.effect;

    //TODO randomize callback effect?
    return item;
}

// http://en.wikipedia.org/wiki/Rejection_sampling
function initSampledRandom() {
    for (let i of types) {
        // factor should be large enough to convert smallest probability
        // to decimal, e.g. for 0.1 -> 10, 0.01 -> 100, 0.001 -> 1000
        let probWeight = i.probability * 10;
        for (let j = 0; j < probWeight; j++) {
            weightedTypes.push(i);
        }
    }
}

function getSampledRandomType() {
    if (weightedTypes.length === 0) {
        // allow items to be stateless, initialized on first request
        initSampledRandom();
    }
    let i = getRandomInt(0, weightedTypes.length);
    return weightedTypes[i];
}