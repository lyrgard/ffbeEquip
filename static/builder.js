page = "builder";
var adventurerIds = ["1500000013", "1500000015", "1500000016", "1500000017", "1500000018"];

const formulaByGoal = {
    "physicalDamage":                   {"type":"value","name":"physicalDamage"},
    "magicalDamage":                    {"type":"value","name":"magicalDamage"},
    "magicalDamageWithPhysicalMecanism":{"type":"value","name":"magicalDamageWithPhysicalMecanism"},
    "hybridDamage":                     {"type":"value","name":"hybridDamage"},
    "def":                              {"type":"value","name":"def"},
    "spr":                              {"type":"value","name":"spr"},
    "hp":                               {"type":"value","name":"hp"},
    "physicaleHp":                      {"type":"*", "value1":{"type":"value","name":"hp"}, "value2":{"type":"value","name":"def"}},
    "magicaleHp":                       {"type":"*", "value1":{"type":"value","name":"hp"}, "value2":{"type":"value","name":"spr"}},
    "physicalEvasion":                  {"type":"value","name":"evade.physical"},
    "magicalEvasion":                   {"type":"value","name":"evade.magical"},
    "mpRefresh":                        {"type":"*", "value1":{"type":"value","name":"mp"}, "value2":{"type":"value","name":"mpRefresh"}},
    "heal":                             {"type":"+", "value1":{"type":"/", "value1":{"type":"value","name":"spr"}, "value2":{"type":"constant", "value":2}}, "value2":{"type":"/", "value1":{"type":"value","name":"mag"}, "value2":{"type":"constant", "value":10}}},
};
const involvedStats = {
    "physicalDamage":                   ["atk","weaponElement","physicalKiller","meanDamageVariance"],
    "magicalDamage":                    ["mag","magicalKiller"],
    "magicalDamageWithPhysicalMecanism":["mag","weaponElement","physicalKiller","meanDamageVariance"],
    "hybridDamage":                     ["atk","mag","weaponElement","physicalKiller","meanDamageVariance"]
}


const statsToDisplay = baseStats.concat(["evade.physical","evade.magical"]);

var customFormula;

var dataByType = {};
var dataWithCondition = [];
var dualWieldSources = [];
var espers;
var selectedEspers = [];
var units;
var ownedUnits;
var onlyUseOwnedItems = false;
var exludeEventEquipment;
var excludeTMR5;
var excludeNotReleasedYet;
var excludePremium;
var includeTMROfOwnedUnits;
var includeTrialRewards;

var selectedUnitName;
var selectedUnit;

var equipable;
var espersByName = {};

var ennemyStats;

var builds = [];
var currentUnitIndex = 0;

var stats = [];
var numberOfItemCombination;

var alreadyUsedItems = {};
var unstackablePinnedItems = [];
var alreadyUsedEspers = [];

var itemKey = getItemInventoryKey();

var searchType = [];
var searchStat = "";
var currentItemSlot;

var searchableEspers;

var dataLoadedFromHash = false;

var conciseView = true;

var progressElement;
var progress;

var damageMultiplier;

var allItemVersions = {};

var notStackableEvadeGear = [
    ["409006700"],
    ["402001900", "301001500", "409012800"]
];

const percentValues = {
    "hp": "hp%",
    "mp": "mp%",
    "atk": "atk%",
    "def": "def%",
    "mag": "mag%",
    "spr": "spr%"
}
const itemsToExclude = ["409009000"]; // Ring of Dominion


var goalValuesCaract = {
    "physicalDamage":                   {"statsToMaximize":["atk"], "useWeaponsElements":true, "applicableKillerType":"physical", "attackTwiceWithDualWield":true},
    "magicalDamage":                    {"statsToMaximize":["mag"], "useWeaponsElements":false, "applicableKillerType":"magical", "attackTwiceWithDualWield":false},
    "magicalDamageWithPhysicalMecanism":{"statsToMaximize":["mag"], "useWeaponsElements":true, "applicableKillerType":"physical", "attackTwiceWithDualWield":true},
    "hybridDamage":                     {"statsToMaximize":["atk","mag"], "useWeaponsElements":true, "applicableKillerType":"physical", "attackTwiceWithDualWield":true}
}

var running = false;
var stop = false;

var workers = [];


function build() {
    if (running) {
        stop = true;
        return;
    }
    
    $(".buildLinks").addClass("hidden");
    
    if (!builds[currentUnitIndex].unit) {
        alert("Please select an unit");
        return;
    }   
    
    builds[currentUnitIndex].emptyBuild();
    
    readEnnemyStats();
    
    builds[currentUnitIndex].innateElements = getSelectedValuesFor("elements");
    readGoal();
    
    calculateAlreadyUsedItems();
    readItemsExcludeInclude();
    readStatsValues();
    
    running = true;
    $("#buildButton").text("STOP");
    
    optimize();
}

function calculateAlreadyUsedItems() {
    alreadyUsedItems = {};
    unstackablePinnedItems = [];
    alreadyUsedEspers = [];
    for (var i = 0, len = builds.length; i < len; i++) {
        if (i != currentUnitIndex) {
            var build = builds[i].build;
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
                if (builds[i].build[index]) {
                    var item = builds[i].build[index];
                    if (item) {
                        if (alreadyUsedItems[item[itemKey]]) {
                            alreadyUsedItems[item[itemKey]]++;
                        } else {
                            alreadyUsedItems[item[itemKey]] = 1;
                        }
                        if (!isStackable(item)) {
                            unstackablePinnedItems.push(item.id);
                        }
                    }   
                }
            }
            if (builds[i].build[10]) {
                alreadyUsedEspers.push(builds[i].build[10].name);
            }
        }
    }
}

function readGoal(index = currentUnitIndex) {
    var goal;
    if (customFormula) {
        builds[currentUnitIndex].goal = "custom";
        builds[currentUnitIndex].formula = customFormula;
    } else {
        goal = $(".goal select").val();   
        if (goal == "magicalDamage" && $(".magicalSkillType select").val() == "physicalMagic") {
            builds[currentUnitIndex].goal = "magicalDamageWithPhysicalMecanism";
        } else {
            builds[currentUnitIndex].goal = goal;
        }
        builds[currentUnitIndex].formula = formulaByGoal[builds[currentUnitIndex].goal];
    }
}

function readItemsExcludeInclude() {
    exludeEventEquipment = $("#exludeEvent").prop('checked');
    excludeTMR5 = $("#excludeTMR5").prop('checked');
    excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
    excludePremium = $("#excludePremium").prop("checked");
    includeTMROfOwnedUnits = $("#includeTMROfOwnedUnits").prop("checked");
    includeTrialRewards = $("#includeTrialRewards").prop("checked");
}

