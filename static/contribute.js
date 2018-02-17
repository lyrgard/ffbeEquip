var currentItem;
var newItems = [];
var dataById = {};
var modifiedItems = {};
var corrections;

function updateResults() {
    displayItems(filterItems(removeModifedItems(data)));
    displayModifiedItems();
}
                 
function removeModifedItems(data) {
    var notModifiedItems = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (modifiedItems[item.id]) {
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
            html += '<div class="tr ' + item.id + (item.corrected ? " userInputed" : "") + '">';
            html += '<div class="td select"><span class="glyphicon glyphicon-edit clickable" onclick="modifyItem(\'' + item.id + '\')"/></div>';
            html += displayItemLine(item);
            html += '<div class="td">' + (item.maxNumber ? item.maxNumber : "N/A") + "</div>";
            html += "</div>";
        }
    }
    
    $(".itemList #results .tbody").html(html);
}

function displayModifiedItems() {
    for (var id in modifiedItems) {
        var maxNumber = $("#modifiedItems .tr." + id + " input.maxNumber").val();
        if (maxNumber && !isNaN(parseInt(maxNumber))) {
            modifiedItems[id].maxNumber = parseInt(maxNumber);
        } else {
            delete modifiedItems[id].maxNumber;
        }
    }
    if (Object.keys(modifiedItems).length == 0) {
        $("#modifiedItems").addClass("hidden");
    } else {
        $("#modifiedItems").removeClass("hidden");
        var html = "";
        for (var itemId in modifiedItems) {
            var modifiedItem = modifiedItems[itemId];
            var item = dataById[itemId];
            if (item) {
                html += '<div class="tr ' + item.id + '">';
                html += getImageHtml(item);
                html += getNameColumnHtml(item);
                html += '<div class="td access"><div><span class="glyphicon glyphicon-edit clickable" onclick="openAddAccess(\'' + item.id + '\')"></span><div class="accessList">';
                for (var accesIndex = 0, accessLen = modifiedItem.access.length; accesIndex < accessLen; accesIndex++) {
                    html += '<div>' + modifiedItem.access[accesIndex] + '</div>';
                }
                html += "</div></div></div>";
                html += '<div class="td"><input class="maxNumber" type="number" onkeypress="return isNumber(event)" value="' + (modifiedItem.maxNumber ? modifiedItem.maxNumber : "") + '"/></div>';
                html += '<div class="td select"><span class="glyphicon glyphicon-remove clickable" onclick="cancelModification(\'' + item.id + '\')"/></div>';
                html += "</div>";
            }
        }

        $("#modifiedItems .tbody").html(html);
    }
}

function modifyItem(itemId) {
    if (Object.keys(modifiedItems).length >=10 ) {
        alert("Only 10 items at most can be modifed at a time. Please send the current item being modified to the server before continuing.");
        return;
    }
    var modifiedItem = {"access":[]};
    if (dataById[itemId].maxNumber) {
        modifiedItem.maxNumber = dataById[itemId].maxNumber;
    }
    for (var index = 0, len = dataById[itemId].access.length; index < len; index++) {
        if (dataById[itemId].access[index] != "unknown") {
            modifiedItem.access.push(dataById[itemId].access[index]);
        }
    }
    modifiedItems[itemId] = modifiedItem;
    updateResults();
}

function cancelModification(itemId) {
    delete modifiedItems[itemId];
    updateResults();
}


function openAddAccess(itemId) {
    var item = modifiedItems[itemId];
    if (item) {
        $("#accessList").data("id", itemId);
        unselectAll("accessList");
        select("accessList", item.access);
        $("#accessList").dialog({
            modal: true,
            buttons: {
                Ok: function() {
                    $( this ).dialog( "close" );
                }
            }
        });
    }
}

function setAccess(itemId, access) {
    var i = 0;
    while (i < modifiedItems[itemId].access.length) {
        if (modifiedItems[itemId].access[i].startsWith("TMR")) {
            i++;
        } else {
            modifiedItems[itemId].access.splice(i,1);
        }
    }
    modifiedItems[itemId].access = modifiedItems[itemId].access.concat(access);
    updateResults();
}

function sendToServer() {
    for (var id in modifiedItems) {
        if (!modifiedItems[id].access || modifiedItems[id].access.length == 0) {
            alert("Access cannot be empty");
            return;
        }
        var maxNumber = $("#modifiedItems .tr." + id + " input.maxNumber").val();
        if (maxNumber) {
            if (isNaN(parseInt(maxNumber))) {
                alert(maxNumber + " is not a valid max number");
                return;
            }
            modifiedItems[id].maxNumber = parseInt(maxNumber);
        } else {
            delete modifiedItems[id].maxNumber;
        }
    }
    $.ajax({
        type: "POST",
        url: "/" + server + "/corrections",
        data: JSON.stringify(modifiedItems),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        statusCode: {
            201: function(data){
                window.location.reload();
            },
            400: function(jqXHR, textStatus, errorThrown) {alert(errorThrown);},
            500: function(jqXHR, textStatus, errorThrown) {alert(errorThrown);}
        },
        failure: function(errMsg) {
            alert("An error occured");
        }
    });
}

// will be called by jQuery at page load)
$(function() {
	$.get(server + "/data.json", function(result) {
        data = keepOnlyOneInstance(result);
        for (var index = data.length; index--;) {
            dataById[data[index].id] = data[index];
        }
        $.get(server + "/units.json", function(result) {
            units = result;
            $.get(server + "/corrections.json", function(result) {
                corrections = result;
                for (var index = data.length; index--;) {
                    if (corrections[data[index].id]) {
                        data[index].access = corrections[data[index].id].access;
                        if (corrections[data[index].id].maxNumber) {
                            data[index].maxNumber = corrections[data[index].id].maxNumber;
                        } else {
                            delete data[index].maxNumber;
                        }
                        data[index].corrected = true;
                    }
                }
                prepareSearch(data);
                updateResults();
            }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
                alert( errorThrown );
            });    
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    // Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateResults));
    
    $('#accessList').on('dialogclose', function(event) {
        var itemId = $("#accessList").data("id");
        setAccess(itemId, getSelectedValuesFor("accessList"));
    });
    addTextChoicesTo("accessList",'checkbox',{ 'Shop':'shop', 'Chest':'chest', 'Quest':'quest', 'Key':'key', 'Colosseum':'colosseum', 'Event':'event', 'Recipe':'recipe', 'Event Recipe':'recipe-event', 'Trophy':'trophy', 'Chocobo':'chocobo', 'Trial':'trial', 'STMR':'STMR', 'Not released yet':'not released yet'});
});
  
function inventoryLoaded() {
}

function notLoaded() {
    
}
