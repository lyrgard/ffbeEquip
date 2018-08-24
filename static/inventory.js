var equipments;
var materia;
var lastItemReleases;
var allUnits;

var currentEnhancementItem;
var currentEnhancementItemPos;

var displayId = 0;

var equipmentLastSearch = "";
var materiaLastSearch = "";

function beforeShow(clearTabSelection = true) {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#itemsWrapper").removeClass("hidden");
    $("#itemEnhancement").addClass("hidden");
    $("#results").removeClass("hidden");
    
    // Hidden by default, enabled by materia and equipment tabs
    $("#searchBox").addClass("hidden");

    if(clearTabSelection) {
        $(".nav-tabs li.equipment").removeClass("active");
        $(".nav-tabs li.materia").removeClass("active");
        $(".nav-tabs li.history").removeClass("active");
        $(".nav-tabs li.settings").removeClass("active");
    }
}

function showMateria() {
    beforeShow();
    
    $(".nav-tabs li.materia").addClass("active");
    $("#sortType").text("Sorted by Name");
    $("#searchBox").val(materiaLastSearch);
    $("#searchBox").removeClass("hidden");
    // filter, sort and display the results
    showSearch();
    displayStats();
}

function showEquipments() {
    beforeShow();
    
    $(".nav-tabs li.equipment").addClass("active");
    $("#sortType").text("Sorted by Type (Strength)");
    $("#searchBox").val(equipmentLastSearch);
    $("#searchBox").removeClass("hidden");
    // filter, sort and display the results
    showSearch();
    displayStats();
}

function showSearch() {
    beforeShow(false);
    
    var inEquipment = $(".nav-tabs li.equipment").hasClass("active");

    $("#searchBox").removeClass("hidden");
    // filter, sort and display the results
    var textToSearch = $("#searchBox").val();
    displayItems(sort(search(textToSearch)), inEquipment);
    if (textToSearch) {
        $("#sortType").text("");
    }
}

function showHistory() {
    displayId++;
    beforeShow();

    $(".nav-tabs li.history").addClass("active");
    $("#sortType").text("Sorted by release date");
    
    var resultDiv = $("#results");
    resultDiv.empty();
    displayId++;
    displayItemsByHistoryAsync(lastItemReleases, 0, resultDiv, displayId);
}

function displayItemsByHistoryAsync(lastItemReleases, dateIndex, div, id) {
    var currentItemReleases = lastItemReleases[dateIndex];
    
    // Display date
    var html = '<div class="col-xs-12 date">' + currentItemReleases.date+'</div>';
    for (var sourceIndex in currentItemReleases.sources) {
        var items = currentItemReleases.sources[sourceIndex].items;
        if (currentItemReleases.sources[sourceIndex].type == "banner") {
            // Display banner unit list
            html += '<div class="col-xs-12 source">';
            for (var unitIndex in currentItemReleases.sources[sourceIndex].units) {
                if (currentItemReleases.sources[sourceIndex].units.length > 1 && unitIndex == currentItemReleases.sources[sourceIndex].units.length -1) {
                    html += " and ";
                } else if (unitIndex > 0) {
                    html += ", ";
                }
                html += allUnits[currentItemReleases.sources[sourceIndex].units[unitIndex]].name;
            }
            html += "</div>";
        } else if (currentItemReleases.sources[sourceIndex].type == "event" || currentItemReleases.sources[sourceIndex].type == "storyPart") {
            // Display event name
            html += '<div class="col-xs-12 source">' + currentItemReleases.sources[sourceIndex].name + "</div>";
        }
        // Display items list
        for (var index = 0; index < items.length; index++) {
            if (items[index] === undefined) continue;
            html += getItemDisplay(items[index]);
        }
    }

    if (id == displayId) {
        // Add all items to the DOM
        div.append(html);
        //Increment current date index
        dateIndex++;
        // Update lazyloader only for first and last run
        if (dateIndex === 1 || dateIndex >= lastItemReleases.length) lazyLoader.update();
        // Launch next run of type
        if (dateIndex < lastItemReleases.length) {
            setTimeout(displayItemsByHistoryAsync, 0, lastItemReleases, dateIndex, div, id);
        }
    }
}

