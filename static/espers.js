var saveNeeded = false;

var saveTimeout;

var espers;
var ownedEspers;

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

function show(esperName) {
    beforeShow();
    currentEsper = esperName;
    $(".nav-tabs li." + esperName).addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortAlphabetically(filterName(units))));
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

function displayEspers() {
    var tabs = ""
    for (var index = 0; index < espers.length; index++) {
        var escapedName = espers[index].name.replace(" ", "_");
        tabs += "<li class=\"" + escapedName + "\" onclick=\"show('" + espers[index].name + "')\"><a><img src=\"img/" + escapedName +".png\"/></a></li>";
    }
    $("#espers #tabs").html(tabs);
    $("#espers").removeClass("hidden");
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
}


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


// will be called by jQuery at page load)
$(function() {

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(server + "/espers.json", function(result) {
        espers = result;
        $.get(server + "/espers", function(result) {
            ownedEspers = result;
            displayEspers();
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
});
