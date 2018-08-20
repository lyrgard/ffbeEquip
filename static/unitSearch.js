page = "unitSearch";
var defaultFilter = {};
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedUnits = false;
var unitSearch = [];
var releasedUnits;
var imperils = {values: [], "targetAreaTypes": [], "skillTypes": ["actives", "lb"]};
var breaks = {values: [], "targetAreaTypes": [], "skillTypes": ["actives", "lb"]};
var elements = {values: [], "targetAreaTypes": [], "skillTypes": []};
var ailments = {values: [], "targetAreaTypes": [], "skillTypes": []};
var physicalKillers = {values: [], "targetAreaTypes": ["ST", "AOE"], "skillTypes": ["actives", "passives", "lb"]};
var magicalKillers = {values: [], "targetAreaTypes": ["ST", "AOE"], "skillTypes": ["actives", "passives", "lb"]};

// Main function, called at every change. Will read all filters and update the state of the page (including the results)
var update = function() {
	
	readFilterValues();
	updateFilterHeadersDisplay();
    
    if (searchText.length == 0 && types.length == 0 && elements.values.length == 0 && ailments.values.length == 0 && physicalKillers.values.length == 0 && magicalKillers.values.length == 0 && imperils.values.length == 0 && breaks.values.length == 0) {
		// Empty filters => no results
        $("#results").html("");
        $("#results").addClass("notSorted");
        $("#resultNumber").html("Add filters to see results");
        return;
    }
    
	// filter, sort and display the results
    displayUnits(sortUnits(filterUnits(unitSearch, onlyShowOwnedUnits, searchText, types, elements, ailments, physicalKillers, magicalKillers, breaks)));
	
	// If the text search box was used, highlight the corresponding parts of the results
    $("#results").unmark({
        done: function() {
            if (searchText && searchText.length != 0) {
                searchText.split(" ").forEach(function (token) {
                    $("#results").mark(token);
                });
            }
        }
    });
}

