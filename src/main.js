'use strict';
import blessed from 'blessed';
import { generateDungeon } from './dungeon.js';

// Create a screen object.
let screen = blessed.screen({
  smartCSR: true,
  warnings: true,
  //autoPadding: true,
  debug: true,
  enableKeys: true,
});

screen.title = 'oubliette';

// Create main game viewport
let mainView = blessed.box({
  top: 'center',
  left: 'left',
  width: '80%',
  height: '100%',
  content: 'Viewport TBD',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    //bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      //bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(mainView);

// Create a box perfectly centered horizontally and vertically.
let rightView = blessed.box({
  top: 'center',
  right: '0',
  width: '20%',
  height: '100%',
  content: 'Sidebar',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    //bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      //bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(rightView);

//let gauge = contrib.gauge({label: 'Progress', stroke: 'green', fill: 'white'});
let gaugeLabel = blessed.box({
  parent: screen,
  width: '50%',
  height: 3,
  content: "Player: Anonymous\nHP"

});
let gauge = blessed.progressbar({
  parent: screen,
  border: 'line',
  style: {
    fg: 'white',
    bg: 'default',
    bar: {
      bg: 'default',
      fg: 'red'
    },
    border: {
      fg: 'default',
      bg: 'default'
    }
  },
  ch: '■',
  width: '80%',
  height: 3,
  top: 6,
  //left: 3,
  filled: 0
});

rightView.append(gaugeLabel);
rightView.append(gauge);
gauge.setProgress(50);

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
});*/

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function () {
  return process.exit(0);
});

// Focus our element.
mainView.focus();

/*var timer = setInterval(function() {
  gauge.setProgress(Math.random() * 100);
  screen.render();
}, 10);*/


let dungeon = generateDungeon();
//dungeon.print();

const renderScaling = 3;

let baseMap = [];
for (let y = 0; y < dungeon.size[1]; y++) {
  let row = [];
  for (let x = 0; x < dungeon.size[0]; x++) {
    for (let i = 0; i <= renderScaling; i++) {
      row.push(dungeon.walls.get([x, y]) ? '■' : ' ');
    }
  }

  for (let i = 0; i <= renderScaling; i++) {
    baseMap.push(row);
  }

}

console.log(screen.width, screen.height);

let playerPositionXY = [Math.floor(dungeon.start_pos[0] * 4), Math.floor(dungeon.start_pos[1] * 4)];
// Quit on Escape, q, or Control-C.
screen.key(['w', 'a', 's', 'd'], function (ch, key) {
  let origPos = [... playerPositionXY];
  switch (key.full) {
    case "w":
      playerPositionXY[1] = playerPositionXY[1] - 1;
      break;
    case "a":
      playerPositionXY[0] = playerPositionXY[0] - 1;
      break;
    case "s":
      playerPositionXY[1] = playerPositionXY[1] + 1;
      break;
    case "d":
      playerPositionXY[0] = playerPositionXY[0] + 1;
      break;
  }

  // TODO model game state and check against baseMap as well as dynamic objects
  if (baseMap[playerPositionXY[1]][playerPositionXY[0]] != " ") {
    playerPositionXY = origPos;
    return;
  }

  let screenOut = refresh(baseMap);
  //console.log(screen.width, screen.height);
  mainView.setContent(screenOut);
  screen.render();
});



const refresh = function (map) {
  let buf = "";
  let x, y = 0;
  //console.log(map.length / dungeon.size[1]);
  let camera = getCameraPos(playerPositionXY[0], playerPositionXY[1], mainView.width - 2, mainView.height - 2, map[0].length, map.length);
  for (y = camera[1]; y < mainView.height - 2 + camera[1]; y++) {
    for (x = camera[0]; x < mainView.width - 2 + camera[0]; x++) {
      if (map.length > y && map[y].length > x) {

        if (playerPositionXY[0] === x && playerPositionXY[1] == y) {
          // Render player at current position
          buf += "{bold}@{/bold}";
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

let curTime = new Date();
let screenOut = refresh(baseMap);
//console.log(screen.width, screen.height);
mainView.setContent(screenOut);
screen.render();
let nowTime = new Date();

console.log("timed", nowTime - curTime);

console.log(mainView.height, mainView.width);


screen.on("resize", function () {
  screenOut = refresh(baseMap);
  console.log(screen.width, screen.height);
  mainView.setContent(screenOut);
  screen.render();
})


// Render the screen.
screen.render();

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


