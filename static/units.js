var releasedUnits;
var lastItemReleases;

var currentSort = showRaritySort;

var allUnits;
var tmrNumberByUnitId = {};
var tmrNameByUnitId = {};
var stmrNumberByUnitId = {};
var stmrNameByUnitId = {};

var onlyShowOwnedUnits = false;
var showNumberTMRFarmed = false;
var readOnly;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#unitsWrapper").removeClass("hidden");
    $("#searchBox").addClass("hidden");

    $(".nav-tabs li.alphabeticalSort").removeClass("active");
    $(".nav-tabs li.raritySort").removeClass("active");
    $(".nav-tabs li.tmrAlphabeticalSort").removeClass("active");
    $(".nav-tabs li.history").removeClass("active");
    $(".nav-tabs li.pullSimulator").removeClass("active");
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
    lazyLoader.update();
}

function showRaritySort(minRarity = 1) {
    beforeShow();
    currentSort = showRaritySort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.raritySort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnitsByRarity(sortByRarity(filterName(units)), minRarity));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
    lazyLoader.update();
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
    lazyLoader.update();
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
    lazyLoader.update();
}

function showPullSimulator() {
    beforeShow();
}

function displayStats() {
    var stats = {
        "all": {
            "7": {"different":0, "total":0, "number":0},
            "5": {"different":0, "total":0, "number":0},
            "4": {"different":0, "total":0, "number":0},
            "3": {"different":0, "total":0, "number":0},
        },
        "timeLimited": {
            "7": {"different":0, "total":0, "number":0},
            "5": {"different":0, "total":0, "number":0},
            "4": {"different":0, "total":0, "number":0},
            "3": {"different":0, "total":0, "number":0},
        }
    }
    var unitIds = Object.keys(units);
    for (var i = unitIds.length; i--;) {
        var unit = units[unitIds[i]];
        if (unit.min_rarity >= 3) {
            var maxRarity = (unit.unreleased7Star ? 6 : unit.max_rarity);
            stats.all[unit.min_rarity].total++;
            if (maxRarity == 7) {
                stats.all["7"].total++;
            }
            if (ownedUnits[unit.id]) {
                stats.all[unit.min_rarity].number += ownedUnits[unit.id].number;
                stats.all[unit.min_rarity].different++;
                if (maxRarity == 7 && ownedUnits[unit.id].sevenStar) {
                    stats.all["7"].number += ownedUnits[unit.id].sevenStar;
                    stats.all["7"].different++;
                }
            }
            if (unit.summon_type == "event") {
                stats.timeLimited[unit.min_rarity].total++;
                if (maxRarity == 7) {
                    stats.timeLimited["7"].total++;
                }
                if (ownedUnits[unit.id]) {
                    stats.timeLimited[unit.min_rarity].number += ownedUnits[unit.id].number;
                    stats.timeLimited[unit.min_rarity].different++;
                    if (maxRarity == 7 && ownedUnits[unit.id].sevenStar) {
                        stats.timeLimited["7"].number += ownedUnits[unit.id].sevenStar;
                        stats.timeLimited["7"].different++;
                    }
                }
            }
        }
    }
    $(".stats .all .star7 .value").text(stats.all["7"].different);
    $(".stats .all .star7 .total").text(stats.all["7"].total);
    $(".stats .all .star7 .number").text("(" + stats.all["7"].number + ")");
    
    $(".stats .all .star5 .value").text(stats.all["5"].different);
    $(".stats .all .star5 .total").text(stats.all["5"].total);
    $(".stats .all .star5 .number").text("(" + stats.all["5"].number + ")");
    
    $(".stats .all .star4 .value").text(stats.all["4"].different);
    $(".stats .all .star4 .total").text(stats.all["4"].total);
    $(".stats .all .star4 .number").text("(" + stats.all["4"].number + ")");
    
    $(".stats .all .star3 .value").text(stats.all["3"].different);
    $(".stats .all .star3 .total").text(stats.all["3"].total);
    $(".stats .all .star3 .number").text("(" + stats.all["3"].number + ")");
    
    $(".stats .withoutTimeLimited .star7 .value").text(stats.all["7"].different - stats.timeLimited["7"].different);
    $(".stats .withoutTimeLimited .star7 .total").text(stats.all["7"].total - stats.timeLimited["7"].total);
    $(".stats .withoutTimeLimited .star7 .number").text("(" + (stats.all["7"].number - stats.timeLimited["7"].number) + ")");
    
    $(".stats .withoutTimeLimited .star5 .value").text(stats.all["5"].different - stats.timeLimited["5"].different);
    $(".stats .withoutTimeLimited .star5 .total").text(stats.all["5"].total - stats.timeLimited["5"].total);
    $(".stats .withoutTimeLimited .star5 .number").text("(" + (stats.all["5"].number - stats.timeLimited["5"].number) + ")");
    
    $(".stats .withoutTimeLimited .star4 .value").text(stats.all["4"].different - stats.timeLimited["4"].different);
    $(".stats .withoutTimeLimited .star4 .total").text(stats.all["4"].total - stats.timeLimited["4"].total);
    $(".stats .withoutTimeLimited .star4 .number").text("(" + (stats.all["4"].number - stats.timeLimited["4"].number) + ")");
    
    $(".stats .withoutTimeLimited .star3 .value").text(stats.all["3"].different - stats.timeLimited["3"].different);
    $(".stats .withoutTimeLimited .star3 .total").text(stats.all["3"].total - stats.timeLimited["3"].total);
    $(".stats .withoutTimeLimited .star3 .number").text("(" + (stats.all["3"].number - stats.timeLimited["3"].number) + ")");
    
    $(".stats .timeLimited .star7 .value").text(stats.timeLimited["7"].different);
    $(".stats .timeLimited .star7 .total").text(stats.timeLimited["7"].total);
    $(".stats .timeLimited .star7 .number").text("(" + stats.timeLimited["7"].number + ")");
    
    $(".stats .timeLimited .star5 .value").text(stats.timeLimited["5"].different);
    $(".stats .timeLimited .star5 .total").text(stats.timeLimited["5"].total);
    $(".stats .timeLimited .star5 .number").text("(" + stats.timeLimited["5"].number + ")");
    
    $(".stats .timeLimited .star4 .value").text(stats.timeLimited["4"].different);
    $(".stats .timeLimited .star4 .total").text(stats.timeLimited["4"].total);
    $(".stats .timeLimited .star4 .number").text("(" + stats.timeLimited["4"].number + ")");
    
    $(".stats .timeLimited .star3 .value").text(stats.timeLimited["3"].different);
    $(".stats .timeLimited .star3 .total").text(stats.timeLimited["3"].total);
    $(".stats .timeLimited .star3 .number").text("(" + stats.timeLimited["3"].number + ")");
    
    $(".unitsSidebar .hidden").removeClass("hidden");
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units, useTmrName = false) {
    var html = '';
    if (units.length > 0) {
        html = '<div class="unitList">';
        for (var index = 0, len = units.length; index < len; index++) {
            var unit = units[index];
            html += getUnitDisplay(unit, useTmrName);
        }
        html += '</div>';
    } else {
        html = "<p>No "+ (useTmrName ? "TMR" : "units") +" found...</p>"
    }

    return html;

};

