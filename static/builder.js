var goals = {
    "atk":{
        "useWeaponsElements":true,
        "applicableKillerType":"physical",
        "attackTwiceWithDualWield":true
    },
    "mag":{
        "useWeaponsElements":false,
        "applicableKillerType":"magical",
        "attackTwiceWithDualWield":false
    },
    "def": {
        "useWeaponsElements":false,
        "applicableKillerType":"none",
        "attackTwiceWithDualWield":false
    }
};

var useWeaponsElements = true;
var applicableKillerType = "physical";
var attackTwiceWithDualWield = true;

var inventory = {"byType":{},"byCondition":{}};
var numberByType = {}

var rawData;
var data = {};
var dataWithCondition = [];
var dualWieldSources = [];
var espers;
var selectedEspers = [];
var units;
var itemOwned;
var onlyUseOwnedItems = false;
var exludeEventEquipment;
var excludeTMR5;
var excludeNotReleasedYet;

var selectedUnitName;
var selectedUnit;

var equipable;

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":-50,"dark":0};
var ennemyRaces;
var innateElements = [];

var builds = [];
var currentUnitIndex = 0;

var bestValue;
var bestBuild;
var bestEsper;

var statToMaximize;

var stats = [];
var numberOfItemCombination;

var fixedItems = [
    null, 
    null, 
    null, 
    null, 
    null, 
    null, 
    null, 
    null,
    null,
    null]

function build() {
    $(".imageLink").addClass("hidden");
    $(".calculatorLink").addClass("hidden");
    
    bestValue = null;
    bestBuild = null;
    
    if (!builds[currentUnitIndex].selectedUnit) {
        alert("Please select an unit");
        return;
    }
    
    readEnnemyResists();
    ennemyRaces = getSelectedValuesFor("races");
    builds[currentUnitIndex].innateElements = getSelectedValuesFor("elements");
    readGoal();
    
    prepareData(selectedUnit.equip);
    prepareEquipable();
    selectEspers();
    
    optimize();
}

function readGoal() {
    var goal = $(".goal select").val();
    var mecanismType;
    if (goal == "atk") {
        builds[currentUnitIndex].statToMaximize = goal;
        builds[currentUnitIndex].mecanismType = "atk";
    } else if (goal == "mag") {
        builds[currentUnitIndex].statToMaximize = goal;
        var attackType = $(".magicalSkillType input").val();
        if (attackType == "normal") {
            builds[currentUnitIndex].mecanismType = "mag";
        } else {
            builds[currentUnitIndex].mecanismType = "atk";
        }
    } else if (goal == "spr" || goal == "def") {
        builds[currentUnitIndex].statToMaximize = goal;
        builds[currentUnitIndex].mecanismType = "def";
    }
    useWeaponsElements = goals[builds[currentUnitIndex].mecanismType].useWeaponsElements;
    applicableKillerType = goals[builds[currentUnitIndex].mecanismType].applicableKillerType;
    attackTwiceWithDualWield = goals[builds[currentUnitIndex].mecanismType].attackTwiceWithDualWield;
}

function prepareEquipable() {
    equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"]];
    for (var equipIndex in selectedUnit.equip) {
        if (weaponList.includes(selectedUnit.equip[equipIndex])) {
            equipable[0].push(selectedUnit.equip[equipIndex]);
        } else if (shieldList.includes(selectedUnit.equip[equipIndex])) {
            equipable[1].push(selectedUnit.equip[equipIndex]);
        } else if (headList.includes(selectedUnit.equip[equipIndex])) {
            equipable[2].push(selectedUnit.equip[equipIndex]);
        } else if (bodyList.includes(selectedUnit.equip[equipIndex])) {
            equipable[3].push(selectedUnit.equip[equipIndex]);
        } 
    }
    if (hasInnateDualWield()) {
        equipable[1] = equipable[1].concat(equipable[0]);
    }
}

