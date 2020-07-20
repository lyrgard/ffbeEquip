var currentItem;
var newItems = [];
var dataById = {};
var modifiedItems = {};
var corrections;

function updateResults() {
    displayItems(filterItems(removeModifedItems(data)));
    displayModifiedItems();
    lazyLoader.update();
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
			html += '<div class="border rounded p-2 mb-2 contributeItem">';
			html += '  <div class="form-row ' + item.id + (item.corrected ? " userInputed" : "") + '">';
			html += '    <div class="col-auto"><button class="btn btn-sm btn-ghost h-100" onclick="modifyItem(\'' + item.id + '\')"><span class="fa fa-edit fa-fw"></span></button></div>';
			html += '    <div class="col-auto">' + getImageHtml(item) + '</div>';
			html += '    <div class="col align-self-center">' + getNameColumnHtml(item) + '</div>';
			html += '    <div class="col-auto align-self-center">' + (item.maxNumber ? item.maxNumber : "") + "</div>";
			html += "  </div>";
			html += "</div>";
		}
	}

	$(".itemList #results").html(html);
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
      		html += '<div class="border rounded p-2 mb-2 contributeItem">';
      		html += '  <div class="form-row align-items-center ' + item.id + '">';
      		html += '    <div class="col-auto">' + getImageHtml(item) + '</div>';
      		html += '    <div class="col">';
      		html +=        getNameColumnHtml(item);
      		html += '      <div class="accessList">';

      		for (var accesIndex = 0, accessLen = modifiedItem.access.length; accesIndex < accessLen; accesIndex++) {
      			html += '<div>' + modifiedItem.access[accesIndex] + '</div>';
      		}

      		html += '      </div>';
      		html += '    </div>';
      		html += '    <div class="col-2 align-self-center">';
      		html += '      <div class="d-flex align-items-center mb-1">';
      		html += '        <button class="btn btn-sm btn-ghost w-100 mr-1" onclick="openAddAccess(\'' + item.id + '\')"><span class="fa fa-plus fa-fw"></span></button>';
      		html += '        <button class="btn btn-sm btn-ghost w-100" onclick="cancelModification(\'' + item.id + '\')"><span class="fa fa-minus fa-fw"></span></button>';
      		html += '      </div>';
      		html += '      <input class="form-control maxNumber" type="number" onkeypress="return isNumber(event)" min="0" step="1" value="' + (modifiedItem.maxNumber ? modifiedItem.maxNumber : "") + '"/>';
      		html += '    </div>';
      		html += "  </div>";
      		html += "</div>";

      	}
      }

    $("#modifiedItems #results-edit").html(html);
	}
}

function modifyItem(itemId) {
    if (Object.keys(modifiedItems).length >=10 ) {
        Modal.showMessage("Modification error", "Only 10 items at most can be modifed at a time. Please send the current item being modified to the server before continuing.");
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
        $("#addAccessModal").modal();
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
    $("body").addClass("loading");
    for (var id in modifiedItems) {
        if (!modifiedItems[id].access || modifiedItems[id].access.length == 0) {
            Modal.showMessage("Access error", "Access cannot be empty");
            return;
        }
        var maxNumber = $("#modifiedItems .tr." + id + " input.maxNumber").val();
        if (maxNumber) {
            if (isNaN(parseInt(maxNumber))) {
                Modal.showMessage("Number of items", maxNumber + " is not a valid max number");
                return;
            }
            modifiedItems[id].maxNumber = parseInt(maxNumber);
        } else {
            delete modifiedItems[id].maxNumber;
        }
    }

    $("#submitModal .submitFailed, #submitModal .submitSuccess").addClass('hidden');

    var modifiedItemsStr = JSON.stringify(modifiedItems);

    $.ajax({
        type: "POST",
        url: "/" + server + "/corrections",
        data: modifiedItemsStr,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            $("#submitModal .submitSuccess").removeClass('hidden');
            $("#submitModal .submitSuccess .details .modified").text(data.modified);
            $("#submitModal .submitSuccess .details .total").text(data.total);
            for (var id in modifiedItems) {
                cancelModification(id);
            }
            getCorrections();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            var error = errorThrown + "\n";
            if (jqXHR.responseJSON) error += jqXHR.responseJSON.error;
            $("#submitModal .submitFailed").removeClass('hidden');
            $("#submitModal .submitFailed").find('pre.error').html(error);
            $("#submitModal .submitFailed").find('pre.data').html(modifiedItemsStr);
        },
        complete: function() {
            // run after success/error handler
            $("body").removeClass("loading");
            $("#submitModal").modal();
        }
    });
}

function getCorrections() {
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
        $("#contributeWrapper").removeClass('hidden');
        $("#loginMessage").addClass('hidden');
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        $("#contributeWrapper").addClass('hidden');
        $("#loginMessage").removeClass('hidden');
    });
}

// will be called by common.js at page load
function startPage() {
	getStaticData("data", true, function(result) {
        data = keepOnlyOneInstance(result);
        for (var index = data.length; index--;) {
            dataById[data[index].id] = data[index];
        }
        getStaticData("units", true, function(result) {
            units = result;
            getCorrections();
        });
    });

    // Reset search if escape is used
    $(window).on('keyup', function (e) {
        if (e.keyCode === 27) {
            $("#searchText").val('').trigger('input').focus();
        }
    });

    // Triggers on search text box change
    $("#searchText").on("input", $.debounce(300,updateResults));

    $('#addAccessModal').on('hidden.bs.modal', function(event) {
        var itemId = $("#accessList").data("id");
        setAccess(itemId, getSelectedValuesFor("accessList"));
    });
    addTextChoicesTo("accessList",'checkbox',{ 'Shop':'shop', 'Recipe':'recipe', 'Chest':'chest', 'Chest Recipe':'recipe-chest', 'Quest':'quest', 'Key':'key', 'Chocobo':'chocobo', 'Event':'event', 'Event Recipe':'recipe-event', 'Trial':'trial', 'Trophy':'trophy', 'Colosseum':'colosseum', 'Premium':'premium', 'STMR':'STMR', 'TMR 5*':'TMR-5*', 'TMR 4*':'TMR-4*', 'TMR 3*':'TMR-3*', 'TMR 2*':'TMR-2*', 'TMR 1*':'TMR-1*', 'Not released yet':'not released yet'});
}

function inventoryLoaded() {
}

function notLoaded() {

}