function buildRarityID(min_rarity, max_rarity)
{
    return "rarity-" + min_rarity + "-of-" + max_rarity;
}

function displayUnitsByRarity(units, minRarity = 1) {
    var lastMinRarity, lastMaxRarity;
    var first = true;

    var html = '';

    if (units.length > 0) {
        var rarity_list = []; // will gather rarity to display a jump list later
        for (var index = 0, len = units.length; index < len; index++) {
            var unit = units[index];
            if (unit.min_rarity < minRarity) {
                continue;
            }
            var maxRarity = (unit.unreleased7Star ? 6 : unit.max_rarity);
            if (first) {
                html += '<div class="raritySeparator" id="' + buildRarityID(unit.min_rarity, maxRarity) + '">' + getRarity(unit.min_rarity, maxRarity) + "</div>";
                html += '<div class="unitList">';
                first = false;
                rarity_list.push({'min_rarity': unit.min_rarity, "max_rarity": maxRarity});
            } else {
                if (maxRarity != lastMaxRarity || unit.min_rarity != lastMinRarity) {
                    html += '</div>';
                    html += '<div class="raritySeparator" id="' + buildRarityID(unit.min_rarity, maxRarity) + '">' + getRarity(unit.min_rarity, maxRarity) + "</div>";
                    html += '<div class="unitList">';
                    rarity_list.push(unit);
                }
            }
            lastMaxRarity = maxRarity;
            lastMinRarity = unit.min_rarity;
            html += getUnitDisplay(unit);
        }
        html += '</div>';
        
        var rarity_jump_html = '';
        if (rarity_list.length > 1) {
            // Jump list display
            rarity_jump_html = '<div class="rarityJumpList" data-html2canvas-ignore>';
            rarity_jump_html += '<span>Jump to </span>';
            // Loop from end to begin, to show smaller star first
            // Also, do not show index 0 because it's the one just below, so don't need to jump...
            for (index = 1, len = rarity_list.length; index < len; index++) {
                rarity_jump_html += '<a class="rarityJump" href="#' + buildRarityID(rarity_list[index].min_rarity, rarity_list[index].max_rarity) + '">';
                rarity_jump_html += getRarity(rarity_list[index].min_rarity, rarity_list[index].max_rarity) ;
                rarity_jump_html += "</a>";
            }
            rarity_jump_html += '</div>';
        }
        html = rarity_jump_html + html;
    } else {
        html = "<p>No units found...</p>";
    }

    return html;

};

