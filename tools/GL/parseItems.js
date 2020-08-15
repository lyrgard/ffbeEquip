var fs = require('fs');
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

let moveTypes = {
    0: "none",
    1: "walk",
    2: "walk",
    3: "warp",
    4: "none",
    5: "dash",
    6: "dashThrough"
}

let chainingFamilies = {
    "none,42,48,54,60,66,72,78,84,90": "BS",            // Boltinng Strike
    "none,70,77,82,89,96,103,110": "DR",                // Divine Ruination
    "none,70,76,82,88,94,100,106,112":"AMoE",             // Absolute Mirror of Equity
    "walk,2,10,18,26,34,42,50":"Pd",                    // Piledriver
    "none,22,27,32,37,42,47,52,57,62,67,72,92":"QH",    // Quick Hit
    "none,42,49,56,63,70,77,84,91,98,105,112,119":"OnS", // Onion Slice
    "none,42,52,62,72,82,92,102,112":"OcS",              // Octaslash
    "none,42,46,50,54,58,62,66,70,74,78,82,86,90,94,98,102,106,110,114,118,122,126,130,134,138,142,146,150,154,158":"AR", // Aureole Ray
    "none,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230":"GC",  // Short-Range Graviton
    "none,110,120,130,140,150,160,170,180,190,200":"SR",// Stardust Ray
    "none,42,50,58,66,74,82,98":"Cs",                   // Chainsaw
    "none,82,90,98,106,114,122,130,138":"KG",           // Kingsglaive   
    "none,212,200,188,176,164,152,140,128,116,104,92,80": "Tnd", // Tornado
    "none,133,145,157,169,181,193,205,217,229,241,253,265": "Fld", // Flood
    "none,140,154,168,182,196,210,225,240": "Frz",        // Freeze
    "none,52,72,92,112,132": "CW",                      // Chaos Wave
    "none,92,102,112,122,132,142,152,162": "FB",        // Fatal Barrage
    "none,42,52,62,72,82,92,102": "SoK",                 // Sword of King
    "none,42,47,52,57,62,67,72,77,82,87": "Dsd",         // Disorder
    "none,42,52,62,72,82,92": "FP",                     // Firm Punch
    "none,42,50,58,66,74,82,90,98": "FE",               // Free Energy
    "none,84,92,100,108,116,124,132,140": "MR",         // Meteor Rain
    "none,40,45,50,55,60,65,70,75,80,85,90": "AZ",      // Absolute Zero
    "none,2,12,22,32,42": "Ryu",                         // Ryujin
    "none,42,62,82,102,122,142,162,182": "CWA"               // Chaos Wave Awakened
}

const languages = ["en", "zh", "ko", "fr", "de", "es"];

const jpExclusiveItemIds = ["403044000", "404002700", "407002900", "301002700", "302004800", "311003200", "310003200", "312002000", "302005200", "310003500", "504227640", "405006100", "304004400", "409027300", "402003300", "403046700", "310005800", "409037500", "504233711", "301005400", "409037600", "504230014", "504227428", "303004700", "504227448", "504227459", "409020700", "504228470", "313004600", "313004700", "409023700", "311004000", "313004500", "405007200", "409033200", "310005500", "409033300", "504233410", "409037000", "409037100", "403049600", "408005800", "316002100", "308003700", "301002800", "409018100", "408003100", "403044300", "403044200", "311003300", "409018200", "301002900", "309002300", "314001300", "504227328", "401002400", "403045000", "405005000", "311003600", "504229431", "504229432", "504229433", "504229434", "409026100", "403046400", "402003200", "309004000", "306002600", "409026200", "409035300", "402004400", "405007800", "405007900", "504232801", "409035400", "409035500", "404004300", "404004400", "302011700", "504234020", "504234021", "310007200", "409038400", "403049900", "408005900", "302011800", "303003100", "302003600", "302003700", "403043100", "406002500", "407002100", "504230245", "504230244", "305002000", "311002300", "409013200", "409013300", "301002400", "302004100", "309002100", "403043700", "404002500", "407002500", "405004200", "409016600", "504220280", "504220270", "504220630", "504220620", "309003500", "504228287", "504228277", "504220290", "409033900", "302010100", "408005400", "504232281", "302010000", "311005200", "301002600", "302004600", "302004700", "303003800", "304002300", "311003100", "403044100", "408002900", "408003000", "402002400", "409017500", "409017600", "409017600", "504221650", "504221660", "504230373", "303006100", "504230374", "310007200", "408004500", "302011000", "504233250", "303007200", "409036700", "310006500", "302011200", "303007300", "310006600", "504230243", "303006000", "504214720", "305001100", "308001600", "303002800", "305001800", "312001700", "304001600", "406002400", "406002300", "406002200", "406002100", "404002000", "404001900", "404001800", "403042500", "409012400", "409012200", "409012000", "409012300", "409012100", "409012500", "308002700", "303002700", "504213220", "504213230", "504213210", "301002500", "504235124", "409041400"];

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

