var wikiBaseUrl = "http://exvius.gamepedia.com/";

var data;
var units;
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