function getUnitDisplay(unit, useTmrName = false) {
  var html = "";
    if (!onlyShowOwnedUnits || ownedUnits[unit.id]) {
        var is7Stars = unit.min_rarity == 7;
        html += '<div class="unit ' + unit.id;
        if (ownedUnits[unit.id]) {
            html += ' owned';
        } else {
            html += ' notOwned';
        }
        if (ownedUnits[unit.id] && (!is7Stars  && ownedUnits[unit.id].farmable > 0) || (is7Stars && ownedUnits[unit.id].farmableStmr > 0)) {
            html += ' farmable';
        }
        if (!is7Stars && !unit.unreleased7Star && unit.max_rarity == 7 && ownedUnits[unit.id] && ownedUnits[unit.id].number >= 2) {
            html += ' awakenable';
        }
        if (is7Stars) {
            html += ' sevenStars';
        } else {
            html += ' notSevenStars';
        }
        html += '"';
        if (!is7Stars) {
            html +=' onclick="addToOwnedUnits(\'' + unit.id + '\')"';    
            html += ' title="Add one ' + unit.name + ' to your collection"';
        }
        html += '>';
        
        if (unit.summon_type === 'event') {
            html +='<span class="glyphicon glyphicon-time"/>';
        }
        var addFunction = (is7Stars ? "addTo7Stars" : "addToOwnedUnits");
        html += '<div class="numberOwnedDiv numberDiv"><span class="glyphicon glyphicon-plus modifyCounterButton" onclick="event.stopPropagation();' + addFunction + '(\'' + unit.id + '\')" title="Add one ' + unit.name + ' to your collection"></span>';
        var numberOwned = (ownedUnits[unit.id] ? ownedUnits[unit.id].number : 0);
        if (is7Stars) {
            numberOwned = ownedUnits[unit.id].sevenStar;
        }
        html += '<span class="ownedNumber badge badge-success">' + numberOwned + '</span>';
        
        var removeFunction = (is7Stars ? "removeFrom7Stars" : "removeFromOwnedUnits");
        html += '<span class="glyphicon glyphicon-minus modifyCounterButton" onclick="event.stopPropagation();' + removeFunction + '(\'' + unit.id + '\');" title="Remove one ' + unit.name + ' from your collection"></span></div>';
        var addToFarmableNumberFunction = (is7Stars ? "addToFarmable7StarsNumber" : "addToFarmableNumberFor");
        html += '<div class="farmableTMRDiv numberDiv"><span class="glyphicon glyphicon-plus modifyCounterButton" onclick="event.stopPropagation();' + addToFarmableNumberFunction + '(\'' + unit.id + '\')" title="Augment by one the number of TMR remaining"></span>';
        if (is7Stars) {
            if (showNumberTMRFarmed) {
                html += '<span class="farmableNumber badge badge-success">' + (stmrNumberByUnitId[unit.id] ? stmrNumberByUnitId[unit.id] : 0) + '</span>';
            } else {
                html += '<span class="farmableNumber badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].farmableStmr : 0) + '</span>';
            }
        } else {
            if (showNumberTMRFarmed) {
                html += '<span class="farmableNumber badge badge-success">' + (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0) + '</span>';
            } else {
                html += '<span class="farmableNumber badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].farmable : 0) + '</span>';
            }
        }
        var removeFromFarmableFunction = (is7Stars ? "removeFromStmrFarmableNumberFor" : "removeFromFarmableNumberFor");
        html += '<span class="glyphicon glyphicon-minus modifyCounterButton" onclick="event.stopPropagation();' + removeFromFarmableFunction + '(\'' + unit.id + '\');" title="Reduce by one the number of TMR remaining"></span></div>';
        var farmedFunction = (is7Stars ? "farmedSTMR" : "farmedTMR");
        html += '<img class="farmedButton" onclick="event.stopPropagation();' + farmedFunction + '(' + unit.id + ')" src="/img/units/unit_ills_904000105.png" title="' +  (is7Stars ? 'STMR acquired !' : 'TMR Farmed ! Click here to indicate you farmed this TMR. It will decrease the number you can farm and increase the number you own this TMR by 1') + '"></img>';
        //html += '<img class="awakenButton" onclick="event.stopPropagation();awaken(' + unit.id + ')" src="/img/icons/crystals/sevenStarCrystal.png" title="Awaken this unit !"></img>'
        html += '<i class="img img-crystal-sevenStarCrystal awakenButton" onclick="event.stopPropagation();awaken(' + unit.id + ')" title="Awaken this unit !"></i>';
        var formToDisplay = unit.max_rarity;
        if (formToDisplay == 7 && unit.min_rarity != 7) {
            formToDisplay = 6;
        }
        html += '<div class="unitImageWrapper"><div><img class="unitImage lazyload" data-src="/img/units/unit_ills_' + unit.id.substr(0, unit.id.length - 1) + formToDisplay + '.png"/></div></div>';
        html +='<div class="unitName"><div>';
        if (useTmrName) {
            html += toLink(tmrNameByUnitId[unit.id]);
        } else {
            html += toLink(unit.name);
        }
        html += '</div></div>';
        html += '<div class="unitRarity">'
        html += getRarity(unit.min_rarity, (unit.unreleased7Star ? 6 : unit.max_rarity));
        html += '</div></div>';
    }
    return html;
}

