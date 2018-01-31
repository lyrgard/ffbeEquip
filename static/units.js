var saveNeeded = false;

var saveTimeout;

var itemKey = getItemInventoryKey();
var releasedUnits;
var lastItemReleases;

var currentSort = showAlphabeticalSort;

var allUnits;
var tmrNumberByUnitId = {};
var tmrNameByUnitId = {};

var onlyShowOwnedUnits = false;
var showNumberTMRFarmed = false;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#units").removeClass("hidden");
    $("#searchBox").addClass("hidden");
    
    $(".nav-tabs li.alphabeticalSort").removeClass("active");
    $(".nav-tabs li.raritySort").removeClass("active");
    $(".nav-tabs li.tmrAlphabeticalSort").removeClass("active");
    $(".nav-tabs li.history").removeClass("active");
    $("#searchBox").prop("placeholder", "Enter unit name");
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

function showRaritySort(only5Star = false) {
    beforeShow();
    currentSort = showRaritySort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.raritySort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnitsByRarity(sortByRarity(filterName(units)), only5Star));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

function showTMRAlphabeticalSort() {
    beforeShow();
    currentSort = showTMRAlphabeticalSort;
    $("#searchBox").removeClass("hidden");
    $("#searchBox").prop("placeholder", "Enter TMR name");
    
    $(".nav-tabs li.tmrAlphabeticalSort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortTMRAlphabetically(filterTMRName(units)), true));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

function showHistory() {
    beforeShow();
    currentSort = showHistory;
    $(".nav-tabs li.history").addClass("active");
    // filter, sort and display the results
    
    var html = "";
    for (var dateIndex in lastItemReleases) {
        var first = true;
        for (var sourceIndex in lastItemReleases[dateIndex].sources) {
            if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
                if (first) {
                    html += '<div class="date">' + lastItemReleases[dateIndex].date+'</div>';
                    first = false;
                }
                var unitsTodisplay = [];
                var unitNames = lastItemReleases[dateIndex].sources[sourceIndex].units;
                for (var unitNameIndex = 0, len = unitNames.length; unitNameIndex < len; unitNameIndex++) {
                    var unitName = unitNames[unitNameIndex];
                    if (allUnits[unitName]) {
                        unitsTodisplay.push(allUnits[unitName]);
                    }
                }
                html += displayUnits(unitsTodisplay);
            }
        }
    }
    $("#results").html(html);
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units, useTmrName = false) {
    var html = '<div class="unitList">';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        html += getUnitDisplay(unit, useTmrName);
    }
    html += '</div>';
    return html;

};