function prepareData(equipable) {
    exludeEventEquipment = $("#exludeEvent").prop('checked');
    excludeTMR5 = $("#excludeTMR5").prop('checked');
    excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
    
    data = {};
    dataWithCondition = [];
    dualWieldSources = [];
    var tempData = {};
    for (var index in rawData) {
        var item = rawData[index];
        if (getOwnedNumber(item) > 0 && isApplicable(item) && (equipable.includes(item.type) || item.type == "accessory" || item.type == "materia")) {
            if (item.equipedConditions) {
                dataWithCondition.push(item);
            } else {
                if ((item.special && item.special.includes("dualWield")) || item.partialDualWield) {
                    dualWieldSources.push(item);
                }
                if (!data[item.type]) {
                    data[item.type] = [];
                }
                var statValue = calculateMaxValue(item);
                var itemEntry = {"value":statValue, "item":item, "name":item.name};
                data[item.type].push(itemEntry);
            }
        }
    }
    for (var typeIndex in typeList) {
        var type = typeList[typeIndex];
        if (data[type]) {
            data[type].sort(function (entry1, entry2) {
                return entry2.value - entry1.value;
            });
        } else {
            data[type] = [];  
        }
    }
}

function selectEspers() {
    selectedEspers = [];
    var maxValueEsper = null;
    for (var index in espers) {
        if (maxValueEsper == null || espers[index][statToMaximize] > maxValueEsper[statToMaximize]) {
            maxValueEsper = espers[index];
        }
        if (getKillerCoef(espers[index]) > 0) {
            selectedEspers.push(espers[index]);
        }
    }
    if (!selectedEspers.includes(maxValueEsper)) {
        selectedEspers.push(maxValueEsper);
    }
}

function getKillerCoef(item) {
    var cumulatedKiller = 0;
    if (ennemyRaces.length > 0 && item.killers) {
        for (var killerIndex in item.killers) {
            if (ennemyRaces.includes(item.killers[killerIndex].name) && item.killers[killerIndex][applicableKillerType]) {
                cumulatedKiller += item.killers[killerIndex][applicableKillerType];
            }
        }
    }
    return cumulatedKiller / ennemyRaces.length;
}

function readEnnemyResists() {
    for(var element in ennemyResist) {
        var value = $("#elementalResists td." + element + " input").val();
        if (value) {
            ennemyResist[element] = parseInt(value);
        } else {
            ennemyResist[element] = 0;
        }
    }
}

function readEnnemyRaces() {
    for(var element in ennemyResist) {
        var value = $("#elementalResists td." + element + " input").val();
        if (value) {
            ennemyResist[element] = parseInt(value);
        } else {
            ennemyResist[element] = 0;
        }
    }
}

function optimize() {
    console.time("optimize");
    $("#buildProgressBar .progressBar").removeClass("finished");
    var combinations = [];
    typeCombination = [null, null, null, null, null, null, null, null, null, null];
    buildTypeCombination(0,typeCombination, combinations);
    
    var unitPartialDualWield = getInnatePartialDualWield();
    if (unitPartialDualWield) {
        var savedEquipable0 = equipable[0];
        var savedEquipable1 = equipable[1];
        
        equipable[0] = unitPartialDualWield;
        equipable[1] = unitPartialDualWield;
        buildTypeCombination(0,typeCombination,combinations);
        
        equipable[0] = savedEquipable0;
        equipable[1] = savedEquipable1;
    }
    if (!hasInnateDualWield() && dualWieldSources.length > 0) {
        for (var index in dualWieldSources) {
            var item = dualWieldSources[index];
            var slot = 0;
            if (item.type == "accessory") {
                slot = 4;
            } else if (item.type == "materia") {
                slot = 6;
            }
            fixedItems[slot] = item;
            var savedEquipable0 = equipable[0];
            if (item.partialDualWield && slot == 0) {
                equipable[0] = [item.type];
                equipable[1] = item.partialDualWield;
                var unitPartialDualWield = getInnatePartialDualWield();
                if (unitPartialDualWield) {
                    equipable[1] = mergeArrayWithoutDuplicates(equipable[1], unitPartialDualWield);
                }
            } else {
                equipable[1] = equipable[0];
            }
            buildTypeCombination(0,typeCombination,combinations);
            fixedItems[slot] = null;
            equipable[0] = savedEquipable0;
        }
    }
    console.log(combinations.length);
    
    
    findBestBuildForCombinationAsync(0, combinations);
}

