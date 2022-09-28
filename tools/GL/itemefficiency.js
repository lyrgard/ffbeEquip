import fs from 'fs'


let visionCards = JSON.parse(fs.readFileSync('./sources/vision_cards.json', (err) => {
    if (err) {
        console.log(err);
    }
}))

let skills = JSON.parse(fs.readFileSync('./sources/skills_ability.json', (err) => {
    if (err) {
        console.log(err);
    }
}))

let magic = JSON.parse(fs.readFileSync('./sources/skills_magic.json', (err) => {
    if (err) {
        console.log(err);
    }
}))

let passives = JSON.parse(fs.readFileSync('./sources/skills_passive.json', (err) => {
    if (err) {
        console.log(err);
    }
}))

Object.keys(skills).forEach(skillId => {
    skills[skillId].active = true;
    skills[skillId].type = "ABILITY";
});
Object.keys(magic).forEach(skillId => {
    skills[skillId] = magic[skillId];
    skills[skillId].active = true;
    skills[skillId].type = "MAGIC";
});
Object.keys(passives).forEach(skillId => {
    skills[skillId] = passives[skillId];
    skills[skillId].active = false;
    skills[skillId].type = "PASSIVE";
});

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
        // Killers
    } else if (((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) ||
        (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 11)) {
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
        addSpecial(item, "Gain at the start of a battle: " + getSkillString(skills[rawEffect[3][0]]));

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
        
    } else {
        return false;
    }
    return true;
}

function getStatBonusCap(stat) {
    switch(stat) {
        case 'lbDamage':
            return 300;
        case 'lbPerTurn':
            return 12;
        case 'lbFillRate': // removed bugged support.
            return 1000;
        case 'tdh':
            return 400;
        case 'tdw':
            return 200;
        case 'jumpDamage':
            return 800;
        case 'evoMag':
            return 300;
        case 'evokeDamageBoost.all':
            return 300;
        default:
            return 400;
    }
}

let HPArray = [];

Object.keys(visionCards).forEach((value) => {
    let currentVC = visionCards[value];
    if (currentVC.stats.ATK[1] > 0) {
        let HPInfoObject = {
            "Name": currentVC.name,
            "MaxATK": visionCards[value].stats.ATK[1],
            "Total": 0,
            "Percentage" : 0
        }
        
        console.log(currentVC.name)
        //console.log(currentVC.stats)
        console.log(currentVC?.skills)
        if (Object.keys(currentVC.skills).length > 0) {

            Object.keys(currentVC.skills).forEach((keyId) => {
                let skillArray = currentVC.skills[keyId]
                let newFlat = 0;
                let newPercentage = 0;
    
                skillArray.forEach((skill) => {
                    Object.keys(skills).forEach((skillId) => {
                        if (skill == skillId) {
                            //console.log(skills[skill].effects)
                            console.log(skills[skill].effects_raw)
                            let rawEffect = skills[skill].effects_raw[0]
                            if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 89) {
                                if (rawEffect[2][0] > 0) {
                                    console.log("More Flat HP")
                                    newFlat += rawEffect[2][0];

                                }
                            } 
                            
                            if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {
                                if (rawEffect[3][0] > 0) {
                                    console.log("HP%")
                                    newPercentage += rawEffect[3][0];
                                    HPInfoObject.Percentage = newPercentage;
                                }
                            }
                        }
                    })
                })

                console.log(newFlat);
                console.log(newPercentage)
                let flatHealth = HPInfoObject.MaxATK;
                if (newFlat > 0 || newPercentage > 0) {
                    HPInfoObject["Total"] = flatHealth + newFlat + (flatHealth * (newPercentage / 100));
                } else {
                    HPInfoObject["Total"] = flatHealth
                }
            })
        } else {
            HPInfoObject["Total"] = visionCards[value].stats.ATK[1];
        }

        HPArray.push(HPInfoObject)
    }

   
})

//console.log(HPArray)

HPArray.sort((a, b) => (a["Percentage"] < b["Percentage"]) ? 1 : -1)

console.log(HPArray)

