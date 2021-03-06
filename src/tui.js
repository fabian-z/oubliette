import blessed from 'blessed';
import { Vector2 } from './util.js';

export class TerminalInterface {

    screen;
    mainView;
    rightView;
    preRender = {};

    // sidebar
    playerName;
    level;
    depth;
    healthGauge;
    expGauge;
    eventLog;
    objectList;
    helpHint;

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

    setLevel(lvl) {
        this.level.content = `Level: ${lvl}`;
    }

    setDepth(lvl) {
        this.depth.content = `Depth: ${lvl}`;
    }

    setExperience(exp, thisLevelExp, nextLevelExp) {
        // calculate progress until next level and show percent on gauge
        let diffLvl = nextLevelExp - thisLevelExp;
        let diffPlayer = nextLevelExp - exp;
        let percent = ((diffLvl - diffPlayer) / diffLvl) * 100;
        this.expGauge.setProgress(percent);
        this.screen.render();
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
            height: "35%",
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

    alwaysPopupMessage(msg, minDuration, callback) {
        // cooldown period for which display of message is guaranteed
        let cooldown = true;
        setTimeout(function() {
            cooldown = false;
        }, minDuration);
        let tui = this;
        this.popupMessage(msg, 0, function() {
            if (cooldown) {
                tui.popupMessage(msg, Math.floor(minDuration / 1000), function() {
                    callback();
                });
                return;
            }
            callback();
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
                inverse: true,
            },
            keys: true,
        });

        let helpMessage = `{underline}Game Explanation{/underline}
Your main goal is to survive! This includes killing all monsters in this spooky dungeon.
You can use all items you find (just walk over the item symbol).

To kill the monsters just press these keys when next to them:
'Shift' & 'WASD' or arrow keys (with the direction of the monster).
Mac users can use 'Fn' & arrow keys or 'Shift' & 'WASD' for attack, or play with iTerm2.
If you are too scared just press 'ESC' or 'q' to awake from this creepy nightmare.

{underline}Symbols{/underline}
        
{green-fg}{bold}@{/bold}{/green-fg} = You

{bold}*{/bold} Monsters:
Sorted list from lowest to highest base damage!        
{grey-fg}(Monsters can be weaker or stronger than their base damage){/grey-fg}

{red-fg}{bold}B{/bold}{/red-fg} = Bat
{red-fg}{bold}S{/bold}{/red-fg} = Spider
{red-fg}{bold}R{/bold}{/red-fg} = Rat
{red-fg}{bold}W{/bold}{/red-fg} = Warg
{red-fg}{bold}O{/bold}{/red-fg} = Orc
{red-fg}{bold}U{/bold}{/red-fg} = Undead
{red-fg}{bold}T{/bold}{/red-fg} = Troll

{bold}*{/bold} Items:
Sorted list from highest to lowest placement probability!

{yellow-fg}{bold}H{/bold}{/yellow-fg} = Health Potion
Increase health points between 40 and 100 points 

{yellow-fg}{bold}A{/bold}{/yellow-fg} = Agility Potion {grey-fg}(10 s.){/grey-fg}
Increase player speed 

{yellow-fg}{bold}C{/bold}{/yellow-fg} = Charge Potion {grey-fg}(10 s.){/grey-fg}
Increase player attack damage

{yellow-fg}{bold}P{/bold}{/yellow-fg} = Pugio Dagger
Increase player damage

{yellow-fg}{bold}T{/bold}{/yellow-fg} = Monster Slowdown Totem {grey-fg}(15 s.){/grey-fg}
Decrease monsters speed

{yellow-fg}{bold}D{/bold}{/yellow-fg} = Double Bladed Sword
Increase player damage

{yellow-fg}{bold}V{/bold}{/yellow-fg} = Vanishing Totem
Kills all monsters around the player
         
At this point you know all important information to kill all monsters and WIN.
Otherwise you don't understand and {red-fg}YOU WILL DIE{/red-fg}.    
Now collect all your courage and go back to the dungeon!
- Press h again to exit -`;

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
            width: '80%',
            height: "10%",
            content: "Player:",
        });

        this.level = blessed.box({
            parent: this.screen,
            top: 1,
            widht: '80%',
            height: '10%',
            content: "Level:",
        });

        this.depth = blessed.box({
            parent: this.screen,
            top: 3,
            widht: '80%',
            height: '10%',
            content: "Depth:",
        });

        let label = blessed.box({
            parent: this.screen,
            top: 5,
            width: '50%',
            height: "10%",
            content: "Health / Experience",
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
            filled: 0,
        });

        this.expGauge = blessed.progressbar({
            parent: this.screen,
            border: 'line',
            style: {
                fg: 'white',
                bg: 'default',
                bar: {
                    bg: 'default',
                    fg: 'blue',
                },
                border: {
                    fg: 'default',
                    bg: 'default',
                },
            },
            ch: '█',
            width: '80%',
            height: 3,
            top: 9,
            filled: 0,
        });

        this.objectList = blessed.box({
            parent: this.screen,
            top: 13,
            width: "90%",
            height: "40%",
            content: "",
        });

        this.helpHint = blessed.box({
            parent: this.screen,
            bottom: 0,
            width: "90%",
            height: "15%",
            align: "center",
            valign: "bottom",
            content: "Press \n -'h' or '?' for help\n-'ESC' or 'q' to quit",
        });

        this.rightView.append(this.playerName);
        this.rightView.append(this.level);
        this.rightView.append(this.depth);
        this.rightView.append(label);
        this.rightView.append(this.healthGauge);
        this.rightView.append(this.expGauge);
        this.rightView.append(this.objectList);
        this.rightView.append(this.helpHint);

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