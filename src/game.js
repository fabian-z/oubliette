import { TerminalInterface } from './tui.js';
import { Dungeon } from './dungeon.js';
import { getRandomInt, Vector2 } from './util.js';
import { Monster, generateRandomMonster } from './monster.js';
import { Worker, isMainThread } from 'worker_threads';
import { getRandomName } from "./lang.js";
import { Item, generateRandomItem } from './item.js';
import { Player, MinLevelExperience } from './player.js';
import { Tile } from './tile.js';

class Game {
    tiles = []; // [y][x] 2d array
    monsters = [];
    items = [];
    player;
    level = 1;
    tui;

    // should be class internal as implementation detail, TODO: getter functions
    dungeon;

    defaultParameters;
    parameters = {
        renderScaling: 4,
        baseExploreRadius: 3,
        initalExploreFactor: 2,
        enableExploration: true,
        playerSpeed: 1,
        maxMonsterPath: 999, // careful with performance!
        monsterInterval: 1000,
        playerAttackInterval: 150,
        monsterCount: 20,
        itemCount: 10,
        playerBaseDamage: 5,
        maximumLevels: 15,
    }

    messageCooldown = 2 * 1000;
    processingEvents = true;
    processingUserInput = true;
    playerAttackDebounce = false;

    pathWorkerRunning = false;
    pathWorkerDroppedRequest = false;
    pathWorkerDataChanged = false;
    pathWorkerData = ""; // JSON encoded to avoid serialization overhead after starting the game

    addMonster(monster) {
        this.monsters.push(monster);
    }

    removeMonster(monster) {
        let index = this.monsters.indexOf(monster);
        let removed = this.monsters.splice(index, 1);
        if (removed.length !== 1) {
            throw new Error("monster array not in sync during removal");
        }
        if (this.monsters.length === 0) {
            if (this.level === this.parameters.maximumLevels) {
                this.gameWonMessage();
            } else {
                this.startNextLevel();
            }
        }
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        let index = this.items.indexOf(item);
        let removed = this.items.splice(index, 1);
        if (removed.length !== 1) {
            throw new Error("item array not in sync during removal");
        }
    }

    movePlayer(pos) {
        //move, set explored tiles, then regenerate Dijkstra map

        // Actual movement, rollback if obstruction exists
        let origPos = this.player.pos.clone();
        this.player.pos = pos;

        let newTile = this.tiles[this.player.pos.y][this.player.pos.x];

        if (newTile.impassable) {
            this.player.pos = origPos;
            return false;
        }

        if (newTile.item) {
            this.applyItem(newTile);
        }

        // Exploration
        let startY = this.player.pos.y - this.parameters.scaledExploreRadius;
        startY = startY < 0 ? 0 : startY;
        let endY = this.player.pos.y + this.parameters.scaledExploreRadius;

        let startX = this.player.pos.x - this.parameters.scaledExploreRadius;
        startX = startX < 0 ? 0 : startX;
        let endX = this.player.pos.x + this.parameters.scaledExploreRadius;

        for (let y = startY; y < endY; y++) {
            if (this.tiles.length < y + 1) {
                break;
            }
            for (let x = startX; x < endX; x++) {
                if (this.tiles[y].length < x + 1) {
                    break;
                }
                this.tiles[y][x].explored = true;
            }
        }

        // Trigger request to update pathfinding to worker
        this.refreshPlayerPath();

        return true;

    }

    modifyPlayerHealth(mod) {
        this.player.health += mod;
        this.tui.setHealth(this.player.health);
        if (this.player.health <= 0) {
            this.gameOverMessage();
        }
        if (this.player.health > 100) {
            this.player.health = 100;
        }
    }

    attackMonster(pos) {
        // check for monster on defined position
        let tile = this.tiles[pos.y][pos.x];
        if (!(tile.monster instanceof Monster)) {
            // no monster there, nothing to do
            return false;
        }
        let monster = tile.monster;
        monster.health -= this.parameters.playerBaseDamage; // TODO define damage done by player
        if (monster.health <= 0) {
            this.player.addExperience(monster.xp);
            this.tui.setExperience(this.player.experience, MinLevelExperience(this.player.level), MinLevelExperience(this.player.level + 1));
            this.tui.setLevel(this.player.level);
            tile.removeMonster();
            this.removeMonster(monster);
        }
        return true;
    }

