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
    objectList;

    setMainContent(content) {
        this.mainView.setContent(content);
        this.screen.render();
    }

    setObjectList(content) {
        this.objectList.setContent(content);
        this.screen.render();
    }

    setPlayerName(name) {
        if (!name) {
            name = "Anonymous";
        }
        this.playerName.content = `Player: ${name}`;
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

    prompt(msg, def, callback) {

        // native blessed prompt is buggy and cannot be properly styled

        let promptBox = blessed.box({
            parent: this.screen,
            width: "50%",
            height: "25%",
            left: "center",
            top: "center",
            border: {
                type: 'line',
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0',
                },
            },
            align: "center",
            valign: "middle",
        });

        let question = blessed.box({
            parent: promptBox,
            width: "50%",
            height: "60%",
            left: "center",
            top: "center",
            align: "center",
            valign: "top",
            content: msg,
        });

        let entryBox = blessed.box({
            parent: promptBox,
            width: "50%",
            height: "30%",
            left: "center",
            top: "center",
            align: "center",
            valign: "bottom",
            border: {
                type: 'line',
            },
        });

        let entry = blessed.textbox({
            parent: entryBox,
            width: "90%",
            height: "70%",
            // align, position and style options do not work well with textbox and cursors
            //style: {
            //    bg: "#000000",
            //},
        });

        entryBox.append(entry);
        promptBox.append(question);
        promptBox.append(entryBox);

        entry.setValue(def);
        entry.readInput(function(err, val) {
            promptBox.destroy();
            callback(err, val);
        });

        this.mainView.append(promptBox);
        this.screen.render();
    }

    popupMessage(msg, time, callback) {
        let messageBox = blessed.message({
            parent: this.screen,
            width: "50%",
            height: "25%",
            left: "center",
            top: "center",
            border: {
                type: 'line',
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0',
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

    helpMessage(callback) {
        let messageBox = blessed.message({
            parent: this.screen,
            width: "70%",
            height: "70%",
            left: "center",
            top: "center",
            border: {
                type: 'line',
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0',
                },
            },
            align: "left",
            valign: "left",
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: " ",
                inverse: true
            },
            keys: true,
        });

        let helpMessage = `{underline}Game Explanation{/underline}
Your main goal is to survive! This includes killing all monsters in this spooky dungeon.
You can use all items you find (just walk over the item symbol).
To kill these nasty monsters you just press these keys when next to them:
"Alt" and "WASD" or arrow keys (the direction of the monster).
If you are too scared just press "ESC", "q" or "h" to awake from this creepy nightmare.

{underline}Symbols{/underline}
        
{green-fg}{bold}@{/bold}{/green-fg} = You

{bold}*{/bold}Monsters:
Sorted list from lowest to highest base damage!        
{grey-fg}(Monsters can be weaker or stronger than their base damage){/grey-fg}

{red-fg}{bold}B{/bold}{/red-fg} = Bat
{red-fg}{bold}S{/bold}{/red-fg} = Spider
{red-fg}{bold}R{/bold}{/red-fg} = Rat
{red-fg}{bold}W{/bold}{/red-fg} = Warg
{red-fg}{bold}O{/bold}{/red-fg} = Orc
{red-fg}{bold}U{/bold}{/red-fg} = Undead
{red-fg}{bold}T{/bold}{/red-fg} = Troll

{bold}*{/bold}Items:
Sorted list from highest to lowest placement probability!

{yellow-fg}{bold}H{/bold}{/yellow-fg} = Health Potion
{yellow-fg}{bold}A{/bold}{/yellow-fg} = Agility Potion {grey-fg}(10 s.){/grey-fg}
{yellow-fg}{bold}T{/bold}{/yellow-fg} = Monster Slowdown Totem {grey-fg}(15 s.){/grey-fg}
         
At this point you know all important information to kill all monsters and WIN.
Otherwise you don't understand and {red-fg}YOU WILL DIE{/red-fg}.    
Now collect all your courage and go back to the dungeon!
- Just press any key to exit -`;

        this.mainView.append(messageBox);
        messageBox.display(helpMessage, 0, function() {
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
            title: 'oubliette',
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
                type: 'line',
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0',
                },
                hover: {},
            },
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
                type: 'line',
            },
            style: {
                fg: 'white',
                border: {
                    fg: '#f0f0f0',
                },
            },
        });

        // Append our box to the screen.
        this.screen.append(this.rightView);

        this.playerName = blessed.box({
            parent: this.screen,
            width: '50%',
            height: "10%",
            content: "Player:",
        });

        let label = blessed.box({
            parent: this.screen,
            top: 5,
            width: '50%',
            height: "10%",
            content: "HP",
        });

        this.healthGauge = blessed.progressbar({
            parent: this.screen,
            border: 'line',
            style: {
                fg: 'white',
                bg: 'default',
                bar: {
                    bg: 'default',
                    fg: 'red',
                },
                border: {
                    fg: 'default',
                    bg: 'default',
                },
            },
            ch: '█',
            width: '80%',
            height: 3,
            top: 6,
            //left: 3,
            filled: 0,
        });

        this.objectList = blessed.box({
            parent: this.screen,
            top: 15,
            width: '90%',
            height: "10%",
            content: "",
        });

        this.rightView.append(this.playerName);
        this.rightView.append(label);
        this.rightView.append(this.healthGauge);
        this.rightView.append(this.objectList);

        this.healthGauge.setProgress(100);


        // Quit on Escape, q, or Control-C.
        this.screen.key(['escape', 'q', 'C-c'], function() {
            return process.exit(0);
        });

        this.preRender.player = blessed.parseTags("{green-fg}{bold}@{/bold}{/green-fg}");
        this.preRender.wall = blessed.parseTags("█");
        this.preRender.corridor = blessed.parseTags(" ");
        this.preRender.monsterPrefix = blessed.parseTags("{red-fg}{bold}");
        this.preRender.monsterSuffix = blessed.parseTags("{/bold}{/red-fg}");
        this.preRender.itemPrefix = blessed.parseTags("{yellow-fg}{bold}");
        this.preRender.itemSuffix = blessed.parseTags("{/bold}{/yellow-fg}");


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