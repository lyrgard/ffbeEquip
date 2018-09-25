class ItemPool {
    constructor(maxDepth) {
        this.maxDepth = maxDepth;
        this.involvedStats = ["def", "hp"];
        this.keptItems = [];
        this.groupByIds = {};
        this.groupByItemIds = {};
        this.currentId = 0;
        this.workingArray = [];
        this.currentTopLevelItems = [];
    }
    
    addItems(entries) {
        for (var i = entries.length; i--;) {
            this.addItem(entries[i]);
        }
    }
    
    addItem(entry) {
        entry.betterItems = 0;
        var betterGroups = [];
        var betterItemCount = 0;
        for (var i = this.keptItems.length; i--;) {
            var comparison = ItemPool.getComparison(this.keptItems[i].equivalents[0], entry, this.involvedStats, {"races":[]}, null, null, true, true);
            switch (comparison) {
                case "strictlyWorse":
                    betterItemCount += this.keptItems[i].available;
                    betterGroups.push(this.keptItems[i].id);
                    break;
                case "equivalent":
                    this.keptItems[i].equivalents.push(entry);
                    this.keptItems[i].available += entry.available;
                    return;
                case "strictlyBetter":
                    this.keptItems[i].betterItems += entry.available;
                    if (this.keptItems[i].betterItems >= this.maxDepth) {
                        this.keptItems.splice(i, 1);
                    }
                    break;
                case "sameLevel":
                    break;
            }
        }
        if (betterItemCount < this.maxDepth) {
            currentId++;
            var newGroup = {"id":currentId, "equivalents":[entry], "available": entry.available, "betterItems":betterItemCount, "betterGroups":betterGroups};
            this.keptItems.push(newGroup);
            groupByIds[currentId] = newGroup;
            groupByItemIds[entry.item.id] = currentId;
        }
    }
    
    prepareForIteration() {
        this.workingArray = Array(this.keptItems.length + 1).fill(null);
        for (var i = this.keptItems.length; i--;) {
            if (this.keptItems[i].equivalents.length > 1) {
                this.keptItems[i].equivalents.sort(ItemPool.equivalentSort);
            }
            if (this.keptItems[i].betterGroups.length == 0) {
                this.workingArray.push(this.keptItems[i].equivalents[0]);
            }
        }
    }
    
    
    
    static getComparison(entry1, entry2, stats, ennemyStats, desirableElements, desirableItemIds, includeSingleWielding, includeDualWielding) {
        var comparisionStatus = [];
        for (var index = stats.length; index--;) {
            if (stats[index] == "physicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(entry1.item, entry2.item, "physical", ennemyStats.races));
            } else if (stats[index] == "magicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(entry1.item, entry2.item, "magical", ennemyStats.races));
            } else if (stats[index] == "weaponElement") {
                comparisionStatus.push(TreeComparator.compareByElementCoef(entry1.item, entry2.item));
            } else if (stats[index] == "meanDamageVariance" || stats[index] == "evade.physical" || stats[index] == "evade.magical" || stats[index] == "mpRefresh") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, stats[index]));
            } else if (stats[index] == "lbPerTurn") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "lbFillRate"));
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "lbPerTurn.min"));
            } else if (stats[index] == "lbDamage") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "lbDamage"));
            } else {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, stats[index]));
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "total_" + stats[index]));
                if (includeSingleWielding) {
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "singleWielding." + stats[index]));
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "singleWieldingOneHanded." + stats[index]));
                }
                if (includeDualWielding) {
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "dualWielding." + stats[index]));
                }
            }
        }
        if (desirableElements && desirableElements.length != 0) {
            comparisionStatus.push(TreeComparator.compareByEquipedElementCondition(entry1.item, entry2.item, desirableElements));
        }
        if (desirableItemIds && desirableItemIds.length != 0) {
            comparisionStatus.push(TreeComparator.compareByDesirableItemIdsCondition(entry1.item, entry2.item, desirableItemIds));
        }
        comparisionStatus.push(TreeComparator.compareByNumberOfHandsNeeded(entry1.item, entry2.item));

        return TreeComparator.combineComparison(comparisionStatus);
    }
    
    static equivalentSort(entry1, entry2) {
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
    
}