function displayUnitsByRarity(units, only5Star = false) {
    var lastMinRarity, lastMaxRarity;
    var first = true;
    
    var html = '';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        if (only5Star && unit.min_rarity < 5) {
            continue;
        }
        if (first) {
            if (!only5Star) {
                html += '<div class="raritySeparator">' + getRarity(unit.min_rarity, unit.max_rarity) + "</div>"; 
            }
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

function getUnitDisplay(unit, useTmrName = false) { 
    var html = "";
    if (!onlyShowOwnedUnits || ownedUnits[unit.id]) {
        html += '<div class="unit ' + unit.id;
        if (ownedUnits[unit.id]) {
            html += ' owned';
        } else {
            html += ' notOwned';
        }
        if (ownedUnits[unit.id] && ownedUnits[unit.id].farmable > 0) {
            html += ' farmable';
        }
        html +='" onclick="addToOwnedUnits(\'' + unit.id + '\')">';
        html +='<div class="numberOwnedDiv numberDiv"><span class="glyphicon glyphicon-plus" onclick="event.stopPropagation();addToOwnedUnits(\'' + unit.id + '\')"></span>';
        html += '<span class="ownedNumber badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].number : 0) + '</span>';
        html += '<span class="glyphicon glyphicon-minus" onclick="event.stopPropagation();removeFromOwnedUnits(\'' + unit.id +'\');"></span></div>';
        html +='<div class="farmableTMRDiv numberDiv"><span class="glyphicon glyphicon-plus" onclick="event.stopPropagation();addToFarmableNumberFor(\'' + unit.id + '\')"></span>';
        if (showNumberTMRFarmed) {
            html += '<span class="farmableNumber badge badge-success">' + (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0) + '</span>';
        } else {
            html += '<span class="farmableNumber badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].farmable : 0) + '</span>';
        }
        html += '<span class="glyphicon glyphicon-minus" onclick="event.stopPropagation();removeFromFarmableNumberFor(\'' + unit.id +'\');"></span></div>';
        html += '<img class="farmedButton" onclick="event.stopPropagation();farmedTMR(' + unit.id + ')" src="/img/units/unit_ills_904000105.png" title="TMR Farmed ! Click here to indicate you farmed this TMR. It will decrease the number you can farm and increase the number you own this TMR by 1"></img>'
        html += '<div class="unitImageWrapper"><div><img class="unitImage" src="/img/units/unit_ills_' + unit.id + '.png"/></div></div>';
        html +='<div class="unitName">';
        if (useTmrName) {
            html += tmrNameByUnitId[unit.id];
        } else {
            html += unit.name;  
        }
        html += '</div>';
        html += '<div class="unitRarity">'
        html += getRarity(unit.min_rarity, unit.max_rarity);
        html += '</div></div>';
    }
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


function addToOwnedUnits(unitId) {
    if (!ownedUnits[unitId]) {
        ownedUnits[unitId] = {"number":1, "farmable":0};
        $(".unit." + unitId).addClass("owned");
        $(".unit." + unitId).removeClass("notOwned");    
    } else {
        ownedUnits[unitId].number += 1;
    }
    if (!tmrNumberByUnitId[unitId] || (tmrNumberByUnitId[unitId] < ownedUnits[unitId].number)) {
        addToFarmableNumberFor(unitId);
    }
    $(".unit." + unitId + " .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true);
    $(".saveInventory").removeClass("hidden");
}

function removeFromOwnedUnits(unitId) {
    if (!ownedUnits[unitId]) {
        return;
    }
    ownedUnits[unitId].number -= 1;
    if (ownedUnits[unitId].number == 0) {
        removeFromFarmableNumberFor(unitId);
        delete ownedUnits[unitId];
        $(".unit." + unitId).removeClass("owned");
        $(".unit." + unitId).addClass("notOwned");
        $(".unit." + unitId + " .numberOwnedDiv .badge").html("0");
    } else {
        $(".unit." + unitId + " .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
        if (ownedUnits[unitId].number < ownedUnits[unitId].farmable) {
            removeFromFarmableNumberFor(unitId);
        }
    }
    
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true);
    $(".saveInventory").removeClass("hidden");
}

function addToFarmableNumberFor(unitId) {
    if (!ownedUnits[unitId]) {
        return;   
    } else {
        if (ownedUnits[unitId].farmable < ownedUnits[unitId].number) {
            ownedUnits[unitId].farmable += 1;
        } else {
            return;
        }
    }
    $(".unit." + unitId + " .farmableTMRDiv .badge").html(ownedUnits[unitId].farmable);
    $(".unit." + unitId).addClass("farmable");
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true);
    $(".saveInventory").removeClass("hidden");
}

function removeFromFarmableNumberFor(unitId) {
    if (!ownedUnits[unitId] || ownedUnits[unitId].farmable == 0) {
        return;
    }
    ownedUnits[unitId].farmable -= 1;
    $(".unit." + unitId + " .farmableTMRDiv .badge").html(ownedUnits[unitId].farmable);
    if (ownedUnits[unitId].farmable == 0) {
        $(".unit." + unitId).removeClass("farmable");
    }
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true);
    $(".saveInventory").removeClass("hidden");
}

function farmedTMR(unitId) {
    var unitName;
    for (var index = units.length; index--; ) {
        if (units[index].id == unitId) {
            unitName = units[index].name;
        }
    }
    if (!unitName) {
        return;
    }
    for (var index = data.length; index--;) {
        if (data[index].tmrUnit && itemInventory[data[index].id] && data[index].tmrUnit == unitName && !data[index].access.includes("not released yet")) {
            itemInventory[data[index].id] += 1;
        }
    }
    removeFromFarmableNumberFor(unitId);
    if (saveTimeout) {clearTimeout(saveTimeout)}
    mustSaveInventory = true;
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true);
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

function filterTMRName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (tmrNameByUnitId[unit.id] && tmrNameByUnitId[unit.id].toLowerCase().indexOf(textToSearch) >= 0) {
                result.push(unit);
            }
        }
    } else {
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (tmrNameByUnitId[unit.id]) {
                result.push(unit);
            }
        }
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

