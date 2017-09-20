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
var units;
var itemOwned;
var selectedUnit;

var equipable;

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":-50,"dark":0};
var ennemyRaces = ["human","demon"];
var innateElements = [];

var bestValue = 0;
var bestBuild;

var stats = [];
var numberOfItemCombination;

var fixedItems = [null, null, null, null, null, null, {"name":"Dual Wield","type":"materia","dualWield":"all","access":["TMR-3*"],"tmrUnit":"Zidane"}, null, null, null]

function build() {
    console.log("==============================\n=             START          =\n==============================");
    selectedUnit = units['Veritas of the Dark'];
    bestValue = 0;
    bestBuild = null;
    prepareEquipable();
    prepareData(selectedUnit.equip);
    optimize();
    logBuild(bestBuild);
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
    var hasDualWield = false;
    for (var index in selectedUnit.skills) {
        if (selectedUnit.skills[index].dualWield == "all") {
            hasDualWield = true;
        }
    }
    for (var index in fixedItems) {
        if (fixedItems[index] && fixedItems[index].dualWield == "all") {
            hasDualWield = true;
        }
    }
    if (hasDualWield) {
        equipable[1] = equipable[1].concat(equipable[0]);
    }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function prepareData(equipable) {
    var tempData = {};
    for (var index in rawData) {
        var item = rawData[index];
        if (itemOwned[item.name] && itemOwned[item.name] > 0 && isApplicable(item) && (equipable.includes(item.type) || item.type == "accessory" || item.type == "materia")) {
            if (item.equipedConditions) {
                dataWithCondition.push(item);
            } else {
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


function order(item1, item2) {
    if (isSpecial(item1)) {
        if (isSpecial(item2)) {
            return 0;
        } else {
            return -1;
        }
    } else {
        if (isSpecial(item2)) {
            return 1;
        } else {
            return calculateValue([item2], 'atk', true) - calculateValue([item1], 'atk', true);    
        }
    }
}

function optimize() {
    typeCombination = [null, null, null, null, null, null, null, null, null, null];
    buildTypeCombination(0,typeCombination);
}

function buildTypeCombination(index, typeCombination) {
    if (fixedItems[index]) {
        tryType(index, typeCombination, fixedItems[index].type);
    } else {
        for (var typeIndex in equipable[index]) {
            type = equipable[index][typeIndex]
            if (data[type].length > 0) {
                tryType(index, typeCombination, type);
            }
        }
    }
}

function tryType(index, typeCombination, type) {
    typeCombination[index] = type;
    if (index == 9) {
        build = [null, null, null, null, null, null, null, null, null, null];
/*                var startTime = new Date();*/
        numberOfItemCombination = 0;
        var dataWithdConditionItems = {}
        for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
            dataWithdConditionItems[typeCombination[slotIndex]] = addConditionItems(data[typeCombination[slotIndex]], typeCombination[slotIndex], typeCombination);
        }
        findBestBuildForCombination(0, build, typeCombination, dataWithdConditionItems);
/*                var endTime = new Date();
        stats.push(endTime - startTime);

        console.log(typeCombination);
        console.log(endTime - startTime);
        console.log(numberOfItemCombination);
        logDataWithdConditionItems(dataWithdConditionItems);
        console.log("===============================================================");*/
    } else {
        buildTypeCombination(index+1, typeCombination);
    }
}

function logDataWithdConditionItems(dataWithdConditionItems) {
    for (var index in dataWithdConditionItems) {
        logAddConditionItems(dataWithdConditionItems[index]);
    }
}

function findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems) {
    if (fixedItems[index]) {
        tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index]);
    } else {
        for (var itemIndex in dataWithConditionItems[typeCombination[index]]) {
            var item = dataWithConditionItems[typeCombination[index]][itemIndex];
            if (canAddMoreOfThisItem(build, item, index)) {
                if (index == 1 && isTwoHanded(item)) {
                    continue;
                }
                tryItem(index, build, typeCombination, dataWithConditionItems, item)
            }
        }
        build[index] == null;
    }
}

function tryItem(index, build, typeCombination, dataWithConditionItems, item) {
    build[index] = item;
    if (index == 9) {
        numberOfItemCombination++
        value = calculateValue(build, 'atk');
        if (value > bestValue) {
            bestBuild = build.slice();
            bestValue = value;
        }
    } else {
        findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems);
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
    while(itemIndex < result.length) {
        item = result[itemIndex];
        if (number < numberNeeded) {
            if (!itemKeptNames.includes(item.name)) {
                if (!isStackable(item)) {
                    number += 1;
                } else {
                    number += itemOwned[item.name];
                }
            }
            itemIndex++;
        } else {
            if ((item.element && ennemyResist[item.element] < 0) || getKillerCoef(item) > 0) {
                itemIndex++; // Keep items with good element or killers
            } else {
                result.splice(itemIndex, 1);
            }
        }
    }
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
    return itemOwned[item.name] > number;
}

function getItemNumber(item) {
    var number = 0;
    if (!isStackable(item) || isTwoHanded(item)) {
        number = 1;
    } else {
        if (item.type == "materia") {
            number = 4;
        } else if (item.type == "accessory" || weaponList.includes(item.type)) {
            number = 2;
        } else {
            number = 1;
        }
    }
    return Math.min(number, itemOwned[item.name]);
}


function optimizeWithNewItem(build, inventory, equipable, newItem, checkConditionItems = true) {
    if (canBeBestItemForType(newItem, inventory)) {
        var possibleSlots = getPossibleSlotsFor(newItem, equipable, build);
        for (var slotIndex in possibleSlots) {
            var slot = possibleSlots[slotIndex];
            var oldItem = build[slot];
            build[slot] = newItem;
            var value = calculateValue(build, 'atk');
            if (value > bestValue) {
                bestValue = value;
                bestBuild = build.slice();
            }
            if (checkConditionItems && dataWithCondition[newItem.type]) {
                for (var conditionItemIndex in dataWithCondition[newItem.type]) {
                    var itemWithCondition = dataWithCondition[newItem.type][conditionItemIndex];
                    var number = getItemNumber(itemWithCondition);
                    for (var i = 0; i < number; i++) {
                        optimizeWithNewItem(build.slice(), inventory, equipable, itemWithCondition, false);
                    }
                }
            }
            build[slot] = oldItem;
            /*if (oldItem.type != newItem.type) {
                // Changing the type of equiped item. Look for items that can now be equiped
                var itemsToTest = getRelevantItemsToTest(inventory, newItem);
            }*/
        }
    }
    if (checkConditionItems) {
        addToInventory(newItem, inventory);
    }
}

function canBeBestItemForType(newItem, inventory) {
    var itemType = newItem.type;
    if (newItem.element) {
        itemType += "_" + newItem.element;
    }
    return hasKillersForEnnemy(newItem) || getInsertionIndexInList(newItem, inventory.byType[itemType]) == 0;
}

function hasKillersForEnnemy(newItem) {
    if (newItem.killers && ennemyRaces.length > 0) {
        for (var index in newItem.killers) {
            if (ennemyRaces.includes(newItem.killers[index].name)) {
                return true;
            }
        }
    }
    return false;
}

function addToInventory(newItem, inventory, itemQuantity) {
    var maxValue = calculateMaxValue(newItem);
    var itemEntry = {"maxValue":maxValue,"item":newItem,"quantity":itemQuantity};
    var itemType = newItem.type;
    if (newItem.element) {
        itemType += "_" + newItem.element;
    }
    if (!inventory.byType[itemType]) {
        inventory.byType[itemType] = [itemEntry];
    } else {
        var listByType = inventory.byType[itemType];
        var index = getInsertionIndexInList(newItem, listByType);
        listByType.splice(index, 0, itemEntry);
    }
    if (newItem.equipedConditions) {
        var conditions = getEquipedConditionString(newItem.equipedConditions);
        if (!inventory.byCondition[conditions]) {
            inventory.byCondition[conditions] = [itemEntry];
        } else {
            var index = getInsertionIndexInList(newItem, inventory.byCondition[conditions]);
            inventory.byCondition[conditions].splice(index, 0, itemEntry);
        }
    }
}

function getEquipedConditionString(itemCondition) {
    var conditions = itemCondition.slice();
    conditions.sort();
    var first = true;
    var result = "";
    for (var conditionIndex in conditions) {
        if (first) {
            first = false;
        } else {
            result += "-";
        }
        result += conditions[conditionIndex];
    }
    return result;
}

function getInsertionIndexInList(newItem, listByType) {
    if (!listByType) {
        return 0;
    }
    var maxValue = calculateMaxValue(newItem);
    for (var index in listByType) {
        if (listByType[index].maxValue <= maxValue) {
            return index;
        }
    }
    return listByType.length;
}

function getPossibleSlotsFor(item, equipable, build) {
    var result = [];
    if (!isStackable(item)) {
        for (var index in build) {
            if (build[index] && build[index].name == item.name) {
                result.push(index);
                return result;
            }
        }
    }
    for (var index in equipable) {
        if (equipable[index].includes(item.type)) {
            result.push(index);
        }
    }
    return result;
}

function getRelevantItemsToTest(inventory, newItem, build) {
    var result = [];
    var itemsByCondition = inventory.byCondition[newItem.type];
    if (itemsByCondition) {
        for (var inventoryIndex in itemsByCondition) {
            result.push(itemsByCondition[inventoryIndex]);
            if (isStackable(itemsByCondition[inventoryIndex].item)) {
                break;
            }        
        }
    }
    for (var index in build) {
        if (build[index] && build[index] != newItem) {
            var conditions = getEquipedConditionString([newItem.type, build[index].type]);
            itemsByCondition = inventory.byCondition[conditions];
            if (itemsByCondition) {
                for (var inventoryIndex in itemsByCondition) {
                    result.push(itemsByCondition[inventoryIndex]);
                    if (isStackable(itemsByCondition[inventoryIndex].item)) {
                        break;
                    }        
                }
            }       
        }
    }
}

function isStackable(item) {
    return !(item.special && item.special.includes("notStackable"));
}

function isTwoHanded(item) {
    return (item.special && item.special.includes("twoHanded"));
}

function isOwned(item) {
    if (itemInventory) {
        return itemInventory[item.name];
    } else {
        return true;
    }
}

function findBestEquipableIndex(equiped, item, lockedEquipableIndex) {
    var bestEquipableIndex;
    var bestValue = 0;
    for (var equipableIndex in equipable) {
        if (!lockedEquipableIndex.includes(equipableIndex) && equipable[equipableIndex].includes(item.type) && isApplicable(item, equiped, 0)) {
            var oldItem = equiped[equipableIndex]
            equiped[equipableIndex] = null;
            value = calculateValue(equiped, 'atk');
            if (value > bestValue) {
                bestEquipableIndex = equipableIndex;
                bestValue = value;
            }
            equiped[equipableIndex] = oldItem;
        }
    }
    return bestEquipableIndex;
}


function isApplicable(item) {
    if (item.exclusiveSex && item.exclusiveSex != selectedUnit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnit.name)) {
        return false;
    }
    /*if (item.special && item.special.includes("notStackable")) {
        for (var equipedIndex in equiped) {
            if (equiped[equipedIndex] && equiped[equipedIndex].name == item.name) {
                return false;
            }
        }
    }*/
    /*if (item.equipedConditions) {
        var found = 0;
        conditionLoop: for (var conditionIndex in item.equipedConditions) {
            for (var index = 0; index < currentIndex; index++) {
                if (equiped[index].type == item.equipedConditions[conditionIndex]) {
                    found ++;
                    continue conditionLoop;
                }
            }
            for (var index = currentIndex; index < equipable.length; index++) {
                if (equipable[index].includes(item.equipedConditions[conditionIndex])) {
                    found ++;
                    break;
                }
            }
        }
        if (found != item.equipedConditions.length) {
            return false;
        }
    }*/
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
    var stat = 'atk';
    var baseValue = selectedUnit.stats.maxStats[stat] + selectedUnit.stats.pots[stat];
    var calculatedValue = 0;
    if (item[stat]) {
        calculatedValue += item[stat];
    }
    if (item[stat + '%']) {
        calculatedValue += item[stat+'%'] * baseValue / 100;
    }
    return calculatedValue;
}

