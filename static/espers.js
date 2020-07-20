var saveNeeded = false;

var saveTimeout;

var espers;
var ownedEspers;
var currentEsper;
var esperBoards;
var linkMode = false;

var gridContainer;

var logged = false;

const maxLevelByStar = {
    "1": 30,
    "2": 40,
    "3": 60
}

const maxStatLevelByStar = {
    "1": 30,
    "2": 40,
    "3": 100
}

const statsProgressionByTypeAndRarity = {
    "1": {
        "1": [0, 3, 7, 10, 14, 17, 21, 24, 28, 31, 35, 38, 42, 45, 49, 52, 55, 58, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 97, 100],
        "2": [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 100],
        "3": [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]
    },
    "2": {
        "1": [0, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 21, 24, 27, 30, 33, 37, 41, 45, 49, 54, 59, 64, 69, 75, 81, 87, 93, 100],
        "2": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 37, 40, 43, 46, 49, 52, 56, 60, 64, 68, 72, 77, 82, 88, 94, 100],
        "3": [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]
    }
}

const importIdConversion = {
    1: "Siren",
    2: "Ifrit",
    3: "Shiva",
    4: "Carbuncle",
    5: "Diabolos",
    6: "Golem",
    7: "Ramuh",
    8: "Titan",
    9: "Tetra Sylphid",
    10: "Odin",
    11: "Lakshmi",
    12: "Leviathan",
    13: "Alexander",
    14: "Phoenix",
    15: "Bahamut",
    16: "Fenrir",
    17: "Anima",
    18: "Asura",
    19: "Black Dragon"
};

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#esper").removeClass("hidden");
    $(".nav-tabs a").removeClass("active");
    $("#noEsperMessage").addClass('hidden');
}

function showAll() {
    beforeShow();
    $(".nav-tabs a.ALL").addClass("active");
    var $allEspers = $('#allEspers').show();
    $("#esper").hide();
    $("#toggleGrid").addClass('hidden');

    // Reset sorting cols to first one
    $('#allEspers table thead th').removeClass('active desc').first().addClass('active');

    if ($.isEmptyObject(ownedEspers)) {
        $("#noEsperMessage").removeClass('hidden');
        $("#noEsperMessage").removeClass('hidden');
        $allEspers.find(".panel").hide();
    } else {
        var html = "";
        for (var index in espers) {
            // Skip if esper not in owned object
            if (!ownedEspers[espers[index].name]) continue;

            var esper = ownedEspers[espers[index].name];
            var escapedName = escapeName(esper.name);
            var sp = calculateSp(esper.level, esper.rarity, esper.name);
            addStats(esper.level, esper.rarity, esper.name);

            html += '<tr data-esper="' + esper.name + '">';

            // First cell: image, name, points
            html += '<td width="1"><i class="rounded icon icon-lg esper-' + escapedName + '"></i></td>';
            html += '<td class="esperDesc index">';
            html += '  <div class="d-block name">' + esper.name + ' <span class="rarity">' + Array(esper.rarity+1).join("★") + '</span></div>';
            html += '  <div class="text-sm sp">' + sp.used + '<span class="text-muted mx-1">/</span>' + sp.available + '</div>';
            html += '</td>';

            html += '<td class="level" width="1">' + esper.level + '</td>';
            let killerHtml = getKillerHtml(esper.killers);

            // Next cells: stats
            html += '<td class="stats hp"><span class="bonus sortValue d-block">' + calculateStatBonus(esper.name, 'hp') + '</span><span class="text-sm">' + esper.hp + '</span></td>';
            html += '<td class="stats mp"><span class="bonus sortValue d-block">+' +calculateStatBonus(esper.name, 'mp') + '</span><span class="text-sm">'+ esper.mp +'</span></td>';
            html += '<td class="stats atk"><span class="bonus sortValue d-block">+' +calculateStatBonus(esper.name, 'atk') + '</span><span class="text-sm">'+ esper.atk +'</span></td>';
            html += '<td class="stats def"><span class="bonus sortValue d-block">+' +calculateStatBonus(esper.name, 'def') + '</span><span class="text-sm">'+ esper.def +'</span></td>';
            html += '<td class="stats mag"><span class="bonus sortValue d-block">+' +calculateStatBonus(esper.name, 'mag') + '</span><span class="text-sm">'+ esper.mag +'</span></td>';
            html += '<td class="stats spr"><span class="bonus sortValue d-block">+' +calculateStatBonus(esper.name, 'spr') + '</span><span class="text-sm">'+ esper.spr +'</span></td>';
            html += '<td><div class="d-flex flex-wrap">' + getResistHtml(esper) + killerHtml.physical +  killerHtml.magical + '</div></td></tr>';
        }

        $allEspers.find("table tbody").html(html);
        $allEspers.find(".panel").show();
    }

}