function readStatsValues() {
    for (var index = baseStats.length; index--;) {
        builds[currentUnitIndex].baseValues[baseStats[index]] = {
            "base" : parseInt($(".unitStats .stat." + baseStats[index] + " .baseStat input").val()) || 0,
            "pots" : parseInt($(".unitStats .stat." + baseStats[index] + " .pots input").val()) || 0
        };
        builds[currentUnitIndex].baseValues[baseStats[index]].total = builds[currentUnitIndex].baseValues[baseStats[index]].base + builds[currentUnitIndex].baseValues[baseStats[index]].pots;
        builds[currentUnitIndex].baseValues[baseStats[index]].buff = parseInt($(".unitStats .stat." + baseStats[index] + " .buff input").val()) || 0;
    }
}



function getPlaceHolder(type) {
    return {"name":"Any " + type,"type":type, "placeHolder":true};
}
 
function getElementCoef(elements) {
    var resistModifier = 0;

    if (elements.length > 0) {
        for (var element in ennemyStats.elementResists) {
            if (elements.includes(element)) {
                resistModifier += ennemyStats.elementResists[element] / 100;
            }
        }    
        resistModifier = resistModifier / elements.length;
    }
    return resistModifier;
}

function readEnnemyStats() {
    var ennemyResist = {};
    for(var element in ennemyResist) {
        var value = $("#elementalResists td." + element + " input").val();
        if (value) {
            ennemyResist[element] = parseInt(value);
        } else {
            ennemyResist[element] = 0;
        }
    }
    var ennemyRaces = getSelectedValuesFor("races");
    var monsterDef = 100;
    var monsterSpr = 100;
    if ($("#monsterDef").val()) {
        monsterDef = parseInt($("#monsterDef").val());
    }
    if ($("#monsterSpr").val()) {
        monsterSpr = parseInt($("#monsterSpr").val());
    }
    ennemyStats = new EnnemyStats(getSelectedValuesFor("races"), monsterDef, monsterSpr, ennemyResist);
}

