inventory = {"byType":{},"byCondition":{}};

function optimize() {
    
}

function optimizeWithNewItem(currentBestBuild, inventory, equipable, newItem, newItemQuantity) {
    var build = currentBestBuild.slice();
    if (canBeBestItemForType(newItem, inventory)) {
        var possibleSlots = getPossibleSlotsFor(newItem, equipable);
        for (var slotIndex in possibleSlots) {
            var slot = possibleSlots[slotIndex];
            // if not stackable, return 1. If stackable, return the min between available number and available slots.
            var equipableQuantity = (isStackable(newItem) ? Math.min(newItemQuantity, possibleSlots.length - slotIndex) : 1);
            for (var itemNumber = 0; itemNumber < equipableQuantity; itemNumber ++) {
                var slot = possibleSlots[slotIndex + itemNumber];
                var oldItem = build[slot];
                build[slot] = newItem;
                /*if (oldItem.type != newItem.type) {
                    // Changing the type of equiped item. Look for items that can now be equiped
                    var itemsToTest = getRelevantItemsToTest(inventory, newItem);
                }*/
            }
        }
    }
    addToInventory(newItem, inventory);
}

function canBeBestItemForType(newItem, inventory) {
    return getInsertionIndexInList(newItem, inventory.byType[newItem.type]) == 0;
}

function addToInventory(newItem, inventory, itemQuantity) {
    var maxValue = calculateMaxValue(newItem);
    var itemEntry = {"maxValue":maxValue,"item":newItem,"quantity":itemQuantity};
    if (!inventory.byType[newItem.type]) {
        inventory.byType[newItem.type] = [itemEntry];
    } else {
        var listByType = inventory.byType[newItem.type];
        var index = getInsertionIndexInList(newItem, listByType);
        listByType.splice(index, 0, itemEntry);
    }
    if (newItem.equipedConditions) {
        var conditions = getEquipedConditionString(newItem.equipedConditions);
        if (!inventory.byCondition[conditions]) {
            inventory.byCondition[conditions] = [itemEntry];
        } else {
            var index = getInsertionIndexInList(newItem, inventory.byCondition[conditions]);
            byCondition[conditions].splice(index, 0, itemEntry);
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
    for (var index in listByType) {
        if (listByType[index].maxValue < maxValue) {
            return index;
        }
    }
    return listByType.length;
}

function getPossibleSlotsFor(item, equipable) {
    var result = [];
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