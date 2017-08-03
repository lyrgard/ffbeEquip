var wikiBaseUrl = "http://exvius.gamepedia.com/";

var data;
var units;
var stat = '';
var types = [];
var elements = [];
var ailments = [];
var killers = [];
var accessToRemove = [];
var additionalStat = [];
var searchText = '';
var selectedUnit = '';
var baseStats = ['hp','mp','atk','def','mag','spr'];
var filters = ["types","elements","ailments","killers","accessToRemove","additionalStat"];
var elementList = ['fire','ice','lightning','water','earth','wind','light','dark'];
var ailmentList = ['poison','blind','sleep','silence','paralysis','confuse','disease','petrification'];
var killerList = ['aquatic','beast','bird','bug','demon','dragon','human','machine','plant','undead','stone','spirit'];
var typeList = ["dagger", "sword", "greatSword", "katana", "staff", "rod", "bow", "axe", "hammer", "spear", "harp", "whip", "throwing", "gun", "mace", "fist", "lightShield", "heavyShield", "hat", "helm", "clothes", "robe", "lightArmor", "heavyArmor", "accessory", "materia"];
var accessList = ["shop","chest","quest","trial","chocobo","event","colosseum","key","TMR-1*","TMR-2*","TMR-3*","TMR-4*","TMR-5*","recipe-shop","recipe-chest","recipe-quest","recipe-event","recipe-colosseum","recipe-key","trophy","recipe-trophy"];

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
        html += "<div class='specialImg noWrap killer-" + killer.name + "'><img class='imageWithText' src='img/killer.png'></img>" + killer.name + " " + killer.percent + "%</div>";
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
        html += '<a href="' + toUrl(exclusiveUnit) + '">' + exclusiveUnit + '</a>';
    });
    html += "</div>";
    return html;
}
function getSpecialHtml(item) {
    var special = "";
    $(item.special).each(function(index, itemSpecial) {
        if (itemSpecial != "twoHanded" && itemSpecial != "notStackable") {
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
    html += '<div class="td name"><a href="' + toUrl(item.name) + '">' + item.name + "</a>";
    if (item.outclassedBy) {
        html += '<img src="img/gil.png" class="outclassedByIcon" title="Can be sold. Strictly outclassed by ' + item.outclassedBy + '"></img>';
    }
    html += "<div class='detail'>" + getStatDetail(item) + "</div></div>";

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
    if (item.evade) {
        special += "<li>Evade " + item.evade + "%</li>";
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
        html += '<div><a href="' + toUrl(item.tmrUnit) + '">' + item.tmrUnit + '</a></div>';
    }
    if (item.exclusiveUnits) {
        html += getExclusiveUnitsHtml(item);
    }
    if (item.exclusiveSex) {
        html += "<div class='exclusive'>Only " + item.exclusiveSex + "</div>";
    }
    if (item.condition) {
        html += "<div class='exclusive'>" + toHtml(item.condition) + "</div>";
    }
    html += "</div>";
    return html;
}

// Some field in the data can use a special syntax to display link to the wiki. This is done by using brace ( blabla [name] blabla). This replace the parts inside braces by html links.
var toHtml = function(text) {
    var textWithAddedAnchors = text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1); 
        return "<a href='"+ toUrl(vWithoutBrace) +"'>"+vWithoutBrace+"</a>"; 
    });
    return "<span>" + textWithAddedAnchors +"</span>";
};

// Return the wiki url corresponding to the name
var toUrl = function(name) {
    return wikiBaseUrl + name.replace(' ', '_');
};

// Function used to know if a keyboard key pressed is a number, to prevent non number to be entered
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( (charCode > 31 && charCode < 48) || charCode > 57) {
        return false;
    }
    return true;
};

function isEnter(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    return charCode == 13;
};