function getRarity(minRarity, maxRarity) {
    var html = '';
    for (var rarityIndex = 0; rarityIndex < minRarity; rarityIndex++ ) {
        html += '<img src="/img/icons/star_icon_filled.png"/>';
    }
    for (var rarityIndex = 0; rarityIndex < (maxRarity - minRarity); rarityIndex++ ) {
        html += '<img src="/img/icons/star_icon.png"/>';
    }
    return html;
}


function addToOwnedUnits(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId]) {
        ownedUnits[unitId] = {"number":0, "farmable":0};
    }
    if (ownedUnits[unitId].number == 0) {
        $(".unit.notSevenStars." + unitId).addClass("owned");
        $(".unit.notSevenStars." + unitId).removeClass("notOwned");
    }
    
    ownedUnits[unitId].number += 1;
    if (ownedUnits[unitId].number >= 2 && !allUnits[unitId].unreleased7Star && allUnits[unitId].max_rarity == 7) {
        $(".unit.notSevenStars." + unitId).addClass("awakenable");
    }
    if (!tmrNumberByUnitId[unitId] || (tmrNumberByUnitId[unitId] < ownedUnits[unitId].number)) {
        addToFarmableNumberFor(unitId);
    }
    $(".unit." + unitId + ".notSevenStars .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
    markSaveNeeded();
    displayStats();
}

