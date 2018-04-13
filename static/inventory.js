var equipments;
var materia;
var lastItemReleases;
var allUnits;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#inventory").removeClass("hidden");
    $("#searchBox").addClass("hidden");
    $("#itemCount").addClass("hidden");
    $("#materiaCount").addClass("hidden");
    
    $(".nav-tabs li.equipment").removeClass("active");
    $(".nav-tabs li.materia").removeClass("active");
    $(".nav-tabs li.search").removeClass("active");
    $(".nav-tabs li.history").removeClass("active");
    $(".nav-tabs li.settings").removeClass("active");
}

function showMateria() {
    beforeShow();
    
    $(".nav-tabs li.materia").addClass("active");
    $("#sortType").text("Sorted by Name");
    $("#materiaCount").removeClass("hidden");
    // filter, sort and display the results
    $("#results").html(displayItems(sort(materia)));
}

function showEquipments() {
    beforeShow();
    
    $(".nav-tabs li.equipment").addClass("active");
    $("#sortType").text("Sorted by Type (Strength)");
    $("#itemCount").removeClass("hidden");
    // filter, sort and display the results
    $("#results").html(displayItems(sort(equipments)));
}

function showSearch() {
    beforeShow();

    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.search").addClass("active");
    $("#sortType").text("");
    // filter, sort and display the results
    $("#results").html(displayItems(sort(search())));
}

function showHistory() {
    beforeShow();

    $(".nav-tabs li.history").addClass("active");
    $("#sortType").text("Sorted by release date");
    
    var html = "";
    for (var dateIndex in lastItemReleases) {
        html += '<div class="col-xs-12 date">' + lastItemReleases[dateIndex].date+'</div>';
        for (var sourceIndex in lastItemReleases[dateIndex].sources) {
            if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
                html += '<div class="col-xs-12 source">';
                for (var unitIndex in lastItemReleases[dateIndex].sources[sourceIndex].units) {
                    if (lastItemReleases[dateIndex].sources[sourceIndex].units.length > 1 && unitIndex == lastItemReleases[dateIndex].sources[sourceIndex].units.length -1) {
                        html += " and ";
                    } else if (unitIndex > 0) {
                        html += ", ";
                    }
                    html += allUnits[lastItemReleases[dateIndex].sources[sourceIndex].units[unitIndex]].name;
                }
                html += "</div>";
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "event" || lastItemReleases[dateIndex].sources[sourceIndex].type == "storyPart") {
                html += '<div class="col-xs-12 source">' + lastItemReleases[dateIndex].sources[sourceIndex].name + "</div>";
            }
            html += displayItems(lastItemReleases[dateIndex].sources[sourceIndex].items);
        }
    }
    $("#results").html(html);
}

function showSettings() {
    beforeShow();
    $(".nav-tabs li.settings").addClass("active");
    $("#sortType").text("");
    var html = "";
    html += 
        '<div class="col-xs-12 addAll">' +
        '<div class="col-xs-12 source">Inventory Tools</div>' +
        '<div class="col-x2-12 inventoryTools">' +
        '<button class="ui-button ui-corner-all ui-widget addAllButton" onclick="showAddAllToInventoryDialog()">Add All Equipment and Materia</button>';
    if (itemsAddedWithAddAll.length > 0) {
        html += '<button class="ui-button ui-corner-all ui-widget" onclick="undoAddAllToInventory()">Undo Add All</button>';
    }
    html += '<button class="ui-button ui-corner-all ui-widget removeAllButton" onclick="showRemoveAllToInventoryDialog()">Remove All Equipment and Materia</button>';
    html += '</div></div>';
    $("#results").html(html);


}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayItems = function(items) {
    var html = '';
    for (var index = 0, len = items.length; index < len; index++) {
        var item = items[index];
        html += '<div class="col-xs-6 item ' + escapeName(item.id);
        if (!itemInventory[item.id]) {
            html += ' notOwned ';
        }
        if (item.tmrUnit && ownedUnits[item.tmrUnit] && ownedUnits[item.tmrUnit].farmable > 0) {
            html += ' farmable';
        }
        html+= '" onclick="addToInventory(\'' + escapeQuote(item.id) + '\')">';
        if (itemInventory) {
            html+= '<div class="td inventory">';
            html += '<span class="glyphicon glyphicon-plus" onclick="event.stopPropagation();addToInventory(\'' + escapeQuote(item.id) + '\')" />';
            html += '<span class="number badge badge-success">';
            if (itemInventory[item.id]) {
                html += itemInventory[item.id];
            }
            html += '</span>';
            html += '<span class="glyphicon glyphicon-minus" onclick="event.stopPropagation();removeFromInventory(\'' + escapeQuote(item.id) + '\');" />';
            html += '<img class="farmedButton" onclick="event.stopPropagation();farmedTMR(' + item.tmrUnit + ')" src="/img/units/unit_ills_904000105.png" title="TMR Farmed ! Click here to indicate you farmed this TMR. It will decrease the number you can farm and increase the number you own this TMR by 1"></img>'
            html += '</div>';
        }
        html += getImageHtml(item) + getNameColumnHtml(item);
        
        html += "</div>";
    }
    return html;

};

