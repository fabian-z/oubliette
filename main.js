let blessed = require('blessed');
let contrib = require('blessed-contrib');

// Create a screen object.
let screen = blessed.screen({
  smartCSR: true
});

screen.title = 'my window title';

// Create a box perfectly centered horizontally and vertically.
let box = blessed.box({
  top: 'center',
  left: 'left',
  width: '80%',
  height: '100%',
  content: 'Hello {bold}world{/bold}!',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(box);

// Create a box perfectly centered horizontally and vertically.
let box2 = blessed.box({
  top: 'center',
  right: '0',
  width: '20%',
  height: '100%',
  content: 'Hello {bold}world 2{/bold}!',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'magenta',
    border: {
      fg: '#f0f0f0'
    },
    hover: {
      bg: 'green'
    }
  }
});

// Append our box to the screen.
screen.append(box2);

let gauge = contrib.gauge({label: 'Progress', stroke: 'green', fill: 'white'})
box.append(gauge);
gauge.setPercent(0);


// If our box is clicked, change the content.
box.on('click', function(data) {
  box.setContent('{center}Some different {red-fg}content{/red-fg}.{/center}');
  

gauge.setPercent(Math.random() * 100);
  screen.render();
});

// If box is focused, handle `enter`/`return` and give us some more content.
box.key('enter', function(ch, key) {
  box.setContent('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
  box.setLine(1, 'bar');
  box.insertLine(1, 'foo');
  screen.render();
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Focus our element.
box.focus();


// Render the screen.
screen.render();
