var baseStat = 180;
var defaultFilter = {};
var rawVerifiedData;
var verifiedData;
var tempData;
var showTempData = false;
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedItems = false;
var showNotReleasedYet = false;

var saveTimeout;

// Main function, called at every change. Will read all filters and update the state of the page (including the results)
var update = function() {
	
	readFilterValues();
	updateFilterHeadersDisplay();
    modifyFilterSummary();
    modifyUrl();
    
    if (!onlyShowOwnedItems && stat.length == 0 && searchText.length == 0 && types.length == 0 && elements.length == 0 && ailments.length == 0 && killers == 0 && accessToRemove.length == 0 && additionalStat.length == 0) {
		// Empty filters => no results
        $("#results .tbody").html("");
        $("#results").addClass("notSorted");
        $("#resultNumber").html("Add filters to see results");
        return;
    }
	
	// If the result are to be sorted by a stat, display the stat column, else hide it.
    if (stat.length != 0) {
        $("#statTitle").text(stat);    
        $("#results").removeClass("notSorted");
    } else {
        $("#results").addClass("notSorted");
    }
    
	// filter, sort and display the results
    displayItems(sort(filter(onlyShowOwnedItems, stat, baseStat, searchText, selectedUnit, types, elements, ailments, killers, accessToRemove, additionalStat, showNotReleasedYet)));
	
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

// Read filter values into the corresponding variables
var readFilterValues = function() {
	searchText = $("#searchText").val();
	stat = getSelectedValuesFor("stats");
    stat = stat[0] || '';
	if (baseStats.includes(stat)) {
		baseStat = parseInt($("#baseStat_" + stat).val());
		if (isNaN(baseStat)) {
			if (stat == 'hp') {
				baseStat=3500;
				$("#baseStat").attr("placeholder", 3500);
			} else {
				baseStat=180;
				$("#baseStat").attr("placeholder", 180);
			}
		}	
	} else {
		baseStat = 0;
	}
    
    types = getSelectedValuesFor("types");
    elements = getSelectedValuesFor("elements");
    ailments = getSelectedValuesFor("ailments");
    killers = getSelectedValuesFor("killers");
    accessToRemove = getSelectedValuesFor("accessToRemove");
    additionalStat = getSelectedValuesFor("additionalStat");
    onlyShowOwnedItems = $("#onlyShowOwnedItems").prop('checked');
    showNotReleasedYet = $("#showNotReleasedYet").prop('checked');
}

// Hide or show the "unselect all", "select unit weapons" and so on in the filter headers
var updateFilterHeadersDisplay = function() {
	$(filters).each(function(index, filter) {
		// If filter has a value selected, display "unselect all" link
        $("."+ filter + " .unselectAll").toggleClass("hidden", window[filter].length == 0); 
		// If filter has unit specific link and a unit is selected, display those links
        $("."+ filter + " .forUnit").toggleClass("hidden", !selectedUnit); 
    });
    $(".stat .unselectAll").toggleClass("hidden", stat.length == 0); 
}

// Update the hash of the url to reflect the currently selected filter
var modifyUrl = function() {
    var state = {
    };
    if (stat && stat.length != 0) {
        state.stat = stat;
    }
    $(filters).each(function (index, filter) {
        if (window[filter].length != 0) {
            state[filter] = window[filter];
        }
    });
    if (searchText && searchText.length != 0) {
        state.search = searchText;
    }
    if (selectedUnit) {
        state.unit = selectedUnit;
    }
	$(baseStats).each(function (index, value) {
		var statValue = $("#baseStat_" + value).val();
		if (statValue) {
			if (!state.baseStats) {
				state.baseStats =  {};
			}
			state.baseStats[value] = statValue;
		}
	});
    window.location.hash = '#' + window.btoa(unescape(encodeURIComponent(JSON.stringify(state))));
};

// Update the filter summary (small icons of the filter on the right, on mobile view only)
var modifyFilterSummary = function() {
    var html = "";
    if (types.length != 0) {
        for (var index in types) {
			html += '<img src="img/' + types[index] + '.png"></img>'
        }
    }
    if (elements.length != 0) {
        for (var index in elements) {
			html += '<img src="img/' + elements[index] + '.png"></img>'
        }
    }
    if (ailments.length != 0) {
        for (var index in ailments) {
			html += '<img src="img/' + ailments[index] + '.png"></img>'
        }
    }
    if (killers.length != 0) {
        html += '<img src="img/killer.png"></img>'
    }
    $("#filterSummary").html(html);
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayItems = function(items) {
    var html = "";
    $(items).each(function (index, item){
        html += '<div class="tr';
        if (item.temp) {
            html += ' userInputed';
        }
        html += '">';
        html += displayItemLine(item);
        if (itemInventory) {
            html+= '<div class="td inventory ' + escapeName(item[getItemInventoryKey()]) + ' ' ;
            if (!itemInventory[item[getItemInventoryKey()]]) {
                html+= "notPossessed";
            }
            html += '">';
            html += '<span class="glyphicon glyphicon-plus" onclick="addToInventory(\'' + escapeQuote(item[getItemInventoryKey()]) + '\',this)" />';
            html += '<span class="number badge badge-success">';
            if (itemInventory[item[getItemInventoryKey()]]) {
                html += itemInventory[item[getItemInventoryKey()]];
            }
            html += '</span>';
            html += '<span class="glyphicon glyphicon-minus" onclick="removeFromInventory(\'' + escapeQuote(item[getItemInventoryKey()]) + '\',this)" />';
            
            html += '</div>';
        }
        html += "</div>";
    });
    $("#results .tbody").html(html);
    $("#resultNumber").html(items.length);
    $(baseStats).each(function(index, currentStat) {
        if (additionalStat.length != 0 && !additionalStat.includes(currentStat) && currentStat != stat) {
            $("#results .tbody .name .detail ." + currentStat).addClass("notSelected");
        }
    });
    $(elementList).each(function(index, resist) {
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
    });
    if (itemInventory) {
        $("#results .thead .inventory").removeClass("hidden");
    } else {
        $("#results .thead .inventory").addClass("hidden");
    }
};

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

function addToInventory(id, span) {
    var inventoryDiv = $(".inventory." + escapeName(id));
    if(itemInventory[id]) {
        itemInventory[id] = itemInventory[id] + 1;
        inventoryDiv.children(".number").text(itemInventory[id]);
    } else {
        itemInventory[id] = 1;
        inventoryDiv.removeClass('notPossessed');
        inventoryDiv.children(".number").text(itemInventory[id]);
        $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items)");
    }
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveInventory,3000);
    $(".saveInventory").removeClass("hidden");
}

