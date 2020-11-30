import { TerminalInterface } from './tui.js';
import { Dungeon } from './dungeon.js';
import { getRandomInt, Vector2 } from './util.js';
import { Monster, generateRandomMonster } from './monster.js';

class Tile {
  isWall;
  isRoom;
  isCorridor;
  roomTag;
  pos;

  neighbours = [];
  pathPlayerValue; //Dijkstra map value, http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps

  impassable;
  explored;
  hasPlayer;

  item;
  monster;

  clone() {
    // custom clone function
    // https://stackoverflow.com/questions/57542052/deep-clone-class-instance-javascript
    let tile = new Tile();
    tile.isWall = this.isWall;
    tile.isCorridor = this.isCorridor;
    tile.isRoom = this.isRoom;
    tile.roomTag = this.roomTag;

    tile.impassable = this.impassable;
    tile.explored = this.explored;
    tile.hasPlayer = this.hasPlayer;
    tile.item = this.item;
    tile.monster = this.monster;
    return tile;
  }

  renderString(tui) {
    if (this.hasPlayer) {
      return tui.preRender.player;
    }
    if (!this.explored) {
      return " ";
    }
    if (this.monster instanceof Monster) {
      return tui.preRender.monsterPrefix + this.monster.symbol + tui.preRender.monsterSuffix;
    }
    if (this.isWall) {
      return tui.preRender.wall;
    }

    // empty
    if (this.isCorridor || this.isRoom) {
      return tui.preRender.corridor;
    }

  }
}

class Player {
  pos;
  health = 100;
  experience = 0;
  level = 1;
  name = "";

  constructor(name, pos) {
    this.name = name;
    this.pos = pos;
  }

}

class Game {
  tiles = []; // [y][x] 2d array
  floorMap = [] // Vector2 array with floor tiles, used to speed up pathfinding
  monsters = [];
  items = [];
  player;
  level = 1;
  tui;

  // should be class internal as implementation detail, TODO: getter functions
  dungeon;

  parameters = {
    renderScaling: 4,
    baseExploreRadius: 3,
    initalExploreFactor: 2,
    playerSpeed: 1,
    maxMonsterPath: 50, // careful with performance!
    monsterInterval: 200
  }

  movePlayer(pos) {
    //move, then regenerate Dijkstra map

    // Actual movement, rollback if obstruction exists
    let origPos = this.player.pos.clone();
    this.player.pos = pos;

    if (this.tiles[this.player.pos.y][this.player.pos.x].impassable) {
      this.player.pos = origPos;
      return false;
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

    // Refresh Dijkstra map values

    /* From http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps
    To get a Dijkstra map, you start with an integer array representing your map, with some set of goal cells set to zero
    and all the rest set to a very high number. Iterate through the map's "floor" cells -- skip the impassable wall cells.
    If any floor tile has a value greater than 1 regarding to its lowest-value floor neighbour
    (in a cardinal direction - i.e. up, down, left or right; a cell next to the one we are checking),
    set it to be exactly 1 greater than its lowest value neighbor. Repeat until no changes are made.
    The resulting grid of numbers represents the number of steps that it will take to get from any given tile to the nearest goal.
    */


   const max = this.parameters.maxMonsterPath;
    //let time1 = new Date();
    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < this.tiles[0].length; x++) {
        if (this.player.pos.y === y && this.player.pos.x === x) {
          // Goal position, guide toward player
          this.tiles[y][x].pathPlayerValue = 0;
          continue;
        }
        this.tiles[y][x].pathPlayerValue = max;
      }
    }
    //let time2 = new Date();
    //console.log(time2 - time1);
    let changed;
    let min, curTile, neighbour;

    do {
      changed = false;

      for (curTile of this.floorMap) {
        min = max;
        //let curTile = this.tiles[curPos.y][curPos.x];

        for (neighbour of curTile.neighbours) {
          if (min > neighbour.pathPlayerValue) {
            min = neighbour.pathPlayerValue;
          }
        }

        min += 1;
        if (curTile.pathPlayerValue > min) {
          curTile.pathPlayerValue = min;
          changed = true;
        }

      }

    } while (changed)

    //let time3 = new Date() - time2;
    //console.log(time3);
    //process.exit(1);

    return true;

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
  Algorithm from http://www.roguebasin.com/index.php?title=Scrolling_map
      Let s be the dimensions of the screen, p be the player coordinates, and c be the coordinates of the upper left of the camera: 
      If p < s / 2, then c := 0. 
      If p >= m - (s / 2), then c := m - s. 
      Otherwise, c := p - (s / 2). 
  */
  getCameraPos(screen) {
    let camera = new Vector2(0, 0);
    let halfScreen = screen.scalar(0.5).floor();
    let mapX = this.tiles[0].length;
    let mapY = this.tiles.length;

    if (this.player.pos.x < halfScreen.x) {
      // TODO remove as performance optimization?
      camera.x = 0;
    } else if (this.player.pos.x >= mapX - halfScreen.x) {
      camera.x = mapX - screen.x;
    } else {
      camera.x = this.player.pos.x - halfScreen.x;
    }

    if (this.player.pos.y < halfScreen.y) {
      // TODO remove as performance optimization?
      camera.y = 0;
    } else if (this.player.pos.y >= mapY - halfScreen.y) {
      camera.y = mapY - screen.y;
    } else {
      camera.y = this.player.pos.y - halfScreen.y;
    }

    return camera;
  }

