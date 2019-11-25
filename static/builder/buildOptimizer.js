class BuildOptimizer {
    constructor(allItemVersions, buildCounterUpdateCallback) {
        this.allItemVersions = allItemVersions;
        this.goalVariation = "avg";
        this._alreadyUsedEspers = [];
        this.buildCounter = 0;
        this.buildCounterUpdateCallback = buildCounterUpdateCallback;
    }
    
    const typeByIndex = {
        0: 'hand',
        1: 'hand',
        2: 'head',
        3: 'body',
        4: 'accessory',
        5: 'accessory',
        6: 'materia',
        7: 'materia',
        8: 'materia',
        9: 'materia'
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
                            if (Array.isArray(skill.equipedConditions[i])) {
                                this.desirableItemIds = this.desirableItemIds.concat(skill.equipedConditions[i]);
                            } else {
                                this.desirableItemIds.push(skill.equipedConditions[i]);
                            }        
                        }
                    }
                }
            }
        }
    }
    
    set itemPools(itemPools) {
        this._itemPools = itemPools;
    }
    
    set alreadyUsedEspers(alreadyUsedEspers) {
        this._alreadyUsedEspers = alreadyUsedEspers;
    }
    
    optimizeFor(betterBuildFoundCallback) {
        this.buildCounter = 0;
        this.elementalConditionItemsByType = {};
        this.betterBuildFoundCallback = betterBuildFoundCallback;
        
        var combinationsNumber = typeCombinations.length;
        for (var index = 0, len = combinationsNumber; index < len; index++) {

            var applicableSkills = [];
            for (var skillIndex = this._unitBuild.unit.skills.length; skillIndex--;) {
                var skill = this._unitBuild.unit.skills[skillIndex];
                applicableSkills.push(skill);
            }
            
            if (this.useEspers) {
                this.selectedEspers = this.selectEspers(this._alreadyUsedEspers, this.ennemyStats);
            } else {
                this.selectedEspers = [];
            }
            
            var build = [null, null, null, null, null, null, null, null, null, null,null].concat(applicableSkills);
            this.findBestBuild(10, build);
        }
        this.buildCounterUpdateCallback(this.buildCounter);
    }
    
    selectEspers(alreadyUsedEspers, ennemyStats) {
        var selectedEspers = [];
        let espersToUse = {};
        var keptEsperRoot = EsperTreeComparator.sort(espersToUse, alreadyUsedEspers, this._unitBuild.involvedStats, ennemyStats);
        for (var index = keptEsperRoot.children.length; index--;) {
            if (!selectedEspers.includes(keptEsperRoot.children[index])) {
                selectedEspers.push(keptEsperRoot.children[index].esper);
            }
        }
        this._unitBuild.unit.skills.filter(skill => skill.esperStatsBonus && Object.keys(skill.esperStatsBonus).some(esper => esper != 'all')).forEach(skill => {
            Object.keys(skill.esperStatsBonus)
                .filter(esper => esper != 'all')
                .filter(esperName => !alreadyUsedEspers.includes(esperName))
                .forEach(esperName => {
                if (!selectedEspers.includes(espersToUse[esperName])) {
                    selectedEspers.push(espersToUse[esperName]);
                }
            });
        });
        return selectedEspers;
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
    
    findBestBuild(index, build) {
        let restorePool;
        let savedItemPools;
        
        

        if (this._unitBuild.fixedItems[index]) {
            this.tryItem(index, build, this._unitBuild.fixedItems[index]);
        } else {
            let itemPool = this._itemPools[typeByIndex[index]];
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
                this.tryItem(index, build, null);
            }
            build[index] == null;
        }
        if (restorePool) {
            build[index] = null;
            dataWithConditionItems[typeCombination[2]] = savedItemPools[0];
            dataWithConditionItems[typeCombination[3]] = savedItemPools[1];
            dataWithConditionItems[typeCombination[4]] = savedItemPools[2];
            dataWithConditionItems[typeCombination[6]] = savedItemPools[3];
        }
    }

    tryItem(index, build, item) {
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
            this.findBestBuild(index - 1, build);
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
        this.buildCounter++;
        if (this.buildCounter >= 5000) {
            this.buildCounterUpdateCallback(this.buildCounter);
            this.buildCounter = 0;
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
            if (this.desirableItemIds.includes(build[slotToRemove].id)) {
                slotToRemove--;
                continue slotToRemoveLoop;
            }
            var removedItem = build[slotToRemove];
            build[slotToRemove] = null;
            
            var testValue = calculateBuildValueWithFormula(build, this._unitBuild, this.ennemyStats, this._unitBuild.formula, this.goalVariation, this.useNewJpDamageFormula);
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