    applyItem(tile) {
        if (!(tile.item instanceof Item)) {
            //no item there, nothing to do
            this.tui.debug("wrong apply item call");
            return false;
        }
        tile.item.effectCallback(this);
        this.refreshScreen();
        this.removeItem(tile.item);
        tile.removeItem();
        return true;
    }


    // pathWorker calculates Dijkstra map values on another thread, separate from main UI thread
    // This allows for larger maximum paths and should eliminate FPS drops
    setupPathWorker() {
        if (isMainThread) {

            this.pathWorker = new Worker(new URL('./pathWorker.js',
                import.meta.url));

            this.pathWorker.on('message', (data) => {
                this.pathWorkerRunning = false;

                //read Dijkstra map values from pathWorker
                if (!data) {
                    // invalid request, e.g. tried to calculate for unsyc level data
                    return;
                }
                for (let y = 0; y < this.tiles.length; y++) {
                    for (let x = 0; x < this.tiles[0].length; x++) {
                        this.tiles[y][x].pathPlayerValue = data[y][x];
                    }
                }

                //this.tui.debug("Worker took:", new Date() - this.workerStartTime);

                if (this.pathWorkerDroppedRequest) {
                    // execute dropped request after finishing
                    this.pathWorkerDroppedRequest = false;
                    this.refreshPlayerPath();
                }
            });

            this.pathWorker.on('error', (error) => {
                // Logging error caused by worker thread
                throw new Error(error.message);
            });

            this.pathWorker.on('exit', (code) => {
                if (code !== 0) {
                    throw new Error(`Worker stopped with exit code ${code}`);
                }
            });

        }
    }

    refreshPlayerPath() {
        // Refresh Dijkstra map values with player as goal, see pathWorker.js

        if (this.pathWorkerRunning) {
            this.pathWorkerDroppedRequest = true;
            return;
        }

        this.pathWorkerRunning = true;
        if (this.pathWorkerDataChanged) {
            // only transfer large base information when needed
            this.pathWorker.postMessage(this.pathWorkerData);
            this.pathWorkerDataChanged = false;
        }

        // transfer player position for generating updated Dijkstra map
        this.workerStartTime = new Date();
        this.pathWorker.postMessage({ level: this.level, pos: [this.player.pos.x, this.player.pos.y] });
    }

    getNeighbourTiles(pos) {
        let neighbours = [];
        // up
        if (pos.y - 1 >= 0 && pos.y - 1 < this.tiles.length && pos.x < this.tiles[0].length) {
            neighbours.push(new Vector2(pos.x, pos.y - 1));
        } //down
        if (pos.y + 1 < this.tiles.length && pos.x < this.tiles[0].length) {
            neighbours.push(new Vector2(pos.x, pos.y + 1));
        } //left
        if (pos.y < this.tiles.length && pos.x - 1 >= 0 && pos.x - 1 < this.tiles[0].length) {
            neighbours.push(new Vector2(pos.x - 1, pos.y));
        } //right
        if (pos.y < this.tiles.length && pos.x + 1 < this.tiles[0].length) {
            neighbours.push(new Vector2(pos.x + 1, pos.y));
        }
        return neighbours;
    }

    /*
    getCameraPos implements a scrolling map camera position centered on the player.
    Adapted algorithm idea from http://www.roguebasin.com/index.php?title=Scrolling_map
        Original algorithm:
        Let s be the dimensions of the screen, p be the player coordinates, and c be the coordinates of the upper left of the camera: 
        If p < s / 2, then c := 0. 
        If p >= m - (s / 2), then c := m - s. 
        Otherwise, c := p - (s / 2). 
    */
    getCameraPos(screen) {
        let camera = new Vector2(0, 0);
        let halfScreen = screen.scalar(0.5).floor();
        let mapX = this.tiles[0].length - 1;
        let mapY = this.tiles.length - 1;

        // center player
        camera.x = this.player.pos.x - halfScreen.x;
        if (camera.x + screen.x > mapX) {
            // dock camera to right
            camera.x = mapX - screen.x;
        }
        if (camera.x < 0) {
            // dock camera to left
            camera.x = 0;
        }

        // center player
        camera.y = this.player.pos.y - halfScreen.y;
        if (camera.y + screen.y > mapY) {
            // dock camera to bottom
            camera.y = mapY - screen.y;
        }
        if (camera.y < 0) {
            // dock camera to top
            camera.y = 0;
        }

        return camera;
    }

