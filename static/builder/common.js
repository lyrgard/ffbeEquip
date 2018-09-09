const damageFormulaNames = ["physicalDamage","magicalDamage","hybridDamage","jumpDamage","magDamageWithPhysicalMecanism", "sprDamageWithPhysicalMecanism", "defDamageWithPhysicalMecanism", "magDamageWithPhysicalMecanismMultiCast", "sprDamageWithPhysicalMecanismMultiCast", "defDamageWithPhysicalMecanismMultiCast", "sprDamageWithMagicalMecanism", "atkDamageWithFixedMecanism", "physicalDamageMultiCast", "fixedDamageWithPhysicalMecanism","summonerSkill"];
const statsBonusCap = {
    "GL": 300,
    "JP": 400
}
const operatorsInFormula = ["/","*","+","-","OR","AND",">"];
const weaponBaseDamageVariance = {
    "dagger" : {"min":0.95,"avg":1,"max":1.05},
    "sword" : {"min":0.9,"avg":1,"max":1.1},
    "greatSword" : {"min":0.85,"avg":1,"max":1.15},
    "katana" : {"min":0.9,"avg":1,"max":1.1},
    "staff" : {"min":0.95,"avg":1,"max":1.05},
    "rod" : {"min":0.95,"avg":1,"max":1.05},
    "bow" : {"min":0.95,"avg":1,"max":1.05},
    "axe" : {"min":0.7,"avg":1,"max":1.3},
    "hammer" : {"min":0.8,"avg":1,"max":1.2},
    "spear" : {"min":0.85,"avg":1,"max":1.15},
    "harp" : {"min":0.9,"avg":1,"max":1.1},
    "whip" : {"min":0.9,"avg":1,"max":1.1},
    "throwing" : {"min":0.9,"avg":1,"max":1.1},
    "gun" : {"min":0.95,"avg":1,"max":1.05},
    "mace" : {"min":0.95,"avg":1,"max":1.05},
    "fist" : {"min":1,"avg":1,"max":1},
    "none" : {"min":1,"avg":1,"max":1}
}

function getValue(item, valuePath, notStackableSkillsAlreadyUsed) {
    var value = item[valuePath];
    if (value == undefined) {
        if (valuePath.indexOf('.') > -1) {
            value = getValueFromPath(item, valuePath);
        } else {
            value = 0;
        }
        item[valuePath] = value;
    }
    if (value.min && value.max) {
        value = (value.min + value.max) / 2;
    }
    if (notStackableSkillsAlreadyUsed && item.notStackableSkills) {
        for (var index = notStackableSkillsAlreadyUsed.length; index--;) {
            if (item.notStackableSkills[notStackableSkillsAlreadyUsed[index]]) {
                value -= getValue(item.notStackableSkills[notStackableSkillsAlreadyUsed[index]], valuePath);
            }
        }
    }
    return value;
}

function getValueFromPath(item, valuePath) {
    var pathTokens = valuePath.split(".");
    var currentItem = item;
    for (var index = 0, len = pathTokens.length; index < len; index++) {
        if (currentItem[pathTokens[index]]) {
            currentItem = currentItem[pathTokens[index]];
        } else if (pathTokens[index].indexOf('|') > -1) {
            var tmpToken = pathTokens[index].split("|");
            var property = tmpToken[0];
            var name = tmpToken[1];
            if (currentItem[property]) {
                for (var listIndex = currentItem[property].length; listIndex--;) {
                    if (currentItem[property][listIndex].name == name) {
                        currentItem = currentItem[property][listIndex];
                        break;
                    }
                }
            } else {
                return 0; 
            }
        } else {
            return 0;
        }
    }
    return currentItem;
}

function isStackable(item) {
    return !(item.special && item.special.includes("notStackable"));
}

function isTwoHanded(item) {
    return (item && item.special && item.special.includes("twoHanded"));
}

function hasDualWieldOrPartialDualWield(item) {
    return hasDualWield(item) || item.partialDualWield;
}

function hasDualWield(item) {
    return item.special && item.special.includes("dualWield")
}

function calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula, goalVariance, useNewJpDamageFormula, canSwitchWeapon = true) {
    return innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, EnnemyStats.copy(ennemyStats), formula, goalVariance, useNewJpDamageFormula, canSwitchWeapon);
}

function innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context) {
    if (!context) {
        context = {
            "alreadyCalculatedValues" : {},
            "remainingLeftHandAttacks" : [],
            "skillEnhancement" : {}
        }
        for (var i = 11; i < itemAndPassives.length; i++) {
            if (itemAndPassives[i].skillEnhancement) {
                var skills = Object.keys(itemAndPassives[i].skillEnhancement);
                for (var j = skills.length; j--;) {
                    if (!context.skillEnhancement[skills[j]]) {
                        context.skillEnhancement[skills[j]] = skills[j];
                    } else {
                        context.skillEnhancement[skills[j]] += skills[j];
                    }
                }
            }
        }
    }
    if (formula.type == "skill") {
        context.currentSkill = formula.id;
        var result = innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
        if (context.remainingLeftHandAttacks && context.remainingLeftHandAttacks.length > 0) {
            context.treatingLeftHandAttacks = true;
            for (var i = 0, len = context.remainingLeftHandAttacks.length; i < len; i++) {
                var leftHandAttackResult = innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, context.remainingLeftHandAttacks[i], goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
                result.min += leftHandAttackResult.min;
                result.avg += leftHandAttackResult.avg;
                result.max += leftHandAttackResult.max;
            }
            context.treatingLeftHandAttacks = false;
            context.remainingLeftHandAttacks = [];
        }
        context.currentSkill = null;
        return result;
    } else if (formula.type == "value") {
        if (damageFormulaNames.includes(formula.name)) {
            var cumulatedKillerByRace = {'aquatic':0,'beast':0,'bird':0,'bug':0,'demon':0,'dragon':0,'human':0,'machine':0,'plant':0,'undead':0,'stone':0,'spirit':0};
            var cumulatedKiller = 0;
            var applicableKillerType = null;
            if (unitBuild.involvedStats.includes("physicalKiller")) {
                applicableKillerType = "physical";
            } else if (unitBuild.involvedStats.includes("magicalKiller")) {
                applicableKillerType = "magical";
            }
            if (applicableKillerType) {
                for (var equipedIndex = itemAndPassives.length; equipedIndex--;) {
                    if (itemAndPassives[equipedIndex] && ennemyStats.races.length > 0 && itemAndPassives[equipedIndex].killers) {
                        for (var killerIndex = itemAndPassives[equipedIndex].killers.length; killerIndex--;) {
                            var killer = itemAndPassives[equipedIndex].killers[killerIndex];
                            if (ennemyStats.races.includes(killer.name) && killer[applicableKillerType]) {
                                cumulatedKillerByRace[killer.name] = Math.min(300, cumulatedKillerByRace[killer.name] + killer[applicableKillerType]);
                                
                            }
                        }
                    }
                }
                if (ennemyStats.races.length > 0) {
                    for (var raceIndex = ennemyStats.races.length; raceIndex--;) {
                        cumulatedKiller += cumulatedKillerByRace[ennemyStats.races[raceIndex]];
                    }
                }
            }

            // Element weakness/resistance
            var elements = unitBuild.innateElements.slice();
            if (unitBuild.involvedStats.includes("weaponElement")) {
                if (itemAndPassives[0] && itemAndPassives[0].element) {
                    for (var elementIndex = itemAndPassives[0].element.length; elementIndex--;) {
                        if (!elements.includes(itemAndPassives[0].element[elementIndex])) {
                            elements.push(itemAndPassives[0].element[elementIndex]);       
                        }
                    }
                };
                if (itemAndPassives[1] && itemAndPassives[1].element) {
                    for (var elementIndex = itemAndPassives[1].element.length; elementIndex--;) {
                        if (!elements.includes(itemAndPassives[1].element[elementIndex])) {
                            elements.push(itemAndPassives[1].element[elementIndex]);       
                        }
                    }
                };
            }
            var resistModifier = getElementCoef(elements, ennemyStats);

            // Killers
            var killerMultiplicator = 1;
            if (ennemyStats.races.length > 0) {
                killerMultiplicator += (cumulatedKiller / 100) / ennemyStats.races.length;
            }
            
            var jumpMultiplier = 1;
            if (unitBuild.involvedStats.includes("jumpDamage")) {
                jumpMultiplier += calculateStatValue(itemAndPassives, "jumpDamage", unitBuild).total/100;
            }
            
            var evoMagMultiplier = 1;
            if (unitBuild.involvedStats.includes("evoMag")) {
                evoMagMultiplier += calculateStatValue(itemAndPassives, "evoMag", unitBuild).total/100;
            }

            // Level correction (1+(level/100)) and final multiplier (between 85% and 100%, so 92.5% mean)
            var level;
            if (unitBuild._level) {
                level = unitBuild._level;
            } else {
                if (unitBuild.unit.sixStarForm) {
                    level = 100;
                } else {
                    level = (unitBuild.unit.max_rarity - 1) * 20;
                }
            }
            var levelCorrection = (1 + (level/100));
            var damageMultiplier = {
                "min": levelCorrection * 0.85,
                "avg": levelCorrection * 0.925,
                "max": levelCorrection
            }
            
            var coef = formula.coef;
            if (context.currentSkill && context.skillEnhancement[context.currentSkill]) {
                coef += context.skillEnhancement[context.currentSkill];
            }
            
            var total = {
                "min":0,
                "avg":0,
                "max":0,
                "switchWeapons": false
            };
            var value;
            if (formula.name == "fixedDamageWithPhysicalMecanism") {
                var damage = 1000 * (1 - resistModifier) * killerMultiplicator
                value = {
                    "min": damage,
                    "avg": damage,
                    "max": damage,
                    "switchWeapons": false
                }
            } else {
                for (var statIndex = goalValuesCaract[formula.name].statsToMaximize.length; statIndex--;) {
                    var stat = goalValuesCaract[formula.name].statsToMaximize[statIndex];
                    var calculatedValue = calculateStatValue(itemAndPassives, stat, unitBuild);

                    if ("atk" == stat || "def" == stat) {
                        var variance;
                        var switchWeapons = false;
                        if (itemAndPassives[0] && weaponList.includes(itemAndPassives[0].type)) {
                            if (itemAndPassives[0].damageVariance) {
                                variance = itemAndPassives[0].damageVariance;
                            } else {
                                variance = weaponBaseDamageVariance[itemAndPassives[0].type];
                            }    
                        }  else {
                            variance = weaponBaseDamageVariance["none"];
                        }
                        
                        var statValueToUse;
                        if (context.treatingLeftHandAttacks) {
                            statValueToUse = calculatedValue.left;
                        } else {
                            statValueToUse = calculatedValue.right;
                        }
                        

                        if (goalVariance && 
                            itemAndPassives[0] && weaponList.includes(itemAndPassives[0].type) &&
                            itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
                            var variance1;
                            if (itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
                                if (itemAndPassives[1].damageVariance) {
                                    variance1 = itemAndPassives[1].damageVariance;
                                } else {
                                    variance1 = weaponBaseDamageVariance[itemAndPassives[1].type];
                                }    
                            }  else {
                                variance1 = weaponBaseDamageVariance["none"];
                            }

                            if (goalValuesCaract[formula.name].type == "none" || formula.name == "physicalDamageMultiCast") {
                                switchWeapons = canSwitchWeapon && ((calculatedValue.right * calculatedValue.right * variance[goalVariance]) < (calculatedValue.left * calculatedValue.left * variance1[goalVariance]));
                                if (switchWeapons) {
                                    variance = variance1;
                                    if (context.treatingLeftHandAttacks) {
                                        statValueToUse = calculatedValue.right;
                                    } else {
                                        statValueToUse = calculatedValue.left;
                                    }
                                }
                            } else {
                                switchWeapons = canSwitchWeapon && ((variance[goalVariance] < variance1[goalVariance]) || (stat == "atk" && (variance[goalVariance] == variance1[goalVariance]) && itemAndPassives[0].atk > itemAndPassives[1].atk)) ;
                                if (switchWeapons) {
                                    variance = variance1;
                                    if (context.treatingLeftHandAttacks) {
                                        statValueToUse = calculatedValue.right;
                                    } else {
                                        statValueToUse = calculatedValue.left;
                                    }
                                }
                                // Plan for the left hand attack to be calculated later
                                context.remainingLeftHandAttacks.push(formula);
                            }
                        }
                        
                        newJpDamageFormulaCoef = 1;
                        if (useNewJpDamageFormula) {
                            if (itemAndPassives[0] && weaponList.includes(itemAndPassives[0].type) && itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
                                var atk0 = (itemAndPassives[0].atk ? itemAndPassives[0].atk : 0);
                                var atk1 = (itemAndPassives[1].atk ? itemAndPassives[1].atk : 0);
                                newJpDamageFormulaCoef = Math.log(atk0 / 2 + atk1 / 2 + 30) / 5.220355825078325;
                            } else if (itemAndPassives[0] && weaponList.includes(itemAndPassives[0].type)) {
                                var atk0 = (itemAndPassives[0].atk ? itemAndPassives[0].atk : 0);
                                newJpDamageFormulaCoef = Math.log(atk0 + 5) / 5.220355825078325;
                            }
                        }

                        var baseDamage = coef * (statValueToUse * statValueToUse) * (1 - resistModifier) * killerMultiplicator * jumpMultiplier * newJpDamageFormulaCoef / (ennemyStats.def  * (1 - ennemyStats.breaks.def / 100));
                        total.min += baseDamage * damageMultiplier.min * variance.min;
                        total.avg += baseDamage * damageMultiplier.avg * variance.avg;
                        total.max += baseDamage * damageMultiplier.max * variance.max;
                        total.switchWeapons = total.switchWeapons || switchWeapons;
                    } else {
                        var ennemyResistanceStat = ennemyStats.spr * (1 - ennemyStats.breaks.spr / 100);
                        if (goalValuesCaract[formula.name].type == "physical" && !goalValuesCaract[formula.name].multicast && itemAndPassives[0] && itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type) && weaponList.includes(itemAndPassives[1].type)) {
                            // Plan for the left hand attack to be calculated later
                            context.remainingLeftHandAttacks.push(formula);
                        }
                        var base = coef * (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * jumpMultiplier * evoMagMultiplier  / ennemyResistanceStat;
                        total.min += base * damageMultiplier.min;
                        total.avg += base * damageMultiplier.avg;
                        total.max += base * damageMultiplier.max;
                    }
                }
                value = {
                    "min": total.min / goalValuesCaract[formula.name].statsToMaximize.length,
                    "avg": total.avg / goalValuesCaract[formula.name].statsToMaximize.length,
                    "max": total.max / goalValuesCaract[formula.name].statsToMaximize.length,
                    "switchWeapons": total.switchWeapons
                }
            }
            context.alreadyCalculatedValues[formula.name] = value;
            return value;
        } else {
            if (context.alreadyCalculatedValues[formula.name]) {
                return context.alreadyCalculatedValues[formula.name];
            }
            var value = calculateStatValue(itemAndPassives, formula.name, unitBuild).total;
            if (formula.name == "mpRefresh") {
                value /= 100;
            }
            var result = {
                "min": value,
                "avg": value,
                "max": value,
                "switchWeapons": false
            }
            context.alreadyCalculatedValues[formula.name] = result;
            return result;
        }   
    } else if (formula.type == "constant") {
        return {
            "min": formula.value,
            "avg": formula.value,
            "max": formula.value,
            "switchWeapons": false
        };     
    } else if (operatorsInFormula.includes(formula.type)) {
        var result1 = innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value1, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
        var result2 = innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
        if (formula.type == "OR") {
            if (result1) {
                return true;
            } else {
                return innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
            }
        } else if (formula.type == "AND") {
            if (result1) {
                return innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
            } else {
                return false;
            }
        } else {
            var result2 = innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
            if (formula.type == "*") {
                return {
                    "min": result1.min * result2.min,
                    "avg": result1.avg * result2.avg,
                    "max": result1.max * result2.max,
                    "switchWeapons": result1.switchWeapons || result2.switchWeapons
                };
            } else if (formula.type == "+") {
                return {
                    "min": result1.min + result2.min,
                    "avg": result1.avg + result2.avg,
                    "max": result1.max + result2.max,
                    "switchWeapons": result1.switchWeapons || result2.switchWeapons
                };
            } else if (formula.type == "/") {
                return {
                    "min": result1.min / (result2.max == 0 ? 0.00001 : result2.max),
                    "avg": result1.avg / (result2.avg == 0 ? 0.00001 : result2.avg),
                    "max": result1.max / (result2.min == 0 ? 0.00001 : result2.min),
                    "switchWeapons": result1.switchWeapons || result2.switchWeapons
                };
            } else if (formula.type == "-") {
                return {
                    "min": result1.min - result2.max,
                    "avg": result1.avg - result2.avg,
                    "max": result1.max - result2.min,
                    "switchWeapons": result1.switchWeapons || result2.switchWeapons
                };
            } else if (formula.type == ">") {
                return result1[goalVariance] >= result2[goalVariance];
            }
        }
    } else if (formula.type == "imperil") {
        var imperiledElements = Object.keys(formula.value);
        for (var i = imperiledElements.length; i--;) {
            var element = imperiledElements[i];
            if (ennemyStats.imperils[element] < formula.value[element]) {
                ennemyStats.imperils[element] = formula.value[element];
            }
        }
        return {
            "min": 0,
            "avg": 0,
            "max": 0,
            "switchWeapons": false
        };
    } else if (formula.type == "elementCondition") {
        var elements = [];
        if (itemAndPassives[0] && itemAndPassives[0].element) {
            for (var elementIndex = itemAndPassives[0].element.length; elementIndex--;) {
                if (!elements.includes(itemAndPassives[0].element[elementIndex])) {
                    elements.push(itemAndPassives[0].element[elementIndex]);       
                }
            }
        };
        if (itemAndPassives[1] && itemAndPassives[1].element) {
            for (var elementIndex = itemAndPassives[1].element.length; elementIndex--;) {
                if (!elements.includes(itemAndPassives[1].element[elementIndex])) {
                    elements.push(itemAndPassives[1].element[elementIndex]);       
                }
            }
        };
        if (formula.element == "none") {
            return elements.length == 0; 
        } else {
            if (elements.length == 0 || !elements.includes(formula.element)) {
                return false;
            }
        }
        return true;
    } else if (formula.type == "condition") {
        var value = innerCalculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.condition, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context);
        if (!value) {
            return -1;
        }
        return innerCalculateBuildValueWithFormula(itemAndPassives,unitBuild, ennemyStats, formula.formula, goalVariance, useNewJpDamageFormula, canSwitchWeapon, context)
    }
}
    

