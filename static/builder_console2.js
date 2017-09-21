var fs = require("fs");

var typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"];
var weaponList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"];
var shieldList = ["lightShield", "heavyShield"];
var headList = ["hat", "helm"];
var bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];
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
var selectedUnit;

var equipable;

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":-50,"dark":0};
var ennemyRaces = ["human","demon"];
var innateElements = [];

var bestValue = 0;
var bestBuild;
var bestEsper;

var statToMaximize = "atk";

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
    console.log("==============================\n=             START          =\n==============================");
    selectedUnit = units['Veritas of the Dark'];
    bestValue = 0;
    bestBuild = null;
    prepareData(selectedUnit.equip);
    prepareEquipable();
    selectEspers();
    optimize();
    logBuild(bestBuild, bestEsper);
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
}

function prepareData(equipable) {
    var tempData = {};
    for (var index in rawData) {
        var item = rawData[index];
        if (getOwnedNumber(item) > 0 && isApplicable(item) && (equipable.includes(item.type) || item.type == "accessory" || item.type == "materia")) {
            if (item.equipedConditions) {
                dataWithCondition.push(item);
            } else {
                if (item.dualWield) {
                    dualWieldSources.push(item);
                    continue;
                }
                if (!tempData[item.type]) {
                    tempData[item.type] = {};
                }
                var subType = "";
                if (item.element && ennemyResist[item.element] < 0) {
                    subType += "element" + ennemyResist[item.element];
                }
                var killer = getKillerCoef(item); 
                if (killer > 0) {
                    subType += "killer" + killer;
                }
                if (subType == "") {
                    subType = "normal";
                }
                var statValue = calculateMaxValue(item);
                var itemEntry = {"value":statValue, "item":item, "name":item.name};
                if (!tempData[item.type][subType]) {
                    tempData[item.type][subType] = [itemEntry];
                } else {
                    if (statValue > tempData[item.type][subType][0].value) {
                        tempData[item.type][subType] = [itemEntry];
                    } else if (statValue == tempData[item.type][subType][0].value) {
                        tempData[item.type][subType].push(itemEntry);
                    }
                }
            }
        }
    }
    /*for (index in typeList) {
        console.log(typeList[index]);    
        console.log(tempData[typeList[index]]);    
    }*/
    for (var typeIndex in typeList) {
        var type = typeList[typeIndex];
        data[type] = [];
        if (tempData[type]) {
            for (var subTypeIndex in tempData[type]) {
                for (var index in tempData[type][subTypeIndex]) {
                    data[type].push(tempData[type][subTypeIndex][index].item)
                }
            }
        }
    }
    //console.log(data);
}

