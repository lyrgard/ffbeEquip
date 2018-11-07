class BuildOptimizer {
    constructor(allItemVersions) {
        this.allItemVersions = allItemVersions;
        this.goalVariation = "avg";
        this._alreadyUsedEspers = [];
    }
    
    set unitBuild(unitBuild) {
        this._unitBuild = unitBuild;
        this.desirableElements = [];
        this.desirableItemIds = [];
        for (var index = 0, len = this._unitBuild.unit.skills.length; index < len; index++) {
            var skill = this._unitBuild.unit.skills[index];
            if (skill.equipedConditions) {
                for (var i = skill.equipedConditions.length; i--;) {
                    if (!elementList.includes(skill.equipedConditions[i]) && !typeList.includes(skill.equipedConditions[i])) {
                        if (!this._unitBuild.fixedItemsIds.includes(skill.equipedConditions[i]) && !this.desirableItemIds.includes(skill.equipedConditions[i])) {
                            this.desirableItemIds.push(skill.equipedConditions[i]);            
                        }
                    }
                }
            }
        }
    }
    
    set alreadyUsedEspers(alreadyUsedEspers) {
        this._alreadyUsedEspers = alreadyUsedEspers;
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
                if (this.areConditionOKBasedOnTypeCombination(skill, typeCombinations[index].combination, this._unitBuild._level)) {
                    applicableSkills.push(skill);
                }
            }
            
            if (this.useEspers) {
                this.selectedEspers = this.selectEspers(this._alreadyUsedEspers, this.ennemyStats, typeCombinations[index].combination);
            } else {
                this.selectedEspers = [];
            }
            
            var build = [null, null, null, null, null, null, null, null, null, null,null].concat(applicableSkills);
            this.findBestBuildForCombination(0, build, typeCombinations[index].combination, dataWithdConditionItems, typeCombinations[index].fixedItems, this.getElementBasedSkills(), this.getItemBasedSkills());
        }
    }
    
    selectEspers(alreadyUsedEspers, ennemyStats, typeCombination) {
        var selectedEspers = [];
        let espersToUse = {};
        Object.keys(this.espers).forEach(name => {
            let e = this.espers[name];
            if (e.conditional && e.conditional.some(c => typeCombination.includes(c.equipedCondition))) {
                e = JSON.parse(JSON.stringify(e));
                e.conditional.filter(c => typeCombination.includes(c.equipedCondition)).forEach(c => {
                   baseStats.forEach(s => {
                       if (c[s+'%']) {
                           addToStat(e, s+'%', c[s+'%']);
                       }
                   }) 
                });
            }
            espersToUse[name] = e;
        })
        var keptEsperRoot = EsperTreeComparator.sort(espersToUse, alreadyUsedEspers, this._unitBuild.involvedStats, ennemyStats);
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
        var skillsIds = getSkillIds(this._unitBuild.formula) || [];
        var itemPool = new ItemPool(numberNeeded, this._unitBuild.involvedStats, this.ennemyStats, this.desirableElements, this.desirableItemIds, skillsIds, includeSingleWielding, includeDualWielding);
        for (var i = tempResult.length; i--;) {
            var entry = tempResult[i];
            if (weaponList.includes(type) && (typeCombination[1] || this._unitBuild.fixedItems[0] || this._unitBuild.fixedItems[1]) && isTwoHanded(entry.item) ) {
                continue; // ignore 2 handed weapon if we are in a DW build, or a weapon was already fixed
            }
            itemPool.addItem(entry);    
        }
        
        itemPool.prepare();
        /*var resultTree =  ItemTreeComparator.sort(tempResult, numberNeeded, this._unitBuild, this.ennemyStats, this.desirableElements, this.desirableItemIds, typeCombination, includeSingleWielding, includeDualWielding);
        return resultTree;*/
        return itemPool;
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
    
    areConditionOKBasedOnTypeCombination(item, typeCombination, level) {
        if (level && item.levelCondition && item.levelCondition > level) {
            return false;
        }
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
            if (typeCombination[index]) {
                var itemPool = dataWithConditionItems[typeCombination[index]];
                var foundAnItem = false;
                for (var i = itemPool.keptItems.length; i--;) {
                    if (itemPool.keptItems[i].active) {
                        var item = itemPool.take(i);
                        this.tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills, itemBasedSkills);
                        itemPool.putBack(i);
                        foundAnItem = true;
                    }
                }
            
                if (!foundAnItem) {
                    this.tryItem(index, build, typeCombination, dataWithConditionItems, {"name":"Any " + typeCombination[index],"type":typeCombination[index], "placeHolder":true}, fixedItems, elementBasedSkills, itemBasedSkills);
                }
                build[index] == null;
            } else {
                this.tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills, itemBasedSkills);
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
                this.tryEsper(build, fixedItems[10], fixedItems);
            } else {
                if (this.selectedEspers.length > 0) {
                    for (var esperIndex = 0, len = this.selectedEspers.length; esperIndex < len; esperIndex++) {
                        this.tryEsper(build, this.selectedEspers[esperIndex], fixedItems)  
                    }
                } else {
                    this.tryEsper(build, null, fixedItems);
                }
            }
        } else {
            this.findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills, itemBasedSkills);
        }
    }

    tryEsper(build, esper, fixedItems) {
        build[10] = esper;
        var value = calculateBuildValueWithFormula(build, this._unitBuild, this.ennemyStats, this._unitBuild.formula, this.goalVariation, this.useNewJpDamageFormula);
        if ((value != -1 && this._unitBuild.buildValue[this.goalVariation] == -1) || value[this.goalVariation] > this._unitBuild.buildValue[this.goalVariation]) {
            
            var slotsRemoved = this.tryLessSlots(build, value, this._unitBuild.fixedItems, fixedItems);
            
            this._unitBuild.build = build.slice();
            if (value.switchWeapons) {
                var tmp = this._unitBuild.build[0];
                this._unitBuild.build[0] = this._unitBuild.build[1];
                this._unitBuild.build[1] = tmp;       
            }
            this._unitBuild.buildValue = value;
            this._unitBuild.freeSlots = slotsRemoved;
            this.betterBuildFoundCallback(this._unitBuild.build, this._unitBuild.buildValue, slotsRemoved);
        } else if ((value != -1 && this._unitBuild.buildValue[this.goalVariation] == -1) || value[this.goalVariation] == this._unitBuild.buildValue[this.goalVariation]) {
            var slotsRemoved = this.tryLessSlots(build, value, this._unitBuild.fixedItems, fixedItems);
            
            if (slotsRemoved > this._unitBuild.freeSlots) {
                this._unitBuild.build = build.slice();
                if (value.switchWeapons) {
                    var tmp = this._unitBuild.build[0];
                    this._unitBuild.build[0] = this._unitBuild.build[1];
                    this._unitBuild.build[1] = tmp;       
                }
                this._unitBuild.buildValue = value;
                this.betterBuildFoundCallback(this._unitBuild.build, this._unitBuild.buildValue, slotsRemoved);
            } else {
                var hpOld = calculateStatValue(this._unitBuild.build, "hp", this._unitBuild);
                var hpNew = calculateStatValue(build, "hp", this._unitBuild);
                if (hpNew.total > hpOld.total) {
                    this._unitBuild.build = build.slice();
                    if (value.switchWeapons) {
                        var tmp = this._unitBuild.build[0];
                        this._unitBuild.build[0] = this._unitBuild.build[1];
                        this._unitBuild.build[1] = tmp;       
                    }
                    this._unitBuild.buildValue = value;
                    this.betterBuildFoundCallback(this._unitBuild.build, this._unitBuild.buildValue, slotsRemoved);
                }
            }
        }
    }
    
    tryLessSlots(build, value, alreadyfixedItems, forcedItems) {
        var slotToRemove = 9;
        var slotsRemoved = 0;
        slotToRemoveLoop: while(slotToRemove > 5) {
            if (!build[slotToRemove]) {
                slotToRemove--;
                slotsRemoved++;
                continue;
            }
            if (alreadyfixedItems[slotToRemove] || forcedItems[slotToRemove]) {
                slotToRemove--;
                continue;
            }
            for (var skillIndex = build.length - 1; skillIndex > 10; skillIndex--) {
                if (build[skillIndex].equipedConditions && build[skillIndex].equipedConditions.includes(build[slotToRemove].id)) {
                    slotToRemove--;
                    continue slotToRemoveLoop;
                }
            }
            var removedItem = build[slotToRemove];
            build[slotToRemove] = null;
            
            var testValue = calculateBuildValueWithFormula(build, this._unitBuild, this.ennemyStats, this._unitBuild.formula, this.goalVariation);
            if (testValue[this.goalVariation] >= value[this.goalVariation]) {
                slotToRemove--;
                slotsRemoved++;
            } else {
                build[slotToRemove] = removedItem;
                slotToRemove = -1;
            }
        }
        return slotsRemoved;
    }
}