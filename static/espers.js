var saveNeeded = false;

var saveTimeout;

var espers;
var ownedEspers;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#esper").removeClass("hidden");

    $(".nav-tabs li").removeClass("active");
    
    var nodes = $("#grid li .hexagon");
    nodes.removeClass("hp");
    nodes.removeClass("mp");
    nodes.removeClass("atk");
    nodes.removeClass("def");
    nodes.removeClass("mag");
    nodes.removeClass("spr");
    nodes.removeClass("ability");
    nodes.removeClass("resist");
    nodes.removeClass("killer");
    
    $(".line").remove();
    
    var grid = $("#grid");
    grid.removeClass("star1");
    grid.removeClass("star2");
    grid.removeClass("star3");
}

function show(esperName) {
    beforeShow();
    currentEsper = esperName;
    $(".nav-tabs li." + esperName).addClass("active");
    // filter, sort and display the results
    var esper;
    for (var index in espers) {
        if (espers[index].name == esperName) {
            esper = espers[index];
            break;
        }
    }
    if (esper) {
        showBoard(esper.name, esper.maxLevel);
    }
}

function showBoard(esperName, level) {
    var escapedName = escapeName(esperName);
    $("#grid li.0_0 .hexagon").html('<img class="esperCenterIcon" src=\"img/' + escapedName +'.png\"/>');
    $("#grid").addClass("star" + level);
    var board = esperBoards[esperName];
    var rootNode = $("#grid li.0_0 .hexagon");
    rootNode.addClass("selected");
    for (var index in board.nodes) {
        showNode(board.nodes[index], rootNode, level);
    }
}

function getCenterX(node) {
    var offset = node.offset();
    var width = node.width();
    return offset.left + width / 2;
}

function getCenterY(node) {
    var offset = node.offset();
    var height = node.height();
    return offset.top + height / 2;
}

function showNode(node, parentNodeHtml, level) {
    var posString = getPositionString(node.position[0], node.position[1]);
    var nodeHtml = $("#grid li." + posString + " .hexagon");
    for (var statIndex = 0; statIndex < baseStats.length; statIndex++) {
        if (node[baseStats[statIndex]]) {
            nodeHtml.html('<span class="iconHolder"></span><span class="text">' + baseStats[statIndex].toUpperCase() + ' + ' + node[baseStats[statIndex]] + '</span><span class="cost">' + node.cost + ' SP</span>');
            nodeHtml.addClass(baseStats[statIndex]);
            break;
        }
    }
    if (node.special) {
        var indexOfSemicolon = node.special[0].indexOf(":");
        nodeHtml.html('<span class="iconHolder">' + abilityIcon(node.special[0].substr(0,indexOfSemicolon)) + '</span><span class="text">' + abilityName(node.special[0].substr(0,indexOfSemicolon)) + '</span><span class="cost">' + node.cost + ' SP</span>');
        nodeHtml.addClass("ability");
    }
    if (node.resist) {
        nodeHtml.html('<span class="iconHolder"></span><span class="text">' + getResistHtml(node) + '</span><span class="cost">' + node.cost + ' SP</span>');
        nodeHtml.addClass("resist");
    }
    if (node.killers) {
        nodeHtml.html('<span class="iconHolder"></span><span class="text">' + getKillersHtml(node) + '</span><span class="cost">' + node.cost + ' SP</span>');
        nodeHtml.addClass("killer");
    }
    if (distance(node.position[0], node.position[1]) <= level + 1) {
        $('body').line(getCenterX(parentNodeHtml), getCenterY(parentNodeHtml), getCenterX(nodeHtml), getCenterY(nodeHtml));
    }
    for (var i= 0; i < node.children.length; i++) {
        showNode(node.children[i], nodeHtml, level);
    }
}

function abilityIcon(text) {
    return text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1);
        var token = vWithoutBrace.split("|");
        var result = "";
        if (token.length == 2) {
            result += "<img class='icon' src='/img/items/" + token[1] + "'></img>"
        }
        return result;
    });
};

function abilityName(text) {
    return text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1);
        var token = vWithoutBrace.split("|");
        return toLink(token[0]);
    });
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
function onMouseOverNode(x,y) {
    var path = findPathTo(x,y,esperBoards[currentEsper]);
    if (path) {
        for (var index = 0; index < path.length; index++) {
            var posString = getPositionString(path[index].position[0], path[index].position[1]);
            $("#grid li." + posString + " .hexagon").addClass("hover");
        }
    }
}

function onMouseOutNode() {
    $("#grid .hexagon.hover").removeClass("hover");
}

function findPathTo(x,y, fromNode, currentPath = []) {
    if (fromNode.nodes) {
        for (var index = 0; index < fromNode.nodes.length; index++) {
            var path = findPathTo(x, y, fromNode.nodes[index], currentPath);
            if (path) {
                return path;
            }
        }   
    } else {
        currentPath = currentPath.concat(fromNode);
        if (fromNode.position && fromNode.position[0] == x && fromNode.position[1] == y) {
            return currentPath;
        }
        if (fromNode.children.length == 0) {
            return null;
        }
        for (var index = 0; index < fromNode.children.length; index++) {
            var path = findPathTo(x, y, fromNode.children[index], currentPath);
            if (path) {
                return path;
            }
        }
        return null;
    }
}

function findPathToReccursively(x,y, currentPath = [], fromNode) {
    children
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
        var posString = getPositionString(x, y);
        boardHtml += '<li class="' + posString + '"><div class="hexagon ';
        var dist = distance(x, y);
        if (dist > 4) {
            boardHtml += " notUsed ";
        } else if (dist > 3) {
            boardHtml += " star3 ";
        } else if (dist > 2) {
            boardHtml += " star2 ";
        } else {
            boardHtml += " star1 ";
        }
        boardHtml += ' " onclick="selectNode(' + x + ',' + y + ')" onmouseover="onMouseOverNode(' + x + ',' + y + ')" onmouseout="onMouseOutNode()"></div></li>';
    }
    $("#grid").html(boardHtml);
    $("#espers #tabs").html(tabs);
    $("#espers").removeClass("hidden");
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    show(escapeName(espers[0].name));
}

function distance(x1, y1) {
    return (Math.abs(x1) + Math.abs(x1 - y1) + Math.abs(y1)) / 2;
}

function getPositionString(x, y) {
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
    return posString;
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
