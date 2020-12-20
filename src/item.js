import { getRandomInt } from './util.js';
import { Monster } from './monster.js';
import { MinLevelExperience } from './player.js';

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
    probability: 0.25,
},  {
    name: 'Agility Potion',
    symbol: "A",
    effect: function(game) {
        game.parameters.playerSpeed = 2;
        setTimeout(function() {
            game.parameters.playerSpeed = game.defaultParameters.playerSpeed;
        }, 10 * 1000);
    },
    probability: 0.2,
},  {
    name: 'Charge Potion',
    symbol: "C",
    effect: function(game) {
        game.parameters.playerBaseDamage += 5;
        setTimeout(function() {
            game.parameters.playerBaseDamage = game.defaultParameters.playerBaseDamage;
        }, 15 * 1000);
    },
    probability: 0.2,
},  {
    name: 'Pugio Dagger',
    symbol: "P",
    effect: function(game) {
        if(game.defaultParameters.playerBaseDamage > 8) {
            return;
        }
        game.parameters.playerBaseDamage = 8;
        game.defaultParameters.playerBaseDamage = game.parameters.playerBaseDamage;
    },
    probability: 0.15,
},   {
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
},   {
    name: 'Double Bladed Sword',
    symbol: "D",
    effect: function(game) {
        game.parameters.playerBaseDamage = 10;
        game.defaultParameters.playerBaseDamage = game.parameters.playerBaseDamage;
    },
    probability: 0.05,
},  {
    name: 'Vanishing Totem',
    symbol: 'V',
    effect: function(game) {
        game.stopProcessingMonsters();
        // use map to avoid duplicated tiles
        let neighbours = new Map();
        // Initial direct neighbours
        let directNeighbours = game.getNeighbourTiles(game.player.pos);
        for (let neighbour of directNeighbours) {
            neighbours.set(game.tiles[neighbour.y][neighbour.x], true);
        }
        // Radius 10
        // note that map iterator has to be converted to array, since it is dynamic
        // and called for each iteration, leading to exponential selection
        for (let i = 0; i < 20; i++) {
            for (let currentTile of Array.from(neighbours.keys())) {
                let neighbourCandidates = game.getNeighbourTiles(currentTile.pos);
                for (let candidate of neighbourCandidates) {
                    neighbours.set(game.tiles[candidate.y][candidate.x], true);
                }
            }
        }
        // Fetch and remove monsters from selected tiles
        for (let neighbour of neighbours.keys()) {
            if (neighbour.monster instanceof Monster) {
                game.player.addExperience(neighbour.monster.xp);
                game.tui.setExperience(game.player.experience, MinLevelExperience(game.player.level), MinLevelExperience(game.player.level + 1));
                game.tui.setLevel(game.player.level);
                game.removeMonster(neighbour.monster);
                neighbour.removeMonster();
            }
        }
        game.startProcessingMonsters();
    },
    probability: 0.05,
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
        let probWeight = i.probability * 100;
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