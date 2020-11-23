import Dungeon from '2d-dungeon';

export function generateDungeon() {
    let dungeon = new Dungeon({
        size: [256, 256], 
        //seed: 'abcd', //omit for generated seed
        rooms: {
            initial: {
                min_size: [8, 8],
                max_size: [10, 10],
                max_exits: 1,
                //position: [0, 0] //OPTIONAL pos of initial room 
            },
            any: {
                min_size: [8, 8],
                max_size: [10, 10],
                max_exits: 4
            }
        },
        max_corridor_length: 6,
        min_corridor_length: 2,
        corridor_density: 0.5, //corridors per room
        symmetric_rooms: false, // exits must be in the center of a wall if true
        interconnects: 1, //extra corridors to connect rooms and make circular paths. not 100% guaranteed
        max_interconnect_length: 10,
        room_count: 20
    });
    
    dungeon.generate();
    return dungeon;
}


/*

dungeon.print(); //outputs wall map to console.log

dungeon.size; // [width, heihgt]
let x = 0;
let y = 0;
dungeon.walls.get([x, y]); //return true if position is wall, false if empty

for(let piece of dungeon.children) {
    console.log(piece);
    /*
    piece.position; //[x, y] position of top left corner of the piece within dungeon
    piece.tag; // 'any', 'initial' or any other key of 'rooms' options property
    piece.size; //[width, height]
    piece.walls.get([x, y]); //x, y- local position of piece, returns true if wall, false if empty
    for (let exit of piece.exits) {
        let {x, y, dest_piece} = exit; // local position of exit and piece it exits to
        piece.global_pos([x, y]); // [x, y] global pos of the exit
    }

    piece.local_pos(dungeon.start_pos); //get local position within the piece of dungeon's global position
    //
}

console.log(dungeon.initial_room); //piece tagged as 'initial'
console.log(dungeon.start_pos); //[x, y] center of 'initial' piece 
*/

//exports = {'generateDungeon': generateDungeon}