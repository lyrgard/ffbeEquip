class UnitBuild {
    constructor(unit, fixedItems) {
        this.unit = unit;
        this.fixedItems = fixedItems;
        this.equipable = this.prepareEquipable();
    }
    
    getInnatePartialDualWield() {
        for (var index = this.unit.skills.length; index--;) {
            if (this.unit.skills[index].partialDualWield) {
                return this.unit.skills[index].partialDualWield;
            }
        }
        for (var index = 0; index < 10; index++) {
            if (this.fixedItems[index] && this.fixedItems[index].partialDualWield) {
                return this.fixedItems[index].partialDualWield;
            }
        }
        return null;
    }
    
    hasInnateDualWield() {
        for (var index in this.unit.skills) {
            if (this.unit.skills[index].special && this.unit.skills[index].special.includes("dualWield")) {
                return true;
            }
        }
        for (var index in this.fixedItems) {
            if (this.fixedItems[index] && this.fixedItems[index].special && this.fixedItems[index].special.includes("dualWield")) {
                return true;
            }
        }
        return false;
    }
    
    prepareEquipable() {
        var equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"],["esper"]];
        var equip = getCurrentUnitEquip();
        for (var equipIndex = 0, len = equip.length; equipIndex < len; equipIndex++) {
            if (weaponList.includes(equip[equipIndex])) {
                equipable[0].push(equip[equipIndex]);
            } else if (shieldList.includes(equip[equipIndex])) {
                equipable[1].push(equip[equipIndex]);
            } else if (headList.includes(equip[equipIndex])) {
                equipable[2].push(equip[equipIndex]);
            } else if (bodyList.includes(equip[equipIndex])) {
                equipable[3].push(equip[equipIndex]);
            } 
        }
        if (hasInnateDualWield()) {
            equipable[1] = equipable[1].concat(equipable[0]);
        }
        /*if (useBuild) {
            var hasDualWield = false;
            var partialDualWield = getInnatePartialDualWield() || [];
            for (var index = 0; index < 10; index++) {
                if (builds[currentthis.unitIndex].bestBuild[index] && builds[currentthis.unitIndex].bestBuild[index].special && builds[currentthis.unitIndex].bestBuild[index].special.includes("dualWield")) {
                    hasDualWield = true;
                    break;
                }
                if (builds[currentthis.unitIndex].bestBuild[index] && builds[currentthis.unitIndex].bestBuild[index].partialDualWield) {
                    for (partialDualWieldIndex = builds[currentthis.unitIndex].bestBuild[index].partialDualWield.length; partialDualWieldIndex--;) {
                        var type = builds[currentthis.unitIndex].bestBuild[index].partialDualWield[partialDualWieldIndex];
                        if (!partialDualWield.includes(type)) {
                            partialDualWield.push(type);
                        }
                    }
                }
            }
            if (hasDualWield) {
                equipable[1] = equipable[1].concat(equipable[0]);
            } else {
                if (partialDualWield.length > 0 && builds[currentthis.unitIndex].bestBuild[0] && partialDualWield.includes(builds[currentthis.unitIndex].bestBuild[0].type)) {
                    equipable[1] = equipable[1].concat(partialDualWield);
                }
            }
        }*/
        return equipable;
    }
    
    getCurrentUnitEquip() {
        var equip = this.unit.equip.concat(["accessory", "materia"]);
        for (var index in this.fixedItems) {
            if (this.fixedItems[index] && this.fixedItems[index].allowUseOf && !equip.includes(this.fixedItems[index].allowUseOf)) {
                equip.push(this.fixedItems[index].allowUseOf);
            }
        }
        return equip;
    }
    
    getItemSlotFor(item, forceDoubleHand = false) {
        var slot = -1;
        if (weaponList.includes(item.type)) {
            if (this.fixedItems[0] && this.fixedItems[1]) {
                return -1;
            }
            if (!this.fixedItems[0]) {
                return 0;
            } else {
                if (!forceDoubleHand && this.equipable[1].includes(item.type)) {
                    return 1;
                } else {
                    return -1;
                }
            }
        } else if (shieldList.includes(item.type)) {    
            if (this.fixedItems[1]) {
                return -1;
            }
            return 1;
        } else if (headList.includes(item.type)) {    
            if (this.fixedItems[2]) {
                return -1;
            }
            return 2;
        } else if (bodyList.includes(item.type)) {    
            if (this.fixedItems[3]) {
                return -1;
            }
            return 3;
        } else if (item.type == "accessory") {
            if (this.fixedItems[4] && this.fixedItems[5]) {
                return -1;
            }
            if (!this.fixedItems[4]) {
                return 4;
            } else {
                return 5;
            }
        } else if (item.type == "materia") {
            if (this.fixedItems[6] && this.fixedItems[7] && this.fixedItems[8] && this.fixedItems[9]) {
                return -1;
            }
            if (!this.fixedItems[6]) {
                return 6;
            } else if (!this.fixedItems[7]) {
                return 7;
            } else if (!this.fixedItems[8]) {
                return 8;
            } else {
                return 9;
            }
        } else if (item.type == "esper") {
            return 10;
        }
        return slot;
    }
}