class EnnemyStats {
    constructor(races, def, spr, elementalResists, breaks, imperils) {
        this.races = races;
        this.def = def;
        this.spr = spr;
        this.elementalResists = elementalResists;
        this.breaks = breaks;
        this.imperils = imperils;
    }
    
    static copy(ennemyStats) {
        return new EnnemyStats(
            ennemyStats.races,
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
                "fire":ennemyStats.imperils.fire, 
                "ice":ennemyStats.imperils.ice, 
                'lightning':ennemyStats.imperils.lightning, 
                'water':ennemyStats.imperils.water, 
                'earth':ennemyStats.imperils.earth, 
                'wind':ennemyStats.imperils.wind, 
                'light':ennemyStats.imperils.light, 
                'dark':ennemyStats.imperils.dark
            }
        );
    }
}