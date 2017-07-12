var wikiBaseUrl = "http://exvius.gamepedia.com/";
var data;
var baseStat = 180;
var filters = ["types","elements","ailments","killers","accessToRemove","additionalStat"];
var elementList = ['fire','ice','lightning','water','earth','wind','light','dark'];
var ailmentList = ['poison','blind','sleep','silence','paralysis','confuse','disease','petrification'];

var stat = '';
var types = [];
var elements = [];
var ailments = [];
var killers = [];
var accessToRemove = [];
var additionalStat = [];
var searchText = '';

var update = function() {
    
    stat = getSelectedValuesFor("stat");
    searchText = $("#searchText").val();
    stat = stat[0] || '';
    baseStat = parseInt($("#baseStat").val());
    if (isNaN(baseStat)) {
        if (stat == 'hp') {
            baseStat=3500;
            $("#baseStat").attr("placeholder", 3500);
        } else {
            baseStat=180;
            $("#baseStat").attr("placeholder", 180);
        }
        
    }

    types = getSelectedValuesFor("types");
    elements = getSelectedValuesFor("elements");
    ailments = getSelectedValuesFor("ailments");
    killers = getSelectedValuesFor("killers");
    accessToRemove = getSelectedValuesFor("accessToRemove");
    additionalStat = getSelectedValuesFor("additionalStat");
    $(filters).each(function(index, filter) {
        $("."+ filter + " .unselectAll").toggleClass("hidden", window[filter].length == 0); 
    });
    $(".stat .unselectAll").toggleClass("hidden", stat.length == 0); 
    
    if (stat.length == 0 && searchText.length == 0 && types.length == 0 && elements.length == 0 && ailments.length == 0 && killers == 0 && accessToRemove.length == 0 && additionalStat.length == 00) {
        $("#results tbody").html("");
        $("#results").addClass("notSorted");
        $("#resultNumber").html("Add filters to see results");
        modifyUrl();
        return;
    }
    if (stat.length != 0) {
        $("#statTitle").text(stat);    
        $("#results").removeClass("notSorted");
    } else {
        $("#results").addClass("notSorted");
    }
    
    displayItems(sort(filter()));
    modifyUrl();
    $("#results").unmark({
        done: function() {
            if (searchText && searchText.length != 0) {
                searchText.split(" ").forEach(function (token) {
                    $("#results").mark(token);
                });
            }
        }
    });
}

var modifyUrl = function() {
    var state = {
    };
    if (stat && stat.length != 0) {
        state.stat = stat;
    }
    $(filters).each(function (index, filter) {
        if (window[filter].length != 0) {
            state[filter] = window[filter];
        }
    });
    if (searchText && searchText.length != 0) {
        state.search = searchText;
    }
    window.location.hash = '#' + JSON.stringify(state);
};

var displayItems = function(items) {
    var html = "";
    $(items).each(function (index, item){
        html += "<tr>";
        
        // name
        html += '<td><a href="' + toUrl(item.name) + '">' + item.name + "</a><div class='detail'>" + getStatDetail(item) + "</div></td>";
        
        // value
        html += "<td class='value sort'>" + item.calculatedValue;
        if (stat == 'inflict' || stat == 'evade' || stat == 'resist') {
            html += '%';
        }
        html += "</td>";
        
        // type
        html += "<td><img src='img/" + item.type + ".png'></img></td>";
        
        // special
        html += "<td>";
        
        
        if (item.element) {
            html += "<img class='miniIcon' src='img/sword.png'></img><img src='img/" + item.element + ".png'></img>"
        }
        if (item.ailments) {
            $(item.ailments).each(function(index, ailment) {
                html += "<div class='noWrap'><img class='miniIcon' src='img/sword.png'></img><img class='imageWithText' src='img/" + ailment.name + ".png'></img>" + ailment.percent + "%</div>";
            });
        }
        if (item.resist) {
            $(item.resist).each(function(index, resist) {
                html += "<div class='noWrap";
                if ((elementList.includes(resist.name) && elements.length != 0 && !elements.includes(resist.name)) || (ailmentList.includes(resist.name) && ailments.length != 0 && !ailments.includes(resist.name))) {
                    html += " notSelected";
                }
                html += "'><img class='miniIcon' src='img/heavyShield.png'></img><img class='imageWithText' src='img/" + resist.name + ".png'></img>" + resist.percent + "%</div>";
            });
        }
        
        if (item.killers) {
            $(item.killers).each(function(index, killer) {
                html += "<div class='noWrap";
                if (killers.length != 0 && !killers.includes(killer.name)) {
                    html += " notSelected";
                }
                html += "'><img class='imageWithText' src='img/killer.png'></img>" + killer.name + " " + killer.percent + "%</div>";
            });
        }
        var special = "";
        if (item.evade) {
            special += "<li>Evade " + item.evade + "%</li>";
        }
        
        if (item.special) {
            $(item.special).each(function(index, itemSpecial) {
                special += "<li>" + toHtml(itemSpecial) + "</li>";
            });
        }
        if (special.length != 0) {
            html += "<ul>" + special + "<ul>";
        }
        html += "</td>";
        
        //access
        html += "<td>";
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
        if (item.exclusive) {
            html += "<div class='exclusive'>" + toHtml('Only '+ item.exclusive) + "</div>";
        }
        html += "</td>";
        html += "</tr>";
    });
    $("#results tbody").html(html);
    $("#resultNumber").html(items.length);
};

