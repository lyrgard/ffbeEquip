var saveNeeded = false;

var saveTimeout;

var itemKey = getItemInventoryKey();
var units;
var ownedUnits = {};
var releasedUnits;

var currentSort = showAlphabeticalSort;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#units").removeClass("hidden");
    $("#searchBox").addClass("hidden");
    
    $(".nav-tabs li.alphabeticalSort").removeClass("active");
    $(".nav-tabs li.raritySort").removeClass("active");
}

function showAlphabeticalSort() {
    beforeShow();
    currentSort = showAlphabeticalSort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.alphabeticalSort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortAlphabetically(filterName(units))));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

function showRaritySort() {
    beforeShow();
    currentSort = showRaritySort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.raritySort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnitsByRarity(sortByRarity(filterName(units))));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units) {
    var html = '<div class="unitList">';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        html += getUnitDisplay(unit);
    }
    html += '</div>';
    return html;

};

function displayUnitsByRarity(units) {
    var lastMinRarity, lastMaxRarity;
    var first = true;
    
    var html = '';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        if (first) {
            html += '<div class="raritySeparator">' + getRarity(unit.min_rarity, unit.max_rarity) + "</div>"; 
            html += '<div class="unitList">';
            first = false;
        } else {
            if (unit.max_rarity != lastMaxRarity || unit.min_rarity != lastMinRarity) {
                html += '</div>';
                html += '<div class="raritySeparator">' + getRarity(unit.min_rarity, unit.max_rarity) + "</div>"; 
                html += '<div class="unitList">';
            }
        }
        lastMaxRarity = unit.max_rarity;
        lastMinRarity = unit.min_rarity;
        html += getUnitDisplay(unit);
    }
    html += '</div>';
    return html;

};

function getUnitDisplay(unit) { 
    var html = '<div class="unit ' + unit.id;
    if (ownedUnits[unit.id]) {
        html += ' owned"';
    } else {
        html += ' notOwned"';
    }
    html +=' onclick="toogleUnit(\'' + unit.id + '\')"><div class="unitImageWrapper"><div><img class="unitImage" src="/img/units/unit_ills_' + unit.id + '.png"/></div></div><div class="unitName">' + unit.name + '</div>';
    html += '<div class="unitRarity">'
    html += getRarity(unit.min_rarity, unit.max_rarity);
    html += '</div></div>';
    return html;
}

function getRarity(minRarity, maxRarity) {
    var html = '';
    for (var rarityIndex = 0; rarityIndex < minRarity; rarityIndex++ ) {
        html += '<img src="/img/star_icon_filled.png"/>';
    }
    for (var rarityIndex = 0; rarityIndex < (maxRarity - minRarity); rarityIndex++ ) {
        html += '<img src="/img/star_icon.png"/>';
    }
    return html;
}


function toogleUnit(unitId) {
    if (ownedUnits[unitId]) {
        delete ownedUnits[unitId];
        $(".unit." + unitId).removeClass("owned");
        $(".unit." + unitId).addClass("notOwned");
    } else {
        ownedUnits[unitId] = 1;
        $(".unit." + unitId).addClass("owned");
        $(".unit." + unitId).removeClass("notOwned");    
    }
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUnits,3000);
    $(".saveInventory").removeClass("hidden");
}

function saveUnits() {
    if (saveTimeout) {clearTimeout(saveTimeout)}
    $(".saveInventory").addClass("hidden");
    $("#inventoryDiv .loader").removeClass("hidden");
    $("#inventoryDiv .message").addClass("hidden");
    saveNeeded = false;
    $.ajax({
        url: server + '/units',
        method: 'PUT',
        data: JSON.stringify(ownedUnits),
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
        error: function(error) {
            $("#inventoryDiv .loader").addClass("hidden");
            if (error.status == 401) {
                alert('You have been disconnected. The data was not saved. The page will be reloaded.');
                window.location.reload();
            } else {
                saveNeeded = true;
                $(".saveInventory").removeClass("hidden");
                alert('error while saving the inventory. Please click on "Save" to try again');
            }
            
        }
    });
}

function filterName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (unit.name.toLowerCase().indexOf(textToSearch) >= 0) {
                result.push(unit);
            }
        }
    } else {
        return units;
    }
    return result;
}

function keepOnlyOneOfEachMateria() {
    var idsAlreadyKept = [];
    var result = [];
    for (var index in data) {
        var item = data[index];
        if (item.type == "materia" && !item.access.includes("not released yet") && !idsAlreadyKept.includes(item[itemKey])) {
            result.push(item);
            idsAlreadyKept.push(item[itemKey]);
        }
    }
    return result;
}

function sortAlphabetically(units) {
    return units.sort(function (unit1, unit2){
        return unit1.name.localeCompare(unit2.name);
    });
};

function sortByRarity(units) {
    return units.sort(function (unit1, unit2){
        if (unit1.max_rarity == unit2.max_rarity) {
            if (unit1.min_rarity == unit2.min_rarity) {
                return unit1.name.localeCompare(unit2.name);
            } else {
                return unit2.min_rarity - unit1.min_rarity;
            }
        } else {
            return unit2.max_rarity - unit1.max_rarity;
        }
    });
};

function inventoryLoaded() {
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#inventory").addClass("hidden");
}

function updateResults() {
    currentSort();
}

// will be called by jQuery at page load)
$(function() {

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(server + "/units.json", function(unitResult) {
        $.get(server + "/releasedUnits.json", function(releasedUnitResult) {
            $.get(server + "/units", function(ownedUnitResult) {
                ownedUnits = ownedUnitResult;
                units = [];
                for (var name in unitResult) {
                    if (releasedUnitResult[name]) {
                        units.push(unitResult[name]);
                        unitResult[name].name = name;
                    }
                }
                showAlphabeticalSort();
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                
            });    
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });    
        
        /*$.get(server + "/lastItemReleases.json", function(result) {
            lastItemReleases = result;
            prepareLastItemReleases();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });*/
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    
	
    $("#results").addClass(server);
    
	
    $(window).on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !"
        }
    });
    
    $("#searchBox").on("input", $.debounce(300,updateResults));
    
});