    refreshScreen() {
        let buf = [];
        let x, y = 0;
        let curTile;
        let viewSizeAvail = this.tui.getMainViewSize().sub(new Vector2(2, 2));
        let renderedMonsters = [];
        let renderedItems = [];

        if (!this.processingEvents) {
            return;
        }

        let camera = this.getCameraPos(viewSizeAvail);
        //this.tui.debug("loop until: ", viewSizeAvail.y + camera.y, viewSizeAvail.x + camera.x);
        //this.tui.debug("max length: ", this.tiles.length, this.tiles[0].length);

        for (y = camera.y; y < viewSizeAvail.y + camera.y; y++) {
            for (x = camera.x; x < viewSizeAvail.x + camera.x; x++) {
                if (this.tiles.length > y && this.tiles[y].length > x) {

                    if (this.player.pos.x === x && this.player.pos.y === y) {
                        // Render player at current position
                        buf.push(this.tui.preRender.player);
                        continue;
                    }

                    curTile = this.tiles[y][x];

                    //if (curTile === undefined) {
                    //    throw new Error(`curTile is undefined! y: ${y}, x: ${x}, this.tiles[y].length: ${this.tiles[y].length}, this.tiles.length: ${this.tiles.length}`);
                    //}

                    if (curTile.monster instanceof Monster && curTile.monster.active) {
                        renderedMonsters.push(curTile.monster);
                    }

                    if (curTile.item instanceof Item && curTile.explored) {
                        renderedItems.push(curTile.item);
                    }

                    buf.push(curTile.renderString(this.tui));
                } else {
                    // Rendering screen larger than map
                    buf.push("*");
                }

            }
            buf.push("\n");
        }

        this.tui.setMainContent(buf.join(""));

        let objectBuf = [];
        let monster, item;
        for (monster of renderedMonsters) {
            objectBuf.push(`${this.tui.preRender.monsterPrefix}${monster.symbol}${this.tui.preRender.monsterSuffix} - ${monster.name} (${monster.type}) - HP: ${monster.health}\n`);
        }
        for (item of renderedItems) {
            objectBuf.push(`${this.tui.preRender.itemPrefix}${item.symbol}${this.tui.preRender.itemSuffix} - ${item.type}\n`);
        }

        this.tui.setObjectList(objectBuf.join(""));
    }

    welcomeMessage(callback) {
        let msg = "You awaken in your personal nightmare!\nAround you is a dark dungeon and you can only see a faint light from an opening at the top - the only way out is to defeat all monsters.";
        this.tui.popupMessage(msg, 0, callback);
    }

    gameOverMessage() {
        this.tui.processingUserInput = false;
        this.stopProcessingMonsters();
        // TODO clearing main view not working here?

        let msg = 'Game over!\nYou died and your corpse is eaten by monsters.\nMaybe you will come back as a monster, too.\n{grey-fg}(Next time you should try reading the help message. Just press "h".){/grey-fg}';
        let game = this;

        this.tui.alwaysPopupMessage(msg, this.messageCooldown, function() {
            game.tui.quit();
        });
    }

    gameWonMessage() {
        this.tui.disableKeys();
        this.stopProcessingMonsters();
        // TODO clearing main view not working here?

        let msg = "Congratulations - you defeated all monsters!\nNow you are lonely in this dark maze.\nYou should eat meat from the dead monsters to survive and hope that somebody finds you.\nGood luck!";
        let game = this;
        this.tui.popupMessage(msg, 25, function() {
            game.tui.quit();
        });
    }

    startNextLevel() {
        this.stopProcessingMonsters();
        this.processingUserInput = false;
        this.processingEvents = false;

        this.level += 1;
        this.tui.setDepth(this.level);
        this.dungeon = new Dungeon();
        this.player.pos = this.dungeon.playerStart.scalar(this.parameters.renderScaling).floor();
        this.tiles = [];
        this.monsters = [];
        this.items = [];

        this.setupMap();
        this.refreshPlayerPath();
        this.setupMonsters();
        this.setupItems();

        let game = this;
        this.tui.alwaysPopupMessage(`You defeated all monsters and crawl deeper into the dungeon..\n(level ${this.level})`, this.messageCooldown, function() {
            game.processingUserInput = true;
            game.processingEvents = true;
            game.startProcessingMonsters();
            game.refreshScreen();
        });
    }

