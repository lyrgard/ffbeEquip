page = "builder";
var adventurerIds = ["1500000013", "1500000015", "1500000016", "1500000017", "1500000018"];

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

var dataByType = {};
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

var desirableElements = [];

var builds = [];
var currentUnitIndex = 0;

var stats = [];
var numberOfItemCombination;

var alreadyUsedItems = {};
var alreadyUsedEspers = [];

var itemKey = getItemInventoryKey();

var searchType = [];
var searchStat = "";

var dataLoadedFromHash = false;

function build() {
    $(".buildLinks").addClass("hidden");
    
    if (!builds[currentUnitIndex].selectedUnit) {
        alert("Please select an unit");
        return;
    }
    
    
    
    builds[currentUnitIndex].bestValue = null;
    
    readEnnemyResists();
    ennemyRaces = getSelectedValuesFor("races");
    builds[currentUnitIndex].innateElements = getSelectedValuesFor("elements");
    readGoal();
    
    calculateAlreadyUsedItems();
    
    prepareData(builds[currentUnitIndex].selectedUnit.equip);
    prepareEquipable();
    selectEspers();
    
    optimize();
}

function calculateAlreadyUsedItems() {
    alreadyUsedItems = {};
    alreadyUsedEspers = [];
    for (var i in builds) {
        if (i != currentUnitIndex) {
            var build = builds[i].bestBuild;
            if (build && build.length != 0) {
                for (var j in build) {
                    var item = build[j];
                    if (item) {
                        if (alreadyUsedItems[item[itemKey]]) {
                            alreadyUsedItems[item[itemKey]]++;
                        } else {
                            alreadyUsedItems[item[itemKey]] = 1;
                        }
                    }
                }
            } else {
                for (var index in builds[i].fixedItems) {
                    if (builds[i].fixedItems[index]) {
                        var item = builds[i].fixedItems[index];
                        if (item) {
                            if (alreadyUsedItems[item[itemKey]]) {
                                alreadyUsedItems[item[itemKey]]++;
                            } else {
                                alreadyUsedItems[item[itemKey]] = 1;
                            }
                        }   
                    }
                }
            }
            if (builds[i].bestEsper) {
                alreadyUsedEspers.push(builds[i].bestEsper.name);
            }
        } else {
            for (var index in builds[i].fixedItems) {
                if (builds[i].fixedItems[index]) {
                    var item = builds[i].fixedItems[index];
                    if (item) {
                        if (alreadyUsedItems[item[itemKey]]) {
                            alreadyUsedItems[item[itemKey]]++;
                        } else {
                            alreadyUsedItems[item[itemKey]] = 1;
                        }
                    }   
                }
            }
        }
    }
}

function readGoal() {
    var goal = $(".goal select").val();
    
    var mecanismType;
    if (goal == "atk") {
        builds[currentUnitIndex].statToMaximize = goal;
        builds[currentUnitIndex].mecanismType = "atk";
    } else if (goal == "mag") {
        builds[currentUnitIndex].statToMaximize = goal;
        var attackType = $(".magicalSkillType select").val();
        if (attackType == "normal") {
            builds[currentUnitIndex].mecanismType = "mag";
        } else {
            builds[currentUnitIndex].mecanismType = "atk";
        }
    } else if (goal == "spr" || goal == "def" || goal == "hp") {
        builds[currentUnitIndex].statToMaximize = goal;
        builds[currentUnitIndex].mecanismType = "def";
    }
    useWeaponsElements = goals[builds[currentUnitIndex].mecanismType].useWeaponsElements;
    applicableKillerType = goals[builds[currentUnitIndex].mecanismType].applicableKillerType;
    attackTwiceWithDualWield = goals[builds[currentUnitIndex].mecanismType].attackTwiceWithDualWield;
}

function prepareEquipable() {
    equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"]];
    var selectedUnit = builds[currentUnitIndex].selectedUnit;
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
    
    dataByType = {};
    dataWithCondition = [];
    dualWieldSources = [];
    var tempData = {};
    for (var index in data) {
        var item = data[index];
        if (getAvailableNumber(item) > 0 && isApplicable(item) && (equipable.includes(item.type) || item.type == "accessory" || item.type == "materia")) {
            if (item.equipedConditions) {
                dataWithCondition.push(item);
            } else {
                if ((item.special && item.special.includes("dualWield")) || item.partialDualWield) {
                    dualWieldSources.push(item);
                }
                if (!dataByType[item.type]) {
                    dataByType[item.type] = [];
                }
                var statValue = calculateMaxValue(item);
                var itemEntry = {"value":statValue, "item":item, "name":item.name};
                dataByType[item.type].push(itemEntry);
            }
        }
    }
    for (var typeIndex in typeList) {
        var type = typeList[typeIndex];
        if (dataByType[type]) {
            dataByType[type].sort(function (entry1, entry2) {
                return entry2.value - entry1.value;
            });
        } else {
            dataByType[type] = [];  
        }
    }
    
    desirableElements = [];
    for (var index in builds[currentUnitIndex].selectedUnit.skills) {
        var skill = builds[currentUnitIndex].selectedUnit.skills[index];
        if (skill.equipedConditions && skill.equipedConditions.length == 1 && elementList.includes(skill.equipedConditions[0]) && !desirableElements.includes(skill.equipedConditions[0])) {
            desirableElements.push(skill.equipedConditions[0]);
        }
    }
}