function optimize() {
    console.time("optimize");
    progress = 0;
    progressElement.width("0%");
    progressElement.text("0%");
    progressElement.removeClass("finished");
    
    var forceDoubleHand = $("#forceDoublehand input").prop('checked');
    var forceDualWield = $("#forceDualWield input").prop('checked');
    
    var buildOptimizer = new BuildOptimizer(data, espers);
    workers[0].postMessage({"type":"unitSelected", "unitBuild":builds[currentUnitIndex]});
    
    buildOptimizer.unitBuild = builds[currentUnitIndex];
    buildOptimizer.prepareData(itemsToExclude);
    
    
    var typeCombinationGenerator = new TypeCombinationGenerator(forceDoubleHand, forceDualWield, builds[currentUnitIndex], dualWieldSources, buildOptimizer.dataByType);
    var typeCombinations = typeCombinationGenerator.generateTypeCombinations();
    
    workers[0].onMessage = function(event) {
        switch(event.data.type) {
            case "incrementCalculated":
                var newProgress = Math.floor(event.data.numberCalculated/typeCombinations.length*100);
                if (progress != newProgress) {
                    progress = newProgress;
                    progressElement.width(progress + "%");
                    progressElement.text(progress + "%");    
                }
                break;
            case "betterBuildFound":
                builds[currentUnitIndex].build = event.data.build;
                builds[currentUnitIndex].buildValue = event.data.value;
                logCurrentBuild();
                break;
        }
    }
    
    workers[0].postMessage({"type":"optimize", "typeCombinations":typeCombinations, "alreadyUsedItems":alreadyUsedItems, "alreadyUsedEspers":alreadyUsedEspers,"ennemyStats":ennemyStats});
    
    /*var newProgress = Math.floor((index)/combinations.length*100);
    if (progress != newProgress) {
        progress = newProgress;
        progressElement.width(progress + "%");
        progressElement.text(progress + "%");    
    }*/
    /*
    if (!builds[currentUnitIndex].buildValue) {
        alert("Impossible to fulfill conditions");
    }
    
    
    progressElement.addClass("finished");
    console.timeEnd("optimize");
    stop = false;
    running = false;
    $("#buildButton").text("Build !");*/
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


function getStatValueIfExists(item, stat, baseStat) {
    var result = 0;
    if (item[stat]) result += item[stat];
    if (item[percentValues[stat]]) result += item[percentValues[stat]] * baseStat / 100;
    return result;
}

function getWeaponElementDamageCoef(weaponElements) {
    var value = 0;
    for (var elementIndex = weaponElements.length; elementIndex--;) {
        value += ennemyStats.elementResists[weaponElements[elementIndex]];
    }
    return value / weaponElements.length;
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

function getAvailableNumber(item) {
    var number = 0;
    if (onlyUseOwnedItems) {
        number = getOwnedNumber(item).available;
    } else {
        if (excludeNotReleasedYet || excludeTMR5 || exludeEventEquipment || excludePremium) {
            for (var index = item.access.length; index--;) {
                var access = item.access[index];
                if ((excludeNotReleasedYet && access == "not released yet")
                   || (excludeTMR5 && access.startsWith("TMR-5*") && item.tmrUnit != builds[currentUnitIndex].unit.name)
                   || (exludeEventEquipment && access.endsWith("event"))
                   || (excludePremium && access == "premium")) {
                    return 0;
                }        
            }
        }
        number = 4;
        if (item.maxNumber) {
            if (alreadyUsedItems[item[itemKey]]) {
                number = item.maxNumber - alreadyUsedItems[item[itemKey]];
            } else {
                number = item.maxNumber;
            }
        }
        if (!isStackable(item)) {
            if (alreadyUsedItems[item[itemKey]]) {
                number = 0;
            } else {
                number = 1;
            }
        }
        

    }
    if (!isStackable(item)) {
        number = Math.min(number,1);
    }
    return number;
}

function getOwnedNumber(item) {
    var totalNumber = 0;
    var totalOwnedNumber = 0;
    var availableNumber = 0;
    if (itemInventory[item[itemKey]]) {
        totalNumber = itemInventory[item[itemKey]];
    }
    totalOwnedNumber = totalNumber;
    if (includeTMROfOwnedUnits) {
        if (item.tmrUnit && units[item.tmrUnit] && ownedUnits[units[item.tmrUnit].id]) {
            totalNumber += ownedUnits[units[item.tmrUnit].id].farmable;
        }
    }
    if (includeTrialRewards && totalNumber == 0 && item.access.includes("trial")) {
        totalNumber += 1;
    }
    
    if (alreadyUsedItems[item[itemKey]]) {
        availableNumber = Math.max(0, totalNumber - alreadyUsedItems[item[itemKey]]);
        if (!isStackable(item)) {
            if (unstackablePinnedItems.includes(item.id)) {
                availableNumber = 0
            } else {
                availableNumber = Math.min(1, availableNumber);
            }
        }
    } else{
        availableNumber = totalNumber;
    }
    return {"total":totalNumber,"available":availableNumber,"totalOwnedNumber":totalOwnedNumber};
}


function isApplicable(item) {
    if (item.exclusiveSex && item.exclusiveSex != builds[currentUnitIndex].unit.sex) {
        return false;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(builds[currentUnitIndex].unit.name)) {
        return false;
    }
    return true;
}

function calculateBuildValue(itemAndPassives) {
    return calculateBuildValueWithFormula(itemAndPassives, builds[currentUnitIndex].formula);
}

function calculateBuildValueWithFormula(itemAndPassives, formula) {
    if (formula.type == "value") {
        if ("physicalDamage" == formula.name || "magicalDamage" == formula.name || "magicalDamageWithPhysicalMecanism" == formula.name || "hybridDamage" == formula.name) {
            var cumulatedKiller = 0;
            var applicableKillerType = null;
            if (builds[currentUnitIndex].involvedStats.includes("physicalKiller")) {
                applicableKillerType = "physical";
            } else if (builds[currentUnitIndex].involvedStats.includes("magicalKiller")) {
                applicableKillerType = "magical";
            }
            if (applicableKillerType) {
                for (var equipedIndex = itemAndPassives.length; equipedIndex--;) {
                    if (itemAndPassives[equipedIndex] && ennemyStats.races.length > 0 && itemAndPassives[equipedIndex].killers) {
                        for (var killerIndex = itemAndPassives[equipedIndex].killers.length; killerIndex--;) {
                            var killer = itemAndPassives[equipedIndex].killers[killerIndex];
                            if (ennemyStats.races.includes(killer.name) && killer[applicableKillerType]) {
                                cumulatedKiller += killer[applicableKillerType];
                            }
                        }
                    }
                }
            }

            // Element weakness/resistance
            var elements = builds[currentUnitIndex].innateElements.slice();
            if (builds[currentUnitIndex].involvedStats.includes("weaponElement")) {
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
            if (ennemyStats.races.length > 0) {
                killerMultiplicator += (cumulatedKiller / 100) / ennemyStats.races.length;
            }

            var total = 0;
            for (var statIndex = goalValuesCaract[formula.name].statsToMaximize.length; statIndex--;) {
                var stat = goalValuesCaract[formula.name].statsToMaximize[statIndex];
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
                    total += (calculatedValue.right * calculatedValue.right * variance0 + calculatedValue.left * calculatedValue.left * variance1) * (1 - resistModifier) * killerMultiplicator * damageMultiplier  / ennemyStats.def;
                } else {
                    var dualWieldCoef = 1;
                    if (goalValuesCaract[formula.name].attackTwiceWithDualWield && itemAndPassives[0] && itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type) && weaponList.includes(itemAndPassives[1].type)) {
                        dualWieldCoef = 2;
                    }
                    total += (calculatedValue.total * calculatedValue.total) * (1 - resistModifier) * killerMultiplicator * dualWieldCoef * damageMultiplier  / ennemyStats.spr;
                }
            }
            return total / goalValuesCaract[formula.name].statsToMaximize.length;
        } else {
            var value = calculateStatValue(itemAndPassives, formula.name).total;
            if (formula.name == "mpRefresh") {
                value /= 100;
            }
            return value;
        }   
    } else if (formula.type == "constant") {
        return formula.value;
    } else if (formula.type == "*") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) * calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "+") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) + calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "/") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) / calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "-") {
        return calculateBuildValueWithFormula(itemAndPassives, formula.value1) - calculateBuildValueWithFormula(itemAndPassives, formula.value2);
    } else if (formula.type == "conditions") {
        for (var index = formula.conditions.length; index --; ) {
            var value = calculateBuildValueWithFormula(itemAndPassives, formula.conditions[index].value);
            if (value < formula.conditions[index].goal) {
                return 0;
            }
        }
        return calculateBuildValueWithFormula(itemAndPassives, formula.formula)
    }
}
    

function getEquipmentStatBonus(itemAndPassives, stat) {
    if (baseStats.includes(stat) && itemAndPassives[0] && !itemAndPassives[1] && weaponList.includes(itemAndPassives[0].type)) {
        var normalStack = 0;
        var glStack = 0;
        var twoHanded = isTwoHanded(itemAndPassives[0]);
        for (var index = itemAndPassives.length; index--;) {
            var item = itemAndPassives[index];
            if (item) {
                if (item.singleWielding && item.singleWielding[stat]) {
                    normalStack += item.singleWielding[stat] / 100;
                }
                if (item.singleWieldingGL && item.singleWieldingGL[stat]) {
                    glStack += item.singleWieldingGL[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHanded && item.singleWieldingOneHanded[stat]) {
                    normalStack += item.singleWieldingOneHanded[stat] / 100;
                }
                if (!twoHanded && item.singleWieldingOneHandedGL && item.singleWieldingOneHandedGL[stat]) {
                    glStack += item.singleWieldingOneHandedGL[stat] / 100;
                }
            }
        }
        return 1 + Math.min(3, normalStack) + Math.min(3, glStack);
    } else {
        return 1;
    }
}

function calculateStatValue(itemAndPassives, stat) {
    var equipmentStatBonus = getEquipmentStatBonus(itemAndPassives, stat);
    var calculatedValue = 0   
    var currentPercentIncrease = {"value":0};
    var baseValue = 0;
    var buffValue = 0
    if (baseStats.includes(stat)) {
        baseValue = builds[currentUnitIndex].baseValues[stat].total;
        buffValue = builds[currentUnitIndex].baseValues[stat].buff * baseValue / 100;
    }
    var calculatedValue = baseValue + buffValue;
    
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
            result.right = Math.floor(calculatedValue + right);
            result.left = Math.floor(calculatedValue + left);
            result.total = Math.floor(calculatedValue + right + left);    
        } else {
            result.right = Math.floor(calculatedValue + right + left);
            result.left = 0;
            result.total = result.right;
        }
        return result;   
    } else {
        return {"total" : Math.floor(calculatedValue),"bonusPercent":currentPercentIncrease.value};
    }
}