function buildTypeCombination(index, typeCombination, combinations) {
    if (fixedItems[index]) {
        tryType(index, typeCombination, fixedItems[index].type, combinations);
    } else {
        if (equipable[index].length > 0) {
            var found = false;
            for (var typeIndex in equipable[index]) {
                type = equipable[index][typeIndex]
                if (index == 1 && alreadyTriedInSlot0(type, typeCombination[0], equipable[0])) {
                    continue;
                }
                if (data[type].length > 0) {
                    tryType(index, typeCombination, type, combinations);
                    found = true;
                }
            }
            if (!found) {
                typeCombination[index] = null;
                buildTypeCombination(index+1, typeCombination, combinations);
            }
        } else {
            typeCombination[index] = null;
            buildTypeCombination(index+1, typeCombination, combinations);
        }
    }
}

function tryType(index, typeCombination, type, combinations) {
    typeCombination[index] = type;
    if (index == 9) {
        build = [null, null, null, null, null, null, null, null, null, null];
        numberOfItemCombination = 0;
        var dataWithdConditionItems = {}
        for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
            if (typeCombination[slotIndex]) {
                dataWithdConditionItems[typeCombination[slotIndex]] = addConditionItems(data[typeCombination[slotIndex]], typeCombination[slotIndex], typeCombination);
            }
        }
        combinations.push({"combination":typeCombination.slice(), "data":dataWithdConditionItems, "fixed":fixedItems.slice()});
    } else {
        buildTypeCombination(index+1, typeCombination, combinations);
    }
}

function alreadyTriedInSlot0(type, typeSlot0, equipableSlot0) {
    if (type == typeSlot0) {
        return false;
    }
    var indexOfTypeSlot0 = equipableSlot0.indexOf(typeSlot0);
    if (indexOfTypeSlot0 >= 0) {
        for (var index = 0; index <= indexOfTypeSlot0; index++) {
            if (equipableSlot0[index] == type) {
                return true;
            }
        }
    }
    return false;
}

function logDataWithdConditionItems(dataWithdConditionItems) {
    for (var index in dataWithdConditionItems) {
        logAddConditionItems(dataWithdConditionItems[index]);
    }
}

function findBestBuildForCombinationAsync(index, combinations) {
    console.log(index);
    var build = [null, null, null, null, null, null, null, null, null, null];
    findBestBuildForCombination(0, build, combinations[index].combination, combinations[index].data, combinations[index].fixed);
    //console.log(Math.floor(index/combinations.length*100) + "%" );
    var progress = Math.floor((index + 1)/combinations.length*100) + "%";
    var progressElement = $("#buildProgressBar .progressBar");
    progressElement.width(progress);
    progressElement.text(progress);
    if (index + 1 < combinations.length) {
        setTimeout(findBestBuildForCombinationAsync,0,index+1,combinations);
    } else {
        logCurrentBuild();
        progressElement.addClass("finished");
        console.timeEnd("optimize");
        
        
        var hash = getBuildHash();
        $(".imageLink").prop("href","http://ffbeben.ch/" + hash + ".png");
        $(".calculatorLink").prop("href","http://ffbeben.ch/" + hash);
        $(".imageLink").removeClass("hidden");
        //$(".calculatorLink").removeClass("hidden");
        
        if (builds.length < 5) {
            $("#addNewUnitButton").removeClass("hidden");
        }
    }
}

function getBuildHash() {
    var hash = "";
    hash += Number(selectedUnit.id).toString(36);
    for (var i = 0; i < 10; i++) {
        item = bestBuild[i];
        if (item) {
            hash += Number(item.id).toString(36);
        } else {
            hash += 999999999..toString(36);
        }
    }
    return hash;
}

function findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems, fixedItems) {
    if (fixedItems[index]) {
        tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index], fixedItems);
    } else {
        if (index == 1 && build[0] && isTwoHanded(build[0])) {
            build[index] == null;
            findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems);    
        } else {
            if (typeCombination[index]  && dataWithConditionItems[typeCombination[index]].length > 0) {
                var foundAnItem = false;
                var firstIndexToTry = 0; 
                if ((index == 1 && typeCombination[0] == typeCombination[1]) || index == 5 || index > 6) {
                    // For slots with same type, don't calculate all possible combination, prevent redundant combination from being calculated
                    var indexOfPreviousItem = dataWithConditionItems[typeCombination[index - 1]].indexOf(build[index - 1]);
                    firstIndexToTry = Math.max(indexOfPreviousItem,0);
                }
                for (var itemIndex = firstIndexToTry; itemIndex < dataWithConditionItems[typeCombination[index]].length; itemIndex++) {
                    var item = dataWithConditionItems[typeCombination[index]][itemIndex];
                    if (canAddMoreOfThisItem(build, item, index)) {
                        if (index == 1 && isTwoHanded(item)) {
                            continue;
                        }
                        tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems);
                        foundAnItem = true;
                    }
                }
                if (!foundAnItem) {
                    tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems);
                }
                build[index] == null;
            } else {
                findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems);
            }
        }
    }
}

function tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems) {
    build[index] = item;
    if (index == 9) {
        numberOfItemCombination++
        for (var esperIndex in selectedEspers) {
            value = calculateValue(build, selectedEspers[esperIndex]);
            if (builds[currentUnitIndex].bestValue == null || value.total > builds[currentUnitIndex].bestValue.total) {
                builds[currentUnitIndex].bestBuild = build.slice();
                builds[currentUnitIndex].bestValue = value;
                builds[currentUnitIndex].bestEsper = selectedEspers[esperIndex];
                logCurrentBuild();
            }    
        }
    } else {
        findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems);
    }
}

function addConditionItems(itemsOfType, type, typeCombination) {
    var tempResult = itemsOfType.slice();
    for (var index in dataWithCondition) {
        var item = dataWithCondition[index];
        if (item.type == type) {
            var allFound = true;
            for (var conditionIndex in item.equipedConditions) {
                if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                    allFound = false;
                    break;
                }
            }
            if (allFound) {
                tempResult.push({"value":calculateMaxValue(item), "item":item, "name":item.name});
            }
        }
    }
    tempResult.sort(function (entry1, entry2) {
        
        if (entry1.value == entry2.value2) {
            return getOwnedNumber(entry2.item) - getOwnedNumber(entry1.item);
        } else {
            return entry2.value - entry1.value;
        }
    });
    var numberNeeded = 0;
    for (var slotIndex in typeCombination) {
        if (typeCombination[slotIndex] == type) {
            numberNeeded++;
        }
    }
    var itemIndex = 0;
    var itemKeptKeys = [];
    var damageCoefLevelAlreadyKept = {};
    var result = [];
    var itemKey = getItemInventoryKey();
    for (var itemIndex in tempResult) {
        item = tempResult[itemIndex].item;
        var damageCoefLevel = getDamageCoefLevel(item);
        if (!damageCoefLevel || itemKeptKeys.includes(item[itemKey]) || damageCoefLevelAlreadyKept[damageCoefLevel] && damageCoefLevelAlreadyKept[damageCoefLevel] >= numberNeeded) {
            continue;
        } else {
            if (!damageCoefLevelAlreadyKept[damageCoefLevel]) {
                damageCoefLevelAlreadyKept[damageCoefLevel] = 0;
            }
            damageCoefLevelAlreadyKept[damageCoefLevel] += getOwnedNumber(item);
            result.push(item);
            itemKeptKeys.push(item[itemKey]);
        }
    }
    
    // Also keep at least the best numberNeeded items with flat stat
    tempResult.sort(function (entry1, entry2) {
        var value1 = 0;
        var value2 = 0;
        if (entry1.item[statToMaximize]) {
            value1 = entry1.item[statToMaximize];
        }
        if (entry2.item[statToMaximize]) {
            value2 = entry2.item[statToMaximize];
        }
        if (value1 == value2) {
            return getOwnedNumber(entry2.item) - getOwnedNumber(entry1.item);
        } else {
            return value2 - value1;
        }
    });
    
    var number = 0;
    for (var itemIndex in tempResult) {
        item = tempResult[itemIndex].item;
        if (item[statToMaximize]) {
            if (number < numberNeeded) {
                if (!result.includes(item)) {
                    result.push(item);
                }
                number += getOwnedNumber(item);
            } else {
                break;
            }
        }
    }
    
    if (result.length == 0 && typeCombination.indexOf(type) < 4 && tempResult.length > 0) {
        result.push(tempResult[0].item);
    }
    
    return result;
}

