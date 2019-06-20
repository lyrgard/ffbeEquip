class TypeCombinationGenerator {
    constructor(forceDoubleHand, forceDualWield, tryEquipSources, unitBuild, dualWieldSources, equipSources, dataByType, weaponsByTypeAndHands, forceTmrAbility = false) {
        this.forceDoubleHand = forceDoubleHand;
        this.forceDualWield = forceDualWield;
        this.unitBuild = unitBuild;
        this.dualWieldSources = dualWieldSources;
        this.equipSourcesByType = {};
        this.forceTmrAbility = forceTmrAbility;
        for (var index = equipSources.length; index --;) {
            if (!this.equipSourcesByType[equipSources[index].allowUseOf]) {
                this.equipSourcesByType[equipSources[index].allowUseOf] = [];
            }
            this.equipSourcesByType[equipSources[index].allowUseOf].push(equipSources[index]);
        }
        this.dataByType = dataByType;
        this.weaponsByTypeAndHands = weaponsByTypeAndHands;
        this.tryEquipSources = tryEquipSources;
    }
    
   
    
    generateTypeCombinations(forcedItem) {
        var combinations = [];

        if (this.forceTmrAbility && !forcedItem) {
            if (dataStorage.availableTmr) {
                combinations = combinations.concat(this.generateTypeCombinations(dataStorage.availableTmr));
            }
            if (dataStorage.availableStmr) {
                combinations = combinations.concat(this.generateTypeCombinations(dataStorage.availableStmr));
            }
            return combinations;
        }

        let baseForcedItems;
        let forcedItemSlot = -1;
        if (!forcedItem) {
            baseForcedItems = [];
        } else {
            forcedItemSlot = this.unitBuild.getItemSlotFor(forcedItem, this.forceDoubleHand);
            if (forcedItemSlot == -1) {
                return [];
            } else {
                this.unitBuild.fixedItems = this.unitBuild.fixedItems.slice();
                this.unitBuild.fixedItems[forcedItemSlot] = forcedItem;
            }
            baseForcedItems = [forcedItem];
        }

        var typeCombination = [null, null, null, null, null, null, null, null, null, null];
        this.buildTypeCombination(0,typeCombination, combinations, baseForcedItems);
        this.unitBuild.build.splice(0, 11, ...(this.unitBuild.fixedItems));
        
        if (!this.unitBuild.build[0] 
            && !this.unitBuild.build[1] 
            && this.unitBuild.unit.skills.some(skill => skill.equipedConditions && skill.equipedConditions.includes("unarmed"))) {
            // If no weapons are pinned and the unit has an "unarmed" passive, try combinations without weapons
            this.buildTypeCombination(2,[null, null, null, null, null, null, null, null, null, null], combinations, baseForcedItems);
        }

        var unitPartialDualWield = this.unitBuild.getPartialDualWield();
        if (!this.forceDoubleHand && unitPartialDualWield && (!this.unitBuild.fixedItems[0] || unitPartialDualWield.includes(this.unitBuild.fixedItems[0].type))) { // Only try partial dual wield if no weapon fixed, or one weapon fixed of the partial dual wield type
            var savedEquipable0 = this.unitBuild.equipable[0];
            var savedEquipable1 = this.unitBuild.equipable[1];

            this.unitBuild.equipable[0] = unitPartialDualWield;
            this.unitBuild.equipable[1] = unitPartialDualWield;
            this.buildTypeCombination(0,typeCombination,combinations, baseForcedItems);

            this.unitBuild.equipable[0] = savedEquipable0;
            this.unitBuild.equipable[1] = savedEquipable1;
        }
        if (!this.forceDoubleHand && !this.unitBuild.hasDualWield() && !(this.unitBuild.fixedItems[0] && isTwoHanded(this.unitBuild.fixedItems[0]))) {
            // If TMR grants DW
            var tmr = dataStorage.availableTmr;
            if (tmr && this.unitBuild.hasDualWieldIfItemEquiped(tmr.id)) {
                var savedForceDualWield = this.forceDualWield;
                this.forceDualWield = true;
                var slot = this.unitBuild.getItemSlotFor(tmr, this.forceDoubleHand);
                if (slot != -1) {
                    this.dataByType[tmr.type].filter(entry => entry.item.id == tmr.id).forEach(tmrVersion => {
                        var savedFixedItems = this.unitBuild.fixedItems;
                        this.unitBuild.fixedItems = this.unitBuild.fixedItems.slice();
                        this.unitBuild.fixedItems[slot] = tmrVersion.item;
                        var savedEquipable0 = this.unitBuild.equipable[0];
                        var savedEquipable1 = this.unitBuild.equipable[1];

                        this.unitBuild.equipable[1] = this.unitBuild.equipable[0];

                        let forcedItems;
                        if (baseForcedItems.map(i => i.id).includes(tmr.id)) {
                            forcedItems = baseForcedItems;
                        } else {
                            forcedItems = baseForcedItems.concat([tmr]);
                        }

                        this.buildTypeCombination(0,typeCombination,combinations, forcedItems);
                        this.unitBuild.fixedItems = savedFixedItems;
                        this.unitBuild.equipable[0] = savedEquipable0;
                        this.unitBuild.equipable[1] = savedEquipable1;
                    });
                }
                this.forceDualWield = savedForceDualWield;
            }
            
            // If STMR grants DW
            var stmr = dataStorage.availableStmr;
            if (stmr && this.unitBuild.hasDualWieldIfItemEquiped(stmr.id)) {
                var savedForceDualWield = this.forceDualWield;
                this.forceDualWield = true;
                var slot = this.unitBuild.getItemSlotFor(stmr, this.forceDoubleHand);
                if (slot != -1) {
                    this.dataByType[stmr.type].filter(entry => entry.item.id == stmr.id).forEach(stmrVersion => {
                        var savedFixedItems = this.unitBuild.fixedItems;
                        this.unitBuild.fixedItems = this.unitBuild.fixedItems.slice();
                        this.unitBuild.fixedItems[slot] = stmrVersion.item;
                        var savedEquipable0 = this.unitBuild.equipable[0];
                        var savedEquipable1 = this.unitBuild.equipable[1];

                        this.unitBuild.equipable[1] = this.unitBuild.equipable[0];

                        let forcedItems;
                        if (baseForcedItems.map(i => i.id).includes(stmr.id)) {
                            forcedItems = baseForcedItems;
                        } else {
                            forcedItems = baseForcedItems.concat([stmr]);
                        }

                        this.buildTypeCombination(0,typeCombination,combinations, forcedItems);
                        this.unitBuild.fixedItems = savedFixedItems;
                        this.unitBuild.equipable[0] = savedEquipable0;
                        this.unitBuild.equipable[1] = savedEquipable1;
                    });
                }
                this.forceDualWield = savedForceDualWield;
            }
            
            if (this.dualWieldSources.length > 0) {
                var savedForceDualWield = this.forceDualWield;
                this.forceDualWield = true;
                var equipableList = this.unitBuild.getCurrentUnitEquip();
                for (var dualWieldSourceIndex = this.dualWieldSources.length; dualWieldSourceIndex--;) {
                    var item = this.dualWieldSources[dualWieldSourceIndex];
                    if (equipableList.includes(item.type)) {
                        var slot = this.unitBuild.getItemSlotFor(item, this.forceDoubleHand);
                        if (slot != -1) {   
                            var savedFixedItems = this.unitBuild.fixedItems;
                            this.unitBuild.fixedItems = this.unitBuild.fixedItems.slice();
                            this.unitBuild.fixedItems[slot] = item;
                            var savedEquipable0 = this.unitBuild.equipable[0];
                            var savedEquipable1 = this.unitBuild.equipable[1];
                            if (item.partialDualWield) {
                                this.unitBuild.equipable[0] = item.partialDualWield;
                                this.unitBuild.equipable[1] = item.partialDualWield;
                            } else {
                                this.unitBuild.equipable[1] = this.unitBuild.equipable[0];
                            }

                            let forcedItems;
                            if (baseForcedItems.map(i => i.id).includes(item.id)) {
                                forcedItems = baseForcedItems;
                            } else {
                                forcedItems = baseForcedItems.concat([item]);
                            }

                            this.buildTypeCombination(0,typeCombination,combinations, forcedItems);
                            this.unitBuild.fixedItems = savedFixedItems;
                            this.unitBuild.equipable[0] = savedEquipable0;
                            this.unitBuild.equipable[1] = savedEquipable1;
                        }
                    }
                }
                this.forceDualWield = savedForceDualWield;
            }
        }

        if (forcedItemSlot != -1) {
            this.unitBuild.fixedItems[forcedItemSlot] = null;
        }
        return combinations;
    }
    
    buildTypeCombination(index, typeCombination, combinations, forcedItems) {
        if (this.unitBuild.fixedItems[index]) {
            if (this.unitBuild.fixedItems[index].type == "unavailable") {
                this.tryType(index, typeCombination, null, combinations, forcedItems);
            } else if (this.unitBuild.equipable[index].length > 0 && this.unitBuild.equipable[index].includes(this.unitBuild.fixedItems[index].type)) {
                this.tryType(index, typeCombination, this.unitBuild.fixedItems[index].type, combinations, forcedItems);
            } else {
                return;
            }
        } else {
            if (this.unitBuild.equipable[index].length > 0) {
                if (index == 1 && 
                        ((this.unitBuild.fixedItems[0] && isTwoHanded(this.unitBuild.fixedItems[0])) 
                        || this.forceDoubleHand)) { // if a two-handed weapon was fixed, no need to try smething in the second hand
                    this.tryType(index, typeCombination, null, combinations, forcedItems);
                } else {
                    var found = false;
                    for (var typeIndex = 0, len = this.unitBuild.equipable[index].length; typeIndex < len; typeIndex++) {
                        var type = this.unitBuild.equipable[index][typeIndex];
                        if (index == 1 && !this.unitBuild.fixedItems[0] && this.alreadyTriedInSlot0(type, typeCombination[0], this.unitBuild.equipable[0])) {
                            continue;
                        }
                        if (this.dataByType[type].length > 0) {
                            this.tryType(index, typeCombination, type, combinations, forcedItems);
                            found = true;
                        }
                    }
                    if (!found) {
                        this.tryType(index, typeCombination, null, combinations, forcedItems);
                    } else if (index == 1 && !this.forceDualWield) {
                        this.tryType(index, typeCombination, null, combinations, forcedItems);
                    }
                }
            } else {
                this.tryType(index, typeCombination, null, combinations, forcedItems);
            }
            if (this.tryEquipSources && index < 4 ) {
                var typesToTry = this.getEquipSourceToTry(index);
                for (var typeIndex = 0, lenType = typesToTry.length; typeIndex < lenType; typeIndex++) {
                    var typeToTry = typesToTry[typeIndex];
                    if (this.equipSourcesByType[typeToTry]) {
                        for (var equipSourceIndex = 0, lenEquipSources = this.equipSourcesByType[typeToTry].length; equipSourceIndex < lenEquipSources; equipSourceIndex++) {
                            var equipSource = this.equipSourcesByType[typeToTry][equipSourceIndex];
                            var slot = this.unitBuild.getItemSlotFor(equipSource, this.forceDoubleHand);
                            if (slot >= 0) {
                                var savedEquipable = this.unitBuild.equipable[index];
                                var savedEquipable1; 
                                if (index == 0 && this.unitBuild.hasDualWield()) {
                                    savedEquipable1 = this.unitBuild.equipable[1];
                                    this.unitBuild.equipable[1] = this.unitBuild.equipable[1].concat([typeToTry]);
                                }
                                var savedFixedItems = this.unitBuild.fixedItems;
                                this.unitBuild.fixedItems = this.unitBuild.fixedItems.slice();
                                this.unitBuild.fixedItems[slot] = equipSource;
                                this.unitBuild.equipable[index] = this.unitBuild.equipable[index].concat([typeToTry]);
                                this.tryType(index, typeCombination, typeToTry, combinations, forcedItems.concat([equipSource]));
                                this.unitBuild.fixedItems = savedFixedItems;
                                this.unitBuild.equipable[index] = savedEquipable;
                                if (index == 0 && this.unitBuild.hasDualWield()) {
                                    this.unitBuild.equipable[1] = savedEquipable1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    getEquipSourceToTry(index) {
        var typesToTry;
        var self = this;
        if (index == 0) {
            typesToTry = weaponList.filter(function(type) {
                return !self.unitBuild.equipable[index].includes(type);
            });
        } else if (index == 1) {
            typesToTry = [];
            if (this.unitBuild.hasDualWield()) {
                typesToTry = weaponList.filter(function(type) {
                    return !self.unitBuild.equipable[index].includes(type);
                });
            } 
            typesToTry = typesToTry.concat(shieldList.filter(function(type) {
                return !self.unitBuild.equipable[index].includes(type);
            }));
        } else if (index == 2) {
            typesToTry = headList.filter(function(type) {
                return !self.unitBuild.equipable[index].includes(type);
            });
        } else if (index == 3) {
            
            typesToTry = bodyList.filter(function(type) {
                return !self.unitBuild.equipable[index].includes(type);
            });
        }
        return typesToTry;
    }
    
    alreadyTriedInSlot0(type, typeSlot0, equipableSlot0) {
        if (type == typeSlot0) {
            return false;
        }
        var indexOfTypeSlot0 = equipableSlot0.indexOf(typeSlot0);
        if (indexOfTypeSlot0 >= 0) {
            for (var index = 0; index <= indexOfTypeSlot0; index++) {
                if (equipableSlot0[index] == type) {
                    return true;
                }
            }
        }
        return false;
    }

    tryType(index, typeCombination, type, combinations, forcedItems) {
        if (index == 1 && this.forceDualWield && (type == null || !weaponList.includes(type))) { // if force dualwield, need 2 weapons
            return;
        }
        if (index == 1 && weaponList.includes(type) && weaponList.includes(typeCombination[0])) {
            
            if (!this.weaponsByTypeAndHands[typeCombination[0]][1]) {
                if (!this.unitBuild.fixedItems[0] || this.unitBuild.fixedItems[0].special && this.unitBuild.fixedItems[0].special.includes("twoHanded")) {
                    return;    
                }
            }
            if (!this.weaponsByTypeAndHands[type][1] ) {
                if (!this.unitBuild.fixedItems[1] || this.unitBuild.fixedItems[1].special && this.unitBuild.fixedItems[1].special.includes("twoHanded")) {
                    return;    
                }
            }
        }
        if (index == 2 && forcedItems.length > 0) {
            let forcedHeadGear = forcedItems.map(i => i.type).filter(t => headList.includes(t)).filter(this.onlyUnique);
            if (forcedHeadGear.length > 1) {
                return; // impossible to have more that one type of forced head gear;
            }
            if (forcedHeadGear.length == 1 && !forcedHeadGear.includes(type)) {
                return; // impossible to try a head gear type different than the forced one
            }
        }

        if (index == 3 && forcedItems.length > 0) {
            let forcedBodyGear = forcedItems.map(i => i.type).filter(t => bodyList.includes(t)).filter(this.onlyUnique);
            if (forcedBodyGear.length > 1) {
                return; // impossible to have more that one type of forced body gear;
            }
            if (forcedBodyGear.length == 1 && !forcedBodyGear.includes(type)) {
                return; // impossible to try a body gear type different than the forced one
            }
        }
        typeCombination[index] = type;
        if (index == 9) {
            combinations.push({"combination": typeCombination.slice(), "fixedItems": this.unitBuild.fixedItems.slice(), "forcedItems": forcedItems.map(i => i.id)});
        } else {
            this.buildTypeCombination(index+1, typeCombination, combinations, forcedItems);
        }
    }

    onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }
}
