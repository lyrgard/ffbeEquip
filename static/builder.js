page = "builder";
var adventurerIds = ["1500000013", "1500000015", "1500000016", "1500000017", "1500000018"];

var goals = {
    "physicalDamage":                   {"statsToMaximize":["atk"], "useWeaponsElements":true, "applicableKillerType":"physical", "attackTwiceWithDualWield":true},
    "magicalDamage":                    {"statsToMaximize":["mag"], "useWeaponsElements":false, "applicableKillerType":"magical", "attackTwiceWithDualWield":false},
    "magicalDamageWithPhysicalMecanism":{"statsToMaximize":["mag"], "useWeaponsElements":true, "applicableKillerType":"physical", "attackTwiceWithDualWield":true},
    "hybridDamage":                     {"statsToMaximize":["atk","mag"], "useWeaponsElements":true, "applicableKillerType":"physical", "attackTwiceWithDualWield":true},
    "def":                              {"statsToMaximize":["def"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false},
    "spr":                              {"statsToMaximize":["spr"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false},
    "hp":                               {"statsToMaximize":["hp"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false},
    "physicaleHp":                      {"statsToMaximize":["hp","def"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false},
    "magicaleHp":                       {"statsToMaximize":["hp","spr"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false},
    "physicalEvasion":                  {"statsToMaximize":["evade.physical"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false},
    "magicalEvasion":                   {"statsToMaximize":["evade.magical"], "useWeaponsElements":false, "applicableKillerType":"none", "attackTwiceWithDualWield":false}
};


var dataByType = {};
var dataByTypeIds = {};
var dataWithCondition = [];
var dualWieldSources = [];
var espers;
var selectedEspers = [];
var units;
var onlyUseOwnedItems = false;
var exludeEventEquipment;
var excludeTMR5;
var excludeNotReleasedYet;
var excludePremium;

var selectedUnitName;
var selectedUnit;

var equipable;
var espersByName = {};

var ennemyResist = {"fire":0,"ice":0,"water":0,"wind":0,"lightning":0,"earth":0,"light":-50,"dark":0};
var ennemyRaces;

var desirableElements = [];

var builds = [];
var currentUnitIndex = 0;

var stats = [];
var numberOfItemCombination;

var alreadyUsedItems = {};
var alreadyUsedEspers = [];

var itemKey = getItemInventoryKey();

var searchType = [];
var searchStat = "";
var currentItemSlot;

var dataWithEspers;

var dataLoadedFromHash = false;

var conciseView = true;

var progressElement;
var progress;

var monsterDef = 100;
var monsterSpr = 100;

var damageMultiplier;

var notStackableEvadeGear = [
    ["409006700"],
    ["402001900", "301001500", "409012800"]
];

const onlyAvailableOnceItems = ["504207710","504213740"];

const percentValues = {
    "hp": "hp%",
    "mp": "mp%",
    "atk": "atk%",
    "def": "def%",
    "mag": "mag%",
    "spr": "spr%"
}
const itemsToExclude = ["409009000"]; // Ring of Dominion

function build() {
    $(".buildLinks").addClass("hidden");
    
    if (!builds[currentUnitIndex].selectedUnit) {
        alert("Please select an unit");
        return;
    }
    
    // Level correction (1+(level/100)) and final multiplier (between 85% and 100%, so 92.5% mean)
    damageMultiplier  = (1 + ((builds[currentUnitIndex].selectedUnit.max_rarity - 1)/5)) * 0.925; 
        
    
    builds[currentUnitIndex].bestValue = null;
    
    readEnnemyResists();
    ennemyRaces = getSelectedValuesFor("races");
    monsterDef = 100;
    monsterSpr = 100;
    if ($("#monsterDef").val()) {
        monsterDef = parseInt($("#monsterDef").val());
    }
    if ($("#monsterSpr").val()) {
        monsterSpr = parseInt($("#monsterSpr").val());
    }
    builds[currentUnitIndex].innateElements = getSelectedValuesFor("elements");
    readGoal();
    
    calculateAlreadyUsedItems();
    
    builds[currentUnitIndex].fixedItemsIds = [];
    for (var index = 0; index < 10; index++) {
        if (builds[currentUnitIndex].fixedItems[index] && !builds[currentUnitIndex].fixedItemsIds.includes(builds[currentUnitIndex].fixedItems[index][itemKey]))
        builds[currentUnitIndex].fixedItemsIds.push(builds[currentUnitIndex].fixedItems[index][itemKey]);
    }
    
    prepareData(getCurrentUnitEquip());
    prepareEquipable();
    selectEspers();
    
    optimize();
}

function calculateAlreadyUsedItems() {
    alreadyUsedItems = {};
    alreadyUsedEspers = [];
    for (var i = 0, len = builds.length; i < len; i++) {
        if (i != currentUnitIndex) {
            var build = builds[i].bestBuild;
            if (build && build.length != 0) {
                for (var j = 0, len2 = build.length; j < len2; j++) {
                    var item = build[j];
                    if (item) {
                        if (alreadyUsedItems[item[itemKey]]) {
                            alreadyUsedItems[item[itemKey]]++;
                        } else {
                            alreadyUsedItems[item[itemKey]] = 1;
                        }
                    }
                }
                if (build[10]) {
                    alreadyUsedEspers.push(build[10].name);
                }
            } else {
                for (var index = 0; index < 10; index++) {
                    if (builds[i].fixedItems[index]) {
                        var item = builds[i].fixedItems[index];
                        if (item) {
                            if (alreadyUsedItems[item[itemKey]]) {
                                alreadyUsedItems[item[itemKey]]++;
                            } else {
                                alreadyUsedItems[item[itemKey]] = 1;
                            }
                        }   
                    }
                }
                if (builds[i].fixedItems[10]) {
                    alreadyUsedEspers.push(builds[i].fixedItems[10].name);
                }
            }
            
        } else {
            for (var index = 0; index < 10; index++) {
                if (builds[i].fixedItems[index]) {
                    var item = builds[i].fixedItems[index];
                    if (item) {
                        if (alreadyUsedItems[item[itemKey]]) {
                            alreadyUsedItems[item[itemKey]]++;
                        } else {
                            alreadyUsedItems[item[itemKey]] = 1;
                        }
                    }   
                }
            }
            if (builds[i].fixedItems[10]) {
                alreadyUsedEspers.push(builds[i].fixedItems[10].name);
            }
        }
    }
}

function readGoal(index = currentUnitIndex) {
    var goal = $(".goal select").val();
    
    if (goal == "magicalDamage" && $(".magicalSkillType select").val() == "physicalMagic") {
        builds[currentUnitIndex].goal = "magicalDamageWithPhysicalMecanism";
    } else {
        builds[currentUnitIndex].goal = goal;
    }
}

function prepareEquipable() {
    equipable = [[],[],[],[],["accessory"],["accessory"],["materia"],["materia"],["materia"],["materia"],["esper"]];
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
}

function prepareData(equipable) {
    exludeEventEquipment = $("#exludeEvent").prop('checked');
    excludeTMR5 = $("#excludeTMR5").prop('checked');
    excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
    excludePremium = $("#excludePremium").prop("checked");
    
    desirableElements = [];
    for (var index = 0, len = builds[currentUnitIndex].selectedUnit.skills.length; index < len; index++) {
        var skill = builds[currentUnitIndex].selectedUnit.skills[index];
        if (skill.equipedConditions && skill.equipedConditions.length == 1 && elementList.includes(skill.equipedConditions[0]) && !desirableElements.includes(skill.equipedConditions[0])) {
            desirableElements.push(skill.equipedConditions[0]);
        }
    }
    
    var baseValues = {
        "hp": builds[currentUnitIndex].selectedUnit.stats.maxStats.hp + builds[currentUnitIndex].selectedUnit.stats.pots.hp,
        "mp": builds[currentUnitIndex].selectedUnit.stats.maxStats.mp + builds[currentUnitIndex].selectedUnit.stats.pots.mp,
        "atk": builds[currentUnitIndex].selectedUnit.stats.maxStats.atk + builds[currentUnitIndex].selectedUnit.stats.pots.atk,
        "def": builds[currentUnitIndex].selectedUnit.stats.maxStats.def + builds[currentUnitIndex].selectedUnit.stats.pots.def,
        "mag": builds[currentUnitIndex].selectedUnit.stats.maxStats.mag + builds[currentUnitIndex].selectedUnit.stats.pots.mag,
        "spr": builds[currentUnitIndex].selectedUnit.stats.maxStats.spr + builds[currentUnitIndex].selectedUnit.stats.pots.spr
    }

    
    dataByType = {};
    dataWithCondition = [];
    dualWieldSources = [];
    var tempData = {};
    var adventurersAvailable = {};
    
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (itemsToExclude.includes(item.id)) {
            continue;
        }
        prepareItem(item, baseValues);
        if (getAvailableNumber(item) > 0 && isApplicable(item) && (equipable.includes(item.type) || item.type == "accessory" || item.type == "materia")) {
            if (itemCanBeOfUseForGoal(item)) {
                if (adventurerIds.includes(item.id)) { // Manage adventurers to only keep the best available
                    adventurersAvailable[item.id] = item;
                    continue;
                }
                if (item.equipedConditions) {
                    dataWithCondition.push(getItemEntry(item));
                } else {
                    if (!dataByType[item.type]) {dataByType[item.type] = [];}
                    dataByType[item.type].push(getItemEntry(item));
                }
            }
            if ((item.special && item.special.includes("dualWield")) || item.partialDualWield) {
                dualWieldSources.push(item);
            }
        }
    }
    for (var index = adventurerIds.length -1; index >=0; index--) { // Manage adventurers  to only keep the best available
        if (adventurersAvailable[adventurerIds[index]]) {
            dataByType["materia"].push(getItemEntry(adventurersAvailable[adventurerIds[index]]));
            break;
        }
    }
    dataWithCondition.sort(function(entry1, entry2) {
        if (entry1.item[itemKey] == entry2.item[itemKey]) {
            return entry2.item.equipedConditions.length - entry1.item.equipedConditions.length;
        } else {
            return entry1.item[itemKey] - entry2.item[itemKey];
        }
    })
    for (var typeIndex = 0, len = typeList.length; typeIndex < len; typeIndex++) {
        var type = typeList[typeIndex];
        var numberNeeded = 1;
        if (weaponList.includes(type) || type == "accessory") {numberNeeded = 2}
        if (type == "materia") {numberNeeded = 4}
        if (dataByType[type] && dataByType[type].length > 0) {
            var numberNeeded = 1;
            if (weaponList.includes(type) || type == "accessory") {numberNeeded = 2}
            if (type == "materia") {numberNeeded = 4}
            var tree = addConditionItemsTree(dataByType[type], type, numberNeeded);
            dataByType[type] = [];
            for (var index = 0, lenChildren = tree.children.length; index < lenChildren; index++) {
                addEntriesToResult(tree.children[index], dataByType[type], 0, numberNeeded, true);    
            }
            dataByTypeIds[type]= [];
            for (var itemIndex = itemLen = dataByType[type].length; itemIndex--;) {
                dataByTypeIds[type].push(dataByType[type][itemIndex].item[itemKey]);
            }
        } else {
            dataByType[type] = [{"item":getPlaceHolder(type),"available":numberNeeded}];  
        }
    }
}

function getItemEntry(item) {
    return {
        "item":item, 
        "name":item.name, 
        "defenseValue":getDefenseValue(item),
        "available":getAvailableNumber(item)
    };
}

function prepareItem(item, baseValues) {
    for (var index = 0, len = baseStats.length; index < len; index++) {
        item['total_' + baseStats[index]] = getStatValueIfExists(item, baseStats[index], baseValues[baseStats[index]]);
    }
    if (item.element && !includeAll[builds[currentUnitIndex].innateElements, item.elements]) {
        item.elementType = "element_" + getElementCoef(item.element);
    } else {
        item.elementType = "neutral"
    }
    if (weaponList.includes(item.type)) {
        item.meanDamageVariance = 1;
        if (item.damageVariance) {
            item.meanDamageVariance = (item.damageVariance.min + item.damageVariance.max) / 2
        }
    }
}

function itemCanBeOfUseForGoal(item) {
    var stats = goals[builds[currentUnitIndex].goal].statsToMaximize;

    for (var index = 0, len = stats.length; index < len; index++) {
        if (getValue(item, stats[index]) > 0) return true;
        if (item["total_" + stats[index]]) return true;
        if (item.singleWielding && item.singleWielding[stats[index]]) return true;
        if (item.singleWieldingOneHanded && item.singleWieldingOneHanded[stats[index]]) return true;
    }
    if (goals[builds[currentUnitIndex].goal].applicableKillerType != "none") {
        if (getKillerCoef(item) > 0) return true;
    }
    if (goals[builds[currentUnitIndex].goal].useWeaponsElements) {
        if (item.element && getElementCoef(item.element) >= 0) return true;
    }
    if (desirableElements.length != 0) {
        if (item.element && matches(item.element, desirableElements)) return true;
    }
}

function getPlaceHolder(type) {
    return {"name":"Any " + type,"type":type, "placeHolder":true};
}

function selectEspers() {
    selectedEspers = [];
    var maxValueEsper = null;
    var keptEsperRoot = {"parent":null,"children":[],"root":true};
    for (var index = espers.length; index--;) {
        if (!alreadyUsedEspers.includes(espers[index].name)) {
            var newTreeEsper = {"esper":espers[index],"parent":null,"children":[],"equivalents":[]};
            insertItemIntoTree(keptEsperRoot, newTreeEsper, 1, getEsperComparison, getEsperDepth);
        }
    }
    for (var index = keptEsperRoot.children.length; index--;) {
        if (!selectedEspers.includes(keptEsperRoot.children[index])) {
            selectedEspers.push(getEsperItem(keptEsperRoot.children[index].esper));
        }
    }
}

function getEsperComparison(treeNode1, treeNode2) {
    if (treeNode1.root) {
        return "strictlyWorse"; 
    }
    var comparisionStatus = [];
    var stats = goals[builds[currentUnitIndex].goal].statsToMaximize;
    for (var index = stats.length; index--;) {
        comparisionStatus.push(compareByValue(treeNode1.esper, treeNode2.esper, stats[index]));
    }
    if (goals[builds[currentUnitIndex].goal].applicableKillerType != "none") {
        comparisionStatus.push(compareByKillers(treeNode1.esper, treeNode2.esper));
    }
    return combineComparison(comparisionStatus);
}

function getEsperDepth(treeItem, currentDepth) {
    return currentDepth + 1;
}

function getKillerCoef(item) {
    var cumulatedKiller = 0;
    if (ennemyRaces.length > 0 && item.killers) {
        for (var killerIndex = item.killers.length; killerIndex--;) {
            if (ennemyRaces.includes(item.killers[killerIndex].name) && item.killers[killerIndex][goals[builds[currentUnitIndex].goal].applicableKillerType]) {
                cumulatedKiller += item.killers[killerIndex][goals[builds[currentUnitIndex].goal].applicableKillerType];
            }
        }
    }
    return cumulatedKiller / ennemyRaces.length;
}
 
function getElementCoef(elements) {
    var resistModifier = 0;

    if (elements.length > 0) {
        for (var element in ennemyResist) {
            if (elements.includes(element)) {
                resistModifier += ennemyResist[element] / 100;
            }
        }    
        resistModifier = resistModifier / elements.length;
    }
    return resistModifier;
}

function readEnnemyResists() {
    for(var element in ennemyResist) {
        var value = $("#elementalResists td." + element + " input").val();
        if (value) {
            ennemyResist[element] = parseInt(value);
        } else {
            ennemyResist[element] = 0;
        }
    }
}

function optimize() {
    console.time("optimize");
    progress = 0;
    progressElement.width("0%");
    progressElement.text("0%");
    progressElement.removeClass("finished");
    var combinations = [];
    typeCombination = [null, null, null, null, null, null, null, null, null, null];
    buildTypeCombination(0,typeCombination, combinations,builds[currentUnitIndex].fixedItems.slice(), true);
    
    var fixedItems = builds[currentUnitIndex].fixedItems;
    var unitPartialDualWield = getInnatePartialDualWield();
    var forceDoubleHand = $("#forceDoublehand input").prop('checked');
    if (!forceDoubleHand && unitPartialDualWield && (!fixedItems[0] || unitPartialDualWield.includes(fixedItems[0].type))) { // Only try partial dual wield if no weapon fixed, or one weapon fixed of the partial dual wield type
        var savedEquipable0 = equipable[0];
        var savedEquipable1 = equipable[1];
        
        equipable[0] = unitPartialDualWield;
        equipable[1] = unitPartialDualWield;
        buildTypeCombination(0,typeCombination,combinations, fixedItems.slice());
        
        equipable[0] = savedEquipable0;
        equipable[1] = savedEquipable1;
    }
    if (!forceDoubleHand && !hasInnateDualWield() && dualWieldSources.length > 0 && !(builds[currentUnitIndex].fixedItems[0] && isTwoHanded(builds[currentUnitIndex].fixedItems[0]))) {
        setTimeout(tryDualWieldSourceAsync,1,0,typeCombination,combinations,fixedItems,unitPartialDualWield);
    } else {
        findBestBuildForCombinationAsync(0, combinations);
    }
}

function tryDualWieldSourceAsync(dualWieldSourceIndex,typeCombination,combinations,fixedItems,unitPartialDualWield) {
    if (dualWieldSources.length > dualWieldSourceIndex) {
        var item = dualWieldSources[dualWieldSourceIndex];
        var slot = getFixedItemItemSlot(item, equipable, builds[currentUnitIndex].fixedItems);
        if (slot != -1) {   
            var fixedItems = builds[currentUnitIndex].fixedItems.slice();
            fixedItems[slot] = item;
            var savedEquipable0 = equipable[0];
            if (item.partialDualWield) {
                equipable[0] = item.partialDualWield;
                equipable[1] = item.partialDualWield;
                if (unitPartialDualWield) {
                    equipable[1] = mergeArrayWithoutDuplicates(equipable[1], unitPartialDualWield);
                }
            } else {
                equipable[1] = equipable[0];
            }
            buildTypeCombination(0,typeCombination,combinations,fixedItems);
            builds[currentUnitIndex].fixedItems[slot] = null;
            equipable[0] = savedEquipable0;
        }
        setTimeout(tryDualWieldSourceAsync,1,dualWieldSourceIndex+1,typeCombination,combinations,fixedItems,unitPartialDualWield);
    } else {
        setTimeout(findBestBuildForCombinationAsync,1, 0, combinations);
    }
}
    
function getFixedItemItemSlot(item, equipable, fixedItems) {
    var slot = -1;
    var forceDoubleHand = $("#forceDoublehand input").prop('checked');
    if (weaponList.includes(item.type)) {
        if (fixedItems[0] && fixedItems[1]) {
            return -1;
        }
        if (!fixedItems[0]) {
            return 0;
        } else {
            if (!forceDoubleHand && equipable[1].includes(item.type)) {
                return 1;
            } else {
                return -1;
            }
        }
    } else if (shieldList.includes(item.type)) {    
        if (fixedItems[1]) {
            return -1;
        }
        return 1;
    } else if (headList.includes(item.type)) {    
        if (fixedItems[2]) {
            return -1;
        }
        return 2;
    } else if (bodyList.includes(item.type)) {    
        if (fixedItems[3]) {
            return -1;
        }
        return 3;
    } else if (item.type == "accessory") {
        if (fixedItems[4] && fixedItems[5]) {
            return -1;
        }
        if (!fixedItems[4]) {
            return 4;
        } else {
            return 5;
        }
    } else if (item.type == "materia") {
        if (fixedItems[6] && fixedItems[7] && fixedItems[8] && fixedItems[9]) {
            return -1;
        }
        if (!fixedItems[6]) {
            return 6;
        } else if (!fixedItems[7]) {
            return 7;
        } else if (!fixedItems[8]) {
            return 8;
        } else {
            return 9;
        }
    } else if (item.type == "esper") {
        return 10;
    }
    return slot;
}

function buildTypeCombination(index, typeCombination, combinations, fixedItems, tryDoublehand = false, forceDoublehand = false) {
    if (fixedItems[index]) {
        if (equipable[index].length > 0 && equipable[index].includes(fixedItems[index].type)) {
            tryType(index, typeCombination, fixedItems[index].type, combinations, fixedItems, tryDoublehand);
        } else {
            return;
        }
    } else {
        if (equipable[index].length > 0) 
            if (index == 1 && 
                    ((fixedItems[0] && isTwoHanded(fixedItems[0])) 
                    || forceDoublehand)) { // if a two-handed weapon was fixed, no need to try smething in the second hand
                tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand, forceDoublehand);
            } else {
                var found = false;
                for (var typeIndex = 0, len = equipable[index].length; typeIndex < len; typeIndex++) {
                    type = equipable[index][typeIndex]
                    if (index == 1 && !fixedItems[0] && alreadyTriedInSlot0(type, typeCombination[0], equipable[0])) {
                        continue;
                    }
                    if (dataByType[type].length > 0) {
                        tryType(index, typeCombination, type, combinations, fixedItems, tryDoublehand, forceDoublehand);
                        found = true;
                    }
                }
                if (!found) {
                    tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand, forceDoublehand);
                } else if (index == 1 && tryDoublehand) {
                    tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand, forceDoublehand);
                }
        } else {
            tryType(index, typeCombination, null, combinations, fixedItems, tryDoublehand);
        }
    }
}

function tryType(index, typeCombination, type, combinations, fixedItems, tryDoublehand, forceDoublehand) {
    typeCombination[index] = type;
    if (index == 9) {
        build = [null, null, null, null, null, null, null, null, null, null, null];
        numberOfItemCombination = 0;
        var dataWithdConditionItems = {}
        for (var slotIndex = 0; slotIndex < 10; slotIndex++) {
            if (typeCombination[slotIndex] && !dataWithdConditionItems[typeCombination[slotIndex]]) {
                dataWithdConditionItems[typeCombination[slotIndex]] = addConditionItems(dataByType[typeCombination[slotIndex]], typeCombination[slotIndex], typeCombination, fixedItems);
            }
        }
        var applicableSkills = [];
        for (var skillIndex = builds[currentUnitIndex].selectedUnit.skills.length; skillIndex--;) {
            var skill = builds[currentUnitIndex].selectedUnit.skills[skillIndex];
            if (areConditionOKBasedOnTypeCombination(skill, typeCombination)) {
                applicableSkills.push(skill);
            }
        }
        
        combinations.push({"combination":typeCombination.slice(), "data":dataWithdConditionItems, "fixed":getBestFixedItemVersions(fixedItems,typeCombination),"applicableSkills":applicableSkills,"elementBasedSkills":getElementBasedSkills()});
    } else {
        buildTypeCombination(index+1, typeCombination, combinations, fixedItems, tryDoublehand, forceDoublehand);
    }
}

function getBestFixedItemVersions(fixedItems, typeCombination) {
    var typeCombinationBuild = [null, null, null, null, null, null, null, null, null, null];
    var result = fixedItems.slice();
    for (var i = 0; i < 10; i++) {
        if (fixedItems[i]) {
            typeCombinationBuild[i] = fixedItems[i];
        } else if (typeCombination[i]) {
            typeCombinationBuild[i] = {"type":typeCombination[i]};
        }
    }
 
    for (var index = 0; index < 10; index++) {
        if (fixedItems[index]) {
            result[index] = findBestItemVersion(typeCombinationBuild, fixedItems[index][itemKey]);
        }
    }
    return result;
}

function alreadyTriedInSlot0(type, typeSlot0, equipableSlot0) {
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

function logDataWithdConditionItems(dataWithdConditionItems) {
    for (var index in dataWithdConditionItems) {
        logAddConditionItems(dataWithdConditionItems[index]);
    }
}

function findBestBuildForCombinationAsync(index, combinations) {
    var nextAsync = Date.now() + 1000;
    var len = combinations.length;
    while (index < len && Date.now() < nextAsync) {
        var build = [null, null, null, null, null, null, null, null, null, null,null].concat(combinations[index].applicableSkills);
        findBestBuildForCombination(0, build, combinations[index].combination, combinations[index].data, combinations[index].fixed, combinations[index].elementBasedSkills);
        index++
    }
    
    var newProgress = Math.floor((index)/combinations.length*100);
    if (progress != newProgress) {
        progress = newProgress;
        progressElement.width(progress + "%");
        progressElement.text(progress + "%");    
    }
    
    //console.log(Math.floor(index/combinations.length*100) + "%" );
    
    if (index < combinations.length) {
        setTimeout(findBestBuildForCombinationAsync,0,index,combinations);
    } else {
        logCurrentBuild();
        progressElement.addClass("finished");
        console.timeEnd("optimize");
    }
}

function getPiramidataImageLink() {
    var link = "http://ffbe.piramidata.eu/Unit/GetConfigurationImage?" +
        "unitname=" + encodeURIComponent(builds[currentUnitIndex].selectedUnitName) + 
        "&rarity=" + builds[currentUnitIndex].selectedUnit.max_rarity +
        "&pothp=" + builds[currentUnitIndex].selectedUnit.stats.pots.hp +
        "&potmp=" + builds[currentUnitIndex].selectedUnit.stats.pots.mp +
        "&potatk=" + builds[currentUnitIndex].selectedUnit.stats.pots.atk +
        "&potdef=" + builds[currentUnitIndex].selectedUnit.stats.pots.def +
        "&potmag=" + builds[currentUnitIndex].selectedUnit.stats.pots.mag +
        "&potspr=" + builds[currentUnitIndex].selectedUnit.stats.pots.spr;
    if (builds[currentUnitIndex].bestBuild[10]) {
        link += "&espername=" + encodeURIComponent(getEsperName()) + 
            "&esperhp=" + builds[currentUnitIndex].bestBuild[10].hp + 
            "&espermp=" + builds[currentUnitIndex].bestBuild[10].mp +
            "&esperatk=" + builds[currentUnitIndex].bestBuild[10].atk +
            "&esperdef=" + builds[currentUnitIndex].bestBuild[10].def +
            "&espermag=" + builds[currentUnitIndex].bestBuild[10].mag +
            "&esperspr=" + builds[currentUnitIndex].bestBuild[10].spr;
    }
    link += "&rhand=" + getItemId(0) +
        "&lhand=" + getItemId(1) +
        "&head=" + getItemId(2) +
        "&body=" + getItemId(3) +
        "&acc1=" + getItemId(4) +
        "&acc2=" + getItemId(5) +
        "&ability1=" + getItemId(6) +
        "&ability2=" + getItemId(7) +
        "&ability3=" + getItemId(8) +
        "&ability4=" + getItemId(9) +
        "&enh1=" + encodeURIComponent(getEnhancementSkill(0)) +
        "&enh2=" + encodeURIComponent(getEnhancementSkill(1)) +
        "&enh3=" + encodeURIComponent(getEnhancementSkill(2)) +
        "&enh4=" + encodeURIComponent(getEnhancementSkill(3)) +
        "&enh5=" + encodeURIComponent(getEnhancementSkill(4)) +
        "&enh6=" + encodeURIComponent(getEnhancementSkill(5));
    return link;
}

function getItemId(slot) {
    if (builds[currentUnitIndex].bestBuild[slot] && !builds[currentUnitIndex].bestBuild[slot].placeHolder) {
        return builds[currentUnitIndex].bestBuild[slot].id;
    } else {
        return "0";
    }
}

function getEnhancementSkill(index) {
    if (builds[currentUnitIndex].selectedUnit.enhancementSkills && builds[currentUnitIndex].selectedUnit.enhancementSkills.length > index) {
        return builds[currentUnitIndex].selectedUnit.enhancementSkills[index] + " Awk+2";
    } else {
        return "";
    }
}

function getEsperName() {
    if (builds[currentUnitIndex].bestBuild[10]) {
        var result = builds[currentUnitIndex].bestBuild[10].name + " ";
        for (var i = 0; i < builds[currentUnitIndex].bestBuild[10].maxLevel; i++) {
            result += "★";
        }
        return result;
    } else {
        return "";
    }
} 



function getFFBEBenImageLink() {
    var hash = "";
    hash += Number(builds[currentUnitIndex].selectedUnit.id).toString(36);
    for (var i = 0; i < 10; i++) {
        item = builds[currentUnitIndex].bestBuild[i];
        if (item) {
            hash += Number(item.id).toString(36);
        } else {
            hash += 999999999..toString(36);
        }
    }
    return "http://ffbeben.ch/" + hash + ".png";
}

function findBestBuildForCombination(index, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills) {
    if (index == 2) {
        // weapon set, try elemental based skills
        for (var skillIndex = elementBasedSkills.length; skillIndex--;) {
            if (build.includes(elementBasedSkills[skillIndex])) {
                if (!areConditionOK(elementBasedSkills[skillIndex], build)) {
                    build.splice(build.indexOf(elementBasedSkills[skillIndex]),1);
                }
            } else {
                if (areConditionOK(elementBasedSkills[skillIndex], build)) {
                    build.push(elementBasedSkills[skillIndex]);
                }
            }
        }
    }
    
    if (fixedItems[index]) {
        tryItem(index, build, typeCombination, dataWithConditionItems, fixedItems[index], fixedItems,elementBasedSkills);
    } else {
        if (index == 1 && build[0] && isTwoHanded(build[0])) {
            build[index] = null;
            var typeCombinationWithoutSecondHand = typeCombination.slice();
            typeCombinationWithoutSecondHand[1] = null;
            findBestBuildForCombination(index + 1, build, typeCombinationWithoutSecondHand, dataWithConditionItems, fixedItems, elementBasedSkills);    
        } else {
            if (typeCombination[index]  && dataWithConditionItems[typeCombination[index]].children.length > 0) {
                var itemTreeRoot = dataWithConditionItems[typeCombination[index]];
                var foundAnItem = false;
                
                var len = itemTreeRoot.children.length;
                for (var childIndex = 0; childIndex < len; childIndex++) {
                    var entry = itemTreeRoot.children[childIndex].entry;
                    var item = entry.item;
                    var numberRemaining = entry.available;
                    if (numberRemaining > 0) {
                        if (index == 1 && isTwoHanded(item)) {
                            continue;
                        }
                        
                        if (numberRemaining == 1 && (index == 0 ||index == 4 || index == 6 || index == 7 || index == 8)) {
                            // We used all possible copy of this item, switch to a worse item in the tree
                            var newTreeRoot = {"children":itemTreeRoot.children.slice()};
                            if (newTreeRoot.children[childIndex].equivalents.length > 0) {
                                var newEquivalents = newTreeRoot.children[childIndex].equivalents.slice();
                                newEquivalents.splice(0,1);
                                var newTreeNode = {"children":newTreeRoot.children[childIndex].children,"equivalents":newEquivalents,entry:newTreeRoot.children[childIndex].equivalents[0]};
                                newTreeRoot.children[childIndex] = newTreeNode;
                            } else if (newTreeRoot.children[childIndex].children.length > 0) {
                                // add the children of the node to root level
                                for (var childrenOfNodeIndex = 0, childrenOfNodeLen = newTreeRoot.children[childIndex].children.length; childrenOfNodeIndex < childrenOfNodeLen; childrenOfNodeIndex++) {
                                    newTreeRoot.children.push(newTreeRoot.children[childIndex].children[childrenOfNodeIndex]);
                                }
                                newTreeRoot.children.splice(childIndex,1);
                            } else {
                                // we finished this branch, remove it
                                newTreeRoot.children.splice(childIndex,1);
                            }
                            dataWithConditionItems[typeCombination[index]] = newTreeRoot;
                        }
                        entry.available--;
                        tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills);
                        entry.available++;
                        dataWithConditionItems[typeCombination[index]] = itemTreeRoot;
                        foundAnItem = true;
                    }
                }
                if (!foundAnItem) {
                    tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills);
                }
                build[index] == null;
            } else {
                tryItem(index, build, typeCombination, dataWithConditionItems, null, fixedItems, elementBasedSkills);
            }
        }
    }
    build[index] = null;
}

function tryItem(index, build, typeCombination, dataWithConditionItems, item, fixedItems, elementBasedSkills) {
    build[index] = item;
    if (index == 9) {
        numberOfItemCombination++
        if (fixedItems[10]) {
            tryEsper(build, fixedItems[10]);
        } else {
            for (var esperIndex = 0, len = selectedEspers.length; esperIndex < len; esperIndex++) {
                tryEsper(build, selectedEspers[esperIndex])    
            }
        }
    } else {
        findBestBuildForCombination(index + 1, build, typeCombination, dataWithConditionItems, fixedItems, elementBasedSkills);
    }
}

function tryEsper(build, esper) {
    build[10] = esper;
    var value = calculateBuildValue(build);
    if (builds[currentUnitIndex].bestValue == null || value > builds[currentUnitIndex].bestValue) {
        builds[currentUnitIndex].bestBuild = build.slice();
        builds[currentUnitIndex].bestValue = value;
        logCurrentBuild();
    }
}

function addConditionItems(itemsOfType, type, typeCombination, fixedItems) {
    var tempResult = itemsOfType.slice();
    var dataWithConditionKeyAlreadyAdded = [];
    for (var index = 0, len = dataWithCondition.length; index < len; index++) {
        var entry = dataWithCondition[index];
        var item = entry.item;
        if (item.type == type && !dataWithConditionKeyAlreadyAdded.includes(item[itemKey])) {
            var allFound = true;
            for (var conditionIndex in item.equipedConditions) {
                if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                    allFound = false;
                    break;
                }
            }
            if (allFound) {
                if (dataByTypeIds[type].includes(entry.item[itemKey])) {
                    for (var alreadyAddedIndex = tempResult.length; alreadyAddedIndex--;) {
                        if (tempResult[alreadyAddedIndex].item[itemKey] == entry.item[itemKey]) {
                            tempResult.splice(alreadyAddedIndex,1);
                            break;    
                        }
                    }
                }
                
                tempResult.push(entry);
                dataWithConditionKeyAlreadyAdded.push(item[itemKey]);
                
            }
        }
    }
    var numberNeeded = 0;
    for (var slotIndex = typeCombination.length; slotIndex--;) {
        if (typeCombination[slotIndex] == type && !fixedItems[slotIndex]) {
            numberNeeded++;
        }
    }
    
    return addConditionItemsTree(tempResult, type, numberNeeded, typeCombination, fixedItems);
}