var filter = function() {
    var result = [];
    data.each(function(index, item) {
        if (types.length == 0 || types.includes(item.type)) {
            if (elements.length == 0 || elements.includes(item.element) || (elements.includes("noElement") && !item.element) || (item.resist && matches(elements, item.resist.map(function(resist){return resist.name;})))) {
                if (ailments.length == 0 || (item.ailments && matches(ailments, item.ailments.map(function(ailment){return ailment.name;}))) || (item.resist && matches(ailments, item.resist.map(function(res){return res.name;})))) {
                    if (killers.length == 0 || (item.killers && matches(killers, item.killers.map(function(killer){return killer.name;})))) {
                        if (accessToRemove.length == 0 || haveAuthorizedAccess(accessToRemove, item.access)) {
                            if (additionalStat.length == 0 || hasStats(additionalStat, item)) {
                                if (searchText.length == 0 || containsText(searchText, item)) {
                                    if (stat.length == 0 || hasStat(stat, item)) {
                                        calculateValue(item, stat, ailments, elements, killers);
                                        result.push(item);
                                    }
                                }
                            }
                        } 
                    }
                }
            }
        }
    })
    return result;
};

var sort = function(items) {
    return items.sort(function (item1, item2){
        return item2.calculatedValue - item1.calculatedValue;
    });
};

var getSelectedValuesFor = function(type) {
    var values = [];
        $('.active input[name='+ type +']').each(function() {
            values.push($(this).val());
        });
    return values;
};

var matches = function(array1, array2) {
    var match = false;
    $(array1).each(function(index, value) {
        if (array2.includes(value)) {
            match = true;
        }
    });
    return match;
};

var containsText = function(text, item) {
    var textToSearch = item["name"] + "|" + getStatDetail(item);
    if (item["resist"]) {
        $(item["resist"]).each(function (index, resist) {
            textToSearch += "|" + resist.name;
        });
    }
    if (item["ailments"]) {
        $(item["ailments"]).each(function (index, ailment) {
            textToSearch += "|" + ailment.name;
        });
    }
    if (item["exclusive"]) {
        textToSearch += "|" + item["exclusive"]; 
    }
    if (item["special"]) {
        $(item["special"]).each(function (index, special) {
            textToSearch += "|" + special;
        });
    }
    if (item["tmrUnit"]) {
        textToSearch += "|" + item["tmrUnit"]; 
    }
    var result = true;
    text.split(" ").forEach(function (token) {
        result = result && textToSearch.match(new RegExp(escapeRegExp(token),'i'));
    });
    return result;
};

var nameContainsText = function(text, item) {
    return item["name"].match('/'+ escapeRegExp(text) + '/i');
};
var specialContainsText = function(text, item) {
    return string.match('/'+ escapeRegExp(text) + '/i');
};
var exclusiveContainsText = function(text, item) {
    return item["eclusive"] && item["eclusive"].match('/'+ escapeRegExp(text) + '/i');
};

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

