page = "unitSearch";
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedUnits = false;
var unitSearch = [];
var releasedUnits;
var dataById;

var unitSearchFilters = ["imperils","breaks","elements","ailments","imbues","physicalKillers","magicalKillers", "tankAbilities", "mitigation"];

var baseRarity;
var maxRarity;
var skillFilter;
var imperils;
var breaks;
var elements;
var ailments;
var imbues;
var physicalKillers;
var magicalKillers;
var tankAbilities;
var mitigation;

var fullyDisplayedUnits = [];

var defaultFilter = {
    "baseRarity": [],
    "maxRarity": [],
    "skillFilter": {chainFamily:"none", multicastCount:1, excludeUnlockedMulticast : false,"targetAreaTypes": ["ST", "AOE"], "skillTypes": ["actives", "lb"]},
    "imperils": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "lb", "counter"]},
    "breaks": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "lb", "counter"]},
    "elements": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "passives", "lb", "counter"]},
    "ailments": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "passives", "lb", "counter"]},
    "imbues": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "lb"]},
    "physicalKillers": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "passives", "lb"]},
    "magicalKillers": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "passives", "lb"]},
    "tankAbilities": {values: [], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "passives", "lb"]},
    "mitigation":{values:[], "targetAreaTypes": ["SELF", "ST", "AOE"], "skillTypes": ["actives", "passives", "lb"]}
};

// Main function, called at every change. Will read all filters and update the state of the page (including the results)
var update = function() {
	
	readFilterValues();
	updateFilterHeadersDisplay();
    updateHash();
    

    if (searchText.length == 0 && types.length == 0 && elements.values.length == 0 && ailments.values.length == 0 && physicalKillers.values.length == 0 && magicalKillers.values.length == 0 && imperils.values.length == 0 && breaks.values.length == 0 && imbues.values.length == 0 && tankAbilities.values.length == 0 && mitigation.values.length == 0 && baseRarity.length == 0 && maxRarity.length == 0 && skillFilter.chainFamily == "none") {

		// Empty filters => no results
        $("#results").html("");
        $("#results").addClass("notSorted");
        $("#resultNumber").html("Add filters to see results");
        return;
    }
    
	// filter, sort and display the results
    displayUnits(sortUnits(filterUnits(unitSearch, onlyShowOwnedUnits, searchText, types, elements, ailments, physicalKillers, magicalKillers, breaks, baseRarity, maxRarity)));
	
	// If the text search box was used, highlight the corresponding parts of the results
    $("#results").unmark({
        done: function() {
            if (searchText && searchText.length != 0) {
                getSearchTokens(searchText).forEach(function (token) {
                    
                    $("#results").mark(token, {"separateWordSearch": false, "wildcards":"enabled"});
                });
            }
        }
    });
}

