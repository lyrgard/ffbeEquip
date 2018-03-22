class BuildOptimizer {
    constructor(espers, allItemVersions) {
        this.espers = espers;
        this.allItemVersions = allItemVersions;
    }
    
    set unitBuild(unitBuild) {
        this._unitBuild = unitBuild;
        this.desirableElements = [];
        for (var index = 0, len = this._unitBuild.unit.skills.length; index < len; index++) {
            var skill = this._unitBuild.unit.skills[index];
            if (skill.equipedConditions && skill.equipedConditions.length == 1 && elementList.includes(skill.equipedConditions[0]) && !this.desirableElements.includes(skill.equipedConditions[0])) {
                this.desirableElements.push(skill.equipedConditions[0]);
            }
        }
    }
    
    set alreadyUsedEspers(alreadyUsedEspers) {
        if (this.useEspers) {
            this.selectedEspers = this.selectEspers(alreadyUsedEspers, this.ennemyStats);
        } else {
            this.selectedEspers = [];
        }
    }
    
    optimizeFor(typeCombinations, betterBuildFoundCallback) {
        this.betterBuildFoundCallback = betterBuildFoundCallback;
        var combinationsNumber = typeCombinations.length;
        for (var index = 0, len = combinationsNumber; index < len; index++) {

            var dataWithdConditionItems = {}
            for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
                if (typeCombinations[index].combination[slotIndex] && !dataWithdConditionItems[typeCombinations[index].combination[slotIndex]]) {
                    dataWithdConditionItems[typeCombinations[index].combination[slotIndex]] = this.selectItems(typeCombinations[index].combination[slotIndex], typeCombinations[index].combination, typeCombinations[index].fixedItems, typeCombinations[index].forcedItems, this.dataWithCondition);
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
        }
    }
    
    selectEspers(alreadyUsedEspers, ennemyStats) {
        var selectedEspers = [];
        var keptEsperRoot = EsperTreeComparator.sort(this.espers, alreadyUsedEspers, this._unitBuild.involvedStats, ennemyStats);
        for (var index = keptEsperRoot.children.length; index--;) {
            if (!selectedEspers.includes(keptEsperRoot.children[index])) {
                selectedEspers.push(keptEsperRoot.children[index].esper);
            }
        }
        return selectedEspers;
    }
    
    selectItems(type, typeCombination, fixedItems, forcedItems, dataWithCondition) {
        
        var itemsOfType = this.dataByType[type];
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
            if (item.type == type && !dataWithConditionKeyAlreadyAdded.includes(item.id)) {
                var allFound = true;
                for (var conditionIndex in item.equipedConditions) {
                    if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                        allFound = false;
                        break;
                    }
                }
                if (allFound) {
                    if (dataWithoutConditionIds[type] && dataWithoutConditionIds[type].includes(entry.item.id)) {
                        // If we add a condition items that have a none conditioned version alreadty selected, remove that second version
                        for (var alreadyAddedIndex = tempResult.length; alreadyAddedIndex--;) {
                            if (tempResult[alreadyAddedIndex].item.id == entry.item.id) {
                                tempResult.splice(alreadyAddedIndex,1);
                                break;    
                            }
                        }
                    }

                    tempResult.push(entry);
                    dataWithConditionKeyAlreadyAdded.push(item.id);

                }
            }
        }
        var index = 0;
        while (index < tempResult.length) {
            if (forcedItems.includes(tempResult[index].item.id)) {
                tempResult[index].available--;
                if (tempResult[index].available <= 0) {
                    tempResult.splice(index,1);
                    continue;
                }
            }
            index++;
        }
        
        var numberNeeded = 0;
        for (var slotIndex = typeCombination.length; slotIndex--;) {
            if (typeCombination[slotIndex] == type && !fixedItems[slotIndex]) {
                numberNeeded++;
            }
        }
        return ItemTreeComparator.sort(tempResult, numberNeeded, this._unitBuild, this.ennemyStats, typeCombination);
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
    
    
    
    findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills, tmrSkillUsed = false) {
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
            this.tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index], fixedItems,elementBasedSkills, tmrSkillUsed);
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
                        this.tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills, tmrSkillUsed);
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
                    this.tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills, tmrSkillUsed);
                }
                build[index] == null;
            } else {
                this.tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills, tmrSkillUsed);
            }
        }
        build[index] = null;
    }

    tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills, tmrSkillUsed) {
        if (index == 0 && item && isTwoHanded(item) && typeCombination[1]) {
            return; // Two handed weapon only accepted on DH builds
        }
        if (index == 1 && !item && typeCombination[1]) {
            return; // don't accept null second hand in DW builds
        }
        if (tmrSkillUsed && item && item.originalItem) {
            item = item.originalItem;
        }
        build[index] = item;
        if (item && item.originalItem) {
            tmrSkillUsed = true;
        }
        if (index == 9) {
            for (var fixedItemIndex = 0; fixedItemIndex < 10; fixedItemIndex++) {
                if (fixedItems[fixedItemIndex] && (!this.allItemVersions[fixedItems[fixedItemIndex].id] || this.allItemVersions[fixedItems[fixedItemIndex].id].length > 1)) {
                    build[fixedItemIndex] = findBestItemVersion(build, fixedItems[fixedItemIndex], this.allItemVersions, this._unitBuild.unit);
                }
            }
            if (fixedItems[10]) {
                this.tryEsper(build, fixedItems[10]);
            } else {
                if (this.selectedEspers.length > 0) {
                    for (var esperIndex = 0, len = this.selectedEspers.length; esperIndex < len; esperIndex++) {
                        this.tryEsper(build, this.selectedEspers[esperIndex])  
                    }
                } else {
                    this.tryEsper(build, null);
                }
            }
        } else {
            this.findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills, tmrSkillUsed);
        }
    }

    tryEsper(build, esper) {
        build[10] = esper;
        var value = calculateBuildValueWithFormula(build, this._unitBuild, this.ennemyStats, this._unitBuild.formula);
        if ((value != 0 && this._unitBuild.buildValue == 0) || value > this._unitBuild.buildValue) {
            this._unitBuild.build = build.slice();
            this._unitBuild.buildValue = value;
            this.betterBuildFoundCallback(this._unitBuild.build, this._unitBuild.buildValue);
        }
    }
}