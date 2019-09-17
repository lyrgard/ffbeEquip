const involvedStatsByValue = {
    "physicalDamage":                   ["atk","weaponElement","physicalKiller","meanDamageVariance"],
    "magicalDamage":                    ["mag","magicalKiller"],
    "hybridDamage":                     ["atk","mag","weaponElement","physicalKiller","meanDamageVariance"],
    "jumpDamage":                       ["atk","weaponElement","physicalKiller","meanDamageVariance","jumpDamage"],
    "magDamageWithPhysicalMecanism":    ["mag","weaponElement","physicalKiller","meanDamageVariance"],
    "sprDamageWithPhysicalMecanism":    ["spr","weaponElement","physicalKiller","meanDamageVariance"],
    "defDamageWithPhysicalMecanism":    ["def","weaponElement","physicalKiller","meanDamageVariance"],
    "magDamageWithPhysicalMecanismMultiCast":    ["mag","weaponElement","physicalKiller","meanDamageVariance"],
    "sprDamageWithPhysicalMecanismMultiCast":    ["spr","weaponElement","physicalKiller","meanDamageVariance"],
    "defDamageWithPhysicalMecanismMultiCast":    ["def","weaponElement","physicalKiller","meanDamageVariance"],
    "atkDamageWithMagicalMecanism":     ["atk","magicalKiller"],
    "atkDamageWithMagicalMecanismMultiCast":     ["atk","magicalKiller"],
    "sprDamageWithMagicalMecanism":     ["spr","magicalKiller"],
    "atkDamageWithFixedMecanism":       ["atk","meanDamageVariance"],
    "physicalDamageMultiCast":          ["atk","weaponElement","physicalKiller","meanDamageVariance"],
    "fixedDamageWithPhysicalMecanism":  ["weaponElement", "physicalKiller"],
    "summonerSkill":                    ["mag","spr","evoMag"]
}

const statProgression = [71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100];

class UnitBuild {
    
    constructor(unit, fixedItems, baseValues) {
        this.unit = unit;
        this.fixedItems = fixedItems;
        this.build = fixedItems.slice();
        this.buildValue = {"min":-1, "avg":-1, "max":-1};
        this.innateElements = [];
        this.baseValues = baseValues;
        this.fixedItemsIds = [];
        this._level = 0;
        for (var index = 0; index < 10; index++) {
            if (this.fixedItems[index] && !this.fixedItemsIds.includes(this.fixedItems[index].id)) {
                this.fixedItemsIds.push(this.fixedItems[index].id);
            }
        }
        this.goal = null;
        this._formula = null;
        this.involvedStats = [];
        this.desirableItemIds = [];
        this.freeSlots = 0;
        if (this.unit) {
            this.stats = this.unit.stats.maxStats;
        } else {
            this.stats = {"hp":0, "mp":0, "atk":0, "def":0, "mag":0, "spr":0};
        }
        this._tdwCap = null;
        this._bannedEquipableTypes = [];
    }
    