function removeFromInventory(id, span) {
    if(itemInventory[id]) {
        var inventoryDiv = $(".inventory." + escapeName(id));
        if (itemInventory[id] == 1 ) {
            delete itemInventory[id];
            inventoryDiv.addClass('notPossessed');
            $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items)");
        } else {
            itemInventory[id] = itemInventory[id] - 1;
            inventoryDiv.children(".number").text(itemInventory[id]);
        }
        saveNeeded = true;
        if (saveTimeout) {clearTimeout(saveTimeout)}
        saveTimeout = setTimeout(saveInventory,3000);
        $(".saveInventory").removeClass("hidden");
    }
}

// Unselect all values for a filter of the given type. if runUpdate = true, then call update() function
function unselectAll(type, runUpdate = true) {
    $('.active input[name='+ type +']').each(function(index, checkbox) {
        $(checkbox).prop('checked', false);
        $(checkbox).parent().removeClass('active');
    });
    if (runUpdate) {
        update();
    }
};

// Called when the page is loaded. Read the url hash, extract filters from that and populate them
function loadHash() {
    var state;
    if (window.location.hash != '') {
        if (window.location.hash.substring(1).startsWith('{')) {
            state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
        } else {
            state = JSON.parse(decodeURIComponent(escape(window.atob(window.location.hash.substring(1)))));
        }
    } else {
        state = defaultFilter;
    }
	if (state.baseStats) {
		for (var stat in state.baseStats) {
			$("#baseStat_" + stat).val(state.baseStats[stat]);
		}
	}
    if (state.unit) {
        $('#unitsSelect option[value="' + state.unit + '"]').prop("selected", "selected");
        selectedUnit = state.unit;
        displayUnitRarity(units[selectedUnit]);
    }
    if (state.stat) {
        $("input[name='stats'][value='"+ state.stat +"']").each(function(index, checkbox) {
            $(checkbox).prop('checked', true);
            $(checkbox).parent().addClass('active');
        });
    }
    if (state.search) {
        $("#searchText").val(state.search);
    }
    $(filters).each(function (index, filter) {
        if (state[filter]) {
            select(filter, state[filter]);
        }
    });
};

// Select on the 'types' filter the provided values that match the selected unit equipable item types
function selectForUnit(values) {
    var unitEquip = units[selectedUnit].equip;
    select("types", $.grep(values, function (value) {
        return unitEquip.includes(value);
    }));
};