    setEventHandler() {
        let game = this;
        // refresh render on screen resize
        this.tui.onScreenResize(function() {
            game.refreshScreen();
        });

        // react to user input with WASD / arrow keys, move player only for now
        this.tui.onKeypress(function(ch, key) {

            if (!game.processingUserInput) {
                return;
            }

            if (key.name === "h" || key.full === "?") {
                game.stopProcessingMonsters();
                game.processingUserInput = false;

                game.tui.helpMessage(function() {
                    game.processingUserInput = true;
                    game.startProcessingMonsters();
                });
                return;
            }

            let pos = game.player.pos.clone();

            let offset = game.parameters.playerSpeed;
            if (key.meta) {
                if (game.playerAttackDebounce) {
                    return;
                }
                // can only attack monsters directly next to player
                offset = 1;
            }

            switch (key.name) {
                case "w":
                case "up":
                    pos.y -= offset;
                    break;
                case "a":
                case "left":
                    pos.x -= offset;
                    break;
                case "s":
                case "down":
                    pos.y += offset;
                    break;
                case "d":
                case "right":
                    pos.x += offset;
                    break;
            }

            if (key.meta) {
                if (game.attackMonster(pos)) {
                    game.refreshScreen();
                    game.playerAttackDebounce = true;
                    setTimeout(function() {
                        game.playerAttackDebounce = false;
                    }, game.parameters.playerAttackInterval);
                }
                return;
            }

            if (game.movePlayer(pos)) {
                //let time1 = new Date();
                game.refreshScreen();
                //let time2 = new Date();
                //game.tui.debug(time2 - time1);
                return;
            }


        });
    }

    setupMap() {
        let initialExploreRadius = this.parameters.initalExploreFactor * this.parameters.baseExploreRadius;

        //initial rendering of dungeon to map tiles
        for (let y = 0; y < this.dungeon.size.y; y++) {
            let row = [];
            for (let x = 0; x < this.dungeon.size.x; x++) {
                let curPos = new Vector2(x, y);

                for (let i = 0; i < this.parameters.renderScaling; i++) {
                    let tile = new Tile();

                    if (this.parameters.enableExploration) {
                        if (Math.abs(x - this.dungeon.playerStart.x) <= initialExploreRadius &&
                            Math.abs(y - this.dungeon.playerStart.y) <= initialExploreRadius) {
                            tile.explored = true;
                        }
                    } else {
                        tile.explored = true;
                    }

                    if (this.dungeon.isWall(curPos)) {
                        tile.isWall = true;
                        tile.impassable = true;
                    } else {
                        let room = this.dungeon.getRoom(curPos);
                        if (room) {
                            tile.isRoom = true;
                            tile.roomTag = room.tag;
                        } else {
                            tile.isCorridor = true;
                        }
                    }

                    row.push(tile);
                }
            }

            for (let i = 0; i < this.parameters.renderScaling; i++) {
                let newRow = [];
                for (let tile of row) {
                    newRow.push(tile.clone());
                }
                this.tiles.push(newRow);
            }
        }

        let workerTiles = [];
        let floorMap = [];

        // post-process map tiles to fill position, neighbours and provide serialized information for pathWorker
        for (let y = 0; y < this.tiles.length; y++) {
            let workerRow = [];
            for (let x = 0; x < this.tiles[0].length; x++) {
                let curTile = this.tiles[y][x];
                let curVec = new Vector2(x, y);

                let workerTile = {};
                workerTile.n = []; // neighbours, shorten to reduce JSON length

                curTile.pos = curVec;
                if (!curTile.isWall) {
                    floorMap.push([x, y]);
                }
                for (let neighbourPos of this.getNeighbourTiles(curVec)) {
                    workerTile.n.push([neighbourPos.x, neighbourPos.y]);
                    curTile.neighbours.push(this.tiles[neighbourPos.y][neighbourPos.x]);
                }
                workerRow.push(workerTile);
            }
            workerTiles.push(workerRow);
        }

        this.pathWorkerDataChanged = true;
        this.pathWorkerData = JSON.stringify({ level: this.level, max: this.parameters.maxMonsterPath, tiles: workerTiles, floor: floorMap });
    }

    setupItems() {
        this.items = [];
        for (let i = 0; i <= this.parameters.itemCount; i++) {
            let item = generateRandomItem();

            // Cap random item placement for worst case performance
            // Also makes the linter happy (constant condition error for while (true))
            let cap = 0;
            while (cap < 100) {
                cap++;

                let targetPos = new Vector2(getRandomInt(0, this.tiles[0].length), getRandomInt(0, this.tiles.length));
                let curTile = this.tiles[targetPos.y][targetPos.x];

                if (this.player.pos.equal(targetPos)) {
                    continue;
                }

                //assume that tiles are already populated
                if (curTile.isWall || curTile.monster instanceof Monster) {
                    continue;
                }

                curTile.item = item;
                curTile.impassable = false;
                item.pos = targetPos;
                break;
            }
            this.addItem(item);
        }
    }

