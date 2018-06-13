class TypeCombinationGenerator {
    constructor(forceDoubleHand, forceDualWield, tryEquipSources, unitBuild, dualWieldSources, equipSources, dataByType, weaponsByTypeAndHands) {
        this.forceDoubleHand = forceDoubleHand;
        this.forceDualWield = forceDualWield;
        this.unitBuild = unitBuild;
        this.dualWieldSources = dualWieldSources;
        this.equipSourcesByType = {};
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
    
   
    
    generateTypeCombinations() {
        var combinations = [];
        var typeCombination = [null, null, null, null, null, null, null, null, null, null];
        this.buildTypeCombination(0,typeCombination, combinations, []);

        var unitPartialDualWield = this.unitBuild.getPartialDualWield();
        if (!this.forceDoubleHand && unitPartialDualWield && (!this.unitBuild.fixedItems[0] || unitPartialDualWield.includes(this.unitBuild.fixedItems[0].type))) { // Only try partial dual wield if no weapon fixed, or one weapon fixed of the partial dual wield type
            var savedEquipable0 = this.unitBuild.equipable[0];
            var savedEquipable1 = this.unitBuild.equipable[1];

            this.unitBuild.equipable[0] = unitPartialDualWield;
            this.unitBuild.equipable[1] = unitPartialDualWield;
            this.buildTypeCombination(0,typeCombination,combinations, []);

            this.unitBuild.equipable[0] = savedEquipable0;
            this.unitBuild.equipable[1] = savedEquipable1;
        }
        if (!this.forceDoubleHand && !this.unitBuild.hasDualWield() && this.dualWieldSources.length > 0 && !(this.unitBuild.fixedItems[0] && isTwoHanded(this.unitBuild.fixedItems[0]))) {
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
                        this.buildTypeCombination(0,typeCombination,combinations, [item.id]);
                        this.unitBuild.fixedItems = savedFixedItems;
                        this.unitBuild.equipable[0] = savedEquipable0;
                        this.unitBuild.equipable[1] = savedEquipable1;
                    }
                }
            }
            this.forceDualWield = savedForceDualWield;
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
                        var type = this.unitBuild.equipable[index][typeIndex]
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
                                this.tryType(index, typeCombination, typeToTry, combinations, forcedItems.concat([equipSource.id]));
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
            if (this.unitBuild.hasDualWield()) {
                typesToTry = weaponList.filter(function(type) {
                    return !self.unitBuild.equipable[index].includes(type);
                });
            } else {
                typesToTry = shieldList.filter(function(type) {
                    return !self.unitBuild.equipable[index].includes(type);
                });
            }
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
        if (index == 1 && this.forceDualWield && (type == null || !weaponList.includes(type))) {
            return;
        }
        typeCombination[index] = type;
        if (index == 9) {
            combinations.push({"combination": typeCombination.slice(), "fixedItems": this.unitBuild.fixedItems, "forcedItems": forcedItems});
        } else {
            this.buildTypeCombination(index+1, typeCombination, combinations, forcedItems);
        }
    }
}