import Dungeon2D from '2d-dungeon';
import { Vector2 } from './util.js';

export class Dungeon {
    generated;
    size;
    playerStart;

    isWall(pos) {
        return this.generated.walls.get([pos.x, pos.y]);
    }

    getRoom(pos) {
        for (let piece of this.generated.children) {
            if (pos.x >= piece.position[0] && pos.x <= piece.position[0] + piece.size[0]) {
                if (pos.y >= piece.position[1] && pos.y <= piece.position[1] + piece.size[1]) {
                    return piece;
                }
            }
        }
        return false;
    }

    constructor() {
        this.generated = new Dungeon2D({
            size: [256, 256],
            rooms: {
                initial: {
                    min_size: [8, 8],
                    max_size: [10, 10],
                    max_exits: 1,
                },
                any: {
                    min_size: [8, 8],
                    max_size: [10, 10],
                    max_exits: 4,
                },
            },
            max_corridor_length: 6,
            min_corridor_length: 2,
            corridor_density: 0.5, //corridors per room
            symmetric_rooms: false, // exits must be in the center of a wall if true
            interconnects: 1, //extra corridors to connect rooms and make circular paths. not 100% guaranteed
            max_interconnect_length: 10,
            room_count: 20,
        });
        this.generated.generate();

        this.size = new Vector2(this.generated.size[0], this.generated.size[1]);
        this.playerStart = new Vector2(this.generated.start_pos[0], this.generated.start_pos[1]);
    }
}