var console = require('console');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var baseStats = ["hp","mp","atk","def","mag","spr"];
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

var unlockedSkills = {
    "100011705": "225960",
    "100011805": "226000",
    "100012005": "225990",
    "100012405": "226010",
    "100011905": "225980",
    "100012505": "225970"
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
    "walk,2,12,22,32,42": "Ryu",                         // Ryujin
    "none,42,62,82,102,122,142,162,182": "CWA",               // Chaos Wave Awakened
    "none,70,77,84,91,98,105,112,119,126,133,140,147": "AK", // Avalanche Kick
    "none,42,50,58,66,74,82,90,98,106,114": "BP", // Blade Prison
    "none,42,52,62,72,82,92,102,112,122,132": "TS", // Torrential Slash
    "none,52,57,62,67,72,77,82,87,92,97,102,107,112,117,122,127,132,137,142,147,152,157,162,167,172,177,182,187,192,197": "ExN", // Extreme nova, idle 52
    "walk,28,33,38,43,48,53,58,63,68,73,78,83,88,93,98,103,108,113,118,123,128,133,138,143,148,153,158,163,168,173": "ExN", // Extreme nova, walk 28, with 24-32 frame anim delay
    "walk,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,170,175,180,185,190,195,200,205": "ExN", // Extreme nova, walk 60
    "walk,88,93,98,103,108,113,118,123,128,133,138,143,148,153,158,163,168,173,178,183,188,193,198,203,208,213,218,223,228,233": "ExN", // Extreme nova, walk 88
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
};

