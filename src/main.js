import { TerminalInterface } from './tui.js';
import { GenerateDungeon } from './dungeon.js';
import { Vector2 } from './util.js'

let tui = new TerminalInterface();

let dungeon = GenerateDungeon();

const renderScaling = 4;
let baseMap = [];
for (let y = 0; y < dungeon.size[1]; y++) {
  let row = [];
  for (let x = 0; x < dungeon.size[0]; x++) {
    for (let i = 0; i < renderScaling; i++) {
      row.push(dungeon.walls.get([x, y]) ? '■' : ' ');
    }
  }

  for (let i = 0; i < renderScaling; i++) {
    baseMap.push(row);
  }
}

let playerPosition = new Vector2(dungeon.start_pos[0], dungeon.start_pos[1]).scalar(renderScaling).floor();

// initial screen drawing
let curTime = new Date();
let screenOut = refresh(playerPosition, tui.getMainViewSize(), baseMap);

tui.setMainContent(screenOut);
let nowTime = new Date();
console.log("timed", nowTime - curTime);


// refresh render on screen resize
tui.onScreenResize("resize", function () {
  let screenOut = refresh(playerPosition, tui.getMainViewSize(), baseMap);
  tui.setMainContent(screenOut);
})

// react to user input with WASD / arrow keys, move player only for now
tui.onKeypress(function (ch, key) {
  let origPos = playerPosition.clone();
  switch (key.name) {
    case "w":
    case "up":
      playerPosition.y = playerPosition.y - 1;
      break;
    case "a":
    case "left":
      playerPosition.x = playerPosition.x - 1;
      break;
    case "s":
    case "down":
      playerPosition.y = playerPosition.y + 1;
      break;
    case "d":
    case "right":
      playerPosition.x = playerPosition.x + 1;
      break;
  }

  // TODO model game state and check against baseMap as well as dynamic objects
  if (baseMap[playerPosition.y][playerPosition.x] != " ") {
    playerPosition = origPos;
    return;
  }

  let screenOut = refresh(playerPosition, tui.getMainViewSize(), baseMap);
  tui.setMainContent(screenOut);
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

  return camera
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

        buf.push(map[y][x]);
      } else {
        // Rendering screen larger than map
        buf.push("*");
      }

    }
    buf.push("\n");
  }
  return buf.join("");
}