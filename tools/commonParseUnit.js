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

function getPassives(unitId, skillsIn, skills, enhancements, maxRarity, unitData, unitOut) {
    var baseEffects = {};
    var skillsOut = [baseEffects];
    var tmrSkill = null;
    
    
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
        if (skillIn.active || skillIn.type == "MAGIC") {
            continue; // don't consider active skills or magic
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
            getPassive(skillIn, enhancementBaseEffects, enhancementSkillsOut);
            if (Object.keys(enhancementBaseEffects).length === 0) {
                enhancementSkillsOut.splice(0,1);
            }
            enhancementData.levels.push(enhancementSkillsOut);
            while(enhancements[skillId]) {
                skillId = enhancements[skillId];
                skillIn = skills[skillId];
                var enhancementBaseEffects = {};
                var enhancementSkillsOut = [enhancementBaseEffects];
                getPassive(skills[skillId], enhancementBaseEffects, enhancementSkillsOut);
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
        
        var effect;
        if (skillIn.requirements && skillIn.requirements[0] == "EQUIP") {
            tmrSkill = {}
            effect = tmrSkill;
        } else {
            effect = baseEffects;
        }
        getPassive(skillIn, effect, skillsOut);
    }
    addElementalResist(baseEffects, unitData.element_resist);
    addAilmentResist(baseEffects, unitData.status_resist);
    
    if (Object.keys(baseEffects).length === 0) {
        skillsOut.splice(0,1);
    }
    
    if (tmrSkill) {
        unitOut.tmrSkill = tmrSkill;
    }
    
    return skillsOut;
}

function getPassive(skillIn, baseEffects, skillsOut) {
    for (var rawEffectIndex in skillIn["effects_raw"]) {
        var rawEffect = skillIn["effects_raw"][rawEffectIndex];

        // stat bonus
        if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {               
            var effectData = rawEffect[3];
            if (baseEffects == null) {baseEffects = {}};
            addToStat(baseEffects, "hp%", effectData[4]);
            addToStat(baseEffects, "mp%", effectData[5]);
            addToStat(baseEffects, "atk%", effectData[0]);
            addToStat(baseEffects, "def%", effectData[1]);
            addToStat(baseEffects, "mag%", effectData[2]);
            addToStat(baseEffects, "spr%", effectData[3]);

        // DW
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 14) {               
            var types = rawEffect[3]
            if (baseEffects == null) {baseEffects = {}};
            if (types.length == 1 && types[0] == "none") {
                addToList(baseEffects,"special","dualWield");
            } else {
                for(var partialDualWieldIndex in types) {
                    addToList(baseEffects,"partialDualWield",typeMap[types[partialDualWieldIndex]]);
                }                    
            }
        }

        // Killers
        else if (((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) ||
            (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 11)) {
            var killerData = rawEffect[3];

            var killerRace = raceMap[killerData[0]];
            var physicalPercent = killerData[1];
            var magicalPercent = killerData[2];
            addKiller(baseEffects, killerRace, physicalPercent, magicalPercent);
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
        }

        //doublehand
        else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
            if (rawEffect[3].length == 3 && rawEffect[3][2] == 2) {
                if (!baseEffects.singleWielding) {baseEffects.singleWielding = {}};
                addToStat(baseEffects.singleWielding, "atk", rawEffect[3][0]);
            } else {
                if (!baseEffects.singleWieldingOneHanded) {baseEffects.singleWieldingOneHanded = {}};
                addToStat(baseEffects.singleWieldingOneHanded, "atk", rawEffect[3][0]);
            }
        }
        else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10003) {
            var doublehandSkill = {};
            var doublehandEffect = rawEffect[3];
            if (doublehandEffect.length == 7 && doublehandEffect[6] == 1) {
                if (!baseEffects.singleWielding) {baseEffects.singleWielding = {}};
                doublehandSkill = baseEffects.singleWielding;
            } else {
                if (!baseEffects.singleWieldingOneHanded) {baseEffects.singleWieldingOneHanded = {}};
                doublehandSkill = baseEffects.singleWieldingOneHanded;
            }
            if (doublehandEffect[2]) {
                addToStat(doublehandSkill, "atk", doublehandEffect[2]);
            }
            if (doublehandEffect[4]) {
                addToStat(doublehandSkill, "def", doublehandEffect[4]);
            }
            if (doublehandEffect[3]) {
                addToStat(doublehandSkill, "mag", doublehandEffect[3]);
            }
            if (doublehandEffect[5]) {
                addToStat(doublehandSkill, "spr", doublehandEffect[5]);
            }
            if (doublehandEffect[0]) {
                addToStat(doublehandSkill, "hp", doublehandEffect[0]);
            }
            if (doublehandEffect[1]) {
                addToStat(doublehandSkill, "mp", doublehandEffect[1]);
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

        // Element Resist
        } else if (!skillIn.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
            addElementalResist(baseEffects, rawEffect[3]);

        // Ailments Resist
        } else if (!skillIn.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
            addAilmentResist(baseEffects, rawEffect[3]);

        // MP refresh
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
            var mpRefresh = rawEffect[3][0];
            addToStat(baseEffects, "mpRefresh", mpRefresh);

        // LB/turn
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 33) {
            var lbPerTurn = rawEffect[3][0]/100;
            addLbPerTurn(baseEffects, lbPerTurn, lbPerTurn);
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 125) {
            var lbPerTurnMin = rawEffect[3][0]/100;
            var lbPerTurnMax = rawEffect[3][1]/100;
            addLbPerTurn(baseEffects, lbPerTurnMin, lbPerTurnMax);

        // LB fill rate
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 31) {
            var lbFillRate = rawEffect[3][0];
            addToStat(baseEffects, "lbFillRate", lbFillRate);

        // +Jump damage
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 17) {
            var jumpDamage = rawEffect[3][0];
            addToStat(baseEffects, "jumpDamage", jumpDamage);

        // +EVO Mag
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 21) {
            var evoMag = rawEffect[3][0];
            addToStat(baseEffects, "evoMag", evoMag);

        // +Stats from espers boost
        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 63) {
            var esperStatsBonus = rawEffect[3];
            if (!baseEffects.esperStatsBonus) {
                baseEffects.esperStatsBonus = {};
            }
            addToStat(baseEffects.esperStatsBonus, "hp", esperStatsBonus[0]);
            addToStat(baseEffects.esperStatsBonus, "mp", esperStatsBonus[1]);
            addToStat(baseEffects.esperStatsBonus, "atk", esperStatsBonus[2]);
            addToStat(baseEffects.esperStatsBonus, "def", esperStatsBonus[3]);
            addToStat(baseEffects.esperStatsBonus, "mag", esperStatsBonus[4]);
            addToStat(baseEffects.esperStatsBonus, "spr", esperStatsBonus[5]);
        }
    }
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

function formatUnit(unit, prefix = "") {
    result = getUnitBasicInfo(unit,prefix) + ",";
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
    if (unit.tmrSkill) {
        result += "\n" + prefix + "\t\t\"tmrSkill\": " + formatSkill(unit.tmrSkill, "") + ",";
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
        result += ",\n\t\t\"6_form\": {" + formatUnit(unit["6_form"], "\t") + "\n\t\t}";
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
            result += ",\n\t\t\"6_form\": {" + getUnitBasicInfo(unit["6_form"], "\t") + "\n\t\t}";
        }
        result += "\n\t}";
    }
    result += "\n}";
    return result;
}

function getUnitBasicInfo(unit, prefix = "") {
    var result = "\n" + prefix + "\t\t\"name\":\"" + unit.name + "\",";
    if (unit.jpname) {
        result += "\n" + prefix + "\t\t\"jpname\":\"" + unit.jpname + "\",";
    }
    result += "\n" + prefix + "\t\t\"id\":\"" + unit.id + "\",";
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


module.exports = {
    getPassives: getPassives,
    addElementalResist: addElementalResist,
    addAilmentResist: addAilmentResist,
    getEquip: getEquip,
    formatSimpleOutput: formatSimpleOutput,
    formatOutput: formatOutput,
    stats: stats,
    elements: elements,
    ailments: ailments
}