function selectEspers() {
    selectedEspers = [];
    var maxValueEsper = null;
    for (var index in espers) {
        if (maxValueEsper == null || espers[index][statToMaximize] > maxValueEsper.atk) {
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
            if (ennemyRaces.includes(item.killers[killerIndex].name)) {
                cumulatedKiller += item.killers[killerIndex].percent;
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
    var combinations = [];
    typeCombination = [null, null, null, null, null, null, null, null, null, null];
    buildTypeCombination(0,typeCombination, combinations);
    
    
    if (dualWieldSources.length > 0) {
        equipable[1] = equipable[0];
        for (var index in dualWieldSources) {
            var item = dualWieldSources[index];
            var slot = 0;
            if (item.type == "accessory") {
                slot = 4;
            } else if (item.type == "materia") {
                slot = 6;
            }
            fixedItems[slot] = item;
            buildTypeCombination(0,typeCombination,combinations);
            fixedItems[slot] = null;
        }
    }
    console.log(combinations.length);
    var i = 0;
    
    for (var index in combinations) {
        var build = [null, null, null, null, null, null, null, null, null, null];
        findBestBuildForCombination(0, build, combinations[index].combination, combinations[index].data, combinations[index].fixed);
        i++;
        console.log(Math.floor(i/combinations.length*1000)/10 + "%" );
    }
}

function buildTypeCombination(index, typeCombination, combinations) {
    if (fixedItems[index]) {
        tryType(index, typeCombination, fixedItems[index].type, combinations);
    } else {
        for (var typeIndex in equipable[index]) {
            type = equipable[index][typeIndex]
            if (data[type].length > 0) {
                tryType(index, typeCombination, type, combinations);
            }
        }
    }
}

function tryType(index, typeCombination, type, combinations) {
    typeCombination[index] = type;
    if (index == 9) {
        build = [null, null, null, null, null, null, null, null, null, null];
/*                var startTime = new Date();*/
        numberOfItemCombination = 0;
        var dataWithdConditionItems = {}
        for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
            dataWithdConditionItems[typeCombination[slotIndex]] = addConditionItems(data[typeCombination[slotIndex]], typeCombination[slotIndex], typeCombination);
        }
        combinations.push({"combination":typeCombination.slice(), "data":dataWithdConditionItems, "fixed":fixedItems.slice()});
        //findBestBuildForCombination(0, build, typeCombination, dataWithdConditionItems);
/*                var endTime = new Date();
        stats.push(endTime - startTime);

        console.log(typeCombination);
        console.log(endTime - startTime);
        console.log(numberOfItemCombination);
        logDataWithdConditionItems(dataWithdConditionItems);
        console.log("===============================================================");*/
    } else {
        buildTypeCombination(index+1, typeCombination, combinations);
    }
}

function logDataWithdConditionItems(dataWithdConditionItems) {
    for (var index in dataWithdConditionItems) {
        logAddConditionItems(dataWithdConditionItems[index]);
    }
}

function findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems, fixedItems) {
    if (fixedItems[index]) {
        tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index], fixedItems);
    } else {
        if (index == 1 && isTwoHanded(build[0])) {
            build[index] == null;
            findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems);    
        } else {
            for (var itemIndex in dataWithConditionItems[typeCombination[index]]) {
                var item = dataWithConditionItems[typeCombination[index]][itemIndex];
                if (canAddMoreOfThisItem(build, item, index)) {
                    if (index == 1 && isTwoHanded(item)) {
                        continue;
                    }
                    tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems)
                }
            }
            build[index] == null;
        }
    }
}

function tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems) {
    build[index] = item;
    if (index == 9) {
        numberOfItemCombination++
        for (var esperIndex in selectedEspers) {
            value = calculateValue(build, selectedEspers[esperIndex]);
            if (value > bestValue) {
                bestBuild = build.slice();
                bestValue = value;
                bestEsper = selectedEspers[esperIndex];
            }    
        }
    } else {
        findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems);
    }
}

function addConditionItems(itemsOfType, type, typeCombination) {
    var result = itemsOfType.slice();
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
                result.push(item);
            }
        }
    }
    result.sort(function (item1, item2) {
        return calculateMaxValue(item2) - calculateMaxValue(item1);
    });
    var numberNeeded = 0;
    for (var slotIndex in typeCombination) {
        if (typeCombination[slotIndex] == type) {
            numberNeeded++;
        }
    }
    var number = 0;
    var itemIndex = 0;
    var itemKeptNames = [];
    var damageCoefLevelAlreadyKept = [];
    while(itemIndex < result.length) {
        item = result[itemIndex];
        if (number < numberNeeded) {
            if (!itemKeptNames.includes(item.name)) {
                if (!isStackable(item)) {
                    number += 1;
                } else {
                    number += getOwnedNumber(item);
                }
            }
            itemIndex++;
        } else {
            var damageCoefLevel = "";
            var killerCoef = getKillerCoef(item);
            if (killerCoef > 0) {
                damageCoefLevel += "killer" + killerCoef;
            }
            if ((item.element && ennemyResist[item.element] < 0)) {
                damageCoefLevel += "element" + ennemyResist[item.element];
            }
            
            if (damageCoefLevel == "" || damageCoefLevelAlreadyKept.includes(damageCoefLevel)) {
                result.splice(itemIndex, 1);
            } else {
                damageCoefLevelAlreadyKept.push(damageCoefLevel);
                itemIndex++;
            }
        }
    }
    if (typeCombination[1].name == "katana") { console.log(result);}
    return result;
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

