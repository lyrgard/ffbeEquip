﻿page = "builder";
var adventurerIds = ["1500000013", "1500000015", "1500000016", "1500000017", "1500000018"];

const formulaByGoal = {
    "physicalDamage":                   {"type":"skill", "id":"0","name":"1x physical ATK damage", "formulaName":"physicalDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1}}},
    "magicalDamage":                    {"type":"skill", "id":"0","name":"1x magical MAG damage", "formulaName":"magicalDamage", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"mind", "coef":1}}},
    "hybridDamage":                     {"type":"skill", "id":"0","name":"1x hybrid ATK/MAG damage", "formulaName":"hybridDamage", "value": {"type":"damage", "value":{"mecanism":"hybrid", "coef":1}}},
    "jumpDamage":                       {"type":"skill", "id":"0","name":"1x jump damage", "formulaName":"jumpDamage", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1, "jump":true}}},
    "magDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical MAG damage", "formulaName":"magDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"mind", "coef":1}}},
    "sprDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical SPR damage", "formulaName":"sprDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"mind", "coef":1, "use":{"stat":"spr"}}}},
    "defDamageWithPhysicalMecanism":    {"type":"skill", "id":"0","name":"1x physical DEF damage", "formulaName":"defDamageWithPhysicalMecanism", "value": {"type":"damage", "value":{"mecanism":"physical", "damageType":"body", "coef":1, "use":{"stat":"def"}}}},
    "atkDamageWithMagicalMecanism":     {"type":"skill", "id":"0","name":"1x magical ATK damage", "formulaName":"atkDamageWithMagicalMecanism", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"body", "coef":1}}},
    "sprDamageWithMagicalMecanism":     {"type":"skill", "id":"0","name":"1x magical SPR damage", "formulaName":"sprDamageWithMagicalMecanism", "value": {"type":"damage", "value":{"mecanism":"magical", "damageType":"mind", "coef":1, "use":{"stat":"spr"}}}},
    "atkDamageWithFixedMecanism":       {"type":"value","name":"atkDamageWithFixedMecanism"},
    "physicalDamageMultiCast":          {"type":"value","name":"physicalDamageMultiCast"},
    "fixedDamageWithPhysicalMecanism":  {"type":"value","name":"fixedDamageWithPhysicalMecanism"},
    "summonerSkill":                    {"type":"value","name":"summonerSkill"},
    "atk":                              {"type":"value","name":"atk"},
    "mag":                              {"type":"value","name":"mag"},
    "def":                              {"type":"value","name":"def"},
    "spr":                              {"type":"value","name":"spr"},
    "hp":                               {"type":"value","name":"hp"},
    "mp":                               {"type":"value","name":"mp"},
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
    ["atkDamageWithMagicalMecanism","Magical type ATK damage"],
    ["sprDamageWithMagicalMecanism","Magical type SPR damage"],
    ["atkDamageWithFixedMecanism","Fixed type ATK damage"],
    ["physicalDamageMultiCast","Physical damage Multicast"],
    ["fixedDamageWithPhysicalMecanism","Physical type Fixed damage (1000)"],
    ["summonerSkill","Summoner skill"],
    ["physicaleHp","Physical eHP (HP * DEF)"],
    ["magicaleHp","Magical eHP (HP * SPR)"],
    ["atk","ATK"],
    ["mag","MAG"],
    ["def","DEF"],
    ["spr","SPR"],
    ["hp","HP"],
    ["mp","MP"],
    ["physicalEvasion","Physical evasion"],
    ["magicalEvasion","Magical evasion"],
    ["mpRefresh","MP/turn"],
    ["heal","Heal"]
]

var customFormula;

var espers;
var espersByName = {};

var units;
var ownedUnits;
var unitsWithSkills = {};

var ennemyStats;

var builds = [];
var currentUnitIndex = 0;

var searchType = [];
var searchStat = "";
var ClickBehaviors = {
    EQUIP: 0,
    IGNORE: 1,
    EXCLUDE: 2,
    INCLUDE: 3,
};
var searchClickBehavior = ClickBehaviors.EQUIP;
var currentItemSlot;

var searchableEspers;

var dataLoadedFromHash = false;

var conciseView = true;

var progressElement;
var progress;

var defaultItemsToExclude = ["409009000"];
var itemsToExclude = defaultItemsToExclude.slice(); // Ring of Dominion
var itemsToInclude = [];

var itemPool;

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

var defaultWeaponEnhancement = [];
var parameterChallengesMode = false;
var runningParamChallenge = false;
var currentUnitIdIndexForParamChallenge = -1;
var currentBestParamChallengeBuild = {
    goal:0,
    value:0,
    build:null
}

let buildCounter = 0;

let displayOnly7StarsUnits = true;

let fixItemList;

let defaultMonsterAttackFormula = {"type":"*","value1":{"type":"constant","value":1},"value2":{"type":"skill","id":"0","name":"1x physical ATK damage","formulaName":"physicalDamage","value":{"type":"damage","value":{"mecanism":"physical","damageType":"body","coef":1}}}};
let monsterAttackFormula;

// Load the "How to Use This" File
$("#help").load('builder-help.html');

function onBuildClick() {
	if (builds[currentUnitIndex] && builds[currentUnitIndex].unit.id === '777700004') {
		Modal.showMessage("Hum ?", "Are you saying you want me to help you build my foe? I'm afraid not! You're on your own there !");
		return;
	}

	runningParamChallenge = false;
	currentUnitIdIndexForParamChallenge = -1;

	if (running || runningParamChallenge) {
		stopBuild();
		Modal.showMessage("Build cancelled", "The build calculation has been stopped. The best calculated result is displayed, but it may not be the overall best build.");
		return;
	}

	build();
}

function build() {
	secondaryOptimization = false;

	$(".buildLinks").addClass("hidden");

	buildCounter = 0;
	logBuildCounter();
	
	$(".buildCounterDiv").removeClass("hidden");

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
	updateBuildButtonDisplay();

	$('#buildInProgress').removeClass('hidden');

	try {
		optimize();
	} catch(error) {
		Modal.showError("An error occured while trying to optimize", error);
	}
}


function stopBuild() {
	for (var index = workers.length; index--; index) {
		workers[index].terminate();
	}

	console.timeEnd("optimize");
	initWorkers();
	workerWorkingCount = 0;
	running = false;
	updateBuildButtonDisplay();

	$("body").removeClass("building");
	$('#buildInProgress').addClass('hidden');


	runningParamChallenge = false;
}

function updateBuildButtonDisplay() {
	if (running) {
		$("#buildButton").removeClass('hidden');
		$("#buildButton").text("Stop!").removeClass('btn-primary').addClass('btn-danger');
	} else {
		$("#buildButton").text("Build!").removeClass('btn-danger').addClass('btn-primary');
		if (parameterChallengesMode) {
			$("#buildButton").addClass('hidden');
		} else {
			$("#buildButton").removeClass('hidden');
		}
	}
}

function optimize() {
	console.time("optimize");
	progress = 0;
	progressElement.width("0%");
	progressElement.text("0%");
	progressElement.removeClass("finished");

	progressElementModal.width("0%");
	progressElementModal.text("0%");


	var forceDoubleHand = $("#forceDoublehand").prop('checked');
	var forceDualWield = $("#forceDualWield").prop('checked');
	var tryEquipSources = $("#tryEquipsources").prop('checked');
	var useNewJpDamageFormula = $("#useNewJpDamageFormula").prop('checked');

	prepareDataStorage();

	var espersToSend = {};
	var esperNames = Object.keys(espersByName);

	for (var esperNameIndex in esperNames) {
		var esperName = esperNames[esperNameIndex];
		if (!itemsToExclude.includes(esperName)) {
			espersToSend[esperName] = espersByName[esperName];
		}
	}

	itemPool = new ItemPool(4, builds[0].involvedStats, ennemyStats);

	for (var index = workers.length; index--; index) {
		workers[index].postMessage(JSON.stringify({
			"type":"setData",
			"server": server,
			"espers":espersToSend,
			"unit":builds[currentUnitIndex].unit,
			"level":builds[currentUnitIndex]._level,
			"exAwakeningLevel": builds[currentUnitIndex]._exAwakeningLevel,
			"fixedItems":builds[currentUnitIndex].fixedItems,
			"baseValues":builds[currentUnitIndex].baseValues,
			"innateElements":builds[currentUnitIndex].innateElements,
			"formula":builds[currentUnitIndex].formula,
			"monsterAttackFormula": monsterAttackFormula,
			"dataByType":dataStorage.dataByType,
			"dataWithCondition":dataStorage.dataWithCondition,
			"dualWieldSources":dataStorage.dualWieldSources,
			"alreadyUsedEspers":dataStorage.alreadyUsedEspers,
			"useEspers":!dataStorage.onlyUseShopRecipeItems,
			"desirableElements":dataStorage.desirableElements,
			"ennemyStats":ennemyStats,
			"goalVariation": goalVariation,
			"useNewJpDamageFormula": useNewJpDamageFormula,
		}));
	}

	let forceTmrAbility = $("#forceTmrAbility").prop('checked');
	var typeCombinationGenerator = new TypeCombinationGenerator(forceDoubleHand, forceDualWield, tryEquipSources, builds[currentUnitIndex], dataStorage.dualWieldSources, dataStorage.equipSources, dataStorage.dataByType, dataStorage.weaponsByTypeAndHands, forceTmrAbility);

	remainingTypeCombinations = typeCombinationGenerator.generateTypeCombinations();

	if (remainingTypeCombinations.length == 0) {
		stopBuild();
		Modal.showMessage("Rules Issue", "The build rules chosen are not compatible with available equipments");
		return;
	}

	typeCombinationChunckSize = Math.min(typeCombinationChunckSize, Math.ceil(remainingTypeCombinations.length/20));
	initialPinnedWeapons = [builds[currentUnitIndex].fixedItems[0], builds[currentUnitIndex].fixedItems[1]];
	document.title = "0% - FFBE Equip - Builder";
	processedCount = 0
	typeCombinationsCount = remainingTypeCombinations.length;

	for (var index = workers.length; index--; index) {
		processTypeCombinations(index);
	}
}

function prepareDataStorage() {
	dataStorage.setUnitBuild(builds[currentUnitIndex]);
	dataStorage.itemsToExclude = itemsToExclude;
	dataStorage.itemsToInclude = itemsToInclude;
	dataStorage.prepareData(itemsToExclude, ennemyStats);
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
	var formula;
	
	if (customFormula) {
		builds[index].goal = "custom";
		formula = customFormula;
	} else {
		var goalValue = $(".goal #normalGoalChoice").val();

		if (goalValue) {
			if (builds[index].unit) {
				let unitWithSkills = unitsWithSkills[builds[index].unit.id];
	
				if (goalValue == "LB") {
					builds[index].goal = "custom";
					var skill = unitWithSkills.lb;
					formula = formulaFromSkill(skill);

				} else if (goalValue == "LB_REPLACED") {
					skillLoop: for (var skillIndex = unitWithSkills.passives.length; skillIndex--;) {
						var passive = unitWithSkills.passives[skillIndex];

						for (var effectIndex = passive.effects.length; effectIndex--;) {
							var effect = passive.effects[effectIndex].effect;

							if (effect && effect.replaceLb) {
								builds[index].goal = "custom";
								var formula = formulaFromSkill(effect.replaceLb);
								formula.lb = true;
								formula.replacedLb = true;
								break skillLoop;
							}
						}
					}

				} else if (goalValue.startsWith("SKILL_")) {
						builds[index].goal = "custom";
						var skillId = goalValue.substr(6);
						var skill = getSkillFromId(skillId, unitWithSkills);
						formula = formulaFromSkill(skill);

				} else if (goalValue.startsWith("MULTICAST_")) {
						builds[index].goal = "custom";
						var skillId = goalValue.substr(10);
						var skill = getSkillFromId(skillId, unitWithSkills);
						var multicastEffect;
						
						for (var i = skill.effects.length; i--;) {
							if (skill.effects[i].effect && skill.effects[i].effect.multicast) {
								multicastEffect = skill.effects[i].effect.multicast;
							}
						}

						var skillChoiceFormulas = [];

						for (var i = 0, len = multicastEffect.time; i < len; i++) {
							var skillChoiceValue = $("#multicastSelect" + i).val();
							var skillChoiceId = skillChoiceValue.substr(6);
							var skillChoice = getSkillFromId(skillChoiceId, unitWithSkills);
							skillChoiceFormulas.push(formulaFromSkill(skillChoice, true));
						}

						formula = {type:"multicast", skills: skillChoiceFormulas};

				} else {
					builds[index].goal = goalValue;
					formula = formulaByGoal[goalValue];
        }
      	
				$(".goal .chainMultiplier").removeClass("hidden");
      }
    }
  }

	formula = readSimpleConditions(formula);
	builds[index].formula = formula;
	goalVariation = $("#goalVariance").val();
	$(".unitStack").toggleClass("hidden", !hasStack(builds[index].formula));
	$(".unitAttackElement").addClass("hidden");

	if (builds[index].unit && (builds[index].involvedStats.includes("physicalKiller") || builds[index].involvedStats.includes("magicalKiller") || builds[index].involvedStats.includes("weaponElement"))) {
		$(".unitAttackElement").removeClass("hidden");
	}

	if (builds[index].involvedStats.includes("weaponElement")) {
		$(".unitAttackElement").removeClass("hidden");
	}
}

function readSimpleConditions(formula) {
	if (formula) {
		var simpleConditions = {
			"forcedElements":getSelectedValuesFor("forcedElements").map(x => (x == "noElement" ? "none" : x)),
			"ailmentImunity":getSelectedValuesFor("ailmentImunities"),
			"elementalResist": {},
			"various":getSelectedValuesFor("simpleConditionVarious")
		}

		for (var i = elementList.length; i--;) {
			var value = $(".elements .element." + elementList[i] + " input").val() || 0;
			if (value > 0) {
				simpleConditions.elementalResist[elementList[i]] = value;
			}
		}

		let chainMult = readChainMultiplier();

		if (chainMult != 1) {
			formula = {
				type: '*',
				value1: {
					type:'chainMultiplier',
					value: chainMult,
				},
				value2: formula
			}
		}

	return makeSureFormulaHaveSimpleConditions(formula, simpleConditions);
	
	}
}

function readChainMultiplier() {
	let stringValue = $(".chainMultiplier input").val();

	if (stringValue) {
		stringValue = stringValue.replace(',', '.');

		if (stringValue.toUpperCase() === 'MAX') {
			return 'MAX';
		} else {
			return parseFloat(stringValue) || 1;
		}

	} else {
		return 1;
	}
}

function switchSimpleConditionAilments() {
	var currentSelectedAilments = getSelectedValuesFor("ailmentImunities");
	var deathSelected = currentSelectedAilments.includes("death");

	if (deathSelected) {
		currentSelectedAilments.splice(currentSelectedAilments.indexOf("death"), 1);
	}

	if (currentSelectedAilments.length == 8) {
		unselectAll("ailmentImunities");
		select("ailmentImunities", disablingAilmentList);

	} else if (currentSelectedAilments.length == 4 && includeAll(currentSelectedAilments, disablingAilmentList)) {
		unselectAll("ailmentImunities");
	
	} else {
		unselectAll("ailmentImunities");
		select("ailmentImunities", ailmentList.slice(0, 8));
	}

	if (deathSelected) {
		select("ailmentImunities", ["death"]);
	}

	onGoalChange();
}

function readItemsExcludeInclude() {
	dataStorage.exludeEventEquipment = $("#exludeEvent").prop('checked');
	dataStorage.excludeTMR5 = $("#excludeTMR5").prop('checked');
	dataStorage.excludeNotReleasedYet = $("#excludeNotReleasedYet").prop('checked');
	dataStorage.excludePremium = $("#excludePremium").prop("checked");
	dataStorage.excludeSTMR = $("#excludeSTMR").prop("checked");
	dataStorage.includeTMROfOwnedUnits = $("#includeTMROfOwnedUnits").prop("checked");
	dataStorage.includeTmrMoogles = $("#includeTmrMoogles").prop("checked");
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
    var lbShardsPerTurn = parseFloat($(".unitStats .stat.lbShardsPerTurn .buff input").val());
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
    builds[currentUnitIndex].baseValues["drawAttacks"] = parseInt($(".unitStats .stat.drawAttacks .buff input").val()) || 0;
    builds[currentUnitIndex].baseValues["lbDamage"] = parseInt($(".unitStats .stat.lbDamage .buff input").val()) || 0;
    builds[currentUnitIndex].innateElements = getSelectedValuesFor("elements");
    builds[currentUnitIndex].baseValues["currentStack"] = parseInt($(".unitStack input").val()) || 0;
    builds[currentUnitIndex].baseValues["killerBuffs"] = [];
    killerList.forEach(killer => {
        let physical = parseInt($(".killerBuffs.physical ." + killer + " input").val()) || 0;
        let magical = parseInt($(".killerBuffs.magical ." + killer + " input").val()) || 0;

        if (physical || magical) {
            let killerData = {'name':killer};
            if (physical) {
                killerData.physical = physical;
            }
            if (magical) {
                killerData.magical = magical;
            }
            builds[currentUnitIndex].baseValues["killerBuffs"].push(killerData);
        }
    });
}



function getPlaceHolder(type) {
    return {"name":"Any " + type,"type":type, "placeHolder":true};
}


