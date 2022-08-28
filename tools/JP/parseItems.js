﻿var fs = require('fs');
var request = require('request');
var PNG = require('pngjs').PNG;

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrification"];
const shieldList = ["lightShield", "heavyShield"];
const headList = ["hat", "helm"];
const bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];

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

let espersById = {
    "1":"Siren",
    "2":"Ifrit",
    "3":"Shiva",
    "4":"Carbuncle",
    "5":"Diabolos",
    "6":"Golem",
    "7":"Ramuh",
    "8":"Titan",
    "9":"Tetra Sylphid",
    "10":"Odin",
    "11":"Lakshmi",
    "12":"Leviathan",
    "13":"Alexander",
    "14":"Phoenix",
    "15":"Bahamut",
    "16":"Fenrir",
    "17":"Anima",
    "18":"Asura",
    "19":"Black Dragon"
}

const visionCardStatPatterns = {
    "1": {
        "1": [0]
    },
    "100": {
        "10": [0, 10, 20, 30, 40, 50, 60, 70, 80, 100]
    }
}

const unitRules = {
    4008: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10007], // FF7 units
    7102: (item) => item.exclusiveSex = 'male',// Male units
    7103: (item) => item.exclusiveSex = 'female',// Female units,
    7110: (item) => item.exclusiveRoles = ['physicalAttacker'],
    7111: (item) => item.exclusiveRoles = ['physicalAttacker', 'magicalAttacker'],
    7112: (item) => item.exclusiveRoles = ['physicalTank'],
    7113: (item) => item.exclusiveRoles = ['physicalTank', 'magicalTank'],
    7114: (item) => item.exclusiveRoles = ['healer'],
    7116: (item) => item.exclusiveRoles = ['debuffer'],
    7201: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10001], // FF1
    7202: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10002], // FF2
    7203: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10003], // FF3
    7204: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10004], // FF4
    7205: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10005], // FF5
    7206: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10006], // FF6
    7208: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10008], // FF8
    7209: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10009], // FF9
    7210: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10010], // FF10
    7212: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10012], // FF12
    7215: (item) => item.exclusiveUnits = nvUnitIdsByGameId[10015], // FF15
    7216: (item) => item.exclusiveUnits = nvUnitIdsByGameId[11001], // FFBE units
    7218: (item) => item.exclusiveUnits = nvUnitIdsByGameId[11003], // FF Type 0
    7225: (item) => item.exclusiveUnits = (nvUnitIdsByGameId[11001] || []).concat(nvUnitIdsByGameId[11010]), // FFBE or WotV
    7245: (item) => item.exclusiveUnits = nvUnitIdsByGameId[20006], // DQMSL
    7263: (item) => item.exclusiveUnits = nvUnitIdsByGameId[20024], // Xenogear
    7269: (item) => item.exclusiveRoles = ['breaker'],              // Breaker role
    7271: (item) => item.exclusiveUnits = nvUnitIdsByGameId[20032], // Fullmetal Alchemist units
    7272: (item) => item.exclusiveUnits = nvUnitIdsByGameId[20033], // KH units
    7273: (item) => item.exclusiveUnits = (nvUnitIdsByGameId[10013] || []).concat(nvUnitIdsByGameId[11006] || []).concat(nvUnitIdsByGameId[11007] || []), // FF13, FF13-2 and LR FF13 units
    7274: (item) => item.exclusiveUnits = ["312000205", "312001007", "312001017"],
    7275: (item) => item.exclusiveRoles = ['physicalTank'],          // Physical tank role
    7276: (item) => item.exclusiveUnits = nvUnitIdsByGameId[20037],  // Dragon Quest Dai
    7403: (item) => item.exclusiveUnits = nvUnitIdsByGameId[20033], // KH units
}

var unitNamesById = {};
var unitIdByTmrId = {};
var unitIdBySTmrId = {};
var oldItemsAccessById = {};
var oldItemsEventById = {};
var oldItemsMaxNumberById = {};
var releasedUnits;
var glNameById = {};
var dev = false;
var nvUnitIdsByGameId = {};
var jpUnits;