function show(esperName) {
    beforeShow();
    $('#allEspers').hide();
    $("#esper").show();
    $('#toggleGrid').removeClass('hidden');

    currentEsper = esperName;
    var escapedName = escapeName(esperName);
    $(".nav-tabs a").removeClass("active");
    $(".nav-tabs a." + escapedName).addClass("active");
    var esper;
    for (var index in espers) {
        if (espers[index].name == esperName) {
            esper = espers[index];
            break;
        }
    }
    if (esper) {
        var optionsHtml = "";
        if (logged) {
            optionsHtml += '<option value="notOwned">Not owned</option>';
        }
        for (var i = 1; i <= esper.maxLevel; i++) {
            optionsHtml += '<option value="' + i + '">' + i + ' ★</option>';
        }
        $("#esper #esperStar").html(optionsHtml);
        $("#esper #esperName").html(esperName);
        if (ownedEspers[esperName]) {
            $("#esper #esperStar option[value=" + ownedEspers[esperName].rarity + "]").prop('selected', true);
            setEsperLevel(ownedEspers[esperName].level);
            showBoard(esper.name, ownedEspers[esperName].rarity);
            $("#esper .levelLine").removeClass("hidden");
            $("#esper .spLine").removeClass("hidden");
            $("#esper .shareLink").removeClass("hidden");
            $(".stats").removeClass("invisible");
            $(".esperOtherStats").removeClass("invisible");
            let killers = getKillerHtml(ownedEspers[currentEsper].killers);
            $("#esperSkills").html(getResistHtml(ownedEspers[currentEsper]) + killers.physical + killers.magical);
        } else {
            $("#esper .levelLine").addClass("hidden");
            $("#esper .spLine").addClass("hidden");
            $("#esper .shareLink").addClass("hidden");
            $(".stats").addClass("invisible");
            $(".esperOtherStats").addClass("invisible");
            gridContainer.addClass("hidden");
        }
    }
}

function sortTableBy(colName)
{
    // Identify some useful elements
    var $th = $('#allEspers table thead th');
    var $tableBody = $('#allEspers table tbody');

    // Remove active sort
    $th.removeClass('active');

    // Add active sort, and toggle asc/desc
    var isDescending = $th.filter('.'+colName).toggleClass('desc').addClass('active').hasClass('desc');

    // Remove sorting on non active cols
    $th.not('.active').removeClass('desc');

    // Retrieve all table rows and values
    var rows = [];
    $tableBody.find('tr').each(function() {
        // Identify the column
        var $col = $(this).find('td.' + colName);
        if (colName === 'resists' || colName === 'killers') {
            // For these "special" column, simply count the number of specialValueItem
            value = $col.find('.specialValueItem').length;
        } else {
            // Try to find a sort value inside
            var $sortValue = $col.find('.sortValue');
            if ($sortValue.length > 0) {
                // A sort value is set, use it
                value = parseInt($sortValue.html().replace(/\D/g,''));
            } else {
                // For others values, parse all col content as int
                value = parseInt($col.html().replace(/\D/g,''));
            }
        }
        rows.push({
            html: this.outerHTML,
            value: value
        });
    });

    // Sort it!
    rows.sort(function(objA, objB) {
        if (objA.value > objB.value) return isDescending ? -1 : 1;
        if (objA.value < objB.value) return isDescending ? 1 : -1;
        return 0;
    });

    // Empty body and append each rows
    $tableBody.html('').append(function(){
        var html = '';
        $.each(rows, function(idx, row) {
            html += row.html;
        });
        return html;
    });
}