let notParsedSkillType = {};
let currentItemName;

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
                                                                fs.readFile('../../static/JP/data.json', function (err, content) {
                                                                    var jpItems = JSON.parse(content);
                                                                    fs.readFile('../../static/JP/units.json', function (err, content) {
                                                                        var jpUnits = JSON.parse(content);
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
                                                                                if (!jpExclusiveItemIds.includes(itemId)) {
                                                                                    treatItem(items, itemId, result, skills);
                                                                                }
                                                                            }
                                                                            for (var materiaId in materias) {
                                                                                if (!jpExclusiveItemIds.includes(materiaId)) {
                                                                                    treatItem(materias, materiaId, result, skills);
                                                                                }
                                                                            }
                                                                            console.log(skillNotIdentifiedNumber);
                                                                            console.log(result.items.length);


                                                                            let glItemIds = result.items.map(item => item.id);
                                                                    
                                                                    
                                                                            
                                                                            jpItems
                                                                                .filter(item => !glItemIds.includes(item.id) && !jpExclusiveItemIds.includes(item.id))
                                                                                .forEach(item => {
                                                                                if (item.type == 'materia' && (!item.special || !item.special.includes('notStackable'))) {
                                                                                    if (!item.special) {
                                                                                        item.special = [];
                                                                                    }
                                                                                    item.special.push('notStackable');
                                                                                }
                                                                                item.access.push('not released yet');

                                                                                result.items.push(item);
                                                                            });

                                                                            result.items.forEach(item => {
                                                                                if (item.access.includes("unknown") && !item.access.includes("not released yet")) {
                                                                                    item.access.push("not released yet")
                                                                                }
                                                                            });
                                                                            
                                                                            var filename = 'data.json';
                                                                            if (languageId != 0) {
                                                                                filename = 'data_' + languages[languageId] + '.json';
                                                                            }
                                                                            fs.writeFileSync(filename, formatOutput(result.items));
                                                                    
                                                                        }
                                                                        Object.keys(notParsedSkillType).forEach(key => {
                                                                            console.log(key + ' - ' + notParsedSkillType[key].length + ' - ' + notParsedSkillType[key]);
                                                                        });
                                                                        console.log(Math.round(Object.keys(notParsedSkillType).reduce((acc, key) => acc + notParsedSkillType[key].length, 0)));
                                                                    });
                                                                });
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
    currentItemName = itemOut.name;
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
            var skillId = itemIn.skills[skillIndex].toString();
            var skill = skills[skillId];

            if (skill) {
                skill.id = skillId;
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
                    skill = parseActiveSkill(skillId, skills[skillId], skills);
                    if (!itemOut.skills) {
                        itemOut.skills = [];
                    }
                    itemOut.skills.push(skill);
                } else if (skill.unit_restriction) {
                    restrictedSkills.push(skill);
                } else if (skill.effects_raw[0][2] == 74) {
                    // item set
                    itemSetSkills.push(skill);
                } else {
                    var effectsNotTreated = [];
                    if (!skill.active) {
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
                    } else {
                        
                        skill = parseActiveSkill(skillId, skills[skillId], skills);
                        if (!itemOut.skills) {
                            itemOut.skills = [];
                        }
                        itemOut.skills.push(skill);
                    }
                    addNotTreatedEffects(itemOut, effectsNotTreated, skill, skillId);
                }
            } else {
                console.log('Unknown skill ' + skillId + ' for ' + itemIn.name);
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
        if (addMastery(copy, masterySkills[masteryIndex])) {
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
                let raw = skill.effects_raw[effectsNotTreated[index]];
                if (!notParsedSkillType[raw[2]]) {
                        notParsedSkillType[raw[2]] = [];
                }
                notParsedSkillType[raw[2]].push(currentItemName + '*');
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
    } else if (rawEffect[2] == 35) {
        var skillIn = skills[rawEffect[3][0]];
        if (skillIn) {
            var autoCastedSkill = parseActiveSkill(rawEffect[3][0].toString(), skillIn, skills);
            if (!item.autoCastedSkills) {
                item.autoCastedSkills = [];
            }
            item.autoCastedSkills.push(autoCastedSkill);
        }

    // Auto- abilities
    } else if (rawEffect[2] == 49) {
        var skillIn = skills[rawEffect[3][2]];
        if (skillIn) {
            var counterSkill = parseActiveSkill(rawEffect[3][2].toString(), skillIn, skills);
            if (!item.counterSkills) {
                item.counterSkills = [];
            }
            var counter = {counter:'physical', chance:rawEffect[3][0], skill:counterSkill};
            if (rawEffect[3].length > 3 && rawEffect[3][3]) {
                counter.maxTime = rawEffect[3][3]
            }
            item.counterSkills.push(counter);
        }
        
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

        // Multicast magic
    } else if (rawEffect[2] == 52) {
        let skill = parseActiveSkill(rawEffect[3][2], skills[rawEffect[3][2]], skills);
        var magicType = "";
        if (rawEffect[3][0] ==  0) {
            skill.effects[0].effect.multicast.type = "magic";
        } else if (rawEffect[3][0] ==  1) {
            skill.effects[0].effect.multicast.type = "blackMagic";
        } else if (rawEffect[3][0] ==  2) {
            skill.effects[0].effect.multicast.type = "whiteMagic";
        }
        skill.effects[0].effect.multicast.time = rawEffect[3][1];
        if (!item.skills) {
            item.skills = [];
        }
        item.skills.push(skill);
        
    // Guts
    } else if (rawEffect[2] == 51) {
        item.guts = {ifHpOver:rawEffect[3][0], chance:rawEffect[3][1], time:rawEffect[3][3]};
    
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
        
    // Cast at start of turn
    } else if (rawEffect[2] == 66) {
        let skill = parseActiveSkill(rawEffect[3][0], skills[rawEffect[3][0]], skills);
        if (!item.startOfTurnSkills) {
            item.startOfTurnSkills = [];
        }
        item.startOfTurnSkills.push({chance: rawEffect[3][1], skill:skill});
        
    
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


function parseActiveSkill(skillId, skillIn, skills, unit, enhancementLevel = 0) {
    var skill = {"id": skillId , "name" : skillIn.name, "icon": skillIn.icon, "effects": []};
    if (skillIn.type == "MAGIC") {
        skill.magic = skillIn.magic_type.toLocaleLowerCase();
    }
    if (enhancementLevel) {
        skill.name += " +" + enhancementLevel;
    }
    
    for (var rawEffectIndex in skillIn["effects_raw"]) {
        var rawEffect = skillIn["effects_raw"][rawEffectIndex];

        var effect = parseActiveRawEffect(rawEffect, skillIn, skills, unit, skillId, enhancementLevel);
        if (effect && effect.id) {
            if (skillIn["effects_raw"].lenght > 1) {
                console.error("Exited skill before parsing all effects");
                console.error(skillIn);
            }
            return effect;
        }
        if (!effect || effect.noUse) {
            if (!notParsedSkillType[rawEffect[2]]) {
                    notParsedSkillType[rawEffect[2]] = [];
            }
            notParsedSkillType[rawEffect[2]].push(currentItemName + '!!');
        }
        if (effect && (effect.damage || effect.heal)) {
            effect.frames = getArrayValueAtIndex(skillIn.attack_frames, rawEffectIndex);
            effect.repartition = getArrayValueAtIndex(skillIn.attack_damage, rawEffectIndex, 100);
        }
        skill.effects.push({"effect":effect, "desc": skillIn.effects[rawEffectIndex]});
    }
    addChainInfoToSkill(skill, skill.effects, skillIn.attack_frames, skillIn.move_type, skills);
    if (skill.magic_type) {
        skill.type = skill.magic_type.toLowerCase() + 'Magic';
    } else {
        skill.type = "ability";
    }
    if (skillIn.cost && skillIn.cost.MP) {
        skill.mpCost = skillIn.cost.MP;
    }
    return skill;
}

function getValueAtIndex(array, index) {
    if (!Array.isArray(array)) {
        array = [array];
    }
    if (index < array.length) {
        return array[index];
    } else {
        return array[array.length - 1];
    }
}

function getArrayValueAtIndex(array, index, defaultValue = 0) {
    let value = getValueAtIndex(array, index);
    if (!Array.isArray(value)) {
        value = [value];
    }
    if (value.length == 0) {
        value = [defaultValue];
    }
    return value;
}

function addChainInfoToSkill(skill, effects, attackFrames, moveType, skills) {
    let hasDamage = false;
    let chain = [];
    let attackFrameIndex = 0;
    effects.forEach((effect) => {
        if (effect.effect && effect.effect.damage) {
            hasDamage = true;
            chain = chain.concat(attackFrames[attackFrameIndex]);
            attackFrameIndex++;
        }
    });
    if (hasDamage) {
        skill.frames = chain;
        let chainId = moveTypes[moveType] + ',' + chain.join(',');
        if (chainingFamilies[chainId]) {
            skill.chainFamily = chainingFamilies[chainId];
        }
        skill.move = moveTypes[moveType];
    }
}

function parseActiveRawEffect(rawEffect, skillIn, skills, unit, skillId, enhancementLevel = 0) {
    var result = null;

    // break
    if (rawEffect[2] == 24) {
        result = {};
        if (rawEffect[1] == 1) {
            addBreak(result, rawEffect[3]);
        } else {
            addStatsBuff(result, rawEffect[3]);
        }

    // Randomly use skills
    } else if (rawEffect[2] == 29) {
        result = {"randomlyUse": []};
        for (var i = 0, len = rawEffect[3].length; i < len; i++) {
            var data = rawEffect[3][i];
            if (data && data[0] && skills[data[0]]) {
                var skillIn = skills[data[0]];
                var skill = parseActiveSkill(data[0], skillIn, skills, unit);
                result.randomlyUse.push({"skill":skill, "percent":data[1]});
            }
        }

    // Imperil
    } else if (rawEffect[2] == 33) {
        result = {};
        var imperilData = rawEffect[3];
        if (rawEffect[1] == 1) {
            addImperil(result, imperilData);
        } else {
            addElementalResist(result, imperilData);
            result.turns = imperilData[9];
        }

    // Status ailment resistance
    } else if (rawEffect[2] == 7) {
        result = {};
        var ailmentsData = rawEffect[3];
        addAilmentResist(result, ailmentsData);
        result.turns = ailmentsData[9];

    // Break, stop and charm resistance with turn number
    } else if (rawEffect[2] == 89 || rawEffect[2] == 55) {
        result = {resist:[]};
        if (rawEffect[3][0]) {
            result.resist.push({"name":"break_atk", "percent":rawEffect[3][0]})
        }
        if (rawEffect[3][1]) {
            result.resist.push({"name":"break_def", "percent":rawEffect[3][1]})
        }
        if (rawEffect[3][2]) {
            result.resist.push({"name":"break_mag", "percent":rawEffect[3][2]})
        }
        if (rawEffect[3][3]) {
            result.resist.push({"name":"break_spr", "percent":rawEffect[3][3]})
        }
        if (rawEffect[3][4]) {
            result.resist.push({"name":"stop", "percent":rawEffect[3][4]})
        }
        if (rawEffect[3][5]) {
            result.resist.push({"name":"charm", "percent":rawEffect[3][5]})
        }
        result.turns = rawEffect[3][6];

    // Killers
    } else if (rawEffect[2] == 92) {
        result = {};
        var killersData = rawEffect[3];
        for (var i = 0; i < 8; i++) {
            if (killersData[i] == -1) {
                break;
            }
            addKiller(result, raceMap[killersData[i][0]], killersData[i][1], 0);
        }
        result.turns = killersData[8];
    } else if (rawEffect[2] == 93) {
        result = {};
        var killersData = rawEffect[3];
        for (var i = 0; i < 8; i++) {
            if (killersData[i] == -1) {
                break;
            }
            addKiller(result, raceMap[killersData[i][0]], 0, killersData[i][1]);
        }
        result.turns = killersData[8];


    // Imbue
    } else if (rawEffect[2] == 95) {
        result = {"imbue":[]};
        var imbueData = rawEffect[3];
        for (var index in elements) {
            if (imbueData[index]) {
                result.imbue.push(elements[index]);
            }
        }
        result.turns = imbueData[8];

    // Cooldown skills
    } else if (rawEffect[2] == 130) {

        let id = parseInt(rawEffect[3][0]);
        var skillIn = skills[id];
        if (skillIn) {
            result = {};
            result.cooldownSkill = parseActiveSkill(id.toString(), skillIn, skills, unit);
            result.cooldownTurns = rawEffect[3][2][0] + 1;
            result.startTurn = result.cooldownTurns - rawEffect[3][2][1];
            if (rawEffect[3][3] == 0) {
                if (result.cooldownSkill.effects.some(e => e.effect && e.effect.damage && e.effect.damage.mecanism == 'physical')) {
                   result.cooldownSkill.preventDualCastWithDualWield = true;
                }
            }
        }

    // Draw attacks
    } else if (rawEffect[2] == 61) {
        result = {"drawAttacks":rawEffect[3][0], "turns": rawEffect[3][1]};

    // Stat buff
    } else if (rawEffect[2] == 3) {
        result = {};
        addStatsBuff(result, rawEffect[3]);

    // AOE Cover
    } else if (rawEffect[2] == 96) {
        result = {"aoeCover":{}, "turns": rawEffect[3][6]};
        result.aoeCover.type = (rawEffect[3][rawEffect[3].length - 1] == 1 ? "physical": "magical");
        result.aoeCover.mitigation = {"min": rawEffect[3][2], "max": rawEffect[3][3]};
        result.aoeCover.chance = rawEffect[3][4];

    // Conditional skills
    } else if (rawEffect[2] == 99) {
        result = {};

        var skillId1 = rawEffect[3][5].toString();
        var skillIn1 = skills[skillId1];
        var skill1 = parseActiveSkill(skillId1, skillIn1, skills, unit, enhancementLevel);

        var skillId2 = rawEffect[3][3].toString();
        var skillIn2 = skills[skillId2];
        var skill2 = parseActiveSkill(skillId2, skillIn2, skills, unit, enhancementLevel);
        skill2.ifUsedLastTurn = [];
        if (Array.isArray(rawEffect[3][1])) {
            for (var i = 0, len = rawEffect[3][1].length; i < len; i++) {
                var skill = skills[rawEffect[3][1][i]];
                skill2.ifUsedLastTurn.push({"id":rawEffect[3][1][i], "name":skill.name});
            }
        } else {
            var skill = skills[rawEffect[3][1]];
            skill2.ifUsedLastTurn.push({"id":rawEffect[3][1], "name":skill.name});
        }
        addUnlockedSkill(skillId1, skill2, unit);
        return skill1;

    // Magical Damage
    } else if (rawEffect[2] == 15) {
        if (rawEffect[3].length != 6 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0) {
            console.log("Strange Magic damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][5]/100}};

    // Physical Damage
    } else if (rawEffect[2] == 1) {
        if (rawEffect[3].length != 7 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0  && rawEffect[3][5] != 0) {
            console.log("Strange Physic damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][6]/100}};

    // Physical Damage with HP sacrifice
    } else if (rawEffect[2] == 81) {
        if (rawEffect[3].length != 7 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0  && rawEffect[3][5] != 0) {
            console.log("Strange Physic damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][6]/100}, hpSacrifice:rawEffect[3][7]};

    // Physical Damage with ignore DEF
    } else if (rawEffect[2] == 21) {
        if (rawEffect[3].length != 4 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0) {
            console.log("Strange Physic damage with ignoe DEF");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][2]/100, "ignore":{"def":-rawEffect[3][3]}}};

    // Magical Damage with ignore SPR
    } else if (rawEffect[2] == 70) {
        if (rawEffect[3].length != 4 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0) {
            console.log("Strange Magic damage with ignoe SPR");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][2]/100, "ignore":{"spr":rawEffect[3][3]}}};

    // Physical Damage from DEF
    } else if (rawEffect[2] == 102) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][2]/100, use: {"stat":"def", "percent":rawEffect[3][0], "max":rawEffect[3][1]}}};

    // Magical Damage from SPR
    } else if (rawEffect[2] == 103) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][2]/100, use: {"stat":"spr", "percent":rawEffect[3][0], "max":rawEffect[3][1]}}};

    // Magical Damage with stacking
    } else if (rawEffect[2] == 72) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":(rawEffect[3][2] + rawEffect[3][3])/100, "stack":rawEffect[3][4]/100, "maxStack":rawEffect[3][5] - 1}};

    // Physical Damage with stacking
    } else if (rawEffect[2] == 126) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":(rawEffect[3][3] + rawEffect[3][4])/100, "stack":rawEffect[3][5]/100, "maxStack":rawEffect[3][6] - 1}};

    // Jump damage
    } else if (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 52) {
        if (rawEffect[3].length != 5 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != rawEffect[3][3]) {
            console.log("Strange Jump damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][4]/100, "jump":true, delay:rawEffect[3][3]}};

    // Delayed damage
    } else if (rawEffect[2] == 13) {
        if (rawEffect[3].length != 6 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0) {
            console.log("Strange Delayed damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][5]/100, delay:rawEffect[3][0]}};

    // Timed Jump
    } else if (rawEffect[2] == 134) {
        if (rawEffect[3].length != 5 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != rawEffect[3][3]) {
            console.log("Strange Timed Jump damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][4]/100, "jump":true, delay:rawEffect[3][2]}};

    // Combo damage
    } else if (rawEffect[2] == 42) {
        if (rawEffect[3].length != 5 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0) {
            console.log("Strange Combo");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][4]/100, "combo": true, "minTime":rawEffect[3][2], "maxTime":rawEffect[3][3]}};

    // Hybrid damage
    } else if (rawEffect[2] == 40) {
        if (rawEffect[3].length != 10 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0 && rawEffect[3][5] != 0 && rawEffect[3][6] != 0 && rawEffect[3][7] != 0 && rawEffect[3][8] != rawEffect[3][9]) {
            console.log("Strange hybrid damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"hybrid", "coef":rawEffect[3][8]/100}};
    // Evo Damage
    } else if(rawEffect[2] == 124){
        result = {"damage":{"mecanism":"summonerSkill", "damageType":"evoke", "magCoef":rawEffect[3][7]/100, "sprCoef":rawEffect[3][8]/100, "magSplit":0.5, "sprSplit":0.5}};
        if (rawEffect[3].length >= 10 && Array.isArray(rawEffect[3][9])) {
            result.damage.magSplit = rawEffect[3][9][0] / 100;
            result.damage.sprSplit = rawEffect[3][9][1] / 100;
        }
    // Healing
    } else if(rawEffect[2] == 2){
        result= {"heal":{"base":rawEffect[3][2], "coef":rawEffect[3][3]/100}}

    // Healing over time
    } else if(rawEffect[2] == 8){
        result={"healOverTurn":{"base":rawEffect[3][2], "coef":rawEffect[3][0]/100}}
        if (rawEffect[3][3] > 0) {
            result.turns = rawEffect[3][3];
        }
        
    // Healing % HP/MP
    } else if(rawEffect[2] == 64){
        result= {"healPercent":{"hp%":rawEffect[3][0], "mp%":rawEffect[3][1]}}
        
    // Damage increased against a race
    } else if (rawEffect[2] == 22) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":1, "ifUsedAgain":{"race":raceMap[rawEffect[3][0]], "coef":rawEffect[3][3]/100}}};

    // Critical Physical Damage
    } else if (rawEffect[2] == 43) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][2]*1.5/100}};
        
    // Self inflict Berserk
    } else if (rawEffect[2] == 68) {
        result = {"berserk":{"percent":rawEffect[3][1], "duration":rawEffect[3][0]}};

    // Cure ailments
    } else if (rawEffect[2] == 5) {
        result = {cureAilments:[]};
        if (rawEffect[3][0]) {
            result.cureAilments.push('poison');
        }
        if (rawEffect[3][1]) {
            result.cureAilments.push('blind');
        }
        if (rawEffect[3][2]) {
            result.cureAilments.push('sleep');
        }
        if (rawEffect[3][3]) {
            result.cureAilments.push('silence');
        }
        if (rawEffect[3][4]) {
            result.cureAilments.push('paralysis');
        }
        if (rawEffect[3][5]) {
            result.cureAilments.push('confuse');
        }
        if (rawEffect[3][6]) {
            result.cureAilments.push('disease');
        }
        if (rawEffect[3][7]) {
            result.cureAilments.push('petrification');
        }
        
    // inflict status
    } else if (rawEffect[2] == 6) {
        result = {inflict:[]};
        if (rawEffect[3][0]) {
            result.inflict.push({name:'poison', percent:rawEffect[3][0]});
        }
        if (rawEffect[3][1]) {
            result.inflict.push({name:'blind', percent:rawEffect[3][1]});
        }
        if (rawEffect[3][2]) {
            result.inflict.push({name:'sleep', percent:rawEffect[3][2]});
        }
        if (rawEffect[3][3]) {
            result.inflict.push({name:'silence', percent:rawEffect[3][3]});
        }
        if (rawEffect[3][4]) {
            result.inflict.push({name:'paralysis', percent:rawEffect[3][4]});
        }
        if (rawEffect[3][5]) {
            result.inflict.push({name:'confuse', percent:rawEffect[3][5]});
        }
        if (rawEffect[3][6]) {
            result.inflict.push({name:'disease', percent:rawEffect[3][6]});
        }
        if (rawEffect[3][7]) {
            result.inflict.push({name:'petrification', percent:rawEffect[3][7]});
        }
        
    // inflict multiple status
    } else if (rawEffect[2] == 34) {
        result = {"noUse":true};
        
    // Remove all debuff
    } else if (rawEffect[2] == 59) {
        result = {dispel:true};
        
    // inflict stop
    } else if (rawEffect[2] == 88) {
        result = {"noUse":true};

        // inflict charm
    } else if (rawEffect[2] == 60) {
        result = {"noUse":true};

        // recover MP
    } else if (rawEffect[2] == 17) {
        result = {"restoreMp":rawEffect[3][0]};

       //Global mitigation
    } else if (rawEffect[2] == 101) {
        result = {"globalMitigation":rawEffect[3][0], "turns":rawEffect[3][1]};
        //Magical mitigation
    } else if (rawEffect[2] == 19) {
        result = {"magicalMitigation":rawEffect[3][0], "turns":rawEffect[3][1]};
        //Physical mitigation
    } else if (rawEffect[2] == 18) {
        result = {"physicalMitigation":rawEffect[3][0], "turns":rawEffect[3][1]};
        // recover HP/MP percentage
    } else if (rawEffect[2] == 65) {
        result = {"noUse":true};

        // auto cast skill later
    } else if (rawEffect[2] == 132) {
        result = {"noUse":true};
        
    // cure breaks
    } else if (rawEffect[2] == 111) {
        result = {"noUse":true};
        
        // auto reraise
    } else if (rawEffect[2] == 27) {
        result = {"autoReraise":rawEffect[3][0], turns:rawEffect[3][1]};
    
        // Dodge x physical attacks
    } else if (rawEffect[2] == 54) {
        result = {"noUse":true};
        
        // HP barrier
    } else if (rawEffect[2] == 127) {
        result = {"noUse":true};
        
        // Restore HP
    } else if (rawEffect[2] == 16) {
        result = {"noUse":true};
        
        // Gain counters when ally is hit
    } else if (rawEffect[2] == 123) {
        result = {"noUse":true};
        
        // Auto KO
    } else if (rawEffect[2] == 35) {
        result = {"noUse":true};
        
        // Dualcast
    } else if (rawEffect[2] == 45) {
        return {
            "multicast": {
                "time": 2,
                "type": "magic"
            }
        };
        
    
    // Dual Black Magic
    } else if (rawEffect[2] == 44) {
        return {
            "multicast": {
                "time": 2,
                "type": "blackMagic"
            }
        }
        
    // +LB damage
    } else if (rawEffect[2] == 120) {
        result = {"statsBuff":{"lbDamage":rawEffect[3][0]}, "turns":rawEffect[3][1]};
        
    // +LB
    } else if (rawEffect[2] == 125) {
        result = {"lbFill":{"min":rawEffect[3][0]/100, "max":rawEffect[3][1]/100}};    
    
        
        
        
    // Gain Skill
    } else if (rawEffect[2] == 97) {
        
        let magicType;
        let magicTypeLabel
        if (rawEffect[3][0] == 0) {
            magicType = "magic";
            magicTypeLabel = "magic";
        } else if(rawEffect[3][0] == 1) {
            magicType = "blackMagic";
            magicTypeLabel = "black magic";
        } else if(rawEffect[3][0] == 2) {
            magicType = "whiteMagic";
            magicTypeLabel = "white magic";
        }
        var gainedSkillId = rawEffect[3][2].toString();
        var gainedSkill = skills[gainedSkillId];
        
        var multicastskill = {
            "id":gainedSkillId,
            "name":gainedSkill.name,
            "icon":gainedSkill.icon,
            "effects":[{
                    "effect":{
                        "multicast":{"time":rawEffect[3][1],"type":magicType}
                    },
                    "desc":"Enable unit to cast " + rawEffect[3][1] + " " + magicTypeLabel + " spells"
            }]
        };
        
        result = {
            "gainSkills": {
                "turns": rawEffect[3][3] - 1,
                "skills": [multicastskill]
            }
        }
        
        addUnlockedSkill(gainedSkillId, multicastskill, unit, skillId);
            
        return result;
        
    // Gain Skill
    } else if (rawEffect[2] == 100) {
        result = {
            "gainSkills": {
                "skills": []
            }
        }
        if (rawEffect > 1) {
           result.gainSkills.turns = rawEffect[3][3] - 1;
        }
        var gainedSkillIds;
        if (Array.isArray(rawEffect[3][1])) {
            gainedSkillIds = rawEffect[3][1];
        } else {
            gainedSkillIds = [rawEffect[3][1]];
        }
        for (var i = 0, len = gainedSkillIds.length; i < len; i++) {
            var gainedSkill = skills[gainedSkillIds[i].toString()];
            var gainedSkillName;
            if (!gainedSkill) {
                gainedSkillName = "UNKNOWN SKILL";
            } else {
                gainedSkillName = gainedSkill.name;
            }
            result.gainSkills.skills.push(parseActiveSkill(gainedSkillIds[i].toString(), gainedSkill, skills, unit));
        }
        
    // Gain Multicast ability
    } else if (rawEffect[2] == 98) {
        var gainedSkillId = rawEffect[3][1].toString();
        
        var gainedSkill = skills[gainedSkillId];
        if (gainedSkill) {
            gainedEffect = {
                "multicast": {
                    "time": rawEffect[3][0],
                    "type": "skills",
                    "skills":[]
                }
            }
            let desc = "Enable unit to use ";
            let skillsDesc = [];
            for (var i = 0, len = rawEffect[3][3].length; i < len; i++) {
                var skill = skills[rawEffect[3][3][i]];
                gainedEffect.multicast.skills.push({"id": rawEffect[3][3][i].toString(), "name":skill.name});
                skillsDesc.push(skill.name + '(' + rawEffect[3][3][i].toString() + ')');
            }
            var parsedSkill = {"name" : gainedSkill.name, "icon": gainedSkill.icon, "effects": [
                {
                    "effect":gainedEffect, 
                    "desc": desc + skillsDesc.join(', ') + ' ' + rawEffect[3][0] + ' times in one turn'
                }
            ]};
            parsedSkill.id = 'unlocked' + JSON.stringify(parsedSkill).hashCode();
            
            addUnlockedSkill(parsedSkill.id, parsedSkill, unit, skillId);

            return {
                "gainSkills": {
                    "turns": rawEffect[3][4] - 1,
                    "skills": [{
                        "id": parsedSkill.id,
                        "name": gainedSkill.name
                    }]
                }
            }
        }
        
    // multicast skills
    } else if (rawEffect[2] == 53 && rawEffect[3].length > 2) {
        
        let result = {
            "multicast": {
                "time": rawEffect[3][0],
                "type": "skills",
                "skills":[]
            }
        }
        for (var i = 0, len = rawEffect[3][3].length; i < len; i++) {
            var skill = skills[rawEffect[3][3][i]];
            if (!skill) {
                console.log('Unknown skill : ' + rawEffect[3][3][i] + ' - ' + JSON.stringify(rawEffect));
                continue;
            }
            result.multicast.skills.push({"id": rawEffect[3][3][i].toString(), "name":skill.name});
        }
        
        return result;
        
    // Multicast magic
    } else if (rawEffect[2] == 52) {    
        var magicType = "";
        if (rawEffect[3][0] ==  0) {
            magicType = "magic";
        } else if (rawEffect[3][0] ==  1) {
            magicType = "blackMagic";
        } else if (rawEffect[3][0] ==  2) {
            magicType = "whiteMagic";
        }
        return {
            "multicast": {
                "time": rawEffect[3][1],
                "type": magicType
            }
        };
    
    // skill enhancement
    } else if (rawEffect[2] == 136) {
        let result = {'skillEnhancement':{}};
        let increase = rawEffect[3][3] / 100;
        let skillIds = rawEffect[3][0];
        if (!Array.isArray(skillIds)) {
            skillIds = [skillIds];
        }
        skillIds.forEach(enhancedSkillId => result.skillEnhancement[enhancedSkillId] = increase);
        result.turn = rawEffect[3][4];
        return result;
    }
    
    if (result && result.damage) {
        if (skillIn.attack_type) {
            result.damage.mecanism = skillIn.attack_type.toLocaleLowerCase();    
        } else {
            result.damage.mecanism = skillIn.damage_type.toLocaleLowerCase();
        }
        if (result.damage.mecanism == "magic") {
            result.damage.mecanism = "magical";
        }
        if(result.damage.damageType == "evoke"){
            result.damage.mecanism = "summonerSkill";
        }
        
        if (skillIn.element_inflict) {
            result.damage.elements = [];
            for (var elementIndex = skillIn.element_inflict.length; elementIndex--;) {
                result.damage.elements.push(skillIn.element_inflict[elementIndex].toLocaleLowerCase());
            }
        }
    }

    if (result) {
        if (rawEffect[0] == 0) {
            result.area = "SELF";
        } else if (rawEffect[0] == 1) {
            result.area = "ST";
        } else if (rawEffect[0] == 2) {
            result.area = "AOE";
        } else {
            result.area = "RND";
        }
        
        if (rawEffect[1] == 0) {
            result.target = "SELF";
        } else if (rawEffect[1] == 1) {
            result.target = "ENEMY";
        } else if (rawEffect[1] == 2) {
            result.target = "ALLY";
        } else if (rawEffect[1] == 3) {
            result.target = "SELF";
            result.area = "SELF";
        } else if (rawEffect[1] == 4) {
            result.target = "ALLY";
        } else if (rawEffect[1] == 5) {
            result.target = "ALLY_BUT_SELF";
        } else if (rawEffect[1] == 6) {
            result.target = "ANY";
        } else {
            console.log("unknown target : " + JSON.stringify(rawEffect));
        }
    }
    return result;
}

