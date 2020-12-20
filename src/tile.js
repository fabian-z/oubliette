import { Monster } from './monster.js';
import { Item } from './item.js';

export class Tile {
    isWall;
    isRoom;
    isCorridor;
    roomTag;
    pos;

    neighbours = [];
    pathPlayerValue; //Dijkstra map value, http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps

    impassable;
    explored;

    item;
    monster;

    addMonster(monster) {
        this.monster = monster;
        this.impassable = true;
    }

    removeMonster() {
        this.monster = undefined;
        this.impassable = false;
    }

    addItem(item) {
        this.item = item;
    }

    removeItem() {
        this.item = undefined;
    }

    clone() {
        // custom clone function
        // https://stackoverflow.com/questions/57542052/deep-clone-class-instance-javascript
        let tile = new Tile();
        tile.isWall = this.isWall;
        tile.isCorridor = this.isCorridor;
        tile.isRoom = this.isRoom;
        tile.roomTag = this.roomTag;

        tile.impassable = this.impassable;
        tile.explored = this.explored;
        tile.item = this.item;
        tile.monster = this.monster;
        return tile;
    }

    renderString(tui) {
        if (!this.explored) {
            return " ";
        }
        if (this.monster instanceof Monster) {
            return tui.preRender.monsterPrefix + this.monster.symbol + tui.preRender.monsterSuffix;
        }
        if (this.item instanceof Item) {
            return tui.preRender.itemPrefix + this.item.symbol + tui.preRender.itemSuffix;
        }
        if (this.isWall) {
            return tui.preRender.wall;
        }

        // empty
        if (this.isCorridor || this.isRoom) {
            return tui.preRender.corridor;
        }

    }
}