class DataStorage {
    constructor(data) {
        this.data = data;
        this.prepareAllItemsVersion();
    }
    
    prepareAllItemsVersion() {
        this.allItemVersions = {};
        this.itemWithVariation = {};
        var currentId = 0;
        var currentItemVersions = [];
        for (var index = 0, len = this.data.length; index < len; index++) {
            var item = this.data[index];
            if (item.id != currentId) {
                if (currentItemVersions.length > 1 || (currentItemVersions.length == 1 && currentItemVersions[0].equipedConditions)) {
                    this.itemWithVariation[currentId] = currentItemVersions;
                }
                this.allItemVersions[currentId] = currentItemVersions;
                currentId = item.id;
                currentItemVersions = [];
            }
            currentItemVersions.push(item);
        }
        if (currentItemVersions.length > 1) {
            this.itemWithVariation[currentId] = currentItemVersions;
        }
        this.allItemVersions[currentId] = currentItemVersions;
    }
    
    setItemsToExclude(itemsToExclude) {
        this.itemsToExclude = itemsToExclude;
    }
    
    setUnitBuild(unitBuild) {
        this.unitBuild = unitBuild;
        this.desirableElements = [];
        for (var index = 0, len = this.unitBuild.unit.skills.length; index < len; index++) {
            var skill = this.unitBuild.unit.skills[index];
            if (skill.equipedConditions && skill.equipedConditions.length == 1 && elementList.includes(skill.equipedConditions[0]) && !this.desirableElements.includes(skill.equipedConditions[0])) {
                this.desirableElements.push(skill.equipedConditions[0]);
            }
        }
    }
    
    prepareData(itemsToExclude, ennemyStats) {
        this.dataByType = {};
        this.dataWithCondition = [];
        this.dualWieldSources = [];
        this.equipSources = [];
        var tempData = {};
        var adventurersAvailable = {};
        var alreadyAddedIds = [];
        var alreadyAddedDualWieldSource = [];
        var equipable = this.unitBuild.getCurrentUnitEquip();

        for (var index = this.data.length; index--;) {
            var item = this.data[index];
            if (itemsToExclude.includes(item.id)) {
                continue;
            }
            this.prepareItem(item, this.unitBuild.baseValues, ennemyStats);
            if (getAvailableNumber(item) > 0 && isApplicable(item, this.unitBuild.unit)) {
                if ((item.special && item.special.includes("dualWield")) || (item.partialDualWield && matches(equipable, item.partialDualWield))) {
                    if (!alreadyAddedDualWieldSource.includes(item.id)) {
                        this.dualWieldSources.push(item);
                        alreadyAddedDualWieldSource.push(item.id);
                    }
                }
                if (!item.special || !item.special.includes("dualWield")) {
                    if (item.allowUseOf && !equipable.includes(item.allowUseOf)) {
                        this.equipSources.push(item);
                    } else if (this.itemCanBeOfUseForGoal(item, ennemyStats)) {
                        if (adventurerIds.includes(item.id)) { // Manage adventurers to only keep the best available
                            adventurersAvailable[item.id] = item;
                            continue;
                        }
                        if (item.equipedConditions) {
                            this.dataWithCondition.push(this.getItemEntry(item));
                        } else {
                            if (!alreadyAddedIds.includes(item.id)) {
                                if (!this.dataByType[item.type]) {
                                    this.dataByType[item.type] = [];
                                }
                                this.dataByType[item.type].push(this.getItemEntry(item));
                                alreadyAddedIds.push(item.id);
                            }
                        }
                    }
                }
            }
        }
        var adventurerAlreadyPinned = false;
        for (var index = 6; index < 10; index++) {
            if (this.unitBuild.fixedItems[index] && adventurerIds.includes(this.unitBuild.fixedItems[index].id)) {
                adventurerAlreadyPinned = true;
                break;
            }
        }
        if (!adventurerAlreadyPinned) {
            for (var index = adventurerIds.length -1; index >=0; index--) { // Manage adventurers  to only keep the best available
                if (adventurersAvailable[adventurerIds[index]]) {
                    this.dataByType["materia"].push(this.getItemEntry(adventurersAvailable[adventurerIds[index]]));
                    break;
                }
            }
        }
        this.dataWithCondition.sort(function(entry1, entry2) {
            if (entry1.item.id == entry2.item.id) {
                return entry2.item.equipedConditions.length - entry1.item.equipedConditions.length;
            } else {
                return entry1.item.id - entry2.item.id;
            }
        })
        for (var typeIndex = 0, len = typeList.length; typeIndex < len; typeIndex++) {
            var type = typeList[typeIndex];
            if (this.dataByType[type] && this.dataByType[type].length > 0) {
                var numberNeeded = 1;
                if (weaponList.includes(type) || type == "accessory") {numberNeeded = 2}
                if (type == "materia") {numberNeeded = 4}
                var tree = ItemTreeComparator.sort(this.dataByType[type], numberNeeded, this.unitBuild, ennemyStats);
                this.dataByType[type] = [];
                for (var index = 0, lenChildren = tree.children.length; index < lenChildren; index++) {
                    this.addEntriesToResult(tree.children[index], this.dataByType[type], 0, numberNeeded, true);    
                }
            } else {
                this.dataByType[type] = [{"item":getPlaceHolder(type),"available":numberNeeded}];  
            }
        }
    }
    