function addConditionItemsTree(itemsOfType, type, numberNeeded, typeCombination, fixedItems) {
    var result = [];
    var keptItemsRoot = {"parent":null,"children":[],"root":true,"available":0};
    if (itemsOfType.length > 0) {
        for (var index = itemsOfType.length; index--;) {
            var entry = itemsOfType[index];
            
            if (typeCombination && isTwoHanded(entry.item) && (typeCombination[1] || fixedItems[0] || fixedItems[1])) {
                continue; // ignore 2 handed weapon if we are in a DW build, or a weapon was already fixed
            }
            if (builds[currentUnitIndex].fixedItemsIds.includes(entry.item[itemKey]) && getAvailableNumber(entry.item) < 1) {
                continue;
            }
            
            var newTreeItem = {"entry":entry,"parent":null,"children":[],"equivalents":[]};
            //console.log("Considering " + entry.item.name);
            insertItemIntoTree(keptItemsRoot, newTreeItem, numberNeeded, getItemNodeComparison, getItemDepth);
            //logTree(keptItemsRoot);
        }
    }
    /*for (var index in keptItemsRoot.children) {
        addEntriesToResult(keptItemsRoot.children[index], result, 0, numberNeeded, keepEntry);    
    }*/
    cutUnderMaxDepth(keptItemsRoot, numberNeeded, getItemDepth, 0);
    return keptItemsRoot;
}

