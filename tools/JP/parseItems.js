var fs = require('fs');
var request = require('request');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrification"];

var statsMap = {
    "hp": "hp",
    "mp": "mp",
    "atk": "atk",
    "def": "def",
    "int": "mag",
    "mnd": "spr"
}

var typeMap = {
    "Dagger": 'dagger',
    "Sword": 'sword',
    "Greatsword": 'greatSword',
    "Katana": 'katana',
    "Staff": 'staff',
    "Rod": 'rod',
    "Bow": 'bow',
    "Axe": 'axe',
    "Hammer": 'hammer',
    "Lance": 'spear',
    "Harp": 'harp',
    "Whip": 'whip',
    "Projectile": 'throwing',
    "Gun": 'gun',
    "Mace": 'mace',
    "Knuckle": 'fist',
    "Light Shield": 'lightShield',
    "Heavy Shield": 'heavyShield',
    "Hat": 'hat',
    "Helm": 'helm',
    "Clothes": 'clothes',
    "Light Armor": 'lightArmor',
    "Heavy Armor": 'heavyArmor',
    "Robes": 'robe',
    "Accessory": 'accessory'
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
    "poison": "poison",
    "blind": "blind",
    "sleep": "sleep",
    "silence": "silence",
    "paralyze": "paralysis",
    "confuse": "confuse",
    "virus": "disease",
    "petrify": "petrification",
    "death": "death"
}

var elementsMap = {
    "fire": "fire",
    "ice": "ice",
    "thunder": "lightning",
    "water": "water",
    "wind": "wind",
    "earth": "earth",
    "light": "light",
    "dark": "dark"
}

var targetAreaMap = {
    "none": 0,
    "single":1,
    "all": 2
}

var targetSideMap = {
    "enemy": 1,
    "ally":2,
    "self": 3,
    "all": 4,
    "allies":5,
    "any":6
}

var unitNamesById = {};
var unitByTmrId = {};
var oldItemsAccessById = {};
var oldItemsEventById = {};
var oldItemsMaxNumberById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;

var dev = true;


console.log("Starting");
/*if (!fs.existsSync('../../static/JP/data.json')) {
    console.log("old data not accessible");
    return;
}*/