function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe-jp/master/' + filename,  {"gzip": true}, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(filename + " downloaded");
                var result = JSON.parse(body);
                callback(result);
            } else {
                console.log("Error for file " + filename);
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
if (!fs.existsSync('../../static/JP/data.json')) {
    console.log("old data not accessible");
    return;
}
getData('equipment.json', function (items) {
    getData('materia.json', function (materias) {
        getData('skills_ability.json', function (skills) {
            getData('skills_passive.json', function (passives) {
                getData('skills_magic.json', function (magics) {
                    getData('vision_cards.json', function (visionCards) {
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
                            fs.readFile('../../static/GL/data.json', function (err, glDatacontent) {
                                var glData = JSON.parse(glDatacontent);
                                for (var glIndex = glData.length; glIndex--;) {
                                    glNameById[glData[glIndex].id] = glData[glIndex].name;
                                }
                                for (var unitIndex in units) {
                                    var unit = units[unitIndex];
                                    unitNamesById[unitIndex] = {"name":unit.name, "minRarity":unit.rarity_min};

                                    if (unit.TMR && (!unit.base_id ||unit.base_id == unitIndex)) {
                                        unitIdByTmrId[unit.TMR[1]] = unitIndex;
                                        if (unit.rarity_min > 3 && !unit.is_summonable) {
                                            unitNamesById[unitIndex].event = true;
                                        }
                                    }
                                    if (unit.sTMR && (!unit.base_id ||unit.base_id == unitIndex)) {
                                        unitIdBySTmrId[unit.sTMR[1]] = unitIndex;
                                    }
                                }

                                Object.keys(units).forEach(unitId => {
                                    let unit = units[unitId];
                                    if (unit.game_id && unit.skills && unit.skills.some(s => s.brave_ability)) {
                                        if (!nvUnitIdsByGameId[unit.game_id]) nvUnitIdsByGameId[unit.game_id] = [];
                                        nvUnitIdsByGameId[unit.game_id].push(unitId);
                                    }
                                });

                                fs.readFile('../../static/JP/data.json', function (err, content) {
                                    var oldItems = JSON.parse(content);
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
                                    }

                                    fs.readFile('../../static/JP/releasedUnits.json', function (err, content) {
                                        releasedUnits = JSON.parse(content);
                                        fs.readFile('../../static/JP/units.json', function (err, content) {
                                            jpUnits = JSON.parse(content);

                                            var result = {"items":[]};
                                            for (var itemId in items) {
                                                treatItem(items,itemId, result, skills);
                                            }
                                            for (var materiaId in materias) {
                                                treatItem(materias,materiaId, result, skills);
                                            }
                                            fs.writeFileSync('data.json', formatOutput(result.items));
                                            cards = [];
                                            for (visionCardId in visionCards) {
                                                cards.push(treatVisionCard(visionCards[visionCardId], visionCardId, skills));
                                            }
                                            fs.writeFileSync('visionCards.json', formatVisionCards(cards));
                                        });
                                    });
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
    var itemOut = {};
    itemOut.id = itemId;
    if (itemId == "504219270") {
        return; // Dual Wield+
    }
    if (glNameById[itemId]) {
        itemOut.name = glNameById[itemId];
        itemOut.jpname = itemIn.name;
    } else {
        itemOut.name = itemIn.name;    
    }
    
    if (itemIn.type_id) {
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
        if (unit.event || (releasedUnits[uitId] && releasedUnits[uitId].type == "event")) {
            access += "-event";
        }
        addAccess(itemOut,access);
        
        itemOut.tmrUnit = unitIdByTmrId[itemOut.id];
    }
    if (unitIdBySTmrId[itemOut.id]) {
        var unitId = unitIdBySTmrId[itemOut.id];
        itemOut.stmrUnit = unitIdBySTmrId[itemOut.id];
        addAccess(itemOut,"STMR");
        
        
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
            if (access != "unknown" && access != "not released yet") {
                addAccess(itemOut, access);
            }
        }
    }
    if (!itemOut.eventNames && oldItemsEventById[itemOut.id]) {
        itemOut.eventNames = oldItemsEventById[itemOut.id];
        if (!Array.isArray(itemOut.eventNames)) {
            itemOut.eventNames = [itemOut.eventNames];
        }
    }
    if (!itemOut.maxNumber && oldItemsMaxNumberById[itemOut.id]) {
        itemOut.maxNumber = oldItemsMaxNumberById[itemOut.id];
    }
    if (!itemOut.access) {
        itemOut.access = ["unknown"];
    }
    if (!oldItemsAccessById[itemOut.id]) {
        console.log("new item : " + itemOut.id + " - " + itemOut.name);
    }
    
    result.items = result.items.concat(readSkills(itemIn, itemOut,skills));
}

function treatVisionCard(visionCard, visionCardId, skills) {
    let card = {};
    card.id = visionCardId;
    card.name = visionCard.name;
    card.type = 'visionCard';
    card.icon = 'vc_vignette_item_icon_' + visionCardId + '.png';
    verifyImage(card.icon);
    if (visionCard.compendium_id) {
        card.sortId = visionCard.compendium_id;
    }
    card.access = ["unknown"];
    card.levels = [];
    for (let level = 1; level <= visionCard.max_level; level++) {
        let levelData = {};
        card.levels.push(levelData);
        stats.forEach(stat => {
            value = visionCard.stats[stat][0] + (visionCard.stats[stat][1] - visionCard.stats[stat][0]) * visionCardStatPatterns[visionCard.stat_pattern][visionCard.max_level][level - 1] / 100;
            addStat(levelData, stat.toLowerCase(), Math.floor(value));
        });
        for (let i = 1; i <= level; i++) {
            if (visionCard.skills && visionCard.skills[i]) {
                for (let j = 0; j < visionCard.skills[i].length; j++) {
                    let skill = skills[visionCard.skills[i][j].toString()];
                    skill.effects_raw.forEach((rawEffect, index) => {
                        if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                            // mastery skill
                            let conditional = {};
                            addMastery(conditional, rawEffect);
                            if (!levelData.conditional) levelData.conditional = [];
                            const sameCondition = levelData.conditional.filter(cond => arrayEquivalents(cond.equipedConditions, conditional.equipedConditions));
                            if (sameCondition.length === 0) {
                                levelData.conditional.push(conditional);
                            } else {
                                stats.forEach(stat => {
                                    if (conditional[stat.toLowerCase() + '%']) {
                                        addStat(sameCondition[0], stat.toLowerCase() + '%', conditional[stat.toLowerCase() + '%']);
                                    }
                                });
                            }
                        } else {
                            if (visionCard.restriction && visionCard.restriction[visionCard.skills[i].toString()]) {
                                let ruleIds = visionCard.restriction[visionCard.skills[i].toString()];
                                let conditional = {};
                                addEffectToItem(conditional, skill, index, skills);
                                if (!levelData.conditional) levelData.conditional = [];
                                ruleIds.forEach(ruleId => {
                                    if (!Object.keys(unitRules).includes(ruleId.toString())) {
                                        console.log('Missing rule ' + ruleId + ' for vision card ' + visionCard.name);
                                    }
                                    unitRules[ruleId](conditional);
                                });
                                levelData.conditional.push(conditional);
                            } else {
                                addEffectToItem(levelData, skill, index, skills);
                            }
                        }
                    });
                }
            }
        }
        // TODO restriction
    }
    return card;
}

function arrayEquivalents(a1, a2) {
    return a1.length === a2.length && a1.every(item => a2.includes(item));
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
        for (var skillIndex in itemIn.skills) {
            var skillId = itemIn.skills[skillIndex];
            var skill = skills[skillId];
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
                    addSpecial(itemOut, getSkillString(skill));
                } else if (skill.unit_restriction) {
                    restrictedSkills.push(skill);
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

                            // one weapon mastery
                        } else if (rawEffect[1] == 3 && rawEffect[2] == 99 && rawEffect[3][2] && rawEffect[3][2].length < 16 && itemIn.type_id > 16) {
                            masterySkills.push(rawEffect);

                        } else {
                            if (!addEffectToItem(itemOut, skill, rawEffectIndex, skills)) {
                                effectsNotTreated.push(rawEffectIndex)
                            }

                        }
                    }
                    addNotTreatedEffects(itemOut, effectsNotTreated, skill);
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
                var unitFoud = false;
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        addExclusiveUnit(copy, skill.unit_restriction[restrictedUnitIndex]);
                        unitFoud = true;
                    }
                }
                if (!unitFoud) { console.log("No units found in " + JSON.stringify(skill.unit_restriction) + " for skill " + skill.name );}
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skill.effects_raw[rawEffectIndex];
                    if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                        masterySkills.push(rawEffect[3]);
                    } else if (!addEffectToItem(copy, skill, rawEffectIndex, skills)) {
                        effectsNotTreated.push(rawEffectIndex);
                    }
                }
                addNotTreatedEffects(copy, effectsNotTreated, skill);
                result.push(copy);
                if (masterySkills.length > 0) {
                    addMasterySkills(copy, masterySkills, result);
                }
            }
            if (emptyItem) {
                var copy = JSON.parse(JSON.stringify(itemOut));
                var unitFoud = false;
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        addExclusiveUnit(copy, skill.unit_restriction[restrictedUnitIndex]);
                        unitFoud = true;
                    }
                }
                if (!unitFoud) { console.log("No units found in " + JSON.stringify(skill.unit_restriction) + " for skill " + skill.name );}
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skill.effects_raw[rawEffectIndex];
                    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                        masterySkills.push(rawEffect);
                    } else if (!addEffectToItem(copy, skill, rawEffectIndex, skills)) {
                        effectsNotTreated.push(rawEffectIndex);
                    }
                }
                addNotTreatedEffects(copy, effectsNotTreated, skill);
                result.push(copy);
                if (masterySkills.length > 0) {
                    addMasterySkills(copy, masterySkills, result);
                }
            }
        }
    } else {
        result.push(itemOut);
    }
    return result;
}

function addMasterySkills(item, masterySkills, result) {
    var treatedItems = [];
    for (var masteryIndex in masterySkills) {
        var lenght = treatedItems.length;
        var copy = JSON.parse(JSON.stringify(item));

        if (masterySkills[masteryIndex][2] === 99) {
            if (!Array.isArray(masterySkills[masteryIndex][3][2])) masterySkills[masteryIndex][3][2] = [masterySkills[masteryIndex][3][2]];
            masterySkills[masteryIndex][3][2].forEach(weaponTypeId => {
                addOneWeaponMastery(copy, masterySkills[masteryIndex][3][0], masterySkills[masteryIndex][3][1], weaponTypeId);
                result.push(copy);
                treatedItems.push(copy);
                for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                    if (!treatedItems[itemIndex].equipedConditions || treatedItems[itemIndex].equipedConditions.length < 2) {
                        let copy = JSON.parse(JSON.stringify(treatedItems[itemIndex]));
                        addOneWeaponMastery(copy, masteryIndex[3][0], masteryIndex[3][1], weaponTypeId);
                        result.push(copy);
                        treatedItems.push(copy);
                    }
                }
            });
        } else if (addMastery(copy, masterySkills[masteryIndex])) {
            result.push(copy);
            treatedItems.push(copy);
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                if (!treatedItems[itemIndex].equipedConditions || treatedItems[itemIndex].equipedConditions.length < 2) {
                    var copy = JSON.parse(JSON.stringify(treatedItems[itemIndex]));
                    if (addMastery(copy, masterySkills[masteryIndex])) {
                        result.push(copy);
                        treatedItems.push(copy);
                    }
                }
            }
        }
    }
}