var hasStat = function(stat, item) {
    return item[stat] || item[stat+'%'] || (stat == 'inflict' && (item.element || item.ailments || item.killers)) || (stat == 'resist' && item.resist);
};

var hasStats = function(additionalStat, item) {
    var match = true;
    $(additionalStat).each(function(index, addStat) {
        if (!item[addStat] && !item[addStat + '%']) {
            match = false;
        }
    });
    return match;
};

var haveAuthorizedAccess = function(forbiddenAccessList, itemAccesses) {
    var hasAccess = false;
    $(itemAccesses).each(function(index, itemAccess) {
        hasAccess |= isAccessAllowed(forbiddenAccessList, itemAccess);
    });
    return hasAccess;
};

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
};

var calculateValue = function(item) {
    var calculatedValue = 0;
    if (item[stat]) {
        calculatedValue = item[stat];
    } 
    if (item[stat + '%']) {
        calculatedValue += item[stat+'%'] * baseStat / 100;
    }
    if (stat == 'inflict' && (item.ailments || item.killers)) {
        var maxValue = 0;
        $(item.ailments).each(function(index, ailment) {
            if ((ailments.length == 0 || ailments.includes(ailment.name)) && ailment.percent > maxValue) {
                maxValue = ailment.percent;
            }
        });
        $(item.killers).each(function(index, killer) {
            if ((killers.length == 0 || killers.includes(killer.name)) && killer.percent > maxValue) {
                maxValue = killer.percent;
            }
        });
        calculatedValue = maxValue;
    }
    if (stat == 'resist' && (item.resist)) {
        var maxValue = 0;
        $(item.resist).each(function(index, res) {
            if (ailmentList.includes(res.name) && (ailments.length == 0 || ailments.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
            if (elementList.includes(res.name) && (elements.length == 0 || elements.includes(res.name)) && res.percent > maxValue) {
                maxValue = res.percent;
            }
        });
        calculatedValue = maxValue;
    }
    $(item).attr('calculatedValue', calculatedValue);
};

var getStatDetail = function(item) {
    var detail = "";
    var stats = ['hp', 'mp', 'atk', 'def', 'mag', 'spr'];
    var first = true;
    $(stats).each(function(index, stat) {
        var statNotSelected = additionalStat.length != 0 && !additionalStat.includes(stat) && stat != window["stat"];
        if (statNotSelected) {
            detail += "<span class='notSelected'>";
        }
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
        if (statNotSelected) {
            detail += "</span>";
        }
    });
    return detail;
};

var toHtml = function(text) {
    var textWithAddedAnchors = text.replace(/(\[[^\]]*\])/g, function(v) {
        var vWithoutBrace = v.substring(1, v.length - 1); 
        return "<a href='"+ toUrl(vWithoutBrace) +"'>"+vWithoutBrace+"</a>"; 
    });
    return "<span>" + textWithAddedAnchors +"</span>";
};

var toUrl = function(name) {
    return wikiBaseUrl + name.replace(' ', '_');
};

function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ( (charCode > 31 && charCode < 48) || charCode > 57) {
        return false;
    }
    return true;
};

function unselectAll(type) {
    $('.active input[name='+ type +']').each(function(index, checkbox) {
        $(checkbox).prop('checked', false);
        $(checkbox).parent().removeClass('active');
    });
    update();
};

function loadHash() {
    if (window.location.hash != '') {
        var state = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
        if (state.stat) {
            $("input[name='stat'][value='"+ state.stat +"']").each(function(index, checkbox) {
                $(checkbox).prop('checked', true);
                $(checkbox).parent().addClass('active');
            });
        }
        if (state.search) {
            $("#searchText").val(state.search);
        }
        $(filters).each(function (index, filter) {
            if (state[filter]) {
                select(filter, state[filter]);
            }
        });
    }
};

function select(type, values) {
    $(values).each(function (index, value) {
        $("input[name='"+ type +"'][value='"+ value +"']").each(function(index, checkbox) {
            $(checkbox).prop('checked', true);
            $(checkbox).parent().addClass('active');
        });
    }) ;
};

$(function() {
    $('.choice input').change(function() {
        update();
    });
    $("#baseStat").on("input", update);
    $("#searchText").on("input", $.debounce(300,update));
    
    
    $.get("data.json", function(result) {
        data = $(result);
        loadHash();
        update();
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
});
