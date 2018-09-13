page = "builder";
var adventurerIds = ["1500000013", "1500000015", "1500000016", "1500000017", "1500000018"];

const formulaByGoal = {
    "physicalDamage":                   {"type":"skill", "id":"0","name":"1x physical ATK damage", "formulaName":"physicalDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1}}},
    "magicalDamage":                    {"type":"skill", "id":"0","name":"1x magical ATK damage", "formulaName":"magicalDamage", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"mind", "coef":1}}},
    "hybridDamage":                     {"type":"skill", "id":"0","name":"1x hybrid ATK damage", "formulaName":"hybridDamage", "value": {"type":"damage", "value":{"mecanism":"hybrid", "coef":1}}},
    "jumpDamage":                       {"type":"skill", "id":"0","name":"1x jump damage", "formulaName":"jumpDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1, "jump":true}}},
    "magDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical MAG damage", "formulaName":"magDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"mind", "coef":1}}},
    "sprDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical SPR damage", "formulaName":"sprDamageWithPhysicalMecanism", "formulaName":"physicalDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"mind", "coef":1, "use":{"stat":"spr"}}}},
    "defDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical DEF damage", "formulaName":"defDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1, "use":{"stat":"def"}}}},
    "sprDamageWithMagicalMecanism":     {"type":"skill", "id":"0","name":"1x physical SPR damage", "formulaName":"sprDamageWithMagicalMecanism", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"mind", "coef":1, "use":{"stat":"spr"}}}},
    "atkDamageWithFixedMecanism":       {"type":"value","name":"atkDamageWithFixedMecanism"},
    "physicalDamageMultiCast":          {"type":"value","name":"physicalDamageMultiCast"},
    "fixedDamageWithPhysicalMecanism":  {"type":"value","name":"fixedDamageWithPhysicalMecanism"},
    "summonerSkill":                    {"type":"value","name":"summonerSkill"},
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


const goalQuickSelectDefaultValues = [
    ["physicalDamage","Physical damage"],
    ["magicalDamage","Magical damage"],
    ["hybridDamage","Hybrid damage"],
    ["jumpDamage","Jump damage"],
    ["magDamageWithPhysicalMecanism","Physical type MAG damage"],
    ["sprDamageWithPhysicalMecanism","Physical type SPR damage"],
    ["defDamageWithPhysicalMecanism","Physical type DEF damage"],
    ["sprDamageWithMagicalMecanism","Magical type SPR damage"],
    ["atkDamageWithFixedMecanism","Fixed type ATK damage"],
    ["physicalDamageMultiCast","Physical damage Multicast"],
    ["fixedDamageWithPhysicalMecanism","Physical type Fixed damage (1000)"],
    ["summonerSkill","Summoner skill"],
    ["physicaleHp","Physical eHP (HP * DEF)"],
    ["magicaleHp","Magical eHP (HP * SPR)"],
    ["def","Defense"],
    ["spr","Spirit"],
    ["hp","Health Points"],
    ["physicalEvasion","Physical evasion"],
    ["magicalEvasion","Magical evasion"],
    ["mpRefresh","MP/turn"],
    ["heal","Heal"]
]

const statsToDisplay = baseStats.concat(["evade.physical","evade.magical"]);

var customFormula;

var espers;
var espersByName = {};

var units;
var ownedUnits;
var unitsWithSkills;

var ennemyStats;

var builds = [];
var currentUnitIndex = 0;

var searchType = [];
var searchStat = "";
var ClickBehaviors = {
    EQUIP: 0,
    IGNORE: 1,
    EXCLUDE: 2
};
var searchClickBehavior = ClickBehaviors.EQUIP;
var currentItemSlot;

var searchableEspers;

var dataLoadedFromHash = false;

var conciseView = true;

var progressElement;
var progress;

const defaultItemsToExclude = ["409009000"];
var itemsToExclude = defaultItemsToExclude.slice(); // Ring of Dominion


var running = false;

var workers = [];
var workerWorkingCount = 0;
var processedCount = 0
var typeCombinationsCount;
var remainingTypeCombinations;
var dataStorage = new DataStorage();
var bestiary;
var typeCombinationChunckSizeDefault = 2;
var typeCombinationChunckSize = typeCombinationChunckSizeDefault;
var goalVariation = "min";
var initialPinnedWeapons;
var currentEnchantmentItem;

var savedBuilds = null;
var currentSavedBuildIndex = -1;

var secondaryOptimization = false;
var secondaryOptimizationFixedItemSave;
var secondaryOptimizationFormulaSave;

var useNew400Cap = false;

function build() {
    secondaryOptimization = false;
    if (running) {
        for (var index = workers.length; index--; index) {
            workers[index].terminate();
        }   
        Modal.showMessage("Build cancelled", "The build calculation has been stopped. The best calculated result is displayed, but it may not be the overall best build.");
        console.timeEnd("optimize");
        initWorkers();
        workerWorkingCount = 0;
        running = false;
        $("#buildButton").text("Build !");
        $("body").removeClass("building");
        return;
    }
    
    $(".buildLinks").addClass("hidden");
    
    if (!builds[currentUnitIndex].unit) {
        Modal.showMessage("No unit selected", "Please select an unit");
        return;
    }   
    
    builds[currentUnitIndex].emptyBuild();
    
    readEnnemyStats();
    readGoal();
    
    dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
    readItemsExcludeInclude();
    readStatsValues();
    
    running = true;
    $("body").addClass("building");
    $("#buildButton").text("STOP");
    
    try {
        optimize();
    } catch(error) {
        Modal.showError("An error occured while trying to optimize", error);
    }
}

function optimize() {
    console.time("optimize");
    progress = 0;
    progressElement.width("0%");
    progressElement.text("0%");
    progressElement.removeClass("finished");
    
    var forceDoubleHand = $("#forceDoublehand input").prop('checked');
    var forceDualWield = $("#forceDualWield input").prop('checked');
    var tryEquipSources = $("#tryEquipsources input").prop('checked');
    var useNewJpDamageFormula = $("#useNewJpDamageFormula").prop('checked');
    
    dataStorage.setUnitBuild(builds[currentUnitIndex]);
    dataStorage.itemsToExclude = itemsToExclude;
    dataStorage.prepareData(itemsToExclude, ennemyStats);
    
    var espersToSend = {};
    var esperNames = Object.keys(espersByName);
    for (var esperNameIndex in esperNames) {
        var esperName = esperNames[esperNameIndex];
        if (!itemsToExclude.includes(esperName)) {
            espersToSend[esperName] = espersByName[esperName];
        }
    }
    
    for (var index = workers.length; index--; index) {
        workers[index].postMessage(JSON.stringify({
            "type":"setData", 
            "server": (useNew400Cap ? "JP" : server),
            "espers":espersToSend,
            "unit":builds[currentUnitIndex].unit,
            "level":builds[currentUnitIndex]._level,
            "fixedItems":builds[currentUnitIndex].fixedItems, 
            "baseValues":builds[currentUnitIndex].baseValues,
            "innateElements":builds[currentUnitIndex].innateElements,
            "formula":builds[currentUnitIndex].formula,
            "dataByType":dataStorage.dataByType,
            "dataWithCondition":dataStorage.dataWithCondition,
            "dualWieldSources":dataStorage.dualWieldSources,
            "alreadyUsedEspers":dataStorage.alreadyUsedEspers,
            "useEspers":!dataStorage.onlyUseShopRecipeItems,
            "ennemyStats":ennemyStats,
            "goalVariation": goalVariation,
            "useNewJpDamageFormula": useNewJpDamageFormula,
            "useNew400Cap": useNew400Cap
        }));
    }
    
    
    var typeCombinationGenerator = new TypeCombinationGenerator(forceDoubleHand, forceDualWield, tryEquipSources, builds[currentUnitIndex], dataStorage.dualWieldSources, dataStorage.equipSources, dataStorage.dataByType, dataStorage.weaponsByTypeAndHands);
    remainingTypeCombinations = typeCombinationGenerator.generateTypeCombinations();
    
    typeCombinationChunckSize = Math.min(typeCombinationChunckSize, Math.ceil(remainingTypeCombinations.length/20));
    
    initialPinnedWeapons = [builds[currentUnitIndex].fixedItems[0], builds[currentUnitIndex].fixedItems[1]];
    
    document.title = "0% - FFBE Equip - Builder";
    
    processedCount = 0
    typeCombinationsCount = remainingTypeCombinations.length;
    for (var index = workers.length; index--; index) {
        processTypeCombinations(index);
    }   
}

function processTypeCombinations(workerIndex) {
    if (remainingTypeCombinations.length == 0) {
        return;
    }
    var combinationsToProcess;
    if (typeCombinationChunckSize > remainingTypeCombinations.length) {
        combinationsToProcess = remainingTypeCombinations;
        remainingTypeCombinations = [];
    } else {
        combinationsToProcess = remainingTypeCombinations.slice(0,typeCombinationChunckSize);
        remainingTypeCombinations = remainingTypeCombinations.slice(typeCombinationChunckSize);
    }
    workers[workerIndex].postMessage(JSON.stringify({
        "type":"optimize", 
        "typeCombinations":combinationsToProcess
    }));
    workerWorkingCount++;
}

function readGoal(index = currentUnitIndex) {
    var goal;
    if (customFormula) {
        builds[currentUnitIndex].goal = "custom";
        builds[currentUnitIndex].formula = customFormula;
    } else {
        var goalValue = $(".goal #normalGoalChoice").val();
        if (goalValue.startsWith("SKILL_") && builds[currentUnitIndex].unit) {
            builds[currentUnitIndex].goal = "custom";
            var skillName = goalValue.substr(6);
            var skill = getSkillFromName(skillName, unitsWithSkills[builds[currentUnitIndex].unit.id]);
            builds[currentUnitIndex].formula = formulaFromSkill(skill);
        } else {
            builds[currentUnitIndex].goal = goalValue;
            builds[currentUnitIndex].formula = formulaByGoal[goalValue];
        }
    }
    goalVariation = $("#goalVariance").val();
    useNew400Cap = $("#useNew400Cap").prop('checked');
    $(".unitStack").toggleClass("hidden", !builds[currentUnitIndex].formula || !builds[currentUnitIndex].formula.stack);
    if (!builds[currentUnitIndex].formula || !builds[currentUnitIndex].formula.stack) {
        $(".unitStack input").val("");
    }
}

function readItemsExcludeInclude() {
    dataStorage.exludeEventEquipment = $("#exludeEvent").prop('checked');
    dataStorage.excludeTMR5 = $("#excludeTMR5").prop('checked');
    dataStorage.excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
    dataStorage.excludePremium = $("#excludePremium").prop("checked");
    dataStorage.excludeSTMR = $("#excludeSTMR").prop("checked");
    dataStorage.includeTMROfOwnedUnits = $("#includeTMROfOwnedUnits").prop("checked");
    dataStorage.includeTrialRewards = $("#includeTrialRewards").prop("checked");
    dataStorage.includeEasilyObtainableItems = $("#includeEasilyObtainableItems").prop("checked");
    dataStorage.includeChocoboItems = $("#includeChocoboItems").prop("checked");
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
    var lbShardsPerTurn = parseInt($(".unitStats .stat.lbShardsPerTurn .buff input").val());
    if (isNaN(lbShardsPerTurn)) {
        lbShardsPerTurn = 0;
    }
    builds[currentUnitIndex].baseValues["lbFillRate"] = {
        "total" : lbShardsPerTurn,
        "buff" : parseInt($(".unitStats .stat.lbFillRate .buff input").val()) || 0
    };
    builds[currentUnitIndex].baseValues["mitigation"] = {
        "physical" : parseInt($(".unitStats .stat.pMitigation .buff input").val()) || 0,
        "magical" : parseInt($(".unitStats .stat.mMitigation .buff input").val()) || 0,
        "global" : parseInt($(".unitStats .stat.mitigation .buff input").val()) || 0
    };
    builds[currentUnitIndex].innateElements = getSelectedValuesFor("elements");
    builds[currentUnitIndex].baseValues["currentStack"] = parseInt($(".unitStack input").val()) || 0;
}



function getPlaceHolder(type) {
    return {"name":"Any " + type,"type":type, "placeHolder":true};
}
 

