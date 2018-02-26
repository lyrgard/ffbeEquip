class ItemTreeComparator {
    
    static sort(itemsOfType, numberNeeded, unitBuild, ennemyStats, desirableElements, typeCombination = null) {
        var result = [];
        var keptItemsRoot = {"parent":null,"children":[],"root":true,"available":0};
        if (itemsOfType.length > 0) {
            for (var index = itemsOfType.length; index--;) {
                var entry = itemsOfType[index];

                if (typeCombination && isTwoHanded(entry.item) && (typeCombination[1] || unitBuild.fixedItems[0] || unitBuild.fixedItems[1])) {
                    continue; // ignore 2 handed weapon if we are in a DW build, or a weapon was already fixed
                }
                if (unitBuild && unitBuild.fixedItemsIds.includes(entry.item.id) && entry.available < 1) {
                    continue;
                }

                var newTreeItem = {"parent":null,"children":[],"equivalents":[entry], "currentEquivalentIndex":0};
                //console.log("Considering " + entry.item.name);
                TreeComparator.insertItemIntoTree(keptItemsRoot, newTreeItem, unitBuild.involvedStats, ennemyStats, desirableElements, 10, ItemTreeComparator.getComparison, ItemTreeComparator.getDepth);
                //logTree(keptItemsRoot);
            }
        }
        
        ItemTreeComparator.moveToRootItemsWithExcludingSkillsNotUnderMaxDepth(keptItemsRoot, numberNeeded, ItemTreeComparator.getDepthWithoutNotStackableSkillsItems);
        
        TreeComparator.cutUnderMaxDepth(keptItemsRoot, numberNeeded, ItemTreeComparator.getDepth, 0);
        return keptItemsRoot;
    }
    
    static getComparison(treeNode1, treeNode2, stats, ennemyStats, desirableElements) {
        if (treeNode1.root) {
            return "strictlyWorse"; 
        }
        var comparisionStatus = [];
        for (var index = stats.length; index--;) {
            if (stats[index] == "physicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "physical", ennemyStats.races));
            } else if (stats[index] == "magicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "magical", ennemyStats.races));
            } else if (stats[index] == "weaponElement") {
                comparisionStatus.push(TreeComparator.compareByElementCoef(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item));
            } else if (stats[index] == "meanDamageVariance" || stats[index] == "evade.physical" || stats[index] == "evade.magical" || stats[index] == "mpRefresh") {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, stats[index]));
            } else if (stats[index] == "lbPerTurn") {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "lbFillRate"));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "lbPerTurn.min"));
            } else {
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "total_" + stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "singleWielding." + stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, "singleWieldingOneHanded." + stats[index]));
            }
        }
        if (desirableElements && desirableElements.length != 0) {
            comparisionStatus.push(TreeComparator.compareByEquipedElementCondition(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item, desirableElements));
        }
        comparisionStatus.push(TreeComparator.compareByNumberOfHandsNeeded(treeNode1.equivalents[0].item, treeNode2.equivalents[0].item));

        return TreeComparator.combineComparison(comparisionStatus);
    }
    
    static moveToRootItemsWithExcludingSkillsNotUnderMaxDepth(treeRoot, maxDepth, getDepth, currentTree = treeRoot, currentDepth = 0) {
        var depth = getDepth(currentTree, currentDepth);
        if (depth > maxDepth) {
            return;
        }
        var entryToAddToRoot = [];
        if (!currentTree.root) {
            var index = 0;
            while (index < currentTree.equivalents.length) {
                var entry = currentTree.equivalents[index];
                if (entry.item.notStackableSkills) {
                    entryToAddToRoot.push(entry);
                    currentTree.equivalents.splice(index,1);
                } else {
                    index++;
                }
            }
        }
        if (!currentTree.root && currentTree.equivalents.length == 0) {
            for (var index = currentTree.children.length; index--;) {
                currentTree.parent.children.push(currentTree.children[index]);
                currentTree.children[index].parent = currentTree.parent;
                ItemTreeComparator.moveToRootItemsWithExcludingSkillsNotUnderMaxDepth(treeRoot, maxDepth, getDepth, currentTree.children[index], currentDepth);
            }
            currentTree.children = [];
            currentTree.parent.children.splice(currentTree.parent.children.indexOf(currentTree), 1);
        } else {
            for (var index = currentTree.children.length; index--;) {
                ItemTreeComparator.moveToRootItemsWithExcludingSkillsNotUnderMaxDepth(treeRoot, maxDepth, getDepth, currentTree.children[index], depth);
            }
        }
        
        for (var index = entryToAddToRoot.length; index--;) {
            treeRoot.children.push({"parent":treeRoot,"children":[],"equivalents":[entryToAddToRoot[index]], "currentEquivalentIndex":0});
        }
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
    
    static getDepthWithoutNotStackableSkillsItems(treeItem, currentDepth) {
        var result = currentDepth;
        if (treeItem.root) {
            return 0;
        }
        for (var index = treeItem.equivalents.length; index--;) {
            if (!treeItem.equivalents[index].item.notStackableSkills) {
                result += treeItem.equivalents[index].available;
            }
        }
        return result;
    }
}