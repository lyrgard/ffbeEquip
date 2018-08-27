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

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#esper").removeClass("hidden");
    $(".nav-tabs li").removeClass("active");
    $("#noEsperMessage").addClass('hidden');
}

function showAll() {
    beforeShow();
    $(".nav-tabs li.ALL").addClass("active");
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

            html += "<tr data-esper=" + esper.name + ">";

            // First cell: image, name, points
            html += "<td class='esperDesc index'>";
            html += "<i class='img img-esper-" + escapedName +"'></i>";
            html += "<div class='name'>" + esper.name + " <span class='rarity'>" + Array(esper.rarity+1).join("★") +"</span></div>";
            html += "<div class='sp'>" + sp.used + " / "+ sp.available +"</div>";
            html += "<span class='hidden sortValue'>" + index + "</span>";
            html += "</td>";
            
            html += "<td class='level'>" + esper.level + "</td>";

            // Next cells: stats
            html += "<td class='stats hp'><span class='bonus sortValue'>+" +calculateStatBonus(esper.name, 'hp') + "</span> ("+ esper.hp +")</td>";
            html += "<td class='stats mp'><span class='bonus sortValue'>+" +calculateStatBonus(esper.name, 'mp') + "</span> ("+ esper.mp +")</td>";
            html += "<td class='stats atk'><span class='bonus sortValue'>+" +calculateStatBonus(esper.name, 'atk') + "</span> ("+ esper.atk +")</td>";
            html += "<td class='stats def'><span class='bonus sortValue'>+" +calculateStatBonus(esper.name, 'def') + "</span> ("+ esper.def +")</td>";
            html += "<td class='stats mag'><span class='bonus sortValue'>+" +calculateStatBonus(esper.name, 'mag') + "</span> ("+ esper.mag +")</td>";
            html += "<td class='stats spr'><span class='bonus sortValue'>+" +calculateStatBonus(esper.name, 'spr') + "</span> ("+ esper.spr +")</td>";
            html += "<td class='resists'>" + getResistHtml(esper) + "</td>";
            html += "<td class='killers'>" + getKillersHtml(esper) + "</td>";

            html += "</tr>";
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
    $(".nav-tabs li." + escapedName).addClass("active");
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
            $("#esperResist").html(getResistHtml(ownedEspers[currentEsper]));
            $("#esperSkills").html(getKillersHtml(ownedEspers[currentEsper]));
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
    $("#grid li.0_0 .hexagon").html('<i class="esperCenterIcon img img-esper-' + escapedName +'"></i>');
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
            ownedEspers[currentEsper][baseStat] + "&nbsp;"+
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
        var maxStat = board.stats[star][baseStats[index].toUpperCase()][1];
        ownedEsper[baseStats[index]] = minStat + (maxStat - minStat) / maxStatLevelByStar[star] * level;
    }
    
    for (index in board.nodes) {
        addStatsOfSelectedNodes(board.nodes[index], ownedEsper);
    }
}

function calculateStatBonus(esperName, baseStat) {
    var ownedEsper = ownedEspers[esperName];
    var statBonusCoef = 1;
    if (ownedEsper.esperStatsBonus && ownedEsper.esperStatsBonus[baseStat]) {
        statBonusCoef += ownedEsper.esperStatsBonus[baseStat] / 100;
    }
    return Math.floor(ownedEsper[baseStat] * statBonusCoef / 100);
}

