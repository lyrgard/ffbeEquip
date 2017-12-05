var saveNeeded = false;

var saveTimeout;

var itemKey = getItemInventoryKey();
var units;
var releasedUnits;

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#units").removeClass("hidden");
    $("#searchBox").addClass("hidden");
    
    $(".nav-tabs li.alphabeticalSort").removeClass("active");
}

function showAlphabeticalSort() {
    beforeShow();
    
    $(".nav-tabs li.alphabeticalSort").addClass("active");
    $("#sortType").text("Sorted by Name");
    // filter, sort and display the results
    $("#results").html(displayUnits(sort(units)));
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units) {
    var html = '<div class="unitList">';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        html += '<div class="unit ';
        if (index % 2) {
            html += 'owned';
        } else {
            html += 'notOwned';
        }
        html +='"><div class="unitImageWrapper"><div><img class="unitImage" src="/img/units/unit_ills_' + unit.id + '.png"/></div></div><div class="unitName">' + unit.name + '</div>';
        html += '<div class="unitRarity">'
        for (var rarityIndex = 0; rarityIndex < unit.min_rarity; rarityIndex++ ) {
            html += '<img src="/img/star_icon_filled.png"/>';
        }
        for (var rarityIndex = 0; rarityIndex < (unit.max_rarity - unit.min_rarity); rarityIndex++ ) {
            html += '<img src="/img/star_icon.png"/>';
        }
        html += '</div></div>'
    }
    html += '</div>';
    return html;

};

/*function addToInventory(id) {
    var inventoryDiv = $(".item." + escapeName(id));
    if(itemInventory[id]) {
        itemInventory[id] = itemInventory[id] + 1;
        inventoryDiv.find(".number").text(itemInventory[id]);
    } else {
        itemInventory[id] = 1;
        inventoryDiv.removeClass('notOwned');
        inventoryDiv.find(".number").text(itemInventory[id]);
        $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items)");
    }
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveInventory,3000);
    $(".saveInventory").removeClass("hidden");
}

function removeFromInventory(id) {
    if(itemInventory[id]) {
        var inventoryDiv = $(".item." + escapeName(id));
        if (itemInventory[id] == 1 ) {
            delete itemInventory[id];
            inventoryDiv.addClass('notOwned');
            inventoryDiv.find(".number").text("");
            $("#inventoryDiv .status").text("loaded (" + Object.keys(itemInventory).length + " items)");
        } else {
            itemInventory[id] = itemInventory[id] - 1;
            inventoryDiv.find(".number").text(itemInventory[id]);
        }
        saveNeeded = true;
        if (saveTimeout) {clearTimeout(saveTimeout)}
        saveTimeout = setTimeout(saveInventory,3000);
        $(".saveInventory").removeClass("hidden");
    }
}

function saveInventory() {
    if (saveTimeout) {clearTimeout(saveTimeout)}
    $(".saveInventory").addClass("hidden");
    $("#inventoryDiv .loader").removeClass("hidden");
    $("#inventoryDiv .message").addClass("hidden");
    saveNeeded = false;
    $.ajax({
        url: server + '/itemInventory',
        method: 'PUT',
        data: JSON.stringify(itemInventory),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function() {
            $("#inventoryDiv .loader").addClass("hidden");
            $("#inventoryDiv .message").text("save OK");
            $("#inventoryDiv .message").removeClass("hidden");
            setTimeout( function(){ 
                $("#inventoryDiv .message").addClass("hidden");
            }  , 3000 );
        },
        error: function(error) {
            $("#inventoryDiv .loader").addClass("hidden");
            if (error.status == 401) {
                alert('You have been disconnected. The data was not saved. The page will be reloaded.');
                window.location.reload();
            } else {
                saveNeeded = true;
                $(".saveInventory").removeClass("hidden");
                alert('error while saving the inventory. Please click on "Save" to try again');
            }
            
        }
    });
}*/

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

function keepOnlyOneOfEachMateria() {
    var idsAlreadyKept = [];
    var result = [];
    for (var index in data) {
        var item = data[index];
        if (item.type == "materia" && !item.access.includes("not released yet") && !idsAlreadyKept.includes(item[itemKey])) {
            result.push(item);
            idsAlreadyKept.push(item[itemKey]);
        }
    }
    return result;
}

function sort(units) {
    return units.sort(function (unit1, unit2){
        if (unit1.min_rarity == unit2.min_rarity) {
            return unit1.name.localeCompare(unit2.name);
        } else {
            return unit2.min_rarity - unit1.min_rarity;
        }
    });
};

function inventoryLoaded() {
}

function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#inventory").addClass("hidden");
}

// will be called by jQuery at page load)
$(function() {

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(server + "/units.json", function(unitResult) {
        $.get(server + "/releasedUnits.json", function(releasedUnitResult) {
            units = [];
            for (var name in unitResult) {
                if (releasedUnitResult[name]) {
                    units.push(unitResult[name]);
                    unitResult[name].name = name;
                }
            }
            showAlphabeticalSort();    
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });    
        
        /*$.get(server + "/lastItemReleases.json", function(result) {
            lastItemReleases = result;
            prepareLastItemReleases();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });*/
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
    
	
    $("#results").addClass(server);
    
	
    $(window).on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !"
        }
    });
    
    //$("#searchBox").on("input", $.debounce(300,showSearch));
    
});