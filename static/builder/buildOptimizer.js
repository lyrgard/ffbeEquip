class BuildOptimizer {
    constructor(allItemVersions) {
        this.allItemVersions = allItemVersions;
        this.goalVariation = "avg";
    }
    
    set unitBuild(unitBuild) {
        this._unitBuild = unitBuild;
        this.desirableElements = [];
        this.desirableItemIds = [];
        for (var index = 0, len = this._unitBuild.unit.skills.length; index < len; index++) {
            var skill = this._unitBuild.unit.skills[index];
            if (skill.equipedConditions) {
                for (var i = skill.equipedConditions.length; i--;) {
                    if (elementList.includes(skill.equipedConditions[i])) {
                        if (!this.desirableElements.includes(skill.equipedConditions[i])) {
                            this.desirableElements.push(skill.equipedConditions[i]);            
                        }
                    } else if (!typeList.includes(skill.equipedConditions[i])) {
                        if (!this.desirableItemIds.includes(skill.equipedConditions[i])) {
                            this.desirableItemIds.push(skill.equipedConditions[i]);            
                        }
                    }
                }
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
        
        if (this._unitBuild.formula.type == "condition" && this._unitBuild.formula.elements) {
            for (var i = this._unitBuild.formula.elements.length; i--;) {
                if (!this.desirableElements.includes(this._unitBuild.formula.elements[i])) {
                    this.desirableElements.push(this._unitBuild.formula.elements[i])
                }
            }
        }
        
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
            this.findBestBuildForCombination(0, build, typeCombinations[index].combination, dataWithdConditionItems, typeCombinations[index].fixedItems, this.getElementBasedSkills(), this.getItemBasedSkills());
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
            if (!dataWithoutConditionIds.includes(itemsOfType[index].item.id)) {
                dataWithoutConditionIds.push(itemsOfType[index].item.id);
            }
        }
        var tempResult = itemsOfType.slice();
        var dataWithConditionKeyAlreadyAddedOwned = [];
        var dataWithConditionKeyAlreadyAddedNotOwned = [];
        for (var index = 0, len = this.dataWithCondition.length; index < len; index++) {
            var entry = this.dataWithCondition[index];
            var item = entry.item;
            if (item.type == type && ((entry.owned && !dataWithConditionKeyAlreadyAddedOwned.includes(item.id)) || (!entry.owned && !dataWithConditionKeyAlreadyAddedNotOwned.includes(item.id))))  {
                var allFound = true;
                for (var conditionIndex in item.equipedConditions) {
                    if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                        allFound = false;
                        break;
                    }
                }
                if (allFound) {
                    if (dataWithoutConditionIds && dataWithoutConditionIds.includes(entry.item.id)) {
                        // If we add a condition items that have a none conditioned version alreadty selected, remove that second version
                        for (var alreadyAddedIndex = tempResult.length; alreadyAddedIndex--;) {
                            if (tempResult[alreadyAddedIndex].item.id == entry.item.id) {
                                tempResult.splice(alreadyAddedIndex,1);
                                break;    
                            }
                        }
                    }

                    tempResult.push(entry);
                    if (entry.owned) {
                        dataWithConditionKeyAlreadyAddedOwned.push(item.id);    
                    } else {
                        dataWithConditionKeyAlreadyAddedNotOwned.push(item.id);    
                    }
                    

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
        var includeSingleWielding = !typeCombination[0] || !typeCombination[1];
        var includeDualWielding = typeCombination[0] && typeCombination[1] && weaponList.includes(typeCombination[0]) && weaponList.includes(typeCombination[1]);
        var fixedString = "";
        for (var i = 0; i < fixedItems.lenght; i++) {
            if (fixedItems[i]) {
                fixedString += ' - ' + fixedItems[i].name;
            }
        }
        var resultTree =  ItemTreeComparator.sort(tempResult, numberNeeded, this._unitBuild, this.ennemyStats, this.desirableElements, this.desirableItemIds, typeCombination, includeSingleWielding, includeDualWielding);
        return resultTree;
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
    
    getItemBasedSkills() {
        var itemBasedSkills = [];
        for (var skillIndex = this._unitBuild.unit.skills.length; skillIndex--;) {
            var skill = this._unitBuild.unit.skills[skillIndex];
            if (skill.equipedConditions) {
                for (var conditionIndex in skill.equipedConditions) {
                    if (!elementList.includes(skill.equipedConditions[conditionIndex]) && !typeList.includes(skill.equipedConditions[conditionIndex])) {
                        itemBasedSkills.push(skill);
                        break;
                    }
                }
            }
        }
        return itemBasedSkills;
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
    
    
    
    findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills, itemBasedSkills) {
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
            this.tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index], fixedItems,elementBasedSkills, itemBasedSkills);
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
                        this.tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills, itemBasedSkills);
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
                    this.tryItem(index, build, typeCombination, dataWithConditionItems, {"name":"Any " + typeCombination[index],"type":typeCombination[index], "placeHolder":true}, fixedItems, elementBasedSkills, itemBasedSkills);
                }
                build[index] == null;
            } else {
                var item = null;
                if (typeCombination[index]) {
                    item = {"name":"Any " + typeCombination[index],"type":typeCombination[index], "placeHolder":true};
                }
                this.tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills, itemBasedSkills);
            }
        }
        build[index] = null;
    }

    tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills, itemBasedSkills) {
        if (index == 0 && item && isTwoHanded(item) && typeCombination[1]) {
            return; // Two handed weapon only accepted on DH builds
        }
        if (index == 1 && !item && typeCombination[1]) {
            return; // don't accept null second hand in DW builds
        }
        build[index] = item;
        if (index == 9) {
            for (var fixedItemIndex = 0; fixedItemIndex < 10; fixedItemIndex++) {
                if (fixedItems[fixedItemIndex] && (!this.allItemVersions[fixedItems[fixedItemIndex].id] || this.allItemVersions[fixedItems[fixedItemIndex].id].length > 1 || fixedItems[fixedItemIndex].access.includes("Conditions not met"))) {
                    build[fixedItemIndex] = findBestItemVersion(build, fixedItems[fixedItemIndex], this.allItemVersions, this._unitBuild.unit);
                }
            }
            if (itemBasedSkills.length > 0) {
                // all set, try item based skills
                var equipedItemsIds = [];
                for (var i = 0; i < 9; i++) {
                    if (build[i] && !equipedItemsIds.includes(build[i].id)) {
                        equipedItemsIds.push(build[i].id);
                    }
                }
                for (var skillIndex = itemBasedSkills.length; skillIndex--;) {
                    if (build.includes(itemBasedSkills[skillIndex])) {
                        if (!areConditionOK(itemBasedSkills[skillIndex], build)) {
                            build.splice(build.indexOf(itemBasedSkills[skillIndex]),1);
                        }
                    } else if (areConditionOK(itemBasedSkills[skillIndex], build)){
                        build.push(itemBasedSkills[skillIndex]);
                    }
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
            this.findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills, itemBasedSkills);
        }
    }

    tryEsper(build, esper) {
        build[10] = esper;
        var value = calculateBuildValueWithFormula(build, this._unitBuild, this.ennemyStats, this._unitBuild.formula, this.goalVariation);
        if ((value != -1 && this._unitBuild.buildValue[this.goalVariation] == -1) || value[this.goalVariation] > this._unitBuild.buildValue[this.goalVariation]) {
            this._unitBuild.build = build.slice();
            if (value.switchWeapons) {
                var tmp = this._unitBuild.build[0];
                this._unitBuild.build[0] = this._unitBuild.build[1];
                this._unitBuild.build[1] = tmp;       
            }
            this._unitBuild.buildValue = value;
            this.betterBuildFoundCallback(this._unitBuild.build, this._unitBuild.buildValue);
        }
    }
}