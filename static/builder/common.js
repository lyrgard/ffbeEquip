const damageFormulaNames = ["physicalDamage","magicalDamage","magicalDamageWithPhysicalMecanism","hybridDamage","jumpDamage","sprDamageWithPhysicalMecanism", "sprDamageWithMagicalMecanism","summonerSkill"];
const statsBonusCap = {
    "GL": 300,
    "JP": 400
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
    return (item.special && item.special.includes("twoHanded"));
}

function hasDualWieldOrPartialDualWield(item) {
    return hasDualWield(item) || item.partialDualWield;
}

function hasDualWield(item) {
    return item.special && item.special.includes("dualWield")
}

function calculateBuildValue(itemAndPassives) {
    return calculateBuildValueWithFormula(itemAndPassives, builds[currentUnitIndex], ennemyStats, builds[currentUnitIndex].formula);
}

function calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula, alreadyCalculatedValues = {}) {
    if (formula.type == "value") {
        if (alreadyCalculatedValues[formula.name]) {
            return alreadyCalculatedValues[formula.name];
        }
        if (damageFormulaNames.includes(formula.name)) {
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
                                cumulatedKiller += killer[applicableKillerType];
                            }
                        }
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
            damageMultiplier  = (1 + ((unitBuild.unit.max_rarity - 1)/5)) * 0.925; 
            
            var total = 0;
            for (var statIndex = goalValuesCaract[formula.name].statsToMaximize.length; statIndex--;) {
                var stat = goalValuesCaract[formula.name].statsToMaximize[statIndex];
                var calculatedValue = calculateStatValue(itemAndPassives, stat, unitBuild);

                if ("atk" == stat) {
                    var variance0 = 1;
                    var variance1 = 1;
                    if (itemAndPassives[0] && itemAndPassives[0].meanDamageVariance) {
                        variance0 = itemAndPassives[0].meanDamageVariance;
                    }
                    if (itemAndPassives[1] && itemAndPassives[1].meanDamageVariance) {
                        variance1 = itemAndPassives[1].meanDamageVariance;
                    }
                    total += (calculatedValue.right * calculatedValue.right * variance0 + calculatedValue.left * calculatedValue.left * variance1) * (1 - resistModifier) * killerMultiplicator * jumpMultiplier * damageMultiplier  / ennemyStats.def;
                } else {
                    var dualWieldCoef = 1;
                    if (goalValuesCaract[formula.name].type == "physical" && itemAndPassives[0] && itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type) && weaponList.includes(itemAndPassives[1].type)) {
                        dualWieldCoef = 2;
                    }
                    total += (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * dualWieldCoef * jumpMultiplier * evoMagMultiplier * damageMultiplier  / ennemyStats.spr;
                }
            }
            var value = total / goalValuesCaract[formula.name].statsToMaximize.length;
            alreadyCalculatedValues[formula.name] = value;
            return value;
        } else {
            var value = calculateStatValue(itemAndPassives, formula.name, unitBuild).total;
            if (formula.name == "mpRefresh") {
                value /= 100;
            }
            alreadyCalculatedValues[formula.name] = value;
            return value;
        }   
    } else if (formula.type == "constant") {
        return formula.value;
    } else if (formula.type == "*") {
        return calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value1, alreadyCalculatedValues) * calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, alreadyCalculatedValues);
    } else if (formula.type == "+") {
        return calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value1, alreadyCalculatedValues) + calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, alreadyCalculatedValues);
    } else if (formula.type == "/") {
        return calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value1, alreadyCalculatedValues) / calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, alreadyCalculatedValues);
    } else if (formula.type == "-") {
        return calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value1, alreadyCalculatedValues) - calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.value2, alreadyCalculatedValues);
    } else if (formula.type == "conditions") {
        for (var index = formula.conditions.length; index --; ) {
            var value = calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats, formula.conditions[index].value, alreadyCalculatedValues);
            if (value < formula.conditions[index].goal) {
                return 0;
            }
        }
        return calculateBuildValueWithFormula(itemAndPassives,unitBuild, ennemyStats, formula.formula, alreadyCalculatedValues)
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

function calculateStatValue(itemAndPassives, stat, unitBuild) {
    var equipmentStatBonus = getEquipmentStatBonus(itemAndPassives, stat);
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
        return {"total" : Math.floor(calculatedValue),"bonusPercent":currentPercentIncrease.value};
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
                var percentTakenIntoAccount = Math.min(itemPercentValue, Math.max(statsBonusCap[server] - currentPercentIncrease.value, 0));
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
        percent = item[percentValues[stat]];
        percent = Math.min(statsBonusCap[server], 300 - currentPercentIncrease.value);
        currentPercentIncrease.value += percent;
        return percent * baseValue / 100;
    }
    return 0;
}

function getElementCoef(elements, ennemyStats) {
    var resistModifier = 0;

    if (elements.length > 0) {
        for (var element in ennemyStats.elementalResists) {
            if (elements.includes(element)) {
                resistModifier += ennemyStats.elementalResists[element] / 100;
            }
        }    
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

function areConditionOK(item, equiped) {
    if (item.equipedConditions) {
        var found = 0;
        for (var conditionIndex = item.equipedConditions.length; conditionIndex--;) {
            if (elementList.includes(item.equipedConditions[conditionIndex])) {
                var neededElement = item.equipedConditions[conditionIndex];
                if ((equiped[0] && equiped[0].element && equiped[0].element.includes(neededElement)) || (equiped[1] && equiped[1].element && equiped[1].element.includes(neededElement))) {
                    found ++;
                }
            } else {
                for (var equipedIndex = 0; equipedIndex < 10; equipedIndex++) {
                    if (equiped[equipedIndex] && equiped[equipedIndex].type == item.equipedConditions[conditionIndex]) {
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
            return {"id":item.id, "name":item.name, "jpname":item.jpname, "icon":item.icon, "type":item.type,"access":["Conditions not met"]};
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
                return itemVersions[index];
            }
        }
        var item = itemVersions[0];
        return {"id":item.id, "name":item.name, "jpname":item.jpname, "icon":item.icon, "type":item.type,"access":["Conditions not met"]};
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
    return item;
}

function getItemWithTmrSkillIfApplicable(item, unit) {
    if (unit.tmrSkill && item.tmrUnit && item.tmrUnit == unit.id) {
        if (item.originalItem) {
            item = item.originalItem;
        }
        var sum = combineTwoItems(item, unit.tmrSkill);
        sum.originalItem = item;
        return sum;
    } else {
        return item;
    }
}

var simpleAddCombineProperties = ["hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evoMag","accuracy","jumpDamage","lbFillRate","lbPerTurn","mpRefresh"];

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