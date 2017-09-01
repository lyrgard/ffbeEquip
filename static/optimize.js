inventory = {"byType":{}};

function optimize() {
    
}

function optimizeWithNewItem(currentBestBuild, inventory, newItem, newItemQuantity) {
    if (newItem.killers || newItem.element) {
        // manage killers and elements
    } else {
        if (isBestItemForType(newItem, inventory)) {
            
        }
    }
    addToInventory(newItem, inventory);
}

function isBestItemForType(newItem, inventory) {
    return getIndexInList(newItem, inventory.byType[newItem.type]) == 0;
}

function addToInventory(newItem, inventory) {
    var maxValue = calculateMaxValue(newItem);
    if (!inventory.byType[newItem.type]) {
        inventory.byType[newItem.type] = [{"maxValue":maxValue,"item":newItem}];
    } else {
        var listByType = inventory.byType[newItem.type];
        var index = getIndexInList(newItem, listByType);
        listByType.splice(index, 0, {"maxValue":maxValue,"item":newItem});
    }
}

function getIndexInList(newItem, listByType) {
    for (var index in listByType) {
        if (listByType[index].maxValue < maxValue) {
            return index;
        }
    }
    return listByType.length;
}