  refreshScreen() {
    let buf = [];
    let x, y = 0;
    let viewSizeAvail = this.tui.getMainViewSize().sub(new Vector2(2, 2));

    let camera = this.getCameraPos(viewSizeAvail);
    for (y = camera.y; y < viewSizeAvail.y + camera.y; y++) {
      for (x = camera.x; x < viewSizeAvail.x + camera.x; x++) {
        if (this.tiles.length > y && this.tiles[y].length > x) {

          if (this.player.pos.x === x && this.player.pos.y === y) {
            // Render player at current position
            buf.push(this.tui.preRender.player);
            continue;
          }

          buf.push(this.tiles[y][x].renderString(this.tui));
        } else {
          // Rendering screen larger than map
          buf.push("*");
        }

      }
      buf.push("\n");
    }

    this.tui.setMainContent(buf.join(""));
  }

  welcomeMessage() {
    // welcome message
    let msg = "You awaken in a dark dungeon and can only see a faint light from an opening at the top - defeat all monsters to survive.";
    let game = this;
    this.tui.popupMessage(msg, function () {
      // initial screen drawing
      game.refreshScreen();
    });
  }

  setEventHandler() {
    let game = this;
    // refresh render on screen resize
    this.tui.onScreenResize(function () {
      game.refreshScreen();
    })

    // react to user input with WASD / arrow keys, move player only for now
    this.tui.onKeypress(function (ch, key) {

      let pos = game.player.pos.clone();
      switch (key.name) {
        case "w":
        case "up":
          pos.y -= game.parameters.playerSpeed;
          break;
        case "a":
        case "left":
          pos.x -= game.parameters.playerSpeed;
          break;
        case "s":
        case "down":
          pos.y += game.parameters.playerSpeed;
          break;
        case "d":
        case "right":
          pos.x += game.parameters.playerSpeed;
          break;
      }

      if (game.movePlayer(pos)) {
        let time1 = new Date();
        game.refreshScreen();
        let time2 = new Date();
        game.tui.debug(time2 - time1);
      }

    });
  }

  setupMap() {
    let initialExploreRadius = this.parameters.initalExploreFactor * this.parameters.baseExploreRadius;

    for (let y = 0; y < this.dungeon.size.y; y++) {
      let row = [];
      for (let x = 0; x < this.dungeon.size.x; x++) {
        let curPos = new Vector2(x, y);

        for (let i = 0; i < this.parameters.renderScaling; i++) {
          let tile = new Tile();

          if (Math.abs(x - this.dungeon.playerStart.x) <= initialExploreRadius &&
            Math.abs(y - this.dungeon.playerStart.y) <= initialExploreRadius) {
            tile.explored = true;
          }

          //tile.explored = true
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

          //row.push(dungeon.walls.get([x, y]) ? tui.preRender.wall : tui.preRender.corridor);
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

    for (let y = 0; y < this.tiles.length; y++) {
      for (let x = 0; x < this.tiles[0].length; x++) {
        let curTile = this.tiles[y][x];
        let curVec = new Vector2(x, y);
        curTile.pos = curVec;
        if (!curTile.isWall) {
          this.floorMap.push(curTile);
        }
        for (let neighbourPos of this.getNeighbourTiles(curVec)) {
          curTile.neighbours.push(this.tiles[neighbourPos.y][neighbourPos.x]);
        }
      }
    }

  }

  setupMonsters() {
    this.monsters = [];

    for (let i = 0; i <= 20; i++) {
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

        if (curTile.roomTag == "initial" || curTile.isCorridor) {
          continue
        }

        // TODO check for other monsters, items

        curTile.monster = monster;
        curTile.impassable = true;
        monster.pos = targetPos;
        break;
      }
      this.monsters.push(monster);
    }
  }

  startProcessingMonsters() {
    let game = this;
    setInterval(function () {
      for (let monster of game.monsters) {
        for (let i = 0; i <= monster.speed; i++) {
        let origPos = monster.pos.clone();
        let origTile = game.tiles[monster.pos.y][monster.pos.x];
        if (!origTile.explored && !monster.active) {
          // only process monsters the player has seen or that are active
          continue;
        }

        monster.active = true;
        let neighbours = origTile.neighbours;
        let target = false;

        for (let neighbour of neighbours) {
          // "roll downhill"
          if (!target || target.pathPlayerValue > neighbour.pathPlayerValue) {
            target = neighbour;
          }
        }

        monster.pos = target.pos;

        if (target.pathPlayerValue == game.parameters.maxMonsterPath || game.player.pos.equal(monster.pos) || game.tiles.length <= monster.pos.y || game.tiles[0].length <= monster.pos.x ||
          game.tiles[monster.pos.y][monster.pos.x].impassable) {
          monster.pos = origPos;
          continue
        }

        origTile.monster = undefined;
        origTile.impassable = false;

        game.tiles[monster.pos.y][monster.pos.x].monster = monster;
        game.tiles[monster.pos.y][monster.pos.x].impassable = true;
      }
        // game.tiles[monster.pos.y][monster.pos.x].monster = monster;
      }
      game.refreshScreen();

    }, game.parameters.monsterInterval);
  }

  constructor() {
    this.tui = new TerminalInterface();
    this.dungeon = new Dungeon();

    this.parameters.scaledExploreRadius = this.parameters.renderScaling * this.parameters.baseExploreRadius;

    this.player = new Player("Jenny", this.dungeon.playerStart.scalar(this.parameters.renderScaling).floor());

    this.setupMap()
    //hack
    this.movePlayer(this.player.pos);
    this.setupMonsters();
    this.welcomeMessage(); // welcome message triggers initial screen rendering in callback
    this.setEventHandler();
    this.startProcessingMonsters();

  }

}

// Entry point
new Game();
