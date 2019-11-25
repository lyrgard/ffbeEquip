class ItemPool {
    constructor(maxDepth, involvedStats, ennemyStats, desirableElements, desirableItemIds, skillIds, includeSingleWielding, includeDualWielding) {
        this.maxDepth = maxDepth;
        this.involvedStats = involvedStats;
        this.ennemyStats = ennemyStats;
        this.desirableElements = desirableElements;
        this.desirableItemIds = desirableItemIds;
        this.includeSingleWielding = includeSingleWielding;
        this.includeDualWielding = includeDualWielding;
        this.keptItems = [];
        this.groupByIds = {};
        this.groupByItemIds = {};
        this.currentGroupId = 0;
        this.currentItemId = 0;
        this.workingArray = [];
        this.lesserGroupsById = {};
        this.skillIds = skillIds;
    }
    
    static fromData(itemPool) {
        let clone = new ItemPool(itemPool.maxDepth, itemPool.involvedStats, itemPool.ennemyStats, itemPool.desirableElements, itemPool.desirableItemIds, itemPool.skillIds, itemPool.includeSingleWielding, itemPool.includeDualWielding);
        clone.keptItems = itemPool.keptItems;
        clone.groupByIds = itemPool.groupByIds;
        clone.groupByItemIds = itemPool.groupByItemIds;
        clone.lesserGroupsById = itemPool.lesserGroupsById;
        return clone;
    }

    clone() {
        let clone = new ItemPool(this.maxDepth, this.involvedStats, this.ennemyStats, this.desirableElements, this.desirableItemIds, this.skillIds, this.includeSingleWielding, this.includeDualWielding);
        clone.addItems(this.getEntries());
        return clone;
    }
    
    addItems(entries) {
        for (var i = entries.length; i--;) {
            this.addItem(entries[i]);
        }
    }
    
    addItem(entry, available = entry.available) {
        this.currentItemId++;
        entry.betterItems = 0;
        entry.currentAvailable = available;
        entry.fixedAvailable = available;
        entry.uniqueId = this.currentItemId;
        var betterGroups = [];
        var lesserGroups = [];
        var betterItemCount = 0;
        for (var i = this.keptItems.length; i--;) {
            var comparison = ItemPool.getComparison(this.keptItems[i].equivalents[0], entry, this.involvedStats, this.ennemyStats, this.desirableElements, this.desirableItemIds, this.skillIds, this.includeSingleWielding, this.includeDualWielding);
            switch (comparison) {
                case "strictlyWorse":
                    betterItemCount += this.keptItems[i].available;
                    betterGroups.push(this.keptItems[i].id);
                    break;
                case "equivalent":
                    this.keptItems[i].equivalents.push(entry);
                    this.keptItems[i].available += available;
                    return;
                case "strictlyBetter":
                    this.keptItems[i].betterItems += available;
                    if (this.keptItems[i].betterItems >= this.maxDepth) {
                        this.keptItems.splice(i, 1);
                    } else {
                        lesserGroups.push(this.keptItems[i].id);
                    }
                    break;
                case "sameLevel":
                    break;
            }
        }
        if (betterItemCount < this.maxDepth) {
            this.currentGroupId++;
            var newGroup = {"id":this.currentGroupId, "equivalents":[entry], "currentEquivalent":0, "available": available, "betterItems":betterItemCount, "betterGroups":betterGroups};
            for (var i = betterGroups.length; i--;) {
                if (!this.lesserGroupsById[betterGroups[i]]) {
                    this.lesserGroupsById[betterGroups[i]] = [];
                }
                if (!this.lesserGroupsById[betterGroups[i]].includes(this.currentGroupId)) {
                    this.lesserGroupsById[betterGroups[i]].push(this.currentGroupId);
                }
            }
            for (var i = lesserGroups.length; i--;) {
                if (!this.lesserGroupsById[this.currentGroupId]) {
                    this.lesserGroupsById[this.currentGroupId] = [];
                }
                if (!this.lesserGroupsById[this.currentGroupId].includes(lesserGroups[i])) {
                    this.lesserGroupsById[this.currentGroupId].push(lesserGroups[i]);
                }
                this.groupByIds[lesserGroups[i]].betterGroups.push(this.currentGroupId);
            }
            this.keptItems.push(newGroup);
            this.groupByIds[this.currentGroupId] = newGroup;
            this.groupByItemIds[entry.uniqueId] = this.currentGroupId;
        }
    }
    
    prepare() {
        for (var i = this.keptItems.length; i--;) {
            if (this.keptItems[i].equivalents.length > 1) {
                this.keptItems[i].equivalents.sort(ItemPool.equivalentSort);
                
                var number = 0;
                var numberNeeded = this.maxDepth; // todo take better items into consideration
                for (var j = 0, lenj = this.keptItems[i].equivalents.length; j < lenj; j++) {
                    number += this.keptItems[i].equivalents[j].currentAvailable;
                    if (number >= numberNeeded) {
                        this.keptItems[i].equivalents = this.keptItems[i].equivalents.slice(0, j+1);
                        this.keptItems[i].available = number;
                        break;
                    }
                }
            }
            this.keptItems[i].active = (this.keptItems[i].betterGroups.length == 0);
        }
    }
    
    getEntries() {
        var entries = [];
        for (var i = this.keptItems.length; i--;) {
            entries = entries.concat(this.keptItems[i].equivalents);
        }
        return entries;
    }
    
    take(index) {
        var group = this.keptItems[index];
        var item = group.equivalents[group.currentEquivalent].item;
        if (!(--group.equivalents[group.currentEquivalent].currentAvailable)) {
            // We used all instance of the current equivalent in this groups
            group.currentEquivalent++;
            if (group.currentEquivalent == group.equivalents.length) {
                // This group is empty, awaken lesser groups
                group.active = false;
                var lesserGroups = this.lesserGroupsById[group.id];
                if (lesserGroups) {
                    for (var i = lesserGroups.length; i--;) {
                        var betterGroups = this.groupByIds[lesserGroups[i]].betterGroups;
                        var allUsed = true;
                        for (var j = betterGroups.length; j--;) {
                            if (this.groupByIds[betterGroups[j]].currentEquivalent != this.groupByIds[betterGroups[j]].equivalents.length) {
                                allUsed = false;
                                break;
                            }
                        }
                        if (allUsed) {
                            // This group have all it's better group already used, so it can become active.
                            this.groupByIds[lesserGroups[i]].active = true;
                        }
                    }
                }
            }
        }
        return item;
    }
    
    putBack(index) {
        var group = this.keptItems[index];
        if (!group.active) {
            // the group was inactive.
            group.currentEquivalent--;
            group.active = true;
            
            // Deactivate lesser groups
            var lesserGroups = this.lesserGroupsById[group.id];
            if (lesserGroups) {
                for (var i = this.lesserGroupsById[group.id].length; i--;) {
                    this.groupByIds[this.lesserGroupsById[group.id][i]].active = false;
                }
            }
        }
        if (group.equivalents[group.currentEquivalent].currentAvailable == group.equivalents[group.currentEquivalent].fixedAvailable) {
            // This equivalent is full, go to the previous one
            group.currentEquivalent--;
        }
        group.equivalents[group.currentEquivalent].currentAvailable++;
    }
    
    static getComparison(entry1, entry2, stats, ennemyStats, desirableElements, desirableItemIds, skillIds, includeSingleWielding = true, includeDualWielding = true, simplifiedAilments) {
        var comparisionStatus = [];
        let ailmentsToSimplify;
        for (var index = stats.length; index--;) {
            let stat = stats[index];
            if (stat == "physicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(entry1.item, entry2.item, "physical", ennemyStats.races));
            } else if (stat == "magicalKiller") {
                comparisionStatus.push(TreeComparator.compareByKillers(entry1.item, entry2.item, "magical", ennemyStats.races));
            } else if (stat == "weaponElement") {
                comparisionStatus.push(TreeComparator.compareByElementCoef(entry1.item, entry2.item));
            } else if (stat == "meanDamageVariance" || stat == "evade.physical" || stat == "evade.magical" || stat == "mpRefresh") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, stat));
            } else if (stat == "lbPerTurn") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "lbFillRate"));
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "lbPerTurn.min"));
            } else if (stat == "lbDamage") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "lbDamage"));
            } else if (stat == "accuracy") {
                comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "accuracy"));
                if (includeSingleWielding) {
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "singleWielding.accuracy"));
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "singleWieldingOneHanded.accuracy"));
                }
            } else {
                if (!baseStats.includes(stat) || getValue(entry1.item, stat) >= 5 ||  getValue(entry2.item, stat) >= 5) {
                    if (!simplifiedAilments) {
                        comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, stat));    
                    }
                    
                }
                if (baseStats.includes(stat)) {
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "total_" + stat));
                    comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "esperStatsBonus.all." + stat));
                    if (includeSingleWielding) {
                        comparisionStatus.push(TreeComparator.compareByDoublehand(entry1.item, entry2.item, stat));
                    }
                    if (includeDualWielding) {
                        comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, "dualWielding." + stat));
                        if (stat == 'atk') {
                               comparisionStatus.push(TreeComparator.compareByValue(entry1.item, entry2.item, 'atk%'));
                        }
                    }
                }
            }
        }
        if (desirableElements && desirableElements.length != 0) {
            comparisionStatus.push(TreeComparator.compareByEquipedElementCondition(entry1.item, entry2.item, desirableElements));
        }
        if (desirableItemIds && desirableItemIds.length != 0) {
            comparisionStatus.push(TreeComparator.compareByDesirableItemIdsCondition(entry1.item, entry2.item, desirableItemIds));
        }
        if (skillIds.length > 0) {
            skillIds.forEach(skillId => comparisionStatus.push(TreeComparator.compareBySkillEnhancement(entry1.item, entry2.item, skillId)));
        }
        comparisionStatus.push(TreeComparator.compareByNumberOfHandsNeeded(entry1.item, entry2.item));
        if (simplifiedAilments) {
            comparisionStatus.push(TreeComparator.compareByAllAilments(entry1.item, entry2.item, simplifiedAilments));
        }

        return TreeComparator.combineComparison(comparisionStatus);
    }
    
    static equivalentSort(entry1, entry2) {
        if (entry1.owned && !entry2.owned) {
            return -1;
        } else if (!entry1.owned && entry2.owned) {
            return 1;
        } else {
            if (entry1.defenseValue == entry2.defenseValue) {
                if (entry1.mpValue == entry2.mpValue) {
                    return entry2.ownedNumber - entry1.ownedNumber;
                } else {
                    return entry2.mpValue - entry1.mpValue;
                }
            } else {
                return entry2.defenseValue - entry1.defenseValue;    
            }
        }   
    }
    
}
