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

    toString() {
        return `[${this.x},${this.y}]`;
    }

}