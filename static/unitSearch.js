page = "unitSearch";
var defaultFilter = {};
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedUnits = false;
var unitSearch = [];
var releasedUnits;
var imperils = {values: [], "actives": true, "lb":true};
var breaks = {values: [], "actives": true, "lb":true};
var elements = {values: [], "actives": true, "passives": true, "lb":true};
var ailments = {values: [], "actives": true, "passives": true, "lb":true};
var physicalKillers = {values: [], "actives": true, "passives": true, "lb":true};
var magicalKillers = {values: [], "actives": true, "passives": true, "lb":true};

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
            if (!onlyShowOwnedUnits || ownedUnits && ownedUnits[unit.id]) {
                if (types.length == 0 || includeAll(unit.equip, types)) {
                    if (elements.values.length == 0 || elements.passives && containAllKeyPositive(unit.passives.elementalResist, elements.values) || elements.actives && containAllKeyPositive(unit.actives.elementalResist, elements.values) || elements.lb && containAllKeyPositive(unit.lb.elementalResist, elements.values)) {
                        if (ailments.values.length == 0 || ailments.passives && containAllKeyPositive(unit.passives.ailmentResist, ailments.values) || ailments.actives && containAllKeyPositive(unit.actives.ailmentResist, ailments.values) || ailments.lb && containAllKeyPositive(unit.lb.ailmentResist, ailments.values)) {
                            if (physicalKillers.values.length == 0 || physicalKillers.passives && containAllKeyPositive(unit.passives.physicalKillers, physicalKillers.values) || physicalKillers.actives && containAllKeyPositive(unit.actives.physicalKillers, physicalKillers.values) || physicalKillers.lb && containAllKeyPositive(unit.lb.physicalKillers, physicalKillers.values)) {
                                if (magicalKillers.values.length == 0 || magicalKillers.passives && containAllKeyPositive(unit.passives.magicalKillers, magicalKillers.values) || magicalKillers.actives && containAllKeyPositive(unit.actives.magicalKillers, magicalKillers.values) || magicalKillers.lb && containAllKeyPositive(unit.lb.magicalKillers, magicalKillers.values)) {
                                    if (imperils.values.length == 0 || imperils.actives && containAllKeyPositive(unit.actives.imperil, imperils.values) || imperils.lb && containAllKeyPositive(unit.lb.imperil, imperils.values)) {
                                        if (breaks.values.length == 0 || breaks.actives && containAllKeyPositive(unit.break, breaks.values) || breaks.lb && containAllKeyPositive(unit.lb.break, breaks.values)) {                                    
                                            if (searchText.length == 0 || units[unit.id].name.toLowerCase().indexOf(searchText) >= 0 ) {
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

function sortUnits(units) {
    units.sort(function (unit1, unit2) {
        if (physicalKillers.values.length > 0) {
            var value1 = 0;
            var value2 = 0;
            for (var i = physicalKillers.values.length; i--;) {
                value1 += unit1.searchData.passives.physicalKillers[physicalKillers[i]];
                value2 += unit2.searchData.passives.physicalKillers[physicalKillers[i]];
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
                value1 += unit1.searchData.passives.magicalKillers[magicalKillers[i]];
                value2 += unit2.searchData.passives.magicalKillers[magicalKillers[i]];
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
    if (filterValues.passives && unit.passives[type] && unit.passives[type][filterValues.values[index]]) {
        result = unit.passives[type][filterValues.values[index]];
    }
    if (filterValues.actives && unit.actives[type] && unit.actives[type][filterValues.values[index]]) {
        result = Math.max(result, unit.actives[type][filterValues.values[index]]);
    }
    if (filterValues.lb && unit.lb[type] && unit.lb[type][filterValues.values[index]]) {
        result = Math.max(result, unit.lb[type][filterValues.values[index]]);
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
    ailments.values = getSelectedValuesFor("ailments");
    physicalKillers.values = getSelectedValuesFor("physicalKillers");
    magicalKillers.values = getSelectedValuesFor("magicalKillers");
    imperils.values = getSelectedValuesFor("imperils");
    imperils.lb = !$(".imperils .excludeLb").prop("checked");
    breaks.values = getSelectedValuesFor("breaks");
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
                    html+= '"><img src="img/icons/elements-ailments/' + elementList[i] + '.png"/>' + unitData.searchData.passives.elementalResist[elementList[i]] + '%</span>';
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
                    html+= '"><img src="img/icons/elements-ailments/' + ailmentList[i] + '.png"/>' + unitData.searchData.passives.ailmentResist[ailmentList[i]] + '%</span>';
                }
            }
        }
        html += '</div>';
        
        html += '<div class="lb">';
            if (mustDisplaySkill(unitData.unit.lb.maxEffects)) {
                html += getLbHtml(unitData.unit.lb);             
            }
        html += '</div>';
        
        html += '<div class="passives">';
            for (var i = 0, len = unitData.unit.passives.length; i < len; i++) {
                var passive = unitData.unit.passives[i];
                if (mustDisplaySkill(passive.effects)) {
                    html += getSkillHtml(passive);             
                }
            }
        html += '</div>';
        
        html += '<div class="actives">';
            for (var i = 0, len = unitData.unit.actives.length; i < len; i++) {
                var active = unitData.unit.actives[i];
                if (mustDisplaySkill(active.effects)) {
                    html += getSkillHtml(active);         
                }
            }
        html += '</div>';
        
        html += '<div class="magics">';
            for (var i = 0, len = unitData.unit.magics.length; i < len; i++) {
                var magic = unitData.unit.magics[i];
                if (mustDisplaySkill(magic.effects)) {
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
    for (var j = skill.effects.length; j--;) {
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

function mustDisplaySkill(effects) {
    var mustBeDisplayed = false;
    for (var j = effects.length; j--;) {
        var effect = effects[j];
        if (effect.effect) {
            if (types.length > 0 && effect.effect.equipedConditions && matches(effect.effect.equipedConditions, types)) {
                return true;
            }
            if (elements.values.length > 0 && effect.effect.resist && matches(elements.values, effect.effect.resist.map(function(resist){return resist.name;}))) {
                return true;
            }
            if (ailments.values.length > 0 && effect.effect.resist && matches(ailments.values, effect.effect.resist.map(function(resist){return resist.name;}))) {
                return true;
            }
            if (physicalKillers.values.length > 0 && effect.effect.killers && matches(physicalKillers.values, effect.effect.killers.map(function(killer){return killer.name;}))) {
                return true;
            }
            if (magicalKillers.values.length > 0 && effect.effect.killers && matches(magicalKillers.values, effect.effect.killers.map(function(killer){return killer.name;}))) {
                return true;
            }
            if (imperils.values.length > 0 && effect.effect.imperil && effect.effect.target != "ALLY"  && matches(imperils.values, effect.effect.imperil.elements.map(function(element){return element.name;}))) {
                return true;
            }
            if (breaks.values.length > 0 && effect.effect.break && effect.effect.target == "ENEMY" && matches(breaks.values, Object.keys(effect.effect.break))) {
                return true;
            }
            if (effect.effect.randomlyUse) {
                for (var i = effect.effect.randomlyUse.length; i--;) {
                    if (mustDisplaySkill(effect.effect.randomlyUse[i].skill.effects)) {
                        return true;
                    }
                }
            }
        }
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
	addImageChoicesTo("elements", elementList, "checkbox", "icons/elements-ailments/");
	// Ailments
	addImageChoicesTo("ailments", ailmentList, "checkbox", "icons/elements-ailments/");
	// Killers
	addImageChoicesTo("physicalKillers", killerList, "checkbox", "icons/killers/physicalKiller_");
    addImageChoicesTo("magicalKillers", killerList, "checkbox", "icons/killers/magicalKiller_");
	// Imperils
	addImageChoicesTo("imperils", elementList, "checkbox", "icons/elements-ailments/");
    // Breaks
	addTextChoicesTo("breaks",'checkbox',{'ATK':'atk', 'DEF':'def', 'MAG':'mag', 'SPR':'spr'});
    
    $("#results").addClass(server);
    
	// Triggers on filter selection
	$('.choice input').change($.debounce(300,update));
    
}
