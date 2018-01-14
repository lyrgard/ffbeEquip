function getValue(item, valuePath) {
    var value = item[valuePath];
    if (value == undefined) {
        if (valuePath.indexOf('.') > -1) {
            value = getValueFromPath(item, valuePath);
        } else {
            value = 0;
        }
        item[valuePath] = value;
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
    return ((item.special && item.special.includes("dualWield")) || item.partialDualWield);
}

function calculateBuildValue(itemAndPassives) {
    return calculateBuildValueWithFormula(itemAndPassives, builds[currentUnitIndex], ennemyStats);
}

function calculateBuildValueWithFormula(itemAndPassives, unitBuild, ennemyStats) {
    var formula = unitBuild.formula;
    if (formula.type == "value") {
        if ("physicalDamage" == formula.name || "magicalDamage" == formula.name || "magicalDamageWithPhysicalMecanism" == formula.name || "hybridDamage" == formula.name) {
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
                    total += (calculatedValue.right * calculatedValue.right * variance0 + calculatedValue.left * calculatedValue.left * variance1) * (1 - resistModifier) * killerMultiplicator * damageMultiplier  / ennemyStats.def;
                } else {
                    var dualWieldCoef = 1;
                    if (goalValuesCaract[formula.name].attackTwiceWithDualWield && itemAndPassives[0] && itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type) && weaponList.includes(itemAndPassives[1].type)) {
                        dualWieldCoef = 2;
                    }
                    total += (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * dualWieldCoef * damageMultiplier  / ennemyStats.spr;
                }
            }
            return total / goalValuesCaract[formula.name].statsToMaximize.length;
        } else {
            var value = calculateStatValue(itemAndPassives, formula.name, unitBuild).total;
            if (formula.name == "mpRefresh") {
                value /= 100;
            }
            return value;
        }   
    } else if (formula.type == "constant") {
        return formula.value;
    } else if (formula.type == "*") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) * calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "+") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) + calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "/") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) / calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "-") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) - calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "conditions") {
        for (var index = formula.conditions.length; index --; ) {
            var value = calculateBuildValueWithFormula(itemAndPassives, formula.conditions[index].value);
            if (value < formula.conditions[index].goal) {
                return 0;
            }
        }
        return calculateBuildValueWithFormula(itemAndPassives, formula.formula)
    }
}
    

function getEquipmentStatBonus(itemAndPassives, stat) {
    if (baseStats.includes(stat) && itemAndPassives[0] && !itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type)) {
        var normalStack = 0;
        var glStack = 0;
        var twoHanded = isTwoHanded(itemAndPassives[0]);
        for (var index = itemAndPassives.length; index--;) {
            var item = itemAndPassives[index];
            if (item) {
                if (item.singleWielding && item.singleWielding[stat]) {
                    normalStack += item.singleWielding[stat] / 100;
                }
                if (item.singleWieldingGL && item.singleWieldingGL[stat]) {
                    glStack += item.singleWieldingGL[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHanded && item.singleWieldingOneHanded[stat]) {
                    normalStack += item.singleWieldingOneHanded[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHandedGL && item.singleWieldingOneHandedGL[stat]) {
                    glStack += item.singleWieldingOneHandedGL[stat] / 100;
                }
            }
        }
        return 1 + Math.min(3, normalStack) + Math.min(3, glStack);
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
    }
    var calculatedValue = baseValue + buffValue;
    
    for (var equipedIndex = itemAndPassives.length; equipedIndex--;) {
        var equipmentStatBonusToApply = 1;
        if (equipedIndex < 10) {
            equipmentStatBonusToApply = equipmentStatBonus;
        }
        if (equipedIndex < 2 && "atk" == stat) {
            calculatedValue += calculatePercentStateValueForIndex(itemAndPassives[equipedIndex], baseValue, currentPercentIncrease, equipmentStatBonusToApply, stat);    
        } else {
            calculatedValue += calculateStateValueForIndex(itemAndPassives[equipedIndex], baseValue, currentPercentIncrease, equipmentStatBonusToApply, stat);    
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

function calculateStateValueForIndex(item, baseValue, currentPercentIncrease, equipmentStatBonus, stat) {
    if (item) {
        var value = getValue(item, stat);
        if (item[percentValues[stat]]) {
            var percentTakenIntoAccount = Math.min(item[percentValues[stat]], Math.max(300 - currentPercentIncrease.value, 0));
            currentPercentIncrease.value += item[percentValues[stat]];
            return value * equipmentStatBonus + percentTakenIntoAccount * baseValue / 100;
        } else {
            return value * equipmentStatBonus;
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
        percent = Math.min(percent, 300 - currentPercentIncrease.value);
        currentPercentIncrease.value += percent;
        return percent * baseValue / 100;
    }
    return 0;
}

function getElementCoef(elements, ennemyStats) {
    var resistModifier = 0;

    if (elements.length > 0) {
        for (var element in ennemyStats.elementResists) {
            if (elements.includes(element)) {
                resistModifier += ennemyStats.elementResists[element] / 100;
            }
        }    
        resistModifier = resistModifier / elements.length;
    }
    return resistModifier;
}