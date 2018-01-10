const involvedStatsByValue = {
    "physicalDamage":                   ["atk","weaponElement","physicalKiller","meanDamageVariance"],
    "magicalDamage":                    ["mag","magicalKiller"],
    "magicalDamageWithPhysicalMecanism":["mag","weaponElement","physicalKiller","meanDamageVariance"],
    "hybridDamage":                     ["atk","mag","weaponElement","physicalKiller","meanDamageVariance"]
}

class UnitBuild {
    
    constructor(unit, fixedItems, baseValues) {
        this._unit = unit;
        this.fixedItems = fixedItems;
        this.build = fixedItems.slice();
        this.buildValue = 0;
        this.innateElements = [];
        this.baseValues = baseValues;
        this.fixedItemsIds = [];
        for (var index = 0; index < 10; index++) {
            if (fixedItems[index] && !fixedItemsIds.includes(fixedItems[index].id)) {
                fixedItemsIds.push(builds[currentUnitIndex].fixedItems[index][itemKey]);
            }
        }
        this.goal = null;
        this._formula = null;
        this.involvedStats = [];
    }
    
    getPartialDualWield() {
        for (var index = this._unit.skills.length; index--;) {
            if (this._unit.skills[index].partialDualWield) {
                return this._unit.skills[index].partialDualWield;
            }
        }
        for (var index = 0; index < 10; index++) {
            if (this.build[index] && this.build[index].partialDualWield) {
                return this.build[index].partialDualWield;
            }
        }
        return null;
    }
    
    hasDualWield() {
        for (var index in this._unit.skills) {
            if (this._unit.skills[index].special && this._unit.skills[index].special.includes("dualWield")) {
                return true;
            }
        }
        for (var index = 0; index < 10; index++) {
            if (this.build[index] && this.build[index].special && this.build[index].special.includes("dualWield")) {
                return true;
            }
        }
        return false;
    }
    
    prepareEquipable() {
        var equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"],["esper"]];
        if (this._unit) {
            var equip = this.getCurrentUnitEquip();
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
            if (this.hasDualWield()) {
                equipable[1] = equipable[1].concat(equipable[0]);
            }
            var partialDualWield = this.getPartialDualWield() || [];
            if (partialDualWield.length > 0 && this.build[0] && partialDualWield.includes(this.build[0].type)) {
                equipable[1] = equipable[1].concat(partialDualWield);
            }
        }
        return equipable;
    }
    
    getCurrentUnitEquip() {
        var equip = this._unit.equip.concat(["accessory", "materia"]);
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
    
    fixItem(item, slot) {
        if (this.fixedItems[slot]) {
            var index = this.fixedItemsIds.indexOf(item.id);
            this.fixedItemsIds.splice(index,1);
        }
        this.fixedItems[slot] = item;
        if (item && !this.fixedItemsIds.includes(item.id)) {
            this.fixedItemsIds.push(item.id);
        }
    }
    
    calculateInvolvedStats() {
        if (this._formula.type == "value") {
            var name = this._formula.name;
            if (involvedStatsByValue[name]) {
                for (var index = involvedStatsByValue[name].length; index--;) {
                    if (!this.involvedStats.includes(involvedStatsByValue[name][index])) {
                        this.involvedStats.push(involvedStatsByValue[name][index]);
                    }
                }
            } else {
                if (!this.involvedStats.includes(name)) {
                        this.involvedStats.push(name);
                    }
            }
        } else if (this._formula.type == "conditions") {
            for (var index = this._formula.conditions.length; index-- ;) {
                calculateInvolvedStats(this._formula.conditions[index].value);    
            }
            calculateInvolvedStats(this._formula.formula);    
        } else if (this._formula.type != "constant") {
            calculateInvolvedStats(this._formula.value1);
            calculateInvolvedStats(this._formula.value2);
        }
    }
    
    get formula() {
        return this._formula;
    }
    set formula(formula) {
        this._formula = formula;
        this.involvedStats = [];
        if (formula) {
            this.calculateInvolvedStats();
        }
    }
    
    get unit() {
        return this._unit;
    }
    set unit(unit) {
        this._unit = unit;
        this.equipable = this.prepareEquipable();
    }
}