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
var onlyUseOwnedItems = true;
var selectedUnit;

var equipable;

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":-50,"dark":0};
var ennemyRaces;
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
    bestValue = 0;
    bestBuild = null;
    
    if (!itemInventory) {
        alert("Please log in to load your inventory");
        return;
    }
    if (Object.keys(itemInventory).length == 0) {
        alert("Your inventory is empty. Please go to the Search tab to fill your inventory");
        return;
    }
    
    var selectedUnitName = $("#unitsSelect").val();
    if (!selectedUnitName) {
        alert("Please select an unit");
        return;
    }
    selectedUnit = units[selectedUnitName];
    
    readEnnemyResists();
    ennemyRaces = getSelectedValuesFor("races");
    innateElements = getSelectedValuesFor("elements");
    
    prepareData(selectedUnit.equip);
    prepareEquipable();
    selectEspers();
    optimize();
}

function prepareEquipable() {
    equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"]];
    for (var equipIndex in selectedUnit.equip) {
        if (weaponList.includes(selectedUnit.equip[equipIndex])) {
            equipable[0].push(selectedUnit.equip[equipIndex]);
        } else if (shieldList.includes(selectedUnit.equip[equipIndex])) {
            equipable[1].push(selectedUnit.equip[equipIndex]);
            if (hasInnateDualWield()) {
                equipable[1] = equipable[1].concat(equipable[0]);
            }
        } else if (headList.includes(selectedUnit.equip[equipIndex])) {
            equipable[2].push(selectedUnit.equip[equipIndex]);
        } else if (bodyList.includes(selectedUnit.equip[equipIndex])) {
            equipable[3].push(selectedUnit.equip[equipIndex]);
        } 
    }
}