function showSettings() {
    beforeShow();
    displayId++;
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
var displayItems = function(items, byType = false) {
    var resultDiv = $("#results");
    resultDiv.empty();
    displayId++;
    if (byType) {
        // Jump list display
        htmlTypeJump = '<div class="typeJumpList" data-html2canvas-ignore>';
        htmlTypeJump += '<span>Jump to </span>';
        var currentItemType = null;
        for (var index = 0, len = items.length; index < len; index++) {
            var itemType = items[index].type;
            if (itemType !== currentItemType) {
                htmlTypeJump += '<a class="typeJump '+itemType+' disabled"><i class="img img-equipment-'+itemType+'"></i></a>';
                currentItemType = itemType;
            }
        }
        htmlTypeJump += '</div>';
        resultDiv.append(htmlTypeJump);

        displayItemsByTypeAsync(items, 0, resultDiv, displayId, resultDiv.find('.typeJumpList'));
    } else {
        displayItemsAsync(items, 0, resultDiv, displayId);
    }
};

function displayItemsByTypeAsync(items, start, div, id, jumpDiv) {
    // Set item type for this run and various useful vars
    var currentItemType = items[start].type;
    var currentItemTypeImgHtml = '<i class="img img-equipment-' + currentItemType + '"/>';

    var html = '<div class="itemSeparator" id="' + currentItemType + '">' + currentItemTypeImgHtml + '</div>';
    html += '<div class="itemList">';
    for (var index = start, len = items.length; index < len; index++) {
        var item = items[index];
        if (item === undefined) continue;

        if (item.type === currentItemType) {
            html += getItemDisplay(item);
        } else {
            break;
        }
    }
    html += '</div>';

    if (id == displayId) {
        // Add all items to the DOM
        div.append(html);
        // Enable jumper
        jumpDiv.find("a.typeJump." + currentItemType).attr('href', '#' + currentItemType).removeClass('disabled');
        // Update lazyloader only for first and last run
        if (start === 0 || index >= items.length) lazyLoader.update();
        // Launch next run of type
        if (index < items.length) {
            setTimeout(displayItemsByTypeAsync, 0, items, index, div, id, jumpDiv);
        }
    }
}

function displayItemsAsync(items, start, div, id, max = 20) {
    var html = '';
    var end = Math.min(start + max, items.length);
    for (var index = start; index < end; index++) {
        if (items[index] === undefined) continue;
        html += getItemDisplay(items[index]);
    }

    if (id == displayId) {
        // Add items to the DOM
        div.append(html);
        // Update lazyloader only for first and last run
        if (start === 0 || index >= items.length) lazyLoader.update();
        // Launch next run of type
        if (index < items.length) {
            setTimeout(displayItemsAsync, 0, items, index, div, id);
        }    
    }
}

function getItemDisplay(item)
{
    var html = "";

    html += '<div class="col-xs-12 col-sm-6 col-lg-4 item ' + escapeName(item.id);
    if (!itemInventory[item.id]) {
        html += ' notOwned ';
    }
    if (item.tmrUnit && ownedUnits[item.tmrUnit] && ownedUnits[item.tmrUnit].farmable > 0) {
        html += ' farmable';
    }
    if (itemInventory.enchantments[item.id]) {
        html += ' enhanced';
    }
    if (itemInventory.excludeFromExpeditions && itemInventory.excludeFromExpeditions.includes(item.id)) {
        html += ' excludedFromExpeditions';
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
        html += '<span class="glyphicon glyphicon-minus" onclick="event.stopPropagation();removeFromInventory(\'' + item.id + '\');" />';
        html += '<img class="farmedButton" onclick="event.stopPropagation();farmedTMR(' + item.tmrUnit + ')" src="/img/units/unit_ills_904000105.png" title="TMR Farmed ! Click here to indicate you farmed this TMR. It will decrease the number you can farm and increase the number you own this TMR by 1"></img>';
        if (weaponList.includes(item.type)) {
            html += '<img class="itemWorldButton" onclick="event.stopPropagation();showItemEnhancements(' + item.id + ')" src="/img/icons/dwarf.png" title="Open item management popup"></img>';
        }
        html += '<img class="excludeFromExpeditionButton" onclick="event.stopPropagation();excludeFromExpedition(' + item.id + ')" src="/img/icons/excludeExpedition.png" title="Exclude this item from builds made for expeditions"></img>';
        html += '</div>';
    }
    html += getImageHtml(item) + getNameColumnHtml(item);
    
    html += "</div>";

    return html;
}

function excludeFromExpedition(id) {
    var idString = String(id);
    var itemDiv = $(".item." + escapeName(id));
    if (itemInventory.excludeFromExpeditions && itemInventory.excludeFromExpeditions.includes(idString)) {
        itemInventory.excludeFromExpeditions.splice(itemInventory.excludeFromExpeditions.indexOf(idString), 1);
        itemDiv.removeClass("excludedFromExpeditions");
    } else {
        if (!itemInventory.excludeFromExpeditions) {
            itemInventory.excludeFromExpeditions = [];
        }
        itemInventory.excludeFromExpeditions.push(idString);
        itemDiv.addClass("excludedFromExpeditions");
    }
    willSave();
    $(".saveInventory").removeClass("hidden");
}

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
        updateUnitAndItemCount();
    }
    willSave();
    displayStats();
    return true;
}

