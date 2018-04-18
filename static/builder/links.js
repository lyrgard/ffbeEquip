const goalList = ["custom", "physicalDamage", "magicalDamage", "magicalDamageWithPhysicalMecanism", "hybridDamage", "jumpDamage", "sprDamageWithPhysicalMecanism", "sprDamageWithMagicalMecanism", "summonerSkill"];
const equipmentToUseList = ["all", "owned", "shopRecipe"];

function isMinified(data) {
    return data.v && data.v>2;
}

function minify(data) {
    var minified = {};
    minified.a = goalList.indexOf(data.goal);
    minified.b = [];
    for (var unitId in units) {
        if (units[unitId].name == data.unitName) {
            minified.b[0] = unitId;
            break;
        }
    }
    minified.b[1] = data.rarity;
    if (data.innateElements && data.innateElements.length > 0) {
        minified.c = [];
        for (var i = 0, len = data.innateElements.length; i < len; i++) {
            minified.c[minified.c.length] = elementList.indexOf(data.innateElements[i]);
        }
    }
    if (data.ennemyRaces && data.ennemyRaces.length > 0) {
        minified.d = [];
        for (var i = 0, len = data.ennemyRaces.length; i < len; i++) {
            minified.d[minified.d.length] = killerList.indexOf(data.ennemyRaces[i]);
        }
    }
    minified.e = [data.monsterDef, data.monsterSpr];
    if (data.ennemyResists && Object.keys(data.ennemyResists).length > 0) {
        minified.f = [];
        for (var i = 0, len = elementList.length; i < len; i++) {
            if (data.ennemyResists[elementList[i]]) {
                minified.f[i] = data.ennemyResists[elementList[i]];
            } else {
                minified.f[i] = 0;
            }
        }
    }
    if (data.equipmentToUse == "all") {
        if (data.exludeEventEquipment || data.excludeTMR5 || !data.excludeNotReleasedYet || data.excludePremium || data.excludeSTMR) {
            minified.h = [
                booleanToInt(data.exludeEventEquipment),
                booleanToInt(data.excludeTMR5),
                booleanToInt(data.excludeNotReleasedYet),
                booleanToInt(data.excludePremium),
                booleanToInt(data.excludeSTMR)
            ];
        }
    } else {
        minified.g = equipmentToUseList.indexOf(data.equipmentToUse);
    }
    minified.i = data.fixedItems;
    if (data.esper) {
        minified.j = data.esper;
    }
    if (data.customFormula) {
        minified.k = data.customFormula;
    }
    minified.l = [];
    minified.m = [];
    for (var i = 0, len = baseStats.length; i < len; i++) {
        minified.l[i] = data.pots[baseStats[i]];
        minified.m[i] = data.buff[baseStats[i]];
    }
    minified.m[6] = data.buff.lbFillRate;
    minified.m[7] = data.lbShardsPerTurn;
    return minified;
}

function booleanToInt(boolean) {
    if (boolean) {
        return 1;
    } else {
        return 0;
    }
}

function unminify(data) {
    
}