// Filter the items according to the currently selected filters. Also if sorting is asked, calculate the corresponding value for each item
var filterUnits = function(searchUnits, onlyShowOwnedUnits = true, searchText = "", types = [], elements = [], ailments = [], physicalKillers = [], magicalKillers = [], breaks = []) {
    var result = [];
    for (var index = 0, len = searchUnits.length; index < len; index++) {
        var unit = searchUnits[index];
        if (releasedUnits[unit.id]) {
            if (searchText.length == 0 || units[unit.id].name.toLowerCase().indexOf(searchText) >= 0 ) {
                if (!onlyShowOwnedUnits || ownedUnits && ownedUnits[unit.id]) {
                    if (types.length == 0 || includeAll(unit.equip, types)) {
                        if (matchesCriteria(elements, unit, "elementalResist")) {
                            if (matchesCriteria(ailments, unit, "ailmentResist")) {
                                if (matchesCriteria(physicalKillers, unit, "physicalKillers")) {
                                    if (matchesCriteria(magicalKillers, unit, "magicalKillers")) {
                                        if (matchesCriteria(imperils, unit, "imperil")) {
                                            if (matchesCriteria(breaks, unit, "break")) {                                    
                                                result.push({"searchData": unit, "unit": units[unit.id]});
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
};

function matchesCriteria(criteria, unit, unitProperty) {
    result = false;
    if (criteria.values.length == 0) {
        return true;
    }
    for (var i = criteria.skillTypes.length; i--;) {
        var skillType = criteria.skillTypes[i];
        if (skillType == "passives") {
            if (containAllKeyPositive(unit.passives[unitProperty], criteria.values)) {
                return true;
            }
        } else {
            for (var j = criteria.targetAreaTypes.length; j--;) {
                var targetArea = criteria.targetAreaTypes[j];
                if (containAllKeyPositive(unit[skillType][targetArea][unitProperty], criteria.values)) {
                    return true;
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
        
        
        return unit1.unit.name.localeCompare(unit2.unit.name);
    });
    return units;
}

function getValue(unit, type, filterValues, index) {
    var result = 0;
    for (var i = filterValues.skillTypes.length; i--;) {
        var skillType = filterValues.skillTypes[i];
        if (skillType == "passives") {
            if (unit.passives[type] && unit.passives[type][filterValues.values[index]]) {
                result = Math.max(result, unit.passives[type][filterValues.values[index]]);  
            }
        } else {
            for (var j = filterValues.targetAreaTypes.length; j--;) {
                var targetArea = filterValues.targetAreaTypes[j];
                if (unit[skillType][targetArea][type] && unit[skillType][targetArea][type][filterValues.values[index]]) {
                    result = Math.max(result, unit[skillType][targetArea][type][filterValues.values[index]]);
                }
            }
        }
    }
    return result;
}

var containAllKeyPositive = function(object, array) {
    if (!object) {
        return false;
    }
    for (var index = array.length; index--;) {
        if (!object[array[index]] || object[array[index]] <= 0) {
            return false;
        }
    }
    return true;
};
                
// Read filter values into the corresponding variables
var readFilterValues = function() {
	searchText = $("#searchText").val().toLocaleLowerCase();
    
    types = getSelectedValuesFor("types");
    
    elements.values = getSelectedValuesFor("elements");
    elements.targetAreaTypes = getSelectedValuesFor("elementsTargetAreaTypes");
    elements.skillTypes = getSelectedValuesFor("elementsSkillTypes");
    
    ailments.values = getSelectedValuesFor("ailments");
    ailments.targetAreaTypes = getSelectedValuesFor("ailmentsTargetAreaTypes");
    ailments.skillTypes = getSelectedValuesFor("ailmentsSkillTypes");
    
    physicalKillers.values = getSelectedValuesFor("physicalKillers");
    physicalKillers.skillTypes = getSelectedValuesFor("killersSkillTypes");
    
    magicalKillers.values = getSelectedValuesFor("magicalKillers");
    magicalKillers.skillTypes = physicalKillers.skillTypes;
    
    imperils.values = getSelectedValuesFor("imperils");
    imperils.targetAreaTypes = getSelectedValuesFor("imperilsTargetAreaTypes");
    imperils.skillTypes = getSelectedValuesFor("imperilsSkillTypes");
    
    breaks.values = getSelectedValuesFor("breaks");
    breaks.targetAreaTypes = getSelectedValuesFor("breaksTargetAreaTypes");
    breaks.skillTypes = getSelectedValuesFor("breaksSkillTypes");
    
    $(".elements .filters").toggleClass("hidden", elements.values.length == 0);
    $(".ailments .filters").toggleClass("hidden", ailments.values.length == 0);
    $(".killers .filters").toggleClass("hidden", physicalKillers.values.length + magicalKillers.values.length == 0);
    $(".imperils .filters").toggleClass("hidden", imperils.values.length == 0);
    $(".breaks .filters").toggleClass("hidden", breaks.values.length == 0);
    
    onlyShowOwnedUnits = $("#onlyShowOwnedUnits").prop('checked');
}

// Hide or show the "unselect all", "select unit weapons" and so on in the filter headers
var updateFilterHeadersDisplay = function() {
    $(".types .unselectAll").toggleClass("hidden", types.length == 0); 
    $(".ailments .unselectAll").toggleClass("hidden", ailments.length == 0); 
    $(".elements .unselectAll").toggleClass("hidden", elements.length == 0); 
    $(".killers .unselectAll").toggleClass("hidden", physicalKillers.length + magicalKillers.length == 0); 
    $(".imperils .unselectAll").toggleClass("hidden", imperils.length == 0); 
    $(".breaks .unselectAll").toggleClass("hidden", breaks.length == 0); 
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

function displayUnitsAsync(units, start, div) {
    var html = '';
    var end = Math.min(start + 20, units.length);
    for (var index = start; index < end; index++) {
        var unitData = units[index];
        html += '<div class="unit">'
        html += '<div class="unitImage"><img src="img/units/unit_icon_' + unitData.unit.id + '.png"/></div>';
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
                    html+= '<i class="img img-elem-ailm-' + elementList[i] + '"></i>';
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
                    html+= '<i class="img img-elem-ailm-' + ailmentList[i] + '"></i>';
                    html+= unitData.searchData.passives.ailmentResist[ailmentList[i]] + '%</span>';
                }
            }
        }
        html += '</div>';
        
        html += '<div class="lb">';
            if (mustDisplaySkill(unitData.unit.lb.maxEffects, "lb")) {
                html += getLbHtml(unitData.unit.lb);             
            }
        html += '</div>';
        
        html += '<div class="passives">';
            for (var i = 0, len = unitData.unit.passives.length; i < len; i++) {
                var passive = unitData.unit.passives[i];
                if (mustDisplaySkill(passive.effects, "passives")) {
                    html += getSkillHtml(passive);             
                }
            }
        html += '</div>';
        
        html += '<div class="actives">';
            for (var i = 0, len = unitData.unit.actives.length; i < len; i++) {
                var active = unitData.unit.actives[i];
                if (mustDisplaySkill(active.effects, "actives")) {
                    html += getSkillHtml(active);         
                }
            }
        html += '</div>';
        
        html += '<div class="magics">';
            for (var i = 0, len = unitData.unit.magics.length; i < len; i++) {
                var magic = unitData.unit.magics[i];
                if (mustDisplaySkill(magic.effects, "actives")) {
                    html += getSkillHtml(magic);   
                }
            }
        html += '</div>';
        
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

function getSkillHtml(skill) {
    var html = '<div class="skill">';
    html += '<div><img class="skillIcon" src="img/items/' + skill.icon + '"/></div>'
    html += '<div class="nameAndEffects"><span class="name">' + skill.name + '</span>'
    for (var j = 0, lenj = skill.effects.length; j < lenj; j++) {
        if (skill.effects[j].effect && skill.effects[j].effect.randomlyUse) {
            html += '<span class="effect">Randomly use :</span>';
            for (var i = 0, len = skill.effects[j].effect.randomlyUse.length; i < len; i++) {
                var randomSkill = skill.effects[j].effect.randomlyUse[i];
                html += '<div class="subSkill">';
                html += '<span class="percent">' + randomSkill.percent + '%</span>'
                html += getSkillHtml(randomSkill.skill);
                html += '</div>';
            }
        } else {
            html += '<span class="effect">' + skill.effects[j].desc + '</span>';    
        }
    }
    html += '</div></div>'; 
    return html;
}

function getLbHtml(lb) {
    var html = '<div class="skill">';
    html += '<div><img class="skillIcon" src="img/lb.png"/></div>'
    html += '<div class="nameAndEffects"><span class="name">Limit Burst : ' + lb.name + '</span>'
    html += '<div class="subSkill">';
    html += '<span class="case">Min :</span>'
    html += '<div class="skill"><div class="nameAndEffects">';
    for (var j = 0, len = lb.minEffects.length; j < len; j++) {
        html += '<span class="effect">' + lb.minEffects[j].desc + '</span>';   
    }
    html += '</div></div>';
    html += '</div>';
    html += '<div class="subSkill">';
    html += '<span class="case">Max :</span>'
    html += '<div class="skill"><div class="nameAndEffects">';
    for (var j = 0, len = lb.maxEffects.length; j < len; j++) {
        html += '<span class="effect">' + lb.maxEffects[j].desc + '</span>';   
    }
    html += '</div></div>';
    html += '</div>';
    
    html += '</div></div>'; 
    return html;
}

function mustDisplaySkill(effects, type) {
    var mustBeDisplayed = false;
    for (var j = effects.length; j--;) {
        var effect = effects[j];
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
            if (imperils.values.length > 0 && imperils.skillTypes.includes(type) && isTargetToBeDispalyed(imperils, effect, type) && effect.effect.imperil && effect.effect.target != "ALLY"  && matches(imperils.values, effect.effect.imperil.elements.map(function(element){return element.name;}))) {
                return true;
            }
            if (breaks.values.length > 0 && breaks.skillTypes.includes(type) && isTargetToBeDispalyed(breaks, effect, type) && effect.effect.break && effect.effect.target == "ENEMY" && matches(breaks.values, Object.keys(effect.effect.break))) {
                return true;
            }
            if (effect.effect.randomlyUse) {
                for (var i = effect.effect.randomlyUse.length; i--;) {
                    if (mustDisplaySkill(effect.effect.randomlyUse[i].skill.effects, type)) {
                        return true;
                    }
                }
            }
        }
    }
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
	
	// Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,update));
    
	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("data", true, function(result) {
        data = result;
        getStaticData("unitsWithSkill", false, function(result) {
            units = result;
            getStaticData("unitSearch", false, function(result) {    
                unitSearch = result;
                getStaticData("releasedUnits", false, function(result) {    
                    releasedUnits = result;

                    update();
                });
                update();
            });
        });
    });
	
	// Populates the various filters
	
	// Item types
	addIconChoicesTo("types", typeList.slice(0,typeList.length-2), "checkbox", "equipment");
    
	// Elements
	addIconChoicesTo("elements", elementList, "checkbox", "elem-ailm");
    addTextChoicesTo("elementsSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("elementsTargetAreaTypes",'checkbox',{'ST':'ST', 'AOE':'AOE'});
    selectAll("elementsSkillTypes");
    selectAll("elementsTargetAreaTypes");
    
	// Ailments
	addIconChoicesTo("ailments", ailmentList, "checkbox", "elem-ailm");
    addTextChoicesTo("ailmentsSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("ailmentsTargetAreaTypes",'checkbox',{'ST':'ST', 'AOE':'AOE'});
    selectAll("ailmentsSkillTypes");
    selectAll("ailmentsTargetAreaTypes");
    
	// Killers
	addIconChoicesTo("physicalKillers", killerList.map(function(v){return 'physicalKiller_'+v}), "checkbox", "killer");
    addIconChoicesTo("magicalKillers", killerList.map(function(v){return 'magicalKiller_'+v}), "checkbox", "killer");
    addTextChoicesTo("killersSkillTypes",'checkbox',{'Passive':'passives', 'Active':'actives', 'LB':'lb'});
    selectAll("killersSkillTypes");
    
	// Imperils
	addIconChoicesTo("imperils", elementList, "checkbox", "elem-ailm");
    addTextChoicesTo("imperilsSkillTypes",'checkbox',{'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("imperilsTargetAreaTypes",'checkbox',{'ST':'ST', 'AOE':'AOE'});
    selectAll("imperilsSkillTypes");
    selectAll("imperilsTargetAreaTypes");
    
    // Breaks
	addTextChoicesTo("breaks",'checkbox',{'ATK':'atk', 'DEF':'def', 'MAG':'mag', 'SPR':'spr'});
    addTextChoicesTo("breaksSkillTypes",'checkbox',{'Active':'actives', 'LB':'lb'});
    addTextChoicesTo("breaksTargetAreaTypes",'checkbox',{'ST':'ST', 'AOE':'AOE'});
    selectAll("breaksSkillTypes");
    selectAll("breaksTargetAreaTypes");
    
    $("#results").addClass(server);
    
	// Triggers on filter selection
	$('.choice input').change($.debounce(300,update));
    
}