function prepareData(equipable) {
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
                if (item.dualWield) {
                    dualWieldSources.push(item);
                }
                if (!tempData[item.type]) {
                    tempData[item.type] = {};
                }
                var subType = "";
                if (item.element) {
                    if (ennemyResist[item.element] <= 0) {
                        subType += "element" + ennemyResist[item.element];
                    } else if (!innateElements.includes(item.element)) {
                        continue;
                    }
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
    $("#buildProgressBar .progress").removeClass("finished");
    var combinations = [];
    typeCombination = [null, null, null, null, null, null, null, null, null, null];
    buildTypeCombination(0,typeCombination, combinations);
    
    
    if (!hasInnateDualWield() && dualWieldSources.length > 0) {
        equipable[1] = equipable[1].concat(equipable[0]);
        for (var index in dualWieldSources) {
            var item = dualWieldSources[index];
            if (item.dualWield == "all") {
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
    }
    console.log(combinations.length);
    
    
    findBestBuildForCombinationAsync(0, combinations);
}

function buildTypeCombination(index, typeCombination, combinations) {
    if (fixedItems[index]) {
        tryType(index, typeCombination, fixedItems[index].type, combinations);
    } else {
        for (var typeIndex in equipable[index]) {
            type = equipable[index][typeIndex]
            if (index == 1 && alreadyTriedInSlot0(type, typeCombination[0], equipable[0])) {
                continue;
            }
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
    var progressElement = $("#buildProgressBar .progress");
    progressElement.width(progress);
    progressElement.text(progress);
    if (index + 1 < combinations.length) {
        setTimeout(findBestBuildForCombinationAsync,0,index+1,combinations);
    } else {
        logBuild(bestBuild, bestEsper);
        progressElement.addClass("finished");
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
                logBuild(bestBuild, bestEsper);
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
        var value1 = calculateMaxValue(item1);
        var value2 = calculateMaxValue(item2);
        if (value1 == value2) {
            return getOwnedNumber(item2) - getOwnedNumber(item1);
        } else {
            return value2 - value1;
        }
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
    var damageCoefLevelAlreadyKept = {};
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
            var damageCoefLevel = getDamageCoefLevel(item);
            if (damageCoefLevelAlreadyKept[damageCoefLevel]) {
                damageCoefLevelAlreadyKept[damageCoefLevel] = 0;
            }
            damageCoefLevelAlreadyKept[damageCoefLevel] += damageCoefLevel;
            itemIndex++;
        } else {
            var damageCoefLevel = getDamageCoefLevel(item);
            if (damageCoefLevel == "" || (damageCoefLevelAlreadyKept[damageCoefLevel] && damageCoefLevelAlreadyKept[damageCoefLevel] >= numberNeeded)) {
                result.splice(itemIndex, 1);
            } else {
                if (damageCoefLevelAlreadyKept[damageCoefLevel]) {
                    damageCoefLevelAlreadyKept[damageCoefLevel] = 0;
                }
                damageCoefLevelAlreadyKept[damageCoefLevel] += damageCoefLevel;
                itemIndex++;
            }
        }
    }
    return result;
}

function getDamageCoefLevel(item) {
    var damageCoefLevel = "";
    var killerCoef = getKillerCoef(item);
    if (killerCoef > 0) {
        damageCoefLevel += "killer" + killerCoef;
    }
    if ((item.element && ennemyResist[item.element] < 0)) {
        damageCoefLevel += "element" + ennemyResist[item.element];
    }
    if (damageCoefLevel == "" && weaponList.includes(item.type) && (!item.element || innateElements.includes(item.element))) {
        damageCoefLevel = "elementless";
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
        if (selectedUnit.skills[index].dualWield && selectedUnit.skills[index].dualWield == "all") {
            return true;
        }
    }
    return false;
}

function getOwnedNumber(item) {
    if (onlyUseOwnedItems) {
        if (itemInventory[item.name]) {
            return itemInventory[item.name];
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

function calculateValue(equiped, esper) {
    if ("atk" == statToMaximize) {
        var calculatedValues = calculateStatValue(equiped, esper);
        
        var cumulatedKiller = 0;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        if (esper != null) {
            itemAndPassives.push(esper);
        }
        for (var equipedIndex in itemAndPassives) {
            if (itemAndPassives[equipedIndex] && (areConditionOK(itemAndPassives[equipedIndex], equiped))) {
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
        var result = (calculatedValues.right * calculatedValues.right + calculatedValues.left * calculatedValues.left) * (1 - resistModifier) * killerMultiplicator;
        
        /*if (equiped[0].name == "Crimson Saber") {
            console.log(resistModifier);
        }*/
        return result;
    }
}

function calculateStatValue(equiped, esper) {
    
    if ("atk" == statToMaximize) {
        var result = {"right":0,"left":0,"total":0}; 
        var calculatedValue = 0   
        var baseValue = selectedUnit.stats.maxStats[statToMaximize] + selectedUnit.stats.pots[statToMaximize];
        var calculatedValue = baseValue;
        var itemAndPassives = equiped.concat(selectedUnit.skills);
        var cumulatedKiller = 0;
        
        for (var equipedIndex = 2; equipedIndex < itemAndPassives.length; equipedIndex++) {
            calculatedValue += calculateStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue);
        }
        if (esper != null) {
            calculatedValue += esper[statToMaximize] / 100;
        }
        var right = calculateStateValueForIndex(equiped, itemAndPassives, 0, baseValue);
        var left = calculateStateValueForIndex(equiped, itemAndPassives, 1, baseValue);
        result.right = calculatedValue + right;
        result.left = calculatedValue + left;
        result.total = calculatedValue + right + left;
        return result;   
    }
}

function calculateStateValueForIndex(equiped, itemAndPassives, equipedIndex, baseValue) {
    var value = 0;
    if (itemAndPassives[equipedIndex] && (equipedIndex < 10 || areConditionOK(itemAndPassives[equipedIndex], equiped))) {
        if (itemAndPassives[equipedIndex][statToMaximize]) {
            value += itemAndPassives[equipedIndex][statToMaximize];
        }
        if (itemAndPassives[equipedIndex][statToMaximize + '%']) {
            value += itemAndPassives[equipedIndex][statToMaximize+'%'] * baseValue / 100;
        }
    }
    return value;
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

function logBuild(build, esper) {
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
    $("#results .tbody").html(html);
    $("#resultStats").html(statToMaximize + " = " + Math.floor(calculateStatValue(build, esper).total) + ' , damage (on 100 def) = ' + Math.floor(calculateValue(build, esper) / 100) + ". esper : " + esper.name);
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
            var selectedUnitData = units[$(this).val()];
            if (selectedUnitData) {
                selectedUnit = selectedUnitData;
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val(selectedUnitData.stats.maxStats[stat] + selectedUnitData.stats.pots[stat]);
		      	});
            } else {
                selectedUnit = '';
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val("");
		      	});
            }
            displayUnitRarity(selectedUnitData);
        });
    });
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
   
}
            
$(function() {
    $.get("data.json", function(result) {
        rawData = result;
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get("unitsWithSkill.json", function(result) {
        units = result;
        populateUnitSelect();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get("espers.json", function(result) {
        espers = result;
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    $("#buildButton").click(build);
    
    // Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"]);
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
});
