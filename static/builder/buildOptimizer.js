class BuildOptimizer {
    constructor(data, espers) {
        this.data = data;
        this.espers = espers;
    }
    
    set unitBuild(unitBuild) {
        this._unitBuild = unitBuild;
    }
    
    optimizeFor(typeCombinations, alreadyUsedItems, alreadyUsedEspers, dataWithCondition) {
        selectedEspers = selectEspers(alreadyUsedEspers);
        for (var index = 0, len = typeCombinations.length; index < len; index++) {

            var dataWithdConditionItems = {}
            for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
                if (typeCombinations[index].combination[slotIndex] && !dataWithdConditionItems[typeCombinations[index].combination[slotIndex]]) {
                    dataWithdConditionItems[typeCombinations[index].combination[slotIndex]] = addConditionItems(dataByType[typeCombinations[index].combination[slotIndex]], typeCombinations[index].combination[slotIndex], typeCombinations[index].combination, typeCombinations[index].fixedItems, dataWithCondition);
                }
            }
            var applicableSkills = [];
            for (var skillIndex = this._unitBuild.unit.skills.length; skillIndex--;) {
                var skill = this._unitBuild.unit.skills[skillIndex];
                if (this.areConditionOKBasedOnTypeCombination(skill, combinations[index].combination)) {
                    applicableSkills.push(skill);
                }
            }

            var build = [null, null, null, null, null, null, null, null, null, null,null].concat(applicableSkills);
            findBestBuildForCombination(0, build, typeCombinations[index].combination, dataWithdConditionItems, typeCombinations[index].fixedItems, this.getElementBasedSkills());
        }
    }
    
    selectEspers(alreadyUsedEspers) {
        var selectedEspers = [];
        var keptEsperRoot = EsperTreeComparator.sort(this.espers, alreadyUsedEspers);
        for (var index = keptEsperRoot.children.length; index--;) {
            if (!selectedEspers.includes(keptEsperRoot.children[index])) {
                selectedEspers.push(getEsperItem(keptEsperRoot.children[index].esper));
            }
        }
        return selectedEspers;
    }
    
    addConditionItems(itemsOfType, type, typeCombination, fixedItems, dataWithCondition) {
        var dataWithoutConditionIds = [];
        for (var index = itemsOfType.length; index--; ) {
            if (!dataWithoutConditionIds.includes(itemsOfType[index].id)) {
                dataWithoutConditionIds.push(itemsOfType[index].id);
            }
        }
        var tempResult = itemsOfType.slice();
        var dataWithConditionKeyAlreadyAdded = [];
        for (var index = 0, len = dataWithCondition.length; index < len; index++) {
            var entry = dataWithCondition[index];
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

        return ItemTreeComparator.sort(tempResult, numberNeeded, typeCombination, builds[currentUnitIndex]);
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
}