function getOwnedNumber(item) {
    if (onlyUseOwnedItems) {
        if (itemOwned[item.name]) {
            return itemOwned[item.name];
        } else {
            return 0;
        }
    } else {
        return 4;
    }
}


function isApplicable(item) {
    if (item.exclusiveSex && item.exclusiveSex != selectedUnit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnit.name)) {
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
    var baseValue = selectedUnit.stats.maxStats[statToMaximize] + selectedUnit.stats.pots[statToMaximize];
    var calculatedValue = 0;
    if (item[statToMaximize]) {
        calculatedValue += item[statToMaximize];
    }
    if (item[statToMaximize + '%']) {
        calculatedValue += item[statToMaximize+'%'] * baseValue / 100;
    }
    return calculatedValue;
}

function calculateValue(equiped, esper, ignoreCondition = false) {
    var calculatedValue = calculateStatValue(equiped, ignoreCondition);
    if (esper != null) {
        calculatedValue += esper[statToMaximize] / 100;
    }
    if ("atk" == statToMaximize) {
        calculatedValue
        var cumulatedKiller = 0;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        if (esper != null) {
            itemAndPassives.push(esper);
        }
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (ignoreCondition || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
                if (ennemyRaces.length > 0 && itemAndPassives[equipedIndex].killers) {
                    for (var killerIndex in itemAndPassives[equipedIndex].killers) {
                        if (ennemyRaces.includes(itemAndPassives[equipedIndex].killers[killerIndex].name)) {
                            cumulatedKiller += itemAndPassives[equipedIndex].killers[killerIndex].percent;
                        }
                    }
                }
            }
        }
        
        // Element weakness/resistance
        var elements = innateElements.slice();
        if (equiped[0] && equiped[0].element && !elements.includes(equiped[0].element)) {
            elements.push(equiped[0].element);
        };
        if (equiped[1] && equiped[1].element && !elements.includes(equiped[1].element)) {
            elements.push(equiped[1].element);
        };
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
        calculatedValue = calculatedValue * calculatedValue * (1 - resistModifier) * killerMultiplicator;
        
        /*if (equiped[0].name == "Crimson Saber") {
            console.log(resistModifier);
        }*/
    }
    return calculatedValue;
}

function calculateStatValue(equiped, ignoreCondition = false) {
    var calculatedValue = 0;
    if ("atk" == statToMaximize) {
        var baseValue = selectedUnit.stats.maxStats[statToMaximize] + selectedUnit.stats.pots[statToMaximize];
        var calculatedValue = baseValue;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        var cumulatedKiller = 0;
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (ignoreCondition || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
                if (itemAndPassives[equipedIndex][statToMaximize]) {
                    calculatedValue += itemAndPassives[equipedIndex][statToMaximize];
                }
                if (itemAndPassives[equipedIndex][statToMaximize + '%']) {
                    calculatedValue += itemAndPassives[equipedIndex][statToMaximize+'%'] * baseValue / 100;
                }
            }
        }
    }
    return calculatedValue;
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

function isSpecial(item) {
    return item.dualWield || item.allowUseOf;
}

function logBuild(build, esper) {
    if (!build) {
        console.log("null build");
        return;
    }
    var order = [0,1,2,3,4,5,6,7,8,9];
    var html = "";
    for (var index = 0; index < order.length; index++) {
        var item = build[order[index]];
        if (item) {
            html += item.name + ", ";
        }
    }
    if (esper != null) {
        html += esper.name;
    }
    console.log(html);
    console.log("atk = " + Math.floor(calculateStatValue(build)) + ' , damage (on 100 def) = ' + Math.floor(calculateValue(build, esper) / 100));
}
        
fs.readFile('data.json', function(err, content) {
    rawData = JSON.parse(content);
    fs.readFile('unitsWithSkill.json', function(err, content) {
        units = JSON.parse(content);
        fs.readFile('itemOwned.json', function(err, content) {
            itemOwned = JSON.parse(content);
            fs.readFile('espers.json', function(err, content) {
                espers = JSON.parse(content);
                build();
            });
        });
    });
});

    