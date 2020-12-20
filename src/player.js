export class Player {
    pos;
    health = 100;
    experience = 0;
    level = 1;
    name = "";

    constructor(name, pos) {
        this.name = name;
        this.pos = pos;
    }

    addExperience(exp) {
        this.experience += exp;
        this.level = LevelFromExperience(this.experience);
    }

}

// calculate level from experience
// level = sqrt(xp)/2, round to nearest value
export function LevelFromExperience(exp) {
    return Math.round(Math.sqrt(exp) / 2.0);
}

// calculate minimum experience required for level,
// inverse function of levelFromExperience,
// exp = 4*lvl^2
export function MinLevelExperience(lvl) {
    return 4 * Math.pow(lvl, 2);
}