function readEnnemyStats() {
    var ennemyResist = {};
    var ennemyImperils = {"fire":0, "ice":0, 'lightning':0, 'water':0, 'earth':0, 'wind':0, 'light':0, 'dark':0};
    for(var elementIndex = elementList.length; elementIndex--;) {
        var element = elementList[elementIndex];
        var resistValue = $("#elementalResists ." + element + " input.elementalResist").val();
        if (resistValue) {
            ennemyResist[element] = parseInt(resistValue);
        } else {
            ennemyResist[element] = 0;
        }
        var imperilValue = $("#elementalResists ." + element + " input.imperil").val();
        if (imperilValue) {
            ennemyImperils[element] = parseInt(imperilValue);
        } else {
            ennemyImperils[element] = 0;
        }
    }
    var ennemyRaces = getSelectedValuesFor("races");
    var monsterDef = 100;
    var monsterSpr = 100;
    if ($("#monsterDefensiveStats .def .stat").val()) {
        monsterDef = parseInt($("#monsterDefensiveStats .def .stat").val());
    }
    if ($("#monsterDefensiveStats .spr .stat").val()) {
        monsterSpr = parseInt($("#monsterDefensiveStats .spr .stat").val());
    }
    var ennemyBreaks = {"atk":0, "def":0, "mag":0, "spr":0};
    if ($("#monsterDefensiveStats .def .break").val()) {
        ennemyBreaks.def = parseInt($("#monsterDefensiveStats .def .break").val());
    }
    if ($("#monsterDefensiveStats .spr .break").val()) {
        ennemyBreaks.spr = parseInt($("#monsterDefensiveStats .spr .break").val());
    }
    ennemyStats = new EnnemyStats(getSelectedValuesFor("races"), monsterDef, monsterSpr, ennemyResist, ennemyBreaks, ennemyImperils);
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

function logCurrentBuild() {
    readStatsValues();
    readGoal();
    readEnnemyStats();
    logBuild(builds[currentUnitIndex].build);
}

function logBuild(build, value) {
    var html = "";
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

    var useNewJpDamageFormula = $("#useNewJpDamageFormula").prop('checked');

    $("#resultStats .statToMaximize").removeClass("statToMaximize");

    var link = Piramidata.getImageLink(builds[currentUnitIndex]);
    $(".imageLink").prop("href",link);
    $(".buildLinks").removeClass("hidden");

    $("#fixedItemsTitle").addClass("hidden");
    $("#resultStats").removeClass("hidden");
    var values = {};
    for (var statIndex = 0, len = statsToDisplay.length; statIndex < len; statIndex++) {
        var result = calculateStatValue(build, statsToDisplay[statIndex], builds[currentUnitIndex]);
        values[statsToDisplay[statIndex]] = result.total;
        
        $("#resultStats ." + escapeDot(statsToDisplay[statIndex]) + " .value").html(Math.floor(result.total));
        var bonusTextElement = $("#resultStats ." + escapeDot(statsToDisplay[statIndex]) + " .bonus");

        var bonusPercent;
        if (result.bonusPercent > statsBonusCap[(useNew400Cap ? "JP" : server)]) {
            bonusPercent = "<span style='color:red;' title='Only " + statsBonusCap[(useNew400Cap ? "JP" : server)] + "% taken into account'>" + result.bonusPercent + "%</span>";
        } else {
            bonusPercent = result.bonusPercent + "%";
        }
        
        var upperCaseStat = statsToDisplay[statIndex].toUpperCase();
        if (baseStats.includes(statsToDisplay[statIndex])) {
            var equipmentFlatStatBonus = Math.round((getEquipmentStatBonus(build, statsToDisplay[statIndex], false) - 1) * 100);
            if (equipmentFlatStatBonus > 0) {
                bonusTextElement.attr("title", `(${upperCaseStat} increase % - Equipped ${upperCaseStat} (DH) increase %) modifiers, capped individually.`);
                bonusPercent += "&nbsp;-&nbsp;";
                var cap = 300;
                if (build[0] && build[1] && weaponList.includes(build[0].type) && weaponList.includes(build[1].type)) {
                    cap = 100;
                }
                if (equipmentFlatStatBonus > cap) {
                    bonusPercent += "<span style='color:red;' title='Only " + cap + " taken into account'>" + equipmentFlatStatBonus + "%</span>";
                } else {
                    bonusPercent += equipmentFlatStatBonus + "%";
                }
            } else {
                bonusTextElement.attr("title", `${upperCaseStat} increase % modifier.`);
            }
        }
        $("#resultStats ." + escapeDot(statsToDisplay[statIndex]) + " .bonus").html(bonusPercent);
    }

    var pMitigation = 1;
    if (builds[currentUnitIndex].unit.mitigation && builds[currentUnitIndex].unit.mitigation.physical) {
        pMitigation = (1 - (builds[currentUnitIndex].unit.mitigation.physical / 100));
    }
    var mMitigation = 1;
    if (builds[currentUnitIndex].unit.mitigation && builds[currentUnitIndex].unit.mitigation.magical) {
        mMitigation = (1 - (builds[currentUnitIndex].unit.mitigation.magical / 100));
    }
    if (builds[currentUnitIndex].baseValues["mitigation"]) {
        pMitigation = pMitigation * (1 - (builds[currentUnitIndex].baseValues["mitigation"].global / 100)) * (1 - (builds[currentUnitIndex].baseValues["mitigation"].physical / 100));
        mMitigation = mMitigation * (1 - (builds[currentUnitIndex].baseValues["mitigation"].global / 100)) * (1 - (builds[currentUnitIndex].baseValues["mitigation"].magical / 100))
    }
    $("#resultStats .physicaleHp .value").html(Math.floor(values["def"] * values["hp"] / pMitigation));
    $("#resultStats .magicaleHp .value").html(Math.floor(values["spr"] * values["hp"] / mMitigation));
    $("#resultStats .mpRefresh .value").html(Math.floor(values["mp"] * calculateStatValue(build, "mpRefresh", builds[currentUnitIndex]).total / 100));
    $("#resultStats .lbPerTurn .value").html(calculateStatValue(build, "lbPerTurn", builds[currentUnitIndex]).total);
    var evoMagResult = calculateStatValue(build, "evoMag", builds[currentUnitIndex]).total;
    if (evoMagResult > 0) {
        $("#resultStats .evoMag").removeClass("hidden");
        $("#resultStats .evoMag .value").html(calculateStatValue(build, "evoMag", builds[currentUnitIndex]).total);    
    } else {
        $("#resultStats .evoMag").addClass("hidden");
    }
    
    for (var index in elementList) {
        $("#resultStats .resists .resist." + elementList[index] + " .value").text(calculateStatValue(build, "resist|" + elementList[index] + ".percent", builds[currentUnitIndex]).total + '%');
    }
    for (var index in ailmentList) {
        $("#resultStats .resists .resist." + ailmentList[index] + " .value").text(Math.min(100, calculateStatValue(build, "resist|" + ailmentList[index] + ".percent", builds[currentUnitIndex]).total) + '%');
    }
    if (builds[currentUnitIndex].goal == "physicaleHp" || builds[currentUnitIndex].goal == "magicaleHp") {
        $("#resultStats ." + builds[currentUnitIndex].goal).addClass("statToMaximize");
    }

    var importantStats = builds[currentUnitIndex].involvedStats;
    for (var index in importantStats) {
        $("#resultStats ." + escapeDot(importantStats[index])).addClass("statToMaximize");    
    }

    if (!value) {
        value = calculateBuildValueWithFormula(build, builds[currentUnitIndex], ennemyStats, builds[currentUnitIndex].formula, goalVariation, useNewJpDamageFormula, false);
    }
    
    var killers = [];
    for (var i = build.length; i--;) {
        if (build[i] && build[i].killers) {
            for (var j = 0; j < build[i].killers.length; j++) {
                addToKiller(killers, build[i].killers[j]);
            }
        }
    }
    var killersHtml = getKillerHtml(killers);
    
    $("#resultStats .killers .physical").html(killersHtml.physical);
    $("#resultStats .killers .magical").html(killersHtml.magical);
    
    var physicalDamageResult = 0;
    var magicalDamageResult = 0;
    var hybridDamageResult = 0;
    var healingResult = 0;
    
    $("#resultStats .physicalDamageResult").addClass("hidden");
    $("#resultStats .magicalDamageResult").addClass("hidden");
    $("#resultStats .hybridDamageResult").addClass("hidden");
    $("#resultStats .healingResult").addClass("hidden");
    $("#resultStats .buildResult").addClass("hidden");
    
    var formulaIsOneSkill = false;
    var skillName;
    if (builds[currentUnitIndex].formula.type == "skill") {
        formulaIsOneSkill = true;
        skillName = builds[currentUnitIndex].formula.name;
    } else if (builds[currentUnitIndex].formula.type == "condition" && builds[currentUnitIndex].formula.formula.type == "skill") {
        formulaIsOneSkill = true;
        skillName = builds[currentUnitIndex].formula.formula.name;
    }
    
    if (!formulaIsOneSkill) {
        if (importantStats.includes("atk")) {
            $("#resultStats .physicalDamageResult").removeClass("hidden");
            physicalDamageResult = calculateBuildValueWithFormula(build, builds[currentUnitIndex], ennemyStats, formulaByGoal["physicalDamage"], goalVariation, useNewJpDamageFormula, false);
            $("#resultStats .physicalDamageResult .calcValue").html(getValueWithVariationHtml(physicalDamageResult));
        }
        if (importantStats.includes("mag")) {
            $("#resultStats .magicalDamageResult").removeClass("hidden");
            magicalDamageResult = calculateBuildValueWithFormula(build, builds[currentUnitIndex], ennemyStats, formulaByGoal["magicalDamage"], goalVariation, useNewJpDamageFormula, false);
            $("#resultStats .magicalDamageResult .calcValue").html(getValueWithVariationHtml(magicalDamageResult));
        }
        if (importantStats.includes("atk") && importantStats.includes("mag")) {
            $("#resultStats .hybridDamageResult").removeClass("hidden");
            hybridDamageResult = calculateBuildValueWithFormula(build, builds[currentUnitIndex], ennemyStats, formulaByGoal["hybridDamage"], goalVariation, useNewJpDamageFormula, false);
            $("#resultStats .hybridDamageResult .calcValue").html(getValueWithVariationHtml(hybridDamageResult));
        }
        if (importantStats.includes("mag") && importantStats.includes("spr")) {
            $("#resultStats .healingResult").removeClass("hidden");
            healingResult = calculateBuildValueWithFormula(build, builds[currentUnitIndex], ennemyStats, formulaByGoal["heal"], goalVariation, useNewJpDamageFormula, false);
            $("#resultStats .healingResult .calcValue").html(getValueWithVariationHtml(healingResult));
        }
    }
    if (formulaIsOneSkill || (value[goalVariation] != physicalDamageResult[goalVariation] && value[goalVariation] != magicalDamageResult[goalVariation] && value[goalVariation] != hybridDamageResult[goalVariation] && value[goalVariation] != healingResult[goalVariation])) {
        $("#resultStats .buildResult").removeClass("hidden");
        $("#resultStats .buildResult .calcValue").html(getValueWithVariationHtml(value));
        if (formulaIsOneSkill) {
            $("#resultStats .buildResult .resultLabel").text(skillName + ": ");
        } else {
            $("#resultStats .buildResult .resultLabel").text("Build goal calculated value: ");
        }
        
        $("#resultStats .physicalDamageResult").addClass("secondary");
        $("#resultStats .magicalDamageResult").addClass("secondary");
        $("#resultStats .hybridDamageResult").addClass("secondary");
        $("#resultStats .healingResult").addClass("secondary");
    } else {
        $("#resultStats .physicalDamageResult").removeClass("secondary");
        $("#resultStats .magicalDamageResult").removeClass("secondary");
        $("#resultStats .hybridDamageResult").removeClass("secondary");
        $("#resultStats .healingResult").removeClass("secondary");
    }
    $("#resultStats .monsterDefValue").text(" " + ennemyStats.def);
    $("#resultStats .monsterSprValue").text(" " + ennemyStats.spr);
    $("#resultStats .damageCoef").html("1x");
}

function getValueWithVariationHtml(value) {
    var valueString = "";
    if (value.min == value.max) {
        var valueToDisplay = value[goalVariation];
        if (valueToDisplay < 100) {
            valueToDisplay = Math.floor(valueToDisplay*10)/10;
        } else {
            valueToDisplay = Math.floor(valueToDisplay);
        }
        valueString = '<span class="goal">' + valueToDisplay + '</span>';
    } else {
        valueString = '<span class="min ' + ((goalVariation == "min") ? "goal":"")  + '">' + Math.floor(value.min) + "</span> - " +
            '<span class="avg ' + ((goalVariation == "avg") ? "goal":"")  + '">' + Math.floor(value.avg) + "</span> - " +
            '<span class="max ' + ((goalVariation == "max") ? "goal":"")  + '">' + Math.floor(value.max) + "</span>";
    }
    return valueString;
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
    
    
    var item = builds[currentUnitIndex].build[index];
    if (!item && builds[currentUnitIndex].fixedItems[index]) {
        item = builds[currentUnitIndex].fixedItems[index];    
    }
    
    if (item && item.type == "unavailable") {
        return "";
    }
    
    if (index >= 0 && builds[currentUnitIndex].fixedItems[index]) {
        html += '<div class="td actions"><img class="pin fixed" title="Unpin this item" onclick="removeFixedItemAt(\'' + index +'\')" src="img/icons/pinned.png"></img><img title="Remove this item" class="delete" onclick="removeItemAt(\'' + index +'\')" src="img/icons/delete.png"></img>';
        if (weaponList.includes(item.type)) {
            html += '<img class="itemEnchantmentButton" title="Modify this weapon enchantment" src="img/icons/dwarf.png" onclick="currentItemSlot = ' + index + ';selectEnchantement(getRawItemForEnhancements(builds[currentUnitIndex].fixedItems[' + index + ']))" />';
        }
        html += '</div>';
    } else if (!item) {
        html += '<div class="td actions"></div><div class="td type slot" onclick="displayFixItemModal(' + index + ');">'+ getSlotIcon(index) + '</div><div class="td name slot">'+ getSlotName(index) + '</div>'
    } else if (!item.placeHolder) {
        var enhancementText = item.enhancements ? JSON.stringify(item.enhancements).replace(/\"/g, "'") : false;
        html += `<div class="td actions"><img title="Pin this item" class="pin notFixed" onclick="fixItem('${item.id}', ${index}, ${enhancementText});" src="img/icons/pin.png"></img><img title="Remove this item" class="delete" onclick="removeItemAt('${index}')" src="img/icons/delete.png"></img>`;
        html += '<span title="Exclude this item from builds" class="excludeItem glyphicon glyphicon-ban-circle" onclick="excludeItem(\'' + item.id +'\')" />';
        if (weaponList.includes(item.type)) {
            html += '<img class="itemEnchantmentButton" title="Modify this weapon enchantment" src="img/icons/dwarf.png" onclick="currentItemSlot = ' + index + ';selectEnchantement(getRawItemForEnhancements(builds[currentUnitIndex].build[' + index + ']))" />';
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
        if (!item.placeHolder && index < 10 && dataStorage.onlyUseOwnedItems) {
            var alreadyUsed = 0;
            if (dataStorage.alreadyUsedItems[item.id]) {
                alreadyUsed = dataStorage.alreadyUsedItems[item.id];
            }
            alreadyUsed += getNumberOfItemAlreadyUsedInThisBuild(builds[currentUnitIndex], index, item);
            var ownNumber = dataStorage.getOwnedNumber(item);
            if (ownNumber.totalOwnedNumber <= alreadyUsed && ownNumber.total > alreadyUsed) {
                if (item.tmrUnit) {
                    html += '<div class="td"><span class="glyphicon glyphicon-screenshot" title="TMR you may want to farm. TMR of ' + units[item.tmrUnit].name + '"/></div>'
                } else if (item.access.includes("trial")) {
                    html += '<div class="td"><span class="glyphicon glyphicon-screenshot" title="Trial reward"/></div>'
                }
            }
        }
    }
    return html;
}

function getNumberOfItemAlreadyUsedInThisBuild(unitBuild, index, item) {
    var number = 0;
    for (var previousItemIndex = 0; previousItemIndex < index; previousItemIndex++) {
        if (unitBuild.build[previousItemIndex] && !unitBuild.fixedItems[previousItemIndex] && unitBuild.build[previousItemIndex].id && unitBuild.build[previousItemIndex].id == item.id) {
            number++;
        }
        
    }
    return number;
}

function getSlotIcon(index) {
    var icon = '<i class="img img-slot-';
    switch(index) {
        case 0:
            icon += "hand";
            break;
        case 1:
            icon += "hand leftHand";
            break;
        case 2:
            icon += "head";
            break;
        case 3:
            icon += "body";
            break;
        case 4:
        case 5:
            icon += "accessory";
            break;
        case 6:
        case 7:
        case 8:
        case 9:
            icon += "materia";
            break;
        case 10:
            icon += "esper";
            break;
    }
    icon += ' icon"></i>';
    return icon;
}

function getSlotName(index) {
    switch(index) {
        case 0:
            return "Right hand";
        case 1:
            return "Left hand";
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
    var item = builds[currentUnitIndex].build[index];
    $("#buildResult .buildLine_" + index).toggleClass("enhanced", !!((item && item.enhancements)));
}

// Populate the unit html select with a line per unit
function populateUnitSelect() {
    var options = '<option value=""></option>';
    Object.keys(units).sort(function(id1, id2) {
        return units[id1].name.localeCompare(units[id2].name);
    }).forEach(function(value, index) {
        options += '<option value="'+ value + '">' + units[value].name + (units[value]["6_form"] ? ' ' + units[value].max_rarity + '★ ' : "") +  (units[value].unreleased7Star ? ' - JP data' : "") + '</option>';
        if (units[value]["6_form"]) {
            options += '<option value="'+ value + '-6">' + units[value]["6_form"].name + ' 6★</option>';
        }
    });
    $("#unitsSelect").html(options);
    $("#unitsSelect").change(onUnitChange);
    $('#unitsSelect').select2({
        placeholder: 'Select a unit...',
        theme: 'bootstrap'
    });
}

function selectUnitDropdownWithoutNotify(unitId) {
    // Set value, then trigger change by notifying only Select2 with its scoped event
    // Avoid triggering our own change event
    $('#unitsSelect').val(unitId).trigger('change.select2');
}

function onUnitChange() {
    $("#unitsSelect").find(':selected').each(function() {
        var unitId = $(this).val();
        var selectedUnitData;
        if (unitId.endsWith("-6")) {
            selectedUnitData = units[unitId.substr(0,unitId.length-2)]["6_form"];
        } else {
            selectedUnitData = units[unitId];    
        }
        if (selectedUnitData) {
            $("#unitTabs .tab_" + currentUnitIndex + " a").html("<img src=\"img/units/unit_icon_" + selectedUnitData.id + ".png\"/>" + selectedUnitData.name);
            var sameUnit = (builds[currentUnitIndex].unit && builds[currentUnitIndex].unit.id == selectedUnitData.id && builds[currentUnitIndex].unit.max_rarity == selectedUnitData.max_rarity);
            var oldValues = builds[currentUnitIndex].baseValues;
            var oldLevel = builds[currentUnitIndex]._level;
            
            reinitBuild(currentUnitIndex);
            var unitData = selectedUnitData;
            if (unitData.enhancements) {
                unitData = JSON.parse(JSON.stringify(unitData));
                unitData.enhancementLevels = [];
                for (var i = unitData.enhancements.length; i--;) {
                    var enhancementLevel = unitData.enhancements[i].levels.length - 1;
                    if (sameUnit) {
                        enhancementLevel = $("#enhancement_" + i).val();
                    }
                    unitData.skills = unitData.skills.concat(unitData.enhancements[i].levels[enhancementLevel]);
                    unitData.enhancementLevels[i] = enhancementLevel;
                }
            }
            builds[currentUnitIndex].setUnit(unitData);
            if(sameUnit) {
                builds[currentUnitIndex].baseValues = oldValues;
                builds[currentUnitIndex].setLevel(oldLevel);
            }
            updateUnitLevelDisplay();
            updateUnitStats();
            dataStorage.setUnitBuild(builds[currentUnitIndex]);
            $("#help").addClass("hidden");
            if (unitData.materiaSlots ||  unitData.materiaSlots == 0) {
                for (var i = 4 - unitData.materiaSlots; i --;) {
                    fixItem("unavailable", 9 - i);
                }
            }
            
            $(".panel.unit").removeClass("hidden");
            $(".panel.goal .goalLine").removeClass("hidden");
            $(".panel.unit .unitIcon").prop("src", "img/units/unit_icon_" + selectedUnitData.id + ".png");
            
            
            var choiceSelect = $("#normalGoalChoice");
            var selectedChoice = choiceSelect.val();
            choiceSelect.empty();
            
            var unitWithSkills = unitsWithSkills[unitData.id];
            var formula = formulaFromSkill(unitWithSkills.lb);
            if (formula) {
                var option = '<option value=' + '"SKILL_' + unitWithSkills.lb.name + '" ' + (formula.notSupported ? "disabled":"") + '>LB - ' + unitWithSkills.lb.name + (formula.notSupported ? " - Not supported yet":"") + '</option>'
                choiceSelect.append(option);
            }
            for (var skillIndex = unitWithSkills.actives.length; skillIndex--;) {
                var formula = formulaFromSkill(unitWithSkills.actives[skillIndex]);
                if (formula) {
                    var option = '<option value=' + '"SKILL_' + unitWithSkills.actives[skillIndex].name + '" ' + (formula.notSupported ? "disabled":"") + '>' + unitWithSkills.actives[skillIndex].name + (formula.notSupported ? " - Not supported yet":"") + '</option>'
                    choiceSelect.append(option);
                }
            }
            for (var skillIndex = unitWithSkills.magics.length; skillIndex--;) {
                var formula = formulaFromSkill(unitWithSkills.magics[skillIndex]);
                if (formula) {
                    var option = '<option value=' + '"SKILL_' + unitWithSkills.magics[skillIndex].name + '" ' + (formula.notSupported ? "disabled":"") + '>' + unitWithSkills.magics[skillIndex].name + (formula.notSupported ? " - Not supported yet":"") + '</option>'
                    choiceSelect.append(option);
                }
            }
            
            
            for (var selectDefaultIndex = 0, lenSelectDefaultIndex = goalQuickSelectDefaultValues.length; selectDefaultIndex < lenSelectDefaultIndex; selectDefaultIndex++) {
                choiceSelect.append($("<option></option>").attr("value", goalQuickSelectDefaultValues[selectDefaultIndex][0]).text(goalQuickSelectDefaultValues[selectDefaultIndex][1]));
            }
            if (selectedChoice.startsWith("SKILL_")) {
                choiceSelect.val("physicalDamage");
            } else {
                choiceSelect.val(selectedChoice);    
            }
            
        
            recalculateApplicableSkills();
            logCurrentBuild();
            
            if (itemInventory) {
                $("#saveTeamButton").removeClass("hidden");
            }
        } else {
            builds[currentUnitIndex].setUnit(null);
            reinitBuild(currentUnitIndex); 
            updateUnitStats();
            $(".panel.unit").addClass("hidden");
            $(".panel.goal .goalLine").addClass("hidden");
        }
        displayUnitRarity(selectedUnitData);
        displayUnitEnhancements();
    });
}

function updateUnitLevelDisplay() {
    if (builds[currentUnitIndex].unit && builds[currentUnitIndex].unit.max_rarity == 7 && !builds[currentUnitIndex].unit.sixStarForm) {
        $("#unitLevel").removeClass("hidden");
        if (builds[currentUnitIndex]._level) {
            $("#unitLevel select").val(builds[currentUnitIndex]._level.toString());
        } else {
            $("#unitLevel select").val("120");
            builds[currentUnitIndex].setLevel(120);    
        }
    } else {
        $("#unitLevel").addClass("hidden");
    }
}

function displayUnitEnhancements() {
    $('#unitEnhancements').empty();
    
    if (builds[currentUnitIndex].unit && builds[currentUnitIndex].unit.enhancements) {
        var html = "";
        for (var i = 0, len = builds[currentUnitIndex].unit.enhancements.length; i < len; i++) {
            var enhancement = builds[currentUnitIndex].unit.enhancements[i];
            html += '<div class="col-xs-6 unitEnhancement"><select class="form-control" onchange="onUnitChange();" id="enhancement_' + i + '">';
            for (var j = 0, lenJ = enhancement.levels.length; j < lenJ; j++) {
                html += '<option value="'+ j + '"';
                if (builds[currentUnitIndex].unit.enhancementLevels[i] == j) {
                    html += " selected";
                }
                if (enhancement.levels.length == 2 && enhancement.levels[0].length == 0) {
                    // unlocked skills
                    if (j == 0) {
                        html += '>' + enhancement.name + ' not unlocked</option>';
                    } else {
                        html += '>' + enhancement.name + ' unlocked</option>';
                    }
                } else {
                    html += '>' + enhancement.name + ' +' + j + '</option>';    
                }
            }
            html += '</select></div>';
        }
        $('#unitEnhancements').html(html);
    }
}

function updateUnitStats() {
    $(baseStats).each(function (index, stat) {
        if (builds[currentUnitIndex].unit) {
            $(".unitStats .stat." + stat + " .baseStat input").val(builds[currentUnitIndex].getStat(stat));
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
    if (builds[currentUnitIndex].unit && builds[currentUnitIndex].baseValues["lbFillRate"]) {
        $(".unitStats .stat.lbFillRate .buff input").val(builds[currentUnitIndex].baseValues["lbFillRate"].buff);
        $(".unitStats .stat.lbShardsPerTurn .buff input").val(builds[currentUnitIndex].baseValues["lbFillRate"].total);
    } else {
        $(".unitStats .stat.lbFillRate .buff input").val("");
        $(".unitStats .stat.lbShardsPerTurn .buff input").val("");
    }
    if (builds[currentUnitIndex].unit && builds[currentUnitIndex].baseValues["mitigation"]) {
        $(".unitStats .stat.pMitigation .buff input").val(builds[currentUnitIndex].baseValues["mitigation"].physical);
        $(".unitStats .stat.mMitigation .buff input").val(builds[currentUnitIndex].baseValues["mitigation"].magical);
        $(".unitStats .stat.mitigation .buff input").val(builds[currentUnitIndex].baseValues["mitigation"].global);
    } else {
        $(".unitStats .stat.pMitigation .buff input").val("");
        $(".unitStats .stat.mMitigation .buff input").val("");
        $(".unitStats .stat.mitigation .buff input").val("");
    }
    populateUnitEquip();
    if (builds[currentUnitIndex].unit) {
        for (var index in builds[currentUnitIndex].unit.equip) {
            $(".unitEquipable i.img-equipment-" + builds[currentUnitIndex].unit.equip[index]).removeClass("notEquipable");
        }
    }
    if (builds[currentUnitIndex].unit) {
        $("#pleaseSelectUnitMessage").addClass("hidden");
        $("#buildDiv").removeClass("hidden");
        $(".buildDiv").removeClass("hidden");
        $("#resultStats").removeClass("hidden");
        $(".buildLinks").removeClass("hidden");
        $("#buildResult").removeClass("hidden");
        
        $("#unitLink").prop("href",toUrl((builds[currentUnitIndex].unit.wikiEntry ? builds[currentUnitIndex].unit.wikiEntry : builds[currentUnitIndex].unit.name)));
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

    selectUnitDropdownWithoutNotify(build.unit ? (build.unit.id + (build.unit.sixStarForm ? '-6' : '')) : null);

    $(".unitAttackElement div.elements label").removeClass("active");
    if (build.innateElements) {
        for (var i in build.innateElements) {
            $(".unitAttackElement div.elements label:has(input[value=" + build.innateElements[i] + "])").addClass("active");
        }
    }
    
    $(".goal #normalGoalChoice option").prop("selected", false);
    if (build.goal) {
        if (build.goal == "custom") {
            customFormula = build._formula;
        } else {
            customFormula = null;
            $('.goal #normalGoalChoice option[value="' + build.goal + '"]').prop("selected", true);
        }
    }
    
    updateUnitLevelDisplay();
    updateUnitStats();
    displayUnitEnhancements();
    
    onGoalChange();
    
    
    if (builds[currentUnitIndex].unit) {
        logCurrentBuild();  
    }
}

function addNewUnit() {
    $("#unitTabs li").removeClass("active");
    let newId = builds.length;
    var newTab = $("<li class='active tab_" + newId + "'><a href='#'>Select unit</a><span class=\"closeTab glyphicon glyphicon-remove\" onclick=\"closeTab()\"></span></li>");
    $("#unitTabs .tab_" + (newId - 1)).after(newTab);
    newTab.click(function() {
        selectUnitTab(newId);
    })
    builds.push(null);
    reinitBuild(builds.length - 1);
    $('#forceDoublehand input').prop('checked', false);
    $('#forceDualWield input').prop('checked', false);
    $('#tryEquipSources input').prop('checked', false);
    loadBuild(builds.length - 1);
    if (builds.length > 9) {
        $("#addNewUnitButton").addClass("hidden");
    }
    selectUnitDropdownWithoutNotify(null);
    $('#unitsSelect').select2('open');
}

function selectUnitTab(index) {
    $("#unitTabs li").removeClass("active");
    $("#unitTabs .tab_" + index).addClass("active");
    loadBuild(index);
}

function closeTab(index = currentUnitIndex) {
    
    $("#unitTabs .tab_" + index).remove();
    for (var i = index + 1; i < builds.length; i++) {
        let newId = i-1;
        $("#unitTabs .tab_" + i).removeClass("tab_" + i).addClass("tab_" + newId).off('click').click(function() {
            selectUnitTab(newId);
        });
        
    }
    builds.splice(index, 1);
    if (index == currentUnitIndex) {
        currentUnitIndex--;
        selectUnitTab(currentUnitIndex);    
    } else if (index < currentUnitIndex) {
        currentUnitIndex--;
    }
    
    if (builds.length < 10) {
        $("#addNewUnitButton").removeClass("hidden");
    }
}

// Displays selected unit's rarity by stars
var displayUnitRarity = function(unit) {
    var rarityWrapper = $('.unit-rarity');
    if (unit) {
        var rarity = unit.max_rarity;

        rarityWrapper.show();
        rarityWrapper.empty();

        for (var i = 0; i < rarity; i++) {
            rarityWrapper.append('<i class="rarity-star"></i>');
        }
    } else {
        rarityWrapper.hide();
    }
};

function inventoryLoaded() {
    dataStorage.itemInventory = itemInventory;
    $(".equipments select option[value=owned]").prop("disabled", false);
    if (itemInventory.excludeFromExpeditions) {
        $(".equipments select option[value=ownedAvailableForExpedition]").prop("disabled", false);
    }
    if (!dataLoadedFromHash) {
        $(".equipments select").val("owned");
        onEquipmentsChange();
    }
    $("#savedTeamPanel").removeClass("hidden");
}

function notLoaded() {
}

function onGoalChange() {
    readGoal();
    if (builds[currentUnitIndex].unit) { 
        logCurrentBuild();
    }
    var goal = builds[currentUnitIndex].goal;
    $(".monster").addClass("hidden");
    $(".unitAttackElement").addClass("hidden");
    if (builds[currentUnitIndex].involvedStats.includes("physicalKiller") 
        || builds[currentUnitIndex].involvedStats.includes("magicalKiller")
        || builds[currentUnitIndex].involvedStats.includes("weaponElement")) {
        $(".monster").removeClass("hidden");
        $(".unitAttackElement").removeClass("hidden");
    }
    if (builds[currentUnitIndex].involvedStats.includes("weaponElement")) {
        $(".unitAttackElement").removeClass("hidden");
    }
    
    if (customFormula) {
        $('.normalGoalChoices').addClass("hidden");
        $('.customGoalChoice').removeClass("hidden");
        $("#customGoalFormula").text(formulaToString(customFormula));
    } else {
        $('.normalGoalChoices').removeClass("hidden");
        $('.customGoalChoice').addClass("hidden");
    }
}

function openCustomGoalModal() {
    $("#customFormulaModal").modal();
}

function chooseCustomFormula() {
    var formulaString = $("#customFormulaModal #formulaInput").val();
    var formulaConditionString = $("#customFormulaModal #formulaConditionInput").val();
    if (formulaConditionString && formulaConditionString.length > 0) {
        formulaString += ";" + formulaConditionString;
    }
    var formula = parseFormula(formulaString, unitsWithSkills[builds[currentUnitIndex].unit.id]);
    if (formula) {
        customFormula = formula;
        builds[currentUnitIndex].goal = "custom";
        $('#customFormulaModal').modal('hide');
        onGoalChange();
    }
}

function addToCustomFormula(string) {
    $("#customFormulaModal #formulaInput").val($("#customFormulaModal #formulaInput").val() + string);
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
        $("#excludeSTMR").parent().removeClass("hidden");
        $("#includeTMROfOwnedUnits").parent().addClass("hidden");
        $("#includeTrialRewards").parent().addClass("hidden");
        $("#includeChocoboItems").parent().addClass("hidden");
        $("#includeEasilyObtainableItems").parent().addClass("hidden");
        dataStorage.onlyUseOwnedItems = false;
        dataStorage.onlyUseShopRecipeItems = false;
    } else if (equipments == "owned" || equipments == "ownedAvailableForExpedition") {
        $("#exludeEvent").parent().addClass("hidden");
        $("#excludePremium").parent().addClass("hidden");
        $("#excludeTMR5").parent().addClass("hidden");
        $("#excludeNotReleasedYet").parent().addClass("hidden");
        $("#excludeSTMR").parent().addClass("hidden");
        if (ownedUnits && Object.keys(ownedUnits).length > 0) {
            $("#includeTMROfOwnedUnits").parent().removeClass("hidden");
        } else {
            $("#includeTMROfOwnedUnits").parent().addClass("hidden");
        }
        $("#includeTrialRewards").parent().removeClass("hidden");
        $("#includeChocoboItems").parent().removeClass("hidden");
        $("#includeEasilyObtainableItems").parent().removeClass("hidden");
        dataStorage.onlyUseOwnedItems = true;
        dataStorage.onlyUseShopRecipeItems = false;
        if (equipments == "ownedAvailableForExpedition") {
            dataStorage.onlyUseOwnedItemsAvailableForExpeditions = true;
        } else {
            dataStorage.onlyUseOwnedItemsAvailableForExpeditions = false;
        }
    } else {
        $("#exludeEvent").parent().addClass("hidden");
        $("#excludePremium").parent().addClass("hidden");
        $("#excludeTMR5").parent().addClass("hidden");
        $("#excludeNotReleasedYet").parent().addClass("hidden");
        $("#excludeSTMR").parent().addClass("hidden");
        $("#includeTMROfOwnedUnits").parent().addClass("hidden");
        $("#includeTrialRewards").parent().addClass("hidden");
        $("#includeChocoboItems").parent().addClass("hidden");
        $("#includeEasilyObtainableItems").parent().addClass("hidden");
        dataStorage.onlyUseOwnedItems = false;
        dataStorage.onlyUseShopRecipeItems = true;
    }
    updateEspers();
}
     
function updateSearchResult() {
    $("#fixItemModal").removeClass("showEnhancements");
    var searchText = $("#searchText").val();
    if ((searchText == null || searchText == "") && searchType.length == 0 && searchStat == "") {
        $("#fixItemModal .results .tbody").html("");    
        return;
    }
    var types = searchType;
    if (searchType.length == 0) {
        types = builds[currentUnitIndex].getCurrentUnitEquip().concat("esper");
    }
    var baseStat = 0;
    if (baseStats.includes(searchStat)) {
        baseStat = builds[currentUnitIndex].baseValues[searchStat].total;
    }
    accessToRemove = [];
    
    var dataWithOnlyOneOccurence = searchableEspers.slice();
    for (var index = 0, len = dataStorage.data.length; index < len; index++) {
        var item = dataStorage.data[index];
        
        if (!isApplicable(item, builds[currentUnitIndex].unit)) {
            // Don't display not applicable items
            continue;
        }
        if (dataWithOnlyOneOccurence.length > 0 && dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1].id == item.id) {
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
    readItemsExcludeInclude();
    displaySearchResults(sort(filter(dataWithOnlyOneOccurence, false, searchStat, baseStat, searchText, builds[currentUnitIndex].unit.id, types, [], [], [], [], [], "", !dataStorage.excludeNotReleasedYet, true)));
    
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

function displayEquipableItemList() {
    if (!builds[currentUnitIndex].unit) {
        Modal.showMessage("No unit selected", "Please select an unit");
        return;
    }
    
    builds[currentUnitIndex].prepareEquipable();

    types = [];
    for(var index = 0; index < 10; ++index) {
        var equipableSlot = builds[currentUnitIndex].equipable[index];
        if (equipableSlot.length == 0) {
            continue;
        }
        
        dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
        for(var i = 0; i < equipableSlot.length; ++i) {
            if(!types.includes(equipableSlot[i])) {
                types.push(equipableSlot[i]);
            }
        }
    }

    $("#searchText").val("");
    $("#fixItemModal .results .tbody").html("");
    
    $("#fixItemModal").modal();
    populateItemType(types);
    selectSearchType(types);
    selectSearchStat(searchStat);
    selectSearchClickBehavior(ClickBehaviors.EXCLUDE);
    updateSearchResult();
}

function displayFixItemModal(index) {
    if (!builds[currentUnitIndex].unit) {
        Modal.showMessage("No unit selected", "Please select an unit");
        return;
    }
    
    builds[currentUnitIndex].prepareEquipable();
    if (builds[currentUnitIndex].equipable[index].length == 0) {
        Modal.showMessage("Equipment error", "Nothing can be added at this slot");
        return;
    }
    currentItemSlot = index;
    
    populateItemType(builds[currentUnitIndex].equipable[index]);
    
    dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
    $("#searchText").val("");
    $("#fixItemModal .results .tbody").html("");
    
    $("#fixItemModal").modal();
    selectSearchStat(searchStat);
    selectSearchType(builds[currentUnitIndex].equipable[index]);
    selectSearchClickBehavior(ClickBehaviors.EQUIP);
    updateSearchResult();
}

function fixItem(key, slotParam = -1, enhancements, pinItem = true) {
    var item;
    if (typeof key === 'object') {
        item = key;
    } else {
        if (typeList.includes(key)) {
            item = getPlaceHolder(key);
        } else if (espersByName[key])  {
            item = espersByName[key]; 
        } else if (key == "unavailable") {
            item = {"name":"Unavailable slot", "type":"unavailable", "placeHolder":true};
        } else {
            item = findBestItemVersion(builds[currentUnitIndex].build, dataStorage.allItemVersions[key][0], dataStorage.itemWithVariation, builds[currentUnitIndex].unit);
            if (enhancements) {
                item = applyEnhancements(item, enhancements);
            }
        }
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
                    Modal.showMessage("No more slot available", "No more slot available for this item. Select another item or remove fixed item of the same type.");
                    return;
                }
            } else {
                if (item.type != "unavailable") {
                    Modal.showMessage("No more slot available", "No more slot available for this item. Select another item or remove a pinned item of the same type.");
                }
                return;
            }
        }
        if (isTwoHanded(item) && builds[currentUnitIndex].build[1 - slot]) {
            Modal.showMessage("Equipment error", "Trying to equip a two-handed weapon when another weapon is already equiped is not possible");
            return;
        }
        if (!isStackable(item)) {
            for(var index = 6; index < 10; index++) {
                if (index != slot && builds[currentUnitIndex].build[index]&& builds[currentUnitIndex].build[index].id == item.id) {
                    Modal.showMessage("Materia error", "This materia is not stackable. You cannot add another one");
                    return;
                }
            }
        }
        if (builds[currentUnitIndex].build[slot] && builds[currentUnitIndex].build[slot].id != item.id) {
            removeItemAt(slot);
        }
        
        if (pinItem) {
            builds[currentUnitIndex].fixedItems[slot] = item;
        } else {
            builds[currentUnitIndex].fixedItems[slot] = null;
        }
        builds[currentUnitIndex].build[slot] = item;
        if (slot < 10) {
            for (var index = 0; index < 10; index++) {
                if (index != slot) {
                    var itemTmp = builds[currentUnitIndex].build[index];
                    if (itemTmp  && !itemTmp.placeHolder && index != slot) {
                        var bestItemVersion = findBestItemVersion(builds[currentUnitIndex].build, itemTmp, dataStorage.itemWithVariation, builds[currentUnitIndex].unit);
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
    $('#modifyEnhancementModal').modal('hide');
}

function removeFixedItemAt(slot) {
    builds[currentUnitIndex].fixedItems[slot] = null;
    var equip = builds[currentUnitIndex].getCurrentUnitEquip();
    for (var index = 0; index < 10; index++) {
        var item = builds[currentUnitIndex].fixedItems[index];
        if (item && !item.placeHolder) {
            if (!equip.includes(item.type)) {
                removeFixedItemAt(index);
            } else {
                builds[currentUnitIndex].fixedItems[index] = findBestItemVersion(builds[currentUnitIndex].fixedItems, item, dataStorage.itemWithVariation, builds[currentUnitIndex].unit);
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
                var bestItemVersion = findBestItemVersion(builds[currentUnitIndex].build, item, dataStorage.itemWithVariation, builds[currentUnitIndex].unit);
                builds[currentUnitIndex].build[index] = bestItemVersion;
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
        for (var index = 0; index < 11; index++) {
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
        if (areConditionOK(skill, builds[currentUnitIndex].build, builds[currentUnitIndex]._level)) {
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
    // Remove any img-sort-* class
    $("#fixItemModal .modal-header .stat .dropdown-toggle").attr('class', function(i, c){
        return c.replace(/(^|\s)img-sort-\S+/g, '');
    });

    if (!stat) {
        searchStat = "";
        $("#fixItemModal .modal-header .stat .dropdown-toggle").addClass("img-sort-a-z");
    } else {
        searchStat = stat;
        $("#fixItemModal .modal-header .stat .dropdown-toggle").addClass("img-sort-" + stat);
    }
}

function selectSearchClickBehavior(desiredBehavior) {
    searchClickBehavior = desiredBehavior;
}

var displaySearchResults = function(items) {
    if (itemInventory) {
        $("#fixItemModal").removeClass("notLoggedIn");
    } else {
        $("#fixItemModal").addClass("notLoggedIn");
    }
    var div = $("#fixItemModal .results .tbody");
    div.empty();
    displaySearchResultsAsync(items, 0, div);
    
}

function toggleExclusionFromSearch(itemId) {
    if(itemsToExclude.includes(itemId)) {
        removeItemFromExcludeList(itemId);
    } else {
        excludeItem(itemId);
    }
    
    toggleExclusionIcon(itemId);
}

function displaySearchResultsAsync(items, start, div) {
    var end = Math.max(items.length, start + 20);
    var html = "";
    for (var index = start; index < end; index++) {
        var item = items[index];
        if (item) {
            var enhancementString = "null";
            if (item.enhancements) {
                enhancementString = JSON.stringify(item.enhancements).split('"').join("'");
            }
            html += '<div class="tr selectable item';
            if (item.enhancements || itemInventory && itemInventory.enchantments && itemInventory.enchantments[item.id]) {
                html += " enhanced";
            }
            
            var excluded = itemsToExclude.includes(item.id);

            if(searchClickBehavior == ClickBehaviors.IGNORE) {
                html += '" >';
            } else if (searchClickBehavior == ClickBehaviors.EXCLUDE) {
                html += '" onclick="toggleExclusionFromSearch(\'' + item.id + '\');">';
            } else {
                html += '" onclick="fixItem(\'' + item.id + '\', ' + currentItemSlot + ', ' + enhancementString + ')">';
            }

            html += "<div class='td exclude'>";
            html += getItemExclusionLink(item.id, excluded);
            html += "</div>";

            html += displayItemLine(item);
            
            if (searchClickBehavior != ClickBehaviors.EXCLUDE) {
                html+= "<div class='td enchantment desktop'>";
                html+= getItemEnhancementLink(item);
                html+= "</div>";
            }

            if (itemInventory) {
                var notEnoughClass = "";
                var numbers = dataStorage.getOwnedNumber(item);
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
                html+= "<div class='td inventory desktop text-center'><span class='badge" + notEnoughClass + "'>" + owned + "</span></div>";
                
                html+= '<div class="td mobile" onclick="event.stopPropagation();"><div class="menu">';
                html+=      '<span class="dropdown-toggle glyphicon glyphicon-option-vertical" data-toggle="dropdown" onclick="$(this).parent().toggleClass(\'open\');"></span>'
                html+=      '<ul class="dropdown-menu pull-right">';
                html+=          '<li>' + getAccessHtml(item) + '</li>';               
                html+=          '<li>' + getItemEnhancementLink(item) + '</li>';                
                html+=          '<li class="inventory"><span class="badge' + notEnoughClass + '">' + owned + '</span></li>';
                html+=      '</ul>';
                html+= '</div></div>';
            } else {
                html+= "<div class='td enchantment'/><div class='td inventory'/>"
            }
            html += "</div>";
        }
    }
    div.append(html);
    if (end < items.length) {
        setTimeout(displaySearchResultsAsync, 0, items, end, div);
    }
}

function getItemEnhancementLink(item) {
    var html = "";
    
    if (weaponList.includes(item.type)) {
        html += '<div class="enchantment"><img src="img/icons/dwarf.png" onclick="event.stopPropagation();selectEnchantedItem(\'' + item.id + '\')">';
        if (itemInventory && itemInventory.enchantments && itemInventory.enchantments[item.id]) {
            html += "<span class='badge'>" + itemInventory.enchantments[item.id].length + "</span>"
        }
        html += "</div>"
    }

    return html;
}

function getItemExclusionLink(itemId, excluded) {
    var html = "";
    html += '<span title="Exclude this item from builds" class="miniIcon left excludeItem glyphicon glyphicon-ban-circle false itemid' + itemId + '" style="' + (excluded ? 'display: none;' : '') + '" onclick="event.stopPropagation(); toggleExclusionFromSearch(\'' + itemId + '\');"></span>';
    html += '<span title="Include this item in builds again" class="miniIcon left excludeItem glyphicon glyphicon-ban-circle true itemid' + itemId + '" style="' + (!excluded ? 'display: none;' : '') + '" onclick="event.stopPropagation(); toggleExclusionFromSearch(\'' + itemId + '\');"></span>';
    return html;
}

function toggleExclusionIcon(itemId) {
    var excluded = itemsToExclude.includes(itemId);
    $('.excludeItem.glyphicon-ban-circle.' + !excluded + '.itemid' + itemId).css('display', 'none');
    $('.excludeItem.glyphicon-ban-circle.' + excluded + '.itemid' + itemId).css('display', 'inline');
}

function selectEnchantedItem(itemId) {
    var item = null;
    for (var i = 0, len = dataStorage.data.length; i < len; i++) {
        if (dataStorage.data[i].id == itemId) {
            item = dataStorage.data[i];
            break;
        }
    }
    if (item) {
        if (itemInventory && itemInventory.enchantments && itemInventory.enchantments[itemId]) {
            var enhancedItems = [];
            if (itemInventory[itemId] > itemInventory.enchantments[itemId].length) {
                enhancedItems.push(item);
            }
            for (var i = 0, len = itemInventory.enchantments[itemId].length; i < len; i++) {
                enhancedItems.push(applyEnhancements(item, itemInventory.enchantments[itemId][i]));
            }
            $("#fixItemModal").addClass("showEnhancements");
            displaySearchResults(enhancedItems);
            currentEnchantmentItem = JSON.parse(JSON.stringify(item));
        } else {
            selectEnchantement(item);
        }
    }
}

function getRawItemForEnhancements(item) {
    if (item.enhancements) {
        for (var i = dataStorage.data.length; i--;) {
            if (dataStorage.data[i].id == item.id) {
                var rawItem = JSON.parse(JSON.stringify(dataStorage.data[i]));
                rawItem.enhancements = item.enhancements;
                return rawItem;
            }
        }
    } else {
        return item;
    }
}

function selectEnchantement(item) {
    if (item) {
        currentEnchantmentItem = JSON.parse(JSON.stringify(item));
    }
    if (!currentEnchantmentItem.enhancements) {
        currentEnchantmentItem.enhancements = [];
    }
    var popupAlreadyDisplayed = ($("#modifyEnhancementModal").data('bs.modal') || {}).isShown
    if (!popupAlreadyDisplayed) {
        $("#modifyEnhancementModal").modal();
    }
    $("#modifyEnhancementModal .value").removeClass("selected");
    for (var i = currentEnchantmentItem.enhancements.length; i--;) {
        $("#modifyEnhancementModal .value." + currentEnchantmentItem.enhancements[i]).addClass("selected");
    }
    $("#modifyEnhancementModal .modal-header .title").html(getImageHtml(currentEnchantmentItem) + getNameColumnHtml(currentEnchantmentItem));
    $("#modifyEnhancementModal .value.rare").html(itemEnhancementLabels["rare"][currentEnchantmentItem.type]);
}

function toggleItemEnhancement(enhancement) {
    var enhancements = currentEnchantmentItem.enhancements;
    if (enhancements.includes(enhancement)) {
        enhancements.splice(enhancements.indexOf(enhancement), 1);
    } else {
        if (enhancements.length == 3) {
            $.notify("No more than 3 item enhancements can be selected", "warning");
            return;   
        }
        enhancements.push(enhancement);
    }
    selectEnchantement(currentEnchantmentItem);
}

function pinChosenEnchantment() {
    fixItem(applyEnhancements(currentEnchantmentItem, currentEnchantmentItem.enhancements), currentItemSlot);
}

function getStateHash(onlyCurrent = true) {
    var min = 0;
    var num = builds.length;
    if (onlyCurrent) {
        min = currentUnitIndex;
        num = 1;
    }
    var data = {
        "version": 2,
        "units": []
    };
    for (var i = min; i < min + num; i++) {
        var build = builds[i];
        if (build && build.unit && build.unit.id) {
            var unit = {};
            unit.id = build.unit.id;
            if (build.unit.sixStarForm) {
                unit.rarity = 6;
            } else {
                unit.rarity = build.unit.max_rarity;    
            }
            unit.enhancementLevels = build.unit.enhancementLevels;
            unit.goal = formulaToString(build.formula);
            unit.innateElements = getSelectedValuesFor("elements");

            unit.items = [];
            // first fix allow Use of items
            for (var index = 0; index < 10; index++) {
                var item = build.build[index];
                if (item && !item.placeHolder && item.type != "unavailable" && item.allowUseOf) {
                    unit.items.push({slot:index, id:item.id, pinned: build.fixedItems[index] != null});
                    addEnhancementsIfAny(item, unit);
                }
            }
            // first fix dual wield items
            for (var index = 0; index < 10; index++) {
                var item = build.build[index];
                if (item && !item.placeHolder && item.type != "unavailable" && !item.allowUseOf && hasDualWieldOrPartialDualWield(item)) {
                    unit.items.push({slot:index, id:item.id, pinned: build.fixedItems[index] != null});
                    addEnhancementsIfAny(item, unit);
                }
            }
            // then others items
            for (var index = 0; index < 10; index++) {
                var item = build.build[index];
                if (item && !item.placeHolder && item.type != "unavailable" && !hasDualWieldOrPartialDualWield(item) && !item.allowUseOf) {
                    unit.items.push({slot:index, id:item.id, pinned: build.fixedItems[index] != null});
                    addEnhancementsIfAny(item, unit);
                }
                if (item && item.placeHolder) {
                    unit.items.push({slot:index, id:item.type, pinned: false});
                }
            }
            if (build.build[10]) {
                unit.esperId = build.build[10].name;
                unit.esperPinned = (build.fixedItems[10] != null);
            }

            unit.pots = {};
            unit.buffs = {};
            for (var index = baseStats.length; index--;) {
                unit.pots[baseStats[index]] = build.baseValues[baseStats[index]].pots;
                unit.buffs[baseStats[index]] = build.baseValues[baseStats[index]].buff;
            }
            unit.buffs.lbFillRate = build.baseValues.lbFillRate.buff;
            unit.lbShardsPerTurn = build.baseValues.lbFillRate.total;
            unit.mitigation = {
                "physical":build.baseValues.mitigation.physical,
                "magical":build.baseValues.mitigation.magical,
                "global":build.baseValues.mitigation.global
            }
            if (build.baseValues.currentStack) {
                unit.stack = build.baseValues.currentStack;
            }
            if (build._level) {
                unit.level = build._level;
            }
            data.units.push(unit);
        }
    }
    readEnnemyStats();
    data.monster = {
        "races": getSelectedValuesFor("races"),
        elementalResist : ennemyStats.elementalResists,
        def : ennemyStats.def,
        spr : ennemyStats.spr
    }
    data.itemSelector = {
        "mainSelector": $(".equipments select").val(),
        "additionalFilters": []
    }
    var additionalFilters = ["includeEasilyObtainableItems", "includeChocoboItems", "includeTMROfOwnedUnits", "includeTrialRewards", "exludeEvent", "excludePremium", "excludeTMR5", "excludeSTMR", "excludeNotReleasedYet"];
    for (var i = 0; i < additionalFilters.length; i++) {
        if ($("#" + additionalFilters[i]).prop('checked')) {
            data.itemSelector.additionalFilters.push(additionalFilters[i]);
        }
    }
    data.useNewJpDamageFormula = $("#useNewJpDamageFormula").prop("checked");
    data.useNew400Cap = useNew400Cap;
    
    return data;
}

function addEnhancementsIfAny(item, unit) {
    if (!unit.itemEnchantments) {
        unit.itemEnchantments = [];
    }
    if (item.enhancements) {
        unit.itemEnchantments.push(item.enhancements);
    } else {
        unit.itemEnchantments.push(null);
    }
}

function readStateHashData(callback) {
    if (window.location.hash.length > 1) {
        var hashValue = window.location.hash.substr(1);
        if (isLinkId(hashValue)) {
            $.ajax({
                accepts: "application/json",
                url: "https://firebasestorage.googleapis.com/v0/b/" + window.clientConfig.firebaseBucketUri + "/o/PartyBuilds%2F" + hashValue + ".json?alt=media",
                success: function (json) {
                    console.log(json);
                    callback(json);
                },
                error: function (textStatus, errorThrown) {
                    console.log(textStatus, errorThrown);
                }
            });
        } else {
            callback(oldLinkFormatToNew(JSON.parse(atob(hashValue))));
        }
    } else {
        callback(null);
    }
}

function oldLinkFormatToNew(oldData) {
    var data = {
        "units": []
    };
    
    var unit = {};
    unit.id = oldData.unit;
    unit.rarity = oldData.rarity;
    if (oldData.goal == "custom") {
        unit.goal = oldData.customFormula;
    } else {
        unit.goal = formulaToString(formulaByGoal[oldData.goal]);
    }
    unit.innateElements = oldData.innateElements;

    unit.items = oldData.fixedItems;
    unit.esperId = oldData.esper;
    
    unit.pots = oldData.pots;
    unit.buffs = oldData.buff;
    unit.lbShardsPerTurn = oldData.lbShardsPerTurn;
    unit.mitigation = oldData.mitigation;
    data.units.push(unit);
    
    
    data.monster = {
        "races": oldData.ennemyRaces,
        elementalResist : oldData.ennemyResists,
        def : oldData.monsterDef,
        spr : oldData.monsterSpr
    }
    data.itemSelector = {
        "mainSelector": oldData.equipmentToUse,
        "additionalFilters": []
    }
    var additionalFilters = ["includeTMROfOwnedUnits", "includeTrialRewards", "exludeEvent", "excludePremium", "excludeTMR5", "excludeSTMR", "excludeNotReleasedYet"];
    for (var i = 0; i < additionalFilters.length; i++) {
        if (oldData[additionalFilters[i]]) {
            data.itemSelector.additionalFilters.push(additionalFilters[i]);
        }
    }
    
    return data;
}
    
function loadStateHashAndBuild(data, importMode = false) {
    var dataVersion = data.version ? data.version : 0;

    if (data.itemSelector.mainSelector == "owned" && !itemInventory) {
        return;
    }
    
    if (data.useNewJpDamageFormula) {
        $("#useNewJpDamageFormula").prop("checked", true);
    } else {
        $("#useNewJpDamageFormula").prop("checked", false);
    }
    
    if (data.useNew400Cap) {
        $("#useNew400Cap").prop("checked", true);
    } else {
        $("#useNew400Cap").prop("checked", false);
    }
    
    if (!importMode) {
        select("races", data.monster.races);
        for (var element in data.monster.elementalResist) {
            if (data.monster.elementalResist[element] == 0) {
                $("#elementalResists ." + element + " input.elementalResist").val("");
            } else {
                $("#elementalResists ." + element + " input.elementalResist").val(data.monster.elementalResist[element]);
            }
        }
        $('.equipments select option[value="' + data.itemSelector.mainSelector + '"]').prop("selected", true);
        for (var i = 0; i < data.itemSelector.additionalFilters.length; i++) {
            $("#" + data.itemSelector.additionalFilters[i]).prop('checked', true);
        }

        if (data.monster.def) {
            $("#monsterDefensiveStats .def .stat").val(data.monster.def);
        }
        if (data.monster.spr) {
            $("#monsterDefensiveStats .spr .stat").val(data.monster.spr);
        }
    }
    
    $('.goal #normalGoalChoice option').prop("selected", false);
    
    
    var first = true;
    for (var i = 0; i < data.units.length; i++) {
        
        if (first) {
            if (importMode && (builds.length > 1 || builds[0].unit != null)) {
                addNewUnit();
            } else {
                reinitBuild(0);
            }
            first = false;
        } else {
            addNewUnit();
        }
        
        var unit = data.units[i];

        selectUnitDropdownWithoutNotify(unit.id + ((unit.rarity == 6 && units[unit.id]["6_form"]) ? '-6' : ''));
        onUnitChange();
        
        customFormula =  parseFormula(unit.goal, unitsWithSkills[unit.id]);
        onGoalChange();

        if (unit.enhancementLevels) {
            builds[currentUnitIndex].unit.enhancementLevels = unit.enhancementLevels;
            displayUnitEnhancements();
            onUnitChange();
        }
        
        if (unit.level) {
            $("#unitLevel select").val(unit.level);
            builds[currentUnitIndex].setLevel(unit.level);
            updateUnitStats();
            recalculateApplicableSkills();
        }

        select("elements", unit.innateElements);
        
        if (unit.items) {
            for (var index in unit.items) {
                if (unit.items[index]) {
                    var itemId = dataVersion >= 1 ? unit.items[index].id : unit.items[index];
                    var itemSlot = dataVersion >= 1 ? unit.items[index].slot : -1;
                    if (dataVersion >= 2) {
                        fixItem(itemId, itemSlot, (unit.itemEnchantments && unit.itemEnchantments[index] ? unit.itemEnchantments[index] : undefined), unit.items[index].pinned);
                    } else {
                        fixItem(itemId, itemSlot, (unit.itemEnchantments && unit.itemEnchantments[index] ? unit.itemEnchantments[index] : undefined));
                    }
                }
            }
        }
        
        if (unit.esperId) {
            if (dataVersion >= 2) {
                fixItem(unit.esperId, -1, undefined, unit.esperPinned)
            } else {
                fixItem(unit.esperId, -1, undefined, true);
            }
        }
        if (unit.pots) {
            for (var index = baseStats.length; index--;) {
                $(".unitStats .stat." + baseStats[index] + " .pots input").val(unit.pots[baseStats[index]]);
            }
        }
        if (unit.buffs) {
            for (var index = baseStats.length; index--;) {
                $(".unitStats .stat." + baseStats[index] + " .buff input").val(unit.buffs[baseStats[index]]);
            }
            if (unit.buffs.lbFillRate) {
                $(".unitStats .stat.lbFillRate .buff input").val(data.buffs.lbFillRate);
            }
        }
        if (unit.lbShardsPerTurn) {
            $(".unitStats .stat.lbShardsPerTurn .buff input").val(unit.lbShardsPerTurn);
        }
        if (unit.mitigation) {
            $(".unitStats .stat.pMitigation .buff input").val(unit.mitigation.physical);
            $(".unitStats .stat.mMitigation .buff input").val(unit.mitigation.magical);
            $(".unitStats .stat.mitigation .buff input").val(unit.mitigation.global);
        }
        if (unit.stack) {
            $(".unitStack input").val(unit.stack);
        }
        logCurrentBuild();
    }
    
    selectUnitTab(0);
    dataLoadedFromHash = true;
    window.location.hash = "";
}

function clearItemsFromBuild(keepPinnedItems = false)
{
    var buildItems = builds[currentUnitIndex].build;
    var fixedItems = builds[currentUnitIndex].fixedItems;
    for (var slot=0; slot < buildItems.length ; slot++) {
        if (!keepPinnedItems || fixedItems[slot] === null) {
            removeItemAt(slot);
        }
    }
}

function showBuildLink(onlyCurrentUnit) {
    var data = getStateHash(onlyCurrentUnit);
    
    data.itemSelector.mainSelector = "all";
    
    $.ajax({
        url: 'partyBuild',
        method: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            Modal.showWithBuildLink("unit" + (onlyCurrentUnit? '' : 's') + " build", "builder.html?server=" + server + '#' + data.id);
        },
        error: function(error) {
            Modal.showError("Failed to generate url", 'Failed to generate url', error);
        }
    });
}

function showBuildAsText() {
    var text = "";
    text += 
        builds[currentUnitIndex].unit.name + ' ' + builds[currentUnitIndex].unit.max_rarity + '★  \n' +
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
        
    Modal.showWithTextData("Build as text", text);
}

function showExcludedItems() {
    var text = "";
    var idAlreadyTreated = [];
    var dataToSearch = data.concat(espers);
    for (var index = 0, len = dataToSearch.length; index < len; index++) {
        var item = dataToSearch[index];
        if (itemsToExclude.includes(item.id) && !idAlreadyTreated.includes(item.id)) {
            text += '<div class="tr id_' + item.id +'">' +
                '<div class="td actions"><span class="excludeItem glyphicon glyphicon-remove" onclick="removeItemFromExcludeList(\'' + item.id +'\')"></span></div>' +
                getImageHtml(item) + 
                getNameColumnHtml(item) + 
                '</div>';
            idAlreadyTreated.push(item.id);
        }
    }
    
    Modal.show({
        title: "Excluded items",
        body: '<button class="btn btn-warning" onclick="resetExcludeList();">Reset item exclusion list</button>'+
              '<div id="showExcludedItemsDialog"><div class="table items">' + text + '</div></div>',
        size: 'large',
        withCancelButton: false
    });
}

function showMonsterList() {
    var text = "";
    for (var index = 0, len = bestiary.monsters.length; index < len; index++) {
        var monster = bestiary.monsters[index];
        text += '<div class="tr" onclick="selectMonster(' + index +')">' +
            getNameColumnHtml(monster) + 
            '<div class="td special">' + getResistHtml(monster) + '</div>' + 
            '<div class="td special">' + getSpecialHtml(monster) + '</div>';
        text += '<div class="td access">';
        for (var raceIndex = 0, racesLen = monster.races.length; raceIndex < racesLen; raceIndex++) {
            text += "<div>" + monster.races[raceIndex] + "</div>";
        }
        text += '</div>';
        text += '</div>';
    }
    
    Modal.show({
        title: "Monster List",
        body: '<div class="table items monsters">' + text + '</div>',
        size: 'large',
        withCancelButton: false
    });
}

function selectMonster(monsterIndex) {
    var monster = bestiary.monsters[monsterIndex];
    $("#monsterDefensiveStats .def .stat").val(monster.def);
    $("#monsterDefensiveStats .spr .stat").val(monster.spr);
    for(var elementIndex = elementList.length; elementIndex--;) {
        var element = elementList[elementIndex];
        $("#elementalResists ." + element + " input.elementalResist").val("");
    }
    if (monster.resist) {
        for(var resistIndex = monster.resist.length; resistIndex--;) {
            var resist = monster.resist[resistIndex];
            $("#elementalResists ." + resist.name + " input.elementalResist").val(resist.percent);
        }   
    }
    unselectAll("races");
    select("races", monster.races);
    Modal.hide();
    if (builds[currentUnitIndex] && builds[currentUnitIndex].unit) {
        logCurrentBuild();    
    }
}

function removeItemFromExcludeList(id) {
    $("#showExcludedItemsDialog .tr.id_" + id).remove();
    itemsToExclude.splice(itemsToExclude.indexOf(id),1);
    $(".excludedItemNumber").html(itemsToExclude.length);
}

function resetExcludeList() {
    itemsToExclude = defaultItemsToExclude.slice();
    $(".excludedItemNumber").html(itemsToExclude.length);
    showExcludedItems();
}

function getItemLineAsText(prefix, slot) {
    var item = builds[currentUnitIndex].build[slot];
    if (item) {
        var statBonusCoef = 1;
        if (item.type == "esper") {
            if (builds && builds[currentUnitIndex] && builds[currentUnitIndex].build) {
                for (var i = 0; i < builds[currentUnitIndex].build.length; i++) {
                    if (builds[currentUnitIndex].build[i] && builds[currentUnitIndex].build[i].esperStatsBonus) {
                        statBonusCoef += builds[currentUnitIndex].build[i].esperStatsBonus["hp"] / 100;
                    }
                }
            }
            statBonusCoef = Math.min(3, statBonusCoef);
        } 
        var resultText = prefix + ": " + item.name + " ";
        var first = true;
        for (var statIndex = 0, len = baseStats.length; statIndex < len; statIndex++) {
            if (item[baseStats[statIndex]]) {
                if (first) {
                    first = false;
                } else {
                    resultText += ", ";
                }
                resultText += baseStats[statIndex].toUpperCase() + "+" + Math.floor(item[baseStats[statIndex]] * statBonusCoef);
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
        if (item.enhancements) {
            resultText += " (IW :";
            first = true;
            for (var i = 0, len = item.enhancements.length; i < len; i++) {
                if (first) {
                    first = false;
                } else {
                    resultText += ", ";
                }
                if (item.enhancements[i] == "rare") {
                    resultText += "Rare";
                } else {
                    resultText += itemEnhancementLabels[item.enhancements[i]];
                }
            }
            resultText += ")";
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
        var result = calculateStatValue(builds[currentUnitIndex].build, baseStats[statIndex], builds[currentUnitIndex]).total;
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
        var maxValue = 600;
        if (stat == "pMitigation" || stat == "mMitigation" || stat == "mitigation") {
            maxValue = 99;
        }
        if (value > maxValue) {
            $(".unitStats .stat." + stat + " .buff input").val(maxValue);
        }
        logCurrentBuild();
    }
}

function updateEspers() {
    
    var esperSource = espers;
    var equipments = $(".equipments select").val();
    if (equipments == "owned" && ownedEspers && Object.keys(ownedEspers).length > 0) {
        esperSource = [];
        for (var index in ownedEspers) {
            esperSource.push(getEsperItem(ownedEspers[index]));
        }
    }
    if (equipments == "ownedAvailableForExpedition") {
        esperSource = [];
    }
    espersByName = {};
    for (var index = esperSource.length; index--;) {
        espersByName[esperSource[index].id] = esperSource[index];    
    }
    searchableEspers = [];
    for (var index = esperSource.length; index--;) {
        searchableEspers.push(esperSource[index]);
    }
    
    prepareSearch(searchableEspers);
}

function getSavedBuilds(callback) {
    if (savedBuilds) {
        callback(savedBuilds);
    } else {
        $.get(server + '/savedTeams', function(result) {
            savedBuilds = result;
            if (!savedBuilds.teams) {
                savedBuilds.teams = [];
            }
            callback(savedBuilds);
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            Modal.showErrorGet(this.url, errorThrown);
        });
    }
}

function saveTeam(name = null) {
    if (currentSavedBuildIndex < 0) {
        if (name) {
            saveTeamAs(name);
        } else {
            showSaveAsPopup();    
        }
    } else {
        if (name) {
            saveTeamAs(name);
        } else {
            savedBuilds.teams[currentSavedBuildIndex].team = getStateHash(false);
            writeSavedTeams();    
        }
    }
}

function saveTeamAs(name) {
    getSavedBuilds(function(savedBuilds) {
        savedBuilds.teams.push({
            "name": name,
            "team": getStateHash(false)
        });
        writeSavedTeams();
        currentSavedBuildIndex = savedBuilds.teams.length - 1;
        $(".savedTeamName").text("Saved team : " + savedBuilds.teams[currentSavedBuildIndex].name);
        $("#saveTeamAsButton").removeClass("hidden");
    });
}

function writeSavedTeams() {
    $.ajax({
        url: server + '/savedTeams',
        method: 'PUT',
        data: JSON.stringify(savedBuilds),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function() { $.notify("Team saved", "success");},
        error: function(error) { 
            Modal.showError("Save error", 'An error occured while trying to save the team.', error);
        }
    });
}

function showSaveAsPopup() {
    Modal.show({
        title: "Save team as...",
        body: '<div class="input-group">' + 
                '<span class="input-group-addon">Build name</span>' +
                '<input class="form-control" type="text"/>' + 
              '</div>',
        size: 'large',
        onOpen: function($modal) {
            // Focus on input
            $modal.find('input').focus();
        },
        buttons: [{
            text: 'Save',
            onClick: function($modal) {
                var name = $modal.find('input').val();
                if (name && name.length > 0) {
                    saveTeamAs(name);
                } else {
                    Modal.showMessage("Name error", "Please enter a name");
                    return false;
                }
            }
        }]
    });
}

function loadSavedTeam(index = -1) {
    if (index < 0) {
        showSavedTeams();
    } else {
        if (builds.length > 1 || builds[0].unit != null) {
            Modal.confirm("Load saved team", "Loading this team will remove the units you currently have in the builder. Continue?", function() {
                doLoadSavedTeam(index);
            });
        } else {
            doLoadSavedTeam(index)
        }
    }
}

function doLoadSavedTeam(index) {
    getSavedBuilds(function(savedBuilds) {
        for (var i = builds.length; i-- > 1; ) {
            closeTab(i);
        }
        currentSavedBuildIndex = index;
        loadStateHashAndBuild(savedBuilds.teams[index].team);
        $(".savedTeamName").text("Saved team : " + savedBuilds.teams[index].name);

        $("#saveTeamAsButton").removeClass("hidden");
        Modal.hide();
    });
}

function importSavedTeam(index) {
    getSavedBuilds(function(savedBuilds) {
        var currentUnitCount = builds.length;
        if (builds.length == 1 && builds[0].unit == null) {
            currentUnitCount--;
        }
        if (currentUnitCount + savedBuilds.teams[index].team.units.length > 10) {
            Modal.showMessage("Import error", "Importing this team would result in more than 10 units. Please remove some units before doing that.");
            return;
        }
        loadStateHashAndBuild(savedBuilds.teams[index].team, true);
        Modal.hide();
    });
}

function showSavedTeams() {
    getSavedBuilds(function(savedBuilds) {
        
        Modal.show({
            title: "Saved teams",
            body: getSavedTeamList,
            size: 'large',
            withCancelButton: false
        });
    });
}

function getSavedTeamList() {
    var html = "";
    for (var i = 0, len = savedBuilds.teams.length; i < len; i++) {
        html += '<div class="savedTeam"><div>'
        html += '<div class="name">' + savedBuilds.teams[i].name + '</div><div class="team">';
        for (var j = 0, lenJ = savedBuilds.teams[i].team.units.length; j < lenJ; j++) {
            html += '<img class="unit" src="img/units/unit_icon_' + savedBuilds.teams[i].team.units[j].id + '.png">';
        }
        html += '</div></div><div>' +
            '<div class="btn" onclick="importSavedTeam(' + i + ');" title="Add this team to your current team">Import</div>' +
            '<div class="btn" onclick="loadSavedTeam(' + i + ');" title="Load this team, to modify it">Load</div>' +
            '<div class="btn" onclick="deleteSavedTeam(' + i + ')" title="Delete this team"><span class="glyphicon glyphicon-remove"></span>' +
            '</div></div></div>'
    }
    return html;
}

function deleteSavedTeam(index) {
    savedBuilds.teams.splice(index, 1);
    if (currentSavedBuildIndex >= 0) {
        if (currentSavedBuildIndex == index) {
            $("#saveTeamAsButton").addClass("hidden");
            $(".savedTeamName").text("New team");
            currentSavedBuildIndex = -1;
        } else if (currentSavedBuildIndex > index) {
            currentSavedBuildIndex--;
        }
    }
    writeSavedTeams();
    showSavedTeams();
}

// will be called by common.js at page load
function startPage() {
    progressElement = $("#buildProgressBar .progressBar");
    if (server == "JP") {
        $('#useNewJpDamageFormula').prop('checked', true);
    }
    getStaticData("data", true, function(result) {
        data = result;
        dataStorage.setData(data);
        getStaticData("unitsWithPassives", true, function(result) {
            units = result;
            getStaticData("unitsWithSkill", true, function(result) {
                unitsWithSkills = result;
                populateUnitSelect();
                prepareSearch(data);
                continueIfReady();
            });
        });
    });
    
    getStaticData("defaultBuilderEspers", false, function(result) {
        espers = [];
        for (var index = result.length; index--;) {
            espers.push(getEsperItem(result[index]))
        }
        updateEspers();
        
        continueIfReady();
    });
    $.get(server + "/units", function(result) {
        ownedUnits = result;
        onEquipmentsChange();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
    });
    getStaticData("monsters", false, function(result) {
        bestiary = new Bestiary(result);
        $("#monsterListLink").removeClass("hidden");
    });
    
    builds[currentUnitIndex] = new UnitBuild(null, [null, null, null, null, null, null, null, null, null, null, null], null);
    
    $(".goal select").change(onGoalChange);
    
    $(".equipments select").change(onEquipmentsChange);
    
    $("#buildButton").click(build);
    
    
    
    // Elements
	addIconChoicesTo("elements", ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"], "checkbox", "element");
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
        $("#customFormulaModal #formulaInput").focus();
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
            }
        });
    }
    $(".unitStats .stat.lbFillRate .buff input").on('input',$.debounce(300,function() {onBuffChange("lbFillRate");}));
    $(".unitStats .stat.lbShardsPerTurn .buff input").on('input',$.debounce(300,function() {onBuffChange("lbFillRate")}));
    $(".unitStats .stat.pMitigation .buff input").on('input',$.debounce(300,function() {onBuffChange("pMitigation")}));
    $(".unitStats .stat.mMitigation .buff input").on('input',$.debounce(300,function() {onBuffChange("mMitigation")}));
    $(".unitStats .stat.mitigation .buff input").on('input',$.debounce(300,function() {onBuffChange("mitigation")}));
    $(".unitStack input").on('input',$.debounce(300,function() {logCurrentBuild();}));
    $("#unitLevel select").change(function() {
        builds[currentUnitIndex].setLevel($("#unitLevel select").val());
        updateUnitStats();
        recalculateApplicableSkills();
        logCurrentBuild();
    });
    $("#useNewJpDamageFormula").change(function() {logCurrentBuild();});
    $("#useNew400Cap").change(function() {
        readGoal();
        logCurrentBuild();
    });
    
    $("#monsterDefensiveStats input").on('input',$.debounce(300,function() {
        readEnnemyStats();
        logCurrentBuild();
    }));
    $("#elementalResists input").on('input',$.debounce(300,function() {
        readEnnemyStats();
        logCurrentBuild();
    }));
    
    
    
    // Set tooltips
    $('[data-toggle="tooltip"]').tooltip({
        container: 'body',
        trigger: 'hover'
    });
}

var counter = 0;
function continueIfReady() {
    counter++;
    if (counter == 2) {
        initWorkerNumber();
        initWorkers();
        
        var hashData = readStateHashData(function(hashData) {
            if (hashData) {
                loadStateHashAndBuild(hashData);
            } else {
                reinitBuild(currentUnitIndex);
            }
        });
        
    }
}

function initWorkerNumber() {
    if (navigator.hardwareConcurrency) {
        //keep one core for the rest of the device
        numberOfWorkers = navigator.hardwareConcurrency - 1;
        //correction for machines with one core
        if (numberOfWorkers < 1){
            numberOfWorkers = 1;
        }
    } else {
        console.log("No navigator.hardwareConcurrency support. Suppose 4 cores");
        numberOfWorkers = 4;
    }
    $("#coreUsage input").val(numberOfWorkers);
    $("#coreUsage input").on('input',$.debounce(300,function() {
        var number = parseInt($("#coreUsage input").val());
        if (!number || isNaN(number) || number < 1 || number > 16) {
            $("#coreUsage input").val("2");
            numberOfWorkers = 2;
        } else {
            numberOfWorkers = number;
        }
        initWorkers();
    }));
}

function initWorkers() {
    workers = [];
    for (var index = 0, len = numberOfWorkers; index < len; index++) {
        workers.push(new Worker('builder/optimizerWebWorker.js?1'));
        workers[index].postMessage(JSON.stringify({"type":"init", "allItemVersions":dataStorage.itemWithVariation, "number":index}));
        workers[index].onmessage = function(event) {
            var messageData = JSON.parse(event.data);
            switch(messageData.type) {
                case "betterBuildFound":
                    if (!builds[currentUnitIndex].buildValue[goalVariation] 
                            || builds[currentUnitIndex].buildValue[goalVariation] < messageData.value[goalVariation]
                            || (builds[currentUnitIndex].buildValue[goalVariation] == messageData.value[goalVariation] 
                                && (messageData.freeSlots > builds[currentUnitIndex].freeSlots
                                   || calculateStatValue(messageData.build, "hp", builds[currentUnitIndex]).total > calculateStatValue(builds[currentUnitIndex].build, "hp", builds[currentUnitIndex]).total))) {
                        builds[currentUnitIndex].build = messageData.build;
                        builds[currentUnitIndex].buildValue = messageData.value;
                        builds[currentUnitIndex].freeSlots = messageData.freeSlots;
                        // if the resulting build inverted weapond, invert the pinned weapon if needed
                        if (builds[currentUnitIndex].fixedItems[0] && (builds[currentUnitIndex].build[0] && builds[currentUnitIndex].build[0].id != builds[currentUnitIndex].fixedItems[0].id || !builds[currentUnitIndex].build[0]) ||
                            builds[currentUnitIndex].fixedItems[1] && (builds[currentUnitIndex].build[1] && builds[currentUnitIndex].build[1].id != builds[currentUnitIndex].fixedItems[1].id || !builds[currentUnitIndex].build[1]))  {
                            var tmp = builds[currentUnitIndex].fixedItems[0];
                            builds[currentUnitIndex].fixedItems[0] = builds[currentUnitIndex].fixedItems[1];
                            builds[currentUnitIndex].fixedItems[1] = tmp;
                        }
                        logCurrentBuild();
                    }
                    break;
                case "finished":
                    workerWorkingCount--;
                    processTypeCombinations(messageData.number);
                    processedCount = Math.min(processedCount + typeCombinationChunckSize, typeCombinationsCount);
                    var newProgress = Math.floor(processedCount/typeCombinationsCount*100);
                    if (progress != newProgress) {
                        progress = newProgress;
                        progressElement.width(progress + "%");
                        progressElement.text(progress + "%");    
                        document.title = progress + "% - FFBE Equip - Builder";
                    }
                    if (workerWorkingCount == 0) {
                        if (!builds[currentUnitIndex].buildValue  && builds[currentUnitIndex].formula.condition) {
                            Modal.showMessage("Build error", "The condition set in the goal are impossible to meet.");
                        }
                        if (initialPinnedWeapons[0] && (builds[currentUnitIndex].fixedItems[0] && builds[currentUnitIndex].fixedItems[0].id != initialPinnedWeapons[0].id || !builds[currentUnitIndex].fixedItems[0]) ||
                           initialPinnedWeapons[1] && (builds[currentUnitIndex].fixedItems[1] && builds[currentUnitIndex].fixedItems[1].id != initialPinnedWeapons[1].id || ! builds[currentUnitIndex].fixedItems[1])) {
                            $.notify("Weapons hands were switched to optimize build", "info");
                        }
                        
                        if (secondaryOptimization) {
                            builds[currentUnitIndex].fixedItems = secondaryOptimizationFixedItemSave;
                            builds[currentUnitIndex].formula = secondaryOptimizationFormulaSave;
                            running = false;
                            progressElement.addClass("finished");
                            $("body").removeClass("building");
                            console.timeEnd("optimize");
                            $("#buildButton").text("Build !"); 
                            logCurrentBuild();
                            dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
                            builds[currentUnitIndex].prepareEquipable();
                        } else {
                            
                            var overcapedStats = [];
                            for (var i = baseStats.length; i--;) {
                                var percent = calculateStatValue(builds[currentUnitIndex].build, baseStats[i], builds[currentUnitIndex]).bonusPercent;
                                if (percent > statsBonusCap[server]) {
                                    overcapedStats.push(percentValues[baseStats[i]]);
                                }
                                var equipmentFlatStatBonus = Math.round((getEquipmentStatBonus(builds[currentUnitIndex].build, baseStats[i], false) - 1) * 100);
                                if (equipmentFlatStatBonus > 0) {
                                    if (builds[currentUnitIndex].build[0] && builds[currentUnitIndex].build[1] && weaponList.includes(builds[currentUnitIndex].build[0].type) && weaponList.includes(builds[currentUnitIndex].build[1].type)) {
                                        if (equipmentFlatStatBonus > 100) {
                                            overcapedStats.push("dualWielding." + baseStats[i]);
                                        }
                                    } else {
                                        if (equipmentFlatStatBonus > 300) {
                                            if (!isTwoHanded(builds[currentUnitIndex].build[0]) && !isTwoHanded(builds[currentUnitIndex].build[0])) {
                                                overcapedStats.push("singleWieldingOneHanded." + baseStats[i]);    
                                            }
                                            overcapedStats.push("singleWielding." + baseStats[i]);
                                        }
                                    }
                                }
                            }
                            if (overcapedStats.length > 0 && $("#tryReduceOverCap input").prop('checked')) {
                                secondaryOptimization = true;
                                secondaryOptimizationFixedItemSave = builds[currentUnitIndex].fixedItems.slice();
                                secondaryOptimizationFormulaSave = JSON.parse(JSON.stringify(builds[currentUnitIndex].formula));
                                for (var i = 0; i < 11; i++) {
                                    if (builds[currentUnitIndex].build[i] && !builds[currentUnitIndex].fixedItems[i] && !overcapedStats.some(stat => getValue(builds[currentUnitIndex].build[i], stat) > 0)) {
                                        builds[currentUnitIndex].fixedItems[i] = builds[currentUnitIndex].build[i];
                                    } else {
                                        builds[currentUnitIndex].build[i] = null;
                                    }
                                }
                                var statToFavor = $("#tryReduceOverCap select").val();
                                if (builds[currentUnitIndex].formula.type == "condition") {
                                    builds[currentUnitIndex].formula = {
                                        "type": "condition",
                                        "formula": {"type": "value", "name": statToFavor},
                                        "condition": {
                                            "type":"AND",
                                            "value1": {
                                                "type": ">",
                                                "value1" : builds[currentUnitIndex].formula.formula,
                                                "value2": {
                                                    "type": "constant",
                                                    "value": Math.floor(builds[currentUnitIndex].buildValue[goalVariation])
                                                }
                                            },
                                            "value2": builds[currentUnitIndex].formula.condition,
                                        }
                                    }
                                } else {
                                    builds[currentUnitIndex].formula = {
                                        "type": "condition",
                                        "formula": {"type": "value", "name": statToFavor},
                                        "condition": {
                                            "type": ">",
                                            "value1" : builds[currentUnitIndex].formula,
                                            "value2": {
                                                "type": "constant",
                                                "value": Math.floor(builds[currentUnitIndex].buildValue[goalVariation])
                                            }
                                        }
                                    }
                                }
                                builds[currentUnitIndex].buildValue[goalVariation] = 0;
                                dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
                                builds[currentUnitIndex].prepareEquipable();
                                optimize();
                            } else {
                                running = false;
                                progressElement.addClass("finished");
                                console.timeEnd("optimize");
                                $("#buildButton").text("Build !"); 
                                $("body").removeClass("building");
                            }
                            
                        }
                        
                        
                    }
                    break;
            }
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
        target.append('<i class="img img-equipment-'+weaponList[key]+' notEquipable"></i>');
	}
    var target = $(".unitEquipable.armors");
    target.html("");
    for (var key in shieldList) {
        target.append('<i class="img img-equipment-'+shieldList[key]+' notEquipable"></i>');
	}
    for (var key in headList) {
        target.append('<i class="img img-equipment-'+headList[key]+' notEquipable"></i>');
	}
    for (var key in bodyList) {
        target.append('<i class="img img-equipment-'+bodyList[key]+' notEquipable"></i>');
	}
}
    
function populateItemType(equip) {
    var target = $("#fixItemModal .modal-body .nav.type");
    target.html("");
    if (equip.length > 1) {
        target.append("<li class='all sort-type'><a onclick='selectSearchType(" + JSON.stringify(equip) + ");updateSearchResult();'><img src='img/icons/all.png'/></a></li>");
    }
	for (var key in equip) {
        target.append('<li class="' + equip[key] + ' sort-type"><a onclick="selectSearchType([\'' + equip[key] + '\']);updateSearchResult();">'+
                      '<i class="img img-equipment-' + equip[key] + '"></i>'+
                      '</a></li>');
	}
    
}

function populateItemStat() {
    var statList = ["hp", "mp", "atk", "def", "mag", "spr", "evade", "inflict", "resist"];
    var target = $("#fixItemModal .stat .dropdown-menu");
    target.append('<button class="btn btn-default" onclick="selectSearchStat();updateSearchResult();"><i class="img img-sort-a-z"></i></button>');
	for (var key in statList) {
        target.append('<button class="btn btn-default" onclick="selectSearchStat(\'' + statList[key] + '\');updateSearchResult();">'+
                      '<i class="img img-sort-' + statList[key] + '"></i>' + 
                      '</button>');
	}
}

function populateResists() {
    var div = $("#resultStats .resists .elements");
    for (var index in elementList) {
        div.append('<div class="resist ' + elementList[index] + ' ' +  escapeDot("resist|" + elementList[index] + ".percent") + '">'+
                   '<i class="img img-element-' + elementList[index] + '"></i>'+
                   '<div class="value">0%<div></div>');
    }
    var div = $("#resultStats .resists .ailments");
    for (var index in ailmentList) {
        div.append('<div class="resist ' + ailmentList[index] + ' ' +  escapeDot("resist|" + ailmentList[index] + ".percent") +'">'+
                   '<i class="img img-ailment-' + ailmentList[index] + '"></i>'+
                   '<div class="value">0%<div></div>');
    }
}
