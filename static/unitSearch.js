page = "unitSearch";
var defaultFilter = {};
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedUnits = false;
var unitSearch = [];
var releasedUnits;
var imperils;
var breaks;

// Main function, called at every change. Will read all filters and update the state of the page (including the results)
var update = function() {
	
	readFilterValues();
	updateFilterHeadersDisplay();
    
    if (searchText.length == 0 && types.length == 0 && elements.length == 0 && ailments.length == 0 && physicalKillers == 0 && magicalKillers == 0 && imperils.length == 0 && breaks.length == 0) {
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
                    if (elements.length == 0 || containAllKeyPositive(unit.elementalResist, elements)) {
                        if (ailments.length == 0 || containAllKeyPositive(unit.ailmentResist, ailments)) {
                            if (physicalKillers.length == 0 || containAllKeyPositive(unit.physicalKillers, physicalKillers)) {
                                if (magicalKillers.length == 0 || containAllKeyPositive(unit.magicalKillers, magicalKillers)) {
                                    if (imperils.length == 0 || containAllKeyPositive(unit.imperil, imperils)) {
                                        if (breaks.length == 0 || containAllKeyPositive(unit.break, breaks)) {                                    
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
        if (physicalKillers) {
            var value1 = 0;
            var value2 = 0;
            for (var i = physicalKillers.length; i--;) {
                value1 += unit1.searchData.physicalKillers[physicalKillers[i]];
                value2 += unit2.searchData.physicalKillers[physicalKillers[i]];
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (magicalKillers) {
            var value1 = 0;
            var value2 = 0;
            for (var i = magicalKillers.length; i--;) {
                value1 += unit1.searchData.magicalKillers[magicalKillers[i]];
                value2 += unit2.searchData.magicalKillers[magicalKillers[i]];
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (imperils) {
            var value1 = 0;
            var value2 = 0;
            for (var i = imperils.length; i--;) {
                value1 += unit1.searchData.imperil[imperils[i]];
                value2 += unit2.searchData.imperil[imperils[i]];
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (breaks) {
            var value1 = 0;
            var value2 = 0;
            for (var i = breaks.length; i--;) {
                value1 += unit1.searchData.break[breaks[i]];
                value2 += unit2.searchData.break[breaks[i]];
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (elements) {
            var value1 = 0;
            var value2 = 0;
            for (var i = elements.length; i--;) {
                value1 += unit1.searchData.elementalResist[elements[i]];
                value2 += unit2.searchData.elementalResist[elements[i]];
            }
            if (value1 > value2) {
                return -1;
            } else if (value2 > value1) {
                return 1
            }
        }
        if (ailments) {
            var value1 = 0;
            var value2 = 0;
            for (var i = ailments.length; i--;) {
                value1 += unit1.searchData.ailmentResist[ailments[i]];
                value2 += unit2.searchData.ailmentResist[ailments[i]];
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
    elements = getSelectedValuesFor("elements");
    ailments = getSelectedValuesFor("ailments");
    physicalKillers = getSelectedValuesFor("physicalKillers");
    magicalKillers = getSelectedValuesFor("magicalKillers");
    imperils = getSelectedValuesFor("imperils");
    breaks = getSelectedValuesFor("breaks");
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
            if (unitData.searchData.physicalKillers && unitData.searchData.physicalKillers[killerList[i]]) {
                addToKiller(killers, {"name":killerList[i], "physical":unitData.searchData.physicalKillers[killerList[i]]});
            }
            if (unitData.searchData.magicalKillers && unitData.searchData.magicalKillers[killerList[i]]) {
                addToKiller(killers, {"name":killerList[i], "magical":unitData.searchData.magicalKillers[killerList[i]]});
            }
        }
        var killersHtml = getKillerHtml(killers, physicalKillers, magicalKillers);
        html += killersHtml.physical;
        html += killersHtml.magical;
        html += '</div>';
        
        html += '<div class="elementalResistances">';
        if (unitData.searchData.elementalResist) {
            for (var i = 0, len = elementList.length; i < len; i++) {
                if (unitData.searchData.elementalResist[elementList[i]]) {
                    html+= '<span class="elementalResistance ' + elementList[i];
                    if (elements.includes(elementList[i])) {
                        html+= " selected";
                    }
                    html+= '"><img src="img/' + elementList[i] + '.png"/>' + unitData.searchData.elementalResist[elementList[i]] + '%</span>';
                }
            }
        }
        html += '</div>';
        
        html += '<div class="ailmentResistances">';
        if (unitData.searchData.ailmentResist) {
            for (var i = 0, len = ailmentList.length; i < len; i++) {
                if (unitData.searchData.ailmentResist[ailmentList[i]]) {
                    html+= '<span class="ailmentResistance ' + ailmentList[i];
                    if (ailments.includes(ailmentList[i])) {
                        html+= " selected";
                    }
                    html+= '"><img src="img/' + ailmentList[i] + '.png"/>' + unitData.searchData.ailmentResist[ailmentList[i]] + '%</span>';
                }
            }
        }
        html += '</div>';
        
        html += '<div class="passives">';
            for (var i = 0, len = unitData.unit.passives.length; i < len; i++) {
                var passive = unitData.unit.passives[i];
                if (mustDisplaySkill(passive)) {
                    html += getSkillHtml(passive);             
                }
            }
        html += '</div>';
        
        html += '<div class="actives">';
            for (var i = 0, len = unitData.unit.actives.length; i < len; i++) {
                var active = unitData.unit.actives[i];
                if (mustDisplaySkill(active)) {
                    html += getSkillHtml(active);         
                }
            }
        html += '</div>';
        
        html += '<div class="magics">';
            for (var i = 0, len = unitData.unit.magics.length; i < len; i++) {
                var magic = unitData.unit.magics[i];
                if (mustDisplaySkill(magic)) {
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

function mustDisplaySkill(skill) {
    var mustBeDisplayed = false;
    for (var j = skill.effects.length; j--;) {
        var effect = skill.effects[j];
        if (effect.effect) {
            if (types.length > 0 && effect.effect.equipedConditions && matches(effect.effect.equipedConditions, types)) {
                return true;
            }
            if (elements.length > 0 && effect.effect.resist && matches(elements, effect.effect.resist.map(function(resist){return resist.name;}))) {
                return true;
            }
            if (ailments.length > 0 && effect.effect.resist && matches(ailments, effect.effect.resist.map(function(resist){return resist.name;}))) {
                return true;
            }
            if (physicalKillers.length > 0 && effect.effect.killers && matches(physicalKillers, effect.effect.killers.map(function(killer){return killer.name;}))) {
                return true;
            }
            if (magicalKillers.length > 0 && effect.effect.killers && matches(magicalKillers, effect.effect.killers.map(function(killer){return killer.name;}))) {
                return true;
            }
            if (imperils.length > 0 && effect.effect.imperil && matches(imperils, effect.effect.imperil.elements.map(function(element){return element.name;}))) {
                return true;
            }
            if (breaks.length > 0 && effect.effect.break && effect.effect.target == "ENEMY" && matches(breaks, Object.keys(effect.effect.break))) {
                return true;
            }
            if (effect.effect.randomlyUse) {
                for (var i = effect.effect.randomlyUse.length; i--;) {
                    if (mustDisplaySkill(effect.effect.randomlyUse[i].skill)) {
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
	addImageChoicesTo("types",typeList.slice(0,typeList.length-2));
	// Elements
	addImageChoicesTo("elements",elementList);
	// Ailments
	addImageChoicesTo("ailments",ailmentList);
	// Killers
	addImageChoicesTo("physicalKillers",killerList, type="checkbox", "physicalKiller_");
    addImageChoicesTo("magicalKillers",killerList, type="checkbox", "magicalKiller_");
	// Imperils
	addImageChoicesTo("imperils",elementList);
    // Breaks
	addTextChoicesTo("breaks",'checkbox',{'ATK':'atk', 'DEF':'def', 'MAG':'mag', 'SPR':'spr'});
    
    $("#results").addClass(server);
    
	// Triggers on filter selection
	$('.choice input').change($.debounce(300,update));
    
}
