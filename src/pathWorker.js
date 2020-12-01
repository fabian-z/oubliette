import { isMainThread, parentPort } from 'worker_threads';

if (!isMainThread) {
    let baseData;
    parentPort.on('message', (data) => {

        let playerPos;
        let obj;

        // Handle possibility of pre-serialized JSON data
        switch (typeof data) {
            case "object":
                obj = data;
                break;
            case "string":
                obj = JSON.parse(data);
                break;
        }

        if (Object.prototype.hasOwnProperty.call(obj, "max")) {
            // Store base data
            baseData = obj;
            return;
        }

        if (Object.prototype.hasOwnProperty.call(obj, "pos")) {
            // Received player position, map calculation requested
            playerPos = data.pos;
        }

        let tiles = baseData.tiles;
        let floor = baseData.floor;
        let max = baseData.max;

        let changed;
        let min, curPos, neighbour;

        /* From http://www.roguebasin.com/index.php?title=The_Incredible_Power_of_Dijkstra_Maps
        To get a Dijkstra map, you start with an integer array representing your map, with some set of goal cells set to zero
        and all the rest set to a very high number. Iterate through the map's "floor" cells -- skip the impassable wall cells.
        If any floor tile has a value greater than 1 regarding to its lowest-value floor neighbour
        (in a cardinal direction - i.e. up, down, left or right; a cell next to the one we are checking),
        set it to be exactly 1 greater than its lowest value neighbor. Repeat until no changes are made.
        The resulting grid of numbers represents the number of steps that it will take to get from any given tile to the nearest goal.
        */

        // Note: Position values are [x, y] in the worker, because Vector2 causes serialization overhead
        // This could be fixed with a more sophisticated serialization, e.g. FlatBuffers

        // Preparation
        for (let y = 0; y < tiles.length; y++) {
            for (let x = 0; x < tiles[0].length; x++) {
                tiles[y][x].val = max;
            }
        }    
        tiles[playerPos[1]][playerPos[0]].val = 0;

        // Actual path calculation
        do {
            changed = false;
            for (curPos of floor) {
                // curPos = [x, y]
                min = max;
                let curTile = tiles[curPos[1]][curPos[0]];

                // curTile.n -> neighbour array
                // shortened form is used to transfer less JSON data
                for (neighbour of curTile.n) {
                    // neighbour = [x, y]
                    if (min > tiles[neighbour[1]][neighbour[0]].val) {
                        min = tiles[neighbour[1]][neighbour[0]].val;
                    }
                }

                min += 1;
                if (curTile.val > min) {
                    curTile.val = min;
                    changed = true;
                }
            }

        } while (changed)

        // Reduce result and transfer only map values in 2d array
        // This saves time in parsing on the main thread
        let result = [];
        for (let y = 0; y < tiles.length; y++) {
            let row = [];
            for (let x = 0; x < tiles[0].length; x++) {
                row.push(tiles[y][x].val);
            }
            result.push(row);
        }

        // Send data back to main thread
        parentPort.postMessage(result);
    });
}