function addStatsOfSelectedNodes(node, ownedEsper) {
    var posString = getPositionString(node.position[0], node.position[1]);
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
    var posString = getPositionString(node.position[0], node.position[1]);
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
    var posString = getPositionString(node.position[0], node.position[1]);
    var nodeHtml = $("#grid li." + posString + " .hexagon");
    for (var statIndex = 0; statIndex < baseStats.length; statIndex++) {
        if (node[baseStats[statIndex]]) {
            nodeHtml.html('<span class="iconHolder"></span><span class="text">' + baseStats[statIndex].toUpperCase() + ' + ' + node[baseStats[statIndex]] + '</span><span class="cost">' + node.cost + ' SP</span>');
            nodeHtml.addClass(baseStats[statIndex]);
            break;
        }
        if (node[percentValues[baseStats[statIndex]]]) {
            nodeHtml.html('<span class="iconHolder"><img class="icon" src="/img/items/ability_77.png"></img></span><span class="text">' + baseStats[statIndex].toUpperCase() + ' + ' + node[percentValues[baseStats[statIndex]]] + '%</span><span class="cost">' + node.cost + ' SP</span>');
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
        if (killer.physical) {
            html+= '<i class="img img-equipment-sword miniIcon physical"></i>';
        }
        if (killer.magical) {
            html+= '<i class="img img-equipment-rod miniIcon magical"></i>';
        }
        html += '<img class="icon" src="/img/items/ability_79.png"></img></span><span class="text"><span class="capitalize">' + killer.name + '</span> ';
        if (killer.physical) {
            html+= killer.physical + '%';
        } else {
            html+= killer.magical + '%';
        }
        html+='</span><span class="cost">' + node.cost + ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("killer");
    }
    if (node.esperStatsBonus) {
        var html = '<span class="iconHolder"><img class="icon" src="/img/items/ability_77.png"></img></span><span class="text">ST Reflection Boost<a href="http://exvius.gamepedia.com/ST_Reflection_Boost" target="_blank" rel="noreferrer"><span class="glyphicon glyphicon-new-window wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.lbPerTurn) {
        var html = '<span class="iconHolder"><img class="icon" src="/img/items/ability_91.png"></img></span><span class="text">+' + node.lbPerTurn.min + ' LS/turn<a href="http://exvius.gamepedia.com/Auto-Limit" target="_blank" rel="noreferrer"><span class="glyphicon glyphicon-new-window wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.evade && node.evade.physical) {
        var html = '<span class="iconHolder"><img class="icon" src="/img/items/ability_97.png"></img></span><span class="text">' + node.evade.physical + '% physical evasion<a href="http://exvius.gamepedia.com/Air_Step" target="_blank" rel="noreferrer"><span class="glyphicon glyphicon-new-window wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
        nodeHtml.html(html);
        nodeHtml.addClass("ability");
    }
    if (node.evade && node.evade.magical) {
        var html = '<span class="iconHolder"><img class="icon" src="/img/items/ability_97.png"></img></span><span class="text">' + node.evade.magical + '% magical evasion<a href="http://exvius.gamepedia.com/Air_Wall" target="_blank" rel="noreferrer"><span class="glyphicon glyphicon-new-window wikiLink"></span></a></span><span class="cost">' + node.cost+ ' SP</span>';
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
            result += "<img class='icon' src='/img/items/" + token[token.length - 1] + "'></img>"
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
    if (logged) {
        saveNeeded = true;
        if (saveTimeout) {clearTimeout(saveTimeout)}
        saveTimeout = setTimeout(saveUserData,3000, false, false, true);
        $(".saveInventory").removeClass("hidden");
    }
}

function selectNode(x,y) {
    var posString = getPositionString(x, y);
    var path = findPathTo(x,y,esperBoards[currentEsper]);
    if (ownedEspers[currentEsper].selectedSkills.includes(posString)) {
        var node = path[path.length - 1];
        unselectNodeAndChildren(node);
    } else {
        if (path) {
            for (var index = 0; index < path.length; index++) {
                var posString = getPositionString(path[index].position[0], path[index].position[1]);
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
    $("#esperResist").html(getResistHtml(ownedEspers[currentEsper]));
    $("#esperSkills").html(getKillersHtml(ownedEspers[currentEsper]));
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
    if (node.evade && node.evade.physical) {
        if (!esper.evade) {esper.evade = {};}
        esper.evade.physical = node.evade.physical;
    }
    if (node.evade && node.evade.magical) {
        if (!esper.evade) {esper.evade = {};}
        esper.evade.magical = node.evade.magical;
    }
    for (var i = baseStats.length; i--;) {
        if (node[percentValues[baseStats[i]]]) {
            addToStat(esper, percentValues[baseStats[i]], node[percentValues[baseStats[i]]]);
        }
    }
}

function unselectNodeAndChildren(node) {
    var posString = getPositionString(node.position[0], node.position[1]);
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
        if (node.evade && node.evade.physical && esper.evade && esper.evade.physical) {
            delete esper.evade.physical;
        }
        if (node.evade && node.evade.magical && esper.evade && esper.evade.magical) {
            delete esper.evade.magical;
        }
        if (node.evade && !node.evade.physical && !node.evade.magical) {
            delete esper.evade;
        }
        for (var i = baseStats.length; i--;) {
            if (node[percentValues[baseStats[i]]]) {
                removeFromStat(ownedEspers[currentEsper], percentValues[baseStats[i]], node[percentValues[baseStats[i]]]);
            }
        }
        for (var i = 0; i < node.children.length; i++) {
            unselectNodeAndChildren(node.children[i]);
        }
    }
}


function addKillers(esper, killers) {
    for (var i = 0; i < killers.length; i++) {
        addKiller(esper, killers[i].name, killers[i].physical, killers[i].magical);
    }
}
function addKiller(skill, race, physicalPercent, magicalPercent) {
    if (!skill.killers) {
        skill.killers = [];
    }
    var killerData;
    for (var index in skill.killers) {
        if (skill.killers[index].name == race) {
            killerData = skill.killers[index];
            break;
        }
    }
    
    if (!killerData) {
        killerData = {"name":race};
        skill.killers.push(killerData);
    }
    if (physicalPercent != 0) {
        if (killerData.physical) {
            killerData.physical += physicalPercent;
        } else {
            killerData.physical = physicalPercent;
        }
    }
    if (magicalPercent != 0) {
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
        item.esperStatsBonus = {"hp":0, "mp":0, "atk":0, "def":0, "mag":0, "spr":0};
    }
    for (var i = 0; i < baseStats.length; i++) {
        item.esperStatsBonus[baseStats[i]] += bonus[baseStats[i]];
    }
}
function removeEsperStatsBonus(item, bonus) {
    for (var i = 0; i < baseStats.length; i++) {
        item.esperStatsBonus[baseStats[i]] -= bonus[baseStats[i]];
    }
    if (item.esperStatsBonus.hp == 0 && item.esperStatsBonus.mp == 0 && item.esperStatsBonus.atk == 0 && 
        item.esperStatsBonus.def == 0 && item.esperStatsBonus.mag == 0 && item.esperStatsBonus.spr == 0) 
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

function displayEspers() {
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
        
        tabs += "<li class='ALL' data-esper='ALL' title='Stats on all espers'><a><i class='img img-esper-ALL'></i></a></li>";
        for (var index = 0; index < espers.length; index++) {
            var escapedName = escapeName(espers[index].name);
            var owned = ownedEspers[espers[index].name] ? true : false;
            tabs += "<li class=\"" + escapedName + " " + (!owned ? 'notOwned' : '') +"\" "+
                    "data-esper=\"" + espers[index].name + "\" "+
                    "title=\"" + espers[index].name + (owned ? " (owned)" : " (not owned)") + "\"><a>";
            tabs += "<i class='img img-esper-" + escapedName +"'></i>";
            tabs += "</a></li>";
        }
        $("#espers #tabs").html(tabs);
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

function notLoaded() {
    if (window.location.hash.length > 1) {
        var hashValue = window.location.hash.substr(1);
        ownedEspers = JSON.parse(atob(hashValue));
        
        $('.navbar').addClass("hidden");
        linkMode = true;
    } else {
        ownedEspers = {};    
    }
    
    if (esperBoards) {
        displayEspers();
    }
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#inventory").addClass("hidden");
}

function inventoryLoaded() {
    logged = true;
    if (esperBoards) {
        displayEspers();
    }
}

function onLevelChange() {
    var star = $("#esperStar").val();
    var level = parseInt($("#level").val());
    if (level > maxLevelByStar[star]) {
        setEsperLevel(maxLevelByStar[value]);
    } else {
        setEsperLevel(level);
    }
    prepareSave();
}

function getPublicEsperLink() {
    var esperToExport = {};
    esperToExport[currentEsper] = {
        "name":ownedEspers[currentEsper].name,
        "rarity":ownedEspers[currentEsper].rarity,
        "level":ownedEspers[currentEsper].level,
        "selectedSkills":ownedEspers[currentEsper].selectedSkills,
    };

    Modal.showWithBuildLink("Esper build", "espers.html?server=" + server + '&o#' + btoa(JSON.stringify(esperToExport)));

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
            $("#tabs li."+currentEsper).addClass("notOwned");
        } else {
            $("#esper .levelLine").removeClass("hidden");
            $("#esper .spLine").removeClass("hidden");
            ownedEspers[currentEsper] = {"name":currentEsper, "id":currentEsper, "rarity":parseInt(value),"selectedSkills":[]};
            ownedEspers[currentEsper].resist = JSON.parse(JSON.stringify(esperBoards[currentEsper].resist[value]));
            $("#esperResist").html(getResistHtml(ownedEspers[currentEsper]));
            $("#esperSkills").html(getKillersHtml(ownedEspers[currentEsper]));
            setEsperLevel(maxLevelByStar[value]);
            showBoard(currentEsper, parseInt(value));
            $(".stats").removeClass("invisible");
            $(".esperOtherStats").removeClass("invisible");
            $("#tabs li."+currentEsper).removeClass("notOwned");
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
    $("#espers #tabs").on('click', 'li[data-esper]', function(e) {
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
        var $tab = $("#espers #tabs").find("[data-esper="+esperName+"]");
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