function calculateStateValueForIndex(item, baseValue, currentPercentIncrease, equipmentStatBonus, stat) {
    if (item) {
        var value = getValue(item, stat);
        if (item[percentValues[stat]]) {
            var percentTakenIntoAccount = Math.min(item[percentValues[stat]], Math.max(300 - currentPercentIncrease.value, 0));
            currentPercentIncrease.value += item[percentValues[stat]];
            return value * equipmentStatBonus + percentTakenIntoAccount * baseValue / 100;
        } else {
            return value * equipmentStatBonus;
        }
    }
    return 0;
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

function logCurrentBuild() {
    readStatsValues();
    logBuild(builds[currentUnitIndex].build);
}

function logBuild(build, value) {
    var html = "";
    calculateAlreadyUsedItems();
    readItemsExcludeInclude();

    for (var index = 0; index < 11; index++) {
        redrawBuildLine(index);          
    }

    if (conciseView) {
        $("#buildResult").addClass("conciseView");
    } else {
        html = '<div class="tbody">' + html + '</div>';
        $("#buildResult").removeClass("conciseView");
    }

    //$("#buildResult").html(html);

    $("#resultStats > div").removeClass("statToMaximize");

    var link = Piramidata.getImageLink(builds[currentUnitIndex]);
    $(".imageLink").prop("href",link);
    $(".buildLinks").removeClass("hidden");

    $("#fixedItemsTitle").addClass("hidden");
    $("#resultStats").removeClass("hidden");
    var values = {};
    for (var statIndex = 0, len = statsToDisplay.length; statIndex < len; statIndex++) {
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
    $("#resultStats .mpRefresh .value").html(Math.floor(values["mp"] * calculateStatValue(build, "mpRefresh").total / 100));
    for (var index in elementList) {
        $("#resultStats .resists .resist." + elementList[index] + " .value").text(calculateStatValue(build, "resist|" + elementList[index] + ".percent").total + '%');
    }
    for (var index in ailmentList) {
        $("#resultStats .resists .resist." + ailmentList[index] + " .value").text(Math.min(100, calculateStatValue(build, "resist|" + ailmentList[index] + ".percent").total) + '%');
    }
    if (builds[currentUnitIndex].goal == "physicaleHp" || builds[currentUnitIndex].goal == "magicaleHp") {
        $("#resultStats ." + builds[currentUnitIndex].goal).addClass("statToMaximize");
    }

    var importantStats = builds[currentUnitIndex].involvedStats;
    for (var index in importantStats) {
        $("#resultStats ." + escapeDot(importantStats[index])).addClass("statToMaximize");    
    }

    if (!value) {
        readEnnemyStats();
        value = calculateBuildValue(build);
    }

    $("#resultStats .damage").addClass("hidden");
    if (importantStats.includes("atk") || importantStats.includes("mag")) {
        $("#resultStats .damage .monsterDefSpan").addClass("hidden");
        $("#resultStats .damage .monsterSprSpan").addClass("hidden");
        if (importantStats.includes("atk")) {
            $("#resultStats .damage .monsterDefValue").text(" " + ennemyStats.def);
            $("#resultStats .damage .monsterDefSpan").removeClass("hidden");
        }
        if (importantStats.includes("mag")) {
            $("#resultStats .damage .monsterSprValue").text(" " + ennemyStats.spr);
            $("#resultStats .damage .monsterSprSpan").removeClass("hidden");
        }
        $("#resultStats .damage .damageCoef").html("1x");
        $("#resultStats .damage .damageResult").html(Math.floor(value));
        $("#resultStats .damage").removeClass("hidden");
    }
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
    statName = statName.replace(/\./g, '_');
    return statName.replace(/\|/g, '_');
}

function getItemLine(index, short = false) {
    var html = "";
    
    var item = builds[currentUnitIndex].fixedItems[index];
    if (!item) {
        item = builds[currentUnitIndex].build[index];
    }
    
    if (index >= 0 && builds[currentUnitIndex].fixedItems[index]) {
        html += '<div class="td actions"><img class="pin fixed" title="Unpin this item" onclick="removeFixedItemAt(\'' + index +'\')" src="img/pinned.png"></img><img title="Remove this item" class="delete" onclick="removeItemAt(\'' + index +'\')" src="img/delete.png"></img></div>'
    } else if (!item) {
        html += '<div class="td actions"></div><div class="td type slot" onclick="displayFixItemModal(' + index + ');"><img src="img/'+ getSlotIcon(index) + '" class="icon"></img></div><div class="td name slot">'+ getSlotName(index) + '</div>'
    } else if (!item.placeHolder) {
        html += '<div class="td actions"><img title="Pin this item" class="pin notFixed" onclick="fixItem(\'' + item[itemKey] +'\',' + index + ',false);" src="img/pin.png"></img><img title="Remove this item" class="delete" onclick="removeItemAt(\'' + index +'\')" src="img/delete.png"></img>';
        if (item.type != "esper") {
            html += '<span title="Exclude this item from builds" class="excludeItem glyphicon glyphicon-ban-circle" onclick="excludeItem(\'' + item.id +'\')" />';
        }
        html += '</div>';
    } else {
        html += '<div class="td"></div>'
    }
    
    if (item) {
        if (short) {
            html += '<div class="change" onclick="displayFixItemModal(' + index + ');">' + getImageHtml(item) + '</div>' + getNameColumnHtml(item);
        } else {
            html += displayItemLine(item);
        }
        if (!item.placeHolder && index < 10 && onlyUseOwnedItems) {
            var alreadyUsed = 0;
            if (alreadyUsedItems[item.id]) {
                alreadyUsed = alreadyUsedItems[item.id];
            }
            alreadyUsed += getNumberOfItemAlreadyUsedInThisBuild(builds[currentUnitIndex].build, index, item);
            if (getOwnedNumber(item).totalOwnedNumber < alreadyUsed && getOwnedNumber(item).total >= alreadyUsed) {
                if (item.tmrUnit) {
                    html += '<div class="td"><span class="glyphicon glyphicon-screenshot" title="TMR you may want to farm. TMR of ' + item.tmrUnit + '"/></div>'
                } else if (item.access.includes("trial")) {
                    html += '<div class="td"><span class="glyphicon glyphicon-screenshot" title="Trial reward"/></div>'
                }
            }
        }
    }
    return html;
}

function getNumberOfItemAlreadyUsedInThisBuild(build, index, item) {
    var number = 0;
    for (var previousItemIndex = 0; previousItemIndex < 10; previousItemIndex++) {
        if (build[previousItemIndex] && build[previousItemIndex].id && build[previousItemIndex].id == item.id) {
            if (previousItemIndex <= index) {
                number++;
            }
            if (builds[currentUnitIndex].fixedItems[index]) {
                number--;
            }
        }
        
    }
    return number;
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
    item.maxLevel = esper.maxLevel
    if (esper.killers) {
        item.killers = esper.killers;
    }
    if (esper.resist) {
        item.resist = esper.resist;
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
            builds[currentUnitIndex].setUnit(selectedUnitData);
            updateUnitStats();
            $("#help").addClass("hidden");
            recalculateApplicableSkills();
            // Level correction (1+(level/100)) and final multiplier (between 85% and 100%, so 92.5% mean)
            damageMultiplier  = (1 + ((builds[currentUnitIndex].unit.max_rarity - 1)/5)) * 0.925; 
            logCurrentBuild();
        } else {
            builds[currentUnitIndex].setUnit(null);
            reinitBuild(currentUnitIndex); 
            updateUnitStats();
        }
        displayUnitRarity(selectedUnitData);
    });
}