function addTo7Stars(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || !ownedUnits[unitId].sevenStar) {
        return;
    } 
    ownedUnits[unitId].sevenStar += 1;
    
    if (!stmrNumberByUnitId[unitId] || (stmrNumberByUnitId[unitId] < ownedUnits[unitId].sevenStar)) {
        addToFarmable7StarsNumber(unitId);
    }
    $(".unit." + unitId + ".sevenStars .numberOwnedDiv .badge").html(ownedUnits[unitId].sevenStar);
    markSaveNeeded();
    displayStats();
}

function removeFromOwnedUnits(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId]) {
        return;
    }
    if (ownedUnits[unitId].number == 0) {
        return;
    }
    ownedUnits[unitId].number -= 1;
    if (ownedUnits[unitId].number == 0) {
        removeFromFarmableNumberFor(unitId);
        if (ownedUnits[unitId].number == 0 && ownedUnits[unitId].farmable == 0 && (!ownedUnits[unitId].sevenStar || !ownedUnits[unitId].sevenStar == 0)) {
            delete ownedUnits[unitId];
            $(".unit.notSevenStars." + unitId).removeClass("owned");
            $(".unit.notSevenStars." + unitId).addClass("notOwned");
        }
        $(".unit.notSevenStars." + unitId + " .numberOwnedDiv .badge").html("0");
    } else {
        $(".unit.notSevenStars." + unitId + " .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
        if (ownedUnits[unitId].number < ownedUnits[unitId].farmable) {
            removeFromFarmableNumberFor(unitId);
        }
    }

    markSaveNeeded();
    displayStats();
}

function removeFrom7Stars(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || !ownedUnits[unitId].sevenStar) {
        return;
    }
    ownedUnits[unitId].sevenStar -= 1;
    if (ownedUnits[unitId].sevenStar < 2) {
        $(".unit." + unitId).removeClass("awakenable");
    }
    if (ownedUnits[unitId].sevenStar == 0) {
        removeFromStmrFarmableNumberFor(unitId);
        delete ownedUnits[unitId].sevenStar;
        delete ownedUnits[unitId].farmableStmr;
        currentSort();
    } else {
        $(".unit." + unitId + ".sevenStars .numberOwnedDiv .badge").html(ownedUnits[unitId].sevenStar);
        if (ownedUnits[unitId].sevenStar < ownedUnits[unitId].farmableStmr) {
            removeFromStmrFarmableNumberFor(unitId);
        }
    }

    markSaveNeeded();
    displayStats();
}

function addToFarmableNumberFor(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId]) {
        return;
    } else {
        ownedUnits[unitId].farmable += 1;
    }
    $(".unit.notSevenStars." + unitId + " .farmableTMRDiv .badge").html(ownedUnits[unitId].farmable);
    $(".unit.notSevenStars." + unitId).addClass("farmable");
    markSaveNeeded();
}

function addToFarmable7StarsNumber(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || !ownedUnits[unitId].sevenStar) {
        return;
    }
    if (ownedUnits[unitId].farmableStmr < ownedUnits[unitId].sevenStar) {
        ownedUnits[unitId].farmableStmr += 1;
    } else {
        return;
    }
    $(".unit." + unitId + ".sevenStars .farmableTMRDiv .badge").html(ownedUnits[unitId].farmableStmr);
    $(".unit." + unitId).addClass("farmable");
    markSaveNeeded();
}

function removeFromFarmableNumberFor(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || ownedUnits[unitId].farmable == 0) {
        return;
    }
    ownedUnits[unitId].farmable -= 1;
    $(".unit.notSevenStars." + unitId + " .farmableTMRDiv .badge").html(ownedUnits[unitId].farmable);
    if (ownedUnits[unitId].farmable == 0) {
        $(".unit.notSevenStars." + unitId).removeClass("farmable");
    }
    markSaveNeeded();
}

function removeFromStmrFarmableNumberFor(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || ownedUnits[unitId].farmableStmr == 0) {
        return;
    }
    ownedUnits[unitId].farmableStmr -= 1;
    $(".unit." + unitId + ".sevenStars .farmableTMRDiv .badge").html(ownedUnits[unitId].farmableStmr);
    if (ownedUnits[unitId].farmableStmr == 0) {
        $(".unit.sevenStars." + unitId).removeClass("farmable");
    }
    markSaveNeeded();
}