function getDamageCoefLevel(item) {
    var damageCoefLevel = null;
    if (item[statToMaximize] || item[statToMaximize + '%']) {
        damageCoefLevel = "neutral";
    }
    if (statToMaximize == "atk" || statToMaximize == "mag") {
        var killerCoef = getKillerCoef(item);
        if (killerCoef > 0) {
            damageCoefLevel += "killer" + killerCoef;
        }
        if (weaponList.includes(item.type)) {
            // only for weapons
            if ((item.element && ennemyResist[item.element] != 0)) {
                damageCoefLevel += "element" + ennemyResist[item.element];
            }
            if (damageCoefLevel == "neutral" && (!item.element || innateElements.includes(item.element))) {
                damageCoefLevel = "elementless";
            }
        }
    }
    return damageCoefLevel;
}

function logAddConditionItems(data) {
    var string = "";
    for (var index in data) {
        string += data[index].name + ", ";
    }
    console.log(string);
}

function canAddMoreOfThisItem(build, item, currentIndex) {
    var number = 0;
    for (var index = 0; index < currentIndex; index++) {
        if (build[index] && build[index].name == item.name) {
            if (!isStackable(item)) {
                return false;
            }
            number++;
        }
    }
    for (var index = currentIndex + 1; index < 10; index++) {
        if (fixedItems[index] && fixedItems[index].name == item.name) {
            if (!isStackable(item)) {
                return false;
            }
            number++;
        }
    }
    return getOwnedNumber(item) > number;
}


function isStackable(item) {
    return !(item.special && item.special.includes("notStackable"));
}

function isTwoHanded(item) {
    return (item.special && item.special.includes("twoHanded"));
}

function hasInnateDualWield() {
    for (var index in selectedUnit.skills) {
        if (selectedUnit.skills[index].special && selectedUnit.skills[index].special.includes("dualWield")) {
            return true;
        }
    }
    return false;
}

function getInnatePartialDualWield() {
    for (var index in selectedUnit.skills) {
        if (selectedUnit.skills[index].partialDualWield) {
            return selectedUnit.skills[index].partialDualWield;
        }
    }
    return null;
}

function getOwnedNumber(item) {
    var number = 0;
    if (onlyUseOwnedItems) {
        if (itemInventory[item[getItemInventoryKey()]]) {
            number = itemInventory[item[getItemInventoryKey()]];
        }
    } else {
        if (excludeNotReleasedYet || excludeTMR5 || exludeEventEquipment) {
            for (var index in item.access) {
                var access = item.access[index];
                if ((excludeNotReleasedYet && access == "not released yet")
                   || (excludeTMR5 && access.startsWith("TMR-5*") && item.tmrUnit != selectedUnit.name)
                   || (exludeEventEquipment && access.endsWith("event"))) {
                    return 0;
                }        
            }
        } 
        number = 4;

    }
    if (!isStackable(item)) {
        number = Math.min(number,1);
    }
    return number;
}


function isApplicable(item) {
    if (item.exclusiveSex && item.exclusiveSex != builds[currentUnitIndex].selectedUnit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(builds[currentUnitIndex].selectedUnitName)) {
        return false;
    }
    return true;
}

function someEquipmentNoMoreApplicable(build) {
    for (var index in build) {
        if (build[index] && !isApplicable(build[index],build,5)) {
            return true;
        }
    }
    return false;
}

function calculateMaxValue(item) {
    var baseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats[statToMaximize] + builds[currentUnitIndex].selectedUnit.stats.pots[statToMaximize];
    var calculatedValue = 0;
    if (item[statToMaximize]) {
        calculatedValue += item[builds[currentUnitIndex].statToMaximize];
    }
    if (item[statToMaximize + '%']) {
        calculatedValue += item[builds[currentUnitIndex].statToMaximize+'%'] * baseValue / 100;
    }
    return calculatedValue;
}

