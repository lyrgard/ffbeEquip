var wikiBaseUrl = "http://exvius.gamepedia.com/";

var data;
var units;
var ownedUnits;
var itemInventory;
var ownedEspers;
var stat = '';
var types = [];
var elements = [];
var ailments = [];
var killers = [];
var accessToRemove = [];
var additionalStat = [];
var searchText = '';
var selectedUnitId = 0;
var server = "GL";
var language = "";
var saveTimeout;
var saveNeeded;
var savePublicLinkTimeout;
var savePublicLinkNeeded = false;
var mustSaveUnits = false;
var mustSaveInventory = false;
var mustSaveEspers = false;
var userSettings;
var lazyLoader = (window.LazyLoad) ? new LazyLoad({
    elements_selector: 'img.lazyload'
}) : null;

function getImageHtml(item) {
    var html = '<div class="td type">';

    if (item.special && item.special.includes("notStackable")) {
        html += "<img class='miniIcon left' src='img/icons/notStackable.png' title='Not stackable'>";
    }
    if (item.special && item.special.includes("twoHanded")) {
        html += "<img class='miniIcon left' src='img/icons/twoHanded.png' title='Two-handed'>";
    }

    var src_attr = (lazyLoader !== null) ? 'data-src' : 'src';
    var class_attr = (lazyLoader !== null) ? 'icon lazyload' : 'icon';

    if (item.icon) {
        html += "<img "+src_attr+"='img/items/" + item.icon + "' class='"+class_attr+"'></img>";
    } else if (item.type == "esper") {
        // no lazyload for espers (uses CSS background)
        html += "<i class='img img-esper-" + escapeName(item.name) +" icon'></i>";
    } else if (item.type == "unavailable") {
        // no image
    } else {
        html += "<img "+src_attr+"='img/icons/equipments/" + item.type + ".png' class='"+class_attr+"'></img>";
    }
    html += "</div>";
    return html;
}

function getNameColumnHtml(item) {
    var html = '<div class="td name"><div>';

    if (item.rarity) {
      html += '<span class="rarity">' + item.rarity + '★</span> ';
    }

    if (item.placeHolder) {
        html += toLink(item.name, typeCategories[item.type]);
    } else if (item.wikiEntry) {
        html += toLink(item.name, item.wikiEntry);
    } else if (item.type == "unavailable") {
        // no name
    } else {
        html += toLink(item.name);
    }
    if (item.level) {
        html += '<span class="rarity"> level ' + item.level + '</span> ';
    }
    if (item.buildLink) {
        html += '<a href="' + item.buildLink + '" target="blank" class="buildLink"><span class="glyphicon glyphicon-th wikiLink"></span></a>';
    }
    if (item.outclassedBy) {
        html += '<img src="img/icons/gil.png" class="outclassedByIcon" title="Can be sold. Strictly outclassed by ' + item.outclassedBy + '"></img>';
    }
    html += "</div>";
    if (item.jpname) {
        html += '<div>' + item.jpname + "</div>";
    }
    html += "<div class='detail'>";
    if (item.type != "esper" && item.type != "monster") {
        html += "<img src='img/icons/equipments/" + item.type + ".png' class='miniIcon'></img>";
    }
    html += getStatDetail(item) + "</div>";
    if (item.userPseudo) {
        html += "<div class='userPseudo'>item added by " + item.userPseudo + "</div>";
    }
    
    if (item.enhancements) {
        html += getEnhancements(item);
    }
    
    html += "</div>";

    return html;
}

function getElementHtml(elements) {
    var html = "<div class='specialValueGroup'>";
    for (var index in elements) {
        html += "<div class='specialValueItem'><div class='specialImg'><img class='miniIcon' src='img/icons/equipments/sword.png'></img><img src='img/icons/elements-ailments/" + elements[index] + ".png'></img></div></div>"
    }
    html += "</div>"
    return html;
}

function getAilmentsHtml(item) {
    var html = "<div class='specialValueGroup'>";
    $(item.ailments).each(function(index, ailment) {
        html += "<div class='specialValueItem'><div class='specialImg noWrap ailment-" + ailment + "'><img class='miniIcon' src='img/icons/equipments/sword.png'></img><img class='imageWithText' src='img/icons/elements-ailments/" + ailment.name + ".png'></img></div><div class='specialValue'>" + ailment.percent + "%</div></div>";
    });
    html += "</div>"
    return html;
}
function getResistHtml(item) {
    var html = "<div class='specialValueGroup'>";
    $(item.resist).each(function(index, resist) {
        html += "<div class='specialValueItem'><div class='specialImg noWrap resist-" + resist.name + "'><img class='miniIcon' src='img/icons/equipments/heavyShield.png'></img><img class='imageWithText' src='img/icons/elements-ailments/" + resist.name + ".png'></img></div><div class='specialValue'>" + resist.percent + "%</div></div>";
    });
    html += "</div>"
    return html;
}
function getKillersHtml(item) {
    var html = "<div class='specialValueGroup'>";
    $(item.killers).each(function(index, killer) {
        if (killer.physical) {
            html += "<div class='specialValueItem'><div class='specialImg noWrap killer-" + killer.name + "'><img class='miniIcon' src='img/icons/equipments/sword.png'></img><img class='imageWithText' src='img/icons/killer.png'></img></div><div class='specialValue'>" + killer.name + "</div><div class='specialValue'>" + killer.physical + "%</div></div>";
        }
        if (killer.magical) {
            html += "<div class='specialValueItem'><div class='specialImg noWrap killer-" + killer.name + "'><img class='miniIcon' src='img/icons/equipments/rod.png'></img><img class='imageWithText' src='img/icons/killer.png'></img></div><div class='specialValue'>" + killer.name + "</div><div class='specialValue'>" + killer.magical + "%</div></div>";
        }
    });
    html += "</div>"
    return html;
}
function getExclusiveUnitsHtml(item) {
    html = "<div class='exclusive'>Only ";
    var first = true;
    $(item.exclusiveUnits).each(function(index, exclusiveUnitId) {
        if (first) {
            first = false;
        } else {
            html += ", ";
        }
        if (units[exclusiveUnitId]) {
            html += toLink(units[exclusiveUnitId].name);
        } else {
            html += "Not released yet unit";
        }
    });
    html += "</div>";
    return html;
}
function getSpecialHtml(item) {
    var special = "";
    $(item.special).each(function(index, itemSpecial) {
        if (itemSpecial != "twoHanded" && itemSpecial != "notStackable" && itemSpecial != "dualWield") {
            special += "<li>" + toHtml(itemSpecial) + "</li>";
        }
    });
    return special;
}

