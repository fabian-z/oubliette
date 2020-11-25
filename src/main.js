import { TerminalInterface } from './tui.js';
import { GenerateDungeon } from './dungeon.js';
import { Vector2 } from './util.js'

let tui = new TerminalInterface();
let dungeon = GenerateDungeon();

class Tile {
  isWall;
  isCorridor;

  impassable;
  explored;
  hasPlayer;

  items = [];
  monsters = [];

  renderString() {
    if (this.hasPlayer) {
      return tui.preRender.player;
    }
    if (!this.explored) {
      return " ";
    }
    if (this.isWall) {
      return tui.preRender.wall;
    }
    if (this.isCorridor) {
      return tui.preRender.corridor;
    }
  }

}


const renderScaling = 4;
const baseExploreRadius = 5;
const scaledExploreRadius = renderScaling * baseExploreRadius;
const playerSpeed = 2;

let baseMap = [];
for (let y = 0; y < dungeon.size[1]; y++) {
  let row = [];
  for (let x = 0; x < dungeon.size[0]; x++) {
    for (let i = 0; i < renderScaling; i++) {

      let tile = new Tile();

      if (Math.abs(x - dungeon.start_pos[0]) <= baseExploreRadius && Math.abs(y - dungeon.start_pos[1]) <= baseExploreRadius ) {
        tile.explored = true;
      }


     // tile.explored = true;
      if (dungeon.walls.get([x, y])) {
        tile.isWall = true;
        tile.impassable = true;
      } else {
        tile.isCorridor = true;
      }
      row.push(tile);

      //row.push(dungeon.walls.get([x, y]) ? tui.preRender.wall : tui.preRender.corridor);
    }
  }

  for (let i = 0; i < renderScaling; i++) {
    baseMap.push(row);
  }
}

let playerPosition = new Vector2(dungeon.start_pos[0], dungeon.start_pos[1]).scalar(renderScaling).floor();

// initial screen drawing
let screenOut = refresh(playerPosition, tui.getMainViewSize(), baseMap);
tui.setMainContent(screenOut);

// refresh render on screen resize
tui.onScreenResize(function () {
  let screenOut = refresh(playerPosition, tui.getMainViewSize(), baseMap);
  tui.setMainContent(screenOut);
})

// react to user input with WASD / arrow keys, move player only for now
tui.onKeypress(function (ch, key) {
  let origPos = playerPosition.clone();
  switch (key.name) {
    case "w":
    case "up":
      playerPosition.y -= playerSpeed;
      break;
    case "a":
    case "left":
      playerPosition.x -= playerSpeed;
      break;
    case "s":
    case "down":
      playerPosition.y += playerSpeed;
      break;
    case "d":
    case "right":
      playerPosition.x += playerSpeed;
      break;
  }

  // TODO model game state and check against baseMap as well as dynamic objects
  if (baseMap[playerPosition.y][playerPosition.x].impassable) {
    playerPosition = origPos;
    return;
  }

  let startY = Math.abs(playerPosition.y - scaledExploreRadius);
  let endY = Math.abs(playerPosition.y + scaledExploreRadius);
  let startX = Math.abs(playerPosition.x - scaledExploreRadius);
  let endX = Math.abs(playerPosition.x + scaledExploreRadius);

  for (let y = startY; y < endY; y++) {
    if (baseMap.length < y+1) {
      break;
    }
    for (let x = startX; x < endX; x++) {
      if (baseMap[y].length < x+1) {
        break;
      }
      baseMap[y][x].explored = true;
    }
  }

  let time1 = new Date();
  let screenOut = refresh(playerPosition, tui.getMainViewSize(), baseMap);
  tui.setMainContent(screenOut);
  let time2 = new Date();
  tui.debug(time2 - time1);


});


/*
getCameraPos implements a scrolling map camera position centered on the player.
Algorithm from http://www.roguebasin.com/index.php?title=Scrolling_map
    Let s be the dimensions of the screen, p be the player coordinates, and c be the coordinates of the upper left of the camera: 
    If p < s / 2, then c := 0. 
    If p >= m - (s / 2), then c := m - s. 
    Otherwise, c := p - (s / 2). 
*/
function getCameraPos(player, screen, mapX, mapY) {
  let camera = new Vector2(0, 0);
  let halfScreen = screen.scalar(0.5).floor();


  if (player.x < halfScreen.x) {
    // TODO remove as performance optimization?
    camera.x = 0;
  } else if (player.x >= mapX - halfScreen.x) {
    camera.x = mapX - screen.x;
  } else {
    camera.x = player.x - halfScreen.x;
  }

  if (player.y < halfScreen.y) {
    // TODO remove as performance optimization?
    camera.y = 0;
  } else if (player.y >= mapY - halfScreen.y) {
    camera.y = mapY - screen.y;
  } else {
    camera.y = player.y - halfScreen.y;
  }

  return camera;
}


function refresh(playerPosition, viewSize, map) {
  let buf = [];
  let x, y = 0;

  let viewSizeAvail = viewSize.sub(new Vector2(2, 2));

  let camera = getCameraPos(playerPosition, viewSizeAvail, map[0].length, map.length);
  for (y = camera.y; y < viewSizeAvail.y + camera.y; y++) {
    for (x = camera.x; x < viewSizeAvail.x + camera.x; x++) {
      if (map.length > y && map[y].length > x) {

        if (playerPosition.x === x && playerPosition.y === y) {
          // Render player at current position
          buf.push(tui.preRender.player);
          continue;
        }

        buf.push(map[y][x].renderString());
      } else {
        // Rendering screen larger than map
        buf.push("*");
      }

    }
    buf.push("\n");
  }
  return buf.join("");
}