function addEntriesToResult(tree, result, keptNumber, numberNeeded, keepEntry) {
    var equivalents = tree.equivalents.concat([tree.entry]);
    
    equivalents.sort(function(entry1, entry2) {
        if (entry1.defenseValue == entry2.defenseValue) {
            return entry2.available - entry1.available;    
        } else {
            return entry2.defenseValue - entry1.defenseValue;    
        }
    });
    for (var index = 0, len = equivalents.length; index < len; index++) {
        if (keptNumber >= numberNeeded) {
            break;
        }
        if (keepEntry) {
            result.push(equivalents[index]);
        } else {
            result.push(equivalents[index].item);
        }
        keptNumber += equivalents[index].available;
    }
    if (keptNumber < numberNeeded) {
        for (var index = 0, len = tree.children.length; index < len; index++) {
            addEntriesToResult(tree.children[index], result, keptNumber, numberNeeded, keepEntry);    
        }
    }
}

function logTree(tree, addedEntry = null, currentLine = "", currentDepth = 0) {
    var currentDepth = getItemDepth(tree, currentDepth) ;
    var itemName;
    if (tree.root) {
        itemName = "ROOT"
    } else {
        itemName = tree.entry.item.name + " (" + currentDepth + "))";
    }
    if (addedEntry && addedEntry == tree.entry) {
        itemName = "**" + itemName + "**";
    }
    var currentLine = currentLine + " | " + itemName;
    if (tree.children.length == 0) {
        console.log(currentLine);
    } else {
        var space = new Array(currentLine.length + 1).join( " " );
        for (var index in tree.children) {
            if (index == 0) {
                logTree(tree.children[index], addedEntry, currentLine,currentDepth);
            } else {
                logTree(tree.children[index], addedEntry, space,currentDepth);
            }
        }
    }
}


