import { TerminalInterface } from './tui.js';
import { GenerateDungeon } from './dungeon.js';


// If our box is clicked, change the content.
/*mainView.on('click', function(data) {
  mainView.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
  gauge.setProgress(Math.random() * 100);
  screen.render();
});

// If box is focused, handle `enter`/`return` and give us some more content.
rightView.key('enter', function(ch, key) {
  rightView.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
  rightView.setLine(1, 'bar');
  rightView.insertLine(1, 'foo');
  screen.render();
});

var timer = setInterval(function() {
  gauge.setProgress(Math.random() * 100);
  screen.render();
}, 10);*/

let tui = new (TerminalInterface);

let dungeon = GenerateDungeon();
//dungeon.print();

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

//console.log(screen.width, screen.height);

let playerPositionXY = [Math.floor(dungeon.start_pos[0] * renderScaling), Math.floor(dungeon.start_pos[1] * renderScaling)];
// Quit on Escape, q, or Control-C.
tui.onKeypress(function (ch, key) {
  let origPos = [...playerPositionXY];
  switch (key.name) {
    case "w":
    case "up":
      playerPositionXY[1] = playerPositionXY[1] - 1;
      break;
    case "a":
    case "left":
      playerPositionXY[0] = playerPositionXY[0] - 1;
      break;
    case "s":
    case "down":
      playerPositionXY[1] = playerPositionXY[1] + 1;
      break;
    case "d":
    case "right":
      playerPositionXY[0] = playerPositionXY[0] + 1;
      break;
  }

  // TODO model game state and check against baseMap as well as dynamic objects
  if (baseMap[playerPositionXY[1]][playerPositionXY[0]] != " ") {
    playerPositionXY = origPos;
    return;
  }



  let screenOut = refresh(playerPositionXY, tui.getMainViewSizeXY(), baseMap);
  //console.log(screen.width, screen.height);
  tui.setMainContent(screenOut);
});




let curTime = new Date();
let screenOut = refresh(playerPositionXY, tui.getMainViewSizeXY(), baseMap);
//console.log(screen.width, screen.height);
tui.setMainContent(screenOut);

let nowTime = new Date();

console.log("timed", nowTime - curTime);

//console.log(mainView.height, mainView.width);


tui.onScreenResize("resize", function () {
  let screenOut = refresh(playerPositionXY, tui.getMainViewSizeXY(), baseMap);
  //console.log(screen.width, screen.height);
  tui.setMainContent(screenOut);
})


/*
getCameraPos implements a scrolling map camera position centered on the player.
Algorithm from http://www.roguebasin.com/index.php?title=Scrolling_map
    Let s be the dimensions of the screen, p be the player coordinates, and c be the coordinates of the upper left of the camera: 
    If p < s / 2, then c := 0. 
    If p >= m - (s / 2), then c := m - s. 
    Otherwise, c := p - (s / 2). 
*/
function getCameraPos(playerX, playerY, screenX, screenY, mapX, mapY) {
  let cameraXY = [0, 0];
  let halfScreenX = Math.floor(screenX / 2);
  let halfScreenY = Math.floor(screenY / 2);
  if (playerX < halfScreenX) {
    // TODO remove as performance optimization?
    cameraXY[0] = 0;
  } else if (playerX >= mapX - halfScreenX) {
    cameraXY[0] = mapX - screenX;
  } else {
    cameraXY[0] = playerX - halfScreenX;
  }

  if (playerY < halfScreenY) {
    // TODO remove as performance optimization?
    cameraXY[1] = 0;
  } else if (playerY >= mapY - halfScreenY) {
    cameraXY[1] = mapY - screenY;
  } else {
    cameraXY[1] = playerY - halfScreenY;
  }

  return cameraXY
}


function refresh(playerPositionXY, viewSize, map) {
  let buf = "";
  let x, y = 0;
  //console.log(map.length / dungeon.size[1]);

  let camera = getCameraPos(playerPositionXY[0], playerPositionXY[1], viewSize[0] - 2, viewSize[1] - 2, map[0].length, map.length);
  for (y = camera[1]; y < viewSize[1] - 2 + camera[1]; y++) {
    for (x = camera[0]; x < viewSize[0] - 2 + camera[0]; x++) {
      if (map.length > y && map[y].length > x) {

        if (playerPositionXY[0] === x && playerPositionXY[1] == y) {
          // Render player at current position
          buf += "{green-fg}{bold}@{/bold}{/green-fg}";
          continue;
        }

        buf += map[y][x];
      } else {
        // Rendering screen larger than map
        buf += "*";
      }

    }
    buf += "\n";
  }
  return buf
};