function getEquipmentStatBonus(itemAndPassives, stat, doCap = true) {
    if (baseStats.includes(stat) && itemAndPassives[0] && weaponList.includes(itemAndPassives[0].type)) {
        var normalStack = 0;
        var twoHanded = isTwoHanded(itemAndPassives[0]);
        for (var index = itemAndPassives.length; index--;) {
            var item = itemAndPassives[index];
            if (item) {
                if (item.singleWielding && item.singleWielding[stat]  && itemAndPassives[0] && !itemAndPassives[1]) {
                    normalStack += item.singleWielding[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHanded && item.singleWieldingOneHanded[stat] && itemAndPassives[0] && !itemAndPassives[1]) {
                    normalStack += item.singleWieldingOneHanded[stat] / 100;
                }
                if (item.dualWielding && item.dualWielding[stat] && itemAndPassives[0] && itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
                    if (doCap) {
                        normalStack = Math.min(normalStack  + item.dualWielding[stat] / 100, 1);
                    } else {
                        normalStack += item.dualWielding[stat] / 100;
                    }
                }
            }
        }
        if (doCap) {
            return 1 + Math.min(3, normalStack);
        } else {
            return 1 + normalStack;
        }
    } else {
        return 1;
    }
}

function getEsperStatBonus(itemAndPassives, stat) {
    var statsBonus = 100;
    if (baseStats.includes(stat)) {
        for (var index = itemAndPassives.length; index--;) {
            var item = itemAndPassives[index];
            if (item && item.esperStatsBonus && item.esperStatsBonus[stat]) {
                statsBonus += item.esperStatsBonus[stat];
            }
        }
    }
    return Math.min(2, statsBonus / 100);
}

function calculateStatValue(itemAndPassives, stat, unitBuild) {
    var equipmentStatBonus = getEquipmentStatBonus(itemAndPassives, stat);
    var esperStatBonus = 1;
    if (itemAndPassives[10]) {
        esperStatBonus = getEsperStatBonus(itemAndPassives, stat);
    }
    var calculatedValue = 0   
    var currentPercentIncrease = {"value":0};
    var baseValue = 0;
    var buffValue = 0
    if (baseStats.includes(stat)) {
        baseValue = unitBuild.baseValues[stat].total;
        buffValue = unitBuild.baseValues[stat].buff * baseValue / 100;
    } else if (stat == "lbPerTurn") {
        baseValue = unitBuild.baseValues["lbFillRate"].total;
        buffValue = unitBuild.baseValues["lbFillRate"].buff * baseValue / 100;
    }
    var calculatedValue = baseValue + buffValue;
    
    var notStackableSkillsAlreadyUsed = [];
    
    for (var equipedIndex = itemAndPassives.length; equipedIndex--;) {
        if (itemAndPassives[equipedIndex]) {
            var equipmentStatBonusToApply = 1;
            if (equipedIndex < 10) {
                equipmentStatBonusToApply = equipmentStatBonus;
            }
            if (equipedIndex == 10) {
                equipmentStatBonusToApply = esperStatBonus;
            }
            if (equipedIndex < 2 && "atk" == stat) {
                calculatedValue += calculatePercentStateValueForIndex(itemAndPassives[equipedIndex], baseValue, currentPercentIncrease, stat, notStackableSkillsAlreadyUsed);    
            } else {
                calculatedValue += calculateStateValueForIndex(itemAndPassives[equipedIndex], baseValue, currentPercentIncrease, equipmentStatBonusToApply, stat, notStackableSkillsAlreadyUsed);    
            }
            if (itemAndPassives[equipedIndex].notStackableSkills) {
                for (var skillId in itemAndPassives[equipedIndex].notStackableSkills) {
                    if (!notStackableSkillsAlreadyUsed.includes(skillId)) {
                        notStackableSkillsAlreadyUsed.push(skillId);
                    }
                }
            }
        }
    }
    
    if ("atk" == stat) {
        var result = {"right":0,"left":0,"total":0,"bonusPercent":currentPercentIncrease.value}; 
        var right = calculateFlatStateValueForIndex(itemAndPassives[0], equipmentStatBonus, stat);
        var left = calculateFlatStateValueForIndex(itemAndPassives[1], equipmentStatBonus, stat);
        if (itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
            result.right = Math.floor(calculatedValue + right);
            result.left = Math.floor(calculatedValue + left);
            result.total = Math.floor(calculatedValue + right + left);    
        } else {
            result.right = Math.floor(calculatedValue + right + left);
            result.left = 0;
            result.total = result.right;
        }
        return result;   
    } else {
        var result = {"right":0,"left":0,"total":Math.floor(calculatedValue),"bonusPercent":currentPercentIncrease.value}; 
        if (itemAndPassives[0] && weaponList.includes(itemAndPassives[0].type)) {
            result.right = result.total;
        }
        if (itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
            result.left = result.total;
        }
        return result;
    }
}

function calculateStateValueForIndex(item, baseValue, currentPercentIncrease, equipmentStatBonus, stat, notStackableSkillsAlreadyUsed) {
    if (item) {
        if (stat == "lbPerTurn") {
            var value = 0;
            if (item.lbPerTurn) {
                var lbPerTurn = getValue(item, "lbPerTurn", notStackableSkillsAlreadyUsed);
                var lbPerTurnTakenIntoAccount = Math.min(lbPerTurn, Math.max(12 - currentPercentIncrease.value, 0));
                currentPercentIncrease.value += lbPerTurnTakenIntoAccount;
                value += lbPerTurnTakenIntoAccount;
            }
            if (item.lbFillRate) {
                value += item.lbFillRate * baseValue / 100;
            }
            return value;
        } else {
            var value = getValue(item, stat, notStackableSkillsAlreadyUsed);
            if (item[percentValues[stat]]) {
                var itemPercentValue = getValue(item, percentValues[stat], notStackableSkillsAlreadyUsed);
                var percentTakenIntoAccount = Math.min(itemPercentValue, Math.max(statsBonusCap[(useNew400Cap ? "JP": server)] - currentPercentIncrease.value, 0));
                currentPercentIncrease.value += itemPercentValue;
                return value * equipmentStatBonus + percentTakenIntoAccount * baseValue / 100;
            } else {
                return value * equipmentStatBonus;
            }
        }
    }
    return 0;
}

function calculateFlatStateValueForIndex(item, equipmentStatBonus, stat) {
    if (item && item[stat]) {
        return item[stat] * equipmentStatBonus;
    }
    return 0;
}

function calculatePercentStateValueForIndex(item, baseValue, currentPercentIncrease, stat) {
    if (item && item[percentValues[stat]]) {
        var itemPercentValue = item[percentValues[stat]];
        var percentTakenIntoAccount = Math.min(itemPercentValue, Math.max(statsBonusCap[(useNew400Cap ? "JP" : server)] - currentPercentIncrease.value, 0));
        currentPercentIncrease.value += itemPercentValue;
        return percentTakenIntoAccount * baseValue / 100;
    }
    return 0;
}

function getElementCoef(elements, ennemyStats) {
    var resistModifier = 0;

    for (var i = elements.length; i--;) {
        var element = elements[i];
        resistModifier += (ennemyStats.elementalResists[element] - ennemyStats.imperils[element]) / 100;
    }
    if (elements.length) {
        resistModifier = resistModifier / elements.length;
    }
    return resistModifier;
}

function isApplicable(item, unit) {
    if (item.exclusiveSex && item.exclusiveSex != unit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(unit.id)) {
        return false;
    }
    return true;
}

function areConditionOK(item, equiped, level = 0) {
    if (level && item.levelCondition && item.levelCondition > level) {
        return false;
    }
    if (item.equipedConditions) {
        var found = 0;
        for (var conditionIndex = item.equipedConditions.length; conditionIndex--;) {
            if (elementList.includes(item.equipedConditions[conditionIndex])) {
                var neededElement = item.equipedConditions[conditionIndex];
                if ((equiped[0] && equiped[0].element && equiped[0].element.includes(neededElement)) || (equiped[1] && equiped[1].element && equiped[1].element.includes(neededElement))) {
                    found ++;
                }
            } else if (typeList.includes(item.equipedConditions[conditionIndex])) {
                for (var equipedIndex = 0; equipedIndex < 10; equipedIndex++) {
                    if (equiped[equipedIndex] && equiped[equipedIndex].type == item.equipedConditions[conditionIndex]) {
                        found ++;
                        break;
                    }
                }
            } else {
                for (var equipedIndex = 0; equipedIndex < 10; equipedIndex++) {
                    if (equiped[equipedIndex] && equiped[equipedIndex].id == item.equipedConditions[conditionIndex]) {
                        found ++;
                        break;
                    }
                }
            }
        }
        if (found != item.equipedConditions.length) {
            return false;
        }
    }
    return true;
}

function findBestItemVersion(build, item, itemWithVariation, unit) {
    var itemVersions = itemWithVariation[item.id];
    if (!itemVersions) {
        if (isApplicable(item, unit) && (!item.equipedConditions || areConditionOK(item, build))) {
            return item;    
        } else {
            return {"id":item.id, "name":item.name, "jpname":item.jpname, "icon":item.icon, "type":item.type,"access":["Conditions not met"], "enhancements":item.enhancements};
        }
    } else {
        itemVersions.sort(function (item1, item2) {
            var conditionNumber1 = 0; 
            var conditionNumber2 = 0;
            if (item1.equipedConditions) {
                conditionNumber1 = item1.equipedConditions.length;
            }
            if (item1.exclusiveUnits) {
                conditionNumber1++;
            }
            if (item2.equipedConditions) {
                conditionNumber2 = item2.equipedConditions.length;
            }
            if (item2.exclusiveUnits) {
                conditionNumber2++;
            }
            return conditionNumber2 - conditionNumber1;
        });
        for (var index in itemVersions) {
            if (isApplicable(itemVersions[index], unit) && areConditionOK(itemVersions[index], build)) {
                if (item.enhancements) {
                    return applyEnhancements(itemVersions[index], item.enhancements);
                } else {
                    return itemVersions[index];
                }
            }
        }
        var item = itemVersions[0];
        return {"id":item.id, "name":item.name, "jpname":item.jpname, "icon":item.icon, "type":item.type,"access":["Conditions not met"], "enhancements":item.enhancements};
    }
}

function getEsperItem(esper) {
    var item = {};
    item.name = esper.name;
    item.id = esper.name;
    item.type = "esper";
    item.hp = Math.floor(esper.hp / 100);
    item.mp = Math.floor(esper.mp / 100);
    item.atk = Math.floor(esper.atk / 100);
    item.def = Math.floor(esper.def / 100);
    item.mag = Math.floor(esper.mag / 100);
    item.spr = Math.floor(esper.spr / 100);
    item.access = ["story"];
    item.maxLevel = esper.maxLevel
    if (esper.killers) {
        item.killers = esper.killers;
    }
    if (esper.resist) {
        item.resist = esper.resist;
    }
    if (esper.esperStatsBonus) {
        item.esperStatsBonus = esper.esperStatsBonus;
    }
    if (esper.level) {
        item.level = esper.level;
    }
    if (esper.rarity) {
        item.rarity = esper.rarity;
    }
    if (esper.lbPerTurn) {
        item.lbPerTurn = esper.lbPerTurn;
    }
    if (esper.evade) {
        item.evade = esper.evade;
    }
    if (esper.buildLink) {
        item.buildLink = esper.buildLink;
    }
    for (var i = baseStats.length; i--;) {
        if (esper[percentValues[baseStats[i]]]) {
            item[percentValues[baseStats[i]]] = esper[percentValues[baseStats[i]]];
        }
    }
    return item;
}

var simpleAddCombineProperties = ["hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","accuracy","jumpDamage","lbFillRate","mpRefresh"];

function combineTwoItems(item1, item2) {
    var sum = JSON.parse(JSON.stringify(item1));
    for (var index = simpleAddCombineProperties.length; index--;) {
        var stat = simpleAddCombineProperties[index];
        if (item2[stat]) {
            addToStat(sum, stat, item2[stat]);
        }
    }
    if (item2.evade) {
        addEvade(sum, item2.evade);
    }
    if (item2.singleWielding) {
        addEqStatBonus(sum, "singleWielding", item2.singleWielding);
    }
    if (item2.singleWieldingOneHanded) {
        addEqStatBonus(sum, "singleWieldingOneHanded", item2.singleWieldingOneHanded);
    }
    if (item2.dualWielding) {
        addEqStatBonus(sum, "dualWielding", item2.dualWielding);
    }
    if (item2.resist) {
        addResist(sum, item2.resist);
    }
    if (item2.lbPerTurn) {
        addLbPerTurn(sum, item2.lbPerTurn);
    }
    if (item2.killers) {
        for (var index = item2.killers.length; index--;) {
            addKiller(sum, item2.killers[index].name, item2.killers[index].physical, item2.killers[index].magical);
        }
    }
    if (item2.special) {
        if (!sum.special) {
            sum.special = [];
        }
        sum.special = sum.special.concat(item2.special);
    }
    return sum;
}

function addToStat(skill, stat, value) {
    if (!skill[stat]) {
        skill[stat] = value;
    } else {
        skill[stat] += value;
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

function addResist(item, values) {
    if (!item.resist) {
        item.resist = [];
    }
    for (var index = values.length; index--;) {
        item.resist.push(values[index]);
    }
}

function addAilmentResist(item, values) {
    for (var index in ailments) {
        if (values[index]) {
            if (!item.resist) {
                item.resist = [];
            }
            item.resist.push({"name":ailments[index],"percent":values[index]})
        }
    }
}

function addEvade(item, evade) {
    if (!item.evade) {
        item.evade = {};
    }
    if (evade.physical) {
        if (item.evade.physical) {
            item.evade.physical = item.evade.physical + evade.physical;
        } else {
            item.evade.physical = evade.physical;
        }
    }
    if (evade.magical) {
        if (item.evade.magical) {
            item.evade.magical = item.evade.magical + evade.magical;
        } else {
            item.evade.magical = evade.magical;
        }
    }
}

function addEqStatBonus(item, doubleHandType, values) {
    if (!item[doubleHandType]) {
        item[doubleHandType] = {};
    }
    var stats = Object.keys(values);
    for (var index = stats.length; index--;) {
        var stat = stats[index];
        addToStat(item[doubleHandType], stat, values[stat]);
    }
}

function addLbPerTurn(item, lbPerTurn) {
    if (!item.lbPerTurn) {
        item.lbPerTurn = {"min":0, "max":0};
    }
    item.lbPerTurn.min += lbPerTurn.min;
    item.lbPerTurn.max += lbPerTurn.max;
}

function applyEnhancements(item, enhancements) {
    if (enhancements) {
        var result = JSON.parse(JSON.stringify(item));
        result.enhancements = enhancements.slice();
        for (var i = enhancements.length; i--;) {
            var enhancement = enhancements[i];
            var enhancementValue;
            if (enhancement == "rare") {
                enhancementValue = itemEnhancementAbilities[enhancement][item.type];
            } else {
                enhancementValue = itemEnhancementAbilities[enhancement];
            }
            if (enhancementValue) {
                result = combineTwoItems(result, enhancementValue);
            }
        }
        return result;
    } else {
        return item;
    }
}