function insertItemIntoTree(treeItem, newTreeItem, maxDepth, comparisonFunction, depthFunction, currentDepth = 0) {
    var comparison = comparisonFunction(treeItem, newTreeItem);
    switch (comparisonFunction(treeItem, newTreeItem)) {
        case "strictlyWorse":
            // Entry is strictly worse than treeItem
            if (currentDepth < maxDepth) {
                var inserted = false
                for (var index = 0, len = treeItem.children.length; index < len; index++) {
                    inserted = inserted || insertItemIntoTree(treeItem.children[index], newTreeItem, maxDepth, comparisonFunction, depthFunction, depthFunction(treeItem.children[index], currentDepth));
                }

                if (!inserted) {
                    newTreeItem.parent = treeItem;
                    treeItem.children.push(newTreeItem);
                    //console.log("Inserted " + newTreeItem.entry.name + "("+ newTreeItem.hp + " - " + newTreeItem.def +") under " + treeItem.entry.name + "("+ treeItem.hp + " - " + treeItem.def +")");
                }
                if (treeItem.children.indexOf(newTreeItem) != -1) {
                    var indexToRemove = [];
                    for (var index = 0, len = treeItem.children.length; index < len; index++) {
                        var oldTreeItem = treeItem.children[index]
                        if (oldTreeItem != newTreeItem && comparisonFunction(oldTreeItem, newTreeItem) == "strictlyBetter") {
                            indexToRemove.push(index);
                            insertItemIntoTree(newTreeItem, oldTreeItem, maxDepth, comparisonFunction, depthFunction,depthFunction(newTreeItem, currentDepth));
                        }
                    }
                    for (var index = indexToRemove.length - 1; index >= 0; index--) {
                        treeItem.children.splice(indexToRemove[index], 1);
                    }
                }
            }
            break;
        case "equivalent":
            // entry is equivalent to treeItem
            treeItem.equivalents.push(newTreeItem.entry);
            var equivalents = treeItem.equivalents.concat([treeItem.entry]);
    
            equivalents.sort(function(entry1, entry2) {
                if (entry1.defenseValue == entry2.defenseValue) {
                    return entry2.available - entry1.available;    
                } else {
                    return entry2.defenseValue - entry1.defenseValue;    
                }
            });
            treeItem.entry = equivalents[0];
            equivalents.splice(0,1);
            treeItem.equivalents = equivalents;
            //console.log("Inserted " + newTreeItem.entry.name + "("+ newTreeItem.hp + " - " + newTreeItem.def +") as equivalent of " + treeItem.entry.name + "("+ treeItem.hp + " - " + treeItem.def +")");
            break;
        case "strictlyBetter":
            // entry is strictly better than treeItem
            var parentDepth = currentDepth - depthFunction(treeItem, 0);
            newTreeItem.parent = treeItem.parent;
            var index = treeItem.parent.children.indexOf(treeItem);
            treeItem.parent.children[index] = newTreeItem;
            newTreeItem.children = [treeItem];
            treeItem.parent = newTreeItem;
            cutUnderMaxDepth(newTreeItem, maxDepth, depthFunction, depthFunction(newTreeItem, parentDepth));
            //console.log("Inserted " + newTreeItem.entry.name + "("+ newTreeItem.hp + " - " + newTreeItem.def +") in place of " + treeItem.entry.name + "("+ treeItem.hp + " - " + treeItem.def +")");
            break;
        case "sameLevel":
            // Should be inserted at the same level.
            return false;
    }
    return true;
}

function getItemNodeComparison(treeNode1, treeNode2) {
    if (treeNode1.root) {
        return "strictlyWorse"; 
    }
    var comparisionStatus = [];
    var stats = goals[builds[currentUnitIndex].goal].statsToMaximize;
    for (var index = stats.length; index--;) {
        if (builds[currentUnitIndex].goal != "physicaleHp" && builds[currentUnitIndex].goal != "magicaleHp" ) {
            comparisionStatus.push(compareByValue(treeNode1.entry.item, treeNode2.entry.item, stats[index]));
        }
        comparisionStatus.push(compareByValue(treeNode1.entry.item, treeNode2.entry.item, "total_" + stats[index]));
        comparisionStatus.push(compareByValue(treeNode1.entry.item, treeNode2.entry.item, "singlWielding." + stats[index]));
        comparisionStatus.push(compareByValue(treeNode1.entry.item, treeNode2.entry.item, "singleWieldingOneHanded." + stats[index]));
    }
    if (goals[builds[currentUnitIndex].goal].applicableKillerType != "none") {
        comparisionStatus.push(compareByKillers(treeNode1.entry.item, treeNode2.entry.item));
    }
    if (goals[builds[currentUnitIndex].goal].useWeaponsElements) {
        comparisionStatus.push(compareByElementCoef(treeNode1.entry.item, treeNode2.entry.item));
    }
    if (desirableElements.length != 0) {
        comparisionStatus.push(compareByEquipedElementCondition(treeNode1.entry.item, treeNode2.entry.item));
    }
    comparisionStatus.push(compareByNumberOfHandsNeeded(treeNode1.entry.item, treeNode2.entry.item));
    if (builds[currentUnitIndex].goal == "physicalDamage") {
        comparisionStatus.push(compareByValue(treeNode1.entry.item, treeNode2.entry.item, "meanDamageVariance"));
    }
    
    return combineComparison(comparisionStatus);
}

function combineComparison(comparisionStatus) {
    var result = "equivalent";
    for (var index = comparisionStatus.length; index--;) {
        if (comparisionStatus[index] == "sameLevel") {
            return "sameLevel";
        }
        switch (result) {
            case "equivalent":
                result = comparisionStatus[index];
                break;
            case "strictlyWorse":
                if (comparisionStatus[index] == "strictlyBetter") {
                    return "sameLevel";
                }
                break;
            case "strictlyBetter":
                if (comparisionStatus[index] == "strictlyWorse") {
                    return "sameLevel";
                }
                break;
        }
    }
    return result;
}

function compareByValue(item1, item2, valuePath) {
    var value1 = getValue(item1, valuePath);
    var value2 = getValue(item2, valuePath);
    if (value1 > value2) {
        return "strictlyWorse"
    } else if (value1 < value2){
        return "strictlyBetter"
    } else {
        return "equivalent";
    }
}

function getValue(item, valuePath) {
    if (valuePath.indexOf('.') > -1) {
        var pathTokens = valuePath.split(".");
        var currentItem = item;
        for (var index = 0, len = pathTokens.length; index < len; index++) {
            if (currentItem[pathTokens[index]]) {
                currentItem = currentItem[pathTokens[index]];
            } else {
                return 0;
            }
        }
        return currentItem;
    } else {
        if (item[valuePath]) {
            return item[valuePath];
        } else {
            return 0;
        }
    }
}

function compareByNumberOfHandsNeeded(item1, item2) {
    if (isTwoHanded(item1)) {
        if (isTwoHanded(item2)) {
            return "equivalent";
        } else {
            return "sameLevel";
        }    
    } else {
        if (isTwoHanded(item2)) {
            return "sameLevel";
        } else {
            return "equivalent";
        }
    }
}


function compareByKillers(item1, item2) {
    if (ennemyRaces.length) {
        var applicableKillers1 = {};
        if (item1.killers) {
            for (var killerIndex = item1.killers.length; killerIndex--;) {
                if (ennemyRaces.includes(item1.killers[killerIndex].name) && item1.killers[killerIndex][goals[builds[currentUnitIndex].goal].applicableKillerType]) {
                    applicableKillers1[item1.killers[killerIndex].name] = item1.killers[killerIndex][goals[builds[currentUnitIndex].goal].applicableKillerType];
                }
            }
        }
        var applicableKillers2 = {};
        if (item2.killers) {
            for (var killerIndex = item2.killers.length; killerIndex--;) {
                if (ennemyRaces.includes(item2.killers[killerIndex].name) && item2.killers[killerIndex][goals[builds[currentUnitIndex].goal].applicableKillerType]) {
                    applicableKillers2[item2.killers[killerIndex].name] = item2.killers[killerIndex][goals[builds[currentUnitIndex].goal].applicableKillerType];
                }
            }
        }
        var result = "equivalent";
        for (var index in applicableKillers1) {
            if (!applicableKillers2[index]) {
                switch(result) {
                    case "equivalent":
                        result = "strictlyWorse";
                    case "strictlyBetter":
                        return "sameLevel";
                }
            } else {
                if (applicableKillers1[index] > applicableKillers2[index]) {
                    switch(result) {
                        case "equivalent":
                            result = "strictlyWorse";
                        case "strictlyBetter":
                            return "sameLevel";
                    }
                } else if (applicableKillers1[index] < applicableKillers2[index]) {
                    switch(result) {
                        case "equivalent":
                            result = "strictlyBetter";
                        case "strictlyWorse":
                            return "sameLevel";
                    }
                }
            }
        }
        for (var index in applicableKillers2) {
            if (!applicableKillers1[index]) {
                switch(result) {
                    case "equivalent":
                        result = "strictlyBetter";
                    case "strictlyWorse":
                        return "sameLevel";
                }
            }
        }
        return result;
    } else {
        return "equivalent";
    }
}

function compareByElementCoef(item1, item2) {
    if (item1.elementType == item2.elementType) {
        return "equivalent";
    } else {
        return "sameLevel";
    }
}

function compareByEquipedElementCondition(item1, item2) {
    if (desirableElements.length == 0) {
        return "equivalent";
    } else {
        if (item1.element && matches(desirableElements, item1.element)) {
            if (item2.element && matches(desirableElements, item2.element)) {
                var desirableElementsFromItem1 = [];
                var desirableElementsFromItem2 = [];
                for (var index = desirableElements.length; index--;) {
                    if(item1.element.includes(desirableElements[index])) {
                        desirableElementsFromItem1.push(desirableElements[index]);
                    }
                    if(item2.element.includes(desirableElements[index])) {
                        desirableElementsFromItem2.push(desirableElements[index]);
                    }
                    if (includeAll(desirableElementsFromItem1, desirableElementsFromItem2)) {
                        if (includeAll(desirableElementsFromItem1, desirableElementsFromItem2)) {
                            return "equivalent";
                        } else {
                            return "strictlyWorse";
                        }
                    } else {
                        if (includeAll(desirableElementsFromItem1, desirableElementsFromItem2)) {
                            return "strictlyBetter";
                        } else {
                            return "sameLevel";
                        }
                    }
                }
            } else {
                return "strictlyWorse";
            }    
        } else {
            if (item1.element && matches(desirableElements, item1.element)) {
                return "strictlyBetter";
            } else {
                return "equivalent";
            }
        }
    }
    
}