function selectEspers() {
    selectedEspers = [];
    var maxValueEsper = null;
    for (var index in espers) {
        if (!alreadyUsedEspers.includes(espers[index].name)) {
            if (maxValueEsper == null || espers[index][builds[currentUnitIndex].statToMaximize] > maxValueEsper[builds[currentUnitIndex].statToMaximize]) {
                maxValueEsper = espers[index];
            }
            if (getKillerCoef(espers[index]) > 0) {
                selectedEspers.push(espers[index]);
            }
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

function optimize() {
    console.time("optimize");
    $("#buildProgressBar .progressBar").removeClass("finished");
    var combinations = [];
    typeCombination = [null, null, null, null, null, null, null, null, null, null];
    buildTypeCombination(0,typeCombination, combinations,builds[currentUnitIndex].fixedItems.slice(), true);
    
    var fixedItems = builds[currentUnitIndex].fixedItems;
    var unitPartialDualWield = getInnatePartialDualWield();
    if (unitPartialDualWield && (!fixedItems[0] || unitPartialDualWield.includes(fixedItems[0].type))) { // Only try partial dual wield if no weapon fixed, or one weapon fixed of the partial dual wield type
        var savedEquipable0 = equipable[0];
        var savedEquipable1 = equipable[1];
        
        equipable[0] = unitPartialDualWield;
        equipable[1] = unitPartialDualWield;
        buildTypeCombination(0,typeCombination,combinations, fixedItems.slice());
        
        equipable[0] = savedEquipable0;
        equipable[1] = savedEquipable1;
    }
    if (!hasInnateDualWield() && dualWieldSources.length > 0 && !(builds[currentUnitIndex].fixedItems[0] && isTwoHanded(builds[currentUnitIndex].fixedItems[0]))) {
        for (var index in dualWieldSources) {
            var item = dualWieldSources[index];
            var slot = getFixedItemItemSlot(item, equipable, builds[currentUnitIndex].fixedItems);
            if (slot == -1) {
                continue;
            }
            var fixedItems = builds[currentUnitIndex].fixedItems.slice();
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
            buildTypeCombination(0,typeCombination,combinations,fixedItems);
            builds[currentUnitIndex].fixedItems[slot] = null;
            equipable[0] = savedEquipable0;
        }
    }
    console.log(combinations.length);
    
    
    findBestBuildForCombinationAsync(0, combinations);
}
    
function getFixedItemItemSlot(item, equipable, fixedItems) {
    var slot = -1;
    if (weaponList.includes(item.type)) {
        if (fixedItems[0] && fixedItems[1]) {
            return -1;
        }
        if (!fixedItems[0]) {
            return 0;
        } else {
            if (equipable[1].includes(item.type)) {
                return 1;
            } else {
                return -1;
            }
        }
    } else if (shieldList.includes(item.type)) {    
        if (fixedItems[1]) {
            return -1;
        }
        return 1;
    } else if (headList.includes(item.type)) {    
        if (fixedItems[2]) {
            return -1;
        }
        return 2;
    } else if (bodyList.includes(item.type)) {    
        if (fixedItems[3]) {
            return -1;
        }
        return 3;
    } else if (item.type == "accessory") {
        if (fixedItems[4] && fixedItems[5]) {
            return -1;
        }
        if (!fixedItems[4]) {
            return 4;
        } else {
            return 5;
        }
    } else if (item.type == "materia") {
        if (fixedItems[6] && fixedItems[7] && fixedItems[8] && fixedItems[9]) {
            return -1;
        }
        if (!fixedItems[6]) {
            return 6;
        } else if (!fixedItems[7]) {
            return 7;
        } else if (!fixedItems[8]) {
            return 8;
        } else {
            return 9;
        }
    }
    return slot;
}

function buildTypeCombination(index, typeCombination, combinations, fixedItems, tryDoublehand = false) {
    if (fixedItems[index]) {
        tryType(index, typeCombination, fixedItems[index].type, combinations, fixedItems, tryDoublehand);
    } else {
        if (equipable[index].length > 0) 
            if (index == 1 && fixedItems[0] && isTwoHanded(fixedItems[0])) { // of a two-handed weapon was fixed, no need to try smething in the second hand
                tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand);
            } else {
                var found = false;
                for (var typeIndex in equipable[index]) {
                    type = equipable[index][typeIndex]
                    if (index == 1 && alreadyTriedInSlot0(type, typeCombination[0], equipable[0])) {
                        continue;
                    }
                    if (dataByType[type].length > 0) {
                        tryType(index, typeCombination, type, combinations, fixedItems, tryDoublehand);
                        found = true;
                    }
                }
                if (!found) {
                    tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand);
                } else if (index == 1 && tryDoublehand) {
                    tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand);
                }
        } else {
            tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand);
        }
    }
}

function tryType(index, typeCombination, type, combinations, fixedItems, tryDoublehand) {
    typeCombination[index] = type;
    if (index == 9) {
        build = [null, null, null, null, null, null, null, null, null, null];
        numberOfItemCombination = 0;
        var dataWithdConditionItems = {}
        for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
            if (typeCombination[slotIndex]) {
                dataWithdConditionItems[typeCombination[slotIndex]] = addConditionItems(dataByType[typeCombination[slotIndex]], typeCombination[slotIndex], typeCombination);
            }
        }
        
        combinations.push({"combination":typeCombination.slice(), "data":dataWithdConditionItems, "fixed":getBestFixedItemVersions(fixedItems,typeCombination)});
    } else {
        buildTypeCombination(index+1, typeCombination, combinations, fixedItems, tryDoublehand);
    }
}

function getBestFixedItemVersions(fixedItems, typeCombination) {
    var typeCombinationBuild = [null, null, null, null, null, null, null, null, null, null];
    var result = fixedItems.slice();
    for (var i = 0; i < 10; i++) {
        if (fixedItems[i]) {
            typeCombinationBuild[i] = fixedItems[i];
        } else if (typeCombination[i]) {
            typeCombinationBuild[i] = {"type":typeCombination[i]};
        }
    }
 
    for (var index in fixedItems) {
        if (fixedItems[index]) {
            result[index] = findBestItemVersion(typeCombinationBuild, fixedItems[index][itemKey]);
        }
    }
    return result;
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
    }
}

function getBuildHash() {
    var hash = "";
    hash += Number(builds[currentUnitIndex].selectedUnit.id).toString(36);
    for (var i = 0; i < 10; i++) {
        item = builds[currentUnitIndex].bestBuild[i];
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
            var typeCombinationWithoutSecondHand = typeCombination.slice();
            typeCombinationWithoutSecondHand[1] = null;
            findBestBuildForCombination(index + 1, build, typeCombinationWithoutSecondHand, dataWithConditionItems, fixedItems);    
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
                    if (canAddMoreOfThisItem(build, item, index, fixedItems)) {
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
                tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems);
            }
        }
    }
}

function tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems) {
    build[index] = item;
    if (index == 9) {
        numberOfItemCombination++
        for (var esperIndex in selectedEspers) {
            var value = calculateBuildValue(build, selectedEspers[esperIndex]);
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
        
        if (entry1.value == entry2.value) {
            var defStatsCompare = compareDefense(entry1.item, entry2.item);
            if (defStatsCompare == 0) {
                return getAvailableNumber(entry2.item) - getAvailableNumber(entry1.item);
            } else {
                return defStatsCompare;
            }
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
    for (var itemIndex in tempResult) {
        item = tempResult[itemIndex].item;
        if (isTwoHanded(item) && typeCombination[0] && typeCombination[1]) {
            // Don't keep 2-handed weapon in combination with 2 weapons
            continue;
        }
        var damageCoefLevel = getDamageCoefLevel(item);
        if (!damageCoefLevel || itemKeptKeys.includes(item[itemKey]) || damageCoefLevelAlreadyKept[damageCoefLevel] && damageCoefLevelAlreadyKept[damageCoefLevel] >= numberNeeded) {
            continue;
        } 
        if (!damageCoefLevelAlreadyKept[damageCoefLevel]) {
            damageCoefLevelAlreadyKept[damageCoefLevel] = 0;
        }
        damageCoefLevelAlreadyKept[damageCoefLevel] += getAvailableNumber(item);
        result.push(item);
        itemKeptKeys.push(item[itemKey]);
    }
    
    // Also keep at least the best numberNeeded items with flat stat
    tempResult.sort(function (entry1, entry2) {
        var value1 = 0;
        var value2 = 0;
        if (entry1.item[builds[currentUnitIndex].statToMaximize]) {
            value1 = entry1.item[builds[currentUnitIndex].statToMaximize];
        }
        if (entry2.item[builds[currentUnitIndex].statToMaximize]) {
            value2 = entry2.item[builds[currentUnitIndex].statToMaximize];
        }
        if (value1 == value2) {
            var defStatsCompare = compareDefense(entry1.item, entry2.item);
            if (defStatsCompare == 0) {
                return getAvailableNumber(entry2.item) - getAvailableNumber(entry1.item);
            } else {
                return defStatsCompare;
            }
        } else {
            return value2 - value1;
        }
    });
    
    var number = 0;
    for (var itemIndex in tempResult) {
        item = tempResult[itemIndex].item;
        if (item[builds[currentUnitIndex].statToMaximize]) {
            if (number < numberNeeded) {
                if (!result.includes(item)) {
                    result.push(item);
                }
                number += getAvailableNumber(item);
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

function compareDefense(item1, item2) {
    var hpBaseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats.hp + builds[currentUnitIndex].selectedUnit.stats.pots.hp;
    var defBaseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats.def + builds[currentUnitIndex].selectedUnit.stats.pots.def;
    var sprBaseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats.spr + builds[currentUnitIndex].selectedUnit.stats.pots.spr;

    var valueItem1 = getStatValueIfExists(item1, "hp", hpBaseValue) + getStatValueIfExists(item1, "def", hpBaseValue) + getStatValueIfExists(item1, "spr", hpBaseValue);
    var valueItem2 = getStatValueIfExists(item2, "hp", hpBaseValue) + getStatValueIfExists(item2, "def", hpBaseValue) + getStatValueIfExists(item2, "spr", hpBaseValue);
    return valueItem2 - valueItem1;
}

function getStatValueIfExists(item, stat, baseStat) {
    var result = 0;
    if (item[stat]) result += item[stat];
    if (item[stat + "%"]) result += item[stat + "%"] * baseStat;
    return result;
}

function getDamageCoefLevel(item) {
    var damageCoefLevel = null;
    if (item[builds[currentUnitIndex].statToMaximize] || item[builds[currentUnitIndex].statToMaximize + '%']) {
        damageCoefLevel = "neutral";
    }
    if (builds[currentUnitIndex].statToMaximize == "atk" || builds[currentUnitIndex].statToMaximize == "mag") {
        var killerCoef = getKillerCoef(item);
        if (killerCoef > 0) {
            damageCoefLevel += "killer" + killerCoef;
        }
        if (weaponList.includes(item.type) && useWeaponsElements) {
            // only for weapons
            if ((item.element && ennemyResist[item.element] != 0)) {
                var weaponElementDamageCoef = getWeaponElementDamageCoef(item.element);
                if (weaponElementDamageCoef != 0) {
                    damageCoefLevel += "element" + weaponElementDamageCoef;
                }
            }
            if (damageCoefLevel == "neutral" && (!item.element || builds[currentUnitIndex].innateElements.includes(item.element))) {
                damageCoefLevel = "elementless";
            }
        }
    }
    if (desirableElements.length > 0 && item.element) {
        for (var index in item.element) {
            if (desirableElements.includes(item.element[index])) {
                damageCoefLevel += "desirableElement" + item.element[index];
            }
        }
    }
    if (item.singleWielding || item.singleWieldingOneHanded) {
        damageCoefLevel = "doubleHand";
    }
    return damageCoefLevel;
}

function getWeaponElementDamageCoef(weaponElements) {
    var value = 0;
    for (var elementIndex in weaponElements) {
        value += ennemyResist[weaponElements[elementIndex]];
    }
    return value / weaponElements.length;
}

function logAddConditionItems(data) {
    var string = "";
    for (var index in data) {
        string += data[index].name + ", ";
    }
    console.log(string);
}

function canAddMoreOfThisItem(build, item, currentIndex, fixedItems) {
    var number = 0;
    var isAdventurer = adventurerIds.includes(item.id);
    for (var index = 0; index < currentIndex; index++) {
        if (build[index] && build[index].name == item.name) {
            if (!isStackable(item)) {
                return false;
            }
            number++;
        }
        // Manage Adventurers not stackable 
        if (build[index] && isAdventurer && adventurerIds.includes(build[index].id)) {
            return false;
        }
    }
    for (var index = currentIndex + 1; index < 10; index++) {
        if (fixedItems[index] && fixedItems[index].name == item.name) {
            if (!isStackable(item)) {
                return false;
            }
            number++;
        }
        // Manage Adventurers not stackable 
        if (fixedItems[index] && isAdventurer && adventurerIds.includes(fixedItems[index].id)) {
            return false;
        }
    }
    return getAvailableNumber(item) > number;
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

function hasInnateDualWield() {
    var selectedUnit = builds[currentUnitIndex].selectedUnit;
    for (var index in selectedUnit.skills) {
        if (selectedUnit.skills[index].special && selectedUnit.skills[index].special.includes("dualWield")) {
            return true;
        }
    }
    for (var index in builds[currentUnitIndex].fixedItems) {
        if (builds[currentUnitIndex].fixedItems[index] && builds[currentUnitIndex].fixedItems[index].special && builds[currentUnitIndex].fixedItems[index].special.includes("dualWield")) {
            return true;
        }
    }
    return false;
}

function getInnatePartialDualWield() {
    for (var index in builds[currentUnitIndex].selectedUnit.skills) {
        if (builds[currentUnitIndex].selectedUnit.skills[index].partialDualWield) {
            return builds[currentUnitIndex].selectedUnit.skills[index].partialDualWield;
        }
    }
    for (var index in builds[currentUnitIndex].fixedItems) {
        if (builds[currentUnitIndex].fixedItems[index] && builds[currentUnitIndex].fixedItems[index].partialDualWield) {
            return builds[currentUnitIndex].fixedItems[index].partialDualWield;
        }
    }
    return null;
}

function getAvailableNumber(item) {
    var number = 0;
    if (onlyUseOwnedItems) {
        if (itemInventory[item[itemKey]]) {
            number = getOwnedNumber(item).available;
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
        if (item.access.includes("trial")) {
            number = 1;
        } else {
            number = 4;    
        }
        

    }
    if (!isStackable(item)) {
        number = Math.min(number,1);
    }
    return number;
}

function getOwnedNumber(item) {
    var totalNumber = 0;
    var availableNumber = 0;
    if (itemInventory[item[itemKey]]) {
        totalNumber = itemInventory[item[itemKey]];
        if (alreadyUsedItems[item[itemKey]]) {
            availableNumber = Math.max(0, totalNumber - alreadyUsedItems[item[itemKey]]);
        } else{
            availableNumber = totalNumber;
        }
    }
    return {"total":totalNumber,"available":availableNumber};
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
    var baseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats[builds[currentUnitIndex].statToMaximize] + builds[currentUnitIndex].selectedUnit.stats.pots[builds[currentUnitIndex].statToMaximize];
    var calculatedValue = 0;
    if (item[builds[currentUnitIndex].statToMaximize]) {
        calculatedValue += item[builds[currentUnitIndex].statToMaximize];
    }
    if (item[builds[currentUnitIndex].statToMaximize + '%']) {
        calculatedValue += item[builds[currentUnitIndex].statToMaximize+'%'] * baseValue / 100;
    }
    return calculatedValue;
}

function calculateBuildValue(equiped, esper) {
    if ("atk" == builds[currentUnitIndex].statToMaximize || "mag" == builds[currentUnitIndex].statToMaximize) {
        var calculatedValue = calculateStatValue(equiped, esper, builds[currentUnitIndex].statToMaximize);
        
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
        var elements = builds[currentUnitIndex].innateElements.slice();
        if (useWeaponsElements) {
            if (equiped[0] && equiped[0].element) {
                for (var elementIndex in equiped[0].element) {
                    if (!elements.includes(equiped[0].element[elementIndex])) {
                        elements.push(equiped[0].element[elementIndex]);       
                    }
                }
            };
            if (equiped[1] && equiped[1].element) {
                for (var elementIndex in equiped[1].element) {
                    if (!elements.includes(equiped[1].element[elementIndex])) {
                        elements.push(equiped[1].element[elementIndex]);       
                    }
                }
            };
        }
        var resistModifier = 0;
        
        if (elements.length > 0) {
            for (var element in ennemyResist) {
                if (elements.includes(element)) {
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
        
        if ("atk" == builds[currentUnitIndex].statToMaximize) {
            var total = (calculatedValue.right * calculatedValue.right + calculatedValue.left * calculatedValue.left) * (1 - resistModifier) * killerMultiplicator;
            return {"total":total, "stat":calculatedValue.total, "bonusPercent":calculatedValue.bonusPercent};
        } else {
            var dualWieldCoef = 1;
            if (attackTwiceWithDualWield && equiped[0] && equiped[1] && weaponList.includes(equiped[0].type) && weaponList.includes(equiped[1].type)) {
                dualWieldCoef = 2;
            }
            var total = (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * dualWieldCoef;
            return {"total":total, "stat":calculatedValue.total, "bonusPercent":calculatedValue.bonusPercent};
        }
    } else if ("def" == builds[currentUnitIndex].statToMaximize || "spr" == builds[currentUnitIndex].statToMaximize || "hp" == builds[currentUnitIndex].statToMaximize) {
        return calculateStatValue(equiped, esper, builds[currentUnitIndex].statToMaximize);
    }
}

function getEquipmentStatBonus(equiped, stat) {
    if (equiped[0] && !equiped[1] && weaponList.includes(equiped[0].type)) {
        var bonus = 1;
        var twoHanded = isTwoHanded(equiped[0]);
        var itemAndPassives = equiped.concat(builds[currentUnitIndex].selectedUnit.skills);
        for (var index in itemAndPassives) {
            var item = itemAndPassives[index];
            if (item) {
                if (item.singleWielding && item.singleWielding[stat]) {
                    bonus += item.singleWielding[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHanded && item.singleWieldingOneHanded[stat]) {
                    bonus += item.singleWieldingOneHanded[stat] / 100;
                }
            }
        }
        return bonus;
    } else {
        return 1;
    }
}

function calculateStatValue(equiped, esper, stat) {
    var equipmentStatBonus = getEquipmentStatBonus(equiped, stat);
    var calculatedValue = 0   
    var currentPercentIncrease = {"value":0};
    var baseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats[stat] + builds[currentUnitIndex].selectedUnit.stats.pots[stat];
    var calculatedValue = baseValue;
    var itemAndPassives = equiped.concat(builds[currentUnitIndex].selectedUnit.skills);

    for (var equipedIndex = 0; equipedIndex < itemAndPassives.length; equipedIndex++) {
        if (equipedIndex < 2 && "atk" == stat) {
            calculatedValue += calculatePercentStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease, equipmentStatBonus, stat);    
        } else {
            calculatedValue += calculateStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease, equipmentStatBonus, stat);    
        }
    }
    if (esper != null) {
        calculatedValue += esper[stat] / 100;
    }
    
    if ("atk" == stat) {
        var result = {"right":0,"left":0,"total":0,"bonusPercent":currentPercentIncrease.value}; 
        var right = calculateFlatStateValueForIndex(equiped, itemAndPassives, 0, equipmentStatBonus, stat);
        var left = calculateFlatStateValueForIndex(equiped, itemAndPassives, 1, equipmentStatBonus, stat);
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

function calculateStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease, equipmentStatBonus, stat) {
    var value = 0;
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][stat]) {
            value += itemAndPassives[equipedIndex][stat] * equipmentStatBonus;
        }
        if (itemAndPassives[equipedIndex][stat + '%']) {
            percent = itemAndPassives[equipedIndex][stat+'%'];
            percentTakenIntoAccount = Math.min(percent, Math.max(300 - currentPercentIncrease.value, 0));
            currentPercentIncrease.value += percent;
            value += percentTakenIntoAccount * baseValue / 100;
        }
    }
    return value;
}

function calculateFlatStateValueForIndex(equiped, itemAndPassives, equipedIndex, equipmentStatBonus, stat) {
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][stat]) {
            return itemAndPassives[equipedIndex][stat] * equipmentStatBonus;
        }
    }
    return 0;
}

function calculatePercentStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue, currentPercentIncrease, stat) {
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][stat + '%']) {
            percent = itemAndPassives[equipedIndex][stat+'%'];
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
            if (elementList.includes(item.equipedConditions[conditionIndex])) {
                var neededElement = item.equipedConditions[conditionIndex];
                if ((equiped[0] && equiped[0].element && equiped[0].element.includes(neededElement)) || (equiped[1] && equiped[1].element && equiped[1].element.includes(neededElement))) {
                    found ++;
                }
            } else {
                for (var equipedIndex in equiped) {
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

function logCurrentBuild() {
    logBuild(builds[currentUnitIndex].bestBuild, builds[currentUnitIndex].bestValue, builds[currentUnitIndex].bestEsper);
}

function logBuild(build, value, esper) {
    if (build.length == 0) {
        $("#resultStats").addClass("hidden");
        $("#buildResult .tbody").html("");
        $(".buildLinks").addClass("hidden");
        var progress = "0%";
        var progressElement = $("#buildProgressBar .progressBar");
        progressElement.width(progress);
        progressElement.text(progress);
        progressElement.addClass("finished");
    } else {
        
        var html = "";
        for (var index in build) {
            var item = build[index];
            if (item) {
                html += getItemLine(item, index);
            }
        }
        if (esper) {
            var esperItem = getEsperItem(esper);
            html += getItemLine(esperItem);
        }

        $("#buildResult .tbody").html(html);
        
        $("#resultStats > div").removeClass("statToMaximize");
        
        var hash = getBuildHash();
        $(".imageLink").prop("href","http://ffbeben.ch/" + hash + ".png");
        $(".calculatorLink").prop("href","http://ffbeben.ch/" + hash);
        $(".buildLinks").removeClass("hidden");
        
        $("#fixedItemsTitle").addClass("hidden");
        $("#resultStats").removeClass("hidden");
        for (var statIndex in baseStats) {
            var result = calculateStatValue(build, esper, baseStats[statIndex]);
            $("#resultStats ." + baseStats[statIndex] + " .value").html(Math.floor(result.total));
            var bonusPercent;
            if (result.bonusPercent > 300) {
                bonusPercent = "<span style='color:red;' title='Only 300% taken into account'>" + result.bonusPercent + "%</span>";
            } else {
                bonusPercent = result.bonusPercent + "%";
            }
            $("#resultStats ." + baseStats[statIndex] + " .bonus").html(bonusPercent);
        }
        $("#resultStats ." + builds[currentUnitIndex].statToMaximize).addClass("statToMaximize");
        if (builds[currentUnitIndex].statToMaximize == "atk") {
            $("#resultStats .damage .defensiveStat").html("DEF");
            $("#resultStats .damage .damageCoef").html("1x");
            $("#resultStats .damage .damageResult").html(Math.floor(value.total/100));
            $("#resultStats .damage").removeClass("hidden");
        } else if (builds[currentUnitIndex].statToMaximize == "mag") {
            $("#resultStats .damage .defensiveStat").html("SPR");
            $("#resultStats .damage .damageCoef").html("1x");
            $("#resultStats .damage .damageResult").html(Math.floor(value.total/100));
            $("#resultStats .damage").removeClass("hidden");
        } else {
            $("#resultStats .damage").addClass("hidden");
        }
        /*if (builds[currentUnitIndex].statToMaximize == "atk" || builds[currentUnitIndex].statToMaximize == "mag") {
            $("#resultStats").html("<div>" + builds[currentUnitIndex].statToMaximize + " = " + Math.floor(value.stat) + '</div><div>damage (on 100 def) = ' + Math.floor(value.total) + "</div><div>+" + builds[currentUnitIndex].statToMaximize + "% : " + bonusPercent + "</div>");
        } else if (builds[currentUnitIndex].statToMaximize == "def" || builds[currentUnitIndex].statToMaximize == "spr" || builds[currentUnitIndex].statToMaximize == "hp") {
            $("#resultStats").html("<div>" + builds[currentUnitIndex].statToMaximize + " = " + Math.floor(value.total) + "</div><div>+" + builds[currentUnitIndex].statToMaximize + "% : " + bonusPercent + "</div>");
        }*/
    }
}

function displayFixedItems(fixedItems) {
    $("#resultStats").addClass("hidden");
    $(".buildLinks").addClass("hidden");
    var progress = "0%";
    var progressElement = $("#buildProgressBar .progressBar");
    progressElement.width(progress);
    progressElement.text(progress);
    progressElement.addClass("finished");
    
    var html = "";
    var found = false;
    for (var index in fixedItems) {
        var item = fixedItems[index];
        if (item) {
            found = true;
            html += getItemLine(item, index);
        }
    }
    
    $("#buildResult .tbody").html(html);
    
    if (found) {
        $("#fixedItemsTitle").removeClass("hidden");
    } else {
        $("#fixedItemsTitle").addClass("hidden");
    }
}

function getItemLine(item, index) {
    var html = "";
    html += '<div class="tr">';
    if (index && builds[currentUnitIndex].fixedItems[index]) {
        html += '<div class="td fixed" onclick="removeFixedItemAt(\'' + index +'\')"><img class="" src="img/pin.png"></img></div>'
    } else {
        html += '<div class="td"></div>'
    }
    html += displayItemLine(item);
    html += "</div>";
    return html;
}

function getEsperItem(esper) {
    var item = {};
    item.name = esper.name;
    item.type = "esper";
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
    $("#unitsSelect").change(onUnitChange);
}

function onUnitChange() {
    $( "#unitsSelect option:selected" ).each(function() {
        var unitName = $(this).val();
        var selectedUnitData = units[unitName];
        if (selectedUnitData) {
            $("#unitTabs .tab_" + currentUnitIndex + " a").html(unitName);
            reinitBuild(currentUnitIndex);

            builds[currentUnitIndex].selectedUnit = selectedUnitData;
            builds[currentUnitIndex].selectedUnitName = unitName;
            updateUnitStats();
            logCurrentBuild();
        } else {
            builds[currentUnitIndex].selectedUnit = null;
            reinitBuild(currentUnitIndex); 
            updateUnitStats();
            logCurrentBuild();
            $("#unitTabs .tab_" + currentUnitIndex + " a").html("Select unit");
        }
        displayUnitRarity(selectedUnitData);
    });
}

function updateUnitStats() {
    $(baseStats).each(function (index, stat) {
        if (builds[currentUnitIndex].selectedUnit) {
            $("#baseStat_" + stat).val(builds[currentUnitIndex].selectedUnit.stats.maxStats[stat] + builds[currentUnitIndex].selectedUnit.stats.pots[stat]);
        } else {
            $("#baseStat_" + stat).val("");
        }
    });
}

function reinitBuild(buildIndex) {
    builds[buildIndex] = {};
    builds[buildIndex].bestBuild = [];
    builds[buildIndex].bestValue = null;
    builds[buildIndex].fixedItems = [null, null, null, null, null, null, null, null,null,null];
    builds[buildIndex].bestEsper = null;
    builds[currentUnitIndex].innateElements = [];
}

function loadBuild(buildIndex) {
    currentUnitIndex = buildIndex;
    var build = builds[buildIndex];
    
    $("#unitsSelect option").prop("selected", false);
    if (build.selectedUnitName) {
        $('#unitsSelect option[value="' + build.selectedUnitName + '"]').prop("selected", true);
    }
    $(".unitAttackElement div.elements label").removeClass("active");
    if (build.innateElements) {
        for (var i in build.innateElements) {
            $(".unitAttackElement div.elements label:has(input[value=" + build.innateElements[i] + "])").addClass("active");
        }
    }
    
    $(".goal option").prop("selected", false);
    if (build.statToMaximize) {
        $('.goal option[value="' + build.statToMaximize + '"]').prop("selected", true);
    }
    $(".magicalSkillType option").prop("selected", false);
    if (build.statToMaximize == "mag") {
        if (build.mecanismType == "atk") {
            $('.magicalSkillType option[value="physicalMagic"]').prop("selected", true);
        } else {
            $('.magicalSkillType option[value="normal"]').prop("selected", true);
        }
    }
    onGoalChange();

    updateUnitStats();
    if ((build.bestBuild == null || build.bestBuild.length == 0)) {
        var foundFixedItem = false;
        for (var index in build.fixedItems) {
            if (build.fixedItems[index]) {
                foundFixedItem = true;
                break;
            }
        }
        if (foundFixedItem) {
            displayFixedItems(build.fixedItems);
        }
    } else {
        logCurrentBuild();    
    }
}

function addNewUnit() {
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + (builds.length - 1)).after("<li class='active tab_" + builds.length + "'><a href='#' onclick='selectUnitTab(" + builds.length + ")'>Select unit</a></li>");
    builds.push({});
    reinitBuild(builds.length - 1);
    loadBuild(builds.length - 1);
    if (builds.length > 9) {
        $("#addNewUnitButton").addClass("hidden");
    }
}

function selectUnitTab(index) {
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + index).addClass("active");
    loadBuild(index);
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
    if (!dataLoadedFromHash) {
        $(".equipments select").val("owned");
        onEquipmentsChange();
    }
    
    var data = readStateHashData();
    
    if (data && data.equipmentToUse == "owned") {
        loadStateHashAndBuild(data);    
    }
}

function notLoaded() {
    var data = readStateHashData();
    
    if (data && data.equipmentToUse == "owned") {
        alert("The link you opened require you to be logged in the be able to be displayed. Please log in");
    }
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
     
function updateSearchResult() {
    var searchText = $("#searchText").val();
    if ((searchText == null || searchText == "") && searchType.length == 0 && searchStat == "") {
        $("#fixItemModal .results .tbody").html("");    
        return;
    }
    var types = searchType;
    if (searchType.length == 0) {
        types = builds[currentUnitIndex].selectedUnit.equip.concat(["accessory", "materia"]);
    }
    var baseStat = builds[currentUnitIndex].selectedUnit.stats.maxStats[searchStat] + builds[currentUnitIndex].selectedUnit.stats.pots[searchStat];
    accessToRemove = [];
    displaySearchResults(sort(filter(false, searchStat, baseStat, searchText, builds[currentUnitIndex].selectedUnitName, types)));
    
    if (searchStat == "") {
        $("#fixItemModal .results").addClass("notSorted");
    } else {
        $("#fixItemModal .results .thead .sort").text(searchStat.toUpperCase());    
        $("#fixItemModal .results").removeClass("notSorted");
    }
    
    $("#fixItemModal .results .tbody").unmark({
        done: function() {
            if (searchText && searchText.length != 0) {
                searchText.split(" ").forEach(function (token) {
                    $("#fixItemModal .results .tbody").mark(token);
                });
            }
        }
    });
}

function displayFixItemModal() {
    if (!builds[currentUnitIndex].selectedUnit) {
        alert("Please select an unit");
        return;
    }
    calculateAlreadyUsedItems();
    $("#searchText").val("");
    $("#fixItemModal .results .tbody").html("");
    populateItemType(builds[currentUnitIndex].selectedUnit.equip.concat(["accessory", "materia"]));
    $("#fixItemModal").modal();
    selectSearchStat(null);
    selectSearchType(null);
    updateSearchResult();
}

function fixItem(key) {
    var item = findBestItemVersion(builds[currentUnitIndex].fixedItems, key);
    
    if (item) {
        prepareEquipable();
        var slot = getFixedItemItemSlot(item, equipable, builds[currentUnitIndex].fixedItems);
        if (slot == -1) {
            if (weaponList.includes(item.type) && builds[currentUnitIndex].fixedItems[0] && !builds[currentUnitIndex].fixedItems[1]) {
                // for weapon, if the second weapon were refused, check if an innat partial DW allow it
                var innatePartialDualWield = getInnatePartialDualWield();
                if (innatePartialDualWield && innatePartialDualWield.includes(item.type)) {
                    slot = 1;
                } else {
                    alert("No more slot available for this item. Select another item or remove fixed item of the same type.");
                    return;
                }
            } else {
                alert("No more slot available for this item. Select another item or remove a pinned item of the same type.");
                return;
            }
        }
        builds[currentUnitIndex].fixedItems[slot] = item;
        for (var index in builds[currentUnitIndex].fixedItems) {
            var item = builds[currentUnitIndex].fixedItems[index];
            if (item && index != slot) {
                builds[currentUnitIndex].fixedItems[index] = findBestItemVersion(builds[currentUnitIndex].fixedItems, item[itemKey]);
            }
        }
        displayFixedItems(builds[currentUnitIndex].fixedItems);
        builds[currentUnitIndex].bestBuild = [];
        builds[currentUnitIndex].bestValue = null;
        builds[currentUnitIndex].bestEsper = null;
    }
    $('#fixItemModal').modal('hide');
}

function findBestItemVersion(build, key) {
    var itemVersions = [];
    var found = false;
    for (var index in data) {
        if (data[index][itemKey] == key) {
            itemVersions.push(data[index]);
            found = true;
        }
        if (found && data[index][itemKey] != key) {
            break;
        }
    }
    if (itemVersions.length == 1) {
        return itemVersions[0];
    } else {
        itemVersions.sort(function (item1, item2) {
            var conditionNumber1 = 0; 
            var conditionNumber2 = 0;
            if (item1.equipedConditions) {
                conditionNumber1 = item1.equipedConditions.length;
            }
            if (item2.equipedConditions) {
                conditionNumber2 = item2.equipedConditions.length;
            }
            return conditionNumber2 - conditionNumber1;
        });
        for (var index in itemVersions) {
            if (build[0] && build[3] && build[0].type == "greatSword" && build[3].type == "heavyArmor") {
                console.log("LOL");
            }
            if (areConditionOK(itemVersions[index], build)) {
                return itemVersions[index];
            }
        }
        var item = itemVersions[0];
        return {"id":item.id, "name":item.name, "jpname":item.jpname, "icon":item.icon, "type":item.type,"access":["Conditions not met"]};
    }
}

function removeFixedItemAt(index) {
    builds[currentUnitIndex].fixedItems[index] = null;
    for (var index in builds[currentUnitIndex].fixedItems) {
        var item = builds[currentUnitIndex].fixedItems[index];
        if (item) {
            builds[currentUnitIndex].fixedItems[index] = findBestItemVersion(builds[currentUnitIndex].fixedItems, item[itemKey]);
        }
    }
    displayFixedItems(builds[currentUnitIndex].fixedItems);
    builds[currentUnitIndex].bestBuild = [];
    builds[currentUnitIndex].bestValue = null;
    builds[currentUnitIndex].bestEsper = null;
}

function selectSearchType(type) {
    if (!type || searchType.includes(type)) {
        searchType = [];
        $("#fixItemModal .modal-header .type .dropdown-toggle").prop("src","img/unknownType.png");
    } else {
        searchType = [type];
        $("#fixItemModal .modal-header .type .dropdown-toggle").prop("src","img/" + type + ".png");
    }
    updateSearchResult();
}

function selectSearchStat(stat) {
    if (!stat || searchStat == stat) {
        searchStat = "";
        $("#fixItemModal .modal-header .stat .dropdown-toggle").prop("src","img/sort-a-z.png");
    } else {
        searchStat = stat;
        $("#fixItemModal .modal-header .stat .dropdown-toggle").prop("src","img/sort-" + stat + ".png");
    }
    updateSearchResult();
}

var displaySearchResults = function(items) {
    if (itemInventory) {
        $("#fixItemModal").removeClass("notLoggedIn");
    } else {
        $("#fixItemModal").addClass("notLoggedIn");
    }
    var html = "";
    for (var index in items) {
        var item = items[index];
        if (item) {
            html += '<div class="tr selectable" onclick="fixItem(\'' + item[itemKey] + '\')">';
            html += displayItemLine(item);
            if (itemInventory) {
                var notEnoughClass = "";
                var numbers = getOwnedNumber(item);
                var owned = "";
                if (numbers.total > 0) {
                    owned += numbers.available;
                    if (numbers.available != numbers.total) {
                        owned += "/" + numbers.total;   
                        if (numbers.available == 0) {
                            notEnoughClass = " notEnough ";
                        }
                    }
                }
                html+= "<div class='td inventory text-center'><span class='badge" + notEnoughClass + "'>" + owned + "</span></div>";
            } else {
                html+= "<div class='td inventory'/>"
            }
            html += "</div>";
        }
    }
    
    $("#fixItemModal .results .tbody").html(html);
}

function getStateHash() {
    var data = {
        "goal": $(".goal select").val(),
        "innateElements":getSelectedValuesFor("elements")
    };

    if (data.goal == "mag") {
        data.attackType = $(".magicalSkillType select").val();
    }
    if (data.goal == "atk" || data.goal == "mag") {
        data.ennemyRaces = getSelectedValuesFor("races");
        readEnnemyResists();
        data.ennemyResists = ennemyResist;
    }
    
    if (builds[currentUnitIndex].selectedUnit) {
        data.unitName = builds[currentUnitIndex].selectedUnitName;
    }
    
    
    data.equipmentToUse = $(".equipments select").val();
    if (data.equipmentToUse == "all") {
        data.exludeEventEquipment = $("#exludeEvent").prop('checked');
        data.excludeTMR5 = $("#excludeTMR5").prop('checked');
        data.excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
    }
    
    for (var index in builds[currentUnitIndex].fixedItems) {
        var item = builds[currentUnitIndex].fixedItems[index];
        if (item) {
            if (!data.fixedItems) data.fixedItems = [];
            data.fixedItems.push(item[itemKey]);
        }
    }
    
    return data;
}

function readStateHashData() {
    if (window.location.hash.length > 1) {
        return JSON.parse(atob(window.location.hash.substr(1)));
    } else {
        return null;
    }
}
    
function loadStateHashAndBuild(data) {
    
    if (data.equipmentToUse == "owned" && !itemInventory) {
        return;
    }
    
    reinitBuild(0);
    $('.goal select option').prop("selected", false);
    $('.goal select option[value="' + data.goal + '"]').prop("selected", true);
    onGoalChange();
    if (data.unitName) {
        $('#unitsSelect option[value="' + data.unitName + '"]').prop("selected", true);
        onUnitChange();
    }
    select("elements", data.innateElements);
    if (data.goal == "mag") {
        $('.magicalSkillType select option[value="' + data.attackType + '"]').prop("selected", true);
    }
    if (data.goal == "atk" || data.goal == "mag") {
        select("races", data.ennemyRaces);
        for (var element in data.ennemyResists) {
            if (data.ennemyResists[element] == 0) {
                $("#elementalResists ." + element + " input").val("");
            } else {
                $("#elementalResists ." + element + " input").val(data.ennemyResists[element]);
            }
        }
    }
    $('.equipments select option[value="' + data.equipmentToUse + '"]').prop("selected", true);
    if (data.equipmentToUse == "all") {
        $("#exludeEvent").prop('checked', data.exludeEventEquipment);
        $("#excludeTMR5").prop('checked', data.excludeTMR5);
        $("#excludeNotReleasedYet").prop('checked', data.excludeNotReleasedYet);
    }
    if (data.fixedItems) {
        for (var index in data.fixedItems) {
            fixItem(data.fixedItems[index]);
        }
    }
    dataLoadedFromHash = true;
    build();
    window.location.hash = "";
}

function showBuildLink() {
    var data = getStateHash();
    data.fixedItems = [];
    // first fix dual wield items
    for (var index in builds[currentUnitIndex].bestBuild) {
        var item = builds[currentUnitIndex].bestBuild[index];
        if (item && hasDualWieldOrPartialDualWield(item)) {
            data.fixedItems.push(item[itemKey]);
        }
    }
    // then others items
    for (var index in builds[currentUnitIndex].bestBuild) {
        var item = builds[currentUnitIndex].bestBuild[index];
        if (item && !hasDualWieldOrPartialDualWield(item)) {
            data.fixedItems.push(item[itemKey]);
        }
    }
    data.equipmentToUse = "all";
    $('<div id="showLinkDialog" title="Build Link">' + 
        '<input value="http://ffbeEquip.lyrgard.fr/builder.html#' + btoa(JSON.stringify(data)) + '"></input>' +
        '<h4>This link will open the builder with this exact build displayed</h4>' +
      '</div>' ).dialog({
        modal: true,
        open: function(event, ui) {
            $(this).parent().css('position', 'fixed');
            $("#showLinkDialog input").select();
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    $("#showLinkDialog input").after("<div>Link copied to clipboard<div>");
                } else {
                    console.log('Oops, unable to copy');    
                }
            } catch (err) {
                console.log('Oops, unable to copy');
            }
        },
        position: { my: 'top', at: 'top+150' },
        width: 600
    });
}
      
function showBuilderSetupLink() {
    var data = getStateHash();
    $('<div id="showBuilderSetupLinkDialog" title="Builder setup Link">' + 
        '<input value="http://ffbeEquip.lyrgard.fr/builder.html#' + btoa(JSON.stringify(data)) + '"></input>' +
        '<h4>The following information are stored in this link :</h4>' +
        '<ul><li>The goal of the current unit</li><li>The currently selected unit, if any, and related information</li><li>Information about the monster (race and elemental resist)</li><li>The choice of equipments to use</li><li>The items that has been pinned in the build</li></ul>' +
        '<h4>Upon opening the link, those information will be restored, and if possible a build will be launched.</h4>' +
      '</div>' ).dialog({
        modal: true,
        open: function(event, ui) {
            $(this).parent().css('position', 'fixed');
            $("#showBuilderSetupLinkDialog input").select();
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    $("#showBuilderSetupLinkDialog input").after("<div>Link copied to clipboard<div>");
                } else {
                    console.log('Oops, unable to copy');    
                }
            } catch (err) {
                console.log('Oops, unable to copy');
            }
        },
        position: { my: 'top', at: 'top+150' },
        width: 600
    });
}

$(function() {
    $.get(server + "/data.json", function(result) {
        data = result;
        prepareSearch(data);
        readHash();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/unitsWithSkill.json", function(result) {
        units = result;
        populateUnitSelect();
        readHash();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/espers.json", function(result) {
        espers = result;
        readHash();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    $(".goal select").change(onGoalChange);
    onGoalChange();
    
    $(".equipments select").change(onEquipmentsChange);
    
    $("#buildButton").click(build);
    
    builds[currentUnitIndex] = {};
    
    // Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"]);
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
    
    populateItemStat();
    
    // Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateSearchResult));
    $('#fixItemModal').on('shown.bs.modal', function () {
        $('#searchText').focus();
    })  
});

var counter = 0;
function readHash() {
    counter++;
    if (counter == 3) {
        var data = readStateHashData();
        if (data) {
            loadStateHashAndBuild(data);
        }
    }
}

function populateItemType(equip) {
    var target = $("#fixItemModal .type .dropdown-menu");
    target.html("");
	for (var key in equip) {
        target.append('<img src="img/' + equip[key] + '.png" onclick="selectSearchType(\'' + equip[key] + '\');" class="btn btn-default"/>');
	}
}

function populateItemStat() {
    var statList = ["hp", "mp", "atk", "def", "mag", "spr", "evade", "inflict", "resist"];
    var target = $("#fixItemModal .stat .dropdown-menu");
	for (var key in statList) {
        target.append('<img src="img/sort-' + statList[key] + '.png" onclick="selectSearchStat(\'' + statList[key] + '\');" class="btn btn-default"/>');
	}
}