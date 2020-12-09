class EnnemyStats {
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
    
    static copy(ennemyStats) {
        return new EnnemyStats(
            ennemyStats.races,
            ennemyStats.atk,
            ennemyStats.mag,
            ennemyStats.def,
            ennemyStats.spr,
            ennemyStats.elementalResists,
            {
                "atk":ennemyStats.breaks.atk,
                "def":ennemyStats.breaks.def,
                "mag":ennemyStats.breaks.mag,
                "spr":ennemyStats.breaks.spr
            },
            {
                "atk":ennemyStats.buffs.atk,
                "def":ennemyStats.buffs.def,
                "mag":ennemyStats.buffs.mag,
                "spr":ennemyStats.buffs.spr
            },
            {
                "atk":ennemyStats.breakability.atk,
                "def":ennemyStats.breakability.def,
                "mag":ennemyStats.breakability.mag,
                "spr":ennemyStats.breakability.spr
            },
            {
                "fire":ennemyStats.imperils.fire, 
                "ice":ennemyStats.imperils.ice, 
                'lightning':ennemyStats.imperils.lightning, 
                'water':ennemyStats.imperils.water, 
                'earth':ennemyStats.imperils.earth, 
                'wind':ennemyStats.imperils.wind, 
                'light':ennemyStats.imperils.light, 
                'dark':ennemyStats.imperils.dark,
                "dagger":ennemyStats.imperils.dagger,
                "sword":ennemyStats.imperils.sword,
                'greatSword':ennemyStats.imperils.greatSword,
                'katana':ennemyStats.imperils.katana,
                'staff':ennemyStats.imperils.staff,
                'rod':ennemyStats.imperils.rod,
                'bow':ennemyStats.imperils.bow,
                'axe':ennemyStats.imperils.axe,
                "hammer":ennemyStats.imperils.hammer,
                "spear":ennemyStats.imperils.spear,
                'harp':ennemyStats.imperils.harp,
                'whip':ennemyStats.imperils.whip,
                'throwing':ennemyStats.imperils.throwing,
                'gun':ennemyStats.imperils.gun,
                'mace':ennemyStats.imperils.mace,
                'fist':ennemyStats.imperils.fist,
            },
            ennemyStats.monsterAttack
        );
    }
}
