import blessed from 'blessed';
import { Vector2 } from './util.js';

export class TerminalInterface {

    screen;
    mainView;
    rightView;
    preRender = {};
    
    // sidebar
    playerName;
    healthGauge;
    eventLog;

    setMainContent(content) {
        this.mainView.setContent(content);
        this.screen.render();
    }

    setPlayerName(name) {
        this.playerName = name;
    }

    setHealth(percent) {
        this.healthGauge.setProgress(percent);
        this.screen.render();
    }

    getMainViewSize() {
        return new Vector2(this.mainView.width, this.mainView.height);
    }

    onScreenResize(callback) {
        this.screen.on("resize", callback);
    }

    onKeypress(callback) {
        this.screen.on("keypress", callback);
    }

    disableKeys() {
        this.screen.lockKeys = true;
    }

    debug(...msg) {
        if (this.screen.debug) {
            this.screen.debug(...msg);
        }
    }

    popupMessage(msg, time, callback) {
        let messageBox = blessed.message({
            parent: this.screen,
            width: "50%",
            height: "25%",
            left: "center",
            top: "center",
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0'
                },
            },
            align: "center",
            valign: "middle",

        });
        this.mainView.append(messageBox);
        messageBox.display(msg, time, function() {
            if (callback !== undefined) {
                callback();
            }
        });
    }

    quit() {
        this.screen.destroy();
        process.exit(0);
    }

    constructor() {

        // Create a screen object.
        this.screen = blessed.screen({
            smartCSR: true,
            warnings: true,
            //autoPadding: true,
            debug: true,
            enableKeys: true,
            title: 'oubliette'
        });

        // Create main game viewport
        this.mainView = blessed.box({
            parent: this.screen,
            top: 'center',
            left: 'left',
            width: '80%',
            height: '100%',
            content: '',
            tags: false,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0'
                },
                hover: {
                }
            }
        });

        // Append our box to the screen.
        this.screen.append(this.mainView);

        // Create a box perfectly centered horizontally and vertically.
        this.rightView = blessed.box({
            parent: this.screen,
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
        this.screen.append(this.rightView);

        //let gauge = contrib.gauge({label: 'Progress', stroke: 'green', fill: 'white'});
        this.playerName = blessed.box({
            parent: this.screen,
            width: '50%',
            height: "10%",
            content: "Player: Jenny\n\n\n\n"
        });

        let label = blessed.box({
            parent: this.screen,
            top: 5,
            width: '50%',
            height: "10%",
            content: "HP"
        });
        
        this.healthGauge = blessed.progressbar({
            parent: this.screen,
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
            ch: '█',
            width: '80%',
            height: 3,
            top: 6,
            //left: 3,
            filled: 0
        });

        this.rightView.append(this.playerName);

        this.rightView.append(label);
        this.rightView.append(this.healthGauge);
        
        this.healthGauge.setProgress(100);


        // Quit on Escape, q, or Control-C.
        this.screen.key(['escape', 'q', 'C-c'], function () {
            return process.exit(0);
        });

        this.preRender.player = blessed.parseTags("{green-fg}{bold}@{/bold}{/green-fg}");
        this.preRender.wall = blessed.parseTags("█");
        this.preRender.corridor = blessed.parseTags(" ");
        this.preRender.monsterPrefix = blessed.parseTags("{red-fg}{bold}");
        this.preRender.monsterSuffix = blessed.parseTags("{/bold}{/red-fg}");

        // Focus our element.
        this.mainView.focus();
    }
}


// Handler examples

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