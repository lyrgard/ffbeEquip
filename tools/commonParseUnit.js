var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrification"];

var typeMap = {
    1: 'dagger',
    2: 'sword',
    3: 'greatSword',
    4: 'katana',
    5: 'staff',
    6: 'rod',
    7: 'bow',
    8: 'axe',
    9: 'hammer',
    10: 'spear',
    11: 'harp',
    12: 'whip',
    13: 'throwing',
    14: 'gun',
    15: 'mace',
    16: 'fist',
    30: 'lightShield',
    31: 'heavyShield',
    40: 'hat',
    41: 'helm',
    50: 'clothes',
    51: 'lightArmor',
    52: 'heavyArmor',
    53: 'robe',
    60: 'accessory'
}

var raceMap = {
    1: 'beast',
    2: 'bird',
    3: 'aquatic',
    4: 'demon',
    5: 'human',
    6: 'machine',
    7: 'dragon',
    8: 'spirit',
    9: 'bug',
    10: 'stone',
    11: 'plant',
    12: 'undead'
}

var ailmentsMap = {
    "Poison": "poison",
    "Blind": "blind",
    "Sleep": "sleep",
    "Silence": "silence",
    "Paralyze": "paralysis",
    "Confusion": "confuse",
    "Disease": "disease",
    "Petrify": "petrification",
    "Death": "death"
}

var elementsMap = {
    1: 'fire',
    2: 'ice',
    3: 'lightning',
    4: 'water',
    5: 'wind',
    6: 'earth',
    7: 'light',
    8: 'dark'
}

var unlockedSkills = {
    "100011705": "225960",
    "100011805": "226000",
    "100012005": "225990",
    "100012405": "226010",
    "100011905": "507050",
    "100012505": "225970"
}

function getPassives(unitId, skillsIn, skills, enhancements, maxRarity, unitData, unitOut) {
    var baseEffects = {};
    var skillsOut = [baseEffects];
    unitOut.passives = [];
    unitOut.actives = [];
    unitOut.magics = [];
    
    for (skillIndex in skillsIn) {
        if (skillsIn[skillIndex].rarity > maxRarity) {
            continue; // don't take into account skills for a max rarity not yet released
        }
        var skillId = skillsIn[skillIndex].id.toString();
        if (skillId == "0") {
            console.log(skillsIn[skillIndex]);
            continue;
        }
        var skillIn = skills[skillId];
        if (skillIn.active && skillIn.type != "MAGIC") {
            unitOut.actives.push(parseActiveSkill(skillIn, skills));
            if (enhancements && enhancements[skillId]) {
                var enhancementLevel = 0;
                while(enhancements[skillId]) {
                    enhancementLevel++;
                    skillId = enhancements[skillId];
                    skillIn = skills[skillId];
                    var skill = parseActiveSkill(skillIn, skills);
                    skill.name = skill.name + " +" + enhancementLevel;
                    unitOut.actives.push(skill);
                } 
            }
            continue;
        } 
        if (skillIn.type == "MAGIC") {
            unitOut.magics.push(parseActiveSkill(skillIn, skills));
            if (enhancements && enhancements[skillId]) {
                var enhancementLevel = 0;
                while(enhancements[skillId]) {
                    enhancementLevel++;
                    skillId = enhancements[skillId];
                    skillIn = skills[skillId];
                    var skill = parseActiveSkill(skillIn, skills);
                    skill.name = skill.name + " +" + enhancementLevel;
                    unitOut.magics.push(skill);
                } 
            }
            continue;
        }
        if (!skillIn) {
            console.log(skillId);
        }
        if (enhancements && enhancements[skillId]) {
            if (!unitOut.enhancements) {
                unitOut.enhancements = [];
            }
            var enhancementData = {"name":skills[skillId].name, "levels":[]}
            var enhancementBaseEffects = {};
            var enhancementSkillsOut = [enhancementBaseEffects];
            var skill = getPassive(skillIn, enhancementBaseEffects, enhancementSkillsOut);
            unitOut.passives.push(skill);
            if (Object.keys(enhancementBaseEffects).length === 0) {
                enhancementSkillsOut.splice(0,1);
            }
            enhancementData.levels.push(enhancementSkillsOut);
            var enhancementLevel = 0;
            while(enhancements[skillId]) {
                enhancementLevel++;
                skillId = enhancements[skillId];
                skillIn = skills[skillId];
                var enhancementBaseEffects = {};
                var enhancementSkillsOut = [enhancementBaseEffects];
                var skill = getPassive(skills[skillId], enhancementBaseEffects, enhancementSkillsOut);
                skill.name = skill.name + " +" + enhancementLevel;
                unitOut.passives.push(skill);
                
                if (Object.keys(enhancementBaseEffects).length === 0) {
                    enhancementSkillsOut.splice(0,1);
                }
                enhancementData.levels.push(enhancementSkillsOut);
            }
            var empty = true;
            for (var i = enhancementData.levels.length; i--;) {
                if (Object.keys(enhancementData.levels[i]).length > 0) {
                    empty = false;
                    break;
                }
            }
            if (!empty) {
                unitOut.enhancements.push(enhancementData);
            }
            continue;
        }
        
        var skill = getPassive(skillIn, baseEffects, skillsOut);
        unitOut.passives.push(skill);
    }
    if (unlockedSkills[unitId]) {
        if (!unitOut.enhancements) {
            unitOut.enhancements = [];
        }
        
        var skillId = unlockedSkills[unitId];
        var skillIn = skills[skillId];
        
        var enhancementData = {"name":skillIn.name, "levels":[[]]}
        var enhancementBaseEffects = {};
        var enhancementSkillsOut = [enhancementBaseEffects];
        var skill = getPassive(skillIn, enhancementBaseEffects, enhancementSkillsOut);
        unitOut.passives.push(skill);
        if (Object.keys(enhancementBaseEffects).length === 0) {
            enhancementSkillsOut.splice(0,1);
        }
        enhancementData.levels.push(enhancementSkillsOut);
        unitOut.enhancements.push(enhancementData);
    }
    addElementalResist(baseEffects, unitData.element_resist);
    addAilmentResist(baseEffects, unitData.status_resist);
    
    if (Object.keys(baseEffects).length === 0) {
        skillsOut.splice(0,1);
    }
    
    return skillsOut;
}

