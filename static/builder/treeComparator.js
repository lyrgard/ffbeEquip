class TreeComparator {

    static createNewTreeRoot() {
        return {"parent":null,"children":[],"root":true,"available":0};
    }

    static insertItemIntoTree(treeItem, newTreeItem, involvedStats, ennemyStats, desirableElements, maxDepth, comparisonFunction, depthFunction, includeSingleWielding = true, includeDualWielding = true, currentDepth = 0) {
        var comparison = comparisonFunction(treeItem, newTreeItem, involvedStats, ennemyStats, desirableElements, includeSingleWielding, includeDualWielding);
        switch (comparison) {
            case "strictlyWorse":
                // Entry is strictly worse than treeItem
                if (currentDepth < maxDepth) {
                    var inserted = false
                    for (var index = 0, len = treeItem.children.length; index < len; index++) {
                        inserted = inserted || TreeComparator.insertItemIntoTree(treeItem.children[index], newTreeItem, involvedStats, ennemyStats, desirableElements, maxDepth, comparisonFunction, depthFunction, includeSingleWielding, includeDualWielding, depthFunction(treeItem.children[index], currentDepth));
                    }

                    if (!inserted) {
                        newTreeItem.parent = treeItem;
                        treeItem.children.push(newTreeItem);
                        //console.log("Inserted " + newTreeItem.entry.name + "("+ newTreeItem.hp + " - " + newTreeItem.def +") under " + treeItem.entry.name + "("+ treeItem.hp + " - " + treeItem.def +")");
                    }
                    if (treeItem.children.indexOf(newTreeItem) != -1) {
                        var indexToRemove = [];
                        for (var index = 0, len = treeItem.children.length; index < len; index++) {
                            var oldTreeItem = treeItem.children[index]
                            if (oldTreeItem != newTreeItem && comparisonFunction(oldTreeItem, newTreeItem, involvedStats, ennemyStats, desirableElements, includeSingleWielding, includeDualWielding) == "strictlyBetter") {
                                indexToRemove.push(index);
                                TreeComparator.insertItemIntoTree(newTreeItem, oldTreeItem, involvedStats, ennemyStats, desirableElements, maxDepth, comparisonFunction, depthFunction, includeSingleWielding, includeDualWielding, depthFunction(newTreeItem, currentDepth));
                            }
                        }
                        for (var index = indexToRemove.length - 1; index >= 0; index--) {
                            treeItem.children.splice(indexToRemove[index], 1);
                        }
                    }
                }
                break;
            case "equivalent":
                // entry is equivalent to treeItem
                treeItem.equivalents.push(newTreeItem.equivalents[0]);

                treeItem.equivalents.sort(function(entry1, entry2) {
                    if (entry1.owned && !entry2.owned) {
                        return -1;
                    } else if (!entry1.owned && entry2.owned) {
                        return 1;
                    } else {
                        if (entry1.defenseValue == entry2.defenseValue) {
                            return entry2.available - entry1.available;    
                        } else {
                            return entry2.defenseValue - entry1.defenseValue;    
                        }
                    }   
                });
                //console.log("Inserted " + newTreeItem.entry.name + "("+ newTreeItem.hp + " - " + newTreeItem.def +") as equivalent of " + treeItem.entry.name + "("+ treeItem.hp + " - " + treeItem.def +")");
                break;
            case "strictlyBetter":
                // entry is strictly better than treeItem
                var parentDepth = currentDepth - depthFunction(treeItem, 0);
                newTreeItem.parent = treeItem.parent;
                var index = treeItem.parent.children.indexOf(treeItem);
                treeItem.parent.children[index] = newTreeItem;
                newTreeItem.children = [treeItem];
                treeItem.parent = newTreeItem;
                TreeComparator.cutUnderMaxDepth(newTreeItem, maxDepth, depthFunction, depthFunction(newTreeItem, parentDepth));
                //console.log("Inserted " + newTreeItem.entry.name + "("+ newTreeItem.hp + " - " + newTreeItem.def +") in place of " + treeItem.entry.name + "("+ treeItem.hp + " - " + treeItem.def +")");
                break;
            case "sameLevel":
                // Should be inserted at the same level.
                return false;
        }
        return true;
    }
    
    static cutUnderMaxDepth(treeItem, maxDepth, depthFunction, currentDepth) {
        if (currentDepth >= maxDepth) {
            treeItem.children = [];
        } else {
            for (var index = treeItem.children.length; index--;) {
                TreeComparator.cutUnderMaxDepth(treeItem.children[index], maxDepth, depthFunction, depthFunction(treeItem.children[index], currentDepth));
            }
        }
    }
    
    static combineComparison(comparisionStatus) {
        var result = "equivalent";
        for (var index = comparisionStatus.length; index--;) {
            if (comparisionStatus[index] == "sameLevel") {
                return "sameLevel";
            }
            switch (result) {
                case "equivalent":
                    result = comparisionStatus[index];
                    break;
                case "strictlyWorse":
                    if (comparisionStatus[index] == "strictlyBetter") {
                        return "sameLevel";
                    }
                    break;
                case "strictlyBetter":
                    if (comparisionStatus[index] == "strictlyWorse") {
                        return "sameLevel";
                    }
                    break;
            }
        }
        return result;
    }

    static compareByValue(item1, item2, valuePath, coef1 = 1, coef2 = 1) {
        var value1 = getValue(item1, valuePath) * coef1;
        var value2 = getValue(item2, valuePath) * coef2;
        if (value1 > value2) {
            return "strictlyWorse"
        } else if (value1 < value2){
            return "strictlyBetter"
        } else {
            return "equivalent";
        }
    }
    
    static compareByNumberOfHandsNeeded(item1, item2) {
        if (isTwoHanded(item1)) {
            if (isTwoHanded(item2)) {
                return "equivalent";
            } else {
                return "sameLevel";
            }    
        } else {
            if (isTwoHanded(item2)) {
                return "sameLevel";
            } else {
                return "equivalent";
            }
        }
    }


    static compareByKillers(item1, item2, applicableKillerType, ennemyRaces) {
        if (ennemyRaces.length) {
            var applicableKillers1 = {};
            if (item1.killers) {
                for (var killerIndex = item1.killers.length; killerIndex--;) {
                    if (ennemyRaces.includes(item1.killers[killerIndex].name) && item1.killers[killerIndex][applicableKillerType]) {
                        applicableKillers1[item1.killers[killerIndex].name] = item1.killers[killerIndex][applicableKillerType];
                    }
                }
            }
            var applicableKillers2 = {};
            if (item2.killers) {
                for (var killerIndex = item2.killers.length; killerIndex--;) {
                    if (ennemyRaces.includes(item2.killers[killerIndex].name) && item2.killers[killerIndex][applicableKillerType]) {
                        applicableKillers2[item2.killers[killerIndex].name] = item2.killers[killerIndex][applicableKillerType];
                    }
                }
            }
            var result = "equivalent";
            for (var index in applicableKillers1) {
                if (!applicableKillers2[index]) {
                    switch(result) {
                        case "equivalent":
                            result = "strictlyWorse";
                        case "strictlyBetter":
                            return "sameLevel";
                    }
                } else {
                    if (applicableKillers1[index] > applicableKillers2[index]) {
                        switch(result) {
                            case "equivalent":
                                result = "strictlyWorse";
                            case "strictlyBetter":
                                return "sameLevel";
                        }
                    } else if (applicableKillers1[index] < applicableKillers2[index]) {
                        switch(result) {
                            case "equivalent":
                                result = "strictlyBetter";
                            case "strictlyWorse":
                                return "sameLevel";
                        }
                    }
                }
            }
            for (var index in applicableKillers2) {
                if (!applicableKillers1[index]) {
                    switch(result) {
                        case "equivalent":
                            result = "strictlyBetter";
                        case "strictlyWorse":
                            return "sameLevel";
                    }
                }
            }
            return result;
        } else {
            return "equivalent";
        }
    }

    static compareByElementCoef(item1, item2) {
        if (item1.elementType == item2.elementType) {
            return "equivalent";
        } else {
            return "sameLevel";
        }
    }

    static compareByEquipedElementCondition(item1, item2, desirableElements) {
        if (desirableElements.length == 0) {
            return "equivalent";
        } else {
            if (item1.element && TreeComparator.matches(desirableElements, item1.element)) {
                if (item2.element && TreeComparator.matches(desirableElements, item2.element)) {
                    var desirableElementsFromItem1 = [];
                    var desirableElementsFromItem2 = [];
                    for (var index = desirableElements.length; index--;) {
                        if(item1.element.includes(desirableElements[index])) {
                            desirableElementsFromItem1.push(desirableElements[index]);
                        }
                        if(item2.element.includes(desirableElements[index])) {
                            desirableElementsFromItem2.push(desirableElements[index]);
                        }
                    }
                    if (TreeComparator.includeAll(desirableElementsFromItem1, desirableElementsFromItem2)) {
                        if (TreeComparator.includeAll(desirableElementsFromItem2, desirableElementsFromItem1)) {
                            return "equivalent";
                        } else {
                            return "strictlyWorse";
                        }
                    } else {
                        if (TreeComparator.includeAll(desirableElementsFromItem2, desirableElementsFromItem1)) {
                            return "strictlyBetter";
                        } else {
                            return "sameLevel";
                        }
                    }
                } else {
                    return "strictlyWorse";
                }    
            } else {
                if (item2.element && TreeComparator.matches(desirableElements, item2.element)) {
                    return "strictlyBetter";
                } else {
                    return "equivalent";
                }
            }
        }

    }
    
    
        // Return true if the two arrays share at least one value
    static matches(array1, array2) {
        var match = false;
        for (var index = array1.length; index --;) {
            if (array2.includes(array1[index])) {
                match = true;
            }
        }
        return match;
    }
    
    static includeAll(array1, array2) {
        for (var index in array2) {
            if (!array1.includes(array2[index])) {
                return false;
            }
        }
        return true;
    }
}