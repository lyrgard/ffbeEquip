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
    "Fire": "fire",
    "Ice": "ice",
    "Lightning": "lightning",
    "Water": "water",
    "Wind": "wind",
    "Earth": "earth",
    "Light": "light",
    "Dark": "dark"
}

var elementsMapNumber = {
    1: 'fire',
    2: 'ice',
    3: 'lightning',
    4: 'water',
    5: 'wind',
    6: 'earth',
    7: 'light',
    8: 'dark'
}

const languages = ["en", "zh", "ko", "fr", "de", "es"];

var unitNamesById = {};
var unitIdByTmrId = {};
var unitIdBySTmrId = {};
var oldItemsAccessById = {};
var oldItemsEventById = {};
var oldItemsMaxNumberById = {};
var oldItemsWikiEntryById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;
var dev = false;
var languageId;
let skillNameTrads;
let skillDescTrads;


function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/' + filename, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                callback(result);
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
if (!fs.existsSync('../../static/GL/data.json')) {
    console.log("old data not accessible");
    return;
}
getData('equipment.json', function (items) {
    getData('materia.json', function (materias) {
        getData('skills_ability.json', function (skills) {
            getData('skills_passive.json', function (passives) {
                getData('skills_magic.json', function (magics) {
                    Object.keys(skills).forEach(skillId => {
                        skills[skillId].active = true;
                        skills[skillId].type = "ABILITY";
                    });
                    Object.keys(passives).forEach(skillId => {
                        skills[skillId] = passives[skillId];
                        skills[skillId].active = false;
                        skills[skillId].type = "PASSIVE";
                    });
                    Object.keys(magics).forEach(skillId => {
                        skills[skillId] = magics[skillId];
                        skills[skillId].active = true;
                        skills[skillId].type = "MAGIC";
                    });
                    getData('units.json', function (units) {
                        fs.readFile('../../static/GL/data.json', function (err, content) {
                            var oldItems = JSON.parse(content);
                            fs.readFile('../../static/GL/releasedUnits.json', function (err, content) {
                                releasedUnits = JSON.parse(content);
                                request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-gl-strings/master/MST_ABILITY_NAME.json', function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        skillNameTrads = JSON.parse(body);
                                        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-gl-strings/master/MST_MAGIC_NAME.json', function (error, response, body) {
                                            if (!error && response.statusCode == 200) {
                                                let magicNameTrads = JSON.parse(body);
                                                Object.keys(magicNameTrads).forEach(skillId => {
                                                    skillNameTrads[skillId] = magicNameTrads[skillId];
                                                });
                                                request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-gl-strings/master/MST_ABILITY_SHORTDESCRIPTION.json', function (error, response, body) {
                                                    if (!error && response.statusCode == 200) {
                                                        skillDescTrads = JSON.parse(body);
                                                        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-gl-strings/master/MST_MAGIC_SHORTDESCRIPTION.json', function (error, response, body) {
                                                            if (!error && response.statusCode == 200) {
                                                                let magicDescTrads = JSON.parse(body);
                                                                Object.keys(magicDescTrads).forEach(skillId => {
                                                                    skillDescTrads[skillId] = magicDescTrads[skillId];
                                                                });

                                                                for (var index in oldItems) {
                                                                    oldItemsAccessById[oldItems[index].id] = oldItems[index].access;
                                                                    if (oldItems[index].eventName) {
                                                                        oldItemsEventById[oldItems[index].id] = oldItems[index].eventName;
                                                                    } else if (oldItems[index].eventNames) {
                                                                        oldItemsEventById[oldItems[index].id] = oldItems[index].eventNames;
                                                                    }
                                                                    if (oldItems[index].maxNumber) {
                                                                        oldItemsMaxNumberById[oldItems[index].id] = oldItems[index].maxNumber;
                                                                    }
                                                                    if (oldItems[index].wikiEntry) {
                                                                        oldItemsWikiEntryById[oldItems[index].id] = oldItems[index].wikiEntry;
                                                                    }
                                                                }

                                                                for (languageId = 0; languageId < languages.length; languageId++) {

                                                                    for (var unitIndex in units) {
                                                                        var unit = units[unitIndex];
                                                                        if (!unit.names) {
                                                                            continue;
                                                                        }
                                                                        unitNamesById[unitIndex] = {
                                                                            "name": unit.names[languageId],
                                                                            "minRarity": unit.rarity_min,
                                                                            "maxRarity": unit.rarity_max
                                                                        };

                                                                        if (unit.TMR) {
                                                                            unitIdByTmrId[unit.TMR[1]] = unitIndex;
                                                                        }
                                                                        if (unit.sTMR) {
                                                                            unitIdBySTmrId[unit.sTMR[1]] = unitIndex;
                                                                        }
                                                                    }


                                                                    var result = {"items": []};
                                                                    for (var itemId in items) {
                                                                        treatItem(items, itemId, result, skills);
                                                                    }
                                                                    for (var materiaId in materias) {
                                                                        treatItem(materias, materiaId, result, skills);
                                                                    }
                                                                    console.log(skillNotIdentifiedNumber);
                                                                    console.log(result.items.length);
                                                                    var filename = 'data.json';
                                                                    if (languageId != 0) {
                                                                        filename = 'data_' + languages[languageId] + '.json';
                                                                    }
                                                                    fs.writeFileSync(filename, formatOutput(result.items));
                                                                }
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});


function treatItem(items, itemId, result, skills) {
    var itemIn = items[itemId];
    /*if (itemIn.name.match(/[^\x00-\xFF’]/) && !itemIn.name.startsWith("Firewall: Power") && !itemIn.name.startsWith("Copper Cuirass")) {
        // exclude item whose name contain non english char
        console.log("excluded : " + itemIn.name)
        return;
    }*/
    if (itemId == "405003400" || itemId == "409013400" || itemId == "504220290" || itemId == "308003700" || itemId == "409018100" || itemId == "408003100" || itemId == "301002800") {
        // exclude 2nd occurence of Stylish Black Dress and Evening Glove, and Half-elf heart
        return;
    }
    if (!itemIn.strings || (!itemIn.strings.name && !itemIn.strings.names)) {
        
        return;
    }
    var itemOut = {};
    itemOut.id = itemId;
    if (itemIn.strings.name) {
        itemOut.name = itemIn.strings.name[languageId];    
    } else {
        itemOut.name = itemIn.strings.names[languageId];
    }
    if (!itemOut.name) {
        itemOut.name = itemIn.name;
    }
    if (itemIn.type_id) {
        itemOut.rarity = itemIn.rarity;
        itemOut.type = typeMap[itemIn.type_id];
    } else {
        itemOut.type = "materia";
    }
    readStats(itemIn, itemOut);
    if (itemIn.is_twohanded) {
        addSpecial(itemOut,"twoHanded");
    }
    if (itemIn.unique) {
        addSpecial(itemOut,"notStackable");
    }
    if (unitIdByTmrId[itemOut.id]) {
        var uitId = unitIdByTmrId[itemOut.id];
        var unit = unitNamesById[uitId];
        var access = "TMR-" + unit.minRarity + "*";
        if (uitId == "401008505") {
            console.log(JSON.stringify(releasedUnits[uitId]));
        }
        if (unit.event || (releasedUnits[uitId] && releasedUnits[uitId].type == "event")) {
            if (uitId == "401008505") {
                console.log("added event");
                console.log(unit.event);
            }
            access += "-event";
        }
        if (!releasedUnits[uitId]) {
            addAccess(itemOut,"not released yet");
        }
        addAccess(itemOut,access);

        itemOut.tmrUnit = unitIdByTmrId[itemOut.id];
    }
    if (unitIdBySTmrId[itemOut.id]) {
        var unitId = unitIdBySTmrId[itemOut.id];
        var unit = unitNamesById[unitId];
        itemOut.stmrUnit = unitIdBySTmrId[itemOut.id];
        addAccess(itemOut,"STMR");   
        if (!releasedUnits[unitId] || unit.maxRarity < 7) {
            addAccess(itemOut,"not released yet");
        }
    }
    
    if (itemIn.requirements) {
        if (itemIn.requirements[0] == "SEX") {
            if (itemIn.requirements[1] == 1) {
                itemOut.exclusiveSex = "male";
            } else if (itemIn.requirements[1] == 2) {
                itemOut.exclusiveSex = "female";
            }
        } else if (itemIn.requirements[0] == "UNIT_ID") {
            addExclusiveUnit(itemOut, itemIn.requirements[1]);
        }
    }

    if (itemIn.accuracy) {
        addStat(itemOut,"accuracy",itemIn.accuracy);
    }

    if (itemIn.dmg_variance) {
        itemOut.damageVariance = {"min":itemIn.dmg_variance[0],"max":itemIn.dmg_variance[1]};
    }

    if (itemIn.icon) {
        itemOut.icon = itemIn.icon;
        verifyImage(itemOut.icon);
    }

    if (itemIn.compendium_id) {
        itemOut.sortId = itemIn.compendium_id;
    }

    if (!itemOut.access && oldItemsAccessById[itemOut.id]) {
        for (var index in oldItemsAccessById[itemOut.id]) {
            var access = oldItemsAccessById[itemOut.id][index];
            if (access != "not released yet") {
                addAccess(itemOut, access);
            }
        }
    }
    if (!itemOut.eventNames && oldItemsEventById[itemOut.id]) {
        itemOut.eventNames = oldItemsEventById[itemOut.id];
        if (!Array.isArray(itemOut.eventNames)) {
            itemOut.eventNames = [itemOut.eventNames];
        }
        if (!itemOut.access || !itemOut.access.includes("event")) {
            addAccess(itemOut, "event");
        }
    }
    if (!itemOut.maxNumber && oldItemsMaxNumberById[itemOut.id]) {
        itemOut.maxNumber = oldItemsMaxNumberById[itemOut.id];
    }
    if (oldItemsWikiEntryById[itemOut.id]) {
        itemOut.wikiEntry = oldItemsWikiEntryById[itemOut.id];
    } else if (languageId != 0) {
        itemOut.wikiEntry = itemIn.name.replace(' ', '_');
    }
    if (!itemOut.access) {
        itemOut.access = ["not released yet"];
    }
    if (!oldItemsAccessById[itemOut.id]) {
        console.log("new item : " + itemOut.id + " - " + itemOut.name);
    }

    result.items = result.items.concat(readSkills(itemIn, itemOut,skills));
}

function readStats(itemIn, itemOut) {
    if (itemIn.stats) {
        for (var statsIndex in stats) {
            var stat = stats[statsIndex];
            if (itemIn.stats[stat] != 0) {
                itemOut[stat.toLowerCase()] = itemIn.stats[stat];
            }
        }
        if (itemIn.stats.element_inflict) {
            itemOut.element = [];
            for (var elementIndex in itemIn.stats.element_inflict) {
                itemOut.element.push(elementsMap[itemIn.stats.element_inflict[elementIndex]]);
            }
        }
        if (itemIn.stats.element_resist) {
            itemOut.resist = [];
            for (var element in itemIn.stats.element_resist) {
                itemOut.resist.push({"name":elementsMap[element],"percent":itemIn.stats.element_resist[element]})
            }
        }
        if (itemIn.stats.status_resist) {
            if (!itemOut.resist) {
                itemOut.resist = [];
            }
            for (var status in itemIn.stats.status_resist) {
                itemOut.resist.push({"name":ailmentsMap[status],"percent":itemIn.stats.status_resist[status]})
            }
        }
        if (itemIn.stats.status_inflict) {
            itemOut.ailments = [];
            for (var status in itemIn.stats.status_inflict) {
                itemOut.ailments.push({"name":ailmentsMap[status],"percent":itemIn.stats.status_inflict[status]})
            }
        }
    }
}

function readSkills(itemIn, itemOut, skills) {
    var result = [];
    if (itemIn.skills) {
        var masterySkills = [];
        var restrictedSkills = [];
        var itemSetSkills = [];
        for (var skillIndex in itemIn.skills) {
            var skillId = itemIn.skills[skillIndex];
            var skill = skills[skillId];
            skill.id = skillId;
            if (skill) {
                if (skill.unique && !skill.active) {
                    if (!itemOut.notStackableSkills) {
                        itemOut.notStackableSkills = {};
                    }
                    var notStackableSkill = {};
                    for (var rawEffectIndex in skill.effects_raw) {
                        rawEffect = skill.effects_raw[rawEffectIndex];
                        addEffectToItem(notStackableSkill, skill, rawEffectIndex, skills)
                    }
                    itemOut.notStackableSkills[skillId] = notStackableSkill;
                }
                if (skill.type == "MAGIC") {
                    addSpecial(itemOut, getSkillString(skill, skillId));
                } else if (skill.unit_restriction) {
                    restrictedSkills.push(skill);
                } else if (skill.effects_raw[0][2] == 74) {
                    // item set
                    itemSetSkills.push(skill);
                } else {
                    var effectsNotTreated = [];
                    for (var rawEffectIndex in skill.effects_raw) {
                        rawEffect = skill.effects_raw[rawEffectIndex];

                        // Mastery (+X% stat if equiped with ...)
                        if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                            masterySkills.push(rawEffect);

                            // element based mastery
                        } else if (rawEffect[1] == 3 && rawEffect[2] == 10004) {
                            masterySkills.push(rawEffect);

                        } else if (!addEffectToItem(itemOut, skill, rawEffectIndex, skills)) {
                            effectsNotTreated.push(rawEffectIndex)
                            //console.log(rawEffect + " - " + skill.effects);
                        }
                    }
                    addNotTreatedEffects(itemOut, effectsNotTreated, skill, skillId);
                }
            }
        }
        var emptyItem = isItemEmpty(itemOut);
        if ((masterySkills.length == 0 && restrictedSkills.length ==0) || !emptyItem) {
            result.push(itemOut);
        }

        if (masterySkills.length > 0) {
            addMasterySkills(itemOut, masterySkills, result);
        }
        masterySkills = [];
        for (var restrictedIndex in restrictedSkills) {
            var skill = restrictedSkills[restrictedIndex];
            var effectsNotTreated = [];
            var lenght = result.length;
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                var copy = JSON.parse(JSON.stringify(result[itemIndex]));
                var unitsFound = [];
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        unitsFound.push(skill.unit_restriction[restrictedUnitIndex].toString());
                    }
                }
                if (copy.exclusiveUnits) {
                    unitsFound = intersect(copy.exclusiveUnits, unitsFound);
                }   
                copy.exclusiveUnits = [];
                unitsFound.forEach(u => addExclusiveUnit(copy, u));
                if (copy.exclusiveUnits.length > 0) {
                    for (var rawEffectIndex in skill.effects_raw) {
                        rawEffect = skill.effects_raw[rawEffectIndex];
                        // Mastery (+X% stat if equiped with ...)
                        if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                            masterySkills.push(rawEffect);
                        } else if (!addEffectToItem(copy, skill, rawEffectIndex, skills)) {
                            effectsNotTreated.push(rawEffectIndex);
                        }
                    }
                    addNotTreatedEffects(copy, effectsNotTreated, skill, skill.id);
                    result.push(copy);
                    if (masterySkills.length > 0) {
                        addMasterySkills(copy, masterySkills, result);
                    }
                }
            }
            if (emptyItem) {
                var copy = JSON.parse(JSON.stringify(itemOut));
                var unitFoud = false;
                var unitsFound = [];
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        unitsFound.push(skill.unit_restriction[restrictedUnitIndex]);
                    }
                }
                if (copy.exclusiveUnits) {
                    unitsFound = intersect(copy.exclusiveUnits, unitsFound);
                }   
                copy.exclusiveUnits = [];
                unitsFound.forEach(u => addExclusiveUnit(copy, u));
                if (copy.exclusiveUnits.length > 0) {
                    for (var rawEffectIndex in skill.effects_raw) {
                        rawEffect = skill.effects_raw[rawEffectIndex];
                        if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                            masterySkills.push(rawEffect);
                        } else if (!addEffectToItem(copy, skill, rawEffectIndex, skills)) {
                            effectsNotTreated.push(rawEffectIndex);
                        }
                    }
                    addNotTreatedEffects(copy, effectsNotTreated, skill, skill.id);
                    result.push(copy);
                    if (masterySkills.length > 0) {
                        addMasterySkills(copy, masterySkills, result);
                    }
                }
            }
        }
        for (var itemSetSkillIndex in itemSetSkills) {
            var skill = itemSetSkills[itemSetSkillIndex];
            var effectsNotTreated = [];
            var lenght = result.length;
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                var copy = JSON.parse(JSON.stringify(result[itemIndex]));
                var rawEffect = skill.effects_raw[0];
                var conditions = rawEffect[3][0];
                if (!Array.isArray(rawEffect[3][0])) {
                    conditions = [rawEffect[3][0]];
                }
                copy.equipedConditions = conditions;
                addStat(copy, "hp%", rawEffect[3][5]);
                addStat(copy, "mp%", rawEffect[3][6]);
                addStat(copy, "atk%", rawEffect[3][1]);
                addStat(copy, "def%", rawEffect[3][2]);
                addStat(copy, "mag%", rawEffect[3][3]);
                addStat(copy, "spr%", rawEffect[3][4]);
                result.push(copy);
            }
        }
    } else {
        result.push(itemOut);
    }
    return result;
}

function intersect(array1, array2) {
    return array1.filter(value => array2.includes(value));
}

function addMasterySkills(item, masterySkills, result) {
    var treatedItems = [];
    for (var masteryIndex in masterySkills) {
        var lenght = treatedItems.length;
        var copy = JSON.parse(JSON.stringify(item));
        addMastery(copy, masterySkills[masteryIndex]);
        result.push(copy);
        treatedItems.push(copy);
        for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
            if (!treatedItems[itemIndex].equipedConditions || treatedItems[itemIndex].equipedConditions.length < 2) {
                var copy = JSON.parse(JSON.stringify(treatedItems[itemIndex]));
                addMastery(copy, masterySkills[masteryIndex]);
                result.push(copy);
                treatedItems.push(copy);
            }
        }
    }
}

function addNotTreatedEffects(itemOut, effectsNotTreated, skill, skillId) {
    if (effectsNotTreated.length > 0) {
        var special = "[" + skill.name;
        if (languageId != 0) {
            if (skillNameTrads[skillId]) {
                special += "|" + skillNameTrads[skillId][languageId];
            }
        }
        if (skill.icon) {
            special += "|" + skill.icon;
        }
        special += "]:"
        if (languageId == 0) {
            var first = true;
            for (var index in effectsNotTreated) {
                if (first) {
                    first = false;
                } else {
                    special += ", ";
                }
                special += skill.effects[effectsNotTreated[index]];
            }
        } else {
            if (skillDescTrads[skillId]) {
                special += skillDescTrads[skillId][languageId];
            }
        }
        addSpecial(itemOut, special);
    }
}

function addEffectToItem(item, skill, rawEffectIndex, skills) {
    if (skill.active) {
        return false; // don't consider active skills
    }
    var rawEffect = skill.effects_raw[rawEffectIndex];
    // + X % to a stat
    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {
        var effectData = rawEffect[3]
        addStat(item, "hp%", effectData[4]);
        addStat(item, "mp%", effectData[5]);
        addStat(item, "atk%", effectData[0]);
        addStat(item, "def%", effectData[1]);
        addStat(item, "mag%", effectData[2]);
        addStat(item, "spr%", effectData[3]);

    // DualWield
    } else if (rawEffect[1] == 3 && rawEffect[2] == 14 && (rawEffect[0] == 0 || rawEffect[0] == 1)) {
        if (rawEffect[3].length == 1 && rawEffect[3][0] == "none") {
            addSpecial(item,"dualWield");
        } else {
            item.partialDualWield = [];
            for (var dualWieldType in rawEffect[3]) {
                var typeId = rawEffect[3][dualWieldType];
                item.partialDualWield.push(typeMap[typeId]);
            }
        }

    // killers
    } else if (((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) ||
        (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 11)) {
        
        var killerRaces = rawEffect[3][0];
        var physicalPercents = rawEffect[3][1];
        var magicalPercents = rawEffect[3][2];
        
        if (!Array.isArray(killerRaces)) {
            killerRaces = [killerRaces];
        }
        if (!Array.isArray(physicalPercents)) {
            physicalPercents = new Array(killerRaces.length).fill(physicalPercents);
        }
        if (!Array.isArray(magicalPercents)) {
            magicalPercents = new Array(killerRaces.length).fill(magicalPercents);
        }
        
        for (var raceIndex = 0; raceIndex < killerRaces.length; raceIndex++) {
            addKiller(item, killerRaces[raceIndex], physicalPercents[raceIndex], magicalPercents[raceIndex]);    
        }

    // evade
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 22) {
        if (!item.evade) {
            item.evade = {};
        }
        item.evade.physical = rawEffect[3][0];

    // magical evade
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 54 && rawEffect[3][0] == -1) {
        if (!item.evade) {
            item.evade = {};
        }
        item.evade.magical = rawEffect[3][1];

    // Auto- abilities
    } else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 35) {
        addSpecial(item, "Gain at the start of a battle: " + getSkillString(skills[rawEffect[3][0]], rawEffect[3][0]));

    // Element Resist
    } else if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
        addElementalResist(item, rawEffect[3]);

    // Ailments Resist
    } else if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
        addAilmentResist(item, rawEffect[3]);

    // Equip X
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 5) {
        if (item.allowUseOf) {
            item.allowUseOf.push(typeMap[rawEffect[3]]);
        } else {
            item.allowUseOf = [typeMap[rawEffect[3]]];
        }

    // Doublehand
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
        if (rawEffect[3][2] == 0) {
            if (!item.singleWieldingOneHanded) {item.singleWieldingOneHanded = {}};
            addStat(item.singleWieldingOneHanded,"atk",rawEffect[3][0]);
            addStat(item.singleWieldingOneHanded,"accuracy",rawEffect[3][1]);
        } else if (rawEffect[3][2] == 2) {
            if (!item.singleWielding) {item.singleWielding = {}};
            addStat(item.singleWielding,"atk",rawEffect[3][0]);
            addStat(item.singleWielding,"accuracy",rawEffect[3][1]);
        }
        
    } else if (rawEffect[1] == 3 && rawEffect[2] == 10003) {
        var doublehandSkill = {};
        var doublehandEffect = rawEffect[3];
        if (doublehandEffect.length == 7 && doublehandEffect[6] == 1) {
            if (!item.singleWielding) {item.singleWielding = {}};
            doublehandSkill = item.singleWielding;
        } else {
            if (!item.singleWieldingOneHanded) {item.singleWieldingOneHanded = {}};
            doublehandSkill = item.singleWieldingOneHanded;
        }
        if (doublehandEffect[2]) {
            addStat(doublehandSkill, "atk", doublehandEffect[2]);
        }
        if (doublehandEffect[4]) {
            addStat(doublehandSkill, "def", doublehandEffect[4]);
        }
        if (doublehandEffect[3]) {
            addStat(doublehandSkill, "mag", doublehandEffect[3]);
        }
        if (doublehandEffect[5]) {
            addStat(doublehandSkill, "spr", doublehandEffect[5]);
        }
        if (doublehandEffect[0]) {
            addStat(doublehandSkill, "hp", doublehandEffect[0]);
        }
        if (doublehandEffect[1]) {
            addStat(doublehandSkill, "mp", doublehandEffect[1]);
        }
        
    // MAG DH
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 70) {
        if (rawEffect[3][2] == 0) {
            if (!item.singleWieldingOneHanded) {item.singleWieldingOneHanded = {}};
            addStat(item.singleWieldingOneHanded,"mag",rawEffect[3][0]);    
        } else if (rawEffect[3][2] == 2) {
            if (!item.singleWielding) {item.singleWielding = {}};
            addStat(item.singleWielding,"mag",rawEffect[3][0]);    
        }
        
    // +EQ stat when dual wielding
    } else if (rawEffect[2] == 69) {
        if (!item.dualWielding) {item.dualWielding = {}};
        var dualWieldingStat;
        if (rawEffect[3][0] == 1) {
            dualWieldingStat = "atk";
        } else if (rawEffect[3][0] == 2) {
            dualWieldingStat = "def";
        } else if (rawEffect[3][0] == 3) {
            dualWieldingStat = "mag";
        } else if (rawEffect[3][0] == 4) {
            dualWieldingStat = "spr";
        }
        addStat(item.dualWielding, dualWieldingStat, rawEffect[3][1]);

    // MP refresh
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
        var mpRefresh = rawEffect[3][0];
        addStat(item, "mpRefresh", mpRefresh);

    // LB/turn
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 33) {
        var lbPerTurn = rawEffect[3][0]/100;
        addLbPerTurn(item, lbPerTurn, lbPerTurn);
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 125) {
        var lbPerTurnMin = rawEffect[3][0]/100;
        var lbPerTurnMax = rawEffect[3][1]/100;
        addLbPerTurn(item, lbPerTurnMin, lbPerTurnMax);

    // LB fill rate
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 31) {
        var lbFillRate = rawEffect[3][0];
        addStat(item, "lbFillRate", lbFillRate);

    // +Jump damage
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 17) {
        var jumpDamage = rawEffect[3][0];
        addStat(item, "jumpDamage", jumpDamage);

    // +EVO Mag
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 21) {
        var evoMag = rawEffect[3][0];
        addStat(item, "evoMag", evoMag);

    // +Stats from espers boost
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 63) {
        var esperStatsBonus = rawEffect[3];
        if (!item.esperStatsBonus) {
            item.esperStatsBonus = {};
        }
        addStat(item.esperStatsBonus, "hp", esperStatsBonus[0]);
        addStat(item.esperStatsBonus, "mp", esperStatsBonus[1]);
        addStat(item.esperStatsBonus, "atk", esperStatsBonus[2]);
        addStat(item.esperStatsBonus, "def", esperStatsBonus[3]);
        addStat(item.esperStatsBonus, "mag", esperStatsBonus[4]);
        addStat(item.esperStatsBonus, "spr", esperStatsBonus[5]);
    
    // +LB damage
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 68) {
        var lbDamage = rawEffect[3][0];
        addStat(item, "lbDamage", lbDamage);

    // Draw attacks
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 24) {
        var drawAttacks = rawEffect[3][0];
        addStat(item, "drawAttacks", drawAttacks);

    // Skill enhancement
    } else if (rawEffect[2] == 73) {
        if (!item.skillEnhancement) {
            item.skillEnhancement = {};
        }
        if (Array.isArray(rawEffect[3][0])) {
            for (var i = rawEffect[3][0].length; i--;) {
                addStat(item.skillEnhancement, rawEffect[3][0][i].toString(), rawEffect[3][3] / 100);
            }
        } else {
            addStat(item.skillEnhancement, rawEffect[3][0].toString(), rawEffect[3][3] / 100);
        }
        
    // Break, stop and charm resistance with turn number
    } else if (rawEffect[2] == 89 || rawEffect[2] == 55) {
        if (!item.resist) {
            item.resist = [];
        }
        if (rawEffect[3][0]) {
            item.resist.push({"name":"break_atk","percent":rawEffect[3][0]});
        }
        if (rawEffect[3][1]) {
            item.resist.push({"name":"break_def","percent":rawEffect[3][1]});
        }
        if (rawEffect[3][2]) {
            item.resist.push({"name":"break_mag","percent":rawEffect[3][2]});
        }
        if (rawEffect[3][3]) {
            item.resist.push({"name":"break_spr","percent":rawEffect[3][3]});
        }
        if (rawEffect[3][4]) {
            item.resist.push({"name":"stop","percent":rawEffect[3][4]});
        }
        if (rawEffect[3][5]) {
            item.resist.push({"name":"charm","percent":rawEffect[3][5]});
        }
    
        // item sets
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 74) {
        var result = [];
        var conditions = rawEffect[3][0];
        if (!Array.isArray(rawEffect[3][0])) {
            conditions = [rawEffect[3][0]];
        }
        for (var i = conditions.length; i--;) {
            var gilgameshSkill = {"equipedConditions":[conditions[i].toString()]};
            gilgameshSkill["atk%"] = rawEffect[3][1];
            gilgameshSkill["def%"] = rawEffect[3][2];
            gilgameshSkill["mag%"] = rawEffect[3][3];
            gilgameshSkill["spr%"] = rawEffect[3][4];
            gilgameshSkill["hp%"] = rawEffect[3][5];
            gilgameshSkill["mp%"] = rawEffect[3][6];
            result.push(gilgameshSkill);
        }
        return result;
        
    } else {
        return false;
    }
    return true;
}

function addSpecial(item, special) {
    if (!item.special) {
        item.special = [];
    }
    item.special.push(special);
}

function addStat(item, stat, value) {
    if (value != 0) {
        if (!item[stat]) {
            item[stat] = 0;
        }
        item[stat] += value;
    }
}

function addKiller(item, raceId, physicalPercent, magicalPercent) {
    var race = raceMap[raceId];
    if (!item.killers) {
        item.killers = [];
    }
    var killer = {"name":race};
    if (physicalPercent) {
        killer.physical = physicalPercent;
    }
    if (magicalPercent) {
        killer.magical = magicalPercent;
    }
    item.killers.push(killer);
}

function getSkillString(skill, skillId) {
    var first = true;
    var effect = "";
    for (var effectIndex in skill.effects) {
        if (first) {
            first = false;
        } else {
            effect += ", ";
        }
        effect += skill.effects[effectIndex];
    }
    var result = "[" + skill.name;
    if (languageId != 0) {
        result += "|" + skillNameTrads[skillId][languageId];
    }
    if (skill.icon) {
        result += "|" + skill.icon;
    }
    result += "]: " + effect;
    return result;
}

function addElementalResist(item, values) {
    if (!item.resist) {
        item.resist = [];
    }
    for (var index in elements) {
        if (values[index]) {
            item.resist.push({"name":elements[index],"percent":values[index]})
        }
    }
}

function addAilmentResist(item, values) {
    if (!item.resist) {
        item.resist = [];
    }
    for (var index in ailments) {
        if (values[index]) {
            item.resist.push({"name":ailments[index],"percent":values[index]})
        }
    }
}

function addMastery(item, mastery) {
    if (!item.equipedConditions) {
        item.equipedConditions = [];
    }

    // element based mastery
    if (mastery[1] == 3 && mastery[2] == 10004) {
        var masteryEffect = mastery[3];
        if (Array.isArray(masteryEffect[0])) {
            item.equipedConditions = item.equipedConditions.concat([masteryEffect[0].map(x => elementsMapNumber[x])]);
        } else {
            item.equipedConditions.push(elementsMapNumber[masteryEffect[0]]);
        }
        if (masteryEffect[3]) {
            addStat(item, "atk%", masteryEffect[3]);
        }
        if (masteryEffect[5]) {
            addStat(item, "def%", masteryEffect[5]);
        }
        if (masteryEffect[4]) {
            addStat(item, "mag%", masteryEffect[4]);
        }
        if (masteryEffect[6]) {
            addStat(item, "spr%", masteryEffect[6]);
        }
        if (masteryEffect[1]) {
            addStat(item, "hp%", masteryEffect[1]);
        }
        if (masteryEffect[2]) {
            addStat(item, "mp%", masteryEffect[2]);
        }
    } else {
        item.equipedConditions.push(typeMap[mastery[3][0]]);
        addStat(item, "atk%", mastery[3][1]);
        addStat(item, "def%", mastery[3][2]);
        addStat(item, "mag%", mastery[3][3]);
        addStat(item, "spr%", mastery[3][4]);
        if (mastery[3].length >= 6) {
            addStat(item, "hp%", mastery[3][5]);
        }
        if (mastery[3].length >= 7) {
            addStat(item, "mp%", mastery[3][6]);
        }
    }
}

function addExclusiveUnit(item, unitId) {
    if (!item.exclusiveUnits) {
        item.exclusiveUnits = [];
    }
    if (Array.isArray(unitId)) {
        for (var i = 0, len = unitId.length; i < len; i++) {
            item.exclusiveUnits.push(new String(unitId[i]));
        }
    } else if (typeof unitId == "number") {
        item.exclusiveUnits.push(new String(unitId));
    } else {
        item.exclusiveUnits.push(unitId);
    }
}

function isItemEmpty(item) {
    for (var index in stats) {
        if (item[stats[index].toLowerCase()]) {
            return false;
        }
        if (item[stats[index].toLowerCase() + "%"]) {
            return false;
        }
    }
    if (item.special) {
        for (var index in item.special) {
            if (item.special[index] != "twoHanded" && item.special[index] != "notStackable") {
                return false;
            }
        }
    }
    return !(item.resist || item.dualWielding || item.singleWielding || item.singleWieldingOneHanded || item.lbPerTurn || item.lbFillRate || item.evade || item.evoMag || item.damageVariance || item.jumpDamage || item.element || item.partialDualWield || item.ailments || item.killers || item.mpRefresh || item.esperStatsBonus);
}

function addAccess(item, access) {
    if (!item.access) {
        item.access = [];
    }
    item.access.push(access);
}

function addLbPerTurn(item, min, max) {
    if (!item.lbPerTurn) {
        item.lbPerTurn = {"min":0, "max":0};
    }
    item.lbPerTurn.min += min;
    item.lbPerTurn.max += max;
}

function formatOutput(items) {
    var properties = ["id","name","wikiEntry","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","evade","singleWieldingOneHanded","singleWielding", "dualWielding", "accuracy","damageVariance", "jumpDamage", "lbFillRate", "lbPerTurn", "element","partialDualWield","resist","ailments","killers","mpRefresh","esperStatsBonus","lbDamage", "drawAttacks", "skillEnhancement","special","allowUseOf","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit", "stmrUnit" ,"access","maxNumber","eventNames","icon","sortId","notStackableSkills", "rarity"];
    var result = "[\n";
    var first = true;
    for (var index in items) {
        var item = items[index]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t{";
        var firstProperty = true;
        for (var propertyIndex in properties) {
            var property = properties[propertyIndex];
            if (item[property]) {
                if (firstProperty) {
                    firstProperty = false;
                } else {
                    result += ", ";
                }
                result+= "\"" + property + "\":" + JSON.stringify(item[property]);
            }
        }
        result += "}";
    }
    result += "\n]";
    return result;
}

function verifyImage(icon) {
    var filePath = "../../static/img/items/" + icon;
    if (!fs.existsSync(filePath)) {
        //download("http://diffs.exvius.gg/asset_files/global/item_item1_common/122/" + icon ,filePath);
        console.log("Missing image : " + icon);
    }
}

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        if (err || res.statusCode == 404) {
            console.log("!! unable to download image : " + uri);
        } else {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function() {
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

            });
        }
    });
};
