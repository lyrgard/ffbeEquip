const involvedStatsByValue = {
    "physicalDamage":                   ["atk","weaponElement","physicalKiller","meanDamageVariance"],
    "magicalDamage":                    ["mag","magicalKiller"],
    "hybridDamage":                     ["atk","mag","weaponElement","physicalKiller","meanDamageVariance"],
    "jumpDamage":                       ["atk","weaponElement","physicalKiller","meanDamageVariance","jumpDamage"],
    "magDamageWithPhysicalMecanism":    ["mag","weaponElement","physicalKiller","meanDamageVariance"],
    "sprDamageWithPhysicalMecanism":    ["spr","weaponElement","physicalKiller","meanDamageVariance"],
    "defDamageWithPhysicalMecanism":    ["def","weaponElement","physicalKiller","meanDamageVariance"],
    "sprDamageWithMagicalMecanism":     ["spr","magicalKiller"],
    "summonerSkill":                    ["mag","spr","evoMag"]
}

class UnitBuild {
    
    constructor(unit, fixedItems, baseValues) {
        this.unit = unit;
        this.fixedItems = fixedItems;
        this.build = fixedItems.slice();
        this.buildValue = 0;
        this.innateElements = [];
        this.baseValues = baseValues;
        this.fixedItemsIds = [];
        for (var index = 0; index < 10; index++) {
            if (this.fixedItems[index] && !this.fixedItemsIds.includes(this.fixedItems[index].id)) {
                this.fixedItemsIds.push(this.fixedItems[index].id);
            }
        }
        this.goal = null;
        this._formula = null;
        this.involvedStats = [];
    }
    
    getPartialDualWield() {
        for (var index = this.unit.skills.length; index--;) {
            if (this.unit.skills[index].partialDualWield) {
                if ((this.build[0] == null || this.unit.skills[index].partialDualWield.includes(this.build[0].type))
                    && (this.build[1] == null || this.unit.skills[index].partialDualWield.includes(this.build[1].type))) {
                    return this.unit.skills[index].partialDualWield;
                }
            }
        }
        for (var index = 0; index < 10; index++) {
            if (this.build[index] && this.build[index].partialDualWield) {
                if ((this.build[0] == null || this.build[index].partialDualWield.includes(this.build[0].type))
                    && (this.build[1] == null || this.build[index].partialDualWield.includes(this.build[1].type))) {
                    return this.build[index].partialDualWield;
                }
            }
        }
        return null;
    }
    
    hasDualWield() {
        for (var index in this.unit.skills) {
            if (this.unit.skills[index].special && this.unit.skills[index].special.includes("dualWield")) {
                return true;
            }
        }
        for (var index = 0; index < 10; index++) {
            if (this.fixedItems[index] && this.fixedItems[index].special && this.fixedItems[index].special.includes("dualWield")) {
                return true;
            }
            if (this.build[index] && this.build[index].special && this.build[index].special.includes("dualWield")) {
                return true;
            }
        }
        return false;
    }
    
    prepareEquipable() {
        this.equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"],["esper"]];
        if (this.unit) {
            var equip = this.getCurrentUnitEquip();
            for (var equipIndex = 0, len = equip.length; equipIndex < len; equipIndex++) {
                if (weaponList.includes(equip[equipIndex])) {
                    this.equipable[0].push(equip[equipIndex]);
                } else if (shieldList.includes(equip[equipIndex])) {
                    this.equipable[1].push(equip[equipIndex]);
                } else if (headList.includes(equip[equipIndex])) {
                    this.equipable[2].push(equip[equipIndex]);
                } else if (bodyList.includes(equip[equipIndex])) {
                    this.equipable[3].push(equip[equipIndex]);
                } 
            }
            if (this.hasDualWield()) {
                this.equipable[1] = this.equipable[0].concat(this.equipable[1]);
            }
            var partialDualWield = this.getPartialDualWield() || [];
            if (partialDualWield.length > 0 && this.build[0] && partialDualWield.includes(this.build[0].type)) {
                this.equipable[1] = partialDualWield.concat(this.equipable[1]);
            }
        }
        return this.equipable;
    }
    
    getCurrentUnitEquip() {
        var equip = this.unit.equip.concat(["accessory", "materia"]);
        for (var index = 10; index--;) {
            if (this.build[index] && this.build[index].allowUseOf && !equip.includes(this.build[index].allowUseOf)) {
                equip.push(this.build[index].allowUseOf);
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
                if (!forceDoubleHand && (this.equipable[1].includes(item.type) || hasDualWield(item) || (item.partialDualWield && item.partialDualWield.includes(this.fixedItems[0].type)))) {
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
    
    calculateInvolvedStats(formula) {
        if (formula.type == "value") {
            var name = formula.name;
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
        } else if (formula.type == "conditions") {
            for (var index = formula.conditions.length; index-- ;) {
                this.calculateInvolvedStats(formula.conditions[index].value);    
            }
            this.calculateInvolvedStats(formula.formula);    
        } else if (formula.type != "constant") {
            this.calculateInvolvedStats(formula.value1);
            this.calculateInvolvedStats(formula.value2);
        }
    }
    
    fixItem(item, slot) {
        this.fixedItems[slot] = item;
        this.build[slot] = item;
    }
    
    emptyBuild() {
        this.build = this.fixedItems.slice();
        this.buildValue = 0;
        this.prepareEquipable();
    }
    
    get formula() {
        return this._formula;
    }
    set formula(formula) {
        this._formula = formula;
        this.involvedStats = [];
        if (formula) {
            this.calculateInvolvedStats(formula);
        }
    }

    setUnit(unit) {
        this.unit = unit;
        this.prepareEquipable();
    }
}