function findCurrentScale()
{
    var transformStr = gridContainer.css('transform');
    if (!transformStr) return 1;
    var transformMatrix = transformStr.replace(/matrix\(/i, "").replace(")", "").split(',');
    if (!transformMatrix.length) return 1;
    var scale = parseFloat(transformMatrix[0]);
    if (!scale) return 1;
    console.log('Found scale ' + scale);
    return scale;
}

function showBoard(esperName, star) {
    var nodes = $("#grid li .hexagon");
    nodes.removeClass("hp mp atk def mag spr ability resist killer selected");
    $(".line").remove();

    $("#grid,#gridTrimmer").removeClass("star1 star2 star3");
    gridContainer.removeClass("hidden");

    var escapedName = escapeName(esperName);
    $("#grid li.0_0 .hexagon").html('<i class="esperCenterIcon icon esper-' + escapedName +'"></i>');
    $("#grid,#gridTrimmer").addClass("star" + star);
    var board = esperBoards[esperName];
    var rootNode = $("#grid li.0_0 .hexagon");
    rootNode.addClass("selected");
    var scale = findCurrentScale();
    for (var index in board.nodes) {
        showNode(board.nodes[index], rootNode, star, scale);
    }
}

function setEsperLevel(level) {
    $("#level").val(level);
    ownedEspers[currentEsper].level = level;
    updateSp();
    updateStats();
}

function updateSp() {
    var level = parseInt($("#level").val());
    var star = parseInt($("#esperStar").val());

    var sp = calculateSp(level, star, currentEsper);

    $(".spUsed").text(sp.used + " / " + sp.available);
    if (sp.used > sp.available) {
        $(".spUsed").addClass("error");
    } else {
        $(".spUsed").removeClass("error");
    }
}

function updateStats() {
    var level = parseInt($("#level").val());
    var star = parseInt($("#esperStar").val());

    // Update esper stats
    addStats(level, star, currentEsper);

    // Print all stats, with bonus
    for (var index = 0; index < baseStats.length; index++) {
        var baseStat = baseStats[index];
        var bonusValue = calculateStatBonus(currentEsper, baseStat);
        $("#esper_" + baseStat).html(
            Math.round(ownedEspers[currentEsper][baseStat]) + "&nbsp;"+
            "<span class='statsBonus' title='Gives a bonus of +"+bonusValue+" "+ baseStat.toUpperCase() +" to unit equipped with this Esper'>"+
            "(+" + bonusValue + ")" +
            "</span>");
    }
}

function addStats(level, star, esperName) {
    var board = esperBoards[esperName];
    var ownedEsper = ownedEspers[esperName];
    var index;

    for (index = 0; index < baseStats.length; index++) {
        var minStat = board.stats[star][baseStats[index].toUpperCase()][0];
        var maxStatGain = board.stats[star][baseStats[index].toUpperCase()][1] - minStat;

        ownedEsper[baseStats[index]] = Math.round(minStat + maxStatGain * statsProgressionByTypeAndRarity[board.statPattern[star]][star][level - 1]/100);
    }

    for (index in board.nodes) {
        addStatsOfSelectedNodes(board.nodes[index], ownedEsper);
    }
}

function calculateStatBonus(esperName, baseStat) {
    var ownedEsper = ownedEspers[esperName];
    var statBonusCoef = 1;
    if (ownedEsper.esperStatsBonus && ownedEsper.esperStatsBonus.all[baseStat]) {
        statBonusCoef += ownedEsper.esperStatsBonus.all[baseStat] / 100;
    }
    return Math.floor(ownedEsper[baseStat] * statBonusCoef / 100);
}

function addStatsOfSelectedNodes(node, ownedEsper) {
    var posString = getEsperBoardPositionString(node.position[0], node.position[1]);
    if (ownedEsper.selectedSkills.includes(posString)) {
        for (var index = 0; index < baseStats.length; index++) {
            if (node[baseStats[index]]) {
                ownedEsper[baseStats[index]] += node[baseStats[index]];
            }
        }
        for (var index = 0; index < node.children.length; index++) {
            addStatsOfSelectedNodes(node.children[index], ownedEsper);
        }
    }
}

function calculateSp(level, star, esperName)
{
    var progression;
    var availableSP = 0;
    var usedSp = 0;
    var board = esperBoards[esperName];
    var selectedSkills = ownedEspers[esperName].selectedSkills;

    for (var i = 1; i < star; i++) {
        progression = board.progression[i.toString()];
        for (var j = 0; j < progression.length; j++) {
            availableSP += progression[j];
        }
    }

    progression = board.progression[star];
    for (i = 0; i < level; i++) {
        availableSP += progression[i];
    }

    for (var index in board.nodes) {
        usedSp += calculateUsedSpNode(board.nodes[index], selectedSkills);
    }

    return {
        used: usedSp,
        available: availableSP
    };
}

function calculateUsedSpNode(node, skills) {
    var cost = 0;
    var posString = getEsperBoardPositionString(node.position[0], node.position[1]);
    if (skills.includes(posString)) {
        cost += node.cost;
        for(var i = 0; i < node.children.length; i++) {
            cost += calculateUsedSpNode(node.children[i], skills);
        }
    }
    return cost;
}

function getCenterX(node, scale=1) {
    var offset = node.offset();
    var width = node.width();
    return (offset.left - gridContainer.offset().left + width / 2) / scale;
}

function getCenterY(node, scale=1) {
    var offset = node.offset();
    var height = node.height();
    return (offset.top - gridContainer.offset().top + height / 2) / scale;
}

function showNode(node, parentNodeHtml, star, scale=1) {
    var posString = getEsperBoardPositionString(node.position[0], node.position[1]);
    var nodeHtml = $("#grid li." + posString + " .hexagon");
    for (var statIndex = 0; statIndex < baseStats.length; statIndex++) {
        if (node[baseStats[statIndex]]) {
            nodeHtml.html('<span class="iconHolder"></span><span class="text">' + baseStats[statIndex].toUpperCase() + ' + ' + node[baseStats[statIndex]] + '</span><span class="cost">' + node.cost + ' SP</span>');
            nodeHtml.addClass(baseStats[statIndex]);
            break;
        }
        if (node[percentValues[baseStats[statIndex]]]) {
            nodeHtml.html('<span class="iconHolder"><img src="/assets/game/items/ability_77.png"></span><span class="text">' + baseStats[statIndex].toUpperCase() + ' + ' + node[percentValues[baseStats[statIndex]]] + '%</span><span class="cost">' + node.cost + ' SP</span>');
            nodeHtml.addClass(baseStats[statIndex]);
            break;
        }
    }
    if (node.special) {
        var indexOfBracket = node.special[0].indexOf("[");
        var indexOfSemicolon = node.special[0].indexOf(":");
        var ability = node.special[0].substr(indexOfBracket,indexOfSemicolon);
        nodeHtml.html('<span class="iconHolder">' + abilityIcon(ability) + '</span><span class="text">' + abilityName(ability) + '</span><span class="cost">' + node.cost + ' SP</span>');
        nodeHtml.addClass("ability");
    }
    if (node.resist) {
        nodeHtml.html('<span class="iconHolder"></span><span class="text">' + getResistHtml(node) + '</span><span class="cost">' + node.cost + ' SP</span>');
        nodeHtml.addClass("resist");
    }
    if (node.killers) {
        var killer = node.killers[0];
        var html = '<span class="iconHolder">';
        let killers = getKillerHtml(node.killers);
        html += killers.physical + killers.magical;
        html+='</span><span class="cost">' + node.cost + ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("killer");
    }
    if (node.esperStatsBonus) {
        var html = '<span class="iconHolder"><img src="/assets/game/items/ability_77.png"></span><span class="text">ST Reflection Boost<a href="http://exvius.gamepedia.com/ST_Reflection_Boost" target="_blank" rel="noreferrer"><span class="fa fa-external-link-alt wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.lbPerTurn) {
        var html = '<span class="iconHolder"><img src="/assets/game/items/ability_91.png"></span><span class="text">+' + node.lbPerTurn.min + ' LS/turn<a href="http://exvius.gamepedia.com/Auto-Limit" target="_blank" rel="noreferrer"><span class="fa fa-external-link-alt wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.lbFillRate) {
        var html = '<span class="iconHolder"><img src="/assets/game/items/ability_78.png"></span><span class="text">+' + node.lbFillRate + '% LB fill rate</span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.lbDamage) {
        var html = '<span class="iconHolder"><img src="/assets/game/items/ability_78.png"></span><span class="text">+' + node.lbDamage + '% LB damage</span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.evade && node.evade.physical) {
        var html = '<span class="iconHolder"><img src="/assets/game/items/ability_97.png"></span><span class="text">' + node.evade.physical + '% physical evasion<a href="http://exvius.gamepedia.com/Air_Step" target="_blank" rel="noreferrer"><span class="fa fa-external-link-alt wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.evade && node.evade.magical) {
        var html = '<span class="iconHolder"><img src="/assets/game/items/ability_97.png"></span><span class="text">' + node.evade.magical + '% magical evasion<a href="http://exvius.gamepedia.com/Air_Wall" target="_blank" rel="noreferrer"><span class="fa fa-external-link-alt wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }

    if (node.conditional) {
        var html = '';
        node.conditional.forEach(c => {
            if (c.equipedCondition && typeList.includes(c.equipedCondition)) {
               html += '<span class="iconHolder"><img src="/assets/game/items/' + c.icon + '"></span><span class="text">'
               let first = true;
               baseStats.filter(s => c[s+'%']).forEach(s => {
                   if (first) {
                       first = false;
                   } else {
                       html += ', ';
                   }
                   html+= s.toUpperCase() + '+' + c[s+'%'] + '%';
               });
               html += ' if <i class="img img-equipment-' + c.equipedCondition + '"></i></span>';
            }
        });
        html += '<span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (ownedEspers[currentEsper].selectedSkills.includes(posString)) {
        nodeHtml.addClass("selected");
    }
    if (distance(node.position[0], node.position[1]) <= star + 1) {
        gridContainer.line(getCenterX(parentNodeHtml, scale), getCenterY(parentNodeHtml, scale), getCenterX(nodeHtml, scale), getCenterY(nodeHtml, scale));
    }
    for (var i= 0; i < node.children.length; i++) {
        showNode(node.children[i], nodeHtml, star, scale);
    }
}

function abilityIcon(text) {
    return text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1);
        var token = vWithoutBrace.split("|");
        var result = "";
        if (token.length >= 2) {
            result += "<img class='icon' src='/assets/game/items/" + token[token.length - 1] + "'>"
        }
        return result;
    });
};