    addEntriesToResult(tree, result, keptNumber, numberNeeded, keepEntry) {
        tree.equivalents.sort(function(entry1, entry2) {
            if (entry1.defenseValue == entry2.defenseValue) {
                if (entry2.available == entry1.available) {
                    return getValue(entry2.item, "atk%") + getValue(entry2.item, "mag%") + getValue(entry2.item, "atk") + getValue(entry2.item, "mag") - (getValue(entry1.item, "atk%") + getValue(entry1.item, "mag%") + getValue(entry1.item, "atk") + getValue(entry1.item, "mag"))
                } else {
                    return entry2.available - entry1.available;    
                }
            } else {
                return entry2.defenseValue - entry1.defenseValue;    
            }
        });
        for (var index = 0, len = tree.equivalents.length; index < len; index++) {
            if (keptNumber >= numberNeeded) {
                break;
            }
            if (keepEntry) {
                result.push(tree.equivalents[index]);
            } else {
                result.push(tree.equivalents[index].item);
            }
            keptNumber += tree.equivalents[index].available;
        }
        if (keptNumber < numberNeeded) {
            for (var index = 0, len = tree.children.length; index < len; index++) {
                this.addEntriesToResult(tree.children[index], result, keptNumber, numberNeeded, keepEntry);    
            }
        }
    }

    getItemEntry(item) {
        return {
            "item":item, 
            "name":item.name, 
            "defenseValue":this.getDefenseValue(item),
            "available":getAvailableNumber(item)
        };
    }
    
    getDefenseValue(item) {
        var hpBaseValue = this.unitBuild.baseValues.hp.total;
        var defBaseValue = this.unitBuild.baseValues.def.total;
        var sprBaseValue = this.unitBuild.baseValues.spr.total;
        return this.getStatValueIfExists(item, "hp", hpBaseValue) + this.getStatValueIfExists(item, "def", hpBaseValue) + this.getStatValueIfExists(item, "spr", hpBaseValue);
    }
    
    getStatValueIfExists(item, stat, baseStat) {
        var result = 0;
        if (item[stat]) result += item[stat];
        if (item[percentValues[stat]]) result += item[percentValues[stat]] * baseStat / 100;
        return result;
    }

    prepareItem(item, baseValues, ennemyStats) {
        for (var index = 0, len = baseStats.length; index < len; index++) {
            item['total_' + baseStats[index]] = this.getStatValueIfExists(item, baseStats[index], baseValues[baseStats[index]].total);
        }
        if (item.element && !includeAll(this.unitBuild.innateElements, item.element)) {
            item.elementType = "element_" + getElementCoef(item.element, ennemyStats);
        } else {
            item.elementType = "neutral"
        }
        if (weaponList.includes(item.type)) {
            item.meanDamageVariance = 1;
            if (item.damageVariance) {
                item.meanDamageVariance = (item.damageVariance.min + item.damageVariance.max) / 2
                item.minDamageVariance = item.damageVariance.min
                item.maxDamageVariance = item.damageVariance.max
            }
        }
    }

    itemCanBeOfUseForGoal(item, ennemyStats) {
        var stats = builds[currentUnitIndex].involvedStats;

        for (var index = 0, len = stats.length; index < len; index++) {
            if (stats[index] == "weaponElement") {
                if (item.element && getElementCoef(item.element, ennemyStats) >= 0) return true;
            } else if (stats[index] == "physicalKiller") {
                if (this.getKillerCoef(item, "physical") > 0) return true;
            } else if (stats[index] == "magicalKiller") {
                if (this.getKillerCoef(item, "magical") > 0) return true;
            } else {
                if (getValue(item, stats[index]) > 0) return true;
                if (item["total_" + stats[index]]) return true;
                if (item.singleWielding && item.singleWielding[stats[index]]) return true;
                if (item.singleWieldingGL && item.singleWieldingGL[stats[index]]) return true;
                if (item.singleWieldingOneHanded && item.singleWieldingOneHanded[stats[index]]) return true;
                if (item.singleWieldingOneHandedGL && item.singleWieldingOneHandedGL[stats[index]]) return true;
            }
        }
        if (this.desirableElements.length != 0) {
            if (item.element && matches(item.element, this.desirableElements)) return true;
        }
    }
    
    getKillerCoef(item, applicableKillerType) {
        var cumulatedKiller = 0;
        if (ennemyStats.races.length > 0 && item.killers) {
            for (var killerIndex = item.killers.length; killerIndex--;) {
                if (ennemyStats.races.includes(item.killers[killerIndex].name) && item.killers[killerIndex][applicableKillerType]) {
                    cumulatedKiller += item.killers[killerIndex][applicableKillerType];
                }
            }
        }
        return cumulatedKiller / ennemyStats.races.length;
    }
}