function calculateValue(equiped, esper) {
    if ("atk" == statToMaximize || "mag" == statToMaximize) {
        var calculatedValue = calculateStatValue(equiped, esper);
        
        var cumulatedKiller = 0;
        var itemAndPassives = equiped.concat(builds[currentUnitIndex].selectedUnit.skills);
        if (esper != null) {
            itemAndPassives.push(esper);
        }
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (areConditionOK(itemAndPassives[equipedIndex], equiped))) {
                if (ennemyRaces.length > 0 && itemAndPassives[equipedIndex].killers) {
                    for (var killerIndex = 0; killerIndex <  itemAndPassives[equipedIndex].killers.length; killerIndex++) {
                        if (ennemyRaces.includes(itemAndPassives[equipedIndex].killers[killerIndex].name) && itemAndPassives[equipedIndex].killers[killerIndex][applicableKillerType]) {
                            cumulatedKiller += itemAndPassives[equipedIndex].killers[killerIndex][applicableKillerType];
                        }
                    }
                }
            }
        }
        
        // Element weakness/resistance
        var elements = innateElements.slice();
        if (useWeaponsElements) {
            if (equiped[0] && equiped[0].element && !elements.includes(equiped[0].element)) {
                elements.push(equiped[0].element);
            };
            if (equiped[1] && equiped[1].element && !elements.includes(equiped[1].element)) {
                elements.push(equiped[1].element);
            };
        }
        var resistModifier = 0;
        
        if (elements.length > 0) {
            for (var element in ennemyResist) {
                if (equiped[0] && equiped[0].element && equiped[0].element == element || equiped[1] && equiped[1].element && equiped[1].element == element) {
                    resistModifier += ennemyResist[element] / 100;
                }
            }    
            resistModifier = resistModifier / elements.length;
        }
        
        // Killers
        var killerMultiplicator = 1;
        if (ennemyRaces.length > 0) {
            killerMultiplicator += (cumulatedKiller / 100) / ennemyRaces.length;
        }
        
        if ("atk" == statToMaximize) {
            var total = (calculatedValue.right * calculatedValue.right + calculatedValue.left * calculatedValue.left) * (1 - resistModifier) * killerMultiplicator;
            return {"total":total, "stat":calculatedValue.total, "bonusPercent":calculatedValue.bonusPercent};
        } else {
            var dualWieldCoef = 1;
            if (attackTwiceWithDualWield) {
                dualWieldCoef = 2;
            }
            var total = (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * dualWieldCoef;
            return {"total":total, "stat":calculatedValue.total, "bonusPercent":calculatedValue.bonusPercent};
        }
    } else if ("def" == statToMaximize || "spr" == statToMaximize) {
        return calculateStatValue(equiped, esper);
    }
}

function calculateStatValue(equiped, esper) {
    
    var calculatedValue = 0   
    var currentPercentIncrease = {"value":0};
    var baseValue = selectedUnit.stats.maxStats[builds[currentUnitIndex].statToMaximize] + builds[currentUnitIndex].selectedUnit.stats.pots[statToMaximize];
    var calculatedValue = baseValue;
    var itemAndPassives = equiped.concat(builds[currentUnitIndex].selectedUnit.skills);

    for (var equipedIndex = 0; equipedIndex < itemAndPassives.length; equipedIndex++) {
        if (equipedIndex < 2 && "atk" == statToMaximize) {
            calculatedValue += calculatePercentStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease);    
        } else {
            calculatedValue += calculateStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease);    
        }
    }
    if (esper != null) {
        calculatedValue += esper[statToMaximize] / 100;
    }
    
    if ("atk" == statToMaximize) {
        var result = {"right":0,"left":0,"total":0,"bonusPercent":currentPercentIncrease.value}; 
        var right = calculateFlatStateValueForIndex(equiped, itemAndPassives, 0);
        var left = calculateFlatStateValueForIndex(equiped, itemAndPassives, 1);
        if (equiped[1] && weaponList.includes(equiped[1].type)) {
            result.right = calculatedValue + right;
            result.left = calculatedValue + left;
            result.total = calculatedValue + right + left;    
        } else {
            result.right = calculatedValue + right + left;
            result.total = result.right;
        }
        return result;   
    } else {
        return {"total" : calculatedValue,"bonusPercent":currentPercentIncrease.value};
    }
}

function calculateStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease) {
    var value = 0;
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][statToMaximize]) {
            value += itemAndPassives[equipedIndex][statToMaximize];
        }
        if (itemAndPassives[equipedIndex][statToMaximize + '%']) {
            percent = itemAndPassives[equipedIndex][statToMaximize+'%'];
            percentTakenIntoAccount = Math.min(percent, Math.max(300 - currentPercentIncrease.value, 0));
            currentPercentIncrease.value += percent;
            value += percentTakenIntoAccount * baseValue / 100;
        }
    }
    return value;
}

