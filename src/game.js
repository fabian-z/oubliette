import { TerminalInterface } from './tui.js';
import { Dungeon } from './dungeon.js';
import { getRandomInt, Vector2 } from './util.js';
import { Monster, generateRandomMonster } from './monster.js';

class Tile {
  isWall;
  isRoom;
  isCorridor;
  roomTag;

  pathPlayerValue; //Dijkstra Map value, http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps

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
    playerSpeed: 1
  }

  movePlayer(pos) {
    //move, then regenerate Dijkstra map
    this.player.pos = pos;

    let origPos = this.player.pos.clone();
    
    // TODO model game state and check against this.tiles as well as dynamic objects
    if (this.tiles[this.player.pos.y][this.player.pos.x].impassable) {
      this.player.pos = origPos;
      return false;
    }

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

    return true;

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

          tile.explored =  true;
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
        let pos = new Vector2(getRandomInt(0, this.tiles[0].length), getRandomInt(0, this.tiles.length));
        let curTile = this.tiles[pos.y][pos.x];

        if (this.player.pos.equal(pos)) {
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
        monster.pos = pos;
        break;
      }
      this.monsters.push(monster);
    }
  }

  constructor() {
    this.tui = new TerminalInterface();
    this.dungeon = new Dungeon();

    this.parameters.scaledExploreRadius = this.parameters.renderScaling * this.parameters.baseExploreRadius;

    this.player = new Player("Jenny", this.dungeon.playerStart.scalar(this.parameters.renderScaling).floor());

    this.setupMap()
    this.setupMonsters();
    this.welcomeMessage(); // welcome message triggers initial screen rendering in callback
    this.setEventHandler();

    let game = this;
    setInterval(function() {
      for (let monster of game.monsters) {
        let origPos = monster.pos.clone();
        let origTile = game.tiles[monster.pos.y][monster.pos.x];

        
        monster.pos = monster.pos.add(new Vector2(getRandomInt(-1, 2), getRandomInt(-1, 2)));

        if (game.player.pos.equal(monster.pos) || game.tiles.length <= monster.pos.y || game.tiles[0].length <= monster.pos.x || 
          game.tiles[monster.pos.y][monster.pos.x].impassable) {
          monster.pos = origPos;
          continue
        }

        origTile.monster = undefined;
        origTile.impassable = false;

        game.tiles[monster.pos.y][monster.pos.x].monster = monster;
       // game.tiles[monster.pos.y][monster.pos.x].monster = monster;
      }
      game.refreshScreen();
      
    }, 100);
  }

}

// Entry point
new Game();
