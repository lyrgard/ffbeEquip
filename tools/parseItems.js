var fs = require('fs');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "thunder", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrify"];

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

var skillNotIdentifiedNumber = 0;

fs.readFile('equipment.json', function (err, content) {
    var items = JSON.parse(content);
    fs.readFile('skills.json', function (err, content) {
        var skills = JSON.parse(content);
        var result = [];
        for (var itemId in items) {
            var itemIn = items[itemId];
            var itemOut = {};
            itemOut.id = itemId;
            itemOut.name = itemIn.name;
            itemOut.type = typeMap[itemIn.type_id];
            readStats(itemIn, itemOut);
            if (itemIn.is_twohanded) {
                addSpecial(itemOut,"twoHanded");
            }
            readSkills(itemIn, itemOut,skills);
            result.push(itemOut);
        }
        console.log(skillNotIdentifiedNumber);
        fs.writeFileSync('output.json', JSON.stringify(result).replace(/\},\{/g, '},\n\t{').replace(/^\[/g, '[\n\t').replace(/\]$/g, '\n]'));
    });
});

function readStats(itemIn, itemOut) {
    for (var statsIndex in stats) {
        var stat = stats[statsIndex];
        if (itemIn.stats[stat] != 0) {
            itemOut[stat.toLowerCase()] = itemIn.stats[stat];
        }    
    }
    if (itemIn.stats.element_inflict) {
        itemOut.element = itemIn.stats.element_inflict[0];
    }
    if (itemIn.stats.element_resist) {
        itemOut.resist = [];
        for (var element in itemIn.stats.element_resist) {
            itemOut.resist.push({"name":element.toLowerCase(),"percent":itemIn.stats.element_resist[element]})
        }
    }
    if (itemIn.stats.status_resist) {
        if (!itemOut.resist) {
            itemOut.resist = [];
        }
        for (var status in itemIn.stats.status_resist) {
            itemOut.resist.push({"name":status.toLowerCase(),"percent":itemIn.stats.status_resist[status]})
        }
    }   
    if (itemIn.stats.status_inflict) {
        itemOut.ailments = [];
        for (var status in itemIn.stats.status_inflict) {
            itemOut.ailments.push({"name":status.toLowerCase(),"percent":itemIn.stats.status_inflict[status]})
        }
    }
}

function readSkills(itemIn, itemOut, skills) {
    if (itemIn.skills) {
        for (var skillIndex in itemIn.skills) {
            var skillId = itemIn.skills[skillIndex];
            var skill = skills[skillId];
            if (skill) {
                if (skill.type == "MAGIC") {
                    addSpecial(itemOut, getSkillString(skill));
                } else {
                    for (var rawEffectIndex in skill.effects_raw) {
                        rawEffect = skill.effects_raw[rawEffectIndex];

                        // + X % to a stat
                        if (rawEffect[1] == 3 && rawEffect[2] == 1 && (rawEffect[0] == 0 || rawEffect[0] == 1)) {
                            var effectData = rawEffect[3]            
                            addStat(itemOut, "hp%", effectData[4]);
                            addStat(itemOut, "mp%", effectData[5]);
                            addStat(itemOut, "atk%", effectData[0]);
                            addStat(itemOut, "def%", effectData[1]);
                            addStat(itemOut, "mag%", effectData[2]);
                            addStat(itemOut, "spr%", effectData[3]);

                        // DualWield
                        } else if (rawEffect[1] == 3 && rawEffect[2] == 14 && (rawEffect[0] == 0 || rawEffect[0] == 1)) {
                            if (rawEffect[3].length == 1 && rawEffect[3][0] == "none") {
                                addSpecial(itemOut,"dualWield");
                            } else {
                                itemOut.partialDualWield = [];
                                for (var dualWieldType in rawEffect[3]) {
                                    var typeId = rawEffect[3][dualWieldType];
                                    itemOut.partialDualWield.push(typeMap[typeId]);
                                }
                            }

                        /*// Killers
                        } else if (effect[1] == 3 && effect[2] == 11 && (effect[0] == 0 || effect[0] == 1) or
                    (effect[0] == 1 and effect[1] == 1 and effect[2] == 11)):
                    killerEffect = effect[3]

                    killerType = killerEffect[0]
                    if killerType in killerDict:
                        killerData = killerDict[killerType]
                    else:
                        killerData = KillerBonus()

                    killerData.Phys += killerEffect[1]
                    killerData.Mag += killerEffect[2]
                    killerDict[killerType] = killerData*/

                        // killers
                        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) {
                            addKiller(itemOut, rawEffect[3][0],rawEffect[3][1],rawEffect[3][2]);
                            
                        // evade
                        } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 22) {
                            if (!itemOut.evade) {
                                itemOut.evade = {};
                            }
                            itemOut.evade.physical = rawEffect[3][0];    
                        
                        // Auto- abilities
                        } else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 35) {
                            addSpecial(itemOut, "Gain at the start of a battle: " + getSkillString(skills[rawEffect[3][0]]));
                            
                        // Element Resist
                        } else if (rawEffect[0] == 0 && rawEffect[1] == 3 && rawEffect[2] == 3) {
                            addElementalResist(itemOut, rawEffect[3]);
                        
                        // Ailments Resist
                        } else if (rawEffect[0] == 0 && rawEffect[1] == 3 && rawEffect[2] == 2) {
                            addAilmentResist(itemOut, rawEffect[3]);
                        
                        // Equip X
                        } else if (rawEffect[0] == 0 && rawEffect[1] == 3 && rawEffect[2] == 5) {
                            itemOut.allowUseOf = typeMap[rawEffect[3]];
                            
                        } else {
                            console.log(rawEffect + " : " + skill.name + " - " + skill.effects[rawEffectIndex]);
                            skillNotIdentifiedNumber++;
                        }            
                    }
                }
            }
        }
    }
}

function addSpecial(itemOut, special) {
    if (!itemOut.special) {
        itemOut.special = [];
    }
    itemOut.special.push(special);
}

function addStat(itemOut, stat, value) {
    if (value != 0) {
        if (!itemOut[stat]) {
            itemOut[stat] = 0;
        }
        itemOut[stat] += value;
    }
}

function addKiller(itemOut, raceId, physicalPercent, magicalPercent) {
    var race = raceMap[raceId];
    if (!itemOut.killers) {
        itemOut.killers = [];
    }
    var killer = {"name":race};
    if (physicalPercent) {
        killer.physical = physicalPercent;
    }
    if (magicalPercent) {
        killer.magical = magicalPercent;
    }
    itemOut.killers.push(killer);
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
        effect += skill.effects[effectIndex];
    }
    return "[" + skill.name + "]: " + effect;
}

function addElementalResist(itemOut, values) {
    if (!itemOut.resist) {
        itemOut.resist = [];
    }
    for (var index in elements) {
        if (values[index]) {
            itemOut.resist.push({"name":elements[index],"percent":values[index]})
        }
    }
}

function addAilmentResist(itemOut, values) {
    if (!itemOut.resist) {
        itemOut.resist = [];
    }
    for (var index in ailments) {
        if (values[index]) {
            itemOut.resist.push({"name":ailments[index],"percent":values[index]})
        }
    }
}