class EnemyStats {
    constructor(races, atk, mag, def, spr, elementalResists, breaks, buffs, breakability, imperils, monsterAttack) {
        this.races = races;
        this.atk = atk;
        this.mag = mag;
        this.def = def;
        this.spr = spr;
        this.elementalResists = elementalResists;
        this.breaks = breaks;
        this.buffs = buffs;
        this.breakability = breakability;
        this.imperils = imperils;
        this.monsterAttack = monsterAttack;
    }
    
    static copy(enemyStats) {
        return new EnemyStats(
            enemyStats.races,
            enemyStats.atk,
            enemyStats.mag,
            enemyStats.def,
            enemyStats.spr,
            enemyStats.elementalResists,
            {
                "atk":enemyStats.breaks.atk,
                "def":enemyStats.breaks.def,
                "mag":enemyStats.breaks.mag,
                "spr":enemyStats.breaks.spr
            },
            {
                "atk":enemyStats.buffs.atk,
                "def":enemyStats.buffs.def,
                "mag":enemyStats.buffs.mag,
                "spr":enemyStats.buffs.spr
            },
            {
                "atk":enemyStats.breakability.atk,
                "def":enemyStats.breakability.def,
                "mag":enemyStats.breakability.mag,
                "spr":enemyStats.breakability.spr
            },
            {
                "fire":enemyStats.imperils.fire, 
                "ice":enemyStats.imperils.ice, 
                'lightning':enemyStats.imperils.lightning, 
                'water':enemyStats.imperils.water, 
                'earth':enemyStats.imperils.earth, 
                'wind':enemyStats.imperils.wind, 
                'light':enemyStats.imperils.light, 
                'dark':enemyStats.imperils.dark,
                "dagger":enemyStats.imperils.dagger,
                "sword":enemyStats.imperils.sword,
                'greatSword':enemyStats.imperils.greatSword,
                'katana':enemyStats.imperils.katana,
                'staff':enemyStats.imperils.staff,
                'rod':enemyStats.imperils.rod,
                'bow':enemyStats.imperils.bow,
                'axe':enemyStats.imperils.axe,
                "hammer":enemyStats.imperils.hammer,
                "spear":enemyStats.imperils.spear,
                'harp':enemyStats.imperils.harp,
                'whip':enemyStats.imperils.whip,
                'throwing':enemyStats.imperils.throwing,
                'gun':enemyStats.imperils.gun,
                'mace':enemyStats.imperils.mace,
                'fist':enemyStats.imperils.fist,
            },
            enemyStats.monsterAttack
        );
    }
}