function updateUnitStats() {
    $(baseStats).each(function (index, stat) {
        if (builds[currentUnitIndex].unit) {
            $(".unitStats .stat." + stat + " .baseStat input").val(builds[currentUnitIndex].unit.stats.maxStats[stat]);
            if (builds[currentUnitIndex].baseValues[stat]) {
                $(".unitStats .stat." + stat + " .pots input").val(builds[currentUnitIndex].baseValues[stat].pots);
                $(".unitStats .stat." + stat + " .buff input").val(builds[currentUnitIndex].baseValues[stat].buff);
            } else {
                $(".unitStats .stat." + stat + " .pots input").val(builds[currentUnitIndex].unit.stats.pots[stat]);
            }
        } else {
            $(".unitStats .stat." + stat + " .baseStat input").val("");
            $(".unitStats .stat." + stat + " .pots input").val("");
        }
    });
    populateUnitEquip();
    if (builds[currentUnitIndex].unit) {
        for (var index in builds[currentUnitIndex].unit.equip) {
            $(".unitEquipable img." + builds[currentUnitIndex].unit.equip[index]).removeClass("notEquipable");
        }
    }
    if (builds[currentUnitIndex].unit) {
        $("#pleaseSelectUnitMessage").addClass("hidden");
        $("#buildDiv").removeClass("hidden");
        $(".buildDiv").removeClass("hidden");
        $("#resultStats").removeClass("hidden");
        $(".buildLinks").removeClass("hidden");
        $("#buildResult").removeClass("hidden");
        $("#unitLink").prop("href",toUrl(builds[currentUnitIndex].unit.name));
        $("#unitLink").removeClass("hidden");
    } else {
        $("#unitTabs .tab_" + currentUnitIndex + " a").html("Select unit");
        $("#pleaseSelectUnitMessage").removeClass("hidden");
        $(".buildDiv").addClass("hidden");
        $("#resultStats").addClass("hidden");
        $(".buildLinks").addClass("hidden");
        $("#buildResult").addClass("hidden");
        $("#unitLink").addClass("hidden");
    }
    readStatsValues();
}

function reinitBuild(buildIndex) {
    builds[buildIndex] = new UnitBuild(null, [null, null, null, null, null, null, null, null,null,null,null], {});
    readGoal(buildIndex);
}

function loadBuild(buildIndex) {
    currentUnitIndex = buildIndex;
    var build = builds[buildIndex];
    
    $("#unitsSelect option").prop("selected", false);
    if (build.unit) {
        $('#unitsSelect option[value="' + build.unit.name + '"]').prop("selected", true);
    }
    $(".unitAttackElement div.elements label").removeClass("active");
    if (build.innateElements) {
        for (var i in build.innateElements) {
            $(".unitAttackElement div.elements label:has(input[value=" + build.innateElements[i] + "])").addClass("active");
        }
    }
    
    $(".goal option").prop("selected", false);
    if (build.goal) {
        if (build.goal == "custom") {
            customFormula = build.customFormula;
        } else {
            customFormula = null;
            if (build.goal == "magicalDamageWithPhysicalMecanism") {
                $('.goal option[value="magicalDamage"]').prop("selected", true);   
            } else {
                $('.goal option[value="' + build.goal + '"]').prop("selected", true);
            }
        }
    }
    $(".magicalSkillType option").prop("selected", false);
    if (build.goal == "magicalDamage") {
        $('.magicalSkillType option[value="normal"]').prop("selected", true);
    } else if (build.goal == "magicalDamageWithPhysicalMecanism") {
        $('.magicalSkillType option[value="physicalMagic"]').prop("selected", true);
    }
    
    updateUnitStats();
    
    onGoalChange();
    
    
    if (builds[currentUnitIndex].unit) {
        logCurrentBuild();  
    }
}

function addNewUnit() {
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + (builds.length - 1)).after("<li class='active tab_" + builds.length + "'><a href='#' onclick='selectUnitTab(" + builds.length + ")'>Select unit</a></li>");
    builds.push(null);
    reinitBuild(builds.length - 1);
    $('#forceDoublehand input').prop('checked', false);
    $('#forceDualWield input').prop('checked', false);
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
    readGoal();
    if (builds[currentUnitIndex].unit) { 
        logCurrentBuild();
    }
    var goal = builds[currentUnitIndex].goal;
    $(".monster").addClass("hidden");
    $(".unitAttackElement").addClass("hidden");
    $(".magicalSkillType").addClass("hidden");
    if (builds[currentUnitIndex].involvedStats.includes("physicalKiller") 
        || builds[currentUnitIndex].involvedStats.includes("magicalKiller")
        || builds[currentUnitIndex].involvedStats.includes("weaponElement")) {
        $(".monster").removeClass("hidden");
        $(".unitAttackElement").removeClass("hidden");
    }
    if (builds[currentUnitIndex].involvedStats.includes("weaponElement")) {
        $(".unitAttackElement").removeClass("hidden");
    }
    if (goal == "magicalDamage") {
        $(".magicalSkillType").removeClass("hidden");
    }
    
    if (customFormula) {
        $('#normalGoalChoices').addClass("hidden");
        $('#customGoalChoice').removeClass("hidden");
        $("#customGoalFormula").text(formulaToString(customFormula));
    } else {
        $('#normalGoalChoices').removeClass("hidden");
        $('#customGoalChoice').addClass("hidden");
    }
}