function getPassive(skillIn, baseEffects, skillsOut) {
    var skill = {"name" : skillIn.name, "icon": skillIn.icon, "effects": []};
    if (skillIn.requirements && skillIn.requirements[0] == "EQUIP") {
        baseEffects = {"equipedConditions":[skillIn.requirements[1].toString()]}
        skillsOut.push(baseEffects);
    }
    for (var rawEffectIndex in skillIn["effects_raw"]) {
        var rawEffect = skillIn["effects_raw"][rawEffectIndex];

        var effect = parsePassiveRawEffet(rawEffect, baseEffects, skillsOut);
        skill.effects.push({"effect":effect, "desc": skillIn.effects[rawEffectIndex]});
    }
    if (skillIn.requirements && skillIn.requirements[0] == "EQUIP") {
        skill.equipedConditions = [skillIn.requirements[1].toString()];
    }
    return skill;
}

function parsePassiveRawEffet(rawEffect, baseEffects, skillsOut) {
    var result = {};
    // stat bonus
    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {               
        var effectData = rawEffect[3];
        addToStat(baseEffects, "hp%", effectData[4]);
        addToStat(baseEffects, "mp%", effectData[5]);
        addToStat(baseEffects, "atk%", effectData[0]);
        addToStat(baseEffects, "def%", effectData[1]);
        addToStat(baseEffects, "mag%", effectData[2]);
        addToStat(baseEffects, "spr%", effectData[3]);
        addToStat(result, "hp%", effectData[4]);
        addToStat(result, "mp%", effectData[5]);
        addToStat(result, "atk%", effectData[0]);
        addToStat(result, "def%", effectData[1]);
        addToStat(result, "mag%", effectData[2]);
        addToStat(result, "spr%", effectData[3]);
        return result;

    // DW
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 14) {               
        var types = rawEffect[3]
        if (types.length == 1 && types[0] == "none") {
            addToList(baseEffects,"special","dualWield");
            addToList(result,"special","dualWield");
        } else {
            for(var partialDualWieldIndex in types) {
                addToList(baseEffects,"partialDualWield",typeMap[types[partialDualWieldIndex]]);
                addToList(result,"partialDualWield",typeMap[types[partialDualWieldIndex]]);
            }                    
        }
        return result;
    }

    // Killers
    else if (((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) ||
        (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 11)) {
        var killerData = rawEffect[3];

        var killerRace = raceMap[killerData[0]];
        var physicalPercent = killerData[1];
        var magicalPercent = killerData[2];
        addKiller(baseEffects, killerRace, physicalPercent, magicalPercent);
        addKiller(result, killerRace, physicalPercent, magicalPercent);
        return result;
    }

    // physical evade
    else if (rawEffect[1] == 3 && rawEffect[2] == 22) {
        if (!baseEffects.evade) {
            baseEffects.evade = {"physical":rawEffect[3][0]}
        } else if (baseEffects.evade.physical) {
            baseEffects.evade.physical += rawEffect[3][0];
        } else {
            baseEffects.evade.physical = rawEffect[3][0];
        }
        result.evade = {"physical":rawEffect[3][0]}
        return result;
    }

    // magical evade
    else if (rawEffect[1] == 3 && rawEffect[2] == 54 && rawEffect[3][0] == -1) {
        if (!baseEffects.evade) {
            baseEffects.evade = {"magical":rawEffect[3][1]}
        } else if (baseEffects.evade.magical) {
            baseEffects.evade.magical += rawEffect[3][1];
        } else {
            baseEffects.evade.magical = rawEffect[3][1];
        }
        result.evade = {"magical":rawEffect[3][1]}
        return result;
    }

    // Mastery
    else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
        var masteryEffect = rawEffect[3];
        var masteryType = typeMap[masteryEffect[0]];
        var masterySkill = {"equipedConditions":[masteryType]};

        if (masteryEffect.length > 5) {
            if (masteryEffect[5]) {
                masterySkill["hp%"] = masteryEffect[5]
            }
            if (masteryEffect[6]) {
                masterySkill["mp%"] = masteryEffect[6]
            }
        }
        if (masteryEffect[1]) {
            masterySkill["atk%"] = masteryEffect[1]
        }
        if (masteryEffect[2]) {
            masterySkill["def%"] = masteryEffect[2]
        }
        if (masteryEffect[3]) {
            masterySkill["mag%"] = masteryEffect[3]
        }
        if (masteryEffect[4]) {
            masterySkill["spr%"] = masteryEffect[4]
        }
        skillsOut.push(masterySkill);
        return masterySkill;
    }

    // unarmed
    else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 19) {
        var masteryEffect = rawEffect[3];    
        var masterySkill = {"equipedConditions":["unarmed"]};

        if (masteryEffect[0]) {
            masterySkill["atk%"] = masteryEffect[0]
        }
        if (masteryEffect[1]) {
            masterySkill["def%"] = masteryEffect[1]
        }
        if (masteryEffect[2]) {
            masterySkill["mag%"] = masteryEffect[2]
        }
        if (masteryEffect[3]) {
            masterySkill["spr%"] = masteryEffect[3]
        }
        skillsOut.push(masterySkill);
        return masterySkill;
    }

    // element based mastery
    else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10004) {
        var masteryEffect = rawEffect[3];
        var masteryType = elementsMap[masteryEffect[0]];
        var masterySkill = {"equipedConditions":[masteryType]};
        if (masteryEffect[3]) {
            masterySkill["atk%"] = masteryEffect[3];
        }
        if (masteryEffect[5]) {
            masterySkill["def%"] = masteryEffect[5];
        }
        if (masteryEffect[4]) {
            masterySkill["mag%"] = masteryEffect[4];
        }
        if (masteryEffect[6]) {
            masterySkill["spr%"] = masteryEffect[6];
        }
        if (masteryEffect[1]) {
            masterySkill["hp%"] = masteryEffect[1];
        }
        if (masteryEffect[2]) {
            masterySkill["mp%"] = masteryEffect[2];
        }
        skillsOut.push(masterySkill);
        return masterySkill;
    }

    //doublehand
    else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
        if (rawEffect[3].length == 3 && rawEffect[3][2] == 2) {
            if (!baseEffects.singleWielding) {baseEffects.singleWielding = {}};
            addToStat(baseEffects.singleWielding, "atk", rawEffect[3][0]);
            result.singleWielding = {};
            addToStat(result.singleWielding, "atk", rawEffect[3][0]);
        } else {
            if (!baseEffects.singleWieldingOneHanded) {baseEffects.singleWieldingOneHanded = {}};
            addToStat(baseEffects.singleWieldingOneHanded, "atk", rawEffect[3][0]);
            result.singleWieldingOneHanded = {};
            addToStat(result.singleWieldingOneHanded, "atk", rawEffect[3][0]);
        }
        return result;
    }
    else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10003) {
        var doublehandSkill = {};
        var doublehandResult = {};
        var doublehandEffect = rawEffect[3];
        if (doublehandEffect.length == 7 && doublehandEffect[6] == 1) {
            if (!baseEffects.singleWielding) {baseEffects.singleWielding = {}};
            doublehandSkill = baseEffects.singleWielding;
            result.singleWielding = {};
            doublehandResult = result.singleWielding;
        } else {
            if (!baseEffects.singleWieldingOneHanded) {baseEffects.singleWieldingOneHanded = {}};
            doublehandSkill = baseEffects.singleWieldingOneHanded;
            result.singleWieldingOneHanded = {};
            doublehandResult = result.singleWieldingOneHanded;
        }
        if (doublehandEffect[2]) {
            addToStat(doublehandSkill, "atk", doublehandEffect[2]);
            addToStat(doublehandResult, "atk", doublehandEffect[2]);
        }
        if (doublehandEffect[4]) {
            addToStat(doublehandSkill, "def", doublehandEffect[4]);
            addToStat(doublehandResult, "def", doublehandEffect[4]);
        }
        if (doublehandEffect[3]) {
            addToStat(doublehandSkill, "mag", doublehandEffect[3]);
            addToStat(doublehandResult, "mag", doublehandEffect[3]);
        }
        if (doublehandEffect[5]) {
            addToStat(doublehandSkill, "spr", doublehandEffect[5]);
            addToStat(doublehandResult, "spr", doublehandEffect[5]);
        }
        if (doublehandEffect[0]) {
            addToStat(doublehandSkill, "hp", doublehandEffect[0]);
            addToStat(doublehandResult, "hp", doublehandEffect[0]);
        }
        if (doublehandEffect[1]) {
            addToStat(doublehandSkill, "mp", doublehandEffect[1]);
            addToStat(doublehandResult, "mp", doublehandEffect[1]);
        }
        return result;

    // MAG DH
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 70) {
        if (rawEffect[3][2] == 0) {
            if (!baseEffects.singleWieldingOneHanded) {baseEffects.singleWieldingOneHanded = {}};
            addToStat(baseEffects.singleWieldingOneHanded,"mag",rawEffect[3][0]);    
        } else if (rawEffect[3][2] == 2) {
            if (!baseEffects.singleWielding) {baseEffects.singleWielding = {}};
            addToStat(baseEffects.singleWielding,"mag",rawEffect[3][0]);    
        }
        
    // +EQ stat when dual wielding
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 69) {
        if (!baseEffects.dualWielding) {baseEffects.dualWielding = {}};
        var stat;
        if (rawEffect[3][0] == 1) {
            stat = "atk";
        } else if (rawEffect[3][0] == 2) {
            stat = "def";
        } else if (rawEffect[3][0] == 3) {
            stat = "mag";
        } else if (rawEffect[3][0] == 4) {
            stat = "spr";
        }
        addToStat(baseEffects.dualWielding, stat, rawEffect[3][1]);
        return baseEffects;

    // Element Resist
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
        addElementalResist(baseEffects, rawEffect[3]);
        addElementalResist(result, rawEffect[3]);
        return result;

    // Ailments Resist
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
        addAilmentResist(baseEffects, rawEffect[3]);
        addAilmentResist(result, rawEffect[3]);
        return result;

    // MP refresh
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
        var mpRefresh = rawEffect[3][0];
        addToStat(baseEffects, "mpRefresh", mpRefresh);
        addToStat(result, "mpRefresh", mpRefresh);
        return result;

    // LB/turn
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 33) {
        var lbPerTurn = rawEffect[3][0]/100;
        addLbPerTurn(baseEffects, lbPerTurn, lbPerTurn);
        addLbPerTurn(result, lbPerTurn, lbPerTurn);
        return result;

    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 125) {
        var lbPerTurnMin = rawEffect[3][0]/100;
        var lbPerTurnMax = rawEffect[3][1]/100;
        addLbPerTurn(baseEffects, lbPerTurnMin, lbPerTurnMax);
        addLbPerTurn(result, lbPerTurnMin, lbPerTurnMax);
        return result;

    // LB fill rate
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 31) {
        var lbFillRate = rawEffect[3][0];
        addToStat(baseEffects, "lbFillRate", lbFillRate);
        addToStat(result, "lbFillRate", lbFillRate);
        return result;

    // +Jump damage
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 17) {
        var jumpDamage = rawEffect[3][0];
        addToStat(baseEffects, "jumpDamage", jumpDamage);
        addToStat(result, "jumpDamage", jumpDamage);
        return result;

    // +EVO Mag
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 21) {
        var evoMag = rawEffect[3][0];
        addToStat(baseEffects, "evoMag", evoMag);
        addToStat(result, "evoMag", evoMag);
        return result;

    // +Stats from espers boost
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 63) {
        var esperStatsBonus = rawEffect[3];
        if (!baseEffects.esperStatsBonus) {
            baseEffects.esperStatsBonus = {};
        }
        result.esperStatsBonus = {};
        addToStat(baseEffects.esperStatsBonus, "hp", esperStatsBonus[0]);
        addToStat(baseEffects.esperStatsBonus, "mp", esperStatsBonus[1]);
        addToStat(baseEffects.esperStatsBonus, "atk", esperStatsBonus[2]);
        addToStat(baseEffects.esperStatsBonus, "def", esperStatsBonus[3]);
        addToStat(baseEffects.esperStatsBonus, "mag", esperStatsBonus[4]);
        addToStat(baseEffects.esperStatsBonus, "spr", esperStatsBonus[5]);
        addToStat(result.esperStatsBonus, "hp", esperStatsBonus[0]);
        addToStat(result.esperStatsBonus, "mp", esperStatsBonus[1]);
        addToStat(result.esperStatsBonus, "atk", esperStatsBonus[2]);
        addToStat(result.esperStatsBonus, "def", esperStatsBonus[3]);
        addToStat(result.esperStatsBonus, "mag", esperStatsBonus[4]);
        addToStat(result.esperStatsBonus, "spr", esperStatsBonus[5]);
        return result;

    // Gilgamesh multi equip skill
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 74) {
        for (var i = rawEffect[3][0].length; i--;) {
            var gilgameshSkill = {"equipedConditions":[rawEffect[3][0][i].toString()]};
            gilgameshSkill["hp%"] = rawEffect[3][1];
            gilgameshSkill["mp%"] = rawEffect[3][2];
            gilgameshSkill["atk%"] = rawEffect[3][3];
            gilgameshSkill["def%"] = rawEffect[3][4];
            gilgameshSkill["mag%"] = rawEffect[3][5];
            gilgameshSkill["spr%"] = rawEffect[3][6];
            skillsOut.push(gilgameshSkill);
        }
        var result = {"equipedConditions":rawEffect[3][0]};
        result["hp%"] = rawEffect[3][1];
        result["mp%"] = rawEffect[3][2];
        result["atk%"] = rawEffect[3][3];
        result["def%"] = rawEffect[3][4];
        result["mag%"] = rawEffect[3][5];
        result["spr%"] = rawEffect[3][6];
        return result;

    // equipment type conditionned killers
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 75) {
        var typeArray;
        if (Array.isArray(rawEffect[3][0])) {
            typeArray = rawEffect[3][0];
        } else {
            typeArray = [rawEffect[3][0]];
        }
        for (var i = typeArray.length; i--;) {
            var conditionnedKillerSKill = {"equipedConditions":[typeMap[typeArray[i]]]};
            var killerData = rawEffect[3];

            var killerRace = raceMap[killerData[1]];
            var physicalPercent = killerData[2];
            var magicalPercent = killerData[3];
            addKiller(conditionnedKillerSKill, killerRace, physicalPercent, magicalPercent);

            skillsOut.push(conditionnedKillerSKill);
        }
        var result = {equipedConditions:[]};
        for (var i = 0, len = typeArray.length; i < len; i++) {
            result.equipedConditions.push(typeMap[typeArray[i]]);
        }
        result.killers = conditionnedKillerSKill.killers;
        return result;

    // equipment type conditionned element resistance
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 76) {
        var typeArray;
        if (Array.isArray(rawEffect[3][0])) {
            typeArray = rawEffect[3][0];
        } else {
            typeArray = [rawEffect[3][0]];
        }
        for (var i = typeArray.length; i--;) {
            var conditionnedElementalResistSKill = {"equipedConditions":[typeMap[typeArray[i]]]};

            var elementalResist = rawEffect[3].slice();
            elementalResist.splice(0,1);
            addElementalResist(conditionnedElementalResistSKill, elementalResist);

            skillsOut.push(conditionnedElementalResistSKill);
        }
        var result = {equipedConditions:[]};
        for (var i = 0, len = typeArray.length; i < len; i++) {
            result.equipedConditions.push(typeMap[typeArray[i]]);
        }
        result.resists = conditionnedElementalResistSKill.resists;
        return result;
    }
    return null;
}