function calculateValue(equiped, stat, ignoreCondition = false) {
    var calculatedValue = calculateStatValue(equiped, stat, ignoreCondition);
    if (stat = 'atk') {
        calculatedValue
        var cumulatedKiller = 0;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
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

function calculateStatValue(equiped, stat, ignoreCondition = false) {
    var calculatedValue = 0;
    if (stat = 'atk') {
        var baseValue = selectedUnit.stats.maxStats[stat] + selectedUnit.stats.pots[stat];
        var calculatedValue = baseValue;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        var cumulatedKiller = 0;
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (ignoreCondition || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
                if (itemAndPassives[equipedIndex][stat]) {
                    calculatedValue += itemAndPassives[equipedIndex][stat];
                }
                if (itemAndPassives[equipedIndex][stat + '%']) {
                    calculatedValue += itemAndPassives[equipedIndex][stat+'%'] * baseValue / 100;
                }
                if (ennemyRaces.length > 0 && itemAndPassives[equipedIndex].killers) {
                    for (var killerIndex in itemAndPassives[equipedIndex].killers) {
                        if (ennemyRaces.includes(itemAndPassives[equipedIndex].killers[killerIndex].name)) {
                            cumulatedKiller += itemAndPassives[equipedIndex].killers[killerIndex].percent;
                        }
                    }
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

function logBuild(build) {
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
    console.log(html);
    console.log("atk = " + Math.floor(calculateStatValue(build, 'atk')) + ' , damage (on 100 def) = ' + Math.floor(calculateValue(build, 'atk') / 100));
}
        
fs.readFile('data.json', function(err, content) {
    rawData = JSON.parse(content);
    fs.readFile('unitsWithSkill.json', function(err, content) {
        units = JSON.parse(content);
        fs.readFile('itemOwned.json', function(err, content) {
            itemOwned = JSON.parse(content);
            build();
        });
    });
});

    