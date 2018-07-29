page = "unitSearch";
var defaultFilter = {};
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedUnits = false;

// Main function, called at every change. Will read all filters and update the state of the page (including the results)
var update = function() {
	
	readFilterValues();
	updateFilterHeadersDisplay();
    
    if (!onlyShowOwnedUnits && searchText.length == 0 && types.length == 0 && elements.length == 0 && ailments.length == 0 && killers == 0) {
		// Empty filters => no results
        $("#results .tbody").html("");
        $("#results").addClass("notSorted");
        $("#resultNumber").html("Add filters to see results");
        return;
    }
    
	// filter, sort and display the results
    displayUnits(filterUnits(units, onlyShowOwnedUnits, searchText, types, elements, ailments, killers));
	
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
var filterUnits = function(units, onlyShowOwnedUnits = true, searchText = "", types = [], elements = [], ailments = [], killers = []) {
    var result = [];
    var unitIds = Object.keys(units);
    for (var index = 0, len = unitIds.length; index < len; index++) {
        var unit = units[unitIds[index]];
        if (!onlyShowOwnedUnits || ownedUnits && ownedUnits[unit.id]) {
            if (types.length == 0 || includeAll(unit.equip, types)) {
                    /*if (elements.length == 0 || (item.element && matches(elements, item.element)) || (elements.includes("noElement") && !item.element) || (item.resist && matches(elements, item.resist.map(function(resist){return resist.name;})))) {
                        if (ailments.length == 0 || (item.ailments && matches(ailments, item.ailments.map(function(ailment){return ailment.name;}))) || (item.resist && matches(ailments, item.resist.map(function(res){return res.name;})))) {
                            if (killers.length == 0 || (item.killers && matches(killers, item.killers.map(function(killer){return killer.name;})))) {
                                if (searchText.length == 0 || containsText(searchText, item)) {*/
                                    result.push(unit);
                                /*}
                            }
                        }
                    }*/
            }
        }
    }
    return result;
};

// Read filter values into the corresponding variables
var readFilterValues = function() {
	searchText = $("#searchText").val();
    
    types = getSelectedValuesFor("types");
    elements = getSelectedValuesFor("elements");
    ailments = getSelectedValuesFor("ailments");
    killers = getSelectedValuesFor("killers");
    onlyShowOwnedUnits = $("#onlyShowOwnedUnits").prop('checked');
}

// Hide or show the "unselect all", "select unit weapons" and so on in the filter headers
var updateFilterHeadersDisplay = function() {
	$(filters).each(function(index, filter) {
		// If filter has a value selected, display "unselect all" link
        $("."+ filter + " .unselectAll").toggleClass("hidden", window[filter].length == 0); 
    });
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
        var unit = units[index];
        html += '<div class="unit">' + unit.name + '</div>';
    }
    div.append(html);
    if (index < units.length) {
        setTimeout(displayUnitsAsync, 0, units, index, div);
    } else {
        afterDisplay();
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

// will be called by jQuery at page load)
$(function() {
    // Triggers on unit base stats change
	$(baseStats).each(function (index, value) {
        $("#baseStat_" + value).on("input", $.debounce(300,update));
	});
	
	// Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,update));
    
	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(getLocalizedFileUrl("data"), function(result) {
        data = result;
        $.get(getLocalizedFileUrl("units"), function(result) {
            units = result;
            update();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
	
	// Populates the various filters
	
	// Item types
	addImageChoicesTo("types",typeList);
	// Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark", "noElement"]);
	// Ailments
	addImageChoicesTo("ailments",ailmentList);
	// Killers
	addTextChoicesTo("killers",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
	
    
    $("#results").addClass(server);
    
	// Triggers on filter selection
	$('.choice input').change($.debounce(300,update));
    
});