function findInventoryItemById(id) {
    var inventoryItem = equipments.find(equip => equip.id === String(id));
    if (!inventoryItem) {
        inventoryItem = materia.find(m => m.id === String(id));
    }
    return inventoryItem;
}

function addToInventory(id, showAlert = true) {
    var inventoryDiv = $(".item." + escapeName(id));
    if(itemInventory[id]) {
        var item = findInventoryItemById(id);
        if (item.maxNumber && itemInventory[id] >= item.maxNumber) {
            if (showAlert) {
                alert('You can only have up to ' + item.maxNumber + ' of these');
            }
            return false;
        } else {
            itemInventory[id] = itemInventory[id] + 1;
            inventoryDiv.find(".number").text(itemInventory[id]);
        }
    } else {
        itemInventory[id] = 1;
        inventoryDiv.removeClass('notOwned');
        inventoryDiv.find(".number").text(itemInventory[id]);
        $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items, "+ Object.keys(ownedUnits).length + " units)");
    }
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, true, mustSaveUnits);
    $(".saveInventory").removeClass("hidden");
    updateCounts();
    return true;
}

function showAddAllToInventoryDialog() {
    $('<div id = "dialog-addAll-confirm" title = "Add all equipment and materia to inventory?" >' +
        '<p>This will add up to 2 of each equipment and 4 of each materia to your inventory. Are you sure you want to continue?</p> ' +
    '</div>').dialog({
        resizable: false,
        height: "auto",
        width: 600,
        modal: true,
        position: { my: 'top', at: 'top+150', of: $("body") },
        buttons: {
            "Add all items": function () {
                addAllToInventory(materia, 4);
                addAllToInventory(equipments, 2);
                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

function showRemoveAllToInventoryDialog() {
    $('<div id = "dialog-removeAll-confirm" title = "Remove all equipment and materia from inventory?" >' +
        '<p>This will empty your equipment and materia inventory (on this site). This is not reversible. Are you sure you want to continue?</p> ' +
    '</div>').dialog({
        resizable: false,
        height: "auto",
        width: 600,
        modal: true,
        position: { my: 'top', at: 'top+150', of: $("body") },
        buttons: {
            "Empty inventory": function () {
                itemInventory = {};
                saveUserData(true, false);
                $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items, "+ Object.keys(ownedUnits).length + " units)");
                $(this).dialog("close");
            },
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });
}

var itemsAddedWithAddAll = [];

function addAllToInventory(items, amount) {
    var itemInventoryKeys = Object.keys(itemInventory);
    for (var index in items) {
        var item = items[index];
        var key = escapeName(item.id);
        for (var i = 0; i < amount; i++) {
            if (addToInventory(key, false)) {
                itemsAddedWithAddAll.push(key);
            }
        }
    }
    showSettings();
    updateCounts();
}

function undoAddAllToInventory() {
    for (var index in itemsAddedWithAddAll) {
        removeFromInventory(itemsAddedWithAddAll[index]);
    }
    itemsAddedWithAddAll = [];
    showSettings();
    updateCounts();
}


function removeFromInventory(id) {
    if(itemInventory[id]) {
        var inventoryDiv = $(".item." + escapeName(id));
        if (itemInventory[id] == 1 ) {
            delete itemInventory[id];
            inventoryDiv.addClass('notOwned');
            inventoryDiv.find(".number").text("");
            $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items, "+ Object.keys(ownedUnits).length + " units)");
        } else {
            itemInventory[id] = itemInventory[id] - 1;
            inventoryDiv.find(".number").text(itemInventory[id]);
        }
        saveNeeded = true;
        mustSaveUnits = true;
        if (saveTimeout) {clearTimeout(saveTimeout)}
        saveTimeout = setTimeout(saveUserData,3000, true, mustSaveUnits);
        $(".saveInventory").removeClass("hidden");
        updateCounts();
    }
}

function farmedTMR(unitId) {
    var item;
    for (var index = data.length; index--;) {
        if (data[index].tmrUnit && data[index].tmrUnit == unitId) {
            item = data[index];
            addToInventory(item.id);
            break;
        }
    }
    if (!item) {
        return;
    }
    ownedUnits[unitId].farmable -= 1;
    if (ownedUnits[unitId].farmable == 0) {
        $(".item." + escapeName(item.id)).removeClass("farmable");
    }
    if (saveTimeout) {clearTimeout(saveTimeout)}
    mustSaveUnits = true;
    saveTimeout = setTimeout(saveUserData,3000, true, mustSaveUnits);
}

function search() {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        for (var index in equipments) {
            var item = equipments[index];
            if (containsText(textToSearch, item)) {
                result.push(item);
            }
        }
        for (var index in materia) {
            var item = materia[index];
            if (containsText(textToSearch, item)) {
                result.push(item);
            }
        }
    }
    return result;
}

function keepOnlyOneOfEachEquipement() {
    var idsAlreadyKept = [];
    var tempResult = {};
    for (var index in data) {
        var item = data[index];
        if (item.type != "materia" && !item.access.includes("not released yet")) {
            if (tempResult[item.id]) {
                var alreadyPutItem = tempResult[item.id];
                if (item.equipedConditions) {
                    if (alreadyPutItem.equipedConditions) {
                        if (item.equipedConditions.length > alreadyPutItem.equipedConditions.length) {
                            tempResult[item.id] = item;
                        }
                    } else {
                        tempResult[item.id] = item;
                    }
                }
                if (item.exclusiveUnits) {
                    tempResult[item.id] = item;
                }
            } else {
                tempResult[item.id] = item;
            }
        }
    }
    
    var result = [];
    for (var index in tempResult) {
        result.push(tempResult[index]);
    }
    return result;
}

function keepOnlyOneOfEachMateria() {
    var idsAlreadyKept = [];
    var result = [];
    for (var index in data) {
        var item = data[index];
        if (item.type == "materia" && !item.access.includes("not released yet") && !idsAlreadyKept.includes(item.id)) {
            result.push(item);
            idsAlreadyKept.push(item.id);
        }
    }
    return result;
}

var sortOrderDefault = ["atk","mag","def","spr", "sortId"];
var sortOrderByType = {
    "lightShield": ["def","spr","atk","mag","hp","mp", "sortId"],
    "heavyShield": ["def","spr","atk","mag","hp","mp", "sortId"],
    "hat": ["def","spr","atk","mag","hp","mp", "sortId"],
    "helm": ["def","spr","atk","mag","hp","mp", "sortId"],
    "lightArmor": ["def","spr","atk","mag","hp","mp", "sortId"],
    "heavyArmor": ["def","spr","atk","mag","hp","mp", "sortId"],
    "robe": ["def","spr","atk","mag","hp","mp", "sortId"],
    "clothes": ["def","spr","atk","mag","hp","mp", "sortId"],
    "accessory": ["def","spr","atk","mag","hp","mp", "sortId"],
    "materia": []
}
function sort(items) {
    return items.sort(function (item1, item2){
        var type1 = getStat(item1, "type");
        var type2 = getStat(item2, "type");
        if (type1 == type2) {
            var sortOrder = sortOrderDefault;
            if (sortOrderByType[item1.type]) {
                sortOrder = sortOrderByType[item1.type];
            }
            for (var index in sortOrder) {
                var stat = sortOrder[index];
                var stat1 = getStat(item1, stat);
                var stat2 = getStat(item2, stat);
                if (stat1 == stat2) {
                    continue;
                }
                return stat2 - stat1;
            }
            var name1 = item1.jpname || item1.name;
            var name2 = item2.jpname || item2.name;
            return name1.localeCompare(name2);
        } else {
            return type2 - type1;
        }
    });
};

function getStat(item, stat) {
    if (stat == "type") {
        return typeList.length - typeList.indexOf(item.type);
    } else if (stat == "id") {
        return parseInt(item.id);
    } else if (item[stat]) {
        return item[stat];
    } else {
        return 0;
    }
}

function updateCounts() {
    var itemCount = 0;
    var materiaCount = 0;
    for (var index = equipments.length; index--;) {
        if (itemInventory[equipments[index].id]) {
            itemCount++;
        }
    }
    for (var index = materia.length; index--;) {
        if (itemInventory[materia[index].id]) {
            materiaCount++;
        }
    }
    $("#itemCount").text(" - " + itemCount + " slots");
    $("#materiaCount").text(" - " + materiaCount + " slots");
}

function inventoryLoaded() {
    if (data) {
        showEquipments();
        updateCounts();
    }
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#inventory").addClass("hidden");
}

function prepareSearch(data) {
    for (var index in data) {
        var item = data[index];
        item.searchString = item.name;
        if (item.tmrUnit && allUnits[item.tmrUnit]) {
            item.searchString += "|" + allUnits[item.tmrUnit].name;
        }
        if (item.stmrUnit && allUnits[item.stmrUnit]) {
            item.searchString += "|" + allUnits[item.stmrUnit].name;
        }
    }
}

function prepareLastItemReleases() {
    var unitsToSearch = [];
    var eventsToSearch = [];
    var idsToSearch = [];
    for (var dateIndex in lastItemReleases) {
        for (var sourceIndex in lastItemReleases[dateIndex].sources) {
            if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
                unitsToSearch = unitsToSearch.concat(lastItemReleases[dateIndex].sources[sourceIndex].units)
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "event") {
                eventsToSearch.push(lastItemReleases[dateIndex].sources[sourceIndex].name);
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "storyPart") {
                idsToSearch = idsToSearch.concat(lastItemReleases[dateIndex].sources[sourceIndex].ids);
            }
        }
    }
    var tmrs = {};
    var events = {};
    var itemsById = {};
    var items = equipments.concat(materia);
    for (var index in items) {
        if (items[index].tmrUnit && unitsToSearch.includes(items[index].tmrUnit)) {
            tmrs[items[index].tmrUnit] = items[index];
        }
        if (items[index].eventName && eventsToSearch.includes(items[index].eventName)) {
            if (!events[items[index].eventName]) {events[items[index].eventName] = []}
            events[items[index].eventName].push(items[index]);
        }
        if (items[index].id && idsToSearch.includes(items[index].id)) {
            itemsById[items[index].id] = items[index];
        }
    }
    for (var dateIndex in lastItemReleases) {
        for (var sourceIndex in lastItemReleases[dateIndex].sources) {
            if (lastItemReleases[dateIndex].sources[sourceIndex].type == "banner") {
                lastItemReleases[dateIndex].sources[sourceIndex].items = [];
                for (var unitIndex in lastItemReleases[dateIndex].sources[sourceIndex].units) {
                    lastItemReleases[dateIndex].sources[sourceIndex].items.push(tmrs[lastItemReleases[dateIndex].sources[sourceIndex].units[unitIndex]]);
                }
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "event") {
                lastItemReleases[dateIndex].sources[sourceIndex].items = events[lastItemReleases[dateIndex].sources[sourceIndex].name];
            } else if (lastItemReleases[dateIndex].sources[sourceIndex].type == "storyPart") {
                lastItemReleases[dateIndex].sources[sourceIndex].items = [];
                for (var idIndex in lastItemReleases[dateIndex].sources[sourceIndex].ids) {
                    lastItemReleases[dateIndex].sources[sourceIndex].items.push(itemsById[lastItemReleases[dateIndex].sources[sourceIndex].ids[idIndex]])
                }
            }
        }
    }
}

function exportAsCsv() {
    var csv = "Item Id;Item Name;Item type;Number Owned;TMR of;Access\n";
    var sortedItems = sort(equipments).concat(sort(materia));
    for (var index = 0, len = sortedItems.length; index < len; index++) {
        var item = sortedItems[index];
        if (itemInventory[item.id]) {
            csv +=  "\"" + item.id + "\";" + "\"" + item.name + "\";" + "\"" + item.type + "\";" + itemInventory[item.id] + ';\"' + (item.tmrUnit ? allUnits[item.tmrUnit].name : "") + "\";\"" + item.access.join(", ") + "\"\n";
        }
    }
    window.saveAs(new Blob([csv], {type: "text/csv;charset=utf-8"}), 'FFBE_Equip - Equipment.csv');
}

// will be called by jQuery at page load)
$(function() {

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(server + "/data.json", function(result) {
        data = result;
        $.get(server + "/units.json", function(unitResult) {
            allUnits = unitResult;
            prepareSearch(data);
            equipments = keepOnlyOneOfEachEquipement();
            materia = keepOnlyOneOfEachMateria();
            if (itemInventory) {
                showEquipments();
                updateCounts();
            }
            $.get(server + "/lastItemReleases.json", function(result) {
                lastItemReleases = result;
                prepareLastItemReleases();
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                alert( errorThrown );
            });
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
    
    $("#searchBox").on("input", $.debounce(300,showSearch));
    
});