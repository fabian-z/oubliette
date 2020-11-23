class Vector2 {
    x = 0
    y = 0

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

    toString() {
        return `[{this.x},{this.y}]`;
    }

} 