    setupMonsters() {
        this.monsters = [];

        for (let i = 0; i < this.parameters.monsterCount; i++) {
            let monster = generateRandomMonster();

            // Cap random monster placement for worst case performance
            // Also makes the linter happy (constant condition error for while (true))
            let cap = 0;
            while (cap < 100) {
                cap++;

                let targetPos = new Vector2(getRandomInt(0, this.tiles[0].length), getRandomInt(0, this.tiles.length));
                let curTile = this.tiles[targetPos.y][targetPos.x];

                if (this.player.pos.equal(targetPos)) {
                    continue;
                }

                //assume that tiles are already populated
                if (curTile.isWall || curTile.monster instanceof Monster) {
                    continue;
                }

                if (curTile.roomTag === "initial" || curTile.isCorridor) {
                    continue;
                }

                // TODO check for other monsters, items

                curTile.monster = monster;
                curTile.impassable = true;
                monster.pos = targetPos;
                break;
            }
            this.addMonster(monster);
        }
    }

    startProcessingMonsters() {
        let game = this;
        this.monsterInterval = setInterval(function() {
            let processedMonster = false;

            monsterLoop: for (let monster of game.monsters) {
                // process movement x speed / tick
                for (let i = 0; i <= monster.speed; i++) {
                    let origPos = monster.pos.clone();
                    let origTile = game.tiles[monster.pos.y][monster.pos.x];
                    if (!origTile.explored && !monster.active) {
                        // only process monsters the player has seen or that are active
                        continue;
                    }
                    processedMonster = true;

                    monster.active = true;
                    let neighbours = origTile.neighbours;
                    let target = false;

                    for (let neighbour of neighbours) {
                        // "roll downhill"
                        if (!target || target.pathPlayerValue > neighbour.pathPlayerValue) {
                            target = neighbour;
                        }
                    }

                    //Attack if next to player
                    if (game.player.pos.equal(target.pos)) {
                        game.modifyPlayerHealth(-monster.damage);
                        continue monsterLoop;
                    }

                    monster.pos = target.pos;

                    if (target.pathPlayerValue === game.parameters.maxMonsterPath || game.player.pos.equal(monster.pos) || game.tiles.length <= monster.pos.y || game.tiles[0].length <= monster.pos.x ||
                        game.tiles[monster.pos.y][monster.pos.x].impassable) {
                        monster.pos = origPos;
                        continue;
                    }

                    origTile.monster = undefined;
                    origTile.impassable = false;

                    game.tiles[monster.pos.y][monster.pos.x].monster = monster;
                    game.tiles[monster.pos.y][monster.pos.x].impassable = true;
                }
                // game.tiles[monster.pos.y][monster.pos.x].monster = monster;
            }

            if (processedMonster) {
                game.refreshScreen();
            }

        }, game.parameters.monsterInterval);
    }

    stopProcessingMonsters() {
        clearInterval(this.monsterInterval);
    }

    constructor() {
        // setup dependency classes
        this.tui = new TerminalInterface();
        this.dungeon = new Dungeon();

        // calculate game parameters
        this.defaultParameters = { ...this.parameters };
        this.parameters.scaledExploreRadius = this.parameters.renderScaling * this.parameters.baseExploreRadius;

        this.player = new Player("", this.dungeon.playerStart.scalar(this.parameters.renderScaling).floor());

        // initialize and prepare game routines
        this.setupMap();
        this.setupPathWorker();
        this.refreshPlayerPath();
        this.setupMonsters();
        this.setupItems();

        let game = this;

        this.tui.prompt("What is your name?", getRandomName(), function(err, name) {
            game.tui.debug(name);
            game.player.name = name;
            game.tui.setPlayerName(name);
            game.tui.setLevel(game.player.level);
            game.tui.setDepth(game.level);
            // welcome message triggers initial screen rendering in callback and starts the game
            game.welcomeMessage(function() {
                game.setEventHandler();
                game.startProcessingMonsters();
                game.refreshScreen();
            });
        });



    }

}

// Entry point
new Game();