function calculateFlatStateValueForIndex(equiped, itemAndPassives, equipedIndex) {
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][statToMaximize]) {
            return itemAndPassives[equipedIndex][statToMaximize];
        }
    }
    return 0;
}

function calculatePercentStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease) {
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][statToMaximize + '%']) {
            percent = itemAndPassives[equipedIndex][statToMaximize+'%'];
            percent = Math.min(percent, 300 - currentPercentIncrease.value);
            currentPercentIncrease.value += percent;
            return percent * baseValue / 100;
        }
    }
    return 0;
}

function areConditionOK(item, equiped) {
    if (item.equipedConditions) {
        var found = 0;
        for (var conditionIndex in item.equipedConditions) {
            for (var equipedIndex in equiped) {
                if (equiped[equipedIndex] && equiped[equipedIndex].type == item.equipedConditions[conditionIndex]) {
                    found ++;
                    break;
                }
            }
        }
        if (found != item.equipedConditions.length) {
            return false;
        }
    }
    return true;
}

fonction logCurrentBuild() {
    logBuild(builds[currentUnitIndex].bestBuild, builds[currentUnitIndex].bestValue, builds[currentUnitIndex].bestEsper);
}

function logBuild(build, value, esper) {
    
    
    $("#results .tbody").html(html);
    if (build.length == 0) {
        $("#resultStats").html("");
        $(".imageLink").addClass("hidden");
        var progress = "0%";
        var progressElement = $("#buildProgressBar .progressBar");
        progressElement.width(progress);
        progressElement.text(progress);
        progressElement.addClass("finished");
    } else {
        
        var order = [0,1,2,3,4,5,6,7,8,9];
        var html = "";
        for (var index = 0; index < order.length; index++) {
            var item = build[order[index]];
            if (item) {
                html += '<div class="tr">';
                html += displayItemLine(item);
                html += "</div>";
            }
        }
        if (esper) {
            var esperItem = getEsperItem(esper);
            html += '<div class="tr">';
            html += displayItemLine(esperItem);
            html += "</div>";
        }

        var bonusPercent;
        if (value.bonusPercent > 300) {
            bonusPercent = "<span style='color:red;'>" + value.bonusPercent + "%</span> (Only 300% taken into account)";
        } else {
            bonusPercent = value.bonusPercent + "%";
        }
        
        if (statToMaximize == "atk" || statToMaximize == "mag") {
            $("#resultStats").html("<div>" + statToMaximize + " = " + Math.floor(value.stat) + '</div><div>damage (on 100 def) = ' + Math.floor(value.total) + "</div><div>+" + statToMaximize + "% : " + bonusPercent + "</div>");
        } else if (statToMaximize == "def" || statToMaximize == "spr") {
            $("#resultStats").html("<div>" + statToMaximize + " = " + Math.floor(value.total) + "</div><div>+" + statToMaximize + "% : " + bonusPercent + "</div>");
        }
    }
}

function getEsperItem(esper) {
    var item = {};
    item.name = esper.name;
    item.type = escapeName(esper.name);
    item.hp = Math.floor(esper.hp / 100);
    item.mp = Math.floor(esper.mp / 100);
    item.atk = Math.floor(esper.atk / 100);
    item.def = Math.floor(esper.def / 100);
    item.mag = Math.floor(esper.mag / 100);
    item.spr = Math.floor(esper.spr / 100);
    if (esper.killers) {
        item.killers = esper.killers;
    }
    return item;
}