function sortTMRAlphabetically(units) {
    return units.sort(function (unit1, unit2){
        if (!tmrNameByUnitId[unit1.id]) {
            console.log(unit1.name);
        }
        return tmrNameByUnitId[unit1.id].localeCompare(tmrNameByUnitId[unit2.id]);
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

function sortByBaseRarity(units) {
    return units.sort(function (unit1, unit2){
        if (unit1.min_rarity == unit2.min_rarity) {
            return unit1.name.localeCompare(unit2.name);
        } else {
            return unit2.min_rarity - unit1.min_rarity;
        }
    });
};


function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#inventory").addClass("hidden");
}

function updateResults() {
    currentSort();
}

function inventoryLoaded() {
    if (units && data) {
        prepareData();
        showAlphabeticalSort();    
    }
}

function prepareData() {
    for (var index = data.length; index--; ) {
        var item = data[index];
        if (item.tmrUnit) {
            if (itemInventory[item.id]) {
                tmrNumberByUnitId[item.tmrUnit] = itemInventory[item.id];
            }
            tmrNameByUnitId[item.tmrUnit] = item.name;
        }
    }
}

function exportAsImage(only5Star = false) {
    $("#loaderGlassPanel").removeClass("hidden");
    var savedSort = currentSort;
    onlyShowOwnedUnits = true;
    showNumberTMRFarmed = true;
    showRaritySort(only5Star);
    if (only5Star) {
        $("#results").addClass("hackForImage5");
    } else {
        $("#results").addClass("hackForImage");
    }
    setTimeout(function() {
        html2canvas($("#results")[0]).then(function(canvas) {
            canvas.toBlob(function (blob) {
                saveAs(blob, "FFBE_Equip - Unit collection.png");
                onlyShowOwnedUnits = false;
                showNumberTMRFarmed = false;
                savedSort();
                $("#results").removeClass("hackForImage");
                $("#results").removeClass("hackForImage5");
                
                $("#loaderGlassPanel").addClass("hidden");
            });
        });
    }, 1);
    
}

function exportAsCsv() {
    var csv = "Unit Id; Unit Name;Min Rarity;Max Rarity;Number Owned;Number of TMR owned;Number of TMR still farmable\n";
    var sortedUnits = sortByRarity(units);
    for (var index = 0, len = sortedUnits.length; index < len; index++) {
        var unit = units[index];
        if (ownedUnits[unit.id]) {
            csv +=  "\"" + unit.id + "\";" + "\"" + unit.name + "\";" + unit.min_rarity + ';' + unit.max_rarity + ';' + (ownedUnits[unit.id] ? ownedUnits[unit.id].number : 0) + ';' + (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0) + ';' + (ownedUnits[unit.id] ? ownedUnits[unit.id].farmable : 0) + "\n";
        }
    }
    window.saveAs(new Blob([csv], {type: "text/csv;charset=utf-8"}), 'FFBE_Equip - Unit collection.csv');
}

function exportAsText() {
    var text = "";
    var sortedUnits = sortByBaseRarity(units);
    var currentBaseRarity;
    first = true;
    for (var index = 0, len = sortedUnits.length; index < len; index++) {
        var unit = units[index];
        if (ownedUnits[unit.id]) {
            if (!currentBaseRarity || currentBaseRarity != unit.min_rarity) {
                if (currentBaseRarity) {
                    text += "\n\n";
                }
                text += "Base " + unit.min_rarity + "★  \n";
                currentBaseRarity = unit.min_rarity;
                first = true;
            }
            if (first) {
                first = false;
            } else {
                text += ", ";
            }
            text +=  unit.name;
            if (ownedUnits[unit.id] && ownedUnits[unit.id].number > 1) {
                text += " x" + ownedUnits[unit.id].number;
            }
        }
    }
    showTextPopup("Owned units", text);
}

// will be called by jQuery at page load)
$(function() {

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(server + "/units.json", function(unitResult) {
        allUnits = unitResult;
        $.get(server + "/releasedUnits.json", function(releasedUnitResult) {
            units = [];
            for (var name in unitResult) {
                if (releasedUnitResult[name]) {
                    units.push(unitResult[name]);
                    unitResult[name].name = name;
                }
            }
            if (itemInventory && ownedUnits && data) {
                prepareData();
                showAlphabeticalSort();    
            }
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
    $.get(server + "/data.json", function(result) {
        data = result;
        if (itemInventory && units && ownedUnits) {
            prepareData();
            showAlphabeticalSort();    
        }
        $.get(server + "/lastItemReleases.json", function(result) {
            lastItemReleases = result;
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });
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