function parseActiveSkill(skillIn, skills) {
    var skill = {"name" : skillIn.name, "icon": skillIn.icon, "effects": []};
    
    for (var rawEffectIndex in skillIn["effects_raw"]) {
        var rawEffect = skillIn["effects_raw"][rawEffectIndex];

        var effect = parseActiveRawEffect(rawEffect, skills);
        skill.effects.push({"effect":effect, "desc": skillIn.effects[rawEffectIndex]});
    }
    return skill;
}

function parseActiveRawEffect(rawEffect, skills) {
    var result = null;
    
    // Imperil
    if ((rawEffect[0] == 1 || rawEffect[0] == 2)  && rawEffect[1] == 1 && rawEffect[2] == 33) { 
        result = {};
        var imperilData = rawEffect[3];
        addImperil(result, imperilData);
    
    // break
    } else if (rawEffect[2] == 24) { 
        result = {};
        addBreak(result, rawEffect[3]);
    
    // Randomly use skills
    } else if (rawEffect[2] == 29) { 
        result = {"randomlyUse": []};
        for (var i = 0, len = rawEffect[3].length; i < len; i++) {
            var data = rawEffect[3][i];
            if (data && data[0] && skills[data[0]]) {
                var skillIn = skills[data[0]];
                var skill = parseActiveSkill(skillIn, skills);
                result.randomlyUse.push({"skill":skill, "percent":data[1]});
            }
        }
    }
    if (result) {
        if (rawEffect[0] == 1) {
            result.area = "ST";
        } else if (rawEffect[0] == 2) {
            result.area = "AOE";
        } else {
            console.log("unknown area : " + JSON.stringify(rawEffect));
        }
        
        if (rawEffect[1] == 1) {
            result.target = "ENEMY";
        } else if (rawEffect[1] == 2) {
            result.target = "ALLY";
        } else {
            console.log("unknown target : " + JSON.stringify(rawEffect));
        }
    }
    return result;
}