function addOneWeaponMastery(item, statId, value, weaponTypeId) {
    // Increase EQ stat when armed with a single weapon (with or without shield)
    var stat;
    if (statId == 1) {
        stat = "atk";
    } else if (statId == 2) {
        stat = "def";
    } else if (statId == 3) {
        stat = "mag";
    } else if (statId == 4) {
        stat = "spr";
    }
    if (!item.oneWeaponMastery) item.oneWeaponMastery = {};
    if (!item.equipedConditions) item.equipedConditions = [];
    addStat(item.oneWeaponMastery, stat, value);
    item.equipedConditions.push(typeMap[weaponTypeId]);

}

function addNotTreatedEffects(itemOut, effectsNotTreated, skill) {
    if (effectsNotTreated.length > 0) {
        var special = "[" + skill.name;
        if (skill.icon) {
            special += "|" + skill.icon;
        }
        special += "]:"
        var first = true;
        for (var index in effectsNotTreated) {
            if (first) {
                first = false;
            } else {
                special += ", ";
            }
            special += skill.effects[effectsNotTreated[index]].join(', ');
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

        // + static X to a stat
    } else if (rawEffect[2] == 89) {
        var effectData = rawEffect[3];
        if (!item.staticStats) item.staticStats = {};
        addStat(item.staticStats, "hp", effectData[4]);
        addStat(item.staticStats, "mp", effectData[5]);
        addStat(item.staticStats, "atk", effectData[0]);
        addStat(item.staticStats, "def", effectData[1]);
        addStat(item.staticStats, "mag", effectData[2]);
        addStat(item.staticStats, "spr", effectData[3]);

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
        // Killers
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
        addSpecial(item, "Gain at the start of a battle: " + getSkillString(skills[rawEffect[3][0]]));

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
        
    } else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10003) {
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
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 69) {
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

        // Increase EQ stat when armed with a single weapon (with or without shield)
    } else if (rawEffect[2] == 99) {
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
        if (!item.oneWeaponMastery) item.oneWeaponMastery = {};
        addStat(item.oneWeaponMastery, stat, rawEffect[3][1]);

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
        
        // boost evoke damage
    } else if (rawEffect[2] == 64) {
        let esperName;
        if (rawEffect[3][1] === 0) {
            esperName = 'all';
        } else {
            esperName = espersById[rawEffect[3][1]];
        }
        if (!item.evokeDamageBoost) {
            item.evokeDamageBoost = {};
        }
        if (!item.evokeDamageBoost[esperName]) {
            item.evokeDamageBoost[esperName] = 0;
        }
        item.evokeDamageBoost[esperName] += rawEffect[3][0];
    
    // +EVO Mag
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 21) {
        var evoMag = rawEffect[3][0];
        addStat(item, "evoMag", evoMag);
        
        // +Stats from espers boost
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 63) {
        var esperStatsBonus = rawEffect[3];
        var esper;
        if (esperStatsBonus.length == 6 || esperStatsBonus[6] == 0) {
            esper = 'all';
        } else {
            esper = espersById[esperStatsBonus[6]];
        }
        if (!item.esperStatsBonus) {
            item.esperStatsBonus = {};
        }
        if (!item.esperStatsBonus[esper]) {
            item.esperStatsBonus[esper] = {};
        }
        addStat(item.esperStatsBonus[esper], "hp", esperStatsBonus[0]);
        addStat(item.esperStatsBonus[esper], "mp", esperStatsBonus[1]);
        addStat(item.esperStatsBonus[esper], "atk", esperStatsBonus[2]);
        addStat(item.esperStatsBonus[esper], "def", esperStatsBonus[3]);
        addStat(item.esperStatsBonus[esper], "mag", esperStatsBonus[4]);
        addStat(item.esperStatsBonus[esper], "spr", esperStatsBonus[5]);
        
    // +LB damage
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 68) {
        var lbDamage = rawEffect[3][0];
        addStat(item, "lbDamage", lbDamage);

    // boost evoke damage
    } else if (rawEffect[2] == 64) {
        let esperName;
        if (rawEffect[3][1] === 0) {
            esperName = 'all';
        } else {
            esperName = espersById[rawEffect[3][1]];
        }
        if (!item.evokeDamageBoost) {
            item.evokeDamageBoost = {};
        }
        if (!item.evokeDamageBoost[esperName]) {
            item.evokeDamageBoost[esperName] = 0;
        }
        item.evokeDamageBoost[esperName] += rawEffect[3][0];
        
    // Draw attacks
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 24) {
        var drawAttacks = rawEffect[3][0];
        addStat(item, "drawAttacks", drawAttacks);

    // Break, stop and charm resistance with turn number
    } else if (rawEffect[2] == 55) {
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

        // Increase max chain coef
    } else if (rawEffect[2] == 98) {
        addStat(item, 'chainMastery', rawEffect[3][1]);

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

function getSkillString(skill) {
    var first = true;
    var effect = "";
    for (var effectIndex in skill.effects) {
        if (first) {
            first = false;
        } else {
            effect += ", ";
        }
        effect += skill.effects[effectIndex].join(', ');
    }
    var result = "[" + skill.name;
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
            item.equipedConditions = item.equipedConditions.concat([masteryEffect[0].map(x => elementsMap[x])]);
        } else {
            item.equipedConditions.push(elementsMap[masteryEffect[0]]);
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
        let type = typeMap[mastery[3][0]];
        if (!item.equipedConditions.includes(type)) {
            if (shieldList.includes(type) && item.equipedConditions.some(c => shieldList.includes(c))) return false;
            if (headList.includes(type) && item.equipedConditions.some(c => headList.includes(c))) return false;
            if (bodyList.includes(type) && item.equipedConditions.some(c => bodyList.includes(c))) return false;
            item.equipedConditions.push(typeMap[mastery[3][0]]);
        }
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
    return true;
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
    return item.resist || item.dualWielding || item.singleWielding || item.singleWieldingOneHanded || item.lbPerTurn || item.lbFillRate || item.evade || item.evoMag || item.accuracy || item.damageVariance || item.jumpDamage || item.element || item.partialDualWield || item.ailments || item.killers || item.mpRefresh || item.esperStatsBonus;
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

const itemProperties = ["id","name","jpname","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","staticStats","evoMag","evade","singleWieldingOneHanded","singleWielding","dualWielding","oneWeaponMastery", "chainMastery","accuracy","damageVariance","jumpDamage","lbFillRate", "lbPerTurn","element","partialDualWield","resist","ailments","killers","mpRefresh","esperStatsBonus","lbDamage","drawAttacks", "evokeDamageBoost","special","allowUseOf","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","stmrUnit","access","maxNumber","eventNames","icon","sortId","notStackableSkills","rarity", "conditional"];
function formatOutput(items) {
    var result = "[\n";
    var first = true;
    for (var index in items) {
        var item = items[index]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t"
        result += formatItem(item);
    }
    result += "\n]";
    return result;
}

function formatItem(item) {
    result = "{";
    var firstProperty = true;
    for (var propertyIndex in itemProperties) {
        var property = itemProperties[propertyIndex];
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
    return result;
}

function formatVisionCards(cards) {
    var baseProperties = ["id","name","jpname","type","access","maxNumber","eventNames","icon","sortId"];
    var result = "[\n";
    var first = true;
    for (var index in cards) {
        var card = cards[index]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n{";
        var firstProperty = true;
        for (var propertyIndex in baseProperties) {
            var property = baseProperties[propertyIndex];
            if (card[property]) {
                if (firstProperty) {
                    firstProperty = false;
                } else {
                    result += ", ";
                }
                result+= "\"" + property + "\":" + JSON.stringify(card[property]);
            }
        }
        result += ", \"levels\":[\n\t";
        result += card.levels.map(level => formatItem(level)).join(',\n\t')
        result += "\n]}";
    }
    result += "\n]";
    return result;
}

function verifyImage(icon) {
    var filePath = "../../static/img/items/" + icon;
    if (!fs.existsSync(filePath)) {
        //download("http://diffs.exvius.gg/asset_files/ja/item_item1/81/" + icon ,filePath);
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
