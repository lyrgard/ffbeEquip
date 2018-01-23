class TypeCombinationGenerator {
    constructor(forceDoubleHand, forceDualWield, unitBuild, dualWieldSources, equipSources, dataByType) {
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
        this.tryEquipSources = true;
    }
    
    generateTypeCombinations() {
        var combinations = [];
        var typeCombination = [null, null, null, null, null, null, null, null, null, null];
        this.buildTypeCombination(0,typeCombination, combinations);

        var unitPartialDualWield = this.unitBuild.getPartialDualWield();
        if (!this.forceDoubleHand && unitPartialDualWield && (!this.unitBuild.fixedItems[0] || unitPartialDualWield.includes(this.unitBuild.fixedItems[0].type))) { // Only try partial dual wield if no weapon fixed, or one weapon fixed of the partial dual wield type
            var savedEquipable0 = this.unitBuild.equipable[0];
            var savedEquipable1 = this.unitBuild.equipable[1];

            this.unitBuild.equipable[0] = unitPartialDualWield;
            this.unitBuild.equipable[1] = unitPartialDualWield;
            this.buildTypeCombination(0,typeCombination,combinations);

            this.unitBuild.equipable[0] = savedEquipable0;
            this.unitBuild.equipable[1] = savedEquipable1;
        }
        if (!this.forceDoubleHand && !this.unitBuild.hasDualWield() && this.dualWieldSources.length > 0 && !(this.unitBuild.fixedItems[0] && isTwoHanded(this.unitBuild.fixedItems[0]))) {
            var savedForceDualWield = this.forceDualWield;
            this.forceDualWield = true;
            for (var dualWieldSourceIndex = this.dualWieldSources.length; dualWieldSourceIndex--;) {
                var item = this.dualWieldSources[dualWieldSourceIndex];
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
                        if (unitPartialDualWield) {
                            this.unitBuild.equipable[1] = mergeArrayWithoutDuplicates(this.unitBuild.equipable[1], unitPartialDualWield);
                        }
                    } else {
                        this.unitBuild.equipable[1] = this.unitBuild.equipable[0];
                    }
                    this.buildTypeCombination(0,typeCombination,combinations);
                    this.unitBuild.fixedItems = savedFixedItems;
                    this.unitBuild.equipable[0] = savedEquipable0;
                    this.unitBuild.equipable[1] = savedEquipable1;
                }
            }
            this.forceDualWield = savedForceDualWield;
        }
        return combinations;
    }
    
/*    tryEquipSources(combinations) {
        var alreadyAddedCombinations = [];
        for (var index = 0, len = combinations.length; index < len; index++) {
            var combination = combinations[index];
            for (var equipSourceIndex, lenEquipSource = this.equipSources.length; equipSourceIndex < lenEquipSource; equipSourceIndex++) {
                var equipSource = this.tryEquipSources[equipSourceIndex];
                if (shieldList.includes(equipSource.allowUseOf)) {
                    if (!combination.combination[1] || )
                    typeCombination = combination.combination.slice();
                    
                }
                combinations.push({"combination": typeCombination.slice(), "fixedItems": this.unitBuild.fixedItems});
            }
        }
    }*/
    
    buildTypeCombination(index, typeCombination, combinations) {
        if (stop) {
            return;
        }
        if (this.unitBuild.fixedItems[index]) {
            if (this.unitBuild.equipable[index].length > 0 && this.unitBuild.equipable[index].includes(this.unitBuild.fixedItems[index].type)) {
                this.tryType(index, typeCombination, this.unitBuild.fixedItems[index].type, combinations);
            } else {
                return;
            }
        } else {
            if (this.unitBuild.equipable[index].length > 0) {
                if (index == 1 && 
                        ((this.unitBuild.fixedItems[0] && isTwoHanded(this.unitBuild.fixedItems[0])) 
                        || this.forceDoubleHand)) { // if a two-handed weapon was fixed, no need to try smething in the second hand
                    this.tryType(index, typeCombination, null, combinations);
                } else {
                    var found = false;
                    for (var typeIndex = 0, len = this.unitBuild.equipable[index].length; typeIndex < len; typeIndex++) {
                        var type = this.unitBuild.equipable[index][typeIndex]
                        if (index == 1 && !this.unitBuild.fixedItems[0] && this.alreadyTriedInSlot0(type, typeCombination[0], this.unitBuild.equipable[0])) {
                            continue;
                        }
                        if (this.dataByType[type].length > 0) {
                            this.tryType(index, typeCombination, type, combinations);
                            found = true;
                        }
                    }
                    if (!found) {
                        this.tryType(index, typeCombination, null, combinations);
                    } else if (index == 1 && !this.forceDualWield) {
                        this.tryType(index, typeCombination, null, combinations);
                    }
                }
            } else {
                this.tryType(index, typeCombination, null, combinations);
            }
            if (index == 0) {
                console.log("!!");
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
                                var saveEquipable = this.unitBuild.equipable[index];
                                this.unitBuild.fixedItems[slot] = equipSource;
                                this.unitBuild.equipable[index] = this.unitBuild.equipable[index].concat([typeToTry]);
                                this.tryType(index, typeCombination, typeToTry, combinations);
                                this.unitBuild.fixedItems[slot] = null;
                                this.unitBuild.equipable[index] = saveEquipable;
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
            typesToTry = [];// TODO
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

    tryType(index, typeCombination, type, combinations) {
        if (index == 1 && this.forceDualWield && (type == null || !weaponList.includes)) {
            return;
        }
        typeCombination[index] = type;
        if (index == 9) {
            combinations.push({"combination": typeCombination.slice(), "fixedItems": this.unitBuild.fixedItems});
        } else {
            this.buildTypeCombination(index+1, typeCombination, combinations);
        }
    }
}