function getItemDepth(treeItem, currentDepth) {
    var result;
    if (treeItem.root) {
        return 0;
    }
    result = currentDepth + treeItem.entry.available;
    for (var index = treeItem.equivalents.length; index--;) {
        result += treeItem.equivalents[index].available;
    }
    return result;
}
    
function cutUnderMaxDepth(treeItem, maxDepth, depthFunction, currentDepth) {
    if (currentDepth >= maxDepth) {
        treeItem.children = [];
    } else {
        for (var index = treeItem.children.length; index--;) {
            cutUnderMaxDepth(treeItem.children[index], maxDepth, depthFunction, depthFunction(treeItem.children[index], currentDepth));
        }
    }
}

function getDefenseValue(item) {
    var hpBaseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats.hp + builds[currentUnitIndex].selectedUnit.stats.pots.hp;
    var defBaseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats.def + builds[currentUnitIndex].selectedUnit.stats.pots.def;
    var sprBaseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats.spr + builds[currentUnitIndex].selectedUnit.stats.pots.spr;
    return getStatValueIfExists(item, "hp", hpBaseValue) + getStatValueIfExists(item, "def", hpBaseValue) + getStatValueIfExists(item, "spr", hpBaseValue);
}

function getStatValueIfExists(item, stat, baseStat) {
    var result = 0;
    if (item[stat]) result += item[stat];
    if (item[percentValues[stat]]) result += item[percentValues[stat]] * baseStat / 100;
    return result;
}

function getWeaponElementDamageCoef(weaponElements) {
    var value = 0;
    for (var elementIndex = weaponElements.length; elementIndex--;) {
        value += ennemyResist[weaponElements[elementIndex]];
    }
    return value / weaponElements.length;
}

function logAddConditionItems(data) {
    var string = "";
    for (var index in data) {
        string += data[index].name + ", ";
    }
    console.log(string);
}

function howManyRemainingOfThisItem(build, item, currentIndex, fixedItems) {
    if (item.placeHolder){
        return 4;
    }
    var number = 0;
    var isAdventurer = adventurerIds.includes(item.id);
    for (var index = 0; index < currentIndex; index++) {
        if (build[index] && build[index].name == item.name) {
            if (!isStackable(item)) {
                return 0;
            }
            number++;
        }
        // Manage Adventurers not stackable 
        if (build[index] && isAdventurer && adventurerIds.includes(build[index].id)) {
            return 0;
        }
    }
    for (var index = currentIndex + 1; index < 10; index++) {
        if (fixedItems[index] && fixedItems[index].name == item.name) {
            if (!isStackable(item)) {
                return 0;
            }
            number++;
        }
        // Manage Adventurers not stackable 
        if (fixedItems[index] && isAdventurer && adventurerIds.includes(fixedItems[index].id)) {
            return 0;
        }
    }
    return getAvailableNumber(item) - number;
}


function isStackable(item) {
    return !(item.special && item.special.includes("notStackable"));
}

function isTwoHanded(item) {
    return (item.special && item.special.includes("twoHanded"));
}

function hasDualWieldOrPartialDualWield(item) {
    return ((item.special && item.special.includes("dualWield")) || item.partialDualWield);
}

function hasInnateDualWield() {
    var selectedUnit = builds[currentUnitIndex].selectedUnit;
    for (var index in selectedUnit.skills) {
        if (selectedUnit.skills[index].special && selectedUnit.skills[index].special.includes("dualWield")) {
            return true;
        }
    }
    for (var index in builds[currentUnitIndex].fixedItems) {
        if (builds[currentUnitIndex].fixedItems[index] && builds[currentUnitIndex].fixedItems[index].special && builds[currentUnitIndex].fixedItems[index].special.includes("dualWield")) {
            return true;
        }
    }
    return false;
}

function getInnatePartialDualWield() {
    for (var index = builds[currentUnitIndex].selectedUnit.skills.length; index--;) {
        if (builds[currentUnitIndex].selectedUnit.skills[index].partialDualWield) {
            return builds[currentUnitIndex].selectedUnit.skills[index].partialDualWield;
        }
    }
    for (var index = 0; index < 10; index++) {
        if (builds[currentUnitIndex].fixedItems[index] && builds[currentUnitIndex].fixedItems[index].partialDualWield) {
            return builds[currentUnitIndex].fixedItems[index].partialDualWield;
        }
    }
    return null;
}

function getAvailableNumber(item) {
    var number = 0;
    if (onlyUseOwnedItems) {
        if (itemInventory[item[itemKey]]) {
            number = getOwnedNumber(item).available;
        }
    } else {
        if (excludeNotReleasedYet || excludeTMR5 || exludeEventEquipment || excludePremium) {
            for (var index = item.access.length; index--;) {
                var access = item.access[index];
                if ((excludeNotReleasedYet && access == "not released yet")
                   || (excludeTMR5 && access.startsWith("TMR-5*") && item.tmrUnit != selectedUnit.name)
                   || (exludeEventEquipment && access.endsWith("event"))
                   || (excludePremium && access == "premium")) {
                    return 0;
                }        
            }
        }
        if (item.maxNumber) {
            if (alreadyUsedItems[item[itemKey]]) {
                number = item.maxNumber - alreadyUsedItems[item[itemKey]];
            } else {
                number = item.maxNumber;
            }
        }
        if (item.access.includes("trial") || !isStackable(item) || onlyAvailableOnceItems.includes(item.id)) {
            if (alreadyUsedItems[item[itemKey]]) {
                number = 0;
            } else {
                number = 1;
            }
        } else {
            number = 4;    
        }
        

    }
    if (!isStackable(item)) {
        number = Math.min(number,1);
    }
    return number;
}

function getOwnedNumber(item) {
    var totalNumber = 0;
    var availableNumber = 0;
    if (itemInventory[item[itemKey]]) {
        totalNumber = itemInventory[item[itemKey]];
        if (alreadyUsedItems[item[itemKey]]) {
            availableNumber = Math.max(0, totalNumber - alreadyUsedItems[item[itemKey]]);
        } else{
            availableNumber = totalNumber;
        }
    }
    return {"total":totalNumber,"available":availableNumber};
}


function isApplicable(item) {
    if (item.exclusiveSex && item.exclusiveSex != builds[currentUnitIndex].selectedUnit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(builds[currentUnitIndex].selectedUnitName)) {
        return false;
    }
    return true;
}

function someEquipmentNoMoreApplicable(build) {
    for (var index in build) {
        if (build[index] && !isApplicable(build[index],build,5)) {
            return true;
        }
    }
    return false;
}

function calculateBuildValue(itemAndPassives) {
    if ("physicalDamage" == builds[currentUnitIndex].goal || "magicalDamage" == builds[currentUnitIndex].goal || "magicalDamageWithPhysicalMecanism" == builds[currentUnitIndex].goal || "hybridDamage" == builds[currentUnitIndex].goal) {
        
        var cumulatedKiller = 0;
        for (var equipedIndex = itemAndPassives.length; equipedIndex--;) {
            if (itemAndPassives[equipedIndex] && ennemyRaces.length > 0 && itemAndPassives[equipedIndex].killers) {
                for (var killerIndex = itemAndPassives[equipedIndex].killers.length; killerIndex--;) {
                    var killer = itemAndPassives[equipedIndex].killers[killerIndex];
                    if (ennemyRaces.includes(killer.name) && killer[goals[builds[currentUnitIndex].goal].applicableKillerType]) {
                        cumulatedKiller += killer[goals[builds[currentUnitIndex].goal].applicableKillerType];
                    }
                }
            }
        }
        
        // Element weakness/resistance
        var elements = builds[currentUnitIndex].innateElements.slice();
        if (goals[builds[currentUnitIndex].goal].useWeaponsElements) {
            if (itemAndPassives[0] && itemAndPassives[0].element) {
                for (var elementIndex = itemAndPassives[0].element.length; elementIndex--;) {
                    if (!elements.includes(itemAndPassives[0].element[elementIndex])) {
                        elements.push(itemAndPassives[0].element[elementIndex]);       
                    }
                }
            };
            if (itemAndPassives[1] && itemAndPassives[1].element) {
                for (var elementIndex = itemAndPassives[1].element.length; elementIndex--;) {
                    if (!elements.includes(itemAndPassives[1].element[elementIndex])) {
                        elements.push(itemAndPassives[1].element[elementIndex]);       
                    }
                }
            };
        }
        var resistModifier = getElementCoef(elements);
        
        // Killers
        var killerMultiplicator = 1;
        if (ennemyRaces.length > 0) {
            killerMultiplicator += (cumulatedKiller / 100) / ennemyRaces.length;
        }
        
        var total = 0;
        for (var statIndex = goals[builds[currentUnitIndex].goal].statsToMaximize.length; statIndex--;) {
            var stat = goals[builds[currentUnitIndex].goal].statsToMaximize[statIndex];
            var calculatedValue = calculateStatValue(itemAndPassives, stat);

            if ("atk" == stat) {
                var variance0 = 1;
                var variance1 = 1;
                if (itemAndPassives[0] && itemAndPassives[0].meanDamageVariance) {
                    variance0 = itemAndPassives[0].meanDamageVariance;
                }
                if (itemAndPassives[1] && itemAndPassives[1].meanDamageVariance) {
                    variance1 = itemAndPassives[1].meanDamageVariance;
                }
                total += (calculatedValue.right * calculatedValue.right * variance0 + calculatedValue.left * calculatedValue.left * variance1) * (1 - resistModifier) * killerMultiplicator * damageMultiplier  / monsterDef;
            } else {
                var dualWieldCoef = 1;
                if (goals[builds[currentUnitIndex].goal].attackTwiceWithDualWield && itemAndPassives[0] && itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type) && weaponList.includes(itemAndPassives[1].type)) {
                    dualWieldCoef = 2;
                }
                total += (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * dualWieldCoef * damageMultiplier  / monsterSpr;
            }
        }
        return total / goals[builds[currentUnitIndex].goal].statsToMaximize.length;
    } else {
        // multiply the results of each stats. Work for goal with only one stat, and eHP
        var result = 1; 
        var stats = goals[builds[currentUnitIndex].goal].statsToMaximize;
        for (var index = stats.length; index--;) {
            result *= calculateStatValue(itemAndPassives, stats[index]).total;
        }
        return result;
    }
}

function getEquipmentStatBonus(itemAndPassives, stat) {
    if (itemAndPassives[0] && !itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type)) {
        var bonus = 1;
        var twoHanded = isTwoHanded(itemAndPassives[0]);
        for (var index = itemAndPassives.length; index--;) {
            var item = itemAndPassives[index];
            if (item) {
                if (item.singleWielding && item.singleWielding[stat]) {
                    bonus += item.singleWielding[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHanded && item.singleWieldingOneHanded[stat]) {
                    bonus += item.singleWieldingOneHanded[stat] / 100;
                }
            }
        }
        return bonus;
    } else {
        return 1;
    }
}

function calculateStatValue(itemAndPassives, stat) {
    var equipmentStatBonus = getEquipmentStatBonus(itemAndPassives, stat);
    var calculatedValue = 0   
    var currentPercentIncrease = {"value":0};
    var baseValue = 0;
    if (baseStats.includes(stat)) {
        baseValue = builds[currentUnitIndex].selectedUnit.stats.maxStats[stat] + builds[currentUnitIndex].selectedUnit.stats.pots[stat];
    }
    var calculatedValue = baseValue;
    
    for (var equipedIndex = itemAndPassives.length; equipedIndex--;) {
        var equipmentStatBonusToApply = 1;
        if (equipedIndex < 10) {
            equipmentStatBonusToApply = equipmentStatBonus;
        }
        if (equipedIndex < 2 && "atk" == stat) {
            calculatedValue += calculatePercentStateValueForIndex(itemAndPassives[equipedIndex], baseValue, currentPercentIncrease, equipmentStatBonusToApply, stat);    
        } else {
            calculatedValue += calculateStateValueForIndex(itemAndPassives[equipedIndex], baseValue, currentPercentIncrease, equipmentStatBonusToApply, stat);    
        }
    }
    
    if ("atk" == stat) {
        var result = {"right":0,"left":0,"total":0,"bonusPercent":currentPercentIncrease.value}; 
        var right = calculateFlatStateValueForIndex(itemAndPassives[0], equipmentStatBonus, stat);
        var left = calculateFlatStateValueForIndex(itemAndPassives[1], equipmentStatBonus, stat);
        if (itemAndPassives[1] && weaponList.includes(itemAndPassives[1].type)) {
            result.right = calculatedValue + right;
            result.left = calculatedValue + left;
            result.total = calculatedValue + right + left;    
        } else {
            result.right = calculatedValue + right + left;
            result.left = 0;
            result.total = result.right;
        }
        return result;   
    } else {
        return {"total" : calculatedValue,"bonusPercent":currentPercentIncrease.value};
    }
}

