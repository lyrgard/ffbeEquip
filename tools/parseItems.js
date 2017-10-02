var fs = require('fs');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];

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
    60: 'accessory',
}

fs.readFile('equipment.json', function (err, content) {
    var items = JSON.parse(content);
    fs.readFile('skills.json', function (err, content) {
        var skills = JSON.parse(content);
        
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
        }
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
        if (!item.resist) {
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
                for (var rawEffectIndex in skill.effects_raw) {
                    rawEffect = skills.effects_raw[rawEffectIndex];
                    
                    // DualWield
                    if (rawEffect[1] == 3 and rawEffect[2] == 14) and (rawEffect[0] == 0 or rawEffect[0] == 1) {
                        if (rawEffect[3].length == 1 && rawEffect[3][0] == "none") {
                            addSpecial(itemOut,"dualWield");
                        } else {
                            itemOut.partialDualWield = [];
                            for (var dualWieldType in rawEffect[3]) {
                                var typeId = rawEffect[3][dualWieldType];
                                itemOut.partialDualWield.push(typeMap[typeId]);
                            }
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