function readEnnemyStats() {
    var ennemyResist = {};
    var negativeImperil = false;
    var ennemyImperils = {"fire":0, "ice":0, 'lightning':0, 'water':0, 'earth':0, 'wind':0, 'light':0, 'dark':0};
    for(var elementIndex = elementList.length; elementIndex--;) {
        var element = elementList[elementIndex];
        var resistInput = $("#elementalResists ." + element + " input.elementalResist");
        var resistValue = resistInput.val();
        resistInput.removeClass("buff debuff");
        if (resistValue) {
            ennemyResist[element] = parseInt(resistValue);
            if (ennemyResist[element] < 0) {
                resistInput.addClass("debuff");
            } else if (ennemyResist[element] > 0) {
                resistInput.addClass("buff");
            }
        } else {
            ennemyResist[element] = 0;
        }

        var imperilInput = $("#elementalResists ." + element + " input.imperil");
        var imperilValue = imperilInput.val();
        imperilInput.removeClass("buff debuff");
        if (imperilValue) {
            ennemyImperils[element] = parseInt(imperilValue);
            if (ennemyImperils[element] < 0) {
                negativeImperil = true;
                imperilInput.addClass("buff");
            } else if (ennemyImperils[element] > 0) {
                imperilInput.addClass("debuff");
            }
        } else {
            ennemyImperils[element] = 0;
        }
    }
    var ennemyRaces = getSelectedValuesFor("races");
    var monsterAtk = 100;
    var monsterMag = 100;
    var monsterDef = 100;
    var monsterSpr = 100;
    if ($("#monsterStats .atk .stat").val()) {
        monsterAtk = parseInt($("#monsterStats .atk .stat").val());
    }
    if ($("#monsterStats .mag .stat").val()) {
        monsterMag = parseInt($("#monsterStats .mag .stat").val());
    }
    if ($("#monsterStats .def .stat").val()) {
        monsterDef = parseInt($("#monsterStats .def .stat").val());
    }
    if ($("#monsterStats .spr .stat").val()) {
        monsterSpr = parseInt($("#monsterStats .spr .stat").val());
    }
    var ennemyBreaks = {"atk":0, "def":0, "mag":0, "spr":0};
    if ($("#monsterStats .atk .break").val()) {
        ennemyBreaks.atk = parseInt($("#monsterStats .atk .break").val());
    }
    if ($("#monsterStats .mag .break").val()) {
        ennemyBreaks.mag = parseInt($("#monsterStats .mag .break").val());
    }
    if ($("#monsterStats .def .break").val()) {
        ennemyBreaks.def = parseInt($("#monsterStats .def .break").val());
    }
    if ($("#monsterStats .spr .break").val()) {
        ennemyBreaks.spr = parseInt($("#monsterStats .spr .break").val());
    }
    var enemyBuffs = {"atk":0, "def":0, "mag":0, "spr":0};
    if ($("#monsterStats .atk .buff").val()) {
        enemyBuffs.atk = parseInt($("#monsterStats .atk .buff").val());
    }
    if ($("#monsterStats .mag .buff").val()) {
        enemyBuffs.mag = parseInt($("#monsterStats .mag .buff").val());
    }
    if ($("#monsterStats .def .buff").val()) {
        enemyBuffs.def = parseInt($("#monsterStats .def .buff").val());
    }
    if ($("#monsterStats .spr .buff").val()) {
        enemyBuffs.spr = parseInt($("#monsterStats .spr .buff").val());
    }
    var enemyBreakabilities = {"atk":true, "def":true, "mag":true, "spr":true};
    if ($("#monsterStats .atk .breakIcon").hasClass("glyphicon-ban-circle")) {
        enemyBreakabilities.atk = false;
    }
    if ($("#monsterStats .mag .breakIcon").hasClass("glyphicon-ban-circle")) {
        enemyBreakabilities.mag = false;
    }
    if ($("#monsterStats .def .breakIcon").hasClass("glyphicon-ban-circle")) {
        enemyBreakabilities.def = false;
    }
    if ($("#monsterStats .spr .breakIcon").hasClass("glyphicon-ban-circle")) {
        enemyBreakabilities.spr = false;
    }
    ennemyStats = new EnnemyStats(getSelectedValuesFor("races"), monsterAtk, monsterMag, monsterDef, monsterSpr, ennemyResist, ennemyBreaks, enemyBuffs, enemyBreakabilities, ennemyImperils, monsterAttackFormula);

    $("#negativeBreakImperilWarning").toggleClass("hidden", ennemyBreaks.atk >= 0 && ennemyBreaks.def >= 0 && ennemyBreaks.mag >= 0 && ennemyBreaks.spr >= 0 && !negativeImperil);

}