function calculateStateValueForIndex(item, baseValue, currentPercentIncrease, equipmentStatBonus, stat) {
    var value = 0;
    if (item) {
        if (item.type == "esper") {
            console.log("!!");
        }
        value = getValue(item, stat) * equipmentStatBonus;
        if (item[percentValues[stat]]) {
            percent = item[percentValues[stat]];
            percentTakenIntoAccount = Math.min(percent, Math.max(300 - currentPercentIncrease.value, 0));
            currentPercentIncrease.value += percent;
            value += percentTakenIntoAccount * baseValue / 100;
        }
    }
    return value;
}

function calculateFlatStateValueForIndex(item, equipmentStatBonus, stat) {
    if (item && item[stat]) {
        return item[stat] * equipmentStatBonus;
    }
    return 0;
}

function calculatePercentStateValueForIndex(item, baseValue, currentPercentIncrease, stat) {
    if (item && item[percentValues[stat]]) {
        percent = item[percentValues[stat]];
        percent = Math.min(percent, 300 - currentPercentIncrease.value);
        currentPercentIncrease.value += percent;
        return percent * baseValue / 100;
    }
    return 0;
}

function areConditionOK(item, equiped) {
    if (item.equipedConditions) {
        var found = 0;
        for (var conditionIndex = item.equipedConditions.length; conditionIndex--;) {
            if (elementList.includes(item.equipedConditions[conditionIndex])) {
                var neededElement = item.equipedConditions[conditionIndex];
                if ((equiped[0] && equiped[0].element && equiped[0].element.includes(neededElement)) || (equiped[1] && equiped[1].element && equiped[1].element.includes(neededElement))) {
                    found ++;
                }
            } else {
                for (var equipedIndex = 0; equipedIndex < 10; equipedIndex++) {
                    if (equiped[equipedIndex] && equiped[equipedIndex].type == item.equipedConditions[conditionIndex]) {
                        found ++;
                        break;
                    }
                }
            }
        }
        if (found != item.equipedConditions.length) {
            return false;
        }
    }
    return true;
}

function areConditionOKBasedOnTypeCombination(item, typeCombination) {
    if (item.equipedConditions) {
        for (var conditionIndex = item.equipedConditions.length; conditionIndex--;) {
            if (elementList.includes(item.equipedConditions[conditionIndex])) {
                return false;
            } else {
                if (!typeCombination.includes(item.equipedConditions[conditionIndex])) {
                    return false;
                }
            }
        }
    }
    return true;
}

function getElementBasedSkills() {
    var elementBasedSkills = [];
    for (var skillIndex = builds[currentUnitIndex].selectedUnit.skills.length; skillIndex--;) {
        var skill = builds[currentUnitIndex].selectedUnit.skills[skillIndex];
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

function logCurrentBuild() {
    logBuild(builds[currentUnitIndex].bestBuild, builds[currentUnitIndex].bestValue);
}

function logBuild(build, value) {
    /*if (build.length == 0) {
        $("#resultStats").addClass("hidden");
        $("#buildResult").html("");
        $(".buildLinks").addClass("hidden");
        var progress = 0;
        progressElement.width("0%");
        progressElement.text("0%");
        progressElement.addClass("finished");
    } else {*/
        
        var html = "";
        
        for (var index = 0; index < 11; index++) {
            redrawBuildLine(index);
            /*if (conciseView) {
                html += "<div class='col-xs-6 ";
                if (index%2 == 0) {
                    html += "newLine";
                }
                html += "'><div class='table'><div class='tbody'>";
            }
            var item = build[index];
            if (item) {
                html += getItemLine(item, index, conciseView);
            }
            if (conciseView) {
                html += "</div></div></div>"
            }*/            
        }

        if (conciseView) {
            $("#buildResult").addClass("conciseView");
        } else {
            html = '<div class="tbody">' + html + '</div>';
            $("#buildResult").removeClass("conciseView");
        }
        
        //$("#buildResult").html(html);
        
        $("#resultStats > div").removeClass("statToMaximize");
        
        var link = getPiramidataImageLink();
        $(".imageLink").prop("href",link);
        $(".buildLinks").removeClass("hidden");
        
        $("#fixedItemsTitle").addClass("hidden");
        $("#resultStats").removeClass("hidden");
        var statsToDisplay = baseStats.concat(["evade.physical","evade.magical"]);
        var values = {};
        for (var statIndex in statsToDisplay) {
            var result = calculateStatValue(build, statsToDisplay[statIndex]);
            values[statsToDisplay[statIndex]] = result.total;
            $("#resultStats ." + escapeDot(statsToDisplay[statIndex]) + " .value").html(Math.floor(result.total));
            var bonusPercent;
            if (result.bonusPercent > 300) {
                bonusPercent = "<span style='color:red;' title='Only 300% taken into account'>" + result.bonusPercent + "%</span>";
            } else {
                bonusPercent = result.bonusPercent + "%";
            }
            $("#resultStats ." + escapeDot(statsToDisplay[statIndex]) + " .bonus").html(bonusPercent);
        }
        $("#resultStats .physicaleHp .value").html(Math.floor(values["def"] * values["hp"]));
        $("#resultStats .magicaleHp .value").html(Math.floor(values["spr"] * values["hp"]));
        if (builds[currentUnitIndex].goal == "physicaleHp" || builds[currentUnitIndex].goal == "magicaleHp") {
            $("#resultStats ." + builds[currentUnitIndex].goal).addClass("statToMaximize");
        }
        
        var importantStats = goals[builds[currentUnitIndex].goal].statsToMaximize;
        for (var index in importantStats) {
            $("#resultStats ." + escapeDot(importantStats[index])).addClass("statToMaximize");    
        }
        
        $("#resultStats .damage").addClass("hidden");
        if (builds[currentUnitIndex].goal == "physicalDamage" || builds[currentUnitIndex].goal == "magicalDamage" || builds[currentUnitIndex].goal == "hybridDamage") {
            $("#resultStats .damage .monsterDefSpan").addClass("hidden");
            $("#resultStats .damage .monsterSprSpan").addClass("hidden");
            if (importantStats.includes("atk")) {
                $("#resultStats .damage .monsterDefValue").text(" " + monsterDef);
                $("#resultStats .damage .monsterDefSpan").removeClass("hidden");
            }
            if (importantStats.includes("mag")) {
                $("#resultStats .damage .monsterSprValue").text(" " + monsterSpr);
                $("#resultStats .damage .monsterSprSpan").removeClass("hidden");
            }
            $("#resultStats .damage .damageCoef").html("1x");
            $("#resultStats .damage .damageResult").html(Math.floor(value));
            $("#resultStats .damage").removeClass("hidden");
        }
        
    //}
}

function switchView(conciseViewParam) {
    conciseView = conciseViewParam;
    if (conciseView) {
        $("#conciseViewLink").addClass("hidden");
        $("#detailedViewLink").removeClass("hidden");
    } else {
        $("#detailedViewLink").addClass("hidden");
        $("#conciseViewLink").removeClass("hidden");
    }
    logCurrentBuild();
}

function escapeDot(statName) {
    return statName.replace(/\./g, '_');
}

function getItemLine(index, short = false) {
    var html = "";
    
    var item = builds[currentUnitIndex].fixedItems[index];
    if (!item) {
        item = builds[currentUnitIndex].bestBuild[index];
    }
    
    if (index >= 0 && builds[currentUnitIndex].fixedItems[index]) {
        html += '<div class="td actions"><img class="pin fixed" onclick="removeFixedItemAt(\'' + index +'\')" src="img/pinned.png"></img><img class="delete" onclick="removeItemAt(\'' + index +'\')" src="img/delete.png"></img></div>'
    } else if (!item) {
        html += '<div class="td actions"></div><div class="td type slot" onclick="displayFixItemModal(' + index + ');"><img src="img/'+ getSlotIcon(index) + '" class="icon"></img></div><div class="td name slot">'+ getSlotName(index) + '</div>'
    } else if (!item.placeHolder) {
        html += '<div class="td actions"><img class="pin notFixed" onclick="fixItem(\'' + item[itemKey] +'\',' + index + ',false);" src="img/pin.png"></img><img class="delete" onclick="removeItemAt(\'' + index +'\')" src="img/delete.png"></img></div>'
    } else {
        html += '<div class="td"></div>'
    }
    
    if (item) {
        if (short) {
            html += '<div class="change" onclick="displayFixItemModal(' + index + ');">' + getImageHtml(item) + '</div>' + getNameColumnHtml(item);
        } else {
            html += displayItemLine(item);
        }
    }
    return html;
}

function getSlotIcon(index) {
    switch(index) {
        case 0:
            return "rightHandSlot.png";
        case 1:
            return "leftHandSlot.png";
        case 2:
            return "headSlot.png";
        case 3:
            return "bodySlot.png";
        case 4:
        case 5:
            return "accessorySlot.png";
        case 6:
        case 7:
        case 8:
        case 9:
            return "materiaSlot.png";
        case 10:
            return "esperSlot.png";
    }
}

function getSlotName(index) {
    switch(index) {
        case 0:
            return "Left hand";
        case 1:
            return "Right hand";
        case 2:
            return "Head";
        case 3:
            return "Body";
        case 4:
        case 5:
            return "Accessory";
        case 6:
        case 7:
        case 8:
        case 9:
            return "Materia";
        case 10:
            return "Esper";
    }
}

function redrawBuildLine(index) {
    $("#buildResult .buildLine_" + index).html(getItemLine(index, conciseView));
}

function getEsperItem(esper) {
    var item = {};
    item.name = esper.name;
    item.id = esper.name;
    item.type = "esper";
    item.hp = Math.floor(esper.hp / 100);
    item.mp = Math.floor(esper.mp / 100);
    item.atk = Math.floor(esper.atk / 100);
    item.def = Math.floor(esper.def / 100);
    item.mag = Math.floor(esper.mag / 100);
    item.spr = Math.floor(esper.spr / 100);
    item.access = ["story"];
    if (esper.killers) {
        item.killers = esper.killers;
    }
    return item;
}

// Populate the unit html select with a line per unit
function populateUnitSelect() {
    var options = '<option value=""></option>';
    Object.keys(units).sort().forEach(function(value, index) {
        options += '<option value="'+ value + '">' + value + '</option>';
    });
    $("#unitsSelect").html(options);
    $("#unitsSelect").change(onUnitChange);
}

function onUnitChange() {
    $( "#unitsSelect option:selected" ).each(function() {
        var unitName = $(this).val();
        var selectedUnitData = units[unitName];
        if (selectedUnitData) {
            $("#unitTabs .tab_" + currentUnitIndex + " a").html(unitName);
            reinitBuild(currentUnitIndex);
            builds[currentUnitIndex].selectedUnit = selectedUnitData;
            builds[currentUnitIndex].selectedUnitName = unitName;
            updateUnitStats();
            $("#help").addClass("hidden");
            $("#buildDiv").removeClass("hidden");
            recalculateApplicableSkills();
            logCurrentBuild();
        } else {
            builds[currentUnitIndex].selectedUnit = null;
            reinitBuild(currentUnitIndex); 
            updateUnitStats();
            logCurrentBuild();
            $("#unitTabs .tab_" + currentUnitIndex + " a").html("Select unit");
        }
        displayUnitRarity(selectedUnitData);
    });
}

function updateUnitStats() {
    $(baseStats).each(function (index, stat) {
        if (builds[currentUnitIndex].selectedUnit) {
            $("#baseStat_" + stat).val(builds[currentUnitIndex].selectedUnit.stats.maxStats[stat] + builds[currentUnitIndex].selectedUnit.stats.pots[stat]);
        } else {
            $("#baseStat_" + stat).val("");
        }
    });
    populateUnitEquip();
    if (builds[currentUnitIndex].selectedUnit) {
        for (var index in builds[currentUnitIndex].selectedUnit.equip) {
            $(".unitEquipable img." + builds[currentUnitIndex].selectedUnit.equip[index]).removeClass("notEquipable");
        }
    }
}

function reinitBuild(buildIndex) {
    builds[buildIndex] = {};
    readGoal(buildIndex);
    builds[buildIndex].bestBuild = [null, null, null, null, null, null, null, null,null,null,null];
    builds[buildIndex].bestValue = null;
    builds[buildIndex].fixedItems = [null, null, null, null, null, null, null, null,null,null,null];
    builds[currentUnitIndex].innateElements = [];
}

function loadBuild(buildIndex) {
    currentUnitIndex = buildIndex;
    var build = builds[buildIndex];
    
    $("#unitsSelect option").prop("selected", false);
    if (build.selectedUnitName) {
        $('#unitsSelect option[value="' + build.selectedUnitName + '"]').prop("selected", true);
    }
    $(".unitAttackElement div.elements label").removeClass("active");
    if (build.innateElements) {
        for (var i in build.innateElements) {
            $(".unitAttackElement div.elements label:has(input[value=" + build.innateElements[i] + "])").addClass("active");
        }
    }
    
    $(".goal option").prop("selected", false);
    if (build.goal) {
        if (build.goal == "magicalDamageWithPhysicalMecanism") {
            $('.goal option[value="magicalDamage"]').prop("selected", true);   
        } else {
            $('.goal option[value="' + build.goal + '"]').prop("selected", true);
        }
    }
    $(".magicalSkillType option").prop("selected", false);
    if (build.goal == "magicalDamage") {
        $('.magicalSkillType option[value="normal"]').prop("selected", true);
    } else if (build.goal == "magicalDamageWithPhysicalMecanism") {
        $('.magicalSkillType option[value="physicalMagic"]').prop("selected", true);
    }
    onGoalChange();

    updateUnitStats();
    
    logCurrentBuild();  
}

function addNewUnit() {
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + (builds.length - 1)).after("<li class='active tab_" + builds.length + "'><a href='#' onclick='selectUnitTab(" + builds.length + ")'>Select unit</a></li>");
    builds.push({});
    reinitBuild(builds.length - 1);
    loadBuild(builds.length - 1);
    if (builds.length > 9) {
        $("#addNewUnitButton").addClass("hidden");
    }
}

function selectUnitTab(index) {
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + index).addClass("active");
    loadBuild(index);
}