function willSave() {
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUserData,3000, true, mustSaveUnits);
    $(".saveInventory").removeClass("hidden");
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
                itemInventory = {
                    enchantments: {}
                };
                updateUnitAndItemCount();
                displayStats();
                saveUserData(true, false);
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
    displayStats();
}

function undoAddAllToInventory() {
    for (var index in itemsAddedWithAddAll) {
        removeFromInventory(itemsAddedWithAddAll[index]);
    }
    itemsAddedWithAddAll = [];
    showSettings();
    displayStats();
}


function removeFromInventory(id) {
    if(itemInventory[id]) {
        var inventoryDiv = $(".item." + escapeName(id));
        if (itemInventory[id] == 1 ) {
            delete itemInventory[id];
            inventoryDiv.addClass('notOwned');
            inventoryDiv.find(".number").text("");
            updateUnitAndItemCount();
        } else {
            itemInventory[id] = itemInventory[id] - 1;
            inventoryDiv.find(".number").text(itemInventory[id]);
        }
        mustSaveUnits = true;
        willSave();
        displayStats();
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
    mustSaveUnits = true;
    willSave();
}

function search(textToSearch) {
    var result = [];
    var inEquipment = $(".nav-tabs li.equipment").hasClass("active");
    
    var itemsToSearch = [];
    if(inEquipment) {
        itemsToSearch = equipments;
        equipmentLastSearch = textToSearch;
    } else {
        itemsToSearch = materia;
        materiaLastSearch = textToSearch;
    }

    if (textToSearch) {
        for (var index in itemsToSearch) {
            var item = itemsToSearch[index];
            if (containsText(textToSearch, item)) {
                result.push(item);
            }
        }
    } else {
        result = itemsToSearch;
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

            var result = compareName(name1, name2);
            
            return result;
        } else {
            return type2 - type1;
        }
    });
};

function compareName(name1, name2) {
    var minLength = Math.min(name1.length, name2.length);
    for (var i = 0; i < minLength; i++) {
        var letter1 = name1.substr(i,1);
        var letter2 = name2.substr(i,1);
        if (letter1 == letter1.toUpperCase()) {
            if (letter2 == letter2.toUpperCase()) {
                var result = letter1.localeCompare(letter2);
                if (result != 0) {
                    return result;
                }
            } else {
                return -1;
            }
        } else {
            if (letter2 == letter2.toUpperCase()) {
                return 1;
            } else {
                var result = letter1.localeCompare(letter2);
                if (result != 0) {
                    return result;
                }
            }   
        }
    }
    if (name1.length == name2.length) {
        return 0;
    } else if (name1.length == minLength) {
        return -1;
    } else {
        return 1;
    }
}

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