// Populate the unit html select with a line per unit
function populateUnitSelect() {
    var options = '<option value=""></option>';
    Object.keys(units).sort().forEach(function(value, index) {
        options += '<option value="'+ value + '">' + value + '</option>';
    });
    $("#unitsSelect").html(options);
    $("#unitsSelect").change(function() {
        $( "#unitsSelect option:selected" ).each(function() {
            var unitName = $(this).val();
            var selectedUnitData = units[unitName];
            if (selectedUnitData) {
                selectedUnitName = unitName;
                selectedUnit = selectedUnitData;
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val(selectedUnitData.stats.maxStats[stat] + selectedUnitData.stats.pots[stat]);
		      	});
                $("#unitTabs .tab_" + currentUnitIndex + " a").html(unitName);
                bestBuild = [];
                bestValue = 0;
                bestEsper = null;
                logCurrentBuild();
            } else {
                selectedUnit = '';
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val("");
		      	});
                $("#unitTabs .tab_" + currentUnitIndex + " a").html("Select unit");
            }
            displayUnitRarity(selectedUnitData);
            
        });
    });
}

function saveCurrentBuild() {
    var currentUnit = {};
    currentUnit.selectedUnitName = selectedUnitName;
    currentUnit.selectedUnit = selectedUnit;
    currentUnit.goal = $(".goal select").val();
    currentUnit.attackType = $(".magicalSkillType input").val();
    currentUnit.innateElements = innateElements;
    currentUnit.bestBuild = bestBuild;
    currentUnit.bestEsper = bestEsper;
    builds[currentUnitIndex] = currentUnit;
}

function reinitBuild(buildIndex) {
    var currentUnit = {};
    builds[buildIndex] = currentUnit;
}

function loadBuild(buildIndex) {
    currentUnitIndex = buildIndex;
    var build = builds[buildIndex];
    $("#unitsSelect option").prop("selected", false);
    if (build.selectedUnitName) {
        $('#unitsSelect option[value="' + build.selectedUnitName + '"]').prop("selected", false);
    }
    bestBuild = [];
    if (build.bestBuild) {
        bestBuild = build.bestBuild;
    }
    bestEsper = null;
    if (build.bestEsper) {
        bestEsper = build.bestEsper;
    }
    logCurrentBuild();
}

// Displays selected unit's rarity by stars
var displayUnitRarity = function(unit) {
    var rarityWrapper = $('.unit-rarity');
    if (unit) {
        var rarity = unit.max_rarity;

        rarityWrapper.show();
        rarityWrapper.empty();

        for (var i = 0; i < rarity; i++) {
            rarityWrapper.append('<i class="rarity-star" />');
        }
    } else {
        rarityWrapper.hide();
    }
};

function inventoryLoaded() {
    $(".equipments select option[value=owned]").prop("disabled", false);
    $(".equipments select").val("owned");
    onEquipmentsChange();
}

function onGoalChange() {
    var goal = $(".goal select").val();
    if (goal == "mag") {
        $(".magicalSkillType").removeClass("hidden");
        $(".monster").removeClass("hidden");
        $(".unitAttackElement").removeClass("hidden");
    } else if (goal == "atk"){
        $(".magicalSkillType").addClass("hidden");
        $(".monster").removeClass("hidden");
        $(".unitAttackElement").removeClass("hidden");
    } else if (goal == "def" || goal == "spr") {
        $(".monster").addClass("hidden");
        $(".unitAttackElement").addClass("hidden");
        $(".magicalSkillType").addClass("hidden");
    }
}

function onEquipmentsChange() {
    var equipments = $(".equipments select").val();
    if (equipments == "all") {
        $(".equipments .panel-body").removeClass("hidden");
        onlyUseOwnedItems = false;
    } else {
        $(".equipments .panel-body").addClass("hidden");
        onlyUseOwnedItems = true;
    }
}

function addNewUnit() {
    saveCurrentBuild();
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + (builds.length - 1)).after("<li class='active tab_" + builds.length + "'><a href='#' onclick='selectUnitTab(" + builds.length + ")'>Select unit</a></li>");
    $("#addNewUnitButton").addClass("hidden");
    builds.push({});
    loadBuild(builds.length - 1);
}

function selectUnitTab(index) {
    saveCurrentBuild();
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + index).addClass("active");
    loadBuild(index);
}
            
$(function() {
    $.get(server + "/data.json", function(result) {
        rawData = result;
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/unitsWithSkill.json", function(result) {
        units = result;
        populateUnitSelect();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/espers.json", function(result) {
        espers = result;
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    $(".goal select").change(onGoalChange);
    onGoalChange();
    
    $(".equipments select").change(onEquipmentsChange);
    
    $("#buildButton").click(build);
    
    // Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"]);
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
});
