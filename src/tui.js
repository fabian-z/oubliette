import blessed from 'blessed';

export class TerminalInterface {

    screen;
    mainView;
    rightView;

    setMainContent(content) {
        this.mainView.setContent(content);
        this.screen.render();
    }

    getMainViewSizeXY() {
        return [this.mainView.width, this.mainView.height];
    }

    onScreenResize(callback) {
        this.screen.on("resize", callback);
    }

    onKeypress(callback) {
        this.screen.on("keypress", callback);
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
        let gaugeLabel = blessed.box({
            parent: this.screen,
            width: '50%',
            height: 3,
            content: "Player: Anonymous\nHP"

        });
        let gauge = blessed.progressbar({
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
            ch: '■',
            width: '80%',
            height: 3,
            top: 6,
            //left: 3,
            filled: 0
        });

        this.rightView.append(gaugeLabel);
        this.rightView.append(gauge);
        gauge.setProgress(50);


        // Quit on Escape, q, or Control-C.
        this.screen.key(['escape', 'q', 'C-c'], function () {
            return process.exit(0);
        });

        // Focus our element.
        this.mainView.focus();
    }
}
