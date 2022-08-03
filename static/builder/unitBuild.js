const involvedStatsByValue = {
    "physicalDamage":                   ["atk","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "magicalDamage":                    ["mag","magicalKiller", "chainMastery", "meanDamageVariance"],
    "hybridDamage":                     ["atk","mag","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "jumpDamage":                       ["atk","weaponElement","physicalKiller","meanDamageVariance","jumpDamage", "chainMastery"],
    "magDamageWithPhysicalMecanism":    ["mag","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "sprDamageWithPhysicalMecanism":    ["spr","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "defDamageWithPhysicalMecanism":    ["def","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "magDamageWithPhysicalMecanismMultiCast":    ["mag","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "sprDamageWithPhysicalMecanismMultiCast":    ["spr","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "defDamageWithPhysicalMecanismMultiCast":    ["def","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "atkDamageWithMagicalMecanism":     ["atk","magicalKiller", "chainMastery", "meanDamageVariance"],
    "atkDamageWithMagicalMecanismMultiCast":     ["atk","magicalKiller", "chainMastery", "meanDamageVariance"],
    "sprDamageWithMagicalMecanism":     ["spr","magicalKiller", "chainMastery", "meanDamageVariance"],
    "atkDamageWithFixedMecanism":       ["atk","meanDamageVariance", "chainMastery"],
    "physicalDamageMultiCast":          ["atk","weaponElement","physicalKiller","meanDamageVariance", "chainMastery"],
    "fixedDamageWithPhysicalMecanism":  ["weaponElement", "physicalKiller", "meanDamageVariance"],
    "summonerSkill":                    ["mag","spr","evoMag", 'evokeDamageBoost.all', "chainMastery", "meanDamageVariance"]
};

const statProgression = [71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100];

class UnitBuild {

    constructor(unit = null,
                fixedItems = [null, null, null, null, null, null, null, null, null, null, null, null],
                baseValues = {}) {
        this.unitShift = new UnitShift(unit, fixedItems, baseValues);

        this._monsterAttackFormula = null;
        this._exAwakeningLevel = -1;
        this._braveShift = null
    }
    
    getPartialDualWield() {
        return this.unitShift.getPartialDualWield();
    }
    
    hasDualWield(ignoreSlot = -1) {
        return this.unitShift.hasDualWield(ignoreSlot);
    }
    
    hasDualWieldIfItemEquiped(itemId) {
        for (let index in this.unit.skills) {
            if (this.unit.skills[index].special && this.unit.skills[index].special.includes("dualWield") && this.unit.skills[index].equipedConditions && this.unit.skills[index].equipedConditions.length == 1) {
                if (Array.isArray(this.unit.skills[index].equipedConditions) && this.unit.skills[index].equipedConditions[0].includes(itemId) || this.unit.skills[index].equipedConditions.includes(itemId)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    set bannedEquipableTypes(bannedEquipableTypes) {
        this.unitShift._bannedEquipableTypes = bannedEquipableTypes;
        this.prepareEquipable();
    }
    
    get bannedEquipableTypes() {
        return this.unitShift._bannedEquipableTypes;
    }
    
    toogleEquipableType(equipableType) {
        if (this.unitShift._bannedEquipableTypes.includes(equipableType)) {
            this.unitShift._bannedEquipableTypes = this.unitShift._bannedEquipableTypes.filter(e => e != equipableType);
        } else {
            this.unitShift._bannedEquipableTypes.push(equipableType);
        }
        this.prepareEquipable();
    }   
    
    prepareEquipable(ignoreSlot = -1) {
        return this.unitShift.prepareEquipable();
    }
    
    getCurrentUnitEquip() {
        return this.unitShift.getCurrentUnitEquip();
    }
    
    getItemSlotFor(item, forceDoubleHand = false) {
        let slot = -1;
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
        } else if (item.type === "accessory") {
            if (this.fixedItems[4] && this.fixedItems[5]) {
                return -1;
            }
            if (!this.fixedItems[4]) {
                return 4;
            } else {
                return 5;
            }
        } else if (item.type === "materia") {
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
        } else if (item.type === "esper") {
            return 10;
        }
        return slot;
    }
    
    calculateInvolvedStats(formula) {
        if (formula.type === "multicast") {
            for (let i = formula.skills.length; i--;) {
                this.calculateInvolvedStats(formula.skills[i]);
            }
        } else if (formula.type === "skill") {
            if (formula.lb) {
                this.addToInvolvedStats(["lbDamage"]);
            }
            this.calculateInvolvedStats(formula.value);
        } else if (formula.type === "damage") {
            this.addToInvolvedStats(["chainMastery"]);
            if (formula.value.mecanism === "physical") {
                this.addToInvolvedStats(["weaponElement","physicalKiller","meanDamageVariance"]);
                
                
                if (formula.value.damageType === "body") {
                    if (formula.value.use) {
                        this.addToInvolvedStats([formula.value.use.stat]);
                        this.addToInvolvedStats(["newDamageFormula"]);
                    } else {
                        this.addToInvolvedStats(["atk"]);
                    }
                } else if (formula.value.damageType === "mind") {
                    if (formula.value.use) {
                        this.addToInvolvedStats([formula.value.use.stat]);
                    } else {
                        this.addToInvolvedStats(["mag"]);
                    }
                }
                if (formula.value.jump) {
                    this.addToInvolvedStats(["jumpDamage"]);
                }
            } else if (formula.value.mecanism === "magical") {
                this.addToInvolvedStats(["magicalKiller", "meanDamageVariance"]);
                if (formula.value.damageType === "mind") {
                    if (formula.value.use) {
                        this.addToInvolvedStats([formula.value.use.stat]);
                    } else {
                        this.addToInvolvedStats(["mag"]);
                    }
                } else {
                    this.addToInvolvedStats(["atk"]);
                }
            } else if (formula.value.mecanism === "hybrid") {
                this.addToInvolvedStats(["weaponElement","physicalKiller","meanDamageVariance", "atk", "mag"]);
            } else if (formula.value.mecanism === "summonerSkill"){
                this.addToInvolvedStats(["evoMag", "meanDamageVariance"]);
                this.addToInvolvedStats(['evokeDamageBoost.all']);
                if (formula.value.magSplit > 0) {
                    this.addToInvolvedStats(["mag"]);
                }
                if (formula.value.sprSplit > 0) {
                    this.addToInvolvedStats(["spr"]);
                }
            }
        } else if (formula.type === "value") {
            let name = formula.name;
            if (involvedStatsByValue[name]) {
                for (let index = involvedStatsByValue[name].length; index--;) {
                    if (!this.unitShift._involvedStats.includes(involvedStatsByValue[name][index])) {
                        this.unitShift._involvedStats.push(involvedStatsByValue[name][index]);
                    }
                }
            } else if (name==="monsterDamage"){
                this.addToInvolvedStats(this.getMonsterAttackInvolvedStats());
            } else {
                if (!this.unitShift._involvedStats.includes(name)) {
                    this.unitShift._involvedStats.push(name);
                }
            }
            if (formula.lb) {
                this.addToInvolvedStats(["lbDamage"]);
            }
        } else if (formula.type === "condition") {
            this.calculateInvolvedStats(formula.condition);
            this.calculateInvolvedStats(formula.formula);
        } else if (this.unit && formula.type === ">" && formula.value1.type === "value" && formula.value2.type === "constant") {
            if (formula.value1.name.startsWith("resist|") && ailmentList.includes(formula.value1.name.substr(7, formula.value1.name.length - 15))) {
                let applicableSkills = [];
                for (let skillIndex = this.unit.skills.length; skillIndex--;) {
                    let skill = this.unit.skills[skillIndex];
                    if (areConditionOK(skill, this.fixedItems, this.level, this._exAwakeningLevel)) {
                        applicableSkills.push(skill);
                    }
                }

                let currentBuildWithFixedItems = this.fixedItems.concat(applicableSkills);

                let value = calculateStatValue(currentBuildWithFixedItems, formula.value1.name, this).total;
                if (value < formula.value2.value) {
                    // only consider value1 if this criteria is not already met
                    this.calculateInvolvedStats(formula.value1);
                }
            } else {
                this.calculateInvolvedStats(formula.value1);
            }
        } else if (formula.type==="heal"){
            this.addToInvolvedStats(["spr","mag"]);
        } else if (formula.type !== "elementCondition" &&  formula.type !== "constant" && formula.type !== "chainMultiplier" && formula.type !== "imperil" && formula.type !== "break" && formula.type !== "imbue" && formula.type !== "statsBuff" && formula.type !== "killers" && formula.type !== "skillEnhancement" && formula.type !== "lbFill" && formula.type !== "berserk") {
            this.calculateInvolvedStats(formula.value1);
            this.calculateInvolvedStats(formula.value2);
        }
    }

    getMonsterAttackInvolvedStats() {
        if (this._monsterAttackFormula) {
            let involvedStats = ['hp'];
            this.innerGetMonsterAttackInvolvedStats(this._monsterAttackFormula, involvedStats);
            return involvedStats;
        } else {
            return [];
        }
    }

    innerGetMonsterAttackInvolvedStats(formula, involvedStats) {
        switch(formula.type) {
            case "*":
            case "+":
                this.innerGetMonsterAttackInvolvedStats(formula.value1, involvedStats);
                this.innerGetMonsterAttackInvolvedStats(formula.value2, involvedStats);
                break;
            case "skill":
                switch (formula.formulaName) {
                    case "physicalDamage":
                    case 'atkDamageWithFixedMecanism':
                        if (!involvedStats.includes('def')) {
                            involvedStats.push('def');
                        }
                        break;
                    case 'magicalDamage':
                        if (!involvedStats.includes('spr')) {
                            involvedStats.push('spr');
                        }
                        break;
                    case 'hybridDamage':
                        if (!involvedStats.includes('def')) {
                            involvedStats.push('def');
                        }
                        if (!involvedStats.includes('spr')) {
                            involvedStats.push('spr');
                        }
                        break;
                }
        }
    }
    
    addToInvolvedStats(stats) {
        for (let i = stats.length; i--;) {
            if (!this.unitShift._involvedStats.includes(stats[i])) {
                this.unitShift._involvedStats.push(stats[i]);
            }
        }
    }
    
    fixItem(item, slot) {
        this.fixedItems[slot] = item;
        this.build[slot] = item;
        if (this._braveShift && (slot == 10 || slot == 11)) {
            this._braveShift.fixedItems[slot] = item;
            this._braveShift.build[slot] = item;
        }
        if (item && !this.fixedItemsIds.includes(item.id)) {
            this.fixedItemsIds.push(item.id);
        }
    }

    setItem(item, slot) {
        this.build[slot] = item;
        if (this._braveShift && (slot == 10 || slot == 11)) {
            this._braveShift.build[slot] = item;
        }
    }

    setPot(stat, value) {
        this.unitShift.baseValues[stat].pots = value;
        if (this._braveShift) {
            this._braveShift.baseValues[stat].pots = value;
        }
    }
    
    emptyBuild() {
        this.unitShift.build = this.fixedItems.slice();
        this.buildValue = 0;
        this.prepareEquipable();
    }
    
    get formula() {
        return this.unitShift._formula;
    }
    set formula(formula) {
        this.unitShift._formula = formula;
        this.unitShift._involvedStats = [];
        if (formula) {
            this.calculateInvolvedStats(formula);
        }
    }
    set monsterAttackFormula(value) {
        this._monsterAttackFormula = value;
        this.unitShift._involvedStats = [];
        if (this.unitShift._formula) {
            this.calculateInvolvedStats(this.unitShift._formula);
        }
    }

    setUnit(unit) {
        this.unitShift.setUnit(unit);
    }
    
    set level(level) {
        this.unitShift._level = level;
        this.updateStats();
        this.unitShift._tdwCap = null;
    }

    get level() {
        return this.unitShift._level;
    }


    setExAwakeningLevel(level) {
        this._exAwakeningLevel = level;
        this.updateStats();
    }

    braveShift() {
        let temp = this.unitShift;
        this.unitShift = this._braveShift;
        this._braveShift = temp;
    }

    setBraveShift(unitShift) {
        this._braveShift = unitShift;
    }

    hasBraveShift() {
        return this._braveShift !== null;
    }

    updateStats() {
        if (this.unit) {
            if (this.level > 100) {
                let currentLevel = this.level <= 120 ? this.level : 120;
                this.unitShift.stats = {
                    "hp": this.unit.stats.minStats.hp + Math.floor((this.unit.stats.maxStats.hp - this.unit.stats.minStats.hp) * statProgression[currentLevel - 101] / 100),
                    "mp": this.unit.stats.minStats.mp + Math.floor((this.unit.stats.maxStats.mp - this.unit.stats.minStats.mp) * statProgression[currentLevel - 101] / 100),
                    "atk": this.unit.stats.minStats.atk + Math.floor((this.unit.stats.maxStats.atk - this.unit.stats.minStats.atk) * statProgression[currentLevel - 101] / 100),
                    "def": this.unit.stats.minStats.def + Math.floor((this.unit.stats.maxStats.def - this.unit.stats.minStats.def) * statProgression[currentLevel - 101] / 100),
                    "mag": this.unit.stats.minStats.mag + Math.floor((this.unit.stats.maxStats.mag - this.unit.stats.minStats.mag) * statProgression[currentLevel - 101] / 100),
                    "spr": this.unit.stats.minStats.spr + Math.floor((this.unit.stats.maxStats.spr - this.unit.stats.minStats.spr) * statProgression[currentLevel - 101] / 100)
                };

                let levelDifference = this.level - 120;

                ['hp', 'mp', 'atk', 'def', 'mag', 'spr'].forEach(stat => {
                    this.unitShift.stats[stat] += Math.floor(this.unit.stats.maxStats[stat] * 0.01 * levelDifference)
                });
            } else {
                    this.unitShift.stats = this.unit.stats.maxStats;
                }   
            }
            if (this.unit.exAwakening && this._exAwakeningLevel) {
                ['hp', 'mp', 'atk', 'def', 'mag', 'spr'].forEach(stat => {
                    for (let i = 0; i < this._exAwakeningLevel; i++) {
                        this.unitShift.stats[stat] += this.unit.exAwakening[i][stat];
                    }
                });
            }
    }
    
    getStat(stat) {
        return this.stats[stat];
    }
    
    get tdwCap() {
        if(this.unitShift._tdwCap) {
            return this.unitShift._tdwCap.value;
        } else {
            this.unitShift._tdwCap = { "value": 2};
            return this.unitShift._tdwCap.value;
        }
    }
    
    hasDualWieldMastery() {
        for (let index in this.unit.skills) {
            if (!this.unit.skills[index].levelCondition || this.unit.skills[index].levelCondition <= this.level) {
                if (this.unit.skills[index].improvedDW) {
                    return true;
                }
            }
        }
        return false;
    }

    get involvedStats() {
        if (!this.unitShift._involvedStats) {
            this.unitShift._involvedStats = [];
            this.calculateInvolvedStats();
        }
        return this.unitShift._involvedStats;
    }

    set involvedStats(value) {
        this.unitShift._involvedStats = value;
    }

    get unit() {
        return this.unitShift.unit;
    }

    get stats() {
        return this.unitShift.stats;
    }

    get build() {
        return this.unitShift.build;
    }

    set build(build) {
        this.unitShift.build = build;
        if (this._braveShift) {
            this._braveShift.build[10] = build[10];
            this._braveShift.build[11] = build[11];
        }
    }

    get fixedItems() {
        return this.unitShift.fixedItems;
    }

    set fixedItems(fixedItems) {
        this.unitShift.fixedItems = fixedItems;
        if (this._braveShift) {
            this._braveShift.fixedItems[10] = fixedItems[10];
            this._braveShift.fixedItems[11] = fixedItems[11];
        }
    }

    get baseValues() {
        return this.unitShift.baseValues;
    }

    set baseValues(baseValues) {
        this.unitShift.baseValues = baseValues;
        if (this._braveShift) {
            baseStats.forEach(s => {
                this._braveShift.baseValues[s].pots = baseValues[s].pots;
                this._braveShift.baseValues[s].total = baseValues[s].pots + this._braveShift.baseValues[s].base;
                this._braveShift.baseValues[s].buff = this._braveShift.baseValues[s].buff || 0;
            });
        }
    }

    get buildValue() {
        return this.unitShift.buildValue;
    }

    set buildValue(buildValue) {
        this.unitShift.buildValue = buildValue;
    }

    get innateElements() {
        return this.unitShift.innateElements;
    }

    set innateElements(innateElements) {
        this.unitShift.innateElements = innateElements;
    }

    get fixedItemsIds() {
        return this.unitShift.fixedItemsIds;
    }

    get goal() {
        return this.unitShift.goal;
    }

    set goal(goal) {
        this.unitShift.goal = goal;
    }

    get desirableItemIds() {
        return this.unitShift.desirableItemIds;
    }

    get freeSlots() {
        return this.unitShift.freeSlots;
    }

    set freeSlots(freeSlots) {
        this.unitShift.freeSlots = freeSlots;
    }

    get equipable() {
        return this.unitShift.equipable;
    }

    set equipable(equipable) {
        this.unitShift.equipable = equipable;
    }
}
