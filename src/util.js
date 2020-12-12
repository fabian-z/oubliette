export class Vector2 {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(vec) {
        return new Vector2(this.x + vec.x, this.y + vec.y);
    }

    sub(vec) {
        return new Vector2(this.x - vec.x, this.y - vec.y);
    }

    scalar(x) {
        return new Vector2(this.x * x, this.y * x);
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    floor() {
        return new Vector2(Math.floor(this.x), Math.floor(this.y));
    }

    equal(vec) {
        return vec.x === this.x && vec.y === this.y;
    }

    toString() {
        return `[${this.x},${this.y}]`;
    }

}

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
//MIT License
//The returned value is no lower than (and may possibly equal) min, and is less than (and not equal) max.
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}