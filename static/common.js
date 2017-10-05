var wikiBaseUrl = "http://exvius.gamepedia.com/";

var data;
var units;
var itemInventory;
var stat = '';
var types = [];
var elements = [];
var ailments = [];
var killers = [];
var accessToRemove = [];
var additionalStat = [];
var searchText = '';
var selectedUnit = '';
var server = "GL";
var baseStats = ['hp','mp','atk','def','mag','spr'];
var filters = ["types","elements","ailments","killers","accessToRemove","additionalStat"];
var elementList = ['fire','ice','lightning','water','earth','wind','light','dark'];
var ailmentList = ['poison','blind','sleep','silence','paralysis','confuse','disease','petrification'];
var killerList = ['aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit'];
var typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"];
var weaponList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist"];
var shieldList = ["lightShield", "heavyShield"];
var headList = ["hat", "helm"];
var bodyList = ["clothes", "robe", "lightArmor", "heavyArmor"];
var accessList = ["shop","chest","quest","trial","chocobo","event","colosseum","key","TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*","recipe-shop","recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key","trophy","recipe-trophy","premium"];

function getElementHtml(element) {
    return "<div class='specialImg'><img class='miniIcon' src='img/sword.png'></img><img src='img/" + element + ".png'></img></div>"
}