function addToStat(skill, stat, value) {
    if (!skill[stat]) {
        skill[stat] = value;
    } else {
        skill[stat] += value;
    }
}
    
function addToList(skill, listName, value) {
    if (!skill[listName]) {
        skill[listName] = [value];
    } else {
        if (!skill[listName].includes(value)) {
            skill[listName].push(value);
        }
    }
}

function addKiller(skill, race, physicalPercent, magicalPercent) {
    if (!skill.killers) {
        skill.killers = [];
    }
    var killerData;
    for (var index in skill.killers) {
        if (skill.killers[index].name == race) {
            killerData = skill.killers[index];
            break;
        }
    }
    
    if (!killerData) {
        killerData = {"name":race};
        skill.killers.push(killerData);
    }
    if (physicalPercent != 0) {
        if (killerData.physical) {
            killerData.physical += physicalPercent;
        } else {
            killerData.physical = physicalPercent;
        }
    }
    if (magicalPercent != 0) {
        if (killerData.magical) {
            killerData.magical += magicalPercent;
        } else {
            killerData.magical = magicalPercent;
        }
    }
}

function addElementalResist(item, values) {
    for (var index in elements) {
        if (values[index]) {
            if (!item.resist) {
                item.resist = [];
            }
            item.resist.push({"name":elements[index],"percent":values[index]})
        }
    }
}

