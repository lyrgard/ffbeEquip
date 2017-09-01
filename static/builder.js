var typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"];
var weaponList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"];
var shieldList = ["lightShield", "heavyShield"];
var headList = ["hat", "helm"];
var bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];

var data;
var units;
var selectedUnit;

var equipable;

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":0,"dark":-50};
var ennemyRaces;
var innateElements = [];

var equiped = [null, null, null, null, null, null, null, null, null, null];

var bestValue = 0;
var bestBuild;


function build() {
    if (!selectedUnit) {
        alert("Please select an unit");
        return;
    }
    bestValue = 0;
    bestBuild = null;
    equiped = [null, null, null, null, null, null, null, null, null, null];
    prepareEquipable();
    ennemyRaces = getSelectedValuesFor("races");
    readEnnemyResists();
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
    optimize2([]);
    for (var dataIndex in data) {
        var item = data[dataIndex];
        if (item.dualWield && item.dualWield == "all" && isOwned(item)) {
            for (var equipableIndex in equipable) {
                if (equipable[equipableIndex].includes(item.type)) {
                    //console.log("try " + item.name + " at slot " + equipableIndex);
                    var oldBestValue = bestValue;
                    var oldBestBuild = bestBuild;
                    var oldItem = equiped[equipableIndex];
                    var oldEquipableHand2 = equipable[1];
                    bestValue = 0;
                    equipable[1] = equipable[0];
                    equiped[equipableIndex] = item;
                    optimize2([equipableIndex]);
                    equiped[equipableIndex] = oldItem;
                    equipable[1] = oldEquipableHand2;
                    if (bestValue < oldBestValue) {
                        bestValue = oldBestValue;
                        bestBuild = oldBestBuild;
                    }
                    break;
                }
            }
        }
    }
    //optimize2([]);
}

function optimize2(lockedEquipableIndex, recursive = true) {
    var oldEquiped = equiped.slice();
    for (var dataIndex in data) {
        var item = data[dataIndex];
        if (!isSpecial(item) && !item.equipedConditions && isOwned(item)) {
            if (!isStackable(item)) {
                for (var equipableIndex in equipable) {
                    if (!lockedEquipableIndex.includes(equipableIndex) && equipable[equipableIndex].includes(item.type) && isApplicable(item, equiped, 0)) {
                        var oldItem = equiped[equipableIndex];
                        equiped[equipableIndex] = item;
                        var value = calculateValue(equiped, 'atk');
                        if (value > bestValue) {
                            bestValue = value;
                            bestBuild = equiped.slice();
                            if (someEquipmentNoMoreApplicable(bestBuild)) {
                                optimize2([]);
                            }
                            //console.log("replaced " + (oldItem ? oldItem.name : "empty") + " by " + item.name);
                        }
                        equiped[equipableIndex] = oldItem;
                    }
                }
                equiped = bestBuild;
            } else {
                for (var equipableIndex in equipable) {
                    if (!lockedEquipableIndex.includes(equipableIndex) && equipable[equipableIndex].includes(item.type) && isApplicable(item, equiped, 0)) {
                        var oldItem = equiped[equipableIndex];
                        equiped[equipableIndex] = item;
                        var value = calculateValue(equiped, 'atk');
                        if (value > bestValue) {
                            bestValue = value;
                            bestBuild = equiped.slice();
                            if (someEquipmentNoMoreApplicable(bestBuild)) {
                                optimize2([]);
                            }
                            //console.log("replaced " + (oldItem ? oldItem.name : "empty") + " by " + item.name);
                        } else {
                            equiped[equipableIndex] = oldItem;
                        }
                    }
                }    
            }
        }
    }
    equiped = bestBuild;
    if (recursive) {
        for (var dataIndex in data) {  
            var item = data[dataIndex];
            if (item.equipedConditions && isOwned(item)) {
                if (!isStackable(item)) {
                    var equipableIndex = findBestEquipableIndex(equiped, item, lockedEquipableIndex);
                    
                    if (equipableIndex) {
                        var oldBestValue = bestValue;
                        var oldBestBuild = bestBuild;
                        var oldItem = equiped[equipableIndex];
                        bestValue = 0;
                        equiped[equipableIndex] = item;
                        var newLock = lockedEquipableIndex.slice();
                        newLock.push(equipableIndex)
                        optimize2(newLock, false);
                        equiped = bestBuild;
                        if (bestValue < oldBestValue) {
                            equiped[equipableIndex] = oldItem;
                            bestValue = oldBestValue;
                            bestBuild = oldBestBuild;
                            console.log("replaced " + (oldItem ? oldItem.name : "empty") + " by " + item.name);
                        }
                    }
                }
            }
        }   
    }
    
    equiped = oldEquiped;
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

var currentIndex = 0;


function isApplicable(item, equiped, currentIndex) {
    if (item.exclusiveSex && item.exclusiveSex != selectedUnit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnit.name)) {
        return false;
    }
    if (item.special && item.special.includes("notStackable")) {
        for (var equipedIndex in equiped) {
            if (equiped[equipedIndex] && equiped[equipedIndex].name == item.name) {
                return false;
            }
        }
    }
    if (item.equipedConditions) {
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

function isStackable(item) {
    return !(item.special && item.special.includes("notStackable"));
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
                    resistModifier += ennemyResist[element];
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
    $("#resultStats").html("atk = " + Math.floor(calculateStatValue(build, 'atk')) + ' , damage (on 100 def) = ' + Math.floor(calculateValue(build, 'atk') / 100));
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
        data = result;
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get("unitsWithSkill.json", function(result) {
        units = result;
        populateUnitSelect();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
});