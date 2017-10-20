var fs = require('fs');
var request = require('request');

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

filterGame = [20001, 20002, 20006, 20007, 20008, 20011, 20012];

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;


console.log("Starting");
request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/units.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("units.json downloaded");
        var units = JSON.parse(body);
        request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/skills.json', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("skills.json downloaded");
                var skills = JSON.parse(body);
                request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/enhancements.json', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("enhancements.json downloaded");
                        var enhancements = JSON.parse(body);
                        
                        for (var index in enhancements) {
                            var enhancement = enhancements[index];
                            for (var unitId in enhancement.units) {
                                if (!enhancementsByUnitId[unitId]) {
                                    enhancementsByUnitId[unitId] = {};
                                }
                                enhancementsByUnitId[unitId][enhancement.skill_id_old] = enhancement.skill_id_new;
                            }
                        }
                
                        var unitsOut = {};
                        for (var unitId in units) {
                            var unitIn = units[unitId];
                            if (!filterGame.includes(unitIn["game_id"])) {
                                var unitOut = treatUnit(unitId, unitIn, skills, enhancementsByUnitId);
                                unitsOut[unitOut.name] = unitOut.data;
                            }
                        }

                        fs.writeFileSync('unitsWithSkill.json', JSON.stringify(unitsOut));
                    }
                });
            }
        });
    }
});

function treatUnit(unitId, unitIn, skills, enhancementsByUnitId) {
    var unit = {};
    unit.name = unitIn.name;
    unit.data = {};
    var data = unit.data;
    
    data["max_rarity"] = unitIn["rarity_max"];
    data["stats"] = getStats(unitIn, data["max_rarity"]);
    data["sex"] = unitIn.sex.toLowerCase();
    data["equip"] = getEquip(unitIn.equip);
    data.skills = getPassives(unitId, unitIn.skills, enhancementsByUnitId[unitId])
    return unit;
}

function getStats(unitIn, maxRarity) {
    var unitStats = {"maxStats":{}, "pots":{}};
    for (entryId in unitIn.entries) {
        if (unitIn.entries[entryId].rarity == maxRarity) {
            unitData = unitIn.entries[entryId];
            for (var statIndex in stats) {
                var stat = stats[statIndex];
                unitStats.maxStats[stat.toLowerCase()] = unitData["stats"][stat][1];
                unitStats.pots[stat.toLowerCase()] = unitData["stats"][stat][2];
            }
            break;
        }
    }
    return unitStats;
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

function getPassives(unitId, skillsIn, enhancements) {
    var skills = [];
    return skills;
}

function formatOutput(units) {
    var properties = ["id","name","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","doubleHand","trueDoubleHand","accuracy","damageVariance","element","partialDualWield","resist","ailments","killers","special","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","icon"];
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