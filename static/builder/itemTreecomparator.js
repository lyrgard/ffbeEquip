class ItemTreeComparator {
    
    static sort(itemsOfType, numberNeeded, typeCombination = null, unitBuild = null) {
        var result = [];
        var keptItemsRoot = {"parent":null,"children":[],"root":true,"available":0};
        if (itemsOfType.length > 0) {
            for (var index = itemsOfType.length; index--;) {
                var entry = itemsOfType[index];

                if (typeCombination && isTwoHanded(entry.item) && (typeCombination[1] || unitBuild.fixedItems[0] || unitBuild.fixedItems[1])) {
                    continue; // ignore 2 handed weapon if we are in a DW build, or a weapon was already fixed
                }
                if (unitBuild && unitBuild.fixedItemsIds.includes(entry.item[itemKey]) && getAvailableNumber(entry.item) < 1) {
                    continue;
                }

                var newTreeItem = {"parent":null,"children":[],"equivalents":[entry], "currentEquivalentIndex":0};
                //console.log("Considering " + entry.item.name);
                TreeComparator.insertItemIntoTree(keptItemsRoot, newTreeItem, numberNeeded, ItemTreeComparator.getComparison, ItemTreeComparator.getDepth);
                //logTree(keptItemsRoot);
            }
        }
        TreeComparator.cutUnderMaxDepth(keptItemsRoot, numberNeeded, ItemTreeComparator.getDepth, 0);
        return keptItemsRoot;
    }
    
    static getComparison(treeNode1, treeNode2) {
        if (treeNode1.root) {
            return "strictlyWorse"; 
        }
        var comparisionStatus = [];
        var stats = builds[currentUnitIndex].involvedStats;
        for (var index = stats.length; index--;) {
            if (stats[index] == "physicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "physical"));
            } else if (stats[index] == "magicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "magical"));
            } else if (stats[index] == "weaponElement") {
                comparisionStatus.push(TreeComparator.compareByElementCoef(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item));
            } else if (stats[index] == "meanDamageVariance" || stats[index] == "evade.physical" || stats[index] == "evade.magical" || stats[index] == "mpRefresh") {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, stats[index]));
            } else {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "total_" + stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "singleWielding." + stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "singleWieldingOneHanded." + stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "singleWieldingGL." + stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "singleWieldingOneHandedGL." + stats[index]));
            }
        }
        if (desirableElements.length != 0) {
            comparisionStatus.push(TreeComparator.compareByEquipedElementCondition(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item));
        }
        comparisionStatus.push(TreeComparator.compareByNumberOfHandsNeeded(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item));

        return TreeComparator.combineComparison(comparisionStatus);
    }
    
    static getDepth(treeItem, currentDepth) {
        var result = currentDepth;
        if (treeItem.root) {
            return 0;
        }
        for (var index = treeItem.equivalents.length; index--;) {
            result += treeItem.equivalents[index].available;
        }
        return result;
    }
}