// Create an HTML span containing the stats of the item
var getStatDetail = function(item) {
    var detail = "";
    var first = true;
    var statsToDisplay = baseStats;
    if (item.type == "monster") {
        statsToDisplay = ["def", "spr"];
    }
    var statBonusCoef = 1;
    if (item.type == "esper") {
        if (item.esperStatsBonus) {
            statBonusCoef += item.esperStatsBonus["hp"] / 100;
        }
        if (builds && builds[currentUnitIndex] && builds[currentUnitIndex].build) {
            for (var i = 0; i < builds[currentUnitIndex].build.length; i++) {
                if (i != 10) {
                    if (builds[currentUnitIndex].build[i] && builds[currentUnitIndex].build[i].esperStatsBonus) {
                        statBonusCoef += builds[currentUnitIndex].build[i].esperStatsBonus["hp"] / 100;
                    }
                }
            }
        }
        statBonusCoef = Math.min(3, statBonusCoef);
    } 
    $(statsToDisplay).each(function(index, stat) {
        detail += "<span class='" + stat + "'>";

        if (item[stat]) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + Math.floor(item[stat] * statBonusCoef);
        }
        if (item[stat+'%']) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + item[stat+'%'] + '%';
        }

        detail += "</span>";

    });
    return detail;
};

function getEnhancements(item) {
    var html = '<div class="enhancements">';
    var first = true;
    for (var i = 0, len = item.enhancements.length; i < len; i++) {
        if (first) {
            first = false;
            html += '<img src="img/icons/dwarf.png"/>'
        } else {
            html += ", ";
        }
        var enhancement = item.enhancements[i];
        if (enhancement == "rare") {
            html += itemEnhancementLabels["rare"][item.type];
        } else {
            html += itemEnhancementLabels[enhancement];
        }
    }
    html += '</div>';
    return html;
}

function getEquipedConditionHtml(item) {
    var conditions = "";
    var first = true;
    for(var equipedConditionsIndex in item.equipedConditions) {
        if (first) {
            first = false;
        } else {
            conditions += " and ";
        }
        conditions += "<img src='img/icons/equipments/" + item.equipedConditions[equipedConditionsIndex] + ".png'></img>";
    }
    return "<div class='exclusive'>If equiped with " + conditions + "</div>";
}

function displayItemLine(item) {
    html = "";
    // type
    html += getImageHtml(item);

    // name
    html += getNameColumnHtml(item);

    // value
    html += '<div class="td value sort">' + item.calculatedValue;
    if (stat == 'inflict' || stat == 'evade' || stat == 'resist') {
        html += '%';
    }
    html += "</div>";

    // special
    html += '<div class="td special">';

    var special = "";
    
    if (item.element) {
        special += getElementHtml(item.element);
    }
    if (item.ailments) {
        special += getAilmentsHtml(item);
    }
    if (item.resist) {
        special += getResistHtml(item);
    }

    if (item.killers) {
        special += getKillersHtml(item);
    }
    
    if (item.special && item.special.includes("dualWield")) {
        special += "<li>" + toHtml("[Dual Wield|ability_72.png]") + "</li>";
    }
    if (item.partialDualWield) {
        special += "<li>" + toHtml("[Dual Wield|ability_72.png] of ")
        for (var index in item.partialDualWield) {
            special += "<img src='img/icons/equipments/" + item.partialDualWield[index] + ".png'></img>";
        }
        special += "</li>";
    }
    if (item.allowUseOf) {
        special += "<li>Allow use of <img src='img/icons/equipments/" + item.allowUseOf + ".png'></img></li>";
    }
    if (item.evade) {
        if (item.evade.physical) {
            special += "<li>Evade physical attacks " + item.evade.physical + "%</li>";
        }
        if (item.evade.magical) {
            special += "<li>Evade magical attacks " + item.evade.magical + "%</li>";
        }
    }
    if (item.singleWielding) {
        for (var index in baseStats) {
            if (item.singleWielding[baseStats[index]]) {
                special += "<li>Increase equipment " + baseStats[index].toUpperCase() + " (" + item.singleWielding[baseStats[index]] + "%) when single wielding</li>";
            }
        }
    }
    if (item.singleWieldingOneHanded) {
        for (var index in baseStats) {
            if (item.singleWieldingOneHanded[baseStats[index]]) {
                special += "<li>Increase equipment " + baseStats[index].toUpperCase() + " (" + item.singleWieldingOneHanded[baseStats[index]] + "%) when single wielding a one-handed weapon</li>";
            }
        }
    }
    if (item.dualWielding) {
        for (var index in baseStats) {
            if (item.dualWielding[baseStats[index]]) {
                special += "<li>Increase equipment " + baseStats[index].toUpperCase() + " (" + item.dualWielding[baseStats[index]] + "%) when dual wielding</li>";
            }
        }
    }

    if (item.accuracy) {
        special += "<li>Increase Accuracy: " + item.accuracy + "%</li>";
    }
    if (item.damageVariance) {
        special += "<li>Damage variance from x" + item.damageVariance.min + " to x"  + item.damageVariance.max + " (average : x" + (item.damageVariance.min + item.damageVariance.max)/2 + ")</li>";
    }
    if (item.mpRefresh) {
        special += "<li>Recover MP (" + item.mpRefresh + "%) per turn</li>";
    }
    if (item.jumpDamage) {
        special += "<li>Increase damage dealt by jump attacks by "+ item.jumpDamage + "%</li>";
    }
    if (item.lbFillRate) {
        special += "<li>Increase LB gauge fill rate (" + item.lbFillRate + "%)</li>";
    }
    if (item.lbPerTurn) {
        var value;
        if (item.lbPerTurn.min == item.lbPerTurn.max) {
            value = item.lbPerTurn.min;
        } else {
            value = item.lbPerTurn.min + "-" + item.lbPerTurn.max;
        }
        special += "<li>Increase LB gauge each turn (" + value + ")</li>";
    }
    if (item.evoMag) {
        special += "<li>Increase Esper summon damage by "+ item.evoMag + "%</li>";
    }
    if (item.esperStatsBonus) {
        special += "<li>Increase esper's bonus stats ("+ item.esperStatsBonus.hp + "%)</li>";
    }
    if (item.special) {
        special += getSpecialHtml(item);
    }
    if (special.length != 0) {
        html += "<ul>" + special + "<ul>";
    }
    html += "</div>";


    //access
    html += getAccessHtml(item);
    return html;
}