function addAilmentResist(item, values) {
    for (var index in ailments) {
        if (values[index]) {
            if (!item.resist) {
                item.resist = [];
            }
            item.resist.push({"name":ailments[index],"percent":values[index]})
        }
    }
}

function addImperil(item, values) {
    if (!item.imperil) {
        item.imperil = {"elements":[]};
    }
    for (var index in elements) {
        if (values[index]) {
            if (!item.imperil) {
                item.imperil = {"elements":[]};
            }
            item.imperil.elements.push({"name":elements[index],"percent":-values[index]})
        }
    }
    item.imperil.turns = values[9];
}

function addBreak(item, values) {
    if (!item.break) {
        item.break = {};
    }
    if (values[0]) {
        item.break.atk = -values[0];
    }
    if (values[1]) {
        item.break.def = -values[1];
    }
    if (values[2]) {
        item.break.mag = -values[2];
    }
    if (values[3]) {
        item.break.spr = -values[3];
    }
    item.break.turns = values[4];
}

function addLbPerTurn(item, min, max) {
    if (!item.lbPerTurn) {
        item.lbPerTurn = {"min":0, "max":0};
    }
    item.lbPerTurn.min += min;
    item.lbPerTurn.max += max;
}

function getEquip(equipIn) {
    var equip = [];
    for(var equipIndex in equipIn) {
        if (equipIn[equipIndex] != 60) {
            equip.push(typeMap[equipIn[equipIndex]]);
        }
    }
    return equip;
}