function showItemEnhancements(itemId) {
    if (itemInventory[itemId]) {
        var item = null;
        for (var i = 0, len = equipments.length; i < len; i++) {
            if (equipments[i].id == itemId) {
                item = equipments[i];
                break;
            }
        }
        if (!item) { return; }
        currentEnhancementItem = item;
        var totalCount = itemInventory[itemId];
        var notEnchantedCount = totalCount;
        if (itemInventory.enchantments[itemId]) {
            notEnchantedCount = totalCount - itemInventory.enchantments[itemId].length;
        }
        var html = '<div class="btn" onclick="showEquipments()"><span class="glyphicon glyphicon-chevron-left"></span>Back to list</div>';
        if (notEnchantedCount > 0) {
            html += '<div><div class="col-xs-6 item">';
            html += '<div class="td inventory"><span class="number badge badge-success">' + notEnchantedCount + '</span><img class="itemWorldButton" onclick="event.stopPropagation();modifyItemEnhancements(' + item.id + ')" src="/img/icons/dwarf.png" title="Open item management popup"></div>';
            html += getImageHtml(item) + getNameColumnHtml(item);
            html += "</div></div>";
        }
        if (itemInventory.enchantments[itemId]) {
            for (var i = 0, len = itemInventory.enchantments[itemId].length; i < len; i++) {
                var enhancedItem = applyEnhancements(item, itemInventory.enchantments[itemId][i]);
                html += '<div><div class="col-xs-6 item enhanced">';
                html += '<div class="td inventory"><span class="number badge badge-success">1</span><img class="itemWorldButton" onclick="event.stopPropagation();modifyItemEnhancements(' + item.id + ', ' + i + ')" src="/img/icons/dwarf.png" title="Open item management popup"></div>';
                html += getImageHtml(enhancedItem) + getNameColumnHtml(enhancedItem);
                html += "</div></div>";
            }
        }
        $("#results").addClass("hidden");
        $("#itemEnhancement").html(html);
        $("#itemEnhancement").removeClass("hidden");
        var popupAlreadyDisplayed = ($("#modifyEnhancementModal").data('bs.modal') || {}).isShown
        if (!popupAlreadyDisplayed && notEnchantedCount == totalCount) {
            modifyItemEnhancements(item.id);
        }
        lazyLoader.update();
    }
}

function modifyItemEnhancements(itemId, enhancementPos) {
    
    currentEnhancementItemPos = enhancementPos;
    var popupAlreadyDisplayed = ($("#modifyEnhancementModal").data('bs.modal') || {}).isShown
    if (!popupAlreadyDisplayed) {
        $("#modifyEnhancementModal").modal();
    }
    
    $("#modifyEnhancementModal .value").removeClass("selected");
    var item = currentEnhancementItem;
    if (typeof currentEnhancementItemPos != 'undefined') {
        var enhancements = itemInventory.enchantments[currentEnhancementItem.id][currentEnhancementItemPos];
        for (var i = enhancements.length; i--;) {
            $("#modifyEnhancementModal .value." + enhancements[i]).addClass("selected");
        }
        item = applyEnhancements(currentEnhancementItem, enhancements);
    }
    $("#modifyEnhancementModal .modal-header .title").html(getImageHtml(item) + getNameColumnHtml(item));
    $("#modifyEnhancementModal .value.rare").html(itemEnhancementLabels["rare"][item.type]);
}