function abilityName(text) {
    return text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1);
        var token = vWithoutBrace.split("|");
        if (token.length == 3) {
            return toLink(token[1], token[0]);
        } else {
            return toLink(token[0]);
        }
    });
}

function prepareSave() {
    if (logged && !linkMode) {
        saveNeeded = true;
        if (saveTimeout) {clearTimeout(saveTimeout)}
        saveTimeout = setTimeout(saveUserData,3000, false, false, true);
        $(".saveInventory").removeClass("hidden");
    }
}

function selectNode(x,y) {
    var posString = getEsperBoardPositionString(x, y);
    var path = findPathTo(x,y,esperBoards[currentEsper]);
    if (ownedEspers[currentEsper].selectedSkills.includes(posString)) {
        var node = path[path.length - 1];
        unselectNodeAndChildren(ownedEspers[currentEsper], node);
    } else {
        if (path) {
            for (var index = 0; index < path.length; index++) {
                var posString = getEsperBoardPositionString(path[index].position[0], path[index].position[1]);
                if (!ownedEspers[currentEsper].selectedSkills.includes(posString)) {
                    ownedEspers[currentEsper].selectedSkills.push(posString);
                    addNodeStatToEsper(ownedEspers[currentEsper], path[index]);
                    $("#grid li." + posString + " .hexagon").addClass("selected");
                }
            }
        }
    }
    updateSp();
    updateStats();
    let killers = getKillerHtml(ownedEspers[currentEsper].killers)
    $("#esperSkills").html(getResistHtml(ownedEspers[currentEsper]) + killers.physical + killers.magical);
    prepareSave();
}

function addNodeStatToEsper(esper, node) {
    if (node.killers) {
        addKillers(esper, node.killers);
    }
    if (node.resist) {
        addElementalResist(esper, node.resist);
    }
    if (node.esperStatsBonus) {
        addEsperStatsBonus(esper, node.esperStatsBonus);
    }
    if (node.lbPerTurn) {
        esper.lbPerTurn = node.lbPerTurn;
    }
    if (node.lbFillRate) {
        esper.lbFillRate = node.lbFillRate;
    }
    if (node.lbDamage) {
        esper.lbDamage = node.lbDamage;
    }
    if (node.evade && node.evade.physical) {
        if (!esper.evade) {esper.evade = {};}
        esper.evade.physical = node.evade.physical;
    }
    if (node.evade && node.evade.magical) {
        if (!esper.evade) {esper.evade = {};}
        esper.evade.magical = node.evade.magical;
    }
    if (node.conditional) {
        addContional(esper, node.conditional);
    }
    for (var i = baseStats.length; i--;) {
        if (node[percentValues[baseStats[i]]]) {
            addToStat(esper, percentValues[baseStats[i]], node[percentValues[baseStats[i]]]);
        }
    }
}