var properties = ["id","name","jpname","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","evade","singleWielding","singleWieldingOneHanded","dualWielding","accuracy","damageVariance","jumpDamage","lbFillRate", "lbPerTurn","element","partialDualWield","resist","ailments","killers","mpRefresh","esperStatsBonus","special","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","icon"];

function formatOutput(units) {
    var result = "{\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t\"" + unitId + "\": {";
        result += formatUnit(unit);
        
        result += "\n\t}";
    }
    result += "\n}";
    return result;
}

function formatUnit(unit, prefix = "", sixStarForm = false) {
    result = getUnitBasicInfo(unit,prefix, sixStarForm) + ",";
    if (unit.enhancements && unit.enhancements.length > 0) {
        result += "\n\t\t\"enhancements\": [";
        for (var i = 0, len = unit.enhancements.length; i < len; i++) {
            result += "\n\t\t\t" + JSON.stringify(unit.enhancements[i]);
            if (i < unit.enhancements.length - 1) {
                result += ",";
            }
        }
        result += "\n\t\t],";
    }
    result += "\n" + prefix + "\t\t\"skills\": [";
    var firstSkill = true;
    for (var skillIndex in unit.skills) {
        var skill = unit.skills[skillIndex];
        if (firstSkill) {
            firstSkill = false;
        } else {
            result+= ",";
        }
        result+= "\n" + formatSkill(skill, prefix + "\t\t\t");
    }
    result += "\n" + prefix + "\t\t]";
    if (unit["6_form"]) {
        result += ",\n\t\t\"6_form\": {" + formatUnit(unit["6_form"], "\t", true) + "\n\t\t}";
    }
    return result;
}