function openCustomGoalModal() {
    $("#customFormulaModal").modal();
}

function chooseCustomFormula() {
    var formulaString = $("#customFormulaModal input").val();
    var formula = parseFormula(formulaString);
    if (formula) {
        customFormula = formula;
        builds[currentUnitIndex].goal = "custom";
        $('#customFormulaModal').modal('hide');
        onGoalChange();
    }
}

function removeCustomGoal() {
    customFormula = null;
    onGoalChange();
    $('#customFormulaModal').modal('hide');
}

function onEquipmentsChange() {
    var equipments = $(".equipments select").val();
    if (equipments == "all") {
        $("#exludeEvent").parent().removeClass("hidden");
        $("#excludePremium").parent().removeClass("hidden");
        $("#excludeTMR5").parent().removeClass("hidden");
        $("#excludeNotReleasedYet").parent().removeClass("hidden");
        $("#includeTMROfOwnedUnits").parent().addClass("hidden");
        $("#includeTrialRewards").parent().addClass("hidden");
        onlyUseOwnedItems = false;
    } else {
        $("#exludeEvent").parent().addClass("hidden");
        $("#excludePremium").parent().addClass("hidden");
        $("#excludeTMR5").parent().addClass("hidden");
        $("#excludeNotReleasedYet").parent().addClass("hidden");
        if (ownedUnits && Object.keys(ownedUnits).length > 0) {
            $("#includeTMROfOwnedUnits").parent().removeClass("hidden");
        } else {
            $("#includeTMROfOwnedUnits").parent().addClass("hidden");
        }
        $("#includeTrialRewards").parent().removeClass("hidden");
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
        types = builds[currentUnitIndex].getCurrentUnitEquip().concat("esper");
    }
    var baseStat;
    if (searchStat != "") {
        baseStat = builds[currentUnitIndex].baseValues[searchStat].total;
    }
    accessToRemove = [];
    
    var dataWithOnlyOneOccurence = searchableEspers.slice();
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (!isApplicable(item)) {
            // Don't display not applicable items
            continue;
        }
        if (dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1].id == item.id) {
            var previousItem = dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1];
            if (previousItem.equipedConditions) {
                if (item.equipedConditions) {
                    if (previousItem.equipedConditions.length <= item.equipedConditions.length && areConditionOK(item, builds[currentUnitIndex].build)) {
                        dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
                    }
                }
            } else {
                if (areConditionOK(item, builds[currentUnitIndex].build)) {
                    dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
                }
            }
        } else {
            dataWithOnlyOneOccurence.push(item);
        }
    }
    
    displaySearchResults(sort(filter(dataWithOnlyOneOccurence, false, searchStat, baseStat, searchText, builds[currentUnitIndex].unit.name, types, [], [], [], [], "", false, true)));
    
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
    if (!builds[currentUnitIndex].unit) {
        alert("Please select an unit");
        return;
    }
    
    builds[currentUnitIndex].prepareEquipable();
    if (builds[currentUnitIndex].equipable[index].length == 0) {
        alert("Nothing can be added at this slot");
        return;
    }
    currentItemSlot = index;
    
    populateItemType(builds[currentUnitIndex].equipable[index]);
    
    calculateAlreadyUsedItems();
    $("#searchText").val("");
    $("#fixItemModal .results .tbody").html("");
    
    $("#fixItemModal").modal();
    selectSearchStat(searchStat);
    selectSearchType(builds[currentUnitIndex].equipable[index]);
    updateSearchResult();
}

