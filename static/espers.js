var saveNeeded = false;

var saveTimeout;

var espers;
var ownedEspers;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#esper").removeClass("hidden");

    $(".nav-tabs li").removeClass("active");
}

function show(esperName) {
    beforeShow();
    currentEsper = esperName;
    $(".nav-tabs li." + esperName).addClass("active");
    // filter, sort and display the results
    var esper;
    for (var index in espers) {
        if (escapeName(espers[index].name) == esperName) {
            esper = espers[index];
            break;
        }
    }
    if (esper) {
        $("#esper").html(getBoard(esper.name));
    }
}

function getBoard(esperName) {
    var html = "";
    var board = esperBoards[esperName];
    for (var index in board.nodes) {
        html += '<div class="skillLine">' + getNode(board.nodes[index]) + "</div>";
    }
    return html;
}

function getNode(node, depth = 0) {
    html = '<div class="skill">';
    for (var statIndex = 0; statIndex < baseStats.length; statIndex++) {
        if (node[baseStats[statIndex]]) {
            html += '<span class="stat">' + baseStats[statIndex] + ' + ' + node[baseStats[statIndex]] + '</span>';
        }
    }
    if (node.special) {
        var indexOfSemicolon = node.special[0].indexOf(":");
        html += '<span class="ability" title="' + node.special[0].substr(indexOfSemicolon + 1) + '">' + toHtml(node.special[0].substr(0,indexOfSemicolon)) + '</span>';
    }
    if (node.resist) {
        html += '<span class="resist">' +  getResistHtml(node) + '</span>';
    }
    html += '</div>'
    if (node.children.length > 0) {
        html += getNode(node.children[0], depth + 1)
    }
    for (var i= 1; i < node.children.length; i++) {
        html+= '</div><div class="skillLine">';
        for (var j= 0; j <= depth; j++) {
            html += '<div class="skill empty"></div>';
        }
        html += getNode(node.children[i], depth + 1);
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

function displayEspers() {
    var tabs = ""
    for (var index = 0; index < espers.length; index++) {
        var escapedName = escapeName(espers[index].name);
        tabs += "<li class=\"" + escapedName + "\" onclick=\"show('" + espers[index].name + "')\"><a><img src=\"img/" + escapedName +".png\"/></a></li>";
    }
    var boardHtml = "";
    for (var i = 0; i < 81; i++) {
        var y = Math.trunc(i/9) - 4;
        var x = i % 9 - 4;
        x = x + Math.round(y/2)
        var posString = "";
        if (x < 0) {
            posString += "m" + -x;
        } else {
            posString += x;
        }
        posString += "_"
        if (y < 0) {
            posString += "m" + -y;
        } else {
            posString += y;
        }
        boardHtml += '<li><div class="hexagon ' + posString + '">' + posString + " " + distance(x, y) + '</div></li>';
    }
    $("#grid").html(boardHtml);
    $("#espers #tabs").html(tabs);
    $("#espers").removeClass("hidden");
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    show(escapeName(espers[0].name));
}

function distance(x1, y1) {
    return (Math.abs(x1) + Math.abs(x1 + y1) + Math.abs(y1)) / 2;
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
            $.get(server + "/esperBoards.json", function(result) {
                esperBoards = result;
                displayEspers();
            });
        }, 'json');
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
