class BuildOptimizer {
    constructor(data, espers) {
        this.data = data;
        this.espers = espers;
    }
    
    set unitBuild(unitBuild) {
        this._unitBuild = unitBuild;
        this.desirableElements = [];
        for (var index = 0, len = this._unitBuild.unit.skills.length; index < len; index++) {
            var skill = this._unitBuild.unit.skills[index];
            if (skill.equipedConditions && skill.equipedConditions.length == 1 && elementList.includes(skill.equipedConditions[0]) && !desirableElements.includes(skill.equipedConditions[0])) {
                desirableElements.push(skill.equipedConditions[0]);
            }
        }
    }
    
    optimizeFor(typeCombinations, alreadyUsedItems, alreadyUsedEspers, incrementCalculatedCallback, betterBuildFoundCallback, ennemyStats) {
        this.betterBuildFoundCallback = betterBuildFoundCallback;
        this.selectedEspers = this.selectEspers(alreadyUsedEspers, ennemyStats);
        this.ennemyStats = ennemyStats;
        var combinationsNumber = typeCombinations.length;
        var percent = 0;
        var numberCalculated = 0;
        for (var index = 0, len = combinationsNumber; index < len; index++) {

            var dataWithdConditionItems = {}
            for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
                if (typeCombinations[index].combination[slotIndex] && !dataWithdConditionItems[typeCombinations[index].combination[slotIndex]]) {
                    dataWithdConditionItems[typeCombinations[index].combination[slotIndex]] = this.selectItems(this.dataByType[typeCombinations[index].combination[slotIndex]], typeCombinations[index].combination[slotIndex], typeCombinations[index].combination, typeCombinations[index].fixedItems, dataWithCondition);
                }
            }
            var applicableSkills = [];
            for (var skillIndex = this._unitBuild.unit.skills.length; skillIndex--;) {
                var skill = this._unitBuild.unit.skills[skillIndex];
                if (this.areConditionOKBasedOnTypeCombination(skill, typeCombinations[index].combination)) {
                    applicableSkills.push(skill);
                }
            }

            var build = [null, null, null, null, null, null, null, null, null, null,null].concat(applicableSkills);
            this.findBestBuildForCombination(0, build, typeCombinations[index].combination, dataWithdConditionItems, typeCombinations[index].fixedItems, this.getElementBasedSkills());
            
            numberCalculated++;
            var newPercent = Math.floor(numberCalculated*100/combinationsNumber);
            if (newPercent != percent) {
                percent = newPercent;
                incrementCalculatedCallback(numberCalculated);
            }
        }
    }
    
    selectEspers(alreadyUsedEspers, ennemyStats) {
        var selectedEspers = [];
        var keptEsperRoot = EsperTreeComparator.sort(this.espers, alreadyUsedEspers, this._unitBuild.involvedStats, ennemyStats);
        for (var index = keptEsperRoot.children.length; index--;) {
            if (!selectedEspers.includes(keptEsperRoot.children[index])) {
                selectedEspers.push(getEsperItem(keptEsperRoot.children[index].esper));
            }
        }
        return selectedEspers;
    }
    
    selectItems(itemsOfType, type, typeCombination, fixedItems, dataWithCondition) {
        var dataWithoutConditionIds = [];
        for (var index = itemsOfType.length; index--; ) {
            if (!dataWithoutConditionIds.includes(itemsOfType[index].id)) {
                dataWithoutConditionIds.push(itemsOfType[index].id);
            }
        }
        var tempResult = itemsOfType.slice();
        var dataWithConditionKeyAlreadyAdded = [];
        for (var index = 0, len = this.dataWithCondition.length; index < len; index++) {
            var entry = this.dataWithCondition[index];
            var item = entry.item;
            if (item.type == type && !dataWithConditionKeyAlreadyAdded.includes(item[itemKey])) {
                var allFound = true;
                for (var conditionIndex in item.equipedConditions) {
                    if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                        allFound = false;
                        break;
                    }
                }
                if (allFound) {
                    if (dataWithoutConditionIds[type] && dataWithoutConditionIds[type].includes(entry.item[itemKey])) {
                        // If we add a condition items that have a none conditioned version alreadty selected, remove that second version
                        for (var alreadyAddedIndex = tempResult.length; alreadyAddedIndex--;) {
                            if (tempResult[alreadyAddedIndex].item[itemKey] == entry.item[itemKey]) {
                                tempResult.splice(alreadyAddedIndex,1);
                                break;    
                            }
                        }
                    }

                    tempResult.push(entry);
                    dataWithConditionKeyAlreadyAdded.push(item[itemKey]);

                }
            }
        }
        var numberNeeded = 0;
        for (var slotIndex = typeCombination.length; slotIndex--;) {
            if (typeCombination[slotIndex] == type && !fixedItems[slotIndex]) {
                numberNeeded++;
            }
        }

        return ItemTreeComparator.sort(tempResult, numberNeeded, this._unitBuild, ennemyStats, typeCombination);
    }
    
    getElementBasedSkills() {
        var elementBasedSkills = [];
        for (var skillIndex = this._unitBuild.unit.skills.length; skillIndex--;) {
            var skill = this._unitBuild.unit.skills[skillIndex];
            if (skill.equipedConditions) {
                for (var conditionIndex in skill.equipedConditions) {
                    if (elementList.includes(skill.equipedConditions[conditionIndex])) {
                        elementBasedSkills.push(skill);
                        break;
                    }
                }
            }
        }
        return elementBasedSkills;
    }
    
    areConditionOKBasedOnTypeCombination(item, typeCombination) {
        if (item.equipedConditions) {
            for (var conditionIndex = item.equipedConditions.length; conditionIndex--;) {
                if (elementList.includes(item.equipedConditions[conditionIndex])) {
                    return false;
                } else {
                    if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    prepareData(itemsToExclude) {
        this.dataByType = {};
        this.dataWithCondition = [];
        this.dualWieldSources = [];
        var tempData = {};
        var adventurersAvailable = {};
        var alreadyAddedIds = [];
        var alreadyAddedDualWieldSource = [];
        var equipable = this._unitBuild.getCurrentUnitEquip();

        for (var index = this.data.length; index--;) {
            var item = this.data[index];
            if (itemsToExclude.includes(item.id)) {
                continue;
            }
            this.prepareItem(item, this._unitBuild.baseValues);
            if (getAvailableNumber(item) > 0 && isApplicable(item) && equipable.includes(item.type)) {
                if ((item.special && item.special.includes("dualWield")) || item.partialDualWield) {
                    if (!alreadyAddedDualWieldSource.includes(item.id)) {
                        dualWieldSources.push(item);
                        alreadyAddedDualWieldSource.push(item.id);
                    }
                } else if (this.itemCanBeOfUseForGoal(item)) {
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
        var adventurerAlreadyPinned = false;
        for (var index = 6; index < 10; index++) {
            if (this._unitBuild.fixedItems[index] && adventurerIds.includes(this._unitBuild.fixedItems[index].id)) {
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
            if (entry1.item[itemKey] == entry2.item[itemKey]) {
                return entry2.item.equipedConditions.length - entry1.item.equipedConditions.length;
            } else {
                return entry1.item[itemKey] - entry2.item[itemKey];
            }
        })
        for (var typeIndex = 0, len = typeList.length; typeIndex < len; typeIndex++) {
            var type = typeList[typeIndex];
            if (this.dataByType[type] && this.dataByType[type].length > 0) {
                var numberNeeded = 1;
                if (weaponList.includes(type) || type == "accessory") {numberNeeded = 2}
                if (type == "materia") {numberNeeded = 4}
                var tree = ItemTreeComparator.sort(this.dataByType[type], numberNeeded, this._unitBuild, ennemyStats);
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
        var hpBaseValue = this._unitBuild.baseValues.hp.total;
        var defBaseValue = this._unitBuild.baseValues.def.total;
        var sprBaseValue = this._unitBuild.baseValues.spr.total;
        return getStatValueIfExists(item, "hp", hpBaseValue) + getStatValueIfExists(item, "def", hpBaseValue) + getStatValueIfExists(item, "spr", hpBaseValue);
    }

    prepareItem(item, baseValues) {
        for (var index = 0, len = baseStats.length; index < len; index++) {
            item['total_' + baseStats[index]] = getStatValueIfExists(item, baseStats[index], baseValues[baseStats[index]].total);
        }
        if (item.element && !includeAll[builds[currentUnitIndex].innateElements, item.elements]) {
            item.elementType = "element_" + getElementCoef(item.element);
        } else {
            item.elementType = "neutral"
        }
        if (weaponList.includes(item.type)) {
            item.meanDamageVariance = 1;
            if (item.damageVariance) {
                item.meanDamageVariance = (item.damageVariance.min + item.damageVariance.max) / 2
            }
        }
    }

    itemCanBeOfUseForGoal(item) {
        var stats = builds[currentUnitIndex].involvedStats;

        for (var index = 0, len = stats.length; index < len; index++) {
            if (stats[index] == "weaponElement") {
                if (item.element && getElementCoef(item.element) >= 0) return true;
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
    
    findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills) {
        if (index == 2) {
            // weapon set, try elemental based skills
            for (var skillIndex = elementBasedSkills.length; skillIndex--;) {
                if (build.includes(elementBasedSkills[skillIndex])) {
                    if (!areConditionOK(elementBasedSkills[skillIndex], build)) {
                        build.splice(build.indexOf(elementBasedSkills[skillIndex]),1);
                    }
                } else {
                    if (areConditionOK(elementBasedSkills[skillIndex], build)) {
                        build.push(elementBasedSkills[skillIndex]);
                    }
                }
            }
        }

        if (fixedItems[index]) {
            this.tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index], fixedItems,elementBasedSkills);
        } else {
            if (typeCombination[index]  && dataWithConditionItems[typeCombination[index]].children.length > 0) {
                var itemTreeRoot = dataWithConditionItems[typeCombination[index]];
                var foundAnItem = false;

                var len = itemTreeRoot.children.length;
                for (var childIndex = 0; childIndex < len; childIndex++) {
                    var entry = itemTreeRoot.children[childIndex].equivalents[itemTreeRoot.children[childIndex].currentEquivalentIndex];
                    var item = entry.item;
                    var numberRemaining = entry.available;
                    if (numberRemaining > 0) {
                        if (index == 1 && isTwoHanded(item)) {
                            continue;
                        }
                        var currentEquivalentIndex = itemTreeRoot.children[childIndex].currentEquivalentIndex;
                        var currentChild = itemTreeRoot.children[childIndex];
                        var removedChild = false;
                        var addedChildrenNumber = 0;
                        if (numberRemaining == 1 && (index == 0 ||index == 4 || index == 6 || index == 7 || index == 8)) {
                            // We used all possible copy of this item, switch to a worse item in the tree
                            if (currentChild.equivalents.length > currentEquivalentIndex + 1) {
                                currentChild.currentEquivalentIndex++;
                            } else if (currentChild.children.length > 0) {
                                // add the children of the node to root level
                                Array.prototype.splice.apply(itemTreeRoot.children, [childIndex, 1].concat(currentChild.children));
                                removedChild = true;
                                addedChildrenNumber = currentChild.children.length;
                            } else {
                                // we finished this branch, remove it
                                itemTreeRoot.children.splice(childIndex,1);
                                removedChild = true;
                            }
                        }
                        entry.available--;
                        this.tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills);
                        entry.available++;
                        //dataWithConditionItems[typeCombination[index]] = itemTreeRoot;
                        currentChild.currentEquivalentIndex = currentEquivalentIndex;
                        if (removedChild) {
                            itemTreeRoot.children.splice(childIndex, addedChildrenNumber, currentChild);    
                        }
                        foundAnItem = true;
                    }
                }
                if (!foundAnItem) {
                    this.tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills);
                }
                build[index] == null;
            } else {
                this.tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills);
            }
        }
        build[index] = null;
    }

    tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills) {
        if (index == 0 && (!item || isTwoHanded(item)) && typeCombination[1]) {
            return; // Two handed weapon only accepted on DH builds
        }
        if (index == 1 && !item && typeCombination[1]) {
            return; // don't accept null second hand in DW builds
        }
        build[index] = item;
        if (index == 9) {
            numberOfItemCombination++
            for (var fixedItemIndex = 0; fixedItemIndex < 10; fixedItemIndex++) {
                if (fixedItems[fixedItemIndex] && (!allItemVersions[fixedItems[fixedItemIndex].id] || allItemVersions[fixedItems[fixedItemIndex].id].length > 1)) {
                    build[fixedItemIndex] = findBestItemVersion(build, fixedItems[fixedItemIndex].id);
                }
            }
            if (fixedItems[10]) {
                this.tryEsper(build, fixedItems[10]);
            } else {
                for (var esperIndex = 0, len = this.selectedEspers.length; esperIndex < len; esperIndex++) {
                    this.tryEsper(build, this.selectedEspers[esperIndex])  
                }
            }
        } else {
            this.findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills);
        }
    }

    tryEsper(build, esper) {
        build[10] = esper;
        var value = calculateBuildValue(build);
        if ((value != 0 && builds[currentUnitIndex].buildValue == 0) || value > builds[currentUnitIndex].buildValue) {
            builds[currentUnitIndex].build = build.slice();
            builds[currentUnitIndex].buildValue = value;
            this.betterBuildFoundCallback(builds[currentUnitIndex].build, builds[currentUnitIndex].buildValue);
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