function formatSkill(skill, prefix) {
    var result = prefix + "{"
    var firstProperty = true;
    for (var propertyIndex in properties) {
        var property = properties[propertyIndex];
        if (skill[property]) {
            if (firstProperty) {
                firstProperty = false;
            } else {
                result += ", ";
            }
            result+= "\"" + property + "\":" + JSON.stringify(skill[property]);
        }
    }
    result+= "}";
    return result;
}

function formatSimpleOutput(units) {
    var result = "{\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t\"" + unitId + "\": {";
        result += getUnitBasicInfo(unit);
        if (unit["6_form"]) {
            result += ",\n\t\t\"6_form\": {" + getUnitBasicInfo(unit["6_form"], "\t", true) + "\n\t\t}";
        }
        result += "\n\t}";
    }
    result += "\n}";
    return result;
}

function getUnitBasicInfo(unit, prefix = "", sixStarForm = false) {
    var result = "\n" + prefix + "\t\t\"name\":\"" + unit.name + "\",";
    if (unit.jpname) {
        result += "\n" + prefix + "\t\t\"jpname\":\"" + unit.jpname + "\",";
    }
    if (unit.wikiEntry) {
        result += "\n" + prefix + "\t\t\"wikiEntry\":\"" + unit.wikiEntry + "\",";
    }
    result += "\n" + prefix + "\t\t\"id\":\"" + unit.id + "\",";
    if (sixStarForm) {
        result += "\n" + prefix + "\t\t\"sixStarForm\":true,";
    }
    result += "\n" + prefix + "\t\t\"max_rarity\":\"" + unit.max_rarity + "\",";
    result += "\n" + prefix + "\t\t\"min_rarity\":\"" + unit.min_rarity + "\",";
    result += "\n" + prefix + "\t\t\"sex\":\"" + unit.sex + "\",";
    if (unit.materiaSlots || unit.materiaSlots == 0) {
        result += "\n" + prefix + "\t\t\"materiaSlots\":" + unit.materiaSlots + ","
    }
    if (unit.mitigation) {
        result += "\n\t\t\"mitigation\":" + JSON.stringify(unit.mitigation) + ","
    }
    result += "\n" + prefix + "\t\t\"stats\": {";
    result += "\n" + prefix + "\t\t\t\"maxStats\":" + JSON.stringify(unit.stats.maxStats) + ",";
    result += "\n" + prefix + "\t\t\t\"pots\":" + JSON.stringify(unit.stats.pots);
    result += "\n" + prefix + "\t\t},";
    result += "\n" + prefix + "\t\t\"equip\":" + JSON.stringify(unit.equip);
    if (unit.enhancementSkills.length > 0) {
        result += ",\n" + prefix + "\t\t\"enhancementSkills\":" + JSON.stringify(unit.enhancementSkills);
    }
    
    return result;
}