function unselectNodeAndChildren(esper, node) {
    var posString = getEsperBoardPositionString(node.position[0], node.position[1]);
    var index = ownedEspers[currentEsper].selectedSkills.indexOf(posString)
    if (index >= 0) {
        ownedEspers[currentEsper].selectedSkills.splice(index, 1);
        $("#grid li." + posString + " .hexagon").removeClass("selected");
        if (node.killers) {
            removeKillers(ownedEspers[currentEsper], node.killers);
        }
        if (node.resist) {
            removeElementalResist(ownedEspers[currentEsper], node.resist);
        }
        if (node.esperStatsBonus) {
            removeEsperStatsBonus(ownedEspers[currentEsper], node.esperStatsBonus);
        }
        if (node.lbPerTurn) {
            delete esper.lbPerTurn;
        }
        if (node.lbFillRate) {
            delete esper.lbFillRate;
        }
        if (node.lbDamage) {
            delete esper.lbDamage;
        }
        if (node.evade && node.evade.physical && esper.evade && esper.evade.physical) {
            delete esper.evade.physical;
        }
        if (node.evade && node.evade.magical && esper.evade && esper.evade.magical) {
            delete esper.evade.magical;
        }
        if (node.evade && !node.evade.physical && !node.evade.magical) {
            delete esper.evade;
        }
        if (node.conditional) {
            removeContional(esper, node.conditional);
        }
        for (var i = baseStats.length; i--;) {
            if (node[percentValues[baseStats[i]]]) {
                removeFromStat(ownedEspers[currentEsper], percentValues[baseStats[i]], node[percentValues[baseStats[i]]]);
            }
        }
        for (var i = 0; i < node.children.length; i++) {
            unselectNodeAndChildren(esper, node.children[i]);
        }
    }
}


function addKillers(esper, killers) {
    for (var i = 0; i < killers.length; i++) {
        addKiller(esper, killers[i].name, killers[i].physical, killers[i].magical);
    }
}
function addKiller(esper, race, physicalPercent, magicalPercent) {
    if (!esper.killers) {
        esper.killers = [];
    }
    var killerData;
    for (var index in esper.killers) {
        if (esper.killers[index].name == race) {
            killerData = esper.killers[index];
            break;
        }
    }

    if (!killerData) {
        killerData = {"name":race};
        esper.killers.push(killerData);
    }
    if (physicalPercent) {
        if (killerData.physical) {
            killerData.physical += physicalPercent;
        } else {
            killerData.physical = physicalPercent;
        }
    }
    if (magicalPercent) {
        if (killerData.magical) {
            killerData.magical += magicalPercent;
        } else {
            killerData.magical = magicalPercent;
        }
    }
}
function removeKillers(esper, killers) {
    for (var i = 0; i < killers.length; i++) {
        for (var index in esper.killers) {
            if (esper.killers[index].name == killers[i].name) {
                if (killers[i].physical) {
                    esper.killers[index].physical -= killers[i].physical;
                    if (esper.killers[index].physical == 0) {
                        delete esper.killers[index].physical
                    }
                }
                if (killers[i].magical) {
                    esper.killers[index].magical -= killers[i].magical;
                    if (esper.killers[index].magical == 0) {
                        delete esper.killers[index].magical
                    }
                }
                if (!esper.killers[index].physical && !esper.killers[index].magical) {
                    esper.killers.splice(index, 1);
                }
                break;
            }
        }
    }
    if (esper.killers.length == 0) {
        delete esper.killers;
    }
}


function addElementalResist(item, resist) {
    for (var i = 0; i < resist.length; i++) {
        if (!item.resist) {
            item.resist = [];
        }
        var existingResist;
        for (var j = 0; j < item.resist.length; j++) {
            if (item.resist[j].name == resist[i].name) {
                existingResist = item.resist[j];
                break;
            }
        }
        if (!existingResist) {
            item.resist.push(JSON.parse(JSON.stringify(resist[i])));
        } else {
            existingResist.percent += resist[i].percent;
        }
    }
}
function removeElementalResist(item, resist) {
    for (var i = 0; i < resist.length; i++) {
        for (var j = 0; j < item.resist.length; j++) {
            if (item.resist[j].name == resist[i].name) {
                item.resist[j].percent -= resist[i].percent;
                if (item.resist[j].percent == 0) {
                    item.resist.splice(j,1);
                }
                break;
            }
        }
    }
    if (item.resist.length == 0) {
        delete item.resist;
    }
}

function addEsperStatsBonus(item, bonus) {
    if (!item.esperStatsBonus) {
        item.esperStatsBonus = {"all":{"hp":0, "mp":0, "atk":0, "def":0, "mag":0, "spr":0}};
    }
    for (var i = 0; i < baseStats.length; i++) {
        item.esperStatsBonus.all[baseStats[i]] += bonus[baseStats[i]];
    }
}
function removeEsperStatsBonus(item, bonus) {
    for (var i = 0; i < baseStats.length; i++) {
        item.esperStatsBonus.all[baseStats[i]] -= bonus[baseStats[i]];
    }
    if (item.esperStatsBonus.all.hp == 0 && item.esperStatsBonus.all.mp == 0 && item.esperStatsBonus.all.atk == 0 &&
        item.esperStatsBonus.all.def == 0 && item.esperStatsBonus.all.mag == 0 && item.esperStatsBonus.all.spr == 0)
    {
        delete item.esperStatsBonus;
    }
}

function addToStat(esper, stat, value) {
    if (!esper[stat]) {
        esper[stat] = 0;
    }
    esper[stat] += value;
}
function removeFromStat(esper, stat, value) {
    esper[stat] -= value;
    if (esper[stat] == 0) {
        delete esper[stat];
    }
}

function addContional(esper, conditionals) {
    if (!esper.conditional) {
        esper.conditional = [];
    }
    conditionals.forEach(c => esper.conditional.push(c));
}