function getAccessHtml(item) {
    var html = '<div class="td access">';
    $(item.access).each(function(index, itemAccess) {
        html += "<div";
        if (accessToRemove.length != 0 && !isAccessAllowed(accessToRemove, itemAccess)) {
            html += " class='notSelected forbiddenAccess'";
        }
        html += ">" + itemAccess + "</div>";
    });
    if (item.tmrUnit) {
        if (units[item.tmrUnit]) {
            html += '<div>' + toLink(units[item.tmrUnit].name, units[item.tmrUnit].wikiEntry) + '</div>';
        } else {
            html += '<div>not released yet unit</div>';
        }
    }
    if (item.stmrUnit) {
        html += '<div>' + toLink(units[item.stmrUnit].name) + '</div>';
    }
    if (item.exclusiveUnits) {
        html += getExclusiveUnitsHtml(item);
    }
    if (item.exclusiveSex) {
        html += "<div class='exclusive'>Only " + item.exclusiveSex + "</div>";
    }
    if (item.equipedConditions) {
        html += getEquipedConditionHtml(item);
    }
    html += "</div>";
    return html;
}

// Some field in the data can use a special syntax to display link to the wiki. This is done by using brace ( blabla [name] blabla). This replace the parts inside braces by html links.
var toHtml = function(text) {
    var textWithAddedAnchors = text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1);
        var token = vWithoutBrace.split("|");
        var result = "";
        if (token.length == 1) {
            result += toLink(token[0]);
        } else if (token.length == 2) {
            result += toLink(token[0]);
            result += "<img class='icon' src='/img/items/" + token[1] + "'></img>"
        } else if (token.length == 3) {
            result += toLink(token[1], token[0]);
            result += "<img class='icon' src='/img/items/" + token[2] + "'></img>"
        }
        
        return result;
    });
    return "<span>" + textWithAddedAnchors +"</span>";
};

// Return the wiki url corresponding to the name
var toUrl = function(name) {
    return wikiBaseUrl + encodeURIComponent(name.replace(/ /g, '_'));
};

var toLink = function(text, link = text) {
    if (server == "GL") {
        return '<span>' + text + '</span><a href="' + toUrl(link) + '" target="_blank" rel="noreferrer" onclick="event.stopPropagation();"><span class="glyphicon glyphicon-new-window wikiLink"></span></a>';
    } else {
        return "<span>" + text + "</span>";
    }
}

function escapeName(string) {
    return String(string).replace(/[+%&': \(\)]/g, function (s) {
        return "_";
    });
}

// Function used to know if a keyboard key pressed is a number, to prevent non number to be entered
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( charCode != 37 && charCode != 39 && ((charCode > 31 && charCode < 48) || charCode > 57)) {
        return false;
    }
    return true;
};

function isNumberOrMinus(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( charCode != 37 && charCode != 39 && ((charCode > 31 && charCode < 45) || (charCode > 54 && charCode < 48) || charCode > 57)) {
        return false;
    }
    return true;
};

function isEnter(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    return charCode == 13;
};

// Get the values for a filter type
var getSelectedValuesFor = function(type) {
    var values = [];
        $('.active input[name='+ type +']').each(function() {
            values.push($(this).val());
        });
    return values;
};

// Selects the provided values on the filter of the provided type
function select(type, values) {
    $(values).each(function (index, value) {
        $("input[name='"+ type +"'][value='"+ value +"']").each(function(index, checkbox) {
            $(checkbox).prop('checked', true);
            $(checkbox).parent().addClass('active');
        });
    }) ;
};

function unselectAll(type) {
    $("input[name='"+ type +"']").each(function(index, checkbox) {
        $(checkbox).prop('checked', false);
        $(checkbox).parent().removeClass('active');
    });
}

// Add text choices to a filter. Type can be 'radio' of 'checkbox', depending if you want only one selection, or allow many.
function addTextChoicesTo(targetId, type, valueMap) {
	var target = $("#" + targetId);
	for (var key in valueMap) {
		addTextChoiceTo(target, targetId, type, valueMap[key], key);
	}
}

// Add image choices to a filter.
function addImageChoicesTo(targetId, valueList,type="checkbox",imagePrefix = "") {
	var target = $("#" + targetId);
	for (i = 0; i < valueList.length; i++) {
		addImageChoiceTo(target, targetId, valueList[i], type, imagePrefix);
	}
}

// Add one text choice to a filter
function addTextChoiceTo(target, name, type, value, label) {
	target.append('<label class="btn btn-default"><input type="' + type +'" name="' + name + '" value="'+value+'" autocomplete="off">'+label+'</label>');
}

// Add one image choice to a filter
function addImageChoiceTo(target, name, value, type="checkbox",imagePrefix = "") {
	target.append('<label class="btn btn-default"><input type="' + type + '" name="' + name + '" value="'+value+'" autocomplete="off"><img style="height:38px;" src="img/'+ imagePrefix + value+'.png" title="' + value + '"/></label>');
}