function farmedTMR(unitId) {
    for (var index = data.length; index--;) {
        if (data[index].tmrUnit && data[index].tmrUnit == unitId) {
            if (itemInventory[data[index].id]) {
                itemInventory[data[index].id] += 1;
            } else {
                itemInventory[data[index].id] = 1;
            }
            break;
        }
    }
    removeFromFarmableNumberFor(unitId);
    markSaveNeeded();
}

function farmedSTMR(unitId) {
    for (var index = data.length; index--;) {
        if (data[index].stmrUnit && data[index].stmrUnit == unitId) {
            if (itemInventory[data[index].id]) {
                itemInventory[data[index].id] += 1;
            } else {
                itemInventory[data[index].id] = 1;
            }
            break;
        }
    }
    removeFromStmrFarmableNumberFor(unitId);
    markSaveNeeded();
}

function awaken(unitId) {
    if (readOnly) return;
    if (!ownedUnits[unitId] || ownedUnits[unitId].number < 2 || allUnits[unitId].max_rarity != 7) {
        return;
    }
    ownedUnits[unitId].number -= 2;
    if (ownedUnits[unitId].number < 2) {
        $(".unit." + unitId).removeClass("awakenable");
    }
    $(".unit." + unitId + " .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
    if (!ownedUnits[unitId].sevenStar) {
        ownedUnits[unitId].sevenStar = 0;
        ownedUnits[unitId].farmableStmr = 0;
    }
    ownedUnits[unitId].sevenStar++;
    ownedUnits[unitId].farmableStmr++;
    currentSort();

    markSaveNeeded();
}

function markSaveNeeded() {
    saveNeeded = true;
    savePublicLinkNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    if (savePublicLinkTimeout) {clearTimeout(savePublicLinkTimeout)}
    mustSaveInventory = true;
    saveTimeout = setTimeout(saveUserData,3000, mustSaveInventory, true);
    savePublicLinkTimeout = setTimeout(savePublicLink, 10000);
}

function savePublicLink(callback) {
    var publicUnitcollection = {};
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        if (ownedUnits[unit.id]) {
            var publicUnit = {
                "number": ownedUnits[unit.id].number,
                "farmed": (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0)
            }
            if (ownedUnits[unit.id].sevenStar) {
                publicUnit.sevenStar = ownedUnits[unit.id].sevenStar;
                publicUnit.farmedStmr = (stmrNumberByUnitId[unit.id] ? stmrNumberByUnitId[unit.id] : 0)
            }
            publicUnitcollection[unit.id] = publicUnit;
        }
    }
    
    $.ajax({
        url: server + '/publicUnitCollection',
        method: 'PUT',
        data: JSON.stringify(publicUnitcollection),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) { 
            $.notify("Public link updated", "success"); 
            savePublicLinkNeeded = false;
            userSettings.unitCollection = data.id;
            if (callback) {callback(data.id)} 
        },
        error: function() { $.notify("Error while updating public link", "error"); }
    });
}

function showPublicUnitCollectionLink() {
    if (savePublicLinkNeeded || !userSettings.unitCollection) {
        savePublicLink(showPublicUnitCollectionLink)
    } else {
        Modal.showWithBuildLink("unit collection", "units.html?server=" + server + '&o#' + userSettings.unitCollection);
    }
}

