class Bestiary {
    constructor(monsters) {
        this.monstersByCategory = monsters;
        Object.keys(this.monstersByCategory).forEach(c => {
            this.monstersByCategory[c].forEach(monster => monster.type = "monster");
        });
    }
    
    
}