function loadInventory() {
    $.get('googleOAuthUrl', function(result) {
        $('<div id="dialog" title="Authentication">' +
            '<p>You\'ll be redirected to a google authentication page</p>'+
            '<p class="loginMessageDetail">This site is using <a href="https://en.wikipedia.org/wiki/OAuth" target="_blank" rel="noreferrer">OAuth2 <span class="glyphicon glyphicon-question-sign"/></a> to access the stored inventory data, so it will never know your google login and password.</p>' +
            '<p class="loginMessageDetail">The data is stored on the secure FFBE Equip <a href="https://developers.google.com/drive/v3/web/appdata" target="_blank" rel="noreferrer">app folder on Google Drive <span class="glyphicon glyphicon-question-sign"/></a>. FFBE Equip can only access this folder, and no personal file.</p>' +
          '</div>' ).dialog({
            modal: true,
            open: function(event, ui) {
                $(this).parent().css('position', 'fixed');
            },
            position: { my: 'top', at: 'top+150' },
            buttons: {
                Ok: function() {
                    window.location.href = result.url + "&state=" + encodeURIComponent(window.location.href.replace(".lyrgard.fr",".com"));
                }
            }
        });

    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
}

function mergeArrayWithoutDuplicates(array1, array2) {
    var result = [].concat(array1);
    for (var index in array2) {
        if (!result.includes(array2[index])) {
            result.push(array2[index]);
        }
    }
    return result;
}

function chunkify(arrayIn, partCount) {
    if (partCount < 2) {
        return [arrayIn];
    }
    var len = arrayIn.length,
        out = [],
        i = 0,
        size;

    if (len % partCount === 0) {
        size = Math.floor(len / partCount);
        while (i < len) {
            out.push(arrayIn.slice(i, i += size));
        }
    } else {
        partCount--;
        size = Math.floor(len / partCount);
        if (len % size === 0) {
            size--;
        }
        while (i < size * partCount) {
            out.push(arrayIn.slice(i, i += size));
        }
        out.push(arrayIn.slice(size * partCount));
    }
    return out;
}

function switchTo(newServer) {
    if (newServer != server) {
        var serverParam = "";
        if (newServer == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + serverParam + window.location.hash;
    }
}

function switchToLanguage(newLanguage) {
    if (newLanguage != language && server != "JP") {
        var languageParam = "";
        if (newLanguage != "en") {
            languageParam = "?l=" + newLanguage;
        }
        var serverParam = "";
        if (server == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + languageParam + serverParam + window.location.hash;
    }
}

function readUrlParams() {
    if (window.location.href.indexOf("server=") > 0) {
        var captured = /server=([^&#]+)/.exec(window.location.href)[1];
        if (captured == "GL" || captured == "JP") {
            server = captured;
        } else {
            server = "GL";
        }
    } else {
        server = "GL";
    }
    if (window.location.href.indexOf("l=") > 0) {
        var captured = /l=([^&#]+)/.exec(window.location.href)[1];
        if (captured == "zh" || captured == "ko" || captured == "fr" || captured == "de" || captured == "es") {
            language = captured;
        }
    }
    if (server == "GL") {
        $(".switchServer .GL").addClass("btn-primary").removeClass("notSelected");
        $(".switchServer .JP").removeClass("btn-primary").addClass("notSelected");
        $("#languages").removeClass("hidden");
        var selectedLang = language;
        if (!language) {
            selectedLang = "en"
        }
        $("#languages span[lang=" + selectedLang + "]").addClass("selected");
    } else {
        $(".switchServer .JP").addClass("btn-primary").removeClass("notSelected");
        $(".switchServer .GL").removeClass("btn-primary").addClass("notSelected");
        $("#languages").addClass("hidden");
    }
    updateLinks();
}

function updateLinks() {
    var serverParam = "";
    if (server == "JP") {
        serverParam = "?server=JP";
    }
    var languageParam = "";
        if (language && language != "en" ) {
            languageParam = "?l=" + language;
        }
    $("a[data-internal-link]").each(function(index, element) {
        var link = $(element);
        link.prop("href", link.data("internal-link") + serverParam + languageParam);
    });
    $("[data-server]").each(function(index, element) {
        var item = $(element);
        if (server == item.data("server")) {
            item.removeClass("hidden");
        } else {
            item.addClass("hidden");
        }
    });
}

// Filter the items according to the currently selected filters. Also if sorting is asked, calculate the corresponding value for each item
var filter = function(data, onlyShowOwnedItems = true, stat = "", baseStat = 0, searchText = "", selectedUnitId = null, types = [], elements = [], ailments = [], killers = [], accessToRemove = [], additionalStat = "", showNotReleasedYet = false, showItemsWithoutStat = false) {
    var result = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (!onlyShowOwnedItems || itemInventory && itemInventory[item.id]) {
            if (showNotReleasedYet || !item.access.includes("not released yet")) {
                if (types.length == 0 || types.includes(item.type)) {
                    if (elements.length == 0 || (item.element && matches(elements, item.element)) || (elements.includes("noElement") && !item.element) || (item.resist && matches(elements, item.resist.map(function(resist){return resist.name;})))) {
                        if (ailments.length == 0 || (item.ailments && matches(ailments, item.ailments.map(function(ailment){return ailment.name;}))) || (item.resist && matches(ailments, item.resist.map(function(res){return res.name;})))) {
                            if (killers.length == 0 || (item.killers && matches(killers, item.killers.map(function(killer){return killer.name;})))) {
                                if (accessToRemove.length == 0 || haveAuthorizedAccess(accessToRemove, item)) {
                                    if (additionalStat.length == 0 || hasStats(additionalStat, item)) {
                                        if (searchText.length == 0 || containsText(searchText, item)) {
                                            if (!selectedUnitId || !exclusiveForbidAccess(item, selectedUnitId)) {
                                                if (stat.length == 0 || showItemsWithoutStat || hasStat(stat, item)) {
                                                    calculateValue(item, baseStat, stat, ailments, elements, killers);
                                                    result.push(item);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
};

function keepOnlyOneInstance(data) {
    var dataWithOnlyOneOccurence = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (dataWithOnlyOneOccurence.length > 0 && dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1].id == item.id) {
            var previousItem = dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1];
            if (previousItem.equipedConditions) {
                if (item.equipedConditions) {
                    if (previousItem.equipedConditions.length <= item.equipedConditions.length) {
                        dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
                    }
                }
            } else {
                dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
            }
        } else {
            dataWithOnlyOneOccurence.push(item);
        }
    }
    return dataWithOnlyOneOccurence;
}

// Sort by calculated value (will be 0 if not sort is asked) then by name
var sort = function(items) {
    return items.sort(function (item1, item2){
		if (item2.calculatedValue == item1.calculatedValue) {
            var typeIndex1 = typeListWithEsper.indexOf(item1.type);
            var typeIndex2 = typeListWithEsper.indexOf(item2.type);
            if (typeIndex1 == typeIndex2) {
                return item1.name.localeCompare(item2.name);
            } else {
                return typeIndex1 - typeIndex2;
            }
		} else {
			return item2.calculatedValue - item1.calculatedValue;
		}
    });
};

// If sort is required, this calculate the effective value of the requested stat, based on the unit stat for percentage increase.
var calculateValue = function(item, baseStat, stat, ailments, elements, killers) {
    var calculatedValue = 0;
    if (item[stat] && stat != "evade") {
        calculatedValue = item[stat];
    }
    if (item[stat + '%']) {
        calculatedValue += item[stat+'%'] * baseStat / 100;
    }
    if (item[stat] && stat == "evade") {
        if (item.evade.physical) {
            calculatedValue = item.evade.physical;
        }
        if (item.evade.magical && item.evade.magical > calculatedValue) {
            calculatedValue = item.evade.magical;
        }
    }
    if (stat == 'inflict' && (item.ailments || item.killers)) {
        var maxValue = 0;
        $(item.ailments).each(function(index, ailment) {
            if ((ailments.length == 0 || ailments.includes(ailment.name)) && ailment.percent > maxValue) {
                maxValue = ailment.percent;
            }
        });
        $(item.killers).each(function(index, killer) {
            if ((killers.length == 0 || killers.includes(killer.name))) {
                if (killer.physical > maxValue) {
                    maxValue = killer.physical;
                }
                if (killer.magical > maxValue) {
                    maxValue = killer.magical;
                }
            }
        });
        calculatedValue = maxValue;
    }
    if (stat == 'resist' && (item.resist)) {
        var maxValue = -999;
        var ignoreAilments = elements.length > 0 && ailments.length == 0;
        var ignoreElements = ailments.length > 0 && elements.length == 0;
        $(item.resist).each(function(index, res) {
            if (!ignoreAilments && ailmentList.includes(res.name) && (ailments.length == 0 || ailments.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
            if (!ignoreElements && elementList.includes(res.name) && (elements.length == 0 || elements.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
        });
        calculatedValue = maxValue;
        if (calculatedValue == -999) {
            calculatedValue = 0;
        }
    }
    item['calculatedValue'] = calculatedValue;
};

// Return true if the two arrays share at least one value
var matches = function(array1, array2) {
    var match = false;
    $(array1).each(function(index, value) {
        if (array2.includes(value)) {
            match = true;
        }
    });
    return match;
};

var includeAll = function(array1, array2) {
    for (var index in array2) {
        if (!array1.includes(array2[index])) {
            return false;
        }
    }
    return true;
};

// Return true if the item is exclusive to something that does not matches the selected unit
var exclusiveForbidAccess = function(item, selectedUnitId) {
    if (item.exclusiveSex && units[selectedUnitId].sex != item.exclusiveSex) {
        return true;
    }
    if (item.exclusiveUnits && !item.exclusiveUnits.includes(selectedUnitId)) {
        return true;
    }
    return false;
}

// Return true if the various fields of the items contains all the searched terms
var containsText = function(text, item) {

    var result = true;
    text.split(" ").forEach(function (token) {
        result = result && item.searchString.match(new RegExp(escapeRegExp(token),'i'));
    });
    return result;
};


// Return true if the item has the required stat
var hasStat = function(stat, item) {
    return item[stat] || item[stat+'%'] || (stat == 'inflict' && (item.element || item.ailments || item.killers)) || (stat == 'resist' && item.resist);
};

// Return true if the item has all the required stats
var hasStats = function(additionalStat, item) {
    var match = true;
    $(additionalStat).each(function(index, addStat) {
        if (!item[addStat] && !item[addStat + '%']) {
            match = false;
        }
    });
    return match;
};

// Return true if the item has at least one access that is not forbidden by filters
var haveAuthorizedAccess = function(forbiddenAccessList, item) {
    var hasAccess = false;
    if (forbiddenAccessList.includes("unitExclusive") && item.exclusiveUnits) {
        return false;
    }
    $(item.access).each(function(index, itemAccess) {
        hasAccess |= isAccessAllowed(forbiddenAccessList, itemAccess);
    });
    return hasAccess;
};

// Return true if one access is not forbidden by filters
var isAccessAllowed = function(forbiddenAccessList, access) {
    var accessAllowed = true;
    $(forbiddenAccessList).each(function (index, accessToSplit) {
        $(accessToSplit.split('/')).each(function(index, forbiddenAccess) {
            if (access.startsWith(forbiddenAccess) || access.endsWith(forbiddenAccess)) {
                accessAllowed = false;
            }
        });
    });
    return accessAllowed;
}

// Escape RegExp special character if the user used them in his search
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


function escapeQuote(string) {
    return String(string).replace(/[']/g, function (s) {
        return "\\'";
    });
}

function addToKiller(killers, newKiller) {
    var race = newKiller.name;
    var physicalPercent = newKiller.physical || 0;
    var magicalPercent = newKiller.magical || 0;
    
    var killerData = null;
    for (var index in killers) {
        if (killers[index].name == race) {
            killerData = killers[index];
            break;
        }
    }
    
    if (!killerData) {
        killerData = {"name":race};
        killers.push(killerData);
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


function getKillerHtml(killers, physicalKillers = killerList, magicalKillers = killerList) {
    var physicalKillerString = "";
    var magicalKillerString = "";
    var killerValues = [];
    var physicalRacesByValue = {};
    var magicalRacesByValue = {};
    for (var i = 0, len = killerList.length; i < len; i++) {
        var race = killerList[i];
        var killerData = null;
        for (var index in killers) {
            if (killers[index].name == race) {
                killerData = killers[index];
                break;
            }
        }
        if (killerData) {
            if (killerData.physical) {
                if (!killerValues.includes(killerData.physical)) {
                    killerValues.push(killerData.physical);
                }
                if (!physicalRacesByValue[killerData.physical]) {
                    physicalRacesByValue[killerData.physical] = [];
                }
                physicalRacesByValue[killerData.physical].push(race);
            }
            if (killerData.magical) {
                if (!killerValues.includes(killerData.magical)) {
                    killerValues.push(killerData.magical);
                }
                if (!magicalRacesByValue[killerData.magical]) {
                    magicalRacesByValue[killerData.magical] = [];
                }
                magicalRacesByValue[killerData.magical].push(race);
            }
        }
    }
    killerValues = killerValues.sort((a, b) => b - a);
    for (var i = 0; i < killerValues.length; i++) {
        if (physicalRacesByValue[killerValues[i]]) {
            physicalKillerString += '<span class="killerValueGroup physical ';
            var imgs = ""
            for (var j = 0; j < physicalRacesByValue[killerValues[i]].length; j++) {
                imgs += '<img src="img/icons/killers/physicalKiller_' + physicalRacesByValue[killerValues[i]][j] + '.png" title="' + physicalRacesByValue[killerValues[i]][j] + '"/>';
                physicalKillerString + physicalRacesByValue[killerValues[i]][j] + " ";
            }
            if (matches(physicalKillers, physicalRacesByValue[killerValues[i]])) {
                physicalKillerString += "selected";
            }
            physicalKillerString += '">' + imgs;
            var killerString;
            if (killerValues[i] > 300) {
                killerString = '<span style="color:red;" title="Only 300% taken into account">' + killerValues[i] + '%</span>';
            } else {
                killerString = killerValues[i] + '%';
            }
            physicalKillerString += killerString + '</span>';
        }
        if (magicalRacesByValue[killerValues[i]]) {
            magicalKillerString += '<span class="killerValueGroup magical ';
            var imgs = ""
            for (var j = 0; j < magicalRacesByValue[killerValues[i]].length; j++) {
                imgs += '<img src="img/icons/killers/magicalKiller_' + magicalRacesByValue[killerValues[i]][j] + '.png" title="' + magicalRacesByValue[killerValues[i]][j] + '"/>';
                magicalKillerString + magicalRacesByValue[killerValues[i]][j] + " ";
            }
            if (matches(magicalKillers, magicalRacesByValue[killerValues[i]])) {
                magicalKillerString += "selected";
            }
            magicalKillerString += '">' + imgs;
            var killerString;
            if (killerValues[i] > 300) {
                killerString = '<span style="color:red;" title="Only 300% taken into account">' + killerValues[i] + '%</span>';
            } else {
                killerString = killerValues[i] + '%';
            }
            magicalKillerString += killerString + '</span>';
        }
    }
    return {"physical" : physicalKillerString, "magical": magicalKillerString}
}

function prepareSearch(data) {
    for (var index in data) {
        var item = data[index];
        var textToSearch = item["name"];

        if (item.jpname) {
            textToSearch += item["jpname"];
        }

        textToSearch += "|" + getStatDetail(item);
        if (item["evade"]) {
            if (item.evade.physical) {
                textToSearch += "|" + "Evade physical " + item.evade.physical + "%";
            }
            if (item.evade.magical) {
                textToSearch += "|" + "Evade magical " + item.evade.magical + "%";
            }
        }
        if (item["resist"]) {
            for (var i = item.resist.length; i--;) {
                textToSearch += "|" + item.resist[i].name;
            }
        }
        if (item["element"]) {
            for (var i = item.element.length; i--;) {
                textToSearch += "|" + item.element[i];
            }
        }
        if (item["ailments"]) {
            for (var i = item.ailments.length; i--;) {
                textToSearch += "|" + item.ailments[i].name;
            }
        }
        if (item["exclusiveUnits"]) {
            textToSearch += "|Only ";
            var first = true;
            for (var i = 0, len = item.exclusiveUnits.length; i < len;i++) {
                if (units[item.exclusiveUnits[i]]) {
                    if (first) {
                        first = false;
                    } else {
                        textToSearch += ", ";
                    }
                    textToSearch += units[item.exclusiveUnits[i]].name;
                }
            }
        }
        if (item["exclusiveSex"]) {
            textToSearch += "|Only " + item["exclusiveSex"];
        }
        if (item["condition"]) {
            textToSearch += "|Only " + item["condition"];
        }
        if (item.mpRefresh) {
            textToSearch += "|Recover MP (" + item.mpRefresh + "%) per turn";
        }
        if (item["special"]) {
            for (var i = 0, len = item.special.length; i < len;i++) {
                textToSearch += "|" + item.special[i];
            }
        }
        if (item.singleWielding) {
            for (var index in baseStats) {
                if (item.singleWielding[baseStats[index]]) {
                    textToSearch += "|" + "Increase equipment " + baseStats[index].toUpperCase() + "(" + item.singleWielding[baseStats[index]] + "%) when single wielding"
                }
            }
        }
        if (item.singleWieldingOneHanded) {
            for (var index in baseStats) {
                if (item.singleWieldingOneHanded[baseStats[index]]) {
                    textToSearch += "|" + "Increase equipment " + baseStats[index].toUpperCase() + "(" + item.singleWieldingOneHanded[baseStats[index]] + "%) when single wielding a one-handed weapon"
                }
            }
        }
        if (item.dualWielding) {
            for (var index in baseStats) {
                if (item.dualWielding[baseStats[index]]) {
                    textToSearch += "|" + "Increase equipment " + baseStats[index].toUpperCase() + "(" + item.dualWielding[baseStats[index]] + "%) when dual wielding"
                }
            }
        }
        if (item.killers) {
            for (var i = 0, len = item.killers.length; i < len;i++) {
                textToSearch += "|killer " + item.killers[i].name;
            }
        }

        if (item.jumpDamage) {
            textToSearch += "|" + "Increase damage dealt by jump attacks by "+ item.jumpDamage + "%";
        }
        if (item.lbFillRate) {
            textToSearch += "|" + "Increase LB gauge fill rate (" + item.lbFillRate + "%)";
        }
        if (item.lbPerTurn) {
            var value;
            if (item.lbPerTurn.min == item.lbPerTurn.max) {
                value = item.lbPerTurn.min;
            } else {
                value = item.lbPerTurn.min + "-" + item.lbPerTurn.max;
            }
            textToSearch += "|" + "Increase LB gauge each turn (" + value + ")";
        }
        if (item.evoMag) {
            textToSearch += "|" + "Increase Esper summon damage by "+ item.evoMag + "%";
        }
        if (item.esperStatsBonus) {
            textToSearch += "|" + "Increase esper's bonus stats ("+ item.esperStatsBonus.hp + "%)";
        }
        if (item["tmrUnit"] && units[item["tmrUnit"]]) {
            textToSearch += "|" + units[item["tmrUnit"]].name;
        }
        if (item["stmrUnit"] && units[item["stmrUnit"]]) {
            textToSearch += "|" + units[item["stmrUnit"]].name;
        }
        for (var index in item.access) {
            textToSearch += "|" + item.access[index];
        }
        if (item.partialDualWield) {
            textToSearch += "|partial dual wield";
            for (var i = 0, len = item.partialDualWield.length; i < len;i++) {
                textToSearch += " " + item.partialDualWield[i];
            }
        }
        item.searchString = textToSearch;
    }
}

function getShortUrl(longUrl, callback) {
    $.ajax({
        url: 'links',
        method: 'POST',
        data: JSON.stringify({"url":longUrl}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            callback(data.url);
        },
        error: function(error) {
            alert('Failed to generate short url. Long url will be used instead');
            callback(longUrl);
        }
    });
}

function getLocalizedFileUrl(name) {
    if (language) {
        name = name + "_" + language;
    }
    name += ".json";
    return server + "/" + name;
}

function onUnitsOrInventoryLoaded() {
    if (itemInventory && ownedUnits && ownedEspers) {
        if (ownedUnits.version && ownedUnits.version < 3) {
            // before version 3, units were : {"unitId": number}
            // After, they are {"unitId": {"number":number,"farmable":number}
            $.get(getLocalizedFileUrl("data"), function(data) {
                $.get(server + "/units.json", function(unitResult) {
                    var allUnitsTmp = unitResult;
                    var tmrNumberByUnitId = {};
                    for (var index = data.length; index--; ) {
                        var item = data[index];
                        if (item.tmrUnit && allUnitsTmp[item.tmrUnit] && itemInventory[item.id]) {
                            tmrNumberByUnitId[item.tmrUnit] = itemInventory[item.id];
                        }
                    }

                    for (var unitId in ownedUnits) {
                        var unitOwned = 0;
                        var tmrOwned = 0;
                        if (ownedUnits[unitId]) { unitOwned = ownedUnits[unitId];}
                        if (tmrNumberByUnitId[unitId]) { tmrOwned = tmrNumberByUnitId[unitId];}
                        ownedUnits[unitId] = {"number":ownedUnits[unitId],"farmable":Math.max(0, unitOwned - tmrOwned)};
                    }
                    var itemCount = Object.keys(itemInventory).length;
                    var unitCount = Object.keys(ownedUnits).length;

                    alert("The unit collection evolved to contains the number of time you own a unit, and the number of TMR of each unit you can still farm. Your data was automatically adapted and saved, but you probably should check the change.");
                    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
                    $("#inventoryDiv .unitsNumber").text(unitCount + " unit" + (unitCount > 0 ? 's' : ''));
                    $("#inventoryDiv .itemsNumber").text(itemCount + " item" + (itemCount > 0 ? 's' : ''));
                    inventoryLoaded();
                    saveUnits();
                }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                    alert( errorThrown );
                });
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                alert( errorThrown );
            });

        } else {
            // Fix older versions/missing data
            for (var index in ownedUnits) {
                if (ownedUnits[index] != "version" && typeof ownedUnits[index] === 'number') {
                    ownedUnits[index] = {"number":ownedUnits[index], "farmable":0};
                }
            }

            updateUnitAndItemCount();

            $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
            inventoryLoaded();
        }
    }
}

function updateUnitAndItemCount() {
    // Count units
    var unitCount = 0;
    Object.keys(ownedUnits).forEach(key => { unitCount += (ownedUnits[key].number || 0) + (ownedUnits[key].sevenStar || 0); });

    // Count items (by slots occupied, not by amount)
    var itemCount = Object.keys(itemInventory).length;
    var enchantedItems = itemInventory["enchantments"];
    if(enchantedItems) {
        // Remove the "enchantments" key that was counted in the length above
        itemCount -= 1;

        // Add every enhancement, if it exists in items (old bug, remove this check after a reasonable amount of time when all saved data has already been fixed)
        Object.keys(enchantedItems).forEach(enchantment => itemInventory[enchantment] ? itemCount += enchantedItems[enchantment].length : 0);
    }

    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
    $("#inventoryDiv .unitsNumber").text(unitCount + " unit" + (unitCount > 0 ? 's' : ''));
    $("#inventoryDiv .itemsNumber").text(itemCount + " item" + (itemCount > 0 ? 's' : ''));
}

function showTextPopup(title, text) {
    $('<div id="showBuilderSetupLinkDialog" title="' + title +'">' +
        '<textarea style="width:100%;" rows="12">' + text + '</textarea>' +
      '</div>' ).dialog({
        modal: true,
        open: function(event, ui) {
            $(this).parent().css('position', 'fixed');
            $(this).parent().css('top', '150px');
            $("#showBuilderSetupLinkDialog input").select();
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    $("#showBuilderSetupLinkDialog input").after("<div>Copied to clipboard<div>");
                } else {
                    console.log('Oops, unable to copy');
                }
            } catch (err) {
                console.log('Oops, unable to copy');
            }
        },
        width: (($(window).width() > 600) ? 600: $(window).width())
    });
}

function isLinkId(value) {
    return value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}

function saveUserData(mustSaveInventory, mustSaveUnits, mustSaveEspers = false) {
    if (saveTimeout) {clearTimeout(saveTimeout)}
    $("#inventoryDiv").addClass("Inventoryloading").removeClass("Inventoryloaded");
    saveNeeded = false;
    if (mustSaveInventory) {
        if (mustSaveUnits) {
            saveInventory(
                function() {
                    saveUnits(saveSuccess, saveError);
                }
            );
        } else {
            saveInventory(saveSuccess, saveError);
        }
    } else if (mustSaveUnits) {
        saveUnits(saveSuccess, saveError);
    } else if (mustSaveEspers) {
        saveEspers(saveSuccess, saveError);
    }
}

function saveSuccess() {
    if (mustSaveInventory) {
        mustSaveInventory = false;
    }
    if (mustSaveUnits) {
        mustSaveUnits = false;
    }
    if (mustSaveEspers) {
        mustSaveEspers = false;
    }
    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
    updateUnitAndItemCount();
    $.notify("Data saved", "success");
}

function saveError() {
    $("#inventoryDiv").removeClass("Inventoryloading").addClass("Inventoryloaded");
    if (error.status == 401) {
        alert('You have been disconnected. The data was not saved. The page will be reloaded.');
        window.location.reload();
    } else {
        saveNeeded = true;
        alert('error while saving the user data. Please click on "Save" to try again');
    }
}

function sanitizeItemInventory() {
    // Sanitize inventory by removing non-existing enchantments
    var enchantments = itemInventory["enchantments"];
    Object.keys(enchantments || {}).forEach(enchantment => { if(!itemInventory[enchantment]) delete enchantments[enchantment]; });
}

function saveInventory(successCallback, errorCallback) {
    sanitizeItemInventory();

    $.ajax({
        url: server + '/itemInventory',
        method: 'PUT',
        data: JSON.stringify(itemInventory),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: errorCallback
    });
}

 function saveUnits(successCallback, errorCallback) {
    $.ajax({
        url: server + '/units',
        method: 'PUT',
        data: JSON.stringify(ownedUnits),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: errorCallback
    });
}

 function saveEspers(successCallback, errorCallback) {
    $.ajax({
        url: server + '/espers',
        method: 'PUT',
        data: JSON.stringify(ownedEspers),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: successCallback,
        error: errorCallback
    });
}

function getStaticData(name, localized, callback) {
    if (localized) {
        name = getLocalizedFileUrl(name);
    } else {
        name = server + "/" + name + ".json";
    }
    var dataString = localStorage.getItem(name);
    if (dataString) {
        callback(JSON.parse(dataString));
    } else {
        $.get(name, function(result) {
            localStorage.setItem(name, JSON.stringify(result));
            var savedFiles = JSON.parse(localStorage.getItem("savedFiles"));
            if (!savedFiles.includes(name)) {
                savedFiles.push(name);
                localStorage.setItem("savedFiles", JSON.stringify(savedFiles));
            }
            callback(result);
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });    
    }
    
}

$(function() {
    readUrlParams();
    $.get(server + '/dataVersion.json', function(result) {
        var dataVersion = result.version;
        var selectedLanguage = language;
        if (!selectedLanguage) {
            selectedLanguage = "en";
        }
        var storedDataVersion = localStorage.getItem("dataVersion");
        if (storedDataVersion) {
            var goodVersion = true;
            if (!storedDataVersion.startsWith("{")) {
                goodVersion = false;
            } else {
                var storedDataVersion = JSON.parse(storedDataVersion);
                if (storedDataVersion.version < dataVersion || storedDataVersion.server != server || storedDataVersion.language != selectedLanguage) {
                    goodVersion = false;
                }
            }
            
            if (!goodVersion) {
                var savedFilesString = localStorage.getItem("savedFiles");
                if (savedFilesString) {
                    var savedFiles = JSON.parse(savedFilesString);
                    for (var index = savedFiles.length; index--;) {
                        localStorage.removeItem(savedFiles[index]);
                    }
                }
                localStorage.setItem("dataVersion", JSON.stringify({"version":dataVersion, "server":server, "language":selectedLanguage}));
                localStorage.setItem("savedFiles", "[]");
            }
        } else {
            localStorage.setItem("dataVersion", JSON.stringify({"version":dataVersion, "server":server, "language":selectedLanguage}));
            localStorage.setItem("savedFiles", "[]");
        }
        startPage();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    if (window.location.href.indexOf("&o") > 0 || window.location.href.indexOf("?o") > 0) {
        notLoaded();
    } else {
        $.get(server + '/itemInventory', function(result) {
            itemInventory = result;
            if (!itemInventory.enchantments) {
                itemInventory.enchantments = {};
            }
            sanitizeItemInventory();
            onUnitsOrInventoryLoaded();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
            if (notLoaded) {
                notLoaded();
            }
        });
        $.get(server + '/settings', function(result) {
            userSettings = result;
        });
        $.get(server + '/units', function(result) {
            ownedUnits = result;
            if (result.version && result.version == 3) {
                getStaticData("units", false, function(allUnitResult) {
                    for (var unitSerieId in allUnitResult) {
                        var unit = allUnitResult[unitSerieId];
                        var maxUnitId = unitSerieId.substr(0, unitSerieId.length-1) + unit.max_rarity;
                        if (ownedUnits[maxUnitId]) {
                            ownedUnits[unitSerieId] = ownedUnits[maxUnitId];
                            delete ownedUnits[maxUnitId];
                        }
                    }
                    ownedUnits.version = 4;
                    saveUnits(
                        function() {
                            $.notify("Owned units data successfuly migrated to v4", "success");
                            onUnitsOrInventoryLoaded();
                        },
                        function() {
                            alert("an error occured when trying to upgrade your unit data to version 4. Please report the next message to the administrator");
                            alert( errorThrown );
                        }
                    );
                });
            } else {
                onUnitsOrInventoryLoaded();
            }


        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
            if (notLoaded) {
                notLoaded();
            }
        });
        $.get(server + '/espers', function(result) {
            ownedEspers = result;
            onUnitsOrInventoryLoaded();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            $("#inventoryDiv").removeClass("Inventoryloading Inventoryloaded");
            if (notLoaded) {
                notLoaded();
            }
        });
    }
    $('.dropdown-submenu a.test').on("click", function(e){
        $(this).parent().siblings().each(function(index, element) {
            $(element).children('ul').hide();
        });
        $(this).next('ul').toggle();
        e.stopPropagation();
        e.preventDefault();
    });

    /* Back to top button feature */
    var $scroll = $('#scrollToTopButton');
    if ($scroll) {
        // Detect when user start to scroll down
        $(window).scroll($.debounce(100, function(){ 
            if ($(this).scrollTop() > 100) { 
                $scroll.fadeIn(200);
            } else { 
                $scroll.fadeOut(200);
            } 
        }));

        // Back to top when clicking on link
        $scroll.click(function(){ 
            $("html, body").animate({ scrollTop: 0 }, 400); 
            return false; 
        }); 
    }
});
