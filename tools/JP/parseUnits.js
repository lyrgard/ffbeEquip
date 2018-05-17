var fs = require('fs');
var request = require('request');
var PNG = require('pngjs').PNG;

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

filterGame = [];
filterUnits = []

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;
var glNameById = {};
var dev = false;

function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-jp/master/' + filename, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                callback(result);
            } else {
                console.log(error);
            }
        });
    } else {
        fs.readFile('./sources/' + filename, function (err, content) {
            var result = JSON.parse(content);
            callback(result);
        });
    }
}




console.log("Starting");
getData('units.json', function (units) {
    getData('skills.json', function (skills) {
        getData('enhancements.json', function (enhancements) {
            fs.readFile('../../static/JP/units.json', function (err, nameDatacontent) {
                var nameData = JSON.parse(nameDatacontent);
                for (var unitId in nameData) {
                    glNameById[unitId] = nameData[unitId].name;
                }
                fs.readFile('../../static/GL/units.json', function (err, nameDatacontent) {
                    var nameData = JSON.parse(nameDatacontent);
                    for (var unitId in nameData) {
                        if (nameData[unitId].name != "undefined") {
                            glNameById[unitId] = nameData[unitId].name;
                        }
                    }
                    for (var index in enhancements) {
                        var enhancement = enhancements[index];
                        for (var unitIdIndex in enhancement.units) {
                            var unitId = enhancement.units[unitIdIndex].toString();
                            if (!enhancementsByUnitId[unitId]) {
                                enhancementsByUnitId[unitId] = {};
                            }
                            enhancementsByUnitId[unitId][enhancement.skill_id_old.toString()] = enhancement.skill_id_new.toString();
                        }
                    }

                    var unitsOut = {};
                    for (var unitId in units) {
                        var unitIn = units[unitId];
                        if (!filterGame.includes(unitIn["game_id"]) && !unitId.startsWith("9") && unitIn.name &&!filterUnits.includes(unitId)) {
                            var unitOut = treatUnit(unitId, unitIn, skills, enhancementsByUnitId);
                            unitsOut[unitOut.data.id] = unitOut.data;
                        }
                    }

                    fs.writeFileSync('unitsWithSkill.json', formatOutput(unitsOut));
                    fs.writeFileSync('units.json', formatSimpleOutput(unitsOut));
                });
            });
        });
    });
});

