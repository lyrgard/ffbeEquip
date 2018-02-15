var currentItem;
var newItems = [];
var dataById = {};
var modifiedItems = [];
var modifiedItemIds = [];

function updateResults() {
    displayItems(filterItems(removeModifedItems(data)));
    displayModifiedItems();
}
                 
function removeModifedItems(data) {
    var notModifiedItems = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (modifiedItemIds.includes(item.id)) {
            // Only display unknown items
            continue;
        }
        notModifiedItems.push(item);
    }
    return notModifiedItems;
}

function filterItems(data) {
    var searchText = $("#searchText").val();
    if (!searchText) {
        return filterUnknowItems(data);
    } else {
        return filter(data, false, "", 0, searchText);
    }
}

function filterUnknowItems(data) {
    var unknowItems = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (!item.access.includes("unknown")) {
            // Only display unknown items
            continue;
        }
        unknowItems.push(item);
    }
    return unknowItems;
}


function displayItems(items) {
    var html = "";
    for (var index in items) {
        var item = items[index];
        if (item) {
            html += '<div class="tr ' + item.id + '">';
            html += '<div class="td select"><span class="glyphicon glyphicon-edit clickable" onclick="modifyItem(\'' + item.id + '\')"/></div>';
            html += displayItemLine(item);
            html += '<div class="td">' + (item.maxNumber ? item.maxNumber : "N/A") + "</div>";
            html += "</div>";
        }
    }
    
    $(".itemList #results .tbody").html(html);
}

function displayModifiedItems() {
    if (modifiedItems.length == 0) {
        $("#modifiedItems").addClass("hidden");
    } else {
        $("#modifiedItems").removeClass("hidden");
        var html = "";
        for (var index = 0, len = modifiedItems.length; index < len; index++) {
            var modifiedItem = modifiedItems[index];
            var item = dataById[modifiedItem.id];
            if (item) {
                html += '<div class="tr ' + item.id + '">';
                html += getImageHtml(item);
                html += getNameColumnHtml(item);
                html += '<div class="td access"><div><span class="glyphicon glyphicon-plus" onclick="openAddAccess(\'' + item.id + '\')"></span></div><div class="accessList">';
                for (var accesIndex = 0, accessLen = modifiedItem.access.length; accesIndex < accessLen; accesIndex++) {
                    html += '<div>' + modifiedItem.access[accesIndex] + '</div>';
                }
                html += "</div></div>";
                html += '<div class="td"><input class="maxNumber" type="text" value="' + (modifiedItem.maxNumber ? modifiedItem.maxNumber : "") + '"/></div>';
                html += '<div class="td select"><span class="glyphicon glyphicon-remove clickable" onclick="cancelModification(\'' + item.id + '\')"/></div>';
                html += "</div>";
            }
        }

        $("#modifiedItems .tbody").html(html);
    }
}

function modifyItem(itemId) {
    var modifiedItem = {"id": itemId, "access":[]};
    if (dataById[itemId].maxNumber) {
        modifiedItem.maxNumber = dataById[itemId].maxNumber;
    }
    for (var index = 0, len = dataById[itemId].access.length; index < len; index++) {
        if (dataById[itemId].access[index] != "unknown") {
            modifiedItem.access.push(dataById[itemId].access[index]);
        }
    }
    modifiedItems.push(modifiedItem);
    modifiedItemIds.push(itemId);
    updateResults();
}

function cancelModification(itemId) {
    for (var index = modifiedItems.length; index--;) {
        if (modifiedItems[index].id == itemId) {
            modifiedItems.splice(index, 1);
            modifiedItemIds.splice(index, 1);
            updateResults();
            break;
        }
    }
}


function openAddAccess(itemId) {
    $("#accessList").html("");
    $("#accessList").data("id", itemId);
    addTextChoicesTo("accessList",'checkbox',{ 'Shop':'shop', 'Story':'chest/quest', 'Key':'key', 'Colosseum':'colosseum', 'TMR 1*/2*':'TMR-1*/TMR-2*', 'TMR 3*/4*':'TMR-3*/TMR-4*', 'TMR 5*':'TMR-5*', 'Event':'event', 'Recipe':'recipe', 'Trophy':'trophy', 'Chocobo':'chocobo', 'Trial':'trial', 'Unit exclusive':'unitExclusive' });
    $("#accessList").modal();
}

function addAccess(itemId, access) {
    for (var index = modifiedItems.length; index--;) {
        if (modifiedItems[index].id == itemId) {
            modifiedItems[index].access.push(access);
            updateResults();
            break;
        }
    }
}

function removeAccess(itemId, access) {
    for (var index = modifiedItems.length; index--;) {
        if (modifiedItems[index].id == itemId) {
            var i = modifiedItems[index].access.indexOf(access);
            if (i >= 0) {
                modifiedItems[index].access.splice(i, 1);
                updateResults();
            }
            break;
        }
    }
}

// will be called by jQuery at page load)
$(function() {
	// Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateResults));
    
    $.get(server + "/data.json", function(result) {
        data = keepOnlyOneInstance(result);
        for (var index = data.length; index--;) {
            dataById[data[index].id] = data[index];
        }
        $.get(server + "/units.json", function(result) {
            units = result;
            prepareSearch(data);
            updateResults();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
});
  
function inventoryLoaded() {
}

function notLoaded() {
    
}