function getFixedItemItemSlot(item, equipable, fixedItems) {
    var slot = -1;
    var forceDoubleHand = $("#forceDoublehand").prop('checked');
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
    for (var statIndex = 0, len = baseStats.length; statIndex < len; statIndex++) {
        var result = calculateStatValue(build, baseStats[statIndex], builds[currentUnitIndex]);
        values[baseStats[statIndex]] = result.total;

        $("#resultStats ." + escapeDot(baseStats[statIndex]) + " .value").html(Math.floor(result.total));
        var bonusTextElement = $("#resultStats ." + escapeDot(baseStats[statIndex]) + " .bonus");

        var bonusPercent;
        if (result.bonusPercent > getStatBonusCap(baseStats[statIndex])) {
            bonusPercent = "<span style='color:red;' title='Only " + getStatBonusCap(baseStats[statIndex]) + "% taken into account'>" + result.bonusPercent + "%</span>";
        } else {
            bonusPercent = result.bonusPercent + "%";
        }

        var upperCaseStat = baseStats[statIndex].toUpperCase();
        if (baseStats.includes(baseStats[statIndex])) {
            var equipmentFlatStatBonus = Math.round((getEquipmentStatBonus(build, baseStats[statIndex], false) - 1) * 100);
            if (equipmentFlatStatBonus > 0) {
                bonusTextElement.attr("title", `(${upperCaseStat} increase % - Equipped ${upperCaseStat} (DH) increase %) modifiers, capped individually.`);
                bonusPercent += "&nbsp;-&nbsp;";
                var cap = getStatBonusCap('tdh');
                if (build[0] && build[1] && weaponList.includes(build[0].type) && weaponList.includes(build[1].type)) {
                    cap = builds[currentUnitIndex].tdwCap * 100;
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
        $("#resultStats ." + escapeDot(baseStats[statIndex]) + " .bonus").html(bonusPercent);
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
    displayStat("#resultStats .physicaleHp", Math.floor(values["def"] * values["hp"] / pMitigation).toLocaleString());
    displayStat("#resultStats .magicaleHp", Math.floor(values["spr"] * values["hp"] / mMitigation).toLocaleString());
    displayStat("#resultStats .evade_physical", calculateStatValue(build, "evade.physical", builds[currentUnitIndex]).total);
    displayStat("#resultStats .evade_magical", calculateStatValue(build, "evade.magical", builds[currentUnitIndex]).total);
    displayStat("#resultStats .mpRefresh", Math.floor(values["mp"] * calculateStatValue(build, "mpRefresh", builds[currentUnitIndex]).total / 100));
    displayStat("#resultStats .lbPerTurn", calculateStatValue(build, "lbPerTurn", builds[currentUnitIndex]).total);
    displayStat("#resultStats .lbFillRate", calculateStatValue(build, "lbFillRate", builds[currentUnitIndex]).total);
    displayStat("#resultStats .evoMag", calculateStatValue(build, "evoMag", builds[currentUnitIndex]).total);
    displayStat("#resultStats .evokeDamageBoost_all", calculateStatValue(build, "evokeDamageBoost.all", builds[currentUnitIndex]).total);
    displayStat("#resultStats .accuracy", calculateStatValue(build, "accuracy", builds[currentUnitIndex]).total);
    displayStat("#resultStats .drawAttacks", calculateStatValue(build, "drawAttacks", builds[currentUnitIndex]).total);
    displayStat("#resultStats .jumpDamage", calculateStatValue(build, "jumpDamage", builds[currentUnitIndex]).total, 'jumpDamage');
    displayStat("#resultStats .lbDamage", calculateStatValue(build, "lbDamage", builds[currentUnitIndex]).total, 'lbDamage');


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
    if (importantStats.includes('lbPerTurn')) {
        $("#resultStats .lbFillRate .value").addClass("statToMaximize");
    }

    if (!value) {
        value = calculateBuildValueWithFormula(build, builds[currentUnitIndex], ennemyStats, builds[currentUnitIndex].formula, goalVariation, useNewJpDamageFormula, false, true);
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
    $("#resultStats .damageTaken .calcValue").html(Math.floor(calculateMonsterDamage(monsterAttackFormula, build, builds[currentUnitIndex], ennemyStats).max).toLocaleString());
    $("#resultStats .monsterDefValue").text(" " + ennemyStats.def);
    $("#resultStats .monsterSprValue").text(" " + ennemyStats.spr);
    $("#resultStats .damageCoef").html("1x");
}

function displayStat(htmlClass, value) {
    if (value === 0 || value === "0") {
        $(htmlClass).addClass("hidden");
    } else {
        let div = $(htmlClass);
        div.removeClass("hidden");
        div.find('.value').html(value);
    }
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
        valueString = '<span class="goal">' + valueToDisplay.toLocaleString() + '</span>';
    } else {
        valueString = '<span class="min ' + ((goalVariation == "min") ? "goal":"")  + '">' + Math.floor(value.min).toLocaleString() + "</span> - " +
            '<span class="avg ' + ((goalVariation == "avg") ? "goal":"")  + '">' + Math.floor(value.avg).toLocaleString() + "</span> - " +
            '<span class="max ' + ((goalVariation == "max") ? "goal":"")  + '">' + Math.floor(value.max).toLocaleString() + "</span>";
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

/* Output the Build-Suggested Equipment ---------------------------- */
function getItemLine(index, short = false) {
	var item = builds[currentUnitIndex].build[index];

	var htmlAction = '',
			htmlItem   = '',
			htmlInfo   = '';

	if (!item && builds[currentUnitIndex].fixedItems[index]) {
		item = builds[currentUnitIndex].fixedItems[index];
	}

	if (item && item.type == "unavailable") {
		return "";
	}

	if (index >= 0 && builds[currentUnitIndex].fixedItems[index]) {
		htmlAction += '<div class="col-1 actions">';
		htmlAction += '  <button class="btn btn-xs btn-ghost unpin" data-toggle="tooltip" title="Unpin this Item" onclick="removeFixedItemAt(\'' + index +'\')"><span class="fa fa-thumbtack fa-fw" data-fa-transform="flip-v flip-h"></span></button>';
		htmlAction += '  <button class="btn btn-xs btn-ghost remove" data-toggle="tooltip" title="Remove this Item" onclick="removeItemAt(\'' + index +'\')"><span class="fa fa-trash fa-fw"></span></button>';

		if (weaponList.includes(item.type)) {
			htmlAction += '<button class="btn btn-xs btn-ghost actions" data-toggle="tooltip" title="Modify this Weapon Enchantment" onclick="currentItemSlot = ' + index + ';selectEnchantement(getRawItemForEnhancements(builds[currentUnitIndex].fixedItems[' + index + ']))"><span class="fa fa-magic fa-fw"></span></button>';
		}

		htmlAction += '</div>';

	} else if (!item) {
		htmlItem += '<div class="col-auto type slot" onclick="displayFixItemModal(' + index + ');">'+ getSlotIcon(index) + '</div>';
		htmlItem += '<div class="col name slot">'+ getSlotName(index) + '</div>';

	} else if (!item.placeHolder) {
		var enhancementText = item.enhancements ? JSON.stringify(item.enhancements).replace(/\"/g, "'") : false;

		htmlAction += '<div class="col-1 actions">';
		htmlAction += '  <button class="btn btn-xs btn-ghost pin" data-toggle="tooltip" title="Pin this Item" onclick="fixItem(\'${item.id}\', ${index}, ${enhancementText});"><span class="fa fa-thumbtack fa-fw"></span></button>';
		htmlAction += '  <button class="btn btn-xs btn-ghost excludeItem" data-toggle="tooltip" title="Exclude this item from builds" onclick="excludeItem(\'' + item.id +'\', ' + index + ')"><span class="fa fa-ban fa-fw"></span></button>';

		if (weaponList.includes(item.type)) {
			htmlAction += '<button class="btn btn-xs btn-ghost actions itemEnchantmentButton" data-toggle="tooltip" title="Modify this Weapon Enchantment" onclick="currentItemSlot = ' + index + ';selectEnchantement(getRawItemForEnhancements(builds[currentUnitIndex].build[' + index + ']))"><span class="fa fa-magic fa-fw"></span></button>';
		}

		htmlAction += '</div>';
	}

	if (item) {
		if (short) {
			htmlItem += '<div class="col-auto change" onclick="displayFixItemModal(' + index + ');">' + getImageHtml(item, "", false) + '</div>';
			htmlItem += '<div class="col">' + getNameColumnHtml(item) + '</div>';
		} else {
			htmlItem += '<div class="col">' + displayItemLine(item, 'displayFixItemModal(' + index + ');') + '</div>';
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
					htmlInfo += '<div class="col-auto"><div class="icon icon-sm crystal-tmr" data-toggle="tooltip" title="TMR you may want to farm. TMR of ' + units[item.tmrUnit].name + '"/></div></div>';
				} else if (item.access.includes("trial")) {
					htmlInfo += '<div class="col-auto"><div class="icon icon-sm access-event" data-toggle="tooltip" title="Trial reward"/></div></div>';
				}
			}
		}
	}

	var html  = '<div class="form-row align-items-center unitBuildItem">';
			html +=    htmlAction;
			html +=    htmlItem;
			html +=    htmlInfo;
			html += '</div>';

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
	var icon = '<i class="icon slot-';

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
	let selector = $("#unitsSelect");

	selector.empty();
	selector.removeData();
	selector.html(getUnitSelectOptions());
	selector.on("select2:select", async () => await onUnitChange());

	selector.on('select2:open', function (e) {
		var labelCode  = '<div class="custom-control custom-switch mx-2 mb-1">';
				labelCode += '  <input type="checkbox" class="custom-control-input" name="displayOnly7StarsUnits" autocomplete="off" id="displayOnly7StarsUnits" ' + (displayOnly7StarsUnits ? 'checked' : '') + '>';
				labelCode += '  <label class="custom-control-label" for="displayOnly7StarsUnits">Only 7<span class="fa fa-star fa-fw"></span> units</label></div>';
				labelCode += '</div>';

		$(labelCode)
			.insertAfter(".select2-search")
			.on('mousedown mouseup click', function(e) { e.stopPropagation(); })
			.children('input')
			.on('change', function(e) {
				displayOnly7StarsUnits = !displayOnly7StarsUnits;
				refreshUnitSelect();
				e.stopPropagation();
			});
			selector.off("select2:open");
		});

		selector.select2({
			placeholder: 'Select a unit...',
			theme: 'bootstrap4'
		});
}

function refreshUnitSelect() {
    var selector = $("#unitsSelect");
    $("#displayOnly7StarsUnits").prop("checked", displayOnly7StarsUnits);
    selector.html(getUnitSelectOptions());
    selector.trigger('change');
    selector.select2('close');
    selector.select2('open');
}

function getUnitSelectOptions() {
    var options = '<option value=""></option>';
    Object.keys(units).sort(function(id1, id2) {
        return units[id1].name.localeCompare(units[id2].name);
    }).forEach(function(value, index) {
        if (displayOnly7StarsUnits && units[value].max_rarity != 7 && units[value].max_rarity != 'NV') {
            return;
        }
        options += '<option value="'+ value + '">'
            + units[value].name
            + (!displayOnly7StarsUnits && units[value]["6_form"] && units[value].max_rarity == 7 ? ' ' + units[value].max_rarity + '★ ' : "")
            + (units[value].max_rarity == 'NV' && units[value]["7_form"] ? ' NV ' : "")
            + ((server != 'JP' && (units[value].unreleased7Star || units[value].jpname)) ? ' - JP data' : "")
            + '</option>';
        if (units[value]["7_form"]) {
            options += '<option value="'+ value + '-7">' + units[value]["7_form"].name + ' 7★</option>';
        }
        if (!displayOnly7StarsUnits && units[value]["6_form"]) {
            options += '<option value="'+ value + '-6">' + units[value]["6_form"].name + ' 6★</option>';
        }
    });
    return options;
}

function selectUnitDropdownWithoutNotify(unitId) {
    // Set value, then trigger change by notifying only Select2 with its scoped event
    // Avoid triggering our own change event
    $('#unitsSelect').val(unitId).trigger('change.select2');
}

async function selectUnit(unitId) {
    $('#unitsSelect').val(unitId);
    $('#unitsSelect').trigger('change');
    await onUnitChange();
}

function goalSelectTemplate(state) {
    if (!state.id) return state.text;
    let unitWithSkills = unitsWithSkills[builds[currentUnitIndex].unit.id];
    var html;
    if (state.id == "LB") {
        html = '<img class="selectIcon" src="/assets/game/icons/lb.png"> ' + state.text;
        var formula = formulaFromSkill(unitWithSkills.lb);
        if (formula.notSupported) {
            html = html.replace("- Not supported yet", "<span class='badge notSupportedTag'>Not yet</span>");
        } else {
            html = html.replace("(Limit Burst)", "<span class='badge lbTag'>Limit burst</span>");
        }
    } else if (state.id == "LB_REPLACED") {
        html = '<img class="selectIcon" src="/assets/game/icons/lb.png"> ' + state.text;
        skillLoop: for (var skillIndex = unitWithSkills.passives.length; skillIndex--;) {
            var passive = unitWithSkills.passives[skillIndex];
            for (var effectIndex = passive.effects.length; effectIndex--;) {
                var effect = passive.effects[effectIndex].effect;
                if (effect && effect.replaceLb) {
                    var formula = formulaFromSkill(effect.replaceLb);
                    html += '<span class="upgradedSkillIcon" title="Upgraded LB">☆</span>';
                    if (formula.notSupported) {
                        html = html.replace("- Not supported yet", "<span class='badge notSupportedTag'>Not yet</span>");
                    } else {
                        html = html.replace("(Limit Burst)", "<span class='badge lbTag'>Limit burst</span>");
                    }
                    break skillLoop;
                }
            }
        }

    } else if (state.id.startsWith("SKILL_")) {
        var skill = getSkillFromId(state.id.substr(6), unitWithSkills);
        if (skill) {
            html = '<img class="selectIcon" src="/assets/game/items/' + skill.icon + '"> ' + state.text;


            if (skill.ifUsedLastTurn) {
                unlockers = "if " + skill.ifUsedLastTurn.map(x => x.name).sort().filter((item, pos, ar) => {return !pos || item != ar[pos -1]}).join(",") + " used last turn";
                html += '<span class="upgradedSkillIcon" title="' + unlockers + '">☆</span>';
            }

            var formula = formulaFromSkill(skill, true);
            if (formula.notSupported) {
                html = html.replace("- Not supported yet", "<span class='badge notSupportedTag'>Not yet</span>");
            } else {
                if (skill.magic) {
                    html += "<span class='badge magicTag'>magic</span>";
                } else {
                    html += "<span class='badge skillTag'>skill</span>";
                }
            }
        } else {
            html = state.text;
        }
    } else if (state.id.startsWith("MULTICAST_")) {
        var skill = getSkillFromId(state.id.substr(10), unitWithSkills);
        if (skill) {
            html = '<img class="selectIcon" src="/assets/game/items/' + skill.icon + '"> ' + state.text + "<span class='badge multicastTag'>multicast</span>";
        } else {
            html = state.text;
        }
    } else {
        html = state.text;
        switch (state.id) {
            case "physicalDamage":
            case "magicalDamage":
            case "hybridDamage":
            case "jumpDamage":
            case "magDamageWithPhysicalMecanism":
            case "sprDamageWithPhysicalMecanism":
            case "defDamageWithPhysicalMecanism":
            case "atkDamageWithMagicalMecanism":
            case "sprDamageWithMagicalMecanism":
            case "atkDamageWithFixedMecanism":
            case "physicalDamageMultiCast":
            case "fixedDamageWithPhysicalMecanism":
            case "summonerSkill":
                html += "<span class='badge damageTag'>damage</span>";
                break;
            case "physicaleHp":
            case "magicaleHp":
            case "atk":
            case "mag":
            case "def":
            case "spr":
            case "hp":
            case "mp":
            case "physicalEvasion":
            case "magicalEvasion":
            case "mpRefresh":
            case "heal":
                html += "<span class='badge statTag'>stat</span>";
                break;
            default:
                break;
        }
    }
    return $('<div class="selectSkillItem">' + html + '</div>');
}

function onUnitChange() {
    return new Promise(async resolve => {
        if ($("#unitsSelect").find(':selected').length > 0) {
            var unitId = $("#unitsSelect").val();
            if (unitId === '777700004') {
                $('#exportForBattle').removeClass('hidden');
            } else {
                $('#exportForBattle').addClass('hidden');
            }
            var selectedUnitData;
            let iconId;
            let unitWithSkillsId = unitId;
            if (unitId.endsWith("-6")) {
                unitWithSkillsId = unitId.substr(0, unitId.length - 2);
                selectedUnitData = units[unitId.substr(0, unitId.length - 2)]["6_form"];
                iconId = unitId.substr(0, unitId.length - 3) + '6';
            } else if (unitId.endsWith("-7")) {
                unitWithSkillsId = unitId.substr(0,unitId.length-2);
                selectedUnitData = units[unitId.substr(0,unitId.length-2)]["7_form"];
                iconId = unitId.substr(0,unitId.length-3) + '7';
            } else {
                selectedUnitData = units[unitId];
                iconId = unitId.substr(0,unitId.length-1) + (selectedUnitData.max_rarity == 'NV' ? '7' : selectedUnitData.max_rarity);
            }
            if (selectedUnitData) {
                let unitWithSkills = await ensureInitUnitWithSkills(unitWithSkillsId);
                $("#unitTabs .tab_" + currentUnitIndex + " button").html('<img src="/assets/game/units/unit_icon_' + iconId + '.png" />' + selectedUnitData.name);
                var sameUnit = (builds[currentUnitIndex].unit && builds[currentUnitIndex].unit.id == selectedUnitData.id && builds[currentUnitIndex].unit.sixStarForm == selectedUnitData.sixStarForm);
                var oldValues = builds[currentUnitIndex].baseValues;
                var oldLevel = builds[currentUnitIndex]._level;

                reinitBuild(currentUnitIndex);
                var unitData = selectedUnitData;
                if (unitData.enhancements) {
                    unitData = JSON.parse(JSON.stringify(unitData));
                    unitData.enhancementLevels = [];
                    for (var i = unitData.enhancements.length; i--;) {
                        var enhancementLevel = unitData.enhancements[i].levels.length - 1;
                        if (sameUnit && $("#enhancement_" + i).val()) {
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

                $(".unit").removeClass("hidden");
                $(".goalLine").removeClass("hidden");
                $(".simpleConditions").removeClass("hidden");

                builds[currentUnitIndex].goal = null;
                updateGoal();
                readGoal();

                recalculateApplicableSkills();
                logCurrentBuild();

                if (itemInventory) {
                    $("#saveTeamButton").removeClass("hidden");
                }
            } else {
                builds[currentUnitIndex].setUnit(null);
                reinitBuild(currentUnitIndex);
                updateUnitStats();
                $(".unit").addClass("hidden");
                $(".goalLine").addClass("hidden");
                $(".simpleConditions").addClass("hidden");
            }
            displayUnitRarity(selectedUnitData);
            displayUnitEnhancements();
            if (window !== window.parent) {
                window.parent.postMessage(JSON.stringify({'type':'unitSelected', 'value':''}), '*');
            }
        }
        resolve();
    });
}

function updateGoal() {

    var choiceSelect = $("#normalGoalChoice");
    updateSkillSelectOptions(choiceSelect);

    if (builds[currentUnitIndex].unit) {
        let unitWithSkills = unitsWithSkills[builds[currentUnitIndex].unit.id];

        var selectedSkill;
        var chainMultiplier;
        if (builds[currentUnitIndex].goal == "custom" && builds[currentUnitIndex]._formula && isSimpleFormula(builds[currentUnitIndex]._formula)) {
            var base = builds[currentUnitIndex]._formula;
            if (base.type == "condition") {
                base = base.formula;
            }
            if (base.type == "*") {
                base = base.value2;
            }
            if (base.type == "multicast" || base.type == "skill") {
                selectedSkill = base;
            }
            chainMultiplier = getChainMultiplier(builds[currentUnitIndex]._formula);
        }
        var multicastedSkills;
        if (selectedSkill) {
            if (selectedSkill.type == "skill") {
                if (selectedSkill.lb) {
                    if (selectedSkill.replacedLb) {
                        choiceSelect.val("LB_REPLACED");
                    } else {
                        choiceSelect.val("LB");
                    }
                } else if (selectedSkill.id && selectedSkill.id != "0") {
                    choiceSelect.val("SKILL_" + selectedSkill.id);
                } else {
                    choiceSelect.val(selectedSkill.formulaName);
                }
            } else {
                // multicast.
                multicastedSkills = [];
                for (var i = 0, len = selectedSkill.skills.length; i < len; i++) {
                    multicastedSkills.push(getSkillFromId(selectedSkill.skills[i].id, unitWithSkills));
                }
                multicastSkill = getMulticastSkillAbleToMulticast(multicastedSkills, unitWithSkills);
                if (multicastSkill) {
                    choiceSelect.val("MULTICAST_" + multicastSkill.id);
                }
            }
            if (chainMultiplier) {
                $(".goal .chainMultiplier input").val(chainMultiplier);
                $(".goal .chainMultiplier").removeClass('hidden');
            }
        } else {
            if (!builds[currentUnitIndex].goal) {
                choiceSelect.val("physicalDamage");
            } else if (builds[currentUnitIndex].goal != 'custom') {
                choiceSelect.val(builds[currentUnitIndex].goal);
            } else {
                let formula = builds[currentUnitIndex].formula;
                if (formula.type == 'condition') {
                    formula = formula.formula;
                }
                let formulaString = JSON.stringify(formula);
                goal = Object.keys(formulaByGoal).find(goal => {
                    return JSON.stringify(formulaByGoal[goal]) == formulaString;
                });

                if (goal) {
                    $(".goal #normalGoalChoice").val(goal);
                } else {
                   choiceSelect.val("physicalDamage");
                }
            }
        }
        manageMulticast(multicastedSkills);

        if (builds[currentUnitIndex].goal == 'custom' && !isSimpleFormula(builds[currentUnitIndex]._formula)) {
            $('.normalGoalChoices').addClass("hidden");
            $('.customGoalChoice').removeClass("hidden");
            $("#customGoalFormula").text(formulaToString(builds[currentUnitIndex]._formula));
            customFormula = builds[currentUnitIndex]._formula;
            $(".goal .chainMultiplier").addClass("hidden");
        } else {
            $('.normalGoalChoices').removeClass("hidden");
            $('.customGoalChoice').addClass("hidden");
            $(".goal .chainMultiplier").remove("hidden");
        }
    }

    updateSimpleConditionsFromFormula(currentUnitIndex);

    if (choiceSelect.hasClass("select2-hidden-accessible")) {
        choiceSelect.select2('destroy');
    }
    choiceSelect.select2({
        placeholder: 'Select a goal...',
        theme: 'bootstrap4',
        minimumResultsForSearch: Infinity,
        templateSelection: goalSelectTemplate,
        templateResult: goalSelectTemplate
    });
}

function updateSkillSelectOptions(skillSelect) {
    skillSelect.empty();
    if (builds[currentUnitIndex].unit) {
        let unitWithSkills = unitsWithSkills[builds[currentUnitIndex].unit.id];

        for (var selectDefaultIndex = goalQuickSelectDefaultValues.length - 1; selectDefaultIndex >= 0; selectDefaultIndex--) {
            skillSelect.append($("<option></option>").attr("value", goalQuickSelectDefaultValues[selectDefaultIndex][0]).text(goalQuickSelectDefaultValues[selectDefaultIndex][1]));
        }

        var formula = formulaFromSkill(unitWithSkills.lb);
        if (formula) {
            var option = '<option value="LB" ' + (formula.notSupported ? "disabled":"") + '>' + unitWithSkills.lb.name + " (Limit Burst)" + (formula.notSupported ? " - Not supported yet":"") + '</option>';
            skillSelect.append(option);
        }
        for (var skillIndex = unitWithSkills.passives.length; skillIndex--;) {
            var passive = unitWithSkills.passives[skillIndex];
            for (var effectIndex = passive.effects.length; effectIndex--;) {
                var effect = passive.effects[effectIndex].effect;
                if (effect && effect.replaceLb) {
                    var formula = formulaFromSkill(effect.replaceLb);
                    if (formula) {
                        var option = '<option value="LB_REPLACED" ' + (formula.notSupported ? "disabled":"") + '>' + effect.replaceLb.name + " (Limit Burst)" + (formula.notSupported ? " - Not supported yet":"") + '</option>';
                        skillSelect.append(option);
                    }
                }
            }
        }
        for (var skillIndex = unitWithSkills.actives.length; skillIndex--;) {
            var formula = formulaFromSkill(unitWithSkills.actives[skillIndex]);
            if (formula) {
                var option = '<option value=' + '"SKILL_' + unitWithSkills.actives[skillIndex].id + '" ' + (formula.notSupported ? "disabled":"") + '>' + unitWithSkills.actives[skillIndex].name + (formula.notSupported ? " - Not supported yet":"") + '</option>';
                skillSelect.append(option);
            } else {
                // test for dualcast
                var skill = unitWithSkills.actives[skillIndex];
                for (var effectIndex = skill.effects.length; effectIndex--;) {
                    var effect = skill.effects[effectIndex].effect;
                    if (effect && effect.multicast) {
                        var option = '<option value="MULTICAST_' + skill.id + '">' + skill.name +'</option>';
                        skillSelect.append(option);
                    }
                }
            }
        }
        for (var skillIndex = unitWithSkills.magics.length; skillIndex--;) {
            var formula = formulaFromSkill(unitWithSkills.magics[skillIndex]);
            if (formula) {
                var option = '<option value=' + '"SKILL_' + unitWithSkills.magics[skillIndex].id + '" ' + (formula.notSupported ? "disabled":"") + '>' + unitWithSkills.magics[skillIndex].name + (formula.notSupported ? " - Not supported yet":"") + '</option>';
                skillSelect.append(option);
            }
        }
    }
}

function updateUnitLevelDisplay() {
    if (builds[currentUnitIndex].unit && (builds[currentUnitIndex].unit.max_rarity == 7 || builds[currentUnitIndex].unit.max_rarity == 'NV') && !builds[currentUnitIndex].unit.sixStarForm) {
        $("#unitLevel").removeClass("hidden");
        if (builds[currentUnitIndex]._level) {
            $("#unitLevel select").val(builds[currentUnitIndex]._level.toString());
        } else {
            $("#unitLevel select").val("120");
            builds[currentUnitIndex].setLevel(120);
        }
        if (builds[currentUnitIndex].unit.max_rarity == 'NV' && !builds[currentUnitIndex].unit.sevenStarForm) {
            $("#unitExAwakeningLevel").removeClass("hidden");
            if (builds[currentUnitIndex]._exAwakeningLevel) {
                $("#unitExAwakeningLevel select").val(builds[currentUnitIndex]._exAwakeningLevel.toString());
            } else {
                $("#unitExAwakeningLevel select").val("0");
            }
        }
    } else {
        $("#unitLevel").addClass("hidden");
    }
}

function displayUnitEnhancements() {
	$('#unitEnhancements').empty();

	if (builds[currentUnitIndex].unit && builds[currentUnitIndex].unit.enhancements) {
		var html  = '  <label class="col-form-label col-2">Enhancement</label>'
				html += '   <div class="col">';
				html += '    <div class="form-row">';

		for (var i = 0, len = builds[currentUnitIndex].unit.enhancements.length; i < len; i++) {
			var enhancement = builds[currentUnitIndex].unit.enhancements[i];

			html += '<div class="col-6 mb-1 unitEnhancement">';
			html += '  <select class="custom-select custom-select-sm" onchange="onUnitChange().then(() => {});" id="enhancement_' + i + '">';

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
				} else if (enhancement.levels.length == 4 && enhancement.levels[0].length == 0) {
					// latent skills
					if (j == 0) {
						html += '>' + enhancement.name + ' not unlocked</option>';
					} else if (j == 1) {
						html += '>' + enhancement.name + '</option>';
					} else {
						html += '>' + enhancement.name + ' +' + (j-1) + '</option>';
					}
				} else {
					html += '>' + enhancement.name + ' +' + j + '</option>';
				}
			}
			html += '  </select>';
			html += '</div>';
		}

		html += '    </div>';
		html += '  </div>';

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
            updatePotStyle(stat);
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
    if (builds[currentUnitIndex].unit && builds[currentUnitIndex].baseValues["drawAttacks"]) {
        $(".unitStats .stat.drawAttacks .buff input").val(builds[currentUnitIndex].baseValues["drawAttacks"]);
    } else {
        $(".unitStats .stat.drawAttacks .buff input").val("");
    }
    if (builds[currentUnitIndex].unit && builds[currentUnitIndex].baseValues["lbDamage"]) {
        $(".unitStats .stat.lbDamage .buff input").val(builds[currentUnitIndex].baseValues["lbDamage"]);
    } else {
        $(".unitStats .stat.lbDamage .buff input").val("");
    }
    populateUnitEquip();
    if (builds[currentUnitIndex].unit) {
        let equipmentBoost = [];
        builds[currentUnitIndex].unit.skills
            .filter(skill => skill.equipedConditions)
            .forEach(skill => {
           equipmentBoost = equipmentBoost.concat(skill.equipedConditions);
        });

        builds[currentUnitIndex].unit.equip.forEach(equip => {
            let equipImg = $(".unitEquipable .equipment-" + equip);
            equipImg.removeClass("notEquipable");
            if (equipmentBoost.includes(equip)) {
                equipImg.addClass("boost");
            }
        });
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
    if (builds[currentUnitIndex].unit) {
        $(".unit .unitIcon").prop("src", "/assets/game/units/unit_icon_" + builds[currentUnitIndex].unit.id + ".png");
        $(".unit").removeClass("hidden");
    } else {
        $(".unit").addClass("hidden");
    }
    $('.killerBuffs input').val("");
    if (builds[currentUnitIndex].baseValues["killerBuffs"]) {
        builds[currentUnitIndex].baseValues["killerBuffs"].forEach(killerData => {
            if (killerData.physical)  {
                $('.killerBuffs.physical .' + killerData.name + ' input').val(killerData.physical);
            }
            if (killerData.magical) {
                $('.killerBuffs.magical .' + killerData.name + ' input').val(killerData.magical);
            }
        });
    }
    updateKillerBuffSummary();
    readStatsValues();

}

function reinitBuilds() {
	for (var i = builds.length; i-- > 1; ) {
		closeTab(i);
	}

	builds[0] = new UnitBuild(null, [null, null, null, null, null, null, null, null,null,null,null], {});
	builds[0].monsterAttackFormula = monsterAttackFormula;
	loadBuild(0);

	$(".goalLine").addClass("hidden");
	$(".simpleConditions").addClass("hidden");
}

function reinitBuild(buildIndex) {
	builds[buildIndex] = new UnitBuild(null, [null, null, null, null, null, null, null, null,null,null,null], {});
	builds[buildIndex].monsterAttackFormula = monsterAttackFormula;
	readGoal(buildIndex);
}

function loadBuild(buildIndex) {
	currentUnitIndex = buildIndex;
	
	var build = builds[buildIndex];
	var unitToSelect = null;

	if (build.unit) {
		unitToSelect = build.unit.id;

		if (build.unit.sixStarForm)   { unitToSelect += '-6'; }
		if (build.unit.sevenStarForm) { unitToSelect += '-7'; }
	}

	selectUnitDropdownWithoutNotify(unitToSelect);

	$(".unitAttackElement .elements label").removeClass("active");

	if (build.innateElements) {
		for (var i in build.innateElements) {
			$(".unitAttackElement .elements label:has(input[value=" + build.innateElements[i] + "])").addClass("active");
		}
	}

	updateUnitLevelDisplay();
	updateUnitStats();
	displayUnitEnhancements();
	customFormula = null;
	updateGoal();
	readGoal();

	if (builds[currentUnitIndex].unit) {
		logCurrentBuild();
		if (builds[currentUnitIndex].unit.id === '777700004') {
			$('#exportForBattle').removeClass('hidden');
		} else {
			$('#exportForBattle').addClass('hidden');
		}
	}
}

function addNewUnit(focusUnitSelect = true) {
	$("#unitTabs .nav-link").removeClass("active");

	let newId = builds.length;

	var newTab = $('<li class="nav-item tab_' + newId + '"><button type="button" class="nav-link active">Select Unit<span class="closeTab" onclick="closeTab()"><span class="fa fa-trash fa-fw"></span></span></button></li>');

	$("#unitTabs .tab_" + (newId - 1)).after(newTab);

	newTab.click(function() {
		selectUnitTab(newId);
	})

	builds.push(null);
	reinitBuild(builds.length - 1);

	$('#forceDoublehand').prop('checked', false);
	$('#forceDualWield').prop('checked', false);
	$('#tryEquipSources').prop('checked', false);

	loadBuild(builds.length - 1);

	if (builds.length > 9) {
		$("#addNewUnitButton").addClass("hidden");
	}

	selectUnitDropdownWithoutNotify(null);

	if (focusUnitSelect) {
		$('#unitsSelect').select2('open');
	}
}

function selectUnitTab(index) {
    $("#unitTabs .nav-link").removeClass("active");
    $("#unitTabs .tab_" + index + ' .nav-link').addClass("active");
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

		if (rarity == 'NV') {
			rarityWrapper.append('<img src="/assets/media/NV.png">');
		} else {
			var rStar = 'unitRarity-star',
					gStar = 'unitRarity-star inactive';

			for (var i = 0; i < 7; i++) {
				if (i <= rarity) {
					var rarityStar = rStar;
				} else {
					var rarityStar = gStar;
				}

				rarityWrapper.append('<span class="' + rarityStar + '"></span>');
			}
		}
			if (rarity == "7" || rarity == 'NV') {
				$('#forceTmrAbilityDiv').removeClass('hidden');
			} else {
				$('#forceTmrAbilityDiv').addClass('hidden');
				$("#tryReduceOverCap").prop('checked', false);
			}

	} else {
		rarityWrapper.hide();
		$('#forceTmrAbilityDiv').addClass('hidden');
		$("#tryReduceOverCap").prop('checked', false);
	}
};

function updateSavedTeamPanelVisibility() {
    if (itemInventory) {
        $("#savedTeamPanel").removeClass("hidden");
    } else {
        $("#savedTeamPanel").addClass("hidden");
    }
}

function onGoalChange() {
    readGoal();
    updateGoal();
    if (builds[currentUnitIndex].unit) {
        logCurrentBuild();
    }
}

function manageMulticast(selectedSkills) {
	$("#col-multicastSelect0, #col-multicastSelect1, #col-multicastSelect2, #col-multicastSelect3, #col-multicastSelect4").addClass("hidden");

	for (var i = 0; i < 5; i++) {
		var select = $('#multicastSelect' + i),
				column = $('#col-multicastSelect' + i);

		column.addClass("hidden");

		if ( select.hasClass("select2-hidden-accessible")) {
			select.select2('destroy');
		}

		select.empty();
		select.removeData();
	}

	if (!customFormula) {
		var goalValue = $("#normalGoalChoice").val();

		if (goalValue) {
			let unitWithSkills = unitsWithSkills[builds[currentUnitIndex].unit.id];

			if (goalValue.startsWith("MULTICAST_") && builds[currentUnitIndex].unit) {
				builds[currentUnitIndex].goal = "custom";

				var skillId = goalValue.substr(10);
				var skill = getSkillFromId(skillId, unitWithSkills);
				var multicastEffect;

				for (var i = skill.effects.length; i--;) {
					if (skill.effects[i].effect && skill.effects[i].effect.multicast) {
						multicastEffect = skill.effects[i].effect.multicast;
					}
				}

				var options = "";
				var skillSource;

				if (multicastEffect.type=="skills") {
					skillSource = multicastEffect.skills;
				} else {
					skillSource = unitWithSkills.magics;
				}

				for (var j = 0, lenj = skillSource.length; j < lenj; j++) {
					var dcSkill = getSkillFromId(skillSource[j].id, unitWithSkills);

					if (dcSkill) {
						if (multicastEffect.type=="whiteMagic" && (!dcSkill.magic || dcSkill.magic != "white")) {
							continue;
						}

						if (multicastEffect.type=="blackMagic" && (!dcSkill.magic || dcSkill.magic != "black")) {
							continue;
						}

						var dcFormula = formulaFromSkill(dcSkill, true);

						if (dcFormula) {
							options += '<option value=' + '"SKILL_' + dcSkill.id + '" ' + (dcFormula.notSupported ? "disabled":"") + '>' + dcSkill.name + (dcFormula.notSupported ? " - Not supported yet":"") + '</option>';
						}
					}
				}

				for (var i = 0, len = multicastEffect.time; i < len; i++) {
					var select = $('#multicastSelect' + i),
							column = $('#col-multicastSelect' + i);

					select.append(options);
					column.removeClass("hidden");

					if (selectedSkills && selectedSkills.length > i) {
						select.val("SKILL_" + selectedSkills[i].id);
					}

					select.select2({
						placeholder: 'Select a goal...',
						theme: 'bootstrap4',
						minimumResultsForSearch: Infinity,
						templateSelection: goalSelectTemplate,
						templateResult: goalSelectTemplate
					});

				}

				$('#multicastSkillsDiv').removeClass("hidden");

			}
		}
	}
}

function openCustomGoalModal() {
    $("#customFormulaModal").modal();
}

function chooseCustomFormula(optionalCustomFormula) {
    if (optionalCustomFormula) {
        var formulaString = optionalCustomFormula;
        var formulaConditionString = "";
    } else {
        var formulaString = $("#customFormulaModal #formulaInput").val();
        var formulaConditionString = $("#customFormulaModal #formulaConditionInput").val();
    }
    if (formulaConditionString && formulaConditionString.length > 0) {
        formulaString += ";" + formulaConditionString;
    }
    let unitWithSkills = unitsWithSkills[builds[currentUnitIndex].unit.id];
    var formula = parseFormula(formulaString, unitWithSkills);
    if (formula) {
        if (!isSimpleFormula(formula)) {
            customFormula = formula;
        } else {
            customFormula = null;
        }

        builds[currentUnitIndex].goal = "custom";
        builds[currentUnitIndex].formula = formula;
        $('#customFormulaModal').modal('hide');
        updateGoal();
        onGoalChange();
    }
}

function addToCustomFormula(string) {
    $("#customFormulaModal #formulaInput").val($("#customFormulaModal #formulaInput").val() + string);
}

function removeCustomGoal() {
    customFormula = null;
    builds[currentUnitIndex].goal = "physicalDamage";
    builds[currentUnitIndex].formula = formulaByGoal["physicalDamage"];
    updateGoal();
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
        $("#includeTmrMoogles").parent().addClass("hidden");
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
            $("#includeTmrMoogles").parent().removeClass("hidden");
        } else {
            $("#includeTMROfOwnedUnits").parent().addClass("hidden");
            $("#includeTmrMoogles").parent().addClass("hidden");
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
        $("#includeTmrMoogles").parent().addClass("hidden");
        $("#includeTrialRewards").parent().addClass("hidden");
        $("#includeChocoboItems").parent().addClass("hidden");
        $("#includeEasilyObtainableItems").parent().addClass("hidden");
        dataStorage.onlyUseOwnedItems = false;
        dataStorage.onlyUseShopRecipeItems = true;
    }
    updateEspers();
}

function updateSearchResult() {
    fixItemList.display([]);
    $("#fixItemModal").removeClass("showEnhancements");
    let onlyOwnedItems = $('#onlyOwnedItems input').prop('checked');
    let excludeNotReleasedYetOption = $('#excludeNotReleasedYetOption input').prop('checked');
    var searchText = $("#searchText").val();
    if ((searchText == null || searchText == "") && searchType.length == 0 && searchStat == "") {
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
    dataStorage.data.forEach(item => {
        if (!isApplicable(item, builds[currentUnitIndex].unit)) {
            // Don't display not applicable items
            return;
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
    });

    readItemsExcludeInclude();
    displaySearchResults(sort(filter(dataWithOnlyOneOccurence, onlyOwnedItems, searchStat, baseStat, searchText, builds[currentUnitIndex].unit.id, types, [], [], [], [], [], "", !excludeNotReleasedYetOption, true), builds[currentUnitIndex].unit.id));

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

function displayEquipableItemList(clickBehavior) {
    if (!builds[currentUnitIndex].unit) {
        Modal.showMessage("No unit selected", "Please select an unit");
        return;
    }

    builds[currentUnitIndex].prepareEquipable();
    dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);

    types = [];
    if (clickBehavior === ClickBehaviors.INCLUDE) {
        types = typeList;
    } else {
        for(var index = 0; index < 10; ++index) {
            var equipableSlot = builds[currentUnitIndex].equipable[index];
            if (equipableSlot.length == 0) {
                continue;
            }

            for(var i = 0; i < equipableSlot.length; ++i) {
                if(!types.includes(equipableSlot[i])) {
                    types.push(equipableSlot[i]);
                }
            }
        }
    }

    $("#searchText").val("");
    //$("#fixItemModal .results .tbody").html("");

    $("#fixItemModal").modal();
    if (!fixItemList) {
        fixItemList = new VirtualScroll($('#fixItemResults'), getItemHtml, 64, false);
    }
    populateItemType(types);
    selectSearchType(types);
    selectSearchStat(searchStat);
    selectSearchClickBehavior(clickBehavior);
    updateSearchResult();
}

function displayFixItemModal(slot) {
    if (!builds[currentUnitIndex].unit) {
        Modal.showMessage("No unit selected", "Please select an unit");
        return;
    }


    builds[currentUnitIndex].prepareEquipable(slot);
    if (builds[currentUnitIndex].equipable[slot].length == 0) {
        Modal.showMessage("Equipment error", "Nothing can be added at this slot");
        return;
    }
    currentItemSlot = slot;

    populateItemType(builds[currentUnitIndex].equipable[slot]);

    dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
    $("#searchText").val("");
    //$("#fixItemModal .results .tbody").html("");

    $("#fixItemModal").modal();
    if (!fixItemList) {
        fixItemList = new VirtualScroll($('#fixItemResults'), getItemHtml, 64, false);
    }
    let equipmentChoice = $(".equipments select").val();
    $('#onlyOwnedItems input').prop('checked', equipmentChoice == "owned" && equipmentChoice == "ownedAvailableForExpedition");
    $('#excludeNotReleasedYetOption input').prop('checked', dataStorage.excludeNotReleasedYet);

    selectSearchStat(searchStat);
    selectSearchType(builds[currentUnitIndex].equipable[slot]);
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
        } else if (espers.some(e => e.id == key))  {
            item = espersByName[key];
            if (!item) {
                item = espers.filter(e => e.id == key)[0];
            }
        } else if (key == "unavailable") {
            item = {"name":"Unavailable slot", "type":"unavailable", "placeHolder":true};
        } else {
            item = findBestItemVersion(builds[currentUnitIndex].build, dataStorage.allItemVersions[key][0], dataStorage.itemWithVariation, builds[currentUnitIndex].unit);
            if (enhancements) {
                if (enhancements.includes('rare')) {
                    enhancements[enhancements.indexOf('rare')] = 'rare_3';
                }
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
        adaptEsperMasteryToBuild();
        recalculateApplicableSkills();
        logCurrentBuild();
    }
    $('#fixItemModal').modal('hide');
    $('#modifyEnhancementModal').modal('hide');
}

function adaptEsperMasteryToBuild() {
    if (builds[currentUnitIndex].build[10]) {

        esper = getEsperItem(builds[currentUnitIndex].build[10].originalEsper);
        let typeCombination = [];
        builds[currentUnitIndex].build.forEach(i => {
            if (i && i.type && !typeCombination.includes(i.type)) {
                typeCombination.push(i.type);
            }
        });
        if (esper.conditional && esper.conditional.some(c => typeCombination.includes(c.equipedCondition))) {
            esper = JSON.parse(JSON.stringify(esper));
            esper.conditional.filter(c => typeCombination.includes(c.equipedCondition)).forEach(c => {
               baseStats.forEach(s => {
                   if (c[s+'%']) {
                       addToStat(esper, s+'%', c[s+'%']);
                   }
               })
            });
        }
        builds[currentUnitIndex].build[10] = esper;
    }
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
    adaptEsperMasteryToBuild();
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
    adaptEsperMasteryToBuild();
    recalculateApplicableSkills();
    logCurrentBuild();
}

function excludeItem(itemId, slot = -1) {
    if (!itemsToExclude.includes(itemId)) {
        for (var index = 0; index < 11; index++) {
            if (builds[currentUnitIndex].build[index] && builds[currentUnitIndex].build[index].id == itemId) {
                if (slot == index || builds[currentUnitIndex].fixedItems[index] == null) {
                    removeItemAt(index);
                }
            }
        }
        itemsToExclude.push(itemId);
    }
    $(".excludedItemNumber").html(itemsToExclude.length);
}

function includeItem(itemId) {
    if (!itemsToInclude.includes(itemId)) {
        itemsToInclude.push(itemId);
    }
    $(".includedItemNumber").html(itemsToInclude.length);
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
    fixItemList.display(items);

    setTimeout(() => $("#fixItemModal #fixItemResults")[0].scrollTop = 0, 100);

}

function toggleExclusionFromSearch(itemId) {
    if(itemsToExclude.includes(itemId)) {
        removeItemFromExcludeList(itemId);
    } else {
        excludeItem(itemId);
    }

    toggleExclusionIcon(itemId);
}

function toggleInclusionInSearch(itemId) {
    if(itemsToInclude.includes(itemId)) {
        removeItemFromIncludeList(itemId);
    } else {
        includeItem(itemId);
    }

    toggleInclusionIcon(itemId);
}

function displaySearchResultsAsync(items, start, div) {
    var end = Math.max(items.length, start + 20);
    var html = "";
    for (var index = start; index < end; index++) {
        var item = items[index];
        html += getItemHtml(item);
    }
    div.append(html);
    if (end < items.length) {
        setTimeout(displaySearchResultsAsync, 0, items, end, div);
    }
}

function getItemHtml(item) {
	let html = "";

	if (item) {
		var enhancementString = "null";
		var htmlClass = '';
		var htmlClick = '';
		var htmlInv   = '';

		if (item.enhancements || itemInventory && itemInventory.enchantments && itemInventory.enchantments[item.id]) {
			htmlClass += " enhanced";
		}

		if (item.enhancements) {
			enhancementString = JSON.stringify(item.enhancements).split('"').join("'");
		}

		var excluded = itemsToExclude.includes(item.id);
		var included = itemsToInclude.includes(item.id);

		$('#fixItemModal').removeClass('exclusion');
		$('#fixItemModal').removeClass('inclusion');

		if(searchClickBehavior == ClickBehaviors.IGNORE) {
			// Do nothing
		} else if (searchClickBehavior == ClickBehaviors.EXCLUDE) {
			htmlClick += ' onclick="toggleExclusionFromSearch(\'' + item.id + '\');"';
			$('#fixItemModal').addClass('exclusion');
		} else if (searchClickBehavior == ClickBehaviors.INCLUDE) {
			htmlClick += ' onclick="toggleInclusionInSearch(\'' + item.id + '\');"';
			$('#fixItemModal').addClass('inclusion');
		} else {
			htmlClick += ' onclick="fixItem(\'' + item.id + '\', ' + currentItemSlot + ', ' + enhancementString + ')"';
		}

		if (itemInventory) {
			var notEnoughClass = "badge-secondary";
			var numbers = dataStorage.getOwnedNumber(item);
			var owned = "";
		
			if (numbers.total > 0) {
				owned += numbers.available;
				if (numbers.available != numbers.total) {
					owned += "/" + numbers.total;
					if (numbers.available == 0) {
						notEnoughClass = "badge-dark ";
					}
				}

				htmlInv+= "<div class='inventory desktop text-center'><span class='d-block my-1 badge " + notEnoughClass + "'>" + owned + "</span></div>";
			}	
		}

		html += '<div class="col-12 col-md-6 mb-2">';
		html += '  <div class="ffbe_content--well p-2 h-100 rounded border selectable itemWrapper ' + htmlClass + '"' + htmlClick + '>';
		html += '    <div class="form-row">';

		if (searchClickBehavior == ClickBehaviors.INCLUDE) {
			html += '    <div class="col-auto include">' + getItemInclusionLink(item.id, included) + htmlInv + '</div>';
		} else {
			html += '    <div class="col-auto exclude">' + getItemExclusionLink(item.id, excluded) + htmlInv + '</div>';
		}

		html += '      <div class="col item">';
		html +=          displayItemLine(item, "", false);

		if (searchClickBehavior != ClickBehaviors.EXCLUDE && searchClickBehavior != ClickBehaviors.INCLUDE) {
			html+= "       <div class='getEnhancements'>" + getItemEnhancementLink(item) + "</div>";
		}

		html += '      </div>';
		html += '    </div>';
		html += '  </div>';
		html += '</div>';

		return html;
	}  
}

function getItemEnhancementLink(item) {
    var html = "";

    if (weaponList.includes(item.type)) {
        html += '<div class="getItemEnhancement"><i class="icon icon-sm tab-enhance" onclick="event.stopPropagation();selectEnchantedItem(\'' + item.id + '\')"></i>';
        if (itemInventory && itemInventory.enchantments && itemInventory.enchantments[item.id]) {
            html += "<span class='badge'>" + itemInventory.enchantments[item.id].length + "</span>"
        }
        html += "</div>"
    }

    return html;
}

function getItemExclusionLink(itemId, excluded) {
	var html = "";

	html += '<button type="button" class="btn btn-sm btn-ghost excludeItem false" onclick="event.stopPropagation(); toggleExclusionFromSearch(\'' + itemId + '\');" data-toggle="tooltip" title="Exclude this item in build calculations" style="' + (excluded ? 'display: none;' : '') + '"><i  class="excludeItem fas fa-ban false itemid' + itemId + '"></i></button>';
	html += '<button type="button" class="btn btn-sm btn-ghost excludeItem true" onclick="event.stopPropagation(); toggleExclusionFromSearch(\'' + itemId + '\');" data-toggle="tootlip" title="Include this item in build calculation again" style="' + (!excluded ? 'display: none;' : '') + '"><i class="excludeItem fas fa-ban true itemid' + itemId + '"></i></button>';

	return html;
}

function getItemInclusionLink(itemId, included) {
	var html = "";

	html += '<button type="button" class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); toggleInclusionInSearch(\'' + itemId + '\');" data-toggle="tooltip" title="Include this item in build calculations" style="' + (included ? 'display: none;' : '') + '"><i  class="includeItem fas fa-plus false itemid' + itemId + '"></i></button>';
	html += '<button type="button" class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); toggleInclusionInSearch(\'' + itemId + '\');" data-toggle="tootlip" title="Don\'t include this item in build calculation anymore" style="' + (!included ? 'display: none;' : '') + '"><i class="includeItem fas fa-plus true itemid' + itemId + '"></i></button>';

	return html;
}

function toggleExclusionIcon(itemId) {
    var excluded = itemsToExclude.includes(itemId);
    $('.excludeItem .btn-ghost.' + !excluded + '.itemid' + itemId).css('display', 'none');
    $('.excludeItem .btn-ghost.' + excluded + '.itemid' + itemId).css('display', 'inline');
}

function toggleInclusionIcon(itemId) {
    var included = itemsToInclude.includes(itemId);
    $('.includeItem .btn-ghost.' + !included + '.itemid' + itemId).css('display', 'none');
    $('.includeItem .btn-ghost.' + included + '.itemid' + itemId).css('display', 'inline');
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

	$("#modifyEnhancementModal .item").html(getImageHtml(currentEnchantmentItem) + getNameColumnHtml(currentEnchantmentItem));
	$("#modifyEnhancementModal .value.rare_3").html(itemEnhancementLabels["rare_3"][currentEnchantmentItem.type]);
	$("#modifyEnhancementModal .value.rare_4").html(itemEnhancementLabels["rare_4"][currentEnchantmentItem.type]);

	if (itemEnhancementLabels["special_1"][item.id]) {
		$("#modifyEnhancementModal .value.special_1").removeClass("hidden");
		$("#modifyEnhancementModal .value.special_1").html(itemEnhancementLabels["special_1"][item.id]);
	} else {
		$("#modifyEnhancementModal .value.special_1").addClass("hidden");
	}
}

function toggleItemEnhancement(enhancement) {
    var enhancements = currentEnchantmentItem.enhancements;
    if (enhancements.includes(enhancement)) {
        enhancements.splice(enhancements.indexOf(enhancement), 1);
    } else {
        if (enhancement == 'rare_3' && enhancements.includes('rare_4')) {
            enhancements.splice(enhancements.indexOf('rare_4'), 1);
        }
        if (enhancement == 'rare_4' && enhancements.includes('rare_3')) {
            enhancements.splice(enhancements.indexOf('rare_3'), 1);
        }
        if (enhancements.length == 3) {
            $.snack('warning', 'No more than 3 item enhancements can be selected', 5000);
            return;
        }
        enhancements.push(enhancement);
    }
    selectEnchantement(currentEnchantmentItem);
}

function pinChosenEnchantment() {
    if (currentEnchantmentItem.type == "fake") {
        setDefaultEnhancements(currentEnchantmentItem.enhancements);
        $('#modifyEnhancementModal').modal('hide');
    } else {
        fixItem(applyEnhancements(currentEnchantmentItem, currentEnchantmentItem.enhancements), currentItemSlot);
    }
}

function setDefaultEnhancements(enhancements) {
    defaultWeaponEnhancement = enhancements;
    dataStorage.setDefaultWeaponEnhancement(defaultWeaponEnhancement);
    $("#defaultWeaponEnhancement .display").html(getEnhancements({enhancements:enhancements}));
}

const stateHashCalculatedValues = {
    "physicalEvasion": "evade.physical",
    "magicalEvasion": "evade.magical",
    "drawAttacks": "drawAttacks",
    "lbDamage": "lbDamage",
    "mpRefresh": "mpRefresh",
    "lbFillRate": "lbFillRate",
    "lbPerTurn": "lbPerTurn",
    "jumpDamage": "jumpDamage"
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
            unit.name = build.unit.name;
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
                    unit.items.push({slot:index, id:item.id, pinned: build.fixedItems[index] != null, icon:item.icon, name:item.name});
                    addEnhancementsIfAny(item, unit);
                }
            }
            // first fix dual wield items
            for (var index = 0; index < 10; index++) {
                var item = build.build[index];
                if (item && !item.placeHolder && item.type != "unavailable" && !item.allowUseOf && hasDualWieldOrPartialDualWield(item)) {
                    unit.items.push({slot:index, id:item.id, pinned: build.fixedItems[index] != null, icon:item.icon, name:item.name});
                    addEnhancementsIfAny(item, unit);
                }
            }
            // then others items
            for (var index = 0; index < 10; index++) {
                var item = build.build[index];
                if (item && !item.placeHolder && item.type != "unavailable" && !hasDualWieldOrPartialDualWield(item) && !item.allowUseOf) {
                    unit.items.push({slot:index, id:item.id, pinned: build.fixedItems[index] != null, icon:item.icon, name:item.name});
                    addEnhancementsIfAny(item, unit);
                }
                if (item && item.placeHolder) {
                    unit.items.push({slot:index, id:item.type, pinned: false});
                }
            }
            if (build.build[10]) {
                unit.esperId = build.build[10].name;
                unit.esperPinned = (build.fixedItems[10] != null);
                if (build.build[10].originalEsper.selectedSkills) {
                    unit.esper = JSON.parse(JSON.stringify(build.build[10].originalEsper));
                    delete unit.esper.buildLink;
                    delete unit.esper.selectedSkills;
                    delete unit.esper.maxLevel;
                    if (!unit.esper.resist) {
                        unit.esper.resist = [];
                    }
                    unit.esper.buildLink = getEsperLink(build.build[10].originalEsper);
                }
            }

            unit.pots = {};
            unit.maxPots = {};
            unit.buffs = {};
            for (var index = baseStats.length; index--;) {
                unit.pots[baseStats[index]] = build.baseValues[baseStats[index]].pots;
                unit.maxPots[baseStats[index]] = build.unit.stats.pots[baseStats[index]];
                unit.buffs[baseStats[index]] = build.baseValues[baseStats[index]].buff;
            }
            unit.buffs.lbFillRate = build.baseValues.lbFillRate.buff;
            unit.lbShardsPerTurn = build.baseValues.lbFillRate.total;
            unit.buffs.mitigation = {
                "physical":build.baseValues.mitigation.physical,
                "magical":build.baseValues.mitigation.magical,
                "global":build.baseValues.mitigation.global
            }
            unit.buffs.drawAttacks = build.baseValues.drawAttacks;
            unit.buffs.lbDamage = build.baseValues.lbDamage;
            if (build.baseValues.killerBuffs) {
                unit.buffs.killers = build.baseValues.killerBuffs;
            }
            if (build.baseValues.currentStack) {
                unit.stack = build.baseValues.currentStack;
            }
            if (build._level) {
                unit.level = build._level;
            }
            if (build._exAwakeningLevel) {
                unit.exAwakening = build._exAwakeningLevel;
            }
            unit.calculatedValues = {
                "elementResists": {},
                "ailmentResists": {},
                "killers": {}
            };
            baseStats.forEach(stat => {
                let value = calculateStatValue(build.build, stat, build);
                unit.calculatedValues[stat] = {
                    "value": Math.floor(value.total),
                    "bonus": Math.floor(value.bonusPercent),
                    "flatStatBonus": Math.floor((getEquipmentStatBonus(build.build, stat, false) - 1) * 100)
                };
            });
            Object.keys(stateHashCalculatedValues).forEach(stat => {
                let value = calculateStatValue(build.build, stateHashCalculatedValues[stat], build).total;
                unit.calculatedValues[stat] = {
                    "value": value
                };
            });
            elementList.forEach(element => {
                let value = calculateStatValue(build.build, "resist|" + element + ".percent", build).total;
                unit.calculatedValues.elementResists[element] = value;
            });
            ailmentList.forEach(ailment => {
                let value = calculateStatValue(build.build, "resist|" + ailment + ".percent", build).total;
                unit.calculatedValues.ailmentResists[ailment] = value;
            });
            var killers = [];
            for (var index = build.build.length; index--;) {
                if (build.build[index] && build.build[index].killers) {
                    for (var j = 0; j < build.build[index].killers.length; j++) {
                        addToKiller(killers, build.build[index].killers[j]);
                    }
                }
            }
            killerList.forEach(race => {
                let killer = killers.filter(k => k.name === race);
                let physicalKiller = 0;
                let magicalKiller = 0;
                if (killer.length > 0) {
                    physicalKiller = killer[0].physical || 0;
                    magicalKiller = killer[0].magical || 0;
                }
                unit.calculatedValues.killers[race] = {
                    "physical": physicalKiller,
                    "magical": magicalKiller
                };
            });
            data.units.push(unit);
        }
    }
    readEnnemyStats();
    data.monster = {
        "races": getSelectedValuesFor("races"),
        "elementalResist" : ennemyStats.elementalResists,
        "def" : ennemyStats.def,
        "spr" : ennemyStats.spr,
        "breaks" : ennemyStats.breaks,
        "buffs" : ennemyStats.buffs,
        "breakability" : ennemyStats.breakability,
        "imperils" : ennemyStats.imperils,
        "attackFormula": formulaToString(monsterAttackFormula)
    }
    data.itemSelector = {
        "mainSelector": $(".equipments select").val(),
        "additionalFilters": []
    }
    var additionalFilters = ["includeEasilyObtainableItems", "includeChocoboItems", "includeTMROfOwnedUnits", "includeTmrMoogles", "includeTrialRewards", "exludeEvent", "excludePremium", "excludeTMR5", "excludeSTMR", "excludeNotReleasedYet"];
    for (var i = 0; i < additionalFilters.length; i++) {
        if ($("#" + additionalFilters[i]).prop('checked')) {
            data.itemSelector.additionalFilters.push(additionalFilters[i]);
        }
    }
    data.useNewJpDamageFormula = $("#useNewJpDamageFormula").prop("checked");

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
function addIconIfAny(item, unit) {
    if (!unit.itemIcons) {
        unit.itemIcons = [];
    }
    unit.itemIcons.push(item.icon);
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
            let parsedData = JSON.parse(atob(hashValue));
            let error = validator.validate('shortLink', parsedData);
            if (!error) {
                callback(shortLinkFormatToData(parsedData));
            } else {
                callback(oldLinkFormatToNew(parsedData));
            }
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
        spr : oldData.monsterSpr,
        'breaks': {'atk': 0, 'def':0, 'mag':0, 'spr':0},
        'buffs': {'atk': 0, 'def':0, 'mag':0, 'spr':0},
        'breakability': {'atk': true, 'def':true, 'mag':true, 'spr':true},
    }
    data.itemSelector = {
        "mainSelector": oldData.equipmentToUse,
        "additionalFilters": []
    }
    var additionalFilters = ["includeTMROfOwnedUnits", "includeTmrMoogles", "includeTrialRewards", "exludeEvent", "excludePremium", "excludeTMR5", "excludeSTMR", "excludeNotReleasedYet"];
    for (var i = 0; i < additionalFilters.length; i++) {
        if (oldData[additionalFilters[i]]) {
            data.itemSelector.additionalFilters.push(additionalFilters[i]);
        }
    }

    return data;
}

/* Short link format :
[
    // unit evo id, level, pots [HP, MP, ATK, DEF, MAG, SPR]
    [ 206000127, 120, [ 540, 90, 0, 40, 65, 40 ] ],
    // esper id, esper rarity
    [ 13, 2 ],
    // equip + materia by slot
    [ 310001700, 310003400, 403044500, 408002000, 409009800, 409019700, 504219890, 504101370, 504204590, 504208510 ],
    // IW upgrades
    [
        [ 410405, 450810, 410410 ],
        [ 450810, 410010, 410110 ]
    ],
    // awakened skills
    [ 704450, 704470, 704510 ]
]*/
function shortLinkFormatToData(shortLinkData) {
    var data = {
        "units": []
    };

    let unitIdString = shortLinkData[0][0].toString();

    let baseUnitId = unitIdString.substr(0, unitIdString.length -1);
    let rarity = unitIdString.substr(unitIdString.length -1);
    let unitFound = null;
    for (let i = 1; i <= 5; i++) {
      if (units[baseUnitId + i]) {
        unitFound = units[baseUnitId + i];
      }
    }
    if (!unitFound) {
      Modal.showMessage("Wrong link data", "Unknown unit id");
      return;
    }

    var unit = {};
    unit.id = unitFound.id;
    if (rarity != 6 && unitFound.max_rarity != rarity) {
      Modal.showMessage("Unsupported unit rarity", "FFBE Equip only support max rarity units. Max unit rarity will be displayed");
      unit.rarity = unitFound.max_rarity;
    } else {
      unit.rarity = rarity;
    }
    if (unit.rarity == 7) {
      unit.level = shortLinkData[0][1]
    }

    unit.goal = "Maximize P_DAMAGE";
    unit.pots = {
      "hp":shortLinkData[0][2][0],
      "mp":shortLinkData[0][2][1],
      "atk":shortLinkData[0][2][2],
      "def":shortLinkData[0][2][3],
      "mag":shortLinkData[0][2][4],
      "spr":shortLinkData[0][2][5]
    }

    unit.esperId = esperNameById[shortLinkData[1][0]];
    unit.esperPinned = false;
    unit.items = shortLinkData[2].map((id, index) => {
        if (id) {
            return {"id":id.toString(), "slot": index, "pinned": false}
        }
    }).filter(out => out);
    if (shortLinkData[3] && shortLinkData[3].length > 0) {
      unit.itemEnchantments = {};
      if (shortLinkData[3][0] && shortLinkData[3][0].size > 0) {
        unit.itemEnchantments[0] = shortLinkData[3][0].map(id => itemEnhancementBySkillId[id]);
      }
      if (shortLinkData[3][1] && shortLinkData[3][1].size > 0) {
        unit.itemEnchantments[1] = shortLinkData[3][1].map(id => itemEnhancementBySkillId[id]);
      }
    }

    data.units.push(unit);

    data.itemSelector = {
        "mainSelector": "all",
        "additionalFilters": ["excludeNotReleasedYet"]
    }

    data.version = 2;
    return data;
}

async function loadStateHashAndBuild(data, importMode = false) {
    var dataVersion = data.version ? data.version : 0;

    if (data.itemSelector.mainSelector == "owned" && !itemInventory) {
        return;
    }

    if (data.useNewJpDamageFormula) {
        $("#useNewJpDamageFormula").prop("checked", true);
    } else {
        $("#useNewJpDamageFormula").prop("checked", false);
    }


    if (!importMode) {
        if (data.monster) {
          select("races", data.monster.races);
          for (var element in data.monster.elementalResist) {
              if (data.monster.elementalResist[element] == 0) {
                  $("#elementalResists ." + element + " input.elementalResist").val("");
              } else {
                  $("#elementalResists ." + element + " input.elementalResist").val(data.monster.elementalResist[element]);
              }
              if (data.monster.imperils && data.monster.imperils[element]) {
                  $("#elementalResists ." + element + " input.imperil").val(data.monster.imperils[element]);
              }
          }

          if (data.monster.atk) {
              $("#monsterStats .atk .stat").val(data.monster.atk);
          }
          if (data.monster.mag) {
              $("#monsterStats .mag .stat").val(data.monster.mag);
          }
          if (data.monster.def) {
              $("#monsterStats .def .stat").val(data.monster.def);
          }
          if (data.monster.spr) {
              $("#monsterStats .spr .stat").val(data.monster.spr);
          }
          if (data.monster.breaks) {
              if (data.monster.breaks.atk) {
                  $("#monsterStats .atk .break").val(data.monster.breaks.atk);
              }
              if (data.monster.breaks.mag) {
                  $("#monsterStats .mag .break").val(data.monster.breaks.mag);
              }
              if (data.monster.breaks.def) {
                  $("#monsterStats .def .break").val(data.monster.breaks.def);
              }
              if (data.monster.breaks.spr) {
                  $("#monsterStats .spr .break").val(data.monster.breaks.spr);
              }
          }
          if (data.monster.buffs) {
              if (data.monster.buffs.atk) {
                  $("#monsterStats .atk .buff").val(data.monster.buffs.atk);
              }
              if (data.monster.buffs.mag) {
                  $("#monsterStats .mag .buff").val(data.monster.buffs.mag);
              }
              if (data.monster.buffs.def) {
                  $("#monsterStats .def .buff").val(data.monster.buffs.def);
              }
              if (data.monster.buffs.spr) {
                  $("#monsterStats .spr .buff").val(data.monster.buffs.spr);
              }
          }
          if (data.monster.breakability) {
              setMonsterStatBreakibility('atk', data.monster.breakability.atk);
              setMonsterStatBreakibility('mag', data.monster.breakability.mag);
              setMonsterStatBreakibility('def', data.monster.breakability.def);
              setMonsterStatBreakibility('spr', data.monster.breakability.spr);
          }
          if (data.monster.attackFormula) {
              setMonsterAttackFormula(parseFormula(data.monster.attackFormula, null));
          }
          $('.equipments select option[value="' + data.itemSelector.mainSelector + '"]').prop("selected", true);
          for (var i = 0; i < data.itemSelector.additionalFilters.length; i++) {
            $("#" + data.itemSelector.additionalFilters[i]).prop('checked', true);
          }
        }
    }

    $('.goal #normalGoalChoice option').prop("selected", false);


    var first = true;
    for (var i = 0; i < data.units.length; i++) {

        if (first) {
            if (importMode && (builds.length > 1 || builds[0].unit != null)) {
                addNewUnit(false);
            } else {
                reinitBuild(0);
            }
            first = false;
        } else {
            addNewUnit(false);
        }

        var unit = data.units[i];
        if (!unit.id.endsWith("7") && displayOnly7StarsUnits) {
            displayOnly7StarsUnits = !displayOnly7StarsUnits;
            refreshUnitSelect();
        }
        var unitToSelect = unit.id;
        if (unit.rarity == 6 && units[unit.id]["6_form"]) {
            unitToSelect += '-6';
        } else if (unit.rarity == 7 && units[unit.id]["7_form"]) {
            unitToSelect += '-7';
        }
        selectUnitDropdownWithoutNotify(unitToSelect);
        await onUnitChange();

        if (unit.enhancementLevels) {
            builds[currentUnitIndex].unit.enhancementLevels = unit.enhancementLevels;
            displayUnitEnhancements();
            await onUnitChange();
        }

        builds[i].goal = "custom";
        builds[i].formula = parseFormula(unit.goal, unitsWithSkills[unit.id]);
        if (!isSimpleFormula(builds[i].formula)) {
            customFormula = builds[i].formula;
        }

        updateGoal();
        readGoal();


        if (unit.level) {
            $("#unitLevel select").val(unit.level);
            builds[currentUnitIndex].setLevel(unit.level);
            updateUnitStats();
            recalculateApplicableSkills();
        }
        if (unit.exAwakening) {
            $("#unitExAwakeningLevel select").val(unit.exAwakening.toString());
            builds[currentUnitIndex].setExAwakeningLevel(unit.exAwakening);
            updateUnitStats();
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
            if (unit.esper) {
                fixItem(getEsperItem(unit.esper), 10, undefined, unit.esperPinned);
            } else if (dataVersion >= 2) {
                fixItem(unit.esperId, -1, undefined, unit.esperPinned);
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
                $(".unitStats .stat.lbFillRate .buff input").val(unit.buffs.lbFillRate);
            }
            if (unit.buffs.killers) {
                unit.buffs.killers.forEach(killerData => {
                    if (killerData.physical) {
                        $('.killerBuffs.physical .' + killerData.name + ' input').val(killerData.physical);
                    }
                    if (killerData.magical) {
                        $('.killerBuffs.magical .' + killerData.name + ' input').val(killerData.magical);
                    }
                });
            }
        }
        if (unit.lbShardsPerTurn) {
            $(".unitStats .stat.lbShardsPerTurn .buff input").val(unit.lbShardsPerTurn);
        }
        let mitigation = unit.buffs.mitigation || unit.mitigation;
        if (mitigation) {
            $(".unitStats .stat.pMitigation .buff input").val(mitigation.physical);
            $(".unitStats .stat.mMitigation .buff input").val(mitigation.magical);
            $(".unitStats .stat.mitigation .buff input").val(mitigation.global);
        }
        let drawAttacks = unit.buffs.drawAttacks || unit.drawAttacks;
        if (drawAttacks) {
            $(".unitStats .stat.drawAttacks .buff input").val(drawAttacks);
        }
        let lbDamage = unit.buffs.lbDamage || unit.lbDamage;
        if (lbDamage) {
            $(".unitStats .stat.lbDamage .buff input").val(lbDamage);
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

function updateSimpleConditionsFromFormula(buildIndex) {
    unselectAll("forcedElements");
    unselectAll("ailmentImunities");
    unselectAll("simpleConditionVarious")
    $(".elements .element input").val("");
    $(".chainMultiplier input").val("");

    let formula = builds[buildIndex].formula;
    if (formula && isSimpleFormula(formula)) {
        var simpleConditions = getSimpleConditions(formula);
        select("forcedElements", simpleConditions.forcedElements.map(e => (e == "none") ? "noElement": e ));
        select("ailmentImunities", simpleConditions.ailmentImunity);
        for (var elementIndex = elementList.length; elementIndex--;) {
            if (simpleConditions.elementalResist[elementList[elementIndex]]) {
                $(".elements .element." + elementList[elementIndex] + " input").val(simpleConditions.elementalResist[elementList[elementIndex]]);
            }
        }
        select("simpleConditionVarious", simpleConditions.various);
        let chainMultiplier = getChainMultiplier(formula);
        if (chainMultiplier != 1) {
            $(".chainMultiplier input").val(chainMultiplier);
        }
        if (chainMultiplier != 1 || simpleConditions.ailmentImunity.length > 0 || Object.keys(simpleConditions.elementalResist).length > 0 || simpleConditions.forcedElements.length > 0 || simpleConditions.various.length > 0 ) {
            $("#simpleConditionsButton").attr("aria-expanded", "true");
            $("#simpleConditionsList").addClass("show");
        }
    }


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
    Modal.showWithTextData("Build as text", getBuildAsText(currentUnitIndex));
}

function showAllBuildsAsText() {
    let text = "";
    for (let i = 0; i < builds.length; i++) {
        text += getBuildAsText(i) + '\n\n';
    }
    Modal.showWithTextData("Builds as text", text);
}

function getBuildAsText(buildIndex) {
    var text = "";
    text +=
        builds[buildIndex].unit.name + ' ' + (builds[buildIndex].unit.sixStarForm ? 6 : builds[buildIndex].unit.max_rarity) + '★  \n' +
        getItemLineAsText("Right hand", 0, buildIndex) +
        getItemLineAsText("Left hand", 1, buildIndex) +
        getItemLineAsText("Head", 2, buildIndex) +
        getItemLineAsText("Body", 3, buildIndex) +
        getItemLineAsText("Accessory 1", 4, buildIndex) +
        getItemLineAsText("Accessory 2", 5, buildIndex) +
        getItemLineAsText("Materia 1", 6, buildIndex) +
        getItemLineAsText("Materia 2", 7, buildIndex) +
        getItemLineAsText("Materia 3", 8, buildIndex) +
        getItemLineAsText("Materia 4", 9, buildIndex) +
        getItemLineAsText("Esper", 10, buildIndex) +
        getBuildStatsAsText(buildIndex);
    return text;
}

function showExcludedItems() {
    var text = "";
    var idAlreadyTreated = [];
    var dataToSearch = data.concat(espers);
    for (var index = 0, len = dataToSearch.length; index < len; index++) {
        var item = dataToSearch[index];
        if (itemsToExclude.includes(item.id) && !idAlreadyTreated.includes(item.id)) {
            text += '<div class="tr id_' + escapeName(item.id) +'">' +
                '<div class="td actions"><span class="excludeItem glyphicon glyphicon-remove" onclick="removeItemFromExcludeList(\'' + item.id +'\')"></span></div>' +
                getImageHtml(item) +
                getNameColumnHtml(item) +
                '</div>';
            idAlreadyTreated.push(item.id);
        }
    }

    Modal.show({
        title: "Excluded items",
        body: '<button class="btn btn-warning" onclick="resetExcludeList();">Reset item exclusion list</button><button class="btn btn-warning" style="margin-left: 10px;" onclick="saveExcludeList();">Save as default exclusion list</button>'+
              '<div id="showExcludedItemsDialog"><div class="table items">' + text + '</div></div>',
        size: 'large',
        withCancelButton: false
    });
}

function showIncludedItems() {
    var text = "";
    var idAlreadyTreated = [];
    var dataToSearch = data.concat(espers);
    for (var index = 0, len = dataToSearch.length; index < len; index++) {
        var item = dataToSearch[index];
        if (itemsToInclude.includes(item.id) && !idAlreadyTreated.includes(item.id)) {
            text += '<div class="tr id_' + escapeName(item.id) +'">' +
                '<div class="td actions"><span class="includeItem glyphicon glyphicon-remove" onclick="removeItemFromIncludeList(\'' + item.id +'\')"></span></div>' +
                getImageHtml(item) +
                getNameColumnHtml(item) +
                '</div>';
            idAlreadyTreated.push(item.id);
        }
    }

    Modal.show({
        title: "Included items",
        body: '<button class="btn btn-warning" onclick="resetIncludeList();">Reset item inclusion list</button>'+
              '<div id="showIncludedItemsDialog"><div class="table items">' + text + '</div></div>',
        size: 'large',
        withCancelButton: false
    });
}

function showMonsterList() {
	var first        = true;
	var text_tab     = '';
	var text_content = '';
	var tab_count    = 0;

	Object.keys(bestiary.monstersByCategory).forEach(c => {
		var is_active    = '';
		var is_selected  = 'false';

		if (first) {
			is_active = ' active';
			is_selected = 'true';
			first = false;
		}

		text_tab += '<li class="nav-item bestiaryCategory ' + escapeName(c) + '">';
		text_tab += '  <a class="nav-link text-xs ' + is_active + '" id="mlT_' + tab_count + '" data-toggle="tab" href="#mlC_' + tab_count + '" role="tab" aria-controls="mlC_' + tab_count + '" aria-selected="' + is_selected + '">';
		text_tab +=      c;
		text_tab += '  </a>';
		text_tab += '</li>';

		tab_count++;
	});

	var first = true;
	var tab_count = 0;

	Object.keys(bestiary.monstersByCategory).forEach(c => {
		var is_active = '';
		var is_selected = 'false';

		if (first) {
			is_active = ' active';
			is_selected = 'true';
			first = false;
		}

		text_content += '<div class="tab-pane ' + is_active + '" id="mlC_' + tab_count + '" aria-labelledby="#mlT_' + tab_count + '">';
		text_content += '  <div class="form-row">';

		bestiary.monstersByCategory[c].forEach((monster, index) => {
			text_content += '<div class="col-12 col-md-6 mb-3">';
			text_content += '  <div class="ffbe_content--well p-3 border rounded monsterBestiary h-100" onclick="selectMonster(\'' + c + '\',' + index +')">';
			text_content += '    <div class="d-flex">';
			text_content += '      <div class="flex-fill">' + getNameColumnHtml(monster) + '</div>';
			text_content += '      <div class="flex-shrink ml-2">';

			for (var raceIndex = 0, racesLen = monster.races.length; raceIndex < racesLen; raceIndex++) {
				text_content += '<span class="badge badge-secondary">' + monster.races[raceIndex] + "</span>";
			}
			text_content += '      </div>';
			text_content += '    </div>';
			text_content += '    <div class="d-block">' + getSpecialHtml(monster) + '</div>';
			text_content += '  </div>';
			text_content += '</div>';

		});

		text_content += '  </div>';
		text_content += '</div>';

		tab_count++;
	});

	var text  = '<ul class="nav nav-tabs mx-2" id="showMonsterListTabs" role="tablist">' + text_tab + '</ul>';
			text += '<div class="ffbe_content--box p-3 tab-content">' + text_content + '</div>';

	$('#showMonsterList').html(text);

	if (Object.keys(bestiary.monstersByCategory).length) {
		//selectBestiaryCategory(escapeName(Object.keys(bestiary.monstersByCategory)[0]));
	}
}

function selectBestiaryCategory(category) {
    $('.bestiaryCategory').removeClass("active");
    $('.bestiaryMonsters').addClass("hidden");
    $('.bestiaryCategory.' + category).addClass("active");
    $('.bestiaryMonsters.' + category).removeClass("hidden");
}

function selectMonster(category, monsterIndex) {
    var monster = bestiary.monstersByCategory[category][monsterIndex];
    $("#monsterStats .atk .stat").val(monster.atk);
    $("#monsterStats .mag .stat").val(monster.mag);
    $("#monsterStats .def .stat").val(monster.def);
    $("#monsterStats .spr .stat").val(monster.spr);
    $("#monsterStats .atk .buff").val('');
    $("#monsterStats .mag .buff").val('');
    $("#monsterStats .def .buff").val('');
    $("#monsterStats .spr .buff").val('');
    setMonsterStatBreakibility('atk', false);
    setMonsterStatBreakibility('mag', false);
    setMonsterStatBreakibility('def', false);
    setMonsterStatBreakibility('spr', false);
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
    if (monster.breakability) {
        setMonsterStatBreakibility('atk', monster.breakability.def);
        setMonsterStatBreakibility('mag', monster.breakability.spr);
        setMonsterStatBreakibility('def', monster.breakability.def);
        setMonsterStatBreakibility('spr', monster.breakability.spr);
    }
    if (monster['atk%']) {
        $("#monsterStats .atk .buff").val(monster['atk%']);
    }
    if (monster['mag%']) {
        $("#monsterStats .mag .buff").val(monster['mag%']);
    }
    if (monster['def%']) {
        $("#monsterStats .def .buff").val(monster['def%']);
    }
    if (monster['spr%']) {
        $("#monsterStats .spr .buff").val(monster['spr%']);
    }
    unselectAll("races");
    select("races", monster.races);
    Modal.hide();
    if (builds[currentUnitIndex] && builds[currentUnitIndex].unit) {
        logCurrentBuild();
    }
}

function toogleMonsterBreakability(stat) {
    let icon = $("#monsterStats ." + stat + " .breakIcon");
    setMonsterStatBreakibility(stat, icon.hasClass("glyphicon-ban-circle"), icon);
    readEnnemyStats();
    logCurrentBuild();
}

function setMonsterStatBreakibility(stat, allow, providedIcon) {
    let icon = providedIcon || $("#monsterStats ." + stat + " .breakIcon");
    let field = $("#monsterStats ." + stat + " .break");
    if (allow) {
        icon.removeClass("glyphicon-ban-circle");
        icon.addClass("glyphicon-download");
        field.prop('disabled', false);
    } else {
        icon.addClass("glyphicon-ban-circle");
        icon.removeClass("glyphicon-download");
        field.prop('disabled', true);
        field.val("");
    }
}

function changeMonsterAttack() {
    $("#monsterAttackFormulaModal").modal();
}

function chooseMonsterAttackFormula() {
    var formulaString = $("#monsterAttackFormulaModal #monsterAttackInput").val();
    var formula = parseFormula(formulaString, null);
    if (formula) {
        if (isAttackFormula(formula)) {
            setMonsterAttackFormula(formula);
            $('#monsterAttackFormulaModal').modal('hide');
        } else {
            Modal.showMessage("Wrong formula", "The inputed formula is not a valid simple damage formula");
        }
    }
}

function setMonsterAttackFormula(attackFormula) {
    monsterAttackFormula = attackFormula;
    builds.forEach(bu => {
        if (bu) {
            bu.monsterAttackFormula = attackFormula;
        }
    });
    $('#monsterAttack .monsterAttackFormula').text(formulaToString(monsterAttackFormula, false));
    if (builds[currentUnitIndex] && builds[currentUnitIndex].unit) {
        logCurrentBuild();
    }
}

function resetMonsterAttack() {
    setMonsterAttackFormula(defaultMonsterAttackFormula);
}

function removeItemFromExcludeList(id) {
    $("#showExcludedItemsDialog .tr.id_" + escapeName(id)).remove();
    itemsToExclude.splice(itemsToExclude.indexOf(id),1);
    $(".excludedItemNumber").html(itemsToExclude.length);
}

function removeItemFromIncludeList(id) {
    $("#showIncludedItemsDialog .tr.id_" + escapeName(id)).remove();
    itemsToInclude.splice(itemsToInclude.indexOf(id),1);
    $(".includedItemNumber").html(itemsToInclude.length);
}

function resetExcludeList() {
    itemsToExclude = defaultItemsToExclude.slice();
    $(".excludedItemNumber").html(itemsToExclude.length);
    Modal.hide();
    showExcludedItems();
}

function resetIncludeList() {
    itemsToInclude = [];
    $(".includedItemNumber").html(itemsToInclude.length);
    Modal.hide();
    showIncludedItems();
}

function saveExcludeList() {
    $.ajax({
        url: server + '/defaultExclusionList',
        method: 'PUT',
        data: JSON.stringify(itemsToExclude),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function() {
            $.snack('success', 'Data Saved', 5000);
        },
        error: function() {
            Modal.showMessage('Default exclusion list not saved', 'Error while saving the default exclusion list.');
        }
    });
}

function getItemLineAsText(prefix, slot, buildIndex = currentUnitIndex) {
    var item = builds[buildIndex].build[slot];
    if (item) {
        var statBonusCoef = 1;
        if (item.type == "esper") {
            if (builds && builds[buildIndex] && builds[buildIndex].build) {
                for (var i = 0; i < builds[buildIndex].build.length; i++) {
                    if (builds[buildIndex].build[i] && builds[buildIndex].build[i].esperStatsBonus) {
                        if (builds[buildIndex].build[i].esperStatsBonus.all) {
                            statBonusCoef += builds[buildIndex].build[i].esperStatsBonus.all["hp"] / 100;
                        }
                        if (builds[buildIndex].build[10] && builds[buildIndex].build[i].esperStatsBonus[builds[buildIndex].build[10].id]) {
                            statBonusCoef += builds[buildIndex].build[i].esperStatsBonus[builds[buildIndex].build[10].id]["hp"] / 100;
                        }
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
                if (item.enhancements[i] == "rare_3") {
                    resultText += itemEnhancementLabels["rare_3"][item.type];
                } else if (item.enhancements[i] == "rare_4") {
                    resultText += itemEnhancementLabels["rare_4"][item.type];
                } else if (item.enhancements[i] == "special_1") {
                    resultText += itemEnhancementLabels["special_1"][item.id];
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

function getBuildStatsAsText(buildIndex = currentUnitIndex) {
    var resultText = "Total: ";
    var first = true;
    for (var statIndex = 0, len = baseStats.length; statIndex < len; statIndex++) {
        var result = calculateStatValue(builds[buildIndex].build, baseStats[statIndex], builds[buildIndex]).total;
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
        let element = $(".unitStats .stat." + stat + " .pots input");
        var value = parseInt(element.val()) || 0;

        if (value > Math.floor(builds[currentUnitIndex].unit.stats.pots[stat] * 1.5)) {
            element.val(Math.floor(builds[currentUnitIndex].unit.stats.pots[stat] * 1.5));
        }

        updatePotStyle(stat);
        logCurrentBuild();
    }
}

function updatePotStyle(stat) {
    let element = $(".unitStats .stat." + stat + " .pots input");
    var value = parseInt(element.val()) || 0;
    element.removeClass("poted");
    element.removeClass("maxPot");
    element.removeClass("door");
    element.removeClass("maxDoor");
    if (value == Math.floor(builds[currentUnitIndex].unit.stats.pots[stat] * 1.5)) {
      element.addClass("maxDoor");
    } else if (value > builds[currentUnitIndex].unit.stats.pots[stat]) {
      element.addClass("door");
    } else if (value == builds[currentUnitIndex].unit.stats.pots[stat]) {
      element.addClass("maxPot");
    } else if (value > 0) {
      element.addClass("poted");
    }
}

function switchPots() {
    var allZero = baseStats.every(stat => {
      let value = parseInt($(".unitStats .stat." + stat + " .pots input").val()) || 0;
      return value == 0;
    });
    if (allZero) {
      baseStats.forEach(stat => {
        $(".unitStats .stat." + stat + " .pots input").val(builds[currentUnitIndex].unit.stats.pots[stat]);
        updatePotStyle(stat);
      });
    } else {
      var notMaxed = baseStats.some(stat => {
        let value = parseInt($(".unitStats .stat." + stat + " .pots input").val()) || 0;
        return value < Math.floor(builds[currentUnitIndex].unit.stats.pots[stat] * 1.5);
      });
      if (notMaxed) {
        baseStats.forEach(stat => {
          $(".unitStats .stat." + stat + " .pots input").val(Math.floor(builds[currentUnitIndex].unit.stats.pots[stat] * 1.5));
          updatePotStyle(stat);
        });
      } else {
        baseStats.forEach(stat => {
          $(".unitStats .stat." + stat + " .pots input").val("0");
          updatePotStyle(stat);
        });
      }
    }
    logCurrentBuild();
}

function onBuffChange(stat) {
    if (builds[currentUnitIndex].unit) {
        var value = parseInt($(".unitStats .stat." + stat + " .buff input").val()) || 0;
        var maxValue = (stat === "hp" ? 10000 : 600);
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
    if (ownedEspers && Object.keys(ownedEspers).length > 0) {
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
        success: function() { $.snack('success', 'Team Saved', 5000); },
        error: function(error) {
            Modal.showError("Save error", 'An error occured while trying to save the team.', error);
        }
    });
}

function showSaveAsPopup() {
    Modal.show({
        title: "Save Team As...",
        body: '<div class="form-group form-row mb-0"><label class="col-form-label col-3">Build Name</label><div class="col"><input class="form-control" type="text"></div></div>',
        size: 'lg',
        onOpen: function($modal) {
            // Focus on input
            if (!isMobile) {
                $modal.find('input').focus();
            }
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
			Modal.confirm("Load Saved Team", '<div class="alert alert-info">Loading this team will remove the units you currently have in the builder. Continue?</div>', function() {
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

let savedTeamModal;

function showSavedTeams() {
	getSavedBuilds(function(savedBuilds) {
		savedTeamModal = Modal.show({
			title: "Saved teams",
			body: getSavedTeamList,
			size: 'lg',
			withCancelButton: false
		});
	});
}

function getSavedTeamList() {
	var html = "",
			team = '';

	for (var i = savedBuilds.teams.length - 1; i >= 0; i--) {
		for (var j = 0, lenj = savedBuilds.teams[i].team.units.length; j < lenj; j++) {
			team += '<img class="unit" src="/assets/game/units/unit_icon_' + savedBuilds.teams[i].team.units[j].id + '.png">';
		}

		html += '<div class="d-flex savedTeam mb-3">';
		html += '  <div class="ffbe_content--box rounded p-2 team flex-fill mr-2">';
		html += '    <h6 class="border-bottom mb-2 pb-2">' + savedBuilds.teams[i].name + '</h6>';
		html +=      team;
		html += '  </div>';
		html += '  <div class="flex-shrink">';
		html += '    <button class="btn btn-sm btn-info btn-block" type="button" data-toggle="tooltip" title="Add this team to your current team" onclick="importSavedTeam(' + i + ');"><span class="fa fa-file-import fa-fw"></span></button>';
		html += '    <button class="btn btn-sm btn-success btn-block" type="button" data-toggle="tooltip" title="Load this team, to modify it" onclick="loadSavedTeam(' + i + ');"><span class="fa fa-file-upload fa-fw"></span></button>';
		html += '    <button class="btn btn-sm btn-danger btn-block" type="button" data-toggle="tooltip" title="Delete this team" onclick="deleteSavedTeam(' + i + ');"><span class="fa fa-trash fa-fw"></span></button>';
		html += '  </div>';
		html += '</div>';

	}
	
	return html;
}

function deleteSavedTeam(index) {
	var r = confirm("Are you sure to delete that team ?");

	if (r == true) {
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
		savedTeamModal.modal('hide');
		showSavedTeams();

	}
}

function modifyDefaultWeaponEnhancement() {
	var fakeItem = {"name":"Default enhancement", type:"fake", "icon":"ability_95.png", enhancements:defaultWeaponEnhancement};
	selectEnchantement(fakeItem);
}

async function findUnitForParamChallenge() {
    runningParamChallenge = true;
    let ids = Object.keys(ownedUnits);
    let goal = $("#paramChallengeSelect").val();
    let tokens = goal.split("_");
    let statToSearch = tokens[0].toLocaleLowerCase();
    let unitPool = $('#parameterChallenges input[name=paramChallengeUnitChoice]:checked').val();
    let idsToSearch = ids.filter(id => {
        if (unitPool == "sevenStar") {
            return ownedUnits[id].sevenStar || id == "306000804"
        } else if (unitPool == "potentialSevenStar") {
            return ownedUnits[id].sevenStar || id == "306000804" || (id.endsWith("5") && ownedUnits[id].number >= 2);
        } else {
            return id == "306000804" || (id.endsWith("5") && (ownedUnits[id].number >= 1 || ownedUnits[id].sevenStar));
        }
    }).map(id => {
        if (unitPool == "rainbows" && id.endsWith("5") && !(ownedUnits[id].sevenStar || ownedUnits[id].number >= 2) && units[id]['6_form']) {
            return id + "-6"
        } else {
            return id;
        }
    }).sort((id1, id2) => {
        var value1 = (id1.endsWith("-6") ? getUnitBaseValue(statToSearch, units[id1.substr(0, id1.length - 2)]['6_form']) : getUnitBaseValue(statToSearch, units[id1]));
        var value2 = (id2.endsWith("-6") ? getUnitBaseValue(statToSearch, units[id2.substr(0, id2.length - 2)]['6_form']) : getUnitBaseValue(statToSearch, units[id2]));
        return value2 - value1;
    });
    for (i = currentUnitIdIndexForParamChallenge + 1; i < idsToSearch.length; i++) {
        currentUnitIdIndexForParamChallenge = i;
        selectUnitDropdownWithoutNotify(idsToSearch[i]);
        await onUnitChange();
        chooseCustomFormula(tokens[0]);
        currentBestParamChallengeBuild.goal = parseInt(tokens[1]);
        build();
        return;
    }
    currentUnitIdIndexForParamChallenge = -1;
    runningParamChallenge = false;

    if (currentBestParamChallengeBuild.value >= currentBestParamChallengeBuild.goal) {
        Modal.showMessage("No more possible builds", "Best build found has been displayed");
    } else {
        Modal.showMessage("Impossible to do the challenge", "Best build found has been displayed");
    }
    selectUnitDropdownWithoutNotify(currentBestParamChallengeBuild.build.unit.id);
    await onUnitChange();
    chooseCustomFormula(tokens[0]);
    builds[currentUnitIndex] = currentBestParamChallengeBuild.build;
    logCurrentBuild();
    updateFindAWayButtonDisplay();
}

function updateFindAWayButtonDisplay() {
    if (currentUnitIdIndexForParamChallenge == -1) {
        $('#paramChallengeButton').text('Find a way !');
    } else {
        $('#paramChallengeButton').text('Find another way !');
    }
}

function getUnitBaseValue(stat, unit) {
    let baseStatValue = unit.stats.maxStats[stat] + unit.stats.pots[stat];
    var coef = 1;
    if (unit.skills && unit.skills[0] && unit.skills[0][stat + '%']) {
        coef += unit.skills[0][stat + '%'] / 100;
    }
    return baseStatValue * coef;
}


function onFeatureSelect(selectedFeature) {
    if (selectedFeature === 'buildAUnit') {
        $('.panel.buildRules').removeClass('hidden');
        $('#addNewUnitButton').removeClass('hidden');
        $('.panel.monster').removeClass('hidden');
        updateSavedTeamPanelVisibility();
        parameterChallengesMode = false;
    } else {
        reinitBuilds();
        $('.panel.unit').addClass('hidden');
        $('.panel.buildRules').addClass('hidden');
        $('.panel.monster').addClass('hidden');
        $('#addNewUnitButton').addClass('hidden');
        $("#savedTeamPanel").addClass("hidden");
        if (itemInventory) {
            $('#parameterChallenges .content').removeClass("hidden");
            $('#parameterChallenges .notAvailableMessage').addClass("hidden");
        } else {
            $('#parameterChallenges .content').addClass("hidden");
            $('#parameterChallenges .notAvailableMessage').removeClass("hidden");
        }
        currentUnitIdIndexForParamChallenge = -1;
        parameterChallengesMode = true;
    }
    updateBuildButtonDisplay();
}

function showExportAsImage() {
    $("#exportAsImageModal").modal();
    FFBEEquipBuildAsImage.drawTeam($('#exportAsImageCanvas')[0], getStateHash(false));
}

function exportAsImage() {
    $('#exportAsImageCanvas')[0].toBlob(function (blob) {
        window.saveAs(blob, builds.map(build => build.unit.name).join("-") + ".png");
        $("#exportAsImageModal").modal('hide');
    });
}

function uploadToImgur() {
    var img = $('#exportAsImageCanvas')[0].toDataURL().split(',')[1];

    $.ajax({
        url: 'https://api.imgur.com/3/image',
        type: 'post',
        headers: {
            Authorization: 'Client-ID ' + window.clientConfig.imgurClientId,
        },
        data: {
            image: img
        },
        dataType: 'json',
        success: function(response) {
            if(response.success) {
                Modal.showWithBuildLink("Build image on Imgur", response.data.link);
                $("#exportAsImageModal").modal('hide');
            } else {
                Modal.showMessage("Imposible to upload to Imgur", "The daily quota of free upload to Imgur has been reached. Please try again later.");
            }
        }
    });
}

function switchDisplayKillerBuffs() {
    $('.unit.panel .killerBuffs.physical').toggleClass('hidden');
    $('.unit.panel .killerBuffs.magical').toggleClass('hidden');
    $('.unit.panel .killerBuffsSummary').toggleClass('hidden');
}

function onKillerBuffChange() {
    killerList.forEach(killer => {
        let input = $('.killerBuffs.physical .' + killer + ' input');
        let value = input.val() || 0;
        if (value > 300) {
            input.val(300);
        }
        input = $('.killerBuffs.magical .' + killer + ' input');
        value = input.val() || 0;
        if (value > 300) {
            input.val(300);
        }
    });
    readStatsValues();
    logCurrentBuild();
    updateKillerBuffSummary();
}

function updateKillerBuffSummary() {
    let killerHtml = getKillerHtml(builds[currentUnitIndex].baseValues["killerBuffs"]);
    $('.unit.panel .killerBuffsSummary .physical').html(killerHtml.physical);
    $('.unit.panel .killerBuffsSummary .magical').html(killerHtml.magical);
}

const effectKeysSupported = ["turns", "damage", "statsBuff", "heal", "healOverTurn", "imperil", "break", "globalMitigation", "physicalMitigaiton", "magicalMitigation", "imbue", "dispel", "autoReraise", "restoreMp", "inflict", "cureAilments", "area","target","frames","repartition", "multicast"];
function exportUnitForCombat() {
    let unitBuild = builds[currentUnitIndex];
    if (unitBuild.unit.id !== '777700004') {
        Modal.showMessage("Uh ? It's not Lady!?", "Only Holiday Hero is currently allowed to fight me.");
        return;
    }
    if (unitBuild.build.some(i => i && i.access && i.access.includes('not released yet'))) {
        Modal.showMessage("Trying to get ahead in time ?", "Your current build includes items that are not yet released in GL. You can't bring them to the challenge.");
        return;
    }
    let unitWithSkills = unitsWithSkills[unitBuild.unit.id];

    let unit = {
        id: unitBuild.unit.id,
        name: unitBuild.unit.name,
        elementalResists:{},
        ailmentResists:{},
        physicalKillers:{},
        magicalKillers:{},
        elements: [],
        leftDamageVariance: [1, 1],
        rightDamageVariance: [1, 1],
        physicalEvasion:calculateStatValue(unitBuild.build, "evade.physical", unitBuild).total,
        magicalEvasion:calculateStatValue(unitBuild.build, "evade.magical", unitBuild).total,
        accuracy:calculateStatValue(unitBuild.build, "accuracy", unitBuild).total,
        mpRefresh:calculateStatValue(unitBuild.build, "mpRefresh", unitBuild).total,
        dualWielding: unitBuild.build[0] && unitBuild.build[1] && weaponList.includes(unitBuild.build[0].type) && weaponList.includes(unitBuild.build[1].type),
        guts: unitBuild.build.filter(i => i && i.guts).map(i => i.guts),
        autoCastedSkills:unitBuild.build.filter((item, index) => item && index < 11 && item.autoCastedSkills).reduce((acc, item) => acc = acc.concat(item.autoCastedSkills), []),
        counterSkills:unitBuild.build.filter((item, index) => item && index < 11 && item.counterSkills).reduce((acc, item) => acc = acc.concat(item.counterSkills), []),
        startOfTurnSkills:unitBuild.build.filter((item, index) => item && index < 11 && item.startOfTurnSkills).reduce((acc, item) => acc.concat(item.startOfTurnSkills), []),
    }
    unit.skills = unitBuild.build.filter((item, index) => item && index < 11 && item.skills).reduce((acc, item) => acc = acc.concat(item.skills), []);
    unit.skills = unit.skills.concat(unitWithSkills.actives).concat(unitWithSkills.magics);
    baseStats.forEach(stat => {
        unit[stat] = {};
        unit[stat].base = unitBuild.stats[stat] + unitBuild.baseValues[stat].pots;
        value = calculateStatValue(unitBuild.build, stat, unitBuild, 0, true);
        unit[stat].passiveIncreasePercent = Math.min(400, value.bonusPercent);
        unit[stat].flatIncrease = value.total - Math.floor(unit[stat].base * (1+unit[stat].passiveIncreasePercent/100));
    });
    unit.elements = [];
    if (unitBuild.build[0] && weaponList.includes(unitBuild.build[0].type)) {
        unit.atk.rightFlatAtk = unitBuild.build[0].atk || 0;
        if (unitBuild.build[0].element) {
            unit.elements = unit.elements.concat(unitBuild.build[0].element);
        }
        if (unitBuild.build[0].damageVariance) {
            unit.rightDamageVariance = [unitBuild.build[0].damageVariance.min, unitBuild.build[0].damageVariance.max];
        } else {
            unit.rightDamageVariance = [weaponBaseDamageVariance[unitBuild.build[0].type].min, weaponBaseDamageVariance[unitBuild.build[0].type].max];
        }
        if (unitBuild.build[0].enhancements) {
            unit.autoCastedSkills = unit.autoCastedSkills.concat(unitBuild.build[0].enhancements.filter(enh => skillByItemEnhancement[enh]).map(enh => skillByItemEnhancement[enh]));
        }
    } else {
        unit.atk.rightFlatAtk = 0;
    }
    if (unitBuild.build[1] && weaponList.includes(unitBuild.build[1].type)) {
        unit.atk.leftFlatAtk = unitBuild.build[1].atk || 0;
        if (unitBuild.build[1].element) {
            unit.elements = unit.elements.concat(unitBuild.build[1].element);
        }
        if (unitBuild.build[1].enhancements) {
            unit.autoCastedSkills = unit.autoCastedSkills.concat(unitBuild.build[1].enhancements.filter(enh => skillByItemEnhancement[enh]).map(enh => skillByItemEnhancement[enh]));
        }
    } else {
        unit.atk.leftFlatAtk = 0;
    }
    elementList.forEach(element => {
        unit.elementalResists[element] = calculateStatValue(unitBuild.build, "resist|" + element + ".percent", unitBuild).total
    });
    ailmentList.forEach(ailment => {
        unit.ailmentResists[ailment] = calculateStatValue(unitBuild.build, "resist|" + ailment + ".percent", unitBuild).total
    });
    var killers = [];
    unitBuild.build.filter(item => item && item.killers).forEach(item => {
        item.killers.forEach(killer => {
            addToKiller(killers, killer);
        });
    });
    killerList.forEach(race => {
        let killerData = killers.filter(killerData => killerData.name == race);
        if (killerData.length == 0) {
            unit.physicalKillers[race] = 0;
            unit.magicalKillers[race] = 0;
        } else {
            unit.physicalKillers[race] = killerData[0].physical || 0;
            unit.magicalKillers[race] = killerData[0].magical || 0;
        }
    });
    if (unitBuild.build[1] && weaponList.includes(unitBuild.build[1].type) && unitBuild.build[1].element) {
        unit.elements = unit.elements.concat(unitBuild.build[1].element);
    }

    let unsupportedEffects = "";
    let special = unitBuild.build
        .filter(i => i && i.special)
        .reduce((acc, value) => acc.concat(value.special), [])
        .filter(special => !["dualWield", "twoHanded", "notStackable"].includes(special)).join('</li><li>');
    if (special) {
        unsupportedEffects += '<li>' + special + '</li>';
    }
    unit.skills.concat(unit.autoCastedSkills).concat(unit.counterSkills.map(counter => counter.skill)).forEach(skill => {
        skill.effects.forEach(effect => {
            if (!effect.effect) {
                unsupportedEffects += '<li>' + skill.name + ':' + effect.desc + '</li>';
            } else {
                let keys = Object.keys(effect.effect);
                keys = keys
                    .filter(key => !effectKeysSupported.includes(key));
                if (keys.length) {
                    unsupportedEffects += '<li>' + skill.name + ':' + effect.desc + '</li>';
                }
            }
        });
    });

    if (unsupportedEffects.length == 0) {
        window.saveAs(new Blob([JSON.stringify(unit)], {type: "text/json;charset=utf-8"}), "unitForCombat.json");
    } else {
        Modal.confirm("Some effects are not supported yet", "<ul>" + unsupportedEffects + "</ul><br/>Continue nonetheless?", () => {window.saveAs(new Blob([JSON.stringify(unit)], {type: "text/json;charset=utf-8"}), "unitForCombat.json");});
    }


}

function inventoryLoaded() {
    dataStorage.itemInventory = itemInventory;
    $(".equipments select option[value=owned]").prop("disabled", false);
    if (itemInventory.excludeFromExpeditions) {
        $(".equipments select option[value=ownedAvailableForExpedition]").prop("disabled", false);
    }
    if (!dataLoadedFromHash) {
        $(".equipments select").val("owned");
        onEquipmentsChange();
        $(".panel.paramChallenge").removeClass("hidden");
    }
    $("#savedTeamPanel").removeClass("hidden");
    waitingCallbackKeyReady("loginStatus");
    if (builds[0].unit) {
        $("#saveTeamButton").removeClass("hidden");
    }
}

function notLoaded() {
    waitingCallbackKeyReady("loginStatus");
}

function ensureInitUnitWithSkills(unitId) {
    return new Promise(resolve => {
        if (unitsWithSkills[unitId]) {
            resolve(unitsWithSkills[unitId]);
        } else {
            $.get(`/${server}/unit/${unitId}`, function(result) {
                unitsWithSkills[unitId] = result;
                resolve(unitsWithSkills[unitId]);
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                Modal.showErrorGet(this.url, errorThrown);
            });
        }
    });
}

// will be called by common.js at page load
function startPage() {
	progressElement = $("#buildProgressBar .progressBar");
	progressElementModal = $("#buildProgressBar-modal .progressBar");

	$('#useNewJpDamageFormula').prop('checked', true);

	resetMonsterAttack();

	registerWaitingCallback(["data", "unitsWithPassives", "defaultBuilderEspers"], () => {
		readStateHashData(function(hashData) {
			populateUnitSelect();
			prepareSearch(data);
			initWorkerNumber();
			initWorkers();

			if (hashData) {
				loadStateHashAndBuild(hashData);
			} else {
				reinitBuild(currentUnitIndex);
			}

		});
	});

	registerWaitingCallback(["data", "unitsWithPassives", "defaultBuilderEspers", "loginStatus"], () => {
		if (window !== window.parent) {
			window.parent.postMessage(JSON.stringify({'type':'ready'}), '*');
		}
	});

	getStaticData("data", true, function(result) {
		data = result;
		dataStorage.setData(data);
		waitingCallbackKeyReady("data");
	});

	getStaticData("unitsWithPassives", true, function(result) {
		units = result;
		waitingCallbackKeyReady("unitsWithPassives");
	});

	// try to read unit skill from cache
	var unitsWithSkillsData = staticFileCache.retrieve(`${server}/unitsWithSkill.json`);
	if (unitsWithSkillsData && !$.isEmptyObject(unitsWithSkillsData)) {
		unitsWithSkills = unitsWithSkillsData;
	}

	getStaticData("defaultBuilderEspers", false, function(result) {
		espers = [];
		for (var index = result.length; index--;) {
			espers.push(getEsperItem(result[index]))
		}
		updateEspers();

		waitingCallbackKeyReady("defaultBuilderEspers");
	});

	$.get(server + "/units", function(result) {
		ownedUnits = result;
		onEquipmentsChange();
	}, 'json').fail(function(jqXHR, textStatus, errorThrown ) { });

	getStaticData("monsters", false, function(result) {
		bestiary = new Bestiary(result);
		$("#monsterListLink").removeClass("hidden");
	});

	$.get(server + "/defaultExclusionList", function(result) {
		if (Array.isArray(result)) {
			defaultItemsToExclude = result;
			itemsToExclude = defaultItemsToExclude.slice();
		}
		$(".excludedItemNumber").html(itemsToExclude.length);
	}, 'json').fail(function(jqXHR, textStatus, errorThrown ) { });

	$(".includedItemNumber").html(itemsToInclude.length);

	builds[currentUnitIndex] = new UnitBuild(null, [null, null, null, null, null, null, null, null, null, null, null], null);
	builds[currentUnitIndex].monsterAttackFormula = monsterAttackFormula;

	$("#normalGoalChoice").on("select2:select", function() {
		customFormula = null;
		manageMulticast();
		onGoalChange();
	});

	$(".equipments select").change(onEquipmentsChange);

	$("#buildButton").click(onBuildClick);
	$("#buildButton-modal").click(onBuildClick);
	$("#paramChallengeButton").click(findUnitForParamChallenge);

	// Elements
	addIconChoicesTo("elements", elementList, "checkbox", "element", ucFirst);
	addIconChoicesTo("forcedElements", elementList.concat(['noElement']), "checkbox", "element", function(v){
		if (v == "noElement") {
			return "Prevent use of elemental weapons";
		} else {
			return "Force use of " + ucFirst(v);
		}
	});

	addIconChoicesTo("ailmentImunities", ailmentList.slice(0, 9), "checkbox", "ailment", ucFirst);

	// Killers
	var killerRace = ['aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit'];

	addIconChoicesTo("races", killerRace, "checkbox", "race", ucFirst);



	//addTextChoicesTo("races",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});

	addTextChoicesTo("simpleConditionVarious",'checkbox',{'100% physical evasion':'evade.physical', '100% accuracy':'accuracy', '100% draw attacks':'drawAttacks'});

	populateItemStat();
	populateUnitEquip();
	populateResists();

    // Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateSearchResult));
    $('#onlyOwnedItems input').on("input", updateSearchResult);
    $('#excludeNotReleasedYetOption input').on("input", updateSearchResult);
    $('#fixItemModal').on('shown.bs.modal', function () {
        if (!isMobile) {
            $('#searchText').focus();
        }
    })
    $("#customFormulaModal").on('shown.bs.modal', function () {
        $("#customFormulaModal #formulaInput").focus();
    })


    $(".excludedItemNumber").html(itemsToExclude.length);

    $("#forceDoublehand").change(function() {
        if ($("#forceDoublehand").prop('checked')) {
            $('#forceDualWield').prop('checked', false);
        }
    });
    $("#forceDualWield").change(function() {
        if ($("#forceDualWield").prop('checked')) {
            $('#forceDoublehand').prop('checked', false);
        }
    });
    for (let statIndex = baseStats.length; statIndex--;) {
        $(".unitStats .stat." + baseStats[statIndex] + " .pots input").on('input',$.debounce(300,function() {onPotsChange(baseStats[statIndex]);}));
        $(".unitStats .stat." + baseStats[statIndex] + " .buff input").on('input',$.debounce(300,function() {onBuffChange(baseStats[statIndex]);}));
        $(".unitStats .stat." + baseStats[statIndex] + " .pots .leftIcon").click(function(stat) {
            if (builds[currentUnitIndex].unit) {
                var value = parseInt($(".unitStats .stat." + baseStats[statIndex] + " .pots input").val()) || 0;
                if (value < builds[currentUnitIndex].unit.stats.pots[baseStats[statIndex]]) {
                    $(".unitStats .stat." + baseStats[statIndex] + " .pots input").val(builds[currentUnitIndex].unit.stats.pots[baseStats[statIndex]]);
                } else if (value < Math.floor(builds[currentUnitIndex].unit.stats.pots[baseStats[statIndex]] * 1.5)) {
                    $(".unitStats .stat." + baseStats[statIndex] + " .pots input").val(Math.floor(builds[currentUnitIndex].unit.stats.pots[baseStats[statIndex]] * 1.5));
                } else {
                    $(".unitStats .stat." + baseStats[statIndex] + " .pots input").val("0");
                }
                onPotsChange(baseStats[statIndex]);
            }
        });
    }
    $(".unitStats .stat.lbFillRate .buff input").on('input',$.debounce(300,function() {onBuffChange("lbFillRate");}));
    $(".unitStats .stat.lbShardsPerTurn .buff input").on('input',$.debounce(300,function() {onBuffChange("lbFillRate")}));
    $(".unitStats .stat.pMitigation .buff input").on('input',$.debounce(300,function() {onBuffChange("pMitigation")}));
    $(".unitStats .stat.mMitigation .buff input").on('input',$.debounce(300,function() {onBuffChange("mMitigation")}));
    $(".unitStats .stat.mitigation .buff input").on('input',$.debounce(300,function() {onBuffChange("mitigation")}));
    $(".unitStats .stat.drawAttacks .buff input").on('input',$.debounce(300,function() {onBuffChange("drawAttacks")}));
    $(".unitStats .stat.lbDamage .buff input").on('input',$.debounce(300,function() {onBuffChange("lbDamage")}));
    $(".killerBuffs input").on('input',$.debounce(300,function() {onKillerBuffChange();}));
    $(".unitStack input").on('input',$.debounce(300,function() {logCurrentBuild();}));
    $("#multicastSkillsDiv select").change(function() {customFormula = null; logCurrentBuild();});
    $("#paramChallengeSelect").change(function() {
        currentBestParamChallengeBuild.value = 0;
        currentBestParamChallengeBuild.build = null;
        currentUnitIdIndexForParamChallenge = -1
    });

    $("#unitLevel select").change(function() {
        builds[currentUnitIndex].setLevel($("#unitLevel select").val());
        updateUnitStats();
        recalculateApplicableSkills();
        logCurrentBuild();
    });
    $("#unitExAwakeningLevel select").change(function() {
        builds[currentUnitIndex].setExAwakeningLevel(+$("#unitExAwakeningLevel select").val());
        updateUnitStats();
        logCurrentBuild();
    });
    $("#useNewJpDamageFormula").change(function() {logCurrentBuild();});

    $("#monsterStats input").on('input',$.debounce(300,function() {
        readEnnemyStats();
        logCurrentBuild();
    }));
    $("#elementalResists input").on('input',$.debounce(300,function() {
        readEnnemyStats();
        logCurrentBuild();
    }));

    $(".chainMultiplier input").change($.debounce(300,onGoalChange));
    $("#forcedElements input").change($.debounce(300,onGoalChange));
    $("#ailmentImunities input").change($.debounce(300,onGoalChange));

    if (window !== window.parent) {
        window.addEventListener("message", handleExternalControl);
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

let buildCounterThrottle = throttle(logBuildCounter, 1000);

function logBuildCounter() {
    $("#buildCounter, .buildTryDiv").text(buildCounter.toLocaleString());
}

function initWorkers() {
    workers = [];
    for (var index = 0, len = numberOfWorkers; index < len; index++) {
        workers.push(new Worker('/assets/scripts/builder/optimizerWebWorker.js'));
        workers[index].postMessage(JSON.stringify({"type":"init", "allItemVersions":dataStorage.itemWithVariation, "number":index}));
        workers[index].onmessage = function(event) {
            var messageData = JSON.parse(event.data);
            switch(messageData.type) {
                case "buildCounterUpdate":
                    buildCounter += messageData.counter;
                    buildCounterThrottle();
                    break;
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
                        if (runningParamChallenge) {
                            if (messageData.value.max >= currentBestParamChallengeBuild.goal) {
                                // any build will do. We found one, stop there
                                logCurrentBuild();
                                stopBuild();
                                progressElement.width("100%");
                                progressElement.text("100%");

																progressElementModal.width("100%");
																progressElementModal.text("100%");
                                document.title = "100% - FFBE Equip - Builder";
                                updateFindAWayButtonDisplay();
                            } else {
                                if (messageData.value.max > currentBestParamChallengeBuild.value) {
                                    currentBestParamChallengeBuild.build = builds[currentUnitIndex];
                                    currentBestParamChallengeBuild.value = messageData.value.max;
                                }
                            }
                        } else {
                            logCurrentBuild();
                            if ((builds[currentUnitIndex].formula.type == "condition" && builds[currentUnitIndex].formula.formula.type == "value" && builds[currentUnitIndex].formula.formula.name == "any")) {
                                // any build will do. We found one, stop there
                                stopBuild();
                                progressElement.width("100%");
                                progressElement.text("100%");
																progressElementModal.width("100%");
																progressElementModal.text("100%");
                                document.title = "100% - FFBE Equip - Builder";
                            }
                        }
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
																progressElementModal.width(progress + "%");
																progressElementModal.text(progress + "%");
                        document.title = progress + "% - FFBE Equip - Builder";
                    }
                    if (workerWorkingCount == 0) {
                        if (runningParamChallenge) {
                            running = false;
                            findUnitForParamChallenge();
                        } else {
                            if (!builds[currentUnitIndex].buildValue  && builds[currentUnitIndex].formula.condition) {
                                Modal.showMessage("Build error", "The condition set in the goal are impossible to meet.");
                            }
                        }

                        if (initialPinnedWeapons[0] && (builds[currentUnitIndex].fixedItems[0] && builds[currentUnitIndex].fixedItems[0].id != initialPinnedWeapons[0].id || !builds[currentUnitIndex].fixedItems[0]) ||
                           initialPinnedWeapons[1] && (builds[currentUnitIndex].fixedItems[1] && builds[currentUnitIndex].fixedItems[1].id != initialPinnedWeapons[1].id || ! builds[currentUnitIndex].fixedItems[1])) {
                           $.snack('info', 'Weapons hands were switched to optimize build', 5000);
                        }

                        if (secondaryOptimization) {
                            builds[currentUnitIndex].fixedItems = secondaryOptimizationFixedItemSave;
                            builds[currentUnitIndex].formula = secondaryOptimizationFormulaSave;
                            running = false;
                            progressElement.addClass("finished");
                            $("body").removeClass("building");
														$('#buildInProgress').addClass('hidden');

                            console.timeEnd("optimize");
                            updateBuildButtonDisplay();
                            logCurrentBuild();
                            dataStorage.calculateAlreadyUsedItems(builds, currentUnitIndex);
                            builds[currentUnitIndex].prepareEquipable();
                        } else {

                            var overcapedStats = [];
                            for (var i = baseStats.length; i--;) {
                                var percent = calculateStatValue(builds[currentUnitIndex].build, baseStats[i], builds[currentUnitIndex]).bonusPercent;
                                if (percent > getStatBonusCap(baseStats[i])) {
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
                            if (overcapedStats.length > 0 && $("#tryReduceOverCap").prop('checked')) {
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
                                var statToFavor = $("#tryReduceOverCapSelect").val();
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
																$('#buildInProgress').addClass('hidden');

                                if (!runningParamChallenge) {
                                    updateBuildButtonDisplay();
                                    $("body").removeClass("building");
                                }
                                if (window !== window.parent) {
                                    parent.postMessage(JSON.stringify({'type':'buildFinished', 'value':getStateHash(false)}), '*');
                                }
                            }

                        }


                    }
                    break;
            }
        }
    }
}

function populateUnitEquip() {
    var target = $(".unitEquipable .weapons");

    var counter = 0;
    target.html("");
	for (var key in weaponList) {
        counter++;
        if(counter == 9) {
            //var target = $(".unitEquipable.weapons2");
            //target.html("");
        }
        target.append('<i class="icon icon-sm equipment-'+weaponList[key]+' notEquipable" onclick="toogleEquipableType(\'' + weaponList[key] + '\');"><i class="fas fa-angle-double-up boostArrow"></i><i class="fas fa-ban banArrow"></i></i>');
	}
    var target = $(".unitEquipable .armors");
    target.html("");
    for (var key in shieldList) {
        target.append('<i class="icon icon-sm equipment-'+shieldList[key]+' notEquipable" onclick="toogleEquipableType(\'' + shieldList[key] + '\');"><i class="fas fa-angle-double-up boostArrow"></i><i class="fas fa-ban banArrow"></i></i>');
	}
    for (var key in headList) {
        target.append('<i class="icon icon-sm equipment-'+headList[key]+' notEquipable" onclick="toogleEquipableType(\'' + headList[key] + '\');"><i class="fas fa-angle-double-up boostArrow"></i><i class="fas fa-ban banArrow"></i></i>');
	}
    for (var key in bodyList) {
        target.append('<i class="icon icon-sm equipment-'+bodyList[key]+' notEquipable" onclick="toogleEquipableType(\'' + bodyList[key] + '\');"><i class="fas fa-angle-double-up boostArrow"></i><i class="fas fa-ban banArrow"></i></i>');
	}
    if (builds[currentUnitIndex]) {
        builds[currentUnitIndex].bannedEquipableTypes.forEach(type => $('.unitEquipable .equipment-' + type).addClass("banned"));
    }
}

function toogleEquipableType(equipableType) {
    builds[currentUnitIndex].toogleEquipableType(equipableType);
    $('.unitEquipable .equipment-' + equipableType).toggleClass("banned");
}

function populateItemType(equip) {
    var target = $("#fixItemModal .modal-body .nav.type");
    target.html("");
    if (equip.length > 1) {
        target.append("<li class='all sort-type'><a onclick='selectSearchType(" + JSON.stringify(equip) + ");updateSearchResult();'><i class='icon icon-sm sort-all'></i></a></li>");
    }
	for (var key in equip) {
        target.append('<li class="' + equip[key] + ' sort-type"><a onclick="selectSearchType([\'' + equip[key] + '\']);updateSearchResult();">'+
                      '<i class="icon icon-sm equipment-' + equip[key] + '"></i>'+
                      '</a></li>');
	}

}

function populateItemStat() {
    var statList = ["hp", "mp", "atk", "def", "mag", "spr", "evade", "inflict", "resist"];
    var target = $("#fixItemModal .stat .dropdown-menu");
    target.append('<button class="btn btn-primary" onclick="selectSearchStat();updateSearchResult();"><i class="icon icon-sm sort-a-z"></i></button>');
	for (var key in statList) {
        target.append('<button class="btn btn-primary" onclick="selectSearchStat(\'' + statList[key] + '\');updateSearchResult();">'+
                      '<i class="icon icon-sm sort-' + statList[key] + '"></i>' +
                      '</button>');
	}
}

function populateResists() {
    var div = $("#resultStats .resists .elements");
    for (var index in elementList) {
        div.append('<div class="resist ' + elementList[index] + ' ' +  escapeDot("resist|" + elementList[index] + ".percent") + '">'+
                   '<i class="icon icon-sm element-' + elementList[index] + '"></i>'+
                   '<div class="value">0%<div></div>');
    }
    var div = $("#resultStats .resists .ailments");

    for (var index in ailmentList) {
        div.append('<div class="resist ' + ailmentList[index] + ' ' +  escapeDot("resist|" + ailmentList[index] + ".percent") +'">'+
                   '<i class="icon icon-sm ailment-' + ailmentList[index] + '"></i>'+
                   '<div class="value">0%<div></div>');
    }
}

// create new JJV environment
let validator = jjv();

// Register a `user` schema
validator.addSchema('shortLink', {
	type: 'array',
	minItems: 5,
	maxItems: 5,
	items: [
		{
			type: 'array',
			minItems: 3,
			maxItems: 3,
			items: [
				{
					type: 'number'
				},
				{
					type: 'number'
				},
				{
					type: 'array',
					minItems: 6,
					maxItems: 6,
					items: {
						type: 'number'
					}
				}
			]
		},
		{
			type: 'array',
			minItems: 2,
			maxItems: 2,
			items: {
				type: 'number'
			}
		},
		{
			type: 'array',
			minItems: 10,
			maxItems: 10,
			items: {
				type: 'number'
			}
		},
		{
			type: 'array',
			minItems: 0,
			maxItems: 2,
			items: {
				type: 'array',
				minItems: 0,
				maxItems: 3,
				items: {
					type: 'number'
				}
			}
		},
		{
			type: 'array',
			minItems: 0,
			maxItems: 7,
			items: {
				type: 'number'
			}
		},
	]
});

let handleExternalControl = function(message) {
    let data = JSON.parse(message.data);
    console.log("Message received : " + data.type);
    switch(data.type) {
        case 'selectUnit':
            selectUnit(data.value);
            break;
        case 'pinItem':
            fixItem(data.value);
            parent.postMessage(JSON.stringify({'type':'itemPinned' + data.requestId, 'value':''}), '*');
            break;
        case 'checkOption':
            checkbox = $('#' + data.value);
            if (!checkbox.prop('checked')) {
                checkbox.prop('checked', true);
            }
            parent.postMessage(JSON.stringify({'type':'optionChecked' + data.requestId, 'value':''}), '*');
            break;
        case 'uncheckOption':
            checkbox = $('#' + data.value);
            if (checkbox.prop('checked')) {
                checkbox.prop('checked', false);
            }
            parent.postMessage(JSON.stringify({'type':'optionUnchecked' + data.requestId, 'value':''}), '*');
            break;
        case 'setBuff':
            $('.stat.' + data.value.stat + ' .buff input').val(data.value.value);
            onBuffChange(data.value.stat);
            parent.postMessage(JSON.stringify({'type':'buffSet' + data.requestId, 'value':''}), '*');
            break;
        case 'setPot':
            $('.stat.' + data.value.stat + ' .pots input').val(data.value.value);
            onPotsChange(data.value.stat);
            parent.postMessage(JSON.stringify({'type':'potSet' + data.requestId, 'value':''}), '*');
            break;
        case 'setMonsterStats':
            $('#monsterStats .atk .stat').val(data.value.baseAtk);
            $('#monsterStats .mag .stat').val(data.value.basemMag);
            $('#monsterStats .def .stat').val(data.value.baseDef);
            $('#monsterStats .spr .stat').val(data.value.baseSpr);
            $('#monsterStats .atk .break').val(data.value.atkBreak);
            $('#monsterStats .mag .break').val(data.value.magBreak);
            $('#monsterStats .def .break').val(data.value.defBreak);
            $('#monsterStats .spr .break').val(data.value.sprBreak);
            $('#monsterStats .atk .buff').val(data.value.atkBuff);
            $('#monsterStats .mag .buff').val(data.value.magBuff);
            $('#monsterStats .def .buff').val(data.value.defBuff);
            $('#monsterStats .spr .buff').val(data.value.sprBuff);
            parent.postMessage(JSON.stringify({'type':'monsterStatsSet', 'value':''}), '*');
            break;
        case 'setMonsterElementalResist':
            $('.panel.monster #elementalResists .element.' + data.value.element + ' .elementalResist').val(data.value.value);
            parent.postMessage(JSON.stringify({'type':'monsterElementalResistSet' + data.requestId, 'value':''}), '*');
            break;
        case 'setMonsterRaces':
            unselectAll("races");
            select("races", data.value);
            parent.postMessage(JSON.stringify({'type':'monsterRacesSet', 'value':''}), '*');
            break;
        case 'setDefaultEnhancements':
            setDefaultEnhancements(data.value);
            parent.postMessage(JSON.stringify({'type':'defaultEnhancementsSet', 'value':''}), '*');
            break;
        case 'selectGoal':
            chooseCustomFormula(data.value);
            parent.postMessage(JSON.stringify({'type':'goalChanged' + data.requestId, 'value':''}), '*');
            break;
        case 'build':
            build();
            break;
    }
}