function getAilmentsHtml(item) {
    var html = "";
    $(item.ailments).each(function(index, ailment) {
        html += "<div class='specialImg noWrap ailment-" + ailment + "'><img class='miniIcon' src='img/sword.png'></img><img class='imageWithText' src='img/" + ailment.name + ".png'></img>" + ailment.percent + "%</div>";
    });
    return html;
}
function getResistHtml(item) {
    var html = "";
    $(item.resist).each(function(index, resist) {
        html += "<div class='specialImg noWrap resist-" + resist.name + "'><img class='miniIcon' src='img/heavyShield.png'></img><img class='imageWithText' src='img/" + resist.name + ".png'></img>" + resist.percent + "%</div>";
    });
    return html;
}
function getKillersHtml(item) {
    var html = "";
    $(item.killers).each(function(index, killer) {
        if (killer.physical) {
            html += "<div class='specialImg noWrap killer-" + killer.name + "'><img class='miniIcon' src='img/sword.png'></img><img class='imageWithText' src='img/killer.png'></img>" + killer.name + " " + killer.physical + "%</div>";    
        }
        if (killer.magical) {
            html += "<div class='specialImg noWrap killer-" + killer.name + "'><img class='miniIcon' src='img/rod.png'></img><img class='imageWithText' src='img/killer.png'></img>" + killer.name + " " + killer.magical + "%</div>";
        }
    });
    return html;
}
function getExclusiveUnitsHtml(item) {
    html = "<div class='exclusive'>Only ";
    var first = true;
    $(item.exclusiveUnits).each(function(index, exclusiveUnit) {
        if (first) {
            first = false;
        } else {
            html += ", ";
        }
        html += toLink(exclusiveUnit);
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
    $(baseStats).each(function(index, stat) {
        detail += "<span class='" + stat + "'>";
        
        if (item[stat]) {
            if (first) {
                first = false;
            } else {
                detail += ', ';
            }
            detail += stat + '+' + item[stat];
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

function getEquipedConditionHtml(item) {
    var conditions = "";
    var first = true;
    for(var equipedConditionsIndex in item.equipedConditions) {
        if (first) {
            first = false;
        } else {
            conditions += " and ";
        }
        conditions += "<img src='img/" + item.equipedConditions[equipedConditionsIndex] + ".png'></img>";
    }
    return "<div class='exclusive'>If equiped with " + conditions + "</div>";
}

function displayItemLine(item) {
    html = "";
    // type
    html += '<div class="td type">';
    if (item.special && item.special.includes("notStackable")) {
        html += "<img class='miniIcon left' src='img/notStackable.png' title='Not stackable'>";
    }
    if (item.special && item.special.includes("twoHanded")) {
        html += "<img class='miniIcon left' src='img/twoHanded.png' title='Two-handed'>";
    }
    html += "<img src='img/" + item.type + ".png'></img></div>";

    // name
    html += '<div class="td name"><div>' + toLink(item.name);
    if (item.outclassedBy) {
        html += '<img src="img/gil.png" class="outclassedByIcon" title="Can be sold. Strictly outclassed by ' + item.outclassedBy + '"></img>';
    }
    html += "</div>";
    if (item.jpname) {
        html += '<div>' + item.jpname + "</div>";
    }
    html += "<div class='detail'>" + getStatDetail(item) + "</div>"
    if (item.userPseudo) {
        html += "<div class='userPseudo'>item added by " + item.userPseudo + "</div>"
    }
    html += "</div>";

    // value
    html += '<div class="td value sort">' + item.calculatedValue;
    if (stat == 'inflict' || stat == 'evade' || stat == 'resist') {
        html += '%';
    }
    html += "</div>";



    // special
    html += '<div class="td special">';

    if (item.element) {
        html += getElementHtml(item.element);
    }
    if (item.ailments) {
        html += getAilmentsHtml(item);
    }
    if (item.resist) {
        html += getResistHtml(item);
    }

    if (item.killers) {
        html += getKillersHtml(item);
    }
    var special = "";
    if (item.special && item.special.includes("dualWield")) {
        special += "<li>" + toHtml("[Dual Wield]") + "</li>";
    }
    if (item.partialDualWield) {
        special += "<li>" + toHtml("[Dual Wield] of ")
        for (var index in item.partialDualWield) {
            special += "<img src='img/" + item.partialDualWield[index] + ".png'></img>";
        }
        special += "</li>";
    }
    if (item.allowUseOf) {
        special += "<li>Allow use of <img src='img/" + item.allowUseOf + ".png'></img></li>";
    }
    if (item.evade) {
        if (item.evade.physical) {
            special += "<li>Evade physical attacks " + item.evade.physical + "%</li>";    
        }
        if (item.evade.magical) {
            special += "<li>Evade magical attacks " + item.evade.magical + "%</li>";    
        }
    }
    if (item.doubleHand) {
        special += "<li>Increase equipment ATK (" + item.doubleHand + "%) when single wielding</li>";
    }

    if (item.accuracy) {
        special += "<li>Increase Accuracy: " + item.accuracy + "%</li>";
    }
    if (item.damageVariance) {
        special += "<li>Damage variance from x" + item.damageVariance.min + " to x"  + item.damageVariance.max + " (average : x" + (item.damageVariance.min + item.damageVariance.max)/2 + ")</li>";
    }
    if (item.special) {
        special += getSpecialHtml(item);
    }
    if (special.length != 0) {
        html += "<ul>" + special + "<ul>";
    }
    html += "</div>";


    //access
    html += '<div class="td access">';
    $(item.access).each(function(index, itemAccess) {
        html += "<div"; 
        if (accessToRemove.length != 0 && !isAccessAllowed(accessToRemove, itemAccess)) {
            html += " class='notSelected forbiddenAccess'";
        }
        html += ">" + itemAccess + "</div>"; 
    });
    if (item.tmrUnit) {
        html += '<div>' + toLink(item.tmrUnit) + '</div>';
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
    if (server == "GL") {
        var textWithAddedAnchors = text.replace(/(\[[^\]]*\])/g, function(v) {
            var vWithoutBrace = v.substring(1, v.length - 1); 
            return "<a href='"+ toUrl(vWithoutBrace) +"'>"+vWithoutBrace+"</a>"; 
        });
        return "<span>" + textWithAddedAnchors +"</span>";
    } else {
        return "<span>" + text +"</span>";
    }
};

// Return the wiki url corresponding to the name
var toUrl = function(name) {
    return wikiBaseUrl + name.replace(' ', '_');
};

var toLink = function(text) {
    if (server == "GL") {
        return '<a href="' + toUrl(text) + '">' + text + '</a>';
    } else {
        return "<span>" + text + "</span>";
    }
}

// Function used to know if a keyboard key pressed is a number, to prevent non number to be entered
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( (charCode > 31 && charCode < 48) || charCode > 57) {
        return false;
    }
    return true;
};

function isNumberOrMinus(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( (charCode > 31 && charCode < 45) || (charCode > 54 && charCode < 48) || charCode > 57) {
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


// Add text choices to a filter. Type can be 'radio' of 'checkbox', depending if you want only one selection, or allow many.
function addTextChoicesTo(targetId, type, valueMap) {
	var target = $("#" + targetId);
	for (var key in valueMap) {
		addTextChoiceTo(target, targetId, type, valueMap[key], key);
	}
}

// Add image choices to a filter.
function addImageChoicesTo(targetId, valueList) {
	var target = $("#" + targetId);
	for (i = 0; i < valueList.length; i++) {
		addImageChoiceTo(target, targetId, valueList[i]);
	}
}

// Add one text choice to a filter
function addTextChoiceTo(target, name, type, value, label) {
	target.append('<label class="btn btn-default"><input type="' + type +'" name="' + name + '" value="'+value+'" autocomplete="off">'+label+'</label>');
}

// Add one image choice to a filter
function addImageChoiceTo(target, name, value) {
	target.append('<label class="btn btn-default"><input type="checkbox" name="' + name + '" value="'+value+'" autocomplete="off"><img src="img/'+value+'.png"/></label>');
}

function loadInventory() {
    $.get('googleOAuthUrl', function(result) {
        $('<div id="dialog" title="Authentication">' + 
            '<h4>You\'ll be redirected to a google authentication page</h4><h5>This site is using <a href="https://en.wikipedia.org/wiki/OAuth" target="_blank">OAuth2 <span class="glyphicon glyphicon-question-sign"/></a> to access the stored inventory data, so it will never know your google login and password.</h5>' +
            '<h5>The data is stored on the secure FFBE Equip <a href="https://developers.google.com/drive/v3/web/appdata" target="_blank">app folder on Google Drive <span class="glyphicon glyphicon-question-sign"/></a>. FFBE Equip can only access this folder, and no personal file.</h5>' +
          '</div>' ).dialog({
            modal: true,
            open: function(event, ui) {
                $(this).parent().css('position', 'fixed');
            },
            position: { my: 'top', at: 'top+150' },
            buttons: {
                Ok: function() {
                    window.location.href = result.url;
                }
            }
        });
        
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
}

function logOut() {
    delete_cookie("googleOAuthAccessToken", "/", window.location.hostname);
    window.location.reload();
}

function delete_cookie( name, path, domain ) {
    document.cookie = name + "=" +
        ((path) ? ";path="+path:"")+
        ((domain)?";domain="+domain:"") +
        ";expires=Thu, 01 Jan 1970 00:00:01 GMT";

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

function switchTo(newServer) {
    if (newServer != server) {
        var serverParam = "";
        if (newServer == "JP") {
            serverParam = "?server=JP";
        }
        window.location.href = window.location.protocol + "//" + window.location.host + window.location.pathname + serverParam + window.location.hash;
    }
}

function getItemInventoryKey() {
    if (server == "JP") {
        return "name";
    } else {
        return "id";
    }
}

function readServerType() {
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
    if (server == "GL") {
        $(".switchServer .GL").addClass("btn-primary").removeClass("notSelected");
        $(".switchServer .JP").removeClass("btn-primary").addClass("notSelected");
        $(".jpWarning").addClass("hidden");
    } else {
        $(".switchServer .JP").addClass("btn-primary").removeClass("notSelected");
        $(".switchServer .GL").removeClass("btn-primary").addClass("notSelected");
        $(".jpWarning").removeClass("hidden");
    }
    updateLinks();
}

function updateLinks() {
    var serverParam = "";
    if (server == "JP") {
        serverParam = "?server=JP";
    } else {
        $("#linkToContribute").addClass("hidden");
    }
    $("#linkToSearch").prop("href","index.html" + serverParam);
    $("#linkToBuilder").prop("href","builder.html" + serverParam);
    $("#linkToContribute").prop("href","contribute.html" + serverParam);
}

$(function() {
    readServerType();
    $.get(server + '/itemInventory', function(result) {
        itemInventory = result;
        $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items)");
        $("#inventoryDiv .loader").addClass("hidden");
        $(".logOut").removeClass("hidden");
        inventoryLoaded();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $(".loadInventory").removeClass("hidden");
        $("#inventoryDiv .status").text("not loaded");
        $("#inventoryDiv .loader").addClass("hidden");
    });
});