// Displays selected unit's rarity by stars
var displayUnitRarity = function(unit) {
    var rarityWrapper = $('.unit-rarity');
    if (unit) {
        var rarity = unit.max_rarity;

        rarityWrapper.show();
        rarityWrapper.empty();

        for (var i = 0; i < rarity; i++) {
            rarityWrapper.append('<i class="rarity-star" />');
        }
    } else {
        rarityWrapper.hide();
    }
};

function inventoryLoaded() {
    $(".equipments select option[value=owned]").prop("disabled", false);
    if (!dataLoadedFromHash) {
        $(".equipments select").val("owned");
        onEquipmentsChange();
    }
    
    var data = readStateHashData();
    
    if (data && data.equipmentToUse == "owned") {
        loadStateHashAndBuild(data);    
    }
}

function notLoaded() {
    var data = readStateHashData();
    
    if (data && data.equipmentToUse == "owned") {
        alert("The link you opened require you to be logged in the be able to be displayed. Please log in");
    }
}

function onGoalChange() {
    var goal = $(".goal select").val();
    if (goal == "magicalDamage") {
        $(".magicalSkillType").removeClass("hidden");
        $(".monster").removeClass("hidden");
        $(".unitAttackElement").removeClass("hidden");
        $("#forceDoublehand").addClass("hidden");
    } else if (goal == "physicalDamage" || goal == "hybridDamage"){
        $(".magicalSkillType").addClass("hidden");
        $(".monster").removeClass("hidden");
        $(".unitAttackElement").removeClass("hidden");
        $("#forceDoublehand").removeClass("hidden");
    } else if (goal == "def" || goal == "spr" || goal == "hp" || goal == "physicaleHp" || goal == "magicaleHp") {
        $(".monster").addClass("hidden");
        $(".unitAttackElement").addClass("hidden");
        $(".magicalSkillType").addClass("hidden");
        $("#forceDoublehand").addClass("hidden");
    }
}

function onEquipmentsChange() {
    var equipments = $(".equipments select").val();
    if (equipments == "all") {
        $(".equipments .panel-body").removeClass("hidden");
        onlyUseOwnedItems = false;
    } else {
        $(".equipments .panel-body").addClass("hidden");
        onlyUseOwnedItems = true;
    }
}
     
function updateSearchResult() {
    var searchText = $("#searchText").val();
    if ((searchText == null || searchText == "") && searchType.length == 0 && searchStat == "") {
        $("#fixItemModal .results .tbody").html("");    
        return;
    }
    var types = searchType;
    if (searchType.length == 0) {
        types = getCurrentUnitEquip().concat("esper");
    }
    var baseStat = builds[currentUnitIndex].selectedUnit.stats.maxStats[searchStat] + builds[currentUnitIndex].selectedUnit.stats.pots[searchStat];
    accessToRemove = [];
    
    if (!dataWithEspers) {
        dataWithEspers = [];
        for (var index = espers.length; index--;) {
            dataWithEspers.push(getEsperItem(espers[index]));
        }
        prepareSearch(dataWithEspers);
        dataWithEspers = data.concat(dataWithEspers);
    }
    
    displaySearchResults(sort(filter(dataWithEspers, false, searchStat, baseStat, searchText, builds[currentUnitIndex].selectedUnitName, types)));
    
    if (searchStat == "") {
        $("#fixItemModal .results").addClass("notSorted");
    } else {
        $("#fixItemModal .results .thead .sort").text(searchStat.toUpperCase());    
        $("#fixItemModal .results").removeClass("notSorted");
    }
    
    $("#fixItemModal .results .tbody").unmark({
        done: function() {
            if (searchText && searchText.length != 0) {
                searchText.split(" ").forEach(function (token) {
                    $("#fixItemModal .results .tbody").mark(token);
                });
            }
        }
    });
}

function displayFixItemModal(index) {
    if (!builds[currentUnitIndex].selectedUnit) {
        alert("Please select an unit");
        return;
    }
    
    prepareEquipable();
    if (equipable[index].length == 0) {
        alert("Nothing can be added at this slot");
        return;
    }
    currentItemSlot = index;
    
    populateItemType(equipable[index]);
    
    calculateAlreadyUsedItems();
    $("#searchText").val("");
    $("#fixItemModal .results .tbody").html("");
    
    $("#fixItemModal").modal();
    selectSearchStat(searchStat);
    selectSearchType(equipable[index]);
    updateSearchResult();
}

function getCurrentUnitEquip() {
    var equip = builds[currentUnitIndex].selectedUnit.equip.concat(["accessory", "materia"]);
    for (var index in builds[currentUnitIndex].fixedItems) {
        if (builds[currentUnitIndex].fixedItems[index] && builds[currentUnitIndex].fixedItems[index].allowUseOf && !equip.includes(builds[currentUnitIndex].fixedItems[index].allowUseOf)) {
            equip.push(builds[currentUnitIndex].fixedItems[index].allowUseOf);
        }
    }
    return equip;
}

function fixItem(key, slotParam = -1) {
    var item;
    if (typeList.includes(key)) {
        item = getPlaceHolder(key);
    } else if (espersByName[key])  {
        item = espersByName[key];
    } else {
        item = findBestItemVersion(builds[currentUnitIndex].fixedItems, key);
    }
    
    if (item) {
        prepareEquipable();
        var slot = slotParam;
        if (slot == -1) {
            slot = getFixedItemItemSlot(item, equipable, builds[currentUnitIndex].fixedItems);
        }
        if (slot == -1) {
            if (weaponList.includes(item.type) && builds[currentUnitIndex].fixedItems[0] && !builds[currentUnitIndex].fixedItems[1]) {
                // for weapon, if the second weapon were refused, check if an innat partial DW allow it
                var innatePartialDualWield = getInnatePartialDualWield();
                if (innatePartialDualWield && innatePartialDualWield.includes(item.type)) {
                    slot = 1;
                } else {
                    alert("No more slot available for this item. Select another item or remove fixed item of the same type.");
                    return;
                }
            } else {
                alert("No more slot available for this item. Select another item or remove a pinned item of the same type.");
                return;
            }
        }
        builds[currentUnitIndex].fixedItems[slot] = item;
        builds[currentUnitIndex].bestBuild[slot] = item;
        if (slot < 10) {
            for (var index in builds[currentUnitIndex].fixedItems) {
                var itemTmp = builds[currentUnitIndex].fixedItems[index];
                if (itemTmp  && !itemTmp.placeHolder && index != slot) {
                    builds[currentUnitIndex].fixedItems[index] = findBestItemVersion(builds[currentUnitIndex].fixedItems, itemTmp[itemKey]);
                    builds[currentUnitIndex].bestBuild[index] = builds[currentUnitIndex].fixedItems[index];
                }
            }
        }
        recalculateApplicableSkills();
        logCurrentBuild();
    }
    $('#fixItemModal').modal('hide');
}

function findBestItemVersion(build, key) {
    var itemVersions = [];
    var found = false;
    for (var index in data) {
        if (data[index][itemKey] == key) {
            itemVersions.push(data[index]);
            found = true;
        }
        if (found && data[index][itemKey] != key) {
            break;
        }
    }
    if (itemVersions.length == 1 && !itemVersions[0].equipedConditions) {
        return itemVersions[0];
    } else {
        itemVersions.sort(function (item1, item2) {
            var conditionNumber1 = 0; 
            var conditionNumber2 = 0;
            if (item1.equipedConditions) {
                conditionNumber1 = item1.equipedConditions.length;
            }
            if (item1.exclusiveUnits) {
                conditionNumber1++;
            }
            if (item2.equipedConditions) {
                conditionNumber2 = item2.equipedConditions.length;
            }
            if (item2.exclusiveUnits) {
                conditionNumber2++;
            }
            return conditionNumber2 - conditionNumber1;
        });
        for (var index in itemVersions) {
            if (isApplicable(itemVersions[index]) && areConditionOK(itemVersions[index], build)) {
                return itemVersions[index];
            }
        }
        var item = itemVersions[0];
        return {"id":item.id, "name":item.name, "jpname":item.jpname, "icon":item.icon, "type":item.type,"access":["Conditions not met"]};
    }
}

function removeFixedItemAt(slot) {
    builds[currentUnitIndex].fixedItems[slot] = null;
    var equip = getCurrentUnitEquip();
    for (var index = 0; index < 10; index++) {
        var item = builds[currentUnitIndex].fixedItems[index];
        if (item) {
            if (!equip.includes(item.type)) {
                removeFixedItemAt(index);
            } else {
                builds[currentUnitIndex].fixedItems[index] = findBestItemVersion(builds[currentUnitIndex].fixedItems, item[itemKey]);
            }
        }
    }
    logCurrentBuild();
}

function removeItemAt(slot) {
    builds[currentUnitIndex].fixedItems[slot] = null;
    builds[currentUnitIndex].bestBuild[slot] = null;
    prepareEquipable();
    for (var index = 0; index < 10; index ++) {
        var item = builds[currentUnitIndex].bestBuild[index];
        if (item) {
            if (!equipable[index].includes(item.type)) {
                removeItemAt(index);
            } else {
                builds[currentUnitIndex].bestBuild[index] = findBestItemVersion(builds[currentUnitIndex].bestBuild, item[itemKey]);
                if (builds[currentUnitIndex].fixedItems[index]) {
                    builds[currentUnitIndex].fixedItems[index] = builds[currentUnitIndex].bestBuild[index];
                }
            }
        }
    }
    recalculateApplicableSkills();
    logCurrentBuild();
}