const unitRoles = {
    "Physical Attacker": 'physicalAttacker',
    "Magic Attacker": 'magicalAttacker',
    "Physical Tank": 'physicalTank',
    "Magic Tank": 'magicalTank',
    "Breaker": 'debuffer',
    "Support": 'support',
    "Healer": 'healer',
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


function getPassives(unitId, skillsIn, skills, lbs, enhancements, maxRarity, unitData, unitOut, latentSkillsByUnitId) {
    var baseEffects = {};
    var skillsOut = [baseEffects];
    var skillsOutSave = skillsOut;
    unitOut.passives = [];
    unitOut.actives = [];
    unitOut.magics = [];
    
    for (skillIndex in skillsIn) {
        if (skillsIn[skillIndex].rarity > maxRarity || skillsIn[skillIndex].rarity == 'NV' && maxRarity != 'NV') {
            continue; // don't take into account skills for a max rarity not yet released
        }
        var skillId = skillsIn[skillIndex].id.toString();
        if (skillId == "0") {
            console.log(skillsIn[skillIndex]);
            continue;
        }
        manageSkill(skills, skillId, unitOut, enhancements, lbs, skillsOut, baseEffects, skillsIn[skillIndex].rarity, skillsIn[skillIndex].level, skillsIn[skillIndex].ex_level, false);
    }
    if (latentSkillsByUnitId && latentSkillsByUnitId[unitId]) {
        latentSkillsByUnitId[unitId].forEach(skillId => {
            manageSkill(skills, skillId, unitOut, enhancements, lbs, skillsOut, baseEffects, unitOut.min_rarity, 1, 0, true);
        });
    }
    if (unlockedSkills[unitId]) {
        var skillId = unlockedSkills[unitId];
        var skillIn = skills[skillId];
        if (!(skillIn.requirements && skillIn.requirements[0][0] == "SWITCH")) { // Do not manage skills already managed generically
            manageUnlockableSkill(skillIn, skillId, unitOut, skills, lbs);    
        }
        
    }
    unitOut.innates = {};

    addElementalResist(baseEffects, unitData.element_resist);
    addAilmentResist(baseEffects, unitData.status_resist);
    addElementalResist(unitOut.innates, unitData.element_resist);
    addAilmentResist(unitOut.innates, unitData.status_resist);
    
    if (Object.keys(baseEffects).length === 0) {
        skillsOut.splice(0,1);
    }
    
    if (unitData.limitburst_id && lbs[unitData.limitburst_id]) {
        var lb = lbs[unitData.limitburst_id];
        unitOut.lb = parseLb(lb, unitOut, skills);
    }
    
    return skillsOut;
}

function manageSkill(skills, skillId, unitOut, enhancements, lbs, skillsOut, baseEffects, rarity,  level, exLevel, latentSkill) {
    var skillIn = skills[skillId];
    var skill;
    if (!skillIn) console.log(skillId, unitOut.name, unitOut.id);
    if (skillIn.active && skillIn.type != "MAGIC") {
        skill = parseActiveSkill(skillId, skillIn, skills, unitOut);
        skill.rarity = rarity;
        skill.level = level;
        if (exLevel) skill.exLevel = exLevel;
        unitOut.actives.push(skill);
        if (enhancements && enhancements[skillId]) {
            var enhancementLevel = 0;
            while (enhancements[skillId]) {
                enhancementLevel++;
                skillId = enhancements[skillId];
                skillIn = skills[skillId];
                skill = parseActiveSkill(skillId, skillIn, skills, unitOut, enhancementLevel);
                skill.rarity = rarity;
                skill.level = level;
                if (exLevel) skill.exLevel = exLevel;
                unitOut.actives.push(skill);
            }
        }
    } else if (skillIn.type == "MAGIC") {
        skill = parseActiveSkill(skillId, skillIn, skills, unitOut);
        skill.rarity = rarity;
        skill.level = level;
        if (exLevel) skill.exLevel = exLevel;
        unitOut.magics.push(skill);
        if (enhancements && enhancements[skillId]) {
            var enhancementLevel = 0;
            while (enhancements[skillId]) {
                enhancementLevel++;
                skillId = enhancements[skillId];
                skillIn = skills[skillId];
                skill = parseActiveSkill(skillId, skillIn, skills, unitOut, enhancementLevel);
                skill.rarity = rarity;
                skill.level = level;
                if (exLevel) skill.exLevel = exLevel;
                unitOut.magics.push(skill);
            }
        }
    } else if (enhancements && enhancements[skillId]) {
        if (!unitOut.enhancements) {
            unitOut.enhancements = [];
        }
        var enhancementData = {"name": skills[skillId].name, "levels": []}
        if (latentSkill) {
            enhancementData.levels.push([]);
        }
        var enhancementBaseEffects = {};
        var enhancementSkillsOut = [enhancementBaseEffects];
        skill = getPassive(skillIn, skillId, enhancementBaseEffects, enhancementSkillsOut, skills, unitOut, lbs);
        skill.rarity = rarity;
        skill.level = level;
        if (exLevel) skill.exLevel = exLevel;
        unitOut.passives.push(skill);
        if (Object.keys(enhancementBaseEffects).length === 0) {
            enhancementSkillsOut.splice(0, 1);
        }
        if (level > 101) {
            for (var i = enhancementSkillsOut.length; i--;) {
                enhancementSkillsOut[i].levelCondition = level;
            }
        }
        if (exLevel) {
            for (var i = enhancementSkillsOut.length; i--;) {
                enhancementSkillsOut[i].exLevelCondition = exLevel;
            }
        }
        enhancementData.levels.push(enhancementSkillsOut);
        var enhancementLevel = 0;
        while (enhancements[skillId]) {
            enhancementLevel++;
            skillId = enhancements[skillId];
            skillIn = skills[skillId];
            var enhancementBaseEffects = {};
            var enhancementSkillsOut = [enhancementBaseEffects];
            skill = getPassive(skills[skillId], skillId, enhancementBaseEffects, enhancementSkillsOut, skills, unitOut, lbs);
            skill.rarity = rarity;
            skill.level = level;
            if (exLevel) skill.exLevel = exLevel;
            skill.name = skill.name + " +" + enhancementLevel;
            unitOut.passives.push(skill);

            if (Object.keys(enhancementBaseEffects).length === 0) {
                enhancementSkillsOut.splice(0, 1);
            }
            if (level > 101) {
                for (var i = enhancementSkillsOut.length; i--;) {
                    enhancementSkillsOut[i].levelCondition = level;
                }
            }
            if (exLevel) {
                for (var i = enhancementSkillsOut.length; i--;) {
                    enhancementSkillsOut[i].exLevelCondition = exLevel;
                }
            }
            enhancementData.levels.push(enhancementSkillsOut);
        }
        var empty = true;
        for (var i = enhancementData.levels.length; i--;) {
            if (Object.keys(enhancementData.levels[i]).length > 0) {
                empty = false;
                break;
            }
        }
        if (!empty) {
            unitOut.enhancements.push(enhancementData);
        }
    } else if (level > 101 || exLevel) {
        baseEffectsLevelCondition = {};
        skillsOutLevelCondition = [baseEffectsLevelCondition];
        skill = getPassive(skillIn, skillId, baseEffectsLevelCondition, skillsOutLevelCondition, skills, unitOut, lbs);
        skill.rarity = rarity;
        skill.level = level;
        if (exLevel) skill.exLevel = exLevel;
        if (!(Object.keys(skillsOutLevelCondition[0]).length === 0)) {
            if (level > 101) baseEffectsLevelCondition.levelCondition = level;
            if (exLevel) baseEffectsLevelCondition.exLevelCondition = exLevel;
            skillsOut.push(baseEffectsLevelCondition);
        }
        for (var i = 1, len = skillsOutLevelCondition.length; i < len; i++) {
            if (level > 101) skillsOutLevelCondition[i].levelCondition = level;
            if (exLevel) skillsOutLevelCondition[i].exLevelCondition = exLevel;
            skillsOut.push(skillsOutLevelCondition[i]);
        }
        unitOut.passives.push(skill);
    } else if (skills[skillId].requirements && skills[skillId].requirements[0][0] == "SWITCH") {
        manageUnlockableSkill(skillIn, skillId, unitOut, skills, lbs);
    } else {
        skill = getPassive(skillIn, skillId, baseEffects, skillsOut, skills, unitOut, lbs);
        skill.rarity = rarity;
        skill.level = level;
        if (exLevel) skill.exLevel = exLevel;
        unitOut.passives.push(skill);
    }
}

function manageUnlockableSkill(skillIn, skillId, unitOut, skills, lbs) {
    if (!unitOut.enhancements) {
        unitOut.enhancements = [];
    }
    var enhancementData = {"name":skillIn.name, "levels":[[]]}
    var enhancementBaseEffects = {};
    var enhancementSkillsOut = [enhancementBaseEffects];
    var skill = getPassive(skillIn, skillId, enhancementBaseEffects, enhancementSkillsOut, skills, unitOut, lbs);
    skill.rarity = unitOut.min_rarity;
    skill.level = 1;
    unitOut.passives.push(skill);
    if (Object.keys(enhancementBaseEffects).length === 0) {
        enhancementSkillsOut.splice(0,1);
    }
    enhancementData.levels.push(enhancementSkillsOut);
    unitOut.enhancements.push(enhancementData);
}

function getPassive(skillIn, skillId, baseEffects, skillsOut, skills, unit, lbs) {
    var skill = {"name" : skillIn.name, "id":skillId, "icon": skillIn.icon, "effects": []};
    var tmrAbilityEffects = [];
    
    for (var rawEffectIndex in skillIn["effects_raw"]) {
        var rawEffect = skillIn["effects_raw"][rawEffectIndex];

        var effects = parsePassiveRawEffet(rawEffect, skillId, skills, unit, lbs);
        if (effects) {
            if (skillIn.requirements && skillIn.requirements[0][0] == "EQUIP") {
                tmrAbilityEffects = tmrAbilityEffects.concat(effects);
            } else { 
                addEffectsToEffectList(skillsOut, effects);
            }
            for (var i = 0, len = effects.length; i < len; i++) {
                skill.effects.push({"effect":effects[i], "desc": skillIn.effects[rawEffectIndex].join(', ')});
            }
        } else {
            skill.effects.push({"effect":null, "desc": skillIn.effects[rawEffectIndex].join(', ')});
        }
    }
    if (skillIn.requirements && skillIn.requirements[0][0] == "EQUIP") {
        if (skillIn.requirements.length == 1) {
            skill.equipedConditions = [skillIn.requirements[0][1].toString()]    
        } else {
            skill.equipedConditions = [skillIn.requirements.map(a => a[1].toString())];
        }
                                                           
        var condensedSkills = [{}];
        addEffectsToEffectList(condensedSkills, tmrAbilityEffects);
        for (var i = 0, len = condensedSkills.length; i < len; i++) {
            if (!condensedSkills[i].equipedConditions) {
                condensedSkills[i].equipedConditions = [];
            }
            condensedSkills[i].equipedConditions = condensedSkills[i].equipedConditions.concat(skill.equipedConditions);
            skillsOut.push(condensedSkills[i]);    
        }
    }
    
    return skill;
}

function addEffectsToEffectList(effectList, effects) {
    for (var effectIndex = 0, lenEffectIndex = effects.length; effectIndex < lenEffectIndex; effectIndex++) {
        var effect = effects[effectIndex];
        if (effect.equipedConditions || effect.exclusiveUnits || effect.exclusiveSex) {
            effectList.push(effect);
        } else {
            
            for (var i = baseStats.length; i--;) {
                if (effect[baseStats[i]]) {
                    addToStat(effectList[0], baseStats[i], effect[baseStats[i]]);
                }
                if (effect[baseStats[i] + "%"]) {
                    addToStat(effectList[0], baseStats[i] + "%", effect[baseStats[i] + "%"]);
                }
            }
            if (effect.special) {
                for (var i = 0, len = effect.special.length; i < len; i++) {
                    addToList(effectList[0],"special",effect.special[i]);
                }
            }
            if (effect.element) {
                for (var i = 0, len = effect.element.length; i < len; i++) {
                    addToList(effectList[0],"element",effect.element[i]);
                }
            }   
            if (effect.killers) {
                for (var i = 0, len = effect.killers.length; i < len; i++) {
                    addKiller(effectList[0], effect.killers[i].name, effect.killers[i].physical || 0, effect.killers[i].magical || 0);
                }
            }
            if (effect.resist) {
                for (var i = 0, len = effect.resist.length; i < len; i++) {
                    addToResistList(effectList[0], effect.resist[i]);
                }
            }
            if (effect.ailments) {
                for (var i = 0, len = effect.ailments.length; i < len; i++) {
                    addToAilmentsList(effectList[0], effect.ailments[i]);
                }
            }
            if (effect.allowUseOf) {
                if (!effectList[0].allowUseOf) {
                    effectList[0].allowUseOf = [];
                }
                for (var i = 0, len = effect.allowUseOf.length; i < len; i++) {
                    if (!effectList[0].allowUseOf.includes(effect.allowUseOf[i])) {
                        effectList[0].allowUseOf.push(effect.allowUseOf[i])
                    }
                }
            }
            if (effect.improvedDW) {
                effectList[0].improvedDW = true;
            }
            if (effect.evokeDamageBoost) {
                if (!effectList[0].evokeDamageBoost) {
                    effectList[0].evokeDamageBoost = {}
                }
                Object.keys(effect.evokeDamageBoost).forEach(esperName => {
                    addToStat(effectList[0].evokeDamageBoost, esperName, effect.evokeDamageBoost[esperName]);
                });
            }
            const simpleValues = ["evoMag", "accuracy", "jumpDamage","lbFillRate", "mpRefresh", "lbDamage", "chainMastery"];
            for (var i = simpleValues.length; i--;) {
                if (effect[simpleValues[i]]) {
                    addToStat(effectList[0], simpleValues[i], effect[simpleValues[i]]);
                }
            }
            const baseStatsBasedValues = ["singleWielding","singleWieldingOneHanded","dualWielding", "oneWeaponMastery"];
            const baseStatsWithAccuracy = baseStats.concat(["accuracy"]);
            for (var i = baseStatsBasedValues.length; i--;) {
                if (effect[baseStatsBasedValues[i]]) {
                    if (!effectList[0][baseStatsBasedValues[i]]) {
                        effectList[0][baseStatsBasedValues[i]] = {};
                    }
                    for (var j = baseStatsWithAccuracy.length; j--;) {
                        if (effect[baseStatsBasedValues[i]][baseStatsWithAccuracy[j]]) {
                            addToStat(effectList[0][baseStatsBasedValues[i]], baseStatsWithAccuracy[j], effect[baseStatsBasedValues[i]][baseStatsWithAccuracy[j]]);
                        }
                    }
                }
            }
            if (effect.esperStatsBonus) {
                if (!effectList[0].esperStatsBonus) {
                    effectList[0].esperStatsBonus = {};
                }
                Object.keys(effect.esperStatsBonus).forEach(esper => {
                   if (!effectList[0].esperStatsBonus[esper]) {
                       effectList[0].esperStatsBonus[esper] = effect.esperStatsBonus[esper];
                   } else {
                       baseStats.forEach(stat => {
                           effectList[0].esperStatsBonus[esper][stat] += effect.esperStatsBonus[esper][stat];
                       });
                   }
                });
            }
            if (effect.evade) {
                if (!effectList[0].evade) {
                    effectList[0].evade = {};
                }
                addToStat(effectList[0].evade, "physical", effect.evade.physical);
                addToStat(effectList[0].evade, "magical", effect.evade.magical);
            }
            if (effect.lbPerTurn) {
                if (!effectList[0].lbPerTurn) {
                    effectList[0].lbPerTurn = {};
                }
                addToStat(effectList[0].lbPerTurn, "min", effect.lbPerTurn.min);
                addToStat(effectList[0].lbPerTurn, "max", effect.lbPerTurn.max);
            }
            if (effect.partialDualWield) {
                for (var i = 0, len = effect.partialDualWield.length; i < len; i++) {
                    addToList(effectList[0],"partialDualWield",effect.partialDualWield[i]);
                }
            }
            if (effect.drawAttacks) {
                addToStat(effectList[0], "drawAttacks", effect.drawAttacks);
            }
            if (effect.autoCastedSkill) {
                for (var autoCastedSkillIndex = effect.autoCastedSkill.effects.length; autoCastedSkillIndex--;) {
                    var autoCastedEffect = effect.autoCastedSkill.effects[autoCastedSkillIndex];
                    if (autoCastedEffect.effect && autoCastedEffect.effect.resist && autoCastedEffect.effect.turns == -1) {
                        addEffectsToEffectList(effectList, [autoCastedEffect.effect]);
                    }
                }
            }
            if (effect.skillEnhancement) {
                if (!effectList[0].skillEnhancement) {
                    effectList[0].skillEnhancement = {};
                }
                for (var skillId in effect.skillEnhancement) {
                    if (!effectList[0].skillEnhancement[skillId]) {
                        effectList[0].skillEnhancement[skillId] = 0;
                    }
                    effectList[0].skillEnhancement[skillId] += effect.skillEnhancement[skillId];
                }
            }
            if (effect.replaceLb) {
                effectList[0].replaceLb = effect.replaceLb;
            }
        }
    }
}

function parsePassiveRawEffet(rawEffect, skillId, skills, unit, lbs) {
    var result = {};
    // stat bonus
    if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {               
        var effectData = rawEffect[3];
        addToStat(result, "hp%", effectData[4]);
        addToStat(result, "mp%", effectData[5]);
        addToStat(result, "atk%", effectData[0]);
        addToStat(result, "def%", effectData[1]);
        addToStat(result, "mag%", effectData[2]);
        addToStat(result, "spr%", effectData[3]);
        return [result];

    // DW
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 14) {               
        var types = rawEffect[3]
        if (types.length == 1 && types[0] == "none") {
            addToList(result,"special","dualWield");
        } else {
            for(var partialDualWieldIndex in types) {
                addToList(result,"partialDualWield",typeMap[types[partialDualWieldIndex]]);
            }                    
        }
        return [result];
    }

    // Killers
    else if (((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) ||
        (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 11)) {
        var killerData = rawEffect[3];
        
        var killerRaces = killerData[0];
        var physicalPercents = killerData[1];
        var magicalPercents = killerData[2];
        
        if (!Array.isArray(killerRaces)) {
            killerRaces = [killerRaces];
            physicalPercents = [physicalPercents];
            magicalPercents = [magicalPercents];
        } else {
            if (!Array.isArray(physicalPercents)) {
                physicalPercents = Array(killerRaces.length).fill(physicalPercents)
            }
            if (!Array.isArray(magicalPercents)) {
                magicalPercents = Array(killerRaces.length).fill(magicalPercents)
            }
        }
        
        for (var raceIndex = 0; raceIndex < killerRaces.length; raceIndex++) {
            addKiller(result, raceMap[killerRaces[raceIndex]], physicalPercents[raceIndex], magicalPercents[raceIndex]);    
        }
        
        return [result];
    }

    // physical evade
    else if (rawEffect[1] == 3 && rawEffect[2] == 22) {
        result.evade = {"physical":rawEffect[3][0]}
        return [result];
    }

    // magical evade
    else if (rawEffect[1] == 3 && rawEffect[2] == 54 && rawEffect[3][0] == -1) {
        result.evade = {"magical":rawEffect[3][1]}
        return [result];
    }
    
    // allow use of
    else if (rawEffect[2] == 5) {
        result.allowUseOf = rawEffect[3].map(n => typeMap[n]);
        return [result];
    }

    // Mastery
    else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
        var masteryEffect = rawEffect[3];
        var masteryType = typeMap[masteryEffect[0]];
        var result = {"equipedConditions":[masteryType]};

        if (masteryEffect.length > 5) {
            if (masteryEffect[5]) {
                result["hp%"] = masteryEffect[5]
            }
            if (masteryEffect[6]) {
                result["mp%"] = masteryEffect[6]
            }
        }
        if (masteryEffect[1]) {
            result["atk%"] = masteryEffect[1]
        }
        if (masteryEffect[2]) {
            result["def%"] = masteryEffect[2]
        }
        if (masteryEffect[3]) {
            result["mag%"] = masteryEffect[3]
        }
        if (masteryEffect[4]) {
            result["spr%"] = masteryEffect[4]
        }
        return [result];
    }

    // unarmed
    else if (rawEffect[1] == 3 && rawEffect[2] == 19) {
        var masteryEffect = rawEffect[3];    
        var result = {"equipedConditions":["unarmed"]};

        if (masteryEffect[0]) {
            result["atk%"] = masteryEffect[0]
        }
        if (masteryEffect[1]) {
            result["def%"] = masteryEffect[1]
        }
        if (masteryEffect[2]) {
            result["mag%"] = masteryEffect[2]
        }
        if (masteryEffect[3]) {
            result["spr%"] = masteryEffect[3]
        }
        return [result];
    }

    // element based mastery
    else if (rawEffect[1] == 3 && rawEffect[2] == 10004) {
        var masteryEffect = rawEffect[3];
        result = [];
        var result = {};
        if (Array.isArray(masteryEffect[0])) {
            result.equipedConditions = [masteryEffect[0].map(x => elementsMap[x])]
        } else {
            result.equipedConditions = [elementsMap[masteryEffect[0]]];
        }
        if (masteryEffect[3]) {
            result["atk%"] = masteryEffect[3];
        }
        if (masteryEffect[5]) {
            result["def%"] = masteryEffect[5];
        }
        if (masteryEffect[4]) {
            result["mag%"] = masteryEffect[4];
        }
        if (masteryEffect[6]) {
            result["spr%"] = masteryEffect[6];
        }
        if (masteryEffect[1]) {
            result["hp%"] = masteryEffect[1];
        }
        if (masteryEffect[2]) {
            result["mp%"] = masteryEffect[2];
        }
        return [result];
    }

    //doublehand
    else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
        if (rawEffect[3].length == 3 && rawEffect[3][2] == 2) {
            result.singleWielding = {};
            addToStat(result.singleWielding, "atk", rawEffect[3][0]);
            addToStat(result.singleWielding, "accuracy", rawEffect[3][1]);
        } else {
            result.singleWieldingOneHanded = {};
            addToStat(result.singleWieldingOneHanded, "atk", rawEffect[3][0]);
            addToStat(result.singleWieldingOneHanded, "accuracy", rawEffect[3][1]);
        }
        return [result];
    }
    else if (rawEffect[1] == 3 && rawEffect[2] == 10003) {
        var doublehandResult = {};
        var doublehandEffect = rawEffect[3];
        if (doublehandEffect.length == 7 && doublehandEffect[6] == 1) {
            result.singleWielding = {};
            doublehandResult = result.singleWielding;
        } else {
            result.singleWieldingOneHanded = {};
            doublehandResult = result.singleWieldingOneHanded;
        }
        if (doublehandEffect[2]) {
            addToStat(doublehandResult, "atk", doublehandEffect[2]);
        }
        if (doublehandEffect[4]) {
            addToStat(doublehandResult, "def", doublehandEffect[4]);
        }
        if (doublehandEffect[3]) {
            addToStat(doublehandResult, "mag", doublehandEffect[3]);
        }
        if (doublehandEffect[5]) {
            addToStat(doublehandResult, "spr", doublehandEffect[5]);
        }
        if (doublehandEffect[0]) {
            addToStat(doublehandResult, "hp", doublehandEffect[0]);
        }
        if (doublehandEffect[1]) {
            addToStat(doublehandResult, "mp", doublehandEffect[1]);
        }
        return [result];

    // MAG DH
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 70) {
        if (rawEffect[3][2] == 0) {
            result.singleWieldingOneHanded = {};
            addToStat(result.singleWieldingOneHanded,"mag",rawEffect[3][0]);    
        } else if (rawEffect[3][2] == 2) {
            result.singleWielding = {};
            addToStat(result.singleWielding,"mag",rawEffect[3][0]);    
        }
        return [result];
        
    // +EQ stat when dual wielding
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 69) {
        result.dualWielding = {};
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
        addToStat(result.dualWielding, stat, rawEffect[3][1]);
        return [result];

        // Increase max chain coef
    } else if (rawEffect[2] == 98) {
        addToStat(result, 'chainMastery', rawEffect[3][1]);
        return [result];

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
        result.oneWeaponMastery = {};
        addToStat(result.oneWeaponMastery, stat, rawEffect[3][1]);
        let results = [];
        if (!rawEffect[3][3] || rawEffect[3][3].length === 16) {
            // all weapons
            results.push(result);
        } else {
            rawEffect[3][3].map(weaponTypeId => typeMap[weaponTypeId]).forEach(weaponType => {
                let conditionedResult = {oneWeaponMastery:{}, equipedConditions:[weaponType]};
                addToStat(conditionedResult.oneWeaponMastery, stat, rawEffect[3][1]);
                results.push(conditionedResult);
            });
        }
        return results;

    // Element Resist
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
        addElementalResist(result, rawEffect[3]);
        return [result];

    // Ailments Resist
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
        addAilmentResist(result, rawEffect[3]);
        return [result];

    // MP refresh
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
        var mpRefresh = rawEffect[3][0];
        addToStat(result, "mpRefresh", mpRefresh);
        return [result];

    // LB/turn
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 33) {
        var lbPerTurn = rawEffect[3][0]/100;
        addLbPerTurn(result, lbPerTurn, lbPerTurn);
        return [result];

    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 125) {
        var lbPerTurnMin = rawEffect[3][0]/100;
        var lbPerTurnMax = rawEffect[3][1]/100;
        addLbPerTurn(result, lbPerTurnMin, lbPerTurnMax);
        return [result];

    // LB fill rate
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 31) {
        var lbFillRate = rawEffect[3][0];
        addToStat(result, "lbFillRate", lbFillRate);
        return [result];

    // +Jump damage
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 17) {
        var jumpDamage = rawEffect[3][0];
        addToStat(result, "jumpDamage", jumpDamage);
        return [result];
    
    // +LB Damage
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 68) {
        var lbDamage = rawEffect[3][0];
        addToStat(result, "lbDamage", lbDamage);
        return [result];

    // +EVO Mag
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 21) {
        var evoMag = rawEffect[3][0];
        addToStat(result, "evoMag", evoMag);
        return [result];

    // +evoke damage boost
    } else if (rawEffect[2] == 64) {
        let esperName;
        if (rawEffect[3][1] === 0) {
            esperName = 'all';
        } else {
            esperName = espersById[rawEffect[3][1]];
        }
        if (!result.evokeDamageBoost) {
            result.evokeDamageBoost = {};
        }
        if (!result.evokeDamageBoost[esperName]) {
            result.evokeDamageBoost[esperName] = 0;
        }
        result.evokeDamageBoost[esperName] += rawEffect[3][0];

        return [result];

    // +Stats from espers boost
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 63) {
        var esperStatsBonus = rawEffect[3];
        var esper;
        if (esperStatsBonus.length == 6 || esperStatsBonus[6] == 0) {
            esper = 'all';
        } else {
            esper = espersById[esperStatsBonus[6]];
        }
        result.esperStatsBonus = {};
        result.esperStatsBonus[esper] = {};
        addToStat(result.esperStatsBonus[esper], "hp", esperStatsBonus[0]);
        addToStat(result.esperStatsBonus[esper], "mp", esperStatsBonus[1]);
        addToStat(result.esperStatsBonus[esper], "atk", esperStatsBonus[2]);
        addToStat(result.esperStatsBonus[esper], "def", esperStatsBonus[3]);
        addToStat(result.esperStatsBonus[esper], "mag", esperStatsBonus[4]);
        addToStat(result.esperStatsBonus[esper], "spr", esperStatsBonus[5]);
        return [result];

    // Counter
    } else if (rawEffect[2] == 49) { 
        result = {};
        var skillIn = skills[rawEffect[3][2]];
        if (skillIn) {
            result.counterSkill = parseActiveSkill(rawEffect[3][2], skillIn, skills, unit);
            result.counterType = "physical";
            result.percent = rawEffect[3][0];
            return [result];
        }
        
    } else if (rawEffect[2] == 50) { 
        result = {};
        var skillIn = skills[rawEffect[3][2]];
        result.counterSkill = parseActiveSkill(rawEffect[3][2], skillIn, skills, unit);
        result.counterType = "magical";
        result.percent = rawEffect[3][0];
        return [result];
        
    // Gilgamesh multi equip skill
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 74) {
        var result = [];
        var conditions = rawEffect[3][0];
        if (!Array.isArray(rawEffect[3][0])) {
            conditions = [rawEffect[3][0]];
        }
        for (var i = conditions.length; i--;) {
            var gilgameshSkill = {"equipedConditions": [conditions[i].toString()]};
            gilgameshSkill["atk%"] = rawEffect[3][1];
            gilgameshSkill["def%"] = rawEffect[3][2];
            gilgameshSkill["mag%"] = rawEffect[3][3];
            gilgameshSkill["spr%"] = rawEffect[3][4];
            gilgameshSkill["hp%"] = rawEffect[3][5];
            gilgameshSkill["mp%"] = rawEffect[3][6];
            result.push(gilgameshSkill);
        }
        return result;

    } else if (rawEffect[2] == 89) {

        addToStat(result, 'atk', rawEffect[3][0]);
        addToStat(result, 'def', rawEffect[3][1]);
        addToStat(result, 'mag', rawEffect[3][2]);
        addToStat(result, 'spr', rawEffect[3][3]);
        addToStat(result, 'hp', rawEffect[3][4]);
        addToStat(result, 'mp', rawEffect[3][5]);

        return [result];

    // equipment type conditionned killers
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 75) {
        var typeArray;
        if (Array.isArray(rawEffect[3][0])) {
            typeArray = rawEffect[3][0];
        } else {
            typeArray = [rawEffect[3][0]];
        }
        result = [];
        for (var i = typeArray.length; i--;) {
            var conditionnedKillerSKill = {"equipedConditions":[typeMap[typeArray[i]]]};
            var killerData = rawEffect[3];

            var killerRace = raceMap[killerData[1]];
            var physicalPercent = killerData[2];
            var magicalPercent = killerData[3];
            addKiller(conditionnedKillerSKill, killerRace, physicalPercent, magicalPercent);

            result.push(conditionnedKillerSKill);
        }
        return result;

    // equipment type conditionned element resistance
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 76) {
        var typeArray;
        if (Array.isArray(rawEffect[3][0])) {
            typeArray = rawEffect[3][0];
        } else {
            typeArray = [rawEffect[3][0]];
        }
        result = [];
        for (var i = typeArray.length; i--;) {
            var conditionnedElementalResistSKill = {"equipedConditions":[typeMap[typeArray[i]]]};

            var elementalResist = rawEffect[3].slice();
            elementalResist.splice(0,1);
            addElementalResist(conditionnedElementalResistSKill, elementalResist);

            result.push(conditionnedElementalResistSKill);
        }
        return result;
    
    // Auto cast at start of fight
    } else if (rawEffect[2] == 56) { 
        result = {};
        var skillIn = skills[rawEffect[3][0]];
        if (skillIn) {
            var autoCastedSkill = parseActiveSkill(rawEffect[3][0].toString(), skillIn, skills, unit);
            result.autoCastedSkill = autoCastedSkill;
            addUnlockedSkill(autoCastedSkill.id, autoCastedSkill, unit, skillId);
            return [result];
        }

    } else if (rawEffect[2] == 100) {
        result = {};
        var skillIn = skills[rawEffect[3][0]];
        if (skillIn) {
            var autoCastedSkill = parseActiveSkill(rawEffect[3][0].toString(), skillIn, skills, unit);
            result.replaceNormalAttack = autoCastedSkill;
            addUnlockedSkill(autoCastedSkill.id, autoCastedSkill, unit, skillId);
            return [result];
        }
        
    // Draw attacks
    } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 24) {
        var drawAttacks = rawEffect[3][0];
        addToStat(result, "drawAttacks", drawAttacks);
        return [result];
    
    // ST Cover
    } else if (rawEffect[2] == 8) {
        result.stCover = {};
        if (rawEffect[3][0] == 1) {
            result.stCover.exclusiveSex = "female";    
        }
        result.stCover.chance = rawEffect[3][4];
        result.stCover.mitigation = {"min": rawEffect[3][2], "max": rawEffect[3][3]};
        return [result];


        // Break, stop and charm resistance
    } else if (rawEffect[2] == 55) {
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
        return [result];

    // Skill enhancement
    } else if (rawEffect[2] == 73) {
        result.skillEnhancement = {};
        if (Array.isArray(rawEffect[3][0])) {
            for (var i = rawEffect[3][0].length; i--;) {
                result.skillEnhancement[rawEffect[3][0][i].toString()] = rawEffect[3][3] / 100;
            }
        } else {
            result.skillEnhancement[rawEffect[3][0].toString()] = rawEffect[3][3] / 100;
        }
        return [result];
    
    // Dualcast
    } else if (rawEffect[2] == 45) {
        return [{
            "multicast": {
                "time": 2,
                "type": ["whiteMagic", "greenMagic", "blackMagic"]
            }
        }];
        
    // Dual cast Magic
    } else if (rawEffect[2] == 52) {
//        var magicType = "";
//        if (rawEffect[3][0] ==  0) {
//            magicType = "magic";
//        } else if (rawEffect[3][0] ==  1) {
//            magicType = "blackMagic";
//        } else if (rawEffect[3][0] ==  2) {
//            magicType = "whiteMagic";
//        }
//        return [{
//            "multicast": {
//                "time": rawEffect[3][1],
//                "type": magicType
//            }
//        }];
        let gainedSkillId = rawEffect[3][2].toString();
        let gainedSkillIn = skills[gainedSkillId];
        let gainedSkill = parseActiveSkill(gainedSkillId, gainedSkillIn, skills, unit);
        
        addUnlockedSkill(gainedSkillId, gainedSkill, unit);

        result = {
            "gainSkills": {
                "skills": [{
                    "id": gainedSkillId,
                    "name": gainedSkill.name
                }]
            }
        }
        return [result]
    
    // Dual Black Magic
    } else if (rawEffect[2] == 44) {
        return [{
            "multicast": {
                "time": 2,
                "type": ["blackMagic"]
            }
        }]
        
    // Skill multicast
    } else if (rawEffect[2] == 53) {
        
        
        let gainedSkillId = rawEffect[3][1].toString();
        let gainedSkillIn = skills[gainedSkillId];
        let gainedSkill = parseActiveSkill(gainedSkillId, gainedSkillIn, skills, unit);
        
        let gainedEffect = parseActiveRawEffect(rawEffect, skillIn, skills, unit, skillId);
        gainedSkill.effects[0].effect = gainedEffect;
                
        addUnlockedSkill(gainedSkillId, gainedSkill, unit);

        result = {
            "gainSkills": {
                "skills": [{
                    "id": gainedSkillId,
                    "name": gainedSkill.name
                }]
            }
        }
        
        return [result];

        // Global multicast
    // } else if (rawEffect[2] == 102) {
    //
    //
    //     let gainedSkillId = rawEffect[3][4].toString();
    //     let gainedSkillIn = skills[gainedSkillId];
    //     let gainedSkill = parseActiveSkill(gainedSkillId, gainedSkillIn, skills, unit);
    //
    //     let gainedEffect = parseActiveRawEffect(rawEffect, skillIn, skills, unit, skillId);
    //     gainedSkill.effects[0].effect = gainedEffect;
    //
    //     addUnlockedSkill(gainedSkillId, gainedSkill, unit);
    //
    //     result = {
    //         "gainSkills": {
    //             "skills": [{
    //                 "id": gainedSkillId,
    //                 "name": gainedSkill.name
    //             }]
    //         }
    //     }
    //
    //     return [result];
        // global multicast
    } else if (rawEffect[2] == 102) {

        let result = {
            "multicast": {
                "time": rawEffect[3][3],
                "type": [],
            }
        }

        if (!Array.isArray(rawEffect[3][0])) rawEffect[3][0] = [rawEffect[3][0]];
        if (rawEffect[3][0].includes(1)) {
            result.multicast.type.push("whiteMagic");
        }
        if (rawEffect[3][0].includes(2)) {
            result.multicast.type.push("greenMagic");
        }
        if (rawEffect[3][0].includes(3)) {
            result.multicast.type.push("blackMagic");
        }
        if (rawEffect[3][0].includes(5)) {
            result.multicast.type.push("allSkills");
        }
        if (rawEffect[3][1] && !result.multicast.type.includes("allSkills")) {
            if (!Array.isArray(rawEffect[3][1])) rawEffect[3][1] = [rawEffect[3][1]];
            result.multicast.type.push("skills");
            result.multicast.skills = [];
            rawEffect[3][1].forEach(multicastedSkillId => {
                var skill = skills[multicastedSkillId];
                if (!skill) {
                    console.log('Unknown skill : ' + multicastedSkillId + ' - ' + JSON.stringify(rawEffect));
                } else {
                    result.multicast.skills.push({"id": multicastedSkillId.toString(), "name": skill.name});
                }
            });
        }
        if (rawEffect[3][2]) {
            if (!Array.isArray(rawEffect[3][2])) rawEffect[3][2] = [rawEffect[3][2]];
            result.multicast.excludedSkills = [];
            rawEffect[3][2].forEach(multicastedSkillId => {
                var skill = skills[multicastedSkillId];
                if (!skill) {
                    console.log('Unknown skill : ' + multicastedSkillId + ' - ' + JSON.stringify(rawEffect));
                } else {
                    result.multicast.excludedSkills.push({"id": multicastedSkillId.toString(), "name": skill.name});
                }
            });
        }

        return [result];

        //return gainedSkill.effects.map(effect => effect.effect);
        
    // Replace LB
    } else if (rawEffect[2] == 72) {
        
        var lbIn = lbs[rawEffect[3][0]];
        var lb = parseLb(lbIn, unit, skills);
        result = {
            "replaceLb": lb
        }
        return [result];
        
    // Increase maximum true double-wield bonus to 200%, Allow unit to reach 6x chain modifier, when using two one-handed weapons
    } else if (rawEffect[3] && rawEffect[2] == 81) {
        
        result = {
            "improvedDW": true
        }
        return [result];
    }
    return null;
}

