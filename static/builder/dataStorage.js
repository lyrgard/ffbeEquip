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
            item.meanDamageVariance = 1;
            if (item.damageVariance) {
                item.meanDamageVariance = (item.damageVariance.min + item.damageVariance.max) / 2
            }
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
        this.desiredEquipmentType = [];
        for (var index = 0, len = this.unitBuild.unit.skills.length; index < len; index++) {
            var skill = this.unitBuild.unit.skills[index];
            if (skill.equipedConditions) {
                for (var i = skill.equipedConditions.length; i--;) {
                    var condition = skill.equipedConditions[i];
                    if (elementList.includes(condition)) {
                        if (!this.desirableElements.includes(condition)) {
                            this.desirableElements.push(skill.equipedConditions[0]);    
                        }
                    } else if (!this.desiredEquipmentType.includes(condition)) {
                        this.desiredEquipmentType.push(condition);
                    }
                }
            }
        }
        this.prepareAllItemsVersion();
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
        var itemNumber = this.data.length;
        var tmrAbilityEnhancedItem = null;

        for (var index = 0; index < itemNumber; index++) {
            var item;
            var availableNumber;
            if (index < this.data.length) {
                item = this.data[index];
                availableNumber = getAvailableNumber(item);
            } else {
                item = tmrAbilityEnhancedItem;
                availableNumber = 1;
            }
            if (itemsToExclude.includes(item.id)) {
                continue;
            }
            
            if (this.unitBuild && this.unitBuild.unit && this.unitBuild.unit.tmrSkill && item.tmrUnit && item.tmrUnit == this.unitBuild.unit.id && !item.originalItem) {
                tmrAbilityEnhancedItem = getItemWithTmrSkillIfApplicable(item, this.unitBuild.unit);
                itemNumber = this.data.length + 1;
                availableNumber--;
            } 
            
            this.prepareItem(item, this.unitBuild.baseValues, ennemyStats);
            if (availableNumber > 0 && isApplicable(item, this.unitBuild.unit)) {
                if ((item.special && item.special.includes("dualWield")) || (item.partialDualWield && matches(equipable, item.partialDualWield))) {
                    if (!alreadyAddedDualWieldSource.includes(item.id)) {
                        this.dualWieldSources.push(item);
                        alreadyAddedDualWieldSource.push(item.id);
                    }
                }
                if (item.allowUseOf && !equipable.includes(item.allowUseOf)) {
                    this.equipSources.push(item);
                } 
                if (this.itemCanBeOfUseForGoal(item, ennemyStats)) {
                    if (adventurerIds.includes(item.id)) { // Manage adventurers to only keep the best available
                        adventurersAvailable[item.id] = item;
                        continue;
                    }
                    if (item.equipedConditions) {
                        this.dataWithCondition.push(this.getItemEntry(item));
                    } else {
                        if (!alreadyAddedIds.includes(item.id) ||item == tmrAbilityEnhancedItem) {
                            if (!this.dataByType[item.type]) {
                                this.dataByType[item.type] = [];
                            }
                            this.dataByType[item.type].push(this.getItemEntry(item, availableNumber));
                            alreadyAddedIds.push(item.id);
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
                    if (!this.dataByType["materia"]) {
                        this.dataByType["materia"] = [];
                    }
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
                    this.addEntriesToResult(tree.children[index], this.dataByType[type], 0, true);    
                }
            } else {
                this.dataByType[type] = [{"item":getPlaceHolder(type),"available":numberNeeded}];  
            }
        }
    }
    
    addEntriesToResult(tree, result, keptNumber, keepEntry) {
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
            if (keepEntry) {
                result.push(tree.equivalents[index]);
            } else {
                result.push(tree.equivalents[index].item);
            }
        }
        for (var index = 0, len = tree.children.length; index < len; index++) {
            this.addEntriesToResult(tree.children[index], result, keptNumber, keepEntry);    
        }
    }

    getItemEntry(item, availableNumber = null) {
        return {
            "item":item, 
            "name":item.name, 
            "defenseValue":this.getDefenseValue(item),
            "available":availableNumber || getAvailableNumber(item)
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
            } else if (stats[index] == "lbPerTurn") {
                if (item.lbPerTurn || item.lbFillRate) return true;
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
        if (this.desiredEquipmentType.length != 0) {
            if (item.type && this.desiredEquipmentType.includes(item.type)) return true;
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