// Filter the items according to the currently selected filters. Also if sorting is asked, calculate the corresponding value for each item
var filterUnits = function(searchUnits, onlyShowOwnedUnits = true, searchText = "", types = [], elements = [], ailments = [], physicalKillers = [], magicalKillers = [], breaks = [], baseRarity = [], maxRarity = []) {
    var result = [];
    for (var index = 0, len = searchUnits.length; index < len; index++) {
        var unit = searchUnits[index];
        if (releasedUnits[unit.id]) {
            if (!onlyShowOwnedUnits || ownedUnits && ownedUnits[unit.id]) {
                if (baseRarity.length == 0 || baseRarity.includes(unit.minRarity)) {
                    if (maxRarity.length == 0 || maxRarity.includes(unit.maxRarity)) {
                        if (skillFilter.chainFamily == 'none' || matchesSkill(unit)) {
                            if (types.length == 0 || includeAll(unit.equip, types)) {
                                if (matchesCriteria(elements, unit, "elementalResist")) {
                                    if (matchesCriteria(ailments, unit, "ailmentResist")) {
                                        if (matchesCriteria(physicalKillers, unit, "physicalKillers")) {
                                            if (matchesCriteria(magicalKillers, unit, "magicalKillers")) {
                                                if (matchesCriteria(imperils, unit, "imperil")) {
                                                    if (matchesCriteria(breaks, unit, "break")) {
                                                        if (matchesCriteria(imbues, unit, "imbue")) {
                                                            if (matchesCriteria(tankAbilities, unit, null, true)) {
                                                                if (matchesCriteria(mitigation, unit, null, true)) {
                                                                    if (searchText.length == 0 || containsText(searchText, units[unit.id])) {
                                                                        result.push({
                                                                            "searchData": unit,
                                                                            "unit": units[unit.id]
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
}

function matchesSkill(unit) {
    let matches = matchesSkillCriteria(unit);
    if (matches) {
        if (skillFilter.multicastCount == 1) {
            return true;
        } else {
            let unitWithSkill = units[unit.id];
            let actives = unitWithSkill.actives.concat(unitWithSkill.passives);
            let magics = units[unit.id].magics;
            let chainingActives = unitWithSkill.actives.filter(skill => skill.chainFamily === skillFilter.chainFamily);
            let chainingMagics = magics.filter(skill => skill.chainFamily === skillFilter.chainFamily);
            for (let z = 0; z < actives.length; z++) {
                let active = actives[z];
                if (skillFilter.excludeUnlockedMulticast && active.unlockedBy) {
                    let foundUnlockedByAutocastedTurn1 = false;
                    unitWithSkill.passives.forEach(passive => {
                       passive.effects.forEach(effect => {
                           if (effect.effect && effect.effect.autoCastedSkill && active.unlockedBy.includes(effect.effect.autoCastedSkill.id)) {
                               foundUnlockedByAutocastedTurn1 = true;
                           }
                       });
                    });
                    if (!foundUnlockedByAutocastedTurn1) {
                        continue;
                    }
                }
                for (let i = 0; i < active.effects.length; i++) {
                    let effect = active.effects[i];
                    if (effect.effect && effect.effect.multicast && effect.effect.multicast.time === skillFilter.multicastCount) {
                        let multicastableSkills = null;
                        if (effect.effect.multicast.type == 'magic') {
                            multicastableSkills = chainingMagics;
                        } else if (effect.effect.multicast.type == 'blackMagic') {
                            multicastableSkills = chainingMagics.filter(magic => magic.magic == "black");
                        } else if (effect.effect.multicast.type == 'whiteMagic') {
                            multicastableSkills = chainingMagics.filter(magic => magic.magic == "white");
                        } else if (effect.effect.multicast.type == 'skills') {
                            multicastableSkills = chainingActives.filter(skill => effect.effect.multicast.skills.map(skill => skill.id).includes(skill.id));
                        }
                        if (multicastableSkills && multicastableSkills.length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function matchesSkillCriteria(unit) {
    result = false;

    for (var i = skillFilter.skillTypes.length; i--;) {
        var skillType = skillFilter.skillTypes[i];

        for (var j = skillFilter.targetAreaTypes.length; j--;) {
            var targetArea = skillFilter.targetAreaTypes[j];
            var chainFamilies = unit[skillType][targetArea].chain;
            if (chainFamilies && chainFamilies.includes(skillFilter.chainFamily)) {
                return true;
            }
        }
    }
    return false;
}

function matchesCriteria(criteria, unit, unitProperty, acceptZero = false) {
    result = false;
    var dataArr=[]
    if (criteria.values.length == 0) {
        return true;
    }
    for (var i = criteria.skillTypes.length; i--;) {
        var skillType = criteria.skillTypes[i];
        if (skillType == "passives") {
            var passive = unit.passives;
            if (unitProperty) {
                passive = passive[unitProperty];
            }
            if (containAllKeyPositive(passive, criteria.values, acceptZero)) {
                return true;
            }
        } else {
            for (var j = criteria.targetAreaTypes.length; j--;) {
                var targetArea = criteria.targetAreaTypes[j];
                var dataToCheck = unit[skillType][targetArea];
                if (unitProperty) {
                    dataToCheck = dataToCheck[unitProperty];
                }
                if (Array.isArray(dataToCheck)) {
                    dataArr.push(...dataToCheck)
                    if (includeAll(dataArr, criteria.values)) {
                        return true;
                    }
                } else {
                    if (containAllKeyPositive(dataToCheck, criteria.values, acceptZero)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function sortUnits(units) {
    units.sort(function (unit1, unit2) {
        if (physicalKillers.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = physicalKillers.values.length; i--;) {
                value1 += getValue(unit1.searchData, "physicalKillers", physicalKillers, i);
                value2 += getValue(unit2.searchData, "physicalKillers", physicalKillers, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (magicalKillers.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = magicalKillers.values.length; i--;) {
                value1 += getValue(unit1.searchData, "magicalKillers", magicalKillers, i);
                value2 += getValue(unit2.searchData, "magicalKillers", magicalKillers, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (imperils.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = imperils.values.length; i--;) {
                value1 += getValue(unit1.searchData,"imperil", imperils, i);
                value2 += getValue(unit2.searchData,"imperil", imperils, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (breaks.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = breaks.values.length; i--;) {
                value1 += getValue(unit1.searchData,"break", breaks, i);
                value2 += getValue(unit2.searchData,"break", breaks, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (elements.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = elements.values.length; i--;) {
                value1 += getValue(unit1.searchData,"elementalResist", elements, i);
                value2 += getValue(unit2.searchData,"elementalResist", elements, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (ailments.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = ailments.values.length; i--;) {
                value1 += getValue(unit1.searchData,"ailmentResist", ailments, i);
                value2 += getValue(unit2.searchData,"ailmentResist", ailments, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (tankAbilities.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = tankAbilities.values.length; i--;) {
                value1 += getValue(unit1.searchData,null, tankAbilities, i);
                value2 += getValue(unit2.searchData,null, tankAbilities, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (mitigation.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = mitigation.values.length; i--;) {
                value1 += getValue(unit1.searchData, null, mitigation, i);
                value2 += getValue(unit2.searchData, null, mitigation, i);
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        
        return unit1.unit.name.localeCompare(unit2.unit.name);
    });
    return units;
}

function getValue(unit, type, filterValues, index) {
    var result = 0;
    for (var i = filterValues.skillTypes.length; i--;) {
        var skillType = filterValues.skillTypes[i];
        if (skillType == "passives") {
            var passive = unit.passives;
            if (type) {
                passive = passive[type];
            }
            if (passive && passive[filterValues.values[index]]) {
                result = Math.max(result, passive[filterValues.values[index]]);  
            }
        } else {
            for (var j = filterValues.targetAreaTypes.length; j--;) {
                var targetArea = filterValues.targetAreaTypes[j];
                var skill = unit[skillType][targetArea];
                if (type) {
                    skill = skill[type];
                }
                if (skill && skill[filterValues.values[index]]) {
                    result = Math.max(result, skill[filterValues.values[index]]);
                }
            }
        }
    }
    return result;
}

var containAllKeyPositive = function(object, array, acceptZero = false) {
    if (!object) {
        return false;
    }
    for (var index = array.length; index--;) {
        if (!(array[index] in object) || object[array[index]] < 0 || (!acceptZero && object[array[index]] == 0)) {
            return false;
        }
    }
    return true;
};
                
// Read filter values into the corresponding variables
var readFilterValues = function() {
	searchText = $("#searchText").val().toLocaleLowerCase();
    
    baseRarity = getSelectedValuesFor("baseRarity").map(i => parseInt(i));
    maxRarity = getSelectedValuesFor("maxRarity").map(i => parseInt(i));

    skillFilter.chainFamily = $('#chainFamily').val();
    if (skillFilter.chainFamily === 'none') {
        skillFilter.multicastCount = 1;
    } else {
        skillFilter.multicastCount = parseInt($('#chainMulticastCount').val());
    }
    if (skillFilter.multicastCount > 1) {
        skillFilter.excludeUnlockedMulticast = $('.excludeUnlockedMulticast input').prop('checked');
    } else {
        skillFilter.excludeUnlockedMulticast = false;
    }
    skillFilter.targetAreaTypes = getSelectedValuesFor("chainTargetAreaTypes");
    skillFilter.skillTypes = getSelectedValuesFor("chainSkillTypes");
    
    elements.values = getSelectedValuesFor("elements");
    elements.targetAreaTypes = getSelectedValuesFor("elementsTargetAreaTypes");
    elements.skillTypes = getSelectedValuesFor("elementsSkillTypes");
    
    ailments.values = getSelectedValuesFor("ailments");
    ailments.targetAreaTypes = getSelectedValuesFor("ailmentsTargetAreaTypes");
    ailments.skillTypes = getSelectedValuesFor("ailmentsSkillTypes");
    
    physicalKillers.values = getSelectedValuesFor("physicalKillers");
    physicalKillers.skillTypes = getSelectedValuesFor("killersSkillTypes");
    physicalKillers.targetAreaTypes = getSelectedValuesFor("killersTargetAreaTypes");
    
    magicalKillers.values = getSelectedValuesFor("magicalKillers");
    magicalKillers.skillTypes = physicalKillers.skillTypes;
    magicalKillers.targetAreaTypes = physicalKillers.targetAreaTypes;
    
    imperils.values = getSelectedValuesFor("imperils");
    imperils.targetAreaTypes = getSelectedValuesFor("imperilsTargetAreaTypes");
    imperils.skillTypes = getSelectedValuesFor("imperilsSkillTypes");
    
    breaks.values = getSelectedValuesFor("breaks").map(function(v){return v.replace('break_','');});
    breaks.targetAreaTypes = getSelectedValuesFor("breaksTargetAreaTypes");
    breaks.skillTypes = getSelectedValuesFor("breaksSkillTypes");
    
    imbues.values = getSelectedValuesFor("imbues");
    imbues.targetAreaTypes = getSelectedValuesFor("imbuesTargetAreaTypes");
    imbues.skillTypes = getSelectedValuesFor("imbuesSkillTypes");
    
    tankAbilities.values = getSelectedValuesFor("tankAbilities");
    tankAbilities.skillTypes = getSelectedValuesFor("tankAbilitiesSkillTypes");
    
    mitigation.values = getSelectedValuesFor("mitigation");
    mitigation.targetAreaTypes = getSelectedValuesFor("mitigationTargetAreaTypes");
    mitigation.skillTypes = getSelectedValuesFor("mitigationSkillTypes");

    types = getSelectedValuesFor("types");
    
    onlyShowOwnedUnits = $("#onlyShowOwnedUnits").prop('checked');
}

// Hide or show the "unselect all", "select unit weapons" and so on in the filter headers
var updateFilterHeadersDisplay = function() {
    $(".rarity .unselectAll").toggleClass("hidden", baseRarity.length == 0 && maxRarity.length == 0);
    $(".chainMulticastCountDiv, .chainFamily .filters").toggleClass("hidden", skillFilter.chainFamily == 'none');
    $(".excludeUnlockedMulticast").toggleClass("hidden", skillFilter.multicastCount === 1);
    

    $(".types .unselectAll").toggleClass("hidden", types.length == 0); 
    $(".ailments .unselectAll").toggleClass("hidden", ailments.length == 0); 
    $(".elements .unselectAll").toggleClass("hidden", elements.length == 0); 
    $(".killers .unselectAll").toggleClass("hidden", physicalKillers.length + magicalKillers.length == 0); 
    $(".imperils .unselectAll").toggleClass("hidden", imperils.length == 0); 
    $(".breaks .unselectAll").toggleClass("hidden", breaks.length == 0); 
    $(".tankAbilities .unselectAll").toggleClass("hidden", tankAbilities.length == 0);
    $(".mitigation .unselectAll").toggleClass("hidden", mitigation.length == 0);
    
    $(".elements .filters").toggleClass("hidden", elements.values.length == 0);
    $(".ailments .filters").toggleClass("hidden", ailments.values.length == 0);
    $(".killers .filters").toggleClass("hidden", physicalKillers.values.length + magicalKillers.values.length == 0);
    $(".imperils .filters").toggleClass("hidden", imperils.values.length == 0);
    $(".breaks .filters").toggleClass("hidden", breaks.values.length == 0);
    $(".imbues .filters").toggleClass("hidden", imbues.values.length == 0);
    $(".tankAbilities .filters").toggleClass("hidden", tankAbilities.values.length == 0);
    $(".mitigation .filters").toggleClass("hidden", mitigation.values.length == 0);
    $("#elementsTargetAreaTypes").toggleClass("hidden", !elements.skillTypes.includes("actives") && !elements.skillTypes.includes("lb") && !elements.skillTypes.includes("counter"));
    $("#ailmentsTargetAreaTypes").toggleClass("hidden", !ailments.skillTypes.includes("actives") && !ailments.skillTypes.includes("lb") && !elements.skillTypes.includes("counter"));
    $("#killersTargetAreaTypes").toggleClass("hidden", !physicalKillers.skillTypes.includes("actives") && !physicalKillers.skillTypes.includes("lb") && !elements.skillTypes.includes("counter"));
    $("#imperilsTargetAreaTypes").toggleClass("hidden", !imperils.skillTypes.includes("actives") && !imperils.skillTypes.includes("lb") && !elements.skillTypes.includes("counter"));
    $("#breaksTargetAreaTypes").toggleClass("hidden", !breaks.skillTypes.includes("actives") && !breaks.skillTypes.includes("lb") && !elements.skillTypes.includes("counter"));
    $("#imbuesTargetAreaTypes").toggleClass("hidden", !imbues.skillTypes.includes("actives") && !imbues.skillTypes.includes("lb") && !elements.skillTypes.includes("counter"));
    $("#mitigationTargetAreaTypes").toggleClass("hidden", !mitigation.skillTypes.includes("actives") && !mitigation.skillTypes.includes("lb"));
}


// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units) {
    var resultDiv = $("#results");
    resultDiv.empty();
    displayUnitsAsync(units, 0, resultDiv);
    $("#resultNumber").html(units.length);
    /*$(elementList).each(function(index, resist) {
        if (elements.length != 0 && !elements.includes(resist)) {
            $("#results .tbody .special .resist-" + resist).addClass("notSelected");
        }
    });
    $(ailmentList).each(function(index, resist) {
        if (ailments.length != 0 && !ailments.includes(resist)) {
            $("#results .tbody .special .resist-" + resist).addClass("notSelected");
        }
    });
    $(killerList).each(function(index, killer) {
        if (killers.length != 0 && !killers.includes(killer)) {
            $("#results .tbody .special .killer-" + killer).addClass("notSelected");
        }
    });*/
    if (itemInventory) {
        $("#results .thead .inventory").removeClass("hidden");
    } else {
        $("#results .thead .inventory").addClass("hidden");
    }
    
};

function toogleAllSkillDisplay(unitId) {
    if (fullyDisplayedUnits.includes(unitId)) {
        fullyDisplayedUnits.splice(fullyDisplayedUnits.indexOf(unitId), 1);
    } else {
        fullyDisplayedUnits.push(unitId);
    }
    update();
}

function displayUnitsAsync(units, start, div) {
    var html = '';
    var end = Math.min(start + 20, units.length);
    for (var index = start; index < end; index++) {
        var unitData = units[index];
        html += '<div class="unit">'
        html += '<div class="unitImage"><img src="img/units/unit_icon_' + unitData.unit.id.substr(0, unitData.unit.id.length - 1) + unitData.unit.max_rarity + '.png"/></div>';
        html += '<div class="unitDescriptionLines"><span class="unitName">' + toLink(unitData.unit.name) + '</span>';
        html += '<div class="killers">';
        var killers = [];
        for (var i = killerList.length; i--;) {
            if (unitData.searchData.passives.physicalKillers && unitData.searchData.passives.physicalKillers[killerList[i]]) {
                addToKiller(killers, {"name":killerList[i], "physical":unitData.searchData.passives.physicalKillers[killerList[i]]});
            }
            if (unitData.searchData.passives.magicalKillers && unitData.searchData.passives.magicalKillers[killerList[i]]) {
                addToKiller(killers, {"name":killerList[i], "magical":unitData.searchData.passives.magicalKillers[killerList[i]]});
            }
        }
        var killersHtml = getKillerHtml(killers, physicalKillers.values, magicalKillers.values);
        html += killersHtml.physical;
        html += killersHtml.magical;
        html += '</div>';
        
        html += '<div class="elementalResistances">';
        if (unitData.searchData.passives.elementalResist) {
            for (var i = 0, len = elementList.length; i < len; i++) {
                if (unitData.searchData.passives.elementalResist[elementList[i]]) {
                    html+= '<span class="elementalResistance ' + elementList[i];
                    if (elements.values.includes(elementList[i])) {
                        html+= " selected";
                    }
                    html+= '">';
                    html+= '<i class="img img-element-' + elementList[i] + '"></i>';
                    html+= unitData.searchData.passives.elementalResist[elementList[i]] + '%</span>';
                }
            }
        }
        html += '</div>';
        
        html += '<div class="ailmentResistances">';
        if (unitData.searchData.passives.ailmentResist) {
            for (var i = 0, len = ailmentList.length; i < len; i++) {
                if (unitData.searchData.passives.ailmentResist[ailmentList[i]]) {
                    html+= '<span class="ailmentResistance ' + ailmentList[i];
                    if (ailments.values.includes(ailmentList[i])) {
                        html+= " selected";
                    }
                    html+= '">';
                    html+= '<i class="img img-ailment-' + ailmentList[i] + '"></i>';
                    html+= unitData.searchData.passives.ailmentResist[ailmentList[i]] + '%</span>';
                }
            }
        }
        html += '</div>';
        html += '<span class="showAllSkills glyphicon '
        if (fullyDisplayedUnits.includes(unitData.unit.id)) {
            html += "glyphicon-chevron-up";
        } else {
            html += "glyphicon-chevron-down";
        }
        html += '" onclick="toogleAllSkillDisplay(\'' + unitData.unit.id + '\')"></span>';
        
        skillIdToDisplay = getSkillsToDisplay(unitData.unit);
        
        html += '<div class="lb">';
        if (skillIdToDisplay.includes('lb')) {
            html += getLbHtml(unitData.unit.lb);
        }
        html += '</div>';
        
        let passivesToDisplay = unitData.unit.passives.filter(passive => skillIdToDisplay.includes(passive.id));
        if (passivesToDisplay.length > 0) {
            html += '<div class="passives skillGroup">';
            passivesToDisplay.forEach(passive => html += getSkillHtml(passive, unitData.unit));
            html += '</div>';
        }
        
        let activesToDisplay = unitData.unit.actives.filter(active => skillIdToDisplay.includes(active.id));
        if (activesToDisplay.length > 0) {
            html += '<div class="actives skillGroup">';
            activesToDisplay.forEach(active => html += getSkillHtml(active, unitData.unit));
            html += '</div>';
        }
        
        let magicsToDisplay = unitData.unit.magics.filter(magic => skillIdToDisplay.includes(magic.id));
        if (magicsToDisplay.length > 0) {
            html += '<div class="magics skillGroup">';
            magicsToDisplay.forEach(magic => html += getSkillHtml(magic, unitData.unit));
            html += '</div>';
        }
        
        html += '</div>';
        html += '</div>';
    }
    div.append(html);
    if (index < units.length) {
        setTimeout(displayUnitsAsync, 0, units, index, div);
    } else {
        setTimeout(afterDisplay, 0);
    }
}

function getSkillHtml(skill, unit) {
    var html = '<div class="skill">';
    html += '<div><img class="skillIcon" src="img/items/' + skill.icon + '"/></div>'
    html += '<div class="nameAndEffects"><div class="nameLine"><div><span class="name">' + skill.name;
    if (skill.equipedConditions) {
        html += '<span class="condition">' + getEquipedCondition(skill) + '</span>';
    }
    
    let cooldownHtml = "";
    if (skill.effects[0].effect && skill.effects[0].effect.cooldownSkill) {
        cooldownHtml = '<span class="effect">Available turn ' + skill.effects[0].effect.startTurn + ' (' + skill.effects[0].effect.cooldownTurns + ' turns cooldown):</span>';
        skill = skill.effects[0].effect.cooldownSkill;
    }
    
    html += getDamageTypeHtml(skill.effects).join('');
    html += getInnateElementsHtml(skill.effects).join('');
    html += getChainFamilyHtml(skill);
    
    html += '</span></div>'
    if (skill.rarity && skill.level) {
        html += '<div class="rarityAndLevel"><span class="rarity">' + skill.rarity + '★</span><span class="level">lvl ' + skill.level + '</span></div>'
    }
    html += '</div>';
    html += cooldownHtml;
    html += getWarningStrangeStatsUsed(skill.effects);
    if (skill.unlockedBy) {
        html += getUnlockedByHtml(skill.id, skill.unlockedBy, unit);
    }
    
    for (var j = 0, lenj = skill.effects.length; j < lenj; j++) {
        if (skill.effects[j].effect && skill.effects[j].effect.randomlyUse) {
            html += '<span class="effect">Randomly use :</span>';
            for (var i = 0, len = skill.effects[j].effect.randomlyUse.length; i < len; i++) {
                var randomSkill = skill.effects[j].effect.randomlyUse[i];
                html += '<div class="subSkill">';
                html += '<span class="percent">' + randomSkill.percent + '%</span>'
                html += getSkillHtml(randomSkill.skill, unit);
                html += '</div>';
            }
        } else if (skill.effects[j].effect && skill.effects[j].effect.counterSkill) {
            html += '<span class="effect">' + skill.effects[j].effect.percent + '% chance to counter ' + skill.effects[j].effect.counterType + ' attacks with :</span>';
            html += '<div class="subSkill">';
            html += getSkillHtml(skill.effects[j].effect.counterSkill, unit);
            html += '</div>';
        } else if (skill.effects[j].effect && skill.effects[j].effect.autoCastedSkill) {
            html += '<span class="effect">Cast at the start of battle or when revived :</span>';
            html += '<div class="subSkill">';
            html += getSkillHtml(skill.effects[j].effect.autoCastedSkill, unit);
            html += '</div>';
        } else if (skill.effects[j].effect && skill.effects[j].effect.gainSkills) {
            html += '<span class="effect">Gain for ';
            if (skill.effects[j].effect.gainSkills.turns === 0) {
                html += 'current turn'
            } else {
                html += skill.effects[j].effect.gainSkills.turns + ' turns';
            }
            html += ':</span>';
            skill.effects[j].effect.gainSkills.skills.forEach(skill => {
                let activesAndMagics = unit.actives.concat(unit.magics);
                activesAndMagics.filter(gainedSkill => gainedSkill.id === skill.id).forEach(skill => {
                    html += '<div class="subSkill">';
                    html += getSkillHtml(skill, unit);
                    html += '</div>';
                });
            });
        } else {
            html += '<span class="effect">' + getEffectDescription(skill.effects[j]) + '</span>';    
        }
    }
    html += '</div></div>'; 
    return html;
}

function getUnlockedByHtml(skillId, unlockerSkillIds, unit) {
    let html = "";
    unlockerSkillIds.forEach(id => {
        if (id === 'lb') {
            html += addGetUnlockedBySkillHtml(skillId, unit, unit.lb.maxEffects, 'LB');
        } else {
            unit.actives.filter(skill => skill.id === id || skill.effects[0].effect && skill.effects[0].effect.cooldownSkill && skill.effects[0].effect.cooldownSkill.id ===id ).forEach(skill => {
                html += addGetUnlockedBySkillHtml(skillId, unit, skill.effects, skill.name);
            });
            unit.actives.filter(skill => skill.effects[0].effect && skill.effects[0].effect.cooldownSkill && skill.effects[0].effect.cooldownSkill.id ===id ).forEach(skill => {
                html += addGetUnlockedBySkillHtml(skillId, unit, skill.effects[0].effect.cooldownSkill.effects, skill.effects[0].effect.name);
            });
            unit.passives.filter(skill => skill.id === id).forEach(skill => {
                skill.effects.forEach(effect => {
                    if (effect.effect && effect.effect.autoCastedSkill) {
                        if (effect.effect.autoCastedSkill.id === skillId) {
                            html += '<div class="unlockedBy"><i class="fas fa-unlock-alt"></i>Autocasted at start of battle by ' + skill.name + '</div>';
                        }
                    }
                });
            });
        }
    });
    return html;
}

function addGetUnlockedBySkillHtml(skillId, unit, testedSkillEffects, testedSkillName) {
    let html = "";
    testedSkillEffects.forEach(effect => {
        if (effect.effect && effect.effect.gainSkills) {
            if (effect.effect.gainSkills.skills.map(skill => skill.id).includes(skillId)) {
                html += '<div class="unlockedBy"><i class="fas fa-unlock-alt"></i>Unlocked by ' + testedSkillName + ' for ';
                if (effect.effect.gainSkills.turns === 0) {
                    html += 'current turn';
                } else {
                    html += effect.effect.gainSkills.turns + ' turn(s)';
                }
                html += '</div>'
            }
        }
    });
    return html;
}

function getInnateElementsHtml(effects) {
    let elements = [];
    effects.forEach(effect => {
        if (effect.effect && effect.effect.damage) {
            let damage = effect.effect.damage;
            if (damage.elements) {
                damage.elements.forEach(element => {
                   if (!elements.includes(element)) {
                        elements.push(element);
                    }
                });
            }
        }
    });
    return elements.map(element => '<i class="img img-element-'+ element + '"></i>');
}

function getDamageTypeHtml(effects) {
    let damageTypes = [];
    effects.forEach(effect => {
        if (effect.effect && effect.effect.damage) {
            let damageType = "";
            let damage = effect.effect.damage;
            if (damage.mecanism === "physical") {
               damageType = '<i class="img img-equipment-sword"></i>';
            } else if (damage.mecanism === "magical") {
               damageType = '<i class="img img-equipment-rod"></i>';
            } else if (damage.mecanism === "hybrid") {
               damageType = '<i class="img img-equipment-hybrid"></i>';
            }
            if (!damageTypes.includes(damageType)) {
                damageTypes.push(damageType);
            }
        }
    });
    return damageTypes;
}

function getChainFamilyHtml(skill) {
    if (skill.chainFamily) {
        return '<span class="chainFamily"><span class="bullet" title="' + chainFamilySkillName[skill.chainFamily] + '"><i class="fas fa-link"></i></span>' + skill.chainFamily + '</span>';
    } else {
        return '';
    }
}

function getWarningStrangeStatsUsed(effects) {
    for (var j = 0, lenj = effects.length; j < lenj; j++) {
        let effect = effects[j];
        if (effect.effect && effect.effect.damage) {
            let damageType = "";
            let damage = effect.effect.damage;
            if (damage.mecanism === "physical") {
                if (damage.damageType === "mind") {
                    if (damage.use) {
                        return '<span class="strangeStatsUsed"><i class="fas fa-exclamation-triangle"></i>Uses <span class="stat">' + damage.use.stat + '</span> to damage monster <span class="monsterStat">SPR</span></span>';
                    } else {
                        return '<span class="strangeStatsUsed"><i class="fas fa-exclamation-triangle"></i>Uses <span class="stat">MAG</span> to damage monster <span class="monsterStat">SPR</span></span>';
                    }
                } else if (damage.use) {
                    return '<span class="strangeStatsUsed"><i class="fas fa-exclamation-triangle"></i>Uses <span class="stat">' + damage.use.stat + '</span></span>';
                }
            } else if (damage.mecanism === "magical") {
               if (damage.damageType === "body") {
                    if (damage.use) {
                        return '<span class="strangeStatsUsed"><i class="fas fa-exclamation-triangle"></i>Uses <span class="stat">' + damage.use.stat + '</span> to damage monster <span class="monsterStat">DEF</span></span>';
                    } else {
                        return '<span class="strangeStatsUsed"><i class="fas fa-exclamation-triangle"></i>Uses <span class="stat">ATK</span> to damage monster <span class="monsterStat">DEF</span></span>';
                    }
                } else if (damage.use) {
                    return '<span class="strangeStatsUsed"><i class="fas fa-exclamation-triangle"></i>Uses <span class="stat">' + damage.use.stat + '</span></span>';
                }
            }
        }
    }
    return "";
}

function getLbHtml(lb) {
    var html = '<div class="skill">';
    html += '<div><img class="skillIcon" src="img/icons/lb.png"/></div>'
    html += '<div class="nameAndEffects"><span class="name">Limit Burst : ' + lb.name;
    html += getDamageTypeHtml(lb.maxEffects).join('');
    html += getInnateElementsHtml(lb.maxEffects).join('');
    html += getChainFamilyHtml(lb);
    html += '</span>';
    html += getWarningStrangeStatsUsed(lb.maxEffects);
    html += '<div class="subSkill">';
    html += '<span class="case">Min :</span>'
    html += '<div class="skill"><div class="nameAndEffects">';
    for (var j = 0, len = lb.minEffects.length; j < len; j++) {
        html += '<span class="effect">' + getEffectDescription(lb.minEffects[j]) + '</span>';   
    }
    html += '</div></div>';
    html += '</div>';
    html += '<div class="subSkill">';
    html += '<span class="case">Max :</span>'
    html += '<div class="skill"><div class="nameAndEffects">';
    for (var j = 0, len = lb.maxEffects.length; j < len; j++) {
        html += '<span class="effect">' + getEffectDescription(lb.maxEffects[j]) + '</span>';   
    }
    html += '</div></div>';
    html += '</div>';
    
    html += '</div></div>'; 
    return html;
}

function getSkillsToDisplay(unit) {
    if (fullyDisplayedUnits.includes(unit.id)) {
        return unit.passives.concat(unit.actives).concat(unit.magics).map(skill => skill.id).concat('lb');
    } else {
        let result = [];
        let multicastSkills = {};
        let multicastMagic = {};
        if (skillFilter.multicastCount > 1) {
            unit.actives.concat(unit.passives).forEach(skill => {
                if (skillFilter.excludeUnlockedMulticast && skill.unlockedBy) {
                    let foundUnlockedByAutocastedTurn1 = false;
                    unit.passives.forEach(passive => {
                       passive.effects.forEach(effect => {
                           if (effect.effect && effect.effect.autoCastedSkill && skill.unlockedBy.includes(effect.effect.autoCastedSkill.id)) {
                               foundUnlockedByAutocastedTurn1 = true;
                           }
                       });
                    });
                    if (!foundUnlockedByAutocastedTurn1) {
                        return;
                    }
                }
                skill.effects.forEach(effect => {
                    if (effect.effect && effect.effect.multicast && effect.effect.multicast.time === skillFilter.multicastCount) {
                        switch(effect.effect.multicast.type) {
                            case 'skills':
                                multicastSkills[skill.id] = effect.effect.multicast.skills.map(skill => skill.id);
                                break;
                            case 'magic':
                            case 'blackMagic':
                            case 'whiteMagic':
                                multicastMagic[skill.id] = effect.effect.multicast.type;
                                break;
                        }
                    }
                });
            });
        }
        let skillsDisplayedForChain = [];
        if (mustDisplaySkillForChainFamily(unit.lb, unit.lb.maxEffects, "lb") || mustDisplaySkill(unit.lb, unit.lb.maxEffects, "lb", unit.lb.name)) {
            result.push('lb');
        } 
        unit.passives.forEach(passive => {
            if (mustDisplaySkill(passive, passive.effects, "passives", passive.name)) {
                result.push(passive.id);
            }
        });
        unit.actives.forEach(active => {
            let multicastForThisSkill = Object.keys(multicastSkills).filter(id => multicastSkills[id].includes(active.id));
            if (mustDisplaySkillForChainFamily(active, active.effects, 'actives', multicastForThisSkill)) {
                skillsDisplayedForChain.push(active.id);
                result.push(active.id);
            } else if (mustDisplaySkill(active, active.effects, "actives", active.name)) {
                result.push(active.id);        
            }
        });
        unit.magics.forEach(magic => {
            let multicastForThisSkill = Object.keys(multicastMagic).filter(id => multicastMagic[id] === 'magic' || multicastMagic[id] === 'blackMagic' && magic.magic === 'black' || multicastMagic[id] === 'white  Magic' && magic.magic === 'white');
            if (mustDisplaySkillForChainFamily(magic, magic.effects, 'actives', multicastForThisSkill)) {
                if (!skillsDisplayedForChain.includes(magic.magic)) {
                    skillsDisplayedForChain.push(magic.magic);
                }
                result.push(magic.id);
            } else if (mustDisplaySkill(magic, magic.effects, "actives", magic.name)) {
                result.push(magic.id);        
            }
        });
        if (skillFilter.multicastCount > 1) {
            skillsDisplayedForChain.forEach(multicastedId => {
                Object.keys(multicastSkills).forEach(id => {
                   if (multicastSkills[id].includes(multicastedId) && !result.includes(id)) {
                       result.push(id);
                   } 
                });
                Object.keys(multicastMagic).forEach(id => {
                   if ((multicastMagic[id] === 'magic' || multicastMagic[id] === 'blackMagic' && multicastedId === 'black' || multicastMagic[id] === 'whiteMagic' && multicastedId === 'white') && !result.includes(id)) {
                       result.push(id);
                   } 
                });
            });
        }
        return result;
    }
}

function mustDisplaySkill(skill, effects, type, skillName) {
    var mustBeDisplayed = false;
    if (skillName && matchesOneSearchToken(searchText, skillName)) {
        return true;
    }

    for (var j = effects.length; j--;) {
        var effect = effects[j];
        if (effect.desc && matchesOneSearchToken(searchText, effect.desc)) {
            return true;
        }
        if (effect.effect) {
            if (types.length > 0 && effect.effect.equipedConditions && matches(effect.effect.equipedConditions, types)) {
                return true;
            }
            if (elements.values.length > 0 && elements.skillTypes.includes(type) && isTargetToBeDispalyed(elements, effect, type) && effect.effect.resist && matches(elements.values, effect.effect.resist.map(function(resist){return resist.name;}))) {
                return true;
            }
            if (ailments.values.length > 0 && ailments.skillTypes.includes(type) && isTargetToBeDispalyed(ailments, effect, type) && effect.effect.resist && matches(ailments.values, effect.effect.resist.map(function(resist){return resist.name;}))) {
                return true;
            }
            if (physicalKillers.values.length > 0 && physicalKillers.skillTypes.includes(type) && isTargetToBeDispalyed(physicalKillers, effect, type) && effect.effect.killers && matches(physicalKillers.values, effect.effect.killers.map(function(killer){return killer.name;}))) {
                return true;
            }
            if (magicalKillers.values.length > 0 && magicalKillers.skillTypes.includes(type) && isTargetToBeDispalyed(magicalKillers, effect, type) && effect.effect.killers && matches(magicalKillers.values, effect.effect.killers.map(function(killer){return killer.name;}))) {
                return true;
            }
            if (imperils.values.length > 0 && imperils.skillTypes.includes(type) && isTargetToBeDispalyed(imperils, effect, type) && effect.effect.imperil && matches(imperils.values, Object.keys(effect.effect.imperil))) {
                return true;
            }
            if (breaks.values.length > 0 && breaks.skillTypes.includes(type) && isTargetToBeDispalyed(breaks, effect, type) && effect.effect.break && matches(breaks.values, Object.keys(effect.effect.break))) {
                return true;
            }
            if (imbues.values.length > 0 && imbues.skillTypes.includes(type) && isTargetToBeDispalyed(imbues, effect, type) && effect.effect.imbue && matches(imbues.values, effect.effect.imbue)) {
                return true;
            }
            if (mitigation.values.length > 0 && mitigation.skillTypes.includes(type) && isTargetToBeDispalyed(mitigation, effect, type)) {
                if (matches(mitigation.values, Object.keys(effect.effect))) {
                    return true;
                }
            }
            if (tankAbilities.values.length > 0 && tankAbilities.skillTypes.includes(type) && isTargetToBeDispalyed(tankAbilities, effect, type)) {
                if (matches(tankAbilities.values, Object.keys(effect.effect))) {
                    return true;
                }
                if (tankAbilities.values.includes("physicalAoeCover") && effect.effect.aoeCover && effect.effect.aoeCover.type == "physical") {
                    return true;
                }
                if (tankAbilities.values.includes("magicalAoeCover") && effect.effect.aoeCover && effect.effect.aoeCover.type == "magical") {
                    return true;
                }
            }
            if (effect.effect.randomlyUse) {
                for (var i = effect.effect.randomlyUse.length; i--;) {
                    if (mustDisplaySkill(effect.effect.randomlyUse[i].skill, effect.effect.randomlyUse[i].skill.effects, type)) {
                        return true;
                    }
                }
            }
            if (effect.effect.cooldownSkill) {
                if (mustDisplaySkill(effect.effect.cooldownSkill, effect.effect.cooldownSkill.effects, type)) {
                    return true;
                }
            }
            if (effect.effect.counterSkill) {
                if (mustDisplaySkill(effect.effect.counterSkill, effect.effect.counterSkill.effects, "counter")) {
                    return true;
                }
            }
            if (effect.effect.autoCastedSkill) {
                if (mustDisplaySkill(effect.effect.autoCastedSkill, effect.effect.autoCastedSkill.effects, type)) {
                    return true;
                }
            }
        }
    }
}

function mustDisplaySkillForChainFamily(skill, effects, type, multicastSkills = []) {
    let chainFamilyMatches = false;
    if (skillFilter.chainFamily != 'none' && skill.chainFamily === skillFilter.chainFamily) {
        if (skillFilter.multicastCount == 1 || multicastSkills.length > 0) {
            chainFamilyMatches = true;
        }
    }
    for (var j = effects.length; j--;) {
        var effect = effects[j];
        if (effect.effect && effect.effect.damage && chainFamilyMatches && skillFilter.skillTypes.includes(type) && isTargetToBeDispalyed(skillFilter, effect, type)) {
            return true;
        }
        if (effect.effect && effect.effect.cooldownSkill) {
             if (mustDisplaySkillForChainFamily(effect.effect.cooldownSkill, effect.effect.cooldownSkill.effects, type, multicastSkills)) {
                 return true;
             }
        }
    }
}

function matchesOneSearchToken(searchText, text) {
    let tokens = getSearchTokens(searchText);
    for (let i = 0; i < tokens.length; i++) {
        if (matchesToken(tokens[i], text)) {
            return true;
        }
    }
    return false;
}

function isTargetToBeDispalyed(criteria, effect, type) {
    if (type == "passives") {
        return true;
    } else {
        return criteria.targetAreaTypes.includes(effect.effect.area);
    }
}

function afterDisplay() {
    /*$(elementList).each(function(index, resist) {
        if (elements.length != 0 && !elements.includes(resist)) {
            $("#results .tbody .special .resist-" + resist).addClass("notSelected");
        }
    });
    $(ailmentList).each(function(index, resist) {
        if (ailments.length != 0 && !ailments.includes(resist)) {
            $("#results .tbody .special .resist-" + resist).addClass("notSelected");
        }
    });
    $(killerList).each(function(index, killer) {
        if (killers.length != 0 && !killers.includes(killer)) {
            $("#results .tbody .special .killer-" + killer).addClass("notSelected");
        }
    });*/
    if (itemInventory) {
        $("#results .thead .inventory").removeClass("hidden");
    } else {
        $("#results .thead .inventory").addClass("hidden");
    }
    
}

// Unselect all values for a filter of the given type. if runUpdate = true, then call update() function
function unselectAll(type, runUpdate) {
    runUpdate = runUpdate || true;
    $('.active input[name='+ type +']').each(function(index, checkbox) {
        $(checkbox).prop('checked', false);
        $(checkbox).parent().removeClass('active');
    });
    if (runUpdate) {
        update();
    }
};


function inventoryLoaded() {
    $("#onlyShowOwnedUnitsDiv").removeClass("hidden");
    if (data) {
        update();
    }
}

function notLoaded() {
    
}

function initFilters() {
    var state;
    if (window.location.hash != '') {
        state = JSON.parse(window.atob(window.location.hash.substring(1)));
    } else {
        state = defaultFilter;
    }
    
    if (state.searchText) {
        $("#searchText").val(state.searchText);
    }
    if (state.skillFilter) {
        skillFilter = state.skillFilter;
    } else {
        skillFilter = defaultFilter.skillFilter;
    }
    $('#chainFamily').val(skillFilter.chainFamily);
    $('#chainMulticastCount').val(skillFilter.multicastCount);
    select("chainSkillTypes", skillFilter.skillTypes);
    select("chainTargetAreaTypes", skillFilter.targetAreaTypes);

    if (state.baseRarity) {
        baseRarity = state.baseRarity;
        select("baseRarity", baseRarity.map(r => r.toString()));
    }
    if (state.maxRarity) {
        maxRarity = state.maxRarity;
        select("maxRarity", maxRarity.map(r => r.toString()));
    }
    if (state.equipmentTypes) {
        types = state.equipmentTypes;
        select("types", types);
    }
    for (var i = unitSearchFilters.length; i--;) {
        if (state[unitSearchFilters[i]]) {
            window[unitSearchFilters[i]] = state[unitSearchFilters[i]];
        } else {
            window[unitSearchFilters[i]] = defaultFilter[unitSearchFilters[i]];
        }
        if (unitSearchFilters[i] == 'breaks') {
            select(unitSearchFilters[i], window[unitSearchFilters[i]].values.map(v => 'break_' + v));
        } else {
            select(unitSearchFilters[i], window[unitSearchFilters[i]].values);    
        }
        select(unitSearchFilters[i] + "SkillTypes", window[unitSearchFilters[i]].skillTypes);
        select(unitSearchFilters[i] + "TargetAreaTypes", window[unitSearchFilters[i]].targetAreaTypes);
    }
    
    select("killersSkillTypes", physicalKillers.skillTypes);
    select("killersTargetAreaTypes", physicalKillers.targetAreaTypes);
}

function prepareUnitSearch() {
    for(const [id, unit] of Object.entries(units)) {
        let textToSearch = unit.name.toLowerCase();
        for (i = 0; i < unit.magics.length; i++) {
            textToSearch += "|" + getSkillSearchText(unit.magics[i]);
        }
        for (i = 0; i < unit.actives.length; i++) {
            textToSearch += "|" + getSkillSearchText(unit.actives[i]);
        }
        for (i = 0; i < unit.passives.length; i++) {
            textToSearch += "|" + getSkillSearchText(unit.passives[i]);
        }
        textToSearch += "|" + unit.lb.name.toLowerCase();
        for (i = 0; i < unit.lb.maxEffects.length; i++) {
            let effect = unit.lb.maxEffects[i];
            if(effect.desc != null) {
                textToSearch += "|" + effect.desc.toLowerCase();
            }
        }
        unit.searchString = textToSearch;
    }
}

function getSkillSearchText(skill) {
    var textToSearch = skill.name.toLowerCase();
    for (let j = 0; j < skill.effects.length; j++) {
        let effect = skill.effects[j];
        if(effect.desc != null) {
            textToSearch += "|" + effect.desc.toLowerCase();
        }
        if (effect.effect && effect.effect.cooldownSkill) {
            textToSearch += '|Available turn ' + effect.effect.startTurn + ' (' + effect.effect.cooldownTurns + ' turns cooldown)';
            textToSearch += '|' + getSkillSearchText(effect.effect.cooldownSkill);
        }
        if (effect.effect && effect.effect.counterSkill) {
            textToSearch += '|' + effect.effect.percent + '% chance to counter ' + effect.effect.counterType + ' attacks with :';
            textToSearch += '|' + getSkillSearchText(effect.effect.counterSkill);
        }
        if (effect.effect && effect.effect.autoCastedSkill) {
            textToSearch += '|Cast at the start of battle or when revived :';
            textToSearch += '|' + getSkillSearchText(effect.effect.autoCastedSkill);
        }
    }
    return textToSearch;
}

function updateHash() {
    var state = {};
    
    for (var i = unitSearchFilters.length; i--;) {
        if (window[unitSearchFilters[i]].values.length > 0) {
            state[unitSearchFilters[i]] = window[unitSearchFilters[i]];
        }
    }
    
    if (searchText.length > 0) {
        state.searchText = searchText;
    }
    if (types && types.length > 0) {
        state.equipmentTypes = types;
    }
    if (baseRarity.length > 0) {
        state.baseRarity = baseRarity;
    }
    if (maxRarity.length > 0) {
        state.maxRarity = maxRarity;
    }
    if (skillFilter.chainFamily != 'none') {
        state.skillFilter = skillFilter;
    }
    
    window.location.hash = '#' + window.btoa(JSON.stringify(state));
}

function populateSkillChain() {
    let options = '<option value="none">No filter</option>';
    Object.keys(chainFamilySkillName).sort().forEach(chain => {
        options += '<option value="' + chain + '">' + chain + ' - ' + chainFamilySkillName[chain] + '</options>';
    });
    $('#chainFamily').html(options);
}

// will be called by common.js at page load
function startPage() {
    // Triggers on unit base stats change
	$(baseStats).each(function (index, value) {
        $("#baseStat_" + value).on("input", $.debounce(300,update));
    });
    
    // Reset search if escape is used
    $(window).on('keyup', function (e) {
        if (e.keyCode === 27) {
            $("#searchText").val('').trigger('input').focus();
        }
    });
    
    // Populates the various filters
	
    // Rarity
    addTextChoicesTo("maxRarity",'checkbox',{'2★':'2', '3★':'3','4★':'4','5★':'5', '6★':'6', '7★':'7'});
    addTextChoicesTo("baseRarity",'checkbox',{'1★':'1','2★':'2', '3★':'3','4★':'4','5★':'5'});

    // Chaining skill
    populateSkillChain();
    addTextChoicesTo("chainSkillTypes",'checkbox',{'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("chainTargetAreaTypes",'checkbox',{'ST':'ST', 'AOE':'AOE'});

	// Elements
	addIconChoicesTo("elements", elementList, "checkbox", "element", function(v){return ucFirst(v)+" resistance"});
    addTextChoicesTo("elementsSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb', 'Counter': 'counter'});
    addTextChoicesTo("elementsTargetAreaTypes",'checkbox',{'Self':'SELF', 'ST':'ST', 'AOE':'AOE'});
    
	// Ailments
    addIconChoicesTo("ailments", 
                     ailmentList.concat("stop", "charm", "break_atk", "break_def", "break_mag", "break_spr"), "checkbox", "ailment",
                     function(v){return (v.indexOf('break') === 0 ? "Break " + v.replace('break_','').toUpperCase() : ucFirst(v))+" resistance"});
    addTextChoicesTo("ailmentsSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb', 'Counter': 'counter'});
    addTextChoicesTo("ailmentsTargetAreaTypes",'checkbox',{'Self':'SELF','ST':'ST', 'AOE':'AOE'});
    
	// Killers
	addIconChoicesTo("physicalKillers", killerList, "checkbox", "killer-physical", function(v){return "Physical "+v+" killer"});
    addIconChoicesTo("magicalKillers", killerList, "checkbox", "killer-magical", function(v){return "Magical "+v+" killer"});
    addTextChoicesTo("killersSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("killersTargetAreaTypes",'checkbox',{'Self':'SELF', 'ST':'ST', 'AOE':'AOE'});
    
	// Imperils
	addIconChoicesTo("imperils", elementList, "checkbox", "element", function(v){return ucFirst(v)+" imperil"});
    addTextChoicesTo("imperilsSkillTypes",'checkbox',{'Active':'actives', 'LB':'lb', 'Counter': 'counter'});
    addTextChoicesTo("imperilsTargetAreaTypes",'checkbox',{'Self':'SELF','ST':'ST', 'AOE':'AOE'});
    
    // Breaks
    addIconChoicesTo("breaks", ['break_atk', 'break_def', 'break_mag', 'break_spr'], "checkbox", "ailment", 
                     function(v){return v.replace('break_','').toUpperCase()+" break"});
    addTextChoicesTo("breaksSkillTypes",'checkbox',{'Active':'actives', 'LB':'lb', 'Counter': 'counter'});
    addTextChoicesTo("breaksTargetAreaTypes",'checkbox',{'Self':'SELF','ST':'ST', 'AOE':'AOE'});
    
    // Imbues
	addIconChoicesTo("imbues", elementList, "checkbox", "element", function(v){return "Imbue "+v});
    addTextChoicesTo("imbuesSkillTypes",'checkbox',{'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("imbuesTargetAreaTypes",'checkbox',{'Self':'SELF', 'ST':'ST', 'AOE':'AOE'});
    
    // Tank abilities
    addIconChoicesTo("tankAbilities", ["drawAttacks", "stCover", "physicalAoeCover", "magicalAoeCover"], "checkbox", "tankAbilities", ["Draw Attacks", "ST Cover", "Physical AOE Cover", "Magical AOE Cover"]);
    addTextChoicesTo("tankAbilitiesSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb'});
    

    // Mitigation
    addIconChoicesTo("mitigation", ["globalMitigation", "magicalMitigation", "physicalMitigation"], "checkbox", "mitigation", ["Mitigation", "Magic Mitigation", "Physical Mitigation"])
    addTextChoicesTo("mitigationSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("mitigationTargetAreaTypes",'checkbox',{'Self':'SELF','ST':'ST', 'AOE':'AOE'});

    // Item types
    addIconChoicesTo("types", typeList.slice(0,typeList.length-2), "checkbox", "equipment", function(v){return typeListLitterals[v]});
    
    $("#results").addClass(server);
    
	// Triggers on filter selection
	$('.choice input').change($.debounce(300,update));
    $('.chainFamily select').change(update);
    $('.chainFamily input').change(update);
    
	
	// Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,update));
    
	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("data", true, function(result) {
        data = result;
        dataById = {};
        result.forEach(e => dataById[e.id] = e);
        getStaticData("unitsWithSkill", false, function(result) {
            units = result;
            prepareUnitSearch();
            getStaticData("unitSearch", false, function(result) {    
                unitSearch = result;
                getStaticData("releasedUnits", false, function(result) {    
                    releasedUnits = result;
                    initFilters();
                    update();
                });
            });
        });
    });
}