function treatUnit(unitId, unitIn, skills, enhancementsByUnitId, maxRariry = unitIn["rarity_max"]) {
    var unit = {};
    unit.data = {};
    
    var data = unit.data;
    var unitData;
    
    var unitStats = {"maxStats":{}, "pots":{}};
    for (entryId in unitIn.entries) {
        if (unitIn.entries[entryId].rarity == maxRariry) {
            unitData = unitIn.entries[entryId];
            for (var statIndex in stats) {
                var stat = stats[statIndex];
                unitStats.maxStats[stat.toLowerCase()] = unitData["stats"][stat][1];
                unitStats.pots[stat.toLowerCase()] = unitData["stats"][stat][2];
            }
            if (unitData.ability_slots != 4) {
                data["materiaSlots"] = unitData.ability_slots;
            }
            if (unitData.physical_resist) {
                data.mitigation = {"physical":unitData.physical_resist};
            }
            if (unitData.magical_resist) {
                if (!data.mitigation) {
                    data.mitigation = {};
                }
                data.mitigation.magical = unitData.magical_resist;  
            }
            break;
        }
    }
    if (glNameById[unitId]) {
        data["name"] = glNameById[unitId];
        data["jpname"] = unitIn["name"];
    } else {
        data["name"] = unitIn["name"];    
    }
    data["max_rarity"] = maxRariry;
    data["min_rarity"] = unitIn["rarity_min"];
    data["stats"] = unitStats;
    if (!unitIn.sex) {
        console.log(unitIn);
    }
    data["sex"] = unitIn.sex.toLowerCase();
    data["equip"] = getEquip(unitIn.equip); 
    data["id"] = unitId;
    
    data["enhancementSkills"] = [];
    for (skillIndex in unitIn.skills) {
        if (unitIn.skills[skillIndex].rarity > unitIn.rarity_max) {
            continue; // don't take into account skills for a max rarity not yet released
        }
        var skillId = unitIn.skills[skillIndex].id.toString();
        if (enhancementsByUnitId[unitId] && enhancementsByUnitId[unitId][skillId]) {
            data["enhancementSkills"].push(skills[skillId].name);
        }
    }
    
    var uniSkills = getPassives(unitId, unitIn.skills, skills, enhancementsByUnitId[unitId], maxRariry, unitData);
    data.skills = uniSkills.skills;
    if (uniSkills.tmrSkill) {
        data.tmrSkill = uniSkills.tmrSkill;
    }
    verifyImage(unitId, data["min_rarity"], data["max_rarity"]);
    
    if (maxRariry == 7) {
        data["6_form"] = treatUnit(unitId, unitIn, skills, enhancementsByUnitId, 6).data;
    }
    
    return unit;
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

function getPassives(unitId, skillsIn, skills, enhancements, maxRarity, unitData) {
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
        if (enhancements) {
            while(enhancements[skillId]) {
                skillId = enhancements[skillId];
            }
        }
        var skillIn = skills[skillId];
        
        if (skillIn.active || skillIn.type == "MAGIC") {
            continue; // don't consider active skills or magic
        }
        
        var effect;
        if (skillIn.requirements && skillIn.requirements[0] == "EQUIP") {
            tmrSkill = {}
            effect = tmrSkill;
        } else {
            effect = baseEffects;
        }
        
        for (var rawEffectIndex in skillIn["effects_raw"]) {
            var rawEffect = skillIn["effects_raw"][rawEffectIndex];
            
            // stat bonus
            if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {               
                var effectData = rawEffect[3];
                addToStat(effect, "hp%", effectData[4]);
                addToStat(effect, "mp%", effectData[5]);
                addToStat(effect, "atk%", effectData[0]);
                addToStat(effect, "def%", effectData[1]);
                addToStat(effect, "mag%", effectData[2]);
                addToStat(effect, "spr%", effectData[3]);
                
            // DW
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 14) {               
                var types = rawEffect[3]
                if (types.length == 1 && types[0] == "none") {
                    addToList(effect,"special","dualWield");
                } else {
                    for(var partialDualWieldIndex in types) {
                        addToList(effect,"partialDualWield",typeMap[types[partialDualWieldIndex]]);
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
                addKiller(effect, killerRace, physicalPercent, magicalPercent);
            }
            
            // physical evade
            else if (rawEffect[1] == 3 && rawEffect[2] == 22) {
                if (!effect.evade) {
                    effect.evade = {"physical":rawEffect[3][0]}
                } else if (effect.evade.physical) {
                    effect.evade.physical += rawEffect[3][0];
                } else {
                    effect.evade.physical = rawEffect[3][0];
                }
            }
                
            // magical evade
            else if (rawEffect[1] == 3 && rawEffect[2] == 54 && rawEffect[3][0] == -1) {
                if (!effect.evade) {
                    effect.evade = {"magical":rawEffect[3][1]}
                } else if (effect.evade.magical) {
                    effect.evade.magical += rawEffect[3][1];
                } else {
                    effect.evade.magical = rawEffect[3][1];
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
                    if (!effect.singleWielding) {effect.singleWielding = {}};
                    addToStat(effect.singleWielding, "atk", rawEffect[3][0]);
                } else {
                    if (!effect.singleWieldingOneHanded) {effect.singleWieldingOneHanded = {}};
                    addToStat(effect.singleWieldingOneHanded, "atk", rawEffect[3][0]);
                }
            }
            else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10003) {
                var doublehandSkill = {};
                var doublehandEffect = rawEffect[3];
                if (doublehandEffect.length == 7 && doublehandEffect[6] == 1) {
                    if (!effect.singleWielding) {effect.singleWielding = {}};
                    doublehandSkill = effect.singleWielding;
                } else {
                    if (!effect.singleWieldingOneHanded) {effect.singleWieldingOneHanded = {}};
                    doublehandSkill = effect.singleWieldingOneHanded;
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
                if (!effect.dualWielding) {effect.dualWielding = {}};
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
                addToStat(effect.dualWielding, stat, rawEffect[3][1]);
                
            // Element Resist
            } else if (!skillIn.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
                addElementalResist(effect, rawEffect[3]);

            // Ailments Resist
            } else if (!skillIn.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
                addAilmentResist(effect, rawEffect[3]);
                
                // MP refresh
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
                var mpRefresh = rawEffect[3][0];
                addToStat(effect, "mpRefresh", mpRefresh);

		   // LB/turn
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 33) {
                var lbPerTurn = rawEffect[3][0]/100;
                addLbPerTurn(effect, lbPerTurn, lbPerTurn);
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 125) {
                var lbPerTurnMin = rawEffect[3][0]/100;
                var lbPerTurnMax = rawEffect[3][1]/100;
                addLbPerTurn(effect, lbPerTurnMin, lbPerTurnMax);
                
            // LB fill rate
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 31) {
                var lbFillRate = rawEffect[3][0];
                addToStat(effect, "lbFillRate", lbFillRate);
                
            // +Jump damage
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 17) {
                var jumpDamage = rawEffect[3][0];
                addToStat(effect, "jumpDamage", jumpDamage);
                
            // +EVO Mag
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 21) {
                var evoMag = rawEffect[3][0];
                addToStat(effect, "evoMag", evoMag);
                
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
    addElementalResist(baseEffects, unitData.element_resist);
    addAilmentResist(baseEffects, unitData.status_resist);
    
    if (Object.keys(baseEffects).length === 0) {
        skillsOut.splice(0,1);
    }
    
    return {"skills":skillsOut, "tmrSkill":tmrSkill};
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

function verifyImage(serieId, minRarity, maxRarity) {
    for (var i = minRarity; i <= maxRarity; i++) {
        var unitId = serieId.substr(0, serieId.length - 1) + i;
        var filePath = "../../static/img/units/unit_ills_" + unitId + ".png";
        if (!fs.existsSync(filePath)) {
            download("https://exviusdb.com/static/img/assets/unit/unit_ills_" + unitId + ".png",filePath);
        }
    }
}

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        if (err || res.statusCode == 404) {
            console.log("!! unable to download image : " + uri);
        } else {
            request(uri).pipe(fs.createWriteStream(filename))
                .on('close', function() {
                    if (fs.existsSync(filename)) {
                        fs.createReadStream(filename).pipe(new PNG({
                            filterType: 4
                        }))
                        .on('error', function() {
                            fs.unlinkSync(filename);
                            console.log("!! image : " + uri + " invalid");
                        })
                        .on('parsed', function() {
                            console.log("image : " + uri + " downloaded and valid");
                        });
                    }
                })
            .on('error', function() {
                console.log("!! unable to download image : " + uri);
            });
        }
    });
};
