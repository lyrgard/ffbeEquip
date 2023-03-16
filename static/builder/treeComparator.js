class TreeComparator {

    static createNewTreeRoot() {
        return {"parent":null,"children":[],"root":true,"available":0};
    }

    static insertItemIntoTree(treeItem, newTreeItem, involvedStats, enemyStats, desirableElements, desirableItemIds, maxDepth, comparisonFunction, depthFunction, includeSingleWielding = true, includeDualWielding = true, currentDepth = 0) {
        // Use a binary search to find the index where the item should be inserted
        let low = 0;
        let high = treeItem.children.length - 1;
        let index = -1;
        while (low <= high) {
          let mid = Math.floor((low + high) / 2);
          let result = comparisonFunction(treeItem.children[mid]);
          if (result === "strictlyBetter") {
            // The item should be inserted before the mid element
            high = mid - 1;
            index = mid;
          } else if (result === "strictlyWorse") {
            // The item should be inserted after the mid element
            low = mid + 1;
            index = low;
          } else {
            // The item is equal to the mid element
            index = mid;
            break;
          }
        }
        // Insert the item at the found index
        treeItem.children.splice(index, 0, treeItem);
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
    
    static compareByDoublehand(item1, item2, stat) {
        var valueTDH1 = getValue(item1, "singleWielding." + stat);
        var valueTDH2 = getValue(item2, "singleWielding." + stat);
        var valueDH1 = getValue(item1, "singleWieldingOneHanded." + stat);
        var valueDH2 = getValue(item2, "singleWieldingOneHanded." + stat);
        var glex1 = getValue(item1, "singleWieldingOneHanded.glex");
        var glex2 = getValue(item2, "singleWieldingOneHanded.glex");
        
        if (stat == "mag" && glex1 != glex2) {
          return "sameLevel";
        }
        if (valueTDH1 > valueTDH2) {
            if (valueTDH1 >= valueDH2) {
                return "strictlyWorse";
            } else {
                return "sameLevel";
            }
        } else if (valueTDH1 < valueTDH2) {
            if (valueTDH2 >= valueDH1) {
                return "strictlyBetter";
            } else {
                return "sameLevel";
            }
        } else {
            if (valueDH1 > valueDH2) {
                return "strictlyWorse";
            } else if (valueDH1 < valueDH2) {
                return "strictlyBetter";
            } else {
                return "equivalent";
            }
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


    static compareByKillers(item1, item2, applicableKillerType, enemyRaces) {
        if (enemyRaces.length) {
            var applicableKillers1 = {};
            if (item1.killers) {
                for (var killerIndex = item1.killers.length; killerIndex--;) {
                    if (enemyRaces.includes(item1.killers[killerIndex].name) && item1.killers[killerIndex][applicableKillerType]) {
                        applicableKillers1[item1.killers[killerIndex].name] = item1.killers[killerIndex][applicableKillerType];
                    }
                }
            }
            var applicableKillers2 = {};
            if (item2.killers) {
                for (var killerIndex = item2.killers.length; killerIndex--;) {
                    if (enemyRaces.includes(item2.killers[killerIndex].name) && item2.killers[killerIndex][applicableKillerType]) {
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
        if (item1.elementType === "neutral") {
            if (item2.elementType === "neutral") {
                return "equivalent";
            } else {
                if (item2.elementCoef > 0) {
                    return "strictlyBetter";
                } else {
                    return "strictlyWorse";
                }
            }    
        } else {
            if (item2.elementType === "neutral") {
                if (item1.elementCoef > 0) {
                    return "strictlyWorse";
                } else {
                    return "strictlyBetter";
                }
            } else {
                if (item1.elementCoef > item2.elementCoef) {
                    return "strictlyWorse";
                } else if (item1.elementCoef === item2.elementCoef) {
                    return "equivalent";
                } else {
                    return "strictlyBetter";
                }
            }    
        }
    }

    static compareByEquipedElementCondition(item1, item2, desirableElements) {
        if (desirableElements.length == 0) {
            return "equivalent";
        } else {
            let elements1 = item1.element || ["none"];
            let elements2 = item2.element || ["none"];
            if (elements1 && TreeComparator.matches(desirableElements, elements1)) {
                if (elements2 && TreeComparator.matches(desirableElements, elements2)) {
                    var desirableElementsFromItem1 = [];
                    var desirableElementsFromItem2 = [];
                    for (var index = desirableElements.length; index--;) {
                        if(elements1.includes(desirableElements[index])) {
                            desirableElementsFromItem1.push(desirableElements[index]);
                        }
                        if(elements2.includes(desirableElements[index])) {
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
                if (elements2 && TreeComparator.matches(desirableElements, elements2)) {
                    return "strictlyBetter";
                } else {
                    return "equivalent";
                }
            }
        }

    }
    
    static compareByDesirableItemIdsCondition(item1, item2, desirableItemIds) {
        if (desirableItemIds.length == 0) {
            return "equivalent";
        } else {
            if (desirableItemIds.includes(item1.id)) {
                if (desirableItemIds.includes(item2.id)) {
                    return "sameLevel";
                } else {
                    return "strictlyWorse";
                }
            } else {
                if (desirableItemIds.includes(item2.id)) {
                    return "strictlyBetter";
                } else {
                    return "equivalent";
                }
            }
        }
    }
    
    static compareBySkillEnhancement(item1, item2, skillId) {
        
        if (!item1.skillEnhancement && !item2.skillEnhancement) {
            return "equivalent";
        } else {
            let enh1, enhPhysMod1, enhMagMod1 = 0;
            let enh2, enhPhysMod2, enhMagMod2 = 0;

            // Item 1
            if (item1.skillEnhancement && item1.skillEnhancement[skillId]) {
               enh1 = item1.skillEnhancement[skillId];
            }
            if (item1.skillEnhancement && item1.skillEnhancement["allPhysicalAttacks"]) {
                enhPhysMod1 = item1.skillEnhancement["allPhysicalAttacks"]
            }
            if (item1.skillEnhancement && item1.skillEnhancement["allMagicalAttacks"]) {
                enhMagMod1 = item1.skillEnhancement["allMagicalAttacks"]
            }
            
            // Item 2
            if (item2.skillEnhancement && item2.skillEnhancement["allPhysicalAttacks"]) {
                enhPhysMod1 = item2.skillEnhancement["allPhysicalAttacks"]
            }
            if (item2.skillEnhancement && item2.skillEnhancement["allMagicalAttacks"]) {
                enhMagMod1 = item2.skillEnhancement["allMagicalAttacks"]
            }
            if (item2.skillEnhancement && item2.skillEnhancement[skillId]) {
                enh2 = item2.skillEnhancement[skillId];
            }

            if (enh1 < enh2 || enhPhysMod1 < enhPhysMod2 || enhMagMod1 < enhMagMod2) {
                return "strictlyBetter";
            } else if (enh1 > enh2 || enhPhysMod1 > enhPhysMod2 || enhMagMod1 > enhMagMod2) {
                return "strictlyWorse";
            } else {
                return "equivalent";
            }
        }
    }
    
    static compareByAllAilments(item1, item2, ailments) {
        let item1CoversAllAilments = TreeComparator.itemCoversAilmentsNeeds(item1, ailments);
        let item2CoversAllAilments = TreeComparator.itemCoversAilmentsNeeds(item2, ailments);
        if (item1CoversAllAilments) {
            if (item2CoversAllAilments) {
                return "equivalent"
            } else {
                return "strictlyWorse";
            }
        } else {
            if (item2CoversAllAilments) {
                return "strictlyBetter";
            } else {
                return "equivalent"
            }
        }
    }
    
    static itemCoversAilmentsNeeds(item, ailments) {
        if (item.resist) {
            return item.resist.filter(r => ailments[r.name] && (ailments[r.name] <= r.percent)).length == Object.keys(ailments).length;
        } else {
            return false;
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