function formatForSearch(units) {
    var result = "[\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId];
        if (unit.id) {
            var skills = unit.skills.slice();
            if (unit.tmrSkill) {
                skills.push(unit.tmrSkill);
            }
            if (unit.enhancements) {
                for (var i = unit.enhancements.length; i--;) {
                    var enhancement = unit.enhancements[i];
                    for (var j = enhancement.levels[enhancement.levels.length - 1].length; j--;) {
                        skills.push(enhancement.levels[enhancement.levels.length - 1][j]);
                    }
                }
            }
            var unitOut = {};
            for (var i = skills.length; i--;) {
                var skill = skills[i];
                if (skill.resist) {
                    for (var resistIndex = skill.resist.length; resistIndex--;) {
                        var resist = skill.resist[resistIndex];
                        if (elements.includes(resist.name)) {
                            if (!unitOut.elementalResist) {
                                unitOut.elementalResist = {};
                            }
                            addToStat(unitOut.elementalResist, resist.name, resist.percent);
                        } else {
                            if (!unitOut.ailmentResist) {
                                unitOut.ailmentResist = {};
                            }
                            addToStat(unitOut.ailmentResist, resist.name, resist.percent);
                        }
                    }
                }
                if (skill.killers) {
                    for (var killerIndex = skill.killers.length; killerIndex--;) {
                        var killer = skill.killers[killerIndex];
                        if (killer.physical) {
                            if (!unitOut.physicalKillers) {
                                unitOut.physicalKillers = {};
                            }
                            addToStat(unitOut.physicalKillers, killer.name, killer.physical);
                        }
                        if (killer.magical) {
                            if (!unitOut.magicalKillers) {
                                unitOut.magicalKillers = {};
                            }
                            addToStat(unitOut.magicalKillers, killer.name, killer.magical);
                        }
                    }
                }
            }
            var activeAndMagic = unit.actives.concat(unit.magics);
            for (var i = activeAndMagic.length; i--;) {
                var skill = activeAndMagic[i];
                addSkillEffectToSearch(skill, unitOut);
            }
            unitOut.equip = unit.equip;
            unitOut.id = unit.id;
            if (first) {
                first = false;
            } else {
                result += ",\n";
            }
            result += "\t" + JSON.stringify(unitOut);
        }
    }
    result += "\n]";
    return result;
}

function addSkillEffectToSearch(skill, unitOut) {
    for (var i = skill.effects.length; i--;) {
        var effect = skill.effects[i];
        if (effect.effect) {
            if (effect.effect.imperil) {
                if (!unitOut.imperil) {
                    unitOut.imperil = {};
                }
                for (var j = effect.effect.imperil.elements.length; j--;) {
                    if (!unitOut.imperil[effect.effect.imperil.elements[j].name] || unitOut.imperil[effect.effect.imperil.elements[j].name] > effect.effect.imperil.elements[j].percent) {
                        unitOut.imperil[effect.effect.imperil.elements[j].name] = effect.effect.imperil.elements[j].percent;
                    }
                }
            } else if (effect.effect.randomlyUse) {
                for (var j = 0, len = effect.effect.randomlyUse.length; j < len; j++) {
                    addSkillEffectToSearch(effect.effect.randomlyUse[j].skill, unitOut);
                }
            } else if (effect.effect.break && effect.effect.target == "ENEMY") {
                if (!unitOut.break) {
                    unitOut.break = {};
                }
                if (!unitOut.break.atk || unitOut.break.atk < effect.effect.break.atk) {
                    unitOut.break.atk = effect.effect.break.atk;
                }
                if (!unitOut.break.def || unitOut.break.def < effect.effect.break.def) {
                    unitOut.break.def = effect.effect.break.def;
                }
                if (!unitOut.break.mag || unitOut.break.atk < effect.effect.break.mag) {
                    unitOut.break.mag = effect.effect.break.mag;
                }
                if (!unitOut.break.spr || unitOut.break.spr < effect.effect.break.spr) {
                    unitOut.break.spr = effect.effect.break.spr;
                }
            }
        }
    }
}

function formatForSkills(units) {
    var result = "{\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t\"" + unitId + "\": {";
        result += getUnitBasicInfo(unit) + ",";
        result += "\n" + "\t\t\"passives\": [";
        var firstPassive = true;
        for (var skillIndex in unit.passives) {
            var passive = unit.passives[skillIndex];
            if (firstPassive) {
                firstPassive = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t" + JSON.stringify(passive);
        }
        result += "\n" + "\t\t]";
        
        result += ",\n" + "\t\t\"actives\": [";
        var firstActive = true;
        for (var skillIndex in unit.actives) {
            var active = unit.actives[skillIndex];
            if (firstActive) {
                firstActive = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t" + JSON.stringify(active);
        }
        result += "\n" + "\t\t]";
        
        result += ",\n" + "\t\t\"magics\": [";
        var firstMagic = true;
        for (var skillIndex in unit.magics) {
            var magic = unit.magics[skillIndex];
            if (firstMagic) {
                firstMagic = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t" + JSON.stringify(magic);
        }
        result += "\n" + "\t\t]";
        
        result += "\n\t}";
    }
    result += "\n}";
    return result;
    
}


module.exports = {
    getPassives: getPassives,
    addElementalResist: addElementalResist,
    addAilmentResist: addAilmentResist,
    getEquip: getEquip,
    formatSimpleOutput: formatSimpleOutput,
    formatOutput: formatOutput,
    formatForSearch:formatForSearch,
    formatForSkills:formatForSkills,
    stats: stats,
    elements: elements,
    ailments: ailments
}