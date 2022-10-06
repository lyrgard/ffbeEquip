import fs from 'fs'
let visionCards = JSON.parse(fs.readFileSync('./sources/vision_cards.json', (err) => {
    if (err) {
        console.log(err);
    }
}))

let equipment = JSON.parse(fs.readFileSync('./sources/equipment.json', (err) => {
    if (err) {
        console.log(err);
    }
}))

let materia = JSON.parse(fs.readFileSync('./sources/materia.json', (err) => {
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

const statConstants = [
    "HP",
    "MP",
    "ATK",
    "DEF",
    "MAG",
    "SPR"
]

const percentageConstants = [
    "HP%",
    "MP%",
    "ATK%",
    "DEF%",
    "MAG%",
    "SPR%"
]

const typeMap = {
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
//'HP', 'HP%', 'MP', 'MP%', 'ATK', 'ATK%', 'MAG', 'MAG%', 'DEF', 'DEF%', 'SPR', 'SPR%', 'tdh', 'tdw', 'lbDamage', 'dualwield'
let goalCritieria = ['tdw']

let unitCriteria = {
    "baseATK": 430,
    "baseDEF": 308,
    "baseMAG": 175,
    "baseSPR": 258,
    "baseHP": 8878,
    "baseMP": 331,
    "baseATK%": 120,
    "baseDEF%": 120,
    "baseMAG%": 0,
    "baseSPR%": 0,
    "baseHP%": 50,
    "baseMP%": 20,
    "equipATK%": 0,
    "equipDEF%": 0,
    "equipMAG%": 0,
    "equipSPR%": 0,
    "equipHP%": 0,
    "equipMP%": 0,
    "lbDamage": 0
}

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
    stat = stat.toLowerCase();
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

let efficiencyArray = [];

Object.keys(equipment).forEach((value) => {
    let currentItem = equipment[value];
    let efficiencyObject = {}
    
    goalCritieria.forEach((stat) => {
        let flatStat = `flat${stat}`;
        let flatStatEfficiency = `${flatStat}Efficiency`;
        let statMax = getStatBonusCap(stat)
        let baseStat = `base${stat}`

        if (currentItem.stats[stat] > 0) {
            if (efficiencyObject[flatStat] !== undefined) {
                efficiencyObject[flatStat] += currentItem.stats[stat];
            } else {
                efficiencyObject[flatStat] = currentItem.stats[stat];
            }
            
            efficiencyObject[flatStatEfficiency] = efficiencyObject[flatStat] / unitCriteria[baseStat];
        }
        
        if (currentItem.skills && currentItem.skills.length > 0) {
            let currentItemSkills = currentItem.skills;
            currentItemSkills.forEach((skillId) => {
                if (skills[skillId]){

                    let rawEffects = skills[skillId].effects_raw;

                    rawEffects.forEach((rawEffect) => {
                        processRawEffect(stat, efficiencyObject, rawEffect, baseStat, statMax)
                    })
                } 
            })
        }
    })

    if (Object.keys(efficiencyObject).length > 0) {
        efficiencyObject.name = currentItem.name;
        efficiencyArray.push(efficiencyObject)
    }
})

Object.keys(visionCards).forEach((value) => {
    let currentVC = visionCards[value];
    let efficiencyObject = {}
    
    goalCritieria.forEach((stat) => {
        let flatStat = `flat${stat}`;
        let flatStatEfficiency = `${flatStat}Efficiency`;
        let statMax = getStatBonusCap(stat)
        let baseStat = `base${stat}`
        let vcSkills = Object.values((currentVC.skills))

        if (currentVC.stats[stat]?.[1] > 0) {
            if (efficiencyObject[flatStat] !== undefined) {
                efficiencyObject[flatStat] += currentVC.stats[stat][1];
            } else {
                efficiencyObject[flatStat] = currentVC.stats[stat][1];
            }
            
            efficiencyObject[flatStatEfficiency] = efficiencyObject[flatStat] / unitCriteria[baseStat];
        }
        
        if (vcSkills.length > 0) {
            vcSkills.forEach((skillId) => {
                skillId.forEach((levelSkill) => {
                    let currentVCSkill = skills[levelSkill]
                    if (currentVCSkill){
                        let rawEffect = currentVCSkill.effects_raw[0];

                        processRawEffect(stat, efficiencyObject, rawEffect, baseStat, statMax)
                    } 
                })
            })
        }
    })

    if (Object.keys(efficiencyObject).length > 0) {
        efficiencyObject.name = currentVC.name;
        efficiencyArray.push(efficiencyObject)
    }
})

Object.keys(materia).forEach((value) => {
    let currentMateria = materia[value];
    let efficiencyObject = {}
    
    goalCritieria.forEach((stat) => {
        let flatStat = `flat${stat}`;
        let flatStatEfficiency = `${flatStat}Efficiency`;
        let statMax = getStatBonusCap(stat)
        let baseStat = `base${stat}`

        if (currentMateria?.stats?.[stat] > 0) {
            if (efficiencyObject[flatStat] !== undefined) {
                efficiencyObject[flatStat] += currentMateria.stats[stat];
            } else {
                efficiencyObject[flatStat] = currentMateria.stats[stat];
            }
            
            efficiencyObject[flatStatEfficiency] = efficiencyObject[flatStat] / unitCriteria[baseStat];
        }
        
        if (currentMateria.skills && currentMateria.skills.length > 0) {
            let currentMateriaSkills = currentMateria.skills;
            
            currentMateriaSkills.forEach((skillId) => {
                let currentMateriaSkill = skills[skillId]
                if (currentMateriaSkill){

                    let rawEffects = skills[skillId].effects_raw;

                    rawEffects.forEach((rawEffect) => {
                        processRawEffect(stat, efficiencyObject, rawEffect, baseStat, statMax)
                    })
                } 
            })
        }
    })

    if (Object.keys(efficiencyObject).length > 0) {
        efficiencyObject.name = currentMateria.name;
        efficiencyArray.push(efficiencyObject)
    }
})

function processRawEffect(stat, efficiencyObject, rawEffect, baseStat, statMax) {
    // Stat Order: ATK/DEF/MAG/SPR/HP/MP
    
    // Flat Stats
    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 89 && statConstants.includes(stat)) {
        efficientObjectStatAssignment(stat, efficiencyObject, rawEffect, baseStat, statMax);
    }

    // Stat% Check
    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1 && percentageConstants.includes(stat)) {
        efficientObjectStatAssignment(stat, efficiencyObject, rawEffect, baseStat, statMax);
    }

    // Enbadles Dual Wield Check
    if (rawEffect[1] == 3 && rawEffect[2] == 14 && (rawEffect[0] == 0 || rawEffect[0] == 1)) {
        efficientObjectStatAssignment(stat, efficiencyObject, rawEffect, baseStat, statMax);
    }

    // TDW Check
    if (rawEffect[2] == 69) {
        efficientObjectStatAssignment(stat, efficiencyObject, rawEffect, baseStat, statMax);
    }
}

function efficientObjectStatAssignment(stat, efficiencyObject, rawEffect, baseStat, statMax){
    switch(stat){
        case 'ATK':
            if (rawEffect[3][0] > 0) {
        
                if (efficiencyObject?.flatATK) {
                    efficiencyObject.flatATK += rawEffect[3][0];
                } else {
                    efficiencyObject.flatATK = rawEffect[3][0];
                }

                efficiencyObject.flatATKEfficiency = efficiencyObject.flatATK / unitCriteria[baseStat];
            }
            break;
        case 'DEF':
            if (rawEffect[3][1] > 0) {
        
                if (efficiencyObject?.flatDEF) {
                    efficiencyObject.flatDEF += rawEffect[3][1];
                } else {
                    efficiencyObject.flatDEF = rawEffect[3][1];
                }

                efficiencyObject.flatDEFEfficiency = efficiencyObject.flatDEF / unitCriteria[baseStat];
            }
            break;
        case 'MAG':
            if (rawEffect[3][2] > 0) {

                if (efficiencyObject?.flatMAG) {
                    efficiencyObject.flatMAG += rawEffect[3][2];
                } else {
                    efficiencyObject.flatMAG = rawEffect[3][2];
                }

                efficiencyObject.flatMAGEfficiency = efficiencyObject.flatMAG / unitCriteria[baseStat];
            }
            break;
        case 'SPR':
            if (rawEffect[3][3] > 0) {
        
                if (efficiencyObject?.flatSPR) {
                    efficiencyObject.flatSPR += rawEffect[3][3];
                } else {
                    efficiencyObject.flatSPR = rawEffect[3][3];
                }

                efficiencyObject.flatSPREfficiency = efficiencyObject.flatSPR / unitCriteria[baseStat];
            }
            break;
        case 'HP':
            if (rawEffect[3][5] > 0) {
                if (efficiencyObject?.flatHP) {
                    efficiencyObject.flatHP = efficiencyObject.flatHP + rawEffect[3][5];
                } else {
                    efficiencyObject.flatHP = rawEffect[3][5];
                }
            }
            break;
        case 'MP':
            if (rawEffect[3][4] > 0) {
                if (efficiencyObject?.flatMP) {
                    efficiencyObject.flatMP = efficiencyObject.flatHP + rawEffect[3][4];
                } else {
                    efficiencyObject.flatMP = rawEffect[3][4];
                }
            }
            break;
        case 'ATK%':
            if (rawEffect[3][0] > 0) {
        
                if (efficiencyObject?.percentageATK) {
                    efficiencyObject.percentageATK += rawEffect[3][0];
                } else {
                    if (rawEffect[3][0] > 1000) {
                        console.log(rawEffect)
                        console.log(stat)
                    }
                    efficiencyObject.percentageATK = rawEffect[3][0];
                }

                efficiencyObject.percentageATKEfficiency = efficiencyObject.percentageATK / (statMax - unitCriteria[baseStat]);
            }
            break;
        case 'DEF%':
            if (rawEffect[3][1] > 0) {
        
                if (efficiencyObject?.percentageDEF) {
                    efficiencyObject.percentageDEF += rawEffect[3][1];
                } else {
                    efficiencyObject.percentageDEF = rawEffect[3][1];
                }

                efficiencyObject.percentageDEFEfficiency = efficiencyObject.percentageDEF / (statMax - unitCriteria[baseStat]);
            }
            break;
        case 'MAG%':
            if (rawEffect[3][2] > 0) {

                if (efficiencyObject?.percentageMAG) {
                    efficiencyObject.percentageMAG += rawEffect[3][2];
                } else {
                    efficiencyObject.percentageMAG = rawEffect[3][2];
                }

                efficiencyObject.percentageMAGEfficiency = efficiencyObject.percentageMAG / (statMax - unitCriteria[baseStat]);
            }
            break;
        case 'SPR%':
            if (rawEffect[3][3] > 0) {
        
                if (efficiencyObject?.percentageSPR) {
                    efficiencyObject.percentageSPR += rawEffect[3][3];
                } else {
                    efficiencyObject.percentageSPR = rawEffect[3][3];
                }

                efficiencyObject.percentageSPREfficiency = efficiencyObject.percentageSPR / (statMax - unitCriteria[baseStat]);
            }
            break;
        case 'HP%':
            if (rawEffect[3][5] > 0) {
                if (efficiencyObject?.percentageHP) {
                    efficiencyObject.percentageHP = efficiencyObject.percentageHP + rawEffect[3][4];
                } else {
                    efficiencyObject.percentageHP = rawEffect[3][4];
                }
                
                efficiencyObject.percentageHPEfficiency = efficiencyObject.percentageHP / (statMax - unitCriteria[baseStat]);
            }
            break;
        case 'MP%':
            if (rawEffect[3][4] > 0) {
                if (efficiencyObject?.percentageMP) {
                    efficiencyObject.percentageMP = efficiencyObject.percentageHP + rawEffect[3][5];
                } else {
                    efficiencyObject.percentageMP = rawEffect[3][5];
                }

                efficiencyObject.percentageMPEfficiency = efficiencyObject.percentageMP / (statMax - unitCriteria[baseStat]);
            }
            break;
        case 'dualwield':
            console.log(rawEffect)
            if (rawEffect[3].length == 1 && rawEffect[3][0] == "none") {
                efficiencyObject.enablesDualWeild = true;
            } else {
                for (var dualWieldType in rawEffect[3]) {
                    var typeId = rawEffect[3][dualWieldType];
                    if (typeId > 0 && typeId <= 12) {
                        efficiencyObject.partialDualWield = [];
                        efficiencyObject.partialDualWield.push(typeMap[typeId]);
                    }
                }
            }
            break;
        case 'tdw':
            let dualWieldingStat;

            if (rawEffect[3][0] == 1) {
                dualWieldingStat = "ATK";
                if (efficiencyObject?.equipATK) {
                    efficiencyObject.equipATK += rawEffect[3][1];
                } else {
                    efficiencyObject.equipATK = rawEffect[3][1];
                }

                efficiencyObject.equipATKEfficiency  = efficiencyObject.equipATK / (statMax - unitCriteria["equipATK%"])

            } else if (rawEffect[3][0] == 2) {
                dualWieldingStat = "DEF";
                if (efficiencyObject?.equipDEF) {
                    efficiencyObject.equipDEF += rawEffect[3][1];
                } else {
                    efficiencyObject.equipDEF = rawEffect[3][1];
                }

                efficiencyObject.equipDEFEfficiency  = efficiencyObject.equipDEF / (statMax - unitCriteria["equipDEF%"])

            } else if (rawEffect[3][0] == 3) {
                dualWieldingStat = "MAG";
                if (efficiencyObject?.equipMAG) {
                    efficiencyObject.equipMAG += rawEffect[3][1];
                } else {
                    efficiencyObject.equipMAG = rawEffect[3][1];
                }

                efficiencyObject.equipMAGEfficiency  = efficiencyObject.equipMAG / (statMax - unitCriteria["equipMAG%"])

            } else if (rawEffect[3][0] == 4) {
                dualWieldingStat = "SPR";
                if (efficiencyObject?.equipSPR) {
                    efficiencyObject.equipSPR += rawEffect[3][1];
                } else {
                    efficiencyObject.equipSPR = rawEffect[3][1];
                }

                efficiencyObject.equipSPREfficiency  = efficiencyObject.equipSPR / (statMax - unitCriteria["equipSPR%"])

            }
    }
}

function calculateEfficiency(efficiencyArray, goalCriteria) {
    efficiencyArray.forEach((efficiencyObject) => {
        let maxEfficiency = (goalCriteria.length) * 100;
        let itemEfficiency = 0;
        
        Object.keys(efficiencyObject).forEach((checkStat) => {
            if (checkStat.includes("Efficiency")) {
                itemEfficiency += (efficiencyObject[checkStat] * 100)
            }
        })

        efficiencyObject.itemEfficiency = (itemEfficiency / maxEfficiency) * 100;
    })
}

calculateEfficiency(efficiencyArray, goalCritieria)

efficiencyArray.sort((a, b) => (a["itemEfficiency"] < b["itemEfficiency"]) ? 1 : -1)

for (let i = 0; i < 10; i++) {
    console.log(efficiencyArray[i])
}
