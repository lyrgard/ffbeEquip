page = "search";
var baseStat = 180;
var defaultFilter = {};
var rawVerifiedData;
var verifiedData;
var itemInventory = null;
var saveNeeded = false;
var onlyShowOwnedItems = false;
var showNotReleasedYet = false;
var filterReady = false;

var filters = ["types","elements","ailments","physicalKillers","magicalKillers","accessToRemove","additionalStat"];
var accessListFilters = [
    { icon: 'shop', value: 'shop', tooltip: 'items from town shops' },
    { icon: 'story', value: 'chest/quest', tooltip: 'items from story chests and quests' },
    { icon: 'key', value: 'key', tooltip: 'items obtained with vault keys' },
    { icon: 'colosseum', value: 'colosseum', tooltip: 'items obtained in the Colosseum' },
    { icon: 'tmr_1-2stars', value: 'TMR-1*/TMR-2*', tooltip: 'TMR of 1★ or 2★ base units' },
    { icon: 'tmr_3-4stars', value: 'TMR-3*/TMR-4*', tooltip: 'TMR of 3★ or 4★ base units' },
    { icon: 'tmr_5stars', value: 'TMR-5*', tooltip: 'TMR of 5★ base units' },
    { icon: 'stmr', value: 'STMR', tooltip: 'Super TMR of 7★ units' },
    { icon: 'event', value: 'event', tooltip: 'items from event rewards' },
    { icon: 'recipe', value: 'recipe', tooltip: 'items crafted from recipes' },
    { icon: 'trophy', value: 'trophy', tooltip: 'items earned from trophy achievements' },
    { icon: 'chocobo', value: 'chocobo', tooltip: 'items exchanged with fat chocobo or mother chocobo' },
    { icon: 'trial', value: 'trial', tooltip: 'items from trial rewards' },
    { icon: 'unitExclusive', value: 'unitExclusive', tooltip: 'items having an ability exclusive to a specific unit' },
    { icon: 'premium', value: 'premium', tooltip: 'items from premium (paid) bundles' }
];

var stat;
var types;
var elements;
var ailments;
var physicalKillers;
var magicalKillers;
var accessToRemove;
var additionalStat;
var elementsAnd = false;
var ailmentsAnd = false;
var killersAnd = false;

var displayId = 0;

var itemList;

