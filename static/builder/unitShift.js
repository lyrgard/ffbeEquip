class UnitShift {
    constructor(unit = null,
                fixedItems = [null, null, null, null, null, null, null, null, null, null, null, null],
                baseValues = {}) {
        this.unit = unit;
        this.fixedItems = fixedItems;
        this.build = fixedItems.slice();
        this.baseValues = baseValues;
        this.buildValue = {"min":-1, "avg":-1, "max":-1};
        this.innateElements = [];
        this.fixedItemsIds = [];
        this.goal = null;
        this._formula = null;
        this._involvedStats = [];
        this.desirableItemIds = [];
        this.freeSlots = 0;
        this._tdwCap = null;
        this._bannedEquipableTypes = [];
        this._level = 0;
        if (this.unit) {
            this.stats = this.unit.stats.maxStats;
        } else {
            this.stats = {"hp":0, "mp":0, "atk":0, "def":0, "mag":0, "spr":0};
        }
        for (var index = 0; index < 10; index++) {
            if (this.fixedItems[index] && !this.fixedItemsIds.includes(this.fixedItems[index].id)) {
                this.fixedItemsIds.push(this.fixedItems[index].id);
            }
        }
        if (!baseValues.mitigation) {
            baseValues.mitigation = {
                "physical": 0,
                "magical": 0,
                "global": 0
            }
        }
        if (!baseValues.lbFillRate) {
            baseValues.lbFillRate =  {
                total: 0,
                buff: 0
            }
        }
        if (!baseValues.drawAttacks) {
            baseValues.drawAttacks = 0;
        }
        if (!baseValues.lbDamage) {
            baseValues.lbDamage = 0;
        }
        if (!baseValues.killerBuffs) {
            baseValues.killerBuffs = [];
        }
        if (!baseValues.currentStack) {
            baseValues.currentStack = 0;
        }
    }

    setUnit(unit) {
        this.unit = unit;
        this._bannedEquipableTypes = [];
        this.prepareEquipable();
        if (unit) {
            this.stats = this.unit.stats.maxStats;
            baseStats.forEach(s => {
                this.baseValues[s] = { base: this.unit.stats.maxStats[s]};
            })
        } else {
            this.stats = {"hp":0, "mp":0, "atk":0, "def":0, "mag":0, "spr":0};
        }
        this._tdwCap = null;
    }

    prepareEquipable(ignoreSlot = -1) {
        this.equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"],[],["esper"]];
        if (this.unit) {
            let equip = this.getCurrentUnitEquip();
            for (let equipIndex = 0, len = equip.length; equipIndex < len; equipIndex++) {
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
            if (this.hasDualWield(ignoreSlot)) {
                this.equipable[1] = this.equipable[0].concat(this.equipable[1]);
            }
            let partialDualWield = this.getPartialDualWield() || [];
            if (partialDualWield.length > 0 && this.build[0] && partialDualWield.includes(this.build[0].type)) {
                this.equipable[1] = partialDualWield.concat(this.equipable[1]);
            }
            if (equip.includes("visionCard")) {
                this.equipable[10] = ["visionCard"];
            }
        }
        this.desirableItemIds = [];
        if (this.unit) {
            for (let i = this.unit.skills.length; i--;) {
                let skill = this.unit.skills[i];
                if (skill.equipedConditions) {
                    for (let j = skill.equipedConditions.length; j--;) {
                        if (!typeList.includes(skill.equipedConditions[j]) && !elementList.includes(skill.equipedConditions[j]) && !this.desirableItemIds.includes(skill.equipedConditions[j])) {
                            if (Array.isArray(skill.equipedConditions[j])) {
                                this.desirableItemIds = this.desirableItemIds.concat(skill.equipedConditions[j]);
                            } else {
                                this.desirableItemIds.push(skill.equipedConditions[j]);
                            }
                        }
                    }
                }
            }
        }
        return this.equipable;
    }

    getCurrentUnitEquip() {
        let equip = this.unit.equip.concat(["accessory", "materia"]);
        for (let index = this.build.length; index--;) {
            if (this.build[index] && this.build[index].allowUseOf) {
                let allowUseOf = this.build[index].allowUseOf;
                if (!Array.isArray(allowUseOf)) {
                    allowUseOf = [allowUseOf];
                }
                allowUseOf.forEach(a => {
                    if (!equip.includes(a)) {
                        equip.push(a);
                    }
                });
            }
        }
        if (this.unit.enhancements) {
            this.unit.enhancements.forEach(skill => {
                if (skill.allowUseOf && (!skill.levelCondition || skill.levelCondition <= this._level)) {
                    skill.allowUseOf.forEach(a => {
                        if (!equip.includes(a)) {
                            equip.push(a);
                        }
                    });
                }
            });
        }
        return equip.filter(e => !this._bannedEquipableTypes.includes(e));
    }

    hasDualWield(ignoreSlot = -1) {
        for (let index in this.unit.skills) {
            if (this.unit.skills[index].special && this.unit.skills[index].special.includes("dualWield")) {
                if (!this.unit.skills[index].levelCondition || this.unit.skills[index].levelCondition <= this._level)
                    if (this.unit.skills[index].equipedConditions && this.unit.skills[index].equipedConditions.length === 1) {
                        for (let itemIndex = 0; itemIndex < 10; itemIndex++) {
                            if (itemIndex !== ignoreSlot) {
                                if (this.build[itemIndex] && (Array.isArray(this.unit.skills[index].equipedConditions) && this.unit.skills[index].equipedConditions[0].includes(this.build[itemIndex].id) || this.unit.skills[index].equipedConditions.includes(this.build[itemIndex].id))) {
                                    return true;
                                }
                            }
                        }
                    } else {
                        return true;
                    }
            }
        }
        for (let index = 0; index < 10; index++) {
            if (ignoreSlot !== index) {
                if (this.fixedItems[index] && this.fixedItems[index].special && this.fixedItems[index].special.includes("dualWield")) {
                    return true;
                }
                if (this.build[index] && this.build[index].special && this.build[index].special.includes("dualWield")) {
                    return true;
                }
            }
        }
        return false;
    }

    getPartialDualWield() {
        for (let index = this.unit.skills.length; index--;) {
            if (this.unit.skills[index] && this.unit.skills[index].partialDualWield && (!this.unit.skills[index].levelCondition || this.unit.skills[index].levelCondition <= this._level)) {
                if ((this.build[0] == null || this.unit.skills[index].partialDualWield.includes(this.build[0].type))
                    && (this.build[1] == null || this.unit.skills[index].partialDualWield.includes(this.build[1].type))) {
                    return this.unit.skills[index].partialDualWield;
                }
            }
        }
        for (let index = 0; index < 10; index++) {
            if (this.build[index] && this.build[index].partialDualWield) {
                if ((this.build[0] == null || this.build[index].partialDualWield.includes(this.build[0].type))
                    && (this.build[1] == null || this.build[index].partialDualWield.includes(this.build[1].type))) {
                    return this.build[index].partialDualWield;
                }
            }
        }
        return null;
    }
}