function filterName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        var tokens = textToSearch.split(' ');
        for (var i = 0; i < tokens.length; i++){
            tokens[i] = tokens[i].toLowerCase();
        }
        unitLoop: for (var index = units.length; index--;) {
            for (var i = 0; i < tokens.length; i++){
                var unit = units[index];
                if (unit.name.toLowerCase().indexOf(tokens[i]) < 0 && !unit.equip.includes(tokens[i])) {
                    continue unitLoop;
                }
            }
            result.push(unit);
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
        if (item.type == "materia" && !item.access.includes("not released yet") && !idsAlreadyKept.includes(item.id)) {
            result.push(item);
            idsAlreadyKept.push(item.id);
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
    var unitsToSort = units.slice();
    if (ownedUnits) {
        for (var i = units.length; i--;) {
            if (ownedUnits[units[i].id] && ownedUnits[units[i].id].sevenStar) {
                sevenForm = JSON.parse(JSON.stringify(units[i]));
                sevenForm.min_rarity = 7;
                unitsToSort.push(sevenForm);
            }
        }
    }
    return unitsToSort.sort(function (unit1, unit2){
        var maxRarity1 = unit1.max_rarity;
        var maxRarity2 = unit2.max_rarity;
        if (maxRarity1 == 7 && unit1.unreleased7Star) {
            maxRarity1 = 6;
        }
        if (maxRarity2 == 7 && unit2.unreleased7Star) {
            maxRarity2 = 6;
        }
        if (maxRarity1 == maxRarity2) {
            if (unit1.min_rarity == unit2.min_rarity) {
                return unit1.name.localeCompare(unit2.name);
            } else {
                return unit2.min_rarity - unit1.min_rarity;
            }
        } else {
            return maxRarity2 - maxRarity1;
        }
    });
}

function sortByBaseRarity(units) {
    return units.sort(function (unit1, unit2){
        if (unit1.min_rarity == unit2.min_rarity) {
            return unit1.name.localeCompare(unit2.name);
        } else {
            return unit2.min_rarity - unit1.min_rarity;
        }
    });
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#unitsWrapper").addClass("hidden");
    onDataReady();
}

function updateResults() {
    currentSort();
}

function inventoryLoaded() {
    onDataReady();

    if (Object.keys(ownedUnits).length === 0) {
        $("#firstTimeMessage").removeClass('hidden');
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
        if (item.stmrUnit) {
            if (itemInventory[item.id]) {
                stmrNumberByUnitId[item.stmrUnit] = itemInventory[item.id];
            }
            stmrNameByUnitId[item.tmrUnit] = item.name;
        }
    }
}

function exportAsImage(minRarity = 1) {
    $("body").addClass("loading");
    var savedSort = currentSort;
    onlyShowOwnedUnits = true;
    showNumberTMRFarmed = true;
    showRaritySort(minRarity);
    if (minRarity != 1) {
        $("#results").addClass("hackForImage5");
    } else {
        $("#results").addClass("hackForImage");
    }
    setTimeout(function() {
        lazyLoader.loadAll();
        setTimeout(function() {
            html2canvas($("#results")[0]).then(function(canvas) {
                canvas.toBlob(function (blob) {
                    saveAs(blob, "FFBE_Equip - Unit collection.png");
                    onlyShowOwnedUnits = false;
                    showNumberTMRFarmed = false;
                    savedSort();
                    $("#results").removeClass("hackForImage");
                    $("#results").removeClass("hackForImage5");

                    $("body").removeClass("loading");
                });
            });
        });
    }, 1);

}

function exportAsCsv() {
    var csv = "Unit Id; Unit Name;Min Rarity;Max Rarity;Number Owned;Number of TMR/STMR owned;Number of TMR/STMR still farmable\n";
    var sortedUnits = sortByRarity(units);
    for (var index = 0, len = sortedUnits.length; index < len; index++) {
        var unit = sortedUnits[index];
        if (ownedUnits[unit.id]) {
            var maxRarity = (unit.unreleased7Star ? 6 : unit.max_rarity)
            csv +=  "\"" + unit.id + "\";" + 
                "\"" + unit.name + "\";" + 
                unit.min_rarity + ';' + 
                maxRarity + ';' + 
                (unit.min_rarity == 7 ? ownedUnits[unit.id].sevenStar : ownedUnits[unit.id].number) + ';' + 
                (unit.min_rarity == 7 ? (stmrNumberByUnitId[unit.id] ? stmrNumberByUnitId[unit.id] : 0) : (tmrNumberByUnitId[unit.id] ? tmrNumberByUnitId[unit.id] : 0)) + ';' + 
                (unit.min_rarity == 7 ? ownedUnits[unit.id].farmableStmr : ownedUnits[unit.id].farmable) + "\n";
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
    Modal.showWithTextData("Owned units", text);
}

function onDataReady() {
    if (units && data) {
        if (window.location.hash.length > 1 && isLinkId(window.location.hash.substr(1))) {
            $("#mode").addClass('hidden');
            $.ajax({
                accepts: "application/json",
                url: "https://firebasestorage.googleapis.com/v0/b/" + window.clientConfig.firebaseBucketUri + "/o/UnitCollections%2F" + window.location.hash.substr(1) + ".json?alt=media",
                success: function (result) {
                    ownedUnits = result;
                    tmrNumberByUnitId = {};
                    for (var id in ownedUnits) {
                        tmrNumberByUnitId[id] = ownedUnits[id].farmed;
                        stmrNumberByUnitId[id] = ownedUnits[id].farmedStmr;
                    }
                    showNumberTMRFarmed= true;
                    showRaritySort();
                    displayStats();
                },
                error: function (textStatus, errorThrown) {
                    $.notify("Error : no data found", "error");
                    console.log(textStatus, errorThrown);
                }
            });
        } else if (itemInventory && ownedUnits) {
            prepareData();
            showRaritySort();
            displayStats();
        }
    } 
}

// will be called by common.js at page load
function startPage() {
    if (window.location.hash.length > 1 && isLinkId(window.location.hash.substr(1))) {
        $('body').addClass("readOnly");
        readOnly = true;
    }
    
	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("units", true, function(unitResult) {
        allUnits = unitResult;
        getStaticData("releasedUnits", false, function(releasedUnitResult) {
            units = [];
            for (var unitId in unitResult) {
                if (releasedUnitResult[unitId]) {
                    unitResult[unitId].summon_type = releasedUnitResult[unitId].type;
                    units.push(unitResult[unitId]);
                }
            }
            onDataReady();
        });
    });
    getStaticData("data", true, function(result) {
        data = result;
        onDataReady();
        getStaticData("lastItemReleases", false, function(result) {
            lastItemReleases = result;
        });
    });


    $("#results").addClass(server);

    var $window = $(window);

    $window.on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !";
        }
        if (savePublicLinkNeeded) {
            savePublicLink();
        }
    });
    
    $window.on('keyup', function (e) {
        // Reset search if escape is used
        if (e.keyCode === 27) {
            $("#searchBox").val('').trigger('input').focus();
        }
    });
    
    var $unitsSidebar = $('.unitsSidebar');
    var $unitsSidebarInternal = $unitsSidebar.find('.unitsSidebarInternal');
    var sidebarFixedWidthLimit = 768;

    $window.on('scroll', $.debounce(50, function(){
        // Detect when user scroll, and fix the sidebar to be always accessible
        if ($(this).scrollTop() > $unitsSidebar.offset().top && $window.outerWidth() > sidebarFixedWidthLimit) {
            if (!$unitsSidebarInternal.hasClass('fixed')) {
                $unitsSidebarInternal.css('width', $unitsSidebar.outerWidth() + 'px');
                $unitsSidebarInternal.addClass('fixed');
            }
        } else { 
            if ($unitsSidebarInternal.hasClass('fixed')) {
                $unitsSidebarInternal.css('width', '');
                $unitsSidebarInternal.removeClass('fixed');
            }
        } 
    }));
    $window.on('resize', $.debounce(150, function(){
        if ($unitsSidebarInternal.hasClass('fixed') && $window.outerWidth() <= sidebarFixedWidthLimit) {
            $unitsSidebarInternal.css('width', '');
            $unitsSidebarInternal.removeClass('fixed');
        }
    }));
    $('.unitsSidebarButton').click(function() {
        $unitsSidebar.toggleClass('collapsed');
        if ($unitsSidebarInternal.hasClass('fixed')) {
            $unitsSidebarInternal.css('width', $unitsSidebar.outerWidth() + 'px');
        }
    });
    
    // Start stats collapse for small screen
    if ($window.outerWidth() < 990) {
        $unitsSidebar.addClass("collapsed");
    }

    $("#searchBox").on("input", $.debounce(300,updateResults));
    
    $('#modeToggle').bootstrapToggle({
        on: 'Simple <span class="collapsedHidden">Mode</span>',
        off: 'Edit <span class="collapsedHidden">Mode</span>',
        onstyle: "default",
        offstyle: "default"
    });
    $('#modeToggle').bootstrapToggle('on');
    $('#modeToggle').change(function() {
      $("#results").toggleClass("simpleMode");
    });
}
    