function recalculateApplicableSkills() {
    builds[currentUnitIndex].bestBuild = builds[currentUnitIndex].bestBuild.slice(0,11);
    for (var skillIndex = builds[currentUnitIndex].selectedUnit.skills.length; skillIndex--;) {
        var skill = builds[currentUnitIndex].selectedUnit.skills[skillIndex];
        if (areConditionOK(skill, builds[currentUnitIndex].bestBuild)) {
            builds[currentUnitIndex].bestBuild.push(skill);
        }
    }
}

function selectSearchType(types) {
    $("#fixItemModal .modal-body .nav.type li").removeClass("active");
    searchType = types;
    if (types.length > 1) {
        $("#fixItemModal .modal-body .nav.type li.all").addClass("active");
    } else {
        $("#fixItemModal .modal-body .nav.type li." + types[0]).addClass("active");
    }
}

function selectSearchStat(stat) {
    if (!stat) {
        searchStat = "";
        $("#fixItemModal .modal-header .stat .dropdown-toggle").prop("src","img/sort-a-z.png");
    } else {
        searchStat = stat;
        $("#fixItemModal .modal-header .stat .dropdown-toggle").prop("src","img/sort-" + stat + ".png");
    }
}

var displaySearchResults = function(items) {
    if (itemInventory) {
        $("#fixItemModal").removeClass("notLoggedIn");
    } else {
        $("#fixItemModal").addClass("notLoggedIn");
    }
    var html = "";
    for (var index in items) {
        var item = items[index];
        if (item) {
            html += '<div class="tr selectable" onclick="fixItem(\'' + item[itemKey] + '\', ' + currentItemSlot + ')">';
            html += displayItemLine(item);
            if (itemInventory) {
                var notEnoughClass = "";
                var numbers = getOwnedNumber(item);
                var owned = "";
                if (numbers.total > 0) {
                    owned += numbers.available;
                    if (numbers.available != numbers.total) {
                        owned += "/" + numbers.total;   
                        if (numbers.available == 0) {
                            notEnoughClass = " notEnough ";
                        }
                    }
                }
                html+= "<div class='td inventory text-center'><span class='badge" + notEnoughClass + "'>" + owned + "</span></div>";
            } else {
                html+= "<div class='td inventory'/>"
            }
            html += "</div>";
        }
    }
    
    $("#fixItemModal .results .tbody").html(html);
}

function getStateHash() {
    var data = {
        "goal": $(".goal select").val(),
        "innateElements":getSelectedValuesFor("elements")
    };

    if (data.goal == "magicalDamage") {
        data.attackType = $(".magicalSkillType select").val();
    }
    if (data.goal == "physicalDamage" || data.goal == "magicalDamage" || data.goal == "magicalDamageWithPhysicalMecanism" || data.goal == "hybridDamage") {
        data.ennemyRaces = getSelectedValuesFor("races");
        readEnnemyResists();
        data.ennemyResists = ennemyResist;
        data.monsterDef = monsterDef;
        data.monsterSpr = monsterSpr;
    }
    
    if (builds[currentUnitIndex].selectedUnit) {
        data.unitName = builds[currentUnitIndex].selectedUnitName;
    }
    
    
    data.equipmentToUse = $(".equipments select").val();
    if (data.equipmentToUse == "all") {
        data.exludeEventEquipment = $("#exludeEvent").prop('checked');
        data.excludeTMR5 = $("#excludeTMR5").prop('checked');
        data.excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
        data.excludePremium = $("#excludePremium").prop('checked');
    }
    
    for (var index = 0; index < 10; index++) {
        var item = builds[currentUnitIndex].fixedItems[index];
        if (item && !item.placeHolder) {
            if (!data.fixedItems) data.fixedItems = [];
            data.fixedItems.push(item[itemKey]);
        }
    }
    
    if (builds[currentUnitIndex].fixedItems[10]) {
        data.esper = builds[currentUnitIndex].fixedItems[10].name;
    }
    
    return data;
}

function readStateHashData() {
    if (window.location.hash.length > 1) {
        return JSON.parse(atob(window.location.hash.substr(1)));
    } else {
        return null;
    }
}
    
function loadStateHashAndBuild(data) {
    
    if (data.equipmentToUse == "owned" && !itemInventory) {
        return;
    }
    
    reinitBuild(0);
    $('.goal select option').prop("selected", false);
    $('.goal select option[value="' + data.goal + '"]').prop("selected", true);
    onGoalChange();
    if (data.unitName) {
        $('#unitsSelect option[value="' + data.unitName + '"]').prop("selected", true);
        onUnitChange();
    }
    select("elements", data.innateElements);
    if (data.goal == "mag") {
        $('.magicalSkillType select option[value="' + data.attackType + '"]').prop("selected", true);
    }
    if (data.goal == "atk" || data.goal == "mag") {
        select("races", data.ennemyRaces);
        for (var element in data.ennemyResists) {
            if (data.ennemyResists[element] == 0) {
                $("#elementalResists ." + element + " input").val("");
            } else {
                $("#elementalResists ." + element + " input").val(data.ennemyResists[element]);
            }
        }
    }
    $('.equipments select option[value="' + data.equipmentToUse + '"]').prop("selected", true);
    if (data.equipmentToUse == "all") {
        $("#exludeEvent").prop('checked', data.exludeEventEquipment);
        $("#excludeTMR5").prop('checked', data.excludeTMR5);
        $("#excludeNotReleasedYet").prop('checked', data.excludeNotReleasedYet);
        $("#excludePremium").prop("checked", data.excludePremium);
    }
    if (data.fixedItems) {
        for (var index in data.fixedItems) {
            if (data.fixedItems[index]) {
                fixItem(data.fixedItems[index]);
            }
        }
    }
    if (data.monsterDef) {
        $("#monsterDef").val(data.monsterDef);
    }
    if (data.monsterSpr) {
        $("#monsterSpr").val(data.monsterSpr);
    }
    if (data.esper) {
        fixItem(data.esper);
    }
    dataLoadedFromHash = true;
    build();
    window.location.hash = "";
}

function showBuildLink() {
    var data = getStateHash();
    data.fixedItems = [];
    // first fix dual wield items
    for (var index = 0; index < 10; index++) {
        var item = builds[currentUnitIndex].bestBuild[index];
        if (item && !item.placeHolder && hasDualWieldOrPartialDualWield(item)) {
            data.fixedItems.push(item[itemKey]);
        }
    }
    // then others items
    for (var index = 0; index < 10; index++) {
        var item = builds[currentUnitIndex].bestBuild[index];
        if (item && !item.placeHolder && !hasDualWieldOrPartialDualWield(item)) {
            data.fixedItems.push(item[itemKey]);
        }
        if (item && item.placeHolder) {
            data.fixedItems.push(item.type);
        }
    }
    data.equipmentToUse = "all";
    $('<div id="showLinkDialog" title="Build Link">' + 
        '<input value="http://ffbeEquip.lyrgard.fr/builder.html#' + btoa(JSON.stringify(data)) + '"></input>' +
        '<h4>This link will open the builder with this exact build displayed</h4>' +
      '</div>' ).dialog({
        modal: true,
        open: function(event, ui) {
            $(this).parent().css('position', 'fixed');
            $("#showLinkDialog input").select();
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    $("#showLinkDialog input").after("<div>Link copied to clipboard<div>");
                } else {
                    console.log('Oops, unable to copy');    
                }
            } catch (err) {
                console.log('Oops, unable to copy');
            }
        },
        position: { my: 'top', at: 'top+150' },
        width: 600
    });
}
      
function showBuilderSetupLink() {
    var data = getStateHash();
    $('<div id="showBuilderSetupLinkDialog" title="Builder setup Link">' + 
        '<input value="http://ffbeEquip.lyrgard.fr/builder.html#' + btoa(JSON.stringify(data)) + '"></input>' +
        '<h4>The following information are stored in this link :</h4>' +
        '<ul><li>The goal of the current unit</li><li>The currently selected unit, if any, and related information</li><li>Information about the monster (race and elemental resist)</li><li>The choice of equipments to use</li><li>The items that has been pinned in the build</li></ul>' +
        '<h4>Upon opening the link, those information will be restored, and if possible a build will be launched.</h4>' +
      '</div>' ).dialog({
        modal: true,
        open: function(event, ui) {
            $(this).parent().css('position', 'fixed');
            $("#showBuilderSetupLinkDialog input").select();
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    $("#showBuilderSetupLinkDialog input").after("<div>Link copied to clipboard<div>");
                } else {
                    console.log('Oops, unable to copy');    
                }
            } catch (err) {
                console.log('Oops, unable to copy');
            }
        },
        position: { my: 'top', at: 'top+150' },
        width: 600
    });
}

$(function() {
    $.get(server + "/data.json", function(result) {
        data = result;
        prepareSearch(data);
        readHash();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/unitsWithSkill.json", function(result) {
        units = result;
        populateUnitSelect();
        readHash();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/espers.json", function(result) {
        espers = result;
        for (var index = espers.length; index--;) {
            espersByName[espers[index].name] = getEsperItem(espers[index]);    
        }
        
        readHash();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    $(".goal select").change(onGoalChange);
    onGoalChange();
    
    $(".equipments select").change(onEquipmentsChange);
    
    $("#buildButton").click(build);
    
    builds[currentUnitIndex] = {};
    
    // Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"]);
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
    
    populateItemStat();
    populateUnitEquip();
    
    // Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateSearchResult));
    $('#fixItemModal').on('shown.bs.modal', function () {
        $('#searchText').focus();
    })  
    
    progressElement = $("#buildProgressBar .progressBar");
});

var counter = 0;
function readHash() {
    counter++;
    if (counter == 3) {
        var data = readStateHashData();
        if (data) {
            loadStateHashAndBuild(data);
        } else {
            reinitBuild(currentUnitIndex);
        }
    }
}

function populateUnitEquip() {
    var target = $(".unitEquipable.weapons1");
    var counter = 0;
    target.html("");
	for (var key in weaponList) {
        counter++;
        if(counter == 9) {
            var target = $(".unitEquipable.weapons2");
            target.html("");
        }
        target.append('<img src="img/' + weaponList[key] + '.png" class="notEquipable ' + weaponList[key] +'"/>');
	}
    var target = $(".unitEquipable.armors");
    target.html("");
    for (var key in shieldList) {
        target.append('<img src="img/' + shieldList[key] + '.png" class="notEquipable ' + shieldList[key] +'"/>');
	}
    for (var key in headList) {
        target.append('<img src="img/' + headList[key] + '.png" class="notEquipable ' + headList[key] +'"/>');
	}
    for (var key in bodyList) {
        target.append('<img src="img/' + bodyList[key] + '.png" class="notEquipable ' + bodyList[key] +'"/>');
	}
}
    
function populateItemType(equip) {
    var target = $("#fixItemModal .modal-body .nav.type");
    target.html("");
    if (equip.length > 1) {
        target.append("<li class='all'><a onclick='selectSearchType(" + JSON.stringify(equip) + ");updateSearchResult();'><img src='img/all.png'/></a></li>");
    }
	for (var key in equip) {
        target.append('<li class="' + equip[key] + '"><a onclick="selectSearchType([\'' + equip[key] + '\']);updateSearchResult();"><img src="img/' + equip[key] + '.png"/></a></li>');
	}
    
}

function populateItemStat() {
    var statList = ["hp", "mp", "atk", "def", "mag", "spr", "evade", "inflict", "resist"];
    var target = $("#fixItemModal .stat .dropdown-menu");
	for (var key in statList) {
        target.append('<img src="img/sort-' + statList[key] + '.png" onclick="selectSearchStat(\'' + statList[key] + '\');" class="btn btn-default"/>');
	}
}