function removeContional(esper, conditionals) {
    if (esper.conditional) {
        conditionals.forEach(cNode => {
            esper.conditional.forEach((cEsper, index) => {
                if (cNode.equipedCondition == cEsper.equipedCondition) {
                    esper.conditional.splice(index, 1);
                }
            })
        })
        if (esper.conditional.length == 0) {
            delete esper.conditional
        }
    }

}

function onMouseOverNode(x,y) {
    var path = findPathTo(x,y,esperBoards[currentEsper]);
    if (path) {
        for (var index = 0; index < path.length; index++) {
            var posString = getEsperBoardPositionString(path[index].position[0], path[index].position[1]);
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

function displayEspers() {
    console.log("Entering displayEspers function. logged : " + logged + ", linkMode : " + linkMode + ", ownedEspers : " + Object.keys(ownedEspers).length)
    if (!logged && !linkMode) {
        ownedEspers = {};
        for (var index in espers) {
            ownedEspers[espers[index].name] = {
                "name":espers[index].name,
                "id":espers[index].id,
                "rarity":espers[index].maxLevel,
                "level": maxLevelByStar[espers[index].maxLevel],
                "selectedSkills":[],
                "resist":JSON.parse(JSON.stringify(esperBoards[espers[index].name].resist[espers[index].maxLevel]))};
        }
    }
    if (linkMode) {
        // init esper from link mode

        if (typeof ownedEspers === "string") {
            var esper = espers.find(esper => esper.id.toUpperCase() == ownedEspers.replace("_", " ").toUpperCase());
            if (esper) {
                ownedEspers = {};
                ownedEspers[esper.name] = JSON.parse(JSON.stringify(esper));
                ownedEspers[esper.name].rarity = esper.maxLevel;
                ownedEspers[esper.name].level = maxLevelByStar[ownedEspers[esper.name].rarity]
                ownedEspers[esper.name].selectedSkills = [];
            } else {
            }
        }

        var esperName = Object.keys(ownedEspers)[0];
        ownedEspers[esperName].resist = JSON.parse(JSON.stringify(esperBoards[esperName].resist[ownedEspers[esperName].rarity]));
        for (var i = 0, len = ownedEspers[esperName].selectedSkills.length; i < len; i++) {
            var pos = getPositionFromString(ownedEspers[esperName].selectedSkills[i]);
            var path = findPathTo(pos.x,pos.y,esperBoards[esperName]);
            if (path) {
                addNodeStatToEsper(ownedEspers[esperName], path[path.length - 1]);
            }
        }
    }

    if (!linkMode) {
        var tabs = "";

        tabs += '<li class="nav-item"><a class="nav-link active ALL" data-esper="ALL" title="Stats on All Espers"><i class="icon icon-sm esper-ALL"></i></a></li>';
        for (var index = 0; index < espers.length; index++) {
            var escapedName = escapeName(espers[index].name);
            console.log(escapedName);
            var owned = ownedEspers[espers[index].name] ? true : false;

            tabs += '<li class="nav-item">';
            tabs += '  <a class="nav-link esper ' + escapedName + ' ' + (!owned ? "notOwned" : "") + '" data-esper="' + espers[index].name + '" title="' + espers[index].name + (owned ? " (owned)" : " (not owned)") + '">';
            tabs += '    <i class="rounded icon icon-sm esper-' + escapedName + '"></i>';
            tabs += '  </a>';
            tabs += '</li>';

        }
        $("#espers #tabs").html(tabs);
    }
    var boardHtml = "";
    for (var i = 0; i < 81; i++) {
        var y = Math.trunc(i/9) - 4;
        var x = i % 9 - 4;
        x = x + Math.round(y/2)
        var posString = getEsperBoardPositionString(x, y);
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

    $("#espers").removeClass("hidden");
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    if (!logged && !linkMode) {
        $("#notLoginWarningMessage").removeClass("hidden");
    }

    if (linkMode) {
        show(Object.keys(ownedEspers)[0]);
    } else {
        showAll();
    }

}

function distance(x1, y1) {
    return (Math.abs(x1) + Math.abs(x1 - y1) + Math.abs(y1)) / 2;
}

function getPositionFromString(posString) {
    var result = {};
    var tokens = posString.split("_");
    if (tokens[0].startsWith("m")) {
        result.x = - Number.parseInt(tokens[0].substr(1));
    } else {
        result.x = Number.parseInt(tokens[0]);
    }
    if (tokens[1].startsWith("m")) {
        result.y = - Number.parseInt(tokens[1].substr(1));
    } else {
        result.y = Number.parseInt(tokens[1]);
    }
    return result;
}

function loadLink() {
    if (window.location.hash.length > 1) {
        console.log("Loading esper link");
        var hashValue = window.location.hash.substr(1);

        if (decodeURI(hashValue).includes('|')) {
            let tokens = decodeURI(hashValue).split('|');
            let esperName = tokens[0].replace('_', ' ');
            let rarity = parseInt(tokens[1]);
            let level = parseInt(tokens[2]);
            let board = tokens[3];
            let esper = espers.find(esper => esper.id.toUpperCase() == esperName.toUpperCase());
            if (esper) {
                ownedEspers = {};
                ownedEspers[esperName] = JSON.parse(JSON.stringify(esper));
                ownedEspers[esperName].rarity = rarity;
                ownedEspers[esperName].level = level;
                ownedEspers[esperName].selectedSkills = [];
                let binary = hex2bin(board);
                [...binary].forEach((char, index) => {
                    if (char == '1') {
                        let coordinate = importBoardConversion[index];
                        if (coordinate) {
                            let positionString = getEsperBoardPositionString(coordinate[0], coordinate[1]);
                            ownedEspers[esperName].selectedSkills.push(positionString);
                        }
                    }
                });
                ownedEspers[esperName].board = board;
            }
        } else {
            try {
                ownedEspers = JSON.parse(atob(hashValue));
            } catch (e) {
                ownedEspers = hashValue;
            }
        }

        $('.navbar').addClass("hidden");
        $("#header").addClass("hidden");
        linkMode = true;
        console.log("finished Loading esper link");
    }
}

function onLevelChange() {
    var star = $("#esperStar").val();
    var level = parseInt($("#level").val());
    if (level < 1) {
        $("#level").val("1");
        setEsperLevel(1);
    } else if (level > maxLevelByStar[star]) {
        $("#level").val(maxLevelByStar[value]);
        setEsperLevel(maxLevelByStar[value]);
    } else {
        setEsperLevel(level);
    }
    prepareSave();
}

function getPublicEsperLink() {
    Modal.showWithBuildLink("Esper build", getEsperLink(ownedEspers[currentEsper]));

}

function importEsper(esperName, rarity, level, board) {
    currentEsper = esperName;
    show(esperName);
    setEsperRarity(rarity);
    setEsperLevel(level);
    let binary = hex2bin(board);
    [...binary].forEach((char, index) => {
        let coordinate = importBoardConversion[index];
        if (coordinate) {
            let positionString = getEsperBoardPositionString(coordinate[0], coordinate[1]);
            if (char == '1' && !ownedEspers[currentEsper].selectedSkills.includes(positionString)) {
                selectNode(coordinate[0], coordinate[1]);
            }
        }
    });
}

function importEspers() {
  var bodyHTML  = '<div class="alert alert-info">This feature is a Work in Progress. It will override your esper collection on FFBE Equip!</div>';
      bodyHTML += '<div class="custom-file mt-3 mb-2">';
      bodyHTML += '  <input type="file" id="importFile" class="custom-file-input" name="importFile" onchange="treatImportFile"/>';
      bodyHTML += '  <label class="custom-file-label" for="importFile">Choose file</label>';
      bodyHTML += '</div>';
      bodyHTML += '<div class="ffbe_content--well p-3 rounded border text-sm" id="importSummary"><a href="https://www.reddit.com/r/FFBraveExvius/comments/dd8ljd/ffbe_sync_is_back/">Instructions to import your data directly from the game</a> (requires login to FFBE with Facebook or Google)</div>';

    importedEspers = null;
    Modal.show({
        title: "Import espers",
        body: bodyHTML,
        buttons: [{
            text: "Import",
            onClick: function() {
                if (importedEspers) {
                    $('.glassPanel').removeClass("hidden");

                    setTimeout(function() {
                        ownedEspers = {};
                        $("#tabs a.esper").addClass("notOwned");
                        importedEspers.forEach(esperData => {
                            importEsper(importIdConversion[esperData.id], parseInt(esperData.rarity), parseInt(esperData.level), esperData.board);
                        });
                        showAll();
                        saveUserData(false, false, true);
                        $('.glassPanel').addClass("hidden");
                    }, 200);
                } else {
                    Modal.show("Please select a file to import");
                }

            }
        }]
    });
    $('#importFile').change(treatImportFile);
}

let importedEspers = null;

function treatImportFile(evt) {
    var f = evt.target.files[0]; // FileList object

    var reader = new FileReader();

    reader.onload = function(){
        try {
            let temporaryResult = JSON.parse(reader.result);
            var errors = importValidator.validate('espers', temporaryResult);

            // validation was successful
            if (errors) {
                Modal.showMessage("imported file doesn't have the correct form : " + JSON.stringify(errors));
                return;
            }
            importedEspers = temporaryResult;
            $('#importSummary').text('Espers to import : ' + importedEspers.length);
        } catch(e) {
            Modal.showError('imported file is not in json format', e);
        }

    };
    reader.readAsText(f);

}

function setEsperRarity(rarity) {
    $("#esper .levelLine").removeClass("hidden");
    $("#esper .spLine").removeClass("hidden");
    ownedEspers[currentEsper] = {"name":currentEsper, "id":currentEsper, "rarity":rarity,"selectedSkills":[]};
    ownedEspers[currentEsper].resist = JSON.parse(JSON.stringify(esperBoards[currentEsper].resist[rarity]));
    $("#esperResist").html(getResistHtml(ownedEspers[currentEsper]));
    let killerHtml = getKillerHtml(ownedEspers[currentEsper].killers);
    $("#esperSkills").html('<div>' + killerHtml.physical + '</div><div>' + killerHtml.magical + '</div>');
    $("#esperStar").val(rarity);
    setEsperLevel(maxLevelByStar[rarity]);
    showBoard(currentEsper, rarity);
    $(".stats").removeClass("invisible");
    $(".esperOtherStats").removeClass("invisible");
    $("#tabs a."+currentEsper).removeClass("notOwned");
    $("#esper .shareLink").removeClass("hidden");
}

function inventoryLoaded() {
    console.log("entering inventoryLoaded function");
    console.trace();
    logged = true;
    if (esperBoards) {
        $('#importLink').removeClass('hidden');
        displayEspers();
    }
    console.log("exiting inventoryLoaded function");
}

function notLoaded() {
    console.log("entering notLoaded function");
    console.trace();
    ownedEspers = {};

    if (esperBoards) {
        loadLink();
        displayEspers();
    }
    $("#pleaseWaitMessage").addClass("hidden");
    if (!linkMode) {
        $("#loginMessage").removeClass("hidden");
    }
    $("#inventory").addClass("hidden");
    console.log("exiting notLoaded function");
}

// will be called by common.js at page load
function startPage() {
    var $window = $(window);
    gridContainer = $("#gridContainer");

    if (window.location.hash.length > 1) {
        $("#pleaseWaitMessage").addClass("hidden");
        $("#loginMessage").addClass("hidden");
    }

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("espers", false, function(result) {
        espers = result;
        getStaticData("esperBoards", false, function(result) {
            esperBoards = result;
            if (ownedEspers) {
                loadLink();
                displayEspers();
            }
        });
    });

    $("#results").addClass(server);

    $window.on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !";
        }
    });

    $("#esper #esperStar").change(function () {
        var value = $("#esper #esperStar").val();
        if (value == "notOwned") {
            $("#esper .levelLine").addClass("hidden");
            $("#esper .spLine").addClass("hidden");
            delete ownedEspers[currentEsper];
            gridContainer.addClass("hidden");
            $(".stats").addClass("invisible");
            $(".esperOtherStats").addClass("invisible");
            $("#tabs a."+currentEsper).addClass("notOwned");
            $("#esper .shareLink").addClass("hidden");
        } else {
            setEsperRarity(parseInt(value));
        }
        prepareSave();
    });

    $("#esper #level").on("input", $.debounce(300, onLevelChange));

    var setCurrentScrollToCenter = function($pan) {
        var scale = findCurrentScale();
        var $centerIcon = $pan.find('#gridContainer li.0_0');
        var centerIconOffsetRel = $centerIcon.position();
        var centerIconHeight = $centerIcon.outerHeight() / scale;
        var centerIconWidth = $centerIcon.outerWidth() / scale;
        var panHeight = $pan.outerHeight();
        var WindowWidth = $window.outerWidth();

        var originTop = centerIconOffsetRel.top / scale + parseInt(gridContainer.css('marginTop'), 10) + centerIconHeight / 2;
        var originLeft = centerIconOffsetRel.left / scale + parseInt(gridContainer.css('marginLeft'), 10) + centerIconWidth / 2;

        currentScrollTop = Math.abs((panHeight / 2) - originTop);
        currentScrollLeft = Math.abs((WindowWidth / 2) - originLeft);
    };

    /* Grid show toggle */
    var currentScrollTop = null;
    var currentScrollLeft = null;
    $('#toggleGrid').on('click', function() {
        if ($('#esperStar').val() === 'notOwned') {
            $('#esperStar').focus();
        } else {
            var $esper = $('#esper');
            var $pan = $esper.find('#panWrapper');

            if ($esper.hasClass('viewingTrainingGrid')) {
                currentScrollTop = $pan.scrollTop();
                currentScrollLeft = $pan.scrollLeft();
                $('#spFixed').hide();
                $('.tabsWrapper').show();
            } else {
                $('#spFixed').show();
                $('.tabsWrapper').hide();
            }

            // Define height with remaining space
            $pan.height($window.outerHeight() - $esper.offset().top - 15);

            if (currentScrollTop === null || currentScrollLeft === null) {
                setCurrentScrollToCenter($pan);
            }

            $esper.toggleClass('viewingTrainingGrid');

            $pan.scrollTop(currentScrollTop);
            $pan.scrollLeft(currentScrollLeft);

            // Change icon
            $(this).find('span').toggleClass('hidden');
        }
    });

    /* Tabs esper selection */
    $("#espers #tabs").on('click', 'a[data-esper]', function(e) {
        var $elem = $(this);
        var esperName = $elem.attr('data-esper');
        var $esper = $('#esper');
        var $pan = $esper.find('#panWrapper');
        $window.scrollTop(0);
        $pan.scrollTop(0);
        $pan.scrollLeft(0);

        // Reset toggle if needed
        if ($esper.hasClass('viewingTrainingGrid')) {
            $('#toggleGrid').click();
        }

        if (esperName === "ALL") {
            showAll();
        } else {
            show(esperName);
        }

        setTimeout(function() { setCurrentScrollToCenter($pan); }, 0);
    });

    /* Esper selection in table */
    $("#allEspers table.allEspers").on('click', '.esperDesc', function(e) {
        var $tr = $(e.target).parents('tr[data-esper]');
        var esperName = $tr.attr('data-esper');
        var $tab = $("#espers #tabs").find("[data-esper=\""+esperName+"\"]");
        var tabScrollLeftPos = $tab.position().left - $window.outerWidth() / 2 + 30;
        // Scroll
        $("#espers #tabs").scrollLeft(tabScrollLeftPos);
        // Simulate click
        $tab.find("a").click();
    });

    $window.on('scroll', $.debounce(50, function(){
        if (!$('#esper').hasClass('viewingTrainingGrid')) {
            if ($(this).scrollTop() > $('#sp').offset().top) {
                $('#spFixed').fadeIn();
            } else {
                $('#spFixed').fadeOut();
            }
        }
    }));
}

// create new JJV environment
let importValidator = jjv();

// Register a `user` schema
importValidator.addSchema('espers', {
    type: 'array',
    maxItems: 20,
    items: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                maxLength: 2
            },
            rarity: {
                type: 'number'
            },
            level: {
                type: 'number'
            },
            board: {
                type: 'string',
                maxLength: 40
            },
        },
        required: ['id', 'rarity', 'level', 'board']
    }
});
