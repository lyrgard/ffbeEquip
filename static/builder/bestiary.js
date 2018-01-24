class Bestiary {
    constructor(monsters) {
        this.monsters = monsters;
        for (var index = monsters.length; index--;) {
            monsters[index].type = "monster";
        }
    }
    
    
}