function getData(filename, callback) {
    if (!dev) {
        request.get('https://raw.githubusercontent.com/DanUgore/ffbe_data/master/jp/' + filename, function (error, response, body) {
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

getData('equip.json', function (items) {
    getData('unit.json', function (units) {
        for (var unitId in units) {
            var unit = units[unitId];
            if (unitId == unit.series && unit.trust_reward) {
                unitByTmrId[unit.trust_reward.id] = unit;
            }
        }
        getData('ability.json', function (skills) {
            getData('magic.json', function (magics) {
                var result = {"items":[]};
                for (var itemId in items) {
                    treatItem(items,itemId, result, skills, magics);
                }
                /*for (var materiaId in materias) {
                    treatItem(materias,materiaId, result, skills, magics);
                }*/
                fs.writeFileSync('data.json', formatOutput(result.items));
            });
        });
    });
});
                /*request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/skills.json', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("skills.json downloaded");
                        var skills = JSON.parse(body);
                        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/units.json', function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                console.log("units.json downloaded");
                                var units = JSON.parse(body);*/
                                
                                
                                
                                
                                /*fs.readFile('../static/GL/data.json', function (err, content) {
                                    var oldItems = JSON.parse(content);
                                    for (var index in oldItems) {
                                        oldItemsAccessById[oldItems[index].id] = oldItems[index].access;
                                        oldItemsEventById[oldItems[index].id] = oldItems[index].eventName;
                                        if (oldItems[index].maxNumber) {
                                            oldItemsMaxNumberById[oldItems[index].id] = oldItems[index].maxNumber;
                                        }
                                    }
                                    
                                    fs.readFile('../static/GL/releasedUnits.json', function (err, content) {
                                        releasedUnits = JSON.parse(content);*/
                                    
                                        
              /*                      });
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});*/


function treatItem(items, itemId, result, skills, magics) {
    var itemIn = items[itemId];
    var itemOut = {};
    itemOut.id = itemId;
    itemOut.name = itemIn.name;
    if (itemIn.equip_type) {
        itemOut.type = typeMap[itemIn.equip_type];
    } else {
        itemOut.type = "materia";
    }
    readStats(itemIn, itemOut);
    if (itemIn.two_handed) {
        addSpecial(itemOut,"twoHanded");
    }
    if (unitByTmrId[itemOut.id]) {
        var unit = unitByTmrId[itemOut.id];
        var access = "TMR-" + unit.rarity + "*";
        addAccess(itemOut,access);
        itemOut.tmrUnit = unit.id.toString();
    }
    if (itemIn.equip_condition) {
        if (itemIn.equip_condition["gender required"]) {
            itemOut.exclusiveSex = itemIn.equip_condition["gender required"];
        } else if (itemIn.equip_condition["series required"]) {
            var tokens;
            if (typeof itemIn.equip_condition["series required"] == "string") {
                tokens = itemIn.equip_condition["series required"].split(":");
            } else {
                tokens = [itemIn.equip_condition["series required"].toString()];
            }
            for (var index = 0, len = tokens.length; index < len; index++) {
                addExclusiveUnit(itemOut, tokens[index]);    
            }
        }
    }
    /*
    if (itemIn.accuracy) {
        addStat(itemOut,"accuracy",itemIn.accuracy);
    }
    */
    if (itemIn.damage_range && (parseInt(itemIn.damage_range.min) + parseInt(itemIn.damage_range.max)) != 200)  {
        itemOut.damageVariance = {"min":parseInt(itemIn.damage_range.min)/100,"max":parseInt(itemIn.damage_range.max)/100};
    }
    
    if (itemIn.icon) {
        itemOut.icon = itemIn.icon;
    }
    
    if (itemIn.guide_id) {
        itemOut.sortId = itemIn.guide_id;
    }
    
    /*if (!itemOut.access && oldItemsAccessById[itemOut.id]) {
        for (var index in oldItemsAccessById[itemOut.id]) {
            var access = oldItemsAccessById[itemOut.id][index];
            if (access != "not released yet") {
                addAccess(itemOut, access);
            }
        }
    }
    if (!itemOut.eventName && oldItemsEventById[itemOut.id]) {
        itemOut.eventName = oldItemsEventById[itemOut.id];
    }
    if (!itemOut.maxNumber && oldItemsMaxNumberById[itemOut.id]) {
        itemOut.maxNumber = oldItemsMaxNumberById[itemOut.id];
    }
    if (!itemOut.access) {
        itemOut.access = ["not released yet"];
    }
    if (!oldItemsAccessById[itemOut.id]) {
        console.log("new item : " + itemOut.id + " - " + itemOut.name);
    }*/

    result.items = result.items.concat(readSkills(itemIn, itemOut,skills, magics));
}

function readStats(itemIn, itemOut) {
    if (itemIn.boosts) {
        for (var statIn in statsMap) {
            var statValue = itemIn.boosts[statIn];
            if (statValue != 0) {
                itemOut[statsMap[statIn]] = statValue;
            }    
        }
    }
    if (itemIn.attack.elements.length > 0) {
        itemOut.element = [];
        for (var elementIndex in itemIn.attack.elements) {
            itemOut.element.push(elementsMap[itemIn.attack.elements[elementIndex]]);
        }
    }
    if (Object.keys(itemIn.attack.ailments).length > 0) {
        itemOut.ailments = [];
        for (var status in itemIn.attack.ailments) {
            itemOut.ailments.push({"name":ailmentsMap[status],"percent":itemIn.attack.ailments[status]})
        }
    }
    if (Object.keys(itemIn.resists.elements).length > 0) {
        itemOut.resist = [];
        for (var status in itemIn.resists.elements) {
            itemOut.resist.push({"name":elementsMap[status],"percent":itemIn.resists.elements[status]})
        }
    }
    if (Object.keys(itemIn.resists.ailments).length > 0) {
        if (!itemOut.resist) {
            itemOut.resist = [];
        }
        for (var status in itemIn.resists.ailments) {
            itemOut.resist.push({"name":ailmentsMap[status],"percent":itemIn.resists.ailments[status]})
        }
    }
}

function readSkills(itemIn, itemOut, skills, magics) {
    var result = [];
    if (itemIn.skills && itemIn.skills.magic && itemIn.skills.magic.length > 0) {
        for (var magicIndex in itemIn.skills.magic) {
            var magicId = itemIn.skills.magic[magicIndex].id;
            var magic = magics[magicId];
            if (magic) {
                addSpecial(itemOut, magic.full_desc);
            }
        }
    }
    if (itemIn.skills && itemIn.skills.abilities && itemIn.skills.abilities.length > 0) {
        var masterySkills = [];
        var restrictedSkills = [];
        for (var skillIndex in itemIn.skills.abilities) {
            var skillId = itemIn.skills.abilities[skillIndex].id;
            var skill = skills[skillId];
            if (skill) {
                if (skill.skill_type == "active") {
                    addSpecial(itemOut, skill.full_desc);
                } else if (skill.limited_units && skill.limited_units.length > 0) {
                    restrictedSkills.push(skill);
                } else {
                    var effectsNotTreated = [];
                    for (var rawEffectIndex in skill.effects) {
                        rawEffect = [
                            targetAreaMap[skill.effects[rawEffectIndex].target_area],
                            targetSideMap[skill.effects[rawEffectIndex].target_side],
                            skill.effects[rawEffectIndex].passive_id,
                            skill.effects[rawEffectIndex].params
                        ];

                        // Mastery (+X% stat if equiped with ...)
                        if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                            masterySkills.push(rawEffect[3]);
                            
                        } else {
                            if (!addEffectToItem(itemOut, skill, rawEffectIndex, skills, magics)) {
                                effectsNotTreated.push(rawEffectIndex)
                                console.log(skill.id + " - " + rawEffect + " - " + skill.full_desc);
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
        
        for (var masteryIndex in masterySkills) {
            var lenght = result.length;
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                if (!result[itemIndex].equipedConditions || result[itemIndex].equipedConditions.length < 2) {
                    var copy = JSON.parse(JSON.stringify(result[itemIndex]));
                    addMastery(copy, masterySkills[masteryIndex]);
                    result.push(copy);
                }
            }
            if (emptyItem) {
                var copy = JSON.parse(JSON.stringify(itemOut));
                addMastery(copy, masterySkills[masteryIndex]);
                result.push(copy);
            }
        }
        for (var restrictedIndex in restrictedSkills) {
            var skill = restrictedSkills[restrictedIndex];
            var effectsNotTreated = [];
            var lenght = result.length;
            for (var itemIndex = 0; itemIndex < lenght; itemIndex++) {
                var copy = JSON.parse(JSON.stringify(result[itemIndex]));
                var unitFoud = false;
                for (var restrictedUnitIndex in skill.limited_units) {
                    addExclusiveUnit(copy, skill.limited_units[restrictedUnitIndex]);
                    unitFoud = true;
                }
                if (!unitFoud) { console.log("No units found in " + JSON.stringify(skill.unit_restriction) + " for skill " + skill.name );}
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skill.effects_raw[rawEffectIndex];
                    if (!addEffectToItem(copy, skill, rawEffectIndex, skills, magics)) {
                        effectsNotTreated.push(rawEffectIndex);
                    }
                }
                addNotTreatedEffects(copy, effectsNotTreated, skill);
                result.push(copy);
            }
            if (emptyItem) {
                var copy = JSON.parse(JSON.stringify(itemOut));
                var unitFoud = false;
                for (var restrictedUnitIndex in skill.unit_restriction) {
                    if (unitNamesById[skill.unit_restriction[restrictedUnitIndex]]) {
                        addExclusiveUnit(copy, unitNamesById[skill.unit_restriction[restrictedUnitIndex]].name);
                        unitFoud = true;
                    }
                }
                if (!unitFoud) { console.log("No units found in " + JSON.stringify(skill.unit_restriction) + " for skill " + skill.name );}
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skill.effects_raw[rawEffectIndex];
                    if (!addEffectToItem(copy, skill, rawEffectIndex, skills, magics)) {
                        effectsNotTreated.push(rawEffectIndex);
                    }
                }
                addNotTreatedEffects(copy, effectsNotTreated, skill);
                result.push(copy);
            }
        }
    } else {
        result.push(itemOut);
    }
    return result;
}

function addNotTreatedEffects(itemOut, effectsNotTreated, skill) {
    addSpecial(itemOut, skill.full_desc);
}

function addEffectToItem(item, skill, rawEffectIndex, skills, magics) {
    rawEffect = [
        targetAreaMap[skill.effects[rawEffectIndex].target_area],
        targetSideMap[skill.effects[rawEffectIndex].target_side],
        skill.effects[rawEffectIndex].passive_id,
        skill.effects[rawEffectIndex].params
    ];
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
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) {
        addKiller(item, rawEffect[3][0],rawEffect[3][1],rawEffect[3][2]);

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
        var desc;
        if (skills[rawEffect[3][0]]) {
            desc = skills[rawEffect[3][0]].full_desc;
        } else {
            desc = magics[rawEffect[3][0]].full_desc;
        }
        addSpecial(item, "Gain at the start of a battle: " + desc);

    // Element Resist
    } else if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
        addElementalResist(item, rawEffect[3]);

    // Ailments Resist
    } else if (!skill.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
        addAilmentResist(item, rawEffect[3]);

    // Equip X
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 5) {
        item.allowUseOf = typeMap[rawEffect[3]];
        
    // Doublehand
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
        if (rawEffect[3][2] == 0) {
            if (!item.singleWieldingOneHanded) {item.singleWieldingOneHanded = {}};
            addStat(item.singleWieldingOneHanded,"atk",rawEffect[3][0]);    
        } else if (rawEffect[3][2] == 2) {
            if (!item.singleWielding) {item.singleWielding = {}};
            addStat(item.singleWielding,"atk",rawEffect[3][0]);    
        }
        addStat(item,"accuracy",rawEffect[3][1]);
    
        
    // MP refresh
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
        var mpRefresh = rawEffect[3][0];
        addStat(item, "mpRefresh", mpRefresh);
        
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
    return skill.full_desc;
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
    item.equipedConditions.push(typeMap[mastery[0]]);
    addStat(item, "atk%", mastery[1]);
    addStat(item, "def%", mastery[2]);
    addStat(item, "mag%", mastery[3]);
    addStat(item, "spr%", mastery[4]);
}

function addExclusiveUnit(item, unitId) {
    if (!item.exclusiveUnits) {
        item.exclusiveUnits = [];
    }
    item.exclusiveUnits.push(unitId);
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
    if (item.resist) {
        return false;
    }
    return true;
}

function addAccess(item, access) {
    if (!item.access) {
        item.access = [];
    }
    item.access.push(access);
}

function formatOutput(items) {
    var properties = ["id","name","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","singleWieldingOneHanded","singleWielding","accuracy","damageVariance","element","partialDualWield","resist","ailments","killers","mpRefresh","special","allowUseOf","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","maxNumber","eventName","icon","sortId"];
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