function parseActiveSkill(skillId, skillIn, skills, unit, enhancementLevel = 0) {
    var skill = {"id": skillId , "name" : skillIn.name, "icon": skillIn.icon, "effects": []};
    if (skillIn["effects_raw"][0][2] === 157) {
        skill.maxCastPerBattle = skillIn["effects_raw"][0][3][2];
        if (!skillIn["effects_raw"][0][3][7]) {
            skill.noMulticast = true;
        }
        skillId = skillIn["effects_raw"][0][3][0];
        if (!skills[skillId]) {
            console.log(skillIn);
        }
        skillIn = skills[skillId];

    }
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
        if (effect && (effect.damage || effect.heal)) {
            effect.frames = getArrayValueAtIndex(skillIn.attack_frames, rawEffectIndex);
            effect.repartition = getArrayValueAtIndex(skillIn.attack_damage, rawEffectIndex);
        }

        let desc;
        if (effect && effect.desc) {
            desc = effect.desc;
            delete effect.desc;
        } else {
            desc = skillIn.effects[rawEffectIndex].join(', ');
        }

        skill.effects.push({"effect":effect, "desc": desc});
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
    if (skillIn.cost && skillIn.cost.LB) {
        skill.lbCost = skillIn.cost.LB;
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

function getArrayValueAtIndex(array, index) {
    let value = getValueAtIndex(array, index);
    if (!Array.isArray(value)) {
        value = [value];
    }
    if (value.length == 0) {
        value = [0];
    }
}

function parseLb(lb, unit, skills) {
    var lbOut = {"name": lb.name, minEffects: [], "maxEffects":[]}
    for (var rawEffectIndex in lb.levels[0][1]) {
        var rawEffect = lb.levels[0][1][rawEffectIndex];

        var effect = parseActiveRawEffect(rawEffect, lb, skills, unit, 'lb');
        if (effect && (effect.damage || effect.heal)) {
            effect.frames = getArrayValueAtIndex(lb.attack_frames, rawEffectIndex);
            effect.repartition = getArrayValueAtIndex(lb.attack_damage, rawEffectIndex);
        }
        let desc;
        if (effect && effect.desc) {
            desc = effect.desc;
            delete effect.desc;
        } else {
            desc = lb.min_level[rawEffectIndex].join(', ');
        }
        lbOut.minEffects.push({"effect":effect, "desc": desc});
    }
    for (var rawEffectIndex in lb.levels[lb.levels.length - 1][1]) {
        var rawEffect = lb.levels[lb.levels.length - 1][1][rawEffectIndex];

        var effect = parseActiveRawEffect(rawEffect, lb, skills, unit, 'lb');
        if (effect && (effect.damage || effect.heal)) {
            effect.frames = getArrayValueAtIndex(lb.attack_frames, rawEffectIndex);
            effect.repartition = getArrayValueAtIndex(lb.attack_damage, rawEffectIndex);
        }
        let desc;
        if (effect && effect.desc) {
            desc = effect.desc;
            delete effect.desc;
        } else {
            desc = lb.max_level[rawEffectIndex].join(', ');
        }
        lbOut.maxEffects.push({"effect":effect, "desc": desc});
    }
    addChainInfoToSkill(lbOut, lbOut.maxEffects, lb.attack_frames, lb.move_type, skills);
    return lbOut;
}

function addChainInfoToSkill(skill, effects, attackFrames, moveType, skills) {
    let hasDamage = false;
    let chainTag = false;
    let chain = [];
    let attackFrameIndex = 0;
    effects.forEach((effect) => {
        if (effect.effect && effect.effect.damage) {
            hasDamage = true;
            chain = chain.concat(attackFrames[attackFrameIndex]);
            attackFrameIndex++;
        }
        if (effect.effect && effect.effect.chainTag) {
            chainTag = true;
        }
    });
    if (hasDamage) {
        skill.frames = chain;
        let chainId = moveTypes[moveType] + ',' + chain.join(',');
        if (chainingFamilies[chainId]) {
            skill.chainFamily = chainingFamilies[chainId];
        }
        if (chainTag) {
            skill.chainTag = true;
        }
        skill.move = moveTypes[moveType];
    }
}

function parseActiveRawEffect(rawEffect, skillIn, skills, unit, skillId, enhancementLevel = 0) {
    var result = null;

    // Physical Damage
    if (rawEffect[2] == 1) {
        if (rawEffect[3].length != 7 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0  && rawEffect[3][5] != 0) {
            console.log("Strange Physic damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][6]/100}};

        // Healing
    } else if(rawEffect[2] == 2){
        result= {"heal":{"base":rawEffect[3][2], "coef":rawEffect[3][3]/100}}

        // Stat buff
    } else if (rawEffect[2] == 3) {
        result = {};
        addStatsBuff(result, rawEffect[3]);

        // raise
    } else if (rawEffect[2] == 4) {
        result = {"noUse":true};

        // remove status
    } else if (rawEffect[2] == 5) {
        result = {"noUse":true};

        // inflict status
    } else if (rawEffect[2] == 6) {
        result = {"noUse":true};

        // Status ailment resistance
    } else if (rawEffect[2] == 7) {
        result = {};
        var ailmentsData = rawEffect[3];
        addAilmentResist(result, ailmentsData);
        result.turns = ailmentsData[9];

        // Healing over time
    } else if(rawEffect[2] == 8){
        result={"healOverTurn":{"base":rawEffect[3][2], "coef":rawEffect[3][0]/100}}
        if (rawEffect[3][3] > 0) {
            result.healOverTurn.turns = rawEffect[3][3];
        }

        // hp% damage (gravity)
    } else if (rawEffect[2] == 9) {
        result = {"noUse":true};

        // mp drain (osmose)
    } else if (rawEffect[2] == 10) {
        result = {"noUse":true};

        // self sacrifice
    } else if (rawEffect[2] == 11) {
        result = {"noUse":true};

        // Delayed damage
    } else if (rawEffect[2] == 13) {
        if (rawEffect[3].length != 6 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0) {
            console.log("Strange Delayed damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][5]/100, delay:rawEffect[3][0]}};

        // Magical Damage
    } else if (rawEffect[2] == 15) {
        if (rawEffect[3].length != 6 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0) {
            console.log("Strange Magic damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][5]/100}};

        // flat Restore HP
    } else if (rawEffect[2] == 16) {
        result = {"noUse":true};

        // recover MP
    } else if (rawEffect[2] == 17) {
        result = {"noUse":true};

        //Physical mitigation
    } else if (rawEffect[2] == 18) {
        result = {"noUse":true, "physicalMitigation":rawEffect[3][0], "turns":rawEffect[3][1]};
        //Magical mitigation
    } else if (rawEffect[2] == 19) {
        result = {"noUse":true, "magicalMitigation":rawEffect[3][0], "turns":rawEffect[3][1]};

        // buff next normal attack (store)
    } else if (rawEffect[2] == 20) {
        result = {"noUse":true};

        // Physical Damage with ignore DEF
    } else if (rawEffect[2] == 21) {
        if (rawEffect[3].length != 4 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0) {
            console.log("Strange Physic damage with ignoe DEF");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][2]/100, "ignore":{"def":-rawEffect[3][3]}}};

        // Damage increased against a race
    } else if (rawEffect[2] == 22) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":1, "ifUsedAgain":{"race":raceMap[rawEffect[3][0]], "coef":rawEffect[3][3]/100}}};

        // 1x mag dmg with race-specific damage boost. - skill 200840, 231747 - rawEffect[3][raceMap, ?, ?, dmgMultiplier]
    } else if (rawEffect[2] == 23) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":1, "ifUsedAgain":{"race":raceMap[rawEffect[3][0]], "coef":rawEffect[3][3]/100}}};

        // break
    } else if (rawEffect[2] == 24) {
        result = {};
        if (rawEffect[1] == 1) {
            addBreak(result, rawEffect[3]);
        } else {
            addStatsBuff(result, rawEffect[3]);
        }

        // hp drain - [%drain, dmgCoef, ?]
    } else if (rawEffect[2] == 25) {

        result = {"damage":{"mecanism":"magical", "coef":rawEffect[3][1]/100}};
        if (skillIn.attack_type) {
            result.damage.mecanism = skillIn.attack_type.toLocaleLowerCase();
        }

        // % hp restore
    } else if (rawEffect[2] == 26) {
        result = {"noUse":true};

        // auto reraise
    } else if (rawEffect[2] == 27) {
        result = {"noUse":true};

        // st healing items are aoe
    } else if (rawEffect[2] == 28) {
        result = {"noUse":true};

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

        // recover mp (over time) - quick blooming soul
    } else if (rawEffect[2] == 30) {
        result = {"noUse":true};

        // entrust
    } else if (rawEffect[2] == 31) {
        result = {"noUse":true};

        // fill esper gauge by x-y
    } else if (rawEffect[2] == 32) {
        result = {"noUse":true};

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

        // inflict multiple status
    } else if (rawEffect[2] == 34) {
        result = {"noUse":true};

        // Auto KO
    } else if (rawEffect[2] == 35) {
        result = {"noUse":true};

        // steal item (vaan lb)
    } else if (rawEffect[2] == 37) {
        result = {"noUse":true};

        // % chance hp restore or nothing
    } else if (rawEffect[2] == 38) {
        result = {"noUse":true};

        // sacrifice x% hp to do y% damage - 202820 - [?, sacrifice%, ?, dmg%, ?, ?]
    } else if (rawEffect[2] == 39) {
        result = {"noUse":true};

        // Hybrid damage
    } else if (rawEffect[2] == 40) {
        if (rawEffect[3].length != 10 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0 && rawEffect[3][5] != 0 && rawEffect[3][6] != 0 && rawEffect[3][7] != 0 && rawEffect[3][8] != rawEffect[3][9]) {
            console.log("Strange hybrid damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"hybrid", "coef":rawEffect[3][8]/100}};

        // fixed damage
    } else if (rawEffect[2] == 41) {
        result = {"noUse":true};

        // Combo damage
    } else if (rawEffect[2] == 42) {
        if (rawEffect[3].length != 5 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0) {
            console.log("Strange Combo");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][4]/100, "combo": true, "minTime":rawEffect[3][2], "maxTime":rawEffect[3][3]}};

        // Critical Physical Damage
    } else if (rawEffect[2] == 43) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][2]*1.5/100}};

        // Dual Black Magic
    } else if (rawEffect[2] == 44) {
        return {
            "multicast": {
                "time": 2,
                "type": ["blackMagic"]
            }
        }

        // Dualcast
    } else if (rawEffect[2] == 45) {
        return {
            "multicast": {
                "time": 2,
                "type": ["whiteMagic", "greenMagic", "blackMagic"]
            }
        };

        // enemy info
    } else if (rawEffect[2] == 47) {
        result = {"noUse":true};

        // drink
    } else if (rawEffect[2] == 48) {
        result = {"noUse":true};

        // throw
    } else if (rawEffect[2] == 50) {
        result = {"noUse":true};

        // escape
    } else if (rawEffect[2] == 51) {
        result = {"noUse":true};

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
                "type": [magicType]
            }
        };

        // Jump damage
    } else if (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 52) {
        if (rawEffect[3].length != 5 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != rawEffect[3][3]) {
            console.log("Strange Jump damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][4]/100, "jump":true, delay:rawEffect[3][3]}};

        // hide skills
    } else if (rawEffect[2] == 53 && rawEffect[3].length == 2) {
        result = {"noUse":true};


        // multicast skills
    } else if (rawEffect[2] == 53 && rawEffect[3].length > 2) {

        let result = {
            "multicast": {
                "time": rawEffect[3][0],
                "type": ["skills"],
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

        // Dodge x physical attacks
    } else if (rawEffect[2] == 54) {
        result = {"noUse":true, "mirage":rawEffect[3][0], "turns":rawEffect[3][1]};

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

        // hp restore over turn - [healMod, ?, flatHeal, turns]
    } else if (rawEffect[2] == 56) {
//        result = null;
        result={"healOverTurn":{"base":rawEffect[3][2], "coef":rawEffect[3][0]/100}}
        if (rawEffect[3][3] > 0) {
            result.healOverTurn.turns = rawEffect[3][3];
        }

        // mp restore over turn
    } else if (rawEffect[2] == 57) {
        result = {"noUse":true};

        // stat buff - [atk, def, mag, spr, turns, ?]
    } else if (rawEffect[2] == 58) {
//        result = null;
        result = {};
        addStatsBuff(result, rawEffect[3]);

        // Remove all debuff
    } else if (rawEffect[2] == 59) {
        result = {"noUse":true};

        // inflict charm
    } else if (rawEffect[2] == 60) {
        result = {"noUse":true};

        // Draw attacks
    } else if (rawEffect[2] == 61) {
        result = {"drawAttacks":rawEffect[3][0], "turns": rawEffect[3][1]};

        // lb fill buff - 912590 - [%boost, turns]
    } else if (rawEffect[2] == 63 && rawEffect[3].length == 2) {
        result = null;

        // % hp/mp restore
    } else if (rawEffect[2] == 64) {
        result = {"noUse":true};

        // flat recover HP/MP
    } else if (rawEffect[2] == 65) {
        result = {"noUse":true};

        // increase hp for ally
    } else if (rawEffect[2] == 66) {
        result = {"noUse":true};

        // Self inflict Berserk
    } else if (rawEffect[2] == 68) {
        result = {"berserk":{"percent":rawEffect[3][1], "duration":rawEffect[3][0]}};

        // Magical Damage with ignore SPR
    } else if (rawEffect[2] == 70) {
        if (rawEffect[3].length != 4 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0) {
            console.log("Strange Magic damage with ignoe SPR");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][2]/100, "ignore":{"spr":rawEffect[3][3]}}};

        // use skill - [skillNumber, ?]
    } else if (rawEffect[2] == 71 && rawEffect[3].length == 2) {
        result = null;

        // Magical Damage with stacking
    } else if (rawEffect[2] == 72) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":(rawEffect[3][2] + rawEffect[3][3])/100, "stack":rawEffect[3][4]/100, "maxStack":rawEffect[3][5] - 1}};

        // steal gil
    } else if (rawEffect[2] == 76) {
        result = {"noUse":true};

        // Physical Damage with HP sacrifice
    } else if (rawEffect[2] == 81) {
        if (rawEffect[3].length != 7 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != 0 && rawEffect[3][3] != 0 && rawEffect[3][4] != 0  && rawEffect[3][5] != 0) {
            console.log("Strange Physic damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][6]/100}, hpSacrifice:rawEffect[3][7]};

        // use random ability. - same as 29 - [[skillId, chance]]
    } else if (rawEffect[2] == 82) {
        result = null;

        // reduce self hp to 1
    } else if (rawEffect[2] == 83) {
        result = {"noUse":true};

        // nullify next magic
    } else if (rawEffect[2] == 84) {
        result = {"noUse":true};

        // reflect
    } else if (rawEffect[2] == 86) {
        result = {"noUse":true};

        // inflict stop
    } else if (rawEffect[2] == 88) {
        result = {"noUse":true};

        // Break, stop and charm resistance with turn number - see [55]
        // } else if (rawEffect[2] == 89 || rawEffect[2] == 55) {

        // single skill mag buff - [%boost, cap, ?]
    } else if (rawEffect[2] == 90) {
        result = {"noUse":true};

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

        // AOE Cover
    } else if (rawEffect[2] == 96) {
        result = {"aoeCover":{}, "turns": rawEffect[3][6]};
        result.aoeCover.type = (rawEffect[3][rawEffect[3].length - 1] == 1 ? "physical": "magical");
        result.aoeCover.mitigation = {"min": rawEffect[3][2], "max": rawEffect[3][3]};
        result.aoeCover.chance = rawEffect[3][4];

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
                    "multicast":{"time":rawEffect[3][1],"type":[magicType]}
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

        // Gain Multicast ability
    } else if (rawEffect[2] == 98) {
        var gainedSkillId = rawEffect[3][1].toString();

        var gainedSkill = skills[gainedSkillId];
        if (gainedSkill) {
            gainedEffect = {
                "multicast": {
                    "time": rawEffect[3][0],
                    "type": ["skills"],
                    "skills":[]
                }
            }
            let desc = "Enable unit to use ";
            let skillsDesc = [];
            for (var i = 0, len = rawEffect[3][3].length; i < len; i++) {
                var skill = skills[rawEffect[3][3][i]];
                if (skill) {
                    gainedEffect.multicast.skills.push({"id": rawEffect[3][3][i].toString(), "name": skill.name});
                    skillsDesc.push(skill.name + '(' + rawEffect[3][3][i].toString() + ')');
                }
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

        // Gain Skill
    } else if (rawEffect[2] == 100) {
        result = {
            "gainSkills": {
                "skills": []
            }
        }
        if (rawEffect[3][3] > 1) {
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
            result.gainSkills.skills.push({
                "id":gainedSkillIds[i].toString(),
                "name":gainedSkillName
            });

            if (gainedSkill) {
                if (!unit.unlockedSkillAdded) {
                    unit.unlockedSkillAdded = [];
                }
                if (!unit.unlockedSkillAdded.includes(gainedSkillIds[i].toString())) {
                    unit.unlockedSkillAdded.push(gainedSkillIds[i].toString())
                    addUnlockedSkill(gainedSkillIds[i].toString(), parseActiveSkill(gainedSkillIds[i].toString(), gainedSkill, skills, unit), unit, skillId);
                }
            }
        }

        //Global mitigation
    } else if (rawEffect[2] == 101) {
        result = {"noUse":true, "globalMitigation":rawEffect[3][0], "turns":rawEffect[3][1]};

        // Physical Damage from DEF
    } else if (rawEffect[2] == 102) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][2]/100, use: {"stat":"def", "percent":rawEffect[3][0], "max":rawEffect[3][1]}}};

        // Magical Damage from SPR
    } else if (rawEffect[2] == 103) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][2]/100, use: {"stat":"spr", "percent":rawEffect[3][0], "max":rawEffect[3][1]}}};

        // mp-based m_damage - raw doesn't make sense
    } else if (rawEffect[2] == 105) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][2]/100, use: {"stat":"mp", "percent":rawEffect[3][0], "max":rawEffect[3][1]}}};

        // cure breaks
    } else if (rawEffect[2] == 111) {
        result = {"noUse":true};

        // death or p_damage with def ignore - skill 503660 : [skill mod, death chance, damage chance, def ignore]
    } else if (rawEffect[2] == 112) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][0]/100, "ignore":{"def":rawEffect[3][3]}}};

        // death or m_damage - skill 511703 : [skill mod, death chance, damage chance, spr ignore]
    } else if (rawEffect[2] == 113) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][0]/100, "ignore":{"spr":rawEffect[3][3]}}};

        // Gain counters when ally is hit
    } else if (rawEffect[2] == 118) {
        result = {"noUse":true};

        // counter attacks - [%chance, stat[a,m,d,s], coef, effectTurns, ?, max/turn]
    } else if (rawEffect[2] == 119) {
        result = {"noUse":true};

        // +LB damage
    } else if (rawEffect[2] == 120) {
        result = {"statsBuff":{"lbDamage":rawEffect[3][0]}, "turns":rawEffect[3][1]};

        // Grant immunity to death to allies except self for x turns
    } else if (rawEffect[2] == 122) {
        result = {"noUse":true};

        // Gain counters when ally is hit
    } else if (rawEffect[2] == 123) {
        result = {"noUse":true};

        // Evo Damage
    } else if(rawEffect[2] == 124){
        result = {"damage":{"mecanism":"summonerSkill", "damageType":"evoke", "magCoef":rawEffect[3][7]/100, "sprCoef":rawEffect[3][8]/100, "magSplit":0.5, "sprSplit":0.5}};
        if (rawEffect[3].length >= 10 && Array.isArray(rawEffect[3][9])) {
            result.damage.magSplit = rawEffect[3][9][0] / 100;
            result.damage.sprSplit = rawEffect[3][9][1] / 100;
        }

        // +LB
    } else if (rawEffect[2] == 125) {
        result = {"lbFill":{"min":rawEffect[3][0]/100, "max":rawEffect[3][1]/100}};

        // Physical Damage with stacking
    } else if (rawEffect[2] == 126) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":(rawEffect[3][3] + rawEffect[3][4])/100, "stack":rawEffect[3][5]/100, "maxStack":rawEffect[3][6] - 1}};

        // HP barrier
    } else if (rawEffect[2] == 127) {
        result = {"noUse":true};

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

        // m_damage over turn - example 228350 - [?, coef/turn, ?, effectTurns, ?, ?]
    } else if (rawEffect[2] == 131) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][1]/100}};

        // auto cast skill later
    } else if (rawEffect[2] == 132) {
        result = {"noUse":true};

        // steal debuffs from allies
    } else if (rawEffect[2] == 133) {
        result = {"noUse":true};

        // Timed Jump
    } else if (rawEffect[2] == 134) {
        if (rawEffect[3].length != 5 && rawEffect[3][0] != 0 && rawEffect[3][1] != 0 && rawEffect[3][2] != rawEffect[3][3]) {
            console.log("Strange Timed Jump damage");
            console.log(rawEffect);
        }
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][4]/100, "jump":true, delay:rawEffect[3][2]}};

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

        // damage over turn - [stat, coef/turn, ?, ?, turns, ?, ?]
    } else if (rawEffect[2] == 139 && (rawEffect[3][0] == 1 || rawEffect[3][0] == 2)) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":rawEffect[3][1]/100}};
    } else if (rawEffect[2] == 139 && (rawEffect[3][0] == 3 || rawEffect[3][0] == 4)) {
        result = {"damage":{"mecanism":"magical", "damageType":"mind", "coef":rawEffect[3][1]/100}};

        // remove buffs from enemy
    } else if (rawEffect[2] == 141) {
        result = {"noUse":true};

        // remove zombie
    } else if (rawEffect[2] == 148) {
        result = {"noUse":true};

        // increase element damage - [phys/mag, [elements], ?, turns, ?]
    } else if (rawEffect[2] == 149) {
        let valueByElement = {};
        for (let i = 0; i < 8; i++) {
            if (rawEffect[3][1][i]) {
                valueByElement[elements[i]] = rawEffect[3][1][i];
            }
        }

        let desc = Object.keys(valueByElement).map(element => `Increase ${rawEffect[3][0] ? 'magical' : 'physical'} ${element} damage by ${valueByElement[element]}% to ${getTargetDesc(rawEffect)} for ${getTurn(rawEffect[3][3])}`).join('\n');

        if (rawEffect[3][0]) {
            result = {"magicalElementDamageBoost": valueByElement, "turns": rawEffect[3][3], desc: desc};
        } else {
            result = {"physicalElementDamageBoost": valueByElement, "turns": rawEffect[3][3], desc: desc};
        }

        // reduce p_damage from enemy types [[[raceMap, %] || -1] x6], ?, turns, ?
    } else if (rawEffect[2] == 153) {
        result = {"noUse":true};

        // reduce m_damage from enemy types [[[raceMap, %] || -1] x6], ?, turns, ?
    } else if (rawEffect[2] == 154) {
        result = {"noUse":true};

        // use skill once - [skillId, ?, ?, ?, ?, ?, ?, ?, ?]
    } else if (rawEffect[2] == 157) {
        // handled elsewhere

        // p_damage + break mechanics damage - [typeMap, breakDamage, ?, p_damage, ?, ?] - only p_damage matters
    } else if (rawEffect[2] == 159) {
        result = {"damage":{"mecanism":"physical", "damageType":"body", "coef":1}};

        // enable area effect? - nv terra lb
    } else if (rawEffect[2] == 160) {
        result = {"noUse":true};

        // increase accuracy for x turns - [accurace, ?, turns, ?, ?]
    } else if (rawEffect[2] == 162) {
        result = {"noUse":true};

        // weapon imperils - [typeMap, ignoreDef, IgnoreSpr, ?, duration, ?] - https://github.com/lyrgard/ffbeEquip/issues/485
    } else if (rawEffect[2] == 163) {
        result = {"weaponImperil":{"weaponType":typeMap[rawEffect[3][0]], "value":rawEffect[3][1]}, "turns":rawEffect[3][4], desc:`Increase damage dealt by ${typeMap[rawEffect[3][0]]} to ${getTargetDesc(rawEffect)} by ${rawEffect[3][1]}% for ${getTurn(rawEffect[3][4])}`};

        // tag team effects - single unit chains an ability/lb cast
    } else if (rawEffect[2] == 165) {
        result = {"chainTag":true};

        // delay death timer
    } else if (rawEffect[2] == 1002) {
        result = {"noUse":true};

        // fill lb gauge by x% [?, fill%]
    } else if (rawEffect[2] == 1003) {
        result = {"noUse":true};

        // mirror positive status effects
    } else if (rawEffect[2] == 1005) {
        result = {"noUse":true};

        // enable skills
    } else if (rawEffect[2] == 1006) {
        result = null;

        // physical damage with mod boost next turn - flat + stacking mod?
    } else if (rawEffect[2] == 1007) {
        result = {"noUse":true};

        // add rgb color to caster
    } else if (rawEffect[2] == 1009) {
        result = {"noUse":true};

        // caster takes % hp damage at end of turn
    } else if (rawEffect[2] == 1010) {
        result = {"noUse":true};

        // skip a turn
    } else if (rawEffect[2] == 1011) {
        result = {"noUse":true};

        // fixed damage per status ailment
    } else if (rawEffect[2] == 1012) {
        result = {"noUse":true};

        // multi-targetting
    } else if (rawEffect[2] == 1013) {
        result = {"noUse":true};

        // unknown.
    } else if (rawEffect[2] == 1014) {
        result = {"noUse":true};

        // CoW morale boost
    } else if (rawEffect[2] == 1015) {
        result = {"noUse":true, "moraleFill": rawEffect[3][0]};

        // CoW morale boost
    } else if (rawEffect[2] == 1016) {
        let baseCoef = rawEffect[3][0] / 100;
        let damageType = rawEffect[3][1];
        let monsterReceivingStatType = rawEffect[3][0];
        let coefIncreaseByStep = rawEffect[3][3] / 100;
        let coefIncreaseMoraleStep = rawEffect[3][4];
        let coefIncreaseMoraleBottomThreshold = rawEffect[3][5];
        result = {damage:{coef:baseCoef, coefIncreaseByStep: coefIncreaseByStep, coefIncreaseMoraleStep: coefIncreaseMoraleStep, coefIncreaseMoraleBottomThreshold: coefIncreaseMoraleBottomThreshold}};
        if (damageType === 1) {
            result.damage.mecanism = "physical";
            result.damage.damageType = "body";
        } else if (damageType === 2) {
            result.damage.mecanism = "magical";
            result.damage.damageType = "mind";
        } else if (damageType === 3) {
            result.damage.mecanism = "hybrid";
        }

        // Absorb dark damage
    } else if (skillId == 1017) {
        result = {"noUse":true};

        // empty skill - skill a randomly calls skill b or skill c. skill b has effects, skill c does not.
    } else if (skillId == 500410) {
        result = {"noUse":true};

        // catch new or unknown effects - remove if's as support is added/verified.
    } else {
        if (rawEffect[2] == 23) {
            console.log(skillId + " - 1x mag dmg with race-specific damage boost.");
        } else if (rawEffect[2] == 25) {
            console.log(skillId + " - hp drain");
        } else if (rawEffect[2] == 56) {
            console.log(skillId + " - hp restore over turn");
        } else if (rawEffect[2] == 58) {
            console.log(skillId + " - stat buff");
        } else if (rawEffect[2] == 63 && rawEffect[3].length == 2) {
            console.log(skillId + " - lb fill buff");
        } else if (rawEffect[2] == 71 && rawEffect[3].length == 2) {
            console.log(skillId + " - use skill");
        } else if (rawEffect[2] == 112) {
            console.log(skillId + " - death or p_damage with def ignore");
        } else if (rawEffect[2] == 113) {
            console.log(skillId + " - death or m_damage ");
        } else if (rawEffect[2] == 131) {
            console.log(skillId + " - m_damage over turn");
        } else if (rawEffect[2] == 139) {
            console.log(skillId + " - p_damage over turn");
        } else if (rawEffect[2] == 149) {
            console.log(skillId + " - " + skillIn.effects["effects_raw"]);
        } else if (rawEffect[2] == 157) {
            console.log(skillId + " - use skill once");
        } else if (rawEffect[2] == 159) {
            console.log(skillId + " - 1x p_damage and break mechanics");
        } else if (rawEffect[2] == 162) {
            console.log(skillId + " - increase accuracy for x turns");
        } else if (rawEffect[2] == 163) {
            console.log(skillId + " - weapon imperils");
        } else if (rawEffect[2] == 1003) {
            console.log(skillId + " - fill lb gauge by x%");
        } else if (rawEffect[2] == 1006) {
            console.log(skillId + " - enable skills");
        } else if (rawEffect[2] == 1007) {
            console.log(skillId + " - physical damage with mod boost next turn");
        } else {
            console.log("Unknown effect" + skillId);
        }
        console.log(rawEffect);
    }
    if (result && result.damage) {
        if (skillIn.attack_type) {
            result.damage.mecanism = skillIn.attack_type.toLocaleLowerCase();
        } else {
            result.damage.mecanism = skillIn.damage_type.toLocaleLowerCase();
        }
        if (!result.damage.damageType) {
            if (result.damage.mecanism == 'physical') {
                result.damage.damageType = 'body';
            } else if (result.damage.mecanism == 'magical') {
                result.damage.damageType = 'mind';
            }
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

function getTargetDesc(rawEffect) {
    if (rawEffect[0] == 0) {
        return "self";
    } else if (rawEffect[0] == 1) {
        if (rawEffect[1] == 0) {
            return "self";
        } else if (rawEffect[1] == 1) {
            return "one enemy";
        } else if (rawEffect[1] == 2) {
            return "one ally";
        } else if (rawEffect[1] == 3) {
            return "self"
        } else if (rawEffect[1] == 4) {
            return 'one ally'
        } else if (rawEffect[1] == 5) {
            return 'one other ally'
        } else if (rawEffect[1] == 6) {
            return 'one target'
        }
    } else if (rawEffect[0] == 2) {
        if (rawEffect[1] == 0) {
            return "self";
        } else if (rawEffect[1] == 1) {
            return "all enemies";
        } else if (rawEffect[1] == 2) {
            return "all allies";
        } else if (rawEffect[1] == 3) {
            return "self"
        } else if (rawEffect[1] == 4) {
            return 'all allies'
        } else if (rawEffect[1] == 5) {
            return 'all other allies'
        } else if (rawEffect[1] == 6) {
            return 'all allies/enemies'
        }
    } else {
        if (rawEffect[1] == 0) {
            return "self";
        } else if (rawEffect[1] == 1) {
            return "one random enemy";
        } else if (rawEffect[1] == 2) {
            return "one random ally";
        } else if (rawEffect[1] == 3) {
            return "self"
        } else if (rawEffect[1] == 4) {
            return 'one random ally'
        } else if (rawEffect[1] == 5) {
            return 'one random ally but self'
        } else if (rawEffect[1] == 6) {
            return 'one random target'
        }
    }
}

function getTurn(turnNumber) {
    if (turnNumber === 0) {
        return "this turn";
    } else if (turnNumber === 0) {
        return '1 turn';
    } else {
        return `${turnNumber} turns`;
    }
}

function addUnlockedSkill(gainedSkillId, gainedSkill, unit, unlockedBy) {
    var alreadyAdded = false;
    var activesAndMagics = unit.actives.concat(unit.magics);
    for (var i = activesAndMagics.length; i--;) {
        if (activesAndMagics[i].id == gainedSkillId) {
            alreadyAdded = true;
            if (unlockedBy) {
                if (!activesAndMagics[i].unlockedBy) {
                    activesAndMagics[i].unlockedBy = [];
                }
                if (!activesAndMagics[i].unlockedBy.includes(unlockedBy.toString())) {
                    activesAndMagics[i].unlockedBy.push(unlockedBy.toString());    
                }
                
            }
            break;
        }
    }
    if (!alreadyAdded) {
        if (unlockedBy) {
            gainedSkill.unlockedBy = [unlockedBy.toString()];
        }
        if (gainedSkill.magic) {
            unit.magics.push(gainedSkill);
        } else {
            unit.actives.push(gainedSkill);
        }
    }
}

function addToStat(skill, stat, value) {
    if (value) {
        if (!skill[stat]) {
            skill[stat] = value;
        } else {
            skill[stat] += value;
        }
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

function addToResistList(item, resist) {
    if (!item.resist) {
        item.resist = [];
    }
    for (var i = 0, len = item.resist.length; i < len; i++) {
        if (item.resist[i].name == resist.name) {
            item.resist[i].percent += resist.percent;
            return;
        }
    }
    item.resist.push(resist);
}

function addToAilmentsList(item, ailment) {
    if (!item.ailments) {
        item.ailments = [];
    }
    for (var i = item.ailments.length; i--;) {
        if (item.ailments[i].name == ailment.name) {
            item.ailments[i].percent += ailment.percent;
            return;
        }
    }
    item.ailments.push(ailment);
}

function addElementalResist(item, values) {
    for (var index in elements) {
        if (values[index]) {
            addToResistList(item, {"name":elements[index],"percent":values[index]});
        }
    }
}

function addAilmentResist(item, values) {
    for (var index in ailments) {
        if (values[index]) {
            addToResistList(item, {"name":ailments[index],"percent":values[index]});
        }
    }
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
        item.break.atk = Math.abs(values[0]);
    }
    if (values[1]) {
        item.break.def = Math.abs(values[1]);
    }
    if (values[2]) {
        item.break.mag = Math.abs(values[2]);
    }
    if (values[3]) {
        item.break.spr = Math.abs(values[3]);
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
    item.turns = values[4];
}

function addLbPerTurn(item, min, max) {
    if (!item.lbPerTurn) {
        item.lbPerTurn = {"min":0, "max":0};
    }
    item.lbPerTurn.min += min;
    item.lbPerTurn.max += max;
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

var properties = ["id","name","jpname","type","roles","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","evokeDamageBoost","evade","singleWielding","singleWieldingOneHanded","dualWielding", "oneWeaponMastery","improvedDW", "chainMastery","damageVariance","jumpDamage","lbFillRate", "lbPerTurn","element","partialDualWield","resist","ailments","killers","mpRefresh","lbDamage","esperStatsBonus","drawAttacks","skillEnhancement","replaceLb","special", "allowUseOf","exclusiveSex","exclusiveUnits", "exclusiveRoles","equipedConditions", "equipedConditionIsOr","levelCondition","exLevelCondition" ,"tmrUnit","access","icon"];

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

function formatUnit(unit, prefix = "", form = null) {
    result = getUnitBasicInfo(unit,prefix, form) + ",";
    if (unit.enhancements && unit.enhancements.length > 0) {
        result += "\n\t\t\"enhancements\": [";
        for (var i = 0, len = unit.enhancements.length; i < len; i++) {
            result += "\n\t\t\t" + JSON.stringify(unit.enhancements[i]);
            if (i < unit.enhancements.length - 1) {
                result += ",";
            }
        }
        result += "\n\t\t],";
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
    if (!form && unit["6_form"]) {
        result += ",\n\t\t\"6_form\": {" + formatUnit(unit["6_form"], "\t", 6) + "\n\t\t}";
    }
    if (unit["7_form"]) {
        result += ",\n\t\t\"7_form\": {" + formatUnit(unit["7_form"], "\t", 7) + "\n\t\t}";
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
            result += ",\n\t\t\"6_form\": {" + getUnitBasicInfo(unit["6_form"], "\t", 6) + "\n\t\t}";
        }
        if (unit["7_form"]) {
            result += ",\n\t\t\"7_form\": {" + getUnitBasicInfo(unit["7_form"], "\t", 7) + "\n\t\t}";
        }
        result += "\n\t}";
    }
    result += "\n}";
    return result;
}

function getUnitBasicInfo(unit, prefix = "", form = null) {
    var result = "\n" + prefix + "\t\t\"name\":\"" + unit.name.replace(/"/g, '\\"').replace(/ - Brave Shifted/g, "").replace(/ BS$/g, "") + (unit.braveShifted ? " BS" : '') + "\",";
    if (unit.jpname) {
        result += "\n" + prefix + "\t\t\"jpname\":\"" + unit.jpname.replace(/"/g, '\\"').replace(/ - Brave Shifted/g, "") + (unit.braveShifted ? " BS" : '') + "\",";
    }
    result += "\n" + prefix + "\t\t\"roles\":" + JSON.stringify(unit.roles) + ",";
    if (unit.wikiEntry) {
        result += "\n" + prefix + "\t\t\"wikiEntry\":\"" + unit.wikiEntry + "\",";
    }
    result += "\n" + prefix + "\t\t\"id\":\"" + unit.id + "\",";
    if (form == 6) {
        result += "\n" + prefix + "\t\t\"sixStarForm\":true,";
    }
    if (form == 7) {
        result += "\n" + prefix + "\t\t\"sevenStarForm\":true,";
    }
    if (unit.unreleased7Star) {
        result += "\n" + prefix + "\t\t\"unreleased7Star\":true,";
    }
    if (unit.braveShift) {
        result += "\n" + prefix + "\t\t\"braveShift\":\"" + unit.braveShift + "\",";
    }
    if (unit.braveShifted) {
        result += "\n" + prefix + "\t\t\"braveShifted\":\"" + unit.braveShifted + "\",";
    }
    if (unit.exAwakenings) {
        result += "\n" + prefix + "\t\t\"exAwakening\": " + JSON.stringify(unit.exAwakenings) + ',';
    }
    if (unit.fragmentId) {
        result += "\n" + prefix + "\t\t\"fragmentId\": " + JSON.stringify(unit.fragmentId) + ',';
    }
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
    result += "\n" + prefix + "\t\t\t\"minStats\":" + JSON.stringify(unit.stats.minStats) + ",";
    result += "\n" + prefix + "\t\t\t\"pots\":" + JSON.stringify(unit.stats.pots);
    result += "\n" + prefix + "\t\t},";
    result += "\n" + prefix + "\t\t\"stats_pattern\":" + unit.stats_pattern + ",";
    result += "\n" + prefix + "\t\t\"equip\":" + JSON.stringify(unit.equip);
    if (unit.enhancementSkills.length > 0) {
        result += ",\n" + prefix + "\t\t\"enhancementSkills\":" + JSON.stringify(unit.enhancementSkills);
    }
    
    return result;
}

function formatForSearch(units) {
    var result = "[\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId];
        if (unit.unreleased7Star) {
            unit = unit["6_form"];
        }
        if (unit.id) {
            var unitOut = {"passives":{}, "actives":{"SELF":{}, "ST":{},"AOE":{}}, "lb":{"SELF":{}, "ST":{},"AOE":{}}, "counter":{"SELF":{}, "ST":{},"AOE":{}}};
            unitOut.equip = unit.equip;
            unitOut.id = unit.id;
            unitOut.minRarity = unit.min_rarity.toString();
            unitOut.maxRarity = unit.max_rarity.toString();
            unitOut.roles = unit.roles;
            
            
            if (unit.innates.resist) {
                for (var resistIndex = unit.innates.resist.length; resistIndex--;) {
                    var resist = unit.innates.resist[resistIndex];
                    if (elements.includes(resist.name)) {
                        if (!unitOut.passives.elementalResist) {
                            unitOut.passives.elementalResist = {};
                        }
                        addToStat(unitOut.passives.elementalResist, resist.name, resist.percent);
                    } else {
                        if (!unitOut.passives.ailmentResist) {
                            unitOut.passives.ailmentResist = {};
                        }
                        addToStat(unitOut.passives.ailmentResist, resist.name, resist.percent);
                    }
                }
            }
            
            var passivesWithOnlyBestEnhancements = [];
            for (var i = 0, leni = unit.passives.length; i < leni; i++) {
                var skill = unit.passives[i];
                if (passivesWithOnlyBestEnhancements.length != 0) {
                    if (skill.name.match(/.* \+\d$/)) {
                        passivesWithOnlyBestEnhancements[passivesWithOnlyBestEnhancements.length - 1] = skill;
                        continue;
                    }
                }
                passivesWithOnlyBestEnhancements.push(skill);
            }
            
            for (var i = passivesWithOnlyBestEnhancements.length; i--;) {
                var skill = passivesWithOnlyBestEnhancements[i];
                addSkillEffectToSearch(skill, skill.effects, unitOut, "passives");
            }
            var activeAndMagic = unit.actives.concat(unit.magics);
            for (var i = activeAndMagic.length; i--;) {
                var skill = activeAndMagic[i];
                addSkillEffectToSearch(skill, skill.effects, unitOut, "actives");
            }
            if (unit.lb) {
                addSkillEffectToSearch(unit.lb, unit.lb.maxEffects, unitOut, "lb");
            }
            if (first) {
                first = false;
            } else {
                result += ",\n";
            }
            result += "\t" + JSON.stringify(unitOut);
        }
    }
    result += "\n]";
    return result;
}

function addSkillEffectToSearch(skill, effects, unitOut, effectType) {
    let chainTag = effects.some(effect => effect.effect && effect.effect.chainTag);
    for (var i = effects.length; i--;) {
        var effect = effects[i];
        if (effect.effect) {
            var effectOut;
            if (effectType == "passives") {
                effectOut = unitOut.passives;
            } else {
                effectOut = unitOut[effectType][effect.effect.area];
                if (!effectOut) {
                    continue;
                }
            }
            
            if (effect.effect.imperil) {
                if (!effectOut.imperil) {
                    effectOut.imperil = {};
                }
                var imperiledElements = Object.keys(effect.effect.imperil);
                for (var j = imperiledElements.length; j--;) {
                    var element = imperiledElements[j];
                    if (!effectOut.imperil[element] || effectOut.imperil[element] < effect.effect.imperil[element]) {
                        effectOut.imperil[element] = effect.effect.imperil[element];
                    }
                }
            } else if (effect.effect.physicalElementDamageBoost) {
                if (!effectOut.physicalElementDamageBoost) {
                    effectOut.physicalElementDamageBoost = {};
                }
                var boostedElements = Object.keys(effect.effect.physicalElementDamageBoost);
                for (var j = boostedElements.length; j--;) {
                    var element = boostedElements[j];
                    if (!effectOut.physicalElementDamageBoost[element] || effectOut.physicalElementDamageBoost[element] < effect.effect.physicalElementDamageBoost[element]) {
                        effectOut.physicalElementDamageBoost[element] = effect.effect.physicalElementDamageBoost[element];
                    }
                }
            } else if (effect.effect.magicalElementDamageBoost) {
                if (!effectOut.magicalElementDamageBoost) {
                    effectOut.magicalElementDamageBoost = {};
                }
                var boostedElements = Object.keys(effect.effect.magicalElementDamageBoost);
                for (var j = boostedElements.length; j--;) {
                    var element = boostedElements[j];
                    if (!effectOut.magicalElementDamageBoost[element] || effectOut.magicalElementDamageBoost[element] < effect.effect.magicalElementDamageBoost[element]) {
                        effectOut.magicalElementDamageBoost[element] = effect.effect.magicalElementDamageBoost[element];
                    }
                }
             } else if (effect.effect.resist) {
                for (var j = effect.effect.resist.length; j--;) {
                    if (elements.includes(effect.effect.resist[j].name)) {
                        if (!effectOut.elementalResist) {effectOut.elementalResist = {};}
                        if (effectType == "passives") {
                            if (!effectOut.elementalResist[effect.effect.resist[j].name]) {effectOut.elementalResist[effect.effect.resist[j].name] = 0;}
                            effectOut.elementalResist[effect.effect.resist[j].name] += effect.effect.resist[j].percent;
                        } else {
                            if (!effectOut.elementalResist[effect.effect.resist[j].name] || effectOut.elementalResist[effect.effect.resist[j].name] < effect.effect.resist[j].percent) {
                                effectOut.elementalResist[effect.effect.resist[j].name] = effect.effect.resist[j].percent;
                            }    
                        }
                        
                    } else {
                        if (!effectOut.ailmentResist) {effectOut.ailmentResist = {};}
                        if (effectType == "passives") {
                            if (!effectOut.ailmentResist[effect.effect.resist[j].name]) {effectOut.ailmentResist[effect.effect.resist[j].name] = 0;}
                            effectOut.ailmentResist[effect.effect.resist[j].name] += effect.effect.resist[j].percent;
                        } else {
                            if (!effectOut.ailmentResist[effect.effect.resist[j].name] || effectOut.ailmentResist[effect.effect.resist[j].name] < effect.effect.resist[j].percent) {
                                effectOut.ailmentResist[effect.effect.resist[j].name] = effect.effect.resist[j].percent;
                            }
                        }
                    }
                    
                }
            } else if (effect.effect.killers) {
                for (var j = 0, lenj = effect.effect.killers.length; j < lenj; j++) {
                    if (effect.effect.killers[j].physical) {
                        if (!effectOut.physicalKillers) {effectOut.physicalKillers = {};}
                        if (effectType == "passives") {
                            if (!effectOut.physicalKillers[effect.effect.killers[j].name]) {effectOut.physicalKillers[effect.effect.killers[j].name] = 0;}
                            effectOut.physicalKillers[effect.effect.killers[j].name] += effect.effect.killers[j].physical;
                        } else {
                            if (!effectOut.physicalKillers[effect.effect.killers[j].name] || effectOut.physicalKillers[effect.effect.killers[j].name] < effect.effect.killers[j].physical) {
                                effectOut.physicalKillers[effect.effect.killers[j].name] = effect.effect.killers[j].physical;
                            }
                        }
                    } 
                    if (effect.effect.killers[j].magical) {
                        if (!effectOut.magicalKillers) {effectOut.magicalKillers = {};}
                        if (effectType == "passives") {
                            if (!effectOut.magicalKillers[effect.effect.killers[j].name]) {effectOut.magicalKillers[effect.effect.killers[j].name] = 0;}
                            effectOut.magicalKillers[effect.effect.killers[j].name] += effect.effect.killers[j].magical;
                        } else {
                            if (!effectOut.magicalKillers[effect.effect.killers[j].name] || effectOut.magicalKillers[effect.effect.killers[j].name] < effect.effect.killers[j].magical) {
                                effectOut.magicalKillers[effect.effect.killers[j].name] = effect.effect.killers[j].magical;
                            }    
                        }
                    } 
                }
            } else if (effect.effect.randomlyUse) {
                for (var j = 0, len = effect.effect.randomlyUse.length; j < len; j++) {
                    addSkillEffectToSearch(effect.effect.randomlyUse[j].skill, effect.effect.randomlyUse[j].skill.effects, unitOut, effectType);
                }
            } else if (effect.effect.break) {
                if (!effectOut.break) {
                    effectOut.break = {};
                }
                if (!effectOut.break.atk || effectOut.break.atk < effect.effect.break.atk) {
                    effectOut.break.atk = effect.effect.break.atk;
                }
                if (!effectOut.break.def || effectOut.break.def < effect.effect.break.def) {
                    effectOut.break.def = effect.effect.break.def;
                }
                if (!effectOut.break.mag || effectOut.break.atk < effect.effect.break.mag) {
                    effectOut.break.mag = effect.effect.break.mag;
                }
                if (!effectOut.break.spr || effectOut.break.spr < effect.effect.break.spr) {
                    effectOut.break.spr = effect.effect.break.spr;
                }
            } else if (effect.effect.statsBuff) {
                if (!effectOut.statsBuff) {
                    effectOut.statsBuff = {};
                }
                if (!effectOut.statsBuff.atk || effectOut.statsBuff.atk < effect.effect.statsBuff.atk) {
                    effectOut.statsBuff.atk = effect.effect.statsBuff.atk;
                }
                if (!effectOut.statsBuff.def || effectOut.statsBuff.def < effect.effect.statsBuff.def) {
                    effectOut.statsBuff.def = effect.effect.statsBuff.def;
                }
                if (!effectOut.statsBuff.mag || effectOut.statsBuff.mag < effect.effect.statsBuff.mag) {
                    effectOut.statsBuff.mag = effect.effect.statsBuff.mag;
                }
                if (!effectOut.statsBuff.spr || effectOut.statsBuff.spr < effect.effect.statsBuff.spr) {
                    effectOut.statsBuff.spr = effect.effect.statsBuff.spr;
                }
            } else if (effect.effect.globalMitigation){
                if(!effectOut.globalMitigation){
                    effectOut.globalMitigation = effect.effect.globalMitigation
                }
            } else if (effect.effect.magicalMitigation){
                if(!effectOut.magicalMitigation){
                    effectOut.magicalMitigation = effect.effect.magicalMitigation
                }
            } else if(effect.effect.physicalMitigation){
                if(!effectOut.physicalMitigation){
                    effectOut.physicalMitigation = effect.effect.physicalMitigation
                }
            } else if(effect.effect.mirage){
                if(!effectOut.mirage || effectOut.mirage < effect.effect.mirage){
                    effectOut.mirage = effect.effect.mirage
                }
            } else if (effect.effect.imbue) {
                if (!effectOut.imbue) {
                    effectOut.imbue = [];
                }
                for (var j = 0, lenj = effect.effect.imbue.length; j < lenj; j++) {
                    if (!effectOut.imbue.includes(effect.effect.imbue[j])) {
                        effectOut.imbue.push(effect.effect.imbue[j]);
                    }
                }
            } else if (effect.effect.cooldownSkill) {
                addSkillEffectToSearch(effect.effect.cooldownSkill, effect.effect.cooldownSkill.effects, unitOut, effectType)
            } else if (effect.effect.drawAttacks) {
                if (!effectOut.drawAttacks || effectOut.drawAttacks < effect.effect.drawAttacks) {
                    effectOut.drawAttacks = effect.effect.drawAttacks;
                }
            } else if (effect.effect.aoeCover) {
                var meanMitigation = (effect.effect.aoeCover.mitigation.min + effect.effect.aoeCover.mitigation.max) / 2;
                if (effect.effect.aoeCover.type == "physical") {
                    if (!effectOut.physicalAoeCover || effectOut.physicalAoeCover < meanMitigation) {
                        effectOut.physicalAoeCover = meanMitigation;
                    }
                } else {
                    if (!effectOut.magicalAoeCover || effectOut.magicalAoeCover < meanMitigation) {
                        effectOut.magicalAoeCover = meanMitigation;
                    }
                }
            } else if (effect.effect.stCover) {
                
                var meanMitigation = (effect.effect.stCover.mitigation.min + effect.effect.stCover.mitigation.max) / 2;
                if (!effectOut.stCover || effectOut.stCover < meanMitigation) {
                    effectOut.stCover = meanMitigation;
                }
            } else if (effect.effect.weaponImperil) {
                if (!effectOut.weaponImperil) {
                    effectOut.weaponImperil = {};
                }
                if (!effectOut.weaponImperil[effect.effect.weaponImperil.weaponType] || effectOut.weaponImperil[effect.effect.weaponImperil.weaponType] < effect.effect.weaponImperil.value) {
                    effectOut.weaponImperil[effect.effect.weaponImperil.weaponType] = effect.effect.weaponImperil.value;
                }
            } else if (effect.effect.autoCastedSkill) {
                addSkillEffectToSearch(effect.effect.autoCastedSkill, effect.effect.autoCastedSkill.effects, unitOut, "passives");
            } else if (effect.effect.counterSkill) {
                addSkillEffectToSearch(effect.effect.counterSkill, effect.effect.counterSkill.effects, unitOut, "counter");
            } else if (effect.effect.damage && skill.chainFamily) {
                if (!effectOut.chain) {
                    effectOut.chain = [];
                }
                if (!effectOut.chain.includes(skill.chainFamily)) {
                    effectOut.chain.push(skill.chainFamily)
                }
            } else if (effect.effect.damage && chainTag) {
                if (!effectOut.chain) {
                    effectOut.chain = [];
                }
                if (!effectOut.chain.includes('chainTag')) {
                    effectOut.chain.push('chainTag')
                }
            }
        }
    }
}

function formatForSkills(units) {
    var result = "{\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId];
        if (unit.unreleased7Star) {
            unit = unit["6_form"];
        }
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += "\n\t\"" + unitId + "\": {";
        result += getUnitBasicInfo(unit) + ",";
        result += "\n" + "\t\t\"lb\": " + JSON.stringify(unit.lb) + ",";
        if (Object.keys(unit.innates).length > 0) {
            result += "\n" + "\t\t\"innate\": " + JSON.stringify(unit.innates) + ",";
        }
        
        result += "\n" + "\t\t\"passives\": [";
        var firstPassive = true;
        for (var skillIndex in unit.passives) {
            var passive = unit.passives[skillIndex];
            if (firstPassive) {
                firstPassive = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t" + JSON.stringify(passive);
        }
        result += "\n" + "\t\t]";
        
        result += ",\n" + "\t\t\"actives\": [";
        var firstActive = true;
        for (var skillIndex in unit.actives) {
            var active = unit.actives[skillIndex];
            if (firstActive) {
                firstActive = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t" + JSON.stringify(active);
        }
        result += "\n" + "\t\t]";
        
        result += ",\n" + "\t\t\"magics\": [";
        var firstMagic = true;
        for (var skillIndex in unit.magics) {
            var magic = unit.magics[skillIndex];
            if (firstMagic) {
                firstMagic = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t" + JSON.stringify(magic);
        }
        result += "\n" + "\t\t]";
        
        result += "\n\t}";
    }
    result += "\n}";
    return result;
    
}


module.exports = {
    getPassives: getPassives,
    addElementalResist: addElementalResist,
    addAilmentResist: addAilmentResist,
    getEquip: getEquip,
    formatSimpleOutput: formatSimpleOutput,
    formatOutput: formatOutput,
    formatForSearch:formatForSearch,
    formatForSkills:formatForSkills,
    stats: stats,
    elements: elements,
    ailments: ailments,
    unitRoles: unitRoles,
}
