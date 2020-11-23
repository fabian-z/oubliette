import { TerminalInterface } from './tui.js';
import { GenerateDungeon } from './dungeon.js';
import { Vector2 } from './util.js'

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

let playerPositionXY = new Vector2(Math.floor(dungeon.start_pos[0] * renderScaling), Math.floor(dungeon.start_pos[1] * renderScaling));
// Quit on Escape, q, or Control-C.
tui.onKeypress(function (ch, key) {
  let origPos = playerPositionXY.clone();
  switch (key.name) {
    case "w":
    case "up":
      playerPositionXY.y = playerPositionXY.y - 1;
      break;
    case "a":
    case "left":
      playerPositionXY.x = playerPositionXY.x - 1;
      break;
    case "s":
    case "down":
      playerPositionXY.y = playerPositionXY.y + 1;
      break;
    case "d":
    case "right":
      playerPositionXY.x = playerPositionXY.x + 1;
      break;
  }

  // TODO model game state and check against baseMap as well as dynamic objects
  if (baseMap[playerPositionXY.y][playerPositionXY.x] != " ") {
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


function refresh(playerPositionXY, viewSizeXY, map) {
  let buf = [];
  let x, y = 0;
  //console.log(map.length / dungeon.size[1]);

  let viewSize = new Vector2(viewSizeXY[0], viewSizeXY[1]).sub(new Vector2(2, 2));

  let camera = getCameraPos(playerPositionXY, viewSize, map[0].length, map.length);
  for (y = camera.y; y < viewSize.y + camera.y; y++) {
    for (x = camera.x; x < viewSize.x + camera.x; x++) {
      if (map.length > y && map[y].length > x) {

        if (playerPositionXY.x === x && playerPositionXY.y == y) {
          // Render player at current position
          buf.push("{green-fg}{bold}@{/bold}{/green-fg}");
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