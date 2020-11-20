'use strict';
import blessed from 'blessed';
import {generateDungeon} from './dungeon.js';

// Create a screen object.
let screen = blessed.screen({
  smartCSR: true,
  warnings: true
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
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus our element.
mainView.focus();

/*var timer = setInterval(function() {
  gauge.setProgress(Math.random() * 100);
  screen.render();
}, 10);*/


let dungeon = generateDungeon();
dungeon.print();

let out = [];
for (let y = 0; y < dungeon.size[1]; y ++) {
  let row = [];
  for (let x = 0; x < dungeon.size[0]; x++) {
      if (dungeon.start_pos && dungeon.start_pos[0] === x && dungeon.start_pos[1] === y) {
          row.push('{red-fg}{green-bg}{bold}s{/bold}{/green-bg}{/red-fg}');
      } else {
          row.push(dungeon.walls.get([x, y]) ? 'x' : ' ');
      }
  }
  out.push(row);
}

console.log(out);

let viewTable = blessed.table({
  parent: screen,
  rows: out,
  height: '90%',
  width: '90%',
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  interactive: true,
  scrollbar: true,
  //border: {
  //  type: 'line'
  //},
});

mainView.append(viewTable);

//mainView.setContent(JSON.stringify(out));


// Render the screen.
screen.render();