function addImperil(item, values) {
    if (!item.imperil) {
        item.imperil = {};
    }
    for (var index in elements) {
        if (values[index]) {
            item.imperil[elements[index]] = -values[index];
            if (values[index] > 0) {
                console.log("Positive imperil !");
                console.log(values);
            }
        }
    }
    item.turns = values[9];
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
    item.turns = values[4];
}

function addStatsBuff(item, values) {
    if (!item.statsBuff) {
        item.statsBuff = {};
    }
    if (values[0]) {
        item.statsBuff.atk = values[0];
    }
    if (values[1]) {
        item.statsBuff.def = values[1];
    }
    if (values[2]) {
        item.statsBuff.mag = values[2];
    }
    if (values[3]) {
        item.statsBuff.spr = values[3];
    }
    if (values[4] > 0) {
        item.turns = values[4];
    }
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
    var properties = ["id","name", "access", "maxNumber", "eventNames", "wikiEntry","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","evade","singleWieldingOneHanded","singleWielding", "dualWielding", "accuracy","damageVariance", "jumpDamage", "lbFillRate", "lbPerTurn", "element","partialDualWield","resist","ailments","killers","mpRefresh","esperStatsBonus","lbDamage", "drawAttacks", "skillEnhancement","special","allowUseOf","guts", "evokeDamageBoost","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit", "stmrUnit" ,"icon","sortId","notStackableSkills", "rarity", "skills", "autoCastedSkills", "counterSkills", "startOfTurnSkills"];
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
