var currentItem;
var newItems = [];


function updateResults() {
    displayItems(filterUnknowItems(data));
}

function filterUnknowItems(data) {
    var dataWithOnlyOneOccurence = [];
    for (var index = 0, len = data.length; index < len; index++) {
        var item = data[index];
        if (!item.access.includes("unknown")) {
            // Only display unknown items
            continue;
        }
        if (dataWithOnlyOneOccurence.length > 0 && dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1].id == item.id) {
            var previousItem = dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1];
            if (previousItem.equipedConditions) {
                if (item.equipedConditions) {
                    if (previousItem.equipedConditions.length <= item.equipedConditions.length) {
                        dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
                    }
                }
            } else {
                dataWithOnlyOneOccurence[dataWithOnlyOneOccurence.length - 1] = item;
            }
        } else {
            dataWithOnlyOneOccurence.push(item);
        }
    }
    return dataWithOnlyOneOccurence;
}


function displayItems(items) {
    var html = "";
    for (var index in items) {
        var item = items[index];
        if (item) {
            html += '<div class="tr">';
            html += displayItemLine(item);
            html += '<div class="td">' + (item.maxNumber ? item.maxNumber : "N/A") + "</div>";
            html += "</div>";
        }
    }
    
    $(".itemList #results .tbody").html(html);
}

// will be called by jQuery at page load)
$(function() {
	// Triggers on search text box change
    /*$("#searchText").on("input", $.debounce(300,update));*/
    
    $.get(server + "/data.json", function(result) {
        data = result;
        $.get(server + "/units.json", function(result) {
            units = result;
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