// Populate the unit html select with a line per unit
function populateUnitSelect() {
    var options = '<option value="custom">Custom</option>';
    Object.keys(units).sort().forEach(function(value, index) {
        options += '<option value="'+ value + '">' + value + '</option>';
    });
    $("#unitsSelect").html(options);
    $("#unitsSelect").change(function() {
        $( "#unitsSelect option:selected" ).each(function() {
            var selectedUnitData = units[$(this).val()];
            if (selectedUnitData) {
                selectedUnit = $(this).val();
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val(selectedUnitData.stats.maxStats[stat] + selectedUnitData.stats.pots[stat]);
		      	});
                unselectAll("types", false);
            } else {
                selectedUnit = '';
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val("");
		      	});
            }
            displayUnitRarity(selectedUnitData);
        });
        update();
    });
}

function saveInventory() {
    if (saveTimeout) {clearTimeout(saveTimeout)}
    $(".saveInventory").addClass("hidden");
    $("#inventoryDiv .loader").removeClass("hidden");
    $("#inventoryDiv .message").addClass("hidden");
    saveNeeded = false;
    $.ajax({
        url: server + '/itemInventory',
        method: 'PUT',
        data: JSON.stringify(itemInventory),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function() {
            $("#inventoryDiv .loader").addClass("hidden");
            $("#inventoryDiv .message").text("save OK");
            $("#inventoryDiv .message").removeClass("hidden");
            setTimeout( function(){ 
                $("#inventoryDiv .message").addClass("hidden");
            }  , 3000 );
        },
        error: function() {
            saveNeeded = true;
            $("#inventoryDiv .loader").addClass("hidden");
            $(".saveInventory").removeClass("hidden");
            alert('error while saving the inventory');
        }
    });
}

function inventoryLoaded() {
    $("#onlyShowOwnedItemsDiv").removeClass("hidden");
    if (data) {
        update();
    }
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
    $.get(server + "/data.json", function(result) {
        data = result;
        prepareSearch(data);
        $.get(server + "/tempData.json", function(result) {
            for (var index in result) {
                result[index].temp=true;
            }
            tempData = result;
            $.get(server + "/units.json", function(result) {
                units = result;
                populateUnitSelect();
                loadHash();
                update();
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                alert( errorThrown );
            });
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
	
	// Populates the various filters
	
	// Desired Stats
	//addTextChoicesTo("stats",'radio',{'HP':'hp', 'MP':'mp', 'ATK':'atk', 'DEF':'def', 'MAG':'mag', 'SPR':'spr', 'Evade':'evade', 'Inflict':'inflict', 'Resist':'resist'});
    addImageChoicesTo("stats",["hp", "mp", "atk", "def", "mag", "spr", "evade", "inflict", "resist"],"radio","sort-");
	// Item types
	addImageChoicesTo("types",typeList);
	// Elements
	addImageChoicesTo("elements",["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark", "noElement"]);
	// Ailments
	addImageChoicesTo("ailments",ailmentList);
	// Killers
	addTextChoicesTo("killers",'checkbox',{'Aquatic':'aquatic', 'Beast':'beast', 'Bird':'bird', 'Bug':'bug', 'Demon':'demon', 'Dragon':'dragon', 'Human':'human', 'Machine':'machine', 'Plant':'plant', 'Undead':'undead', 'Stone':'stone', 'Spirit':'spirit'});
	// Access to remove
	addTextChoicesTo("accessToRemove",'checkbox',{ 'Shop':'shop', 'Story':'chest/quest', 'Key':'key', 'Colosseum':'colosseum', 'TMR 1*/2*':'TMR-1*/TMR-2*', 'TMR 3*/4*':'TMR-3*/TMR-4*', 'TMR 5*':'TMR-5*', 'Event':'event', 'Recipe':'recipe', 'Trophy':'trophy', 'Chocobo':'chocobo', 'Trial':'trial', 'Unit exclusive':'unitExclusive' });
	// Additional stat filter
	addTextChoicesTo("additionalStat",'checkbox',{'HP':'hp', 'MP':'mp', 'ATK':'atk', 'DEF':'def', 'MAG':'mag', 'SPR':'spr'});
	
	
    
    $("#results").addClass(server);
    
	// Triggers on filter selection
	$('.choice input').change($.debounce(300,update));
    
    $(window).on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !"
        }
    });
    
    
});

function escapeQuote(string) {
    return String(string).replace(/[']/g, function (s) {
        return "\\'";
    });
}