    getPartialDualWield() {
        for (var index = this.unit.skills.length; index--;) {
            if (this.unit.skills[index] && this.unit.skills[index].partialDualWield && (!this.unit.skills[index].levelCondition || this.unit.skills[index].levelCondition <= this._level)) {
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
    
    hasDualWield(ignoreSlot = -1) {
        for (var index in this.unit.skills) {
            if (this.unit.skills[index].special && this.unit.skills[index].special.includes("dualWield")) {
                if (!this.unit.skills[index].levelCondition || this.unit.skills[index].levelCondition <= this._level)
                if (this.unit.skills[index].equipedConditions && this.unit.skills[index].equipedConditions.length == 1) {
                    for (var itemIndex = 0; itemIndex < 10; itemIndex++) {
                        if (itemIndex != ignoreSlot) {
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
        for (var index = 0; index < 10; index++) {
            if (ignoreSlot != index) {
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
    
    hasDualWieldIfItemEquiped(itemId) {
        for (var index in this.unit.skills) {
            if (this.unit.skills[index].special && this.unit.skills[index].special.includes("dualWield") && this.unit.skills[index].equipedConditions && this.unit.skills[index].equipedConditions.length == 1) {
                if (Array.isArray(this.unit.skills[index].equipedConditions) && this.unit.skills[index].equipedConditions[0].includes(itemId) || this.unit.skills[index].equipedConditions.includes(itemId)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    set bannedEquipableTypes(bannedEquipableTypes) {
        this._bannedEquipableTypes = bannedEquipableTypes;
        this.prepareEquipable();
    }
    
    get bannedEquipableTypes() {
        return this._bannedEquipableTypes;
    }
    
    toogleEquipableType(equipableType) {
        if (this._bannedEquipableTypes.includes(equipableType)) {
            this._bannedEquipableTypes = this._bannedEquipableTypes.filter(e => e != equipableType);
        } else {
            this._bannedEquipableTypes.push(equipableType);
        }
        this.prepareEquipable();
    }   
    
    prepareEquipable(ignoreSlot = -1) {
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
            if (this.hasDualWield(ignoreSlot)) {
                this.equipable[1] = this.equipable[0].concat(this.equipable[1]);
            }
            var partialDualWield = this.getPartialDualWield() || [];
            if (partialDualWield.length > 0 && this.build[0] && partialDualWield.includes(this.build[0].type)) {
                this.equipable[1] = partialDualWield.concat(this.equipable[1]);
            }
        }
        this.desirableItemIds = [];
        if (this.unit) {
            for (var i = this.unit.skills.length; i--;) {
                var skill = this.unit.skills[i];
                if (skill.equipedConditions) {
                    for (var j = skill.equipedConditions.length; j--;) {
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
        var equip = this.unit.equip.concat(["accessory", "materia"]);
        for (var index = 10; index--;) {
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
        return equip.filter(e => !this._bannedEquipableTypes.includes(e));
    }
    
    getItemSlotFor(item, forceDoubleHand = false) {
        var slot = -1;
        if (weaponList.includes(item.type)) {
            if (this.fixedItems[0] && this.fixedItems[1]) {
                return -1;
            }
            if(forceDoubleHand && (this.fixedItems[0] || this.fixedItems[1])){
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
        if (formula.type == "multicast") {
            for (var i = formula.skills.length; i--;) {
                this.calculateInvolvedStats(formula.skills[i]);
            }
        } else if (formula.type == "skill") {
            if (formula.lb) {
                this.addToInvolvedStats(["lbDamage"]);
            }
            this.calculateInvolvedStats(formula.value);
        } else if (formula.type == "damage") {
            if (formula.value.mecanism == "physical") {
                this.addToInvolvedStats(["weaponElement","physicalKiller","meanDamageVariance"]);
                
                if (formula.value.use) {
                    this.addToInvolvedStats([formula.value.use.stat]);
                } else {
                    if (formula.value.damageType == "body") {
                        this.addToInvolvedStats(["atk"]);
                    } else if (formula.value.damageType == "mind") {
                        this.addToInvolvedStats(["mag"]);
                    }
                }
                if (formula.value.jump) {
                    this.addToInvolvedStats(["jumpDamage"]);
                }
            } else if (formula.value.mecanism == "magical") {
                this.addToInvolvedStats(["magicalKiller"]);
                if (formula.value.damageType == "mind") {
                    if (formula.value.use) {
                        this.addToInvolvedStats([formula.value.use.stat]);
                    } else {
                        this.addToInvolvedStats(["mag"]);
                    }
                } else {
                    this.addToInvolvedStats(["atk"]);
                }
            } else if (formula.value.mecanism == "hybrid") {
                this.addToInvolvedStats(["weaponElement","physicalKiller","meanDamageVariance", "atk", "mag"]);
            } else if (formula.value.mecanism == "summonerSkill"){
                this.addToInvolvedStats(["evoMag"]);
                if (formula.value.magSplit > 0) {
                    this.addToInvolvedStats(["mag"]);
                }
                if (formula.value.sprSplit > 0) {
                    this.addToInvolvedStats(["spr"]);
                }
            }
        } else if (formula.type == "value") {
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
            if (formula.lb) {
                this.addToInvolvedStats(["lbDamage"]);
            }
        } else if (formula.type == "condition") {
            this.calculateInvolvedStats(formula.condition);
            this.calculateInvolvedStats(formula.formula);  
        } else if (this.unit && formula.type == ">" && formula.value1.type == "value" && formula.value2.type == "constant") {
            if (formula.value1.name.startsWith("resist|") && ailmentList.includes(formula.value1.name.substr(7, formula.value1.name.length - 15))) {
                var applicableSkills = [];
                for (var skillIndex = this.unit.skills.length; skillIndex--;) {
                    var skill = this.unit.skills[skillIndex];
                    if (areConditionOK(skill, this.fixedItems, this._level)) {
                        applicableSkills.push(skill);
                    }
                }

                var currentBuildWithFixedItems = this.fixedItems.concat(applicableSkills);

                var value = calculateStatValue(currentBuildWithFixedItems, formula.value1.name, this).total;
                if (value < formula.value2.value) {
                    // only consider value1 if this criteria is not already met
                    this.calculateInvolvedStats(formula.value1);
                }
            } else {
                this.calculateInvolvedStats(formula.value1);
            }
        } else if (formula.type=="heal"){
            this.addToInvolvedStats(["spr","mag"])
        } else if (formula.type != "elementCondition" &&  formula.type != "constant" && formula.type != "chainMultiplier" && formula.type != "imperil" && formula.type != "break" && formula.type != "imbue" && formula.type != "statsBuff" && formula.type != "killers" && formula.type != "skillEnhancement" && formula.type != "lbFill") {
            this.calculateInvolvedStats(formula.value1);
            this.calculateInvolvedStats(formula.value2);
        }
    }
    
    addToInvolvedStats(stats) {
        for (var i = stats.length; i--;) {
            if (!this.involvedStats.includes(stats[i])) {
                this.involvedStats.push(stats[i]);
            }
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
        this._bannedEquipableTypes = [];
        this.prepareEquipable();
        if (this.unit) {
            this.stats = this.unit.stats.maxStats;
        } else {
            this.stats = {"hp":0, "mp":0, "atk":0, "def":0, "mag":0, "spr":0};
        }
        this._tdwCap = null;
    }
    
    setLevel(level) {
        this._level = level;
        if (this.unit) {
            if (this._level > 100) {
                this.stats = {
                    "hp": this.unit.stats.minStats.hp + Math.floor((this.unit.stats.maxStats.hp - this.unit.stats.minStats.hp) * statProgression[this._level - 101] / 100),
                    "mp": this.unit.stats.minStats.mp + Math.floor((this.unit.stats.maxStats.mp - this.unit.stats.minStats.mp) * statProgression[this._level - 101] / 100),
                    "atk": this.unit.stats.minStats.atk + Math.floor((this.unit.stats.maxStats.atk - this.unit.stats.minStats.atk) * statProgression[this._level - 101] / 100),
                    "def": this.unit.stats.minStats.def + Math.floor((this.unit.stats.maxStats.def - this.unit.stats.minStats.def) * statProgression[this._level - 101] / 100),
                    "mag": this.unit.stats.minStats.mag + Math.floor((this.unit.stats.maxStats.mag - this.unit.stats.minStats.mag) * statProgression[this._level - 101] / 100),
                    "spr": this.unit.stats.minStats.spr + Math.floor((this.unit.stats.maxStats.spr - this.unit.stats.minStats.spr) * statProgression[this._level - 101] / 100),
                };
            } else {
                this.stats = this.unit.stats.maxStats;
            }
        }
        this._tdwCap = null;
    }
    
    getStat(stat) {
        return this.stats[stat];
    }
    
    get tdwCap() {
        if(this._tdwCap) {
            return this._tdwCap.value;
        } else {
            this._tdwCap = { "value": 2};
            return this._tdwCap.value;
        }
    }
    
    hasDualWieldMastery() {
        for (var index in this.unit.skills) {
            if (!this.unit.skills[index].levelCondition || this.unit.skills[index].levelCondition <= this._level) {
                if (this.unit.skills[index].improvedDW) {
                    return true;
                }
            }
        }
    }
}