// Main function, called at every change. Will read all filters and update the state of the page (including the results)
var update = function() {

	readFilterValues();
	updateFilterHeadersDisplay();
    modifyFilterSummary();
    modifyUrl();

    if (!onlyShowOwnedItems && stat.length == 0 && searchText.length == 0 && types.length == 0 && elements.length == 0 && ailments.length == 0 && physicalKillers.length == 0 && magicalKillers.length == 0 && accessToRemove.length == 0 && additionalStat.length == 0) {
		// Empty filters => no results
        $("#resultsContent").html("");
        $("#resultsContent").addClass("notSorted");
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


    var filters = [];
    if (stat.length > 0) filters.push({type: 'stat', value: stat});
    if (searchText) filters.push({type: 'text', value: searchText});
    if (additionalStat.length > 0) filters.push({type: 'stat', value: additionalStat});
    if (accessToRemove.length > 0) {
        accessToRemove = accessToRemove.flatMap(a => a.split('/'));
        let authorizedAccess = accessList.filter(a => !accessToRemove.some(forbiddenAccess => a.startsWith(forbiddenAccess) || a.endsWith(forbiddenAccess)));
        filters.push(convertValuesToFilter(authorizedAccess, 'access'));
    }
    if (magicalKillers.length > 0) filters.push(convertValuesToFilter(magicalKillers, 'magicalKiller', killersAnd ? 'and' : 'or'));
    if (physicalKillers.length > 0) filters.push(convertValuesToFilter(physicalKillers, 'physicalKiller', killersAnd ? 'and' : 'or'));
    if (ailments.length > 0) filters.push(convertValuesToFilter(ailments, 'ailment', ailmentsAnd ? 'and' : 'or'));
    if (elements.length > 0) filters.push(convertValuesToFilter(elements, 'element', elementsAnd ? 'and' : 'or'));
    if (types.length > 0) filters.push(convertValuesToFilter(types, 'type'));
    if (onlyShowOwnedItems) filters.push({type: 'onlyOwned'});

    let filter = andFilters(...filters);

    let filteredItems = filterItems(data, filter, showNotReleasedYet);
    filteredItems.forEach(item => calculateValue(item, baseStat, stat, ailments, elements, killers));

	// filter, sort and display the results
    displayItems(sort(filteredItems));

	// If the text search box was used, highlight the corresponding parts of the results
    $("#results").unmark({
        done: function() {
            if (searchText && searchText.length != 0) {
                getSearchTokens(searchText).forEach(function (token) {
                    $("#results").mark(token, {separateWordSearch: false});
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
    physicalKillers = getSelectedValuesFor("physicalKillers");
    magicalKillers = getSelectedValuesFor("magicalKillers");
    accessToRemove = getSelectedValuesFor("accessToRemove");
    additionalStat = getSelectedValuesFor("additionalStat");
    elementsAnd = getSelectedValuesFor("elementsLogicalConnector")[0] === 'and';
    ailmentsAnd = getSelectedValuesFor("ailmentsLogicalConnector")[0] === 'and';
    killersAnd = getSelectedValuesFor("killersLogicalConnector")[0] === 'and';
    if (itemInventory) {
        onlyShowOwnedItems = $("#onlyShowOwnedItems").prop('checked');
    } else {
        onlyShowOwnedItems = false;
    }
    showNotReleasedYet = $("#showNotReleasedYet").prop('checked');
}

// Hide or show the "unselect all", "select unit weapons" and so on in the filter headers
var updateFilterHeadersDisplay = function() {
	$(filters).each(function(index, filter) {
		// If filter has a value selected, display "unselect all" link
        $("."+ filter + " .unselectAll").toggleClass("hidden", window[filter].length == 0);
		// If filter has unit specific link and a unit is selected, display those links
        $("."+ filter + " .forUnit").toggleClass("hidden", !selectedUnitId);
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
    if (selectedUnitId) {
        state.unit = units[selectedUnitId].name;
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
    if (onlyShowOwnedItems) {
        state.onlyShowOwnedItems = true;
    }
    if (showNotReleasedYet) {
        state.showNotReleasedYet = true;
    }
    if (elementsAnd) {
        state.elementsAnd = true;
    }
    if (ailmentsAnd) {
        state.ailmentsAnd = true;
    }
    if (killersAnd) {
        state.killersAnd = true;
    }
    window.location.hash = '#' + window.btoa(unescape(encodeURIComponent(JSON.stringify(state))));
};

// Update the filter summary (small icons of the filter on the right, on mobile view only)
var modifyFilterSummary = function() {
    var html = "";
    if (types.length != 0) {
        for (var index in types) {
			html += '<i src="icon icon-sm equipment-' + types[index] + '"></i>';
        }
    }
    if (elements.length != 0) {
        for (var index in elements) {
			html += '<i class="icon icon-sm element-' + elements[index] + '"></i>';
        }
    }
    if (ailments.length != 0) {
        for (var index in ailments) {
			html += '<i class="icon icon-sm ailment-' + ailments[index] + '"></i>';
        }
    }
    if (physicalKillers.length != 0 || magicalKillers.length != 0) {
        html += '<img src="/assets/media/icons/killer.png"></img>';
    }
    $("#filterSummary").html(html);
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayItems = function(items) {
    $("#resultNumber").html(items.length);
    itemList.display(items);

    if (itemInventory) {
        $("#resultsContent").addClass("logged");
    } else {
        $("#resultsContent").removeClass("logged");
    }
};

function getItemsHtmls(items) {
    var htmls = [];

    items.forEach(item => {
        htmls.push(getItemHtml(item));
    });
    return htmls;
}

function getItemHtml(item) {
	let html = '',
			htmlClass = '';

	if (item.temp) {
		htmlClass = ' userInputed';
	}

	if (itemInventory) {
		if (!itemInventory[item.id]) {
			htmlClass += " notPossessed";
		}
	}

	html += '<div class="col-6 col-md-4 mb-2 bookItem ' + htmlClass + '">';
	html += '  <div class="ffbe_content--well p-2 rounded border ">';
	html += '    <div class="form-row align-items-center">';
	html += '      <div class="col-auto">' + getImageHtml(item, "", false) + '</div>';
	html += '      <div class="col align-self-center">' + getNameColumnHtml(item) + '</div>';

	if (itemInventory) {
		if (itemInventory[item.id]) {
			html += '  <div class="col-auto inventory ' + escapeName(item.id) + '" data-item="' + escapeName(item.id) + '">';
			html += '    <span class="number badge badge-secondary">' + itemInventory[item.id] + '</span>';
	    html += '  </div>';
		}
	}

	html += "    </div>";
	html += "  </div>";
	html += "</div>";

	return html;
}

function afterDisplay() {
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
        if (physicalKillers.length != 0 && !physicalKillers.includes(killer)) {
            $("#results .tbody .special .killer-physical.killer-" + killer).addClass("notSelected");
        }
        if (magicalKillers.length != 0 && !magicalKillers.includes(killer)) {
            $("#results .tbody .special .killer-magical.killer-" + killer).addClass("notSelected");
        }
    });
    if (itemInventory) {
        $("#results .thead .inventory").removeClass("hidden");
    } else {
        $("#results .thead .inventory").addClass("hidden");
    }
}

// Displays selected unit's rarity by stars
var displayUnitRarity = function(unit) {
    var rarityWrapper = $('.unit-rarity');
    if (unit) {
        var rarity = unit.max_rarity;

        rarityWrapper.removeClass('hidden');
        rarityWrapper.empty();

        for (var i = 0; i < rarity; i++) {
            rarityWrapper.append('<span class="fa fa-fw fa-star"></span>');
        }
    } else {
        rarityWrapper.addClass('hidden');
    }
};

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
    if (state.unit) {
        var selectedUnitId;
        if (units[state.unit]) {
            selectedUnitId = state.unit;
        } else {
            for (var unitId in units) {
                if (units[unitId].name == state.unit) {
                    selectedUnitId = unitId;
                    break;
                }
            }
        }
        if (selectedUnitId) {
            $('#unitsSelect').val(selectedUnitId).trigger('change');
        }
    }
	if (state.baseStats) {
		for (var stat in state.baseStats) {
			$("#baseStat_" + stat).val(state.baseStats[stat]);
		}
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
    if (state.onlyShowOwnedItems) {
        $("#onlyShowOwnedItems").prop('checked', true);
    }
    if (state.showNotReleasedYet) {
        $("#showNotReleasedYet").prop('checked', true);
    }
    $("input[name='elementsLogicalConnector']").each(function(index, checkbox) {
        let check = checkbox.value === 'and' && state.elementsAnd || checkbox.value === 'or' && !state.elementsAnd;
        $(checkbox).prop('checked', check);
        if (check) {
            $(checkbox).parent().addClass('active');
        }
    });
    $("input[name='ailmentsLogicalConnector']").each(function(index, checkbox) {
        let check = checkbox.value === 'and' && state.ailmentsAnd || checkbox.value === 'or' && !state.ailmentsAnd;
        $(checkbox).prop('checked', check);
        if (check) {
            $(checkbox).parent().addClass('active');
        }
    });
    $("input[name='killersLogicalConnector']").each(function(index, checkbox) {
        let check = checkbox.value === 'and' && state.killersAnd || checkbox.value === 'or' && !state.killersAnd;
        $(checkbox).prop('checked', check);
        if (check) {
            $(checkbox).parent().addClass('active');
        }
    });
};

// Select on the 'types' filter the provided values that match the selected unit equipable item types
function selectForUnit(values) {
    var unitEquip = units[selectedUnitId].equip;
    select("types", $.grep(values, function (value) {
        return unitEquip.includes(value);
    }));
};

// Populate the unit html select with a line per unit
function populateUnitSelect() {
    var options = '<option value="custom">Custom</option>';
    Object.keys(units).sort(function(id1, id2) {
        return units[id1].name.localeCompare(units[id2].name)
    }).forEach(function(value, index) {
        options += '<option value="'+ value + '">' + units[value].name + '</option>';
    });
    $("#unitsSelect").html(options);
    $("#unitsSelect").change(function() {
        $(this).find(':selected').each(function() {
            var selectedUnitData = units[$(this).val()];
            if (selectedUnitData) {
                selectedUnitId = $(this).val();
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val(selectedUnitData.stats.maxStats[stat] + selectedUnitData.stats.pots[stat]);
                });
                $(".unit-image").html('<img src="/assets/game/units/unit_ills_' + selectedUnitData.id + '.png" />').removeClass('hidden');
                unselectAll("types", false);
            } else {
                selectedUnitId = 0;
                $(baseStats).each(function (index, stat) {
                    $("#baseStat_" + stat).val("");
		      	});
                $(".unit-image").html("").addClass('hidden');
            }
            displayUnitRarity(selectedUnitData);
        });
        update();
    });
    $('#unitsSelect').select2({
        placeholder: 'Select a unit...',
        theme: 'bootstrap4'
    });
}

function inventoryLoaded() {
    $("#onlyShowOwnedItemsDiv").removeClass("hidden");
    if (data) {
        update();
    }
}

function notLoaded() {

}

function tryToLoadHash() {
    if (filterReady && units) {
        loadHash();
        update();
    }
}

function addCardsToData(cards) {
    Object.keys(cards).forEach(cardId => {
        let card = cards[cardId];
        let lastLevel = card.levels[card.levels.length -1];
        card = combineTwoItems(card, lastLevel);
        let conditionals = lastLevel.conditional ? lastLevel.conditional : [];
        computeConditionalCombinations(card, conditionals, (card) => {
            data.push(card);
        });
    });
}

function computeConditionalCombinations(item, conditionals, onCombinationFound,index = 0) {
    if (index === conditionals.length) {
        onCombinationFound(item);
    } else {
        // First try without that condition
        computeConditionalCombinations(item, conditionals, onCombinationFound, index + 1);
        // Then with the condition
        item = combineTwoItems(item, conditionals[index]);

        if (conditionals[index].equipedConditions) {
            if (!item.equipedConditions) item.equipedConditions = [];
            item.equipedConditions = item.equipedConditions.concat(conditionals[index].equipedConditions).filter((c, i, a) => a.indexOf(c) === i);
            if (!isEquipedConditionViable(item.equipedConditions)) {
                return;
            }
        }
        if (conditionals[index].exclusiveUnits) {
            item.exclusiveUnits = conditionals[index].exclusiveUnits;
        }
        computeConditionalCombinations(item, conditionals, onCombinationFound, index + 1);
    }
}

function isEquipedConditionViable(equipedConditions) {
    // TODO
    return true;
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
    itemList = new VirtualScroll($('#resultsContent'), getItemHtml, 64);

	// Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,update));

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("data", true, function(result) {
        data = result;
        getStaticData("visionCards", false, function(cards) {
            addCardsToData(cards);
            getStaticData("units", true, function(result) {
                units = result;
                populateUnitSelect();
                prepareSearch(data);
                tryToLoadHash();
            });
        });
    });

	// Populates the various filters

	// Desired Stats
	//addTextChoicesTo("stats",'radio',{'HP':'hp', 'MP':'mp', 'ATK':'atk', 'DEF':'def', 'MAG':'mag', 'SPR':'spr', 'Evade':'evade', 'Inflict':'inflict', 'Resist':'resist'});
    addIconChoicesTo("stats", ["hp", "mp", "atk", "def", "mag", "spr", "evade", "inflict", "resist"], "radio", "sort", function(v){return "Show items having "+v.toUpperCase()+" stats";});
	// Item types
	addIconChoicesTo("types", typeList, "checkbox", "equipment", function(v){return typeListLitterals[v];});
	// Elements
	addIconChoicesTo("elements", ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark", "noElement"], "checkbox", "element", ucFirst);
	// Ailments
	addIconChoicesTo("ailments", ailmentList, "checkbox", "ailment", ucFirst);
	// Killers
	addIconChoicesTo("physicalKillers", killerList, "checkbox", "killer-physical", function(v){return "Physical "+v+" killer";});
    addIconChoicesTo("magicalKillers", killerList, "checkbox", "killer-magical", function(v){return "Magical "+v+" killer";});
    // Access to remove
    addIconChoicesTo("accessToRemove", accessListFilters, "checkbox", "access", function(o){return "Filter out "+o.tooltip;});

    // Additional stat filter
    addIconChoicesTo("additionalStat", baseStats.concat("twoHanded"), "checkbox", "stat", function(v){return v.toUpperCase();});


    filterReady = true;
	tryToLoadHash();

    $("#results").addClass(server);

	// Triggers on filter selection
	$('.choice input').change(update);

    $(window).on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !"
        }
    });


}