function toggleItemEnhancement(enhancement) {
    if (!itemInventory.enchantments[currentEnhancementItem.id]) {
        itemInventory.enchantments[currentEnhancementItem.id] = [];
    }
    if (typeof currentEnhancementItemPos == 'undefined') {
        itemInventory.enchantments[currentEnhancementItem.id].push([]);
        currentEnhancementItemPos = itemInventory.enchantments[currentEnhancementItem.id].length - 1;
    }
    var enhancements = itemInventory.enchantments[currentEnhancementItem.id][currentEnhancementItemPos];
    if (enhancements.includes(enhancement)) {
        enhancements.splice(enhancements.indexOf(enhancement), 1);
        if (enhancements.length == 0) {
            itemInventory.enchantments[currentEnhancementItem.id].splice(currentEnhancementItemPos, 1);
            currentEnhancementItemPos = undefined;
            if (itemInventory.enchantments[currentEnhancementItem.id].length == 0) {
                delete itemInventory.enchantments[currentEnhancementItem.id];
            }
        }
    } else {
        if (enhancements.length == 3) {
            $.notify("No more than 3 item enhancements can be selected", "warning");
            return;   
        }
        enhancements.push(enhancement);
    }
    modifyItemEnhancements(currentEnhancementItem.id, currentEnhancementItemPos);
    showItemEnhancements(currentEnhancementItem.id);
    if (itemInventory.enchantments[currentEnhancementItem.id]) {
        $("#results .items." + currentEnhancementItem.id).addClass("enhanced");
    } else {
        $("#results .items." + currentEnhancementItem.id).removeClass("enhanced");
    }
    willSave();
}


function inventoryLoaded() {
    if (data) {
        showEquipments();
    }
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#itemsWrapper").addClass("hidden");
}

function prepareSearch(data) {
    for (var index in data) {
        var item = data[index];
        item.searchString = item.name;
        if (item.jpname) {
            item.searchString += "|" + item.jpname;
        }
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

function displayStats() {
    var stats = {};

    for (var index = 0, len = equipments.length; index < len; index++) {
        var item = equipments[index];

        // Ini stats for item type if not existing
        if (stats[item.type] === undefined) {
                stats[item.type] = {
                'different': 0,
                'total': 0,
                'number': 0
            };
        }
        stats[item.type].total++;

        if (itemInventory[item.id]) {
            stats[item.type].different++;
            stats[item.type].number += itemInventory[item.id];
        }
    }

    // Add materia
    stats['materia'] = {
        'different': 0,
        'total': 0,
        'number': 0
    };
    for (index = 0, len = materia.length; index < len; index++) {
        var item = materia[index];

        stats['materia'].total++;

        if (itemInventory[item.id]) {
            stats['materia'].different++;
            stats['materia'].number += itemInventory[item.id];
        }
    }

    var $stats = $(".stats");
    for (var statType in stats) {
        var $item = $stats.find('.stats_' + statType);
        $item.find(".value").text(stats[statType].different);
        $item.find(".total").text(stats[statType].total);
        $item.find(".number").text('(' + stats[statType].number + ')');
    }
    
    $(".itemsSidebar .hidden").removeClass("hidden");
}

// will be called by common.js at page load
function startPage() {

    var $window = $(window);

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    getStaticData("data", true, function(result) {
        data = result;
        getStaticData("units", true, function(unitResult) {
            allUnits = unitResult;
            prepareSearch(data);
            equipments = keepOnlyOneOfEachEquipement();
            materia = keepOnlyOneOfEachMateria();
            if (itemInventory) {
                showEquipments();
            }
            getStaticData("lastItemReleases", false, function(result) {
                lastItemReleases = result;
                prepareLastItemReleases();
            });
        });
    });
	
    $("#results").addClass(server);
    
	
    $window.on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !";
        }
    });
    
    $window.on('keyup', function (e) {
        // Reset search if escape is used
        if (e.keyCode === 27) {
            $("#searchBox").val('').trigger('input').focus();
        }
    });

    $('.itemsSidebarButton').click(function() {
        $('.itemsSidebar').toggleClass('collapsed');
    });
    
    $("#searchBox").on("input", $.debounce(300,showSearch));

    // Start stats collapse for small screen
    if ($window.outerWidth() < 990) {
        $(".itemsSidebar").addClass("collapsed");
    }
}