function fixItem(key, slotParam = -1) {
    var item;
    if (typeList.includes(key)) {
        item = getPlaceHolder(key);
    } else if (espersByName[key])  {
        item = espersByName[key];
    } else {
        item = findBestItemVersion(builds[currentUnitIndex].build, key);
    }
    
    if (item) {
        builds[currentUnitIndex].prepareEquipable();
        var slot = slotParam;
        if (slot == -1) {
            slot = getFixedItemItemSlot(item, builds[currentUnitIndex].equipable, builds[currentUnitIndex].fixedItems);
        }
        if (slot == -1) {
            if (weaponList.includes(item.type) && builds[currentUnitIndex].fixedItems[0] && !builds[currentUnitIndex].fixedItems[1]) {
                // for weapon, if the second weapon were refused, check if an innat partial DW allow it
                var innatePartialDualWield = builds[currentUnitIndex].getPartialDualWield();
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
        if (!isStackable(item)) {
            for(var index = 6; index < 10; index++) {
                if (index != slot && builds[currentUnitIndex].build[index]&& builds[currentUnitIndex].build[index].id == item.id) {
                    alert("This materia is not stackable. You cannot add another one");
                    return;
                }
            }
        }
        if (builds[currentUnitIndex].build[slot] && builds[currentUnitIndex].build[slot].id != item.id) {
            removeItemAt(slot);
        }
        builds[currentUnitIndex].fixedItems[slot] = item;
        builds[currentUnitIndex].build[slot] = item;
        if (slot < 10) {
            for (var index = 0; index < 10; index++) {
                if (index != slot) {
                    var itemTmp = builds[currentUnitIndex].build[index];
                    if (itemTmp  && !itemTmp.placeHolder && index != slot) {
                        var bestItemVersion = findBestItemVersion(builds[currentUnitIndex].build, itemTmp[itemKey]);
                        if (builds[currentUnitIndex].fixedItems[index]) {
                            builds[currentUnitIndex].fixedItems[index] = bestItemVersion;
                        }
                        builds[currentUnitIndex].build[index] = bestItemVersion;
                    }
                }
            }
        }
        recalculateApplicableSkills();
        logCurrentBuild();
    }
    $('#fixItemModal').modal('hide');
}

function findBestItemVersion(build, key) {
    var itemVersions = allItemVersions[key];
    if (!itemVersions) {
        allItemVersions[key] = [];
        var found = false;
        for (var index in data) {
            if (data[index][itemKey] == key) {
                allItemVersions[key].push(data[index]);
                found = true;
            }
            if (found && data[index][itemKey] != key) {
                break;
            }
        }
        itemVersions = allItemVersions[key];
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
    var equip = builds[currentUnitIndex].getCurrentUnitEquip();
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
    builds[currentUnitIndex].build[slot] = null;
    builds[currentUnitIndex].prepareEquipable();
    for (var index = 0; index < 10; index ++) {
        var item = builds[currentUnitIndex].build[index];
        if (item && !item.placeHolder) {
            if (!builds[currentUnitIndex].equipable[index].includes(item.type)) {
                removeItemAt(index);
            } else {
                builds[currentUnitIndex].build[index] = findBestItemVersion(builds[currentUnitIndex].build, item[itemKey]);
                if (builds[currentUnitIndex].fixedItems[index]) {
                    builds[currentUnitIndex].fixedItems[index] = builds[currentUnitIndex].build[index];
                }
            }
        }
    }
    recalculateApplicableSkills();
    logCurrentBuild();
}

function excludeItem(itemId) {
    if (!itemsToExclude.includes(itemId)) {
        for (var index = 0; index < 10; index++) {
            if (builds[currentUnitIndex].build[index] && builds[currentUnitIndex].build[index].id == itemId) {
                removeItemAt(index);
            }
        }
        itemsToExclude.push(itemId);
    }
    $(".excludedItemNumber").html(itemsToExclude.length);
}

function recalculateApplicableSkills() {
    builds[currentUnitIndex].build = builds[currentUnitIndex].build.slice(0,11);
    for (var skillIndex = builds[currentUnitIndex].unit.skills.length; skillIndex--;) {
        var skill = builds[currentUnitIndex].unit.skills[skillIndex];
        if (areConditionOK(skill, builds[currentUnitIndex].build)) {
            builds[currentUnitIndex].build.push(skill);
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
        "goal": builds[currentUnitIndex].goal,
        "innateElements":getSelectedValuesFor("elements")
    };

    if (data.goal == "magicalDamage") {
        data.attackType = $(".magicalSkillType select").val();
    }
    if (data.goal == "physicalDamage" || data.goal == "magicalDamage" || data.goal == "magicalDamageWithPhysicalMecanism" || data.goal == "hybridDamage" || data.goal == "custom") {
        data.ennemyRaces = getSelectedValuesFor("races");
        readEnnemyStats();
        data.ennemyResists = ennemyStats.elementResists;
        data.monsterDef = ennemyStats.def;
        data.monsterSpr = ennemyStats.spr;
    }
    
    if (builds[currentUnitIndex].unit) {
        data.unitName = builds[currentUnitIndex].unit.name;
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
    
    if (data.goal == "custom") {
        data.customFormula = formulaToString(builds[currentUnitIndex].customFormula);
    }
    
    data.pots = {};
    data.buff = {};
    for (var index = baseStats.length; index--;) {
        data.pots[baseStats[index]] = builds[currentUnitIndex].baseValues[baseStats[index]].pots;
        data.buff[baseStats[index]] = builds[currentUnitIndex].baseValues[baseStats[index]].buff;
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
    if (data.customFormula) {
        customFormula = parseFormula(data.customFormula);
    }
    onGoalChange();
    if (data.unitName) {
        $('#unitsSelect option[value="' + data.unitName + '"]').prop("selected", true);
        onUnitChange();
    }
    select("elements", data.innateElements);
    if (data.goal == "mag" || data.goal == "magicalDamage") {
        $('.magicalSkillType select option[value="' + data.attackType + '"]').prop("selected", true);
    }
    if (data.goal == "atk" || data.goal == "mag" || data.goal == "physicalDamage" || data.goal == "magicalDamage" || data.goal == "hybridDamage") {
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
    if (data.pots) {
        for (var index = baseStats.length; index--;) {
            $(".unitStats .stat." + baseStats[index] + " .pots input").val(data.pots[baseStats[index]]);
        }
    }
    if (data.buff) {
        for (var index = baseStats.length; index--;) {
            $(".unitStats .stat." + baseStats[index] + " .buff input").val(data.buff[baseStats[index]]);
        }
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
        var item = builds[currentUnitIndex].build[index];
        if (item && !item.placeHolder && hasDualWieldOrPartialDualWield(item)) {
            data.fixedItems.push(item[itemKey]);
        }
    }
    // then others items
    for (var index = 0; index < 10; index++) {
        var item = builds[currentUnitIndex].build[index];
        if (item && !item.placeHolder && !hasDualWieldOrPartialDualWield(item)) {
            data.fixedItems.push(item[itemKey]);
        }
        if (item && item.placeHolder) {
            data.fixedItems.push(item.type);
        }
    }
    data.equipmentToUse = "all";
    getShortUrl("http://ffbeEquip.lyrgard.fr/builder.html#" + btoa(JSON.stringify(data)), function(shortUrl) {
        $('<div id="showLinkDialog" title="Build Link">' + 
            '<input value="' + shortUrl + '"></input>' +
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
    });
}
      
function showBuilderSetupLink() {
    var data = getStateHash();
    getShortUrl("http://ffbeEquip.lyrgard.fr/builder.html#" + btoa(JSON.stringify(data)), function(shortUrl) {
        $('<div id="showBuilderSetupLinkDialog" title="Builder setup Link">' + 
            '<input value="' + shortUrl + '"></input>' +
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
    });
    
}

function showBuildAsText() {
    var text = "";
    text += 
        getItemLineAsText("Right hand", 0) +
        getItemLineAsText("Left hand", 1) +
        getItemLineAsText("Head", 2) +
        getItemLineAsText("Body", 3) +
        getItemLineAsText("Accessory 1", 4) +
        getItemLineAsText("Accessory 2", 5) +
        getItemLineAsText("Materia 1", 6) +
        getItemLineAsText("Materia 2", 7) +
        getItemLineAsText("Materia 3", 8) +
        getItemLineAsText("Materia 4", 9) +
        getItemLineAsText("Esper", 10) +
        getBuildStatsAsText();
        
    showTextPopup("Build as text", text);
}

function showExcludedItems() {
    
    var text = "";
    var idAlreadyTreated = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (itemsToExclude.includes(item.id) && !idAlreadyTreated.includes(item.id)) {
            text += '<div class="tr id_' + item.id +'">' +
                '<div class="td actions"><span class="excludeItem glyphicon glyphicon-remove" onclick="removeItemFromExcludeList(\'' + item.id +'\')"></span></div>' +
                getImageHtml(item) + 
                getNameColumnHtml(item) + 
                '</div>';
            idAlreadyTreated.push(item.id);
        }
    }
        
    $('<div id="showExcludedItemsDialog" title="Excluded items">' + 
        '<div class="table items">' + text + '</div>' +
      '</div>' ).dialog({
        modal: true,
        position: { my: 'top', at: 'top+150', of: $("body") },
        width: 600
    });
}

function removeItemFromExcludeList(id) {
    $("#showExcludedItemsDialog .tr.id_" + id).remove();
    itemsToExclude.splice(itemsToExclude.indexOf(id),1);
    $(".excludedItemNumber").html(itemsToExclude.length);
}

function getItemLineAsText(prefix, slot) {
    var item = builds[currentUnitIndex].build[slot];
    if (item) {
        var resultText = prefix + ": " + item.name + " ";
        var first = true;
        for (var statIndex = 0, len = baseStats.length; statIndex < len; statIndex++) {
            if (item[baseStats[statIndex]]) {
                if (first) {
                    first = false;
                } else {
                    resultText += ", ";
                }
                resultText += baseStats[statIndex].toUpperCase() + "+" + item[baseStats[statIndex]];
            }
            if (item[baseStats[statIndex] + "%"]) {
                if (first) {
                    first = false;
                } else {
                    resultText += ", ";
                }
                resultText += baseStats[statIndex].toUpperCase() + "+" + item[baseStats[statIndex]+"%"] + "%";
            }
        }
        return resultText + "  \n";
    } else {
        return "";
    }
}

function getBuildStatsAsText() {
    var resultText = "Total: ";
    var first = true;
    for (var statIndex = 0, len = baseStats.length; statIndex < len; statIndex++) {
        var result = calculateStatValue(builds[currentUnitIndex].build, baseStats[statIndex]).total;
        if (first) {
            first = false;
        } else {
            resultText += ", ";
        }
        resultText += baseStats[statIndex].toUpperCase() + ":" + Math.floor(result);
    }
    return resultText;
}

function onPotsChange(stat) {
    if (builds[currentUnitIndex].unit) {
        var value = parseInt($(".unitStats .stat." + stat + " .pots input").val()) || 0;
        if (value > builds[currentUnitIndex].unit.stats.pots[stat]) {
            $(".unitStats .stat." + stat + " .pots input").val(builds[currentUnitIndex].unit.stats.pots[stat]);
        }
        logCurrentBuild();
    }
}

function onBuffChange(stat) {
    if (builds[currentUnitIndex].unit) {
        var value = parseInt($(".unitStats .stat." + stat + " .buff input").val()) || 0;
        if (value > 300) {
            $(".unitStats .stat." + stat + " .buff input").val(300);
        }
        logCurrentBuild();
    }
}

$(function() {
    progressElement = $("#buildProgressBar .progressBar");
    $.get(server + "/data.json", function(result) {
        data = result;
        prepareSearch(data);
        continueIfReady();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/unitsWithSkill.json", function(result) {
        for (var name in result) {
            result[name].name = name;
        }
        units = result;
        populateUnitSelect();
        continueIfReady();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/espers.json", function(result) {
        espers = result;
        for (var index = espers.length; index--;) {
            espersByName[espers[index].name] = getEsperItem(espers[index]);    
        }
        searchableEspers = [];
        for (var index = espers.length; index--;) {
            searchableEspers.push(getEsperItem(espers[index]));
        }
        prepareSearch(searchableEspers);
        continueIfReady();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/units", function(result) {
        ownedUnits = result;
        onEquipmentsChange();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
    });
    
    builds[currentUnitIndex] = {};
    
    $(".goal select").change(onGoalChange);
    
    $(".equipments select").change(onEquipmentsChange);
    
    $("#buildButton").click(build);
    
    
    
    // Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"]);
    // Killers
	addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
    
    populateItemStat();
    populateUnitEquip();
    populateResists();
    
    // Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateSearchResult));
    $('#fixItemModal').on('shown.bs.modal', function () {
        $('#searchText').focus();
    })  
    $("#customFormulaModal").on('shown.bs.modal', function () {
        $("#customFormulaModal input").focus();
    })
    
    
    $(".excludedItemNumber").html(itemsToExclude.length);

    $("#forceDoublehand input").change(function() {
        if ($("#forceDoublehand input").prop('checked')) {
            $('#forceDualWield input').prop('checked', false);
        }
    });
    $("#forceDualWield input").change(function() {
        if ($("#forceDualWield input").prop('checked')) {
            $('#forceDoublehand input').prop('checked', false);
        }
    });
    for (let statIndex = baseStats.length; statIndex--;) {
        $(".unitStats .stat." + baseStats[statIndex] + " .pots input").on('input',$.debounce(300,function() {onPotsChange(baseStats[statIndex]);}));
        $(".unitStats .stat." + baseStats[statIndex] + " .buff input").on('input',$.debounce(300,function() {onBuffChange(baseStats[statIndex]);}));
        $(".unitStats .stat." + baseStats[statIndex] + " .pots .leftIcon").click(function(stat) {
            if (builds[currentUnitIndex].unit) {
                var value = parseInt($(".unitStats .stat." + baseStats[statIndex] + " .pots input").val()) || 0;
                if (value == builds[currentUnitIndex].unit.stats.pots[baseStats[statIndex]]) {
                    $(".unitStats .stat." + baseStats[statIndex] + " .pots input").val("0");
                } else {
                    $(".unitStats .stat." + baseStats[statIndex] + " .pots input").val(builds[currentUnitIndex].unit.stats.pots[baseStats[statIndex]]);
                }
                logCurrentBuild();
            }
        });
    }
    
});

var counter = 0;
function continueIfReady() {
    counter++;
    if (counter == 3) {
        for (var index = 0, len = navigator.hardwareConcurrency; index < len; index++) {
            workers.push(new Worker('builder/optimizerWebWorker.js'));
            workers[index].postMessage({"type":"init", "data":data, "espers":espers});
        }
        var hashData = readStateHashData();
        if (hashData) {
            loadStateHashAndBuild(hashData);
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
    target.append('<img src="img/sort-a-z.png" onclick="selectSearchStat();updateSearchResult();" class="btn btn-default"/>');
	for (var key in statList) {
        target.append('<img src="img/sort-' + statList[key] + '.png" onclick="selectSearchStat(\'' + statList[key] + '\');updateSearchResult();" class="btn btn-default"/>');
	}
}

function populateResists() {
    var div = $("#resultStats .resists .elements");
    for (var index in elementList) {
        div.append('<div class="resist ' + elementList[index] + ' ' +  escapeDot("resist|" + elementList[index] + ".percent") + '"><img src="img/' + elementList[index] + '.png"><div class="value">0%<div></div>');
    }
    var div = $("#resultStats .resists .ailments");
    for (var index in ailmentList) {
        div.append('<div class="resist ' + ailmentList[index] + ' ' +  escapeDot("resist|" + ailmentList[index] + ".percent") +'"><img src="img/' + ailmentList[index] + '.png"><div class="value">0%<div></div>');
    }
}